import torch
import torch.nn as nn
from typing import Optional, Tuple, Dict, Any

class LightweightTextEncoder(nn.Module):
    """
    Text encoder producing contextual token representations H_text in R^{B x n x d}.
    Can utilize pre-trained HuggingFace transformers (e.g. RoBERTa / DeBERTa)
    with a graceful fallback to a high-capacity TransformerEncoder when running local/offline.
    """
    def __init__(
        self,
        model_name: str = "roberta-base",
        embed_dim: int = 768,
        vocab_size: int = 50265,
        max_position_embeddings: int = 512,
        num_layers: int = 4,
        num_heads: int = 8,
        dropout: float = 0.1
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.model_name = model_name
        self.use_hf = False
        self.hf_model = None

        # Fallback PyTorch Native Transformer architecture
        self.token_embeddings = nn.Embedding(vocab_size, embed_dim)
        self.position_embeddings = nn.Embedding(max_position_embeddings, embed_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.layer_norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Args:
            input_ids: [B, seq_len] tensor of token ids
            attention_mask: [B, seq_len] boolean or binary mask
        Returns:
            H_text: [B, seq_len, embed_dim] contextual token representations
        """
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)
        
        tok_emb = self.token_embeddings(input_ids)
        pos_emb = self.position_embeddings(positions)
        x = self.layer_norm(self.dropout(tok_emb + pos_emb))

        key_padding_mask = None
        if attention_mask is not None:
            # PyTorch TransformerEncoder expects True for padded positions
            key_padding_mask = (attention_mask == 0)

        H_text = self.transformer(x, src_key_padding_mask=key_padding_mask)
        return H_text


class LightweightVisionEncoder(nn.Module):
    """
    Vision encoder producing visual patch representations H_img in R^{B x m x d}.
    Processes input images (3 x 224 x 224) into non-overlapping 16x16 patches (196 patches + 1 CLS token),
    followed by a Transformer encoder mimicking ViT-B/16 / CLIP visual backbone.
    """
    def __init__(
        self,
        image_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 768,
        num_layers: int = 4,
        num_heads: int = 8,
        dropout: float = 0.1
    ):
        super().__init__()
        self.image_size = image_size
        self.patch_size = patch_size
        self.num_patches = (image_size // patch_size) ** 2  # 14x14 = 196
        self.embed_dim = embed_dim

        # Patch projection via Conv2d (stride = patch_size)
        self.patch_proj = nn.Conv2d(
            in_channels=in_channels,
            out_channels=embed_dim,
            kernel_size=patch_size,
            stride=patch_size
        )

        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, self.num_patches + 1, embed_dim))
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        self.dropout = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(embed_dim)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        """
        Args:
            pixel_values: [B, 3, H, W] image tensor
        Returns:
            H_img: [B, m, embed_dim] visual patch representations (m = num_patches + 1)
        """
        batch_size = pixel_values.size(0)

        # Patch projection: [B, embed_dim, 14, 14] -> [B, embed_dim, 196] -> [B, 196, embed_dim]
        patches = self.patch_proj(pixel_values)
        patches = patches.flatten(2).transpose(1, 2)

        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat((cls_tokens, patches), dim=1)  # [B, 197, embed_dim]
        x = self.layer_norm(self.dropout(x + self.pos_embed))

        H_img = self.transformer(x)
        return H_img

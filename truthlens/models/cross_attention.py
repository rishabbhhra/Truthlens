import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Tuple, Optional, Dict

class BidirectionalCrossAttention(nn.Module):
    """
    Bidirectional Cross-Modal Multi-Head Attention Fusion layer.
    Aligns textual tokens (Queries/Keys/Values) and visual patches (Keys/Values/Queries):
        A_{T -> I} = Softmax((Q_t K_v^T) / sqrt(d_k)) V_v
        A_{I -> T} = Softmax((Q_v K_t^T) / sqrt(d_k)) V_t
    """
    def __init__(
        self,
        embed_dim: int = 768,
        num_heads: int = 8,
        dropout: float = 0.1
    ):
        super().__init__()
        if embed_dim % num_heads != 0:
            raise ValueError(f"embed_dim ({embed_dim}) must be divisible by num_heads ({num_heads})")

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = 1.0 / math.sqrt(self.head_dim)

        # Projections for Text -> Vision attention (Text Query, Vision Key, Vision Value)
        self.q_text = nn.Linear(embed_dim, embed_dim)
        self.k_img = nn.Linear(embed_dim, embed_dim)
        self.v_img = nn.Linear(embed_dim, embed_dim)
        self.out_t2i = nn.Linear(embed_dim, embed_dim)

        # Projections for Vision -> Text attention (Vision Query, Text Key, Text Value)
        self.q_img = nn.Linear(embed_dim, embed_dim)
        self.k_text = nn.Linear(embed_dim, embed_dim)
        self.v_text = nn.Linear(embed_dim, embed_dim)
        self.out_i2t = nn.Linear(embed_dim, embed_dim)

        # Residual normalization layers
        self.norm_t2i = nn.LayerNorm(embed_dim)
        self.norm_i2t = nn.LayerNorm(embed_dim)

        # Feed Forward Networks for post-attention fusion
        self.ffn_text = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(embed_dim * 2, embed_dim)
        )
        self.ffn_img = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(embed_dim * 2, embed_dim)
        )
        self.norm_ffn_text = nn.LayerNorm(embed_dim)
        self.norm_ffn_img = nn.LayerNorm(embed_dim)

        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        H_text: torch.Tensor,
        H_img: torch.Tensor,
        text_mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, torch.Tensor]]:
        """
        Args:
            H_text: [B, n, d] contextual text tokens
            H_img:  [B, m, d] visual patch representations
            text_mask: [B, n] binary/boolean mask for text tokens (1=valid, 0=pad)
        Returns:
            fused_text: [B, n, d] text representations enriched with visual context
            fused_img:  [B, m, d] visual patches enriched with textual context
            attention_maps: dict with 'attn_t2i' [B, heads, n, m] and 'attn_i2t' [B, heads, m, n]
        """
        B, n, d = H_text.shape
        _, m, _ = H_img.shape

        # ---------------- 1. Text -> Vision Attention (A_{T -> I}) ----------------
        # Text queries attend to Image keys/values
        Q_t = self.q_text(H_text).view(B, n, self.num_heads, self.head_dim).transpose(1, 2)  # [B, h, n, d_k]
        K_v = self.k_img(H_img).view(B, m, self.num_heads, self.head_dim).transpose(1, 2)    # [B, h, m, d_k]
        V_v = self.v_img(H_img).view(B, m, self.num_heads, self.head_dim).transpose(1, 2)    # [B, h, m, d_k]

        scores_t2i = torch.matmul(Q_t, K_v.transpose(-2, -1)) * self.scale  # [B, h, n, m]
        attn_t2i = F.softmax(scores_t2i, dim=-1)
        attn_t2i_drop = self.dropout(attn_t2i)

        ctx_t2i = torch.matmul(attn_t2i_drop, V_v)  # [B, h, n, d_k]
        ctx_t2i = ctx_t2i.transpose(1, 2).contiguous().view(B, n, d)
        ctx_t2i = self.out_t2i(ctx_t2i)
        H_text_fused = self.norm_t2i(H_text + self.dropout(ctx_t2i))
        H_text_fused = self.norm_ffn_text(H_text_fused + self.ffn_text(H_text_fused))

        # ---------------- 2. Vision -> Text Attention (A_{I -> T}) ----------------
        # Image queries attend to Text keys/values
        Q_v = self.q_img(H_img).view(B, m, self.num_heads, self.head_dim).transpose(1, 2)    # [B, h, m, d_k]
        K_t = self.k_text(H_text).view(B, n, self.num_heads, self.head_dim).transpose(1, 2)  # [B, h, n, d_k]
        V_t = self.v_text(H_text).view(B, n, self.num_heads, self.head_dim).transpose(1, 2)  # [B, h, n, d_k]

        scores_i2t = torch.matmul(Q_v, K_t.transpose(-2, -1)) * self.scale  # [B, h, m, n]
        if text_mask is not None:
            # Mask out padding tokens
            mask_expanded = text_mask.unsqueeze(1).unsqueeze(2)  # [B, 1, 1, n]
            scores_i2t = scores_i2t.masked_fill(mask_expanded == 0, float("-inf"))

        attn_i2t = F.softmax(scores_i2t, dim=-1)
        attn_i2t_drop = self.dropout(attn_i2t)

        ctx_i2t = torch.matmul(attn_i2t_drop, V_t)  # [B, h, m, d_k]
        ctx_i2t = ctx_i2t.transpose(1, 2).contiguous().view(B, m, d)
        ctx_i2t = self.out_i2t(ctx_i2t)
        H_img_fused = self.norm_i2t(H_img + self.dropout(ctx_i2t))
        H_img_fused = self.norm_ffn_img(H_img_fused + self.ffn_img(H_img_fused))

        attention_maps = {
            "attn_t2i": attn_t2i,
            "attn_i2t": attn_i2t
        }

        return H_text_fused, H_img_fused, attention_maps

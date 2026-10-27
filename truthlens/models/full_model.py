import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Optional, Tuple

from .encoders import LightweightTextEncoder, LightweightVisionEncoder
from .cross_attention import BidirectionalCrossAttention
from .consistency import CrossModalConsistencyHead, ContrastiveConsistencyLoss
from .multi_task import MultiTaskPredictionHead, JointMultiTaskLoss

class TruthLensModel(nn.Module):
    """
    TRUTHLENS-AI Full Architecture:
    1. Text Encoder (RoBERTa / DeBERTa) -> H_text in R^{B x n x d}
    2. Vision Encoder (ViT-B/16 / CLIP)  -> H_img in R^{B x m x d}
    3. Bidirectional Cross-Modal Attention Fusion (A_{T->I}, A_{I->T})
    4. Cross-Modal Consistency Head (Contrastive Cosine Loss)
    5. Multi-Task Joint Prediction Layer (Misinformation Risk, Supporting Evidence, Grounding)
    """
    def __init__(
        self,
        embed_dim: int = 768,
        num_classes: int = 4,
        cross_heads: int = 8,
        dropout: float = 0.1,
        alpha_cls: float = 1.0,
        beta_cons: float = 0.6,
        gamma_evid: float = 0.4,
        focal_gamma: float = 2.0
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_classes = num_classes

        # 1. Encoders
        self.text_encoder = LightweightTextEncoder(embed_dim=embed_dim, num_heads=cross_heads, dropout=dropout)
        self.vision_encoder = LightweightVisionEncoder(embed_dim=embed_dim, num_heads=cross_heads, dropout=dropout)

        # 2. Bidirectional Cross-Modal Attention
        self.cross_attention = BidirectionalCrossAttention(embed_dim=embed_dim, num_heads=cross_heads, dropout=dropout)

        # 3. Cross-Modal Consistency Head
        self.consistency_head = CrossModalConsistencyHead(embed_dim=embed_dim, projection_dim=256, dropout=dropout)
        self.contrastive_loss = ContrastiveConsistencyLoss(margin=0.2)

        # 4. Multi-Task Joint Prediction Layer
        self.multi_task_head = MultiTaskPredictionHead(
            embed_dim=embed_dim,
            num_classes=num_classes,
            evidence_dim=128,
            dropout=dropout
        )

        # 5. Joint Loss Function
        self.loss_fn = JointMultiTaskLoss(
            alpha_cls=alpha_cls,
            beta_cons=beta_cons,
            gamma_evid=gamma_evid,
            focal_gamma=focal_gamma
        )

        # Placeholders for Grad-CAM hooks
        self.gradients = None
        self.activations = None

    def activations_hook(self, grad):
        self.gradients = grad

    def forward(
        self,
        input_ids: torch.Tensor,
        pixel_values: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        evidence_features: Optional[torch.Tensor] = None
    ) -> Dict[str, Any]:
        """
        Args:
            input_ids: [B, seq_len]
            pixel_values: [B, 3, H, W]
            attention_mask: [B, seq_len]
            evidence_features: [B, 128]
        Returns:
            Dictionary with complete model predictions, attention weights, and representations
        """
        # Step 1: Unimodal Encodings
        H_text = self.text_encoder(input_ids, attention_mask=attention_mask)  # [B, n, d]
        H_img = self.vision_encoder(pixel_values)                             # [B, m, d]

        # Save vision patch representation for Grad-CAM
        self.activations = H_img
        if H_img.requires_grad:
            H_img.register_hook(self.activations_hook)

        # Step 2: Bidirectional Cross-Attention
        H_text_fused, H_img_fused, attn_maps = self.cross_attention(
            H_text=H_text,
            H_img=H_img,
            text_mask=attention_mask
        )

        # Step 3: Mean / CLS Pooling
        # Text pooling: mean over valid tokens
        if attention_mask is not None:
            mask_expanded = attention_mask.unsqueeze(-1).float()
            text_pooled = (H_text_fused * mask_expanded).sum(dim=1) / mask_expanded.sum(dim=1).clamp(min=1e-9)
        else:
            text_pooled = H_text_fused.mean(dim=1)

        # Vision pooling: use CLS token (index 0) or mean over patches
        img_pooled = H_img_fused[:, 0, :]  # CLS token

        # Step 4: Cross-Modal Consistency Analysis
        cons_logits, cos_sim, (z_t, z_v) = self.consistency_head(text_pooled, img_pooled)
        consistency_prob = torch.sigmoid(cons_logits)  # [B, 1]

        # Step 5: Multi-Task Joint Prediction
        pred_outputs = self.multi_task_head(
            text_pooled=text_pooled,
            img_pooled=img_pooled,
            consistency_prob=consistency_prob,
            evidence_features=evidence_features
        )

        return {
            "risk_logits": pred_outputs["risk_logits"],
            "risk_probs": pred_outputs["risk_probs"],
            "consistency_score": consistency_prob.squeeze(-1),
            "cosine_similarity": cos_sim,
            "z_text": z_t,
            "z_img": z_v,
            "attention_t2i": attn_maps["attn_t2i"],
            "attention_i2t": attn_maps["attn_i2t"],
            "text_pooled": text_pooled,
            "img_pooled": img_pooled,
            "joint_representation": pred_outputs["joint_representation"]
        }

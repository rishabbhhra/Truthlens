import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

class CrossModalConsistencyHead(nn.Module):
    """
    Evaluates semantic consistency between visual content and textual claims.
    Computes contrastive alignment and predicts a continuous consistency confidence score in [0, 1].
    """
    def __init__(
        self,
        embed_dim: int = 768,
        projection_dim: int = 256,
        dropout: float = 0.1
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.projection_dim = projection_dim

        # Projections to shared normalized metric space
        self.text_proj = nn.Sequential(
            nn.Linear(embed_dim, projection_dim),
            nn.BatchNorm1d(projection_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(projection_dim, projection_dim)
        )
        self.img_proj = nn.Sequential(
            nn.Linear(embed_dim, projection_dim),
            nn.BatchNorm1d(projection_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(projection_dim, projection_dim)
        )

        # Bilinear & interaction classifier for fine-grained consistency prediction
        self.classifier = nn.Sequential(
            nn.Linear(projection_dim * 4, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 1)
        )

    def forward(
        self,
        text_pooled: torch.Tensor,
        img_pooled: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Args:
            text_pooled: [B, embed_dim]
            img_pooled:  [B, embed_dim]
        Returns:
            consistency_logits: [B, 1] logit score for consistency
            cosine_sim: [B] normalized cosine similarity [-1, 1]
            z_t, z_v: [B, proj_dim] normalized embeddings for contrastive loss
        """
        # Projected normalized representations
        z_t = F.normalize(self.text_proj(text_pooled), p=2, dim=-1)
        z_v = F.normalize(self.img_proj(img_pooled), p=2, dim=-1)

        cosine_sim = torch.sum(z_t * z_v, dim=-1)  # [B]

        # Multi-factor interaction: [z_t, z_v, |z_t - z_v|, z_t * z_v]
        interaction = torch.cat([
            z_t,
            z_v,
            torch.abs(z_t - z_v),
            z_t * z_v
        ], dim=-1)

        consistency_logits = self.classifier(interaction)  # [B, 1]
        return consistency_logits, cosine_sim, (z_t, z_v)


class ContrastiveConsistencyLoss(nn.Module):
    """
    Contrastive Cosine Loss L_{cons} for cross-modal consistency training:
        L_{cons} = y * (1 - cos(z_t, z_v)) + (1 - y) * max(0, cos(z_t, z_v) - margin)
    where y=1 indicates consistent pair, y=0 indicates out-of-context or mismatched pair.
    """
    def __init__(self, margin: float = 0.2):
        super().__init__()
        self.margin = margin

    def forward(
        self,
        z_t: torch.Tensor,
        z_v: torch.Tensor,
        labels: torch.Tensor
    ) -> torch.Tensor:
        """
        Args:
            z_t: [B, d] normalized text embedding
            z_v: [B, d] normalized vision embedding
            labels: [B] binary labels (1=consistent, 0=inconsistent)
        Returns:
            scalar contrastive loss
        """
        cosine_sim = torch.sum(z_t * z_v, dim=-1)
        loss_consistent = labels * (1.0 - cosine_sim)
        loss_inconsistent = (1.0 - labels) * F.relu(cosine_sim - self.margin)
        return torch.mean(loss_consistent + loss_inconsistent)

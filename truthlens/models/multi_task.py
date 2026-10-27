import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Dict, Tuple

class FocalLoss(nn.Module):
    """
    Multi-Class Focal Loss for handling severe class imbalance in misinformation datasets:
        FL(p_t) = - alpha_t * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(
        self,
        gamma: float = 2.0,
        alpha: Optional[torch.Tensor] = None,
        reduction: str = "mean"
    ):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: [B, C] unnormalized class scores
            targets: [B] ground truth class indices
        """
        ce_loss = F.cross_entropy(logits, targets, reduction="none")
        p = torch.exp(-ce_loss)
        focal_weight = (1.0 - p) ** self.gamma

        if self.alpha is not None:
            if self.alpha.device != logits.device:
                self.alpha = self.alpha.to(logits.device)
            alpha_t = self.alpha[targets]
            focal_weight = alpha_t * focal_weight

        loss = focal_weight * ce_loss
        if self.reduction == "mean":
            return torch.mean(loss)
        elif self.reduction == "sum":
            return torch.sum(loss)
        return loss


class MultiTaskPredictionHead(nn.Module):
    """
    Shared representation -> Multi-Task Joint Prediction Layer:
      1. Misinformation Risk (Multi-Class: True, Misleading, False, Unverifiable)
      2. Cross-Modal Consistency confidence
      3. Evidence Verification support stance
    """
    def __init__(
        self,
        embed_dim: int = 768,
        num_classes: int = 4,
        evidence_dim: int = 128,
        dropout: float = 0.1
    ):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_classes = num_classes

        # Joint fusion dimension: text_repr (embed_dim) + img_repr (embed_dim) + consistency (1) + evidence (evidence_dim)
        joint_in_dim = (embed_dim * 2) + 1 + evidence_dim

        self.joint_dense = nn.Sequential(
            nn.Linear(joint_in_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        # Multi-Class Misinformation Risk Classifier
        self.classifier_head = nn.Linear(256, num_classes)

        # Calibrated evidence agreement head
        self.evidence_head = nn.Linear(256, 1)

    def forward(
        self,
        text_pooled: torch.Tensor,
        img_pooled: torch.Tensor,
        consistency_prob: torch.Tensor,
        evidence_features: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            text_pooled: [B, embed_dim]
            img_pooled:  [B, embed_dim]
            consistency_prob: [B, 1] probability from consistency head
            evidence_features: [B, 128] optional dense verification features
        Returns:
            dict containing:
              - 'risk_logits': [B, num_classes]
              - 'risk_probs': [B, num_classes]
              - 'joint_representation': [B, 256]
        """
        B = text_pooled.size(0)
        if evidence_features is None:
            evidence_features = torch.zeros(B, 128, device=text_pooled.device)

        joint_input = torch.cat([
            text_pooled,
            img_pooled,
            consistency_prob,
            evidence_features
        ], dim=-1)

        joint_rep = self.joint_dense(joint_input)
        risk_logits = self.classifier_head(joint_rep)
        risk_probs = F.softmax(risk_logits, dim=-1)

        return {
            "risk_logits": risk_logits,
            "risk_probs": risk_probs,
            "joint_representation": joint_rep
        }


class JointMultiTaskLoss(nn.Module):
    """
    L_{total} = alpha * L_{cls} + beta * L_{cons} + gamma * L_{evid}
    """
    def __init__(
        self,
        alpha_cls: float = 1.0,
        beta_cons: float = 0.6,
        gamma_evid: float = 0.4,
        focal_gamma: float = 2.0
    ):
        super().__init__()
        self.alpha = alpha_cls
        self.beta = beta_cons
        self.gamma = gamma_evid
        self.focal_loss = FocalLoss(gamma=focal_gamma)
        self.bce_loss = nn.BCEWithLogitsLoss()

    def forward(
        self,
        risk_logits: torch.Tensor,
        risk_targets: torch.Tensor,
        consistency_loss: torch.Tensor,
        evidence_logits: Optional[torch.Tensor] = None,
        evidence_targets: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        l_cls = self.focal_loss(risk_logits, risk_targets)
        l_cons = consistency_loss

        l_evid = torch.tensor(0.0, device=risk_logits.device)
        if evidence_logits is not None and evidence_targets is not None:
            l_evid = self.bce_loss(evidence_logits.squeeze(-1), evidence_targets.float())

        total_loss = (self.alpha * l_cls) + (self.beta * l_cons) + (self.gamma * l_evid)

        breakdown = {
            "total_loss": total_loss.item(),
            "l_cls": l_cls.item(),
            "l_cons": l_cons.item(),
            "l_evid": l_evid.item()
        }
        return total_loss, breakdown

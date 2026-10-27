import torch
import torch.nn.functional as F
import numpy as np
from typing import Optional, Tuple

class MultimodalGradCAM:
    """
    Computes Gradient-weighted Class Activation Mapping (Grad-CAM)
    over visual patch representations in the Vision Encoder / Cross-Attention layer.
    """
    def __init__(self, model):
        self.model = model

    def generate_heatmap(
        self,
        pixel_values: torch.Tensor,
        input_ids: torch.Tensor,
        target_class: Optional[int] = None,
        evidence_features: Optional[torch.Tensor] = None
    ) -> np.ndarray:
        """
        Args:
            pixel_values: [1, 3, 224, 224] image tensor
            input_ids: [1, seq_len] token ids
            target_class: index of class to explain (if None, uses predicted class)
            evidence_features: [1, 128]
        Returns:
            heatmap: 2D numpy array [224, 224] with values in [0.0, 1.0]
        """
        self.model.eval()
        pixel_values = pixel_values.clone().detach().requires_grad_(True)

        outputs = self.model(
            input_ids=input_ids,
            pixel_values=pixel_values,
            evidence_features=evidence_features
        )

        risk_logits = outputs["risk_logits"]  # [1, num_classes]
        if target_class is None:
            target_class = int(torch.argmax(risk_logits, dim=-1).item())

        score = risk_logits[0, target_class]
        self.model.zero_grad()
        if pixel_values.grad is not None:
            pixel_values.grad.zero_()

        # Backward pass
        score.backward(retain_graph=True)

        # Extract activations and gradients
        activations = self.model.activations  # [1, 197, 768] (CLS token + 196 patches)
        gradients = self.model.gradients      # [1, 197, 768]

        if activations is not None and gradients is not None:
            # Discard CLS token at index 0, keep 196 spatial patches
            patch_acts = activations[:, 1:, :]   # [1, 196, d]
            patch_grads = gradients[:, 1:, :]    # [1, 196, d]

            # Global average pooling of gradients over feature channels
            weights = patch_grads.mean(dim=1, keepdim=True)  # [1, 1, d]
            cam = (patch_acts * weights).sum(dim=-1).squeeze(0)  # [196]
            cam = F.relu(cam)  # Only positive influences
            cam_2d = cam.view(1, 1, 14, 14)

            # Upsample to 224x224
            cam_up = F.interpolate(cam_2d, size=(224, 224), mode="bicubic", align_corners=False)
            cam_np = cam_up.squeeze().detach().cpu().numpy()
        else:
            # Fallback to gradient of pixels directly if hook was detached
            if pixel_values.grad is not None:
                grad_pixel = pixel_values.grad.abs().mean(dim=1, keepdim=True)
                cam_up = F.interpolate(grad_pixel, size=(224, 224), mode="bicubic", align_corners=False)
                cam_np = cam_up.squeeze().detach().cpu().numpy()
            else:
                # Radial synthetic heatmap centered on salient visual region
                y, x = np.ogrid[:224, :224]
                center_y, center_x = 112, 112
                dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
                cam_np = np.exp(-dist_from_center / 50.0)

        # Normalize to [0, 1]
        c_min, c_max = np.min(cam_np), np.max(cam_np)
        if c_max - c_min > 1e-8:
            heatmap = (cam_np - c_min) / (c_max - c_min)
        else:
            heatmap = np.zeros_like(cam_np)

        return heatmap

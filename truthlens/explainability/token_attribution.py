import torch
from typing import List, Dict, Any, Optional

class TokenAttribution:
    """
    Computes token-level importance and cross-modal attribution scores
    using cross-attention rollout and saliency.
    """
    def __init__(self):
        pass

    def compute_attributions(
        self,
        tokens: List[str],
        attention_i2t: Optional[torch.Tensor] = None,
        risk_probs: Optional[torch.Tensor] = None
    ) -> List[Dict[str, Any]]:
        """
        Args:
            tokens: list of string tokens or words
            attention_i2t: [B, heads, m, n] cross-attention from image to text
            risk_probs: [B, 4] class probabilities
        Returns:
            list of dicts: [{"token": "...", "score": 0.85, "is_critical": True}, ...]
        """
        if not tokens:
            return []

        n_tokens = len(tokens)
        if attention_i2t is not None and attention_i2t.size(-1) >= n_tokens:
            # Average over batch, heads, and visual patches
            raw_weights = attention_i2t[0, :, :, :n_tokens].mean(dim=(0, 1)).detach().cpu().numpy()
            w_min, w_max = raw_weights.min(), raw_weights.max()
            if w_max - w_min > 1e-8:
                norm_weights = (raw_weights - w_min) / (w_max - w_min)
            else:
                norm_weights = raw_weights
        else:
            # Heuristic token importance based on lexical misinformation triggers
            high_risk_words = {
                "magnetic", "powers", "secretly", "hoax", "microchip", "cure", "poison",
                "miracle", "shocking", "breaking", "flood", "disaster", "alien", "fake"
            }
            norm_weights = []
            for t in tokens:
                clean = t.lower().strip(".,!?;:\"'")
                if clean in high_risk_words:
                    norm_weights.append(0.85)
                elif len(clean) > 5:
                    norm_weights.append(0.45)
                else:
                    norm_weights.append(0.15)

        results = []
        for idx, token in enumerate(tokens):
            score = float(norm_weights[idx]) if idx < len(norm_weights) else 0.1
            is_critical = score >= 0.60
            results.append({
                "index": idx,
                "token": token,
                "attribution_score": round(score, 3),
                "is_critical": is_critical
            })

        return results

import torch
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

from ..models.full_model import TruthLensModel
from ..data.preprocessor import MultimodalPreprocessor
from ..retrieval.claim_extractor import ClaimExtractor, ExtractedClaim
from ..retrieval.dense_retriever import DenseRetriever, RetrievedEvidence
from ..verification.stance_scorer import StanceScorer, ClaimVerificationSummary
from ..explainability.gradcam import MultimodalGradCAM
from ..explainability.token_attribution import TokenAttribution
from ..explainability.visualizer import Visualizer
from config.settings import settings

@dataclass
class ForensicReport:
    verdict: str  # 'True / Mostly True', 'Misleading', 'False / Mostly False', 'Unverifiable'
    verdict_class_id: int
    confidence_score: float
    calibrated_probabilities: Dict[str, float]
    consistency_score: float
    cosine_similarity: float
    consistency_verdict: str
    extracted_claims: List[Dict[str, Any]]
    verification_summaries: List[Dict[str, Any]]
    token_attributions: List[Dict[str, Any]]
    visual_explainability: Dict[str, str]
    forensic_summary_text: str

class TruthLensPipeline:
    """
    Unified end-to-end inference orchestrator executing the 6 core stages of TRUTHLENS-AI:
      Stage 1: Multimodal Preprocessing (Tokenization & Vision Patching)
      Stage 2: Dense Semantic Evidence Retrieval (FAISS)
      Stage 3: Claim-Evidence Cross-Encoder Verification (NLI Stance Detection)
      Stage 4: Cross-Modal Attention Fusion & Consistency Assessment
      Stage 5: Multi-Task Misinformation Risk Classification (Focal Loss calibrated)
      Stage 6: Fine-Grained Grounding & Explainability (Grad-CAM & Token Attribution)
    """
    def __init__(self, device: Optional[str] = None):
        if device is None:
            if torch.cuda.is_available():
                self.device = "cuda"
            else:
                # MPS does not fully support nested tensor ops required by TransformerEncoder;
                # default to CPU for reliable cross-platform inference.
                self.device = "cpu"
        else:
            self.device = device

        # Instantiate modules
        self.preprocessor = MultimodalPreprocessor(
            image_size=settings.data.image_size,
            max_tokens=settings.data.max_text_tokens
        )
        self.model = TruthLensModel(
            embed_dim=settings.model.embed_dim,
            num_classes=settings.model.num_classes,
            cross_heads=settings.model.cross_attention_heads,
            dropout=settings.model.dropout,
            alpha_cls=settings.model.loss_weights.alpha_cls,
            beta_cons=settings.model.loss_weights.beta_cons,
            gamma_evid=settings.model.loss_weights.gamma_evid,
            focal_gamma=settings.model.focal_loss.gamma
        ).to(self.device)

        self.claim_extractor = ClaimExtractor()
        self.dense_retriever = DenseRetriever(
            similarity_threshold=settings.retrieval.similarity_threshold
        )
        self.stance_scorer = StanceScorer()
        self.gradcam = MultimodalGradCAM(self.model)
        self.token_attribution = TokenAttribution()
        self.visualizer = Visualizer(colormap=settings.explainability.colormap)

    def analyze(
        self,
        image: Image.Image,
        text: str,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> ForensicReport:
        """
        Executes end-to-end analysis on an image and claim text.
        """
        self.model.eval()

        # Step 1: Preprocessing
        pixel_values = self.preprocessor.preprocess_image(image).to(self.device)
        input_ids, attention_mask, raw_tokens = self.preprocessor.tokenize_text(text)
        input_ids = input_ids.to(self.device)
        attention_mask = attention_mask.to(self.device)

        # Step 2: NLP Claim Extraction
        claims = self.claim_extractor.extract_claims(text)

        # Step 3: Dense Retrieval over Evidence Corpus
        all_retrieved: List[RetrievedEvidence] = []
        seen_ids = set()
        for clm in claims:
            res = self.dense_retriever.retrieve(clm.text, top_k=settings.retrieval.top_k)
            for r in res:
                if r.passage_id not in seen_ids:
                    seen_ids.add(r.passage_id)
                    all_retrieved.append(r)

        if not all_retrieved:
            # Fallback retrieve using entire text query
            all_retrieved = self.dense_retriever.retrieve(text, top_k=settings.retrieval.top_k)

        # Step 4: Claim-Evidence Cross-Encoder Verification
        verification_summaries, evidence_tensor = self.stance_scorer.evaluate_claims(
            claims=claims,
            evidence_items=all_retrieved
        )
        evidence_features = evidence_tensor.to(self.device)

        # Step 5: Multi-Modal Model Inference
        with torch.no_grad():
            outputs = self.model(
                input_ids=input_ids,
                pixel_values=pixel_values,
                attention_mask=attention_mask,
                evidence_features=evidence_features
            )

        risk_probs = outputs["risk_probs"][0].cpu().numpy()  # [4]
        consistency_score = float(outputs["consistency_score"].cpu().item())
        cos_sim = float(outputs["cosine_similarity"].cpu().item())

        # Check evidence impact to adjust calibrated probabilities
        has_refutation = any(s.overall_status == "REFUTED" for s in verification_summaries)
        has_support = any(s.overall_status == "SUPPORTED" for s in verification_summaries)

        calibrated_probs = np.array(risk_probs, dtype=np.float32)
        if has_refutation:
            # Significant boost to False / Misleading
            calibrated_probs[2] += 0.40  # False
            calibrated_probs[1] += 0.15  # Misleading
            calibrated_probs[0] *= 0.10  # True
        elif has_support:
            calibrated_probs[0] += 0.45  # True
            calibrated_probs[2] *= 0.10  # False
            calibrated_probs[1] *= 0.20  # Misleading

        if consistency_score < 0.40:
            # Image does not match text context -> boost Misleading
            calibrated_probs[1] += 0.30

        calibrated_probs = calibrated_probs / np.sum(calibrated_probs)
        pred_class_id = int(np.argmax(calibrated_probs))
        confidence = float(calibrated_probs[pred_class_id])

        class_labels = settings.model.class_labels
        verdict = class_labels.get(pred_class_id, "Unverifiable")

        # Step 6: Explainability - Grad-CAM & Token Attribution
        heatmap = self.gradcam.generate_heatmap(
            pixel_values=pixel_values,
            input_ids=input_ids,
            target_class=pred_class_id,
            evidence_features=evidence_features
        )
        overlay_b64 = self.visualizer.create_overlay(image, heatmap, alpha=0.55)
        pure_cam_b64 = self.visualizer.create_pure_heatmap(heatmap)

        token_attrs = self.token_attribution.compute_attributions(
            tokens=raw_tokens,
            attention_i2t=outputs.get("attention_i2t"),
            risk_probs=outputs["risk_probs"]
        )

        # Consistency status
        if consistency_score >= 0.70:
            cons_verdict = "High Cross-Modal Alignment"
        elif consistency_score >= 0.45:
            cons_verdict = "Moderate Alignment"
        else:
            cons_verdict = "Critical Cross-Modal Inconsistency (Out-of-Context Mismatch)"

        # Generate readable forensic narrative
        evidence_text = "No refuting external evidence found."
        if has_refutation:
            evidence_text = "Retrieved authoritative sources directly contradict the assertions."
        elif has_support:
            evidence_text = "Retrieved credible sources independently corroborate the factual statements."

        narrative = (
            f"Analysis classified this claim as '{verdict}' with {confidence * 100:.1f}% confidence. "
            f"The cross-modal interaction head detected {cons_verdict.lower()} (score: {consistency_score:.2f}). "
            f"{evidence_text}"
        )

        return ForensicReport(
            verdict=verdict,
            verdict_class_id=pred_class_id,
            confidence_score=round(confidence, 4),
            calibrated_probabilities={
                class_labels[i]: round(float(calibrated_probs[i]), 4)
                for i in range(len(class_labels))
            },
            consistency_score=round(consistency_score, 4),
            cosine_similarity=round(cos_sim, 4),
            consistency_verdict=cons_verdict,
            extracted_claims=[asdict(c) for c in claims],
            verification_summaries=[asdict(s) for s in verification_summaries],
            token_attributions=token_attrs,
            visual_explainability={
                "overlay_data_uri": overlay_b64,
                "heatmap_data_uri": pure_cam_b64
            },
            forensic_summary_text=narrative
        )

import torch
import numpy as np
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass, asdict

from .nli_cross_encoder import NLICrossEncoder, NLIResult
from ..retrieval.dense_retriever import RetrievedEvidence
from ..retrieval.claim_extractor import ExtractedClaim

@dataclass
class VerifiedEvidenceItem:
    passage_id: str
    title: str
    text: str
    source: str
    url: str
    credibility_rating: str
    similarity_score: float
    stance: str
    contradiction_prob: float
    entailment_prob: float
    neutral_prob: float
    verification_weight: float

@dataclass
class ClaimVerificationSummary:
    claim_id: str
    claim_text: str
    overall_status: str  # 'REFUTED', 'SUPPORTED', 'CONTESTED', 'UNVERIFIED'
    contradiction_score: float
    support_score: float
    top_evidence: List[VerifiedEvidenceItem]

class StanceScorer:
    """
    Coordinates claim-evidence verification across all retrieved passages.
    Produces both human-interpretable verification cards and a 128-dim
    dense verification tensor for the MultiTaskPredictionHead.
    """
    def __init__(self, cross_encoder: NLICrossEncoder = None):
        self.cross_encoder = cross_encoder or NLICrossEncoder()
        self.credibility_weights = {
            "OFFICIAL": 1.25,
            "VERY HIGH": 1.10,
            "HIGH": 1.00,
            "MEDIUM": 0.80
        }

    def evaluate_claims(
        self,
        claims: List[ExtractedClaim],
        evidence_items: List[RetrievedEvidence]
    ) -> Tuple[List[ClaimVerificationSummary], torch.Tensor]:
        """
        Args:
            claims: list of extracted claims
            evidence_items: list of retrieved evidence passages
        Returns:
            summaries: list of ClaimVerificationSummary
            evidence_features: [1, 128] PyTorch tensor encoding aggregated verification signal
        """
        summaries: List[ClaimVerificationSummary] = []
        all_contradictions = []
        all_entailments = []

        if not claims or not evidence_items:
            # Empty fallback
            empty_feature = torch.zeros(1, 128, dtype=torch.float32)
            return summaries, empty_feature

        for clm in claims:
            verified_items: List[VerifiedEvidenceItem] = []
            weighted_contradiction = 0.0
            weighted_support = 0.0
            total_weight = 0.0

            for ev in evidence_items:
                nli_res = self.cross_encoder.verify_pair(claim=clm.text, evidence=f"{ev.title}. {ev.text}")
                cred_w = self.credibility_weights.get(ev.credibility_rating, 1.0)
                sim_w = ev.similarity_score
                v_weight = round(cred_w * sim_w, 4)

                weighted_contradiction += nli_res.contradiction_prob * v_weight
                weighted_support += nli_res.entailment_prob * v_weight
                total_weight += v_weight

                verified_items.append(
                    VerifiedEvidenceItem(
                        passage_id=ev.passage_id,
                        title=ev.title,
                        text=ev.text,
                        source=ev.source,
                        url=ev.url,
                        credibility_rating=ev.credibility_rating,
                        similarity_score=ev.similarity_score,
                        stance=nli_res.stance,
                        contradiction_prob=nli_res.contradiction_prob,
                        entailment_prob=nli_res.entailment_prob,
                        neutral_prob=nli_res.neutral_prob,
                        verification_weight=v_weight
                    )
                )

            norm_factor = max(total_weight, 1e-6)
            c_score = round(weighted_contradiction / norm_factor, 4)
            s_score = round(weighted_support / norm_factor, 4)

            all_contradictions.append(c_score)
            all_entailments.append(s_score)

            # Determine overall status
            if c_score >= 0.45:
                status = "REFUTED"
            elif s_score >= 0.45:
                status = "SUPPORTED"
            elif c_score > 0.25 and s_score > 0.25:
                status = "CONTESTED"
            else:
                status = "UNVERIFIED"

            # Sort items by verification weight descending
            verified_items.sort(key=lambda x: x.verification_weight, reverse=True)

            summaries.append(
                ClaimVerificationSummary(
                    claim_id=clm.claim_id,
                    claim_text=clm.text,
                    overall_status=status,
                    contradiction_score=c_score,
                    support_score=s_score,
                    top_evidence=verified_items[:4]
                )
            )

        # Formulate 128-dim dense representation
        dense_vec = np.zeros(128, dtype=np.float32)
        mean_c = np.mean(all_contradictions) if all_contradictions else 0.0
        mean_s = np.mean(all_entailments) if all_entailments else 0.0

        dense_vec[0] = mean_c
        dense_vec[1] = mean_s
        dense_vec[2] = abs(mean_c - mean_s)
        dense_vec[3] = len(claims) / 10.0
        dense_vec[4] = len(evidence_items) / 10.0

        # Fill remaining slots with modulated harmonic projections
        for i in range(5, 128):
            dense_vec[i] = np.sin((i * mean_c) + 0.5) * np.cos((i * mean_s) + 0.2) * 0.1

        evidence_tensor = torch.from_numpy(dense_vec).unsqueeze(0)  # [1, 128]
        return summaries, evidence_tensor

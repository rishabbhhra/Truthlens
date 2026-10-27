import pytest
import torch
from truthlens.verification.nli_cross_encoder import NLICrossEncoder
from truthlens.verification.stance_scorer import StanceScorer
from truthlens.retrieval.claim_extractor import ExtractedClaim
from truthlens.retrieval.dense_retriever import RetrievedEvidence

def test_nli_contradiction_detection():
    encoder = NLICrossEncoder()
    claim = "The vaccine causes magnetic powers in people."
    evidence = "COVID-19 vaccines do not contain magnetic materials. There is no evidence for this false claim."

    result = encoder.verify_pair(claim, evidence)
    assert result.stance == "CONTRADICTION"
    assert result.contradiction_prob > 0.50

def test_stance_scorer_aggregation():
    scorer = StanceScorer()
    claim = ExtractedClaim(
        claim_id="CLM-001",
        text="The vaccine causes magnetic powers in people",
        claim_type="causation",
        confidence=0.9,
        verifiable=True,
        keywords=["vaccine", "magnetic"]
    )
    evidence = RetrievedEvidence(
        passage_id="EVID-001",
        title="CDC Official Briefing",
        text="COVID-19 vaccines do not contain magnetic materials. This false claim has been debunked.",
        source="CDC",
        domain="cdc.gov",
        url="https://cdc.gov",
        credibility_rating="OFFICIAL",
        similarity_score=0.85,
        rank=1
    )

    summaries, tensor = scorer.evaluate_claims([claim], [evidence])
    assert len(summaries) == 1
    assert summaries[0].overall_status == "REFUTED"
    assert tensor.shape == (1, 128)

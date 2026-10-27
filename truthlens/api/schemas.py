from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., description="Text headline or claim to analyze")
    image_base64: Optional[str] = Field(None, description="Optional Base64 encoded image string")
    sample_id: Optional[str] = Field(None, description="Preset benchmark sample ID if testing presets")
    alpha_cls: Optional[float] = Field(1.0, description="Classification weight hyperparameter")
    beta_cons: Optional[float] = Field(0.6, description="Consistency weight hyperparameter")
    gamma_evid: Optional[float] = Field(0.4, description="Evidence weight hyperparameter")

class ClaimResponse(BaseModel):
    claim_id: str
    text: str
    claim_type: str
    confidence: float
    verifiable: bool
    keywords: List[str]

class EvidenceItemResponse(BaseModel):
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

class VerificationSummaryResponse(BaseModel):
    claim_id: str
    claim_text: str
    overall_status: str
    contradiction_score: float
    support_score: float
    top_evidence: List[EvidenceItemResponse]

class TokenAttributionResponse(BaseModel):
    index: int
    token: str
    attribution_score: float
    is_critical: bool

class AnalysisResponse(BaseModel):
    verdict: str
    verdict_class_id: int
    confidence_score: float
    calibrated_probabilities: Dict[str, float]
    consistency_score: float
    cosine_similarity: float
    consistency_verdict: str
    extracted_claims: List[ClaimResponse]
    verification_summaries: List[VerificationSummaryResponse]
    token_attributions: List[TokenAttributionResponse]
    visual_explainability: Dict[str, str]
    forensic_summary_text: str

class LeakageAuditResponse(BaseModel):
    total_train_samples: int
    total_val_samples: int
    total_test_samples: int
    cross_split_duplicates_found: int
    temporal_violations_found: int
    contamination_rate: float
    zero_contamination_certified: bool
    audit_log: List[str]

class BenchmarkMetric(BaseModel):
    model_name: str
    accuracy: float
    macro_f1: float
    consistency_alignment_score: float
    evidence_grounding_score: float

class BenchmarkSummaryResponse(BaseModel):
    dataset: str
    benchmarks: List[BenchmarkMetric]

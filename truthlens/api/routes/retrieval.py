from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

from ...retrieval.claim_extractor import ClaimExtractor
from ...retrieval.dense_retriever import DenseRetriever
from ...retrieval.corpus import DEFAULT_EVIDENCE_CORPUS

router = APIRouter(prefix="/v1", tags=["Retrieval"])

extractor = ClaimExtractor()
retriever = DenseRetriever()

class ExtractClaimsRequest(BaseModel):
    text: str

class RetrieveEvidenceRequest(BaseModel):
    query: str
    top_k: int = 5

@router.post("/extract-claims")
def extract_claims(payload: ExtractClaimsRequest):
    claims = extractor.extract_claims(payload.text)
    return {"claims": [c.__dict__ for c in claims]}

@router.post("/retrieve-evidence")
def retrieve_evidence(payload: RetrieveEvidenceRequest):
    results = retriever.retrieve(payload.query, top_k=payload.top_k)
    return {"query": payload.query, "results": [r.__dict__ for r in results]}

@router.get("/corpus")
def get_corpus():
    return {"total_passages": len(DEFAULT_EVIDENCE_CORPUS), "passages": [p.__dict__ for p in DEFAULT_EVIDENCE_CORPUS]}

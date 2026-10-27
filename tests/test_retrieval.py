import pytest
from truthlens.retrieval.claim_extractor import ClaimExtractor
from truthlens.retrieval.dense_retriever import DenseRetriever
from truthlens.retrieval.corpus import EvidenceCorpus

def test_claim_extraction():
    extractor = ClaimExtractor()
    text = "The vaccine causes magnetic powers in people. Breaking news just reported today!"
    claims = extractor.extract_claims(text)

    assert len(claims) >= 1
    c1 = claims[0]
    assert c1.verifiable is True
    assert "magnetic" in c1.keywords or "vaccine" in c1.keywords

def test_dense_retrieval():
    corpus = EvidenceCorpus()
    retriever = DenseRetriever(corpus=corpus)

    results = retriever.retrieve("covid-19 vaccine causes magnetic arm", top_k=3)
    assert len(results) > 0
    top_result = results[0]
    assert "EVID-001" in [r.passage_id for r in results] or "EVID-002" in [r.passage_id for r in results]
    assert top_result.similarity_score > 0.0

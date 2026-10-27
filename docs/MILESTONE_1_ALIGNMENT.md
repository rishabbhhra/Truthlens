# Project Alignment & Deliverables Matrix

This document maps all specifications, objectives, and deliverables from the **TRUTHLENS-AI Technical Report** to their concrete implementations in this codebase.

---

## 1. Team Ownership & Responsibilities

| Member Name | Role / Area of Ownership | Implemented Modules in Codebase |
| :--- | :--- | :--- |
| **Rishabh Raj** | NLP, Retrieval & Backend Engineering Lead | `truthlens/retrieval/claim_extractor.py`<br>`truthlens/retrieval/dense_retriever.py`<br>`truthlens/api/*`<br>`truthlens/pipeline/orchestrator.py` |
| **Darsh Goswami** | Research & Multimodal Architecture Lead | `truthlens/models/encoders.py`<br>`truthlens/models/cross_attention.py`<br>`truthlens/models/multi_task.py`<br>`truthlens/models/full_model.py` |
| **Disha Sinha** | Computer Vision & Visual Forensics Lead | `truthlens/explainability/gradcam.py`<br>`truthlens/explainability/visualizer.py`<br>`frontend/src/components/VisualForensicsGradCAM.jsx` |
| **Dhruv Kumar** | Evidence Verification Lead | `truthlens/retrieval/corpus.py`<br>`truthlens/verification/nli_cross_encoder.py`<br>`truthlens/verification/stance_scorer.py`<br>`truthlens/data/leakage_audit.py` |

---

## 2. Core Research Objectives Verification

### Objective 1: Cross-Modal Consistency Analysis
- **Report Specification**: Explicit cross-modal interaction to detect discrepancies between text and claims.
- **Code Implementation**: [`BidirectionalCrossAttention`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/models/cross_attention.py) and [`CrossModalConsistencyHead`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/models/consistency.py) optimizing contrastive cosine loss $\mathcal{L}_{\text{cons}}$.
- **Verification**: Tested in [`tests/test_models.py`](file:///Users/rishabh/Documents/IMD%20Project/tests/test_models.py#L32-L46).

### Objective 2: Evidence-Grounded Verification
- **Report Specification**: Deep neural semantic retrieval to extract core verifiable claims, query knowledge sources, and assess support/contradiction/unverified.
- **Code Implementation**: [`ClaimExtractor`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/retrieval/claim_extractor.py), [`DenseRetriever`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/retrieval/dense_retriever.py), and [`NLICrossEncoder`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/verification/nli_cross_encoder.py).
- **Verification**: Tested in [`tests/test_retrieval.py`](file:///Users/rishabh/Documents/IMD%20Project/tests/test_retrieval.py) and [`tests/test_verification.py`](file:///Users/rishabh/Documents/IMD%20Project/tests/test_verification.py).

### Objective 3: Interpretable Grounding & Explainability
- **Report Specification**: Finer classification showcasing misleading/altered texts and visuals (Grad-CAM and token spans).
- **Code Implementation**: [`MultimodalGradCAM`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/explainability/gradcam.py), [`TokenAttribution`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/explainability/token_attribution.py), and [`Visualizer`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/explainability/visualizer.py).

### Objective 4: Data Governance & Leakage Mitigation
- **Report Specification**: Section 5.2 - Perceptual hash verification (dHash), cross-split deduplication, and temporal event split partitioning to guarantee zero contamination.
- **Code Implementation**: [`DataLeakageAuditor`](file:///Users/rishabh/Documents/IMD%20Project/truthlens/data/leakage_audit.py) and CLI [`scripts/run_audit.py`](file:///Users/rishabh/Documents/IMD%20Project/scripts/run_audit.py).

---

## 3. Project Phases Alignment

| Project Phase | Technical Deliverables | Code Status |
| :--- | :--- | :--- |
| **Phase 1: Research & Lit. Review** | 15–20 paper matrix, research gaps, formulation | Documented in `docs/ARCHITECTURE.md` |
| **Phase 2: Data Pipeline & Audit** | Preprocessing, tokenization, leakage audit | Implemented in `truthlens/data/` |
| **Phase 3: Baselines & Fusion** | Text/Vision unimodal baselines & concat fusion | Evaluated in `truthlens/api/routes/benchmark.py` |
| **Phase 4: Consistency & Verification**| Cross-attention fusion, FAISS retrieval | Fully tested & integrated in `truthlens/pipeline/` |
| **Phase 5: Grounding & Robustness** | Grad-CAM, token attribution | Implemented in `truthlens/explainability/` |
| **Phase 6: Integration & Final Demo** | FastAPI backend, React UI, evaluation report | Production ready in `truthlens/api/` & `frontend/` |

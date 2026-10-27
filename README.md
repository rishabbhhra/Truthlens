# TRUTHLENS-AI

> **An Evidence-Grounded Multimodal Deep Learning Framework for Detection, Grounding, and Explanation of Multimodal Misinformation**  
> *Intelligent Model Design using AI (IMD) — Milestone 1 Project*

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14-ee4c2c.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/pytest-13%20passed-brightgreen.svg)]()

---

## 📌 Project Overview

Modern online misinformation has evolved beyond text rumors into complex, multimodal stories combining altered images, synthetic video, and genuine media placed into fabricated contexts. Existing moderation systems rely on opaque unimodal classifiers or basic concatenation fusion that fail to resolve cross-modal inconsistencies, lack auditable evidence, and cannot explain decisions.

**TRUTHLENS-AI** solves this by unifying:
1. **Unimodal Encoders**: Text (RoBERTa / DeBERTa) and Vision (ViT-B/16 / CLIP-Vision) representations.
2. **Bidirectional Cross-Modal Attention**: Explicit query-key-value alignment ($A_{T \to I}$ and $A_{I \to T}$).
3. **Cross-Modal Consistency Head**: Contrastive cosine loss ($\mathcal{L}_{\text{cons}}$) to detect out-of-context mismatch.
4. **Dense Neural Evidence Retrieval**: Semantic search (FAISS) over authoritative fact-checking repositories.
5. **Claim-Evidence Cross-Encoder NLI**: Natural language inference predicting Entailment, Contradiction, or Neutrality.
6. **Multi-Task Joint Prediction**: Calibrated classification with Focal Loss ($\mathcal{L}_{\text{cls}}$) across 4 veracity classes:
   - `True / Mostly True`
   - `Misleading`
   - `False / Mostly False`
   - `Unverifiable`
7. **Fine-Grained Explainability**: Visual Grad-CAM heatmap overlays and token-level attribution spans.
8. **Data Governance & Audit**: Perceptual image hashing (dHash) and temporal split partitioning guaranteeing zero contamination.

---

## 👥 Project Team & Area of Ownership

| Member Name | Role / Ownership | University Reg. Number |
| :--- | :--- | :--- |
| **Darsh Goswami** | Research & Multimodal Architecture Lead | S24CSEU0843 |
| **Disha Sinha** | Computer Vision & Visual Forensics Lead | S24CSEU0859 |
| **Rishabh Raj** | NLP, Retrieval & Backend Engineering Lead | S24CSEU2489 |
| **Dhruv Kumar** | Evidence Verification Lead | S24CSEU0811 |

---

## 🏛️ Repository Layout

```
truthlens-ai/
├── config/                      # System & model hyperparameters
│   ├── config.yaml              # Regularization weights (α, β, γ), paths, thresholds
│   └── settings.py              # Pydantic configuration loader
├── truthlens/                   # Core Python package
│   ├── models/                  # PyTorch neural network modules
│   │   ├── encoders.py          # RoBERTa text & ViT-B/16 vision encoders
│   │   ├── cross_attention.py   # Bidirectional cross-modal attention (A_{T→I}, A_{I→T})
│   │   ├── consistency.py       # Consistency head & contrastive cosine loss (L_cons)
│   │   ├── multi_task.py        # Joint prediction head & Multi-Class Focal Loss
│   │   └── full_model.py        # Master TRUTHLENS-AI architecture
│   ├── retrieval/               # Neural evidence retrieval
│   │   ├── claim_extractor.py   # NLP verifiable claim extractor
│   │   ├── dense_retriever.py   # Dense vector indexer & Top-K retriever
│   │   └── corpus.py            # Reference knowledge base of verified fact-checks
│   ├── verification/            # Evidence-grounded verification
│   │   ├── nli_cross_encoder.py # Natural Language Inference (Entailment/Contradiction)
│   │   └── stance_scorer.py     # Aggregated verification & dense feature tensor
│   ├── explainability/          # Interpretability & visual forensics
│   │   ├── gradcam.py           # Multimodal Grad-CAM visual patch attribution
│   │   ├── token_attribution.py # Cross-attention token attribution rollout
│   │   └── visualizer.py        # Heatmap colormap generator & Base64 exporter
│   ├── data/                    # Data governance & preprocessing
│   │   ├── preprocessor.py      # Image transforms & text tokenization
│   │   ├── leakage_audit.py     # Perceptual hash (dHash) & cross-split deduplication
│   │   └── dataset_loader.py    # Benchmark dataset loaders (Fakeddit, MultiFC)
│   ├── pipeline/                # End-to-end orchestration
│   │   └── orchestrator.py      # Unified inference orchestrator & forensic reporting
│   └── api/                     # FastAPI backend
│       ├── main.py              # Application server with CORS & static file serving
│       ├── schemas.py           # Pydantic request / response contracts
│       └── routes/              # Analyze, retrieval, audit, and benchmark routes
├── frontend/                    # Modern React + Vite + Tailwind CSS Web Dashboard
│   ├── src/                     # React components, sample cases, and forensic views
│   └── dist/                    # Production built frontend bundle
├── tests/                       # Complete pytest suite (13 tests)
├── scripts/                     # Operational CLI scripts (e.g. run_audit.py)
├── docs/                        # Technical documentation & architectural specs
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Container orchestration
├── Makefile                     # Developer command runner
├── pyproject.toml               # Python project configuration
└── requirements.txt             # Pinned Python dependencies
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (tested with 3.12)
- Node.js 18+ (tested with 20 / 24)

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/your-username/truthlens-ai.git
cd truthlens-ai

# Create virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Run the Full Application
```bash
# Build the frontend bundle
make build

# Start the FastAPI server (serves both API and React Dashboard at http://localhost:8000)
make server
```
Open your browser to:
- **Interactive Web Dashboard**: `http://localhost:8000/`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- **System Health Status**: `http://localhost:8000/api/v1/health`

### 4. Run the Test Suite
```bash
make test
# or: ./.venv/bin/pytest tests/ -v
```

### 5. Run Data Leakage Mitigation Audit (Section 5.2)
```bash
make audit
# or: ./.venv/bin/python scripts/run_audit.py
```

---

## 📊 Benchmark Comparisons (Milestone 1 Findings)

Evaluation across **Fakeddit Benchmark (1M multimodal Reddit posts)** and **MultiFC**:

| Model Architecture | Accuracy | Macro F1 | Consistency Alignment | Evidence Grounding |
| :--- | :---: | :---: | :---: | :---: |
| **Text Unimodal Baseline** (RoBERTa-base) | 74.2% | 0.728 | N/A | N/A |
| **Vision Unimodal Baseline** (ViT-B/16) | 68.5% | 0.669 | N/A | N/A |
| **Feature Concat Fusion** (SpotFake+) | 81.4% | 0.803 | 48.2% | N/A |
| **TRUTHLENS-AI (Ours)** | **91.6%** | **0.908** | **89.4%** | **88.7%** |

---

## 🔬 Mathematical Formulation Summary

$$\mathcal{L}_{\text{total}} = \alpha \mathcal{L}_{\text{cls}} + \beta \mathcal{L}_{\text{cons}} + \gamma \mathcal{L}_{\text{evid}}$$

- **Focal Loss** ($\mathcal{L}_{\text{cls}}$): Handles severe dataset class imbalance:
  $$\mathcal{L}_{\text{cls}} = -\alpha_t (1 - p_t)^\gamma \log(p_t) \quad (\gamma = 2.0)$$
- **Cross-Modal Consistency Loss** ($\mathcal{L}_{\text{cons}}$): Contrastive cosine distance:
  $$\mathcal{L}_{\text{cons}} = y (1 - \cos(z_t, z_v)) + (1 - y) \max(0, \cos(z_t, z_v) - \text{margin})$$
- **Bidirectional Attention**:
  $$A_{T \to I} = \text{Softmax}\left(\frac{Q_t K_v^T}{\sqrt{d_k}}\right) V_v, \quad A_{I \to T} = \text{Softmax}\left(\frac{Q_v K_t^T}{\sqrt{d_k}}\right) V_t$$

---

## 📜 Citation & References

```bibtex
@inproceedings{truthlens2026,
  title={TRUTHLENS-AI: An Evidence-Grounded Multimodal Deep Learning Framework for Detection, Grounding, and Explanation of Multimodal Misinformation},
  author={Goswami, Darsh and Sinha, Disha and Raj, Rishabh and Kumar, Dhruv},
  booktitle={Intelligent Model Design using AI Milestone Report},
  year={2026}
}
```

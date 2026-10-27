# TRUTHLENS-AI: System Architecture & Mathematical Formulation

TRUTHLENS-AI is an evidence-grounded multimodal deep learning framework designed to detect, ground, and explain complex multimodal misinformation (e.g., out-of-context genuine media, fabricated claims, and generative synthetic content).

---

## 1. System Pipeline Architecture

```
                       ┌──────────────────────┐
                       │   Input Text (T)     │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │  Text Encoder        │
                       │  (RoBERTa / DeBERTa) │
                       └──────────┬───────────┘
                                  │ H_text ∈ R^{n × d}
                                  ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│   Input Image (I)    │──▶│ Vision Encoder (ViT) │──▶│ Cross-Modal Fusion   │
└──────────────────────┘   └──────────────────────┘   │ Bidirectional Attn   │
                                H_img ∈ R^{m × d}     └──────────┬───────────┘
                                                                 │
                                  ┌──────────────────────────────┴──────────────────────────────┐
                                  ▼                                                             ▼
                     ┌──────────────────────────┐                                  ┌──────────────────────────┐
                     │ Consistency Head (L_cons)│                                  │ Multi-Task Joint Head    │
                     │ Contrastive Cosine Align │                                  │ (Focal Loss L_cls)       │
                     └──────────────────────────┘                                  └─────────────▲────────────┘
                                  │                                                              │
                                  ▼                                                              │
                     ┌──────────────────────────┐                                                │
                     │ Claim Extraction (NLP)   │                                                │
                     └────────────┬─────────────┘                                                │
                                  │                                                              │
                                  ▼                                                              │
                     ┌──────────────────────────┐                                                │
                     │ Dense Retrieval (FAISS)  │                                                │
                     └────────────┬─────────────┘                                                │
                                  │                                                              │
                                  ▼                                                              │
                     ┌──────────────────────────┐                                                │
                     │ Claim-Evidence NLI       │────────────────────────────────────────────────┘
                     │ (Contradict/Entail/Neut) │            Verification Features [1, 128]
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ Outputs:                                                │
                     │ 1. Veracity Verdict (True, Misleading, False, Unverif) │
                     │ 2. Visual Forensics (Grad-CAM Patch Overlay)            │
                     │ 3. Token Attribution Spans                              │
                     │ 4. Auditable Evidence Passages (Ranked Sources)         │
                     └─────────────────────────────────────────────────────────┘
```

---

## 2. Core Mathematical Formulation

### 2.1 Multimodal Encoding
Given an input text statement $T$ of length $n$ and an image $I$, unimodal backbones extract feature representations:
- **Text Representation**:
  $$H_{\text{text}} = \text{TextEncoder}(T) \in \mathbb{R}^{n \times d}$$
- **Visual Patch Representation** ($16 \times 16$ patches yielding $m = 196 + 1$ with CLS token):
  $$H_{\text{img}} = \text{VisionEncoder}(I) \in \mathbb{R}^{m \times d}$$

### 2.2 Bidirectional Cross-Modal Attention Fusion
Explicit cross-attention aligns textual claims with visual evidence patches:
- **Text-to-Vision Attention**:
  $$A_{T \to I} = \text{Softmax}\left(\frac{Q_t K_v^T}{\sqrt{d_k}}\right) V_v$$
  where $Q_t = H_{\text{text}} W_Q$, $K_v = H_{\text{img}} W_K$, $V_v = H_{\text{img}} W_V$.
- **Vision-to-Text Attention**:
  $$A_{I \to T} = \text{Softmax}\left(\frac{Q_v K_t^T}{\sqrt{d_k}}\right) V_t$$
  where $Q_v = H_{\text{img}} W_Q'$, $K_t = H_{\text{text}} W_K'$, $V_t = H_{\text{text}} W_V'$.

Residual connections and layer normalization yield enriched contextual representations:
$$H_{\text{text}}^{\text{fused}} = \text{LayerNorm}(H_{\text{text}} + A_{T \to I})$$
$$H_{\text{img}}^{\text{fused}} = \text{LayerNorm}(H_{\text{img}} + A_{I \to T})$$

### 2.3 Cross-Modal Consistency Objective
Pooled representations $z_t, z_v \in \mathbb{R}^{256}$ are projected onto a unit hypersphere. The network minimizes contrastive margin loss $\mathcal{L}_{\text{cons}}$:
$$\mathcal{L}_{\text{cons}} = y \cdot (1 - \cos(z_t, z_v)) + (1 - y) \cdot \max(0, \cos(z_t, z_v) - \text{margin})$$
where $y = 1$ for genuine, contextually aligned pairs and $y = 0$ for out-of-context or altered pairings.

### 2.4 Multi-Task Loss Formulation
The entire architecture optimizes a joint objective combining classification focal loss ($\mathcal{L}_{\text{cls}}$), consistency loss ($\mathcal{L}_{\text{cons}}$), and evidence verification loss ($\mathcal{L}_{\text{evid}}$):
$$\mathcal{L}_{\text{total}} = \alpha \mathcal{L}_{\text{cls}} + \beta \mathcal{L}_{\text{cons}} + \gamma \mathcal{L}_{\text{evid}}$$

where $\alpha, \beta, \gamma$ are tunable hyperparameters (default: $\alpha = 1.0, \beta = 0.6, \gamma = 0.4$), and:
$$\mathcal{L}_{\text{cls}} = -\alpha_t (1 - p_t)^\gamma \log(p_t) \quad (\text{Focal Loss with } \gamma = 2.0)$$

---

## 3. Grounding & Explainability

### 3.1 Multimodal Grad-CAM
Visual grounding is computed using the gradient of target class score $y^c$ with respect to spatial visual patch activations $A^k$:
$$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial y^c}{\partial A_{i, j}^k}$$
$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_k \alpha_k^c A^k\right)$$
The resulting $14 \times 14$ grid is bicubically interpolated to $224 \times 224$ and rendered as a heatmap overlay.

### 3.2 Token Attribution
Cross-modal attention weights from $A_{I \to T}$ are averaged across visual patches and attention heads to produce token-level attribution scores indicating which specific words prompted the classification decision.

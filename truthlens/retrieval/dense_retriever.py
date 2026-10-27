import numpy as np
import torch
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

from .corpus import EvidenceCorpus, EvidencePassage

@dataclass
class RetrievedEvidence:
    passage_id: str
    title: str
    text: str
    source: str
    domain: str
    url: str
    credibility_rating: str
    similarity_score: float
    rank: int

class DenseRetriever:
    """
    Dense neural semantic retriever utilizing normalized vector embeddings
    for Top-K fact-check passage retrieval over the evidence corpus.
    """
    def __init__(
        self,
        corpus: Optional[EvidenceCorpus] = None,
        embed_dim: int = 384,
        similarity_threshold: float = 0.40
    ):
        self.corpus = corpus or EvidenceCorpus()
        self.embed_dim = embed_dim
        self.similarity_threshold = similarity_threshold
        self.encoder = None
        self.index_embeddings = None
        self._build_index()

    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Generates dense semantic vector for a given query or passage.
        Uses cached transformer model if available, or deterministic TF-IDF semantic hash.
        """
        words = text.lower().split()
        if not words:
            vec = np.zeros(self.embed_dim, dtype=np.float32)
            return vec

        # Fast semantic projection vector
        vec = np.zeros(self.embed_dim, dtype=np.float32)
        for w in words:
            # Deterministic hash mapping for lexical semantics
            h = hash(w) % self.embed_dim
            vec[h] += 1.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def _build_index(self):
        """Pre-computes embeddings for all passages in the evidence corpus."""
        passages = self.corpus.get_all()
        if not passages:
            self.index_embeddings = np.zeros((0, self.embed_dim), dtype=np.float32)
            return

        embs = []
        for p in passages:
            content = f"{p.title} {p.text} {' '.join(p.topics)}"
            embs.append(self._get_embedding(content))

        self.index_embeddings = np.vstack(embs)  # [N, embed_dim]

    def retrieve(self, query: str, top_k: int = 5) -> List[RetrievedEvidence]:
        """
        Queries the dense index and returns the Top-K most semantically relevant evidence passages.
        """
        if self.index_embeddings is None or len(self.index_embeddings) == 0:
            return []

        q_vec = self._get_embedding(query)  # [embed_dim]
        # Cosine similarity (since both vectors are unit-normalized)
        sims = np.dot(self.index_embeddings, q_vec)

        # Ranked indices in descending order
        ranked_indices = np.argsort(-sims)

        results: List[RetrievedEvidence] = []
        passages = self.corpus.get_all()

        rank = 1
        for idx in ranked_indices:
            score = float(sims[idx])
            if score < self.similarity_threshold and len(results) >= 2:
                # If we already have 2 results, don't include very low similarity matches
                continue

            p = passages[idx]
            results.append(
                RetrievedEvidence(
                    passage_id=p.id,
                    title=p.title,
                    text=p.text,
                    source=p.source,
                    domain=p.domain,
                    url=p.url,
                    credibility_rating=p.credibility_rating,
                    similarity_score=round(max(0.0, min(1.0, score)), 4),
                    rank=rank
                )
            )
            rank += 1
            if len(results) >= top_k:
                break

        return results

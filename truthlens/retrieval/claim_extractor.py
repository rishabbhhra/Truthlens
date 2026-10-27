import re
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ExtractedClaim:
    claim_id: str
    text: str
    claim_type: str  # 'causation', 'historical_event', 'scientific_fact', 'quote', 'general'
    confidence: float
    verifiable: bool
    keywords: List[str]

class ClaimExtractor:
    """
    Extracts core verifiable claims and atomic propositions from multimodal captions,
    social media text, and headlines.
    """
    def __init__(self):
        # Patterns indicative of factual/causal assertions
        self.causation_patterns = [
            r"\b(?:causes|caused|leads to|resulting in|makes people|proves that)\b",
            r"\b(?:magnetic|microchip|poison|cure|secretly|hoax)\b"
        ]
        self.temporal_patterns = [
            r"\b(?:today|yesterday|just happened|breaking|recent|live footage|current)\b",
            r"\b(?:\d{4}|years ago|last month)\b"
        ]
        self.stop_words = {
            "a", "an", "the", "in", "on", "at", "for", "with", "about", "against",
            "between", "into", "through", "during", "before", "after", "above", "below",
            "to", "from", "up", "down", "is", "are", "was", "were", "be", "been", "being"
        }

    def extract_claims(self, text: str) -> List[ExtractedClaim]:
        """
        Segments and analyzes the text into verifiable atomic factual claims.
        """
        text = text.strip()
        if not text:
            return []

        # Split into sentence-like clauses
        raw_clauses = re.split(r"[.!?\n;]+", text)
        clauses = [c.strip() for c in raw_clauses if len(c.strip()) > 5]

        if not clauses:
            clauses = [text]

        extracted = []
        for idx, clause in enumerate(clauses):
            # Determine claim type
            claim_type = "general"
            for pat in self.causation_patterns:
                if re.search(pat, clause, re.IGNORECASE):
                    claim_type = "causation"
                    break

            for pat in self.temporal_patterns:
                if re.search(pat, clause, re.IGNORECASE):
                    if claim_type == "causation":
                        claim_type = "causation_and_temporal"
                    else:
                        claim_type = "historical_event"
                    break

            # Extract informative keywords
            words = re.findall(r"\b[A-Za-z0-9_-]{3,}\b", clause.lower())
            keywords = [w for w in words if w not in self.stop_words]

            # Verifiability heuristic
            verifiable = len(keywords) >= 2 or any(
                re.search(p, clause, re.IGNORECASE) for p in self.causation_patterns + self.temporal_patterns
            )
            confidence = min(0.98, 0.65 + (0.05 * len(keywords)))

            extracted.append(
                ExtractedClaim(
                    claim_id=f"CLM-{idx + 1:03d}",
                    text=clause,
                    claim_type=claim_type,
                    confidence=round(confidence, 3),
                    verifiable=verifiable,
                    keywords=keywords[:8]
                )
            )

        return extracted

from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

@dataclass
class EvidencePassage:
    id: str
    title: str
    text: str
    source: str
    domain: str
    url: str
    credibility_rating: str  # 'HIGH', 'VERY HIGH', 'OFFICIAL'
    stance_tag: str          # 'DEBUNK', 'CONFIRMATION', 'FACTUAL_RECORD'
    topics: List[str]

# Curated reference knowledge base aligned with MultiFC, FEVER, and Fakeddit benchmarks
DEFAULT_EVIDENCE_CORPUS: List[EvidencePassage] = [
    EvidencePassage(
        id="EVID-001",
        title="CDC Official Briefing: COVID-19 Vaccines Do Not Cause Magnetism",
        text="COVID-19 vaccines do not contain ingredients that produce an electromagnetic field or create magnetic properties at the injection site or anywhere in the body. Vaccines are free of metals, microchips, or magnetic components.",
        source="Centers for Disease Control and Prevention (CDC)",
        domain="cdc.gov",
        url="https://www.cdc.gov/coronavirus/2019-ncov/vaccines/facts.html",
        credibility_rating="OFFICIAL",
        stance_tag="DEBUNK",
        topics=["vaccine", "magnetic", "magnetism", "health", "covid"]
    ),
    EvidencePassage(
        id="EVID-002",
        title="Reuters Fact Check: Magnetic Arms Claim Debunked by Physicists",
        text="Videos showing magnets sticking to people's arms after vaccination are using surface tension, sweat, or adhesives. Medical experts and material scientists confirm no vaccine contains ferromagnetic materials in quantities capable of attracting magnets.",
        source="Reuters Fact Check",
        domain="reuters.com",
        url="https://www.reuters.com/article/factcheck-coronavirus-vaccine-magnet/",
        credibility_rating="VERY HIGH",
        stance_tag="DEBUNK",
        topics=["vaccine", "magnetic", "metal", "reuters", "arm"]
    ),
    EvidencePassage(
        id="EVID-003",
        title="AP News Archive: Historic 2014 Balkan Floods",
        text="The disastrous floods in Bosnia and Serbia occurred in May 2014 following record rainfall. Archival footage showing flooded cities, rooftop rescues, and damaged bridges has repeatedly been recirculated with false claims depicting modern weather events.",
        source="Associated Press (AP)",
        domain="apnews.com",
        url="https://apnews.com/article/fact-check-archive-balkan-floods-2014",
        credibility_rating="VERY HIGH",
        stance_tag="FACTUAL_RECORD",
        topics=["flood", "flooding", "balkans", "disaster", "2014", "weather", "archive"]
    ),
    EvidencePassage(
        id="EVID-004",
        title="NASA Artemis Mission Official Logs and Launch Verification",
        text="The NASA Artemis 1 Orion spacecraft successfully launched from Kennedy Space Center atop the Space Launch System (SLS) rocket, reaching lunar orbit and validating heat shield integrity upon re-entry.",
        source="National Aeronautics and Space Administration (NASA)",
        domain="nasa.gov",
        url="https://www.nasa.gov/specials/artemis-i/",
        credibility_rating="OFFICIAL",
        stance_tag="CONFIRMATION",
        topics=["nasa", "artemis", "space", "launch", "rocket", "moon"]
    ),
    EvidencePassage(
        id="EVID-005",
        title="Snopes Fact Check: AI-Generated Deepfake Video of World Leader",
        text="Forensic analysis of the viral video clip circulating on social media reveals facial warping, unnatural eye blink rates, and audio-visual lip sync mismatches consistent with diffusion-based generative AI synthesis.",
        source="Snopes Fact Check",
        domain="snopes.com",
        url="https://www.snopes.com/fact-check/ai-generated-video-speech/",
        credibility_rating="VERY HIGH",
        stance_tag="DEBUNK",
        topics=["ai", "deepfake", "synthetic", "speech", "diffusion", "generated"]
    ),
    EvidencePassage(
        id="EVID-006",
        title="World Health Organization (WHO) Misinformation Alert: 5G and Health",
        text="Extensive research by the WHO and independent radiation authorities confirms that electromagnetic radiation from 5G telecommunication networks does not transmit biological viruses or induce physical illness.",
        source="World Health Organization (WHO)",
        domain="who.int",
        url="https://www.who.int/news-room/questions-and-answers/item/radiation-5g-mobile-networks-and-health",
        credibility_rating="OFFICIAL",
        stance_tag="DEBUNK",
        topics=["5g", "health", "virus", "radiation", "who"]
    ),
    EvidencePassage(
        id="EVID-007",
        title="NOAA National Weather Service: Historic Hurricane Harvey Landfall",
        text="Hurricane Harvey made landfall in Texas in August 2017 as a Category 4 hurricane, producing catastrophic flooding in the Houston metropolitan area with up to 60 inches of rain over four days.",
        source="National Oceanic and Atmospheric Administration (NOAA)",
        domain="noaa.gov",
        url="https://www.weather.gov/hgx/hurricaneharvey",
        credibility_rating="OFFICIAL",
        stance_tag="FACTUAL_RECORD",
        topics=["hurricane", "harvey", "flood", "texas", "weather", "rain"]
    )
]

class EvidenceCorpus:
    """
    Manages the knowledge base of verified factual evidence.
    """
    def __init__(self, passages: Optional[List[EvidencePassage]] = None):
        self.passages: List[EvidencePassage] = passages if passages is not None else list(DEFAULT_EVIDENCE_CORPUS)

    def add_passage(self, passage: EvidencePassage):
        self.passages.append(passage)

    def get_all(self) -> List[EvidencePassage]:
        return self.passages

    def get_by_id(self, passage_id: str) -> Optional[EvidencePassage]:
        for p in self.passages:
            if p.id == passage_id:
                return p
        return None

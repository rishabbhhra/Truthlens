from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class MultimodalSample:
    sample_id: str
    headline: str
    image_url_or_path: str
    ground_truth_label: int  # 0: True, 1: Misleading, 2: False, 3: Unverifiable
    label_name: str
    benchmark_dataset: str   # 'Fakeddit', 'MultiFC', 'GroundMM'
    timestamp: str

BENCHMARK_PRESET_SAMPLES: List[MultimodalSample] = [
    MultimodalSample(
        sample_id="SAMPLE-01",
        headline="The COVID-19 vaccine causes magnetic powers in people and metals stick to the arm.",
        image_url_or_path="sample_vaccine_magnet.jpg",
        ground_truth_label=2,
        label_name="False / Mostly False",
        benchmark_dataset="Fakeddit / MultiFC",
        timestamp="2021-06-15T10:00:00Z"
    ),
    MultimodalSample(
        sample_id="SAMPLE-02",
        headline="Catastrophic flooding hits Europe today as emergency rescue teams scramble.",
        image_url_or_path="sample_flood_recycled.jpg",
        ground_truth_label=1,
        label_name="Misleading",
        benchmark_dataset="Fakeddit",
        timestamp="2024-03-12T14:30:00Z"
    ),
    MultimodalSample(
        sample_id="SAMPLE-03",
        headline="Leaked confidential broadcast: World leader admits covert alien technology program.",
        image_url_or_path="sample_deepfake_speech.jpg",
        ground_truth_label=2,
        label_name="False / Mostly False",
        benchmark_dataset="GroundMM",
        timestamp="2024-01-20T08:15:00Z"
    ),
    MultimodalSample(
        sample_id="SAMPLE-04",
        headline="NASA Artemis 1 rocket launches successfully from Kennedy Space Center toward lunar orbit.",
        image_url_or_path="sample_artemis_launch.jpg",
        ground_truth_label=0,
        label_name="True / Mostly True",
        benchmark_dataset="MultiFC",
        timestamp="2022-11-16T06:47:00Z"
    )
]

class DatasetLoader:
    """
    Manages multimodal benchmark dataset samples and validation partitions.
    """
    def __init__(self, samples: Optional[List[MultimodalSample]] = None):
        self.samples = samples or list(BENCHMARK_PRESET_SAMPLES)

    def get_sample_by_id(self, sample_id: str) -> Optional[MultimodalSample]:
        for s in self.samples:
            if s.sample_id == sample_id:
                return s
        return None

    def get_all_samples(self) -> List[MultimodalSample]:
        return self.samples

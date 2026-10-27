from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from pydantic import BaseModel, Field

CONFIG_FILE_PATH = Path(__file__).resolve().parent / "config.yaml"

class LossWeights(BaseModel):
    alpha_cls: float = 1.0
    beta_cons: float = 0.6
    gamma_evid: float = 0.4

class FocalLossConfig(BaseModel):
    gamma: float = 2.0
    alpha: Optional[List[float]] = None

class ModelConfig(BaseModel):
    text_encoder: str = "roberta-base"
    vision_encoder: str = "google/vit-base-patch16-224"
    embed_dim: int = 768
    cross_attention_heads: int = 8
    dropout: float = 0.1
    num_classes: int = 4
    class_labels: Dict[int, str] = {
        0: "True / Mostly True",
        1: "Misleading",
        2: "False / Mostly False",
        3: "Unverifiable"
    }
    loss_weights: LossWeights = Field(default_factory=LossWeights)
    focal_loss: FocalLossConfig = Field(default_factory=FocalLossConfig)

class RetrievalConfig(BaseModel):
    dense_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    top_k: int = 5
    similarity_threshold: float = 0.50
    faiss_index_type: str = "IndexFlatIP"
    device: str = "cpu"

class StanceThresholds(BaseModel):
    contradiction: float = 0.55
    entailment: float = 0.60

class VerificationConfig(BaseModel):
    nli_model_name: str = "cross-encoder/nli-distilroberta-base"
    stance_thresholds: StanceThresholds = Field(default_factory=StanceThresholds)

class ExplainabilityConfig(BaseModel):
    gradcam_target_layer: str = "vit.encoder.layer.-1"
    token_attribution_method: str = "attention_rollout"
    colormap: str = "turbo"

class LeakageAuditConfig(BaseModel):
    hash_algorithm: str = "dhash"
    hash_size: int = 8
    similarity_distance_threshold: int = 4

class DataConfig(BaseModel):
    image_size: int = 224
    max_text_tokens: int = 128
    leakage_audit: LeakageAuditConfig = Field(default_factory=LeakageAuditConfig)

class ServerConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

class TruthLensConfig(BaseModel):
    project_name: str = "TRUTHLENS-AI"
    version: str = "1.0.0"
    description: str = ""
    model: ModelConfig = Field(default_factory=ModelConfig)
    retrieval: RetrievalConfig = Field(default_factory=RetrievalConfig)
    verification: VerificationConfig = Field(default_factory=VerificationConfig)
    explainability: ExplainabilityConfig = Field(default_factory=ExplainabilityConfig)
    data: DataConfig = Field(default_factory=DataConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)

def load_config(path: Optional[Path] = None) -> TruthLensConfig:
    cfg_path = path or CONFIG_FILE_PATH
    if cfg_path.exists():
        with open(cfg_path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
            return TruthLensConfig(
                project_name=raw.get("project", {}).get("name", "TRUTHLENS-AI"),
                version=raw.get("project", {}).get("version", "1.0.0"),
                description=raw.get("project", {}).get("description", ""),
                model=ModelConfig(**raw.get("model", {})),
                retrieval=RetrievalConfig(**raw.get("retrieval", {})),
                verification=VerificationConfig(**raw.get("verification", {})),
                explainability=ExplainabilityConfig(**raw.get("explainability", {})),
                data=DataConfig(**raw.get("data", {})),
                server=ServerConfig(**raw.get("server", {}))
            )
    return TruthLensConfig()

# Global default config instance
settings = load_config()

import torch
import pytest
from truthlens.models.encoders import LightweightTextEncoder, LightweightVisionEncoder
from truthlens.models.cross_attention import BidirectionalCrossAttention
from truthlens.models.consistency import CrossModalConsistencyHead, ContrastiveConsistencyLoss
from truthlens.models.multi_task import FocalLoss, MultiTaskPredictionHead, JointMultiTaskLoss
from truthlens.models.full_model import TruthLensModel

def test_encoders_output_shapes():
    B, seq_len, d = 2, 16, 768
    text_enc = LightweightTextEncoder(embed_dim=d)
    vision_enc = LightweightVisionEncoder(embed_dim=d)

    input_ids = torch.randint(0, 1000, (B, seq_len))
    pixel_values = torch.randn(B, 3, 224, 224)

    H_text = text_enc(input_ids)
    H_img = vision_enc(pixel_values)

    assert H_text.shape == (B, seq_len, d), f"Expected {(B, seq_len, d)}, got {H_text.shape}"
    assert H_img.shape == (B, 197, d), f"Expected {(B, 197, d)}, got {H_img.shape}"

def test_bidirectional_cross_attention():
    B, n, m, d = 2, 16, 197, 768
    cross_attn = BidirectionalCrossAttention(embed_dim=d, num_heads=8)

    H_text = torch.randn(B, n, d)
    H_img = torch.randn(B, m, d)

    fused_text, fused_img, attn_maps = cross_attn(H_text, H_img)

    assert fused_text.shape == (B, n, d)
    assert fused_img.shape == (B, m, d)
    assert "attn_t2i" in attn_maps
    assert "attn_i2t" in attn_maps
    assert attn_maps["attn_t2i"].shape == (B, 8, n, m)
    assert attn_maps["attn_i2t"].shape == (B, 8, m, n)

def test_consistency_head_and_contrastive_loss():
    B, d = 2, 768
    cons_head = CrossModalConsistencyHead(embed_dim=d, projection_dim=256)
    cons_loss_fn = ContrastiveConsistencyLoss(margin=0.2)

    text_pooled = torch.randn(B, d)
    img_pooled = torch.randn(B, d)

    logits, cos_sim, (z_t, z_v) = cons_head(text_pooled, img_pooled)
    assert logits.shape == (B, 1)
    assert cos_sim.shape == (B,)

    labels = torch.tensor([1.0, 0.0])
    loss = cons_loss_fn(z_t, z_v, labels)
    assert loss.item() >= 0.0

def test_focal_loss_and_multitask_head():
    B, d, num_classes = 4, 768, 4
    mt_head = MultiTaskPredictionHead(embed_dim=d, num_classes=num_classes)
    focal_loss = FocalLoss(gamma=2.0)

    text_pooled = torch.randn(B, d)
    img_pooled = torch.randn(B, d)
    cons_prob = torch.rand(B, 1)

    outputs = mt_head(text_pooled, img_pooled, cons_prob)
    assert outputs["risk_logits"].shape == (B, num_classes)
    assert outputs["risk_probs"].shape == (B, num_classes)

    targets = torch.tensor([0, 1, 2, 3])
    loss = focal_loss(outputs["risk_logits"], targets)
    assert loss.item() > 0.0

def test_full_truthlens_model_forward():
    B, seq_len = 2, 20
    model = TruthLensModel(embed_dim=768, num_classes=4, cross_heads=8)

    input_ids = torch.randint(0, 1000, (B, seq_len))
    pixel_values = torch.randn(B, 3, 224, 224)
    attention_mask = torch.ones(B, seq_len)

    outputs = model(input_ids, pixel_values, attention_mask=attention_mask)
    assert "risk_logits" in outputs
    assert "risk_probs" in outputs
    assert "consistency_score" in outputs
    assert outputs["risk_probs"].shape == (B, 4)

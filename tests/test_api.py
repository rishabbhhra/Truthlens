import pytest
from fastapi.testclient import TestClient
from truthlens.api.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "TRUTHLENS-AI"
    assert "endpoints" in data

def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "acceleration_device" in data

def test_api_benchmarks():
    response = client.get("/api/v1/benchmark/summary")
    assert response.status_code == 200
    data = response.json()
    assert len(data["benchmarks"]) == 4

def test_api_analyze_json():
    payload = {
        "text": "The vaccine causes magnetic powers in people.",
        "sample_id": "test_sample"
    }
    response = client.post("/api/v1/analyze-json", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "confidence_score" in data
    assert "consistency_score" in data
    assert "visual_explainability" in data
    assert "overlay_data_uri" in data["visual_explainability"]

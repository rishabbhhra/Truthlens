import io
import base64
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from PIL import Image, ImageDraw, ImageFont
from typing import Optional

from ..schemas import AnalysisResponse, AnalyzeTextRequest
from ...pipeline.orchestrator import TruthLensPipeline

router = APIRouter(prefix="/v1", tags=["Analysis"])

# Singleton pipeline instance
_pipeline: Optional[TruthLensPipeline] = None

def get_pipeline() -> TruthLensPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = TruthLensPipeline()
    return _pipeline

def _create_sample_image(text_label: str) -> Image.Image:
    """Creates a synthetic illustrative test image with geometric patterns and labels."""
    img = Image.new("RGB", (224, 224), color=(30, 41, 59))
    draw = ImageDraw.Draw(img)
    # Draw geometric forensic grid
    for i in range(0, 224, 28):
        draw.line([(i, 0), (i, 224)], fill=(51, 65, 85), width=1)
        draw.line([(0, i), (224, i)], fill=(51, 65, 85), width=1)

    draw.rectangle([40, 40, 184, 184], outline=(59, 130, 246), width=3)
    draw.ellipse([70, 70, 154, 154], fill=(99, 102, 241), outline=(244, 63, 94), width=2)
    draw.text((25, 195), text_label[:28], fill=(241, 245, 249))
    return img

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_multimodal(
    text: str = Form(..., description="Post caption, headline, or claim statement"),
    image: Optional[UploadFile] = File(None, description="Image file to analyze")
):
    """
    Executes full TRUTHLENS-AI multimodal misinformation analysis.
    """
    pipeline = get_pipeline()

    if image is not None:
        try:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    else:
        # Fallback to generated forensic canvas if only text submitted
        pil_image = _create_sample_image(text)

    report = pipeline.analyze(image=pil_image, text=text)
    return report

@router.post("/analyze-json", response_model=AnalysisResponse)
async def analyze_json(payload: AnalyzeTextRequest):
    """
    JSON-based analysis endpoint supporting Base64 images or preset test cases.
    """
    pipeline = get_pipeline()

    if payload.image_base64:
        try:
            raw_b64 = payload.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]
            image_bytes = base64.b64decode(raw_b64)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")
    else:
        label = payload.sample_id or payload.text[:20]
        pil_image = _create_sample_image(label)

    report = pipeline.analyze(image=pil_image, text=payload.text)
    return report

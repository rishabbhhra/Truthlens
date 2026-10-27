import io
import base64
import hashlib
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from PIL import Image, ImageDraw
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


def _create_sample_image(text_label: str = "", sample_id: str = "") -> Image.Image:
    """
    Creates a realistic-looking synthetic forensic canvas image for text-only
    analysis or when the image cannot be decoded. Uses sample_id to generate
    a deterministic, visually distinct image per sample.
    """
    # Pick color palette based on sample ID / hash
    seed = int(hashlib.md5((sample_id or text_label[:20]).encode()).hexdigest(), 16) % 256

    palettes = [
        # Vaccine / Medical (red)
        {"bg": (15, 23, 42), "primary": (239, 68, 68), "accent": (59, 130, 246), "label": (252, 165, 165)},
        # Flood / Environment (blue)
        {"bg": (8, 47, 73), "primary": (14, 165, 233), "accent": (34, 211, 238), "label": (186, 230, 253)},
        # Deepfake / AI (purple)
        {"bg": (24, 24, 27), "primary": (168, 85, 247), "accent": (236, 72, 153), "label": (233, 213, 255)},
        # Verified / Science (green)
        {"bg": (2, 6, 23), "primary": (16, 185, 129), "accent": (96, 165, 250), "label": (167, 243, 208)},
    ]
    pal = palettes[seed % len(palettes)]

    img = Image.new("RGB", (224, 224), color=pal["bg"])
    draw = ImageDraw.Draw(img)

    # Grid lines
    for i in range(0, 224, 16):
        draw.line([(i, 0), (i, 224)], fill=tuple(max(0, c - 8) for c in pal["bg"]), width=1)
        draw.line([(0, i), (224, i)], fill=tuple(max(0, c - 8) for c in pal["bg"]), width=1)

    # Outer forensic frame
    draw.rectangle([8, 8, 216, 216], outline=pal["primary"], width=2)

    # Central graphic — unique per palette
    if seed % 4 == 0:
        # Syringe / medical
        draw.rectangle([94, 45, 130, 150], fill=(30, 58, 138), outline=pal["primary"], width=2)
        draw.rectangle([101, 32, 123, 48], fill=(148, 163, 184))
        draw.line([(112, 150), (112, 190)], fill=pal["primary"], width=3)
        draw.rectangle([98, 75, 126, 110], fill=pal["primary"])
    elif seed % 4 == 1:
        # Water waves / flood
        draw.polygon([(112, 55), (65, 100), (159, 100)], fill=(185, 28, 28))
        draw.rectangle([75, 100, 149, 145], fill=(100, 116, 139))
        for y in range(140, 210, 14):
            draw.arc([0, y - 8, 224, y + 8], start=0, end=180, fill=pal["primary"], width=2)
    elif seed % 4 == 2:
        # Face wireframe / deepfake
        draw.ellipse([60, 42, 164, 170], outline=pal["primary"], width=2)
        draw.ellipse([80, 88, 100, 108], fill=pal["accent"])
        draw.ellipse([124, 88, 144, 108], fill=pal["accent"])
        draw.arc([88, 128, 138, 158], start=0, end=180, fill=pal["accent"], width=2)
        for i in range(20, 200, 20):
            draw.line([(i, 42), (i, 170)], fill=tuple(max(0, c - 60) for c in pal["bg"]), width=1)
    else:
        # Rocket / verified science
        draw.polygon([(112, 42), (96, 145), (128, 145)], fill=(241, 245, 249), outline=pal["accent"])
        draw.polygon([(88, 145), (112, 182), (136, 145)], fill=(249, 115, 22))
        draw.polygon([(98, 145), (112, 168), (126, 145)], fill=(253, 224, 71))
        for pos in [(30, 30), (190, 25), (45, 80), (185, 70), (155, 180), (30, 160)]:
            draw.ellipse([pos[0], pos[1], pos[0] + 2, pos[1] + 2], fill=(255, 255, 255))

    # Corner forensic markers
    for (cx, cy) in [(8, 8), (208, 8), (8, 208), (208, 208)]:
        draw.line([(cx, cy), (cx + 10, cy)], fill=pal["accent"], width=2)
        draw.line([(cx, cy), (cx, cy + 10)], fill=pal["accent"], width=2)

    return img


def _decode_image_base64(raw: str) -> Optional[Image.Image]:
    """
    Robustly decode a base64 image data URI. Returns None if it's an SVG
    or otherwise non-decodable format (caller falls back to generated image).
    """
    if not raw:
        return None

    # Reject SVG / non-raster formats gracefully
    if raw.startswith("data:image/svg") or raw.startswith("data:text/"):
        return None

    try:
        if "," in raw:
            raw = raw.split(",", 1)[1]
        image_bytes = base64.b64decode(raw + "==")  # pad to avoid binascii errors
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return None


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_multimodal(
    text: str = Form(..., description="Post caption, headline, or claim statement"),
    image: Optional[UploadFile] = File(None, description="Image file to analyze")
):
    """
    Executes full TRUTHLENS-AI multimodal misinformation analysis (multipart form).
    """
    pipeline = get_pipeline()

    if image is not None:
        try:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    else:
        pil_image = _create_sample_image(text_label=text)

    report = pipeline.analyze(image=pil_image, text=text)
    return report


@router.post("/analyze-json", response_model=AnalysisResponse)
async def analyze_json(payload: AnalyzeTextRequest):
    """
    JSON-based analysis endpoint. Accepts optional Base64-encoded PNG/JPEG images.
    Falls back to a deterministic synthetic forensic canvas if no valid image is provided
    (e.g. SVG preview placeholders from the frontend preset selector).
    """
    pipeline = get_pipeline()

    pil_image = None

    if payload.image_base64:
        pil_image = _decode_image_base64(payload.image_base64)

    if pil_image is None:
        # Graceful fallback: generate a forensic-style canvas tied to sample/claim
        pil_image = _create_sample_image(
            text_label=payload.text or "",
            sample_id=payload.sample_id or ""
        )

    report = pipeline.analyze(image=pil_image, text=payload.text)
    return report

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import sys
import platform

from config.settings import settings
from .routes.analyze import router as analyze_router
from .routes.retrieval import router as retrieval_router
from .routes.audit import router as audit_router
from .routes.benchmark import router as benchmark_router

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="Backend API for TRUTHLENS-AI: Evidence-Grounded Multimodal Misinformation Detection & Grounding"
)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

# Register route modules
app.include_router(analyze_router, prefix="/api")
app.include_router(retrieval_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(benchmark_router, prefix="/api")

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

from fastapi import Request

@app.get("/")
def read_root(request: Request):
    accept_header = request.headers.get("accept", "")
    index_file = DIST_DIR / "index.html"
    
    # If a browser explicitly asks for text/html, serve the React single page app
    if "text/html" in accept_header and "application/json" not in accept_header and index_file.exists():
        return FileResponse(index_file)
    
    # Return JSON API metadata by default for API consumers, tests, and curls
    return {
        "project": settings.project_name,
        "version": settings.version,
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "analyze": "/api/v1/analyze",
            "analyze_json": "/api/v1/analyze-json",
            "extract_claims": "/api/v1/extract-claims",
            "retrieve_evidence": "/api/v1/retrieve-evidence",
            "leakage_audit": "/api/v1/audit/leakage",
            "benchmarks": "/api/v1/benchmark/summary",
            "health": "/api/v1/health"
        }
    }




@app.get("/api/v1/health")
def health_check():
    mps_available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    cuda_available = torch.cuda.is_available()
    device = "cuda" if cuda_available else ("mps" if mps_available else "cpu")

    return {
        "status": "healthy",
        "version": settings.version,
        "platform": platform.platform(),
        "python_version": sys.version.split()[0],
        "torch_version": torch.__version__,
        "acceleration_device": device,
        "mps_available": mps_available,
        "cuda_available": cuda_available
    }

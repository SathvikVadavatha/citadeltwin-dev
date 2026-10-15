"""
CitadelTwin Blueprint-to-3D Pipeline — FastAPI Server
======================================================

Single endpoint ``POST /process`` that accepts a blueprint image URL,
runs the 6-stage pipeline in a background thread, and returns a GLB + metadata.
"""

import logging
import time
import io
import asyncio
from concurrent.futures import ThreadPoolExecutor

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

import easyocr
from ultralytics import YOLO

from pipeline.stage1_yolo import run as stage1
from pipeline.stage2_ocr import run as stage2
from pipeline.stage3_voronoi import run as stage3
from pipeline.stage4_topology import run as stage4
from pipeline.stage5_export import run as stage5

# ---------------------------------------------------------------------------
# Logging & Threading
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("blueprint_pipeline")

executor = ThreadPoolExecutor(max_workers=2)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CitadelTwin Blueprint-to-3D Pipeline",
    version="1.0.0",
    description="Converts 2D architectural blueprints into interactive 3D GLB models.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
_yolo_model = None
_ocr_reader = None

@app.on_event("startup")
async def preload_models():
    global _yolo_model, _ocr_reader
    logger.info("Pre-loading YOLO model...")
    try:
        from pipeline.stage1_yolo import _load_floor_plan_model
        _yolo_model = _load_floor_plan_model()
        logger.info("YOLO model loaded successfully")
    except Exception as e:
        logger.warning(f"YOLO preload failed: {e}")
    
    logger.info("Pre-loading EasyOCR reader...")
    try:
        _ocr_reader = easyocr.Reader(['en'], gpu=False)
        logger.info("EasyOCR reader loaded successfully")
    except Exception as e:
        logger.warning(f"EasyOCR preload failed: {e}")
    
    logger.info("Model preloading complete")


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class ProcessRequest(BaseModel):
    image_url: str  # Supabase Storage public URL


class RoomCenter(BaseModel):
    x: float
    y: float


class RoomInfo(BaseModel):
    id: str
    label: str
    area_sqft: float
    center: RoomCenter
    color: list[int]


class WallInfo(BaseModel):
    x: float
    y: float
    width: float
    height: float


class WindowInfo(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float



class PipelineMetadata(BaseModel):
    building_width_ft: float
    building_height_ft: float
    total_rooms: int
    wall_mesh_count: int
    door_count: int
    window_count: int
    validation_warnings: list[str]


class DimensionPoint(BaseModel):
    x: float
    y: float
    z: float


class DimensionAnnotation(BaseModel):
    position: DimensionPoint
    label: str
    kind: str
    # Set only on wall_length entries (see stage5_export.py); optional so
    # entries without it still validate.
    is_perimeter: bool | None = None
    # Endpoints of the span a room_width / room_height / wall_length label
    # measures; absent on room_area entries.
    line_start: DimensionPoint | None = None
    line_end: DimensionPoint | None = None


class ProcessResponse(BaseModel):
    glb_base64: str
    rooms: list[RoomInfo]
    walls: list[WallInfo]
    windows: list[WindowInfo]
    dimensions: list[DimensionAnnotation]
    metadata: PipelineMetadata


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "yolo_loaded": _yolo_model is not None,
        "ocr_loaded": _ocr_reader is not None
    }


# ---------------------------------------------------------------------------
# Pipeline Engine (Synchronous, runs in ThreadPool)
# ---------------------------------------------------------------------------
def run_pipeline(image_url: str) -> dict:
    """
    Core pipeline logic executed in a background thread to prevent blocking
     the main event loop during CPU-intensive CV operations.
    """
    t0 = time.perf_counter()

    # --- 1. Download image ---
    logger.info("Downloading image: %s", image_url)
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(image_url)
            resp.raise_for_status()
            img_bytes = resp.content
    except Exception as exc:
        logger.error("Failed to download image: %s", exc)
        raise Exception(f"Cannot download image: {exc}")

    # Decode to OpenCV array
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise Exception("Could not decode image")

    # --- 2. Run stages ---
    ctx = {
        "yolo_model": _yolo_model,
        "ocr_reader": _ocr_reader
    }

    logger.info("▶ Processing pipeline starting...")
    ctx = stage1(image, ctx)
    ctx = stage2(image, ctx)
    ctx = stage3(image, ctx)
    ctx = stage4(image, ctx)
    ctx = stage5(image, ctx)

    elapsed = time.perf_counter() - t0
    logger.info("Pipeline engine complete in %.2f s", elapsed)

    # Filter windows based on threshold or LLM confirmation
    valid_windows = []
    for w in ctx.get("window_bboxes", []):
        if w.get("confidence", 1.0) >= 0.3 or w.get("llm_confirmed"):
            valid_windows.append(w)

    # Transform internal ctx into response-ready dict
    return {
        "glb_base64": ctx["glb_base64"],
        "rooms": ctx["room_output"],
        "walls": ctx["wall_output"],
        "windows": valid_windows,
        "dimensions": ctx.get("dimension_annotations", []),
        "metadata": {
            "building_width_ft": ctx["building_width_ft"],
            "building_height_ft": ctx["building_height_ft"],
            "total_rooms": len(ctx["rooms"]),
            "wall_mesh_count": ctx["wall_mesh_count"],
            "door_count": ctx.get("door_count", 0),
            "window_count": ctx.get("window_count", 0),
            "validation_warnings": ctx.get("validation_warnings", []),
        }
    }


# ---------------------------------------------------------------------------
# Main Router
# ---------------------------------------------------------------------------
@app.post("/process", response_model=ProcessResponse)
async def process_blueprint(req: ProcessRequest):
    """
    Asynchronous entrance point that offloads work to the ThreadPool.
    """
    loop = asyncio.get_event_loop()
    
    try:
        # Offload CPU-bound CV tasks to threads
        result = await loop.run_in_executor(executor, run_pipeline, req.image_url)
        
        # Build pydantic response
        return ProcessResponse(
            glb_base64=result["glb_base64"],
            rooms=[RoomInfo(**r) for r in result["rooms"]],
            walls=[WallInfo(**w) for w in result["walls"]],
            windows=[WindowInfo(**w) for w in result["windows"]],
            dimensions=[DimensionAnnotation(**d) for d in result.get("dimensions", [])],
            metadata=PipelineMetadata(**result["metadata"])
        )
        
    except Exception as exc:
        logger.exception("Pipeline execution failed")
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=300)

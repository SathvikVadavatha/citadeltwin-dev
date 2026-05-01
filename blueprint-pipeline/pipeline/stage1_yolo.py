"""
Stage 1 — Wall Detection (Floor-Plan YOLO + morphological refinement)
======================================================================

Uses the floor-plan-specific YOLOv8 model from HuggingFace:
  sanatladkat/floor-plan-object-detection

Class map (9 classes):
  0: Column        1: Curtain Wall   2: Dimension
  3: Door          4: Railing        5: Sliding Door
  6: Stair Case    7: Wall           8: Window

Falls back to improved morphological-only detection if the model
download fails.

Wall boundary construction follows the notebook approach:
  1. YOLO wall lines drawn along the longer axis of each wall bbox
  2. Thick lines extracted from the original image via thresholding
  3. Bitwise-OR of both masks
  4. Door/window openings closed (filled white)
  5. Building perimeter sealed with a bounding-rect stroke
"""

import logging
import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Class indices for sanatladkat/floor-plan-object-detection
# ---------------------------------------------------------------------------
CLS_COLUMN       = 0
CLS_CURTAIN_WALL = 1
CLS_DIMENSION    = 2
CLS_DOOR         = 3
CLS_RAILING      = 4
CLS_SLIDING_DOOR = 5
CLS_STAIR        = 6
CLS_WALL         = 7
CLS_WINDOW       = 8

WALL_CLASS_IDS    = {CLS_WALL, CLS_CURTAIN_WALL}
DOOR_CLASS_IDS    = {CLS_DOOR, CLS_SLIDING_DOOR}
WINDOW_CLASS_IDS  = {CLS_WINDOW}
EXCLUDE_CLASS_IDS = {CLS_DIMENSION, CLS_RAILING, CLS_COLUMN}

# Module-level cache so the model only downloads once per container lifetime
_CACHED_MODEL = None


# ---------------------------------------------------------------------------
# Model loader
# ---------------------------------------------------------------------------

def _load_floor_plan_model():
    """
    Load the floor-plan-specific YOLO model from the bundled weights file.
    Result is cached in the module-level _CACHED_MODEL variable.
    Raises on failure so the caller can fall back to morphological detection.
    """
    global _CACHED_MODEL
    if _CACHED_MODEL is not None:
        return _CACHED_MODEL

    from ultralytics import YOLO
    from huggingface_hub import hf_hub_download

    logger.info("Loading floor-plan YOLO model from: SathvikVadavatha/floor-plan-detection")
    weights_path = hf_hub_download(
        repo_id="SathvikVadavatha/floor-plan-detection",
        filename="best.pt"
    )
    _CACHED_MODEL = YOLO(weights_path)
    return _CACHED_MODEL

# ---------------------------------------------------------------------------
# YOLO inference
# ---------------------------------------------------------------------------

def _run_yolo(image: np.ndarray, model) -> dict:
    """
    Run the floor-plan YOLO model and bucket detections by semantic role.
    Returns a dict with keys: walls, doors, windows, dimensions, other.
    """
    results = model(image, verbose=False)

    detections: dict[str, list] = {
        "walls":      [],
        "doors":      [],
        "windows":    [],
        "dimensions": [],
        "other":      [],
    }

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            det = {"bbox": [x1, y1, x2, y2], "confidence": conf, "class_id": cls_id}

            if cls_id in WALL_CLASS_IDS:
                detections["walls"].append(det)
            elif cls_id in DOOR_CLASS_IDS:
                detections["doors"].append(det)
            elif cls_id in WINDOW_CLASS_IDS:
                detections["windows"].append(det)
            elif cls_id in EXCLUDE_CLASS_IDS:
                detections["dimensions"].append(det)
            else:
                detections["other"].append(det)

    logger.info(
        "YOLO floor-plan detection: walls=%d doors=%d windows=%d excluded=%d",
        len(detections["walls"]),
        len(detections["doors"]),
        len(detections["windows"]),
        len(detections["dimensions"]),
    )
    return detections


# ---------------------------------------------------------------------------
# Boundary construction (notebook approach)
# ---------------------------------------------------------------------------

def _build_yolo_wall_lines(image: np.ndarray, detections: dict) -> np.ndarray:
    """
    For each wall bounding box, draw a line along its longer axis.
    Horizontal wall → horizontal centre line; vertical wall → vertical centre line.
    Thickness = 4 px.
    """
    h, w = image.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    for det in detections.get("walls", []):
        x1, y1, x2, y2 = det["bbox"]
        bw = x2 - x1
        bh = y2 - y1
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        if bw >= bh:
            # Horizontal wall
            cv2.line(mask, (x1, cy), (x2, cy), 255, thickness=4)
        else:
            # Vertical wall
            cv2.line(mask, (cx, y1), (cx, y2), 255, thickness=4)

    return mask


def _build_thick_line_mask(image: np.ndarray) -> np.ndarray:
    """
    Extract thick lines from the original image using thresholding +
    morphological opening, then filter contours by area OR aspect ratio.
    This catches interior walls and lines the YOLO model may have missed.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Threshold: pixels darker than 180 → foreground
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

    # Morphological opening to remove tiny noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    # Keep contours that look like walls (large area OR long/thin aspect ratio)
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    mask = np.zeros_like(opened)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect = max(cw, ch) / (min(cw, ch) + 1e-6)
        if area > 300 or aspect > 4:
            cv2.drawContours(mask, [cnt], -1, 255, thickness=cv2.FILLED)

    return mask


def _build_combined_boundary(image: np.ndarray, detections: dict) -> np.ndarray:
    """
    Full notebook-style boundary construction:
      1. YOLO wall lines
      2. Thick-line mask from image
      3. Bitwise-OR
      4. Close door openings
      5. Close window openings
      6. Seal building perimeter
    """
    yolo_walls  = _build_yolo_wall_lines(image, detections)
    thick_walls = _build_thick_line_mask(image)
    combined    = cv2.bitwise_or(yolo_walls, thick_walls)

    # Erase dimension annotation regions from boundary
    # These are text/arrow annotations that get incorrectly extruded as walls
    for det in detections.get("dimensions", []):
        x1, y1, x2, y2 = det["bbox"]
        # Add small padding to fully erase annotation
        pad = 4
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(combined.shape[1], x2 + pad)
        y2 = min(combined.shape[0], y2 + pad)
        combined[y1:y2, x1:x2] = 0

    # Close door openings — fill each door bbox with white
    for det in detections.get("doors", []):
        x1, y1, x2, y2 = det["bbox"]
        cv2.rectangle(combined, (x1, y1), (x2, y2), 255, thickness=cv2.FILLED)

    # Close window openings — fill each window bbox with white
    for det in detections.get("windows", []):
        x1, y1, x2, y2 = det["bbox"]
        cv2.rectangle(combined, (x1, y1), (x2, y2), 255, thickness=cv2.FILLED)

    # Seal building perimeter: bounding rect of all wall pixels → draw rectangle
    wall_pixels = cv2.findNonZero(combined)
    if wall_pixels is not None:
        rx, ry, rw, rh = cv2.boundingRect(wall_pixels)
        cv2.rectangle(combined, (rx, ry), (rx + rw, ry + rh), 255, thickness=5)

    logger.info("Combined boundary: %d wall pixels after full construction", int(np.sum(combined > 0)))
    return combined


# ---------------------------------------------------------------------------
# Improved morphological fallback (for when YOLO model is unavailable)
# ---------------------------------------------------------------------------

def _morphological_fallback(image: np.ndarray) -> np.ndarray:
    """
    Improved morphological wall detection that handles gray-filled walls
    (RGB 80-130) against white backgrounds (240+).
    Used only when the floor-plan YOLO model cannot be loaded.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Dark pixels (walls) vs white background
    _, dark_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # Adaptive threshold catches thin interior wall edges
    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 15, 4
    )

    combined = cv2.bitwise_or(dark_mask, adaptive)

    # Remove noise
    kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    opened = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel_open)

    # Fill thick wall bodies
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_close)

    # Keep contours that are wall-sized
    contours, _ = cv2.findContours(
        closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    wall_mask = np.zeros_like(closed)
    image_area = image.shape[0] * image.shape[1]
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if 400 < area < image_area * 0.8:
            cv2.drawContours(wall_mask, [cnt], -1, 255, -1)

    logger.info("Morphological fallback: %d wall pixels found", int(np.sum(wall_mask > 0)))
    return wall_mask


# ---------------------------------------------------------------------------
# Bbox helpers
# ---------------------------------------------------------------------------

def _extract_door_bboxes(detections: dict | None) -> list[dict]:
    if detections is None:
        return []
    doors = []
    for det in detections.get("doors", []):
        x1, y1, x2, y2 = det["bbox"]
        doors.append({"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1, "confidence": det["confidence"]})
    return doors


def _extract_window_bboxes(detections: dict | None) -> list[dict]:
    if detections is None:
        return []
    windows = []
    for det in detections.get("windows", []):
        x1, y1, x2, y2 = det["bbox"]
        windows.append({"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1, "confidence": det["confidence"]})
    return windows


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run(image: np.ndarray, context: dict) -> dict:
    """
    Stage 1 entry point.

    Parameters
    ----------
    image : np.ndarray
        BGR image (as read by cv2.imread).
    context : dict
        Pipeline context (may be empty for the first stage).
        May contain a pre-loaded ``yolo_model`` key to skip download.

    Returns
    -------
    dict
        Updated context with keys:
        - ``combined_boundary``     — binary wall mask (np.ndarray, uint8)
        - ``door_bboxes``           — list of door bbox dicts
        - ``window_bboxes``         — list of window bbox dicts
        - ``yolo_detections``       — raw detection dict (or None if fallback)
        - ``wall_detection_method`` — str describing method used
    """
    ctx = {**context}

    detections = None
    method = "morphological_fallback"

    # 1. Try to load the floor-plan-specific YOLO model and run inference
    try:
        model = ctx.get("yolo_model") or _load_floor_plan_model()
        detections = _run_yolo(image, model)

        if len(detections.get("walls", [])) > 0:
            combined = _build_combined_boundary(image, detections)
            method = "floor_plan_yolo+notebook_boundary"
        else:
            logger.warning(
                "Floor-plan YOLO found 0 wall detections — falling back to morphological detection"
            )
            combined = _morphological_fallback(image)
            method = "morphological_fallback_after_yolo"

    except Exception as exc:
        logger.warning(
            "Floor-plan YOLO model unavailable (%s) — using morphological fallback", exc
        )
        combined = _morphological_fallback(image)
        method = "morphological_fallback"

    # 2. Ensure binary
    _, combined = cv2.threshold(combined, 127, 255, cv2.THRESH_BINARY)

    # 3. Safety check
    wall_pixel_count = int(np.sum(combined > 0))
    if wall_pixel_count == 0:
        logger.warning(
            "Wall detection produced 0 wall pixels (method=%s). "
            "The blueprint may have unusual colours or very light walls.", method
        )

    ctx["combined_boundary"]     = combined
    ctx["door_bboxes"]           = _extract_door_bboxes(detections)
    ctx["window_bboxes"]         = _extract_window_bboxes(detections)
    ctx["yolo_detections"]       = detections
    ctx["wall_detection_method"] = method
    ctx["image_height"], ctx["image_width"] = image.shape[:2]

    logger.info(
        "Stage 1 complete: method=%s wall_pixels=%d doors=%d windows=%d",
        method,
        wall_pixel_count,
        len(ctx["door_bboxes"]),
        len(ctx["window_bboxes"]),
    )
    return ctx

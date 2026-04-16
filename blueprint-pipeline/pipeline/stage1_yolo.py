"""
Stage 1 — Wall Detection (YOLOv8 + morphological refinement)
=============================================================

Detects wall, door, window, and dimension bounding boxes using YOLOv8.
Falls back to morphological-only detection if YOLO model download fails.
Produces a combined binary wall mask.
"""

import logging
import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# YOLO class names we care about (from a floor-plan-specific checkpoint)
# ---------------------------------------------------------------------------
WALL_CLASSES = {"wall", "walls", "Wall"}
DOOR_CLASSES = {"door", "doors", "Door"}
WINDOW_CLASSES = {"window", "windows", "Window"}
DIMENSION_CLASSES = {"dimension", "dimensions", "Dimension", "text", "annotation"}


def _try_yolo_detection(image: np.ndarray, model=None) -> dict | None:
    """
    Attempt to run YOLOv8 inference.  Returns a dict of labelled detections
    or None if the model cannot be loaded (network issue, etc.).
    """
    try:
        from ultralytics import YOLO

        # Use provided model or load a fresh one
        if model is None:
            # Use a generic YOLOv8 model — in production replace with a
            # floor-plan-specific fine-tuned checkpoint from HuggingFace.
            model = YOLO("yolov8n.pt")
            
        results = model(image, verbose=False)

        detections: dict[str, list] = {
            "walls": [],
            "doors": [],
            "windows": [],
            "dimensions": [],
            "other": [],
        }

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = result.names.get(cls_id, "unknown").lower()
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf[0])
                det = {"bbox": [x1, y1, x2, y2], "confidence": conf, "class": cls_name}

                # Map generic YOLO classes to our semantic categories.
                # A floor-plan-specific model would have Wall/Door/Window/Dimension
                # classes directly.  With a generic model we do best-effort mapping.
                if cls_name in WALL_CLASSES:
                    detections["walls"].append(det)
                elif cls_name in DOOR_CLASSES:
                    detections["doors"].append(det)
                elif cls_name in WINDOW_CLASSES:
                    detections["windows"].append(det)
                elif cls_name in DIMENSION_CLASSES:
                    detections["dimensions"].append(det)
                else:
                    detections["other"].append(det)

        logger.info(
            "YOLO detection complete: walls=%d doors=%d windows=%d dims=%d",
            len(detections["walls"]),
            len(detections["doors"]),
            len(detections["windows"]),
            len(detections["dimensions"]),
        )
        return detections

    except Exception as exc:
        logger.warning("YOLO model load/inference failed — falling back to morphological detection: %s", exc)
        return None


def _morphological_wall_mask(gray: np.ndarray) -> np.ndarray:
    """
    Detect thick lines (walls) using adaptive thresholding + morphological
    opening.  Works on any blueprint even without a YOLO model.
    """
    # Adaptive threshold → binary
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 8
    )

    # Morphological opening to keep only thick lines (walls)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)

    # Filter small contours — walls have significant area
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    mask = np.zeros_like(gray)
    for cnt in contours:
        if cv2.contourArea(cnt) >= 300:
            cv2.drawContours(mask, [cnt], -1, 255, thickness=cv2.FILLED)

    return mask


def _yolo_wall_mask(image: np.ndarray, detections: dict) -> np.ndarray:
    """
    Build a binary mask from YOLO wall bounding boxes.
    """
    h, w = image.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    for det in detections.get("walls", []):
        x1, y1, x2, y2 = det["bbox"]
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=cv2.FILLED)
    return mask


def _extract_door_bboxes(image: np.ndarray, detections: dict | None) -> list[dict]:
    """
    Return door bounding boxes from YOLO results (or empty list if unavailable).
    """
    if detections is None:
        return []
    doors = []
    for det in detections.get("doors", []):
        x1, y1, x2, y2 = det["bbox"]
        doors.append({
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
            "confidence": det["confidence"],
        })
    return doors


def _extract_window_bboxes(detections: dict | None) -> list[dict]:
    """Return window bounding boxes from YOLO results."""
    if detections is None:
        return []
    windows = []
    for det in detections.get("windows", []):
        x1, y1, x2, y2 = det["bbox"]
        windows.append({
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
            "confidence": det["confidence"],
        })
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

    Returns
    -------
    dict
        Updated context with keys:
        - ``combined_boundary``  — binary wall mask (np.ndarray, uint8)
        - ``door_bboxes``        — list of door bounding-box dicts
        - ``window_bboxes``      — list of window bounding-box dicts
        - ``yolo_detections``    — raw YOLO detections dict (or None)
        - ``wall_detection_method`` — "yolo+morphological" or "morphological_only"
    """
    ctx = {**context}

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # 1. Try YOLO (passing pre-loaded model from context if present)
    detections = _try_yolo_detection(image, model=ctx.get("yolo_model"))

    # 2. Always compute morphological mask (works universally)
    morph_mask = _morphological_wall_mask(gray)

    # 3. Combine
    if detections is not None and len(detections.get("walls", [])) > 0:
        yolo_mask = _yolo_wall_mask(image, detections)
        combined = cv2.bitwise_or(morph_mask, yolo_mask)
        method = "yolo+morphological"
    else:
        combined = morph_mask
        method = "morphological_only"
        if detections is None:
            logger.info("Using morphological-only wall detection (YOLO unavailable)")
        else:
            logger.info("YOLO found no wall boxes — using morphological-only")

    # Ensure binary
    _, combined = cv2.threshold(combined, 127, 255, cv2.THRESH_BINARY)

    ctx["combined_boundary"] = combined
    ctx["door_bboxes"] = _extract_door_bboxes(image, detections)
    ctx["window_bboxes"] = _extract_window_bboxes(detections)
    ctx["yolo_detections"] = detections
    ctx["wall_detection_method"] = method
    ctx["image_height"], ctx["image_width"] = image.shape[:2]

    logger.info(
        "Stage 1 complete: method=%s wall_pixels=%d doors=%d windows=%d",
        method,
        int(np.sum(combined > 0)),
        len(ctx["door_bboxes"]),
        len(ctx["window_bboxes"]),
    )
    return ctx

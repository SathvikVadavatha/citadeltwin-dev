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

# ---------------------------------------------------------------------------
# Per-class minimum confidence
# ---------------------------------------------------------------------------

MIN_CONFIDENCE = {
    CLS_WALL: 0.05,
    CLS_CURTAIN_WALL: 0.05,
    CLS_DOOR: 0.4,
    CLS_SLIDING_DOOR: 0.4,
    CLS_WINDOW: 0.4,
}
DEFAULT_MIN_CONFIDENCE = 0.25


# ---------------------------------------------------------------------------
# Calculation Constants
# ---------------------------------------------------------------------------

MAX_WALL_BBOX_AREA_RATIO        = 0.15   # a single wall box covering >15% of the image is not one wall segment
MIN_WALL_BBOX_ASPECT            = 2.5    # real wall boxes are elongated; near-square boxes are noise, not linear walls
WALL_SAMPLE_PAD_PX              = 20     # how far outside the window bbox to search for real wall pixels
WALL_THICKNESS_SAMPLE_OFFSET_PX = 4      # how far past the bbox edge to sample thickness, to avoid reading the window's own filled-in bbox as "wall"
DOOR_FRAME_THICKNESS_PX         = 4
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

            if cls_id == CLS_WINDOW and conf < MIN_CONFIDENCE.get(cls_id, DEFAULT_MIN_CONFIDENCE):
                continue

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

def _filter_wall_detections(detections: dict, image_shape: tuple[int, int]) -> list[dict]:
    """
    YOLO's wall-class boxes are frequently large, near-square, heavily
    overlapping regions rather than tight boxes around a single wall run. 
    Drawing a centerline across a box like that produces erroneous long 
    line ("ghost wall") through unrelated rooms. This filters those out 
    before line-drawing, independent of confidence.
    """
    h, w = image_shape[:2]
    image_area = h * w
    good = []
    for det in detections.get("walls", []):
        x1, y1, x2, y2 = det["bbox"]
        bw, bh = x2 - x1, y2 - y1
        area = bw * bh
        aspect = max(bw, bh) / (min(bw, bh) + 1e-6)
        if area > image_area * MAX_WALL_BBOX_AREA_RATIO:
            continue
        if aspect < MIN_WALL_BBOX_ASPECT:
            continue
        good.append(det)
    return good

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
    half_th = 2
    
    for det in detections.get("walls", []):
        x1, y1, x2, y2 = det["bbox"]
        bw = x2 - x1
        bh = y2 - y1
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        if bw >= bh:
            # Horizontal wall
            half_th = max(1, bh // 2)
            cv2.rectangle(mask, (x1, cy - half_th), (x2, cy + half_th), 255, thickness=-1)
        else:
            # Vertical wall
            half_th = max(1, bw // 2)
            cv2.rectangle(mask, (cx - half_th, y1), (cx + half_th, y2), 255, thickness=-1)

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


def _detect_door_frame_line(image: np.ndarray, bbox: list[int]) -> dict | None:
    """
    Find the door's leaf/frame line inside its bbox. Handles two symbol
    styles: a single medium-thick stroke, or two parallel thin lines
    (frame outline). Both cases are normalized to one representative line
    by clustering same-orientation, closely-parallel segments and
    averaging them.
    """
    x1, y1, x2, y2 = bbox
    crop = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

    lines = cv2.HoughLinesP(
        binary, rho=1, theta=np.pi / 180, threshold=15,
        minLineLength=min(x2 - x1, y2 - y1) * 0.4,
        maxLineGap=3,
    )
    if lines is None:
        return None

    segments = []
    lines = lines.reshape(-1, 4)
    for lx1, ly1, lx2, ly2 in lines:
        length = ((lx2 - lx1) ** 2 + (ly2 - ly1) ** 2) ** 0.5
        angle = np.arctan2(ly2 - ly1, lx2 - lx1)
        # normalize angle to [0, pi) so opposite-direction same-line segments group together
        angle = angle % np.pi
        segments.append((length, angle, lx1, ly1, lx2, ly2))

    # keep only reasonably long candidates (filter out short arc fragments)
    max_len = max(s[0] for s in segments)
    segments = [s for s in segments if s[0] >= max_len * 0.5]

    # cluster by angle (same orientation within ~10 degrees)
    clusters = []
    for s in segments:
        placed = False
        for cluster in clusters:
            if abs(s[1] - cluster[0][1]) < np.radians(10):
                cluster.append(s)
                placed = True
                break
        if not placed:
            clusters.append([s])

    # pick the cluster with the most total length (handles both single
    # thick line and two-parallel-thin-lines cases — both cluster together
    # if roughly same angle)
    best_cluster = max(clusters, key=lambda c: sum(s[0] for s in c))

    xs = [pt for s in best_cluster for pt in (s[2], s[4])]
    ys = [pt for s in best_cluster for pt in (s[3], s[5])]

    # representative line = extremes along the dominant direction
    angle = best_cluster[0][1]
    if abs(np.cos(angle)) > abs(np.sin(angle)):
        # more horizontal — use x extremes
        lx1_i, lx2_i = int(min(xs)), int(max(xs))
        ly = int(np.mean(ys))
        line = {"x1": x1 + lx1_i, "y1": y1 + ly, "x2": x1 + lx2_i, "y2": y1 + ly}
    else:
        # more vertical — use y extremes
        ly1_i, ly2_i = int(min(ys)), int(max(ys))
        lx = int(np.mean(xs))
        line = {"x1": x1 + lx, "y1": y1 + ly1_i, "x2": x1 + lx, "y2": y1 + ly2_i}

    return line

def _clean_wall_protrusions(mask: np.ndarray, wall_min_thickness: int = 6) -> np.ndarray:
    kernel = cv2.getStructuringElement(
        cv2.MORPH_RECT, (wall_min_thickness, wall_min_thickness)
    )
    eroded = cv2.erode(mask, kernel, iterations=1)
    cleaned = cv2.dilate(eroded, kernel, iterations=1)
    return cleaned


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
    OUT_DIR = "./logs/visual_debug"
    import os
    os.makedirs(OUT_DIR, exist_ok=True)
    cv2.imwrite(f"{OUT_DIR}/debug_yolo_walls.png", yolo_walls)
    cv2.imwrite(f"{OUT_DIR}/debug_thick_walls.png", thick_walls)

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
        
        region = combined[y1:y2, x1:x2]
        wall_fraction = np.sum(region > 0) / max(1, region.size)
        
        # A real dimension/annotation mark sits in open space and is not
        # embedded in wall geometry. If most of this region is already 
        # wall pixels, it's more likely a short wall segment is
        # misclassified as CLS_DIMENSION/CLS_COLUMN/CLS_RAILING than an
        # actual annotation. So we keep it and don't erase it.
        if wall_fraction < 0.5:
            combined[y1:y2, x1:x2] = 0

    # Close door openings — fill each door bbox with white
    # for det in detections.get("doors", []):
    #     x1, y1, x2, y2 = det["bbox"]
    #     cv2.rectangle(combined, (x1, y1), (x2, y2), 255, thickness=cv2.FILLED)

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
    return _clean_wall_protrusions(combined)


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
# Wall cut logic
# ---------------------------------------------------------------------------

def _door_cut_from_line(door: dict, line: dict) -> dict:
    lx1, ly1, lx2, ly2 = line["x1"], line["y1"], line["x2"], line["y2"]
    length = ((lx2 - lx1) ** 2 + (ly2 - ly1) ** 2) ** 0.5
    horizontal = abs(lx2 - lx1) >= abs(ly2 - ly1)

    if horizontal:
        cx = (lx1 + lx2) / 2
        cy = (ly1 + ly2) / 2
        x1 = int(cx - length / 2)
        x2 = int(cx + length / 2)
        y1 = int(cy - DOOR_FRAME_THICKNESS_PX / 2)
        y2 = int(cy + DOOR_FRAME_THICKNESS_PX / 2)
    else:
        cx = (lx1 + lx2) / 2
        cy = (ly1 + ly2) / 2
        y1 = int(cy - length / 2)
        y2 = int(cy + length / 2)
        x1 = int(cx - DOOR_FRAME_THICKNESS_PX / 2)
        x2 = int(cx + DOOR_FRAME_THICKNESS_PX / 2)

    return {
        "x": x1, "y": y1,
        "width": x2 - x1, "height": y2 - y1,
        "horizontal": horizontal,
        "confidence": door["confidence"],
    }


def _build_door_cuts(image: np.ndarray, door_bboxes: list[dict]) -> list[dict]:
    cuts = []
    for door in door_bboxes:
        raw_bbox = [door["x"], door["y"], door["x"] + door["width"], door["y"] + door["height"]]
        line = _detect_door_frame_line(image, raw_bbox)

        if line is not None:
            cut_rect = _door_cut_from_line(door, line)
            horizontal = cut_rect["horizontal"]
            bbox = [cut_rect["x"], cut_rect["y"],
                    cut_rect["x"] + cut_rect["width"], cut_rect["y"] + cut_rect["height"]]

            if horizontal:
                bbox[0] = raw_bbox[0]
                bbox[2] = raw_bbox[2]
            else:
                bbox[1] = raw_bbox[1]
                bbox[3] = raw_bbox[3]

            width_px = max(bbox[2] - bbox[0], bbox[3] - bbox[1])
            wall_thickness_px = DOOR_FRAME_THICKNESS_PX
        else:
            horizontal = door["width"] >= door["height"]
            bbox = raw_bbox
            width_px = max(door["width"], door["height"])
            wall_thickness_px = None

        cuts.append({
            "bbox": bbox,
            "confidence": door["confidence"],
            "orientation": "horizontal" if horizontal else "vertical",
            "width_px": width_px,
            "wall_thickness_px": wall_thickness_px,
            "wall_centerline_px": None,
        })
    return cuts


def _build_window_cuts(combined_boundary: np.ndarray, window_bboxes: list[dict]) -> list[dict]:
    cuts = []
    for win in window_bboxes:
        bbox = [win["x"], win["y"], win["x"] + win["width"], win["y"] + win["height"]]
        horizontal = _local_wall_orientation(combined_boundary, bbox)
        band = _local_wall_band(combined_boundary, bbox, horizontal)

        cuts.append({
            "bbox": bbox,
            "confidence": win["confidence"],
            "orientation": "horizontal" if horizontal else "vertical",
            "width_px": max(win["width"], win["height"]),
            "wall_thickness_px": band[0] if band else None,
            "wall_centerline_px": band[1] if band else None,
        })
    return cuts


# ---------------------------------------------------------------------------
# Wall cut detection helpers
# ---------------------------------------------------------------------------

def _local_wall_orientation(combined_boundary: np.ndarray, bbox: list[int], pad: int = WALL_SAMPLE_PAD_PX) -> bool:
    x1, y1, x2, y2 = bbox
    h, w = combined_boundary.shape

    top = combined_boundary[max(0, y1 - pad):y1, x1:x2]
    bottom = combined_boundary[y2:min(h, y2 + pad), x1:x2]
    top_bottom_px = int(np.sum(top > 0) + np.sum(bottom > 0))
    top_bottom_area = max(1, top.size + bottom.size)
    top_bottom_density = top_bottom_px / top_bottom_area

    left = combined_boundary[y1:y2, max(0, x1 - pad):x1]
    right = combined_boundary[y1:y2, x2:min(w, x2 + pad)]
    left_right_px = int(np.sum(left > 0) + np.sum(right > 0))
    left_right_area = max(1, left.size + right.size)
    left_right_density = left_right_px / left_right_area

    return left_right_density >= top_bottom_density

def _local_wall_band(combined_boundary: np.ndarray, bbox: list[int], horizontal_wall: bool,
                      offset: int = WALL_THICKNESS_SAMPLE_OFFSET_PX,
                      pad: int = WALL_SAMPLE_PAD_PX) -> tuple[float, float] | None:
    """
    Measure the wall's actual thickness and centerline position perpendicular
    to its run, sampled just past the bbox edges (not through the bbox
    itself, which is filled solid and would give a false thickness reading).

    Returns (thickness_px, centerline_coord) or None if no wall pixels found.
    """
    x1, y1, x2, y2 = bbox
    h, w = combined_boundary.shape

    if horizontal_wall:
        # sample columns just left of x1 and just right of x2
        sample_cols = [x1 - offset, x2 + offset]
        cy = (y1 + y2) // 2
        lo, hi = max(0, cy - pad), min(h, cy + pad)
        thicknesses, centers = [], []
        for sx in sample_cols:
            if not (0 <= sx < w):
                continue
            col = combined_boundary[lo:hi, sx]
            wall_rows = np.where(col > 0)[0]
            if len(wall_rows) == 0:
                continue
            thicknesses.append(float(wall_rows.max() - wall_rows.min() + 1))
            centers.append(lo + (wall_rows.max() + wall_rows.min()) / 2)
    else:
        sample_rows = [y1 - offset, y2 + offset]
        cx = (x1 + x2) // 2
        lo, hi = max(0, cx - pad), min(w, cx + pad)
        thicknesses, centers = [], []
        for sy in sample_rows:
            if not (0 <= sy < h):
                continue
            row = combined_boundary[sy, lo:hi]
            wall_cols = np.where(row > 0)[0]
            if len(wall_cols) == 0:
                continue
            thicknesses.append(float(wall_cols.max() - wall_cols.min() + 1))
            centers.append(lo + (wall_cols.max() + wall_cols.min()) / 2)

    if not thicknesses:
        return None
    return float(np.median(thicknesses)), float(np.median(centers))


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
        detections["walls"] = _filter_wall_detections(detections, image.shape)

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
    ctx["door_cuts"]             = _build_door_cuts(image, ctx["door_bboxes"])
    ctx["window_bboxes"]         = _extract_window_bboxes(detections)
    ctx["window_cuts"]           = _build_window_cuts(combined, ctx["window_bboxes"])

    ctx["door_count"]            = len(ctx.get("door_cuts", []))
    ctx["window_count"]          = len(ctx.get("window_cuts", []))

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

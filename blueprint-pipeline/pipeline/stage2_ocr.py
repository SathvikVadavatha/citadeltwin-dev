"""
Stage 2 — OCR (EasyOCR)
========================

Extracts room labels, dimension text, and area annotations from the
blueprint image using EasyOCR.
"""

import logging
import re
import numpy as np
import cv2

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Room-label vocabulary (case-insensitive matching)
# ---------------------------------------------------------------------------
ROOM_KEYWORDS = [
    "BEDROOM", "BED ROOM", "BED",
    "LIVING ROOM", "LIVING", "FAMILY ROOM", "FAMILY",
    "KITCHEN", "KITCH",
    "BATHROOM", "BATH ROOM", "BATH", "TOILET", "WC", "RESTROOM",
    "DINING", "DINING ROOM",
    "CLOSET", "WALK-IN CLOSET", "W.I.C", "WIC",
    "UTILITY", "LAUNDRY", "MECHANICAL",
    "BALCONY", "PATIO", "DECK", "PORCH", "TERRACE",
    "GARAGE", "FOYER", "HALLWAY", "HALL", "CORRIDOR",
    "OFFICE", "STUDY", "DEN", "LOFT", "ATTIC", "BASEMENT",
    "MASTER", "GUEST",
]

# Normalise detected text → canonical label
_LABEL_MAP: dict[str, str] = {
    "BED ROOM": "BEDROOM",
    "BED": "BEDROOM",
    "LIVING ROOM": "LIVING",
    "FAMILY ROOM": "LIVING",
    "FAMILY": "LIVING",
    "BATH ROOM": "BATHROOM",
    "BATH": "BATHROOM",
    "TOILET": "BATHROOM",
    "WC": "BATHROOM",
    "RESTROOM": "BATHROOM",
    "DINING ROOM": "DINING",
    "WALK-IN CLOSET": "CLOSET",
    "W.I.C": "CLOSET",
    "WIC": "CLOSET",
    "LAUNDRY": "UTILITY",
    "MECHANICAL": "UTILITY",
    "PATIO": "BALCONY",
    "DECK": "BALCONY",
    "PORCH": "BALCONY",
    "TERRACE": "BALCONY",
    "KITCH": "KITCHEN",
    "HALL": "HALLWAY",
    "CORRIDOR": "HALLWAY",
    "DEN": "OFFICE",
    "STUDY": "OFFICE",
}

# Regex patterns for dimension & area text
_DIM_RE = re.compile(
    r"""(\d+\.?\d*)\s*(?:ft|feet|m|meters?|'|"|inches?|in)""",
    re.IGNORECASE,
)
_AREA_RE = re.compile(
    r"""(\d+\.?\d*)\s*(?:sq\.?\s*ft|sqft|sq\.?\s*m|m²|sf)""",
    re.IGNORECASE,
)


def _canonicalise(text: str) -> str | None:
    """Map raw OCR text to a canonical room label, or None if not a room."""
    upper = text.strip().upper()
    # Direct match
    if upper in _LABEL_MAP:
        return _LABEL_MAP[upper]
    # Check if any keyword is a substring
    for kw in ROOM_KEYWORDS:
        if kw in upper:
            return _LABEL_MAP.get(kw, kw)
    return None


def _bbox_centroid(bbox: list) -> tuple[int, int]:
    """
    EasyOCR bbox is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]].
    Return integer centroid.
    """
    xs = [pt[0] for pt in bbox]
    ys = [pt[1] for pt in bbox]
    return int(np.mean(xs)), int(np.mean(ys))


def _find_nearby_area(
    centroid: tuple[int, int],
    area_annotations: list[dict],
    max_dist: int = 200,
) -> float | None:
    """Find the closest area annotation within *max_dist* pixels."""
    best, best_d = None, max_dist + 1
    cx, cy = centroid
    for ann in area_annotations:
        ax, ay = ann["center"]
        d = abs(cx - ax) + abs(cy - ay)  # Manhattan is fine
        if d < best_d:
            best_d = d
            best = ann["area"]
    return best if best_d <= max_dist else None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def run(image: np.ndarray, context: dict) -> dict:
    """
    Stage 2 entry point.

    Parameters
    ----------
    image : np.ndarray   BGR image.
    context : dict       Output from Stage 1.

    Returns
    -------
    dict  — context augmented with:
        - ``rooms``   — list of {label, label_center, area_sqft}
        - ``dimensions`` — raw dimension strings found
    """
    ctx = {**context}

    # Lazy-import easyocr (heavy first-load)
    import easyocr  # noqa: E402

    # Use provided reader or create a fresh one
    reader = ctx.get("ocr_reader")
    if reader is None:
        reader = easyocr.Reader(["en"], gpu=False)
        
    # Resize for OCR speed — EasyOCR is slow on large images on CPU
    h, w = image.shape[:2]
    if w > 800:
        scale = 800 / w
        image_ocr = cv2.resize(image, (800, int(h * scale)))
    else:
        image_ocr = image
    results = reader.readtext(image_ocr)

    room_labels: list[dict] = []
    dimensions: list[str] = []
    area_annotations: list[dict] = []

    # First pass — gather area annotations so we can associate them later
    for bbox, text, conf in results:
        m = _AREA_RE.search(text)
        if m:
            cx, cy = _bbox_centroid(bbox)
            area_annotations.append({"center": (cx, cy), "area": float(m.group(1))})

        m2 = _DIM_RE.search(text)
        if m2:
            dimensions.append(text.strip())

    # Second pass — room labels
    seen_labels: dict[str, int] = {}  # canonical → count (for dedup)
    for bbox, text, conf in results:
        canonical = _canonicalise(text)
        if canonical is None:
            continue

        cx, cy = _bbox_centroid(bbox)

        # Deduplicate: if the same label appears many times, number them
        seen_labels[canonical] = seen_labels.get(canonical, 0) + 1
        label = canonical if seen_labels[canonical] == 1 else f"{canonical}_{seen_labels[canonical]}"

        area = _find_nearby_area((cx, cy), area_annotations)

        room_labels.append({
            "label": label,
            "label_center": [cx, cy],
            "area_sqft": area,  # may be None
        })

    # If OCR found no rooms at all, synthesise a single "ROOM" seed at the
    # image centre so later stages still produce output.
    if not room_labels:
        h, w = image.shape[:2]
        logger.warning("OCR found no room labels — synthesising a default ROOM seed")
        room_labels.append({
            "label": "ROOM",
            "label_center": [w // 2, h // 2],
            "area_sqft": None,
        })

    ctx["rooms"] = room_labels
    ctx["dimensions"] = dimensions
    ctx["area_annotations"] = area_annotations

    logger.info(
        "Stage 2 complete: rooms=%d dimensions=%d areas=%d",
        len(room_labels),
        len(dimensions),
        len(area_annotations),
    )
    return ctx

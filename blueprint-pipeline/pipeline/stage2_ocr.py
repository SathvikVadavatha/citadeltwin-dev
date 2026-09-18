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
_WH_RE = re.compile(
    r"(\d+['\u2032]\s*-?\s*\d*[\"\u2033]*|\d+\.?\d*)\s*[xX]\s*(\d+['\u2032]\s*-?\s*\d*[\"\u2033]*|\d+\.?\d*)"
)


def _parse_dim_to_ft(val: str) -> float | None:
    """Parse a linear dimension string (e.g. 13'-6", 14', 13.5 ft) into decimal feet."""
    if not val:
        return None
    val = val.strip()
    ft_match = re.search(r"(\d+\.?\d*)\s*['\u2032]", val)
    in_match = re.search(r"(\d+\.?\d*)\s*[\"\u2033]", val)
    if ft_match:
        ft = float(ft_match.group(1))
        inch = float(in_match.group(1)) if in_match else 0.0
        return round(ft + inch / 12.0, 2)
    elif in_match:
        return round(float(in_match.group(1)) / 12.0, 2)
    dec_match = re.search(r"(\d+\.?\d*)\s*(?:ft|feet)?", val, re.IGNORECASE)
    if dec_match and dec_match.group(1):
        try:
            return round(float(dec_match.group(1)), 2)
        except ValueError:
            return None
    return None


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


def _bbox_centroid(bbox: list, scale_factor: float = 1.0) -> tuple[int, int]:
    """
    EasyOCR bbox is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]].
    Return integer centroid scaled back to original image resolution.
    """
    xs = [pt[0] for pt in bbox]
    ys = [pt[1] for pt in bbox]
    # Scale factor restores original image coordinates when image was downsized to 800px for CPU OCR speed
    return int(round(np.mean(xs) * scale_factor)), int(round(np.mean(ys) * scale_factor))


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


def _find_nearby_wh(
    centroid: tuple[int, int],
    wh_annotations: list[dict],
    max_dist: int = 200,
) -> tuple[float | None, float | None]:
    """Find the closest width/height annotation within *max_dist* pixels."""
    best_w, best_h = None, None
    best_d = max_dist + 1
    cx, cy = centroid
    for ann in wh_annotations:
        ax, ay = ann["center"]
        d = abs(cx - ax) + abs(cy - ay)
        if d < best_d:
            best_d = d
            best_w, best_h = ann["width_ft"], ann["height_ft"]
    return (best_w, best_h) if best_d <= max_dist else (None, None)


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
        - ``rooms``   — list of {label, label_center, area_sqft, width_ft, height_ft}
        - ``dimensions`` — raw dimension strings found
        - ``area_annotations`` — area annotations found
        - ``wh_annotations`` — width/height annotations found
    """
    ctx = {**context}

    # Lazy-import easyocr (heavy first-load)
    import easyocr  # noqa: E402

    # Use provided reader or create a fresh one
    reader = ctx.get("ocr_reader")
    if reader is None:
        reader = easyocr.Reader(["en"], gpu=False)
        
    # RESOLVED (previously flagged as a conflict with origin/main, Tanzim,
    # signed off by leads): his branch resizes the image to 800px wide
    # before OCR for CPU speed. Tried the smallest possible adaptation first,
    # per instructions, before reverting his optimization:
    #
    #   Kept his 800px resize and tested EasyOCR's `mag_ratio` parameter
    #   (1.0/1.5/2.0/3.0) against the same test blueprint, checking whether
    #   the small width x height dimension callouts (e.g. "13'-0" x 14'-0"")
    #   came back readable. Result: 0/7 ground-truth room dimensions were
    #   recovered at ANY mag_ratio setting on the 800px image, vs 7/7 at full
    #   resolution. See playground/test_mag_ratio.py for the reproducible
    #   test and full output.
    #
    #   Why mag_ratio couldn't fix it: mag_ratio only rescales a text region
    #   AFTER EasyOCR's detector has already located it, to help the
    #   recognizer read it more accurately. It does nothing for the detector
    #   itself. Once the image is downscaled to 800px wide, the small
    #   dimension-callout glyphs are already too degraded for the detector to
    #   find them as text regions at all — there is nothing for mag_ratio to
    #   later upscale and re-read, so every setting produced the same (empty)
    #   result as the baseline.
    #
    # Falling back to full-resolution OCR was therefore necessary, not a
    # rejection of his speed optimization on principle — the 800px path was
    # tested first and demonstrably cannot support this feature.
    h, w = image.shape[:2]
    image_ocr = image
    results = reader.readtext(image_ocr)

    # Erase all OCR-detected text regions from combined_boundary so text
    # doesn't get picked up as wall material downstream. EasyOCR ran on a
    # resized copy (image_ocr) for speed, so bbox coordinates must be
    # scaled back up to the original image's resolution before erasing.
    # (scale_x/scale_y collapse to 1.0 here since image_ocr == image above,
    # but are kept general in case a resize is reintroduced later.)
    if "combined_boundary" in ctx:
        boundary = ctx["combined_boundary"]
        scale_x = w / image_ocr.shape[1]
        scale_y = h / image_ocr.shape[0]
        for bbox, text, conf in results:
            xs = [pt[0] * scale_x for pt in bbox]
            ys = [pt[1] * scale_y for pt in bbox]
            x1, x2 = int(min(xs)), int(max(xs))
            y1, y2 = int(min(ys)), int(max(ys))
            pad = 3
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(boundary.shape[1], x2 + pad)
            y2 = min(boundary.shape[0], y2 + pad)
            boundary[y1:y2, x1:x2] = 0
        ctx["combined_boundary"] = boundary
        logger.info("Erased %d OCR text regions from combined_boundary", len(results))

    scale_factor = 1.0
    scaled_max_dist = int(round(200 * scale_factor))

    room_labels: list[dict] = []
    dimensions: list[str] = []
    area_annotations: list[dict] = []
    wh_annotations: list[dict] = []

    # First pass — gather area and dimension annotations so we can associate them later
    for bbox, text, conf in results:
        m = _AREA_RE.search(text)
        if m:
            cx, cy = _bbox_centroid(bbox, scale_factor)
            area_annotations.append({"center": (cx, cy), "area": float(m.group(1))})

        # Mutually exclusive matching: check for WxH pair first; if matched, skip single dimension _DIM_RE
        m_wh = _WH_RE.search(text)
        if m_wh:
            w_ft = _parse_dim_to_ft(m_wh.group(1))
            h_ft = _parse_dim_to_ft(m_wh.group(2))
            if w_ft is not None and h_ft is not None and w_ft > 0 and h_ft > 0:
                cx, cy = _bbox_centroid(bbox, scale_factor)
                wh_annotations.append({"center": (cx, cy), "width_ft": w_ft, "height_ft": h_ft})
        else:
            m2 = _DIM_RE.search(text)
            if m2:
                dimensions.append(text.strip())

    # Second pass — room labels
    seen_labels: dict[str, int] = {}  # canonical → count (for dedup)
    for bbox, text, conf in results:
        canonical = _canonicalise(text)
        if canonical is None:
            continue

        cx, cy = _bbox_centroid(bbox, scale_factor)

        # Deduplicate: if the same label appears many times, number them
        seen_labels[canonical] = seen_labels.get(canonical, 0) + 1
        label = canonical if seen_labels[canonical] == 1 else f"{canonical}_{seen_labels[canonical]}"

        area = _find_nearby_area((cx, cy), area_annotations, max_dist=scaled_max_dist)
        w_ft, h_ft = _find_nearby_wh((cx, cy), wh_annotations, max_dist=scaled_max_dist)

        room_labels.append({
            "label": label,
            "label_center": [cx, cy],
            "area_sqft": area,  # may be None
            "width_ft": w_ft,   # may be None
            "height_ft": h_ft,  # may be None
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
            "width_ft": None,
            "height_ft": None,
        })

    ctx["rooms"] = room_labels
    ctx["dimensions"] = dimensions
    ctx["area_annotations"] = area_annotations
    ctx["wh_annotations"] = wh_annotations

    logger.info(
        "Stage 2 complete: rooms=%d dimensions=%d areas=%d wh_pairs=%d",
        len(room_labels),
        len(dimensions),
        len(area_annotations),
        len(wh_annotations),
    )
    return ctx

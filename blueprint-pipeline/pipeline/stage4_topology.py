"""
Stage 4 — Topology Validation (Shapely)
========================================

Converts each room's claimed pixel region to a Shapely polygon and
checks two invariants:

1. **No overlap** — no two room polygons overlap by more than 5 % of
   the smaller room's area.
2. **Connectivity** — every room is adjacent (within 20 px) to at least
   one other room.

Validation failures are logged as warnings but never abort the pipeline.
"""

import logging
import numpy as np
from shapely.geometry import MultiPoint, Polygon
from shapely.validation import make_valid

logger = logging.getLogger(__name__)

OVERLAP_THRESHOLD = 0.05   # 5 %
ADJACENCY_DIST_PX = 20


def _room_polygon(claimed: np.ndarray, room_idx: int) -> Polygon | None:
    """
    Build a Shapely Polygon from the convex hull of claimed pixels
    belonging to *room_idx*.  Returns None if fewer than 3 points.
    """
    ys, xs = np.where(claimed == room_idx)
    if len(xs) < 3:
        return None
    # Subsample for performance (>50 k points → take every Nth)
    n = len(xs)
    if n > 5000:
        step = n // 5000
        xs, ys = xs[::step], ys[::step]
    points = list(zip(xs.tolist(), ys.tolist()))
    hull = MultiPoint(points).convex_hull
    if hull.is_empty or hull.geom_type == "Point" or hull.geom_type == "LineString":
        return None
    poly = make_valid(hull)
    if poly.geom_type == "MultiPolygon":
        # Take the largest polygon
        poly = max(poly.geoms, key=lambda g: g.area)
    return poly


def _check_overlaps(
    polygons: dict[int, Polygon],
    rooms: list[dict],
) -> list[str]:
    """Return a list of overlap warning strings."""
    warnings: list[str] = []
    idxs = sorted(polygons.keys())
    for i, a_idx in enumerate(idxs):
        for b_idx in idxs[i + 1:]:
            pa, pb = polygons[a_idx], polygons[b_idx]
            if pa.intersects(pb):
                inter_area = pa.intersection(pb).area
                smaller = min(pa.area, pb.area)
                if smaller > 0 and (inter_area / smaller) > OVERLAP_THRESHOLD:
                    msg = (
                        f"Rooms '{rooms[a_idx]['label']}' and "
                        f"'{rooms[b_idx]['label']}' overlap by "
                        f"{inter_area / smaller * 100:.1f}%"
                    )
                    logger.warning(msg)
                    warnings.append(msg)
    return warnings


def _check_connectivity(
    polygons: dict[int, Polygon],
    rooms: list[dict],
) -> list[str]:
    """
    Check that every room is adjacent (within ADJACENCY_DIST_PX) to at
    least one other room.
    """
    warnings: list[str] = []
    idxs = sorted(polygons.keys())

    # Build adjacency set
    adjacent: dict[int, set[int]] = {idx: set() for idx in idxs}
    for i, a_idx in enumerate(idxs):
        for b_idx in idxs[i + 1:]:
            dist = polygons[a_idx].distance(polygons[b_idx])
            if dist <= ADJACENCY_DIST_PX:
                adjacent[a_idx].add(b_idx)
                adjacent[b_idx].add(a_idx)

    for idx in idxs:
        if not adjacent[idx]:
            msg = f"Room '{rooms[idx]['label']}' is isolated (no adjacent rooms within {ADJACENCY_DIST_PX}px)"
            logger.warning(msg)
            warnings.append(msg)

    return warnings


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def run(image: np.ndarray, context: dict) -> dict:
    """
    Stage 4 entry point.

    Requires context keys from Stage 3:
      - ``claimed``  — pixel-level room assignment array
      - ``rooms``    — room list

    Adds to context:
      - ``room_polygons``         — dict[room_idx → Shapely Polygon]
      - ``validation_warnings``   — list of warning strings
    """
    ctx = {**context}

    claimed = ctx["claimed"]
    rooms = ctx["rooms"]

    # Build polygons
    polygons: dict[int, Polygon] = {}
    for idx in range(len(rooms)):
        poly = _room_polygon(claimed, idx)
        if poly is not None:
            polygons[idx] = poly

    # Validate
    overlap_warnings = _check_overlaps(polygons, rooms)
    connectivity_warnings = _check_connectivity(polygons, rooms)
    all_warnings = overlap_warnings + connectivity_warnings

    ctx["room_polygons"] = polygons
    ctx["validation_warnings"] = all_warnings

    logger.info(
        "Stage 4 complete: polygons=%d warnings=%d",
        len(polygons),
        len(all_warnings),
    )
    return ctx

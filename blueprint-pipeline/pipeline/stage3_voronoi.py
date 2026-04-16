"""
Stage 3 — Room Assignment (Geodesic Voronoi flood-fill)
========================================================

Each room seed (from Stage 2 OCR) expands outward through *passable*
pixels (non-wall) using BFS.  Expansion is capped at 115% of the
room's OCR-reported area converted to pixels.

The resulting pixel-level assignment is downsampled to 12×12 tiles.
"""

import logging
from collections import deque
import math
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Calibration constant — based on empirical measurement of a reference
# Bedroom ~182 sqft, yielding a pixel-to-sqft ratio.
# ---------------------------------------------------------------------------
DEFAULT_PX_PER_SQFT = 50.0  # overridden per-image if area data is available
AREA_CAP_FACTOR = 1.15       # expand up to 115 % of reported area


def _calibrate_px_per_sqft(rooms: list[dict], passable: np.ndarray) -> float:
    """
    If any room has a reported area_sqft *and* we can compute its reachable
    pixel count, calibrate px_per_sqft.  Falls back to DEFAULT_PX_PER_SQFT.
    """
    for room in rooms:
        if room.get("area_sqft") and room["area_sqft"] > 0:
            # Quick BFS to count reachable pixels from this seed (capped at
            # a generous upper bound so we don't flood the whole image).
            seed = tuple(room["label_center"])
            h, w = passable.shape
            sx, sy = int(seed[0]), int(seed[1])
            if not (0 <= sy < h and 0 <= sx < w):
                continue
            visited = set()
            q: deque = deque()
            q.append((sy, sx))
            visited.add((sy, sx))
            cap = int(room["area_sqft"] * DEFAULT_PX_PER_SQFT * 3)  # generous search
            while q and len(visited) < cap:
                cy, cx = q.popleft()
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and (ny, nx) not in visited and passable[ny, nx]:
                        visited.add((ny, nx))
                        q.append((ny, nx))

            if len(visited) > 100:
                ratio = len(visited) / room["area_sqft"]
                logger.info(
                    "Calibrated px_per_sqft=%.1f from room %s (pixels=%d, area=%.0f)",
                    ratio, room["label"], len(visited), room["area_sqft"],
                )
                return ratio

    return DEFAULT_PX_PER_SQFT


def _bfs_flood(
    seeds: list[tuple[int, int, int]],  # (y, x, room_idx)
    passable: np.ndarray,
    caps: list[int],  # max pixels per room
) -> np.ndarray:
    """
    Multi-source BFS.  Each seed expands until its cap is reached or it
    hits walls / already-claimed territory.

    Returns
    -------
    claimed : np.ndarray  (h, w) int32, -1 = unclaimed, else room index.
    """
    h, w = passable.shape
    claimed = np.full((h, w), -1, dtype=np.int32)
    counts = [0] * len(caps)

    q: deque = deque()
    for sy, sx, idx in seeds:
        if 0 <= sy < h and 0 <= sx < w and passable[sy, sx]:
            claimed[sy, sx] = idx
            counts[idx] += 1
            q.append((sy, sx, idx))

    while q:
        cy, cx, idx = q.popleft()
        if counts[idx] >= caps[idx]:
            continue
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and claimed[ny, nx] == -1 and passable[ny, nx]:
                claimed[ny, nx] = idx
                counts[idx] += 1
                q.append((ny, nx, idx))

    return claimed


def _downsample_tiles(
    claimed: np.ndarray,
    rooms: list[dict],
    grid: int = 12,
) -> dict[str, list[list[int]]]:
    """
    Divide the image into *grid × grid* tiles and record the dominant room
    per tile.

    Returns
    -------
    dict mapping room label → list of [tile_x, tile_y].
    """
    h, w = claimed.shape
    tile_h = max(1, h // grid)
    tile_w = max(1, w // grid)

    tiles: dict[str, list[list[int]]] = {}
    for ty in range(grid):
        for tx in range(grid):
            y0, y1 = ty * tile_h, min((ty + 1) * tile_h, h)
            x0, x1 = tx * tile_w, min((tx + 1) * tile_w, w)
            patch = claimed[y0:y1, x0:x1]
            vals, counts = np.unique(patch[patch >= 0], return_counts=True)
            if len(vals) == 0:
                continue
            dominant = int(vals[np.argmax(counts)])
            label = rooms[dominant]["label"]
            tiles.setdefault(label, []).append([tx, ty])

    return tiles


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def run(image: np.ndarray, context: dict) -> dict:
    """
    Stage 3 entry point.

    Requires context keys from Stage 1 + 2:
      - ``combined_boundary`` (binary wall mask)
      - ``rooms`` (list of room dicts from OCR)

    Adds to context:
      - ``claimed``       — pixel-level room assignment array
      - ``tiles``         — {label: [[tx,ty], ...]} dict
      - ``px_per_sqft``   — calibrated ratio
    """
    ctx = {**context}

    boundary = ctx["combined_boundary"]
    rooms = ctx["rooms"]

    # Passable = non-wall pixels
    passable = (boundary == 0).astype(np.uint8)

    # Calibrate scale
    px_per_sqft = _calibrate_px_per_sqft(rooms, passable)

    # Compute per-room expansion caps
    caps: list[int] = []
    for room in rooms:
        area = room.get("area_sqft")
        if area and area > 0:
            caps.append(int(area * px_per_sqft * AREA_CAP_FACTOR))
        else:
            # No area data — allow generous expansion (half the passable area)
            caps.append(int(np.sum(passable) / max(len(rooms), 1)))

    # Build seed list
    seeds: list[tuple[int, int, int]] = []
    for idx, room in enumerate(rooms):
        cx, cy = room["label_center"]
        seeds.append((int(cy), int(cx), idx))

    # Run BFS
    claimed = _bfs_flood(seeds, passable, caps)

    # Downsample to tiles
    tiles = _downsample_tiles(claimed, rooms)

    ctx["claimed"] = claimed
    ctx["tiles"] = tiles
    ctx["px_per_sqft"] = px_per_sqft

    logger.info(
        "Stage 3 complete: rooms_assigned=%d tiles=%d px_per_sqft=%.1f",
        len(tiles),
        sum(len(v) for v in tiles.values()),
        px_per_sqft,
    )
    return ctx

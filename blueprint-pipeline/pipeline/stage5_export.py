"""
Stage 5 — 3D Export (trimesh row-scan extrusion → GLB)
=======================================================

Converts the binary wall mask and room assignments into a 3D GLB scene
using trimesh.  Walls are row-scanned and extruded as boxes; rooms get
coloured floor tiles; a ground plane is added; doors get a real door slab
plus jamb posts; windows are cut into the wall as sill/header/glass-pane
stacks.

The GLB is exported in-memory and returned as base64.

Fixes applied:
  - Y-axis flip in floor tile placement to match notebook orientation
  - Per-face color application (np.tile) so trimesh actually renders colors
  - Same per-face fix applied to wall boxes, door indicators, and ground plane
"""

import base64
import io
import logging
import math
import numpy as np
import cv2
import trimesh

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WALL_HEIGHT           = 9.0       # feet
FLOOR_THICK           = 0.1       # feet
STRIP_HEIGHT          = 3         # pixels per row-scan strip
WALL_THICKNESS        = 0.5       # feet — rendered thickness for wall boxes
SEAL_THICKNESS        = 8         # px — clears stage1's artificial perimeter-seal stroke before wall extrusion
WINDOW_SILL_HEIGHT_FT = 3.0       # from floor to bottom of window opening
WINDOW_HEIGHT_FT      = 4.0       # opening height above the sill
DIMENSION_INSET_FT       = 0.15   # feet — interior inset for room dimension lines to avoid wall collisions
MIN_DIMENSIONABLE_WALL_FT = 1.5   # feet — ignore tiny noise fragments
PERIMETER_TOL_FT         = 1.0    # feet — how close a wall edge must sit to the building's outer bbox edge to count as a perimeter wall (allows for wall thickness)
WINDOW_CONF_THRESHOLD    = 0.3

DOOR_COLOR = [100, 70, 40, 255]
JAMB_COLOR = [60, 42, 62, 180]
DOOR_FRAME_THICKNESS_PX = 4  # nominal thickness for a door cut, independent of wall band sampling
JAMB_DEPTH_PX = 3.0

ROOM_COLORS: dict[str, list[int]] = {
    "LIVING":   [46, 79, 23],
    "DINING":   [46, 79, 23],
    "BEDROOM":  [25, 38, 69],
    "KITCHEN":  [107, 76, 2],
    "BATHROOM": [25, 63, 69],
    "CLOSET":   [61, 40, 69],
    "UTILITY":  [74, 56, 40],
    "BALCONY":  [74, 56, 40],
    "HALLWAY":  [90, 90, 90],
    "GARAGE":   [60, 60, 60],
    "OFFICE":   [50, 60, 80],
    "FOYER":    [80, 70, 55],
    "ROOM":     [70, 70, 70],
}

WALL_COLOR   = [180, 175, 165, 255]    # warm off-white
GROUND_COLOR = [30, 30, 30, 255]       # dark grey — visibly darker than floor tiles
WINDOW_COLOR = [150, 200, 220, 180]    # light blue-glass tint, semi-transparent


def _color_for_label(label: str) -> list[int]:
    """
    Return [R, G, B, A] for a room label.  Looks up the canonical prefix.
    """
    upper = label.upper().split("_")[0]  # "BEDROOM_2" → "BEDROOM"
    rgb = ROOM_COLORS.get(upper, [70, 70, 70])
    return [*rgb, 255]


def _find_building_bbox(boundary: np.ndarray) -> tuple[int, int, int, int]:
    """Return (bx, by, bw, bh) bounding rect of the main building's wall pixels.

    Uses dilation to group fragmented walls into a single blob, ignoring disconnected
    small artifacts (like legend swatches) that sit far away. If the wall mask is
    fragmented into multiple large components, logs a warning and falls back to full bounds.
    """
    # Dilate by 40px (~1.2 ft) to bridge typical wall gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 40))
    dilated = cv2.dilate(boundary, kernel)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dilated, connectivity=8)

    # If only background is found, or something goes wrong, fallback
    if num_labels <= 1:
        coords = cv2.findNonZero(boundary)
        if coords is None:
            h, w = boundary.shape
            return 0, 0, w, h
        return cv2.boundingRect(coords)

    # Find the bounding box of the original wall pixels within each dilated blob
    components = []
    for i in range(1, num_labels):
        mask = ((labels == i) & (boundary > 0)).astype(np.uint8)
        coords = cv2.findNonZero(mask)
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            components.append({"x": x, "y": y, "w": w, "h": h, "area": w * h})

    if not components:
        coords = cv2.findNonZero(boundary)
        return cv2.boundingRect(coords)

    components.sort(key=lambda c: c["area"], reverse=True)
    largest = components[0]

    # Sanity check against fragmentation
    if len(components) > 1:
        second_largest = components[1]
        # If the second largest blob is more than 30% the size of the largest, we might have a fragmented house
        if second_largest["area"] > largest["area"] * 0.3:
            logger.warning(
                "Building bbox warning: Second-largest wall component is %.1f%% the size of the largest. "
                "Wall mask might be fragmented. Falling back to full boundary bounds.",
                (second_largest["area"] / largest["area"]) * 100
            )
            # Fallback to full bounds to avoid cutting the house in half
            coords = cv2.findNonZero(boundary)
            bx, by, bw, bh = cv2.boundingRect(coords)
        else:
            bx, by, bw, bh = largest["x"], largest["y"], largest["w"], largest["h"]
    else:
        bx, by, bw, bh = largest["x"], largest["y"], largest["w"], largest["h"]

    # NOTE: this used to shrink the bbox by 8px per edge to discard border
    # noise, but that also cropped real exterior wall pixels that sit right
    # at the tight bounding rect of the largest connected component.
    # Disabled — do not reintroduce without also re-verifying it doesn't
    # clip real border walls.
    # bx = max(0, bx + 8)
    # by = max(0, by + 8)
    # bw = max(10, bw - 16)
    # bh = max(10, bh - 16)
    return bx, by, bw, bh


def _in_bounds(min_x: float, min_y: float, max_x: float, max_y: float, bx: float, by: float, bw: float, bh: float) -> bool:
    """Return True if the entire footprint [min_x, max_x] x [min_y, max_y] is strictly within [bx, bx+bw] x [by, by+bh]."""
    return (min_x >= bx) and (max_x <= bx + bw) and (min_y >= by) and (max_y <= by + bh)


def _build_door_meshes(door_cuts: list[dict], bx: int, by: int, bh: int, ppf: float) -> list[trimesh.Trimesh]:
    meshes = []

    for door in door_cuts:
        dx1, dy1, dx2, dy2 = door["bbox"]
        w_ft = (dx2 - dx1) / ppf
        d_ft = (dy2 - dy1) / ppf
        cx_ft = (dx1 + dx2 - 2 * bx) / (2 * ppf)
        cy_px = (dy1 + dy2) / 2 - by
        cy_ft = (bh - cy_px) / ppf

        box = trimesh.creation.box(extents=[w_ft, d_ft, WALL_HEIGHT])
        box.apply_translation([cx_ft, cy_ft, WALL_HEIGHT / 2])
        box.visual.face_colors = np.tile(DOOR_COLOR, (len(box.faces), 1))
        meshes.append(box)
    return meshes


def _build_door_jambs(
    door_cuts: list[dict],
    wall_mask: np.ndarray,
    bx: int, by: int, bh: int, ppf: float,
) -> list[trimesh.Trimesh]:
    """
    Places compact square jamb posts flush against the wall surface.
    """
    meshes: list[trimesh.Trimesh] = []
    placed_positions: set[tuple[int, int]] = set()
    JAMB_SIZE_PX = 6.0  # Fixed square cross-section
    half_jamb = JAMB_SIZE_PX / 2.0
    jamb_w_ft = JAMB_SIZE_PX / ppf

    for door in door_cuts:
        x1, y1, x2, y2 = door["bbox"]
        horizontal = door.get("orientation") == "horizontal"

        if horizontal:
            points = {"left": (x1, (y1 + y2) // 2), "right": (x2, (y1 + y2) // 2)}
            dirs = {"up": (0, -1), "down": (0, 1)}
            max_search = int(abs(x2 - x1) * 1.5)
        else:
            points = {"top": ((x1 + x2) // 2, y1), "bottom": ((x1 + x2) // 2, y2)}
            dirs = {"left": (-1, 0), "right": (1, 0)}
            max_search = int(abs(y2 - y1) * 1.5)

        for point_name, (px, py) in points.items():
            hits = {}
            for dir_name, (dx, dy) in dirs.items():
                step = _walk_to_wall(wall_mask, px, py, dx, dy, max_search)
                if step < max_search:
                    hits[dir_name] = (px + dx * step, py + dy * step, dx, dy)

            if len(hits) == 2:
                for dir_name, (hx, hy, dx, dy) in hits.items():
                    # Back off the center by half the jamb width so the jamb sits flush against the wall edge
                    cx_px = hx - (dx * half_jamb)
                    cy_px = hy - (dy * half_jamb)

                    pos_key = (round(cx_px / 3) * 3, round(cy_px / 3) * 3)
                    if pos_key in placed_positions:
                        continue
                    placed_positions.add(pos_key)

                    cx_ft = (cx_px - bx) / ppf
                    cy_ft = (bh - (cy_px - by)) / ppf

                    # Fixed-size square post flush against the opening
                    jamb = trimesh.creation.box(extents=[jamb_w_ft, jamb_w_ft, WALL_HEIGHT])
                    jamb.apply_translation([cx_ft, cy_ft, WALL_HEIGHT / 2.0])
                    jamb.visual.face_colors = np.tile(JAMB_COLOR, (len(jamb.faces), 1))
                    meshes.append(jamb)

    return meshes

def _walk_to_wall(mask: np.ndarray, x: int, y: int, dx: int, dy: int, max_dist: int) -> int:
    """Distance to first wall pixel walking (dx,dy) from (x,y), or max_dist if none found."""
    h, w = mask.shape
    for step in range(1, max_dist + 1):
        px, py = x + dx * step, y + dy * step
        if not (0 <= px < w and 0 <= py < h):
            return max_dist
        if mask[py, px] > 0:
            return step
    return max_dist


def _walk_inside_wall_to_edge(wall_mask: np.ndarray, px: int, py: int, dx: int, dy: int, max_dist: int) -> int:
    """Walks starting from INSIDE wall_mask (1) until hitting background (0) or max_dist."""
    h, w = wall_mask.shape
    for step in range(1, max_dist + 1):
        nx, ny = px + dx * step, py + dy * step
        if nx < 0 or nx >= w or ny < 0 or ny >= h or wall_mask[int(ny), int(nx)] == 0:
            return step
    return max_dist

def _build_doors_and_jambs(
    door_cuts: list[dict],
    wall_mask: np.ndarray,
    bx: int, by: int, bh: int, ppf: float,
) -> tuple[list[trimesh.Trimesh], list[trimesh.Trimesh]]:
    jamb_meshes: list[trimesh.Trimesh] = []
    door_meshes: list[trimesh.Trimesh] = []

    for idx, door in enumerate(door_cuts):
        x1, y1, x2, y2 = door["bbox"]
        horizontal = door.get("orientation") == "horizontal"
        orient_str = "HORIZONTAL" if horizontal else "VERTICAL"

        if horizontal:
            points = {"left": (x1, (y1 + y2) // 2), "right": (x2, (y1 + y2) // 2)}
            primary_dirs = {"up": (0, -1), "down": (0, 1)}
            secondary_dirs = [(-1, 0), (1, 0)]
            max_search = int(abs(x2 - x1) * 1.5)
        else:
            points = {"top": ((x1 + x2) // 2, y1), "bottom": ((x1 + x2) // 2, y2)}
            primary_dirs = {"left": (-1, 0), "right": (1, 0)}
            secondary_dirs = [(0, -1), (0, 1)]
            max_search = int(abs(y2 - y1) * 1.5)

        for point_name, (px, py) in points.items():
            hits = {}
            for dir_name, (dx, dy) in primary_dirs.items():
                step = _walk_to_wall(wall_mask, px, py, dx, dy, max_search)
                if step < max_search:
                    hits[dir_name] = (px + dx * step, py + dy * step, dx, dy)
                else:
                    print(f"Primary Hit '{dir_name}': EXPIRED (No wall face found within {max_search}px)")

            if len(hits) == 2:
                hit_list = list(hits.values())
                actual_door_opening_px = math.hypot(
                    hit_list[0][0] - hit_list[1][0],
                    hit_list[0][1] - hit_list[1][1]
                )
                max_thick_cap = int(actual_door_opening_px//3)

                for dir_name, (hx, hy, dx, dy) in hits.items():
                    in_x = int(hx + dx)
                    in_y = int(hy + dy)

                    # Verify pixel value at starting step-in
                    start_val = wall_mask[in_y, in_x] if (0 <= in_y < wall_mask.shape[0] and 0 <= in_x < wall_mask.shape[1]) else -1

                    step_lengths = []
                    for s_idx, (sdx, sdy) in enumerate(secondary_dirs):
                        step_len = _walk_inside_wall_to_edge(
                            wall_mask, in_x, in_y, sdx, sdy, max_dist=max_thick_cap
                        )
                        step_lengths.append(step_len)

                    total_wall_thick_px = sum(step_lengths)
                    final_wall_thick_px = max(min(total_wall_thick_px, max_thick_cap), 6.0)

                    # Pull back by half jamb depth so it sits FLUSH against the wall surface
                    cx_px = hx - (dx * (JAMB_DEPTH_PX / 2.0))
                    cy_px = hy - (dy * (JAMB_DEPTH_PX / 2.0))

                    thick_offset_px = (step_lengths[1] - step_lengths[0]) / 2.0

                    if horizontal:
                        # step_lengths[0] is LEFT (-x), step_lengths[1] is RIGHT (+x)
                        start_edge_px = in_x - step_lengths[0]
                        end_edge_px = in_x + step_lengths[1]

                        final_wall_thick_px = max(min(end_edge_px - start_edge_px, max_thick_cap), 6.0)

                        cx_px = (start_edge_px + end_edge_px) / 2.0
                        cy_px = hy - (dy * (JAMB_DEPTH_PX / 2.0))
                    else:
                        # step_lengths[0] is UP (-y), step_lengths[1] is DOWN (+y)
                        start_edge_px = in_y - step_lengths[0]
                        end_edge_px = in_y + step_lengths[1]

                        final_wall_thick_px = max(min(end_edge_px - start_edge_px, max_thick_cap), 6.0)

                        cx_px = hx - (dx * (JAMB_DEPTH_PX / 2.0))
                        cy_px = (start_edge_px + end_edge_px) / 2.0

                    cx_ft = (cx_px - bx) / ppf
                    cy_ft = (bh - (cy_px - by)) / ppf
                    wall_thick_ft = final_wall_thick_px / ppf
                    jamb_depth_ft = JAMB_DEPTH_PX / ppf

                    if horizontal:
                        extents = [wall_thick_ft, jamb_depth_ft, WALL_HEIGHT]
                    else:
                        extents = [jamb_depth_ft, wall_thick_ft, WALL_HEIGHT]

                    jamb = trimesh.creation.box(extents=extents)
                    jamb.apply_translation([cx_ft, cy_ft, WALL_HEIGHT / 2.0])
                    jamb.visual.face_colors = np.tile(JAMB_COLOR, (len(jamb.faces), 1))
                    jamb_meshes.append(jamb)

    return jamb_meshes, door_meshes


def _row_scan_walls(
    boundary: np.ndarray,
    bx: int, by: int, bw: int, bh: int,
    ppf: float,
    window_bboxes: list[dict],
) -> list[tuple[trimesh.Trimesh, str]]:
    """
    Scan rows of the wall mask in strips.  For each horizontal run of
    wall pixels, create a box mesh. Doors are handled separately (see
    _build_door_meshes/_build_door_jambs) — the wall_mask passed in here
    already has door openings punched out, so a run simply stops at a door
    gap on its own via the normal "no wall pixels" logic, no door-specific
    handling needed in this function. If a run overlaps one or more windows,
    the run is split at each window's exact x-boundaries into wall/sill/
    header pieces plus a translucent glass pane, so windows read as real
    cuts in the wall rather than a solid box swapped for a different color.

    `window_bboxes` must already be pre-filtered by the caller (confidence)
    — this function does not re-check confidence.

    Returns a list of (mesh, kind) tuples — kind is "wall" for wall/sill/
    header pieces, "window" for the glass pane — so callers can tell real
    structural wall geometry apart from window panes (e.g. for wall_output/
    wall_mesh_count, which should only ever count real walls).

    Per-face colors are set with np.tile so trimesh renders them correctly.
    """
    meshes: list[tuple[trimesh.Trimesh, str]] = []

    for py in range(by, by + bh, STRIP_HEIGHT):
        row_end = min(py + STRIP_HEIGHT, by + bh)
        strip = boundary[py:row_end, bx:bx + bw]

        # Collapse the strip into a single row (OR of all rows)
        row = np.any(strip > 0, axis=0).astype(np.uint8)

        # Find runs of 1s
        run_start = None
        for px in range(len(row)):
            if row[px] and run_start is None:
                run_start = px
            elif (not row[px] or px == len(row) - 1) and run_start is not None:
                run_end = px if not row[px] else px + 1
                run_width_px = run_end - run_start
                if run_width_px < 2:
                    run_start = None
                    continue

                # Convert to feet
                run_width_ft = run_width_px / ppf
                strip_depth_ft = STRIP_HEIGHT / ppf
                center_x_ft = (run_start + run_width_px / 2) / ppf
                center_y_ft = (bh - (py - by + STRIP_HEIGHT / 2)) / ppf

                abs_cx = bx + run_start + run_width_px // 2
                abs_cy = py + STRIP_HEIGHT // 2

                row_windows = [
                    win for win in window_bboxes
                    if win["x"] < (bx + run_end) and (win["x"] + win["width"]) > (bx + run_start)
                    and (win["y"] - 25) <= abs_cy <= (win["y"] + win["height"] + 25)
                ]

                if row_windows:
                    row_windows.sort(key=lambda w: w["x"])

                    cur_x_px = run_start
                    for win in row_windows:
                        win_x1 = max(run_start, win["x"] - bx)
                        win_x2 = min(run_end, win["x"] + win["width"] - bx)

                        # 1. Wall segment before this window
                        if win_x1 > cur_x_px:
                            seg_w_ft = (win_x1 - cur_x_px) / ppf
                            seg_cx_ft = (cur_x_px + win_x1) / 2.0 / ppf
                            wall = trimesh.creation.box(extents=[seg_w_ft, strip_depth_ft, WALL_HEIGHT])
                            wall.apply_translation([seg_cx_ft, center_y_ft, WALL_HEIGHT / 2.0])
                            wall.visual.face_colors = np.tile(WALL_COLOR, (len(wall.faces), 1))
                            meshes.append((wall, "wall"))

                        # 2. Window stack (Sill, Pane, Header)
                        win_w_ft = (win_x2 - win_x1) / ppf
                        win_cx_ft = (win_x1 + win_x2) / 2.0 / ppf

                        # Sill
                        below = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_SILL_HEIGHT_FT])
                        below.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT / 2.0])
                        below.visual.face_colors = np.tile(WALL_COLOR, (len(below.faces), 1))
                        meshes.append((below, "wall"))

                        # Header
                        above_start = WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT
                        above_height = max(0.0, WALL_HEIGHT - above_start)
                        if above_height > 0:
                            above = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, above_height])
                            above.apply_translation([win_cx_ft, center_y_ft, above_start + above_height / 2.0])
                            above.visual.face_colors = np.tile(WALL_COLOR, (len(above.faces), 1))
                            meshes.append((above, "wall"))

                        # Glass Pane
                        pane = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_HEIGHT_FT])
                        pane.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT / 2.0])
                        pane.visual.face_colors = np.tile(WINDOW_COLOR, (len(pane.faces), 1))
                        meshes.append((pane, "window"))

                        cur_x_px = win_x2

                    # 3. Wall segment after the last window
                    if cur_x_px < run_end:
                        tail_w_ft = (run_end - cur_x_px) / ppf
                        tail_cx_ft = (cur_x_px + run_end) / 2.0 / ppf
                        wall = trimesh.creation.box(extents=[tail_w_ft, strip_depth_ft, WALL_HEIGHT])
                        wall.apply_translation([tail_cx_ft, center_y_ft, WALL_HEIGHT / 2.0])
                        wall.visual.face_colors = np.tile(WALL_COLOR, (len(wall.faces), 1))
                        meshes.append((wall, "wall"))

                else:
                    # Full wall
                    box = trimesh.creation.box(
                        extents=[run_width_ft, strip_depth_ft, WALL_HEIGHT]
                    )
                    box.apply_translation([center_x_ft, center_y_ft, WALL_HEIGHT / 2])
                    # FIX 2b: per-face color so trimesh renders it correctly
                    box.visual.face_colors = np.tile(WALL_COLOR, (len(box.faces), 1))
                    meshes.append((box, "wall"))

                run_start = None

    return meshes


def _room_floor_tiles(
    claimed: np.ndarray,
    rooms: list[dict],
    bx: int, by: int, bw: int, bh: int,
    ppf: float,
    tile_size_px: int = 12,
) -> list[trimesh.Trimesh]:
    """
    Create coloured floor tiles based on Voronoi room assignment.

    FIX 2a: Y axis is flipped so the model appears right-side up, matching
    the notebook formula:  y_ft = (bh - ty - tile_size_px) / ppf + tile_ft/2
    FIX 2b: Per-face colors applied with np.tile.
    """
    meshes: list[trimesh.Trimesh] = []
    tile_ft = tile_size_px / ppf

    for ty in range(0, bh, tile_size_px):
        for tx in range(0, bw, tile_size_px):
            # Check the full extents of the tile
            min_x = bx + tx
            max_x = bx + tx + tile_size_px
            min_y = by + ty
            max_y = by + ty + tile_size_px

            if not _in_bounds(min_x, min_y, max_x, max_y, bx, by, bw, bh):
                continue

            cy, cx = by + ty + tile_size_px // 2, bx + tx + tile_size_px // 2
            if cy >= claimed.shape[0] or cx >= claimed.shape[1]:
                continue
            room_idx = claimed[cy, cx]
            if room_idx < 0:
                continue

            room = rooms[room_idx]
            label = room["label"]

            # KNOWN LIMITATION MITIGATION, not a full fix: on floor plans with
            # open sections (no dividing wall between two areas), the Stage 3
            # flood-fill can leak through the opening and assign pixels far
            # from where a room actually is. Reject tiles that are wildly far
            # from the room's own OCR label center, scaled to that room's own
            # width/height (1.5x its bounding-box half-diagonal). The real fix
            # is to mark door openings as boundaries in the wall mask *before*
            # room assignment runs (Stage 3) — out of scope here; this filter
            # only prevents the worst mis-colored outliers from rendering.
            room_cx, room_cy = room.get("label_center", [0, 0])
            w_ft = room.get("width_ft")
            h_ft = room.get("height_ft")

            if w_ft is not None and h_ft is not None:
                rw = w_ft * ppf
                rh = h_ft * ppf
            else:
                rw = 20 * ppf
                rh = 20 * ppf

            dist_px = np.hypot(cx - room_cx, cy - room_cy)
            half_diag_px = np.hypot(rw, rh) / 2.0

            if dist_px > 1.5 * half_diag_px:
                continue

            color = _color_for_label(label)

            tile = trimesh.creation.box(extents=[tile_ft, tile_ft, 0.05])
            # Named variables make axis mapping explicit and easy to audit
            center_x = tx / ppf + tile_ft / 2
            center_y = (bh - ty - tile_size_px) / ppf + tile_ft / 2
            tile.apply_translation([center_x, center_y, -FLOOR_THICK / 2])
            # FIX 2b: per-face color so trimesh renders it correctly
            tile.visual.face_colors = np.tile(color, (len(tile.faces), 1))
            meshes.append(tile)

    return meshes


def _ft_to_label(val: float) -> str:
    """Convert decimal feet into standard architectural notation (e.g. 13.5 -> 13'-6\")."""
    ft = int(val)
    inches = int(round((val - ft) * 12.0))
    if inches == 12:
        ft += 1
        inches = 0
    return f"{ft}'-{inches}\""


def _build_dimension_annotations(
    rooms: list[dict],
    px_per_sqft: float,
    *,
    bx: int = 0,
    by: int = 0,
    bw: int = 0,
    bh: int = 0,
    wall_output: list[dict] | None = None,
) -> list[dict]:
    """
    Returns a list of dimension annotation dicts, one for each room with
    known width_ft/height_ft, plus one for each room's area label.
    Positioned at floor level (z=0.05) directly on top of the room's footprint,
    inset by DIMENSION_INSET_FT from walls so lines don't visually collide with them.
    Also emits one wall_length entry per wall segment in wall_output.

    Schema: every entry always has a "position" (the label anchor — the
    midpoint of the measured span, when there is one). "room_width",
    "room_height", and "wall_length" entries additionally carry "line_start"
    and "line_end" — the two endpoints of the actual span the number
    measures, so the frontend can draw a plain line between them. "room_area"
    entries never get line_start/line_end, since an area doesn't correspond
    to a single edge.
    """
    annotations: list[dict] = []
    ppf = math.sqrt(px_per_sqft) if px_per_sqft > 0 else 1.0
    z_pos = round(FLOOR_THICK + 0.05, 2)  # Just slightly above floor level

    def _flip_y(y_px: float) -> float:
        """Convert an absolute pixel Y to feet-space Y under the same
        convention used in _row_scan_walls and _room_floor_tiles:
        feet-space Y increases toward the image's top edge (small pixel Y)."""
        return (bh - (y_px - by)) / ppf

    floor_w_ft = bw / ppf
    floor_h_ft = bh / ppf

    def _line(x1_ft: float, y1_ft: float, x2_ft: float, y2_ft: float) -> dict:
        """Build the line_start/line_end pair for the span a label measures."""
        return {
            "line_start": {"x": x1_ft, "y": y1_ft, "z": z_pos},
            "line_end": {"x": x2_ft, "y": y2_ft, "z": z_pos},
        }

    def _add_annot(kind: str, label: str, x_ft: float, y_ft: float, **extra):
        abs_x = x_ft * ppf + bx
        abs_y = y_ft * ppf + by
        if _in_bounds(abs_x, abs_y, abs_x, abs_y, bx, by, bw, bh):
            annotations.append({
                "position": {"x": x_ft, "y": y_ft, "z": z_pos},
                "label": label,
                "kind": kind,
                **extra,
            })

    for idx, room in enumerate(rooms):
        w_ft = room.get("width_ft")
        h_ft = room.get("height_ft")
        area = room.get("area_sqft")
        cx_px, cy_px = room.get("label_center", [bx, by])
        cx_ft = round((cx_px - bx) / ppf, 2)
        cy_ft = round(_flip_y(cy_px), 2)

        # Emit room_area label-only point entry at room center
        if area is not None and area > 0:
            _add_annot("room_area", f"{int(round(area))} sq ft", cx_ft, cy_ft)

        if w_ft is not None and h_ft is not None and w_ft > 0 and h_ft > 0:
            # Derive both the line's length AND its position purely from the
            # reliable OCR values (cx_ft/cy_ft/w_ft/h_ft), the same numbers
            # already used for the label text — not from room_polygons/claimed
            # (Stage 3/4's flood-fill output), which can leak through an open
            # doorway into a neighboring room and produce a line that no
            # longer matches the number next to it, or lands entirely outside
            # the building's own bounds.
            min_x_ft = cx_ft - w_ft / 2.0
            max_x_ft = cx_ft + w_ft / 2.0
            min_y_ft = cy_ft - h_ft / 2.0
            max_y_ft = cy_ft + h_ft / 2.0

            # Horizontal label (room_width): line spans exactly w_ft, placed
            # along X at a Y anchored near the top interior edge. Under the
            # flipped Y convention, the image's top edge (visually) is now
            # the *larger* feet-space Y, so anchor near max_y_ft.
            width_y = round(max_y_ft - max(DIMENSION_INSET_FT, h_ft * 0.15), 2)
            _add_annot(
                "room_width", _ft_to_label(w_ft), cx_ft, width_y,
                **_line(round(min_x_ft, 2), width_y, round(max_x_ft, 2), width_y),
            )

            # Vertical label (room_height): line spans exactly h_ft, placed
            # along Y at an X anchored near the left interior edge.
            height_x = round(min_x_ft + max(DIMENSION_INSET_FT, w_ft * 0.15), 2)
            _add_annot(
                "room_height", _ft_to_label(h_ft), height_x, cy_ft,
                **_line(height_x, round(min_y_ft, 2), height_x, round(max_y_ft, 2)),
            )

    if wall_output:
        for w in wall_output:
            wx, wy, ww, wh = w["x"], w["y"], w["width"], w["height"]
            # A wall counts as a perimeter wall if any of its edges sit within
            # PERIMETER_TOL_FT of the building's own outer bounding box edge
            # (0, 0, floor_w_ft, floor_h_ft), allowing slack for wall thickness.
            is_perimeter = (
                wx <= PERIMETER_TOL_FT
                or wy <= PERIMETER_TOL_FT
                or (floor_w_ft - (wx + ww)) <= PERIMETER_TOL_FT
                or (floor_h_ft - (wy + wh)) <= PERIMETER_TOL_FT
            )
            if ww >= wh:
                if ww < MIN_DIMENSIONABLE_WALL_FT:
                    continue
                # Horizontal wall along X — span runs along its centerline
                cy = round(wy + wh / 2.0, 2)
                cx = round(wx + ww / 2.0, 2)
                _add_annot(
                    "wall_length", _ft_to_label(ww), cx, cy, is_perimeter=is_perimeter,
                    **_line(round(wx, 2), cy, round(wx + ww, 2), cy),
                )
            else:
                if wh < MIN_DIMENSIONABLE_WALL_FT:
                    continue
                # Vertical wall along Y — span runs along its centerline
                cx = round(wx + ww / 2.0, 2)
                cy = round(wy + wh / 2.0, 2)
                _add_annot(
                    "wall_length", _ft_to_label(wh), cx, cy, is_perimeter=is_perimeter,
                    **_line(cx, round(wy, 2), cx, round(wy + wh, 2)),
                )

    return annotations


def _merge_walls(walls: list[dict], tol: float = 0.2) -> list[dict]:
    merged = []
    used = [False] * len(walls)
    for i in range(len(walls)):
        if used[i]: continue
        base = walls[i].copy()
        used[i] = True
        changed = True
        while changed:
            changed = False
            for j in range(len(walls)):
                if used[j]: continue
                curr = walls[j]
                # Vertical merge
                if abs(base["x"] - curr["x"]) < tol and abs(base["width"] - curr["width"]) < tol:
                    if max(base["y"], curr["y"]) <= min(base["y"] + base["height"], curr["y"] + curr["height"]) + tol:
                        min_y = min(base["y"], curr["y"])
                        max_y = max(base["y"] + base["height"], curr["y"] + curr["height"])
                        base["y"] = round(min_y, 2)
                        base["height"] = round(max_y - min_y, 2)
                        used[j] = True
                        changed = True
                # Horizontal merge
                elif abs(base["y"] - curr["y"]) < tol and abs(base["height"] - curr["height"]) < tol:
                    if max(base["x"], curr["x"]) <= min(base["x"] + base["width"], curr["x"] + curr["width"]) + tol:
                        min_x = min(base["x"], curr["x"])
                        max_x = max(base["x"] + base["width"], curr["x"] + curr["width"])
                        base["x"] = round(min_x, 2)
                        base["width"] = round(max_x - min_x, 2)
                        used[j] = True
                        changed = True
        merged.append(base)
    return merged


def _dedup_parallel_walls(walls: list[dict], max_dist: float = 1.5) -> list[dict]:
    deduped = []
    used = [False] * len(walls)
    for i in range(len(walls)):
        if used[i]: continue
        w1 = walls[i]
        deduped.append(w1)
        used[i] = True

        w1_is_horiz = w1["width"] >= w1["height"]

        for j in range(i + 1, len(walls)):
            if used[j]: continue
            w2 = walls[j]
            w2_is_horiz = w2["width"] >= w2["height"]

            if w1_is_horiz and w2_is_horiz:
                if abs(w1["y"] - w2["y"]) <= max_dist:
                    if max(w1["x"], w2["x"]) < min(w1["x"] + w1["width"], w2["x"] + w2["width"]):
                        used[j] = True
            elif not w1_is_horiz and not w2_is_horiz:
                if abs(w1["x"] - w2["x"]) <= max_dist:
                    if max(w1["y"], w2["y"]) < min(w1["y"] + w1["height"], w2["y"] + w2["height"]):
                        used[j] = True
    return deduped


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def run(image: np.ndarray, context: dict) -> dict:
    """
    Stage 5 entry point.

    Requires context keys from stages 1-4:
      - ``combined_boundary``
      - ``claimed``
      - ``rooms``
      - ``px_per_sqft``
      - ``door_bboxes``
      - ``door_cuts``
      - ``validation_warnings``

    Adds to context:
      - ``glb_base64``          — base64-encoded GLB bytes
      - ``building_width_ft``   — building width in feet
      - ``building_height_ft``  — building depth in feet
      - ``wall_mesh_count``     — number of wall mesh pieces
      - ``room_output``         — enriched room list for JSON response
      - ``wall_output``         — wall bounding info for JSON response
      - ``dimension_annotations`` — label-only dimension callouts
    """
    ctx = {**context}

    boundary = ctx["combined_boundary"]
    claimed = ctx["claimed"]
    rooms = ctx["rooms"]
    px_per_sqft = ctx["px_per_sqft"]
    door_bboxes = ctx.get("door_bboxes", [])
    door_cuts = ctx.get("door_cuts", [])
    window_bboxes = ctx.get("window_bboxes", [])

    # Pixels-per-foot (linear)
    ppf = math.sqrt(px_per_sqft)

    # Building bounding box
    bx, by, bw, bh = _find_building_bbox(boundary)
    floor_w_ft = bw / ppf
    floor_h_ft = bh / ppf

    logger.info(
        "Building bbox: bx=%d by=%d bw=%d bh=%d  → %.1f × %.1f ft  ppf=%.2f",
        bx, by, bw, bh, floor_w_ft, floor_h_ft, ppf,
    )

    # Clear the artificial perimeter seal from the wall boundary for 3D extrusion
    wall_mask = boundary.copy()
    wall_mask[by : by + SEAL_THICKNESS, :] = 0
    wall_mask[by + bh - SEAL_THICKNESS : by + bh, :] = 0
    wall_mask[:, bx : bx + SEAL_THICKNESS] = 0
    wall_mask[:, bx + bw - SEAL_THICKNESS : bx + bw] = 0

    # Punch door openings out of the wall mask so the row-scan below leaves a
    # real physical gap there (doors get their own dedicated slab + jamb
    # meshes below, built from door_cuts rather than as an inline row-scan case).
    for door in door_bboxes:
        dx1, dy1 = door["x"], door["y"]
        dx2, dy2 = dx1 + door["width"], dy1 + door["height"]
        wall_mask[dy1:dy2, dx1:dx2] = 0

    clean_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    wall_mask = cv2.morphologyEx(wall_mask, cv2.MORPH_OPEN, clean_kernel)

    # Only render windows that pass the confidence gate (matches the same
    # threshold used for the JSON `windows` response field in main.py).
    valid_windows = [
        w for w in window_bboxes
        if w.get("confidence", 1.0) >= WINDOW_CONF_THRESHOLD or w.get("llm_confirmed")
    ]

    scene = trimesh.Scene()

    # --- Walls + Windows ---
    scanned_elements = _row_scan_walls(wall_mask, bx, by, bw, bh, ppf, valid_windows)
    counts = {"wall": 0, "window": 0}
    wall_meshes = []
    for m, kind in scanned_elements:
        idx = counts[kind]
        counts[kind] += 1
        scene.add_geometry(m, node_name=f"{kind}_{idx}", geom_name=f"{kind}_{idx}")
        if kind == "wall":
            wall_meshes.append(m)

    # --- Doors + jambs ---
    # New workflow to build both doors and jambs together cleanly
    # jamb_meshes, door_meshes = _build_doors_and_jambs(door_cuts, wall_mask, bx, by, bh, ppf)
    door_meshes = _build_door_meshes(door_cuts, bx, by, bh, ppf)
    for i, m in enumerate(door_meshes):
        scene.add_geometry(m, node_name=f"door_{i}", geom_name=f"door_{i}")

    jamb_meshes = _build_door_jambs(door_cuts, wall_mask, bx, by, bh, ppf)
    for i, m in enumerate(jamb_meshes):
        scene.add_geometry(m, node_name=f"door_jamb_{i}", geom_name=f"door_jamb_{i}")

    # --- Floor tiles ---
    tile_meshes = _room_floor_tiles(claimed, rooms, bx, by, bw, bh, ppf)
    for i, m in enumerate(tile_meshes):
        scene.add_geometry(m, node_name=f"tile_{i}", geom_name=f"tile_{i}")

    # --- Ground plane ---
    ground = trimesh.creation.box(extents=[floor_w_ft + 2, floor_h_ft + 2, FLOOR_THICK])
    ground.apply_translation([floor_w_ft / 2, floor_h_ft / 2, -FLOOR_THICK])
    # FIX 2c: per-face color so trimesh renders it correctly
    ground.visual.face_colors = np.tile(GROUND_COLOR, (len(ground.faces), 1))
    scene.add_geometry(ground, node_name="ground", geom_name="ground")

    # --- Export GLB ---
    buf = io.BytesIO()
    scene.export(buf, file_type="glb")
    glb_bytes = buf.getvalue()
    glb_b64 = base64.b64encode(glb_bytes).decode("ascii")

    logger.info(
        "GLB exported: %.1f KB, walls=%d floor_tiles=%d doors=%d jambs=%d",
        len(glb_bytes) / 1024,
        len(wall_meshes),
        len(tile_meshes),
        len(door_meshes),
        len(jamb_meshes),
    )

    # --- Build JSON-friendly output ---
    room_output = []
    for idx, room in enumerate(rooms):
        cx_px, cy_px = room["label_center"]
        label_base = room["label"].upper().split("_")[0]
        rgb = ROOM_COLORS.get(label_base, [70, 70, 70])
        room_output.append({
            "id": f"room_{idx}",
            "label": room["label"],
            "area_sqft": room.get("area_sqft") or 0,
            "width_ft": room.get("width_ft"),
            "height_ft": room.get("height_ft"),
            "center": {
                "x": round((cx_px - bx) / ppf, 2),
                # Flipped to match the same Y convention as walls/tiles/dimensions
                # (feet-space Y increases toward the image's top edge).
                "y": round((bh - (cy_px - by)) / ppf, 2),
            },
            "color": rgb,
        })

    wall_output = []
    for i, m in enumerate(wall_meshes):
        bounds = m.bounds  # [[min_x,min_y,min_z],[max_x,max_y,max_z]]
        wall_output.append({
            "x": round(float(bounds[0][0]), 2),
            "y": round(float(bounds[0][1]), 2),
            "width": round(float(bounds[1][0] - bounds[0][0]), 2),
            "height": round(float(bounds[1][1] - bounds[0][1]), 2),
        })

    merged_wall_output = _merge_walls(wall_output)
    deduped_wall_output = _dedup_parallel_walls(merged_wall_output)

    dim_annots = _build_dimension_annotations(
        rooms, px_per_sqft,
        bx=bx, by=by, bw=bw, bh=bh, wall_output=deduped_wall_output,
    )

    ctx["glb_base64"] = glb_b64
    ctx["building_width_ft"] = round(floor_w_ft, 2)
    ctx["building_height_ft"] = round(floor_h_ft, 2)
    ctx["wall_mesh_count"] = len(wall_meshes)
    ctx["room_output"] = room_output
    ctx["wall_output"] = wall_output
    ctx["dimension_annotations"] = dim_annots

    return ctx

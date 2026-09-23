"""
Stage 5 — 3D Export (trimesh row-scan extrusion → GLB)
=======================================================

Converts the binary wall mask and room assignments into a 3D GLB scene
using trimesh.  Walls are row-scanned and extruded as boxes; rooms get
coloured floor tiles; a ground plane is added.

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
SEAL_THICKNESS        = 8         # parameter sealing wall thickness
WINDOW_SILL_HEIGHT_FT = 3.0       # from floor to bottom of window opening
WINDOW_HEIGHT_FT      = 4.0       # opening height above the sill

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
DOOR_COLOR = [100, 70, 40, 255]
JAMB_COLOR = [60, 42, 62, 180]
DOOR_FRAME_THICKNESS_PX = 4  # nominal thickness for a door cut, independent of wall band sampling
JAMB_DEPTH_PX = 3.0


def _color_for_label(label: str) -> list[int]:
    """
    Return [R, G, B, A] for a room label.  Looks up the canonical prefix.
    """
    upper = label.upper().split("_")[0]  # "BEDROOM_2" → "BEDROOM"
    rgb = ROOM_COLORS.get(upper, [70, 70, 70])
    return [*rgb, 255]


def _find_building_bbox(boundary: np.ndarray) -> tuple[int, int, int, int]:
    """Return (bx, by, bw, bh) bounding rect of all wall pixels.

    Shrunk by 10 px on each side to exclude stray annotation pixels
    (dimension lines, title blocks, etc.) that sit at the image border.
    """
    coords = cv2.findNonZero(boundary)
    if coords is None:
        h, w = boundary.shape
        return 0, 0, w, h
    bx, by, bw, bh = cv2.boundingRect(coords)
    # Shrink by 10 px per edge to discard border noise
    # bx = max(0, bx + 8)
    # by = max(0, by + 8)
    # bw = max(10, bw - 16)
    # bh = max(10, bh - 16)
    return bx, by, bw, bh


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
) -> list[trimesh.Trimesh]:
    """
    Scan rows of the wall mask in strips.  For each horizontal run of
    wall pixels, create a box mesh.  If a run overlaps a door bounding box,
    create a thin indicator instead of a full-height wall.

    Per-face colors are set with np.tile so trimesh renders them correctly.
    """
    meshes: list[trimesh.Trimesh] = []

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

                # Check if this run overlaps a window bbox
                is_window = False
                abs_cx = bx + run_start + run_width_px // 2
                abs_cy = py + STRIP_HEIGHT // 2

                for win in window_bboxes:
                    wx, wy, ww, wh = win["x"], win["y"], win["width"], win["height"]
                    if wx <= abs_cx <= wx + ww and wy <= abs_cy <= wy + wh:
                        is_window = True
                        break

                if any(
                    win["x"] < (bx + run_end) and (win["x"] + win["width"]) > (bx + run_start)
                    and (win["y"] - 25) <= abs_cy <= (win["y"] + win["height"] + 25)
                    for win in window_bboxes
                ):
                    # Find all windows intersecting this horizontal run, sorted left-to-right
                    row_windows = [
                        win for win in window_bboxes
                        if win["x"] < (bx + run_end) and (win["x"] + win["width"]) > (bx + run_start)
                        and (win["y"] - 25) <= abs_cy <= (win["y"] + win["height"] + 25)
                    ]
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
                            meshes.append(wall)

                        # 2. Window stack (Sill, Pane, Header)
                        win_w_ft = (win_x2 - win_x1) / ppf
                        win_cx_ft = (win_x1 + win_x2) / 2.0 / ppf

                        # Sill
                        below = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_SILL_HEIGHT_FT])
                        below.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT / 2.0])
                        below.visual.face_colors = np.tile(WALL_COLOR, (len(below.faces), 1))
                        meshes.append(below)

                        # Header
                        above_start = WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT
                        above_height = max(0.0, WALL_HEIGHT - above_start)
                        if above_height > 0:
                            above = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, above_height])
                            above.apply_translation([win_cx_ft, center_y_ft, above_start + above_height / 2.0])
                            above.visual.face_colors = np.tile(WALL_COLOR, (len(above.faces), 1))
                            meshes.append(above)

                        # Glass Pane
                        pane = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_HEIGHT_FT])
                        pane.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT / 2.0])
                        pane.visual.face_colors = np.tile(WINDOW_COLOR, (len(pane.faces), 1))
                        meshes.append(pane)

                        cur_x_px = win_x2

                    # 3. Wall segment after the last window
                    if cur_x_px < run_end:
                        tail_w_ft = (run_end - cur_x_px) / ppf
                        tail_cx_ft = (cur_x_px + run_end) / 2.0 / ppf
                        wall = trimesh.creation.box(extents=[tail_w_ft, strip_depth_ft, WALL_HEIGHT])
                        wall.apply_translation([tail_cx_ft, center_y_ft, WALL_HEIGHT / 2.0])
                        wall.visual.face_colors = np.tile(WALL_COLOR, (len(wall.faces), 1))
                        meshes.append(wall)

                else:
                    # Full wall
                    box = trimesh.creation.box(
                        extents=[run_width_ft, strip_depth_ft, WALL_HEIGHT]
                    )
                    box.apply_translation([center_x_ft, center_y_ft, WALL_HEIGHT / 2])
                    # FIX 2b: per-face color so trimesh renders it correctly
                    box.visual.face_colors = np.tile(WALL_COLOR, (len(box.faces), 1))
                    meshes.append(box)

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
            cy, cx = by + ty + tile_size_px // 2, bx + tx + tile_size_px // 2
            if cy >= claimed.shape[0] or cx >= claimed.shape[1]:
                continue
            room_idx = claimed[cy, cx]
            if room_idx < 0:
                continue

            label = rooms[room_idx]["label"]
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
      - ``validation_warnings``

    Adds to context:
      - ``glb_base64``          — base64-encoded GLB bytes
      - ``building_width_ft``   — building width in feet
      - ``building_height_ft``  — building depth in feet
      - ``wall_mesh_count``     — number of wall mesh pieces
      - ``room_output``         — enriched room list for JSON response
      - ``wall_output``         — wall bounding info for JSON response
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
    
    # Clear the 5px artificial perimeter seal from the wall boundary for 3D extrusion
    wall_mask = boundary.copy()
    wall_mask[by : by + SEAL_THICKNESS, :] = 0
    wall_mask[by + bh - SEAL_THICKNESS : by + bh, :] = 0
    wall_mask[:, bx : bx + SEAL_THICKNESS] = 0
    wall_mask[:, bx + bw - SEAL_THICKNESS : bx + bw] = 0

    for door in door_bboxes:
        dx1, dy1 = door["x"], door["y"]
        dx2, dy2 = dx1 + door["width"], dy1 + door["height"]
        wall_mask[dy1:dy2, dx1:dx2] = 0
    
    clean_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    wall_mask = cv2.morphologyEx(wall_mask, cv2.MORPH_OPEN, clean_kernel)

    scene = trimesh.Scene()
    wall_meshes = _row_scan_walls(wall_mask, bx, by, bw, bh, ppf, window_bboxes)
    for i, m in enumerate(wall_meshes):
        scene.add_geometry(m, node_name=f"wall_{i}")
        
    # New workflow to build both doors and jambs together cleanly
    # jamb_meshes, door_meshes = _build_doors_and_jambs(door_cuts, wall_mask, bx, by, bh, ppf)
    
    door_meshes = _build_door_meshes(door_cuts, bx, by, bh, ppf)
    for i, m in enumerate(door_meshes):
        scene.add_geometry(m, node_name=f"door_{i}")

    jamb_meshes = _build_door_jambs(door_cuts, wall_mask, bx, by, bh, ppf)
    for i, m in enumerate(jamb_meshes):
        scene.add_geometry(m, node_name=f"door_jamb_{i}")    
    tile_meshes = []

    # --- Ground plane ---
    ground = trimesh.creation.box(extents=[floor_w_ft + 2, floor_h_ft + 2, FLOOR_THICK])
    ground.apply_translation([floor_w_ft / 2, floor_h_ft / 2, -FLOOR_THICK])
    # FIX 2c: per-face color so trimesh renders it correctly
    ground.visual.face_colors = np.tile(GROUND_COLOR, (len(ground.faces), 1))
    scene.add_geometry(ground, node_name="ground")

    # --- Export GLB ---
    buf = io.BytesIO()
    scene.export(buf, file_type="glb")
    glb_bytes = buf.getvalue()
    glb_b64 = base64.b64encode(glb_bytes).decode("ascii")

    logger.info(
        "GLB exported: %.1f KB, walls=%d floor_tiles=%d",
        len(glb_bytes) / 1024,
        len(wall_meshes),
        len(tile_meshes),
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
            "center": {
                "x": round((cx_px - bx) / ppf, 2),
                "y": round((cy_px - by) / ppf, 2),
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
            "height": round(float(bounds[1][2] - bounds[0][2]), 2),
        })

    ctx["glb_base64"] = glb_b64
    ctx["building_width_ft"] = round(floor_w_ft, 2)
    ctx["building_height_ft"] = round(floor_h_ft, 2)
    ctx["wall_mesh_count"] = len(wall_meshes)
    ctx["room_output"] = room_output
    ctx["wall_output"] = wall_output

    return ctx

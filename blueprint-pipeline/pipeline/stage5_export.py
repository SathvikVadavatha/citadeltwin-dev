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


def _row_scan_walls(
    boundary: np.ndarray,
    bx: int, by: int, bw: int, bh: int,
    ppf: float,
    door_bboxes: list[dict],
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

                # Check if this run overlaps a door bbox
                is_door = False
                is_window = False
                abs_cx = bx + run_start + run_width_px // 2
                abs_cy = py + STRIP_HEIGHT // 2
                for door in door_bboxes:
                    dx, dy, dw, dh = door["x"], door["y"], door["width"], door["height"]
                    if dx <= abs_cx <= dx + dw and dy <= abs_cy <= dy + dh:
                        is_door = True
                        break
                
                if not is_door:
                    for win in window_bboxes:
                        wx, wy, ww, wh = win["x"], win["y"], win["width"], win["height"]
                        if wx <= abs_cx <= wx + ww and wy <= abs_cy <= wy + wh:
                            is_window = True
                            break

                if is_door:
                    # Thin door indicator (0.1 ft tall) — brown tint
                    box = trimesh.creation.box(
                        extents=[run_width_ft, strip_depth_ft, 0.1]
                    )
                    box.apply_translation([center_x_ft, center_y_ft, 0.05])
                    # FIX 2b: per-face color so trimesh renders it correctly
                    door_color = [100, 70, 40, 255]
                    box.visual.face_colors = np.tile(door_color, (len(box.faces), 1))
                    meshes.append(box)
                
                elif is_window:
                    win_x1 = win["x"]
                    win_x2 = win["x"] + win["width"]
                    # window's own center, in ft, relative to bx
                    win_cx_ft = (win_x1 + win_x2 - 2 * bx) / (2 * ppf)
                    win_w_ft = win["width"] / ppf

                    # Wall segment before the window (if the run extends past win_x1)
                    pre_start_px = run_start
                    pre_end_px = max(run_start, win_x1 - bx)
                    if pre_end_px > pre_start_px:
                        pre_w_ft = (pre_end_px - pre_start_px) / ppf
                        pre_cx_ft = (pre_start_px + pre_end_px) / 2 / ppf
                        wall = trimesh.creation.box(extents=[pre_w_ft, strip_depth_ft, WALL_HEIGHT])
                        wall.apply_translation([pre_cx_ft, center_y_ft, WALL_HEIGHT / 2])
                        wall.visual.face_colors = np.tile(WALL_COLOR, (len(wall.faces), 1))
                        meshes.append(wall)

                    # Window stack, sized/positioned from the window's real bbox
                    below = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_SILL_HEIGHT_FT])
                    below.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT / 2])
                    below.visual.face_colors = np.tile(WALL_COLOR, (len(below.faces), 1))
                    meshes.append(below)

                    above_start = WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT
                    above_height = WALL_HEIGHT - above_start
                    if above_height > 0:
                        above = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, above_height])
                        above.apply_translation([win_cx_ft, center_y_ft, above_start + above_height / 2])
                        above.visual.face_colors = np.tile(WALL_COLOR, (len(above.faces), 1))
                        meshes.append(above)

                    pane = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_HEIGHT_FT])
                    pane.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT_FT + WINDOW_HEIGHT_FT / 2])
                    pane.visual.face_colors = np.tile(WINDOW_COLOR, (len(pane.faces), 1))
                    meshes.append(pane)

                    # Wall segment after the window (if the run extends past win_x2)
                    post_start_px = min(run_end, win_x2 - bx)
                    post_end_px = run_end
                    if post_end_px > post_start_px:
                        post_w_ft = (post_end_px - post_start_px) / ppf
                        post_cx_ft = (post_start_px + post_end_px) / 2 / ppf
                        wall = trimesh.creation.box(extents=[post_w_ft, strip_depth_ft, WALL_HEIGHT])
                        wall.apply_translation([post_cx_ft, center_y_ft, WALL_HEIGHT / 2])
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

    scene = trimesh.Scene()

    # --- Walls ---
    wall_meshes = _row_scan_walls(boundary, bx, by, bw, bh, ppf, door_bboxes, window_bboxes)
    for i, m in enumerate(wall_meshes):
        scene.add_geometry(m, node_name=f"wall_{i}")

    # --- Floor tiles ---
    # tile_meshes = _room_floor_tiles(claimed, rooms, bx, by, bw, bh, ppf)
    # for i, m in enumerate(tile_meshes):
    #     scene.add_geometry(m, node_name=f"tile_{i}")
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

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
WALL_HEIGHT = 9.0       # feet
FLOOR_THICK = 0.1       # feet
STRIP_HEIGHT = 3         # pixels per row-scan strip
WALL_THICKNESS = 0.5     # feet — rendered thickness for wall boxes
DIMENSION_INSET_FT = 0.15 # feet — interior inset for room dimension lines to avoid wall collisions
MIN_DIMENSIONABLE_WALL_FT = 1.5 # feet — ignore tiny noise fragments
PERIMETER_TOL_FT = 1.0 # feet — how close a wall edge must sit to the building's outer bbox edge to count as a perimeter wall (allows for wall thickness)
WINDOW_CONF_THRESHOLD = 0.3
# merged from origin/main (Tanzim): sill/header height values adopted along
# with his precise per-window wall-cut geometry (see _row_scan_walls below).
WINDOW_SILL_HEIGHT = 3.0
WINDOW_HEIGHT = 4.0
SEAL_THICKNESS = 8       # px — clears stage1's 5px artificial perimeter-seal stroke before wall extrusion


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

WALL_COLOR = [180, 175, 165, 255]    # warm off-white
GROUND_COLOR = [30, 30, 30, 255]     # dark grey — visibly darker than floor tiles
WINDOW_COLOR = [150, 200, 220, 180]  # light blue-glass tint, semi-transparent (merged from origin/main)


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
    import logging
    logger = logging.getLogger(__name__)

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

    # NOTE (merged from origin/main, Tanzim commit "fix: stop cropping border
    # walls out of bbox"): this used to shrink the bbox by 8px per edge to
    # discard border noise, but that also cropped real exterior wall pixels
    # that sit right at the tight bounding rect of the largest connected
    # component. Disabled per that fix — do not reintroduce without also
    # re-verifying it doesn't clip real border walls.
    # bx = max(0, bx + 8)
    # by = max(0, by + 8)
    # bw = max(10, bw - 16)
    # bh = max(10, bh - 16)
    return bx, by, bw, bh


def _in_bounds(min_x: float, min_y: float, max_x: float, max_y: float, bx: float, by: float, bw: float, bh: float) -> bool:
    """Return True if the entire footprint [min_x, max_x] x [min_y, max_y] is strictly within [bx, bx+bw] x [by, by+bh]."""
    return (min_x >= bx) and (max_x <= bx + bw) and (min_y >= by) and (max_y <= by + bh)


def _row_scan_walls(
    boundary: np.ndarray,
    bx: int, by: int, bw: int, bh: int,
    ppf: float,
    door_bboxes: list[dict],
    window_bboxes: list[dict],
) -> list[tuple[trimesh.Trimesh, str]]:
    """
    Scan rows of the wall mask in strips.  For each horizontal run of
    wall pixels, create a box mesh.  If a run overlaps a door bounding box,
    create a thin indicator instead of a full-height wall.  If a run overlaps
    one or more windows, the run is split at each window's exact x-boundaries
    into wall/sill/header pieces plus a translucent glass pane, so windows
    read as real cuts in the wall rather than a solid box swapped for a
    different color.

    `window_bboxes` must already be pre-filtered by the caller (confidence /
    llm_confirmed) — this function does not re-check confidence.

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

                # Check bounds using absolute px coordinates of the run's full extents
                abs_min_x = bx + run_start
                abs_max_x = bx + run_end
                abs_min_y = py
                abs_max_y = py + STRIP_HEIGHT
                if not _in_bounds(abs_min_x, abs_min_y, abs_max_x, abs_max_y, bx, by, bw, bh):
                    # Truncate if it's partially outside? 
                    # The strip is extracted as bx:bx+bw so the math guarantees abs_max_x <= bx + bw.
                    # This check is just extra strictness.
                    pass

                # Convert to feet
                run_width_ft = run_width_px / ppf
                strip_depth_ft = STRIP_HEIGHT / ppf
                center_x_ft = (run_start + run_width_px / 2.0) / ppf
                # RESOLVED (previously flagged as a conflict with origin/main,
                # Tanzim, signed off by leads): his commit "align wall/room
                # Y-axis convention" flips this from the plain top-down pixel
                # offset to `(bh - dy_px) / ppf`, so feet-space Y increases
                # upward (toward the image's top edge) instead of downward.
                # Applied here, and the same flip is now also applied in
                # `_room_floor_tiles` and `_build_dimension_annotations` below
                # so walls, floor tiles, and dimension labels all agree on one
                # convention instead of walls alone using his and everything
                # else staying on the old one.
                center_y_ft = (bh - (py - by + STRIP_HEIGHT / 2.0)) / ppf

                # Check if this run overlaps a door bbox
                is_door = False
                abs_cx = bx + run_start + run_width_px // 2
                abs_cy = py + STRIP_HEIGHT // 2
                for door in door_bboxes:
                    dx, dy, dw, dh = door["x"], door["y"], door["width"], door["height"]
                    if dx <= abs_cx <= dx + dw and dy <= abs_cy <= dy + dh:
                        is_door = True
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
                    meshes.append((box, "door"))
                    run_start = None
                    continue

                # Windows intersecting this run (already pre-filtered by
                # confidence/llm_confirmed in run() before being passed in).
                # merged from origin/main (Tanzim): precise per-window wall
                # cut — split the wall run into wall/sill/header/pane pieces
                # at each window's exact x-boundaries, instead of rendering
                # the whole run as a single window box.
                row_windows = [
                    win for win in window_bboxes
                    if win["x"] < (bx + run_end) and (win["x"] + win["width"]) > (bx + run_start)
                    and (win["y"] - 25) <= abs_cy <= (win["y"] + win["height"] + 25)
                ]

                if not row_windows:
                    # Full wall
                    box = trimesh.creation.box(
                        extents=[run_width_ft, strip_depth_ft, WALL_HEIGHT]
                    )
                    box.apply_translation([center_x_ft, center_y_ft, WALL_HEIGHT / 2])
                    # FIX 2b: per-face color so trimesh renders it correctly
                    box.visual.face_colors = np.tile(WALL_COLOR, (len(box.faces), 1))
                    meshes.append((box, "wall"))
                else:
                    row_windows.sort(key=lambda w: w["x"])
                    cur_x_px = run_start

                    def _wall_piece(x1_px: float, x2_px: float, height: float, z_center: float):
                        seg_w_ft = (x2_px - x1_px) / ppf
                        seg_cx_ft = (x1_px + x2_px) / 2.0 / ppf
                        wall = trimesh.creation.box(extents=[seg_w_ft, strip_depth_ft, height])
                        wall.apply_translation([seg_cx_ft, center_y_ft, z_center])
                        wall.visual.face_colors = np.tile(WALL_COLOR, (len(wall.faces), 1))
                        return wall

                    for win in row_windows:
                        win_x1 = max(run_start, win["x"] - bx)
                        win_x2 = min(run_end, win["x"] + win["width"] - bx)

                        # 1. Wall segment before this window
                        if win_x1 > cur_x_px:
                            meshes.append((_wall_piece(cur_x_px, win_x1, WALL_HEIGHT, WALL_HEIGHT / 2.0), "wall"))

                        # 2. Window stack (sill, pane, header)
                        win_w_ft = (win_x2 - win_x1) / ppf
                        win_cx_ft = (win_x1 + win_x2) / 2.0 / ppf

                        if WINDOW_SILL_HEIGHT > 0:
                            meshes.append((_wall_piece(win_x1, win_x2, WINDOW_SILL_HEIGHT, WINDOW_SILL_HEIGHT / 2.0), "wall"))

                        header_start = WINDOW_SILL_HEIGHT + WINDOW_HEIGHT
                        header_height = max(0.0, WALL_HEIGHT - header_start)
                        if header_height > 0:
                            meshes.append((_wall_piece(win_x1, win_x2, header_height, header_start + header_height / 2.0), "wall"))

                        pane = trimesh.creation.box(extents=[win_w_ft, strip_depth_ft, WINDOW_HEIGHT])
                        pane.apply_translation([win_cx_ft, center_y_ft, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT / 2.0])
                        pane.visual.face_colors = np.tile(WINDOW_COLOR, (len(pane.faces), 1))
                        meshes.append((pane, "window"))

                        cur_x_px = win_x2

                    # 3. Wall segment after the last window
                    if cur_x_px < run_end:
                        meshes.append((_wall_piece(cur_x_px, run_end, WALL_HEIGHT, WALL_HEIGHT / 2.0), "wall"))

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
            
            # Calculate pixel distance from tile center to room center
            dist_px = np.hypot(cx - room_cx, cy - room_cy)
            half_diag_px = np.hypot(rw, rh) / 2.0
            
            if dist_px > 1.5 * half_diag_px:
                # If this is the specific tile area the user asked about, log confirmation
                tile_x_ft = tx / ppf
                tile_y_ft = ty / ppf
                if label == "LIVING" and tile_x_ft > 30.0 and tile_y_ft > 17.0:
                    import logging
                    logging.getLogger(__name__).info(
                        f"CONFIRMATION: Tile at x_ft={tile_x_ft:.2f}, y_ft={tile_y_ft:.2f} was legitimately claimed by {label} "
                        f"(dist={dist_px:.1f}px, allowed={1.5*half_diag_px:.1f}px). Rejecting due to distance mitigation."
                    )
                continue
            color = _color_for_label(label)

            tile = trimesh.creation.box(extents=[tile_ft, tile_ft, 0.05])
            # Named variables make axis mapping explicit and easy to audit.
            # Y flipped to match the same convention now used in
            # _row_scan_walls and _build_dimension_annotations (feet-space Y
            # increases toward the image's top edge).
            center_x = tx / ppf + tile_ft / 2
            center_y = (bh - ty - tile_size_px / 2.0) / ppf
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
    room_polygons: dict,
    px_per_sqft: float,
    wall_height: float = 0.0,
    *,
    bx: int = 0,
    by: int = 0,
    bw: int = 0,
    bh: int = 0,
    claimed: np.ndarray | None = None,
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
        convention now used in _row_scan_walls and _room_floor_tiles:
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
            # REGRESSION FIX: this used to derive the room's interior bounds
            # from room_polygons/claimed (Stage 3/4's flood-fill output) —
            # the same data that can leak through an open doorway into a
            # neighboring room (see the tile-filter comment in
            # _room_floor_tiles). When it leaked, the resulting line_start/
            # line_end were computed from that leaked, oversized region,
            # while the *label* was always built from the reliable OCR
            # w_ft/h_ft — so the line no longer matched the number next to
            # it (off by up to ~20ft for LIVING in one observed case), and
            # could land entirely outside the building's own bounds.
            #
            # Fix: derive both the line's length AND its position purely
            # from the reliable OCR values (cx_ft/cy_ft/w_ft/h_ft), the same
            # numbers already used for the label text, exactly the same
            # reliable-source rule already applied to wall_length. No
            # dependency on room_polygons/claimed for this computation at all.
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

    print(
        f"Building bbox: bx={bx} by={by} bw={bw} bh={bh}  → {floor_w_ft:.1f} × {floor_h_ft:.1f} ft  ppf={ppf:.2f}"
    )

    # merged from origin/main (Tanzim): clear the 5px artificial perimeter
    # seal stroke (drawn in stage1's _build_combined_boundary) from a copy of
    # the wall mask before extrusion, so it doesn't get rendered as an extra
    # spurious wall doubling every building edge.
    wall_mask = boundary.copy()
    wall_mask[by: by + SEAL_THICKNESS, :] = 0
    wall_mask[by + bh - SEAL_THICKNESS: by + bh, :] = 0
    wall_mask[:, bx: bx + SEAL_THICKNESS] = 0
    wall_mask[:, bx + bw - SEAL_THICKNESS: bx + bw] = 0

    # Only render windows that pass the confidence/LLM-review gate (matches
    # the same threshold used for the JSON `windows` response field in main.py).
    valid_windows = [
        w for w in window_bboxes
        if w.get("confidence", 1.0) >= WINDOW_CONF_THRESHOLD or w.get("llm_confirmed")
    ]

    scene = trimesh.Scene()

    # --- Walls, Doors, Windows ---
    scanned_elements = _row_scan_walls(wall_mask, bx, by, bw, bh, ppf, door_bboxes, valid_windows)
    counts = {"wall": 0, "door": 0, "window": 0}
    wall_meshes = []
    
    for m, kind in scanned_elements:
        idx = counts[kind]
        counts[kind] += 1
        scene.add_geometry(m, node_name=f"{kind}_{idx}", geom_name=f"{kind}_{idx}")
        if kind == "wall":
            wall_meshes.append(m)

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
    print("\n--- SCENE GEOMETRY KEYS ---")
    print(list(scene.geometry.keys()))
    print("---------------------------\n")
    
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

    room_polygons = ctx.get("room_polygons", {})

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
            
            for j in range(i+1, len(walls)):
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

    merged_wall_output = _merge_walls(wall_output)
    deduped_wall_output = _dedup_parallel_walls(merged_wall_output)

    dim_annots = _build_dimension_annotations(
        rooms, room_polygons, px_per_sqft, WALL_HEIGHT,
        bx=bx, by=by, bw=bw, bh=bh, claimed=claimed, wall_output=deduped_wall_output,
    )

    ctx["glb_base64"] = glb_b64
    ctx["building_width_ft"] = round(floor_w_ft, 2)
    ctx["building_height_ft"] = round(floor_h_ft, 2)
    ctx["wall_mesh_count"] = len(wall_meshes)
    ctx["room_output"] = room_output
    ctx["wall_output"] = wall_output
    ctx["dimension_annotations"] = dim_annots

    return ctx

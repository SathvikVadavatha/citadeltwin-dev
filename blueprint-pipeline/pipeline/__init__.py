"""
CitadelTwin Blueprint-to-3D Pipeline
=====================================

A 6-stage computer-vision pipeline that converts 2D architectural blueprints
into interactive 3D GLB models.

Stages:
    1. Wall Detection   — YOLOv8 + morphological refinement
    2. OCR              — EasyOCR room-label & dimension extraction
    3. Room Assignment  — Geodesic Voronoi flood-fill
    4. Topology Check   — Shapely polygon validation
    5. 3D Export        — trimesh row-scan extrusion → GLB
"""

from pipeline.stage1_yolo import run as stage1_wall_detection
from pipeline.stage2_ocr import run as stage2_ocr
from pipeline.stage3_voronoi import run as stage3_voronoi
from pipeline.stage4_topology import run as stage4_topology
from pipeline.stage5_export import run as stage5_export

__all__ = [
    "stage1_wall_detection",
    "stage2_ocr",
    "stage3_voronoi",
    "stage4_topology",
    "stage5_export",
]

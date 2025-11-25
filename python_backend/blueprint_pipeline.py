"""
Blueprint to 3D Model Pipeline
Converts 2D floor plan images into 3D models using YOLO detection and Trimesh
"""

import warnings
warnings.filterwarnings('ignore')

import os
import json
import numpy as np
import trimesh
import cv2
from inference import get_model
import supervision as sv
import plotly.graph_objects as go


class FloorplanTo3D:
    """Convert 2D floor plan detections to 3D model"""

    def __init__(self, room_height=2.8, wall_thickness=0.15,
                 pixels_per_meter=50, confidence_threshold=0.3):
        self.room_height = room_height
        self.wall_thickness = wall_thickness
        self.pixels_per_meter = pixels_per_meter
        self.confidence_threshold = confidence_threshold

        # Color scheme for different room types
        self.color_map = {
            'space_bedroom': [150, 200, 255, 255],
            'space_other': [200, 200, 200, 255],
            'space_toilet': [255, 200, 150, 255],
            'space_front': [150, 255, 150, 255],
            'space_kitchen': [255, 255, 150, 255],
            'space_living': [255, 200, 200, 255],
        }

    def pixels_to_meters(self, pixels):
        return pixels / self.pixels_per_meter

    def create_room_mesh(self, detection):
        """Create a 3D mesh for a room"""
        # Convert to meters
        x = self.pixels_to_meters(detection['x'])
        y = self.pixels_to_meters(detection['y'])
        width = self.pixels_to_meters(detection['width'])
        height = self.pixels_to_meters(detection['height'])

        # Calculate corners
        x_min, x_max = x - width/2, x + width/2
        y_min, y_max = y - height/2, y + height/2

        # Create box vertices
        vertices = np.array([
            [x_min, y_min, 0], [x_max, y_min, 0],
            [x_max, y_max, 0], [x_min, y_max, 0],
            [x_min, y_min, self.room_height], [x_max, y_min, self.room_height],
            [x_max, y_max, self.room_height], [x_min, y_max, self.room_height],
        ])

        # Define faces
        faces = np.array([
            [0, 2, 1], [0, 3, 2],  # Floor
            [4, 5, 6], [4, 6, 7],  # Ceiling
            [0, 1, 5], [0, 5, 4],  # Walls
            [1, 2, 6], [1, 6, 5],
            [2, 3, 7], [2, 7, 6],
            [3, 0, 4], [3, 4, 7],
        ])

        # Create mesh with color
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        color = self.color_map.get(detection['class'], [200, 200, 200, 255])
        mesh.visual.face_colors = color

        # Add metadata
        mesh.metadata = {
            'room_type': detection['class'],
            'confidence': detection['confidence'],
            'width_m': round(width, 2),
            'depth_m': round(height, 2),
            'area_m2': round(width * height, 2)
        }

        return mesh

    def build_3d_model(self, detections):
        """Build complete 3D model from detections"""
        filtered_detections = [
            d for d in detections
            if d['confidence'] >= self.confidence_threshold
            and d['class'] != 'background'
        ]

        print(f"🏗️  Building 3D model from {len(filtered_detections)} rooms...")

        # Create meshes
        meshes = []
        for i, detection in enumerate(filtered_detections):
            mesh = self.create_room_mesh(detection)
            meshes.append(mesh)
            print(f"  [{i+1}/{len(filtered_detections)}] {detection['class']}: "
                  f"{mesh.metadata['width_m']}m × {mesh.metadata['depth_m']}m "
                  f"(confidence: {detection['confidence']:.2f})")

        # Combine into scene
        scene = trimesh.Scene()
        for i, mesh in enumerate(meshes):
            scene.add_geometry(mesh, node_name=f"room_{i}")

        return scene, filtered_detections


def visualize_3d_interactive(detections, converter):
    """Create interactive 3D visualization with Plotly"""
    
    fig = go.Figure()

    # Color map (convert to hex)
    color_hex_map = {
        'space_bedroom': '#96C8FF',
        'space_other': '#C8C8C8',
        'space_toilet': '#FFC896',
        'space_front': '#96FF96',
        'space_kitchen': '#FFFF96',
        'space_living': '#FFC8C8',
    }

    for detection in detections:
        x = converter.pixels_to_meters(detection['x'])
        y = converter.pixels_to_meters(detection['y'])
        width = converter.pixels_to_meters(detection['width'])
        height = converter.pixels_to_meters(detection['height'])

        x_min, x_max = x - width/2, x + width/2
        y_min, y_max = y - height/2, y + height/2
        h = converter.room_height

        # Create vertices for the box
        vertices = np.array([
            [x_min, y_min, 0], [x_max, y_min, 0], [x_max, y_max, 0], [x_min, y_max, 0],  # Bottom
            [x_min, y_min, h], [x_max, y_min, h], [x_max, y_max, h], [x_min, y_max, h],  # Top
        ])

        # Define faces (i, j, k format for triangles)
        faces = [
            [0, 1, 2], [0, 2, 3],  # Bottom
            [4, 5, 6], [4, 6, 7],  # Top
            [0, 1, 5], [0, 5, 4],  # Front
            [1, 2, 6], [1, 6, 5],  # Right
            [2, 3, 7], [2, 7, 6],  # Back
            [3, 0, 4], [3, 4, 7],  # Left
        ]

        # Get color
        color = color_hex_map.get(detection['class'], '#C8C8C8')

        # Create hover text
        hover_text = (
            f"<b>{detection['class'].replace('space_', '').title()}</b><br>"
            f"Size: {width:.2f}m × {height:.2f}m<br>"
            f"Area: {width*height:.2f} m²<br>"
            f"Height: {h:.2f}m<br>"
            f"Confidence: {detection['confidence']:.1%}"
        )

        # Extract coordinates for mesh3d
        i = [f[0] for f in faces]
        j = [f[1] for f in faces]
        k = [f[2] for f in faces]

        # Add mesh to figure
        fig.add_trace(go.Mesh3d(
            x=vertices[:, 0],
            y=vertices[:, 1],
            z=vertices[:, 2],
            i=i, j=j, k=k,
            color=color,
            opacity=0.8,
            name=detection['class'].replace('space_', '').title(),
            hovertext=hover_text,
            hoverinfo='text',
            showlegend=True,
        ))

    # Update layout for better viewing
    fig.update_layout(
        title={
            'text': '🏗️ CitadelTwin - Interactive 3D Floor Plan',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 20, 'color': '#333'}
        },
        scene=dict(
            xaxis_title='X (meters)',
            yaxis_title='Y (meters)',
            zaxis_title='Height (meters)',
            xaxis=dict(backgroundcolor="rgb(230, 230,230)", gridcolor="white"),
            yaxis=dict(backgroundcolor="rgb(230, 230,230)", gridcolor="white"),
            zaxis=dict(backgroundcolor="rgb(230, 230,230)", gridcolor="white"),
            aspectmode='data',
        ),
        width=1000,
        height=700,
        hovermode='closest',
        showlegend=True,
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor="rgba(255,255,255,0.8)"
        )
    )

    return fig


def run_blueprint_pipeline(image_path: str):
    """
    Given a local path to a blueprint image (JPG/PNG),
    1. Runs YOLO detection on the blueprint
    2. Saves predictions to predictions.json
    3. Builds a 3D trimesh scene and exports floorplan_3d.glb
    4. Creates a Plotly 3D visualization for the rooms

    Returns:
        glb_path (str): relative path to the generated GLB file
        html (str): Plotly HTML snippet (no <html> boilerplate, just the div+script)
        detections (list): list of detected rooms with metadata
    """
    
    # Ensure API key is set
    api_key = os.environ.get("ROBOFLOW_API_KEY")
    if not api_key:
        raise ValueError("ROBOFLOW_API_KEY environment variable not set")
    
    # Create output directory
    os.makedirs("outputs", exist_ok=True)
    
    try:
        # Load image
        print(f"Loading image: {image_path}")
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image from {image_path}")
        
        # Load YOLO model
        print("Loading YOLO model...")
        model = get_model(model_id="fp-lynng/1", api_key=api_key)
        
        # Run inference
        print("Running YOLO detection...")
        results = model.infer(image, confidence=0.07)[0]
        
        # Convert to supervision detections
        detections_sv = sv.Detections.from_inference(results)
        
        # Convert to JSON format expected by FloorplanTo3D
        predictions = []
        for i in range(len(detections_sv.xyxy)):
            bbox = detections_sv.xyxy[i]
            x_center = (bbox[0] + bbox[2]) / 2
            y_center = (bbox[1] + bbox[3]) / 2
            width = bbox[2] - bbox[0]
            height = bbox[3] - bbox[1]
            
            predictions.append({
                'x': float(x_center),
                'y': float(y_center),
                'width': float(width),
                'height': float(height),
                'class': detections_sv.data['class_name'][i] if 'class_name' in detections_sv.data else f'class_{detections_sv.class_id[i]}',
                'confidence': float(detections_sv.confidence[i])
            })
        
        if not predictions:
            raise ValueError("No rooms detected in the blueprint")
        
        # Save predictions
        predictions_path = "outputs/predictions.json"
        with open(predictions_path, 'w') as f:
            json.dump({'predictions': predictions}, f, indent=2)
        print(f"Saved {len(predictions)} predictions to {predictions_path}")
        
        # Configure 3D converter
        config = {
            'room_height': 2.8,
            'wall_thickness': 0.15,
            'pixels_per_meter': 50,
            'confidence_threshold': 0.3,
        }
        
        converter = FloorplanTo3D(
            room_height=config['room_height'],
            wall_thickness=config['wall_thickness'],
            pixels_per_meter=config['pixels_per_meter'],
            confidence_threshold=config['confidence_threshold']
        )
        
        # Build 3D model
        print("Building 3D model...")
        scene, filtered_detections = converter.build_3d_model(predictions)
        
        # Export GLB
        glb_path = 'outputs/floorplan_3d.glb'
        scene.export(glb_path)
        print(f"✓ 3D model created: {glb_path}")
        print(f"✓ Total rooms: {len(filtered_detections)}")
        
        # Create Plotly visualization
        print("Creating interactive visualization...")
        fig = visualize_3d_interactive(filtered_detections, converter)
        
        # Get HTML (without full page wrapper)
        fig_html = fig.to_html(include_plotlyjs="cdn", full_html=False)
        
        # Prepare detection metadata for frontend
        detections_output = []
        for det in filtered_detections:
            # Calculate dimensions
            width_m = converter.pixels_to_meters(det['width'])
            depth_m = converter.pixels_to_meters(det['height'])
            area_m2 = width_m * depth_m
            
            detections_output.append({
                'class': det['class'],
                'confidence': det['confidence'],
                'width_m': round(width_m, 2),
                'depth_m': round(depth_m, 2),
                'area_m2': round(area_m2, 2)
            })
        
        print("✓ Pipeline complete!")
        return glb_path, fig_html, detections_output
        
    except Exception as e:
        print(f"❌ Pipeline failed: {str(e)}")
        raise

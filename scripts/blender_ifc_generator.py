#!/usr/bin/env python3
"""
CitadelTwin - Blender Python Script for 3D Floor Plan Generation and IFC Export
Converts structured blueprint JSON data into a 3D BIM model and exports to IFC format.

Requirements:
- Blender 3.0+ with BlenderBIM add-on installed
- Python 3.9+

Usage:
    blender --background --python blender_ifc_generator.py -- --input blueprint_data.json --output model.ifc
"""

import bpy
import bmesh
import json
import sys
import argparse
import mathutils
from mathutils import Vector, Matrix
import os
from typing import Dict, List, Tuple, Any, Optional

# Clear existing mesh objects
def clear_scene():
    """Clear all mesh objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)

class MaterialManager:
    """Manages material creation and assignment for different building elements"""
    
    def __init__(self):
        self.materials = {}
        self.create_default_materials()
    
    def create_default_materials(self):
        """Create standard building materials"""
        materials_config = {
            'concrete': {'color': (0.7, 0.7, 0.7, 1.0), 'roughness': 0.8},
            'steel': {'color': (0.8, 0.8, 0.9, 1.0), 'roughness': 0.2, 'metallic': 1.0},
            'wood': {'color': (0.6, 0.4, 0.2, 1.0), 'roughness': 0.7},
            'drywall': {'color': (0.95, 0.95, 0.95, 1.0), 'roughness': 0.9},
            'glass': {'color': (0.8, 0.9, 1.0, 0.1), 'roughness': 0.0, 'transmission': 1.0},
            'brick': {'color': (0.7, 0.4, 0.3, 1.0), 'roughness': 0.9},
            'tile': {'color': (0.9, 0.9, 0.8, 1.0), 'roughness': 0.3}
        }
        
        for name, props in materials_config.items():
            mat = bpy.data.materials.new(name=name)
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes["Principled BSDF"]
            bsdf.inputs["Base Color"].default_value = props['color']
            bsdf.inputs["Roughness"].default_value = props.get('roughness', 0.5)
            if 'metallic' in props:
                bsdf.inputs["Metallic"].default_value = props['metallic']
            if 'transmission' in props:
                bsdf.inputs["Transmission"].default_value = props['transmission']
            self.materials[name] = mat
    
    def get_material(self, element_properties: Dict) -> Any:
        """Get appropriate material based on element properties"""
        material_name = element_properties.get('material', '').lower()
        
        material_mapping = {
            'concrete': 'concrete',
            'reinforced concrete': 'concrete',
            'steel': 'steel',
            'wood': 'wood',
            'timber': 'wood',
            'drywall': 'drywall',
            'gypsum': 'drywall',
            'glass': 'glass',
            'brick': 'brick',
            'masonry': 'brick',
            'tile': 'tile',
            'ceramic': 'tile'
        }
        
        for key, mat_name in material_mapping.items():
            if key in material_name:
                return self.materials.get(mat_name, self.materials['drywall'])
        
        return self.materials['drywall']

class CoordinateConverter:
    """Handles coordinate system conversion from blueprint pixels to 3D world coordinates"""
    
    def __init__(self, scale_info: Dict):
        self.scale_info = scale_info
        self.pixels_per_unit = scale_info.get('pixelsPerUnit', 10)
        self.unit = scale_info.get('unit', 'feet')
        self.unit_scale = 0.3048 if self.unit == 'feet' else 1.0  # Convert to meters
    
    def pixel_to_world(self, x: float, y: float, z: float = 0) -> Vector:
        """Convert pixel coordinates to world coordinates"""
        world_x = (x / self.pixels_per_unit) * self.unit_scale
        world_y = (y / self.pixels_per_unit) * self.unit_scale
        world_z = z * self.unit_scale
        return Vector((world_x, world_y, world_z))
    
    def dimension_to_world(self, dimension: float) -> float:
        """Convert dimension from blueprint units to world units"""
        return dimension * self.unit_scale

class FloorPlanGenerator:
    """Main class for generating 3D floor plans from structured blueprint data"""
    
    def __init__(self, blueprint_data: Dict):
        self.data = blueprint_data
        self.converter = CoordinateConverter(blueprint_data.get('scale', {}))
        self.material_manager = MaterialManager()
        self.created_objects = []
        self.ifc_hierarchy = {}
    
    def create_wall(self, element: Dict) -> Optional[Any]:
        """Create a wall element from blueprint data"""
        try:
            dimensions = element.get('dimensions', {})
            location = element.get('location', {})
            
            length = self.converter.dimension_to_world(dimensions.get('length', 10))
            height = self.converter.dimension_to_world(dimensions.get('height', 9))
            thickness = self.converter.dimension_to_world(dimensions.get('width', 0.5))
            
            # Create wall mesh
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0)
            
            # Scale to wall dimensions
            bmesh.ops.scale(bm, vec=(length, thickness, height), verts=bm.verts)
            
            # Create mesh object
            mesh = bpy.data.meshes.new(f"Wall_{element.get('id', 'unknown')}")
            bm.to_mesh(mesh)
            bm.free()
            
            obj = bpy.data.objects.new(element.get('label', 'Wall'), mesh)
            bpy.context.collection.objects.link(obj)
            
            # Position wall
            world_pos = self.converter.pixel_to_world(
                location.get('x', 0), 
                location.get('y', 0), 
                height / 2
            )
            obj.location = world_pos
            
            # Assign material
            material = self.material_manager.get_material(element.get('properties', {}))
            if obj.data.materials:
                obj.data.materials[0] = material
            else:
                obj.data.materials.append(material)
            
            # Set IFC properties
            obj["IFC_TYPE"] = "IfcWall"
            obj["LOAD_BEARING"] = element.get('properties', {}).get('loadBearing', False)
            
            self.created_objects.append(obj)
            return obj
            
        except Exception as e:
            print(f"Error creating wall {element.get('id', 'unknown')}: {e}")
            return None
    
    def create_door(self, element: Dict) -> Optional[Any]:
        """Create a door element"""
        try:
            dimensions = element.get('dimensions', {})
            location = element.get('location', {})
            
            width = self.converter.dimension_to_world(dimensions.get('width', 3))
            height = self.converter.dimension_to_world(dimensions.get('height', 7))
            thickness = self.converter.dimension_to_world(0.2)  # Standard door thickness
            
            # Create door frame
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.scale(bm, vec=(width, thickness, height), verts=bm.verts)
            
            mesh = bpy.data.meshes.new(f"Door_{element.get('id', 'unknown')}")
            bm.to_mesh(mesh)
            bm.free()
            
            obj = bpy.data.objects.new(element.get('label', 'Door'), mesh)
            bpy.context.collection.objects.link(obj)
            
            # Position door
            world_pos = self.converter.pixel_to_world(
                location.get('x', 0), 
                location.get('y', 0), 
                height / 2
            )
            obj.location = world_pos
            
            # Assign wood material
            obj.data.materials.append(self.material_manager.materials['wood'])
            
            # Set IFC properties
            obj["IFC_TYPE"] = "IfcDoor"
            
            self.created_objects.append(obj)
            return obj
            
        except Exception as e:
            print(f"Error creating door {element.get('id', 'unknown')}: {e}")
            return None
    
    def create_window(self, element: Dict) -> Optional[Any]:
        """Create a window element"""
        try:
            dimensions = element.get('dimensions', {})
            location = element.get('location', {})
            
            width = self.converter.dimension_to_world(dimensions.get('width', 4))
            height = self.converter.dimension_to_world(dimensions.get('height', 4))
            thickness = self.converter.dimension_to_world(0.1)  # Glass thickness
            
            # Create window glass
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.scale(bm, vec=(width, thickness, height), verts=bm.verts)
            
            mesh = bpy.data.meshes.new(f"Window_{element.get('id', 'unknown')}")
            bm.to_mesh(mesh)
            bm.free()
            
            obj = bpy.data.objects.new(element.get('label', 'Window'), mesh)
            bpy.context.collection.objects.link(obj)
            
            # Position window (elevated from floor)
            world_pos = self.converter.pixel_to_world(
                location.get('x', 0), 
                location.get('y', 0), 
                self.converter.dimension_to_world(3)  # 3 feet from floor
            )
            obj.location = world_pos
            
            # Assign glass material
            obj.data.materials.append(self.material_manager.materials['glass'])
            
            # Set IFC properties
            obj["IFC_TYPE"] = "IfcWindow"
            
            self.created_objects.append(obj)
            return obj
            
        except Exception as e:
            print(f"Error creating window {element.get('id', 'unknown')}: {e}")
            return None
    
    def create_room_floor(self, room: Dict) -> Optional[Any]:
        """Create floor slab for a room"""
        try:
            boundaries = room.get('boundaries', [])
            if len(boundaries) < 3:
                return None
            
            # Create floor mesh from boundaries
            bm = bmesh.new()
            
            # Add vertices from boundaries
            verts = []
            for boundary in boundaries:
                world_pos = self.converter.pixel_to_world(boundary['x'], boundary['y'], 0)
                vert = bm.verts.new((world_pos.x, world_pos.y, 0))
                verts.append(vert)
            
            # Create face
            if len(verts) >= 3:
                bm.faces.new(verts)
                
            # Extrude to create thickness
            bmesh.ops.extrude_region(bm, geom=bm.faces[:])
            bmesh.ops.translate(bm, 
                vec=(0, 0, -self.converter.dimension_to_world(0.5)), 
                verts=[v for v in bm.verts if v.select])
            
            mesh = bpy.data.meshes.new(f"Floor_{room.get('id', 'unknown')}")
            bm.to_mesh(mesh)
            bm.free()
            
            obj = bpy.data.objects.new(f"Floor_{room.get('name', 'Room')}", mesh)
            bpy.context.collection.objects.link(obj)
            
            # Assign concrete material
            obj.data.materials.append(self.material_manager.materials['concrete'])
            
            # Set IFC properties
            obj["IFC_TYPE"] = "IfcSlab"
            obj["ROOM_TYPE"] = room.get('type', 'room')
            obj["ROOM_AREA"] = room.get('area', 0)
            
            self.created_objects.append(obj)
            return obj
            
        except Exception as e:
            print(f"Error creating room floor {room.get('id', 'unknown')}: {e}")
            return None
    
    def create_column(self, element: Dict) -> Optional[Any]:
        """Create a structural column"""
        try:
            dimensions = element.get('dimensions', {})
            location = element.get('location', {})
            
            width = self.converter.dimension_to_world(dimensions.get('width', 1))
            length = self.converter.dimension_to_world(dimensions.get('length', 1))
            height = self.converter.dimension_to_world(dimensions.get('height', 10))
            
            # Create column mesh
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.scale(bm, vec=(width, length, height), verts=bm.verts)
            
            mesh = bpy.data.meshes.new(f"Column_{element.get('id', 'unknown')}")
            bm.to_mesh(mesh)
            bm.free()
            
            obj = bpy.data.objects.new(element.get('label', 'Column'), mesh)
            bpy.context.collection.objects.link(obj)
            
            # Position column
            world_pos = self.converter.pixel_to_world(
                location.get('x', 0), 
                location.get('y', 0), 
                height / 2
            )
            obj.location = world_pos
            
            # Assign material based on properties
            material = self.material_manager.get_material(element.get('properties', {}))
            obj.data.materials.append(material)
            
            # Set IFC properties
            obj["IFC_TYPE"] = "IfcColumn"
            obj["STRUCTURAL_ROLE"] = element.get('properties', {}).get('structuralRole', 'support')
            
            self.created_objects.append(obj)
            return obj
            
        except Exception as e:
            print(f"Error creating column {element.get('id', 'unknown')}: {e}")
            return None
    
    def generate_3d_model(self):
        """Generate the complete 3D model from blueprint data"""
        print("Starting 3D model generation...")
        
        # Clear existing scene
        clear_scene()
        
        # Process elements
        elements = self.data.get('elements', [])
        for element in elements:
            element_type = element.get('type', '')
            
            if element_type == 'wall':
                self.create_wall(element)
            elif element_type == 'door':
                self.create_door(element)
            elif element_type == 'window':
                self.create_window(element)
            elif element_type == 'column':
                self.create_column(element)
            elif element_type == 'beam':
                # Similar to column but horizontal
                beam_element = element.copy()
                beam_obj = self.create_column(beam_element)
                if beam_obj:
                    beam_obj["IFC_TYPE"] = "IfcBeam"
                    beam_obj.rotation_euler = (0, 1.5708, 0)  # 90 degrees rotation
        
        # Process rooms (create floor slabs)
        rooms = self.data.get('rooms', [])
        for room in rooms:
            self.create_room_floor(room)
        
        print(f"Generated {len(self.created_objects)} objects")
    
    def setup_ifc_hierarchy(self):
        """Set up IFC spatial hierarchy"""
        try:
            # Enable BlenderBIM add-on
            bpy.ops.preferences.addon_enable(module='blenderbim')
            
            # Create IFC project structure
            bpy.ops.bim.create_project()
            
            # Set project information
            metadata = self.data.get('metadata', {})
            
            # Get the IFC project
            ifc_project = bpy.context.scene.BIMProperties.ifc_file
            if ifc_project:
                # Set building information
                building_type = metadata.get('type', 'residential')
                construction_method = metadata.get('constructionMethod', 'traditional')
                
                # Add custom properties
                for obj in self.created_objects:
                    if hasattr(obj, 'BIMObjectProperties'):
                        ifc_class = obj.get("IFC_TYPE", "IfcBuildingElement")
                        obj.BIMObjectProperties.ifc_class = ifc_class
                        
        except Exception as e:
            print(f"Warning: Could not set up full IFC hierarchy: {e}")
            print("Make sure BlenderBIM add-on is installed and enabled")
    
    def export_ifc(self, output_path: str):
        """Export the model to IFC format"""
        try:
            # Set up IFC hierarchy
            self.setup_ifc_hierarchy()
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Export to IFC
            bpy.ops.export_ifc.bim(filepath=output_path)
            print(f"Successfully exported IFC to: {output_path}")
            
        except Exception as e:
            print(f"Error exporting IFC: {e}")
            print("Falling back to Blender file export...")
            
            # Fallback: export as .blend file
            blend_path = output_path.replace('.ifc', '.blend')
            bpy.ops.wm.save_as_mainfile(filepath=blend_path)
            print(f"Exported Blender file to: {blend_path}")

def main():
    """Main function to run the script"""
    parser = argparse.ArgumentParser(description='Generate 3D floor plan from blueprint JSON')
    parser.add_argument('--input', '-i', required=True, help='Input JSON file path')
    parser.add_argument('--output', '-o', required=True, help='Output IFC file path')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    # Parse arguments (handle Blender's -- separator)
    if '--' in sys.argv:
        args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    else:
        args = parser.parse_args()
    
    try:
        # Load blueprint data
        with open(args.input, 'r') as f:
            blueprint_data = json.load(f)
        
        if args.verbose:
            print(f"Loaded blueprint data with {len(blueprint_data.get('elements', []))} elements")
            print(f"Building type: {blueprint_data.get('metadata', {}).get('type', 'unknown')}")
        
        # Generate 3D model
        generator = FloorPlanGenerator(blueprint_data)
        generator.generate_3d_model()
        
        # Export to IFC
        generator.export_ifc(args.output)
        
        print("3D floor plan generation completed successfully!")
        
    except FileNotFoundError:
        print(f"Error: Input file '{args.input}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
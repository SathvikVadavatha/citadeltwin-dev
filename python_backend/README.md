# CitadelTwin Python Blueprint Backend

This backend service processes 2D floor plan images and converts them into 3D models using YOLO object detection and mesh generation.

## Features

- **YOLO Detection**: Automatically detects rooms in floor plans using a fine-tuned YOLOv8 model
- **3D Model Generation**: Converts 2D detections into 3D GLB models with proper dimensions
- **Interactive Visualization**: Creates Plotly 3D visualizations with room metadata
- **FastAPI Server**: RESTful API for integration with the CitadelTwin frontend

## Setup

### 1. Prerequisites

- Python 3.10 or higher
- pip (Python package installer)

### 2. Install Dependencies

```bash
cd python_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set Environment Variables

You need to set the Roboflow API key for YOLO model access:

```bash
export ROBOFLOW_API_KEY="v3y8y5KmcJaJB7HKDTeR"
```

On Windows:
```cmd
set ROBOFLOW_API_KEY=v3y8y5KmcJaJB7HKDTeR
```

Or create a `.env` file in the `python_backend` directory:
```
ROBOFLOW_API_KEY=v3y8y5KmcJaJB7HKDTeR
```

### 4. Run the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

For development with auto-reload:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### `POST /api/blueprint/process`

Process a blueprint image and generate a 3D model.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (JPG/PNG image)

**Response:**
```json
{
  "status": "success",
  "glb_url": "/outputs/floorplan_3d.glb",
  "html_view": "<div>...Plotly HTML...</div>",
  "detections": [
    {
      "class": "space_bedroom",
      "confidence": 0.85,
      "width_m": 4.5,
      "depth_m": 3.8,
      "area_m2": 17.1
    }
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "No rooms detected in the blueprint",
  "error_type": "validation"
}
```

### `GET /outputs/{filename}`

Retrieve generated output files (GLB models).

**Example:**
```
GET /outputs/floorplan_3d.glb
```

### `GET /`

Health check endpoint.

## Configuration

You can adjust the 3D conversion parameters in `blueprint_pipeline.py`:

```python
config = {
    'room_height': 2.8,              # Room height in meters
    'wall_thickness': 0.15,          # Wall thickness in meters
    'pixels_per_meter': 50,          # Scale factor (adjust for your blueprints)
    'confidence_threshold': 0.3,     # Minimum confidence (0-1)
}
```

## Testing

Test the API using curl:

```bash
curl -X POST "http://localhost:8000/api/blueprint/process" \
  -F "file=@path/to/your/blueprint.jpg"
```

Or use the health check:

```bash
curl http://localhost:8000/
```

## Deployment

For production deployment:

1. Use environment variables for configuration
2. Set proper CORS origins in `main.py`
3. Use a production ASGI server (Gunicorn + Uvicorn workers)
4. Add authentication if needed
5. Set up SSL/TLS certificates
6. Configure file storage (S3, etc.) for larger scale

Example production command:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

**No rooms detected:**
- Check if the blueprint image is clear and has sufficient contrast
- Adjust the `confidence_threshold` in the config
- Try different `pixels_per_meter` values for scale

**Model loading errors:**
- Verify ROBOFLOW_API_KEY is set correctly
- Check internet connection (model is downloaded on first run)

**Memory issues:**
- Large images may require more RAM
- Consider resizing very large blueprints before processing

## Support

For issues or questions, contact the CitadelTwin development team.

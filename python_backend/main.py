"""
CitadelTwin Python Backend - Blueprint to 3D Processing
FastAPI server for processing 2D blueprints into 3D models
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import shutil
import traceback
from blueprint_pipeline import run_blueprint_pipeline

app = FastAPI(
    title="CitadelTwin Blueprint API",
    description="Convert 2D floor plans to 3D models",
    version="1.0.0"
)

# Allow CORS from the CitadelTwin frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "CitadelTwin Blueprint API",
        "version": "1.0.0"
    }


@app.post("/api/blueprint/process")
async def process_blueprint(file: UploadFile = File(...)):
    """
    Accepts a JPG/PNG blueprint file, runs the detection and 3D generation pipeline,
    and returns JSON with the GLB path + Plotly HTML + detected rooms.
    
    Args:
        file: Uploaded blueprint image (JPG/PNG)
        
    Returns:
        JSON with:
        - status: "success" or "error"
        - glb_url: relative path to the GLB file
        - html_view: Plotly HTML visualization
        - detections: list of detected rooms with dimensions
    """
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image (JPG/PNG)")
    
    upload_path = None
    try:
        # Save uploaded file
        upload_path = os.path.join("uploads", file.filename)
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing blueprint: {file.filename}")
        
        # Run the pipeline
        glb_path, plotly_html, detections = run_blueprint_pipeline(upload_path)
        
        # Return success response
        return {
            "status": "success",
            "glb_url": f"/{glb_path}",  # Will be served via /outputs/ endpoint
            "html_view": plotly_html,
            "detections": detections
        }
        
    except ValueError as e:
        # Handle validation errors (no rooms detected, invalid image, etc.)
        print(f"Validation error: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": "validation"
        }
        
    except Exception as e:
        # Handle unexpected errors
        print(f"Error processing blueprint: {str(e)}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "error": f"Processing failed: {str(e)}",
            "error_type": "processing"
        }
        
    finally:
        # Clean up uploaded file
        if upload_path and os.path.exists(upload_path):
            try:
                os.remove(upload_path)
            except:
                pass


@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    """Serve generated output files (GLB models, etc.)"""
    file_path = os.path.join("outputs", filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        media_type="model/gltf-binary" if filename.endswith('.glb') else None,
        filename=filename
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

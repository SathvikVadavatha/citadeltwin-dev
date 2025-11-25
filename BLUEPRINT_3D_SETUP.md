# Blueprint → 3D Setup Guide

## Overview

The "Blueprint → 3D" feature has been successfully integrated into CitadelTwin. This feature allows users to upload 2D floor plans (JPG/PNG) and automatically convert them into interactive 3D models.

## What's Been Implemented

### Frontend Components ✅
- **New navigation tab**: "Blueprint → 3D" added to sidebar (desktop) and bottom nav (mobile)
- **Upload page**: Drag-and-drop file upload with validation
- **Processing UI**: Animated loading state during processing
- **3D Viewer**: Interactive GLB model viewer using Three.js
- **Plotly visualization**: Embedded HTML visualization from Python backend
- **Error handling**: User-friendly error messages

### Backend Infrastructure ✅
- **Edge Function**: `/functions/process-blueprint-3d` created to interface with Python backend
- **CORS configured**: Allows cross-origin requests
- **File handling**: Accepts JPG/PNG uploads up to 10MB

### Routing ✅
- Route: `/blueprint-3d`
- Protected with authentication
- Integrated with the main app layout

## Python Backend Setup Required ⚠️

The frontend is complete, but **you need to deploy your Python code separately**. Here's how:

### Step 1: Prepare Your Python Backend

Create a Python API service that accepts POST requests with the following structure:

**Endpoint**: `POST /api/process` (or your chosen path)

**Request**: Multipart form data with a `file` field containing the blueprint image

**Response**: JSON with the following structure:
```json
{
  "status": "success",
  "glb_url": "https://your-cdn.com/models/model.glb",
  "html_view": "<html>...Plotly visualization HTML...</html>",
  "detections": [
    {
      "class": "space_bedroom",
      "width_m": 4.5,
      "depth_m": 3.2,
      "area_m2": 14.4,
      "confidence": 0.95
    }
  ]
}
```

### Step 2: Deploy Python Service

Choose one of these deployment options:

#### Option A: Railway (Recommended)
1. Create a new Railway project
2. Deploy your Python code with Flask/FastAPI
3. Add your Roboflow API key as an environment variable
4. Get your deployment URL

#### Option B: Render
1. Create a new Web Service
2. Connect your GitHub repo with the Python code
3. Set environment variables
4. Deploy and get your URL

#### Option C: AWS Lambda
1. Package your Python code with dependencies
2. Create a Lambda function
3. Set up API Gateway
4. Configure environment variables

### Step 3: Configure CitadelTwin

Once your Python backend is deployed, add the URL as a Supabase secret:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/fjybggorcizszcpedjbb/settings/functions
2. Add a new secret:
   - Name: `PYTHON_BACKEND_URL`
   - Value: `https://your-python-service.com/api/process`

### Your Python Code Integration

The Python code you provided includes:
- **YOLOv8 detection** using Roboflow API
- **FloorplanTo3D class** for converting detections to 3D meshes
- **Plotly visualization** for interactive room views
- **GLB export** using trimesh

Wrap this code in a web framework (Flask/FastAPI) like this:

```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/api/process', methods=['POST'])
def process_blueprint():
    # Get uploaded file
    file = request.files['file']
    
    # Save temporarily
    temp_path = f'/tmp/{file.filename}'
    file.save(temp_path)
    
    # Run your pipeline
    # 1. Run YOLO detection
    # 2. Save predictions.json
    # 3. Run FloorplanTo3D conversion
    # 4. Upload GLB to CDN/storage
    # 5. Generate Plotly HTML
    
    return jsonify({
        'status': 'success',
        'glb_url': 'https://cdn.example.com/model.glb',
        'html_view': '<html>...</html>',
        'detections': [...]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### Step 4: Test the Integration

1. Navigate to `/blueprint-3d` in CitadelTwin
2. Upload a test floor plan
3. Verify processing completes successfully
4. Check that the 3D model and Plotly visualization display correctly

## File Structure

```
src/
├── pages/
│   └── Blueprint3D.tsx              # Main page
├── components/
│   └── blueprint3d/
│       ├── BlueprintTo3DConverter.tsx   # Main controller
│       ├── BlueprintUploadBox.tsx       # Upload UI
│       ├── ProcessingStatus.tsx         # Loading state
│       └── Blueprint3DViewer.tsx        # 3D viewer + tabs
supabase/
└── functions/
    └── process-blueprint-3d/
        └── index.ts                 # Edge function
```

## Required Environment Variables

### Supabase Secrets
- `PYTHON_BACKEND_URL` - Your Python service endpoint

### Python Service Environment
- `ROBOFLOW_API_KEY` - Your Roboflow API key (v3y8y5KmcJaJB7HKDTeR)

## Troubleshooting

### "Processing failed" error
- Check that `PYTHON_BACKEND_URL` is set correctly in Supabase
- Verify your Python service is running and accessible
- Check Python service logs for errors

### 3D model not loading
- Verify the GLB file URL is publicly accessible
- Check browser console for CORS errors
- Ensure GLB file is valid (test with online GLB viewer)

### Plotly visualization not showing
- Verify the HTML contains valid Plotly JavaScript
- Check for JavaScript errors in browser console
- Ensure the HTML is complete and self-contained

## Next Steps

1. ✅ Frontend integration complete
2. ⚠️ Deploy your Python backend service
3. ⚠️ Add `PYTHON_BACKEND_URL` secret to Supabase
4. ✅ Test end-to-end workflow
5. 🔧 (Optional) Add file storage for GLB files in Supabase Storage
6. 🔧 (Optional) Add caching to reduce processing time for similar blueprints

## Support

If you need help deploying the Python backend or encounter any issues, please reach out!

---

**Note**: The edge function is currently configured to call an external Python service. If you prefer to run the Python code directly in Supabase Edge Functions, that's not currently possible as Edge Functions only support Deno/TypeScript. However, you could rewrite the detection logic in TypeScript using TensorFlow.js if needed.

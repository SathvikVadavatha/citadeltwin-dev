# Blueprint-to-3D Pipeline

A 6-stage Python computer-vision pipeline that converts 2D architectural
blueprints into interactive 3D GLB models for the CitadelTwin platform.

## Pipeline Stages

| Stage | Module | Description |
|-------|--------|-------------|
| 1 | `stage1_yolo.py` | Wall detection — YOLOv8 + morphological refinement |
| 2 | `stage2_ocr.py` | OCR — EasyOCR room-label & dimension extraction |
| 3 | `stage3_voronoi.py` | Room assignment — Geodesic Voronoi flood-fill |
| 4 | `stage4_topology.py` | Topology validation — Shapely polygon checks |
| 5 | `stage5_export.py` | 3D export — trimesh row-scan extrusion → GLB |
| 6 | `main.py` | FastAPI server wiring stages 1–5 |

## Architecture

```
Blueprint Image (URL)
       │
       ▼
 ┌─────────────┐
 │  Stage 1    │  YOLOv8 → wall/door/window boxes
 │  Wall Det.  │  Morphological → thick-line mask
 └──────┬──────┘  ⇒ combined_boundary (binary mask)
        │
        ▼
 ┌─────────────┐
 │  Stage 2    │  EasyOCR → room labels + areas
 │  OCR        │
 └──────┬──────┘  ⇒ rooms [{label, center, area_sqft}]
        │
        ▼
 ┌─────────────┐
 │  Stage 3    │  Multi-source BFS through passable pixels
 │  Voronoi    │  Area-capped expansion
 └──────┬──────┘  ⇒ claimed[y,x] + 12×12 tiles
        │
        ▼
 ┌─────────────┐
 │  Stage 4    │  Shapely polygons → overlap & connectivity
 │  Topology   │
 └──────┬──────┘  ⇒ validation_warnings[]
        │
        ▼
 ┌─────────────┐
 │  Stage 5    │  Row-scan extrusion + colored floor tiles
 │  3D Export  │
 └─────────────┘  ⇒ GLB (base64) + metadata JSON
```

## Local Development

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.

- **Health check**: `GET http://localhost:8000/health`
- **Process**: `POST http://localhost:8000/process`

## Docker

```bash
# Build
docker build -t blueprint-pipeline .

# Run
docker run -p 8000:8000 blueprint-pipeline
```

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Fork or clone this repo.
2. Create a new Railway project → "Deploy from GitHub repo".
3. Point it at the `blueprint-pipeline/` directory (or set the root).
4. Railway auto-detects the Dockerfile.
5. Set port to `8000` (Railway usually auto-detects this from `EXPOSE`).
6. Copy the public URL (e.g. `https://blueprint-pipeline-production.up.railway.app`).

## Connecting to Supabase Edge Functions

Once the pipeline is deployed, set the `PIPELINE_URL` secret in Supabase:

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**.
2. Add: `PIPELINE_URL` = `https://your-deployed-url.up.railway.app`
   (no trailing slash).
3. The `generate-3d-model` edge function reads this at runtime.

For local development, use:
```
PIPELINE_URL=http://localhost:8000
```

## API Schema

### `POST /process`

**Request:**
```json
{
  "image_url": "https://your-supabase-project.supabase.co/storage/v1/object/public/blueprints/my-blueprint.png"
}
```

**Response:**
```json
{
  "glb_base64": "<base64-encoded GLB binary>",
  "rooms": [
    {
      "id": "room_0",
      "label": "BEDROOM",
      "area_sqft": 182.0,
      "center": { "x": 12.5, "y": 8.3 },
      "color": [25, 38, 69]
    }
  ],
  "walls": [
    {
      "x": 0.0,
      "y": 0.0,
      "width": 3.5,
      "height": 9.0
    }
  ],
  "metadata": {
    "building_width_ft": 45.2,
    "building_height_ft": 32.8,
    "total_rooms": 6,
    "wall_mesh_count": 142,
    "validation_warnings": []
  }
}
```

### `GET /health`

```json
{ "status": "ok" }
```

## Notes for Frontend Integration

The existing frontend components in `src/components/blueprint3d/` and
`src/hooks/blueprint3d/` call the `generate-3d-model` Supabase edge
function. The edge function's response shape has been preserved:

```typescript
// The edge function returns:
{
  success: true,
  modelUrl: string,   // Supabase Storage public URL for the GLB
  rooms: RoomInfo[],
  walls: WallInfo[],
  metadata: { ... }
}
```

> **Check in `src/`**: The calling code in
> `src/hooks/blueprint3d/useModelGeneration.ts` may pass `uploadId`,
> `detectedObjects`, and `enhancedRoomData` in the request body. The
> new edge function expects `blueprintId`, `projectId`, and `imageUrl`.
> You may need to update the hook's request payload to match, or add a
> compatibility shim in the edge function. **Do not modify `src/` as
> part of this pipeline PR** — handle it in a follow-up.

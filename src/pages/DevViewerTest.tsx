/**
 * TEMPORARY, DEV-ONLY verification harness — NOT part of the real upload
 * flow. Lets you load a GLB + dimensions JSON produced by a real local
 * pipeline run (e.g. blueprint-pipeline/playground/local_verify_output.glb
 * and .json) and render them straight into the real Model3DViewer component,
 * to visually confirm dimension labels / room colors / window panes without
 * touching MainDashboard.tsx or UploadResultsTabs.tsx (the actual live
 * render path, which deliberately was NOT modified for this).
 *
 * Safe to delete any time: this file, plus the single route for it in
 * App.tsx (search "DevViewerTest" there), are the only two places this
 * harness touches.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Model3DViewer, DimensionAnnotation, RoomNameLabel } from '@/components/3d/Model3DViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dimension entries coming out of the pipeline may carry extra fields beyond
// the DimensionAnnotation contract (e.g. `is_perimeter` on wall_length
// entries, added in stage5_export.py) — widen the type locally rather than
// touching the shared Model3DViewer contract.
type DimensionAnnotationExtra = DimensionAnnotation & { is_perimeter?: boolean };

interface RoomRow {
  id?: string;
  label: string;
  area_sqft?: number;
  center?: { x: number; y: number };
}

export default function DevViewerTest() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [allDimensions, setAllDimensions] = useState<DimensionAnnotationExtra[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [showInteriorWalls, setShowInteriorWalls] = useState(false);
  const [status, setStatus] = useState<string>('Pick a .glb file and a dimensions/output .json file below.');

  // Filtered by default to only the building's outer perimeter walls —
  // interior wall_length entries are kept in `allDimensions` (nothing is
  // lost from the underlying data) but hidden from the 3D view unless the
  // toggle below is switched on, since a small floor plan can produce dozens
  // of overlapping interior wall labels that make the view unreadable.
  // Room width/height/area labels are never filtered by this.
  const visibleDimensions = useMemo(() => {
    if (showInteriorWalls) return allDimensions;
    return allDimensions.filter((d) => d.kind !== 'wall_length' || d.is_perimeter !== false);
  }, [allDimensions, showInteriorWalls]);

  // Room name labels for inside the 3D scene — same `label`/`center` fields
  // already used by the Rooms & Square Footage table below, but this is an
  // entirely separate prop from `dimensions`/`visibleDimensions`, so it is
  // untouched by the perimeter-only wall toggle above and never counts
  // toward the dimension label totals shown in the status line.
  const roomLabels: RoomNameLabel[] = useMemo(
    () => rooms.filter((r) => r.center).map((r) => ({
      label: r.label,
      center: r.center as { x: number; y: number },
      areaLabel: r.area_sqft ? `${Math.round(r.area_sqft)} sq ft` : undefined,
    })),
    [rooms]
  );

  const handleGlbFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setStatus((s) => `GLB loaded: ${file.name}\n${s.includes('GLB loaded') ? s.split('\n').slice(1).join('\n') : s}`);
  }, []);

  const handleJsonFile = useCallback((file: File | undefined) => {
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        // Accept either a raw array of dimension entries, or a full pipeline
        // output object with `dimensions`/`rooms` fields (matches
        // playground/run_local_verify.py's local_verify_output.json shape).
        const dims: DimensionAnnotationExtra[] = Array.isArray(parsed) ? parsed : parsed.dimensions;
        if (!Array.isArray(dims)) {
          setStatus(`JSON loaded but no "dimensions" array found in ${file.name}`);
          return;
        }
        // A bare rooms array (e.g. output_rooms.json) has the same top-level
        // shape as a bare dimensions array (both are plain JSON arrays), but
        // its entries have no `kind`/`position` — real dimension entries
        // always have `kind`. Catch it here instead of silently loading 0
        // renderable entries and wiping out whatever dimensions were
        // already loaded; use the dedicated Rooms JSON input instead.
        if (dims.length > 0 && dims.every((d: any) => d?.kind === undefined)) {
          setStatus(
            `${file.name} looks like a rooms file (no "kind" on any entry), not a dimensions file — ` +
            `use the "Rooms JSON" input below instead. Dimensions left unchanged.`
          );
          return;
        }
        setAllDimensions(dims);
        // Only touch room state if THIS file actually carries a `rooms`
        // array (the combined local_verify_output.json shape). Older
        // pipeline runs split rooms into a separate output_rooms.json file
        // (see blueprint-pipeline/viewer/) — uploading that split-format
        // dimensions file here used to reset `rooms` back to [] and wipe
        // out whatever was loaded via the dedicated rooms input below.
        let roomStatus = '';
        if (Array.isArray(parsed?.rooms)) {
          setRooms(parsed.rooms);
          roomStatus = ` and ${parsed.rooms.length} rooms`;
        }
        const wallLengthCount = dims.filter((d) => d.kind === 'wall_length').length;
        const perimeterCount = dims.filter((d) => d.kind === 'wall_length' && d.is_perimeter !== false).length;
        setStatus(
          `Dimensions loaded: ${dims.length} entries (${wallLengthCount} wall_length, ${perimeterCount} perimeter)` +
          `${roomStatus} from ${file.name}`
        );
      } catch (e) {
        setStatus(`Failed to parse ${file.name} as JSON: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }, []);

  // Separate, dedicated input for the legacy split-file workflow (a bare
  // output_rooms.json, as produced alongside output_dimensions.json in
  // blueprint-pipeline/viewer/) — keeps room state entirely independent of
  // whatever was loaded through the dimensions input above.
  const handleRoomsJsonFile = useCallback((file: File | undefined) => {
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const roomList: RoomRow[] = Array.isArray(parsed) ? parsed : parsed?.rooms;
        if (!Array.isArray(roomList)) {
          setStatus(`JSON loaded but no rooms array found in ${file.name}`);
          return;
        }
        setRooms(roomList);
        setStatus(`Rooms loaded: ${roomList.length} rooms from ${file.name}`);
      } catch (e) {
        setStatus(`Failed to parse ${file.name} as JSON: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="rounded border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
        <strong>Temporary dev-only verification harness.</strong> Not part of the real upload flow.
        Load a GLB + dimensions JSON from a real local pipeline run to visually verify Model3DViewer.
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">GLB file</label>
          <input
            type="file"
            accept=".glb"
            onChange={(e) => handleGlbFile(e.target.files?.[0])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dimensions / pipeline output JSON</label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => handleJsonFile(e.target.files?.[0])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rooms JSON (optional, for the legacy split-file output)</label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => handleRoomsJsonFile(e.target.files?.[0])}
          />
        </div>
      </div>

      <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{status}</pre>

      {/* Follows the same toggle-button pattern Model3DViewer already uses
          for its own "Dimensions" button (variant swap between
          default/outline to show on/off state). */}
      <Button
        variant={showInteriorWalls ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowInteriorWalls((v) => !v)}
      >
        {showInteriorWalls ? 'Showing all walls' : 'Showing perimeter walls only'}
      </Button>

      {modelUrl ? (
        <Model3DViewer
          modelUrl={modelUrl}
          modelName="Dev Verification"
          dimensions={visibleDimensions}
          roomLabels={roomLabels}
          // Near-top-down default for this dev page only — floor plans read
          // far more clearly from above than from the main app's default
          // isometric angle, which was fine for a generic single building
          // silhouette but makes it hard to tell which wall/room a label
          // belongs to on a dense multi-room plan.
          cameraPosition={[2, 14, 2]}
        />
      ) : (
        <div className="text-sm text-muted-foreground">No model loaded yet.</div>
      )}

      {rooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rooms &amp; Square Footage</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-1 pr-4">Room</th>
                  <th className="py-1">Area (sq ft)</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r, idx) => (
                  <tr key={r.id ?? idx} className="border-b last:border-0">
                    <td className="py-1 pr-4">{r.label}</td>
                    <td className="py-1">{r.area_sqft ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

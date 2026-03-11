import React, { useState, useEffect } from 'react';
import { BlueprintUploadBox } from './BlueprintUploadBox';
import { Blueprint3DViewer } from './Blueprint3DViewer';
import { ProcessingStatus } from './ProcessingStatus';

export interface ProcessingResult {
  glb_url: string;
  html_view: string;
  detections: any[];
  dimensions_available?: boolean;
  visual_draft_only?: boolean;
  visual_draft_warning?: string | null;
  walls?: any[];
  building_info?: {
    total_area_sqft?: number;
    total_area_m2?: number;
    building_type?: string;
    num_floors?: number;
    exterior_wall_thickness_m?: number;
    interior_wall_thickness_m?: number;
    num_exterior_walls?: number;
    num_interior_walls?: number;
    num_doors?: number;
    num_windows?: number;
  };
  scale_info?: {
    scale_text?: string;
    scale_source?: 'text' | 'bar' | 'estimated' | 'none';
    pixels_per_meter?: number;
    unit_system?: 'imperial' | 'metric' | 'unknown';
  };
}

const STORAGE_KEY = 'citadeltwin_blueprint3d_result';

export const BlueprintTo3DConverter: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        // localStorage full or unavailable
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [result]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-blueprint-3d`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();

      if (data.status === 'success') {
        setResult(data);
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (err) {
      console.error('Blueprint processing error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (isProcessing) {
    return <ProcessingStatus />;
  }

  if (result) {
    return <Blueprint3DViewer result={result} onReset={handleReset} />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">2D Blueprint to 3D Model Converter</h2>
          <p className="text-muted-foreground">
            Upload a JPG or PNG floorplan. CitadelTwin will detect rooms and generate a 3D model automatically.
          </p>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <div className="text-destructive text-lg mb-2">❌ Blueprint processing failed.</div>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">2D Blueprint to 3D Model Converter</h2>
        <p className="text-muted-foreground">
          Upload a JPG or PNG floorplan. CitadelTwin will detect rooms and generate a 3D model automatically.
        </p>
      </div>

      <BlueprintUploadBox onFileUpload={handleFileUpload} />
    </div>
  );
};

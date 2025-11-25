import React, { useState } from 'react';
import { BlueprintUploadBox } from './BlueprintUploadBox';
import { Blueprint3DViewer } from './Blueprint3DViewer';
import { ProcessingStatus } from './ProcessingStatus';

export interface ProcessingResult {
  glb_url: string;
  html_view: string;
  detections: any[];
}

export const BlueprintTo3DConverter: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Get backend URL from environment variable or use default
      const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      
      console.log('Sending blueprint to:', `${backendUrl}/api/blueprint/process`);

      // Call the Python backend
      const response = await fetch(
        `${backendUrl}/api/blueprint/process`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Convert relative GLB path to full URL
        const fullGlbUrl = data.glb_url.startsWith('http') 
          ? data.glb_url 
          : `${backendUrl}${data.glb_url}`;
        
        setResult({
          ...data,
          glb_url: fullGlbUrl
        });
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

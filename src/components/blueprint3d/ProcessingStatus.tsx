import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProcessingStatus: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">2D Blueprint to 3D Model Converter</h2>
        <p className="text-muted-foreground">
          Upload a JPG or PNG floorplan. CitadelTwin will detect rooms and generate a 3D model automatically.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="flex flex-col items-center space-y-6">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">⏳ Processing your blueprint...</h3>
            <div className="space-y-1 text-muted-foreground">
              <p>✓ Uploading image</p>
              <p>⏳ Running room detection</p>
              <p>⏳ Generating 3D model</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This may take 20–40 seconds
          </p>

          <div className="text-xs text-muted-foreground">
            Please do not navigate away from this page
          </div>
        </div>
      </div>
    </div>
  );
};

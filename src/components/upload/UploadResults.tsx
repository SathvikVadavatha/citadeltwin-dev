import React from 'react';
import { UploadResultsTabs } from './UploadResultsTabs';

interface UploadResult {
  id: string;
  filename: string;
  detectedObjects?: any[];
  imageUrl: string;
  processingTime?: number;
  processingMethod?: 'ai' | 'fallback';
  errorMessage?: string;
  model3DUrl?: string;
  model3DGenerated?: boolean;
  generating3D?: boolean;
  enhancedRoomData?: any[];
  scaleInfo?: any;
  buildingInfo?: any;
  walls?: any[];
}

interface UploadResultsProps {
  uploadResult: UploadResult;
  onReset: () => void;
}

export const UploadResults: React.FC<UploadResultsProps> = ({ uploadResult, onReset }) => {
  return (
    <UploadResultsTabs uploadResult={uploadResult} onReset={onReset} />
  );
};

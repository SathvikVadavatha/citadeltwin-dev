
import React from 'react';
import { BlueprintUpload } from './BlueprintUpload';

interface UploadPageProps {
  onNavigate: (view: string) => void;
}

export const UploadPage = ({ onNavigate }: UploadPageProps) => {
  return (
    <div className="max-w-6xl mx-auto">
      <BlueprintUpload />
    </div>
  );
};

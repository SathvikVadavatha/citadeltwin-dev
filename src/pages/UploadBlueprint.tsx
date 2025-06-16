
import React from 'react';
import { UploadPage } from '@/components/upload/UploadPage';

export const UploadBlueprint: React.FC = () => {
  const handleNavigate = (view: string) => {
    // Navigation handled by React Router, this is just a placeholder
    console.log('Navigate to:', view);
  };

  return <UploadPage onNavigate={handleNavigate} />;
};

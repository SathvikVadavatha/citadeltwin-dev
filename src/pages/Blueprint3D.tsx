import React from 'react';
import { BlueprintTo3DConverter } from '@/components/blueprint3d/BlueprintTo3DConverter';

export const Blueprint3D: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <BlueprintTo3DConverter />
    </div>
  );
};

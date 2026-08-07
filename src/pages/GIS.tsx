import React from 'react';
import { GoogleMapsGIS } from '@/components/gis/GoogleMapsGIS';

export const GIS: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GIS Analysis</h1>
      </div>
      <GoogleMapsGIS />
    </div>
  );
};
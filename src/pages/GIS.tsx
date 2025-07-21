import React from 'react';
import { InteractiveGISMap } from '@/components/gis/InteractiveGISMap';

export const GIS: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GIS Analysis</h1>
        <p className="text-muted-foreground">
          Interactive spatial analysis for Central Florida and Northeast Ohio regions
        </p>
      </div>
      <InteractiveGISMap />
    </div>
  );
};
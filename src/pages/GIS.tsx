import React from 'react';
import { GISDataManager } from '@/components/gis/GISDataManager';
import { InteractiveGISMapCore } from '@/components/gis/InteractiveGISMapCore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export const GIS: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GIS Analysis</h1>
        <p className="text-muted-foreground">
          Interactive spatial analysis for Central Florida and Northeast Ohio regions
        </p>
      </div>
      
      {/* GIS Data Management Section */}
      <GISDataManager />
      
      {/* Interactive Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Interactive GIS Map
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore spatial data with interactive layers, zoom controls, and detailed feature information
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <InteractiveGISMapCore />
        </CardContent>
      </Card>
    </div>
  );
};
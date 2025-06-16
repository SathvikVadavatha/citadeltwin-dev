
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

const BIMViewer: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BIM Viewer</h1>
          <p className="text-muted-foreground">Building Information Modeling viewer and tools</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            BIM Models
          </CardTitle>
          <CardDescription>
            View and interact with BIM models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>BIM viewer interface will be available here.</p>
          <Button>Load BIM Model</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BIMViewer;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ViewBlueprints: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>View Blueprints</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Blueprint viewer will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

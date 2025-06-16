
import React from 'react';
import { IntegrationsManager } from '@/components/integrations/IntegrationsManager';

export default function Integrations() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <IntegrationsManager />
      </div>
    </div>
  );
}

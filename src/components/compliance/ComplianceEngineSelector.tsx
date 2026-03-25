
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

export type EngineType = 'standard' | 'multi_jurisdiction';

interface ComplianceEngineSelectorProps {
  activeEngine: EngineType;
  onEngineChange: (engine: EngineType) => void;
}

export const ComplianceEngineSelector: React.FC<ComplianceEngineSelectorProps> = ({
  activeEngine,
  onEngineChange
}) => {
  return (
    <Card className="skeuo-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={activeEngine === 'standard' ? 'default' : 'outline'}
              onClick={() => onEngineChange('standard')}
              className={activeEngine === 'standard' ? 'skeuo-button' : 'border-border'}
            >
              Standard IBC
            </Button>
            <Button
              variant={activeEngine === 'multi_jurisdiction' ? 'default' : 'outline'}
              onClick={() => onEngineChange('multi_jurisdiction')}
              className={activeEngine === 'multi_jurisdiction' ? 'skeuo-button' : 'border-border'}
            >
              <Globe className="w-4 h-4 mr-2" />
              Multi-Jurisdiction
            </Button>
          </div>
          <Badge className="bg-primary/20 text-primary">
            IBC 2021
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

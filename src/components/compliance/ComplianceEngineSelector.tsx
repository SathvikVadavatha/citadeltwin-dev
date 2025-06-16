
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
    <Card className="cyber-tool-palette">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={activeEngine === 'standard' ? 'default' : 'outline'}
              onClick={() => onEngineChange('standard')}
              className={activeEngine === 'standard' ? 'cyber-button' : 'border-gray-600'}
            >
              Standard IBC
            </Button>
            <Button
              variant={activeEngine === 'multi_jurisdiction' ? 'default' : 'outline'}
              onClick={() => onEngineChange('multi_jurisdiction')}
              className={activeEngine === 'multi_jurisdiction' ? 'cyber-button' : 'border-gray-600'}
            >
              <Globe className="w-4 h-4 mr-2" />
              Multi-Jurisdiction
            </Button>
          </div>
          <Badge className="bg-cyan-900 text-cyan-300">
            IBC 2021
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

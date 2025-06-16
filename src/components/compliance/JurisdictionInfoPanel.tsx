
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Snowflake, Waves, Wind, AlertTriangle, Shield } from 'lucide-react';

interface JurisdictionInfoPanelProps {
  jurisdictionId: string;
}

export const JurisdictionInfoPanel: React.FC<JurisdictionInfoPanelProps> = ({ jurisdictionId }) => {
  const getJurisdictionTypeInfo = (jurisdictionId: string) => {
    if (jurisdictionId.includes('OH')) {
      return {
        name: 'Ohio',
        icon: <Snowflake className="w-5 h-5 text-blue-400" />,
        specialties: ['Snow Load (30 psf)', 'Frost Depth (42")', 'Energy Code (5A)', 'Wind (90 mph)'],
        climate: 'Cold climate with snow and frost considerations'
      };
    } else if (jurisdictionId.includes('FL')) {
      return {
        name: 'Florida',
        icon: <Waves className="w-5 h-5 text-cyan-400" />,
        specialties: ['Hurricane (150+ mph)', 'Flood Resistance', 'HVHZ Requirements', 'Coastal Protection'],
        climate: 'Hot-humid climate with hurricane and flood risks'
      };
    } else if (jurisdictionId.includes('TX')) {
      return {
        name: 'Texas',
        icon: <Wind className="w-5 h-5 text-yellow-400" />,
        specialties: ['Wind Load (130 mph)', 'Flood Zones', 'Energy Efficiency'],
        climate: 'Hot climate with high wind and flood considerations'
      };
    } else if (jurisdictionId.includes('CA')) {
      return {
        name: 'California',
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        specialties: ['Seismic Design', 'Title 24 Energy', 'Enhanced Accessibility'],
        climate: 'Seismic zone with enhanced energy requirements'
      };
    } else if (jurisdictionId.includes('NYC') || jurisdictionId.includes('NY')) {
      return {
        name: 'New York',
        icon: <Shield className="w-5 h-5 text-purple-400" />,
        specialties: ['Fire Safety', 'Enhanced Egress', 'High-Rise Requirements'],
        climate: 'Urban environment with enhanced safety requirements'
      };
    }
    
    return {
      name: 'Standard',
      icon: <Shield className="w-5 h-5 text-gray-400" />,
      specialties: ['IBC Requirements'],
      climate: 'Standard building code requirements'
    };
  };

  const jurisdictionInfo = getJurisdictionTypeInfo(jurisdictionId);

  return (
    <Card className="cyber-tool-palette">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {jurisdictionInfo.icon}
            <div>
              <h3 className="font-semibold text-cyan-400">{jurisdictionInfo.name} Compliance Analysis</h3>
              <p className="text-sm text-gray-400">{jurisdictionInfo.climate}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {jurisdictionInfo.specialties.map((specialty, idx) => (
              <Badge key={idx} variant="outline" className="border-cyan-600 text-cyan-300">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Building, Shield, AlertTriangle, Snowflake, Wind, Waves } from 'lucide-react';

interface PriorityJurisdictionsProps {
  onJurisdictionSelect: (jurisdictionId: string) => void;
  selectedJurisdiction?: string;
}

export const PriorityJurisdictions: React.FC<PriorityJurisdictionsProps> = ({
  onJurisdictionSelect,
  selectedJurisdiction
}) => {
  const getJurisdictionIcon = (type: string) => {
    switch (type) {
      case 'state': return <MapPin className="w-4 h-4" />;
      case 'county': return <Building className="w-4 h-4" />;
      case 'city': return <Shield className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getClimateIcon = (stateCode: string) => {
    switch (stateCode) {
      case 'OH': return <Snowflake className="w-3 h-3 text-blue-400" />;
      case 'FL': return <Waves className="w-3 h-3 text-cyan-400" />;
      case 'TX': case 'CA': return <Wind className="w-3 h-3 text-yellow-400" />;
      default: return null;
    }
  };

  const priorityJurisdictions = [
    { name: 'Ohio', state: 'OH', type: 'state', specialties: ['Snow Load', 'Frost Depth', 'Energy Code'] },
    { name: 'Florida', state: 'FL', type: 'state', specialties: ['Hurricane', 'Flood', 'Coastal'] },
    { name: 'New York City', state: 'NY', type: 'city', specialties: ['Fire Safety', 'Egress', 'High-Rise'] },
    { name: 'California', state: 'CA', type: 'state', specialties: ['Seismic', 'Title 24', 'Accessibility'] },
    { name: 'Texas', state: 'TX', type: 'state', specialties: ['Wind Load', 'Flood', 'Energy'] }
  ];

  return (
    <div>
      <h4 className="font-semibold text-cyan-400 mb-3">Priority Jurisdictions - Enhanced Coverage</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {priorityJurisdictions.map((priority) => (
          <Card
            key={`${priority.state}-${priority.name}`}
            className={`cursor-pointer transition-colors border border-cyan-700 hover:bg-cyan-900/20 ${
              selectedJurisdiction === `${priority.state}-${priority.type}` ? 'bg-cyan-900/30' : ''
            }`}
            onClick={() => onJurisdictionSelect(`${priority.state}-${priority.type}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getJurisdictionIcon(priority.type)}
                  {getClimateIcon(priority.state)}
                  <div>
                    <p className="font-medium text-sm">{priority.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {priority.type}
                    </Badge>
                  </div>
                </div>
                {(priority.state === 'OH' || priority.state === 'FL') && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="w-4 h-4 text-green-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Comprehensive Coverage</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Special Requirements:</p>
                <div className="flex flex-wrap gap-1">
                  {priority.specialties.map((spec, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

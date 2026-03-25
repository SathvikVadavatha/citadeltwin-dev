
import React from 'react';
import { MapPin, Building, Shield, Snowflake, Wind, Waves } from 'lucide-react';

export const getJurisdictionIcon = (type: string) => {
  switch (type) {
    case 'state': return <MapPin className="w-4 h-4" />;
    case 'county': return <Building className="w-4 h-4" />;
    case 'city': return <Shield className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

export const getClimateIcon = (stateCode: string) => {
  switch (stateCode) {
    case 'OH': return <Snowflake className="w-3 h-3 text-blue-600" />;
    case 'FL': return <Waves className="w-3 h-3 text-primary" />;
    case 'TX': case 'CA': return <Wind className="w-3 h-3 text-yellow-600" />;
    default: return null;
  }
};

export const getJurisdictionColor = (type: string) => {
  switch (type) {
    case 'state': return 'bg-blue-900 text-blue-300';
    case 'county': return 'bg-green-900 text-green-300';
    case 'city': return 'bg-purple-900 text-purple-300';
    default: return 'bg-card text-foreground';
  }
};

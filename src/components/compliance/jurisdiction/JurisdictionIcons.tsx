
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
    case 'OH': return <Snowflake className="w-3 h-3 text-blue-400" />;
    case 'FL': return <Waves className="w-3 h-3 text-cyan-400" />;
    case 'TX': case 'CA': return <Wind className="w-3 h-3 text-yellow-400" />;
    default: return null;
  }
};

export const getJurisdictionColor = (type: string) => {
  switch (type) {
    case 'state': return 'bg-blue-900 text-blue-300';
    case 'county': return 'bg-green-900 text-green-300';
    case 'city': return 'bg-purple-900 text-purple-300';
    default: return 'bg-gray-900 text-gray-300';
  }
};

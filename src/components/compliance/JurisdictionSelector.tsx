import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Building, Shield, Search, AlertTriangle, Snowflake, Wind, Waves } from 'lucide-react';
import { useJurisdictions } from '@/hooks/useJurisdictions';

interface JurisdictionSelectorProps {
  onJurisdictionSelect: (jurisdictionId: string) => void;
  selectedJurisdiction?: string;
}

export const JurisdictionSelector: React.FC<JurisdictionSelectorProps> = ({
  onJurisdictionSelect,
  selectedJurisdiction
}) => {
  const [searchState, setSearchState] = useState('');
  const [searchCounty, setSearchCounty] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { 
    jurisdictions = [], // Add default empty array
    jurisdictionsLoading,
    searchJurisdictionsByLocation,
    getApplicableCodes
  } = useJurisdictions();

  const handleLocationSearch = async () => {
    if (!searchState) return;
    
    const results = await searchJurisdictionsByLocation(
      searchState.toUpperCase(),
      searchCounty || undefined,
      searchCity || undefined
    );
    
    // Add null check and default to empty array
    if (results) {
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getJurisdictionIcon = (type: string) => {
    switch (type) {
      case 'state': return <MapPin className="w-4 h-4" />;
      case 'county': return <Building className="w-4 h-4" />;
      case 'city': return <Shield className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getJurisdictionColor = (type: string) => {
    switch (type) {
      case 'state': return 'bg-blue-900 text-blue-300';
      case 'county': return 'bg-green-900 text-green-300';
      case 'city': return 'bg-purple-900 text-purple-300';
      default: return 'bg-gray-900 text-gray-300';
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

  const getJurisdictionSpecialRequirements = (stateCode: string, jurisdictionType: string) => {
    const requirements = [];
    
    switch (stateCode) {
      case 'OH':
        requirements.push('Snow Load', 'Frost Depth', 'Energy Efficiency');
        break;
      case 'FL':
        requirements.push('Hurricane Resistance', 'Flood Resistance', 'Termite Protection');
        break;
      case 'TX':
        requirements.push('Wind Load', 'Flood Resistance');
        break;
      case 'CA':
        requirements.push('Seismic', 'Energy (Title 24)');
        break;
      case 'NY':
        if (jurisdictionType === 'city') {
          requirements.push('Fire Escapes', 'Enhanced Egress');
        }
        break;
    }
    
    return requirements;
  };

  const formatJurisdictionName = (jurisdiction: any) => {
    if (jurisdiction.jurisdiction_type === 'city') {
      return `${jurisdiction.city_name}, ${jurisdiction.county_name}, ${jurisdiction.state_code}`;
    } else if (jurisdiction.jurisdiction_type === 'county') {
      return `${jurisdiction.county_name} County, ${jurisdiction.state_code}`;
    } else {
      return jurisdiction.name;
    }
  };

  // Show loading state if jurisdictions are being fetched
  if (jurisdictionsLoading) {
    return (
      <Card className="cyber-tool-palette">
        <CardHeader>
          <CardTitle className="text-cyan-400">Loading Jurisdictions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="cyber-tool-palette">
        <CardHeader>
          <CardTitle className="text-cyan-400">Comprehensive Jurisdiction Selection</CardTitle>
          <CardDescription>
            Select jurisdiction for detailed compliance checking with state-specific requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Priority Jurisdictions with Special Requirements */}
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Priority Jurisdictions - Enhanced Coverage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'Ohio', state: 'OH', type: 'state', specialties: ['Snow Load', 'Frost Depth', 'Energy Code'] },
                { name: 'Florida', state: 'FL', type: 'state', specialties: ['Hurricane', 'Flood', 'Coastal'] },
                { name: 'New York City', state: 'NY', type: 'city', specialties: ['Fire Safety', 'Egress', 'High-Rise'] },
                { name: 'California', state: 'CA', type: 'state', specialties: ['Seismic', 'Title 24', 'Accessibility'] },
                { name: 'Texas', state: 'TX', type: 'state', specialties: ['Wind Load', 'Flood', 'Energy'] }
              ].map((priority) => (
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
                          <Badge variant="outline" className={getJurisdictionColor(priority.type)}>
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

          {/* Location Search */}
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Search by Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">State</label>
                <Input
                  placeholder="e.g., OH, FL, CA"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">County (Optional)</label>
                <Input
                  placeholder="e.g., Cuyahoga, Miami-Dade"
                  value={searchCounty}
                  onChange={(e) => setSearchCounty(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">City (Optional)</label>
                <Input
                  placeholder="e.g., Cleveland, Miami"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleLocationSearch}
                  className="cyber-button w-full"
                  disabled={!searchState}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Search Results - Add null check */}
          {searchResults && searchResults.length > 0 && (
            <div>
              <h4 className="font-semibold text-cyan-400 mb-3">Search Results</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((jurisdiction) => {
                  const specialReqs = getJurisdictionSpecialRequirements(jurisdiction.state_code, jurisdiction.jurisdiction_type);
                  return (
                    <Card
                      key={jurisdiction.id}
                      className={`cursor-pointer transition-colors border border-gray-700 hover:bg-gray-800/50 ${
                        selectedJurisdiction === jurisdiction.id ? 'bg-cyan-900/30 border-cyan-500' : ''
                      }`}
                      onClick={() => onJurisdictionSelect(jurisdiction.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getJurisdictionIcon(jurisdiction.jurisdiction_type)}
                            {getClimateIcon(jurisdiction.state_code)}
                            <div>
                              <p className="font-medium text-sm">
                                {formatJurisdictionName(jurisdiction)}
                              </p>
                              <p className="text-xs text-gray-400">
                                Last updated: {new Date(jurisdiction.last_updated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getJurisdictionColor(jurisdiction.jurisdiction_type)}>
                              {jurisdiction.jurisdiction_type}
                            </Badge>
                            {(jurisdiction.state_code === 'OH' || jurisdiction.state_code === 'FL') && (
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
                        </div>
                        {specialReqs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-1">Special Requirements:</p>
                            <div className="flex flex-wrap gap-1">
                              {specialReqs.map((req, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Jurisdictions - Add null check */}
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">All Available Jurisdictions</h4>
            {jurisdictions && jurisdictions.length > 0 ? (
              <Select onValueChange={onJurisdictionSelect} value={selectedJurisdiction}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select a jurisdiction..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {jurisdictions.map((jurisdiction) => {
                    const specialReqs = getJurisdictionSpecialRequirements(jurisdiction.state_code, jurisdiction.jurisdiction_type);
                    return (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                        <div className="flex items-center space-x-2">
                          {getJurisdictionIcon(jurisdiction.jurisdiction_type)}
                          {getClimateIcon(jurisdiction.state_code)}
                          <span>{formatJurisdictionName(jurisdiction)}</span>
                          <Badge variant="outline" className={getJurisdictionColor(jurisdiction.jurisdiction_type)}>
                            {jurisdiction.jurisdiction_type}
                          </Badge>
                          {(jurisdiction.state_code === 'OH' || jurisdiction.state_code === 'FL') && (
                            <AlertTriangle className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center text-gray-400 p-4">
                No jurisdictions available. There may be an issue with the data service.
              </div>
            )}
          </div>

          {/* Information Panel */}
          <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
            <h5 className="font-semibold text-cyan-400 mb-2">Enhanced Compliance Coverage</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h6 className="font-medium text-cyan-300 mb-1">Ohio (OH) Comprehensive:</h6>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Snow Load Requirements (30 psf ground)</li>
                  <li>Frost Depth (42" minimum)</li>
                  <li>Energy Code (IECC 2021, Zone 5A)</li>
                  <li>Wind Load (90 mph basic)</li>
                  <li>Fire Safety & Electrical (NEC 2020)</li>
                  <li>Accessibility & Plumbing Codes</li>
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-cyan-300 mb-1">Florida (FL) Comprehensive:</h6>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Hurricane Resistance (150+ mph coastal)</li>
                  <li>Flood Requirements (BFE + freeboard)</li>
                  <li>High Velocity Hurricane Zone (HVHZ)</li>
                  <li>Coastal Construction Controls</li>
                  <li>Termite & Moisture Protection</li>
                  <li>Energy Efficiency (Hot-Humid Climate)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Shield, Search } from 'lucide-react';
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
    jurisdictions, 
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
    
    if (results) {
      setSearchResults(results);
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

  const formatJurisdictionName = (jurisdiction: any) => {
    if (jurisdiction.jurisdiction_type === 'city') {
      return `${jurisdiction.city_name}, ${jurisdiction.county_name}, ${jurisdiction.state_code}`;
    } else if (jurisdiction.jurisdiction_type === 'county') {
      return `${jurisdiction.county_name} County, ${jurisdiction.state_code}`;
    } else {
      return jurisdiction.name;
    }
  };

  return (
    <Card className="cyber-tool-palette">
      <CardHeader>
        <CardTitle className="text-cyan-400">Jurisdiction Selection</CardTitle>
        <CardDescription>
          Select the applicable jurisdiction for compliance checking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Jurisdictions */}
        <div>
          <h4 className="font-semibold text-cyan-400 mb-3">Priority Jurisdictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'New York City', state: 'NY', type: 'city' },
              { name: 'California', state: 'CA', type: 'state' },
              { name: 'Texas', state: 'TX', type: 'state' },
              { name: 'Ohio', state: 'OH', type: 'state' },
              { name: 'Florida', state: 'FL', type: 'state' }
            ].map((priority) => (
              <Card
                key={`${priority.state}-${priority.name}`}
                className={`cursor-pointer transition-colors border border-cyan-700 hover:bg-cyan-900/20 ${
                  selectedJurisdiction === `${priority.state}-${priority.type}` ? 'bg-cyan-900/30' : ''
                }`}
                onClick={() => onJurisdictionSelect(`${priority.state}-${priority.type}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    {getJurisdictionIcon(priority.type)}
                    <div>
                      <p className="font-medium text-sm">{priority.name}</p>
                      <Badge variant="outline" className={getJurisdictionColor(priority.type)}>
                        {priority.type}
                      </Badge>
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
                placeholder="e.g., CA, TX, NY"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">County (Optional)</label>
              <Input
                placeholder="e.g., Los Angeles"
                value={searchCounty}
                onChange={(e) => setSearchCounty(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">City (Optional)</label>
              <Input
                placeholder="e.g., San Francisco"
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

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Search Results</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((jurisdiction) => (
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
                        <div>
                          <p className="font-medium text-sm">
                            {formatJurisdictionName(jurisdiction)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Last updated: {new Date(jurisdiction.last_updated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getJurisdictionColor(jurisdiction.jurisdiction_type)}>
                        {jurisdiction.jurisdiction_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Jurisdictions */}
        <div>
          <h4 className="font-semibold text-cyan-400 mb-3">All Available Jurisdictions</h4>
          <Select onValueChange={onJurisdictionSelect} value={selectedJurisdiction}>
            <SelectTrigger className="bg-gray-900 border-gray-700">
              <SelectValue placeholder="Select a jurisdiction..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {jurisdictions.map((jurisdiction) => (
                <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                  <div className="flex items-center space-x-2">
                    {getJurisdictionIcon(jurisdiction.jurisdiction_type)}
                    <span>{formatJurisdictionName(jurisdiction)}</span>
                    <Badge variant="outline" className={getJurisdictionColor(jurisdiction.jurisdiction_type)}>
                      {jurisdiction.jurisdiction_type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

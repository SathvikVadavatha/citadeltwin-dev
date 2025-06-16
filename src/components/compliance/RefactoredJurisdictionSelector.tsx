
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useJurisdictions } from '@/hooks/useJurisdictions';
import { PriorityJurisdictions } from './PriorityJurisdictions';

interface RefactoredJurisdictionSelectorProps {
  onJurisdictionSelect: (jurisdictionId: string) => void;
  selectedJurisdiction?: string;
}

export const RefactoredJurisdictionSelector: React.FC<RefactoredJurisdictionSelectorProps> = ({
  onJurisdictionSelect,
  selectedJurisdiction
}) => {
  const [searchState, setSearchState] = useState('');
  const [searchCounty, setSearchCounty] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { 
    jurisdictions = [],
    jurisdictionsLoading,
    searchJurisdictionsByLocation,
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
    } else {
      setSearchResults([]);
    }
  };

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
    <ErrorBoundary>
      <TooltipProvider>
        <Card className="cyber-tool-palette">
          <CardHeader>
            <CardTitle className="text-cyan-400">Comprehensive Jurisdiction Selection</CardTitle>
            <CardDescription>
              Select jurisdiction for detailed compliance checking with state-specific requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Priority Jurisdictions */}
            <PriorityJurisdictions
              onJurisdictionSelect={onJurisdictionSelect}
              selectedJurisdiction={selectedJurisdiction}
            />

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

            {/* All Jurisdictions */}
            <div>
              <h4 className="font-semibold text-cyan-400 mb-3">All Available Jurisdictions</h4>
              {jurisdictions && jurisdictions.length > 0 ? (
                <Select onValueChange={onJurisdictionSelect} value={selectedJurisdiction}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select a jurisdiction..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {jurisdictions.map((jurisdiction) => (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                        {jurisdiction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-gray-400 p-4">
                  No jurisdictions available. There may be an issue with the data service.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

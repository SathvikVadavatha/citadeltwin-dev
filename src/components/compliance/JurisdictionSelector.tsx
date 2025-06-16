
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useJurisdictions } from '@/hooks/useJurisdictions';
import { PriorityJurisdictions } from './PriorityJurisdictions';
import { JurisdictionSearchForm } from './jurisdiction/JurisdictionSearchForm';
import { formatJurisdictionName } from './jurisdiction/JurisdictionUtils';

interface JurisdictionSelectorProps {
  onJurisdictionSelect: (jurisdictionId: string) => void;
  selectedJurisdiction?: string;
}

export const JurisdictionSelector: React.FC<JurisdictionSelectorProps> = ({
  onJurisdictionSelect,
  selectedJurisdiction
}) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { 
    jurisdictions = [],
    jurisdictionsLoading,
    searchJurisdictionsByLocation,
  } = useJurisdictions();

  const handleLocationSearch = async (state: string, county?: string, city?: string) => {
    try {
      const results = await searchJurisdictionsByLocation(state, county, city);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search failed:', error);
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
            <CardTitle className="text-cyan-400">Jurisdiction Selection</CardTitle>
            <CardDescription>
              Select jurisdiction for detailed compliance checking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Priority Jurisdictions */}
            <PriorityJurisdictions
              onJurisdictionSelect={onJurisdictionSelect}
              selectedJurisdiction={selectedJurisdiction}
            />

            {/* Location Search */}
            <JurisdictionSearchForm onSearch={handleLocationSearch} />

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
                        <p className="font-medium text-sm">
                          {formatJurisdictionName(jurisdiction)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Jurisdictions Dropdown */}
            <div>
              <h4 className="font-semibold text-cyan-400 mb-3">All Available Jurisdictions</h4>
              {jurisdictions.length > 0 ? (
                <Select onValueChange={onJurisdictionSelect} value={selectedJurisdiction}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select a jurisdiction..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 max-h-60">
                    {jurisdictions.map((jurisdiction) => (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                        {formatJurisdictionName(jurisdiction)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-gray-400 p-4">
                  No jurisdictions available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

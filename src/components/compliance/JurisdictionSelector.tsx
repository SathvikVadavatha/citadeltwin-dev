
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
    jurisdictions,
    jurisdictionsLoading,
    searchJurisdictionsByLocation,
  } = useJurisdictions();

  // Ensure jurisdictions is always an array, even if API fails
  const safeJurisdictions = Array.isArray(jurisdictions) ? jurisdictions : [];
  const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];

  const handleLocationSearch = async (state: string, county?: string, city?: string) => {
    try {
      const results = await searchJurisdictionsByLocation(state, county, city);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  if (jurisdictionsLoading) {
    return (
      <Card className="skeuo-panel">
        <CardHeader>
          <CardTitle className="text-primary">Loading Jurisdictions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Card className="skeuo-panel">
          <CardHeader>
            <CardTitle className="text-primary">Jurisdiction Selection</CardTitle>
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
            {safeSearchResults.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-3">Search Results</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {safeSearchResults.map((jurisdiction) => (
                    <Card
                      key={jurisdiction.id}
                      className={`cursor-pointer transition-colors border border-border hover:bg-muted/50 ${
                        selectedJurisdiction === jurisdiction.id ? 'bg-primary/10 border-primary' : ''
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
              <h4 className="font-semibold text-primary mb-3">All Available Jurisdictions</h4>
              {safeJurisdictions.length > 0 ? (
                <Select onValueChange={onJurisdictionSelect} value={selectedJurisdiction}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Select a jurisdiction..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {safeJurisdictions.map((jurisdiction) => (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                        {formatJurisdictionName(jurisdiction)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  {jurisdictionsLoading ? 'Loading jurisdictions...' : 'No jurisdictions available. Please check your connection.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

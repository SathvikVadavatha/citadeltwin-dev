
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface JurisdictionSearchFormProps {
  onSearch: (state: string, county?: string, city?: string) => void;
}

export const JurisdictionSearchForm: React.FC<JurisdictionSearchFormProps> = ({ onSearch }) => {
  const [searchState, setSearchState] = useState('');
  const [searchCounty, setSearchCounty] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const handleSearch = () => {
    if (!searchState) return;
    onSearch(
      searchState.toUpperCase(),
      searchCounty || undefined,
      searchCity || undefined
    );
  };

  return (
    <div>
      <h4 className="font-semibold text-primary mb-3">Search by Location</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">State</label>
          <Input
            placeholder="e.g., OH, FL, CA"
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            className="bg-card border-border"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">County (Optional)</label>
          <Input
            placeholder="e.g., Cuyahoga, Miami-Dade"
            value={searchCounty}
            onChange={(e) => setSearchCounty(e.target.value)}
            className="bg-card border-border"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">City (Optional)</label>
          <Input
            placeholder="e.g., Cleveland, Miami"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="bg-card border-border"
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSearch}
            className="skeuo-button w-full"
            disabled={!searchState}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AVAILABLE_CITIES = [
  { value: 'nyc', label: 'New York City, NY' },
  { value: 'la', label: 'Los Angeles, CA' },
  { value: 'chicago', label: 'Chicago, IL' },
  { value: 'boston', label: 'Boston, MA' },
  { value: 'miami', label: 'Miami, FL' },
  { value: 'dallas', label: 'Dallas, TX' }
];

export const GISTestTrigger = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const triggerFetchCityData = async () => {
    if (!selectedCity) {
      toast.error('Please select a city first');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`🚀 Triggering fetchCityData for: ${selectedCity}`);
      
      const { data, error } = await supabase.functions.invoke('gis-ingestion', {
        body: { 
          action: 'fetch_city_data',
          location: selectedCity 
        }
      });

      if (error) {
        console.error('❌ Error from edge function:', error);
        toast.error(`Failed to fetch city data: ${error.message}`);
        setLastResult({ success: false, error: error.message });
        return;
      }

      console.log('✅ Success response:', data);
      setLastResult(data);
      
      if (data.success) {
        toast.success(`Successfully ingested GIS data for ${selectedCity}!`);
        console.log('📊 Results summary:', data.summary);
        console.log('📋 Detailed results:', data.results);
        
        if (data.errors && data.errors.length > 0) {
          console.warn('⚠️ Some errors occurred:', data.errors);
        }
      } else {
        toast.error(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('❌ Exception during fetch:', error);
      toast.error(`Exception: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>GIS Data Ingestion Trigger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select City:</label>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a city to ingest GIS data" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_CITIES.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={triggerFetchCityData} 
          disabled={!selectedCity || isLoading}
          className="w-full"
        >
          {isLoading ? 'Ingesting Data...' : 'Trigger GIS Data Ingestion'}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Last Result:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
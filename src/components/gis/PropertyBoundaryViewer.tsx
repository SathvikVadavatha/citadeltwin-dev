
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  MapPin, 
  Ruler, 
  Waves, 
  TreePine,
  Building,
  Search,
  Download
} from 'lucide-react';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';

export const PropertyBoundaryViewer = () => {
  const {
    propertyBoundaries,
    isLoading,
    fetchPropertyBoundaries,
    isFetching
  } = useAdvancedGIS();

  const [searchParams, setSearchParams] = useState({
    city: '',
    state: '',
    parcelId: ''
  });

  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const handleFetchBoundaries = async () => {
    if (!searchParams.city || !searchParams.state) {
      return;
    }

    try {
      await fetchPropertyBoundaries({
        city: searchParams.city,
        state: searchParams.state
      });
    } catch (error) {
      console.error('Error fetching property boundaries:', error);
    }
  };

  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
  };

  const formatArea = (areaSqft: number | null) => {
    if (!areaSqft) return 'Unknown';
    const acres = areaSqft / 43560;
    return acres >= 1 
      ? `${acres.toFixed(2)} acres (${areaSqft.toLocaleString()} sq ft)`
      : `${areaSqft.toLocaleString()} sq ft`;
  };

  const getZoningColor = (zoning: string | null) => {
    if (!zoning) return 'bg-gray-500';
    if (zoning.toLowerCase().includes('residential')) return 'bg-green-500';
    if (zoning.toLowerCase().includes('commercial')) return 'bg-blue-500';
    if (zoning.toLowerCase().includes('industrial')) return 'bg-orange-500';
    return 'bg-purple-500';
  };

  const getFloodZoneColor = (floodZone: string | null) => {
    if (!floodZone) return 'bg-gray-500';
    if (floodZone === 'X') return 'bg-green-500';
    if (floodZone.startsWith('A')) return 'bg-red-500';
    if (floodZone.startsWith('V')) return 'bg-red-600';
    return 'bg-yellow-500';
  };

  const filteredProperties = propertyBoundaries.filter(property => {
    if (searchParams.parcelId) {
      return property.parcel_id.toLowerCase().includes(searchParams.parcelId.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-500" />
            Property Boundary Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boundary-city">City</Label>
                  <Input
                    id="boundary-city"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Austin"
                    className="cyber-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boundary-state">State</Label>
                  <Input
                    id="boundary-state"
                    value={searchParams.state}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., TX"
                    className="cyber-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcel-search">Parcel ID (Optional)</Label>
                  <Input
                    id="parcel-search"
                    value={searchParams.parcelId}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, parcelId: e.target.value }))}
                    placeholder="Search by parcel ID"
                    className="cyber-button"
                  />
                </div>
              </div>

              <Button 
                onClick={handleFetchBoundaries}
                disabled={isFetching || !searchParams.city || !searchParams.state}
                className="cyber-button w-full"
              >
                {isFetching ? 'Fetching Property Boundaries...' : 'Fetch Property Boundaries'}
              </Button>
            </TabsContent>

            <TabsContent value="boundaries" className="space-y-4">
              {filteredProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    {isLoading ? 'Loading property boundaries...' : 'No property boundaries found. Search for a location to get started.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredProperties.map((property) => (
                    <Card 
                      key={property.id} 
                      className={`cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 ${
                        selectedProperty?.id === property.id ? 'ring-2 ring-blue-500 bg-blue-50/5' : ''
                      }`}
                      onClick={() => handlePropertySelect(property)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-200">
                                {property.property_address || `Parcel ${property.parcel_id}`}
                              </h4>
                              <Badge variant="outline">{property.parcel_id}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.city}, {property.state}
                              </span>
                              {property.area_sqft && (
                                <span className="flex items-center gap-1">
                                  <Ruler className="w-3 h-3" />
                                  {formatArea(property.area_sqft)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {property.zoning_designation && (
                                <Badge className={`${getZoningColor(property.zoning_designation)} text-white`}>
                                  {property.zoning_designation}
                                </Badge>
                              )}
                              {property.flood_zone && (
                                <Badge className={`${getFloodZoneColor(property.flood_zone)} text-white`}>
                                  Flood Zone {property.flood_zone}
                                </Badge>
                              )}
                              {property.soil_type && (
                                <Badge variant="outline">{property.soil_type}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {!selectedProperty ? (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Select a property from the boundaries tab to view detailed information.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="gradient-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Property Details</span>
                        <Button variant="outline" size="sm" className="cyber-button">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-200 mb-2">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-gray-400">Parcel ID:</span> {selectedProperty.parcel_id}</div>
                            <div><span className="text-gray-400">Address:</span> {selectedProperty.property_address || 'Not available'}</div>
                            <div><span className="text-gray-400">Owner:</span> {selectedProperty.owner_name || 'Not available'}</div>
                            <div><span className="text-gray-400">Area:</span> {formatArea(selectedProperty.area_sqft)}</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-200 mb-2">Zoning & Environmental</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Zoning:</span>
                              {selectedProperty.zoning_designation ? (
                                <Badge className={`${getZoningColor(selectedProperty.zoning_designation)} text-white text-xs`}>
                                  {selectedProperty.zoning_designation}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not specified</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Flood Zone:</span>
                              {selectedProperty.flood_zone ? (
                                <Badge className={`${getFloodZoneColor(selectedProperty.flood_zone)} text-white text-xs`}>
                                  {selectedProperty.flood_zone}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">Not specified</span>
                              )}
                            </div>
                            <div><span className="text-gray-400">Soil Type:</span> {selectedProperty.soil_type || 'Not specified'}</div>
                            <div><span className="text-gray-400">Last Surveyed:</span> {selectedProperty.last_surveyed ? new Date(selectedProperty.last_surveyed).toLocaleDateString() : 'Not available'}</div>
                          </div>
                        </div>
                      </div>

                      {selectedProperty.environmental_constraints && selectedProperty.environmental_constraints.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
                            <TreePine className="h-4 w-4 text-green-500" />
                            Environmental Constraints
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedProperty.environmental_constraints.map((constraint: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {constraint.type || constraint}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

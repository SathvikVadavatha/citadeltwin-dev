
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface PropertyBoundary {
  id: string;
  parcel_id: string;
  property_address: string | null;
  owner_name: string | null;
  boundary_geometry: any;
  area_sqft: number | null;
  zoning_designation: string | null;
  flood_zone: string | null;
  soil_type: string | null;
  environmental_constraints: any[];
  city: string;
  state: string;
  county: string | null;
  last_surveyed: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentalLayer {
  id: string;
  layer_name: string;
  layer_type: 'flood_zones' | 'soil_conditions' | 'environmental' | 'zoning';
  environmental_type: string | null;
  city: string;
  state: string;
  geometry_data: any;
  feature_count: number;
  real_time_enabled: boolean;
  data_freshness_hours: number;
  last_updated: string;
  metadata?: any;
  description?: string;
  source_url?: string;
  coordinate_system?: string;
  processing_status?: string;
  status?: string;
  created_at?: string;
}

export const useAdvancedGIS = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch environmental layers
  const { 
    data: environmentalLayers = [], 
    isLoading: isLoadingEnvironmental 
  } = useQuery({
    queryKey: ['environmental-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gis_layers')
        .select('*')
        .in('layer_type', ['flood_zones', 'soil_conditions', 'environmental', 'zoning'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnvironmentalLayer[];
    },
  });

  // Fetch property boundaries
  const { 
    data: propertyBoundaries = [], 
    isLoading: isLoadingBoundaries 
  } = useQuery({
    queryKey: ['property-boundaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as PropertyBoundary[];
    },
  });

  // Fetch environmental data for specific location
  const fetchEnvironmentalDataMutation = useMutation({
    mutationFn: async ({ 
      city, 
      state, 
      dataTypes 
    }: { 
      city: string; 
      state: string; 
      dataTypes: string[] 
    }) => {
      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'fetch_environmental_data',
          city,
          state,
          data_types: dataTypes
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environmental-layers'] });
      toast.success('Environmental data fetched successfully');
    },
    onError: (error: any) => {
      console.error('Environmental data fetch error:', error);
      toast.error(`Failed to fetch environmental data: ${error.message}`);
    },
  });

  // Perform zoning analysis
  const zoningAnalysisMutation = useMutation({
    mutationFn: async ({
      parcelId,
      proposedUse,
      buildingHeight,
      lotCoverage
    }: {
      parcelId: string;
      proposedUse: string;
      buildingHeight: number;
      lotCoverage: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'zoning_analysis',
          parcel_id: parcelId,
          proposed_use: proposedUse,
          building_height: buildingHeight,
          lot_coverage: lotCoverage,
          user_id: user?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Zoning analysis completed');
    },
    onError: (error: any) => {
      console.error('Zoning analysis error:', error);
      toast.error(`Zoning analysis failed: ${error.message}`);
    },
  });

  // Enable real-time updates for a layer
  const enableRealTimeUpdatesMutation = useMutation({
    mutationFn: async ({ layerId, updateFrequency }: { layerId: string; updateFrequency: string }) => {
      const { error } = await supabase
        .from('gis_layers')
        .update({
          real_time_enabled: true,
          update_frequency: updateFrequency
        })
        .eq('id', layerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environmental-layers'] });
      toast.success('Real-time updates enabled');
    },
    onError: (error: any) => {
      console.error('Real-time enable error:', error);
      toast.error(`Failed to enable real-time updates: ${error.message}`);
    },
  });

  // Fetch property boundaries by location
  const fetchPropertyBoundariesMutation = useMutation({
    mutationFn: async ({ city, state, bbox }: { city: string; state: string; bbox?: any }) => {
      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'fetch_property_boundaries',
          city,
          state,
          bbox
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-boundaries'] });
      toast.success('Property boundaries updated');
    },
    onError: (error: any) => {
      console.error('Property boundaries fetch error:', error);
      toast.error(`Failed to fetch property boundaries: ${error.message}`);
    },
  });

  // Fetch FEMA flood data specifically
  const fetchFEMAFloodDataMutation = useMutation({
    mutationFn: async ({ city, state }: { city: string; state: string }) => {
      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'fetch_fema_flood_data',
          city,
          state
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environmental-layers'] });
      toast.success('FEMA flood data fetched successfully');
    },
    onError: (error: any) => {
      console.error('FEMA flood data fetch error:', error);
      toast.error(`Failed to fetch FEMA flood data: ${error.message}`);
    },
  });

  // Advanced spatial analysis with environmental factors
  const advancedSpatialAnalysisMutation = useMutation({
    mutationFn: async ({
      analysisType,
      layerIds,
      environmentalFactors,
      parameters
    }: {
      analysisType: string;
      layerIds: string[];
      environmentalFactors: string[];
      parameters: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'advanced_spatial_analysis',
          analysis_type: analysisType,
          layer_ids: layerIds,
          environmental_factors: environmentalFactors,
          parameters,
          user_id: user?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spatial-analysis-results'] });
      toast.success('Advanced spatial analysis completed');
    },
    onError: (error: any) => {
      console.error('Advanced spatial analysis error:', error);
      toast.error(`Advanced analysis failed: ${error.message}`);
    },
  });

  return {
    environmentalLayers,
    propertyBoundaries,
    isLoading: isLoadingEnvironmental || isLoadingBoundaries,
    fetchEnvironmentalData: fetchEnvironmentalDataMutation.mutateAsync,
    fetchFEMAFloodData: fetchFEMAFloodDataMutation.mutateAsync,
    performZoningAnalysis: zoningAnalysisMutation.mutateAsync,
    enableRealTimeUpdates: enableRealTimeUpdatesMutation.mutateAsync,
    fetchPropertyBoundaries: fetchPropertyBoundariesMutation.mutateAsync,
    performAdvancedSpatialAnalysis: advancedSpatialAnalysisMutation.mutateAsync,
    isFetching: fetchEnvironmentalDataMutation.isPending || 
                fetchFEMAFloodDataMutation.isPending ||
                zoningAnalysisMutation.isPending || 
                enableRealTimeUpdatesMutation.isPending ||
                fetchPropertyBoundariesMutation.isPending ||
                advancedSpatialAnalysisMutation.isPending,
  };
};

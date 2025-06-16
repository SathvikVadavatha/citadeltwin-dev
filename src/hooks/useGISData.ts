
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';

type GISLayer = {
  id: string;
  layer_name: string;
  layer_type: 'parcels' | 'roads' | 'utilities';
  description: string | null;
  source_url: string;
  city: string;
  state: string;
  geometry_data: any;
  feature_count: number | null;
  data_size: number | null;
  status: string;
  metadata: any;
  created_at: string;
  last_updated: string;
};

type GISLayerInsert = {
  layer_name: string;
  layer_type: 'parcels' | 'roads' | 'utilities';
  description?: string;
  source_url: string;
  city: string;
  state: string;
  geometry_data?: any;
  feature_count?: number;
  data_size?: number;
  status?: string;
  metadata?: any;
};

export const useGISData = () => {
  const queryClient = useQueryClient();
  const { withErrorHandling } = useErrorHandler();
  const [error, setError] = useState<string | null>(null);

  // Fetch all GIS layers with improved error handling
  const { 
    data: gisLayers = [], 
    isLoading, 
    error: queryError 
  } = useQuery({
    queryKey: ['gis-layers'],
    queryFn: async () => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase
          .from('gis_layers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as GISLayer[];
      }, 'Fetching GIS layers') ?? [];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation to fetch city data with better error handling
  const fetchCityDataMutation = useMutation({
    mutationFn: async (locationCode: string) => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase.functions.invoke('gis-ingestion', {
          body: { 
            action: 'fetch_city_data',
            location: locationCode 
          }
        });

        if (error) throw error;
        return data;
      }, 'Fetching city data');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
    },
    onError: (error) => {
      setError(`Failed to fetch city data: ${error}`);
    },
  });

  // Mutation to refresh a specific layer
  const refreshLayerMutation = useMutation({
    mutationFn: async (layerId: string) => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase.functions.invoke('gis-ingestion', {
          body: { 
            action: 'refresh_layer',
            layer_id: layerId 
          }
        });

        if (error) throw error;
        return data;
      }, 'Refreshing layer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
    },
    onError: (error) => {
      setError(`Failed to refresh layer: ${error}`);
    },
  });

  // Function to create a new GIS layer
  const createGISLayer = async (layerData: GISLayerInsert) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('gis_layers')
        .insert(layerData)
        .select()
        .single();

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
      return data;
    }, 'Creating GIS layer');
  };

  // Function to update GIS layer
  const updateGISLayer = async (id: string, updates: Partial<GISLayer>) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('gis_layers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
      return data;
    }, 'Updating GIS layer');
  };

  // Function to delete GIS layer
  const deleteGISLayer = async (id: string) => {
    return withErrorHandling(async () => {
      const { error } = await supabase
        .from('gis_layers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
      return true;
    }, 'Deleting GIS layer');
  };

  // Clear error state
  const clearError = () => setError(null);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    }
  }, [queryError]);

  return {
    gisLayers,
    isLoading: isLoading || fetchCityDataMutation.isPending || refreshLayerMutation.isPending,
    error: error || queryError?.message || null,
    fetchCityData: fetchCityDataMutation.mutateAsync,
    refreshLayer: refreshLayerMutation.mutateAsync,
    createGISLayer,
    updateGISLayer,
    deleteGISLayer,
    clearError,
  };
};

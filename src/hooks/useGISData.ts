
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  // Fetch all GIS layers
  const { 
    data: gisLayers = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['gis-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gis_layers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GISLayer[];
    },
  });

  // Mutation to fetch city data
  const fetchCityDataMutation = useMutation({
    mutationFn: async (locationCode: string) => {
      const { data, error } = await supabase.functions.invoke('gis-ingestion', {
        body: { 
          action: 'fetch_city_data',
          location: locationCode 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
    },
  });

  // Mutation to refresh a specific layer
  const refreshLayerMutation = useMutation({
    mutationFn: async (layerId: string) => {
      const { data, error } = await supabase.functions.invoke('gis-ingestion', {
        body: { 
          action: 'refresh_layer',
          layer_id: layerId 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
    },
  });

  // Function to create a new GIS layer
  const createGISLayer = async (layerData: GISLayerInsert) => {
    const { data, error } = await supabase
      .from('gis_layers')
      .insert(layerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Function to update GIS layer
  const updateGISLayer = async (id: string, updates: Partial<GISLayer>) => {
    const { data, error } = await supabase
      .from('gis_layers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Function to delete GIS layer
  const deleteGISLayer = async (id: string) => {
    const { error } = await supabase
      .from('gis_layers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return {
    gisLayers,
    isLoading: isLoading || fetchCityDataMutation.isPending || refreshLayerMutation.isPending,
    error,
    fetchCityData: fetchCityDataMutation.mutateAsync,
    refreshLayer: refreshLayerMutation.mutateAsync,
    createGISLayer,
    updateGISLayer,
    deleteGISLayer,
  };
};

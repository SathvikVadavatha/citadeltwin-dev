
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface SpatialAnalysisResult {
  id: string;
  analysis_type: string;
  input_layer_ids: string[];
  result_data: any;
  parameters: any;
  created_at: string;
  user_id: string;
}

export interface SpatialAnalysisParams {
  analysisType: 'intersection' | 'buffer' | 'proximity' | 'overlay';
  layerIds: string[];
  parameters: any;
}

export const useSpatialAnalysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: analysisResults, isLoading } = useQuery({
    queryKey: ['spatial-analysis-results', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('spatial_analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching spatial analysis results:', error);
        throw error;
      }
      
      return (data || []) as SpatialAnalysisResult[];
    },
    enabled: !!user,
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async (params: SpatialAnalysisParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action: 'spatial_analysis',
          analysisType: params.analysisType,
          layerIds: params.layerIds,
          parameters: params.parameters,
          userId: user.id
        }
      });

      if (error) {
        console.error('Error running spatial analysis:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spatial-analysis-results'] });
      toast.success('Spatial analysis completed successfully');
    },
    onError: (error: any) => {
      console.error('Spatial analysis error:', error);
      toast.error(`Failed to run spatial analysis: ${error.message}`);
    },
  });

  const fetchRealGISData = useMutation({
    mutationFn: async ({
      dataType,
      city,
      state,
      bbox,
      utilityType
    }: {
      dataType: 'parcels' | 'roads' | 'utilities' | 'osm_data';
      city: string;
      state: string;
      bbox?: any;
      utilityType?: string;
    }) => {
      const action = dataType === 'parcels' ? 'fetch_parcels' :
                    dataType === 'roads' ? 'fetch_roads' :
                    dataType === 'utilities' ? 'fetch_utilities' :
                    'fetch_osm_data';

      const { data, error } = await supabase.functions.invoke('real-gis-integration', {
        body: {
          action,
          city,
          state,
          bbox,
          utilityType,
          tags: dataType === 'osm_data' ? ['building', 'landuse', 'amenity'] : undefined
        }
      });

      if (error) {
        console.error('Error fetching GIS data:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-layers'] });
      toast.success('GIS data fetched successfully from external sources');
    },
    onError: (error: any) => {
      console.error('GIS data fetch error:', error);
      toast.error(`Failed to fetch GIS data: ${error.message}`);
    },
  });

  const runIntersectionAnalysis = async (layerIds: string[]) => {
    return runAnalysisMutation.mutateAsync({
      analysisType: 'intersection',
      layerIds,
      parameters: {}
    });
  };

  const runBufferAnalysis = async (layerIds: string[], distance: number, units: string = 'meters') => {
    return runAnalysisMutation.mutateAsync({
      analysisType: 'buffer',
      layerIds,
      parameters: { distance, units }
    });
  };

  const runProximityAnalysis = async (layerIds: string[], maxDistance: number, units: string = 'meters') => {
    return runAnalysisMutation.mutateAsync({
      analysisType: 'proximity',
      layerIds,
      parameters: { maxDistance, units }
    });
  };

  const runOverlayAnalysis = async (layerIds: string[], operation: string = 'union') => {
    return runAnalysisMutation.mutateAsync({
      analysisType: 'overlay',
      layerIds,
      parameters: { operation }
    });
  };

  return {
    analysisResults: analysisResults || [],
    isLoading: isLoading || runAnalysisMutation.isPending || fetchRealGISData.isPending,
    runIntersectionAnalysis,
    runBufferAnalysis,
    runProximityAnalysis,
    runOverlayAnalysis,
    fetchRealGISData: fetchRealGISData.mutateAsync,
    runCustomAnalysis: runAnalysisMutation.mutateAsync,
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FEAAnalysis = Database['public']['Tables']['fea_analyses']['Row'];
type FEALoad = Database['public']['Tables']['fea_loads']['Row'];
type FEABoundaryCondition = Database['public']['Tables']['fea_boundary_conditions']['Row'];
type FEAResult = Database['public']['Tables']['fea_results']['Row'];

export interface CreateAnalysisData {
  upload_id?: string;
  element_id?: string;
  name: string;
  description?: string;
  analysis_type: Database['public']['Enums']['analysis_type'];
  input_parameters?: any;
}

export interface CreateLoadData {
  analysis_id: string;
  load_type: Database['public']['Enums']['load_type'];
  name: string;
  magnitude: number;
  direction: { x: number; y: number; z: number };
  location: { x: number; y: number; z: number };
  properties?: any;
}

export interface CreateBoundaryConditionData {
  analysis_id: string;
  condition_type: Database['public']['Enums']['boundary_condition_type'];
  name: string;
  location: any;
  constraints: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
  properties?: any;
}

export const useFEAAnalyses = (elementId?: string) => {
  const [analyses, setAnalyses] = useState<FEAAnalysis[]>([]);
  const [loads, setLoads] = useState<FEALoad[]>([]);
  const [boundaryConditions, setBoundaryConditions] = useState<FEABoundaryCondition[]>([]);
  const [results, setResults] = useState<FEAResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { user } = useAuth();

  // Helper function to safely access JSON data
  const getJsonValue = (json: any, path: string, defaultValue: any = null) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return json?.[path] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const fetchAnalyses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('fea_analyses')
        .select(`
          *,
          bim_elements (
            id,
            name,
            element_type
          )
        `)
        .order('created_at', { ascending: false });

      if (elementId) {
        query = query.eq('element_id', elementId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching FEA analyses:', error);
        toast.error('Failed to load FEA analyses');
        return;
      }

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching FEA analyses:', error);
      toast.error('Failed to load FEA analyses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async (analysisId: string) => {
    if (!user) return;

    try {
      // Fetch loads
      const { data: loadsData, error: loadsError } = await supabase
        .from('fea_loads')
        .select('*')
        .eq('analysis_id', analysisId);

      if (loadsError) throw loadsError;
      setLoads(loadsData || []);

      // Fetch boundary conditions
      const { data: bcData, error: bcError } = await supabase
        .from('fea_boundary_conditions')
        .select('*')
        .eq('analysis_id', analysisId);

      if (bcError) throw bcError;
      setBoundaryConditions(bcData || []);

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('fea_results')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);

    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast.error('Failed to load analysis data');
    }
  };

  const createAnalysis = async (analysisData: CreateAnalysisData): Promise<FEAAnalysis | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fea_analyses')
        .insert({
          ...analysisData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating FEA analysis:', error);
        toast.error('Failed to create FEA analysis');
        return null;
      }

      toast.success('FEA analysis created successfully');
      await fetchAnalyses();
      return data;
    } catch (error) {
      console.error('Error creating FEA analysis:', error);
      toast.error('Failed to create FEA analysis');
      return null;
    }
  };

  const createLoad = async (loadData: CreateLoadData): Promise<FEALoad | null> => {
    try {
      const { data, error } = await supabase
        .from('fea_loads')
        .insert(loadData)
        .select()
        .single();

      if (error) {
        console.error('Error creating load:', error);
        toast.error('Failed to create load');
        return null;
      }

      toast.success('Load created successfully');
      await fetchAnalysisData(loadData.analysis_id);
      return data;
    } catch (error) {
      console.error('Error creating load:', error);
      toast.error('Failed to create load');
      return null;
    }
  };

  const createBoundaryCondition = async (bcData: CreateBoundaryConditionData): Promise<FEABoundaryCondition | null> => {
    try {
      const { data, error } = await supabase
        .from('fea_boundary_conditions')
        .insert(bcData)
        .select()
        .single();

      if (error) {
        console.error('Error creating boundary condition:', error);
        toast.error('Failed to create boundary condition');
        return null;
      }

      toast.success('Boundary condition created successfully');
      await fetchAnalysisData(bcData.analysis_id);
      return data;
    } catch (error) {
      console.error('Error creating boundary condition:', error);
      toast.error('Failed to create boundary condition');
      return null;
    }
  };

  const runAnalysis = async (analysisId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setRunning(true);

      // Get analysis details
      const { data: analysis, error: analysisError } = await supabase
        .from('fea_analyses')
        .select(`
          *,
          bim_elements (
            id,
            name,
            geometry,
            materials (
              id,
              name,
              properties
            )
          )
        `)
        .eq('id', analysisId)
        .single();

      if (analysisError) throw analysisError;

      // Get loads and boundary conditions
      const [loadsResult, bcResult] = await Promise.all([
        supabase.from('fea_loads').select('*').eq('analysis_id', analysisId),
        supabase.from('fea_boundary_conditions').select('*').eq('analysis_id', analysisId)
      ]);

      if (loadsResult.error) throw loadsResult.error;
      if (bcResult.error) throw bcResult.error;

      // Call FEA Edge Function
      const response = await supabase.functions.invoke('fea-analysis', {
        body: {
          analysisId,
          geometry: analysis.bim_elements?.geometry || {},
          material: analysis.bim_elements?.materials || {},
          loads: loadsResult.data || [],
          boundaryConditions: bcResult.data || [],
          meshSettings: getJsonValue(analysis.input_parameters, 'mesh', {})
        }
      });

      if (response.error) {
        console.error('FEA analysis error:', response.error);
        toast.error('FEA analysis failed');
        return false;
      }

      toast.success('FEA analysis completed successfully');
      await fetchAnalyses();
      await fetchAnalysisData(analysisId);
      return true;

    } catch (error) {
      console.error('Error running FEA analysis:', error);
      toast.error('Failed to run FEA analysis');
      return false;
    } finally {
      setRunning(false);
    }
  };

  const deleteAnalysis = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fea_analyses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting FEA analysis:', error);
        toast.error('Failed to delete FEA analysis');
        return false;
      }

      toast.success('FEA analysis deleted successfully');
      await fetchAnalyses();
      return true;
    } catch (error) {
      console.error('Error deleting FEA analysis:', error);
      toast.error('Failed to delete FEA analysis');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user, elementId]);

  return {
    analyses,
    loads,
    boundaryConditions,
    results,
    loading,
    running,
    createAnalysis,
    createLoad,
    createBoundaryCondition,
    runAnalysis,
    deleteAnalysis,
    fetchAnalysisData,
    refreshAnalyses: fetchAnalyses,
  };
};

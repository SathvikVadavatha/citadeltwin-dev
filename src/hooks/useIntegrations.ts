
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { IntegrationConfig, DataImportJob, DataExportJob, APIKey } from '@/types/integrations';

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [importJobs, setImportJobs] = useState<DataImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<DataExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    }
  }, [user]);

  const fetchAPIKeys = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    }
  }, [user]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    try {
      const [importResponse, exportResponse] = await Promise.all([
        supabase
          .from('data_import_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('data_export_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (importResponse.error) throw importResponse.error;
      if (exportResponse.error) throw exportResponse.error;

      setImportJobs(importResponse.data || []);
      setExportJobs(exportResponse.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load import/export jobs');
    }
  }, [user]);

  const createIntegration = useCallback(async (config: Omit<IntegrationConfig, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          ...config,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchIntegrations();
      toast.success('Integration created successfully');
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error('Failed to create integration');
      return null;
    }
  }, [user, fetchIntegrations]);

  const updateIntegration = useCallback(async (id: string, updates: Partial<IntegrationConfig>) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchIntegrations();
      toast.success('Integration updated successfully');
    } catch (error) {
      console.error('Error updating integration:', error);
      toast.error('Failed to update integration');
    }
  }, [fetchIntegrations]);

  const deleteIntegration = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchIntegrations();
      toast.success('Integration deleted successfully');
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Failed to delete integration');
    }
  }, [fetchIntegrations]);

  const createAPIKey = useCallback(async (keyData: Omit<APIKey, 'id' | 'createdAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          ...keyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchAPIKeys();
      toast.success('API key created successfully');
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
      return null;
    }
  }, [user, fetchAPIKeys]);

  const startImportJob = useCallback(async (jobData: Omit<DataImportJob, 'id' | 'startedAt' | 'progress' | 'status'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('data_import_jobs')
        .insert({
          ...jobData,
          user_id: user.id,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchJobs();
      toast.success('Import job started');
      return data;
    } catch (error) {
      console.error('Error starting import job:', error);
      toast.error('Failed to start import job');
      return null;
    }
  }, [user, fetchJobs]);

  const startExportJob = useCallback(async (jobData: Omit<DataExportJob, 'id' | 'startedAt' | 'progress' | 'status'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('data_export_jobs')
        .insert({
          ...jobData,
          user_id: user.id,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchJobs();
      toast.success('Export job started');
      return data;
    } catch (error) {
      console.error('Error starting export job:', error);
      toast.error('Failed to start export job');
      return null;
    }
  }, [user, fetchJobs]);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchIntegrations(),
        fetchAPIKeys(),
        fetchJobs()
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchIntegrations, fetchAPIKeys, fetchJobs]);

  return {
    integrations,
    apiKeys,
    importJobs,
    exportJobs,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    createAPIKey,
    startImportJob,
    startExportJob,
    refetch: () => Promise.all([fetchIntegrations(), fetchAPIKeys(), fetchJobs()])
  };
};

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledReport, CreateScheduledReportRequest, UpdateScheduledReportRequest } from '@/types/scheduledReports';
import { toast } from 'sonner';

export const useScheduledReports = () => {
  const queryClient = useQueryClient();

  const { data: scheduledReports, isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScheduledReport[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (report: CreateScheduledReportRequest) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert([{
          ...report,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Scheduled report created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create scheduled report: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduledReportRequest }) => {
      const { data: result, error } = await supabase
        .from('scheduled_reports')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Scheduled report updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update scheduled report: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Scheduled report deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete scheduled report: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error) => {
      toast.error('Failed to update report status: ' + error.message);
    },
  });

  return {
    scheduledReports: scheduledReports || [],
    isLoading,
    createReport: createMutation.mutate,
    updateReport: updateMutation.mutate,
    deleteReport: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
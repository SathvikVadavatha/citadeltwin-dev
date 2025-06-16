
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface ComplianceCheck {
  id: string;
  upload_id?: string;
  user_id: string;
  check_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  violations_found?: number;
  rules_checked?: number;
  metadata?: any;
}

export const useComplianceChecks = (uploadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: complianceChecks = [], 
    isLoading: checksLoading,
    error: checksError,
    refetch: refetchChecks
  } = useQuery({
    queryKey: ['compliance-checks', uploadId],
    queryFn: async () => {
      let query = supabase
        .from('compliance_checks')
        .select('*')
        .order('started_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching compliance checks:', error);
        throw error;
      }

      return (data || []) as ComplianceCheck[];
    },
    enabled: !!user,
  });

  const runComplianceCheckMutation = useMutation({
    mutationFn: async (params: { 
      uploadId?: string; 
      checkType?: string; 
      jurisdictionId?: string;
    }) => {
      console.log('Running compliance check:', params);
      
      const { data, error } = await supabase.functions.invoke('multi-jurisdiction-compliance', {
        body: {
          action: 'run_compliance_check',
          uploadId: params.uploadId,
          checkType: params.checkType || 'comprehensive',
          jurisdictionId: params.jurisdictionId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Compliance check completed successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      toast.success('Compliance check completed successfully');
    },
    onError: (error: any) => {
      console.error('Compliance check error:', error);
      toast.error(`Compliance check failed: ${error.message}`);
    },
  });

  const runComplianceCheck = async (params: { 
    uploadId?: string; 
    checkType?: string; 
    jurisdictionId?: string;
  }) => {
    if (!user) {
      toast.error('Please sign in to run compliance check');
      return false;
    }

    try {
      await runComplianceCheckMutation.mutateAsync(params);
      return true;
    } catch (error) {
      console.error('Error running compliance check:', error);
      return false;
    }
  };

  return {
    complianceChecks,
    checksLoading,
    checksError,
    refreshChecks: refetchChecks,
    runComplianceCheck,
    isRunningCheck: runComplianceCheckMutation.isPending,
  };
};

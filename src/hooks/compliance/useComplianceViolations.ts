
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface ComplianceViolation {
  id: string;
  upload_id?: string;
  rule_id: string;
  violation_type: string;
  severity: string;
  description: string;
  current_value?: any;
  required_value?: any;
  location?: any;
  remediation_suggestions?: string[];
  status: string;
  detected_at: string;
  resolved_at?: string;
  element_id?: string;
  jurisdiction_specific?: boolean;
  compliance_rules?: {
    title: string;
    jurisdiction: string;
    code_section: string;
    description: string;
  };
}

export const useComplianceViolations = (uploadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: violations = [], 
    isLoading: violationsLoading,
    error: violationsError,
    refetch: refetchViolations
  } = useQuery({
    queryKey: ['compliance-violations', uploadId],
    queryFn: async () => {
      let query = supabase
        .from('compliance_violations')
        .select(`
          *,
          compliance_rules (
            title,
            jurisdiction,
            code_section,
            description
          )
        `)
        .order('detected_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching compliance violations:', error);
        throw error;
      }

      return (data || []) as ComplianceViolation[];
    },
    enabled: !!user,
  });

  const updateViolationStatusMutation = useMutation({
    mutationFn: async ({ violationId, status }: { violationId: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('compliance_violations')
        .update(updateData)
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      toast.success('Violation status updated successfully');
      refetchViolations();
    },
    onError: (error: any) => {
      console.error('Error updating violation status:', error);
      toast.error('Failed to update violation status');
    },
  });

  const updateViolationStatus = async (params: { violationId: string; status: string }) => {
    if (!user) {
      toast.error('Please sign in to update violation status');
      return false;
    }

    try {
      await updateViolationStatusMutation.mutateAsync(params);
      return true;
    } catch (error) {
      console.error('Error updating violation status:', error);
      return false;
    }
  };

  return {
    violations,
    violationsLoading,
    violationsError,
    refreshViolations: refetchViolations,
    updateViolationStatus,
    isUpdatingStatus: updateViolationStatusMutation.isPending,
  };
};

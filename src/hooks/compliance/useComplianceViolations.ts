
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

export interface ComplianceViolation {
  id: string;
  upload_id?: string;
  rule_id: string;
  element_id?: string;
  violation_type: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  description: string;
  current_value?: any;
  required_value?: any;
  location?: any;
  remediation_suggestions?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at?: string;
}

export const useComplianceViolations = (uploadId?: string) => {
  const queryClient = useQueryClient();
  const { withErrorHandling } = useErrorHandler();

  const { 
    data: violations = [], 
    isLoading: violationsLoading,
    error: violationsError
  } = useQuery({
    queryKey: ['compliance-violations', uploadId],
    queryFn: async () => {
      return withErrorHandling(async () => {
        let query = supabase
          .from('compliance_violations')
          .select('*')
          .order('severity', { ascending: false })
          .order('detected_at', { ascending: false });

        if (uploadId) {
          query = query.eq('upload_id', uploadId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ComplianceViolation[];
      }, 'Fetching compliance violations') ?? [];
    },
    enabled: !!uploadId,
  });

  const updateViolationStatusMutation = useMutation({
    mutationFn: async ({ violationId, status }: { violationId: string; status: string }) => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase
          .from('compliance_violations')
          .update({ status })
          .eq('id', violationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }, 'Updating violation status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      toast.success('Violation status updated');
    },
  });

  return {
    violations,
    violationsLoading,
    violationsError,
    updateViolationStatus: updateViolationStatusMutation.mutate,
    isUpdatingViolation: updateViolationStatusMutation.isPending,
  };
};

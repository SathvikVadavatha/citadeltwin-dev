
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

export interface ComplianceCheck {
  id: string;
  upload_id?: string;
  user_id: string;
  check_type: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  rules_checked?: number;
  violations_found?: number;
  metadata?: any;
}

export const useComplianceChecks = (uploadId?: string) => {
  const queryClient = useQueryClient();
  const { withErrorHandling } = useErrorHandler();

  const { 
    data: complianceChecks = [], 
    isLoading: checksLoading,
    error: checksError
  } = useQuery({
    queryKey: ['compliance-checks', uploadId],
    queryFn: async () => {
      return withErrorHandling(async () => {
        let query = supabase
          .from('compliance_checks')
          .select('*')
          .order('started_at', { ascending: false });

        if (uploadId) {
          query = query.eq('upload_id', uploadId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ComplianceCheck[];
      }, 'Fetching compliance checks') ?? [];
    },
    enabled: !!uploadId,
  });

  const runComplianceCheckMutation = useMutation({
    mutationFn: async ({ uploadId, checkType = 'standard', jurisdictionId }: { 
      uploadId: string; 
      checkType?: string;
      jurisdictionId?: string;
    }) => {
      return withErrorHandling(async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        const functionName = checkType === 'multi_jurisdiction' 
          ? 'multi-jurisdiction-compliance' 
          : 'compliance-check';

        const payload: any = { 
          upload_id: uploadId,
          check_type: checkType,
          user_id: user.user.id
        };

        if (jurisdictionId) {
          payload.jurisdiction_id = jurisdictionId;
        }

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });

        if (error) throw error;
        return data;
      }, 'Running compliance check');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
      toast.success('Compliance check completed successfully');
    },
  });

  return {
    complianceChecks,
    checksLoading,
    checksError,
    runComplianceCheck: runComplianceCheckMutation.mutate,
    isRunningCheck: runComplianceCheckMutation.isPending,
  };
};

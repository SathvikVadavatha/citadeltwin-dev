
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

export interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  code_section: string;
  jurisdiction: string;
  rule_type: string;
  rule_logic: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export const useCompliance = () => {
  const queryClient = useQueryClient();
  const { withErrorHandling } = useErrorHandler();

  // Fetch compliance rules
  const { 
    data: complianceRules = [], 
    isLoading: rulesLoading 
  } = useQuery({
    queryKey: ['compliance-rules'],
    queryFn: async () => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase
          .from('compliance_rules')
          .select('*')
          .eq('is_active', true)
          .order('jurisdiction', { ascending: true })
          .order('rule_type', { ascending: true });

        if (error) throw error;
        return data as ComplianceRule[];
      }, 'Fetching compliance rules') ?? [];
    },
  });

  // Fetch violations for a specific upload
  const fetchViolations = (uploadId?: string) => {
    return useQuery({
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
  };

  // Fetch compliance checks for a specific upload
  const fetchComplianceChecks = (uploadId?: string) => {
    return useQuery({
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
  };

  // Run compliance check mutation
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
    onError: (error) => {
      console.error('Compliance check failed:', error);
      toast.error('Compliance check failed');
    },
  });

  const runComplianceCheck = runComplianceCheckMutation.mutate;
  const isRunningCheck = runComplianceCheckMutation.isPending;

  return {
    complianceRules,
    rulesLoading,
    fetchViolations,
    fetchComplianceChecks,
    runComplianceCheck,
    isRunningCheck,
  };
};


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export type ComplianceRule = {
  id: string;
  jurisdiction: string;
  code_section: string;
  rule_type: 'height_limit' | 'area_limit' | 'occupancy' | 'egress' | 'fire_rating' | 'structural';
  title: string;
  description: string;
  rule_logic: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ComplianceViolation = {
  id: string;
  upload_id: string | null;
  element_id: string | null;
  rule_id: string;
  violation_type: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  description: string;
  location: any;
  current_value: any;
  required_value: any;
  remediation_suggestions: string[];
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  detected_at: string;
  resolved_at: string | null;
};

export type ComplianceCheck = {
  id: string;
  upload_id: string | null;
  check_type: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  rules_checked: number;
  violations_found: number;
  started_at: string;
  completed_at: string | null;
  user_id: string;
  metadata: any;
};

export const useCompliance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch compliance rules
  const { 
    data: complianceRules = [], 
    isLoading: rulesLoading 
  } = useQuery({
    queryKey: ['compliance-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true)
        .order('jurisdiction', { ascending: true });

      if (error) throw error;
      return data as ComplianceRule[];
    },
  });

  // Fetch compliance violations
  const fetchViolations = (uploadId?: string) => {
    return useQuery({
      queryKey: ['compliance-violations', uploadId],
      queryFn: async () => {
        let query = supabase
          .from('compliance_violations')
          .select(`
            *,
            compliance_rules (
              jurisdiction,
              code_section,
              title
            ),
            bim_elements (
              name,
              element_type
            )
          `);

        if (uploadId) {
          query = query.eq('upload_id', uploadId);
        }

        const { data, error } = await query
          .order('severity', { ascending: false })
          .order('detected_at', { ascending: false });

        if (error) throw error;
        return data as ComplianceViolation[];
      },
      enabled: !!uploadId,
    });
  };

  // Fetch compliance checks
  const fetchComplianceChecks = (uploadId?: string) => {
    return useQuery({
      queryKey: ['compliance-checks', uploadId],
      queryFn: async () => {
        let query = supabase
          .from('compliance_checks')
          .select('*');

        if (uploadId) {
          query = query.eq('upload_id', uploadId);
        }

        const { data, error } = await query
          .order('started_at', { ascending: false });

        if (error) throw error;
        return data as ComplianceCheck[];
      },
      enabled: !!uploadId,
    });
  };

  // Run compliance check mutation
  const runComplianceCheckMutation = useMutation({
    mutationFn: async ({ uploadId, checkType = 'manual' }: { uploadId: string; checkType?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('compliance-check', {
        body: { 
          upload_id: uploadId,
          check_type: checkType,
          user_id: user.id
        }
      });

      if (error) throw error;
      return data;
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

  // Update violation status mutation
  const updateViolationStatusMutation = useMutation({
    mutationFn: async ({ violationId, status }: { violationId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('compliance_violations')
        .update(updates)
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-violations'] });
      toast.success('Violation status updated');
    },
  });

  return {
    complianceRules,
    rulesLoading,
    fetchViolations,
    fetchComplianceChecks,
    runComplianceCheck: runComplianceCheckMutation.mutate,
    isRunningCheck: runComplianceCheckMutation.isPending,
    updateViolationStatus: updateViolationStatusMutation.mutate,
  };
};

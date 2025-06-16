
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

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
}

export const useComplianceViolations = (uploadId?: string) => {
  const { user } = useAuth();

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

  return {
    violations,
    violationsLoading,
    violationsError,
    refreshViolations: refetchViolations,
  };
};

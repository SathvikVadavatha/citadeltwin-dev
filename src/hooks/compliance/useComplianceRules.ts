
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface ComplianceRule {
  id: string;
  title: string;
  jurisdiction: string;
  code_section: string;
  rule_type: string;
  description: string;
  rule_logic: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useComplianceRules = (jurisdiction?: string) => {
  const { user } = useAuth();

  const { 
    data: complianceRules = [], 
    isLoading: rulesLoading,
    error: rulesError,
    refetch: refetchRules
  } = useQuery({
    queryKey: ['compliance-rules', jurisdiction],
    queryFn: async () => {
      let query = supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true)
        .order('jurisdiction', { ascending: true })
        .order('code_section', { ascending: true });

      if (jurisdiction) {
        query = query.eq('jurisdiction', jurisdiction);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching compliance rules:', error);
        throw error;
      }

      return (data || []) as ComplianceRule[];
    },
    enabled: !!user,
  });

  return {
    complianceRules,
    rulesLoading,
    rulesError,
    refreshRules: refetchRules,
  };
};

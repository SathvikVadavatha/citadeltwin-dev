
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';

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

export const useComplianceRules = () => {
  const { withErrorHandling } = useErrorHandler();

  const { 
    data: complianceRules = [], 
    isLoading: rulesLoading,
    error: rulesError 
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

  return {
    complianceRules,
    rulesLoading,
    rulesError,
  };
};

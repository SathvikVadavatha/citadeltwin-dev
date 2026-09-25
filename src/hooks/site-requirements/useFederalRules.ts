import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FederalRule {
  id: string;
  category: string;
  applies_to: 'commercial' | 'residential' | 'both';
  requirement: string;
  value: string;
  unit: string | null;
  comparator: string | null;
  note: string | null;
  citation: string;
  source_title: string;
  source_url: string;
  verified_at: string;
  display_order: number;
}

export const useFederalRules = (propertyType: 'residential' | 'commercial' | null) => {
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['req-federal-rules', propertyType],
    queryFn: async () => {
      const query = supabase
        .from('req_federal_rules')
        .select('*')
        .order('display_order', { ascending: true });

      const { data, error } = propertyType
        ? await query.in('applies_to', [propertyType, 'both'])
        : await query;

      if (error) throw new Error(error.message);
      return (data || []) as FederalRule[];
    },
    enabled: !!propertyType,
    retry: false,
  });

  return { rules, rulesLoading: isLoading, rulesError: (error as Error | null) ?? null };
};

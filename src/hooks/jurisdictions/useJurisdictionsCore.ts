
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';

export interface Jurisdiction {
  id: string;
  name: string;
  jurisdiction_type: 'state' | 'county' | 'city' | 'federal';
  state_code: string;
  county_name?: string;
  city_name?: string;
  parent_jurisdiction_id?: string;
  is_active: boolean;
  contact_info?: any;
  website_url?: string;
  code_adoption_date?: string;
  last_updated: string;
  created_at: string;
}

export const useJurisdictionsCore = () => {
  const { withErrorHandling } = useErrorHandler();

  const { 
    data: jurisdictions = [], 
    isLoading: jurisdictionsLoading,
    error: jurisdictionsError 
  } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase.functions.invoke('exec-sql', {
          body: {
            sql: `
              SELECT * FROM public.jurisdictions 
              WHERE is_active = true 
              ORDER BY 
                CASE jurisdiction_type 
                  WHEN 'state' THEN 1 
                  WHEN 'county' THEN 2 
                  WHEN 'city' THEN 3 
                  ELSE 4 
                END,
                CASE state_code 
                  WHEN 'OH' THEN 1 
                  WHEN 'FL' THEN 2 
                  WHEN 'NY' THEN 3 
                  WHEN 'CA' THEN 4 
                  WHEN 'TX' THEN 5 
                  ELSE 6 
                END,
                name ASC
            `
          }
        });

        if (error) throw error;
        return (data?.data || []) as Jurisdiction[];
      }, 'Fetching jurisdictions') ?? [];
    },
  });

  return {
    jurisdictions,
    jurisdictionsLoading,
    jurisdictionsError,
  };
};

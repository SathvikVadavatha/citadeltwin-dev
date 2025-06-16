
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface Jurisdiction {
  id: string;
  name: string;
  jurisdiction_type: string;
  state_code: string;
  city_name?: string;
  county_name?: string;
  website_url?: string;
  contact_info?: any;
  is_active: boolean;
  parent_jurisdiction_id?: string;
  code_adoption_date?: string;
  created_at: string;
  last_updated: string;
}

export const useJurisdictionsCore = () => {
  const { user } = useAuth();

  const { 
    data: jurisdictions = [], 
    isLoading: jurisdictionsLoading,
    error: jurisdictionsError,
    refetch: refetchJurisdictions
  } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdictions')
        .select('*')
        .eq('is_active', true)
        .order('state_code', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching jurisdictions:', error);
        throw error;
      }

      return (data || []) as Jurisdiction[];
    },
    enabled: !!user,
  });

  return {
    jurisdictions,
    jurisdictionsLoading,
    jurisdictionsError,
    refreshJurisdictions: refetchJurisdictions,
  };
};


import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useJurisdictionSearch = () => {
  const { user } = useAuth();

  const searchJurisdictionsByLocationMutation = useMutation({
    mutationFn: async ({ city, state, county }: { city?: string; state?: string; county?: string }) => {
      console.log('Searching jurisdictions by location:', { city, state, county });

      let query = supabase
        .from('jurisdictions')
        .select('*')
        .eq('is_active', true);

      if (state) {
        query = query.eq('state_code', state.toUpperCase());
      }

      if (city) {
        query = query.ilike('city_name', `%${city}%`);
      }

      if (county) {
        query = query.ilike('county_name', `%${county}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('Error searching jurisdictions:', error);
        throw error;
      }

      return data || [];
    },
    onError: (error: any) => {
      console.error('Jurisdiction search error:', error);
      toast.error(`Failed to search jurisdictions: ${error.message}`);
    },
  });

  const searchJurisdictionsByLocation = async (params: { city?: string; state?: string; county?: string }) => {
    if (!user) {
      toast.error('Please sign in to search jurisdictions');
      return [];
    }

    try {
      return await searchJurisdictionsByLocationMutation.mutateAsync(params);
    } catch (error) {
      console.error('Error searching jurisdictions:', error);
      return [];
    }
  };

  return {
    searchJurisdictionsByLocation,
    isSearching: searchJurisdictionsByLocationMutation.isPending,
  };
};

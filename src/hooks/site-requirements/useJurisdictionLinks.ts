import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JurisdictionLink {
  id: string;
  state_code: string;
  link_type: string;
  label: string;
  url: string;
  note: string | null;
  display_order: number;
}

export const useJurisdictionLinks = (stateCode: string | null) => {
  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ['req-jurisdiction-links', stateCode],
    queryFn: async () => {
      const codes = stateCode ? [stateCode, 'US'] : ['US'];
      const { data, error } = await supabase
        .from('req_jurisdiction_links')
        .select('*')
        .in('state_code', codes)
        .order('display_order', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as JurisdictionLink[];
    },
    retry: false,
  });

  const stateLinks = links.filter((l) => l.state_code === stateCode);
  const nationalLinks = links.filter((l) => l.state_code === 'US');

  return { stateLinks, nationalLinks, linksLoading: isLoading, linksError: (error as Error | null) ?? null };
};

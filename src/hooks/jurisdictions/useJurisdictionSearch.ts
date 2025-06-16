
import { useErrorHandler } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';
import { Jurisdiction } from './useJurisdictionsCore';

export const useJurisdictionSearch = () => {
  const { withErrorHandling } = useErrorHandler();

  const searchJurisdictionsByLocation = async (
    state: string, 
    county?: string, 
    city?: string
  ): Promise<(Jurisdiction & { comprehensive_coverage: boolean })[]> => {
    return withErrorHandling(async () => {
      let sql = `
        SELECT j.*, 
               CASE 
                 WHEN j.state_code IN ('OH', 'FL') THEN true 
                 ELSE false 
               END as comprehensive_coverage
        FROM public.jurisdictions j
        WHERE j.state_code = '${state.toUpperCase()}' 
        AND j.is_active = true
      `;

      if (county) {
        sql += ` AND (j.county_name ILIKE '%${county}%' OR j.name ILIKE '%${county}%')`;
      }
      if (city) {
        sql += ` AND (j.city_name ILIKE '%${city}%' OR j.name ILIKE '%${city}%')`;
      }

      sql += ` ORDER BY 
        CASE 
          WHEN j.state_code IN ('OH', 'FL') THEN 1 
          ELSE 2 
        END,
        j.jurisdiction_type,
        j.name`;

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: { sql: sql }
      });

      if (error) throw error;
      return (data?.data || []) as (Jurisdiction & { comprehensive_coverage: boolean })[];
    }, 'Searching jurisdictions by location') ?? [];
  };

  return {
    searchJurisdictionsByLocation,
  };
};

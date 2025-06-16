
import { useErrorHandler } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';

export interface JurisdictionCode {
  id: string;
  jurisdiction_id: string;
  code_type: string;
  code_name: string;
  code_version: string;
  adoption_date: string;
  effective_date: string;
  amendments?: any;
  is_current: boolean;
  superseded_by?: string;
}

export const useJurisdictionDetails = () => {
  const { withErrorHandling } = useErrorHandler();

  const getApplicableCodes = async (jurisdictionId: string) => {
    return withErrorHandling(async () => {
      const sql = `
        SELECT 
          jc.*,
          j.name as jurisdiction_name,
          j.state_code,
          j.jurisdiction_type,
          CASE 
            WHEN j.state_code = 'OH' THEN jsonb_build_object(
              'climate_zone', '5A',
              'snow_load', 30,
              'frost_depth', 42,
              'wind_speed', 90,
              'energy_code', 'IECC 2021'
            )
            WHEN j.state_code = 'FL' THEN jsonb_build_object(
              'climate_zone', '1A',
              'hurricane_zone', true,
              'wind_speed_inland', 130,
              'wind_speed_coastal', 150,
              'wind_speed_hvhz', 175,
              'flood_resistance', true,
              'termite_protection', true
            )
            WHEN j.state_code = 'CA' THEN jsonb_build_object(
              'seismic_zone', 4,
              'title24_compliance', true,
              'energy_efficiency', 'enhanced'
            )
            WHEN j.state_code = 'TX' THEN jsonb_build_object(
              'wind_speed', 130,
              'flood_zones', true
            )
            ELSE jsonb_build_object('standard', true)
          END as climate_requirements
        FROM public.jurisdiction_codes jc
        JOIN public.jurisdictions j ON jc.jurisdiction_id = j.id
        WHERE jc.jurisdiction_id = '${jurisdictionId}'
        AND jc.is_current = true
        ORDER BY jc.code_type
      `;

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: { sql: sql }
      });

      if (error) throw error;
      return data?.data || [];
    }, 'Fetching applicable codes');
  };

  const getComplianceRequirements = async (stateCode: string) => {
    return withErrorHandling(async () => {
      const sql = `
        SELECT 
          cr.*,
          j.name as jurisdiction_name,
          j.state_code
        FROM public.compliance_rules cr
        JOIN public.jurisdictions j ON (
          cr.jurisdiction = j.state_code OR 
          cr.jurisdiction = j.name OR 
          cr.jurisdiction = 'Universal'
        )
        WHERE j.state_code = '${stateCode.toUpperCase()}'
        AND cr.is_active = true
        ORDER BY cr.rule_type, cr.code_section
      `;

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: { sql: sql }
      });

      if (error) throw error;
      return data?.data || [];
    }, 'Fetching compliance requirements');
  };

  return {
    getApplicableCodes,
    getComplianceRequirements,
  };
};

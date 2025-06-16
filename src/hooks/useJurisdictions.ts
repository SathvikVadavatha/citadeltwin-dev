
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/utils/errorHandling';
import { toast } from 'sonner';

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

export const useJurisdictions = () => {
  const queryClient = useQueryClient();
  const { withErrorHandling } = useErrorHandler();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);

  // Fetch all jurisdictions using the edge function
  const { 
    data: jurisdictions = [], 
    isLoading: jurisdictionsLoading 
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

  // Fetch jurisdiction codes using the edge function
  const fetchJurisdictionCodes = (jurisdictionId?: string) => {
    return useQuery({
      queryKey: ['jurisdiction-codes', jurisdictionId],
      queryFn: async () => {
        return withErrorHandling(async () => {
          let sql = `
            SELECT jc.*, j.name as jurisdiction_name, j.state_code
            FROM public.jurisdiction_codes jc
            JOIN public.jurisdictions j ON jc.jurisdiction_id = j.id
            WHERE jc.is_current = true
          `;
          
          if (jurisdictionId) {
            sql += ` AND jc.jurisdiction_id = '${jurisdictionId}'`;
          }
          
          sql += ' ORDER BY j.state_code, jc.code_type ASC';

          const { data, error } = await supabase.functions.invoke('exec-sql', {
            body: { sql: sql }
          });

          if (error) throw error;
          return (data?.data || []) as (JurisdictionCode & { jurisdiction_name: string; state_code: string })[];
        }, 'Fetching jurisdiction codes') ?? [];
      },
      enabled: !!jurisdictionId,
    });
  };

  // Get hierarchical jurisdiction data (state -> county -> city)
  const getJurisdictionHierarchy = async (jurisdictionId: string) => {
    return withErrorHandling(async () => {
      const sql = `
        WITH RECURSIVE jurisdiction_hierarchy AS (
          -- Base case: start with the specified jurisdiction
          SELECT id, name, jurisdiction_type, state_code, county_name, city_name, 
                 parent_jurisdiction_id, 1 as level
          FROM public.jurisdictions 
          WHERE id = '${jurisdictionId}'
          
          UNION ALL
          
          -- Recursive case: get parent jurisdictions
          SELECT j.id, j.name, j.jurisdiction_type, j.state_code, j.county_name, j.city_name,
                 j.parent_jurisdiction_id, jh.level + 1
          FROM public.jurisdictions j
          INNER JOIN jurisdiction_hierarchy jh ON j.id = jh.parent_jurisdiction_id
        )
        SELECT * FROM jurisdiction_hierarchy
        ORDER BY level DESC
      `;

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: { sql: sql }
      });

      if (error) throw error;
      return data?.data || [];
    }, 'Fetching jurisdiction hierarchy');
  };

  // Search jurisdictions by location using enhanced search
  const searchJurisdictionsByLocation = async (state: string, county?: string, city?: string) => {
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
    }, 'Searching jurisdictions by location');
  };

  // Get applicable codes for a jurisdiction with enhanced details
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

  // Get comprehensive compliance requirements for a jurisdiction
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
    jurisdictions,
    jurisdictionsLoading,
    selectedJurisdiction,
    setSelectedJurisdiction,
    fetchJurisdictionCodes,
    getJurisdictionHierarchy,
    searchJurisdictionsByLocation,
    getApplicableCodes,
    getComplianceRequirements,
  };
};

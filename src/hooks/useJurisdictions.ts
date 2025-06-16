
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
              ORDER BY jurisdiction_type ASC, name ASC
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
            SELECT * FROM public.jurisdiction_codes 
            WHERE is_current = true
          `;
          
          if (jurisdictionId) {
            sql += ` AND jurisdiction_id = '${jurisdictionId}'`;
          }
          
          sql += ' ORDER BY code_type ASC';

          const { data, error } = await supabase.functions.invoke('exec-sql', {
            body: { sql: sql }
          });

          if (error) throw error;
          return (data?.data || []) as JurisdictionCode[];
        }, 'Fetching jurisdiction codes') ?? [];
      },
      enabled: !!jurisdictionId,
    });
  };

  // Get hierarchical jurisdiction data (state -> county -> city)
  const getJurisdictionHierarchy = async (jurisdictionId: string) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase.functions.invoke('jurisdiction-hierarchy', {
        body: { jurisdiction_id: jurisdictionId }
      });

      if (error) throw error;
      return data;
    }, 'Fetching jurisdiction hierarchy');
  };

  // Search jurisdictions by location using the edge function
  const searchJurisdictionsByLocation = async (state: string, county?: string, city?: string) => {
    return withErrorHandling(async () => {
      let sql = `
        SELECT * FROM public.jurisdictions 
        WHERE state_code = '${state.toUpperCase()}' 
        AND is_active = true
      `;

      if (county) {
        sql += ` AND county_name ILIKE '%${county}%'`;
      }
      if (city) {
        sql += ` AND city_name ILIKE '%${city}%'`;
      }

      sql += ' ORDER BY jurisdiction_type';

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: { sql: sql }
      });

      if (error) throw error;
      return (data?.data || []) as Jurisdiction[];
    }, 'Searching jurisdictions by location');
  };

  // Get applicable codes for a jurisdiction
  const getApplicableCodes = async (jurisdictionId: string) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase.functions.invoke('get-applicable-codes', {
        body: { jurisdiction_id: jurisdictionId }
      });

      if (error) throw error;
      return data;
    }, 'Fetching applicable codes');
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
  };
};

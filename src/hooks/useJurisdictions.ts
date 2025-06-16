
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

  // Fetch all jurisdictions
  const { 
    data: jurisdictions = [], 
    isLoading: jurisdictionsLoading 
  } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      return withErrorHandling(async () => {
        const { data, error } = await supabase
          .from('jurisdictions')
          .select('*')
          .eq('is_active', true)
          .order('jurisdiction_type', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        return data as Jurisdiction[];
      }, 'Fetching jurisdictions') ?? [];
    },
  });

  // Fetch jurisdiction codes
  const fetchJurisdictionCodes = (jurisdictionId?: string) => {
    return useQuery({
      queryKey: ['jurisdiction-codes', jurisdictionId],
      queryFn: async () => {
        return withErrorHandling(async () => {
          let query = supabase
            .from('jurisdiction_codes')
            .select('*');

          if (jurisdictionId) {
            query = query.eq('jurisdiction_id', jurisdictionId);
          }

          const { data, error } = await query
            .eq('is_current', true)
            .order('code_type', { ascending: true });

          if (error) throw error;
          return data as JurisdictionCode[];
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

  // Search jurisdictions by location
  const searchJurisdictionsByLocation = async (state: string, county?: string, city?: string) => {
    return withErrorHandling(async () => {
      let query = supabase
        .from('jurisdictions')
        .select('*')
        .eq('state_code', state)
        .eq('is_active', true);

      if (county) {
        query = query.eq('county_name', county);
      }
      if (city) {
        query = query.eq('city_name', city);
      }

      const { data, error } = await query.order('jurisdiction_type');
      if (error) throw error;
      return data as Jurisdiction[];
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

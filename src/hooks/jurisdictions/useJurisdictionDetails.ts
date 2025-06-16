
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface JurisdictionCode {
  id: string;
  jurisdiction_id: string;
  code_type: string;
  code_name: string;
  code_version: string;
  effective_date: string;
  adoption_date: string;
  is_current: boolean;
  amendments?: any;
  superseded_by?: string;
  created_at: string;
}

export const useJurisdictionDetails = () => {
  const { user } = useAuth();

  const getApplicableCodesMutation = useMutation({
    mutationFn: async (jurisdictionId: string) => {
      console.log('Getting applicable codes for jurisdiction:', jurisdictionId);

      const { data, error } = await supabase
        .from('jurisdiction_codes')
        .select('*')
        .eq('jurisdiction_id', jurisdictionId)
        .eq('is_current', true)
        .order('code_type', { ascending: true });

      if (error) {
        console.error('Error fetching jurisdiction codes:', error);
        throw error;
      }

      return (data || []) as JurisdictionCode[];
    },
    onError: (error: any) => {
      console.error('Get applicable codes error:', error);
      toast.error(`Failed to get applicable codes: ${error.message}`);
    },
  });

  const getComplianceRequirementsMutation = useMutation({
    mutationFn: async ({ jurisdictionId, buildingType }: { jurisdictionId: string; buildingType?: string }) => {
      console.log('Getting compliance requirements for:', { jurisdictionId, buildingType });

      // Get jurisdiction codes
      const { data: codes, error: codesError } = await supabase
        .from('jurisdiction_codes')
        .select('*')
        .eq('jurisdiction_id', jurisdictionId)
        .eq('is_current', true);

      if (codesError) throw codesError;

      // Get compliance rules for this jurisdiction
      const { data: jurisdiction, error: jurisdictionError } = await supabase
        .from('jurisdictions')
        .select('name')
        .eq('id', jurisdictionId)
        .single();

      if (jurisdictionError) throw jurisdictionError;

      let rulesQuery = supabase
        .from('compliance_rules')
        .select('*')
        .eq('jurisdiction', jurisdiction.name)
        .eq('is_active', true);

      if (buildingType) {
        rulesQuery = rulesQuery.contains('rule_logic', { building_type: buildingType });
      }

      const { data: rules, error: rulesError } = await rulesQuery;

      if (rulesError) throw rulesError;

      return {
        codes: codes || [],
        rules: rules || [],
        jurisdiction_name: jurisdiction.name
      };
    },
    onError: (error: any) => {
      console.error('Get compliance requirements error:', error);
      toast.error(`Failed to get compliance requirements: ${error.message}`);
    },
  });

  const getApplicableCodes = async (jurisdictionId: string) => {
    if (!user) {
      toast.error('Please sign in to get applicable codes');
      return [];
    }

    try {
      return await getApplicableCodesMutation.mutateAsync(jurisdictionId);
    } catch (error) {
      console.error('Error getting applicable codes:', error);
      return [];
    }
  };

  const getComplianceRequirements = async (params: { jurisdictionId: string; buildingType?: string }) => {
    if (!user) {
      toast.error('Please sign in to get compliance requirements');
      return { codes: [], rules: [], jurisdiction_name: '' };
    }

    try {
      return await getComplianceRequirementsMutation.mutateAsync(params);
    } catch (error) {
      console.error('Error getting compliance requirements:', error);
      return { codes: [], rules: [], jurisdiction_name: '' };
    }
  };

  return {
    getApplicableCodes,
    getComplianceRequirements,
    isGettingCodes: getApplicableCodesMutation.isPending,
    isGettingRequirements: getComplianceRequirementsMutation.isPending,
  };
};

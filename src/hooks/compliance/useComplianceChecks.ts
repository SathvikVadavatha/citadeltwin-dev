
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface ComplianceCheck {
  id: string;
  upload_id?: string;
  user_id: string;
  check_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  violations_found?: number;
  rules_checked?: number;
  metadata?: any;
}

export const useComplianceChecks = (uploadId?: string) => {
  const { user } = useAuth();

  const { 
    data: complianceChecks = [], 
    isLoading: checksLoading,
    error: checksError,
    refetch: refetchChecks
  } = useQuery({
    queryKey: ['compliance-checks', uploadId],
    queryFn: async () => {
      let query = supabase
        .from('compliance_checks')
        .select('*')
        .order('started_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching compliance checks:', error);
        throw error;
      }

      return (data || []) as ComplianceCheck[];
    },
    enabled: !!user,
  });

  return {
    complianceChecks,
    checksLoading,
    checksError,
    refreshChecks: refetchChecks,
  };
};

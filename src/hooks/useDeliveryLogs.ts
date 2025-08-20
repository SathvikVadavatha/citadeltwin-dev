import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledReportDelivery } from '@/types/scheduledReports';

export const useDeliveryLogs = (reportId?: string) => {
  const { data: deliveryLogs, isLoading } = useQuery({
    queryKey: ['delivery-logs', reportId],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_report_deliveries')
        .select(`
          *,
          scheduled_reports!inner(name, report_type)
        `)
        .order('created_at', { ascending: false });

      if (reportId) {
        query = query.eq('scheduled_report_id', reportId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (ScheduledReportDelivery & {
        scheduled_reports: {
          name: string;
          report_type: string;
        };
      })[];
    },
    enabled: true,
  });

  return {
    deliveryLogs: deliveryLogs || [],
    isLoading,
  };
};
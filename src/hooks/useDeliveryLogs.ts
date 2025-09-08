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

  const downloadReport = async (reportData: any, fileName: string, format: string) => {
    try {
      // Generate report content from stored data
      let content = '';
      let mimeType = '';
      
      if (format === 'csv') {
        content = reportData;
        mimeType = 'text/csv';
      } else if (format === 'json') {
        content = reportData;
        mimeType = 'application/json';
      } else {
        content = reportData;
        mimeType = 'text/html';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  return {
    deliveryLogs: deliveryLogs || [],
    isLoading,
    downloadReport,
  };
};
export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: 'fea_analysis' | 'compliance' | 'activity' | 'performance';
  frequency: 'daily' | 'weekly' | 'monthly';
  delivery_format: 'pdf' | 'csv' | 'json';
  recipients: string[];
  filters: Record<string, any>;
  schedule_config: {
    hour: number;
    minute: number;
    day_of_week?: number; // 1 = Monday, 7 = Sunday
    day_of_month?: number; // 1-31
    timezone: string;
  };
  is_active: boolean;
  next_run_at?: string;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReportDelivery {
  id: string;
  scheduled_report_id: string;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  delivered_at?: string;
  error_message?: string;
  file_path?: string;
  file_size?: number;
  recipients_sent: string[];
  execution_time_ms?: number;
  created_at: string;
}

export interface CreateScheduledReportRequest {
  name: string;
  report_type: ScheduledReport['report_type'];
  frequency: ScheduledReport['frequency'];
  delivery_format: ScheduledReport['delivery_format'];
  recipients: string[];
  filters: Record<string, any>;
  schedule_config: ScheduledReport['schedule_config'];
}

export interface UpdateScheduledReportRequest extends Partial<CreateScheduledReportRequest> {
  is_active?: boolean;
}
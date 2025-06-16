
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  AuditLog, 
  SecurityEvent, 
  BackupJob, 
  ComplianceReport, 
  UserSession, 
  EncryptionKey, 
  IPWhitelist,
  SecuritySettings
} from '@/types/security';

export const useSecurity = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Audit Logs
  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AuditLog[];
    }
  });

  // Security Events
  const { data: securityEvents, isLoading: securityEventsLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SecurityEvent[];
    }
  });

  // Backup Jobs
  const { data: backupJobs, isLoading: backupJobsLoading } = useQuery({
    queryKey: ['backup-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as BackupJob[];
    }
  });

  // Compliance Reports
  const { data: complianceReports, isLoading: complianceReportsLoading } = useQuery({
    queryKey: ['compliance-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ComplianceReport[];
    }
  });

  // User Sessions
  const { data: userSessions, isLoading: userSessionsLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as UserSession[];
    }
  });

  // Encryption Keys
  const { data: encryptionKeys, isLoading: encryptionKeysLoading } = useQuery({
    queryKey: ['encryption-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encryption_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EncryptionKey[];
    }
  });

  // IP Whitelist
  const { data: ipWhitelist, isLoading: ipWhitelistLoading } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as IPWhitelist[];
    }
  });

  // Log Audit Event
  const logAuditEvent = useMutation({
    mutationFn: async (params: {
      action: string;
      resource_type: string;
      resource_id?: string;
      details?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('log_audit_event', {
        p_action: params.action,
        p_resource_type: params.resource_type,
        p_resource_id: params.resource_id,
        p_details: params.details || {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    }
  });

  // Log Security Event
  const logSecurityEvent = useMutation({
    mutationFn: async (params: {
      event_type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: params.event_type,
        p_severity: params.severity,
        p_description: params.description,
        p_metadata: params.metadata || {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Security event logged');
    }
  });

  // Create Backup Job
  const createBackupJob = useMutation({
    mutationFn: async (params: {
      job_type: 'full' | 'incremental' | 'differential';
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .insert([{
          job_type: params.job_type,
          metadata: params.metadata || {},
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      toast.success('Backup job created');
    }
  });

  // Generate Compliance Report
  const generateComplianceReport = useMutation({
    mutationFn: async (params: {
      report_type: 'soc2' | 'gdpr' | 'hipaa' | 'iso27001';
      period_start: string;
      period_end: string;
    }) => {
      const { data, error } = await supabase
        .from('compliance_reports')
        .insert([{
          report_type: params.report_type,
          period_start: params.period_start,
          period_end: params.period_end,
          status: 'generating',
          findings: [],
          recommendations: []
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-reports'] });
      toast.success('Compliance report generation started');
    }
  });

  // Add IP to Whitelist
  const addIPToWhitelist = useMutation({
    mutationFn: async (params: {
      ip_address: string;
      ip_range?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .insert([{
          ip_address: params.ip_address,
          ip_range: params.ip_range,
          description: params.description,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success('IP address added to whitelist');
    }
  });

  // Create Encryption Key
  const createEncryptionKey = useMutation({
    mutationFn: async (params: {
      key_name: string;
      key_type: 'aes256' | 'rsa2048' | 'rsa4096';
      key_purpose: 'data' | 'backup' | 'communication';
      rotation_schedule?: string;
    }) => {
      const { data, error } = await supabase
        .from('encryption_keys')
        .insert([{
          key_name: params.key_name,
          key_type: params.key_type,
          key_purpose: params.key_purpose,
          key_hash: 'generated_hash_placeholder', // In real implementation, generate actual hash
          rotation_schedule: params.rotation_schedule || 'quarterly',
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encryption-keys'] });
      toast.success('Encryption key created');
    }
  });

  // Resolve Security Event
  const resolveSecurityEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('security_events')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Security event resolved');
    }
  });

  return {
    // Data
    auditLogs,
    securityEvents,
    backupJobs,
    complianceReports,
    userSessions,
    encryptionKeys,
    ipWhitelist,
    
    // Loading states
    auditLogsLoading,
    securityEventsLoading,
    backupJobsLoading,
    complianceReportsLoading,
    userSessionsLoading,
    encryptionKeysLoading,
    ipWhitelistLoading,
    isLoading,
    
    // Mutations
    logAuditEvent,
    logSecurityEvent,
    createBackupJob,
    generateComplianceReport,
    addIPToWhitelist,
    createEncryptionKey,
    resolveSecurityEvent
  };
};

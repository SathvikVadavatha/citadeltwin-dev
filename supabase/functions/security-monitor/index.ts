
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityMonitorRequest {
  action: 'audit_log' | 'security_event' | 'backup_job' | 'compliance_report';
  data: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data }: SecurityMonitorRequest = await req.json();

    switch (action) {
      case 'audit_log':
        return await handleAuditLog(supabaseClient, data);
      case 'security_event':
        return await handleSecurityEvent(supabaseClient, data);
      case 'backup_job':
        return await handleBackupJob(supabaseClient, data);
      case 'compliance_report':
        return await handleComplianceReport(supabaseClient, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in security-monitor function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleAuditLog(supabaseClient: any, data: any) {
  const { error } = await supabaseClient.rpc('log_audit_event', {
    p_action: data.action,
    p_resource_type: data.resource_type,
    p_resource_id: data.resource_id,
    p_details: data.details || {}
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Audit log created' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSecurityEvent(supabaseClient: any, data: any) {
  const { error } = await supabaseClient.rpc('log_security_event', {
    p_event_type: data.event_type,
    p_severity: data.severity,
    p_description: data.description,
    p_metadata: data.metadata || {}
  });

  if (error) throw error;

  // Auto-response for critical events
  if (data.severity === 'critical') {
    await handleCriticalSecurityEvent(supabaseClient, data);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Security event logged' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCriticalSecurityEvent(supabaseClient: any, data: any) {
  // Log additional audit trail for critical events
  await supabaseClient.rpc('log_audit_event', {
    p_action: 'CRITICAL_SECURITY_EVENT',
    p_resource_type: 'security_events',
    p_resource_id: null,
    p_details: {
      event_type: data.event_type,
      severity: data.severity,
      auto_response: true,
      timestamp: new Date().toISOString()
    }
  });

  // Could trigger additional automated responses here:
  // - Send alerts to administrators
  // - Temporarily lock accounts
  // - Initiate automated backup
}

async function handleBackupJob(supabaseClient: any, data: any) {
  // Create backup job record
  const { data: backupJob, error } = await supabaseClient
    .from('backup_jobs')
    .insert([{
      job_type: data.job_type,
      status: 'running',
      started_at: new Date().toISOString(),
      metadata: data.metadata || {}
    }])
    .select()
    .single();

  if (error) throw error;

  // Simulate backup process
  const success = await simulateBackupProcess(data.job_type);
  
  // Update backup job status
  await supabaseClient
    .from('backup_jobs')
    .update({
      status: success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      file_size: success ? Math.floor(Math.random() * 1000000000) : null,
      backup_location: success ? `s3://backups/${backupJob.id}.tar.gz` : null,
      error_message: success ? null : 'Simulated backup failure'
    })
    .eq('id', backupJob.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      backup_job_id: backupJob.id,
      status: success ? 'completed' : 'failed'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function simulateBackupProcess(jobType: string): Promise<boolean> {
  // Simulate backup duration based on type
  const duration = jobType === 'full' ? 5000 : jobType === 'differential' ? 3000 : 2000;
  await new Promise(resolve => setTimeout(resolve, duration));
  
  // 95% success rate for simulation
  return Math.random() > 0.05;
}

async function handleComplianceReport(supabaseClient: any, data: any) {
  // Create compliance report
  const { data: report, error } = await supabaseClient
    .from('compliance_reports')
    .insert([{
      report_type: data.report_type,
      period_start: data.period_start,
      period_end: data.period_end,
      status: 'generating'
    }])
    .select()
    .single();

  if (error) throw error;

  // Generate compliance findings (simulated)
  const findings = await generateComplianceFindings(data.report_type);
  const recommendations = await generateComplianceRecommendations(findings);

  // Update report with findings
  await supabaseClient
    .from('compliance_reports')
    .update({
      status: 'completed',
      findings: findings,
      recommendations: recommendations,
      file_path: `compliance/${report.id}-${data.report_type}.pdf`
    })
    .eq('id', report.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      report_id: report.id,
      findings_count: findings.length,
      recommendations_count: recommendations.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateComplianceFindings(reportType: string) {
  // Simulated compliance findings based on report type
  const baseFindingsMap: Record<string, any[]> = {
    soc2: [
      {
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Access Control',
        description: 'Some user accounts lack proper multi-factor authentication',
        evidence: ['User access logs', 'Authentication configuration'],
        remediation: 'Enable MFA for all user accounts'
      },
      {
        id: crypto.randomUUID(),
        severity: 'low',
        category: 'Monitoring',
        description: 'Log retention period could be extended',
        evidence: ['Log configuration'],
        remediation: 'Extend log retention to 12 months'
      }
    ],
    gdpr: [
      {
        id: crypto.randomUUID(),
        severity: 'high',
        category: 'Data Minimization',
        description: 'Some data collection exceeds business necessity',
        evidence: ['Data collection audit'],
        remediation: 'Review and minimize data collection practices'
      }
    ],
    hipaa: [
      {
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Encryption',
        description: 'Some data transmission lacks end-to-end encryption',
        evidence: ['Network traffic analysis'],
        remediation: 'Implement end-to-end encryption for all data transmission'
      }
    ],
    iso27001: [
      {
        id: crypto.randomUUID(),
        severity: 'low',
        category: 'Risk Assessment',
        description: 'Risk assessment documentation needs updating',
        evidence: ['Risk assessment records'],
        remediation: 'Update risk assessment documentation quarterly'
      }
    ]
  };

  return baseFindingsMap[reportType] || [];
}

async function generateComplianceRecommendations(findings: any[]) {
  return findings.map(finding => ({
    id: crypto.randomUUID(),
    priority: finding.severity === 'high' ? 'high' : finding.severity === 'medium' ? 'medium' : 'low',
    title: `Address ${finding.category} Finding`,
    description: finding.remediation,
    implementation_cost: finding.severity === 'high' ? 'high' : 'medium',
    estimated_effort: finding.severity === 'high' ? '2-4 weeks' : '1-2 weeks'
  }));
}

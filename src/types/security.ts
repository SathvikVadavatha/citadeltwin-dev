
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  details: Record<string, any>;
  risk_score: number;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface BackupJob {
  id: string;
  job_type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  backup_location?: string;
  file_size?: number;
  metadata: Record<string, any>;
  error_message?: string;
  created_by?: string;
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  report_type: 'soc2' | 'gdpr' | 'hipaa' | 'iso27001';
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  file_path?: string;
  generated_by?: string;
  created_at: string;
}

export interface ComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  evidence: string[];
  remediation: string;
}

export interface ComplianceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  implementation_cost: 'low' | 'medium' | 'high';
  estimated_effort: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent?: string;
  location?: Record<string, any>;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

export interface EncryptionKey {
  id: string;
  key_name: string;
  key_type: 'aes256' | 'rsa2048' | 'rsa4096';
  key_purpose: 'data' | 'backup' | 'communication';
  key_hash: string;
  is_active: boolean;
  rotation_schedule: string;
  last_rotated: string;
  next_rotation?: string;
  created_by?: string;
  created_at: string;
}

export interface IPWhitelist {
  id: string;
  ip_address: string;
  ip_range?: string;
  description?: string;
  is_active: boolean;
  added_by?: string;
  created_at: string;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  password_policy: PasswordPolicy;
  ip_whitelist_enabled: boolean;
  audit_log_retention_days: number;
  data_encryption_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  history_count: number;
}

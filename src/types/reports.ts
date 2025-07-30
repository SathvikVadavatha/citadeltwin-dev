export interface ComplianceItem {
  category: string;
  standard: string;
  status: 'Yes' | 'No' | 'Partial';
}

export interface VersionHistoryItem {
  version: string;
  description: string;
  date: string;
}

export interface ComplianceReportData {
  projectName: string;
  address: string;
  buildingType: string;
  modelVersion: string;
  jurisdiction: string;
  dateGenerated: string;
  complianceSummary: ComplianceItem[];
  actionItems: string[];
  versionHistory: VersionHistoryItem[];
}

export interface TeamMember {
  name: string;
  role: string;
  tasksCompleted: number;
  description: string;
}

export interface SystemStats {
  blueprintUploads: number;
  modelsGenerated: number;
  modelsApproved: number;
  modelsInReview: number;
  complianceReports: number;
  gisLayers: string[];
}

export interface Milestone {
  task: string;
  eta: string;
}

export interface ActivityReportData {
  projectName: string;
  dateGenerated: string;
  teamActivity: TeamMember[];
  systemActivity: SystemStats;
  notifications: string[];
  nextMilestones: Milestone[];
}

export interface LoadCase {
  type: string;
  displacement: string;
  stress: string;
  status: 'Passed' | 'Near Limit' | 'Failed';
}

export interface FEAAnalysisReportData {
  projectName: string;
  dateGenerated: string;
  objective: string;
  model: string;
  meshResolution: string;
  boundaryConditions: string;
  loadCases: LoadCase[];
  recommendations: string[];
}

export type ReportData = ComplianceReportData | ActivityReportData | FEAAnalysisReportData;

export interface ReportOutput {
  data: ReportData;
  content: string | Blob;
  filename: string;
  mimeType: string;
}

export type ReportType = 'fea_analysis' | 'compliance' | 'activity' | 'performance';
export type OutputFormat = 'pdf' | 'csv' | 'json';
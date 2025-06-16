
export interface APIKey {
  id: string;
  name: string;
  service: string;
  keyType: 'api_key' | 'oauth_token' | 'jwt' | 'bearer';
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'cad' | 'bim' | 'gis' | 'analysis' | 'cloud' | 'documentation';
  provider: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  settings: Record<string, any>;
  endpoints: IntegrationEndpoint[];
  dataFormats: string[];
  capabilities: string[];
}

export interface IntegrationEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: EndpointParameter[];
  response?: any;
}

export interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
}

export interface DataImportJob {
  id: string;
  source: string;
  format: 'dwg' | 'ifc' | 'rvt' | 'skp' | 'json' | 'xml' | 'step' | 'iges';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  sourceFileUrl: string;
  metadata: Record<string, any>;
  errors?: string[];
}

export interface DataExportJob {
  id: string;
  target: string;
  format: 'dwg' | 'ifc' | 'rvt' | 'skp' | 'json' | 'xml' | 'step' | 'iges' | 'pdf' | 'docx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  outputFileUrl?: string;
  settings: Record<string, any>;
  errors?: string[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: 'cad' | 'analysis' | 'reporting' | 'workflow' | 'utility';
  entryPoint: string;
  permissions: string[];
  dependencies: string[];
  apiVersion: string;
  compatibility: {
    minVersion: string;
    maxVersion?: string;
  };
}

export interface ConnectorStatus {
  service: string;
  connected: boolean;
  lastSync?: string;
  error?: string;
  version: string;
  capabilities: string[];
}

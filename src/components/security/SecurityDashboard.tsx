
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogsPanel } from './AuditLogsPanel';
import { SecurityEventsPanel } from './SecurityEventsPanel';
import { BackupManagementPanel } from './BackupManagementPanel';
import { ComplianceReportsPanel } from './ComplianceReportsPanel';
import { EncryptionKeysPanel } from './EncryptionKeysPanel';
import { IPWhitelistPanel } from './IPWhitelistPanel';
import { SecurityMetricsCards } from './SecurityMetricsCards';
import { Shield, Lock, Database, FileText, Key, Network } from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security & Compliance</h1>
        <p className="text-muted-foreground">
          Enterprise-grade security monitoring, compliance management, and data protection
        </p>
      </div>

      <SecurityMetricsCards />

      <Tabs defaultValue="audit-logs" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="security-events" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="backup-management" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup & Recovery
          </TabsTrigger>
          <TabsTrigger value="compliance-reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="encryption-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Encryption
          </TabsTrigger>
          <TabsTrigger value="ip-whitelist" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            IP Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Comprehensive activity tracking and audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-events">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Security incidents, threats, and alerts monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityEventsPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup-management">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Disaster Recovery</CardTitle>
              <CardDescription>
                Data backup management and disaster recovery planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupManagementPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance-reports">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                SOC 2, GDPR, HIPAA, and ISO 27001 compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceReportsPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption-keys">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Key Management</CardTitle>
              <CardDescription>
                Data encryption keys and cryptographic key lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EncryptionKeysPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip-whitelist">
          <Card>
            <CardHeader>
              <CardTitle>IP Access Management</CardTitle>
              <CardDescription>
                IP whitelist management and network access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IPWhitelistPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

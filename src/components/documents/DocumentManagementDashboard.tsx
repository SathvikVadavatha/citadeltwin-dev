
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentTemplateLibrary } from './DocumentTemplateLibrary';
import { AdvancedDocumentGenerator } from './AdvancedDocumentGenerator';
import { DocumentTemplateManager } from './DocumentTemplateManager';
import { DocumentGenerator } from './DocumentGenerator';

interface DocumentManagementDashboardProps {
  uploadId?: string;
  selectedJurisdiction?: string;
}

export const DocumentManagementDashboard: React.FC<DocumentManagementDashboardProps> = ({
  uploadId,
  selectedJurisdiction
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Document Automation System</CardTitle>
          <CardDescription>
            Sophisticated document templates, AI-powered generation, and automated client deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="library">Template Library</TabsTrigger>
              <TabsTrigger value="generator">AI Generator</TabsTrigger>
              <TabsTrigger value="standard">Standard Generator</TabsTrigger>
              <TabsTrigger value="management">Template Management</TabsTrigger>
            </TabsList>

            <TabsContent value="library">
              <DocumentTemplateLibrary
                onTemplateSelect={setSelectedTemplateId}
                selectedJurisdiction={selectedJurisdiction}
              />
            </TabsContent>

            <TabsContent value="generator">
              <AdvancedDocumentGenerator
                uploadId={uploadId}
                selectedJurisdiction={selectedJurisdiction}
              />
            </TabsContent>

            <TabsContent value="standard">
              <DocumentGenerator uploadId={uploadId} />
            </TabsContent>

            <TabsContent value="management">
              <DocumentTemplateManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

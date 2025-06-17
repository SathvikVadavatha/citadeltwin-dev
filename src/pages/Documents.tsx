
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DocumentManagementDashboard } from '@/components/documents/DocumentManagementDashboard';
import { MobileDocumentGenerator } from '@/components/documents/MobileDocumentGenerator';
import { MobileOptimizedLayout } from '@/components/layout/MobileOptimizedLayout';

const Documents = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileOptimizedLayout title="Documents">
        <MobileDocumentGenerator />
      </MobileOptimizedLayout>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage engineering documents, reports, and permits
        </p>
      </div>
      <DocumentManagementDashboard />
    </div>
  );
};

export default Documents;


import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { MainDashboard } from '@/components/dashboard/MainDashboard';
import { MobileOptimizedDashboard } from '@/components/mobile/MobileOptimizedDashboard';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { UploadPage } from '@/components/upload/UploadPage';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { AIToolsContent } from './AIToolsContent';
import { GoogleMapsGIS } from '@/components/gis/GoogleMapsGIS';
import { useViewport } from '@/hooks/useViewport';

interface TabContentRendererProps {
  onNavigate: (view: string) => void;
}

export const TabContentRenderer: React.FC<TabContentRendererProps> = ({ onNavigate }) => {
  const { isMobile } = useViewport();

  const tabContent = [
    {
      value: "dashboard",
      content: isMobile ? (
        <MobileOptimizedDashboard onNavigate={onNavigate} />
      ) : (
        <MainDashboard />
      )
    },
    {
      value: "projects",
      content: <ProjectsPage onNavigate={onNavigate} />
    },
    {
      value: "upload",
      content: <UploadPage onNavigate={onNavigate} />
    },
    {
      value: "collaboration",
      content: <CollaborationPanel projectId="default-project" />
    },
    {
      value: "ai",
      content: <AIToolsContent />
    },
    {
      value: "gis",
      content: <GoogleMapsGIS />
    }
  ];

  return (
    <>
      {tabContent.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </>
  );
};

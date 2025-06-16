
import React from 'react';
import { ClientPortalDashboard } from '@/components/client-portal/ClientPortalDashboard';
import { useViewport } from '@/hooks/useViewport';

export const ClientPortal: React.FC = () => {
  const { isMobile } = useViewport();
  
  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <ClientPortalDashboard />
    </div>
  );
};

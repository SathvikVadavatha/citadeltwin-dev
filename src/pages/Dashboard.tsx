
import React from 'react';
import { MainDashboard } from '@/components/dashboard/MainDashboard';
import { GISTestTrigger } from '@/components/test/GISTestTrigger';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <GISTestTrigger />
      <MainDashboard />
    </div>
  );
};

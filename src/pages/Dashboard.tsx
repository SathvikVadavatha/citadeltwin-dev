
import React from 'react';
import { MainDashboard } from '@/components/dashboard/MainDashboard';

export const Dashboard: React.FC = () => {
  console.log('Dashboard: Component rendering...');
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'hsl(240, 20%, 4%)' }}>
      <MainDashboard />
    </div>
  );
};

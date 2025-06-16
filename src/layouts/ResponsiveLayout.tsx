
import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default ResponsiveLayout;

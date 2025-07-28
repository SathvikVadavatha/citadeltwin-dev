
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useViewport } from '@/hooks/useViewport';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { EnhancedMobileHeader } from '@/components/mobile/EnhancedMobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileNavigationProvider } from '@/components/mobile/MobileNavigationProvider';
import { cn } from '@/lib/utils';

interface EnhancedResponsiveLayoutProps {
  children: React.ReactNode;
}

export const EnhancedResponsiveLayout: React.FC<EnhancedResponsiveLayoutProps> = ({ children }) => {
  console.log('EnhancedResponsiveLayout rendering...');
  const isMobile = useIsMobile();
  const { isTouch, orientation } = useViewport();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  console.log('Layout state:', { isMobile, isTouch, orientation });

  // Close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Add safe area handling for mobile devices
  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
      document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
      document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
    }
  }, [isMobile]);

  if (isMobile) {
    console.log('Rendering mobile layout');
    return (
      <MobileNavigationProvider>
        <div 
          className={cn(
            "min-h-screen flex flex-col",
            isTouch && "touch-manipulation"
          )}
          style={{ 
            backgroundColor: 'hsl(240, 20%, 4%)', 
            color: 'hsl(224, 71%, 85%)',
            minHeight: '100vh'
          }}
        >
          <EnhancedMobileHeader 
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
            title="Engineering Platform"
            showBackButton={true}
          />
          
          <main className={cn(
            "flex-1 overflow-auto p-4",
            "pb-safe-bottom pt-safe-top",
            orientation === 'landscape' ? "pb-16" : "pb-20"
          )}>
            {children}
          </main>

          <MobileBottomNav />

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div 
                className="flex-1 bg-black/50 backdrop-blur-sm" 
                onClick={() => setSidebarOpen(false)}
              />
              <div className="w-80 bg-background border-l shadow-xl animate-slide-in-right">
                <div className="p-4">
                  <AppSidebar />
                </div>
              </div>
            </div>
          )}
        </div>
      </MobileNavigationProvider>
    );
  }

  console.log('Rendering desktop layout');
  return (
    <SidebarProvider>
      <div 
        className="min-h-screen flex w-full"
        style={{ 
          backgroundColor: 'hsl(240, 20%, 4%)', 
          color: 'hsl(224, 71%, 85%)',
          minHeight: '100vh'
        }}
      >
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

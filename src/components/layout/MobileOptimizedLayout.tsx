
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useViewport } from '@/hooks/useViewport';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { EnhancedMobileHeader } from '@/components/mobile/EnhancedMobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileNavigationProvider } from '@/components/mobile/MobileNavigationProvider';
import { MobileOptimizedContainer } from '@/components/mobile/MobileOptimizedContainer';
import { cn } from '@/lib/utils';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({ 
  children, 
  title,
  showBackButton = false 
}) => {
  const isMobile = useIsMobile();
  const { isTouch, orientation, width, height } = useViewport();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle viewport changes
  useEffect(() => {
    if (isMobile) {
      // Set viewport meta tag for proper mobile scaling
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // Set CSS custom properties for viewport dimensions
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
    }
  }, [isMobile, width, height]);

  if (isMobile) {
    return (
      <MobileNavigationProvider>
        <div className={cn(
          "min-h-screen flex flex-col bg-background",
          isTouch && "touch-manipulation",
          "overflow-hidden" // Prevent bounce scrolling on iOS
        )}
        style={{
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          WebkitOverflowScrolling: 'touch'
        }}>
          <EnhancedMobileHeader 
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
            title={title}
            showBackButton={showBackButton}
          />
          
          <main className={cn(
            "flex-1 overflow-auto",
            "safe-area-insets",
            orientation === 'landscape' ? "pb-16" : "pb-20"
          )}
          style={{
            paddingBottom: orientation === 'landscape' ? '4rem' : '5rem'
          }}>
            <MobileOptimizedContainer>
              {children}
            </MobileOptimizedContainer>
          </main>

          <MobileBottomNav />

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div 
                className="flex-1 bg-black/50 backdrop-blur-sm" 
                onClick={() => setSidebarOpen(false)}
              />
              <div className={cn(
                "w-80 bg-background border-l shadow-xl",
                "animate-slide-in-right",
                "safe-area-insets"
              )}>
                <div className="p-4 pt-safe-top">
                  <AppSidebar />
                </div>
              </div>
            </div>
          )}
        </div>
      </MobileNavigationProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
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

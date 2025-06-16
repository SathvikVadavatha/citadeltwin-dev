
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useViewport } from '@/hooks/useViewport';

interface MobileNavigationContextType {
  currentView: string;
  navigateTo: (view: string) => void;
  canGoBack: boolean;
  goBack: () => void;
  navigationHistory: string[];
  clearHistory: () => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined);

interface MobileNavigationProviderProps {
  children: React.ReactNode;
}

export const MobileNavigationProvider: React.FC<MobileNavigationProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['dashboard']);
  const { isMobile } = useViewport();

  const navigateTo = useCallback((view: string) => {
    if (view !== currentView) {
      setNavigationHistory(prev => [...prev, view]);
      setCurrentView(view);
    }
  }, [currentView]);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentView(previousView);
    }
  }, [navigationHistory]);

  const clearHistory = useCallback(() => {
    setNavigationHistory(['dashboard']);
    setCurrentView('dashboard');
  }, []);

  const canGoBack = navigationHistory.length > 1;

  const value = {
    currentView,
    navigateTo,
    canGoBack,
    goBack,
    navigationHistory,
    clearHistory
  };

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
    </MobileNavigationContext.Provider>
  );
};

export const useMobileNavigation = () => {
  const context = useContext(MobileNavigationContext);
  if (context === undefined) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return context;
};

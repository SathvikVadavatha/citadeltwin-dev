
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

const DefaultFallback = ({ minHeight = "200px" }: { minHeight?: string }) => (
  <div 
    className="flex items-center justify-center w-full" 
    style={{ minHeight }}
  >
    <div className="flex items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({ 
  children, 
  fallback,
  minHeight = "200px"
}) => {
  return (
    <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
      {children}
    </Suspense>
  );
};

// Utility for creating lazy-loaded components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(importFn);
};

// Pre-defined lazy components for heavy modules
export const LazyBIMElementsManager = createLazyComponent(
  () => import('@/components/bim/BIMElementsManager')
);

export const LazyFEAAnalysisManager = createLazyComponent(
  () => import('@/components/fea/FEAAnalysisManager')
);

export const LazyCollaborativeEditor = createLazyComponent(
  () => import('@/components/collaboration/CollaborativeEditor')
);

export const LazyModel3DViewer = createLazyComponent(
  () => import('@/components/3d/Model3DViewer')
);

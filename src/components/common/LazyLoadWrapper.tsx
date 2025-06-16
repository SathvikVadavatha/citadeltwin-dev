
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

// Pre-defined lazy components for heavy modules - using named exports properly
export const LazyBIMElementsManager = lazy(() => 
  import('@/components/bim/BIMElementsManager').then(module => ({
    default: module.BIMElementsManager
  }))
);

export const LazyFEAAnalysisManager = lazy(() => 
  import('@/components/fea/FEAAnalysisManager').then(module => ({
    default: module.FEAAnalysisManager
  }))
);

export const LazyCollaborativeEditor = lazy(() => 
  import('@/components/collaboration/CollaborativeEditor').then(module => ({
    default: module.CollaborativeEditor
  }))
);

export const LazyModel3DViewer = lazy(() => 
  import('@/components/3d/Model3DViewer').then(module => ({
    default: module.Model3DViewer
  }))
);

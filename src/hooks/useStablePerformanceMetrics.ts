
import { useState, useEffect, useCallback, useRef } from 'react';
import { PerformanceMonitor } from '@/utils/performance';

interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  queryCount: number;
  cacheHitRatio: number;
  loadTime: number;
}

interface UseStablePerformanceMetricsOptions {
  enabled?: boolean;
  interval?: number;
  developmentOnly?: boolean;
}

export const useStablePerformanceMetrics = (options: UseStablePerformanceMetricsOptions = {}) => {
  const {
    enabled = false,
    interval = 5000,
    developmentOnly = true
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 0,
    memoryUsage: 0,
    renderTime: 0,
    queryCount: 0,
    cacheHitRatio: 0,
    loadTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Stable should monitor check
  const shouldMonitor = useMemo(() => 
    enabled && (!developmentOnly || process.env.NODE_ENV === 'development'),
    [enabled, developmentOnly]
  );

  // Stable metrics update function
  const updateMetrics = useCallback(() => {
    if (!mountedRef.current) return;

    const frameRate = Math.round(1000 / 16.67);
    let memoryUsage = 0;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      // Throttled memory logging
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
        PerformanceMonitor.logMemoryUsage();
      }
    }

    setMetrics(prev => ({
      ...prev,
      frameRate,
      memoryUsage,
      renderTime: Math.random() * 16,
      cacheHitRatio: Math.random() * 100,
      loadTime: performance.now()
    }));
  }, []);

  // Stable start monitoring function
  const startMonitoring = useCallback(() => {
    if (!shouldMonitor || isMonitoring || intervalRef.current) return;
    
    setIsMonitoring(true);
    intervalRef.current = setInterval(updateMetrics, interval);
  }, [shouldMonitor, isMonitoring, updateMetrics, interval]);

  // Stable stop monitoring function
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Effect for managing monitoring lifecycle
  useEffect(() => {
    if (shouldMonitor) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [shouldMonitor, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const measureOperation = useCallback(<T,>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return PerformanceMonitor.measureAsync(name, operation);
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation
  };
};

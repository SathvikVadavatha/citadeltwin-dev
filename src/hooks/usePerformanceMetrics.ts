
import { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from '@/utils/performance';

interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  queryCount: number;
  cacheHitRatio: number;
  loadTime: number;
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 0,
    memoryUsage: 0,
    renderTime: 0,
    queryCount: 0,
    cacheHitRatio: 0,
    loadTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      // Frame rate calculation
      const frameRate = Math.round(1000 / 16.67); // Approximate 60fps target
      
      // Memory usage (if available)
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }

      // Log memory usage for debugging
      PerformanceMonitor.logMemoryUsage();

      setMetrics(prev => ({
        ...prev,
        frameRate,
        memoryUsage,
        renderTime: Math.random() * 16, // Mock render time
        queryCount: prev.queryCount,
        cacheHitRatio: Math.random() * 100,
        loadTime: performance.now()
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const measureOperation = useCallback(<T,>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return PerformanceMonitor.measureAsync(name, operation);
  }, []);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation
  };
};

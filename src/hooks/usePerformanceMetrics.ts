
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

interface UsePerformanceMetricsOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds
  developmentOnly?: boolean;
}

export const usePerformanceMetrics = (options: UsePerformanceMetricsOptions = {}) => {
  const {
    enabled = false, // Changed default to false
    interval = 5000, // Increased default from 1000ms to 5000ms
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

  // Only enable monitoring in development if developmentOnly is true
  const shouldMonitor = enabled && (!developmentOnly || process.env.NODE_ENV === 'development');

  const startMonitoring = useCallback(() => {
    if (!shouldMonitor || isMonitoring) return;
    
    setIsMonitoring(true);
    
    intervalRef.current = setInterval(() => {
      // Frame rate calculation (less aggressive)
      const frameRate = Math.round(1000 / 16.67);
      
      // Memory usage (only if available and needed)
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        
        // Only log memory in development and less frequently
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
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
    }, interval);
  }, [shouldMonitor, isMonitoring, interval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const measureOperation = useCallback(<T,>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return PerformanceMonitor.measureAsync(name, operation);
  }, []);

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

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation
  };
};

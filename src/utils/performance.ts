
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();
  private static memoryLogThrottle = 0;

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No measurement started for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startMeasurement(name);
    return operation().finally(() => {
      this.endMeasurement(name);
    });
  }

  static measureSync<T>(name: string, operation: () => T): T {
    this.startMeasurement(name);
    try {
      return operation();
    } finally {
      this.endMeasurement(name);
    }
  }

  static logMemoryUsage(): void {
    // Throttle memory logging to reduce console spam
    this.memoryLogThrottle++;
    
    // Only log every 10th call (reducing frequency by 90%)
    if (process.env.NODE_ENV === 'development' && 
        'memory' in performance && 
        this.memoryLogThrottle % 10 === 0) {
      
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  // Reset throttle counter periodically to prevent overflow
  static resetThrottle(): void {
    this.memoryLogThrottle = 0;
  }
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureAsync = <T>(name: string, operation: () => Promise<T>) => {
    return PerformanceMonitor.measureAsync(name, operation);
  };

  const measureSync = <T>(name: string, operation: () => T) => {
    return PerformanceMonitor.measureSync(name, operation);
  };

  return { measureAsync, measureSync };
};

// Reset throttle every 5 minutes to prevent counter overflow
setInterval(() => {
  PerformanceMonitor.resetThrottle();
}, 300000);

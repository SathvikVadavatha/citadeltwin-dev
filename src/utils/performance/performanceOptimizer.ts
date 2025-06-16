
import { PerformanceMonitor } from '@/utils/performance';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class PerformanceOptimizer {
  private static cache = new Map<string, CacheEntry<any>>();
  private static queryCache = new Map<string, any>();
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  // Database Query Optimization
  static optimizeQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    return PerformanceMonitor.measureAsync(`query-${queryKey}`, async () => {
      const cached = this.getFromCache<T>(queryKey);
      if (cached) {
        console.log(`Cache hit for query: ${queryKey}`);
        return cached;
      }

      const result = await queryFn();
      this.setCache(queryKey, result, ttl);
      return result;
    });
  }

  // 3D Rendering Performance
  static optimize3DRendering() {
    return {
      enableFrustumCulling: true,
      enableOcclusion: true,
      lodLevels: [
        { distance: 10, quality: 'high' },
        { distance: 50, quality: 'medium' },
        { distance: 100, quality: 'low' }
      ],
      instancedRendering: true,
      webglSettings: {
        antialias: false,
        powerPreference: 'high-performance',
        precision: 'mediump',
        preserveDrawingBuffer: false
      }
    };
  }

  // Real-time Collaboration Optimization
  static debounceCollaboration(
    key: string, 
    fn: Function, 
    delay: number = 100
  ): (...args: any[]) => void {
    return (...args: any[]) => {
      const timer = this.debounceTimers.get(key);
      if (timer) clearTimeout(timer);
      
      const newTimer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, newTimer);
    };
  }

  // AI Response Optimization
  static optimizeAIRequests<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    ttl: number = 600000 // 10 minutes for AI responses
  ): Promise<T> {
    return this.optimizeQuery(`ai-${requestId}`, requestFn, ttl);
  }

  // Cache Management
  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private static setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Memory Management
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Lazy Loading Utilities
  static createLazyLoader<T>(
    loader: () => Promise<T>,
    placeholder?: T
  ): () => Promise<T> {
    let cached: T | null = null;
    let loading = false;
    let promise: Promise<T> | null = null;

    return async (): Promise<T> => {
      if (cached) return cached;
      if (loading && promise) return promise;

      loading = true;
      promise = loader().then(result => {
        cached = result;
        loading = false;
        return result;
      });

      return promise;
    };
  }

  // Batch Operations
  static batchOperations<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> {
    return PerformanceMonitor.measureAsync('batch-operations', async () => {
      const results: T[] = [];
      
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
      }
      
      return results;
    });
  }
}

// Auto-cleanup expired cache every 5 minutes
setInterval(() => {
  PerformanceOptimizer.clearExpiredCache();
}, 300000);

import { PerformanceMonitor } from '@/utils/performance';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class PerformanceOptimizer {
  private static cache = new Map<string, CacheEntry<any>>();
  private static queryCache = new Map<string, any>();
  private static debounceTimers = new Map<string, NodeJS.Timeout>();
  private static realtimeCleanupFunctions = new Set<() => void>();
  private static maxCacheSize = 100;
  private static cleanupInterval = 300000; // 5 minutes
  private static cleanupTimer: NodeJS.Timeout | null = null;
  private static memoryCheckTimer: NodeJS.Timeout | null = null;

  static {
    this.initializeCleanup();
  }

  // Database Query Optimization
  static optimizeQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>,
    ttl: number = 300000
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

  // Real-time Collaboration Optimization with stable debouncing
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

  // Realtime Subscription Management
  static registerRealtimeCleanup(cleanupFn: () => void): () => void {
    console.log('Registering realtime cleanup function');
    this.realtimeCleanupFunctions.add(cleanupFn);
    
    // Return unregister function
    return () => {
      console.log('Unregistering realtime cleanup function');
      this.realtimeCleanupFunctions.delete(cleanupFn);
    };
  }

  static cleanupAllRealtimeSubscriptions(): void {
    console.log(`Cleaning up ${this.realtimeCleanupFunctions.size} realtime subscriptions`);
    this.realtimeCleanupFunctions.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error during realtime cleanup:', error);
      }
    });
    this.realtimeCleanupFunctions.clear();
  }

  // AI Response Optimization
  static optimizeAIRequests<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    ttl: number = 600000
  ): Promise<T> {
    return this.optimizeQuery(`ai-${requestId}`, requestFn, ttl);
  }

  // Enhanced Cache Management
  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  private static setCache<T>(key: string, data: T, ttl: number): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  // LRU Cache Eviction
  private static evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`Evicted cache entry: ${oldestKey}`);
    }
  }

  // Comprehensive Cache Cleanup
  static clearExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // Cleanup Debounce Timers
  static clearDebounceTimers(): void {
    for (const [key, timer] of this.debounceTimers.entries()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  // Cache Statistics
  static getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      memoryUsage: 0,
      hitRates: new Map<string, number>(),
      oldestEntry: Date.now(),
      newestEntry: 0,
      realtimeSubscriptions: this.realtimeCleanupFunctions.size
    };

    for (const [key, entry] of this.cache.entries()) {
      stats.memoryUsage += JSON.stringify(entry.data).length;
      stats.hitRates.set(key, entry.accessCount);
      
      if (entry.timestamp < stats.oldestEntry) {
        stats.oldestEntry = entry.timestamp;
      }
      if (entry.timestamp > stats.newestEntry) {
        stats.newestEntry = entry.timestamp;
      }
    }

    return stats;
  }

  // Force Cache Cleanup with better memory management
  static forceCacheCleanup(): void {
    this.clearExpiredCache();
    this.clearDebounceTimers();
    this.cleanupAllRealtimeSubscriptions();
    
    if (this.cache.size > this.maxCacheSize * 0.8) {
      const entriesToRemove = Math.floor(this.cache.size * 0.3);
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      for (let i = 0; i < entriesToRemove; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
      
      console.log(`Force cleaned ${entriesToRemove} cache entries`);
    }
  }

  // Initialize cleanup processes with proper cleanup
  private static initializeCleanup(): void {
    // Clear any existing timers first
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.memoryCheckTimer) clearInterval(this.memoryCheckTimer);

    // Auto-cleanup expired cache every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.clearExpiredCache();
    }, this.cleanupInterval);

    // Check memory pressure if available
    if ('memory' in performance) {
      const checkMemoryPressure = () => {
        try {
          const memory = (performance as any).memory;
          const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          
          if (usageRatio > 0.8) {
            console.warn('High memory usage detected, forcing cache cleanup');
            this.forceCacheCleanup();
          }
        } catch (error) {
          console.warn('Memory monitoring failed:', error);
        }
      };

      this.memoryCheckTimer = setInterval(checkMemoryPressure, 60000);
    }
  }

  // Destroy method for proper cleanup
  static destroy(): void {
    console.log('Destroying PerformanceOptimizer and cleaning up all resources');
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }
    
    this.clearDebounceTimers();
    this.cleanupAllRealtimeSubscriptions();
    this.cache.clear();
    this.queryCache.clear();
    
    console.log('PerformanceOptimizer cleanup complete');
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
      }).catch(error => {
        loading = false;
        promise = null;
        throw error;
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

// Enhanced cleanup on page unload
if (typeof window !== 'undefined') {
  const handleUnload = () => {
    console.log('Page unload detected, cleaning up PerformanceOptimizer');
    PerformanceOptimizer.destroy();
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
  
  // Also handle visibility changes for mobile
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('Page hidden, cleaning up realtime subscriptions');
      PerformanceOptimizer.cleanupAllRealtimeSubscriptions();
    }
  });
}

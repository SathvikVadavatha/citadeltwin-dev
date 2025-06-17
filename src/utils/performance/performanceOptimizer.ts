
import { PerformanceMonitor } from '@/utils/performance';
import { CacheManager } from './cacheManager';
import { RealtimeManager } from './realtimeManager';
import { DebounceManager } from './debounceManager';
import { QueryOptimizer } from './queryOptimizer';
import { RenderingOptimizer } from './renderingOptimizer';
import { CleanupManager } from './cleanupManager';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class PerformanceOptimizer {
  static {
    CleanupManager.initializeCleanup();
  }

  // Database Query Optimization
  static optimizeQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    return QueryOptimizer.optimizeQuery(queryKey, queryFn, ttl);
  }

  // 3D Rendering Performance
  static optimize3DRendering() {
    return RenderingOptimizer.optimize3DRendering();
  }

  // Real-time Collaboration Optimization with stable debouncing
  static debounceCollaboration(
    key: string, 
    fn: Function, 
    delay: number = 100
  ): (...args: any[]) => void {
    return DebounceManager.debounce(key, fn, delay);
  }

  // Realtime Subscription Management
  static registerRealtimeCleanup(cleanupFn: () => void): () => void {
    return RealtimeManager.registerRealtimeCleanup(cleanupFn);
  }

  static cleanupAllRealtimeSubscriptions(): void {
    RealtimeManager.cleanupAllRealtimeSubscriptions();
  }

  // AI Response Optimization
  static optimizeAIRequests<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    ttl: number = 600000
  ): Promise<T> {
    return QueryOptimizer.optimizeAIRequests(requestId, requestFn, ttl);
  }

  // Cache Management
  static clearExpiredCache(): void {
    CacheManager.clearExpiredCache();
  }

  static clearDebounceTimers(): void {
    DebounceManager.clearDebounceTimers();
  }

  static getCacheStats() {
    const cacheStats = CacheManager.getCacheStats();
    return {
      ...cacheStats,
      realtimeSubscriptions: RealtimeManager.getSubscriptionCount()
    };
  }

  static forceCacheCleanup(): void {
    CleanupManager.forceCacheCleanup();
  }

  static destroy(): void {
    CleanupManager.destroy();
  }

  // Lazy Loading Utilities
  static createLazyLoader<T>(
    loader: () => Promise<T>,
    placeholder?: T
  ): () => Promise<T> {
    return QueryOptimizer.createLazyLoader(loader, placeholder);
  }

  // Batch Operations
  static batchOperations<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> {
    return QueryOptimizer.batchOperations(operations, batchSize);
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

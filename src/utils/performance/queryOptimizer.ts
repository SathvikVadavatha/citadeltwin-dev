
import { PerformanceMonitor } from '@/utils/performance';
import { CacheManager } from './cacheManager';

export class QueryOptimizer {
  static optimizeQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    return PerformanceMonitor.measureAsync(`query-${queryKey}`, async () => {
      const cached = CacheManager.getFromCache<T>(queryKey);
      if (cached) {
        console.log(`Cache hit for query: ${queryKey}`);
        return cached;
      }

      const result = await queryFn();
      CacheManager.setCache(queryKey, result, ttl);
      return result;
    });
  }

  static optimizeAIRequests<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    ttl: number = 600000
  ): Promise<T> {
    return this.optimizeQuery(`ai-${requestId}`, requestFn, ttl);
  }

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
}

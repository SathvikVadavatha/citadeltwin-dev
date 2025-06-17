
import { PerformanceMonitor } from '@/utils/performance';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager {
  private static cache = new Map<string, CacheEntry<any>>();
  private static maxCacheSize = 100;

  static getFromCache<T>(key: string): T | null {
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

  static setCache<T>(key: string, data: T, ttl: number): void {
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

  static getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      memoryUsage: 0,
      hitRates: new Map<string, number>(),
      oldestEntry: Date.now(),
      newestEntry: 0,
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

  static forceCacheCleanup(): void {
    this.clearExpiredCache();
    
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

  static clear(): void {
    this.cache.clear();
  }

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
}

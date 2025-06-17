
import { CacheManager } from './cacheManager';
import { RealtimeManager } from './realtimeManager';
import { DebounceManager } from './debounceManager';

export class CleanupManager {
  private static cleanupInterval = 300000; // 5 minutes
  private static cleanupTimer: NodeJS.Timeout | null = null;
  private static memoryCheckTimer: NodeJS.Timeout | null = null;

  static initializeCleanup(): void {
    // Clear any existing timers first
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.memoryCheckTimer) clearInterval(this.memoryCheckTimer);

    // Auto-cleanup expired cache every 5 minutes
    this.cleanupTimer = setInterval(() => {
      CacheManager.clearExpiredCache();
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

  static forceCacheCleanup(): void {
    CacheManager.clearExpiredCache();
    DebounceManager.clearDebounceTimers();
    RealtimeManager.cleanupAllRealtimeSubscriptions();
    CacheManager.forceCacheCleanup();
  }

  static destroy(): void {
    console.log('Destroying CleanupManager and cleaning up all resources');
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }
    
    DebounceManager.clear();
    RealtimeManager.cleanupAllRealtimeSubscriptions();
    CacheManager.clear();
    
    console.log('CleanupManager cleanup complete');
  }
}

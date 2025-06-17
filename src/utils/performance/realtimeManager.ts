
export class RealtimeManager {
  private static realtimeCleanupFunctions = new Set<() => void>();

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

  static getSubscriptionCount(): number {
    return this.realtimeCleanupFunctions.size;
  }

  static clear(): void {
    this.realtimeCleanupFunctions.clear();
  }
}

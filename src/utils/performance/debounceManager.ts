
export class DebounceManager {
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  static debounce(
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

  static clearDebounceTimers(): void {
    for (const [key, timer] of this.debounceTimers.entries()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  static clear(): void {
    this.clearDebounceTimers();
  }
}

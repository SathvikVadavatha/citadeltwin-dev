
export class ResponsiveUtils {
  static getBreakpoint(width: number): 'mobile' | 'tablet' | 'desktop' {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static getOptimalFontSize(breakpoint: 'mobile' | 'tablet' | 'desktop'): string {
    switch (breakpoint) {
      case 'mobile': return '14px';
      case 'tablet': return '15px';
      case 'desktop': return '16px';
    }
  }

  static getOptimalSpacing(breakpoint: 'mobile' | 'tablet' | 'desktop'): string {
    switch (breakpoint) {
      case 'mobile': return '0.75rem';
      case 'tablet': return '1rem';
      case 'desktop': return '1.25rem';
    }
  }

  static getSafeAreaInsets() {
    return {
      top: 'env(safe-area-inset-top, 0px)',
      bottom: 'env(safe-area-inset-bottom, 0px)',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)'
    };
  }

  static optimizeForTouch(element: HTMLElement): void {
    if (!this.isTouchDevice()) return;

    // Ensure minimum touch target size
    const minSize = '44px';
    const computedStyle = window.getComputedStyle(element);
    
    if (parseInt(computedStyle.height) < 44) {
      element.style.minHeight = minSize;
    }
    
    if (parseInt(computedStyle.width) < 44) {
      element.style.minWidth = minSize;
    }

    // Add touch-friendly properties
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
  }

  static preventZoom(): void {
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Prevent zoom on input focus
    document.addEventListener('touchstart', (event) => {
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        event.target.style.fontSize = '16px';
      }
    });
  }
}

// Auto-apply responsive optimizations
if (typeof window !== 'undefined') {
  ResponsiveUtils.preventZoom();
}

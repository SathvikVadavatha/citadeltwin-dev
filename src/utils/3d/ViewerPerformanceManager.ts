
export interface PerformanceSettings {
  mode: 'high' | 'medium' | 'low';
  enableLOD: boolean;
  enableShadows: boolean;
  antialias: boolean;
  maxTriangles: number;
  targetFPS: number;
}

export class ViewerPerformanceManager {
  private static instance: ViewerPerformanceManager;
  private settings: PerformanceSettings;
  private activeViewers = new Set<string>();
  private performanceMetrics = new Map<string, any>();

  private constructor() {
    this.settings = this.getDefaultSettings();
  }

  static getInstance(): ViewerPerformanceManager {
    if (!ViewerPerformanceManager.instance) {
      ViewerPerformanceManager.instance = new ViewerPerformanceManager();
    }
    return ViewerPerformanceManager.instance;
  }

  private getDefaultSettings(): PerformanceSettings {
    // Auto-detect performance based on device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return {
        mode: 'low',
        enableLOD: true,
        enableShadows: false,
        antialias: false,
        maxTriangles: 10000,
        targetFPS: 30,
      };
    }

    const renderer = gl.getParameter(gl.RENDERER) || '';
    const isHighEnd = renderer.includes('RTX') || renderer.includes('AMD') || renderer.includes('Intel Iris');

    return {
      mode: isHighEnd ? 'high' : 'medium',
      enableLOD: true,
      enableShadows: isHighEnd,
      antialias: isHighEnd,
      maxTriangles: isHighEnd ? 100000 : 50000,
      targetFPS: isHighEnd ? 60 : 30,
    };
  }

  getOptimizedSettings(viewerId: string): PerformanceSettings {
    // Adjust settings based on number of active viewers
    const adjustedSettings = { ...this.settings };
    
    if (this.activeViewers.size > 1) {
      // Reduce quality when multiple viewers are active
      adjustedSettings.mode = adjustedSettings.mode === 'high' ? 'medium' : 'low';
      adjustedSettings.enableShadows = false;
      adjustedSettings.antialias = false;
      adjustedSettings.maxTriangles = Math.floor(adjustedSettings.maxTriangles / 2);
    }

    return adjustedSettings;
  }

  registerViewer(viewerId: string): void {
    this.activeViewers.add(viewerId);
    console.log(`Registered 3D viewer: ${viewerId}. Active viewers: ${this.activeViewers.size}`);
  }

  unregisterViewer(viewerId: string): void {
    this.activeViewers.delete(viewerId);
    this.performanceMetrics.delete(viewerId);
    console.log(`Unregistered 3D viewer: ${viewerId}. Active viewers: ${this.activeViewers.size}`);
  }

  updatePerformanceMetrics(viewerId: string, metrics: any): void {
    this.performanceMetrics.set(viewerId, {
      ...metrics,
      timestamp: Date.now(),
    });

    // Auto-adjust settings based on performance
    this.autoAdjustSettings();
  }

  private autoAdjustSettings(): void {
    const allMetrics = Array.from(this.performanceMetrics.values());
    if (allMetrics.length === 0) return;

    const avgFPS = allMetrics.reduce((sum, m) => sum + (m.fps || 0), 0) / allMetrics.length;

    if (avgFPS < this.settings.targetFPS * 0.8) {
      // Performance is below target, reduce quality
      if (this.settings.mode === 'high') {
        this.settings.mode = 'medium';
        this.settings.enableShadows = false;
      } else if (this.settings.mode === 'medium') {
        this.settings.mode = 'low';
        this.settings.antialias = false;
        this.settings.maxTriangles = Math.floor(this.settings.maxTriangles * 0.7);
      }
      
      console.log('Auto-adjusted 3D performance settings due to low FPS:', this.settings);
    } else if (avgFPS > this.settings.targetFPS * 1.2 && this.settings.mode === 'low') {
      // Performance is good, can increase quality
      this.settings.mode = 'medium';
      console.log('Auto-adjusted 3D performance settings due to good FPS:', this.settings);
    }
  }

  getCanvasSettings(): any {
    const settings = this.getOptimizedSettings('global');
    
    return {
      antialias: settings.antialias,
      alpha: settings.mode !== 'low',
      powerPreference: settings.mode === 'high' ? 'high-performance' : 'default',
      precision: settings.mode === 'high' ? 'highp' : settings.mode === 'medium' ? 'mediump' : 'lowp',
      preserveDrawingBuffer: false,
      stencil: settings.mode === 'high',
    };
  }

  getLODSettings(): any[] {
    const settings = this.getOptimizedSettings('global');
    
    if (!settings.enableLOD) {
      return [{ distance: 0, quality: settings.mode }];
    }

    switch (settings.mode) {
      case 'high':
        return [
          { distance: 5, quality: 'high' },
          { distance: 20, quality: 'medium' },
          { distance: 50, quality: 'low' },
          { distance: 100, quality: 'billboard' }
        ];
      case 'medium':
        return [
          { distance: 10, quality: 'medium' },
          { distance: 30, quality: 'low' },
          { distance: 60, quality: 'billboard' }
        ];
      case 'low':
        return [
          { distance: 15, quality: 'low' },
          { distance: 40, quality: 'billboard' }
        ];
      default:
        return [{ distance: 0, quality: 'low' }];
    }
  }

  getActiveViewersCount(): number {
    return this.activeViewers.size;
  }

  getCurrentSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  setSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Updated 3D performance settings:', this.settings);
  }
}

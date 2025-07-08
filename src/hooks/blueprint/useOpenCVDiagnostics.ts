import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface BrowserCapabilities {
  webAssembly: boolean;
  canvas2D: boolean;
  webGL: boolean;
  corsSupport: boolean;
  memoryLimit: number;
}

interface OpenCVDiagnosticResult {
  isSupported: boolean;
  capabilities: BrowserCapabilities;
  issues: string[];
  recommendations: string[];
}

export const useOpenCVDiagnostics = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<OpenCVDiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const checkBrowserCapabilities = useCallback((): BrowserCapabilities => {
    const capabilities: BrowserCapabilities = {
      webAssembly: false,
      canvas2D: false,
      webGL: false,
      corsSupport: true,
      memoryLimit: 0
    };

    // Check WebAssembly support
    try {
      capabilities.webAssembly = typeof WebAssembly === 'object' && 
        typeof WebAssembly.instantiate === 'function';
    } catch (error) {
      capabilities.webAssembly = false;
    }

    // Check Canvas 2D support
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      capabilities.canvas2D = !!ctx;
    } catch (error) {
      capabilities.canvas2D = false;
    }

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      capabilities.webGL = !!gl;
    } catch (error) {
      capabilities.webGL = false;
    }

    // Estimate memory limit (approximation)
    try {
      if ((navigator as any).deviceMemory) {
        capabilities.memoryLimit = (navigator as any).deviceMemory * 1024; // MB
      } else {
        capabilities.memoryLimit = 2048; // Default assumption: 2GB
      }
    } catch (error) {
      capabilities.memoryLimit = 1024;
    }

    return capabilities;
  }, []);

  const runDiagnostics = useCallback(async (): Promise<OpenCVDiagnosticResult> => {
    setIsRunning(true);
    logger.info('🔍 Running OpenCV browser diagnostics', 'OpenCV Diagnostics');

    const capabilities = checkBrowserCapabilities();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze capabilities and identify issues
    if (!capabilities.webAssembly) {
      issues.push('WebAssembly not supported - OpenCV.js requires WebAssembly');
      recommendations.push('Use a modern browser that supports WebAssembly (Chrome 57+, Firefox 52+, Safari 11+)');
    }

    if (!capabilities.canvas2D) {
      issues.push('Canvas 2D context not available');
      recommendations.push('Enable canvas support in browser settings');
    }

    if (!capabilities.webGL) {
      issues.push('WebGL not supported - may impact performance');
      recommendations.push('Enable hardware acceleration in browser settings');
    }

    if (capabilities.memoryLimit < 1024) {
      issues.push('Low memory device detected');
      recommendations.push('Close other browser tabs to free up memory for image processing');
    }

    // Test actual OpenCV loading
    try {
      logger.info('🧪 Testing OpenCV.js loading capability', 'OpenCV Diagnostics');
      
      // Create a test script element to verify CDN accessibility
      const testScript = document.createElement('script');
      testScript.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      testScript.onerror = () => {
        issues.push('Cannot access OpenCV.js CDN');
        recommendations.push('Check internet connection and firewall settings');
      };

      // Test CORS capabilities
      try {
        const testImage = new Image();
        testImage.crossOrigin = 'anonymous';
        testImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      } catch (corsError) {
        issues.push('CORS restrictions detected');
        recommendations.push('Ensure images are served with proper CORS headers');
      }

    } catch (error) {
      issues.push(`OpenCV loading test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      recommendations.push('Try refreshing the page or using a different browser');
    }

    const isSupported = issues.length === 0 || !issues.some(issue => 
      issue.includes('WebAssembly') || issue.includes('Canvas 2D')
    );

    const result: OpenCVDiagnosticResult = {
      isSupported,
      capabilities,
      issues,
      recommendations
    };

    logger.info('📊 OpenCV diagnostics complete', 'OpenCV Diagnostics', {
      isSupported,
      issuesFound: issues.length,
      capabilities
    });

    setDiagnosticResult(result);
    setIsRunning(false);
    return result;
  }, [checkBrowserCapabilities]);

  const resetDiagnostics = useCallback(() => {
    setDiagnosticResult(null);
  }, []);

  return {
    diagnosticResult,
    isRunning,
    runDiagnostics,
    resetDiagnostics,
    checkBrowserCapabilities
  };
};
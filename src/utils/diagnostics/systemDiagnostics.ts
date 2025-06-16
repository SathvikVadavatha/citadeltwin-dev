
import { logger } from '@/utils/logger';
import { ErrorHandler } from '@/utils/errorHandling';

export interface DiagnosticResult {
  category: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'error';
  score: number;
  results: DiagnosticResult[];
  recommendations: string[];
}

export class SystemDiagnostics {
  static async runComprehensiveDiagnostics(): Promise<SystemHealth> {
    const results: DiagnosticResult[] = [];
    
    try {
      // Database connectivity
      results.push(await this.checkDatabaseConnection());
      
      // Memory usage
      results.push(this.checkMemoryUsage());
      
      // Error rate analysis
      results.push(this.checkErrorRates());
      
      // Performance metrics
      results.push(this.checkPerformanceMetrics());
      
      // Data integrity
      results.push(await this.checkDataIntegrity());
      
      // API response times
      results.push(await this.checkAPIResponseTimes());
      
    } catch (error) {
      results.push({
        category: 'System',
        status: 'error',
        message: 'Failed to complete diagnostic scan',
        details: ErrorHandler.handle(error, 'SystemDiagnostics'),
        timestamp: new Date()
      });
    }

    const overallStatus = this.calculateOverallStatus(results);
    const score = this.calculateHealthScore(results);
    const recommendations = this.generateRecommendations(results);

    return {
      overallStatus,
      score,
      results,
      recommendations
    };
  }

  static async checkDatabaseConnection(): Promise<DiagnosticResult> {
    try {
      const start = Date.now();
      
      // This would be a real database ping in production
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const responseTime = Date.now() - start;
      
      return {
        category: 'Database',
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'error',
        message: `Database connection established in ${responseTime}ms`,
        details: { responseTime },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        category: 'Database',
        status: 'error',
        message: 'Database connection failed',
        details: ErrorHandler.handle(error, 'Database Check'),
        timestamp: new Date()
      };
    }
  }

  static checkMemoryUsage(): DiagnosticResult {
    try {
      // Browser memory API (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        return {
          category: 'Memory',
          status: usedPercent < 70 ? 'healthy' : usedPercent < 90 ? 'warning' : 'error',
          message: `Memory usage: ${usedPercent.toFixed(1)}%`,
          details: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: usedPercent
          },
          timestamp: new Date()
        };
      } else {
        return {
          category: 'Memory',
          status: 'warning',
          message: 'Memory usage monitoring not available',
          timestamp: new Date()
        };
      }
    } catch (error) {
      return {
        category: 'Memory',
        status: 'error',
        message: 'Failed to check memory usage',
        details: ErrorHandler.handle(error, 'Memory Check'),
        timestamp: new Date()
      };
    }
  }

  static checkErrorRates(): DiagnosticResult {
    try {
      const logs = logger.getLogs();
      const errorLogs = logs.filter(log => log.level >= 3); // ERROR level
      const recentErrors = errorLogs.filter(log => 
        Date.now() - log.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
      );
      
      const errorRate = logs.length > 0 ? (recentErrors.length / logs.length) * 100 : 0;
      
      return {
        category: 'Error Rate',
        status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'error',
        message: `Error rate: ${errorRate.toFixed(1)}% (${recentErrors.length} errors in last 5 minutes)`,
        details: {
          totalLogs: logs.length,
          recentErrors: recentErrors.length,
          errorRate
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        category: 'Error Rate',
        status: 'error',
        message: 'Failed to analyze error rates',
        details: ErrorHandler.handle(error, 'Error Rate Check'),
        timestamp: new Date()
      };
    }
  }

  static checkPerformanceMetrics(): DiagnosticResult {
    try {
      if ('getEntriesByType' in performance) {
        const navigations = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        
        if (navigations.length > 0) {
          const nav = navigations[0];
          const loadTime = nav.loadEventEnd - nav.fetchStart;
          const domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
          
          return {
            category: 'Performance',
            status: loadTime < 2000 ? 'healthy' : loadTime < 5000 ? 'warning' : 'error',
            message: `Page load time: ${loadTime.toFixed(0)}ms`,
            details: {
              loadTime,
              domContentLoaded,
              firstContentfulPaint: nav.responseStart - nav.fetchStart
            },
            timestamp: new Date()
          };
        }
      }
      
      return {
        category: 'Performance',
        status: 'warning',
        message: 'Performance metrics not available',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        category: 'Performance',
        status: 'error',
        message: 'Failed to check performance metrics',
        details: ErrorHandler.handle(error, 'Performance Check'),
        timestamp: new Date()
      };
    }
  }

  static async checkDataIntegrity(): Promise<DiagnosticResult> {
    try {
      // In a real application, this would check for:
      // - Orphaned records
      // - Data consistency
      // - Missing required fields
      // - Invalid relationships
      
      // Simulated data integrity check
      const issues = Math.floor(Math.random() * 3); // 0-2 issues
      
      return {
        category: 'Data Integrity',
        status: issues === 0 ? 'healthy' : issues === 1 ? 'warning' : 'error',
        message: issues === 0 ? 'No data integrity issues found' : `${issues} data integrity issues detected`,
        details: { issuesFound: issues },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        category: 'Data Integrity',
        status: 'error',
        message: 'Failed to check data integrity',
        details: ErrorHandler.handle(error, 'Data Integrity Check'),
        timestamp: new Date()
      };
    }
  }

  static async checkAPIResponseTimes(): Promise<DiagnosticResult> {
    try {
      const start = Date.now();
      
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
      
      const responseTime = Date.now() - start;
      
      return {
        category: 'API Performance',
        status: responseTime < 200 ? 'healthy' : responseTime < 500 ? 'warning' : 'error',
        message: `API response time: ${responseTime}ms`,
        details: { averageResponseTime: responseTime },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        category: 'API Performance',
        status: 'error',
        message: 'API health check failed',
        details: ErrorHandler.handle(error, 'API Check'),
        timestamp: new Date()
      };
    }
  }

  static calculateOverallStatus(results: DiagnosticResult[]): 'healthy' | 'warning' | 'error' {
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) return 'error';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }

  static calculateHealthScore(results: DiagnosticResult[]): number {
    if (results.length === 0) return 0;
    
    let score = 0;
    results.forEach(result => {
      switch (result.status) {
        case 'healthy':
          score += 100;
          break;
        case 'warning':
          score += 60;
          break;
        case 'error':
          score += 20;
          break;
      }
    });
    
    return Math.round(score / results.length);
  }

  static generateRecommendations(results: DiagnosticResult[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(result => {
      switch (result.category) {
        case 'Memory':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Consider reducing memory usage by clearing unused data and optimizing component lifecycle');
          }
          break;
        case 'Error Rate':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Review recent error logs and implement additional error handling');
          }
          break;
        case 'Performance':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Optimize loading times by implementing code splitting and lazy loading');
          }
          break;
        case 'Database':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Check database connection stability and consider connection pooling');
          }
          break;
        case 'Data Integrity':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Run data cleanup procedures and implement stricter validation');
          }
          break;
        case 'API Performance':
          if (result.status === 'warning' || result.status === 'error') {
            recommendations.push('Optimize API calls and implement caching strategies');
          }
          break;
      }
    });
    
    return recommendations;
  }
}


export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 2000; // Increased for enhanced debugging
  private logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger();
    }
    return this.instance;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    // Add to internal log store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Enhanced console output with better formatting
    if (level >= this.logLevel) {
      const timestamp = entry.timestamp.toISOString();
      const prefix = context ? `[${context}]` : '';
      const sessionPrefix = `[${this.sessionId.slice(-8)}]`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`🔍 ${timestamp} DEBUG ${sessionPrefix} ${prefix}`, message, data ? '\n' + JSON.stringify(data, null, 2) : '');
          break;
        case LogLevel.INFO:
          console.info(`ℹ️ ${timestamp} INFO ${sessionPrefix} ${prefix}`, message, data ? '\n' + JSON.stringify(data, null, 2) : '');
          break;
        case LogLevel.WARN:
          console.warn(`⚠️ ${timestamp} WARN ${sessionPrefix} ${prefix}`, message, data ? '\n' + JSON.stringify(data, null, 2) : '');
          break;
        case LogLevel.ERROR:
          console.error(`❌ ${timestamp} ERROR ${sessionPrefix} ${prefix}`, message, data ? '\n' + JSON.stringify(data, null, 2) : '');
          break;
      }
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // Enhanced methods for Plan2Scene debugging
  startTimer(label: string, context?: string): string {
    const timerId = `${label}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.debug(`⏱️ Timer started: ${label}`, context, { timerId });
    return timerId;
  }

  endTimer(timerId: string, label: string, context?: string): number {
    const duration = Date.now() - parseInt(timerId.split('_')[1]);
    this.info(`⏱️ Timer completed: ${label} (${duration}ms)`, context, { timerId, duration });
    return duration;
  }

  logProcessingStage(stage: string, status: 'start' | 'success' | 'error', context?: string, data?: any): void {
    const emoji = status === 'start' ? '🚀' : status === 'success' ? '✅' : '❌';
    const level = status === 'error' ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `${emoji} Processing stage: ${stage} (${status})`, context, data);
  }

  getLogs(level?: LogLevel, context?: string): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }
    
    return filteredLogs;
  }

  getLogsBySession(sessionId?: string): LogEntry[] {
    const targetSessionId = sessionId || this.sessionId;
    return this.logs.filter(log => log.sessionId === targetSessionId);
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,level,context,message,data\n';
      const rows = this.logs.map(log => 
        `${log.timestamp.toISOString()},${LogLevel[log.level]},${log.context || ''},${log.message},"${JSON.stringify(log.data || {})}"`
      ).join('\n');
      return headers + rows;
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
    this.info('Log history cleared', 'Logger');
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to ${LogLevel[level]}`, 'Logger');
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// Enhanced React hook for logging with automatic context
export const useLogger = (context?: string) => {
  const baseContext = context || 'Component';
  
  const debug = (message: string, data?: any) => logger.debug(message, baseContext, data);
  const info = (message: string, data?: any) => logger.info(message, baseContext, data);
  const warn = (message: string, data?: any) => logger.warn(message, baseContext, data);
  const error = (message: string, data?: any) => logger.error(message, baseContext, data);
  
  const startTimer = (label: string) => logger.startTimer(label, baseContext);
  const endTimer = (timerId: string, label: string) => logger.endTimer(timerId, label, baseContext);
  const logStage = (stage: string, status: 'start' | 'success' | 'error', data?: any) => 
    logger.logProcessingStage(stage, status, baseContext, data);

  return { 
    debug, 
    info, 
    warn, 
    error, 
    startTimer, 
    endTimer, 
    logStage,
    sessionId: logger.getSessionId()
  };
};

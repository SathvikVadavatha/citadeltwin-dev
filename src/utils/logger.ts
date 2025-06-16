
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
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

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
    };

    // Add to internal log store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on log level
    if (level >= this.logLevel) {
      const prefix = context ? `[${context}]` : '';
      const timestamp = entry.timestamp.toISOString();
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${timestamp} DEBUG ${prefix}`, message, data);
          break;
        case LogLevel.INFO:
          console.info(`${timestamp} INFO ${prefix}`, message, data);
          break;
        case LogLevel.WARN:
          console.warn(`${timestamp} WARN ${prefix}`, message, data);
          break;
        case LogLevel.ERROR:
          console.error(`${timestamp} ERROR ${prefix}`, message, data);
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

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// React hook for logging
export const useLogger = (context?: string) => {
  const debug = (message: string, data?: any) => logger.debug(message, context, data);
  const info = (message: string, data?: any) => logger.info(message, context, data);
  const warn = (message: string, data?: any) => logger.warn(message, context, data);
  const error = (message: string, data?: any) => logger.error(message, context, data);

  return { debug, info, warn, error };
};

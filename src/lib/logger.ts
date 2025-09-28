// Comprehensive logging system for iKasiLink
// Provides structured logging with different levels and contexts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      batchSize: 10,
      flushInterval: 5000,
      ...config
    };

    if (this.config.enableRemote) {
      this.startFlushTimer();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Get from auth context or localStorage
      return localStorage.getItem('user_id') || undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    try {
      return localStorage.getItem('session_id') || undefined;
    } catch {
      return undefined;
    }
  }

  private getRequestId(): string | undefined {
    // Generate or retrieve request ID
    return Math.random().toString(36).substring(2, 15);
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context, metadata, error);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
      
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flushLogs();
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, metadata, error } = entry;
    const levelName = LogLevel[level];
    const contextStr = context ? `[${context}]` : '';
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const errorStr = error ? `\nError: ${error.name}: ${error.message}` : '';

    const logMessage = `${timestamp} ${levelName}${contextStr}: ${message}${metaStr}${errorStr}`;

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  // Public logging methods
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  fatal(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, metadata, error);
  }

  // Performance logging
  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
  }

  // User action logging
  logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, 'USER_ACTION', details);
  }

  // API request logging
  logApiRequest(method: string, url: string, status?: number, duration?: number): void {
    this.info(`API ${method} ${url}`, 'API_REQUEST', {
      method,
      url,
      status,
      duration
    });
  }

  // Security event logging
  logSecurityEvent(event: string, details?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, 'SECURITY', details);
  }

  // Business event logging
  logBusinessEvent(event: string, details?: Record<string, any>): void {
    this.info(`Business event: ${event}`, 'BUSINESS', details);
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining logs
    if (this.logBuffer.length > 0) {
      this.flushLogs();
    }
  }
}

// Singleton logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.VITE_LOGGING_ENDPOINT
});

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): void {
    performance.mark(`${label}-start`);
  }

  endTiming(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    const duration = measure.duration;
    
    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    // Log performance
    logger.info(`Performance: ${label}`, 'PERFORMANCE', { duration });
    
    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) {
      return 0;
    }
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      if (times.length > 0) {
        result[label] = {
          average: this.getAverageTime(label),
          count: times.length,
          min: Math.min(...times),
          max: Math.max(...times)
        };
      }
    }
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error boundary logging
export function logErrorBoundary(error: Error, errorInfo: any): void {
  logger.error('React Error Boundary caught an error', error, 'ERROR_BOUNDARY', {
    componentStack: errorInfo.componentStack
  });
}

// API error logging
export function logApiError(error: any, context?: string): void {
  logger.error(`API Error: ${error.message}`, error, context || 'API', {
    status: error.status,
    url: error.url
  });
}

// LogLevel enum is already exported above; avoid re-export to prevent conflicts

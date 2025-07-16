/* eslint-disable @typescript-eslint/no-explicit-any */

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  level?: LogLevel;
  service?: string;
  version?: string;
  environment?: string;
  pretty?: boolean;
}

export class SmritiLogger {
  private config: Required<LoggerConfig>;
  private logLevels: Record<LogLevel, number> = {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  };

  constructor(config: LoggerConfig = {}) {
    const environment = config.environment || process.env.NODE_ENV || 'development';
    
    this.config = {
      level: config.level || this.getDefaultLogLevel(),
      service: config.service || 'smriti',
      version: config.version || '1.0.0',
      environment,
      pretty: config.pretty !== undefined ? config.pretty : environment === 'development'
    };
  }

  private getDefaultLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLevel && Object.keys(this.logLevels).includes(envLevel)) {
      return envLevel;
    }

    // Default based on environment
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'info';
    if (nodeEnv === 'test') return 'warn';
    return 'debug'; // development default
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseInfo = {
      timestamp,
      level: level.toUpperCase(),
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
      pid: process.pid,
    };

    const logObject = {
      ...baseInfo,
      message,
      ...(meta && typeof meta === 'object' ? meta : { meta }),
    };

    if (this.config.pretty) {
      const time = new Date().toLocaleTimeString();
      const metaStr = meta ? ` ${JSON.stringify(meta, null, 2)}` : '';
      return `[${time}] [${this.config.service}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    return JSON.stringify(logObject);
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Route to appropriate console method
    switch (level) {
      case 'fatal':
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
      case 'trace':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  // Core logging methods
  fatal(message: string, meta?: any): void {
    this.log('fatal', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  trace(message: string, meta?: any): void {
    this.log('trace', message, meta);
  }

  // Specialized logging methods for common scenarios
  apiRequest(method: string, url: string, statusCode?: number, duration?: number): void {
    this.info('API Request', {
      method,
      url,
      statusCode,
      duration,
      type: 'api_request'
    });
  }

  websocketEvent(event: string, clientId?: string, meta?: any): void {
    this.debug('WebSocket Event', {
      event,
      clientId,
      ...meta,
      type: 'websocket_event'
    });
  }

  openaiEvent(event: string, sessionId?: string, meta?: any): void {
    this.debug('OpenAI Event', {
      event,
      sessionId,
      ...meta,
      type: 'openai_event'
    });
  }

  userAction(action: string, userId?: string, meta?: any): void {
    this.info('User Action', {
      action,
      userId,
      ...meta,
      type: 'user_action'
    });
  }

  performance(operation: string, duration: number, meta?: any): void {
    this.info('Performance Metric', {
      operation,
      duration,
      ...meta,
      type: 'performance'
    });
  }

  // Get child logger with additional context
  child(bindings: Record<string, any>): SmritiLogger {
    const childLogger = new SmritiLogger(this.config);
    // Add bindings to future log calls
    const originalFormatMessage = childLogger.formatMessage.bind(childLogger);
    childLogger.formatMessage = (level: LogLevel, message: string, meta?: any) => {
      const combinedMeta = { ...bindings, ...(meta || {}) };
      return originalFormatMessage(level, message, combinedMeta);
    };
    return childLogger;
  }

  // Get current configuration
  getConfig(): Required<LoggerConfig> {
    return { ...this.config };
  }
}

// Create default logger instance
export const logger = new SmritiLogger();

// Export factory function for custom configurations
export function createLogger(config: LoggerConfig): SmritiLogger {
  return new SmritiLogger(config);
}

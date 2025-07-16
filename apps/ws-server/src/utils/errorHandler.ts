import { logger } from '@smriti/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class SessionError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class WebSocketError extends AppError {
  constructor(message: string, code = 1011) {
    super(message, code);
  }
}

/**
 * Global error handler for Express middleware
 */
export function handleError(error: Error, req?: any, res?: any, next?: any): void {
  logger.error('Global error handler triggered:', {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip
  });

  // If response object is available (Express error), send HTTP response
  if (res && !res.headersSent) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error instanceof AppError ? error.message : 'Internal Server Error';
    
    res.status(statusCode).json({
      error: {
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtException(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack
    });
    
    // Give some time for logging to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    // Give some time for logging to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * WebSocket specific error handling
 */
export function handleWebSocketError(error: Error, sessionId?: string, userId?: string): void {
  logger.error('WebSocket Error:', {
    message: error.message,
    stack: error.stack,
    sessionId,
    userId
  });
}

/**
 * Validate message format
 */
export function validateMessage(data: any): { valid: boolean; error?: string } {
  try {
    if (!data) {
      return { valid: false, error: 'Message data is required' };
    }

    const message = typeof data === 'string' ? JSON.parse(data) : data;

    if (!message.type) {
      return { valid: false, error: 'Message type is required' };
    }

    // Core message types for proxy architecture
    const validMessageTypes = [
      // Server-specific messages
      'ping',
      // OpenAI proxy message (primary)
      'openai_event',
      // Minimal legacy support for backward compatibility
      'text_message', 
      'audio_data', 
      'audio_commit', 
      'audio_clear'
    ];

    if (!validMessageTypes.includes(message.type)) {
      return { valid: false, error: `Invalid message type: ${message.type}` };
    }

    // Payload validation
    if (message.type === 'openai_event' && !message.payload) {
      return { valid: false, error: 'OpenAI event payload is required' };
    }

    if (message.type !== 'ping' && message.type !== 'audio_commit' && message.type !== 'audio_clear' && !message.payload) {
      return { valid: false, error: 'Message payload is required' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Initialize all error handlers
 */
export function initializeErrorHandling(): void {
  handleUncaughtException();
  handleUnhandledRejection();
  
  logger.info('Error handling initialized');
} 
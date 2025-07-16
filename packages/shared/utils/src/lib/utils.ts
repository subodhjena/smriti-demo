/// <reference lib="dom" />

// Import constants with proper path
export const VALIDATION_RULES = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_AUDIO_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_AUDIO_FORMATS: ['audio/wav', 'audio/mp3', 'audio/webm'],
  SESSION_ID_PATTERN: /^[a-zA-Z0-9-_]{8,32}$/,
  MESSAGE_ID_PATTERN: /^[a-zA-Z0-9-_]{8,32}$/,
} as const;

// ID Generation Utilities
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${randomStr}`;
}

export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `session_${timestamp}_${randomStr}`;
}

export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 12);
  return `user_${timestamp}_${randomStr}`;
}

// Timestamp Formatting Utilities
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return formatDate(date);
  }
}

// Audio Data Utilities
export function encodeAudioData(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeAudioData(encoded: string): ArrayBuffer {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function validateAudioFormat(data: ArrayBuffer): boolean {
  // Basic validation - check if the buffer has data
  return data && data.byteLength > 0;
}

export function getAudioDuration(buffer: ArrayBuffer, sampleRate = 24000): number {
  // Calculate duration in milliseconds based on buffer size and sample rate
  const samples = buffer.byteLength / 2; // Assuming 16-bit audio (2 bytes per sample)
  return (samples / sampleRate) * 1000;
}

export function convertBlobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

// Validation Utilities
export function validateMessageId(id: string): boolean {
  return VALIDATION_RULES.MESSAGE_ID_PATTERN.test(id);
}

export function validateSessionId(id: string): boolean {
  return VALIDATION_RULES.SESSION_ID_PATTERN.test(id);
}

export function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length < VALIDATION_RULES.MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: `Message must be at least ${VALIDATION_RULES.MIN_MESSAGE_LENGTH} character(s)` };
  }
  
  if (content.length > VALIDATION_RULES.MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: `Message must be less than ${VALIDATION_RULES.MAX_MESSAGE_LENGTH} characters` };
  }
  
  return { isValid: true };
}

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No audio file provided' };
  }
  
  if (file.size > VALIDATION_RULES.MAX_AUDIO_FILE_SIZE) {
    const maxSizeMB = VALIDATION_RULES.MAX_AUDIO_FILE_SIZE / (1024 * 1024);
    return { isValid: false, error: `Audio file must be less than ${maxSizeMB}MB` };
  }
  
  if (!(VALIDATION_RULES.ALLOWED_AUDIO_FORMATS as readonly string[]).includes(file.type)) {
    return { isValid: false, error: `Audio format ${file.type} is not supported` };
  }
  
  return { isValid: true };
}

// URL and Environment Utilities
export function getWebSocketUrl(): string {
  if (typeof globalThis.window === 'undefined') {
    // Server-side
    return process.env.WS_URL || 'ws://localhost:8080';
  }
  
  // Client-side
  const protocol = globalThis.window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${globalThis.window.location.host.replace(':3000', ':8080')}`;
  
  return host.startsWith('ws') ? host : `${protocol}//${host}`;
}

export function getApiBaseUrl(): string {
  if (typeof globalThis.window === 'undefined') {
    // Server-side
    return process.env.API_BASE_URL || 'http://localhost:3000';
  }
  
  // Client-side
  return process.env.NEXT_PUBLIC_API_BASE_URL || globalThis.window.location.origin;
}

// Text Processing Utilities
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function sanitizeText(text: string): string {
  // Basic HTML sanitization - remove potential XSS vectors
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Array and Object Utilities
export function groupMessagesByDate(messages: Array<{ timestamp: Date; [key: string]: any }>): Array<{ date: string; messages: any[] }> {
  const groups: { [date: string]: any[] } = {};
  
  messages.forEach(message => {
    const dateKey = formatDate(message.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
  }));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Error Handling Utilities
export function createError(code: string, message: string, details?: any): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).details = details;
  (error as any).timestamp = new Date();
  return error;
}

export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'CONNECTION_FAILED',
    'CONNECTION_TIMEOUT',
    'WEBSOCKET_ERROR',
    'OPENAI_RATE_LIMIT',
  ];
  
  return retryableCodes.includes(error?.code) || 
         error?.name === 'NetworkError' ||
         (error?.status >= 500 && error?.status < 600);
}

// Local Storage Utilities (Client-side only)
export function setLocalStorage(key: string, value: any): boolean {
  if (typeof globalThis.window === 'undefined') return false;
  
  try {
    globalThis.window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getLocalStorage<T>(key: string, defaultValue?: T): T | undefined {
  if (typeof globalThis.window === 'undefined') return defaultValue;
  
  try {
    const item = globalThis.window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function removeLocalStorage(key: string): boolean {
  if (typeof globalThis.window === 'undefined') return false;
  
  try {
    globalThis.window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// WebSocket Utilities
export function createWebSocketMessage(
  type: string,
  payload: any,
  sessionId: string,
  messageId?: string
): any {
  return {
    type,
    payload,
    timestamp: Date.now(),
    sessionId,
    messageId: messageId || generateMessageId(),
  };
}

// Performance Utilities
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}

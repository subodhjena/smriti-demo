// WebSocket Events
export const WS_EVENTS = {
  CONNECTION: 'connection',
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
  OPEN: 'open',
  RECONNECT: 'reconnect',
  DISCONNECT: 'disconnect',
} as const;

// WebSocket Message Types
export const WS_MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  CONTROL: 'control',
  RESPONSE: 'response',
  ERROR: 'error',
} as const;

// WebSocket Control Actions
export const WS_CONTROL_ACTIONS = {
  START_RECORDING: 'start_recording',
  STOP_RECORDING: 'stop_recording',
  END_SESSION: 'end_session',
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 24000,
  CHANNELS: 1,
  FORMAT: 'pcm',
  BIT_DEPTH: 16,
  CHUNK_SIZE: 1024,
  MAX_RECORDING_DURATION: 30000, // 30 seconds in milliseconds
  MIN_RECORDING_DURATION: 500,   // 500ms minimum
} as const;

// Audio Formats
export const AUDIO_FORMATS = {
  PCM: 'pcm',
  MP3: 'mp3',
  WAV: 'wav',
  WEBM: 'webm',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://smriti-demo-production.up.railway.app',
  WS_TOKEN: '/api/ws-token',
  HEALTH_CHECK: '/api/health',
} as const;

// Connection Configuration
export const CONNECTION_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 2000, // 2 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  DEFAULT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_MESSAGES_PER_SESSION: 50,
  MAX_SESSION_DURATION: 60 * 60 * 1000, // 1 hour
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// OpenAI Configuration
export const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4',
  DEFAULT_VOICE: 'alloy',
  DEFAULT_TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
  REALTIME_MODEL: 'gpt-4o-realtime-preview',
} as const;

// OpenAI Voice Options
export const OPENAI_VOICES = {
  ALLOY: 'alloy',
  ECHO: 'echo',
  FABLE: 'fable',
  ONYX: 'onyx',
  NOVA: 'nova',
  SHIMMER: 'shimmer',
} as const;

// Error Codes
export const ERROR_CODES = {
  // Connection Errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  
  // Authentication Errors
  AUTH_FAILED: 'AUTH_FAILED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Audio Errors
  MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
  AUDIO_RECORDING_FAILED: 'AUDIO_RECORDING_FAILED',
  AUDIO_PROCESSING_ERROR: 'AUDIO_PROCESSING_ERROR',
  UNSUPPORTED_AUDIO_FORMAT: 'UNSUPPORTED_AUDIO_FORMAT',
  
  // Message Errors
  MESSAGE_TOO_LARGE: 'MESSAGE_TOO_LARGE',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  
  // OpenAI Errors
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  OPENAI_RATE_LIMIT: 'OPENAI_RATE_LIMIT',
  OPENAI_QUOTA_EXCEEDED: 'OPENAI_QUOTA_EXCEEDED',
  
  // General Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// Application States
export const APP_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  MAINTENANCE: 'maintenance',
} as const;

// Chat States
export const CHAT_STATES = {
  IDLE: 'idle',
  TYPING: 'typing',
  WAITING_RESPONSE: 'waiting_response',
  RECEIVING_RESPONSE: 'receiving_response',
  ERROR: 'error',
} as const;

// Recording States
export const RECORDING_STATES = {
  IDLE: 'idle',
  REQUESTING_PERMISSION: 'requesting_permission',
  RECORDING: 'recording',
  STOPPING: 'stopping',
  PROCESSING: 'processing',
  ERROR: 'error',
} as const;

// Connection States
export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

// Message Sender Types
export const MESSAGE_SENDERS = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  SYSTEM: 'system',
} as const;

// Spiritual Context Types (Demo-specific)
export const SPIRITUAL_CONTEXTS = {
  GENERAL: 'general',
  FESTIVAL: 'festival',
  PHILOSOPHY: 'philosophy',
  DAILY_PRACTICE: 'daily_practice',
  MEDITATION: 'meditation',
} as const;

// Demo Configuration
export const DEMO_CONFIG = {
  MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  MAX_MESSAGES_PER_SESSION: 20,
  ENABLE_VOICE: true,
  ENABLE_TEXT_TO_SPEECH: true,
  DEFAULT_SPIRITUAL_CONTEXT: SPIRITUAL_CONTEXTS.GENERAL,
  TYPING_INDICATOR_DELAY: 1000, // 1 second
  AUTO_SCROLL_DELAY: 100, // 100ms
} as const;

// UI Configuration
export const UI_CONFIG = {
  MESSAGE_ANIMATION_DURATION: 300, // 300ms
  TYPING_ANIMATION_DURATION: 1500, // 1.5 seconds
  SCROLL_BEHAVIOR: 'smooth',
  MAX_MESSAGES_DISPLAYED: 100,
  MESSAGE_TIMESTAMP_FORMAT: 'HH:mm',
  DATE_FORMAT: 'MMM dd, yyyy',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_AUDIO_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_AUDIO_FORMATS: ['audio/wav', 'audio/mp3', 'audio/webm'],
  SESSION_ID_PATTERN: /^[a-zA-Z0-9-_]{8,32}$/,
  MESSAGE_ID_PATTERN: /^[a-zA-Z0-9-_]{8,32}$/,
} as const;

// Feature Flags (for demo)
export const FEATURE_FLAGS = {
  ENABLE_VOICE_CHAT: true,
  ENABLE_TEXT_CHAT: true,
  ENABLE_AUDIO_PLAYBACK: true,
  ENABLE_MESSAGE_HISTORY: true,
  ENABLE_SESSION_PERSISTENCE: false, // Demo doesn't persist sessions
  ENABLE_ANALYTICS: false, // Demo doesn't track analytics
  ENABLE_ERROR_REPORTING: false, // Demo doesn't report errors
} as const;

// Environment Variables Keys
export const ENV_KEYS = {
  CLERK_PUBLISHABLE_KEY: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  CLERK_SECRET_KEY: 'CLERK_SECRET_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  WS_URL: 'NEXT_PUBLIC_WS_URL',
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
} as const;

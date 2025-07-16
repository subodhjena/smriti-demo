// User Models
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Message Models
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'audio';
  sender: 'user' | 'ai';
  timestamp: Date;
  audioUrl?: string;
  audioData?: string; // base64 encoded audio for transmission
  metadata?: {
    duration?: number; // for audio messages
    sampleRate?: number;
    format?: 'pcm' | 'mp3' | 'wav';
  };
}

// Chat Session Models
export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'ended';
  metadata?: {
    totalMessages: number;
    lastActivity: Date;
    duration?: number; // session duration in milliseconds
  };
}

// Primary WebSocket Message Protocol (Simplified for Proxy Architecture)
export interface WebSocketMessage {
  type: 'openai_event' | 'ping' | 'pong' | 'welcome' | 'error' | 'text_message' | 'audio_data' | 'audio_commit' | 'audio_clear' | 'text_delta' | 'audio_delta' | 'speech_started' | 'speech_stopped';
  payload: any;
  timestamp: string;
  sessionId?: string;
}

// WebSocket Event (Primary Message Type)
export interface WSEventWebSocketMessage extends WebSocketMessage {
  type: 'openai_event';
  payload: WSRealtimeEvent;
}

// WebSocket Realtime Event Types
export interface WSRealtimeEvent {
  event_id?: string;
  type: string;
  [key: string]: any; // Allow for any WebSocket event structure
}

// Server-Specific Messages
export interface ServerWebSocketMessage extends WebSocketMessage {
  type: 'ping' | 'pong' | 'welcome' | 'error';
}

export interface WelcomeMessage extends ServerWebSocketMessage {
  type: 'welcome';
  payload: {
    message: string;
    sessionId: string;
    userId: string;
    authenticated: boolean;
    features: string[];
  };
}

export interface ErrorMessage extends ServerWebSocketMessage {
  type: 'error';
  payload: {
    message: string;
    details?: string;
  };
}

// Legacy Message Support (for backward compatibility)
export interface LegacyWebSocketMessage extends WebSocketMessage {
  type: 'text_message' | 'audio_data' | 'audio_commit' | 'audio_clear';
}

// WebSocket Connection States
export type WSConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'reconnecting' 
  | 'error';

// Audio Recording States
export type RecordingStatus = 
  | 'idle' 
  | 'requesting_permission' 
  | 'recording' 
  | 'stopping' 
  | 'processing' 
  | 'error';

// Chat Interface States
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  connectionStatus: WSConnectionStatus;
  recordingStatus: RecordingStatus;
  error?: string;
}

// OpenAI Integration Types
export interface OpenAIRealtimeConfig {
  model: string;
  instructions: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  temperature?: number;
  max_response_output_tokens?: number;
}

// Session Management Types
export interface SessionConfig {
  userId: string;
  sessionTimeout: number; // in milliseconds
  maxMessages: number;
  autoSave: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: Date;
}

// Spiritual Guidance Context Types
export interface SpiritualContext {
  type: 'general' | 'festival' | 'philosophy' | 'daily_practice' | 'meditation';
  prompt: string;
  examples?: string[];
  keywords?: string[];
}

// Demo Configuration Types
export interface DemoConfig {
  maxSessionDuration: number; // in milliseconds
  maxMessagesPerSession: number;
  enableVoice: boolean;
  enableTextToSpeech: boolean;
  defaultSpiritualContext: SpiritualContext;
}

// Audio Processing Types
export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  duration?: number;
}

export interface AudioQueue {
  chunks: AudioChunk[];
  totalDuration: number;
  isComplete: boolean;
}

// WebSocket Event Handler Types
export interface WSEventHandlers {
  onSessionUpdate?: (event: WSRealtimeEvent) => void;
  onConversationItemCreated?: (event: WSRealtimeEvent) => void;
  onResponseCreated?: (event: WSRealtimeEvent) => void;
  onResponseDone?: (event: WSRealtimeEvent) => void;
  onResponseAudioDelta?: (event: WSRealtimeEvent) => void;
  onResponseAudioDone?: (event: WSRealtimeEvent) => void;
  onResponseTextDelta?: (event: WSRealtimeEvent) => void;
  onResponseTextDone?: (event: WSRealtimeEvent) => void;
  onInputAudioBufferSpeechStarted?: (event: WSRealtimeEvent) => void;
  onInputAudioBufferSpeechStopped?: (event: WSRealtimeEvent) => void;
  onError?: (event: WSRealtimeEvent) => void;
  onUnknownEvent?: (event: WSRealtimeEvent) => void;
}

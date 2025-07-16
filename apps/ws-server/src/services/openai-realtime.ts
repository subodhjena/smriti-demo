import OpenAI from 'openai';
import WebSocket from 'ws';
import { logger } from '@smriti/logger';
import { getSystemPrompt, type UserContext } from '../config/system-prompt';

// Constants
const CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_AUDIO_FORMAT = 'pcm16';
const DEFAULT_VAD_THRESHOLD = 0.5;
const DEFAULT_VAD_PREFIX_PADDING_MS = 300;
const DEFAULT_VAD_SILENCE_DURATION_MS = 500;

export interface RealtimeConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  temperature?: number;
  maxResponseOutputTokens?: number;
  instructions?: string;
  promptVariant?: UserContext;
  tools?: Array<OpenAI.Chat.Completions.ChatCompletionTool>;
}

export interface RealtimeEventHandler {
  onOpenAIEvent?: (event: any) => void;
  onOpenAIError?: (error: any) => void;
}

export class OpenAIRealtimeService {
  private openai: OpenAI;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private eventHandlers: RealtimeEventHandler = {};
  private config: RealtimeConfig;
  private isConnected = false;

  constructor(apiKey?: string, config: RealtimeConfig = {}) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    this.config = {
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      temperature: 0.8,
      maxResponseOutputTokens: 4096,
      instructions: config.instructions || getSystemPrompt(config.promptVariant),
      promptVariant: 'default',
      ...config,
    };
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Already connected to OpenAI Realtime API');
      return;
    }

    try {
      const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;

      // Ensure we have a valid API key
      if (
        !this.openai.apiKey ||
        this.openai.apiKey.includes('your_openai_api_key_here')
      ) {
        throw new Error('Invalid or missing OpenAI API key');
      }

      logger.info('Connecting to OpenAI Realtime API', {
        url,
        model: this.config.model,
      });

      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.openai.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      this.setupWebSocketHandlers();

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket connection'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, CONNECTION_TIMEOUT_MS);

        this.ws.once('open', () => {
          clearTimeout(timeoutId);
          this.isConnected = true;
          logger.info('Connected to OpenAI Realtime API');
          this.initializeSession()
            .then(() => {
              resolve();
            })
            .catch((error) => {
              logger.error('Failed to initialize session', error);
              reject(error);
            });
        });

        this.ws.once('error', (error) => {
          clearTimeout(timeoutId);
          logger.error('Failed to connect to OpenAI Realtime API', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error connecting to OpenAI Realtime API', error);
      throw error;
    }
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.sessionId = null;
      logger.info('Disconnected from OpenAI Realtime API');
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        this.handleServerEvent(event);
      } catch (error) {
        logger.error('Error parsing WebSocket message', error);
      }
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      this.sessionId = null;
      logger.info('WebSocket connection closed');
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error', error);
      this.eventHandlers.onOpenAIError?.(error);
    });
  }

  /**
   * Handle server events from OpenAI
   * Now simply forwards all events to the handler without processing
   */
  private handleServerEvent(event: any): void {
    logger.debug('Received OpenAI event', {
      type: event.type,
      sessionId: this.sessionId,
      eventId: event.event_id,
    });

    // Set session ID if this is a session.created event
    if (event.type === 'session.created') {
      this.sessionId = event.session.id;
    }

    // Handle errors specially
    if (event.type === 'error') {
      logger.error('OpenAI Realtime API error', event.error);
      this.eventHandlers.onOpenAIError?.(event.error);
      return;
    }

    // Forward all other events directly
    this.eventHandlers.onOpenAIEvent?.(event);
  }

  /**
   * Initialize session with configuration
   */
  private async initializeSession(): Promise<void> {
    await this.sendEvent({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: DEFAULT_AUDIO_FORMAT,
        output_audio_format: DEFAULT_AUDIO_FORMAT,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: DEFAULT_VAD_THRESHOLD,
          prefix_padding_ms: DEFAULT_VAD_PREFIX_PADDING_MS,
          silence_duration_ms: DEFAULT_VAD_SILENCE_DURATION_MS,
        },
        tools: this.config.tools || [],
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxResponseOutputTokens,
      },
    });

    logger.info('Session initialized with audio configuration', {
      inputFormat: DEFAULT_AUDIO_FORMAT,
      outputFormat: DEFAULT_AUDIO_FORMAT,
      vadThreshold: DEFAULT_VAD_THRESHOLD,
      sessionId: this.sessionId,
    });
  }

  /**
   * Send event to OpenAI Realtime API
   */
  async sendEvent(event: any): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    try {
      // Add event_id if not present (required by OpenAI API)
      if (!event.event_id) {
        event.event_id = `event_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }

      const eventData = JSON.stringify(event);
      this.ws.send(eventData);

      logger.openaiEvent(`client.${event.type}`, this.sessionId || undefined, {
        eventId: event.event_id,
        eventSize: eventData.length,
      });

      // Log audio events specifically for debugging
      if (event.type === 'input_audio_buffer.append') {
        logger.debug('Sent audio append event to OpenAI', {
          eventId: event.event_id,
          audioSize: event.audio?.length || 0,
          sessionId: this.sessionId,
        });
      }
    } catch (error) {
      logger.error('Error sending event to OpenAI', error);
      throw error;
    }
  }

  /**
   * Send text message to the conversation
   */
  async sendTextMessage(text: string): Promise<void> {
    logger.debug('Sending text message to OpenAI', {
      text,
      sessionId: this.sessionId,
    });

    await this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    });

    logger.debug('Creating response from OpenAI', {
      sessionId: this.sessionId,
    });

    // Use the new createResponse method
    await this.createResponse();
  }

  /**
   * Send audio data to the conversation
   */
  async sendAudioData(audioData: string | Buffer): Promise<void> {
    const base64Audio =
      typeof audioData === 'string' ? audioData : audioData.toString('base64');

    // Enhanced debugging for audio data
    logger.debug('Sending audio data to OpenAI', {
      audioType: typeof audioData,
      originalSize: audioData.length,
      base64Size: base64Audio.length,
      firstChars: base64Audio.substring(0, 50),
      isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(base64Audio),
      sessionId: this.sessionId,
    });

    // Verify audio data is not empty
    if (!base64Audio || base64Audio.length === 0) {
      logger.error('Attempted to send empty audio data to OpenAI', {
        sessionId: this.sessionId,
      });
      throw new Error('Audio data is empty');
    }

    // Calculate expected PCM16 duration for verification
    try {
      const decodedSize = (base64Audio.length * 3) / 4; // Approximate decoded size
      const samples = decodedSize / 2; // 16-bit = 2 bytes per sample
      const durationMs = (samples / 24000) * 1000; // 24kHz sample rate

      logger.debug('Audio data analysis', {
        decodedBytes: Math.round(decodedSize),
        samples: Math.round(samples),
        expectedDurationMs: Math.round(durationMs),
        sessionId: this.sessionId,
      });

      // Warn if duration seems too short
      if (durationMs < 10) {
        logger.warn('Audio chunk duration may be too short', {
          durationMs: Math.round(durationMs),
          sessionId: this.sessionId,
        });
      }
    } catch (analysisError) {
      logger.warn('Could not analyze audio data', {
        error:
          analysisError instanceof Error
            ? analysisError.message
            : 'Unknown error',
        sessionId: this.sessionId,
      });
    }

    await this.sendEvent({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });

    logger.debug('Audio data sent to OpenAI successfully', {
      audioSize: base64Audio.length,
      sessionId: this.sessionId,
    });
  }

  /**
   * Commit audio buffer
   */
  async commitAudioBuffer(): Promise<void> {
    await this.sendEvent({
      type: 'input_audio_buffer.commit',
    });

    // Use the new createResponse method
    await this.createResponse();
  }

  /**
   * Cancel current response
   */
  async cancelResponse(): Promise<void> {
    await this.sendEvent({
      type: 'response.cancel',
    });
  }

  /**
   * Clear audio buffer
   */
  async clearAudioBuffer(): Promise<void> {
    await this.sendEvent({
      type: 'input_audio_buffer.clear',
    });
  }

  /**
   * Configure turn detection (VAD)
   */
  async configureTurnDetection(config: {
    type: 'server_vad' | null;
    threshold?: number;
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  }): Promise<void> {
    const turnDetection =
      config.type === null
        ? null
        : {
            type: config.type,
            threshold: config.threshold || DEFAULT_VAD_THRESHOLD,
            prefix_padding_ms:
              config.prefixPaddingMs || DEFAULT_VAD_PREFIX_PADDING_MS,
            silence_duration_ms:
              config.silenceDurationMs || DEFAULT_VAD_SILENCE_DURATION_MS,
          };

    await this.sendEvent({
      type: 'session.update',
      session: {
        turn_detection: turnDetection,
      },
    });
  }

  /**
   * Create response with custom configuration
   */
  async createResponse(config?: {
    modalities?: ('text' | 'audio')[];
    instructions?: string;
    voice?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<void> {
    const responseEvent: any = {
      type: 'response.create',
    };

    if (config) {
      responseEvent.response = {};

      if (config.modalities) {
        responseEvent.response.modalities = config.modalities;
      }
      if (config.instructions) {
        responseEvent.response.instructions = config.instructions;
      }
      if (config.voice) {
        responseEvent.response.voice = config.voice;
      }
      if (config.temperature !== undefined) {
        responseEvent.response.temperature = config.temperature;
      }
      if (config.maxOutputTokens) {
        responseEvent.response.max_response_output_tokens =
          config.maxOutputTokens;
      }
    }

    await this.sendEvent(responseEvent);
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: RealtimeEventHandler): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Update session configuration
   */
  async updateSession(config: Partial<RealtimeConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    await this.sendEvent({
      type: 'session.update',
      session: {
        instructions: this.config.instructions,
        voice: this.config.voice,
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxResponseOutputTokens,
        tools: this.config.tools,
      },
    });
  }

  /**
   * Get connection status
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

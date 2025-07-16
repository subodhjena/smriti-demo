import { useState, useCallback, useRef } from 'react';
import { WebSocketMessage } from '@smriti/types';

/**
 * Represents a message in the conversation
 */
interface OpenAIMessage {
  /** Unique identifier for the message */
  id: string;
  /** Text content of the message */
  content: string;
  /** Who sent the message */
  sender: 'user' | 'ai';
  /** When the message was created */
  timestamp: Date;
  /** Current processing status of the message */
  status: 'sending' | 'sent' | 'receiving' | 'completed' | 'error';
}

/**
 * OpenAI Realtime API event structure
 */
interface OpenAIEvent {
  /** Event type from OpenAI */
  type: string;
  /** Event ID (optional) */
  event_id?: string;
  /** Response ID for tracking responses */
  response_id?: string;
  /** Item ID for tracking conversation items */
  item_id?: string;
  /** Delta content for streaming */
  delta?: string;
  /** Complete text content */
  text?: string;
  /** Audio transcript content */
  transcript?: string;
  /** Item data for conversation items */
  item?: {
    id?: string;
    role?: string;
    content?: any;
  };
  /** Error information */
  error?: {
    message?: string;
    code?: string;
  };
  /** Rate limit information */
  rate_limits?: any;
  /** Additional event data */
  [key: string]: any;
}

/**
 * Configuration options for the OpenAI messages hook
 */
interface UseOpenAIMessagesOptions {
  /** Callback fired when a new message is added */
  onMessage?: (message: OpenAIMessage) => void;
  /** Callback fired when an error occurs */
  onError?: (error: string) => void;
  /** Callback fired when AI starts/stops responding */
  onResponseStateChange?: (isResponding: boolean) => void;
  /** Callback fired when audio chunk is received from AI */
  onAudioChunk?: (audioData: string) => void;
  /** Callback fired when audio transcript is received */
  onAudioTranscript?: (transcript: string, messageId: string) => void;
  /** Callback fired when a new AI response starts */
  onResponseStart?: () => void;
}

/**
 * Return type for the OpenAI messages hook
 */
interface UseOpenAIMessagesReturn {
  /** Array of all messages in the conversation */
  messages: OpenAIMessage[];
  /** Function to send a text message */
  sendTextMessage: (text: string) => void;
  /** Function to send audio data to OpenAI */
  sendAudioChunk: (audioData: string) => void;
  /** Function to commit audio buffer and request response */
  commitAudioAndRespond: () => void;
  /** Function to clear audio input buffer */
  clearAudioBuffer: () => void;
  /** Whether the AI is currently generating a response */
  isAIResponding: boolean;
  /** Function to clear all messages */
  clearMessages: () => void;
  /** Function to handle OpenAI events from WebSocket */
  handleOpenAIEvent: (event: OpenAIEvent) => void;
  /** Number of messages sent in current session */
  messageCount: number;
  /** Whether there was an error with the last message */
  hasError: boolean;
}

/**
 * Hook for managing OpenAI Realtime API messages and conversation state.
 * Handles text message sending, streaming responses, and real-time event processing.
 * 
 * @param sendWebSocketMessage Function to send messages through WebSocket
 * @param options Configuration options
 * @returns Message state and control functions
 * 
 * @example
 * ```tsx
 * const { messages, sendTextMessage, isAIResponding } = useOpenAIMessages(
 *   sendMessage,
 *   {
 *     onError: (error) => toast.error(error),
 *     onMessage: (message) => console.log('New message:', message)
 *   }
 * );
 * ```
 */
export function useOpenAIMessages(
  sendWebSocketMessage: (message: WebSocketMessage) => boolean,
  options: UseOpenAIMessagesOptions = {}
): UseOpenAIMessagesReturn {
  const { onMessage, onError, onResponseStateChange, onAudioChunk, onAudioTranscript, onResponseStart } = options;
  
  // Message state
  const [messages, setMessages] = useState<OpenAIMessage[]>([]);
  const [isAIResponding, setIsAIResponding] = useState(false);
  
  // Track current AI response being built for streaming
  const currentAIResponseRef = useRef<{
    id: string;
    content: string;
    responseId: string;
    itemId: string;
  } | null>(null);

  // Use refs for callbacks to avoid unnecessary re-renders
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onResponseStateChangeRef = useRef(onResponseStateChange);
  const onAudioChunkRef = useRef(onAudioChunk);
  const onAudioTranscriptRef = useRef(onAudioTranscript);
  const onResponseStartRef = useRef(onResponseStart);

  // Update refs when callbacks change
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;
  onResponseStateChangeRef.current = onResponseStateChange;
  onAudioChunkRef.current = onAudioChunk;
  onAudioTranscriptRef.current = onAudioTranscript;
  onResponseStartRef.current = onResponseStart;

  // Derived state
  const messageCount = messages.filter(msg => msg.sender === 'user').length;
  const hasError = messages.some(msg => msg.status === 'error');

  /**
   * Adds a new message to the conversation
   */
  const addMessage = useCallback((message: OpenAIMessage) => {
    setMessages(prev => [...prev, message]);
    onMessageRef.current?.(message);
  }, []);

  /**
   * Updates an existing message by ID
   */
  const updateMessage = useCallback((id: string, updates: Partial<OpenAIMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  /**
   * Generates a unique message ID
   */
  const generateMessageId = useCallback((prefix = 'msg') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Updates AI responding state and notifies listeners
   */
  const updateAIRespondingState = useCallback((responding: boolean) => {
    setIsAIResponding(responding);
    onResponseStateChangeRef.current?.(responding);
  }, []);

  /**
   * Sends a text message to the OpenAI API via WebSocket
   */
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) {
      onErrorRef.current?.('Message cannot be empty');
      return;
    }

    // Validate message length (could be made configurable)
    if (text.length > 1000) {
      onErrorRef.current?.('Message is too long. Please keep it under 1000 characters.');
      return;
    }

    const messageId = generateMessageId('user');
    
    // Add user message to UI immediately with optimistic update
    const userMessage: OpenAIMessage = {
      id: messageId,
      content: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };
    
    addMessage(userMessage);

    try {
      // Create conversation item for OpenAI Realtime API
      const conversationEvent: WebSocketMessage = {
        type: 'openai_event',
        payload: {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: text.trim(),
              },
            ],
          },
        },
        timestamp: new Date().toISOString(),
      };

      // Send conversation item
      const conversationSent = sendWebSocketMessage(conversationEvent);
      
      if (conversationSent) {
        // Update message status to sent
        updateMessage(messageId, { status: 'sent' });
        
        // Request AI response (text modality only)
        const responseEvent: WebSocketMessage = {
          type: 'openai_event',
          payload: {
            type: 'response.create',
            response: {
              modalities: ['text'],
            },
          },
          timestamp: new Date().toISOString(),
        };
        
        const responseSent = sendWebSocketMessage(responseEvent);
        
        if (responseSent) {
          updateAIRespondingState(true);
        } else {
          updateMessage(messageId, { status: 'error' });
          onErrorRef.current?.('Failed to request AI response');
        }
      } else {
        updateMessage(messageId, { status: 'error' });
        onErrorRef.current?.('Failed to send message to server');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      updateMessage(messageId, { status: 'error' });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorRef.current?.(`Failed to send message: ${errorMessage}`);
    }
  }, [sendWebSocketMessage, addMessage, updateMessage, generateMessageId, updateAIRespondingState]);

  /**
   * Sends audio data to OpenAI Realtime API via WebSocket
   */
  const sendAudioChunk = useCallback((audioData: string) => {
    try {
      console.log('📡 Sending audio chunk to WebSocket, size:', audioData.length);
      const audioEvent: WebSocketMessage = {
        type: 'openai_event',
        payload: {
          type: 'input_audio_buffer.append',
          audio: audioData,
        },
        timestamp: new Date().toISOString(),
      };

      const sent = sendWebSocketMessage(audioEvent);
      if (!sent) {
        console.error('❌ Failed to send audio chunk to WebSocket');
        onErrorRef.current?.('Failed to send audio data to server');
      } else {
        console.log('✅ Audio chunk sent successfully');
      }
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorRef.current?.(`Failed to send audio: ${errorMessage}`);
    }
  }, [sendWebSocketMessage]);

  /**
   * Commits the audio buffer and requests an AI response
   */
  const commitAudioAndRespond = useCallback(() => {
    try {
      // Commit the input audio buffer
      const commitEvent: WebSocketMessage = {
        type: 'openai_event',
        payload: {
          type: 'input_audio_buffer.commit',
        },
        timestamp: new Date().toISOString(),
      };

      const commitSent = sendWebSocketMessage(commitEvent);
      
      if (commitSent) {
        // Request AI response with both text and audio modalities
        const responseEvent: WebSocketMessage = {
          type: 'openai_event',
          payload: {
            type: 'response.create',
            response: {
              modalities: ['text', 'audio'],
            },
          },
          timestamp: new Date().toISOString(),
        };
        
        const responseSent = sendWebSocketMessage(responseEvent);
        
        if (responseSent) {
          updateAIRespondingState(true);
        } else {
          onErrorRef.current?.('Failed to request AI response');
        }
      } else {
        onErrorRef.current?.('Failed to commit audio buffer');
      }
    } catch (error) {
      console.error('Error committing audio and requesting response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorRef.current?.(`Failed to process audio: ${errorMessage}`);
    }
  }, [sendWebSocketMessage, updateAIRespondingState]);

  /**
   * Clears the input audio buffer
   */
  const clearAudioBuffer = useCallback(() => {
    try {
      console.log('🧹 Clearing audio buffer');
      const clearEvent: WebSocketMessage = {
        type: 'openai_event',
        payload: {
          type: 'input_audio_buffer.clear',
        },
        timestamp: new Date().toISOString(),
      };

      const sent = sendWebSocketMessage(clearEvent);
      if (!sent) {
        console.error('❌ Failed to clear audio buffer');
        onErrorRef.current?.('Failed to clear audio buffer');
      } else {
        console.log('✅ Audio buffer cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing audio buffer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onErrorRef.current?.(`Failed to clear audio buffer: ${errorMessage}`);
    }
  }, [sendWebSocketMessage]);

  /**
   * Handles OpenAI Realtime API events received via WebSocket
   */
  const handleOpenAIEvent = useCallback((event: OpenAIEvent) => {
    console.log('OpenAI Event:', event.type, event);

    try {
      switch (event.type) {
        case 'response.created':
          // AI response started
          console.log('🔄 New AI response starting - resetting audio chunk flag');
          updateAIRespondingState(true);
          onResponseStartRef.current?.();
          break;

        case 'response.output_item.added':
          // New AI response item started
          if (event.item?.role === 'assistant') {
            const aiMessageId = generateMessageId('ai');
            
            currentAIResponseRef.current = {
              id: aiMessageId,
              content: '',
              responseId: event.response_id || '',
              itemId: event.item.id || '',
            };

            const aiMessage: OpenAIMessage = {
              id: aiMessageId,
              content: '',
              sender: 'ai',
              timestamp: new Date(),
              status: 'receiving',
            };
            
            addMessage(aiMessage);
          }
          break;

        case 'response.text.delta':
          // Streaming text content
          if (currentAIResponseRef.current && event.delta) {
            currentAIResponseRef.current.content += event.delta;
            
            updateMessage(currentAIResponseRef.current.id, {
              content: currentAIResponseRef.current.content,
              status: 'receiving',
            });
          }
          break;

        case 'response.text.done':
          // Text response completed
          if (currentAIResponseRef.current && event.text) {
            updateMessage(currentAIResponseRef.current.id, {
              content: event.text,
              status: 'completed',
            });
          }
          break;

        case 'response.audio.delta':
          // Streaming audio content
          if (event.delta) {
            onAudioChunkRef.current?.(event.delta);
          }
          break;

        case 'response.audio.done':
          // Audio response completed
          console.log('Audio response completed');
          break;

        case 'response.audio_transcript.delta':
          // Streaming audio transcript
          if (currentAIResponseRef.current && event.delta) {
            currentAIResponseRef.current.content += event.delta;
            
            updateMessage(currentAIResponseRef.current.id, {
              content: currentAIResponseRef.current.content,
              status: 'receiving',
            });
          }
          break;

        case 'response.audio_transcript.done':
          // Audio transcript completed
          if (currentAIResponseRef.current && event.transcript) {
            updateMessage(currentAIResponseRef.current.id, {
              content: event.transcript,
              status: 'completed',
            });
            onAudioTranscriptRef.current?.(event.transcript, currentAIResponseRef.current.id);
          }
          break;

        case 'input_audio_buffer.speech_started':
          // User started speaking
          console.log('Speech started detected');
          break;

        case 'input_audio_buffer.speech_stopped':
          // User stopped speaking
          console.log('Speech stopped detected');
          break;

        case 'input_audio_buffer.committed':
          // Audio buffer committed successfully
          console.log('Audio buffer committed');
          break;

        case 'input_audio_buffer.cleared':
          // Audio buffer cleared successfully
          console.log('Audio buffer cleared');
          break;

        case 'response.done':
          // Entire response completed
          updateAIRespondingState(false);
          
          if (currentAIResponseRef.current) {
            updateMessage(currentAIResponseRef.current.id, {
              status: 'completed',
            });
            currentAIResponseRef.current = null;
          }
          break;

        case 'error': {
          // Handle errors from OpenAI
          updateAIRespondingState(false);
          
          const errorMessage = event.error?.message || 'Unknown OpenAI error occurred';
          onErrorRef.current?.(errorMessage);
          
          if (currentAIResponseRef.current) {
            updateMessage(currentAIResponseRef.current.id, {
              status: 'error',
              content: currentAIResponseRef.current.content || 'Error generating response',
            });
            currentAIResponseRef.current = null;
          }
          break;
        }

        case 'rate_limits.updated':
          // Log rate limit information for monitoring
          console.log('OpenAI Rate Limits:', event.rate_limits);
          break;

        case 'session.created':
        case 'session.updated':
          // Session management events - mostly informational
          console.log('OpenAI Session Event:', event.type);
          break;

        default:
          // Log unhandled events for debugging
          console.log('Unhandled OpenAI event:', event.type, event);
      }
    } catch (eventError) {
      console.error('Error handling OpenAI event:', eventError);
      const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown event handling error';
      onErrorRef.current?.(`Event processing error: ${errorMessage}`);
      
      // Clean up any ongoing response
      if (currentAIResponseRef.current) {
        updateMessage(currentAIResponseRef.current.id, {
          status: 'error',
        });
        currentAIResponseRef.current = null;
      }
      updateAIRespondingState(false);
    }
  }, [addMessage, updateMessage, generateMessageId, updateAIRespondingState]);

  /**
   * Clears all messages and resets conversation state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    currentAIResponseRef.current = null;
    updateAIRespondingState(false);
  }, [updateAIRespondingState]);

  return {
    messages,
    sendTextMessage,
    sendAudioChunk,
    commitAudioAndRespond,
    clearAudioBuffer,
    isAIResponding,
    clearMessages,
    handleOpenAIEvent,
    messageCount,
    hasError,
  };
} 
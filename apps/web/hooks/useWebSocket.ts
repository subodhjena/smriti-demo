import { useState, useEffect, useRef, useCallback } from 'react';
import { WSConnectionStatus, WebSocketMessage } from '@smriti/types';
import { API_ENDPOINTS, CONNECTION_CONFIG } from '@smriti/constants';

/**
 * Configuration options for the WebSocket hook
 */
interface UseWebSocketOptions {
  /** Whether to automatically connect on mount. Defaults to true */
  autoConnect?: boolean;
  /** Callback fired when a message is received */
  onMessage?: (message: WebSocketMessage) => void;
  /** Callback fired when an OpenAI event is received */
  onOpenAIEvent?: (event: any) => void;
  /** Callback fired when connection opens */
  onOpen?: () => void;
  /** Callback fired when connection closes */
  onClose?: () => void;
  /** Callback fired when an error occurs */
  onError?: (error: Event) => void;
}

/**
 * Return type for the WebSocket hook
 */
interface UseWebSocketReturn {
  /** Current connection status */
  connectionStatus: WSConnectionStatus;
  /** Function to manually initiate connection */
  connect: () => void;
  /** Function to manually disconnect */
  disconnect: () => void;
  /** Function to send a message. Returns true if successful */
  sendMessage: (message: WebSocketMessage) => boolean;
  /** Last received message */
  lastMessage: WebSocketMessage | null;
  /** Current error message, if any */
  error: string | null;
  /** Whether the hook is currently attempting to reconnect */
  isReconnecting: boolean;
}

/**
 * Custom React hook for managing WebSocket connections with automatic reconnection,
 * error handling, and OpenAI Realtime API integration.
 * 
 * @param options Configuration options for the WebSocket connection
 * @returns WebSocket connection state and control functions
 * 
 * @example
 * ```tsx
 * const { connectionStatus, sendMessage, error } = useWebSocket({
 *   autoConnect: true,
 *   onMessage: (message) => console.log('Received:', message),
 *   onError: (error) => console.error('WebSocket error:', error)
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    onMessage,
    onOpenAIEvent,
    onOpen,
    onClose,
    onError,
  } = options;

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<WSConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Internal refs for connection management
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  // Use refs for callbacks to avoid recreating connect function
  const onMessageRef = useRef(onMessage);
  const onOpenAIEventRef = useRef(onOpenAIEvent);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change (this won't trigger re-renders)
  onMessageRef.current = onMessage;
  onOpenAIEventRef.current = onOpenAIEvent;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  // Derived state
  const isReconnecting = connectionStatus === 'reconnecting';

  /**
   * Clears any pending reconnection timeout
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Initiates a WebSocket connection with full error handling and event setup
   */
  const connect = useCallback(() => {
    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('connecting');
    setError(null);
    isManualDisconnectRef.current = false;

    try {
      const wsUrl = API_ENDPOINTS.WS_URL;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Connection opened successfully
      ws.onopen = () => {
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        clearReconnectTimeout();
        onOpenRef.current?.();
      };

      // Message received from server
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current?.(message);

          // Handle OpenAI-specific events
          if (message.type === 'openai_event' && onOpenAIEventRef.current) {
            onOpenAIEventRef.current(message.payload);
          }
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          setError(`Failed to parse message: ${errorMessage}`);
        }
      };

      // Connection closed
      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        onCloseRef.current?.();

        // Only attempt reconnection if:
        // 1. Not manually disconnected
        // 2. Haven't exceeded max reconnection attempts
        // 3. Close wasn't due to a permanent error (codes 1002, 1003, 1005)
        const permanentErrorCodes = [1002, 1003, 1005];
        const shouldReconnect = !isManualDisconnectRef.current 
          && reconnectAttemptsRef.current < CONNECTION_CONFIG.RECONNECT_ATTEMPTS
          && !permanentErrorCodes.includes(event.code);

        if (shouldReconnect) {
          setConnectionStatus('reconnecting');
          reconnectAttemptsRef.current++;
          
          // Use exponential backoff for reconnection
          const backoffDelay = Math.min(
            CONNECTION_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000 // Max 30 seconds
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... attempt ${reconnectAttemptsRef.current}/${CONNECTION_CONFIG.RECONNECT_ATTEMPTS}`);
            connect();
          }, backoffDelay);
        } else if (reconnectAttemptsRef.current >= CONNECTION_CONFIG.RECONNECT_ATTEMPTS) {
          setError('Connection failed after multiple attempts');
        }
      };

      // Connection error
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionStatus('error');
        setError('Connection failed');
        onErrorRef.current?.(event);
      };

    } catch (initError) {
      console.error('Failed to create WebSocket connection:', initError);
      setConnectionStatus('error');
      const errorMessage = initError instanceof Error ? initError.message : 'Unknown initialization error';
      setError(`Failed to initialize connection: ${errorMessage}`);
    }
  }, [clearReconnectTimeout]);

  /**
   * Manually disconnects the WebSocket connection
   */
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect'); // Normal closure
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setError(null);
  }, [clearReconnectTimeout]);

  /**
   * Sends a message through the WebSocket connection
   * @param message The message to send
   * @returns true if the message was sent successfully, false otherwise
   */
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (sendError) {
        console.error('Failed to send WebSocket message:', sendError);
        const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown send error';
        setError(`Failed to send message: ${errorMessage}`);
        return false;
      }
    }
    
    // Connection not ready
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      setError('Connection is still establishing. Please wait.');
    } else {
      setError('Not connected to server');
    }
    
    return false;
  }, []);

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup function
    return () => {
      isManualDisconnectRef.current = true;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [autoConnect, connect, clearReconnectTimeout]);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    error,
    isReconnecting,
  };
} 
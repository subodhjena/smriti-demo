import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '@smriti/logger';
import { OpenAIRealtimeService } from '../services/openai-realtime';
import { 
  connectionContexts, 
  openaiServices, 
  generateConnectionId, 
  authenticateConnection, 
  sendWelcomeMessage, 
  handleDisconnection 
} from './connection-utils';
import { createOpenAIProxy } from './openai-proxy';
import { handleMessage } from './message-handlers';
import { ConnectionContext } from '../types';

/**
 * Main WebSocket connection handler
 */
export function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  logger.websocketEvent('connection_attempt', undefined, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    ip: req.socket.remoteAddress,
    url: req.url
  });

  // Initialize connection context
  const connectionId = generateConnectionId();
  
  // Extract and validate authentication token
  authenticateConnection(ws, req, connectionId)
    .then((context) => {
      if (context) {
        setupAuthenticatedConnection(ws, context);
      } else {
        logger.warn('Authentication failed for connection', { connectionId });
        ws.close(1008, 'Authentication failed');
      }
    })
    .catch((error) => {
      logger.error('Authentication error', error);
      ws.close(1011, 'Authentication error');
    });
}

/**
 * Set up an authenticated WebSocket connection
 */
async function setupAuthenticatedConnection(ws: WebSocket, context: ConnectionContext): Promise<void> {
  // Store connection context
  connectionContexts.set(ws, context);
  
  logger.websocketEvent('connection_authenticated', context.sessionId, {
    userId: context.userId,
    authenticated: context.authenticated
  });

  try {
    // Initialize OpenAI Realtime service for this session
    const openaiService = new OpenAIRealtimeService();
    openaiServices.set(context.sessionId, openaiService);

    // Set up OpenAI proxy handlers
    const proxyHandlers = createOpenAIProxy(ws, context);
    openaiService.setEventHandlers(proxyHandlers);

    // Connect to OpenAI Realtime API
    await openaiService.connect();

    // Set up WebSocket event handlers
    setupWebSocketHandlers(ws, context, openaiService);

    // Send welcome message
    sendWelcomeMessage(ws, context);

    logger.websocketEvent('connection_established', context.sessionId);

  } catch (error) {
    logger.error('Failed to initialize OpenAI service', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: context.sessionId 
    });
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Failed to initialize AI service' },
      timestamp: new Date().toISOString(),
      sessionId: context.sessionId
    }));
    ws.close(1011, 'Service initialization failed');
  }
}

/**
 * Set up WebSocket event handlers for the connection
 */
function setupWebSocketHandlers(
  ws: WebSocket, 
  context: ConnectionContext, 
  openaiService: OpenAIRealtimeService
): void {
  // Handle incoming messages
  ws.on('message', (data) => {
    handleMessage(ws, data, context, openaiService);
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    handleDisconnection(ws, context, code, reason);
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    logger.error('WebSocket connection error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: context.sessionId,
      userId: context.userId
    });
  });
} 
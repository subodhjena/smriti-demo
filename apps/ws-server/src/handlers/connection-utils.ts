import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '@smriti/logger';
import { authService } from '../services/auth';
import { sessionService } from '../services/session';
import { ConnectionContext } from '../types';
import { OpenAIRealtimeService } from '../services/openai-realtime';

// Store connection contexts and OpenAI services
export const connectionContexts = new Map<WebSocket, ConnectionContext>();
export const openaiServices = new Map<string, OpenAIRealtimeService>();

/**
 * Generate unique connection ID
 */
export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Authenticate WebSocket connection
 */
export async function authenticateConnection(
  ws: WebSocket, 
  req: IncomingMessage, 
  connectionId: string
): Promise<ConnectionContext | null> {
  try {
    // Extract token from request
    const token = authService.extractTokenFromRequest(req.url || '', req.headers);
    
    if (!token) {
      // For demo purposes, allow connections without tokens but mark as unauthenticated
      logger.info('No authentication token provided, creating demo session');
      const demoUserId = `demo_user_${Date.now()}`;
      const sessionId = sessionService.createSession(demoUserId, connectionId);
      
      return {
        sessionId,
        userId: demoUserId,
        authenticated: false,
        connectionTime: new Date()
      };
    }

    // Validate token
    const authData = await authService.validateToken(token);
    if (!authData) {
      return null;
    }

    // Create session
    const sessionId = sessionService.createSession(authData.userId, connectionId);
    
    const context: ConnectionContext = {
      sessionId,
      userId: authData.userId,
      authenticated: true,
      connectionTime: new Date()
    };

    return context;
  } catch (error) {
    logger.error('Authentication process error', error);
    return null;
  }
}

/**
 * Send welcome message to client
 */
export function sendWelcomeMessage(ws: WebSocket, context: ConnectionContext): void {
  ws.send(JSON.stringify({
    type: 'welcome',
    payload: { 
      message: 'Connected to Smriti AI Guidance',
      sessionId: context.sessionId,
      userId: context.userId,
      authenticated: context.authenticated,
      features: ['text_chat', 'voice_chat', 'spiritual_guidance']
    },
    timestamp: new Date().toISOString(),
    sessionId: context.sessionId
  }));
}

/**
 * Clean up connection resources
 */
export function handleDisconnection(
  ws: WebSocket, 
  context: ConnectionContext, 
  code: number, 
  reason: Buffer
): void {
  logger.websocketEvent('connection_closed', context.sessionId, {
    userId: context.userId,
    code,
    reason: reason.toString()
  });
  
  // Clean up OpenAI service
  const openaiService = openaiServices.get(context.sessionId);
  if (openaiService) {
    openaiService.disconnect();
    openaiServices.delete(context.sessionId);
  }
  
  // Clean up session
  sessionService.endSession(context.sessionId);
  
  // Remove connection context
  connectionContexts.delete(ws);
} 
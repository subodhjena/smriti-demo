import { WebSocket } from 'ws';
import { logger } from '@smriti/logger';
import { ConnectionContext } from '../types';
import { OpenAIRealtimeService } from '../services/openai-realtime';

/**
 * Simple proxy for OpenAI Realtime events
 * Forwards all events directly to the client without processing
 */
export function createOpenAIProxy(ws: WebSocket, context: ConnectionContext) {
  return {
    // Forward all OpenAI events directly to the client
    onOpenAIEvent: (event: any) => {
      logger.debug('Proxying OpenAI event to client', {
        type: event.type,
        sessionId: context.sessionId,
        eventId: event.event_id
      });
      
      // Send raw OpenAI event directly to client
      ws.send(JSON.stringify({
        type: 'openai_event',
        payload: event,
        timestamp: new Date().toISOString(),
        sessionId: context.sessionId
      }));
    },

    onOpenAIError: (error: any) => {
      logger.error('OpenAI error', {
        error,
        sessionId: context.sessionId
      });
      
      ws.send(JSON.stringify({
        type: 'openai_error',
        payload: { error },
        timestamp: new Date().toISOString(),
        sessionId: context.sessionId
      }));
    }
  };
} 
import { WebSocket } from 'ws';
import { logger } from '@smriti/logger';
import { ConnectionContext } from '../types';
import { OpenAIRealtimeService } from '../services/openai-realtime';
import { sessionService } from '../services/session';

/**
 * Main message handler - simplified for proxy architecture
 * Routes server-specific messages or forwards OpenAI events directly
 */
export async function handleMessage(
  ws: WebSocket, 
  data: any, 
  context: ConnectionContext, 
  openaiService: OpenAIRealtimeService
): Promise<void> {
  try {
    const message = JSON.parse(data.toString());
    
    logger.debug('Message received from client', {
      type: message.type,
      sessionId: context.sessionId,
      userId: context.userId
    });
    
    // Update session activity
    sessionService.updateActivity(context.sessionId);
    
    // Handle server-specific messages
    if (message.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
        sessionId: context.sessionId
      }));
      return;
    }
    
    // Forward OpenAI realtime events directly (primary proxy function)
    if (message.type === 'openai_event' && message.payload) {
      logger.debug('Forwarding OpenAI event from client', {
        eventType: message.payload.type,
        sessionId: context.sessionId
      });
      
      await openaiService.sendEvent(message.payload);
      return;
    }
    
    // Handle legacy message types for backward compatibility
    await handleLegacyMessage(ws, message, context, openaiService);
    
  } catch (error) {
    logger.error('Error processing message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: context.sessionId
    });
    
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Invalid message format' },
      timestamp: new Date().toISOString(),
      sessionId: context.sessionId
    }));
  }
}

/**
 * Minimal legacy message support for critical backward compatibility
 * Only handles essential message types to avoid breaking existing clients
 */
async function handleLegacyMessage(
  ws: WebSocket,
  message: any,
  context: ConnectionContext,
  openaiService: OpenAIRealtimeService
): Promise<void> {
  try {
    switch (message.type) {
      case 'text_message':
        if (message.payload?.text) {
          await openaiService.sendTextMessage(message.payload.text);
        }
        break;
        
      case 'audio_data':
        if (message.payload?.audio) {
          await openaiService.sendAudioData(message.payload.audio);
        }
        break;
        
      case 'audio_commit':
        await openaiService.commitAudioBuffer();
        break;
        
      case 'audio_clear':
        await openaiService.clearAudioBuffer();
        break;
        
      default:
        logger.warn('Unknown legacy message type', { 
          type: message.type, 
          sessionId: context.sessionId 
        });
        
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: `Unknown message type: ${message.type}` },
          timestamp: new Date().toISOString(),
          sessionId: context.sessionId
        }));
    }
  } catch (error) {
    logger.error('Error processing legacy message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageType: message.type,
      sessionId: context.sessionId
    });
    
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: `Failed to process ${message.type}` },
      timestamp: new Date().toISOString(),
      sessionId: context.sessionId
    }));
  }
} 
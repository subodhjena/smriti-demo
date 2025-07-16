'use client';

import { useState, useCallback, useRef, memo } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useOpenAIMessages } from '../../hooks/useOpenAIMessages';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { Header } from './Header';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

/**
 * Main chat interface component that orchestrates the entire chat experience.
 * Manages WebSocket connection, OpenAI message flow, and user interactions.
 */
function ChatInterfaceComponent() {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Create a ref to store the OpenAI event handler to avoid re-renders
  const openAIEventHandlerRef = useRef<((event: any) => void) | null>(null);

  // Initialize WebSocket connection with a stable event handler reference
  const { connectionStatus, sendMessage, error, isReconnecting } = useWebSocket({
    autoConnect: true,
    onOpenAIEvent: (event) => {
      // Call the current handler if it exists
      openAIEventHandlerRef.current?.(event);
    },
    onMessage: (message) => {
      // Log WebSocket messages in development
      if (process.env.NODE_ENV === 'development') {
        console.log('WebSocket message received:', message);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('Connection failed');
    },
    onOpen: () => {
      console.log('WebSocket connected successfully');
      setConnectionError(null);
    },
    onClose: () => {
      console.log('WebSocket connection closed');
    }
  });

  // Ref to handle audio chunks
  const handleAudioChunkRef = useRef<((audioData: string) => void) | null>(null);

  // Initialize OpenAI messages hook with the WebSocket sendMessage function
  const {
    messages,
    sendTextMessage,
    sendAudioChunk,
    commitAudioAndRespond,
    clearAudioBuffer,
    isAIResponding,
    handleOpenAIEvent,
    messageCount
  } = useOpenAIMessages(sendMessage, {
    onError: (error) => {
      console.error('OpenAI Error:', error);
      setConnectionError(error);
    },
    onResponseStateChange: (isResponding) => {
      // Could be used for additional UI updates when AI starts/stops responding
      if (process.env.NODE_ENV === 'development') {
        console.log('AI responding state:', isResponding);
      }
    },
    onAudioChunk: (audioData) => {
      // Handle incoming audio chunks from AI
      handleAudioChunkRef.current?.(audioData);
    },
    onAudioTranscript: (transcript, messageId) => {
      console.log('Audio transcript received:', transcript);
    },
    onResponseStart: () => {
      // Reset audio chunk flag when new response starts
      voiceChat.resetAudioChunkFlag();
    }
  });

  // Initialize voice chat functionality
  const voiceChat = useVoiceChat(
    sendAudioChunk,
    commitAudioAndRespond,
    clearAudioBuffer,
    {
      onError: (error) => {
        console.error('Voice Error:', error);
        setConnectionError(error);
      },
      onStateChange: (state) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Voice state changed:', state);
        }
      },
      onTranscript: (transcript, isUser) => {
        console.log('Voice transcript:', transcript, 'isUser:', isUser);
      }
    }
  );

  // Set the audio chunk handler
  handleAudioChunkRef.current = voiceChat.onAudioChunk;

  // Update the ref with the current handler (this won't cause re-renders)
  openAIEventHandlerRef.current = handleOpenAIEvent;

  /**
   * Handles sending a text message from the user
   */
  const handleSendMessage = useCallback((content: string) => {
    if (connectionStatus !== 'connected') {
      setConnectionError('Not connected to server. Please wait...');
      return;
    }
    
    // Use the sendTextMessage function from useOpenAIMessages hook
    // This handles all the OpenAI event creation and sending
    sendTextMessage(content);
    setConnectionError(null);
  }, [connectionStatus, sendTextMessage]);

  /**
   * Handles voice conversation toggle
   */
  const handleVoiceClick = useCallback(() => {
    voiceChat.toggleConversation();
  }, [voiceChat]);

  // Determine current error state
  const currentError = error || connectionError;
  
  // Determine if input should be disabled
  const isDisabled = connectionStatus !== 'connected' || !!currentError || isAIResponding;

  /**
   * Get contextual placeholder text for the input
   */
  const getPlaceholder = () => {
    if (voiceChat.isInConversation) {
      return 'Voice conversation active...';
    }
    
    if (isAIResponding) {
      return 'Smriti is responding...';
    }
    
    if (connectionStatus === 'connecting') {
      return 'Connecting to Smriti...';
    }
    
    if (isReconnecting) {
      return 'Reconnecting...';
    }
    
    if (connectionStatus !== 'connected') {
      return 'Not connected';
    }
    
    return messageCount === 0 
      ? 'Ask Smriti for spiritual guidance...' 
      : 'Continue your conversation...';
  };

  return (
    <div className="h-screen flex flex-col bg-base-200">
      <Header 
        connectionStatus={connectionStatus} 
        error={currentError} 
      />
      
      {/* Connection Error Banner */}
      {currentError && (
        <div className="bg-error text-error-content px-4 py-2 text-center text-sm flex-shrink-0">
          <span className="font-medium">⚠ {currentError}</span>
          {isReconnecting && <span className="ml-2">Attempting to reconnect...</span>}
        </div>
      )}
      
      {/* Connection Status Info */}
      {connectionStatus === 'connecting' && !currentError && (
        <div className="bg-warning text-warning-content px-4 py-2 text-center text-sm flex-shrink-0">
          <span className="loading loading-dots loading-sm mr-2"></span>
          Connecting to Smriti AI...
        </div>
      )}
      
      {/* Reconnection Status */}
      {isReconnecting && !currentError && (
        <div className="bg-info text-info-content px-4 py-2 text-center text-sm flex-shrink-0">
          <span className="loading loading-dots loading-sm mr-2"></span>
          Reconnecting to Smriti AI...
        </div>
      )}
      
      <MessageList 
        messages={messages} 
        isAIResponding={isAIResponding} 
      />
      
      <MessageInput
        onSendMessage={handleSendMessage}
        onVoiceClick={handleVoiceClick}
        isVoiceActive={voiceChat.isInConversation}
        audioLevel={voiceChat.audioLevel}
        isAIResponding={isAIResponding}
        disabled={isDisabled}
        placeholder={getPlaceholder()}
      />
    </div>
  );
}

// Export memoized component for better performance
export const ChatInterface = memo(ChatInterfaceComponent); 
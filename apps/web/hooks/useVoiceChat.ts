'use client';

import { useState, useCallback, useRef } from 'react';
import { useRealTimeAudio } from './useRealTimeAudio';
import { useAudioPlayer } from './useAudioPlayer';

/**
 * Voice chat states
 */
type VoiceChatState = 'idle' | 'connecting' | 'conversation' | 'processing' | 'speaking' | 'error';

/**
 * Configuration options for the voice chat hook
 */
interface UseVoiceChatOptions {
  /** Auto-play AI audio responses */
  autoPlayResponses?: boolean;
  /** Callback fired when voice state changes */
  onStateChange?: (state: VoiceChatState) => void;
  /** Callback fired when an error occurs */
  onError?: (error: string) => void;
  /** Callback fired when transcript is received */
  onTranscript?: (transcript: string, isUser: boolean) => void;
}

/**
 * Return type for the voice chat hook
 */
interface UseVoiceChatReturn {
  /** Current voice chat state */
  voiceState: VoiceChatState;
  /** Whether in continuous conversation mode */
  isInConversation: boolean;
  /** Whether AI is currently speaking */
  isSpeaking: boolean;
  /** Whether microphone permission is granted */
  hasPermission: boolean | null;
  /** Current audio level (0-100) */
  audioLevel: number;
  /** Current error message */
  error: string | null;
  
  /** Start continuous conversation */
  startConversation: () => Promise<void>;
  /** Stop continuous conversation */
  stopConversation: () => void;
  /** Toggle conversation state */
  toggleConversation: () => void;
  /** Request microphone permission */
  requestPermission: () => Promise<boolean>;
  /** Clear current error */
  clearError: () => void;
  
  /** Functions to integrate with message hooks */
  onAudioChunk: (audioData: string) => Promise<void>;
  /** Reset audio chunk flag for new response */
  resetAudioChunkFlag: () => void;
}

/**
 * Custom React hook that provides continuous voice chat interface.
 * 
 * @param sendAudioChunk Function to send audio data to OpenAI
 * @param commitAudioAndRespond Function to commit audio and request response
 * @param clearAudioBuffer Function to clear the audio buffer
 * @param options Configuration options
 * @returns Voice chat state and control functions
 */
export function useVoiceChat(
  sendAudioChunkToOpenAI: (audioData: string) => void,
  commitAudioAndRespondFromOpenAI: () => void,
  clearAudioBufferFromOpenAI: () => void,
  options: UseVoiceChatOptions = {}
): UseVoiceChatReturn {
  const {
    autoPlayResponses = true,
    onStateChange,
    onError,
    onTranscript
  } = options;

  // State management
  const [voiceState, setVoiceState] = useState<VoiceChatState>('idle');
  const [isInConversation, setIsInConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent unnecessary re-renders
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);
  const onTranscriptRef = useRef(onTranscript);
  const isFirstAudioChunkRef = useRef(true);

  // Update refs when callbacks change
  onStateChangeRef.current = onStateChange;
  onErrorRef.current = onError;
  onTranscriptRef.current = onTranscript;

  /**
   * Updates voice state and notifies listeners
   */
  const updateVoiceState = useCallback((newState: VoiceChatState) => {
    console.log('🔄 Voice state changing to:', newState, '- Called from:', new Error().stack?.split('\n')[2]?.trim());
    setVoiceState(newState);
    onStateChangeRef.current?.(newState);
  }, []);

  /**
   * Handles errors from audio recording or playback
   */
  const handleError = useCallback((errorMessage: string) => {
    console.error('🚨 Voice chat error:', errorMessage);
    setError(errorMessage);
    updateVoiceState('error');
    setIsInConversation(false);
    onErrorRef.current?.(errorMessage);
  }, [updateVoiceState]);

  /**
   * Clears current error and resets to idle state
   */
  const clearError = useCallback(() => {
    setError(null);
    updateVoiceState('idle');
    setIsInConversation(false);
  }, [updateVoiceState]);

  /**
   * Resets audio chunk flag for new response
   */
  const resetAudioChunkFlag = useCallback(() => {
    console.log('🔄 Resetting audio chunk flag for new response');
    isFirstAudioChunkRef.current = true;
  }, []);

  // Audio capture hook
  const {
    audioLevel,
    hasPermission,
    startCapture: startAudioCapture,
    stopCapture: stopAudioCapture,
    requestPermission,
    error: captureError
  } = useRealTimeAudio({
    onAudioChunk: (audioData: string) => {
      // Send audio chunk to OpenAI via WebSocket
      console.log('🎤 Voice chat sending audio chunk to OpenAI, size:', audioData.length);
      sendAudioChunkToOpenAI(audioData);
    },
    onCaptureStart: () => {
      // Capture actually started - update state to conversation
      updateVoiceState('conversation');
      // Clear error without resetting state
      setError(null);
    },
    onCaptureStop: () => {
      // Don't change state on capture stop in continuous mode
      // (the conversation continues until manually stopped)
    },
    onError: handleError,
  });

  // Audio playback hook
  const {
    isPlaying: isSpeaking,
    queueAudioChunk,
    playNewAudio,
    error: playbackError
  } = useAudioPlayer({
    autoPlay: autoPlayResponses,
    onPlaybackStart: () => {
      if (voiceState === 'processing') {
        updateVoiceState('speaking');
      }
    },
    onPlaybackComplete: () => {
      // Only change state if we're currently speaking
      // Don't change state when playback completes during conversation setup
      if (voiceState === 'speaking') {
        if (isInConversation) {
          updateVoiceState('conversation');
        } else {
          updateVoiceState('idle');
        }
      }
    },
    onError: handleError,
  });

  /**
   * Starts continuous conversation
   */
  const startConversation = useCallback(async () => {
    try {
      clearError();
      updateVoiceState('connecting');
      
      // Set conversation state immediately to show stop button
      setIsInConversation(true);
      
      // Start capture - this will trigger onCaptureStart when successful
      await startAudioCapture();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      // Make sure conversation state is reset on error
      setIsInConversation(false);
      updateVoiceState('idle');
      handleError(errorMessage);
    }
  }, [startAudioCapture, clearError, handleError, updateVoiceState]);

  /**
   * Stops continuous conversation
   */
  const stopConversation = useCallback(() => {
    console.log('🛑 stopConversation called - Stack trace:', new Error().stack?.split('\n')[2]?.trim());
    try {
      // Stop capture first
      stopAudioCapture();
      
      // Update states - conversation is stopped, return to idle
      setIsInConversation(false);
      updateVoiceState('idle');
      
      // No need to commit audio - OpenAI handles responses automatically via VAD
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop conversation';
      setIsInConversation(false);
      updateVoiceState('idle');
      handleError(errorMessage);
    }
  }, [stopAudioCapture, handleError, updateVoiceState]);

  /**
   * Toggles conversation state
   */
  const toggleConversation = useCallback(() => {
    console.log('🔄 toggleConversation called - isInConversation:', isInConversation);
    if (isInConversation) {
      console.log('🔄 Calling stopConversation because isInConversation is true');
      stopConversation();
    } else {
      console.log('🔄 Calling startConversation because isInConversation is false');
      startConversation();
    }
  }, [isInConversation, startConversation, stopConversation]);

  /**
   * Handles audio chunks received from OpenAI (for playback)
   */
  const onAudioChunk = useCallback(async (audioData: string) => {
    if (isFirstAudioChunkRef.current) {
      // First chunk of new response - stop existing audio and play new
      console.log('🔊 First audio chunk of new response - stopping existing playback');
      isFirstAudioChunkRef.current = false;
      await playNewAudio(audioData);
    } else {
      // Subsequent chunks - queue normally
      console.log('🔊 Subsequent audio chunk - queueing');
      queueAudioChunk(audioData);
    }
  }, [playNewAudio, queueAudioChunk]);

  // Update error state when capture or playback errors occur
  const currentError = error || captureError || playbackError;

  return {
    voiceState,
    isInConversation,
    isSpeaking,
    hasPermission,
    audioLevel,
    error: currentError,
    
    startConversation,
    stopConversation,
    toggleConversation,
    requestPermission,
    clearError,
    
    onAudioChunk,
    resetAudioChunkFlag,
  };
} 
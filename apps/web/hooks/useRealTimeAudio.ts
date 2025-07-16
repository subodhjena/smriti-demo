'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Audio configuration for OpenAI Realtime API
 */
const AUDIO_CONFIG = {
  SAMPLE_RATE: 24000, // OpenAI requires 24kHz
  CHANNELS: 1, // Mono audio
  CHUNK_SIZE: 4096, // Size of audio chunks to process
} as const;

/**
 * Audio capture states
 */
type AudioState = 'idle' | 'requesting_permission' | 'capturing' | 'error';

/**
 * Configuration options for the real-time audio hook
 */
interface UseRealTimeAudioOptions {
  /** Callback when audio chunk is available */
  onAudioChunk?: (audioData: string) => void;
  /** Callback when capture starts */
  onCaptureStart?: () => void;
  /** Callback when capture stops */
  onCaptureStop?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when permission is granted */
  onPermissionGranted?: () => void;
  /** Callback when permission is denied */
  onPermissionDenied?: () => void;
}

/**
 * Return type for the real-time audio hook
 */
interface UseRealTimeAudioReturn {
  /** Current audio capture state */
  audioState: AudioState;
  /** Whether microphone permission is granted */
  hasPermission: boolean | null;
  /** Current audio level (0-100) */
  audioLevel: number;
  /** Current error message */
  error: string | null;
  /** Whether currently capturing audio */
  isCapturing: boolean;
  
  /** Start audio capture */
  startCapture: () => Promise<void>;
  /** Stop audio capture */
  stopCapture: () => void;
  /** Request microphone permission */
  requestPermission: () => Promise<boolean>;
  /** Clear current error */
  clearError: () => void;
}

/**
 * Custom React hook for real-time audio capture using getUserMedia.
 * Captures audio and converts it to PCM16 format for OpenAI Realtime API.
 * 
 * @param options Configuration options for audio capture
 * @returns Audio capture state and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   isCapturing, 
 *   startCapture, 
 *   stopCapture, 
 *   audioLevel 
 * } = useRealTimeAudio({
 *   onAudioChunk: (audioData) => {
 *     // Stream audio data to WebSocket
 *     sendAudioToOpenAI(audioData);
 *   },
 *   onError: (error) => {
 *     console.error('Audio error:', error);
 *   }
 * });
 * ```
 */
export function useRealTimeAudio(options: UseRealTimeAudioOptions = {}): UseRealTimeAudioReturn {
  const {
    onAudioChunk,
    onCaptureStart,
    onCaptureStop,
    onError,
    onPermissionGranted,
    onPermissionDenied
  } = options;

  // State management
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio processing
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioStateRef = useRef<AudioState>('idle');

  // Refs for callbacks to prevent unnecessary re-renders
  const onAudioChunkRef = useRef(onAudioChunk);
  const onCaptureStartRef = useRef(onCaptureStart);
  const onCaptureStopRef = useRef(onCaptureStop);
  const onErrorRef = useRef(onError);
  const onPermissionGrantedRef = useRef(onPermissionGranted);
  const onPermissionDeniedRef = useRef(onPermissionDenied);

  // Update refs when callbacks change
  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
    onCaptureStartRef.current = onCaptureStart;
    onCaptureStopRef.current = onCaptureStop;
    onErrorRef.current = onError;
    onPermissionGrantedRef.current = onPermissionGranted;
    onPermissionDeniedRef.current = onPermissionDenied;
  }, [onAudioChunk, onCaptureStart, onCaptureStop, onError, onPermissionGranted, onPermissionDenied]);

  // Update audio state ref whenever state changes
  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);

  /**
   * Converts Float32Array audio data to PCM16 format (base64 encoded)
   * as required by OpenAI Realtime API
   */
  const convertToPCM16 = useCallback((audioData: Float32Array): string => {
    const buffer = new ArrayBuffer(audioData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      // Clamp audio sample to [-1, 1] range
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      // Convert to 16-bit signed integer
      const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, pcmSample, true); // true for little-endian
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }, []);

  /**
   * Updates audio level visualization
   */
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const percentage = Math.round((average / 255) * 100);
    
    setAudioLevel(percentage);

    // Continue animation if still capturing
    if (audioStateRef.current === 'capturing') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, []);

  /**
   * Sets up audio processing pipeline
   */
  const setupAudioProcessing = useCallback((stream: MediaStream) => {
    try {
      // Create audio context with the required sample rate
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      });

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create analyser for visual feedback
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Create script processor for real-time audio data
      processorRef.current = audioContext.createScriptProcessor(AUDIO_CONFIG.CHUNK_SIZE, 1, 1);
      
      processorRef.current.onaudioprocess = (event) => {
        const currentState = audioStateRef.current;
        console.log('🎵 Audio processing event fired - audioState:', currentState);
        
        if (currentState !== 'capturing') {
          console.log('🎵 Audio processing skipped - audioState:', currentState);
          return;
        }
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to PCM16 and send via callback
        const pcm16Data = convertToPCM16(inputData);
        console.log('🎵 Audio chunk generated, size:', pcm16Data.length, 'chars');
        onAudioChunkRef.current?.(pcm16Data);
      };

      // Connect the audio graph
      source.connect(analyserRef.current);
      source.connect(processorRef.current);
      processorRef.current.connect(audioContext.destination);

      console.log('🎤 Audio processing pipeline connected successfully');
      
      // Start audio level visualization
      updateAudioLevel();

    } catch (error) {
      console.error('Error setting up audio processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup audio processing';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [convertToPCM16, updateAudioLevel]);

  /**
   * Cleans up audio resources
   */
  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset refs
    analyserRef.current = null;
    processorRef.current = null;
    
    // Reset audio level
    setAudioLevel(0);
  }, []);

  /**
   * Requests microphone permission from the user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (hasPermission) return true;

    setAudioState('requesting_permission');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
          channelCount: AUDIO_CONFIG.CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Permission granted
      setHasPermission(true);
      setAudioState('idle');
      onPermissionGrantedRef.current?.();

      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get microphone permission';
      setError(errorMessage);
      setHasPermission(false);
      setAudioState('error');
      onPermissionDeniedRef.current?.();
      onErrorRef.current?.(errorMessage);

      return false;
    }
  }, [hasPermission]);

  /**
   * Starts audio capture
   */
  const startCapture = useCallback(async (): Promise<void> => {
    if (audioState === 'capturing') return;

    // Request permission if not already granted
    if (!hasPermission) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) return;
    }

    console.log('🎤 Starting audio capture');
    setAudioState('capturing');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
          channelCount: AUDIO_CONFIG.CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up audio processing
      setupAudioProcessing(stream);

      console.log('🎤 Audio capture started successfully');
      onCaptureStartRef.current?.();

    } catch (error) {
      console.error('Error starting audio capture:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start audio capture';
      setError(errorMessage);
      setAudioState('error');
      onErrorRef.current?.(errorMessage);
    }
  }, [audioState, hasPermission, requestPermission, setupAudioProcessing]);

  /**
   * Stops audio capture
   */
  const stopCapture = useCallback(() => {
    if (audioState !== 'capturing') return;

    console.log('🎤 Stopping audio capture');
    
    cleanup();
    setAudioState('idle');
    
    console.log('🎤 Audio capture stopped');
    onCaptureStopRef.current?.();
  }, [audioState, cleanup]);

  /**
   * Clears current error and resets to idle state
   */
  const clearError = useCallback(() => {
    setError(null);
    setAudioState('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isCapturing = audioState === 'capturing';

  return {
    audioState,
    hasPermission,
    audioLevel,
    error,
    isCapturing,
    
    startCapture,
    stopCapture,
    requestPermission,
    clearError,
  };
} 
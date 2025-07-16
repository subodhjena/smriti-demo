'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Audio playback states
 */
type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Audio player configuration options
 */
interface UseAudioPlayerOptions {
  /** Callback fired when playback starts */
  onPlaybackStart?: () => void;
  /** Callback fired when playback completes */
  onPlaybackComplete?: () => void;
  /** Callback fired when an error occurs */
  onError?: (error: string) => void;
  /** Auto-play audio chunks as they arrive */
  autoPlay?: boolean;
}

/**
 * Return type for the audio player hook
 */
interface UseAudioPlayerReturn {
  /** Current playback state */
  playbackState: PlaybackState;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position (0-100) */
  playbackProgress: number;
  /** Queue an audio chunk for playback */
  queueAudioChunk: (audioData: string) => void;
  /** Start/resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Stop playback and clear queue */
  stop: () => void;
  /** Clear the audio queue */
  clearQueue: () => void;
  /** Stop current playback and play new audio */
  playNewAudio: (audioData: string) => Promise<void>;
  /** Current error message, if any */
  error: string | null;
}

/**
 * Custom React hook for playing real-time audio streams from OpenAI Realtime API.
 * Handles audio chunk queuing, Web Audio API playback, and smooth streaming.
 * 
 * @param options Configuration options for audio playback
 * @returns Audio playback state and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   isPlaying, 
 *   queueAudioChunk, 
 *   play, 
 *   stop 
 * } = useAudioPlayer({
 *   onPlaybackStart: () => console.log('Audio started'),
 *   onPlaybackComplete: () => console.log('Audio finished'),
 *   autoPlay: true
 * });
 * 
 * // Queue audio chunks as they arrive from OpenAI
 * queueAudioChunk(base64AudioData);
 * ```
 */
export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const {
    onPlaybackStart,
    onPlaybackComplete,
    onError,
    autoPlay = true
  } = options;

  // State management
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const playbackStartTimeRef = useRef(0);
  const totalDurationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Refs for callbacks to prevent unnecessary re-renders
  const onPlaybackStartRef = useRef(onPlaybackStart);
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onPlaybackStartRef.current = onPlaybackStart;
    onPlaybackCompleteRef.current = onPlaybackComplete;
    onErrorRef.current = onError;
  }, [onPlaybackStart, onPlaybackComplete, onError]);

  /**
   * Initializes audio context if not already created
   */
  const initializeAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Match OpenAI's sample rate
      });
    }

    // Resume audio context if suspended (required by browser autoplay policies)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  /**
   * Converts base64 audio data to AudioBuffer
   */
  const decodeAudioData = useCallback(async (base64Audio: string): Promise<AudioBuffer> => {
    const audioContext = await initializeAudioContext();

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create AudioBuffer from PCM16 data
      const arrayBuffer = bytes.buffer;
      const audioBuffer = audioContext.createBuffer(1, arrayBuffer.byteLength / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // Convert PCM16 to Float32Array
      const view = new DataView(arrayBuffer);
      for (let i = 0; i < channelData.length; i++) {
        const sample = view.getInt16(i * 2, true); // true for little-endian
        channelData[i] = sample / (sample < 0 ? 0x8000 : 0x7FFF);
      }

      return audioBuffer;
    } catch (error) {
      console.error('Error decoding audio data:', error);
      throw new Error('Failed to decode audio data');
    }
  }, [initializeAudioContext]);

  /**
   * Updates playback progress
   */
  const updatePlaybackProgress = useCallback(() => {
    if (!isPlayingRef.current || !audioContextRef.current) {
      return;
    }

    const currentTime = audioContextRef.current.currentTime - playbackStartTimeRef.current;
    const progress = totalDurationRef.current > 0 
      ? Math.min(100, (currentTime / totalDurationRef.current) * 100)
      : 0;

    setPlaybackProgress(progress);

    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(updatePlaybackProgress);
    }
  }, []);

  /**
   * Plays the next audio buffer in the queue
   */
  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      setPlaybackState('idle');
      setPlaybackProgress(0);
      isPlayingRef.current = false;
      onPlaybackCompleteRef.current?.();
      return;
    }

    try {
      const audioContext = await initializeAudioContext();
      const audioBuffer = audioQueueRef.current.shift()!;

      // Create audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      currentSourceRef.current = source;

      // Set up event handlers
      source.onended = () => {
        currentSourceRef.current = null;
        playNextInQueue(); // Play next chunk
      };

      // Start playback
      source.start(0);
      
      if (!isPlayingRef.current) {
        // First chunk - set up timing
        isPlayingRef.current = true;
        playbackStartTimeRef.current = audioContext.currentTime;
        totalDurationRef.current = audioBuffer.duration;
        setPlaybackState('playing');
        onPlaybackStartRef.current?.();
        updatePlaybackProgress();
      } else {
        // Additional chunks - extend total duration
        totalDurationRef.current += audioBuffer.duration;
      }

    } catch (error) {
      console.error('Error playing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setError(errorMessage);
      setPlaybackState('error');
      onErrorRef.current?.(errorMessage);
    }
  }, [initializeAudioContext, updatePlaybackProgress]);

  /**
   * Queues an audio chunk for playback
   */
  const queueAudioChunk = useCallback(async (audioData: string) => {
    try {
      setError(null);
      
      if (!audioData || audioData.length === 0) {
        console.warn('Received empty audio data');
        return;
      }

      const audioBuffer = await decodeAudioData(audioData);
      audioQueueRef.current.push(audioBuffer);

      // Auto-play if enabled and not currently playing
      if (autoPlay && !isPlayingRef.current && playbackState !== 'playing') {
        await playNextInQueue();
      }

    } catch (error) {
      console.error('Error queueing audio chunk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to queue audio';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [autoPlay, playbackState, decodeAudioData, playNextInQueue]);

  /**
   * Starts or resumes playback
   */
  const play = useCallback(async () => {
    if (playbackState === 'playing') return;

    setError(null);

    try {
      if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
        await playNextInQueue();
      } else if (currentSourceRef.current && playbackState === 'paused') {
        // Resume context if paused
        const audioContext = await initializeAudioContext();
        await audioContext.resume();
        setPlaybackState('playing');
        updatePlaybackProgress();
      }
    } catch (error) {
      console.error('Error starting playback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start playback';
      setError(errorMessage);
      setPlaybackState('error');
      onErrorRef.current?.(errorMessage);
    }
  }, [playbackState, initializeAudioContext, playNextInQueue, updatePlaybackProgress]);

  /**
   * Pauses playback
   */
  const pause = useCallback(async () => {
    if (playbackState !== 'playing') return;

    try {
      if (audioContextRef.current) {
        await audioContextRef.current.suspend();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setPlaybackState('paused');
    } catch (error) {
      console.error('Error pausing playback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause playback';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [playbackState]);

  /**
   * Stops playback and clears the queue
   */
  const stop = useCallback(() => {
    try {
      // Stop current source
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear queue and reset state
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      playbackStartTimeRef.current = 0;
      totalDurationRef.current = 0;
      
      setPlaybackState('idle');
      setPlaybackProgress(0);
      setError(null);

    } catch (error) {
      console.error('Error stopping playback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop playback';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, []);

  /**
   * Clears the audio queue without stopping current playback
   */
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
  }, []);

  /**
   * Stops current playback and clears queue, then starts new audio
   */
  const playNewAudio = useCallback(async (audioData: string) => {
    try {
      console.log('🔊 Starting new audio - stopping existing playback');
      
      // Stop any current playback and clear queue
      stop();
      
      // Queue and play the new audio
      await queueAudioChunk(audioData);
      
    } catch (error) {
      console.error('Error playing new audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to play new audio';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [stop, queueAudioChunk]);

  /**
   * Clean up resources on unmount
   */
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    playbackState,
    isPlaying: playbackState === 'playing',
    playbackProgress,
    queueAudioChunk,
    play,
    pause,
    stop,
    clearQueue,
    playNewAudio,
    error,
  };
} 
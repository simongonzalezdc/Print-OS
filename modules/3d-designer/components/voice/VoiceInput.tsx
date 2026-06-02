'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VOICE } from '@/lib/constants';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onaudiostart: ((event: Event) => void) | null;
  onaudioend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

/**
 * Voice Input Component
 * Handles speech recognition with fallback support
 */
export function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track silence timer for cleanup
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const initRecognizer = () => {
      try {
        // Check for Web Speech API support
        const SpeechRecognition =
          window.SpeechRecognition ||
          window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          setError('Speech recognition not supported in this browser');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = VOICE.CONTINUOUS;
        recognition.interimResults = VOICE.INTERIM_RESULTS;
        recognition.lang = VOICE.LANGUAGE;
        recognition.maxAlternatives = 1;

        // Event handlers
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1];
          if (!result || !result[0]) return;
          
          const text = result[0].transcript;

          setTranscript(text);

          if (result.isFinal) {
            onTranscript(text);
            setTranscript('');
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setError(getErrorMessage(event.error));
          
          // Clear any pending timer on error
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setTranscript('');
          
          // Clear timer on end
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        };

        // Timeout handling
        recognition.onaudiostart = () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        };

        recognition.onaudioend = () => {
          // Clear any existing timer first
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          silenceTimerRef.current = setTimeout(() => {
            recognition.stop();
          }, VOICE.SILENCE_TIMEOUT);
        };

        setRecognizer(recognition);
      } catch (err) {
        setError('Failed to initialize speech recognition');
        console.error('Speech recognition init error:', err);
      }
    };

    initRecognizer();

    // Cleanup function to clear timer on unmount
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [onTranscript]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (!recognizer) return;

    if (isListening) {
      recognizer.stop();
      
      // Clear timer when manually stopping
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      setError(null);
      setTranscript('');

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognizer.start();
      } catch (err) {
        setError('Microphone access denied. Please allow microphone access.');
        console.error('Microphone access error:', err);
      }
    }
  }, [recognizer, isListening]);

  // Keyboard shortcut (Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space' && !isListening) {
        e.preventDefault();
        toggleListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isListening) {
        recognizer?.stop();
        
        // Clear timer when manually stopping
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [toggleListening, isListening, recognizer]);

  const isSupported = !!recognizer;
  const canToggle = isSupported && !error;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Microphone Button */}
      <motion.button
        onClick={toggleListening}
        disabled={!canToggle}
        className={cn(
          'relative w-16 h-16 rounded-full flex items-center justify-center',
          'transition-colors duration-200',
          isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600'
        )}
        whileTap={{ scale: 0.95 }}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {!isSupported ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}

        {/* Pulse animation when listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Status Text */}
      <div className="text-sm text-center h-6 min-w-0 flex-1">
        {error && (
          <span className="text-red-400 text-xs leading-tight block">
            {error}
          </span>
        )}
        {transcript && (
          <span className="text-gray-300 italic text-xs leading-tight block">
            "{transcript}"
          </span>
        )}
        {!error && !transcript && isListening && (
          <span className="text-gray-400 text-xs">Listening...</span>
        )}
        {!error && !transcript && !isListening && canToggle && (
          <span className="text-gray-500 text-xs">Ctrl+Space</span>
        )}
        {!canToggle && !error && (
          <span className="text-gray-600 text-xs">Not supported</span>
        )}
      </div>

      {/* Browser compatibility note */}
      {!isSupported && (
        <div className="text-xs text-gray-500 text-center max-w-32 leading-tight">
          Voice input requires Chrome, Edge, or Safari
        </div>
      )}
    </div>
  );
}

/**
 * Get user-friendly error messages
 */
function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone access denied';
    case 'no-speech':
      return 'No speech detected';
    case 'aborted':
      return 'Recognition aborted';
    case 'network':
      return 'Network error';
    case 'service-not-allowed':
      return 'Speech service not allowed';
    default:
      return `Recognition error: ${error}`;
  }
}

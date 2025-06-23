import { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceBotError } from '../types';

/**
 * Hook personalizado para manejar el reconocimiento de voz
 * Utiliza la Web Speech API para transcribir audio a texto
 */
export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<VoiceBotError | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Verificar soporte del navegador
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (!SpeechRecognition) {
      setError({
        code: 'BROWSER_NOT_SUPPORTED',
        message: 'Tu navegador no soporta reconocimiento de voz'
      });
    }
  }, []);

  // Inicializar reconocimiento de voz
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configuración para español
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Eventos del reconocimiento
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Guardar el transcript final
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Error en el reconocimiento de voz';
      let errorCode = 'RECOGNITION_ERROR';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó audio. Intenta hablar más cerca del micrófono.';
          errorCode = 'NO_SPEECH';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
          errorCode = 'AUDIO_CAPTURE';
          break;
        case 'not-allowed':
          errorMessage = 'Permiso denegado para acceder al micrófono.';
          errorCode = 'PERMISSION_DENIED';
          break;
        case 'network':
          errorMessage = 'Error de red. Verifica tu conexión.';
          errorCode = 'NETWORK_ERROR';
          break;
        case 'service-not-allowed':
          errorMessage = 'Servicio de reconocimiento no disponible.';
          errorCode = 'SERVICE_NOT_ALLOWED';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError({
        code: errorCode,
        message: errorMessage,
        details: event.error
      });
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [isSupported]);

  // Iniciar reconocimiento de voz
  const startListening = useCallback(async (): Promise<string> => {
    if (!isSupported) {
      throw new Error('Reconocimiento de voz no soportado');
    }

    if (isListening) {
      throw new Error('Ya está escuchando');
    }

    return new Promise((resolve, reject) => {
      try {
        const recognition = initializeRecognition();
        if (!recognition) {
          reject(new Error('No se pudo inicializar el reconocimiento'));
          return;
        }

        recognitionRef.current = recognition;
        abortControllerRef.current = new AbortController();

        // Configurar timeout para evitar escuchar indefinidamente
        const timeoutId = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          reject(new Error('Timeout: No se detectó audio en 10 segundos'));
        }, 10000); // 10 segundos máximo

        // Override del evento onend para manejar el resultado
        const originalOnEnd = recognition.onend;
        recognition.onend = () => {
          clearTimeout(timeoutId);
          setIsListening(false);
          
          // Usar el transcript final acumulado
          const finalResult = finalTranscriptRef.current.trim();
          if (finalResult) {
            resolve(finalResult);
          } else {
            reject(new Error('No se detectó audio válido'));
          }
          
          if (originalOnEnd) {
            originalOnEnd.call(recognition, new Event('end'));
          }
        };

        recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }, [isSupported, isListening, initializeRecognition]);

  // Detener reconocimiento de voz
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsListening(false);
  }, [isListening]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpiar transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearError,
    clearTranscript
  };
} 
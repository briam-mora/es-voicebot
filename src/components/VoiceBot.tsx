import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { initializeOpenAI, getOpenAIService } from '../services/openai';
import { VoiceBotState, ChatMessage, VoiceBotError } from '../types';
import VoiceSettings from './VoiceSettings';
import { getVoiceById, getVoiceGender, VOICEBOT_CONFIG, ADMIN_UTILS } from '../utils/constants';
import { pdfService } from '../services/pdfService';
import PDFUpload from './PDFUpload';

/**
 * Componente principal del VoiceBot
 * Integra reconocimiento de voz, chat con OpenAI y TTS
 */
const VoiceBot: React.FC = () => {
  const [state, setState] = useState<VoiceBotState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<VoiceBotError | null>(null);
  const [currentVoice, setCurrentVoice] = useState('nova');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tokenStats, setTokenStats] = useState<{
    maxTokens: number;
    maxWords: number;
    maxCharacters: number;
    tokenSavingEnabled: boolean;
  } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [lastRagContext, setLastRagContext] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const initialized = useRef(false);

  const {
    isListening,
    transcript,
    error: recognitionError,
    isSupported,
    startListening,
    stopListening,
    clearError: clearRecognitionError,
    clearTranscript
  } = useVoiceRecognition();

  // Obtener información de la voz actual
  const currentVoiceInfo = getVoiceById(currentVoice);
  const voiceGender = getVoiceGender(currentVoice);

  // Inicialización única del componente
  useEffect(() => {
    // Evitar doble inicialización en modo estricto de React
    if (initialized.current) return;
    initialized.current = true;

    // --- Configuración inicial ---
    const adminMode = ADMIN_UTILS.isAdminMode();
    setIsAdminMode(adminMode);
    console.log(adminMode ? '🔧 Modo admin activado' : '👤 Modo cliente activado');

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError({
        code: 'MISSING_API_KEY',
        message: 'Falta la clave de API de OpenAI. Configura VITE_OPENAI_API_KEY en tu .env'
      });
      return;
    }

    try {
      initializeOpenAI({
        openaiApiKey: apiKey,
        model: 'gpt-4o',
        voice: currentVoice,
        language: 'es-ES',
        maxTokens: VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_TOKENS,
        temperature: 0.7
      });
      if (adminMode) {
        const openaiService = getOpenAIService();
        setTokenStats(openaiService.getTokenStats());
      }
    } catch (err) {
      setError({
        code: 'INIT_ERROR',
        message: 'Error al inicializar OpenAI',
        details: err
      });
    }

    // --- Carga de PDF local ---
    const loadLocalPdf = async () => {
      if (VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED && VOICEBOT_CONFIG.KNOWLEDGE_BASE.LOCAL_PDF.ENABLED) {
        try {
          console.log(`Cargando PDF local desde: ${VOICEBOT_CONFIG.KNOWLEDGE_BASE.LOCAL_PDF.PATH}`);
          const response = await fetch(VOICEBOT_CONFIG.KNOWLEDGE_BASE.LOCAL_PDF.PATH);
          
          if (!response.ok) {
            throw new Error(`No se pudo encontrar el PDF en ${VOICEBOT_CONFIG.KNOWLEDGE_BASE.LOCAL_PDF.PATH}`);
          }

          const blob = await response.blob();
          const file = new File([blob], 'knowledge_base.pdf', { type: 'application/pdf' });
          
          const result = await pdfService.processPDF(file);
          if (result.success) {
            console.log('✅ PDF local procesado y añadido a la base de conocimiento.');
          } else {
            console.error('❌ Error al procesar PDF local:', result.message);
          }
        } catch (error) {
          console.error('❌ Falló la carga del PDF local:', error);
        }
      }
    };

    loadLocalPdf();
  }, [currentVoice]); // Dependencia de `currentVoice` para reinicializar si cambia

  // Manejar cambios en modo admin si la URL cambia dinámicamente
  useEffect(() => {
    const handleUrlChange = () => {
      const adminMode = ADMIN_UTILS.isAdminMode();
      setIsAdminMode(adminMode);
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Manejar errores de reconocimiento
  useEffect(() => {
    if (recognitionError) {
      setError(recognitionError);
      setState('error');
    }
  }, [recognitionError]);

  // Limpiar recursos de audio al desmontar
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  /**
   * Maneja el cambio de voz
   */
  const handleVoiceChange = useCallback((newVoice: string) => {
    setCurrentVoice(newVoice);
    
    // Actualizar la configuración de OpenAI con la nueva voz
    try {
      const openaiService = getOpenAIService();
      openaiService.updateConfig({ voice: newVoice });
      
      // Mostrar información del cambio en consola solo en modo admin
      if (isAdminMode) {
        const newVoiceInfo = getVoiceById(newVoice);
        const newGender = getVoiceGender(newVoice);
        console.log(`Voz cambiada a: ${newVoiceInfo?.name} (${newGender})`);
      }
    } catch (err) {
      console.error('Error al actualizar la voz:', err);
    }
  }, [isAdminMode]);

  /**
   * Detiene completamente el audio y el reconocimiento
   */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  /**
   * Maneja el flujo completo de conversación
   */
  const handleConversation = useCallback(async () => {
    if (state !== 'idle') return;

    try {
      setState('listening');
      setError(null);
      clearRecognitionError();

      // 1. Escuchar y transcribir
      if (isAdminMode) {
        console.log('Iniciando reconocimiento de voz...');
      }
      const userInput = await startListening();
      if (isAdminMode) {
        console.log('Transcript recibido:', userInput);
      }
      
      if (!userInput || !userInput.trim()) {
        throw new Error('No se detectó audio válido');
      }

      // Agregar mensaje del usuario
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userInput,
        timestamp: new Date()
      };

      // Usar un ID de placeholder para el mensaje del asistente
      const assistantMessageId = (Date.now() + 1).toString();
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '__TYPING__', // Identificador para el indicador de escritura
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, placeholderMessage]);
      setState('processing');

      // 2. Obtener respuesta de OpenAI
      if (isAdminMode) {
        console.log('Enviando a OpenAI...');
      }
      const openaiService = getOpenAIService();
      const response = await openaiService.sendChatMessage(
        [...getAllMessages(), userMessage],
        (context: string | null) => setLastRagContext(context)
      );

      // 3. Convertir a audio
      if (isAdminMode) {
        console.log('Convirtiendo a audio...');
      }
      const ttsResponse = await openaiService.textToSpeech(response);
      
      // 4. Actualizar mensaje y reproducir audio
      setState('speaking');

      // Crear el mensaje final del asistente
      const assistantMessage: ChatMessage = {
        id: assistantMessageId, // Usar el mismo ID para reemplazar
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      // Reemplazar el placeholder con el mensaje final
      setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? assistantMessage : msg));
      setCurrentResponse(response);

      // Limpiar URL anterior si existe
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Crear nueva URL para el audio
      audioUrlRef.current = URL.createObjectURL(ttsResponse.audio);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
        await audioRef.current.play();
      }

      // Limpiar transcript
      clearTranscript();

    } catch (err) {
      console.error('Error en conversación:', err);
      setError({
        code: 'CONVERSATION_ERROR',
        message: err instanceof Error ? err.message : 'Error en la conversación',
        details: isAdminMode ? err : undefined
      });
      setState('error');
      stopListening();
    }
  }, [state, messages, startListening, stopListening, clearRecognitionError, clearTranscript, isAdminMode]);

  /**
   * Detiene la conversación actual
   */
  const handleStop = useCallback(() => {
    if (isAdminMode) {
      console.log('Deteniendo conversación...');
    }
    
    // Detener reconocimiento de voz
    stopListening();
    
    // Detener audio si está reproduciéndose
    stopAudio();
    
    // Resetear estado
    setState('idle');
    setError(null);
    clearRecognitionError();
    setCurrentResponse('');
  }, [stopListening, stopAudio, clearRecognitionError, isAdminMode]);

  /**
   * Maneja el final de la reproducción de audio
   */
  const handleAudioEnded = useCallback(() => {
    setState('idle');
    setCurrentResponse('');
  }, []);

  /**
   * Limpia el historial de mensajes
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
    setError(null);
  }, []);

  /**
   * Obtiene el mensaje de bienvenida
   */
  const getWelcomeMessage = useCallback((): ChatMessage => {
    return {
      id: 'welcome',
      role: VOICEBOT_CONFIG.UI.WELCOME_MESSAGE.role,
      content: VOICEBOT_CONFIG.UI.WELCOME_MESSAGE.content,
      timestamp: new Date()
    };
  }, []);

  /**
   * Obtiene todos los mensajes incluyendo el de bienvenida
   */
  const getAllMessages = useCallback((): ChatMessage[] => {
    const welcomeMessage = VOICEBOT_CONFIG.UI.WELCOME_MESSAGE.enabled ? [getWelcomeMessage()] : [];
    return [...welcomeMessage, ...messages];
  }, [messages, getWelcomeMessage]);

  // Renderizar mensaje de error si no hay soporte
  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-sm">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Navegador no compatible
          </div>
          <p className="text-red-500 text-sm">
            Tu navegador no soporta reconocimiento de voz. 
            Prueba con Chrome, Edge o Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header con configuración de voz solo en modo admin */}
      {isAdminMode && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Voz: {currentVoiceInfo?.name}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {voiceGender === 'female' ? '👩 Femenina' : 
               voiceGender === 'male' ? '👨 Masculina' : 
               '⚪ Neutral'}
            </span>
          </div>
          
          {/* Configuración de voz */}
          <VoiceSettings
            currentVoice={currentVoice}
            onVoiceChange={handleVoiceChange}
            isOpen={isSettingsOpen}
            onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
            onError={(errorMessage) => {
              setError({
                code: 'VOICE_PREVIEW_ERROR',
                message: errorMessage
              });
            }}
          />
        </div>
      )}

      {/* Panel de Admin para gestión de KB */}
      {isAdminMode && VOICEBOT_CONFIG.KNOWLEDGE_BASE.PDF_UPLOAD.ENABLED && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <PDFUpload />
        </div>
      )}

      {/* Panel de Debug de RAG */}
      {isAdminMode && VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                🕵️‍♂️ Panel de Debug de KB
            </h4>
            {lastRagContext ? (
                <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p className="font-bold">Contexto recuperado para la última pregunta:</p>
                    <pre className="whitespace-pre-wrap bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded">
                        {lastRagContext}
                    </pre>
                </div>
            ) : (
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    No se recuperó contexto para la última pregunta. El agente usará su conocimiento general (si no está restringido).
                </p>
            )}
        </div>
      )}

      {/* Historial de mensajes - siempre visible */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Conversación ({getAllMessages().length})
            </h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar
            </button>
          </div>
          
          <div className="space-y-3">
            {getAllMessages().slice(-VOICEBOT_CONFIG.UI.MAX_MESSAGES_DISPLAY).map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && message.content === '__TYPING__' ? (
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  <div className="text-sm">{message.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error.message}
                </p>
                {/* Detalles de error solo en modo admin */}
                {isAdminMode && error.code && (
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Código: {error.code}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado actual y transcript */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {state === 'idle' && 'Presiona el botón para hablar'}
            {state === 'listening' && 'Escuchando...'}
            {state === 'processing' && 'Procesando...'}
            {state === 'speaking' && 'Respondiendo...'}
            {state === 'error' && 'Error'}
          </p>
          
          {/* Transcript solo en modo admin */}
          {isAdminMode && transcript && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              "{transcript}"
            </p>
          )}
        </div>

        {/* Botón de control principal */}
        <div className="flex justify-center">
          {state === 'idle' && (
            <button
              onClick={handleConversation}
              className="bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full font-medium transition-colors duration-200 flex items-center justify-center shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {(state === 'listening' || state === 'processing' || state === 'speaking') && (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full font-medium transition-colors duration-200 flex items-center justify-center shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Indicador de estado visual */}
        <div className="flex justify-center mt-3">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            state === 'listening' 
              ? 'bg-red-500 animate-pulse' 
              : state === 'processing' 
              ? 'bg-yellow-500 animate-pulse'
              : state === 'speaking'
              ? 'bg-green-500 animate-pulse'
              : 'bg-gray-400'
          }`}></div>
        </div>
      </div>

      {/* Elemento de audio oculto */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          setError({
            code: 'AUDIO_ERROR',
            message: 'Error al reproducir el audio'
          });
          setState('error');
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default VoiceBot; 
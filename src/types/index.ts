// Estados del voicebot
export type VoiceBotState = 
  | 'idle'           // Estado inicial
  | 'listening'      // Escuchando audio
  | 'processing'     // Procesando con OpenAI
  | 'speaking'       // Reproduciendo respuesta
  | 'error';         // Error

// Interfaz para mensajes de chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Configuración del voicebot
export interface VoiceBotConfig {
  openaiApiKey: string;
  model: string;
  voice: string;
  language: string;
  maxTokens?: number;
  temperature?: number;
}

// Respuesta de OpenAI TTS
export interface TTSResponse {
  audio: Blob;
  duration: number;
}

// Error personalizado
export interface VoiceBotError {
  code: string;
  message: string;
  details?: any;
}

// Información de una voz
export interface Voice {
    id: 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer';
    name: string;
    language: 'es-ES' | 'en-US';
    gender: 'female' | 'male' | 'neutral';
    description: string;
    recommended: boolean;
} 
/**
 * Constantes de configuración del VoiceBot
 */

export const VOICEBOT_CONFIG = {
  // Configuración por defecto de OpenAI
  DEFAULT_MODEL: 'gpt-4o',
  DEFAULT_VOICE: 'nova',
  DEFAULT_LANGUAGE: 'es-ES',
  DEFAULT_MAX_TOKENS: 150, // Reducido para ahorrar tokens
  DEFAULT_TEMPERATURE: 0.7,
  
  // Límites de respuesta para ahorrar tokens
  RESPONSE_LIMITS: {
    MAX_TOKENS: 500,           // Máximo tokens por respuesta
    MAX_CHARACTERS: 500,       // Máximo caracteres por respuesta
    MAX_WORDS: 100,             // Máximo palabras por respuesta
    MIN_TOKENS: 20,            // Mínimo tokens para respuestas útiles
  },
  
  // Configuración de ahorro de tokens
  TOKEN_SAVING: {
    ENABLED: true,             // Habilitar límites de tokens
    TRUNCATE_LONG_RESPONSES: true, // Truncar respuestas largas
    COMPRESS_SYSTEM_PROMPT: true,  // Comprimir prompt del sistema
  },
  
  // Configuración de modo admin
  ADMIN: {
    URL_PARAM: 'admin',        // Parámetro de URL para activar modo admin
    DEFAULT_VALUE: 'false',    // Valor por defecto
    FEATURES: {
      VOICE_SELECTOR: true,    // Selector de voces
      TOKEN_STATS: true,       // Estadísticas de tokens
      CONVERSATION_HISTORY: false, // Historial siempre visible (no es feature admin)
      ERROR_DETAILS: true,     // Detalles de errores
      DEBUG_INFO: true,        // Información de debug
      SETTINGS_BUTTON: true,   // Botón de configuración
    }
  },
  
  // Timeouts y límites
  SPEECH_TIMEOUT: 10000, // 10 segundos
  MAX_CONVERSATION_LENGTH: 20, // Reducido para ahorrar tokens
  
  // Estados del voicebot
  STATES: {
    IDLE: 'idle',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    SPEAKING: 'speaking',
    ERROR: 'error'
  } as const,
  
  // Mensajes de error
  ERROR_MESSAGES: {
    BROWSER_NOT_SUPPORTED: 'Tu navegador no soporta reconocimiento de voz',
    MISSING_API_KEY: 'Falta la clave de API de OpenAI',
    NO_SPEECH: 'No se detectó audio. Intenta hablar más cerca del micrófono.',
    PERMISSION_DENIED: 'Permiso denegado para acceder al micrófono.',
    NETWORK_ERROR: 'Error de red. Verifica tu conexión.',
    AUDIO_ERROR: 'Error al reproducir el audio',
    CONVERSATION_ERROR: 'Error en la conversación',
    RESPONSE_TOO_LONG: 'Respuesta demasiado larga. Intenta ser más específico.'
  },
  
  // Configuración de UI
  UI: {
    ANIMATION_DURATION: 300,
    MAX_MESSAGES_DISPLAY: 3, // Reducido para mejor rendimiento
    WIDGET_DEFAULT_WIDTH: '400px',
    WIDGET_DEFAULT_HEIGHT: '600px',
    WELCOME_MESSAGE: {
      enabled: true,
      content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      role: 'assistant' as const
    }
  },
  
  // Configuración de TTS
  TTS: {
    MODEL: 'tts-1', // Modelo estándar para mejor pronunciación en español
    QUALITY: 'Standard' // Calidad estándar
  },
  
  // Configuración de base de conocimiento
  KNOWLEDGE_BASE: {
    ENABLED: true, // Habilitar/deshabilitar sistema de KB
    LOCAL_PDF: {
      ENABLED: true, // Habilitar para cargar un PDF local al inicio
      PATH: '/knowledge_base.pdf', // Ruta en la carpeta `public`
    },
    PDF_UPLOAD: {
      ENABLED: false, // Subida de PDFs
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: ['application/pdf'] as const,
      CHUNK_SIZE: 1000, // Tamaño de chunks para procesamiento
      OVERLAP: 200, // Overlap entre chunks
    },
    VECTOR_STORE: {
      PROVIDER: 'openai', // 'openai', 'pinecone', 'weaviate', etc.
      EMBEDDING_MODEL: 'text-embedding-3-small',
      SIMILARITY_TOP_K: 3, // Número de chunks similares a recuperar
    },
    RAG: {
      CONTEXT_WINDOW: 4000, // Tokens para contexto
      TEMPERATURE: 0.2, // Reducir la temperatura para respuestas más predecibles
      SYSTEM_PROMPT: "Se te proporcionará un contexto extraído de documentos. Debes usar EXCLUSIVAMENTE esta información para responder la pregunta del usuario. Si la respuesta no se encuentra en el contexto proporcionado, DEBES indicar amablemente que no tienes la información. NO intentes adivinar ni usar conocimiento externo. Cíñete estrictamente a los hechos del texto."
    }
  },
  
  // Configuración de la personalidad del agente
  AGENT_PERSONA: {
    ENABLED: true, // Habilitar para usar un contexto de personalidad
    CONTEXT: "Actúa como un mesero amigable y eficiente de un restaurante. Tu rol es ayudar con preguntas sobre el menú y el servicio, basándote únicamente en la información que se te proporciona."
  }
} as const;

/**
 * Utilidades para manejo del modo admin
 */
export const ADMIN_UTILS = {
  /**
   * Verifica si el modo admin está activo
   */
  isAdminMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(VOICEBOT_CONFIG.ADMIN.URL_PARAM) === 'true';
  },

  /**
   * Obtiene el valor de un parámetro de URL
   */
  getUrlParam(param: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Verifica si una característica admin está habilitada
   */
  isFeatureEnabled(feature: keyof typeof VOICEBOT_CONFIG.ADMIN.FEATURES): boolean {
    if (!this.isAdminMode()) return false;
    return VOICEBOT_CONFIG.ADMIN.FEATURES[feature];
  },

  /**
   * Obtiene la URL actual con modo admin activado
   */
  getAdminUrl(): string {
    if (typeof window === 'undefined') return '';
    
    const url = new URL(window.location.href);
    url.searchParams.set(VOICEBOT_CONFIG.ADMIN.URL_PARAM, 'true');
    return url.toString();
  },

  /**
   * Obtiene la URL actual sin modo admin
   */
  getClientUrl(): string {
    if (typeof window === 'undefined') return '';
    
    const url = new URL(window.location.href);
    url.searchParams.delete(VOICEBOT_CONFIG.ADMIN.URL_PARAM);
    return url.toString();
  }
};

/**
 * Voces disponibles para TTS
 * Nota: OpenAI TTS tiene 6 voces disponibles, optimizadas para español
 */
export const AVAILABLE_VOICES = [
  // Voces recomendadas para español
  { 
    id: 'nova', 
    name: 'Nova', 
    language: 'es-ES', 
    gender: 'female',
    description: 'Voz femenina clara y natural',
    recommended: true
  },
  { 
    id: 'alloy', 
    name: 'Alloy', 
    language: 'en-US', 
    gender: 'neutral',
    description: 'Voz neutral versátil',
    recommended: false
  },
  { 
    id: 'echo', 
    name: 'Echo', 
    language: 'en-US', 
    gender: 'male',
    description: 'Voz masculina profunda',
    recommended: false
  },
  { 
    id: 'fable', 
    name: 'Fable', 
    language: 'en-US', 
    gender: 'male',
    description: 'Voz masculina cálida',
    recommended: false
  },
  { 
    id: 'onyx', 
    name: 'Onyx', 
    language: 'en-US', 
    gender: 'male',
    description: 'Voz masculina autoritaria',
    recommended: false
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer', 
    language: 'en-US', 
    gender: 'female',
    description: 'Voz femenina suave',
    recommended: false
  }
] as const;

/**
 * Obtiene la información de una voz por su ID
 */
export const getVoiceById = (voiceId: string) => {
  return AVAILABLE_VOICES.find(voice => voice.id === voiceId);
};

/**
 * Obtiene el género de una voz
 */
export const getVoiceGender = (voiceId: string): 'male' | 'female' | 'neutral' => {
  const voice = getVoiceById(voiceId);
  return voice?.gender || 'neutral';
};

/**
 * Genera un prompt específico según el género de la voz (versión comprimida)
 */
export const generateGenderSpecificPrompt = (voiceId: string, language: string = 'es-ES'): string => {
  const gender = getVoiceGender(voiceId);
  const voiceName = getVoiceById(voiceId)?.name || 'Asistente';
  
  let personaDescription = '';
  if (VOICEBOT_CONFIG.AGENT_PERSONA.ENABLED && VOICEBOT_CONFIG.AGENT_PERSONA.CONTEXT) {
      personaDescription = VOICEBOT_CONFIG.AGENT_PERSONA.CONTEXT;
  } else {
      const genderDesc = gender === 'female' ? 'asistente femenina' : gender === 'male' ? 'asistente masculino' : 'asistente virtual';
      personaDescription = `Eres ${voiceName}, ${genderDesc}.`;
  }
  
  const languageInstructions = (language === 'es-ES' || language === 'es-MX') ? 'Responde en español' : `Respond in ${language}`;
  const constraints = `máximo ${VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_WORDS} palabras. Sé conciso y útil.`;

  return `${personaDescription} ${languageInstructions}, ${constraints}`;
};

/**
 * Trunca una respuesta si excede los límites configurados
 */
export const truncateResponse = (response: string): string => {
  const { MAX_CHARACTERS, MAX_WORDS } = VOICEBOT_CONFIG.RESPONSE_LIMITS;
  
  // Contar palabras
  const words = response.trim().split(/\s+/);
  if (words.length > MAX_WORDS) {
    const truncatedWords = words.slice(0, MAX_WORDS);
    return truncatedWords.join(' ') + '...';
  }
  
  // Contar caracteres
  if (response.length > MAX_CHARACTERS) {
    return response.substring(0, MAX_CHARACTERS) + '...';
  }
  
  return response;
};

/**
 * Valida si una respuesta cumple con los límites
 */
export const validateResponseLength = (response: string): { isValid: boolean; reason?: string } => {
  const { MAX_CHARACTERS, MAX_WORDS, MIN_TOKENS } = VOICEBOT_CONFIG.RESPONSE_LIMITS;
  
  const words = response.trim().split(/\s+/);
  const wordCount = words.length;
  const charCount = response.length;
  
  // Verificar mínimo
  if (wordCount < 3) {
    return { isValid: false, reason: 'Respuesta demasiado corta' };
  }
  
  // Verificar máximo
  if (wordCount > MAX_WORDS) {
    return { isValid: false, reason: `Máximo ${MAX_WORDS} palabras permitidas` };
  }
  
  if (charCount > MAX_CHARACTERS) {
    return { isValid: false, reason: `Máximo ${MAX_CHARACTERS} caracteres permitidos` };
  }
  
  return { isValid: true };
};

/**
 * Voces filtradas por idioma
 */
export const getVoicesByLanguage = (language: string) => {
  return AVAILABLE_VOICES.filter(voice => voice.language === language);
};

/**
 * Voces recomendadas para español
 */
export const getRecommendedVoices = () => {
  return AVAILABLE_VOICES.filter(voice => voice.recommended);
};

/**
 * Modelos de OpenAI disponibles
 */
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Modelo más avanzado' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Modelo rápido y económico' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Modelo balanceado' }
] as const;

/**
 * Configuración para diferentes idiomas
 */
export const LANGUAGE_CONFIG = {
  'es-ES': {
    name: 'Español (España)',
    flag: '🇪🇸',
    greeting: '¡Hola! ¿En qué puedo ayudarte?',
    voices: getVoicesByLanguage('es-ES')
  },
  'es-MX': {
    name: 'Español (México)',
    flag: '🇲🇽',
    greeting: '¡Hola! ¿En qué puedo ayudarte?',
    voices: getVoicesByLanguage('es-ES') // Mismo que España por ahora
  },
  'en-US': {
    name: 'English (US)',
    flag: '🇺🇸',
    greeting: 'Hello! How can I help you?',
    voices: getVoicesByLanguage('en-US')
  }
} as const; 
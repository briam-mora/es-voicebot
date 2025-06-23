import OpenAI from 'openai';
import { ChatMessage, VoiceBotConfig, TTSResponse } from '../types';
import { 
  generateGenderSpecificPrompt, 
  VOICEBOT_CONFIG, 
  truncateResponse, 
  validateResponseLength,
  getVoiceGender
} from '../utils/constants';
import { pdfService } from './pdfService';

interface OpenAIConfig {
  openaiApiKey: string;
  model: string;
  voice: string;
  language: string;
  maxTokens: number;
  temperature: number;
}

interface TokenStats {
  maxTokens: number;
  maxWords: number;
  maxCharacters: number;
  tokenSavingEnabled: boolean;
}

/**
 * Servicio para interactuar con las APIs de OpenAI
 * Maneja tanto el chat (GPT-4) como el text-to-speech (TTS)
 */
export class OpenAIService {
  private openai: OpenAI | null = null;
  private config: OpenAIConfig;
  private systemPrompt: string;
  private tokenStats: TokenStats;

  constructor() {
    this.config = {
      openaiApiKey: '',
      model: 'gpt-4o',
      voice: 'nova',
      language: 'es-ES',
      maxTokens: VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_TOKENS,
      temperature: 0.7
    };

    this.systemPrompt = generateGenderSpecificPrompt(this.config.voice, this.config.language);

    this.tokenStats = {
      maxTokens: VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_TOKENS,
      maxWords: VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_WORDS,
      maxCharacters: VOICEBOT_CONFIG.RESPONSE_LIMITS.MAX_CHARACTERS,
      tokenSavingEnabled: VOICEBOT_CONFIG.TOKEN_SAVING.ENABLED
    };
  }

  /**
   * Inicializa el servicio de OpenAI
   */
  initialize(config: OpenAIConfig): void {
    this.config = { ...this.config, ...config };
    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(updates: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Regenerar el prompt del sistema si cambió la voz
    if (updates.voice) {
      this.systemPrompt = generateGenderSpecificPrompt(
        updates.voice, 
        this.config.language
      );
      console.log('Prompt actualizado para voz:', updates.voice);
      console.log('Nuevo prompt:', this.systemPrompt);
    }
  }

  /**
   * Obtiene estadísticas de tokens
   */
  getTokenStats(): TokenStats {
    return { ...this.tokenStats };
  }

  /**
   * Envía un mensaje al chat con RAG si está habilitado
   */
  async sendChatMessage(
    messages: ChatMessage[],
    onContextRetrieved?: (context: string | null) => void
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI no está inicializado');
    }

    try {
      // Obtener el último mensaje del usuario
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        throw new Error('No hay mensaje de usuario');
      }

      // Obtener contexto relevante si RAG está habilitado
      let context: string | null = null;
      if (VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED) {
        context = await pdfService.getRelevantContext(lastUserMessage.content);
        if (context) {
          console.log('Contexto RAG encontrado:', context.substring(0, 100) + '...');
        }
      }
      
      // Llama al callback con el contexto
      onContextRetrieved?.(context);

      // Generar prompt del sistema con contexto
      const systemPrompt = this.generateSystemPrompt(context || '');

      // Preparar mensajes para OpenAI
      const openAIMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      console.log(`Enviando mensaje con límite de ${this.config.maxTokens} tokens`);

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: openAIMessages,
        max_tokens: this.config.maxTokens,
        temperature: VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED 
          ? VOICEBOT_CONFIG.KNOWLEDGE_BASE.RAG.TEMPERATURE 
          : this.config.temperature,
        stream: false
      });

      let responseText = response.choices[0]?.message?.content || '';

      // Aplicar límites de respuesta si está habilitado
      if (VOICEBOT_CONFIG.TOKEN_SAVING.ENABLED) {
        responseText = this.applyResponseLimits(responseText);
      }

      // Log de tokens usados
      const usage = response.usage;
      if (usage) {
        console.log(`Tokens usados: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);
      }

      return responseText;

    } catch (error) {
      console.error('Error en OpenAI chat:', error);
      throw error;
    }
  }

  /**
   * Genera el prompt del sistema con contexto RAG
   */
  private generateSystemPrompt(context: string = ''): string {
    const { AGENT_PERSONA, KNOWLEDGE_BASE, RESPONSE_LIMITS } = VOICEBOT_CONFIG;
    let finalPrompt = '';

    // 1. Define la personalidad base del agente.
    if (AGENT_PERSONA.ENABLED && AGENT_PERSONA.CONTEXT) {
      finalPrompt = AGENT_PERSONA.CONTEXT;
    } else {
      // Fallback a la personalidad genérica por género de voz.
      const genderDesc = getVoiceGender(this.config.voice) === 'female' ? 'asistente femenina' : 
                         getVoiceGender(this.config.voice) === 'male' ? 'asistente masculino' : 
                         'asistente virtual';
      finalPrompt = `Eres un ${genderDesc}.`;
    }

    // 2. Agrega las instrucciones RAG y el contexto si está habilitado.
    if (context && KNOWLEDGE_BASE.ENABLED) {
      const ragInstructions = KNOWLEDGE_BASE.RAG.SYSTEM_PROMPT;
      finalPrompt += `\n\n${ragInstructions}\n\n--- INICIO DEL CONTEXTO ---\n${context}\n--- FIN DEL CONTEXTO ---`;
    }

    // 3. Agrega restricciones finales de formato.
    const languageInstructions = (this.config.language === 'es-ES' || this.config.language === 'es-MX') 
      ? 'Responde siempre en español.' 
      : `Respond in ${this.config.language}.`;
    const constraints = `Mantén tus respuestas por debajo de ${RESPONSE_LIMITS.MAX_WORDS} palabras.`;
    finalPrompt += `\n\n${languageInstructions} ${constraints}`;

    console.log("System Prompt Final:", finalPrompt);
    return finalPrompt;
  }

  /**
   * Aplica límites a la respuesta
   */
  private applyResponseLimits(response: string): string {
    const { MAX_WORDS, MAX_CHARACTERS } = VOICEBOT_CONFIG.RESPONSE_LIMITS;
    
    // Contar palabras
    const words = response.trim().split(/\s+/);
    if (words.length > MAX_WORDS) {
      const truncatedWords = words.slice(0, MAX_WORDS);
      console.log('Respuesta truncada para cumplir límites');
      return truncatedWords.join(' ') + '...';
    }
    
    // Contar caracteres
    if (response.length > MAX_CHARACTERS) {
      console.log('Respuesta truncada para cumplir límites');
      return response.substring(0, MAX_CHARACTERS) + '...';
    }
    
    return response;
  }

  /**
   * Convierte texto a audio usando TTS
   */
  async textToSpeech(text: string, voiceOverride?: string): Promise<TTSResponse> {
    if (!this.openai) {
      throw new Error('OpenAI no está inicializado');
    }

    try {
      // Mejorar pronunciación en español
      const improvedText = this.improveSpanishPronunciation(text);
      const voiceToUse = voiceOverride || this.config.voice;

      const response = await this.openai.audio.speech.create({
        model: VOICEBOT_CONFIG.TTS.MODEL,
        voice: voiceToUse as any,
        input: improvedText,
        response_format: 'mp3'
      });

      const audioBlob = await response.blob();
      
      return {
        audio: audioBlob,
        duration: audioBlob.size / 16000 // Estimación aproximada
      };

    } catch (error) {
      console.error('Error en TTS:', error);
      throw new Error('Error al convertir texto a audio');
    }
  }

  /**
   * Mejora la pronunciación en español agregando guías fonéticas
   * @param text - Texto original
   * @returns Texto mejorado para mejor pronunciación
   */
  private improveSpanishPronunciation(text: string): string {
    // Reemplazos para mejorar la pronunciación en español
    const replacements = [
      // Acentos y pronunciación
      { from: /á/g, to: 'á' },
      { from: /é/g, to: 'é' },
      { from: /í/g, to: 'í' },
      { from: /ó/g, to: 'ó' },
      { from: /ú/g, to: 'ú' },
      { from: /ñ/g, to: 'ñ' },
      
      // Palabras comunes que se pronuncian mal
      { from: /\bhola\b/gi, to: 'hola' },
      { from: /\bgracias\b/gi, to: 'gracias' },
      { from: /\bpor favor\b/gi, to: 'por favor' },
      { from: /\bde nada\b/gi, to: 'de nada' },
      { from: /\bperdón\b/gi, to: 'perdón' },
      { from: /\bdisculpa\b/gi, to: 'disculpa' },
      
      // Números en español
      { from: /\buno\b/gi, to: 'uno' },
      { from: /\bdos\b/gi, to: 'dos' },
      { from: /\btres\b/gi, to: 'tres' },
      { from: /\bcuatro\b/gi, to: 'cuatro' },
      { from: /\bcinco\b/gi, to: 'cinco' },
      { from: /\bseis\b/gi, to: 'seis' },
      { from: /\bsiete\b/gi, to: 'siete' },
      { from: /\bocho\b/gi, to: 'ocho' },
      { from: /\bnueve\b/gi, to: 'nueve' },
      { from: /\bdiez\b/gi, to: 'diez' },
    ];

    let improvedText = text;
    
    // Aplicar reemplazos
    replacements.forEach(({ from, to }) => {
      improvedText = improvedText.replace(from, to);
    });

    // Agregar pausas naturales para mejor fluidez
    improvedText = improvedText
      .replace(/([.!?])\s+/g, '$1... ')
      .replace(/([,;:])\s+/g, '$1... ');

    return improvedText;
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * Obtiene el prompt del sistema actual
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }
}

// Instancia singleton
export const openaiService = new OpenAIService();

/**
 * Funciones de conveniencia para inicialización
 */
export const initializeOpenAI = (config: OpenAIConfig): void => {
  openaiService.initialize(config);
};

export const getOpenAIService = (): OpenAIService => {
  return openaiService;
}; 
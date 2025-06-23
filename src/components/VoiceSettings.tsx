import React, { useState } from 'react';
import { AVAILABLE_VOICES, getRecommendedVoices } from '../utils/constants';
import { getOpenAIService } from '../services/openai';
import { Voice } from '../types';

interface VoiceSettingsProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onError?: (error: string) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  currentVoice,
  onVoiceChange,
  isOpen,
  onToggle,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentVoiceInfo = AVAILABLE_VOICES.find(v => v.id === currentVoice) || AVAILABLE_VOICES[0];
  const recommendedVoices = getRecommendedVoices();
  const otherVoices = AVAILABLE_VOICES.filter(v => !v.recommended);

  const handlePreview = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation(); // Evitar que se cierre el panel
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      onError?.(''); // Limpiar errores previos

      const openaiService = getOpenAIService();
      const sampleText = "¡Hola! Soy tu asistente de voz. ¿Cómo estás hoy?";
      const { audio } = await openaiService.textToSpeech(sampleText, voiceId);
      
      const audioUrl = URL.createObjectURL(audio);
      const audioElement = new Audio(audioUrl);
      
      audioElement.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioElement.onerror = () => {
        setIsPlaying(false);
        onError?.('Error al reproducir el audio de previsualización.');
        URL.revokeObjectURL(audioUrl);
      };

      await audioElement.play();
    } catch (err) {
      setIsPlaying(false);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en previsualización.';
      onError?.(errorMessage);
    }
  };

  return (
    <div className="relative">
      {/* Botón para abrir/cerrar el panel */}
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Voz: {currentVoiceInfo.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Panel de configuración */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Voz
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              TTS Estándar
            </span>
          </div>

          {/* Lista de voces */}
          <div className="space-y-3">
            {/* Recomendadas */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recomendadas para español</h4>
              {recommendedVoices.map((voice) => (
                <VoiceItem 
                  key={voice.id} 
                  voice={voice} 
                  currentVoice={currentVoice} 
                  onVoiceChange={onVoiceChange}
                  onPreview={handlePreview}
                  isPlaying={isPlaying}
                />
              ))}
            </div>

            {/* Otras voces */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 my-2">Otras voces</h4>
              {otherVoices.map((voice) => (
                <VoiceItem 
                  key={voice.id} 
                  voice={voice} 
                  currentVoice={currentVoice} 
                  onVoiceChange={onVoiceChange}
                  onPreview={handlePreview}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar al hacer click fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={onToggle}
        />
      )}
    </div>
  );
};

interface VoiceItemProps {
    voice: Voice;
    currentVoice: string;
    onVoiceChange: (voice: string) => void;
    onPreview: (e: React.MouseEvent, voiceId: string) => void;
    isPlaying: boolean;
}

// Componente para un item de la lista de voces
const VoiceItem: React.FC<VoiceItemProps> = ({ voice, currentVoice, onVoiceChange, onPreview, isPlaying }) => {
  const isSelected = currentVoice === voice.id;

  return (
    <div
      onClick={() => onVoiceChange(voice.id)}
      className={`w-full flex flex-col p-3 rounded-lg text-left transition-colors duration-200 cursor-pointer ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {voice.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{voice.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
          </div>
        </div>
        {isSelected && (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700/50">
           <button
              onClick={(e) => onPreview(e, voice.id)}
              disabled={isPlaying}
              className={`w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                isPlaying
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {isPlaying ? 'Reproduciendo...' : '🎵 Previsualizar'}
            </button>
        </div>
      )}
    </div>
  );
};

export default VoiceSettings; 
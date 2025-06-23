import React from 'react';
import VoiceBot from './VoiceBot';

/**
 * Componente VoiceBot optimizado para ser embebido como widget
 * Incluye estilos aislados y configuración para iframe
 */
interface VoiceBotWidgetProps {
  /** Título personalizado del widget */
  title?: string;
  /** Descripción personalizada */
  description?: string;
  /** Ancho del widget */
  width?: string | number;
  /** Alto del widget */
  height?: string | number;
  /** Clase CSS adicional */
  className?: string;
  /** Configuración personalizada de OpenAI */
  openaiConfig?: {
    model?: string;
    voice?: string;
    language?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

const VoiceBotWidget: React.FC<VoiceBotWidgetProps> = ({
  title = "Asistente Virtual",
  description = "Habla conmigo para obtener ayuda",
  width = "400px",
  height = "600px",
  className = "",
  openaiConfig
}) => {
  return (
    <div 
      className={`voicebot-widget ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        maxWidth: '100%',
        maxHeight: '100vh',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'transparent'
      }}
    >
      <div className="voicebot-widget-container">
        <VoiceBot />
      </div>
      
      <style jsx>{`
        .voicebot-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .voicebot-widget-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 12px;
        }
        
        /* Estilos para modo iframe */
        @media (max-width: 768px) {
          .voicebot-widget {
            width: 100% !important;
            height: 100vh !important;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceBotWidget; 
import React from 'react';
import VoiceBot from './VoiceBot';

/**
 * Componente VoiceBot optimizado para ser embebido como widget
 * Incluye estilos aislados y configuración para iframe
 */
interface VoiceBotWidgetProps {
  /** Ancho del widget */
  width?: string | number;
  /** Alto del widget */
  height?: string | number;
  /** Clase CSS adicional */
  className?: string;
}

const VoiceBotWidget: React.FC<VoiceBotWidgetProps> = ({
  width = "400px",
  height = "600px",
  className = ""
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
        backgroundColor: 'transparent',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div 
        className="voicebot-widget-container"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '12px'
        }}
      >
        <VoiceBot />
      </div>
      
      <style>{`
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
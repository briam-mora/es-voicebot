# VoiceBot - Asistente Virtual con Voz

Un chatbot de voz en español construido con React, TypeScript y OpenAI. Permite conversaciones naturales usando reconocimiento de voz, procesamiento con GPT-4o y síntesis de voz con OpenAI TTS.

## 🚀 Características

- **Reconocimiento de Voz**: Usa la Web Speech API para transcribir audio en tiempo real
- **Chat Inteligente**: Integración con OpenAI GPT-4o para respuestas contextuales
- **Síntesis de Voz**: OpenAI TTS con 6 voces disponibles, optimizadas para español
- **Interfaz Moderna**: UI minimalista con TailwindCSS y estados visuales claros
- **Selección de Voces**: Cambio dinámico entre voces con previsualización
- **Manejo de Errores**: Sistema robusto de manejo de errores y estados
- **Widget Embeddable**: Fácil integración en cualquier sitio web
- **Responsive**: Funciona en móviles y desktop
- **Modo Admin**: Interfaz simplificada para clientes, completa para administradores

## 🎯 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Voz**: Web Speech API + OpenAI TTS
- **IA**: OpenAI GPT-4o
- **Build**: Vite

## 📦 Instalación

1. **Clona el repositorio**
```bash
git clone <url-del-repo>
cd Chatbot
```

2. **Instala dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp env.example .env
```

Edita `.env` y agrega tu clave de OpenAI:
```env
VITE_OPENAI_API_KEY=tu_clave_de_openai_aqui
```

4. **Ejecuta el proyecto**
```bash
npm run dev
```

## 🔧 Modos de Uso

### 👤 Modo Cliente (Por defecto)
- **URL**: `http://localhost:5173`
- **Características**:
  - Interfaz limpia y minimalista
  - Solo funcionalidad esencial
  - Sin información técnica
  - Historial de conversación visible
  - Ideal para usuarios finales

### 🔧 Modo Admin
- **URL**: `http://localhost:5173?admin=true`
- **Características**:
  - Selector de voces completo
  - Estadísticas de tokens
  - Historial de conversación (siempre visible)
  - Información de debug
  - Detalles de errores
  - Logs en consola

### 🔄 Cambiar entre Modos
- **Botón flotante**: Aparece en la esquina inferior derecha
- **URL directa**: Agregar/quitar `?admin=true`
- **Indicador visual**: Badge "🔧 Modo Admin" cuando está activo

## 🎙️ Voces Disponibles

El sistema incluye 6 voces de OpenAI TTS:

| Voz | Idioma | Género | Descripción | Recomendada |
|-----|--------|--------|-------------|-------------|
| **Nova** | es-ES | Femenino | Voz clara y natural | ✅ |
| Alloy | en-US | Neutral | Voz versátil | |
| Echo | en-US | Masculino | Voz profunda | |
| Fable | en-US | Masculino | Voz cálida | |
| Onyx | en-US | Masculino | Voz autoritaria | |
| Shimmer | en-US | Femenino | Voz suave | |

**Nota**: Nova está optimizada para español y es la recomendada para mejor pronunciación.

## 🔧 Configuración

### Variables de Entorno

```env
VITE_OPENAI_API_KEY=sk-...  # Tu clave de API de OpenAI
```

### Configuración del VoiceBot

```typescript
const config = {
  model: 'gpt-4o',           // Modelo de OpenAI
  voice: 'nova',             // Voz TTS
  language: 'es-ES',         // Idioma
  maxTokens: 150,            // Máximo tokens por respuesta
  temperature: 0.7           // Creatividad (0-1)
};
```

### Personalidad del Agente

Puedes definir un rol y contexto específico para el VoiceBot. Esto es ideal para adaptarlo a un negocio, como un restaurante, una tienda, etc.

Edita `src/utils/constants.ts`:
```typescript
AGENT_PERSONA: {
  ENABLED: true, // Habilitar para usar esta personalidad
  CONTEXT: "Eres un amigable y servicial mesero en un restaurante. Tu objetivo es tomar pedidos, responder preguntas sobre el menú y ayudar a los clientes con sus necesidades relacionadas con el restaurante. No proporciones recetas ni información no relacionada con el servicio del restaurante."
}
```
Cuando `ENABLED` es `true`, este `CONTEXT` se usará como la instrucción principal para el modelo de IA, sobreescribiendo el comportamiento genérico de "asistente".

## 📱 Uso

### Básico

1. **Haz clic en "Hablar"** para iniciar el reconocimiento de voz
2. **Habla claramente** - el sistema transcribirá tu mensaje
3. **Espera la respuesta** - GPT-4o procesará y responderá
4. **Escucha la respuesta** - TTS convertirá el texto a audio

### Modo Admin

1. **Accede con `?admin=true`** en la URL
2. **Cambia voces** usando el selector (⚙️)
3. **Monitorea tokens** en tiempo real
4. **Revisa historial** de conversación
5. **Debug** con logs en consola

### Estados del Sistema

- 🔵 **Idle**: Listo para escuchar
- 🔴 **Listening**: Escuchando tu voz
- 🟡 **Processing**: Procesando con IA
- 🟢 **Speaking**: Reproduciendo respuesta
- ❌ **Error**: Error en el sistema

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── VoiceBot.tsx          # Componente principal
│   ├── VoiceSettings.tsx     # Selector de voces
│   ├── VoicePreview.tsx      # Previsualización de voz
│   └── AdminIndicator.tsx    # Indicador de modo admin
├── hooks/
│   └── useVoiceRecognition.ts # Hook de reconocimiento
├── services/
│   └── openai.ts             # Servicios de OpenAI
├── types/
│   └── index.ts              # Tipos TypeScript
└── utils/
    └── constants.ts          # Constantes del sistema
```

## 🔌 Integración como Widget

### Método 1: Iframe

```html
<!-- Modo cliente (recomendado para producción) -->
<iframe 
  src="http://localhost:5173" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>

<!-- Modo admin (para desarrollo/debug) -->
<iframe 
  src="http://localhost:5173?admin=true" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>
```

### Método 2: Componente React

```tsx
import VoiceBot from './components/VoiceBot';

function App() {
  return (
    <div>
      <h1>Mi Sitio Web</h1>
      <VoiceBot />
    </div>
  );
}
```

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint
```

### Estructura de Archivos

```
├── public/              # Archivos estáticos
├── src/
│   ├── components/      # Componentes React
│   ├── hooks/          # Custom hooks
│   ├── services/       # Servicios externos
│   ├── types/          # Definiciones TypeScript
│   ├── utils/          # Utilidades
│   ├── App.tsx         # Componente raíz
│   └── main.tsx        # Punto de entrada
├── index.html          # HTML principal
├── package.json        # Dependencias
├── tailwind.config.js  # Configuración Tailwind
├── tsconfig.json       # Configuración TypeScript
└── vite.config.ts      # Configuración Vite
```

## 🐛 Solución de Problemas

### Error: "No se detectó audio válido"
- **Causa**: Micrófono no detectado o permisos denegados
- **Solución**: Verifica permisos del navegador y habla más cerca del micrófono

### Error: "Falta la clave de API"
- **Causa**: Variable de entorno no configurada
- **Solución**: Configura `VITE_OPENAI_API_KEY` en tu archivo `.env`

### Error: "Navegador no compatible"
- **Causa**: Web Speech API no soportada
- **Solución**: Usa Chrome, Edge o Safari

### Voz suena robótica
- **Causa**: Modelo TTS o configuración subóptima
- **Solución**: Usa la voz "Nova" que está optimizada para español

### Modo admin no funciona
- **Causa**: URL mal formada
- **Solución**: Verifica que sea exactamente `?admin=true`

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Abre un issue en GitHub
3. Contacta al equipo de desarrollo

---

**Nota**: Este proyecto requiere una clave de API válida de OpenAI para funcionar. Asegúrate de tener créditos suficientes en tu cuenta de OpenAI. 
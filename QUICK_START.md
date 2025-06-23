# 🚀 VoiceBot - Guía de Inicio Rápido

## ⚡ Configuración en 2 minutos

### 1. Instalación
```bash
git clone <tu-repositorio>
cd Chatbot
npm install
```

### 2. Configuración
```bash
cp env.example .env
# Edita .env y agrega tu clave de OpenAI
```

### 3. Ejecutar
```bash
npm run dev
```

## 💰 Sistema de Ahorro de Tokens

El VoiceBot incluye un sistema inteligente para minimizar el uso de tokens de OpenAI:

### 📊 Límites Configurados
- **Máximo tokens**: 150 por respuesta
- **Máximo palabras**: 50 por respuesta  
- **Máximo caracteres**: 300 por respuesta
- **Conversación**: Máximo 20 mensajes

### 🎯 Características de Ahorro

#### 1. Prompts Comprimidos
```typescript
// Antes (largo)
"Eres una asistente virtual femenina llamada Nova. 
Responde siempre en español usando lenguaje femenino cuando sea apropiado. 
Sé amigable, profesional y útil. Mantén las respuestas concisas pero informativas."

// Ahora (comprimido)
"Eres Nova, asistente femenina. Responde en español, máximo 50 palabras. Sé concisa y útil."
```

#### 2. Validación Automática
- Verifica longitud de respuestas
- Trunca automáticamente si excede límites
- Muestra advertencias en consola

#### 3. Logs de Uso
```
Tokens usados: 145 (prompt: 23, completion: 122)
Respuesta: 32 palabras • 156 caracteres
```

### 🔧 Configuración Avanzada

#### Ajustar Límites
```typescript
// En src/utils/constants.ts
RESPONSE_LIMITS: {
  MAX_TOKENS: 150,        // Cambiar según necesidades
  MAX_CHARACTERS: 300,    // Ajustar límite de caracteres
  MAX_WORDS: 50,          // Modificar límite de palabras
}
```

#### Deshabilitar Ahorro
```typescript
TOKEN_SAVING: {
  ENABLED: false,         // Desactivar límites
  TRUNCATE_LONG_RESPONSES: false,
}
```

## 🎙️ Uso Básico

### 1. Hablar con el Asistente
- Haz clic en "Hablar"
- Habla claramente en español
- Espera la respuesta

### 2. Cambiar Voz
- Haz clic en el ícono ⚙️
- Selecciona una voz (Nova recomendada)
- Usa "Previsualizar" para probar

### 3. Estados del Sistema
- 🔵 **Idle**: Listo para escuchar
- 🔴 **Listening**: Escuchando tu voz
- 🟡 **Processing**: Procesando con IA
- 🟢 **Speaking**: Reproduciendo respuesta

## 📱 Características Principales

### ✅ Implementado
- [x] Reconocimiento de voz en español
- [x] Chat con GPT-4o
- [x] Síntesis de voz con 6 voces
- [x] Género adaptativo automático
- [x] Sistema de ahorro de tokens
- [x] UI responsive con TailwindCSS
- [x] Manejo de errores robusto
- [x] Control de audio completo

### 🎯 Optimizaciones de Tokens
- [x] Prompts comprimidos
- [x] Límites automáticos
- [x] Validación de respuestas
- [x] Logs de uso detallados
- [x] Truncamiento inteligente
- [x] Estadísticas en tiempo real

## 🔍 Debugging

### Logs Útiles
```bash
# En la consola del navegador:
"Enviando mensaje con límite de 150 tokens"
"Tokens usados: 145 (prompt: 23, completion: 122)"
"Respuesta truncada para cumplir límites"
"Voz cambiada a: Nova (female)"
```

### Métricas Visibles
- 📊 Contador de tokens en header
- 📝 Número de palabras por respuesta
- 💾 Indicador de ahorro activo
- 🟡 Badge "Truncada" si respuesta fue cortada

## 🐛 Solución de Problemas

### Error: "No se detectó audio válido"
- Verifica permisos del micrófono
- Habla más cerca del micrófono
- Usa Chrome, Edge o Safari

### Error: "Falta la clave de API"
- Configura `VITE_OPENAI_API_KEY` en `.env`
- Reinicia el servidor

### Alto uso de tokens
- Revisa logs en consola
- Considera reducir límites
- Verifica que no haya loops infinitos

## 📈 Monitoreo de Costos

### Estimación de Costos
- **GPT-4o**: ~$0.01 por 1K tokens
- **TTS**: ~$0.015 por 1K caracteres
- **Uso típico**: ~$0.05-0.10 por conversación

### Optimizaciones Recomendadas
1. Usar límites de 150 tokens
2. Mantener conversaciones cortas
3. Limpiar historial regularmente
4. Usar voz Nova (optimizada para español)

## 🚀 Próximos Pasos

1. **Personalizar límites** según tus necesidades
2. **Configurar monitoreo** de costos
3. **Integrar en tu aplicación** como widget
4. **Ajustar prompts** para casos específicos

---

**¡Listo!** Tu VoiceBot está configurado con ahorro de tokens y listo para usar. 🎉 
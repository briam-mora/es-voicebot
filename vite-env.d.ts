/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_VOICEBOT_MODEL: string
  readonly VITE_VOICEBOT_VOICE: string
  readonly VITE_VOICEBOT_LANGUAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
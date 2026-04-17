// Adaptador para Groq
// Ultra-rapido: 300+ tokens/segundo
// Gratis: 14,400 req/dia sin tarjeta
// Soporta GET /models para listar modelos dinámicamente
// REQUIERE CORS PROXY

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

export class GroqAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.groq;
  readonly defaultModel = 'llama-3.3-70b-versatile';

  // Groq incluye whisper, playai-tts, llama-guard y allam-2 (ASR, TTS, guardrails)
  // en /openai/v1/models — todos deben excluirse del selector de chat
  protected isChatModel(model: { id: string }): boolean {
    const id = (model.id || '').toLowerCase();
    const groqNonChat = ['whisper', 'playai', 'tts', 'guard', 'allam-2-prompt-guard'];
    if (groqNonChat.some(p => id.includes(p))) return false;
    return super.isChatModel(model);
  }

  // Modelos por defecto cuando no hay API key (sincronizado con freeModels del config)
  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', contextWindow: 131072, maxOutputTokens: 8192, isFree: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000, maxOutputTokens: 8192, isFree: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', contextWindow: 128000, maxOutputTokens: 8192, isFree: true },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B', contextWindow: 32768, maxOutputTokens: 8192, isFree: true },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', contextWindow: 128000, maxOutputTokens: 16384, isFree: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextWindow: 32768, maxOutputTokens: 32768, isFree: true },
    ];
  }

  protected getDefaultMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('mixtral')) return 32768;
    if (id.includes('deepseek')) return 16384;
    if (id.includes('llama')) return 8192;
    return 8192;
  }
}

// Instancia singleton
export const groqAdapter = new GroqAdapter();

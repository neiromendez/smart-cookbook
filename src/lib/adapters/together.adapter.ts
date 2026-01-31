// Adaptador para Together AI API
// Compatible con OpenAI - Extiende BaseOpenAIAdapter

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

/**
 * Together AI Adapter
 *
 * 200+ modelos open source disponibles
 * Llama 4, Llama 3.3, DeepSeek, Qwen, Mixtral
 * Compatible con formato OpenAI
 * Soporta GET /models para listar TODOS los modelos dinámicamente
 * NOTA: Together AI no soporta CORS - las llamadas pasan por el Edge Function
 */
class TogetherAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.together;
  readonly defaultModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

  // Modelos por defecto cuando no hay API key
  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', contextWindow: 131072, maxOutputTokens: 8192, isFree: false },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', contextWindow: 128000, maxOutputTokens: 8192, isFree: false },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', contextWindow: 32768, maxOutputTokens: 8192, isFree: false },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', contextWindow: 32768, maxOutputTokens: 32768, isFree: false },
    ];
  }

  protected getDefaultMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('mixtral')) return 32768;
    if (id.includes('llama')) return 8192;
    if (id.includes('qwen')) return 8192;
    if (id.includes('deepseek')) return 8192;
    return 8192;
  }
}

export const togetherAdapter = new TogetherAdapter();

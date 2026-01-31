// Adaptador para Fireworks AI API
// Compatible con OpenAI - Extiende BaseOpenAIAdapter

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

/**
 * Fireworks AI Adapter
 *
 * 50+ modelos optimizados
 * Llama 4, Llama 3, Qwen, Mixtral, DeepSeek
 * Cached tokens al 50% de precio
 * Compatible con formato OpenAI
 * Nota: El endpoint de modelos es diferente (requiere account_id)
 * NOTA: Fireworks no soporta CORS - las llamadas pasan por el Edge Function
 */
class FireworksAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.fireworks;
  readonly defaultModel = 'accounts/fireworks/models/llama-v3p3-70b-instruct';

  // Fireworks tiene un endpoint de modelos diferente, usar lista estática
  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', contextWindow: 131072, maxOutputTokens: 8192, isFree: false },
      { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B', contextWindow: 131072, maxOutputTokens: 8192, isFree: false },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen 2.5 72B', contextWindow: 32768, maxOutputTokens: 8192, isFree: false },
      { id: 'accounts/fireworks/models/deepseek-v3', name: 'DeepSeek V3', contextWindow: 128000, maxOutputTokens: 8192, isFree: false },
      { id: 'accounts/fireworks/models/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', contextWindow: 65536, maxOutputTokens: 32768, isFree: false },
    ];
  }

  protected getDefaultMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('mixtral')) return 32768;
    return 8192; // Fireworks default
  }

  // Override listModels para usar solo defaults (endpoint diferente en Fireworks)
  async listModels(): Promise<ModelInfo[]> {
    return this.getDefaultModels();
  }
}

export const fireworksAdapter = new FireworksAdapter();

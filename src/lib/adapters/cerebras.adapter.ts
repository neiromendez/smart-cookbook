// Adaptador para Cerebras
// El MAS RAPIDO del mundo: 2600+ tokens/segundo
// Gratis: 1M tokens/dia sin waitlist
// Soporta GET /models para listar modelos dinámicamente
// REQUIERE CORS PROXY

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

export class CerebrasAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.cerebras;
  readonly defaultModel = 'llama-3.3-70b';

  // Modelos por defecto cuando no hay API key
  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', contextWindow: 8192, maxOutputTokens: 8192, isFree: true },
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', contextWindow: 8192, maxOutputTokens: 8192, isFree: true },
      { id: 'qwen3-32b', name: 'Qwen 3 32B', contextWindow: 32768, maxOutputTokens: 8192, isFree: true },
    ];
  }

  protected getDefaultMaxOutputTokens(): number {
    return 8192; // Cerebras usa 8K como default para todos sus modelos
  }
}

// Instancia singleton
export const cerebrasAdapter = new CerebrasAdapter();

// Adaptador para Mistral AI API
// Compatible con OpenAI - Extiende BaseOpenAIAdapter

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

/**
 * Mistral AI Adapter
 *
 * Usa la API de Mistral AI (2025)
 * Modelos: Large 3, Small 3.1, Medium 3, Ministral, Devstral
 * Compatible con formato OpenAI
 * Soporta GET /models para listar modelos dinámicamente
 * NOTA: Mistral no soporta CORS - las llamadas pasan por el Edge Function
 */
class MistralAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.mistral;
  readonly defaultModel = 'mistral-small-latest';

  // Modelos por defecto cuando no hay API key
  // Mistral usa ~4K como max output por defecto
  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'mistral-large-latest', name: 'Mistral Large 3', contextWindow: 256000, maxOutputTokens: 4096, isFree: false },
      { id: 'mistral-medium-latest', name: 'Mistral Medium 3', contextWindow: 128000, maxOutputTokens: 4096, isFree: false },
      { id: 'mistral-small-latest', name: 'Mistral Small 3.1', contextWindow: 128000, maxOutputTokens: 4096, isFree: false },
      { id: 'ministral-8b-latest', name: 'Ministral 8B', contextWindow: 32000, maxOutputTokens: 4096, isFree: false },
      { id: 'codestral-latest', name: 'Codestral', contextWindow: 32000, maxOutputTokens: 4096, isFree: false },
    ];
  }

  protected getDefaultMaxOutputTokens(): number {
    return 4096; // Mistral usa 4K como default
  }
}

export const mistralAdapter = new MistralAdapter();

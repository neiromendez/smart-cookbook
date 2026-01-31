// Adaptador para OpenAI API
// Extiende BaseOpenAIAdapter - Necesita proxy CORS

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

// Modelos de chat de OpenAI (filtrar estos del endpoint /models)
const CHAT_MODEL_PREFIXES = ['gpt-4', 'gpt-3.5', 'o1', 'o3', 'chatgpt'];

/**
 * OpenAI Adapter
 *
 * Usa la API oficial de OpenAI con modelos GPT-4 y GPT-3.5
 * NOTA: OpenAI no soporta CORS - las llamadas pasan por el Edge Function
 */
class OpenAIAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.openai;
  readonly defaultModel = 'gpt-4o-mini'; // Modelo mas economico

  /**
   * Lista modelos disponibles dinamicamente desde el API de OpenAI
   * GET /v1/models - devuelve todos los modelos accesibles para la API key
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    if (!apiKey) {
      // Sin API key, devolver modelos conocidos
      return this.getDefaultModels();
    }

    try {
      // Usar el proxy CORS para la llamada
      const url = '/api/ai/proxy';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Target-URL': `${this.config.baseUrl}/models`,
          'X-API-Key': apiKey,
          'X-Provider': this.config.id,
        },
      });

      if (!response.ok) {
        console.warn('[OpenAI] Error fetching models:', response.status);
        return this.getDefaultModels();
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      // Filtrar solo modelos de chat (gpt-4, gpt-3.5, o1, o3, chatgpt)
      for (const model of data.data || []) {
        const id = model.id as string;
        const isChatModel = CHAT_MODEL_PREFIXES.some(prefix => id.startsWith(prefix));

        if (isChatModel) {
          models.push({
            id,
            name: this.formatModelName(id),
            contextWindow: this.getContextWindow(id),
            maxOutputTokens: this.getDefaultMaxOutputTokens(id),
            isFree: false,
          });
        }
      }

      // Ordenar: gpt-4o primero, luego gpt-4, luego gpt-3.5, luego o1/o3
      models.sort((a, b) => {
        const order = (id: string) => {
          if (id.startsWith('gpt-4o')) return 0;
          if (id.startsWith('gpt-4')) return 1;
          if (id.startsWith('gpt-3')) return 2;
          if (id.startsWith('o1') || id.startsWith('o3')) return 3;
          return 4;
        };
        return order(a.id) - order(b.id);
      });

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error('[OpenAI] Error listing models:', error);
      return this.getDefaultModels();
    }
  }

  protected getDefaultModels(): ModelInfo[] {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutputTokens: 16384, isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutputTokens: 16384, isFree: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxOutputTokens: 4096, isFree: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxOutputTokens: 4096, isFree: false },
    ];
  }

  protected getDefaultMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('gpt-4o')) return 16384;
    if (id.includes('o1') || id.includes('o3')) return 100000;
    if (id.includes('gpt-4')) return 4096;
    if (id.includes('gpt-3.5')) return 4096;
    return 4096;
  }

  protected formatModelName(id: string): string {
    // Formatear nombre legible
    return id
      .replace(/-/g, ' ')
      .replace(/gpt /gi, 'GPT-')
      .replace(/GPT- /gi, 'GPT-')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^o1/i, 'O1')
      .replace(/^o3/i, 'O3');
  }

  private getContextWindow(id: string): number {
    if (id.includes('gpt-4o') || id.includes('gpt-4-turbo')) return 128000;
    if (id.includes('gpt-4-32k')) return 32768;
    if (id.includes('gpt-4')) return 8192;
    if (id.includes('gpt-3.5-turbo-16k')) return 16385;
    if (id.includes('gpt-3.5')) return 4096;
    if (id.startsWith('o1') || id.startsWith('o3')) return 128000;
    return 8192;
  }
}

export const openaiAdapter = new OpenAIAdapter();

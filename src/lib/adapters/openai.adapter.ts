// Adaptador para OpenAI API
// Extiende BaseOpenAIAdapter - Necesita proxy CORS

import type { ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';

// Prefijos de modelos de chat de OpenAI (2026)
// Incluye familias GPT-5, GPT-4, GPT-3.5, y reasoning o1/o3/o4
const CHAT_MODEL_PREFIXES = ['gpt-5', 'gpt-4', 'gpt-3.5', 'chatgpt', 'o1', 'o3', 'o4'];

// Sufijos/patrones que no son chat estándar aunque empiecen con gpt-*
const NON_CHAT_PATTERNS = ['audio', 'realtime', 'transcribe', 'tts', 'search-preview'];

/**
 * OpenAI Adapter
 *
 * Usa la API oficial de OpenAI con modelos GPT-5/4 y reasoning o-series
 * NOTA: OpenAI no soporta CORS - las llamadas pasan por el Edge Function
 */
class OpenAIAdapter extends BaseOpenAIAdapter {
  readonly config = AI_PROVIDERS.openai;
  readonly defaultModel = 'gpt-4o-mini';

  protected isChatModel(model: { id: string }): boolean {
    const id = (model.id || '').toLowerCase();
    // Modelos fine-tuned: "ft:gpt-4o-mini:org::id" — extraer el base model
    const baseId = id.startsWith('ft:') ? id.slice(3) : id;
    const startsWithChatPrefix = CHAT_MODEL_PREFIXES.some(prefix => baseId.startsWith(prefix));
    if (!startsWithChatPrefix) return false;
    return !NON_CHAT_PATTERNS.some(p => baseId.includes(p));
  }

  /**
   * Lista modelos disponibles dinamicamente desde el API de OpenAI
   * GET /v1/models - devuelve todos los modelos accesibles para la API key
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    if (!apiKey) {
      return this.getDefaultModels();
    }

    try {
      const response = await fetch('/api/ai/proxy', {
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

      for (const rawModel of data.data || []) {
        if (!this.isChatModel(rawModel)) continue;
        const id = rawModel.id as string;
        models.push({
          id,
          name: this.formatModelName(id),
          contextWindow: this.getContextWindow(id),
          maxOutputTokens: this.getDefaultMaxOutputTokens(id),
          isFree: false,
        });
      }

      // Ordenar: gpt-5 primero, luego gpt-4o, gpt-4, gpt-3.5, reasoning al final
      models.sort((a, b) => {
        const order = (id: string) => {
          if (id.startsWith('gpt-5')) return 0;
          if (id.startsWith('gpt-4o')) return 1;
          if (id.startsWith('gpt-4')) return 2;
          if (id.startsWith('gpt-3')) return 3;
          if (id.startsWith('o4')) return 4;
          if (id.startsWith('o3')) return 5;
          if (id.startsWith('o1')) return 6;
          return 7;
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
      { id: 'gpt-5', name: 'GPT-5', contextWindow: 400000, maxOutputTokens: 128000, isFree: false },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', contextWindow: 400000, maxOutputTokens: 128000, isFree: false },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutputTokens: 16384, isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutputTokens: 16384, isFree: false },
      { id: 'o4-mini', name: 'O4 Mini', contextWindow: 200000, maxOutputTokens: 100000, isFree: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxOutputTokens: 4096, isFree: false },
    ];
  }

  protected getDefaultMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.startsWith('gpt-5')) return 128000;
    if (id.includes('gpt-4o')) return 16384;
    if (id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4')) return 100000;
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
    if (id.startsWith('gpt-5')) return 400000;
    if (id.includes('gpt-4o') || id.includes('gpt-4-turbo')) return 128000;
    if (id.includes('gpt-4-32k')) return 32768;
    if (id.includes('gpt-4')) return 8192;
    if (id.includes('gpt-3.5-turbo-16k')) return 16385;
    if (id.includes('gpt-3.5')) return 4096;
    if (id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4')) return 200000;
    return 8192;
  }
}

export const openaiAdapter = new OpenAIAdapter();

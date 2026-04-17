// Adaptador para Anthropic API (Claude)
// Formato de API diferente a OpenAI - Requiere proxy CORS

import type { ModelInfo, AIProviderConfig } from '@/types';
import {
  type IAIProvider,
  type GenerateOptions,
  type StreamChunk,
  AI_PROVIDERS,
} from './ai-provider.interface';

/**
 * Anthropic Adapter
 *
 * Usa la API de Anthropic para modelos Claude
 * API format diferente: usa 'messages' con formato especifico
 * NOTA: Anthropic no soporta CORS - las llamadas pasan por el Edge Function
 */
class AnthropicAdapter implements IAIProvider {
  readonly config: AIProviderConfig = AI_PROVIDERS.anthropic;
  readonly defaultModel = 'claude-sonnet-4-6'; // Claude Sonnet 4.6 - balance precio/rendimiento

  getEndpointUrl(): string {
    return `${this.config.baseUrl}/messages`;
  }

  needsCorsProxy(): boolean {
    return true; // Anthropic no soporta CORS desde browser
  }

  async *generateRecipe(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    options?: GenerateOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || this.defaultModel;

    // Usar el Edge Function como proxy
    const url = '/api/ai/proxy';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Target-URL': this.getEndpointUrl(),
      'X-API-Key': apiKey,
      'X-Provider': 'anthropic',
    };

    // Formato especifico de Anthropic
    // Nota: Anthropic REQUIERE max_tokens, usar un valor alto por defecto
    const body = JSON.stringify({
      model,
      max_tokens: options?.maxTokens || 16384,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      stream: true,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw { status: response.status, body: errorBody };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);

            // Formato de eventos de Anthropic
            if (json.type === 'content_block_delta' && json.delta?.text) {
              yield { content: json.delta.text, done: false };
            }
          } catch {
            // Ignorar lineas mal formadas
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Hacer una llamada minima para validar
      const url = '/api/ai/proxy';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-URL': this.getEndpointUrl(),
          'X-API-Key': apiKey,
          'X-Provider': 'anthropic',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      // 200 o 400 (bad request pero key valida) son aceptables
      if (response.ok || response.status === 400) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'API key invalida' };
      }

      return { valid: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Error de conexion',
      };
    }
  }

  /**
   * Lista modelos disponibles dinámicamente desde la API de Anthropic
   * Anthropic soporta GET /v1/models con header anthropic-version
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    if (!apiKey) {
      return this.getDefaultModels();
    }

    try {
      const url = '/api/ai/proxy';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Target-URL': `${this.config.baseUrl}/models`,
          'X-API-Key': apiKey,
          'X-Provider': 'anthropic',
          'X-Anthropic-Version': '2023-06-01',
        },
      });

      if (!response.ok) {
        console.warn('[Anthropic] Error fetching models:', response.status);
        return this.getDefaultModels();
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      for (const model of data.data || []) {
        models.push({
          id: model.id,
          name: model.display_name || model.id,
          contextWindow: 200000,
          maxOutputTokens: this.getMaxOutputTokens(model.id),
          isFree: false,
        });
      }

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error('[Anthropic] Error listing models:', error);
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', contextWindow: 1000000, maxOutputTokens: 32000, isFree: false },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextWindow: 200000, maxOutputTokens: 32000, isFree: false },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextWindow: 200000, maxOutputTokens: 64000, isFree: false },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, maxOutputTokens: 64000, isFree: false },
    ];
  }

  private getMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('opus')) return 32000;
    if (id.includes('haiku')) return 64000;
    if (id.includes('sonnet')) return 64000;
    return 16384;
  }
}

export const anthropicAdapter = new AnthropicAdapter();

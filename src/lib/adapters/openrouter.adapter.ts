// Adaptador para OpenRouter
// El UNICO proveedor que soporta CORS nativo desde el browser
// Acceso a 500+ modelos incluyendo OpenAI, Anthropic, Google, etc.

import type { ModelInfo } from '@/types';
import {
  type IAIProvider,
  type GenerateOptions,
  type StreamChunk,
  AI_PROVIDERS,
} from './ai-provider.interface';

// Modelo por defecto: Gemini 2.0 Flash (gratuito y rápido)
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export class OpenRouterAdapter implements IAIProvider {
  readonly config = AI_PROVIDERS.openrouter;

  getEndpointUrl(): string {
    return `${this.config.baseUrl}/chat/completions`;
  }

  needsCorsProxy(): boolean {
    return false; // OpenRouter soporta CORS!
  }

  async *generateRecipe(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    options?: GenerateOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || DEFAULT_MODEL;

    const response = await fetch(this.getEndpointUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://smart-cookbook.vercel.app',
        'X-Title': 'Smart Cookbook',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        // No establecer max_tokens para usar el máximo del modelo
        ...(options?.maxTokens && { max_tokens: options.maxTokens }),
        temperature: options?.temperature || 0.7,
        stream: true,
      }),
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
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
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
      // Hacer una llamada minima para validar la key
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      }

      const error = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: error?.error?.message || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Error de conexion',
      };
    }
  }

  /**
   * Lista modelos disponibles dinámicamente desde la API de OpenRouter
   * OpenRouter soporta GET /models directamente (CORS habilitado)
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    // Si hay API key, intentar obtener modelos dinámicamente
    if (apiKey) {
      try {
        const response = await fetch(`${this.config.baseUrl}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const models: ModelInfo[] = [];

          // Filtrar modelos gratuitos y chat
          for (const model of data.data || []) {
            const isFree = model.id?.endsWith(':free') ||
                          (model.pricing?.prompt === '0' && model.pricing?.completion === '0');

            if (isFree) {
              models.push({
                id: model.id,
                name: model.name || this.formatModelName(model.id),
                contextWindow: model.context_length || 32768,
                maxOutputTokens: model.top_provider?.max_completion_tokens || this.getMaxOutputTokens(model.id),
                isFree: true,
              });
            }
          }

          if (models.length > 0) {
            return models.sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      } catch (error) {
        console.warn('[OpenRouter] Error fetching models:', error);
      }
    }

    // Fallback: devolver modelos gratuitos predefinidos
    return this.getDefaultModels();
  }

  private getDefaultModels(): ModelInfo[] {
    return (this.config.freeModels || []).map(id => ({
      id,
      name: this.formatModelName(id),
      contextWindow: 32768,
      maxOutputTokens: this.getMaxOutputTokens(id),
      isFree: true,
    }));
  }

  private getMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return 8192;
    if (id.includes('llama')) return 8192;
    if (id.includes('qwen')) return 8192;
    if (id.includes('deepseek')) return 8192;
    return 4096; // Default conservador
  }

  // Formatear nombre legible: "google/gemini-2.0-flash-exp:free" -> "Gemini 2.0 Flash Exp"
  private formatModelName(id: string): string {
    return id
      .split('/').pop()
      ?.replace(':free', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || id;
  }
}

// Instancia singleton
export const openRouterAdapter = new OpenRouterAdapter();

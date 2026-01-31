// Adaptador base para proveedores compatibles con OpenAI API
// Groq, OpenAI, Together, Fireworks, Mistral usan formato similar

import type { ModelInfo, AIProviderConfig } from '@/types';
import {
  type IAIProvider,
  type GenerateOptions,
  type StreamChunk,
} from './ai-provider.interface';

/**
 * Adaptador base para APIs compatibles con OpenAI
 * Los proveedores que usan este formato:
 * - Groq
 * - OpenAI
 * - Together AI
 * - Fireworks AI
 * - Mistral
 * - Cerebras
 *
 * IMPORTANTE: Estos proveedores NO soportan CORS desde browser
 * Las llamadas deben pasar por el Vercel Edge Function
 */
export abstract class BaseOpenAIAdapter implements IAIProvider {
  abstract readonly config: AIProviderConfig;
  abstract readonly defaultModel: string;

  getEndpointUrl(): string {
    return `${this.config.baseUrl}/chat/completions`;
  }

  needsCorsProxy(): boolean {
    return this.config.requiresCors;
  }

  /**
   * Genera una receta usando streaming
   * Si el proveedor requiere CORS proxy, la URL debe apuntar al Edge Function
   */
  async *generateRecipe(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    options?: GenerateOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || this.defaultModel;

    // Determinar URL (directa o via proxy)
    let url = this.getEndpointUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.needsCorsProxy()) {
      // Usar el Edge Function como proxy
      url = '/api/ai/proxy';
      headers['X-Target-URL'] = this.getEndpointUrl();
      headers['X-API-Key'] = apiKey;
      headers['X-Provider'] = this.config.id;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // No establecer max_tokens para usar el máximo del modelo
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
      temperature: options?.temperature || 0.7,
      stream: true,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
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
      // Usar el proxy para validar
      const url = this.needsCorsProxy() ? '/api/ai/proxy' : `${this.config.baseUrl}/models`;

      const headers: Record<string, string> = {};

      if (this.needsCorsProxy()) {
        headers['X-Target-URL'] = `${this.config.baseUrl}/models`;
        headers['X-API-Key'] = apiKey;
        headers['X-Provider'] = this.config.id;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
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
   * Lista modelos disponibles dinámicamente desde el API
   * La mayoría de proveedores OpenAI-compatible soportan GET /models
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    // Sin API key, devolver modelos conocidos
    if (!apiKey) {
      return this.getDefaultModels();
    }

    try {
      // Usar el proxy CORS para la llamada
      const url = this.needsCorsProxy() ? '/api/ai/proxy' : `${this.config.baseUrl}/models`;
      const headers: Record<string, string> = {};

      if (this.needsCorsProxy()) {
        headers['X-Target-URL'] = `${this.config.baseUrl}/models`;
        headers['X-API-Key'] = apiKey;
        headers['X-Provider'] = this.config.id;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.warn(`[${this.config.id}] Error fetching models:`, response.status);
        return this.getDefaultModels();
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      // Parsear respuesta estándar OpenAI
      for (const model of data.data || []) {
        const id = model.id as string;
        models.push({
          id,
          name: this.formatModelName(id),
          contextWindow: model.context_window || model.context_length || 32768,
          maxOutputTokens: model.max_output_tokens || this.getDefaultMaxOutputTokens(id),
          isFree: this.config.isFree,
        });
      }

      // Ordenar alfabéticamente
      models.sort((a, b) => a.name.localeCompare(b.name));

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error(`[${this.config.id}] Error listing models:`, error);
      return this.getDefaultModels();
    }
  }

  /**
   * Modelos por defecto cuando no se puede hacer fetch
   * Override en subclases para modelos específicos
   */
  protected getDefaultModels(): ModelInfo[] {
    return (this.config.freeModels || []).map(id => ({
      id,
      name: this.formatModelName(id),
      contextWindow: 32768,
      maxOutputTokens: this.getDefaultMaxOutputTokens(id),
      isFree: this.config.isFree,
    }));
  }

  /**
   * Obtiene el máximo de tokens de salida por defecto para un modelo
   * Override en subclases para valores específicos
   */
  protected getDefaultMaxOutputTokens(modelId: string): number {
    // Valores por defecto basados en patrones comunes
    const id = modelId.toLowerCase();
    if (id.includes('llama-3.3') || id.includes('llama-3.1')) return 8192;
    if (id.includes('mixtral')) return 32768;
    if (id.includes('deepseek')) return 8192;
    if (id.includes('qwen')) return 8192;
    return 4096; // Default conservador
  }

  /**
   * Formatear nombre de modelo para mostrar
   * Override en subclases para formato específico
   */
  protected formatModelName(id: string): string {
    // Limpiar prefijos comunes y formatear
    return id
      .replace(/^(meta-llama\/|mistralai\/|qwen\/|deepseek\/|accounts\/fireworks\/models\/)/i, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

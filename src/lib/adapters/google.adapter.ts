// Adaptador para Google AI Studio (Gemini)
// Gratis: Ilimitado con rate limits (15 RPM Flash, 2 RPM Pro)
// REQUIERE CORS PROXY

import type { ModelInfo } from '@/types';
import {
  type IAIProvider,
  type GenerateOptions,
  type StreamChunk,
  AI_PROVIDERS,
} from './ai-provider.interface';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GoogleAdapter implements IAIProvider {
  readonly config = AI_PROVIDERS.google;

  getEndpointUrl(model?: string): string {
    const modelId = model || DEFAULT_MODEL;
    return `${this.config.baseUrl}/models/${modelId}:streamGenerateContent`;
  }

  needsCorsProxy(): boolean {
    return true; // Google NO soporta CORS
  }

  async *generateRecipe(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    options?: GenerateOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || DEFAULT_MODEL;

    // Google usa un formato diferente a OpenAI
    // Usar el proxy para convertir el formato
    const response = await fetch('/api/ai/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Target-URL': `${this.config.baseUrl}/models/${model}:streamGenerateContent?key=${apiKey}`,
        'X-Provider': 'google',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n---\n\nUser request: ${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 2048,
          temperature: options?.temperature || 0.7,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
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

        // Google devuelve JSON con formato diferente
        // Puede ser un array de objetos o objetos separados por newlines
        try {
          // Intentar parsear como JSON lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue;

            // Limpiar comas al final
            const cleanLine = trimmed.replace(/^,|,$/g, '');
            if (!cleanLine) continue;

            try {
              const json = JSON.parse(cleanLine);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                yield { content: text, done: false };
              }
            } catch {
              // Ignorar lineas que no son JSON valido
            }
          }
        } catch {
          // Si falla el parseo, acumular mas contenido
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('/api/ai/proxy', {
        method: 'GET',
        headers: {
          'X-Target-URL': `${this.config.baseUrl}/models?key=${apiKey}`,
          'X-Provider': 'google',
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
   * Lista modelos disponibles dinámicamente desde la API de Google
   * Google usa GET /models?key=API_KEY
   */
  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    if (!apiKey) {
      return this.getDefaultModels();
    }

    try {
      const response = await fetch('/api/ai/proxy', {
        method: 'GET',
        headers: {
          'X-Target-URL': `${this.config.baseUrl}/models?key=${apiKey}`,
          'X-Provider': 'google',
        },
      });

      if (!response.ok) {
        console.warn('[Google] Error fetching models:', response.status);
        return this.getDefaultModels();
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      // Filtrar solo modelos que soporten generateContent (chat)
      for (const model of data.models || []) {
        const supportedMethods = model.supportedGenerationMethods || [];
        if (supportedMethods.includes('generateContent')) {
          // Extraer nombre del modelo (format: models/gemini-2.0-flash)
          const id = model.name?.replace('models/', '') || model.name;
          models.push({
            id,
            name: model.displayName || id,
            contextWindow: model.inputTokenLimit || 1000000,
            maxOutputTokens: model.outputTokenLimit || this.getMaxOutputTokens(id),
            isFree: true,
          });
        }
      }

      // Filtrar solo modelos Gemini (no embedding, etc)
      const geminiModels = models.filter(m => m.id.includes('gemini'));
      return geminiModels.length > 0 ? geminiModels : this.getDefaultModels();
    } catch (error) {
      console.error('[Google] Error listing models:', error);
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000, maxOutputTokens: 8192, isFree: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, maxOutputTokens: 65536, isFree: true },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 2000000, maxOutputTokens: 65536, isFree: true },
    ];
  }

  private getMaxOutputTokens(modelId: string): number {
    const id = modelId.toLowerCase();
    if (id.includes('2.5') || id.includes('2-5')) return 65536;
    if (id.includes('2.0') || id.includes('2-0')) return 8192;
    return 8192; // Default
  }
}

// Instancia singleton
export const googleAdapter = new GoogleAdapter();

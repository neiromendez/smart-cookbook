// Adaptador para Hugging Face Inference API
// Formato diferente - Requiere proxy CORS

import type { ModelInfo, AIProviderConfig } from '@/types';
import {
  type IAIProvider,
  type GenerateOptions,
  type StreamChunk,
  AI_PROVIDERS,
} from './ai-provider.interface';

/**
 * HuggingFace Adapter
 *
 * Usa la API de Hugging Face Inference para modelos open source
 * API format: Texto a texto con parametros especificos
 * NOTA: HuggingFace no soporta CORS - las llamadas pasan por el Edge Function
 */
class HuggingFaceAdapter implements IAIProvider {
  readonly config: AIProviderConfig = AI_PROVIDERS.huggingface;
  readonly defaultModel = 'meta-llama/Llama-3.1-70B-Instruct';

  getEndpointUrl(model?: string): string {
    const modelId = model || this.defaultModel;
    return `${this.config.baseUrl}/${modelId}`;
  }

  needsCorsProxy(): boolean {
    return true; // HuggingFace no soporta CORS desde browser
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
      'X-Target-URL': this.getEndpointUrl(model),
      'X-API-Key': apiKey,
      'X-Provider': 'huggingface',
    };

    // Formato de chat para modelos Instruct de HuggingFace
    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

    const body = JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature || 0.7,
        return_full_text: false,
        stream: true,
      },
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
          if (!trimmed) continue;

          // HuggingFace puede devolver diferentes formatos
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              // Formato TGI (Text Generation Inference)
              if (json.token?.text) {
                yield { content: json.token.text, done: false };
              } else if (json.generated_text) {
                yield { content: json.generated_text, done: false };
              }
            } catch {
              // Puede ser texto plano
              yield { content: data, done: false };
            }
          } else {
            // Intentar parsear como JSON directo
            try {
              const json = JSON.parse(trimmed);
              if (Array.isArray(json) && json[0]?.generated_text) {
                yield { content: json[0].generated_text, done: false };
              } else if (json.generated_text) {
                yield { content: json.generated_text, done: false };
              }
            } catch {
              // Ignorar
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Verificar con la API de whoami de HuggingFace
      const url = '/api/ai/proxy';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Target-URL': 'https://huggingface.co/api/whoami-v2',
          'X-API-Key': apiKey,
          'X-Provider': 'huggingface',
        },
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Token invalido' };
      }

      return { valid: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Error de conexion',
      };
    }
  }

  // HuggingFace no tiene un endpoint estándar para listar modelos de inferencia
  // Usar lista estática de modelos conocidos
  // max_new_tokens está limitado por: input + max_new_tokens <= context window
  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B Instruct', contextWindow: 128000, maxOutputTokens: 4096, isFree: true },
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B Instruct', contextWindow: 128000, maxOutputTokens: 4096, isFree: true },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct', contextWindow: 32768, maxOutputTokens: 2048, isFree: true },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', contextWindow: 32768, maxOutputTokens: 4096, isFree: true },
    ];
  }
}

export const huggingfaceAdapter = new HuggingFaceAdapter();

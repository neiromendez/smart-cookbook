// Interfaz base para todos los proveedores de IA
// Patron Strategy: Cada proveedor implementa esta interfaz

import type { AIProviderConfig, ModelInfo } from '@/types';

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface IAIProvider {
  // Configuracion del proveedor
  readonly config: AIProviderConfig;

  // Metodos principales
  generateRecipe(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    options?: GenerateOptions
  ): AsyncIterable<StreamChunk>;

  // Validacion de API key
  validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;

  // Listar modelos disponibles
  listModels(apiKey?: string): Promise<ModelInfo[]>;

  // Obtener URL de la llamada (para proxy si es necesario)
  getEndpointUrl(model?: string): string;

  // Indica si necesita pasar por el proxy CORS
  needsCorsProxy(): boolean;
}

// Configuraciones de proveedores disponibles
// Orden alfabético: primero gratuitos (A-Z), luego de pago (A-Z)
export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  // ===== PROVEEDORES GRATUITOS (Alfabético) =====
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    isFree: true,
    freeModels: [
      // Llama 4 (~2600 tok/s)
      'llama-4-scout-17b-16e',
      // Llama 3.x
      'llama-3.3-70b',
      'llama-3.1-8b',
      // Qwen 3 (~2400 tok/s)
      'qwen3-32b',
      'qwen3-235b-instruct', // 64k context free tier
    ],
    documentation: 'https://inference-docs.cerebras.ai/',
    dashboardUrl: 'https://cloud.cerebras.ai/',
    requiresCors: true, // Cerebras NO soporta CORS desde browser
  },

  google: {
    id: 'google',
    name: 'Google AI Studio',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    isFree: true,
    freeModels: [
      // Gemini 2.5 (Free tier con limites)
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro', // Limite: 100 req/dia
      // Gemini 2.0
      'gemini-2.0-flash',
      // Gemini 3 Preview
      'gemini-3-flash-preview',
    ],
    documentation: 'https://ai.google.dev/docs',
    dashboardUrl: 'https://aistudio.google.com/apikey',
    requiresCors: true, // Google NO soporta CORS desde browser
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    isFree: true,
    freeModels: [
      // Llama 4
      'meta-llama/llama-4-scout-17b-16e-instruct',
      // Llama 3.3/3.1
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      // Qwen
      'qwen/qwen3-32b',
      // DeepSeek
      'deepseek-r1-distill-llama-70b',
      // Mixtral
      'mixtral-8x7b-32768',
    ],
    documentation: 'https://console.groq.com/docs',
    dashboardUrl: 'https://console.groq.com/keys',
    requiresCors: true, // Groq NO soporta CORS desde browser
  },

  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    isFree: true,
    freeModels: [
      'meta-llama/Llama-3.1-70B-Instruct',
      'meta-llama/Llama-3.1-8B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'Qwen/Qwen2.5-72B-Instruct',
    ],
    documentation: 'https://huggingface.co/docs/api-inference',
    dashboardUrl: 'https://huggingface.co/settings/tokens',
    requiresCors: true,
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    isFree: true,
    // Lista de modelos gratuitos de OpenRouter (Actualizado 2025)
    // El usuario puede seleccionar el que prefiera
    freeModels: [
      // === Meta Llama 4 ===
      'meta-llama/llama-4-maverick:free',
      'meta-llama/llama-4-scout:free',
      // === Meta Llama 3.x ===
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      // === DeepSeek ===
      'deepseek/deepseek-r1:free',
      'deepseek/deepseek-r1-distill-llama-70b:free',
      'deepseek/deepseek-chat:free',
      // === Qwen ===
      'qwen/qwen-2.5-72b-instruct:free',
      'qwen/qwen-2.5-coder-32b-instruct:free',
      'qwen/qvq-72b-preview:free',
      // === Google ===
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.5-flash-preview:free',
      // === OpenAI Open Source ===
      'openai/gpt-oss-120b:free',
      // === Mistral ===
      'mistralai/mistral-small-24b-instruct-2501:free',
      'mistralai/mistral-7b-instruct:free',
      // === NVIDIA ===
      'nvidia/llama-3.1-nemotron-70b-instruct:free',
      // === Otros ===
      'arcee-ai/trinity-large-preview:free',
      'moonshotai/kimi-vl-a3b-thinking:free',
    ],
    documentation: 'https://openrouter.ai/docs',
    dashboardUrl: 'https://openrouter.ai/settings/keys',
    requiresCors: false, // OpenRouter soporta CORS nativo!
  },

  // ===== PROVEEDORES DE PAGO (Alfabético) =====
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    isFree: false,
    documentation: 'https://docs.anthropic.com/',
    dashboardUrl: 'https://console.anthropic.com/settings/keys',
    requiresCors: true,
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    isFree: false,
    documentation: 'https://api-docs.deepseek.com/',
    dashboardUrl: 'https://platform.deepseek.com/api_keys',
    requiresCors: true,
  },

  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    isFree: false,
    documentation: 'https://docs.fireworks.ai/',
    dashboardUrl: 'https://fireworks.ai/account/api-keys',
    requiresCors: true,
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    isFree: false,
    documentation: 'https://docs.mistral.ai/',
    dashboardUrl: 'https://console.mistral.ai/api-keys',
    requiresCors: true,
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    isFree: false,
    // Modelos se obtienen dinamicamente desde GET /v1/models
    documentation: 'https://platform.openai.com/docs',
    dashboardUrl: 'https://platform.openai.com/api-keys',
    requiresCors: true, // OpenAI NO soporta CORS desde browser
  },

  opencode: {
    id: 'opencode',
    name: 'OpenCode AI',
    baseUrl: 'https://opencode.ai/api/v1',
    isFree: false,
    freeModels: [
      'opencode/fast-one',
      'opencode/gpt-5-nano',
    ],
    documentation: 'https://opencode.ai/docs',
    dashboardUrl: 'https://opencode.ai/',
    requiresCors: true,
  },

  together: {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    isFree: false,
    documentation: 'https://docs.together.ai/',
    dashboardUrl: 'https://api.together.xyz/settings/api-keys',
    requiresCors: true,
  },

  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    isFree: false,
    documentation: 'https://docs.x.ai/',
    dashboardUrl: 'https://console.x.ai/',
    requiresCors: true,
  },
};

// Obtener solo proveedores gratuitos
export const FREE_PROVIDERS = Object.values(AI_PROVIDERS).filter(p => p.isFree);

// Obtener proveedores que no necesitan CORS proxy
export const CORS_SAFE_PROVIDERS = Object.values(AI_PROVIDERS).filter(p => !p.requiresCors);

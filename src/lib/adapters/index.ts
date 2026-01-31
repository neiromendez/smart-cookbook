// Exportar todos los adaptadores y crear factory

import type { IAIProvider } from './ai-provider.interface';
import { AI_PROVIDERS } from './ai-provider.interface';
import { openRouterAdapter } from './openrouter.adapter';
import { groqAdapter } from './groq.adapter';
import { googleAdapter } from './google.adapter';
import { cerebrasAdapter } from './cerebras.adapter';
import { xaiAdapter } from './xai.adapter';
import { deepseekAdapter } from './deepseek.adapter';
import { opencodeAdapter } from './opencode.adapter';
import { openaiAdapter } from './openai.adapter';
import { anthropicAdapter } from './anthropic.adapter';
import { huggingfaceAdapter } from './huggingface.adapter';
import { togetherAdapter } from './together.adapter';
import { fireworksAdapter } from './fireworks.adapter';
import { mistralAdapter } from './mistral.adapter';

export * from './ai-provider.interface';
export { openRouterAdapter } from './openrouter.adapter';
export { groqAdapter } from './groq.adapter';
export { googleAdapter } from './google.adapter';
export { cerebrasAdapter } from './cerebras.adapter';
export { xaiAdapter } from './xai.adapter';
export { deepseekAdapter } from './deepseek.adapter';
export { opencodeAdapter } from './opencode.adapter';
export { openaiAdapter } from './openai.adapter';
export { anthropicAdapter } from './anthropic.adapter';
export { huggingfaceAdapter } from './huggingface.adapter';
export { togetherAdapter } from './together.adapter';
export { fireworksAdapter } from './fireworks.adapter';
export { mistralAdapter } from './mistral.adapter';

// Mapa de adaptadores disponibles
const adapters: Record<string, IAIProvider> = {
  openrouter: openRouterAdapter,
  groq: groqAdapter,
  google: googleAdapter,
  cerebras: cerebrasAdapter,
  xai: xaiAdapter,
  deepseek: deepseekAdapter,
  opencode: opencodeAdapter,
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  huggingface: huggingfaceAdapter,
  together: togetherAdapter,
  fireworks: fireworksAdapter,
  mistral: mistralAdapter,
};

/**
 * Factory para obtener el adaptador correcto segun el proveedor
 */
export function getAdapter(providerId: string): IAIProvider | null {
  return adapters[providerId] || null;
}

/**
 * Verificar si un proveedor tiene adaptador implementado
 */
export function hasAdapter(providerId: string): boolean {
  return providerId in adapters;
}

/**
 * Obtener todos los proveedores disponibles (solo los que tienen adaptador)
 */
export function getAllProviders() {
  return Object.values(AI_PROVIDERS)
    .filter(p => hasAdapter(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtener proveedores gratuitos (solo los que tienen adaptador)
 */
export function getFreeProviders() {
  return Object.values(AI_PROVIDERS).filter(p => p.isFree && hasAdapter(p.id));
}

/**
 * Obtener proveedores de pago (solo los que tienen adaptador)
 */
export function getPaidProviders() {
  return Object.values(AI_PROVIDERS).filter(p => !p.isFree && hasAdapter(p.id));
}

/**
 * Obtener proveedores que no necesitan proxy CORS
 * (Actualmente solo OpenRouter)
 */
export function getCorsafeProviders() {
  return Object.values(AI_PROVIDERS).filter(p => !p.requiresCors && hasAdapter(p.id));
}

/**
 * Obtener el proveedor recomendado (gratuito + CORS safe)
 */
export function getRecommendedProvider() {
  // OpenRouter es el unico que soporta CORS y es gratuito
  return AI_PROVIDERS.openrouter;
}

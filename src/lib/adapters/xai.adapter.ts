import { BaseOpenAIAdapter } from './base-openai.adapter';
import type { AIProviderConfig, ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';

/**
 * xAI (Grok) Adapter
 *
 * Modelos Grok 2, 3, 4 disponibles (2025)
 * Compatible con formato OpenAI
 * Soporta GET /models para listar modelos dinámicamente
 */
export class XAIAdapter extends BaseOpenAIAdapter {
    readonly config: AIProviderConfig = AI_PROVIDERS.xai;
    readonly defaultModel = 'grok-3';

    // Modelos por defecto cuando no hay API key
    // xAI soporta hasta 16K en playground, configurable via max_tokens
    protected getDefaultModels(): ModelInfo[] {
        return [
            { id: 'grok-3', name: 'Grok 3', contextWindow: 131072, maxOutputTokens: 16000, isFree: false },
            { id: 'grok-3-mini', name: 'Grok 3 Mini', contextWindow: 131072, maxOutputTokens: 16000, isFree: false },
            { id: 'grok-2-1212', name: 'Grok 2', contextWindow: 131072, maxOutputTokens: 16000, isFree: false },
            { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', contextWindow: 32768, maxOutputTokens: 16000, isFree: false },
        ];
    }

    protected getDefaultMaxOutputTokens(): number {
        return 16000; // xAI usa 16K como default en playground
    }
}

export const xaiAdapter = new XAIAdapter();

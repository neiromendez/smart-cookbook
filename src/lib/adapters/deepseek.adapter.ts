import { BaseOpenAIAdapter } from './base-openai.adapter';
import type { AIProviderConfig, ModelInfo } from '@/types';
import { AI_PROVIDERS } from './ai-provider.interface';

/**
 * DeepSeek Adapter
 *
 * Modelos: DeepSeek-V3 (chat) y DeepSeek-R1 (reasoner)
 * Muy economico: ~$0.28/1M input, ~$0.42/1M output
 * 128K context window
 * Soporta GET /models para listar modelos dinámicamente
 */
export class DeepSeekAdapter extends BaseOpenAIAdapter {
    readonly config: AIProviderConfig = AI_PROVIDERS.deepseek;
    readonly defaultModel = 'deepseek-chat';

    // Modelos por defecto cuando no hay API key
    protected getDefaultModels(): ModelInfo[] {
        return [
            { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', contextWindow: 128000, maxOutputTokens: 8192, isFree: false },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', contextWindow: 128000, maxOutputTokens: 8192, isFree: false },
        ];
    }

    protected getDefaultMaxOutputTokens(): number {
        return 8192; // DeepSeek usa 8K por defecto
    }
}

export const deepseekAdapter = new DeepSeekAdapter();

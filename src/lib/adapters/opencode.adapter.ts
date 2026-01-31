
import { AI_PROVIDERS } from './ai-provider.interface';
import { BaseOpenAIAdapter } from './base-openai.adapter';
import type { AIProviderConfig } from '@/types';

export class OpenCodeAdapter extends BaseOpenAIAdapter {
    readonly config: AIProviderConfig = AI_PROVIDERS.opencode;
    readonly defaultModel: string = 'opencode/fast-one';
}

export const opencodeAdapter = new OpenCodeAdapter();

import { AIModel } from '../../types';
import { APIProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { MistralProvider } from './providers/mistral';
import { GeminiProvider } from './providers/gemini';

export function createProvider(model: AIModel): APIProvider {
  switch (model) {
    case 'gpt4':
      return new OpenAIProvider();
    case 'claude':
      return new AnthropicProvider();
    case 'mistral':
      return new MistralProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}
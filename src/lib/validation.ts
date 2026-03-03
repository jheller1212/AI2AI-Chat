import { AIModel, ModelConfig } from '../types';

export function validateApiKey(apiKey: string): boolean {
  return apiKey.trim().length > 10;
}

export function validateModelConfig(model: AIModel, config: Partial<ModelConfig>): string[] {
  const errors: string[] = [];

  if (!config.apiKey || !validateApiKey(config.apiKey)) {
    errors.push(`API key is required for ${getModelLabel(model)}`);
  }

  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
  }

  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }
  }

  return errors;
}

export function getModelLabel(model: AIModel): string {
  switch (model) {
    case 'gpt4': return 'OpenAI';
    case 'claude': return 'Anthropic Claude';
    case 'gemini': return 'Google Gemini';
    case 'mistral': return 'Mistral';
    default: return model;
  }
}

import { AIModel, ModelConfig } from '../types';

export function validateApiKey(apiKey: string): boolean {
  if (!apiKey.trim()) return false;
  return import.meta.env.DEV || /^sk-[A-Za-z0-9]{48}$/.test(apiKey);
}

export function validateModelConfig(model: AIModel, config: Partial<ModelConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.apiKey) {
    errors.push('API key is required');
  } else if (!validateApiKey(config.apiKey)) {
    errors.push('Invalid OpenAI API key format');
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
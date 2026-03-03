export type AIModel = 'gpt4' | 'claude' | 'gemini' | 'mistral';

export interface ModelConfig {
  apiKey: string;
  orgId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface Message {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: number;
  model?: AIModel;
  wordCount?: number;
  timeTaken?: number;
  hidden?: boolean;
  botIndex?: 1 | 2;
}

export interface ChatConfig {
  model: AIModel;
  apiKey: string;
  orgId?: string;
  modelVersion: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}
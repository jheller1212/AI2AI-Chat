export interface APIResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface APIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

export interface APIConfig {
  apiKey: string;
  orgId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface APIProvider {
  makeRequest: (config: APIConfig, messages: Array<{role: string; content: string}>) => Promise<APIResponse>;
}
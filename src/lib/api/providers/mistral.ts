import { APIProvider, APIConfig, APIResponse } from '../types';

export class MistralProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>): Promise<APIResponse> {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Mistral API request failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}
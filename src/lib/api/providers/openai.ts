import { APIProvider, APIConfig, APIResponse } from '../types';

export class OpenAIProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>): Promise<APIResponse> {
    console.log('Making OpenAI API request:', {
      model: config.model,
      messages: messages.length,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.orgId ? { 'OpenAI-Organization': config.orgId } : {})
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
      console.error('OpenAI API Error:', error);
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    console.log('OpenAI API Response:', {
      content: data.choices[0].message.content.substring(0, 50) + '...',
      usage: data.usage
    });

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}
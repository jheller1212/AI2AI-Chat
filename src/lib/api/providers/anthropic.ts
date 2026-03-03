import { APIProvider, APIConfig, APIResponse } from '../types';

const REQUEST_TIMEOUT_MS = 30_000;

export class AnthropicProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>): Promise<APIResponse> {
    const systemText = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: config.model,
          messages: chatMessages,
          ...(systemText ? { system: systemText } : {}),
          max_tokens: config.maxTokens,
          temperature: config.temperature
        })
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text();
      let message = 'Anthropic API request failed';
      try { message = JSON.parse(body).error?.message ?? message; } catch { /* non-JSON body */ }
      throw new Error(message);
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text;
    if (typeof content !== 'string') throw new Error('Unexpected response format from Anthropic');

    return { content, usage: data.usage };
  }
}

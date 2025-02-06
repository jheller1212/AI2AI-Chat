import { APIProvider, APIConfig, APIResponse } from '../types';

export class GeminiProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>): Promise<APIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text
    };
  }
}
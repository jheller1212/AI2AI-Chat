import { APIProvider, APIConfig, APIResponse, APIError } from '../types';

const REQUEST_TIMEOUT_MS = 30_000;

export class GeminiProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>, signal?: AbortSignal): Promise<APIResponse> {
    const systemText = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    const chatMessages = messages.filter(m => m.role !== 'system');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      // API key goes in a header, not the URL, to avoid it appearing in logs/history
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.apiKey
          },
          body: JSON.stringify({
            contents: chatMessages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            })),
            ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens,
              // Gemini 2.5 models think by default and thought tokens count against
              // maxOutputTokens — disable on Flash variants (2.5 Pro cannot disable)
              ...(config.model.includes('2.5-flash')
                ? { thinkingConfig: { thinkingBudget: 0 } }
                : {})
            }
          })
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text();
      let message = 'Gemini API request failed';
      try { message = JSON.parse(body).error?.message ?? message; } catch { /* non-JSON body */ }
      const retryAfterRaw = response.headers.get('Retry-After');
      const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
      throw new APIError(message, response.status, retryAfter);
    }

    const data = await response.json();
    // Thinking models can emit thought parts before the answer — take the first
    // non-thought text part rather than assuming parts[0]
    const parts: Array<{ text?: string; thought?: boolean }> =
      data?.candidates?.[0]?.content?.parts ?? [];
    const content = parts.find(p => typeof p.text === 'string' && !p.thought)?.text;
    if (typeof content !== 'string') {
      throw new Error(
        data?.candidates?.[0]?.finishReason === 'MAX_TOKENS'
          ? 'Gemini used the entire token budget before producing a reply — increase Max Tokens.'
          : 'Unexpected response format from Gemini'
      );
    }

    return { content };
  }
}

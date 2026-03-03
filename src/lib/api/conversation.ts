import { Message, ChatConfig } from '../../types';
import { createProvider } from './factory';

export async function generateResponse(
  config: ChatConfig,
  messages: Message[]
): Promise<Message> {
  const startTime = Date.now();
  const provider = createProvider(config.model);

  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
    try {
      const result = await provider.makeRequest({
        apiKey: config.apiKey,
        orgId: config.orgId,
        model: config.modelVersion,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      }, apiMessages);

      const timeTaken = Date.now() - startTime;
      const wordCount = result.content.trim().split(/\s+/).filter(Boolean).length;

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        model: config.model,
        content: result.content,
        timestamp: Date.now(),
        wordCount,
        timeTaken
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  throw lastError;
}

import { AIModel, Message, ChatConfig } from '../../types';

export async function generateResponse(
  config: ChatConfig,
  messages: Message[]
): Promise<Message> {
  const startTime = Date.now();
  
  try {
    // Format messages for the API
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.orgId ? { 'OpenAI-Organization': config.orgId } : {})
      },
      body: JSON.stringify({
        model: config.modelVersion,
        messages: apiMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const timeTaken = Date.now() - startTime;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      model: config.model,
      content,
      timestamp: Date.now(),
      wordCount,
      timeTaken
    };
  } catch (error) {
    throw error;
  }
}
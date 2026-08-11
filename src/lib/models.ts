import type { AIModel } from '../types';

/**
 * Single source of truth for the selectable models per provider.
 * Used by both the per-bot model picker (ModelConfig) and the workshop
 * organizer panel (WorkshopAdmin). Update this list to add/refresh models.
 *
 * NOTE: conversations send `temperature` on every request, but Anthropic's
 * Opus 4.7+/Fable models REJECT it (HTTP 400). The Anthropic provider omits
 * `temperature` for those models (see `supportsTemperature` below), so they
 * can be listed here. The temperature control stays visible in the UI for
 * consistency; ModelConfig notes when the selected model ignores it.
 */
export interface ModelOption {
  id: string;
  name: string;
  /** Upper bound for the max-output-tokens control. */
  maxTokens: number;
  /** Cheaper/faster model recommended as the default for workshops. */
  workshopRecommended?: boolean;
}

export const PROVIDER_MODELS: Record<AIModel, ModelOption[]> = {
  gpt4: [
    { id: 'gpt-4.1', name: 'GPT-4.1', maxTokens: 32768 },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', maxTokens: 32768 },
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 16384 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 16384, workshopRecommended: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096 },
  ],
  claude: [
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8 (Latest)', maxTokens: 32000 },
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', maxTokens: 32000 },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', maxTokens: 16000 },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', maxTokens: 16000 },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', maxTokens: 16000, workshopRecommended: true },
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', maxTokens: 16000 },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', maxTokens: 16000 },
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 8192 },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', maxTokens: 8192 },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', maxTokens: 8192, workshopRecommended: true },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 8192 },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', maxTokens: 4096 },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', maxTokens: 4096 },
    { id: 'mistral-small-latest', name: 'Mistral Small', maxTokens: 4096, workshopRecommended: true },
    { id: 'open-mistral-7b', name: 'Mistral 7B (Open)', maxTokens: 4096 },
  ],
};

/** Provider lookup tolerant of a plain string key (e.g. from form state). */
export function getProviderModels(provider: string): ModelOption[] {
  return PROVIDER_MODELS[provider as AIModel] ?? [];
}

/**
 * Whether a model accepts the `temperature` sampling parameter. Anthropic's
 * Opus 4.7+ and Fable/Mythos models reject `temperature` (HTTP 400) — they use
 * adaptive reasoning instead. All other models (incl. older Claude, OpenAI,
 * Gemini, Mistral) accept it.
 */
export function supportsTemperature(modelId: string): boolean {
  const id = (modelId || '').toLowerCase();
  if (id.startsWith('claude-opus-4-7') || id.startsWith('claude-opus-4-8')) return false;
  if (id.startsWith('claude-fable') || id.startsWith('claude-mythos')) return false;
  return true;
}

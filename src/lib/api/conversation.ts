import { Message, ChatConfig } from '../../types';
import { createProvider } from './factory';
import { APIError } from './types';
import { withRequestSlot } from './requestGate';

/** Why a turn is currently waiting, surfaced to the UI so the user sees a
 *  "waiting for capacity" state instead of a silent spinner or an error.
 *  `null` means the request is actively in flight (clear any waiting state). */
export type WaitStatus =
  | { kind: 'queued' }
  | { kind: 'rate-limited'; retryInMs: number; attempt: number }
  | null;

/** HTTP status codes that are safe to retry (rate-limit / server overload). */
const RETRYABLE_STATUSES = new Set([429, 503, 529]);

/** Total attempts (1 initial + N retries). Tuned for many participants sharing
 *  one API key in a workshop, where transient 429 bursts are expected. */
const MAX_ATTEMPTS = 5;

/** Base fallback delays (ms) per retry when no Retry-After header is present.
 *  Actual waits are jittered (see jitteredDelay) so concurrent clients don't all
 *  retry on the same beat and re-trigger the rate limit (thundering herd). */
const FALLBACK_DELAYS_MS = [2_000, 6_000, 15_000, 30_000];

/** Maximum number of ms we will honour from a Retry-After header. */
const MAX_RETRY_AFTER_MS = 60_000;

/** Spread the wait across 50–100% of the base (fallback) or add 0–2s on top of a
 *  server-provided Retry-After, so 30 simultaneous retries fan out over time. */
function jitteredDelay(baseMs: number, fromRetryAfter: boolean): number {
  return fromRetryAfter
    ? baseMs + Math.round(Math.random() * 2_000)
    : Math.round(baseMs * (0.5 + Math.random() * 0.5));
}

/** Sleep that rejects immediately if the signal aborts, so Stop interrupts retry waits. */
function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function generateResponse(
  config: ChatConfig,
  messages: Message[],
  signal?: AbortSignal,
  onWait?: (status: WaitStatus) => void,
): Promise<Message> {
  const startTime = Date.now();
  const provider = createProvider(config.model);

  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      // Respect Retry-After header if the previous error included one; otherwise use
      // fixed fallback delays that are long enough for typical overload scenarios.
      // Either way the wait is jittered to de-synchronise concurrent clients.
      const fromRetryAfter = lastError instanceof APIError && lastError.retryAfter != null;
      const base = fromRetryAfter
        ? Math.min((lastError as APIError).retryAfter! * 1000, MAX_RETRY_AFTER_MS)
        : (FALLBACK_DELAYS_MS[attempt - 1] ?? 30_000);
      const delayMs = jitteredDelay(base, fromRetryAfter);
      onWait?.({ kind: 'rate-limited', retryInMs: delayMs, attempt });
      await abortableDelay(delayMs, signal);
    }

    try {
      const result = await withRequestSlot(
        () => {
          onWait?.(null); // slot acquired — request is now actually in flight
          return provider.makeRequest({
            apiKey: config.apiKey,
            orgId: config.orgId,
            model: config.modelVersion,
            temperature: config.temperature,
            maxTokens: config.maxTokens
          }, apiMessages, signal);
        },
        () => onWait?.({ kind: 'queued' }),
      );

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

      // For API errors with a non-retryable status (e.g. 401 auth, 400 bad request),
      // fail immediately — retrying won't help.
      if (error instanceof APIError && !RETRYABLE_STATUSES.has(error.status)) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

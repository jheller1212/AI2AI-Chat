/**
 * Per-browser concurrency gate for outbound provider requests.
 *
 * In a workshop a single participant may run several AI-to-AI conversations at
 * once. Without a gate, each conversation turn fires immediately and a browser
 * can fan out a burst of simultaneous requests against the shared API key. This
 * caps the number of in-flight requests per browser and queues the rest FIFO,
 * so excess turns wait for a free slot instead of all hitting the key at once.
 *
 * The gate wraps only the actual in-flight request — not retry backoff waits —
 * so a slot is released while a turn is sleeping between retry attempts.
 */

const MAX_CONCURRENT = 4;

let active = 0;
const waiters: Array<() => void> = [];

/** Number of requests currently waiting for a free slot. */
export function queueDepth(): number {
  return waiters.length;
}

/**
 * Run `fn` once a concurrency slot is free. If the gate is saturated, `onQueued`
 * is called and the request waits FIFO. The slot is always released, even if
 * `fn` throws.
 */
export async function withRequestSlot<T>(
  fn: () => Promise<T>,
  onQueued?: () => void,
): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    onQueued?.();
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    const next = waiters.shift();
    if (next) next();
  }
}

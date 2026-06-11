import { supabase } from './supabase';

export type AnalyticsEventType =
  | 'conversation_started'
  | 'conversation_completed'
  | 'provider_error'
  | 'export';

/**
 * First-party event logging into the user's own Supabase `events` rows
 * (RLS-scoped, no third-party trackers). Fire-and-forget: analytics must
 * never block or break the app.
 */
export function trackEvent(
  userId: string,
  eventType: AnalyticsEventType,
  payload: Record<string, unknown> = {},
): void {
  if (!userId) return;
  supabase
    .from('events')
    .insert({ user_id: userId, event_type: eventType, payload })
    .then(({ error }) => {
      if (error) console.warn(`analytics event not saved: ${error.message}`);
    });
}

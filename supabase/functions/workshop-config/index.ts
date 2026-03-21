import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPER_ADMIN = 'jonasheller89@gmail.com';

const ALLOWED_ORIGINS = [
  'https://ai2aichat.com',
  'https://www.ai2aichat.com',
  'https://ai2ai-chat.netlify.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(secret: string, salt: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(secret), 'HKDF', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(salt), info: enc.encode('workshop-keys-v1') },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
  ));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv);
  combined.set(ct, iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(key: CryptoKey, encoded: string): Promise<string> {
  const raw = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const ct = raw.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(plain);
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function isOrganizer(admin: any, email: string): Promise<boolean> {
  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower === SUPER_ADMIN) return true;
  const { data } = await admin
    .from('workshop_organizers')
    .select('id')
    .eq('email', emailLower)
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionSecret = Deno.env.get('API_KEYS_ENCRYPTION_SECRET');

    if (!encryptionSecret) {
      return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    // === GET-PUBLIC: no auth required, returns only name + welcome ===
    if (action === 'get-public') {
      const { code } = body;
      if (!code || typeof code !== 'string') {
        return jsonResponse({ error: 'Missing workshop code' }, 400, corsHeaders);
      }

      const { data, error } = await admin
        .from('workshops')
        .select('name, welcome')
        .eq('code', code.toLowerCase().trim())
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        return jsonResponse({ error: 'Workshop not found' }, 404, corsHeaders);
      }

      return jsonResponse({ name: data.name, welcome: data.welcome }, 200, corsHeaders);
    }

    // All other actions require auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401, corsHeaders);
    }

    // === CHECK: is current user an organizer? ===
    if (action === 'check-organizer') {
      const organizer = await isOrganizer(admin, user.email || '');
      return jsonResponse({ isOrganizer: organizer }, 200, corsHeaders);
    }

    // === GET: fetch workshop config by code (any authenticated user) ===
    if (action === 'get') {
      const { code } = body;
      if (!code || typeof code !== 'string') {
        return jsonResponse({ error: 'Missing workshop code' }, 400, corsHeaders);
      }

      const { data, error } = await admin
        .from('workshops')
        .select('id, code, name, welcome, api_key, provider, scenario, config, active')
        .eq('code', code.toLowerCase().trim())
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        return jsonResponse({ error: 'Workshop not found' }, 404, corsHeaders);
      }

      const cryptoKey = await deriveKey(encryptionSecret, `workshop-${data.id}`);
      let apiKey: string;
      try {
        apiKey = await decrypt(cryptoKey, data.api_key);
      } catch {
        return jsonResponse({ error: 'Failed to decrypt workshop key' }, 500, corsHeaders);
      }

      return jsonResponse({
        name: data.name,
        welcome: data.welcome,
        provider: data.provider,
        apiKey,
        scenario: data.scenario,
        config: data.config,
      }, 200, corsHeaders);
    }

    // === LIST: organizers only ===
    if (action === 'list') {
      if (!await isOrganizer(admin, user.email || '')) {
        return jsonResponse({ error: 'Not authorized' }, 403, corsHeaders);
      }

      const { data, error } = await admin
        .from('workshops')
        .select('code, name, welcome, provider, active, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        return jsonResponse({ error: 'Failed to list workshops' }, 500, corsHeaders);
      }

      return jsonResponse({ workshops: data || [] }, 200, corsHeaders);
    }

    // === CREATE: organizers only ===
    if (action === 'create') {
      if (!await isOrganizer(admin, user.email || '')) {
        return jsonResponse({ error: 'Not authorized' }, 403, corsHeaders);
      }

      const { code, name, welcome, apiKey, provider, scenario, config } = body;
      if (!code || !name || !apiKey) {
        return jsonResponse({ error: 'Missing required fields (code, name, apiKey)' }, 400, corsHeaders);
      }

      const { data: inserted, error: insertError } = await admin
        .from('workshops')
        .insert({
          code: code.toLowerCase().trim(),
          name,
          welcome: welcome || '',
          api_key: 'placeholder',
          provider: provider || 'gpt4',
          scenario: scenario || null,
          config: config || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (insertError) {
        const msg = insertError.message.includes('unique') ? 'A workshop with this code already exists' : insertError.message;
        return jsonResponse({ error: msg }, 500, corsHeaders);
      }

      const cryptoKey = await deriveKey(encryptionSecret, `workshop-${inserted.id}`);
      const encryptedKey = await encrypt(cryptoKey, apiKey);

      await admin
        .from('workshops')
        .update({ api_key: encryptedKey })
        .eq('id', inserted.id);

      return jsonResponse({ success: true, code }, 200, corsHeaders);
    }

    // === UPDATE: organizers only ===
    if (action === 'update') {
      if (!await isOrganizer(admin, user.email || '')) {
        return jsonResponse({ error: 'Not authorized' }, 403, corsHeaders);
      }

      const { code, apiKey, name, welcome, provider, scenario, config, active } = body;
      if (!code) {
        return jsonResponse({ error: 'Missing workshop code' }, 400, corsHeaders);
      }

      const { data: existing } = await admin
        .from('workshops')
        .select('id')
        .eq('code', code.toLowerCase().trim())
        .maybeSingle();

      if (!existing) {
        return jsonResponse({ error: 'Workshop not found' }, 404, corsHeaders);
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (welcome !== undefined) updates.welcome = welcome;
      if (provider !== undefined) updates.provider = provider;
      if (scenario !== undefined) updates.scenario = scenario;
      if (config !== undefined) updates.config = config;
      if (active !== undefined) updates.active = active;

      if (apiKey) {
        const cryptoKey = await deriveKey(encryptionSecret, `workshop-${existing.id}`);
        updates.api_key = await encrypt(cryptoKey, apiKey);
      }

      await admin.from('workshops').update(updates).eq('id', existing.id);

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    // === ADD-ORGANIZER: super admin only ===
    if (action === 'add-organizer') {
      if (user.email !== SUPER_ADMIN) {
        return jsonResponse({ error: 'Only the super admin can add organizers' }, 403, corsHeaders);
      }

      const { email } = body;
      if (!email) {
        return jsonResponse({ error: 'Missing email' }, 400, corsHeaders);
      }

      const { error } = await admin
        .from('workshop_organizers')
        .upsert({ email: email.toLowerCase().trim(), added_by: user.id }, { onConflict: 'email' });

      if (error) {
        return jsonResponse({ error: error.message }, 500, corsHeaders);
      }

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    // === TRACK-SIGNUP: record that a user signed up via a workshop link ===
    if (action === 'track-signup') {
      const { code } = body;
      if (!code || typeof code !== 'string') {
        return jsonResponse({ error: 'Missing workshop code' }, 400, corsHeaders);
      }

      await admin.from('workshop_signups').insert({
        user_id: user.id,
        workshop_code: code.toLowerCase().trim(),
      });

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Invalid action' }, 400, corsHeaders);
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500, getCorsHeaders(req));
  }
});

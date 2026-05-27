// functions/clienti.js — Cloudflare Pages

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function sbFetch(url, key, path, options = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SB ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE = env.SUPABASE_SERVICE_KEY;

  if (request.method === 'OPTIONS') return new Response('', { headers: corsHeaders });

  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const telefono = url.searchParams.get('telefono');
      if (!telefono) return json({ error: 'telefono richiesto' }, 400);
      const rows = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=*`);
      if (rows && rows.length > 0) return json({ trovato: true, cliente: rows[0] });
      return json({ trovato: false });
    }

    if (request.method === 'POST') {
      const { telefono, nome, pizza_preferita } = await request.json();
      if (!telefono || !nome) return json({ error: 'dati mancanti' }, 400);
      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const existing = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`);
      if (existing && existing.length > 0) {
        await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}`, {
          method: 'PATCH',
          body: JSON.stringify({ nome, ordini_count: (existing[0].ordini_count || 0) + 1, ultima_visita: oggi, ...(pizza_preferita ? { pizza_preferita } : {}) }),
        });
      } else {
        await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, '/clienti', {
          method: 'POST',
          body: JSON.stringify({ telefono, nome, ordini_count: 1, ultima_visita: oggi, pizza_preferita: pizza_preferita || null }),
        });
      }
      return json({ ok: true });
    }

    if (request.method === 'DELETE') {
      const telefono = url.searchParams.get('telefono');
      if (!telefono) return json({ error: 'telefono richiesto' }, 400);
      await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}`, { method: 'DELETE' });
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

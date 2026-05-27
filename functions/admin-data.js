// functions/admin-data.js — Cloudflare Pages

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
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
  const ADMIN_TOKEN = env.ADMIN_TOKEN;

  if (request.method === 'OPTIONS') return new Response('', { headers: corsHeaders });

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';

  // Login
  if (request.method === 'POST' && action === 'login') {
    const { password } = await request.json();
    if (password === ADMIN_TOKEN) {
      const oggi = new Date().toISOString().split('T')[0];
      const token = btoa(ADMIN_TOKEN + ':' + oggi);
      return json({ ok: true, token });
    }
    return json({ ok: false, error: 'Password errata' }, 401);
  }

  // Verifica token
  const token = request.headers.get('x-admin-token');
  const oggi = new Date().toISOString().split('T')[0];
  const validToken = btoa(ADMIN_TOKEN + ':' + oggi);
  if (token !== validToken) return json({ error: 'Non autorizzato' }, 401);

  try {
    if (request.method === 'GET' && action === 'slot') {
      const dataOggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const rows = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/slot_ordini?data=eq.${dataOggi}&select=orario,pizze_count,slot_esclusivo,max_pizze&order=orario.asc`);
      return json(rows || []);
    }

    if (request.method === 'GET' && action === 'clienti') {
      const rows = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?select=*&order=ordini_count.desc`);
      return json(rows || []);
    }

    if (request.method === 'DELETE' && action === 'slot') {
      const { orario, data } = await request.json();
      const orDb = orario.length === 5 ? orario + ':00' : orario;
      await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/slot_ordini?data=eq.${data}&orario=eq.${orDb}`, { method: 'DELETE' });
      return json({ ok: true });
    }

    if (request.method === 'DELETE' && action === 'slot-all') {
      const dataOggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/slot_ordini?data=eq.${dataOggi}`, { method: 'DELETE' });
      return json({ ok: true });
    }

    if (request.method === 'POST' && action === 'slot-max') {
      const { orario, data, max_pizze } = await request.json();
      const orDb = orario.length === 5 ? orario + ':00' : orario;
      await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/slot_ordini?data=eq.${data}&orario=eq.${orDb}`, {
        method: 'PATCH',
        body: JSON.stringify({ max_pizze }),
        headers: { 'Prefer': 'return=minimal' }
      });
      return json({ ok: true });
    }

    return json({ error: 'Azione non valida' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

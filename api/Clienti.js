// functions/api/clienti.js — Cloudflare Pages Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function supabaseFetch(url, key, path, options = {}) {
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
  return text ? JSON.parse(text) : null;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const url = context.env.SUPABASE_URL;
  const key = context.env.SUPABASE_SERVICE_KEY;
  const params = new URL(context.request.url).searchParams;
  const telefono = params.get('telefono');

  if (!telefono) return jsonResp({ error: 'telefono richiesto' }, 400);

  const rows = await supabaseFetch(url, key,
    `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=*`
  );

  if (rows && rows.length > 0) return jsonResp({ trovato: true, cliente: rows[0] });
  return jsonResp({ trovato: false });
}

export async function onRequestPost(context) {
  const url = context.env.SUPABASE_URL;
  const key = context.env.SUPABASE_SERVICE_KEY;
  const body = await context.request.json();
  const { telefono, nome, pizza_preferita } = body;

  if (!telefono || !nome) return jsonResp({ error: 'dati mancanti' }, 400);

  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const rows = await supabaseFetch(url, key,
    `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`
  );

  if (rows && rows.length > 0) {
    await supabaseFetch(url, key, `/clienti?telefono=eq.${encodeURIComponent(telefono)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        nome,
        ordini_count: (rows[0].ordini_count || 0) + 1,
        ultima_visita: oggi,
        ...(pizza_preferita ? { pizza_preferita } : {}),
      }),
    });
  } else {
    await supabaseFetch(url, key, '/clienti', {
      method: 'POST',
      body: JSON.stringify({ telefono, nome, ordini_count: 1, ultima_visita: oggi, pizza_preferita: pizza_preferita || null }),
    });
  }
  return jsonResp({ ok: true });
}

export async function onRequestDelete(context) {
  const url = context.env.SUPABASE_URL;
  const key = context.env.SUPABASE_SERVICE_KEY;
  const params = new URL(context.request.url).searchParams;
  const telefono = params.get('telefono');

  if (!telefono) return jsonResp({ error: 'telefono richiesto' }, 400);
  await supabaseFetch(url, key, `/clienti?telefono=eq.${encodeURIComponent(telefono)}`, { method: 'DELETE' });
  return jsonResp({ ok: true });
}

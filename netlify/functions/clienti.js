// netlify/functions/clienti.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sbFetch(path, key, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      // Fallback: prova a parsare dalla path
      const telefono = params.telefono || new URLSearchParams(event.rawQuery || '').get('telefono');
      if (!telefono) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dati mancanti' }) };

      const rows = await sbFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=*`, SUPABASE_ANON);
      if (rows && rows.length > 0) return { statusCode: 200, headers, body: JSON.stringify({ trovato: true, cliente: rows[0] }) };
      return { statusCode: 200, headers, body: JSON.stringify({ trovato: false }) };
    }

    if (event.httpMethod === 'POST') {
      const { telefono, nome, pizza_preferita } = JSON.parse(event.body || '{}');
      if (!telefono || !nome) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dati mancanti' }) };

      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const existing = await sbFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`, SUPABASE_ANON);

      if (existing && existing.length > 0) {
        await sbFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}`, SUPABASE_SERVICE, {
          method: 'PATCH',
          body: JSON.stringify({ nome, ordini_count: (existing[0].ordini_count || 0) + 1, ultima_visita: oggi, ...(pizza_preferita ? { pizza_preferita } : {}) }),
        });
      } else {
        await sbFetch('/clienti', SUPABASE_SERVICE, {
          method: 'POST',
          body: JSON.stringify({ telefono, nome, ordini_count: 1, ultima_visita: oggi, pizza_preferita: pizza_preferita || null }),
        });
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      const { telefono } = event.queryStringParameters || {};
      if (!telefono) return { statusCode: 400, headers, body: JSON.stringify({ error: 'telefono richiesto' }) };
      await sbFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}`, SUPABASE_SERVICE, { method: 'DELETE' });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

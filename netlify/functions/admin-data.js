// netlify/functions/admin-data.js
// Funzione backend sicura per la dashboard admin

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Content-Type': 'application/json',
};

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
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

  const action = event.queryStringParameters?.action || '';

  // LOGIN — verifica password e restituisce token
  if (event.httpMethod === 'POST' && action === 'login') {
    const { password } = JSON.parse(event.body || '{}');
    if (password === ADMIN_TOKEN) {
      // Token = hash semplice della password + timestamp del giorno
      const oggi = new Date().toISOString().split('T')[0];
      const sessionToken = Buffer.from(ADMIN_TOKEN + ':' + oggi).toString('base64');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token: sessionToken }) };
    }
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Password errata' }) };
  }

  // Verifica token per tutte le altre chiamate
  const token = event.headers['x-admin-token'];
  const oggi = new Date().toISOString().split('T')[0];
  const validToken = Buffer.from(ADMIN_TOKEN + ':' + oggi).toString('base64');
  if (token !== validToken) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }

  try {
    // GET slot di oggi
    if (event.httpMethod === 'GET' && action === 'slot') {
      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const rows = await sbFetch(`/slot_ordini?data=eq.${oggi}&select=orario,pizze_count,slot_esclusivo,max_pizze&order=orario.asc`);
      return { statusCode: 200, headers, body: JSON.stringify(rows || []) };
    }

    // GET clienti
    if (event.httpMethod === 'GET' && action === 'clienti') {
      const rows = await sbFetch(`/clienti?select=*&order=ordini_count.desc`);
      return { statusCode: 200, headers, body: JSON.stringify(rows || []) };
    }

    // DELETE slot singolo
    if (event.httpMethod === 'DELETE' && action === 'slot') {
      const { orario, data } = JSON.parse(event.body || '{}');
      const orDb = orario.length === 5 ? orario + ':00' : orario;
      await sbFetch(`/slot_ordini?data=eq.${data}&orario=eq.${orDb}`, { method: 'DELETE' });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // DELETE tutti slot oggi
    if (event.httpMethod === 'DELETE' && action === 'slot-all') {
      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      await sbFetch(`/slot_ordini?data=eq.${oggi}`, { method: 'DELETE' });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // PATCH max pizze slot
    if (event.httpMethod === 'POST' && action === 'slot-max') {
      const { orario, data, max_pizze } = JSON.parse(event.body || '{}');
      const orDb = orario.length === 5 ? orario + ':00' : orario;
      await sbFetch(`/slot_ordini?data=eq.${data}&orario=eq.${orDb}`, {
        method: 'PATCH',
        body: JSON.stringify({ max_pizze }),
        headers: { 'Prefer': 'return=minimal' }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Azione non valida' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

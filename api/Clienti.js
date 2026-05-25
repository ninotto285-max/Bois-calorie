// api/clienti.js — BoisPizza Pinguino — Gestione clienti Supabase

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nndriusznthrpdamgtst.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function supabaseFetch(path, key, options = {}) {
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
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { telefono } = req.query;
      if (!telefono) return res.status(400).json({ error: 'telefono richiesto' });

      const rows = await supabaseFetch(
        `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=*`,
        SUPABASE_ANON
      );
      if (rows && rows.length > 0) return res.status(200).json({ trovato: true, cliente: rows[0] });
      return res.status(200).json({ trovato: false });
    }

    if (req.method === 'POST') {
      const { telefono, nome, pizza_preferita } = req.body;
      if (!telefono || !nome) return res.status(400).json({ error: 'dati mancanti' });

      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const existing = await supabaseFetch(
        `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`,
        SUPABASE_ANON
      );

      if (existing && existing.length > 0) {
        await supabaseFetch(
          `/clienti?telefono=eq.${encodeURIComponent(telefono)}`,
          SUPABASE_SERVICE,
          {
            method: 'PATCH',
            body: JSON.stringify({
              nome,
              ordini_count: (existing[0].ordini_count || 0) + 1,
              ultima_visita: oggi,
              ...(pizza_preferita ? { pizza_preferita } : {}),
            }),
          }
        );
      } else {
        await supabaseFetch('/clienti', SUPABASE_SERVICE, {
          method: 'POST',
          body: JSON.stringify({
            telefono,
            nome,
            ordini_count: 1,
            ultima_visita: oggi,
            pizza_preferita: pizza_preferita || null,
          }),
        });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { telefono } = req.query;
      if (!telefono) return res.status(400).json({ error: 'telefono richiesto' });
      await supabaseFetch(
        `/clienti?telefono=eq.${encodeURIComponent(telefono)}`,
        SUPABASE_SERVICE,
        { method: 'DELETE' }
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Clienti error:', err);
    return res.status(500).json({ error: err.message });
  }
}

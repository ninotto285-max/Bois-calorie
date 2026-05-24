// api/clienti.js — BoisPizza Pinguino — Gestione clienti Supabase
const SUPABASE_URL = 'https://nndriusznthrpdamgtst.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET /api/clienti?telefono=3401234567 — cerca cliente
    if (req.method === 'GET') {
      const { telefono } = req.query;
      if (!telefono) return res.status(400).json({ error: 'telefono richiesto' });
      const rows = await supabaseFetch(
        `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=*`
      );
      if (rows && rows.length > 0) {
        return res.status(200).json({ trovato: true, cliente: rows[0] });
      }
      return res.status(200).json({ trovato: false });
    }

    // POST /api/clienti — salva o aggiorna cliente
    if (req.method === 'POST') {
      const { telefono, nome, pizza_preferita } = req.body;
      if (!telefono || !nome) return res.status(400).json({ error: 'dati mancanti' });

      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });

      // Cerca se esiste già
      const rows = await supabaseFetch(
        `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`
      );

      if (rows && rows.length > 0) {
        // Aggiorna
        await supabaseFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nome,
            ordini_count: (rows[0].ordini_count || 0) + 1,
            ultima_visita: oggi,
            ...(pizza_preferita ? { pizza_preferita } : {}),
          }),
        });
      } else {
        // Crea nuovo
        await supabaseFetch('/clienti', {
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

    // DELETE /api/clienti?telefono=3401234567 — cancella cliente (GDPR)
    if (req.method === 'DELETE') {
      const { telefono } = req.query;
      if (!telefono) return res.status(400).json({ error: 'telefono richiesto' });
      await supabaseFetch(`/clienti?telefono=eq.${encodeURIComponent(telefono)}`, {
        method: 'DELETE',
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Clienti error:', err);
    return res.status(500).json({ error: err.message });
  }
}

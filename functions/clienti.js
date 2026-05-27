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
      const { telefono, nome, pizza_preferita, ultimo_ordine, vuole_spicchi, instagram_follower, whatsapp_marketing, punti, punti_da_aggiungere, premio_riscattato, compleanno, buono_compleanno_usato } = await request.json();
      if (!telefono || !nome) return json({ error: 'dati mancanti' }, 400);
      const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      const existing = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}&select=ordini_count`);
      if (existing && existing.length > 0) {
        const _isNuovoOrdine = nome && !premio_riscattato && !punti_da_aggiungere && punti === undefined;
        const _updateData = {};
        if(nome && _isNuovoOrdine) { _updateData.nome = nome; _updateData.ultima_visita = oggi; }
        else if(nome) { _updateData.nome = nome; }
        if(_isNuovoOrdine) _updateData.ordini_count = (existing[0].ordini_count || 0) + 1;
        if(pizza_preferita) _updateData.pizza_preferita = pizza_preferita;
        if(ultimo_ordine) _updateData.ultimo_ordine = ultimo_ordine;
        if(vuole_spicchi !== undefined) _updateData.vuole_spicchi = vuole_spicchi;
        if(instagram_follower !== undefined) _updateData.instagram_follower = instagram_follower;
        if(whatsapp_marketing !== undefined) _updateData.whatsapp_marketing = whatsapp_marketing;
        if(compleanno !== undefined) _updateData.compleanno = compleanno;
        if(buono_compleanno_usato !== undefined) _updateData.buono_compleanno_usato = buono_compleanno_usato;
        // Aggiorna punti
        if(punti !== undefined) _updateData.punti = punti; // set diretto (dopo riscatto)
        if(punti_da_aggiungere) {
          _updateData.punti = (existing[0].punti || 0) + punti_da_aggiungere;
          _updateData.punti_totali_storici = (existing[0].punti_totali_storici || 0) + punti_da_aggiungere;
        }
        // Aggiorna badge
        const _newCount = _updateData.ordini_count || existing[0].ordini_count || 0;
        _updateData.badge = _newCount >= 20 ? 'superfan' : _newCount >= 10 ? 'vip' : _newCount >= 5 ? 'loyal' : _newCount >= 2 ? 'regular' : 'nuovo';
        // Aggiorna frequenza
        if(existing[0].prima_visita && _isNuovoOrdine){
          const _giorni = Math.round((new Date(oggi)-new Date(existing[0].prima_visita))/(1000*60*60*24));
          if(_newCount > 1) _updateData.frequenza_giorni = Math.round(_giorni/(_newCount-1));
        }
        await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/clienti?telefono=eq.${encodeURIComponent(telefono)}`, {
          method: 'PATCH',
          body: JSON.stringify(_updateData),
        });
      } else {
        await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, '/clienti', {
          method: 'POST',
          body: JSON.stringify({ telefono, nome, ordini_count: 1, ultima_visita: oggi, pizza_preferita: pizza_preferita || null, ultimo_ordine: ultimo_ordine || null, vuole_spicchi: vuole_spicchi || false, badge: 'nuovo', compleanno: compleanno || null, prima_visita: oggi }),
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

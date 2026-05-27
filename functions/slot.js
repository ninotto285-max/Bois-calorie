// functions/slot.js — Cloudflare Pages

const MAX_PIZZE = 12;

function getSlots() {
  const slots = [];
  for (let h = 18; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 18 && m < 30) continue;
      if (h === 21 && m > 30) continue;
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return slots;
}

function orDb(orario) {
  return orario.length === 5 ? orario + ':00' : orario;
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export async function onRequest(context) {
  const { request, env } = context;
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_ANON = env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE = env.SUPABASE_SERVICE_KEY;

  if (request.method === 'OPTIONS') return new Response('', { headers: corsHeaders });

  const url = new URL(request.url);

  async function getSlotInfo(data, orario) {
    try {
      const rows = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE,
        `/slot_ordini?data=eq.${data}&orario=eq.${orDb(orario)}&select=id,pizze_count,slot_esclusivo,max_pizze`
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch(e) { return null; }
  }

  async function trovaSlotsVicini(data, orario, nPizze, maxPizze) {
    const slots = getSlots();
    const idx = slots.indexOf(orario);
    const vicini = [];
    for (let delta = 1; delta <= 4; delta++) {
      for (const dir of [-1, 1]) {
        const i = idx + dir * delta;
        if (i < 0 || i >= slots.length) continue;
        const s = slots[i];
        const info = await getSlotInfo(data, s);
        const maxS = info ? (info.max_pizze || maxPizze) : maxPizze;
        const countS = info ? (info.pizze_count || 0) : 0;
        if (info && info.slot_esclusivo) continue;
        const libere = maxS - countS;
        if (nPizze <= libere && !vicini.find(v => v.orario === s))
          vicini.push({ orario: s, libere });
      }
      if (vicini.length >= 2) break;
    }
    return vicini;
  }

  try {
    if (request.method === 'GET') {
      const data = url.searchParams.get('data');
      const orario = url.searchParams.get('orario');
      const pizze = url.searchParams.get('pizze');
      if (!data || !orario) return json({ error: 'dati mancanti' }, 400);

      const nPizze = parseInt(pizze) || 1;
      const slotInfo = await getSlotInfo(data, orario);
      const maxS = slotInfo ? (slotInfo.max_pizze || MAX_PIZZE) : MAX_PIZZE;
      const countS = slotInfo ? (slotInfo.pizze_count || 0) : 0;
      const esclusivo = slotInfo ? slotInfo.slot_esclusivo : false;

      if (esclusivo) {
        const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
        return json({ disponibile: false, libere: 0, maxPizze: maxS, slot_esclusivo: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
      }

      const ordineGrande = nPizze >= maxS;
      if (ordineGrande && countS > 0) {
        const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
        return json({ disponibile: false, libere: 0, maxPizze: maxS, ordine_grande: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
      }
      if (ordineGrande) return json({ disponibile: true, libere: maxS, maxPizze: maxS, ordine_grande: true });

      const libere = maxS - countS;
      if (nPizze <= libere) return json({ disponibile: true, libere, maxPizze: maxS });

      const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
      return json({ disponibile: false, libere, maxPizze: maxS, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { data, orario, pizze } = body;
      if (!data || !orario || !pizze) return json({ error: 'dati mancanti' }, 400);

      const nPizze = parseInt(pizze);
      const ordineGrande = nPizze >= MAX_PIZZE;

      const existing = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE,
        `/slot_ordini?data=eq.${data}&orario=eq.${orDb(orario)}&select=id,pizze_count,max_pizze`
      );

      if (existing && existing.length > 0) {
        const slot = existing[0];
        const maxS = slot.max_pizze || MAX_PIZZE;
        const updated = await sbFetch(SUPABASE_URL, SUPABASE_SERVICE,
          `/slot_ordini?id=eq.${slot.id}&pizze_count=lte.${maxS - nPizze}`,
          { method: 'PATCH', body: JSON.stringify({ pizze_count: slot.pizze_count + nPizze, slot_esclusivo: ordineGrande }), headers: { 'Prefer': 'return=representation' } }
        );
        if (!updated || updated.length === 0) return json({ error: 'Slot pieno' }, 409);
      } else {
        await sbFetch(SUPABASE_URL, SUPABASE_SERVICE, '/slot_ordini', {
          method: 'POST',
          body: JSON.stringify({ data, orario: orDb(orario), pizze_count: nPizze, slot_esclusivo: ordineGrande, max_pizze: MAX_PIZZE }),
        });
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      sbFetch(SUPABASE_URL, SUPABASE_SERVICE, `/slot_ordini?data=lt.${cutoff.toISOString().split('T')[0]}`, { method: 'DELETE' }).catch(() => {});

      return json({ ok: true, slot_esclusivo: ordineGrande });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

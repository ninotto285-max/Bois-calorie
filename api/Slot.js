// functions/api/slot.js — Cloudflare Pages Function
const MAX_PIZZE = { feriale: 6, weekend: 10 };

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

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

async function supabaseFetch(url, anon, path, options = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': anon,
      'Authorization': `Bearer ${anon}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getSlotInfo(url, anon, data, orario) {
  const orarioDb = orario.length === 5 ? orario + ':00' : orario;
  const rows = await supabaseFetch(url, anon,
    `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=pizze_count,slot_esclusivo`
  );
  if (rows && rows.length > 0) {
    return { pizze_count: rows[0].pizze_count || 0, slot_esclusivo: rows[0].slot_esclusivo || false };
  }
  return { pizze_count: 0, slot_esclusivo: false };
}

async function trovaSlotsVicini(url, anon, data, orario, nPizze, maxPizze, slots) {
  const idx = slots.indexOf(orario);
  const vicini = [];
  for (let delta = 1; delta <= 4; delta++) {
    for (const dir of [-1, 1]) {
      const i = idx + dir * delta;
      if (i < 0 || i >= slots.length) continue;
      const s = slots[i];
      const info = await getSlotInfo(url, anon, data, s);
      if (info.slot_esclusivo) continue;
      const ordineGrande = nPizze >= maxPizze;
      if (ordineGrande) {
        if (info.pizze_count === 0 && !vicini.find(v => v.orario === s))
          vicini.push({ orario: s, libere: maxPizze });
      } else {
        const libere = maxPizze - info.pizze_count;
        if (nPizze <= libere && !vicini.find(v => v.orario === s))
          vicini.push({ orario: s, libere });
      }
    }
    if (vicini.length >= 2) break;
  }
  return vicini;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const url = context.env.SUPABASE_URL;
  const anon = context.env.SUPABASE_ANON_KEY;
  const params = new URL(context.request.url).searchParams;
  const data = params.get('data');
  const orario = params.get('orario');
  const pizze = parseInt(params.get('pizze')) || 1;

  if (!data || !orario) return jsonResp({ error: 'data e orario richiesti' }, 400);

  const maxPizze = isWeekend(data) ? MAX_PIZZE.weekend : MAX_PIZZE.feriale;
  const slots = getSlots();
  const slotInfo = await getSlotInfo(url, anon, data, orario);

  if (slotInfo.slot_esclusivo) {
    const vicini = await trovaSlotsVicini(url, anon, data, orario, pizze, maxPizze, slots);
    return jsonResp({ disponibile: false, libere: 0, maxPizze, slot_esclusivo: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
  }

  const ordineGrande = pizze >= maxPizze;
  if (ordineGrande) {
    if (slotInfo.pizze_count > 0) {
      const vicini = await trovaSlotsVicini(url, anon, data, orario, pizze, maxPizze, slots);
      return jsonResp({ disponibile: false, libere: 0, maxPizze, ordine_grande: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
    }
    return jsonResp({ disponibile: true, libere: maxPizze, maxPizze, ordine_grande: true });
  }

  const libere = maxPizze - slotInfo.pizze_count;
  if (pizze <= libere) return jsonResp({ disponibile: true, libere, maxPizze });

  const vicini = await trovaSlotsVicini(url, anon, data, orario, pizze, maxPizze, slots);
  return jsonResp({ disponibile: false, libere, maxPizze, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
}

export async function onRequestPost(context) {
  const url = context.env.SUPABASE_URL;
  const anon = context.env.SUPABASE_ANON_KEY;
  const body = await context.request.json();
  const { data, orario, pizze } = body;

  if (!data || !orario || !pizze) return jsonResp({ error: 'dati mancanti' }, 400);

  const nPizze = parseInt(pizze);
  const maxPizze = isWeekend(data) ? MAX_PIZZE.weekend : MAX_PIZZE.feriale;
  const ordineGrande = nPizze >= maxPizze;
  const orarioDb = orario.length === 5 ? orario + ':00' : orario;

  const rows = await supabaseFetch(url, anon,
    `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=id,pizze_count`
  );

  if (rows && rows.length > 0) {
    await supabaseFetch(url, anon, `/slot_ordini?id=eq.${rows[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pizze_count: rows[0].pizze_count + nPizze, slot_esclusivo: ordineGrande }),
    });
  } else {
    await supabaseFetch(url, anon, '/slot_ordini', {
      method: 'POST',
      body: JSON.stringify({ data, orario: orarioDb, pizze_count: nPizze, slot_esclusivo: ordineGrande }),
    });
  }

  // Pulizia record vecchi
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  supabaseFetch(url, anon, `/slot_ordini?data=lt.${cutoffStr}`, { method: 'DELETE' }).catch(() => {});

  return jsonResp({ ok: true, slot_esclusivo: ordineGrande });
}

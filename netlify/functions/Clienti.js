// netlify/functions/slot.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

const MAX_PIZZE_DEFAULT = { feriale: 6, weekend: 10 };

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
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

function orDb(orario) {
  return orario.length === 5 ? orario + ':00' : orario;
}

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

async function getSlotInfo(data, orario) {
  try {
    const rows = await sbFetch(
      `/slot_ordini?data=eq.${data}&orario=eq.${orDb(orario)}&select=id,pizze_count,slot_esclusivo,max_pizze`,
      SUPABASE_ANON
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

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    if (event.httpMethod === 'GET') {
      const p = event.queryStringParameters || {};
      const { data, orario, pizze } = p;
      if (!data || !orario) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dati mancanti' }) };

      const nPizze = parseInt(pizze) || 1;
      const maxPizze = isWeekend(data) ? MAX_PIZZE_DEFAULT.weekend : MAX_PIZZE_DEFAULT.feriale;
      const slotInfo = await getSlotInfo(data, orario);
      const maxS = slotInfo ? (slotInfo.max_pizze || maxPizze) : maxPizze;
      const countS = slotInfo ? (slotInfo.pizze_count || 0) : 0;
      const esclusivo = slotInfo ? slotInfo.slot_esclusivo : false;

      if (esclusivo) {
        const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
        return { statusCode: 200, headers, body: JSON.stringify({ disponibile: false, libere: 0, maxPizze: maxS, slot_esclusivo: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 }) };
      }

      const ordineGrande = nPizze >= maxS;
      if (ordineGrande && countS > 0) {
        const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
        return { statusCode: 200, headers, body: JSON.stringify({ disponibile: false, libere: 0, maxPizze: maxS, ordine_grande: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 }) };
      }
      if (ordineGrande) return { statusCode: 200, headers, body: JSON.stringify({ disponibile: true, libere: maxS, maxPizze: maxS, ordine_grande: true }) };

      const libere = maxS - countS;
      if (nPizze <= libere) return { statusCode: 200, headers, body: JSON.stringify({ disponibile: true, libere, maxPizze: maxS }) };

      const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS);
      return { statusCode: 200, headers, body: JSON.stringify({ disponibile: false, libere, maxPizze: maxS, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { data, orario, pizze } = body;
      if (!data || !orario || !pizze) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dati mancanti' }) };

      const nPizze = parseInt(pizze);
      const maxPizze = isWeekend(data) ? MAX_PIZZE_DEFAULT.weekend : MAX_PIZZE_DEFAULT.feriale;
      const ordineGrande = nPizze >= maxPizze;

      const existing = await sbFetch(
        `/slot_ordini?data=eq.${data}&orario=eq.${orDb(orario)}&select=id,pizze_count,max_pizze`,
        SUPABASE_ANON
      );

      if (existing && existing.length > 0) {
        const slot = existing[0];
        const maxS = slot.max_pizze || maxPizze;
        const updated = await sbFetch(
          `/slot_ordini?id=eq.${slot.id}&pizze_count=lte.${maxS - nPizze}`,
          SUPABASE_SERVICE,
          {
            method: 'PATCH',
            body: JSON.stringify({ pizze_count: slot.pizze_count + nPizze, slot_esclusivo: ordineGrande }),
            headers: { 'Prefer': 'return=representation' }
          }
        );
        if (!updated || updated.length === 0)
          return { statusCode: 409, headers, body: JSON.stringify({ error: 'Slot pieno' }) };
      } else {
        await sbFetch('/slot_ordini', SUPABASE_SERVICE, {
          method: 'POST',
          body: JSON.stringify({ data, orario: orDb(orario), pizze_count: nPizze, slot_esclusivo: ordineGrande, max_pizze: maxPizze }),
        });
      }

      // Pulizia vecchi
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      sbFetch(`/slot_ordini?data=lt.${cutoff.toISOString().split('T')[0]}`, SUPABASE_SERVICE, { method: 'DELETE' }).catch(() => {});

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, slot_esclusivo: ordineGrande }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (err) {
    console.error('Slot error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

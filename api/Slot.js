// api/slot.js — BoisPizza Pinguino — Gestione slot con UPDATE atomico

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nndriusznthrpdamgtst.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

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

function orarioDb(orario) {
  return orario.length === 5 ? orario + ':00' : orario;
}

async function supabaseFetch(path, options = {}, useServiceKey = false) {
  const key = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getSlotInfo(data, orario) {
  try {
    const rows = await supabaseFetch(
      `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb(orario)}&select=id,pizze_count,slot_esclusivo,max_pizze`,
      {}, false
    );
    if (rows && rows.length > 0) return rows[0];
    return null;
  } catch(e) { return null; }
}

async function trovaSlotsVicini(data, orario, nPizze, maxPizze, slots) {
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
      const esclusivo = info ? info.slot_esclusivo : false;
      if (esclusivo) continue;
      const ordineGrande = nPizze >= maxS;
      if (ordineGrande) {
        if (countS === 0 && !vicini.find(v => v.orario === s))
          vicini.push({ orario: s, libere: maxS });
      } else {
        const libere = maxS - countS;
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

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([k,v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, orario, pizze } = req.query;
      if (!data || !orario) return res.status(400).json({ error: 'data e orario richiesti' });

      const nPizze = parseInt(pizze) || 1;
      const maxPizze = isWeekend(data) ? MAX_PIZZE_DEFAULT.weekend : MAX_PIZZE_DEFAULT.feriale;
      const slots = getSlots();
      const slotInfo = await getSlotInfo(data, orario);
      const maxS = slotInfo ? (slotInfo.max_pizze || maxPizze) : maxPizze;
      const countS = slotInfo ? (slotInfo.pizze_count || 0) : 0;
      const esclusivo = slotInfo ? slotInfo.slot_esclusivo : false;

      if (esclusivo) {
        const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS, slots);
        return res.status(200).json({ disponibile: false, libere: 0, maxPizze: maxS, slot_esclusivo: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
      }

      const ordineGrande = nPizze >= maxS;
      if (ordineGrande) {
        if (countS > 0) {
          const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS, slots);
          return res.status(200).json({ disponibile: false, libere: 0, maxPizze: maxS, ordine_grande: true, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
        }
        return res.status(200).json({ disponibile: true, libere: maxS, maxPizze: maxS, ordine_grande: true });
      }

      const libere = maxS - countS;
      if (nPizze <= libere) return res.status(200).json({ disponibile: true, libere, maxPizze: maxS });

      const vicini = await trovaSlotsVicini(data, orario, nPizze, maxS, slots);
      return res.status(200).json({ disponibile: false, libere, maxPizze: maxS, slotsVicini: vicini, tuttoEsaurito: vicini.length === 0 });
    }

    if (req.method === 'POST') {
      const { data, orario, pizze } = req.body;
      if (!data || !orario || !pizze) return res.status(400).json({ error: 'dati mancanti' });

      const nPizze = parseInt(pizze);
      const maxPizze = isWeekend(data) ? MAX_PIZZE_DEFAULT.weekend : MAX_PIZZE_DEFAULT.feriale;
      const ordineGrande = nPizze >= maxPizze;
      const orDb = orarioDb(orario);

      // UPDATE atomico anti race-condition
      const existing = await supabaseFetch(
        `/slot_ordini?data=eq.${data}&orario=eq.${orDb}&select=id,pizze_count,max_pizze`,
        {}, false
      );

      if (existing && existing.length > 0) {
        const slot = existing[0];
        const maxS = slot.max_pizze || maxPizze;
        // UPDATE atomico: aggiorna solo se c'è spazio
        const updated = await supabaseFetch(
          `/slot_ordini?id=eq.${slot.id}&pizze_count=lte.${maxS - nPizze}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              pizze_count: slot.pizze_count + nPizze,
              slot_esclusivo: ordineGrande,
            }),
            headers: { 'Prefer': 'return=representation' }
          }, true // usa service key per scritture
        );
        if (!updated || updated.length === 0) {
          return res.status(409).json({ error: 'Slot pieno o race condition' });
        }
      } else {
        // Crea nuovo slot
        await supabaseFetch('/slot_ordini', {
          method: 'POST',
          body: JSON.stringify({
            data,
            orario: orDb,
            pizze_count: nPizze,
            slot_esclusivo: ordineGrande,
            max_pizze: maxPizze,
          }),
        }, true); // usa service key
      }

      // Pulizia record vecchi (non bloccante)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      supabaseFetch(`/slot_ordini?data=lt.${cutoffStr}`, { method: 'DELETE' }, true).catch(() => {});

      return res.status(200).json({ ok: true, slot_esclusivo: ordineGrande });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Slot error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// api/slot.js — BoisPizza Pinguino — Gestione slot ordini Supabase
const SUPABASE_URL = 'https://nndriusznthrpdamgtst.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const MAX_PIZZE = { feriale: 6, weekend: 10 };

function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom, 6=Sab
  return day === 0 || day === 6;
}

function getMaxPizze(dateStr) {
  return isWeekend(dateStr) ? MAX_PIZZE.weekend : MAX_PIZZE.feriale;
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
  return slots; // ['18:30','18:45','19:00',...,'21:30']
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// GET /api/slot?data=2024-06-15&orario=19:30&pizze=4
// Controlla se lo slot è disponibile e restituisce info
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      // Controlla disponibilità slot
      const { data, orario, pizze } = req.query;
      if (!data || !orario) return res.status(400).json({ error: 'data e orario richiesti' });

      const nPizze = parseInt(pizze) || 1;
      const maxPizze = getMaxPizze(data);

      // Leggi slot da Supabase
      const rows = await supabaseFetch(
        `/slot_ordini?data=eq.${data}&orario=eq.${orario}:00&select=pizze_count`
      );
      const usate = rows && rows.length > 0 ? rows[0].pizze_count : 0;
      const libere = maxPizze - usate;

      if (nPizze <= libere) {
        return res.status(200).json({ disponibile: true, libere, maxPizze });
      }

      // Slot pieno — cerca slot vicini liberi
      const slots = getSlots();
      const idxCorrente = slots.indexOf(orario);
      const slotsVicini = [];

      // Cerca nei slot vicini (±2 slot = ±30 min)
      for (let delta = 1; delta <= 4; delta++) {
        for (const dir of [-1, 1]) {
          const idx = idxCorrente + dir * delta;
          if (idx < 0 || idx >= slots.length) continue;
          const slotAlt = slots[idx];
          const rowsAlt = await supabaseFetch(
            `/slot_ordini?data=eq.${data}&orario=eq.${slotAlt}:00&select=pizze_count`
          );
          const usateAlt = rowsAlt && rowsAlt.length > 0 ? rowsAlt[0].pizze_count : 0;
          const libereAlt = maxPizze - usateAlt;
          if (nPizze <= libereAlt && !slotsVicini.find(s => s.orario === slotAlt)) {
            slotsVicini.push({ orario: slotAlt, libere: libereAlt });
          }
        }
        if (slotsVicini.length >= 2) break;
      }

      return res.status(200).json({
        disponibile: false,
        libere,
        maxPizze,
        slotsVicini,
        tuttoEsaurito: slotsVicini.length === 0,
      });
    }

    if (req.method === 'POST') {
      // Prenota slot — chiamato dopo conferma ordine
      const { data, orario, pizze } = req.body;
      if (!data || !orario || !pizze) return res.status(400).json({ error: 'dati mancanti' });

      const orarioDb = orario.length === 5 ? orario + ':00' : orario;

      // Upsert: se esiste incrementa, altrimenti crea
      const rows = await supabaseFetch(
        `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=id,pizze_count`
      );

      if (rows && rows.length > 0) {
        const { id, pizze_count } = rows[0];
        await supabaseFetch(`/slot_ordini?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ pizze_count: pizze_count + parseInt(pizze) }),
        });
      } else {
        await supabaseFetch('/slot_ordini', {
          method: 'POST',
          body: JSON.stringify({ data, orario: orarioDb, pizze_count: parseInt(pizze) }),
        });
      }

      // Pulizia automatica: elimina record più vecchi di 7 giorni
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      supabaseFetch(`/slot_ordini?data=lt.${cutoffStr}`, { method: 'DELETE' })
        .catch(e => console.warn('Pulizia slot fallita:', e));

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Slot error:', err);
    return res.status(500).json({ error: err.message });
  }
}

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
  return slots;
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

async function getSlotInfo(data, orario) {
  const orarioDb = orario.length === 5 ? orario + ':00' : orario;
  const rows = await supabaseFetch(
    `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=pizze_count,slot_esclusivo`
  );
  if (rows && rows.length > 0) {
    return { pizze_count: rows[0].pizze_count || 0, slot_esclusivo: rows[0].slot_esclusivo || false };
  }
  return { pizze_count: 0, slot_esclusivo: false };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, orario, pizze } = req.query;
      if (!data || !orario) return res.status(400).json({ error: 'data e orario richiesti' });

      const nPizze = parseInt(pizze) || 1;
      const maxPizze = getMaxPizze(data);
      const slotInfo = await getSlotInfo(data, orario);

      // Slot esclusivo occupato da ordine grande → pieno
      if (slotInfo.slot_esclusivo) {
        const slots = getSlots();
        const idxCorrente = slots.indexOf(orario);
        const slotsVicini = await trovaSlotsVicini(data, orario, nPizze, maxPizze, slots, idxCorrente);
        return res.status(200).json({
          disponibile: false,
          libere: 0,
          maxPizze,
          slot_esclusivo: true,
          slotsVicini,
          tuttoEsaurito: slotsVicini.length === 0,
        });
      }

      // Ordine grande → occupa slot esclusivo
      const ordineGrande = nPizze >= maxPizze;

      if (ordineGrande) {
        // Slot deve essere completamente vuoto
        if (slotInfo.pizze_count > 0) {
          const slots = getSlots();
          const idxCorrente = slots.indexOf(orario);
          const slotsVicini = await trovaSlotsVicini(data, orario, nPizze, maxPizze, slots, idxCorrente);
          return res.status(200).json({
            disponibile: false,
            libere: 0,
            maxPizze,
            ordine_grande: true,
            slotsVicini,
            tuttoEsaurito: slotsVicini.length === 0,
          });
        }
        return res.status(200).json({ disponibile: true, libere: maxPizze, maxPizze, ordine_grande: true });
      }

      // Ordine normale → controlla spazio condiviso
      const libere = maxPizze - slotInfo.pizze_count;
      if (nPizze <= libere) {
        return res.status(200).json({ disponibile: true, libere, maxPizze });
      }

      // Slot pieno → cerca vicini
      const slots = getSlots();
      const idxCorrente = slots.indexOf(orario);
      const slotsVicini = await trovaSlotsVicini(data, orario, nPizze, maxPizze, slots, idxCorrente);
      return res.status(200).json({
        disponibile: false,
        libere,
        maxPizze,
        slotsVicini,
        tuttoEsaurito: slotsVicini.length === 0,
      });
    }

    if (req.method === 'POST') {
      const { data, orario, pizze } = req.body;
      if (!data || !orario || !pizze) return res.status(400).json({ error: 'dati mancanti' });

      const nPizze = parseInt(pizze);
      const maxPizze = getMaxPizze(data);
      const ordineGrande = nPizze >= maxPizze;
      const orarioDb = orario.length === 5 ? orario + ':00' : orario;

      const rows = await supabaseFetch(
        `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=id,pizze_count`
      );

      if (rows && rows.length > 0) {
        const { id, pizze_count } = rows[0];
        await supabaseFetch(`/slot_ordini?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            pizze_count: pizze_count + nPizze,
            slot_esclusivo: ordineGrande,
          }),
        });
      } else {
        await supabaseFetch('/slot_ordini', {
          method: 'POST',
          body: JSON.stringify({
            data,
            orario: orarioDb,
            pizze_count: nPizze,
            slot_esclusivo: ordineGrande,
          }),
        });
      }

      // Pulizia automatica record > 7 giorni
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
      supabaseFetch(`/slot_ordini?data=lt.${cutoffStr}`, { method: 'DELETE' })
        .catch(e => console.warn('Pulizia slot fallita:', e));

      return res.status(200).json({ ok: true, slot_esclusivo: ordineGrande });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Slot error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function trovaSlotsVicini(data, orario, nPizze, maxPizze, slots, idxCorrente) {
  const slotsVicini = [];
  for (let delta = 1; delta <= 4; delta++) {
    for (const dir of [-1, 1]) {
      const idx = idxCorrente + dir * delta;
      if (idx < 0 || idx >= slots.length) continue;
      const slotAlt = slots[idx];
      const slotAltInfo = await getSlotInfo(data, slotAlt);
      
      // Slot esclusivo già occupato → salta
      if (slotAltInfo.slot_esclusivo) continue;
      
      const ordineGrande = nPizze >= maxPizze;
      if (ordineGrande) {
        // Ordine grande → slot deve essere vuoto
        if (slotAltInfo.pizze_count === 0 && !slotsVicini.find(s => s.orario === slotAlt)) {
          slotsVicini.push({ orario: slotAlt, libere: maxPizze });
        }
      } else {
        // Ordine normale → slot deve avere spazio
        const libereAlt = maxPizze - slotAltInfo.pizze_count;
        if (nPizze <= libereAlt && !slotsVicini.find(s => s.orario === slotAlt)) {
          slotsVicini.push({ orario: slotAlt, libere: libereAlt });
        }
      }
    }
    if (slotsVicini.length >= 2) break;
  }
  return slotsVicini;
}

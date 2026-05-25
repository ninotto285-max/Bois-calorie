// api/slot.js

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

      slots.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      );
    }
  }

  return slots;
}

async function supabaseFetch(url, anon, path, options = {}) {

  const res = await fetch(`${url}/rest/v1${path}`, {
    ...options,

    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  const text = await res.text();

  return text ? JSON.parse(text) : null;
}

async function getSlotInfo(url, anon, data, orario) {

  const orarioDb =
    orario.length === 5 ? orario + ':00' : orario;

  const rows = await supabaseFetch(
    url,
    anon,
    `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=pizze_count,slot_esclusivo`
  );

  if (rows && rows.length > 0) {
    return {
      pizze_count: rows[0].pizze_count || 0,
      slot_esclusivo: rows[0].slot_esclusivo || false
    };
  }

  return {
    pizze_count: 0,
    slot_esclusivo: false
  };
}

async function trovaSlotsVicini(
  url,
  anon,
  data,
  orario,
  nPizze,
  maxPizze,
  slots
) {

  const idx = slots.indexOf(orario);

  const vicini = [];

  for (let delta = 1; delta <= 4; delta++) {

    for (const dir of [-1, 1]) {

      const i = idx + dir * delta;

      if (i < 0 || i >= slots.length) continue;

      const s = slots[i];

      const info = await getSlotInfo(
        url,
        anon,
        data,
        s
      );

      if (info.slot_esclusivo) continue;

      const ordineGrande = nPizze >= maxPizze;

      if (ordineGrande) {

        if (
          info.pizze_count === 0 &&
          !vicini.find(v => v.orario === s)
        ) {
          vicini.push({
            orario: s,
            libere: maxPizze
          });
        }

      } else {

        const libere =
          maxPizze - info.pizze_count;

        if (
          nPizze <= libere &&
          !vicini.find(v => v.orario === s)
        ) {
          vicini.push({
            orario: s,
            libere
          });
        }
      }
    }

    if (vicini.length >= 2) break;
  }

  return vicini;
}

export default async function handler(req, res) {

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;

  // =========================
  // GET
  // =========================

  if (req.method === 'GET') {

    const { data, orario, pizze } = req.query;

    const nPizze = parseInt(pizze) || 1;

    if (!data || !orario) {
      return res.status(400).json({
        error: 'data e orario richiesti'
      });
    }

    const maxPizze =
      isWeekend(data)
        ? MAX_PIZZE.weekend
        : MAX_PIZZE.feriale;

    const slots = getSlots();

    const slotInfo = await getSlotInfo(
      url,
      anon,
      data,
      orario
    );

    if (slotInfo.slot_esclusivo) {

      const vicini =
        await trovaSlotsVicini(
          url,
          anon,
          data,
          orario,
          nPizze,
          maxPizze,
          slots
        );

      return res.json({
        disponibile: false,
        libere: 0,
        maxPizze,
        slot_esclusivo: true,
        slotsVicini: vicini,
        tuttoEsaurito: vicini.length === 0
      });
    }

    const ordineGrande =
      nPizze >= maxPizze;

    if (ordineGrande) {

      if (slotInfo.pizze_count > 0) {

        const vicini =
          await trovaSlotsVicini(
            url,
            anon,
            data,
            orario,
            nPizze,
            maxPizze,
            slots
          );

        return res.json({
          disponibile: false,
          libere: 0,
          maxPizze,
          ordine_grande: true,
          slotsVicini: vicini,
          tuttoEsaurito: vicini.length === 0
        });
      }

      return res.json({
        disponibile: true,
        libere: maxPizze,
        maxPizze,
        ordine_grande: true
      });
    }

    const libere =
      maxPizze - slotInfo.pizze_count;

    if (nPizze <= libere) {

      return res.json({
        disponibile: true,
        libere,
        maxPizze
      });
    }

    const vicini =
      await trovaSlotsVicini(
        url,
        anon,
        data,
        orario,
        nPizze,
        maxPizze,
        slots
      );

    return res.json({
      disponibile: false,
      libere,
      maxPizze,
      slotsVicini: vicini,
      tuttoEsaurito: vicini.length === 0
    });
  }

  // =========================
  // POST
  // =========================

  if (req.method === 'POST') {

    const { data, orario, pizze } = req.body;

    if (!data || !orario || !pizze) {
      return res.status(400).json({
        error: 'dati mancanti'
      });
    }

    const nPizze = parseInt(pizze);

    const maxPizze =
      isWeekend(data)
        ? MAX_PIZZE.weekend
        : MAX_PIZZE.feriale;

    const ordineGrande =
      nPizze >= maxPizze;

    const orarioDb =
      orario.length === 5
        ? orario + ':00'
        : orario;

    const rows = await supabaseFetch(
      url,
      anon,
      `/slot_ordini?data=eq.${data}&orario=eq.${orarioDb}&select=id,pizze_count`
    );

    if (rows && rows.length > 0) {

      await supabaseFetch(
        url,
        anon,
        `/slot_ordini?id=eq.${rows[0].id}`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            pizze_count:
              rows[0].pizze_count + nPizze,

            slot_esclusivo:
              ordineGrande
          })
        }
      );

    } else {

      await supabaseFetch(
        url,
        anon,
        '/slot_ordini',
        {
          method: 'POST',

          body: JSON.stringify({
            data,
            orario: orarioDb,
            pizze_count: nPizze,
            slot_esclusivo: ordineGrande
          })
        }
      );
    }

    return res.json({
      ok: true,
      slot_esclusivo: ordineGrande
    });
  }

  return res.status(405).json({
    error: 'Metodo non consentito'
  });
}

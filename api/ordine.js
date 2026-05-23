// api/ordine.js — BoisPizza Pinguino
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { nome, telefono, orario, pizze, totale, note, frittini, noteVariazioni } = req.body;

    if (!nome || !orario) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const ora = new Date().toLocaleTimeString('it-IT', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome'
    });

    const listaPizze = pizze || [];
    const listaFritti = frittini || [];
    const listaNote = noteVariazioni || [];
    const nPizze = listaPizze.reduce((s, p) => s + p.qty, 0);

    let msg = `🍕 *NUOVO ORDINE* — ${ora}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *${nome}*\n`;
    if (telefono) msg += `📱 ${telefono}\n`;
    msg += `🕐 Ritiro: *${orario}*\n\n`;

    if (listaPizze.length) {
      msg += `*PIZZE (${nPizze} pz):*\n`;
      for (const p of listaPizze) {
        const sub = (p.prezzo * p.qty).toFixed(2).replace('.', ',');
        msg += `• ${p.qty}x *${p.nome}* — ${sub}€\n`;
      }
    }

    if (listaFritti.length) {
      msg += `\n*FRITTI:*\n`;
      for (const f of listaFritti) {
        const sub = (f.prezzo * f.qty).toFixed(2).replace('.', ',');
        msg += `• ${f.qty}x *${f.tipo}* — ${sub}€\n`;
      }
    }

    const totStr = (totale || 0).toFixed(2).replace('.', ',');
    msg += `\n💰 *Totale: ${totStr}€*\n`;

    if (listaNote.length) {
      msg += `\n📌 *Richieste speciali:*\n`;
      for (const n of listaNote) msg += `${n}\n`;
    }

    if (note && note.trim()) {
      msg += `\n📝 *Note:* ${note}\n`;
    }

    msg += `\n━━━━━━━━━━━━━━━━━`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown',
        }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('Telegram error:', tgData);
      return res.status(500).json({ error: 'Errore Telegram', detail: tgData.description });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Errore:', err);
    return res.status(500).json({ error: 'Errore interno', detail: err.message });
  }
}

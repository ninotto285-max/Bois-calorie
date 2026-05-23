// api/ordine.js — BoisPizza Pinguino
// Riceve ordini dal chatbot e li manda su Telegram

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { nome, telefono, orario, pizze, totale, note } = req.body;

    if (!nome || !orario || !pizze?.length) {
      return res.status(400).json({ error: 'Dati ordine incompleti' });
    }

    // ── Formatta messaggio Telegram ──
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    
    let msg = `🍕 *NUOVO ORDINE* — ${ora}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *${nome}*\n`;
    if (telefono) msg += `📱 ${telefono}\n`;
    msg += `🕐 Ritiro: *${orario}*\n\n`;
    
    msg += `*PIZZE:*\n`;
    let totaleCalc = 0;
    for (const p of pizze) {
      const subtot = (p.prezzo * p.qty).toFixed(2).replace('.', ',');
      msg += `• ${p.qty}x *${p.nome}* — ${subtot}€\n`;
      totaleCalc += p.prezzo * p.qty;
    }
    
    const totStr = (totale || totaleCalc).toFixed(2).replace('.', ',');
    msg += `\n💰 *Totale: ${totStr}€*\n`;
    
    if (note && note.trim()) {
      msg += `\n📝 *Note:* ${note}\n`;
    }
    
    msg += `\n━━━━━━━━━━━━━━━━━`;

    // ── Invia su Telegram ──
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
      return res.status(500).json({ error: 'Errore invio Telegram', detail: tgData.description });
    }

    return res.status(200).json({ ok: true, message: 'Ordine inviato su Telegram!' });

  } catch (err) {
    console.error('Errore ordine.js:', err);
    return res.status(500).json({ error: 'Errore interno', detail: err.message });
  }
}

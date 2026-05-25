// netlify/functions/ordine.js
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { nome, telefono, orario, pizze, frittini, bibite, note, totale, noteVariazioni } = JSON.parse(event.body || '{}');
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Config mancante' }) };

    const ora = new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
    let msg = `🍕 *NUOVO ORDINE* — ${ora}\n\n`;
    msg += `👤 *${nome}*\n📱 ${telefono}\n🕐 Ritiro: *${orario}*\n\n`;

    if (pizze && pizze.length > 0) {
      msg += `🍕 *PIZZE:*\n`;
      for (const p of pizze) msg += `  • ${p.qty}x ${p.nome} — ${String(p.prezzo.toFixed(2)).replace('.',',')}€\n`;
    }
    if (frittini && frittini.length > 0) {
      msg += `\n🍟 *FRITTINI:*\n`;
      for (const f of frittini) msg += `  • ${f.qty}x ${f.tipo} — ${String(f.prezzo.toFixed(2)).replace('.',',')}€\n`;
    }
    if (bibite && bibite.length > 0) {
      msg += `\n🥤 *BIBITE:*\n`;
      for (const b of bibite) msg += `  • ${b.qty}x ${b.label} — ${String(b.prezzo.toFixed(2)).replace('.',',')}€\n`;
    }
    msg += `\n💰 *TOTALE: ${totale}€*\n`;
    if (noteVariazioni && noteVariazioni.length > 0) {
      msg += `\n⚠️ *RICHIESTE SPECIALI:*\n`;
      for (const n of noteVariazioni) msg += `  ${n}\n`;
    }
    if (note) msg += `\n📝 *NOTE:* ${note}\n`;

    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
    });
    const d = await r.json();
    return { statusCode: 200, headers, body: JSON.stringify({ ok: d.ok }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

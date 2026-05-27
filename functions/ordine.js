// functions/ordine.js — Cloudflare Pages

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response('', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { nome, telefono, orario, pizze, frittini, bibite, note, totale, noteVariazioni } = await request.json();
    const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN;
    const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return json({ ok: false, error: 'Config mancante' }, 500);

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
    return json({ ok: d.ok });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

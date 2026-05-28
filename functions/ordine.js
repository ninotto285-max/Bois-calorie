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
      for (const p of pizze) {
        const nomeBase = p.nome.replace(/\s*\([^)]+\)/g,'').trim();
        const dettagli = [...p.nome.matchAll(/\(([^)]+)\)/g)].map(m=>m[1]);
        msg += `  • ${p.qty}x *${nomeBase}* — ${String((p.prezzo*p.qty).toFixed(2)).replace('.',',')}€\n`;
        dettagli.forEach(d=>{
          if(d.startsWith('con ') || (!d.startsWith('senza') && !d.startsWith('poca') && d.includes(' e '))){
            d.replace(/^con\s+/,'').split(/,\s*|\s+e\s+(?=[a-z])/).forEach(a=>{
              const aT = a.trim(); if(aT.length>1) msg += `     \+ ${aT}\n`;
            });
          } else if(d.startsWith('senza')||d.startsWith('poca')||d.includes('senza')){
            msg += `     \- ${d}\n`;
          } else {
            msg += `     _(${d})_\n`;
          }
        });
      }
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

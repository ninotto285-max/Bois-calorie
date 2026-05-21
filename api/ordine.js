export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { nome, orario, pizze, totale, note } = req.body;

  // Costruisci HTML email
  const righe = pizze.map(p =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e6d3;">${p.qty}x</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e6d3;font-weight:600;">${p.nome}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e6d3;text-align:right;">${p.prezzo}</td>
    </tr>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fdf6ec;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(192,57,43,0.15);">
    
    <div style="background:linear-gradient(135deg,#c0392b,#e67e22);padding:24px 28px;">
      <h1 style="margin:0;color:white;font-size:22px;">🍕 Nuovo Ordine BoisPizza</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Ricevuto dal chatbot Pinguino</p>
    </div>

    <div style="padding:24px 28px;">
      
      <table style="width:100%;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;color:#9e7a5a;font-size:13px;width:100px;">👤 Cliente</td>
          <td style="padding:6px 0;font-weight:700;font-size:15px;color:#3d1f0f;">${nome}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#9e7a5a;font-size:13px;">🕐 Orario</td>
          <td style="padding:6px 0;font-weight:700;font-size:15px;color:#3d1f0f;">${orario}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#fdf6ec;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#9e7a5a;text-transform:uppercase;">Qtà</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#9e7a5a;text-transform:uppercase;">Pizza</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#9e7a5a;text-transform:uppercase;">Prezzo</th>
          </tr>
        </thead>
        <tbody>${righe}</tbody>
      </table>

      <div style="background:#fdf6ec;border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;color:#3d1f0f;font-size:15px;">Totale stimato</span>
        <span style="font-weight:800;color:#c0392b;font-size:18px;">${totale}</span>
      </div>

      ${note ? `<div style="margin-top:16px;padding:12px 16px;background:#fff8f0;border-left:3px solid #e67e22;border-radius:0 8px 8px 0;font-size:13px;color:#3d1f0f;"><strong>Note:</strong> ${note}</div>` : ''}

    </div>

    <div style="padding:16px 28px;background:#fdf6ec;text-align:center;font-size:12px;color:#9e7a5a;">
      BoisPizza — Via Principale 113, Casier (TV) | 0422 670631<br>
      <em>Ricorda di confermare l'ordine al cliente!</em>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'Pinguino BoisPizza <ordini@boispizza.it>',
        to: ['info@boispizza.it'],
        subject: `🍕 Ordine ${nome} — ${orario}`,
        html
      })
    });

    const data = await response.json();
    if (data.id) {
      res.status(200).json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: data });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

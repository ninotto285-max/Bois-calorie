let ultimaPizzaMenzionata = null;
// ── FUNZIONI UI BASE ──
var panelOpen = panelOpen || false;
var bpHistory = bpHistory || [];
var orderShown = orderShown || false;

function togglePanel(){
  panelOpen = !panelOpen;
  const panel = document.getElementById('bois-panel');
  if(panel) panel.classList.toggle('open', panelOpen);
  if(panelOpen && !orderShown){
    orderShown = true;
    setTimeout(()=>addBotMsg('Ciao! 🐧🍕 Sono il Pinguino di BoisPizza!\nDimmi che pizza ti va e ti dico calorie e prezzo — oppure premi **Ordina** per fare un ordine!'), 300);
  }
}
// Esponi funzioni globalmente per onclick in HTML
window.togglePanel = togglePanel;

function addBotMsg(text){
  const el = document.getElementById('bp-messages');
  if(!el) return;
  const div = document.createElement('div');
  div.className = 'bp-msg bot';
  const md = text
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
    .replace(/\_(.+?)\_/g,'<i>$1</i>')
    .replace(/\n/g,'<br>');
  div.innerHTML = '<div class="bp-msg-av">🐧</div><div class="bp-bubble">'+md+'</div>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function addUserMsg(text){
  const el = document.getElementById('bp-messages');
  if(!el) return;
  const div = document.createElement('div');
  div.className = 'bp-msg user';
  div.innerHTML = '<div class="bp-bubble">'+text+'</div><div class="bp-msg-av">👤</div>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function showTyping(){
  const el = document.getElementById('bp-messages');
  if(!el) return;
  const div = document.createElement('div');
  div.className = 'bp-msg bot'; div.id = 'bp-typing';
  div.innerHTML = '<div class="bp-msg-av">🐧</div><div class="bp-bubble bp-typing"><span></span><span></span><span></span></div>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function removeTyping(){
  const t = document.getElementById('bp-typing');
  if(t) t.remove();
}


if(typeof bpLoading==='undefined') var bpLoading=false;
if(typeof msgsSinceFritino==='undefined') var msgsSinceFritino=0;
if(typeof ordineDomandaCottura==='undefined') var ordineDomandaCottura=null;
let contatorContestoPizza = 0;

// ── STATO ORDINE ──
let ordineAttivo = false;
let ordine = { nome:'', orario:'', pizze:[], note:'' };
let ordineStep = ''; // 'nome' | 'orario' | 'pizze' | 'altra' | 'note' | 'conferma'

const ORARI_DISPONIBILI = (()=>{
  const slots = [];
  for(let h=18; h<=21; h++){
    for(let m=0; m<60; m+=15){
      if(h===18 && m<30) continue; // inizia alle 18:30
      if(h===21 && m>30) continue; // finisce alle 21:30
      slots.push((h<10?'0':'')+h+':'+(m<10?'0':'')+m);
    }
  }
  return slots;
})();

// Converte orario colloquiale → HH:MM
function parseOrario(t){
  if(!t) return null;
  t = t.toLowerCase().trim();

  // Parole → numeri
  const parole = {'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5,'sei':6,'sette':7,'otto':8,'nove':9,'dieci':10,'undici':11,'dodici':12,'tredici':13,'quattordici':14,'quindici':15,'sedici':16,'diciassette':17,'diciotto':18,'diciannove':19,'venti':20,'ventuno':21,'ventidue':22};
  const mezzora = {'mezzo':30,'mezza':30,'e mezzo':30,'e mezza':30};
  const quarti = {'un quarto':15,'e un quarto':15,'e quarto':15,'tre quarti':45,'e tre quarti':45};

  // Converti parole ore in numeri: "sette" → 7, "diciannove" → 19
  for(const [w,n] of Object.entries(parole)){
    t = t.replace(new RegExp('\\b'+w+'\\b','g'), String(n));
  }

  // Converti "X e mezza/mezzo" → "X:30"
  t = t.replace(/(\d+)\s+e\s+mezz[ao]/g, '$1:30');
  // Converti "X e un quarto/quarto" → "X:15"
  t = t.replace(/(\d+)\s+e\s+(?:un\s+)?quarto/g, '$1:15');
  // Converti "X e tre quarti" → "X:45"
  t = t.replace(/(\d+)\s+e\s+tre\s+quarti/g, '$1:45');
  // Converti "X e N" → "X:N" (es "7 e 10" → "7:10")
  t = t.replace(/(\d+)\s+e\s+(\d{1,2})(?!\d)/g, (m,h,mn)=>h+':'+(mn.length===1?'0'+mn:mn));

  // Cerca orario formato HH:MM o H:MM
  const matchEsatto = t.match(/\b(\d{1,2})[:h](\d{2})\b/);
  if(matchEsatto){
    let h = parseInt(matchEsatto[1]);
    let mn = parseInt(matchEsatto[2]);
    // Converti ore pomeridiane: 6→18, 7→19, 8→20, 9→21
    if(h >= 6 && h <= 9) h += 12;
    if(h < 18 || h > 21) return null;
    // Arrotonda al quarto d'ora più vicino
    const totMin = h*60+mn;
    const slotMin = Math.round(totMin/15)*15;
    const slotH = Math.floor(slotMin/60);
    const slotM = slotMin%60;
    const orario = String(slotH).padStart(2,'0')+':'+String(slotM).padStart(2,'0');
    // Slot 18:00 → porta a 18:30 (primo slot)
    if(slotH===18 && slotM < 30){ return '18:30'; }
    if(slotH < 18 || slotH > 21 || (slotH===21 && slotM > 30)) return null;
    return orario;
  }

  // Cerca solo ora: "8", "20", "19", "alle 20" ecc
  const matchOra = t.match(/(?:alle?\s+)?(\d{1,2})(?!\s*[:h]\d)/);
  if(matchOra){
    let h = parseInt(matchOra[1]);
    if(h >= 6 && h <= 9) h += 12;
    if(h < 18 || h > 21) return null;
    if(h === 18) return '18:30'; // 18 → 18:30 che è l'orario minimo
    return String(h).padStart(2,'0')+':00';
  }

  return null;
}


function resetOrdine(){
  ordineAttivo = false;
  ordine = { nome:'', orario:'', pizze:[], note:'', telefono:'', frittini:[], bibite:[], _noteVariazioni:[] };
  ordineStep = '';
  ordineDomandaCottura = null;
}

function fmtOrdine(){
  let msg = `📋 **Riepilogo ordine**\n\n`;
  msg += `👤 Nome: **${ordine.nome}**\n`;
  if(ordine.telefono) msg += `📱 Tel: **${ordine.telefono}**\n`;
  msg += `🕐 Orario: **${ordine.orario}**\n\n`;
  for(const p of ordine.pizze){
    msg += `• ${p.qty}x **${p.nome}** — ${fmtE(p.prezzo * p.qty)}€\n`;
  }
  if(ordine.frittini && ordine.frittini.length){
    for(const f of ordine.frittini) msg += `• ${f.qty}x Fritino ${f.tipo} 5pz — ${fmtE(f.prezzo*f.qty)}€\n`;
  }
  if(ordine.bibite && ordine.bibite.length){
    for(const b of ordine.bibite) msg += `• ${b.qty}x ${b.label} — ${fmtE(b.prezzo*b.qty)}€\n`;
  }
  const totPizze = ordine.pizze.reduce((s,p)=>s+p.prezzo*p.qty,0);
  const totFrit = (ordine.frittini||[]).reduce((s,f)=>s+f.prezzo*f.qty,0);
  const totBib = (ordine.bibite||[]).reduce((s,b)=>s+b.prezzo*b.qty,0);
  const tot = totPizze + totFrit + totBib;
  msg += `\n💰 Totale stimato: **${fmtE(tot)}€**`;
  if(ordine._noteVariazioni && ordine._noteVariazioni.length){
    msg += '\n\n📌 *Richieste speciali:*\n'+ordine._noteVariazioni.join('\n');
  }
  if(ordine.note) msg += '\n📝 Note: '+ordine.note;
  return msg;
}


// ============================================================
// GESTIONE SLOT ORDINI
// ============================================================
async function checkSlot(orario, nPizze) {
  try {
    const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
    const r = await fetch(`/api/slot?data=${oggi}&orario=${orario}&pizze=${nPizze}`);
    return await r.json();
  } catch(e) { return { disponibile: true }; } // fallback: lascia passare
}

async function prenotaSlot(orario, nPizze) {
  try {
    const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
    await fetch('/api/slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: oggi, orario, pizze: nPizze })
    });
  } catch(e) { console.warn('Slot prenotazione fallita:', e); }
}

async function inviaOrdine(){
  const totPizze2 = ordine.pizze.reduce((s,p)=>s+p.prezzo*p.qty,0);
  const totFrit2 = (ordine.frittini||[]).reduce((s,f)=>s+f.prezzo*f.qty,0);
  const totBib2 = (ordine.bibite||[]).reduce((s,b)=>s+b.prezzo*b.qty,0);
  const tot = totPizze2 + totFrit2 + totBib2;
  try {
    const r = await fetch('/api/ordine', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        nome: ordine.nome,
        telefono: ordine.telefono||'',
        orario: ordine.orario,
        pizze: ordine.pizze.map(p=>({qty:p.qty, nome:p.nome, prezzo:p.prezzo})),
        totale: tot,
        note: ordine.note,
        frittini: ordine.frittini||[],
        noteVariazioni: ordine._noteVariazioni||[],
        bibite: ordine.bibite||[]
      })
    });
    const d = await r.json();
    if(d.ok){
      const nPizze = ordine.pizze.reduce((s,p)=>s+p.qty,0);
      await prenotaSlot(ordine.orario, nPizze);
      // Se cliente non noto → chiedi consenso salvataggio
      if(!ordine._clienteNoto){
        ordine._aspettaConsensoPrivacy = true;
        setTimeout(()=>{
          addBotMsg('🐧 Vuoi salvare il tuo profilo per i prossimi ordini?\nLa prossima volta ti riconosco subito e non devi reinserire i dati!\n\n📋 [Privacy policy: i tuoi dati (nome e telefono) sono salvati solo per velocizzare i tuoi ordini futuri e non vengono condivisi con terzi.]\n\nScrivi **sì** per salvare o **no** per procedere.');
        }, 1500);
      } else {
        // Cliente noto → aggiorna contatore ordini
        fetch('/api/clienti', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            telefono: ordine.telefono,
            nome: ordine.nome,
            pizza_preferita: ordine.pizze.length > 0 ? ordine.pizze[0].nome.replace(/\s*\([^)]*\)/g,'').trim() : null
          })
        }).catch(()=>{});
      }
    }
    return d.ok;
  } catch(e){ return false; }
}

function mostraPulsanteConferma(){
  const el = document.getElementById('bp-messages');
  const div = document.createElement('div');
  div.className = 'bp-msg bot'; div.id = 'bp-ordine-btn';
  div.innerHTML = `<div class="bp-msg-av">🐧</div><div class="bp-bubble">
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button onclick="confermaMandaOrdine()" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:10px;padding:10px 16px;font-family:Nunito,sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;">✅ Conferma e invia ordine</button>
      <button onclick="annullaOrdine()" style="background:rgba(192,57,43,0.1);color:#c0392b;border:1px solid rgba(192,57,43,0.3);border-radius:10px;padding:8px 16px;font-family:Nunito,sans-serif;font-weight:600;font-size:0.82rem;cursor:pointer;">✕ Annulla</button>
    </div>
  </div>`;
  el.appendChild(div); el.scrollTop = el.scrollHeight;
}

async function confermaMandaOrdine(){
  const btn = document.getElementById('bp-ordine-btn');
  if(btn) btn.remove();
  showTyping();
  const ok = await inviaOrdine();
  removeTyping();
  if(ok){
    addBotMsg('🎉 **Ordine inviato!**\n\nAbbiamo mandato il tuo ordine a BoisPizza.\nTi aspettiamo alle **'+ordine.orario+'**, '+ordine.nome+'! 🐧🍕\n\nPer conferma o variazioni chiama il **0422 670631**.');
  } else {
    addBotMsg('😅 Ops, problema nell\'invio. Chiama il **0422 670631** per ordinare direttamente!');
  }
  resetOrdine();
}

function annullaOrdine(){
  const btn = document.getElementById('bp-ordine-btn');
  if(btn) btn.remove();
  addBotMsg('Ordine annullato. Dimmi pure se vuoi ricominciare! 🐧');
  resetOrdine();
}

function gestisciOrdine(input){
  const t = norm(input);

  if(ordineStep === 'nome'){
    if(!input.trim() || norm(input.trim()).length < 2){
      return 'Come ti chiami? Scrivi nome e cognome 😊';
    }
    ordine.nome = input.trim();
    ordineStep = 'telefono';
    return 'Perfetto **'+ordine.nome+'**! 🐧\nE il tuo numero di telefono?';
  }

  if(ordineStep === 'telefono'){
    const numM = input.replace(/\s/g,'').match(/[0-9]{6,}/);
    if(!numM) return 'Non ho capito il numero 😅 Scrivi tipo 3401234567';
    ordine.telefono = numM[0];
    // Cerca cliente nel database
    // Cerca cliente con timeout 3 secondi
    const _ctrl = new AbortController();
    const _timeout = setTimeout(()=>_ctrl.abort(), 3000);
    fetch('/api/clienti?telefono='+encodeURIComponent(ordine.telefono), {signal:_ctrl.signal})
      .then(r=>r.json())
      .then(d=>{
        clearTimeout(_timeout);
        if(d.trovato && d.cliente){
          const c = d.cliente;
          ordine._clienteNoto = true;
          ordine._ordiniCount = c.ordini_count || 0;
          const saluto = c.ordini_count > 1
            ? `Bentornato **${c.nome}**! 🐧 È il tuo **${c.ordini_count+1}° ordine** con noi!`
            : `Bentornato **${c.nome}**! 🐧`;
          addBotMsg(saluto);
        }
      }).catch(()=>{ clearTimeout(_timeout); });
    if(ordine.orario){
      // Orario già estratto dal messaggio iniziale
      ordineStep = 'pizze';
      return `Perfetto **${ordine.nome}**! 🐧\nOrario confermato: **${ordine.orario}**\n\nOra dimmi le pizze! Es: "2 margherite e 1 diavola" 🍕`;
    }
    ordineStep = 'orario';
    const orariStr = ORARI_DISPONIBILI.join(' · ');
    return `Perfetto **${ordine.nome}**! 🐧\nA che ora vieni? Gli orari disponibili sono:\n${orariStr}\n\n(Puoi scrivere anche "alle 8", "7 e mezza" ecc.)`;
  }

  if(ordineStep === 'orario'){
    const orarioTrovato = parseOrario(t);
    if(!orarioTrovato) return `Non ho capito l'orario 😅 Scegli tra: ${ORARI_DISPONIBILI.join(' · ')}\n(Puoi scrivere anche "alle 8", "7 e mezza", "per le 20" ecc.)`;
    ordine.orario = orarioTrovato;
    ordineStep = 'pizze';
    // Check slot disponibilità in background
    checkSlot(ordine.orario, 1).then(slot => {
      if(slot && !slot.disponibile && slot.tuttoEsaurito){
        addBotMsg('⚠️ Le prenotazioni per stasera sono quasi esaurite. Se hai molte pizze chiama prima il **0422 670631**!');
      }
    }).catch(()=>{});
    return `Orario **${ordine.orario}** ✅\n\nOra dimmi le pizze! Scrivi tipo:\n"2 margherite e 1 diavola"\noppure aggiungile una per volta 🍕`;
  }

  if(ordineStep === 'pizze'){
    // "basta" nello step pizze → vai avanti se ha almeno qualcosa
    // ── Bibita durante ordine (pizze/altra) ──
    if(ordineStep==='pizze'||ordineStep==='altra'){
      const _bibKey = trovaBibita(input);
      if(_bibKey && BIBITE[_bibKey]){
        ordine.bibite = ordine.bibite || [];
        ordine.bibite.push({ qty:1, label:BIBITE[_bibKey].label, prezzo:BIBITE[_bibKey].prezzo });
        // Rimuovi la bibita dall'input e processa il resto
        const _bibRest = input
          .replace(/\buna?\s+(?:birra\s+litro|birra\s+\d+cl|birra\s+lattina|coca[\s-]?cola|fanta|sprite|lemonsoda|lemon\s+soda|franzis\w+|tuborg\w*|birra\s+\w+|bibita\s+\w+|birra)\b/gi,'')
          .replace(/\be\s*$/,'').trim();
        if(_bibRest && norm(_bibRest).length > 2) gestisciOrdine(_bibRest);
        return 'Aggiunto: 1x '+BIBITE[_bibKey].label+' — '+fmtE(BIBITE[_bibKey].prezzo)+'€ 🥤\nVuoi altro o scrivi **"basta"**.';
      }
    }
    if(['basta','ok basta','ho finito','fine','finito'].some(k=>norm(input.trim())===k) || norm(input.trim())==='basta'){
      if(ordine.pizze.length > 0 || (ordine.frittini && ordine.frittini.length > 0)){
        ordineStep = 'altra';
        // Torna al check allergeni
        return gestisciOrdine('basta');
      }
    }
    // ── FRITTI come voce separata ──
    // Gestisci più porzioni nella stessa riga: "una porzione di X e una porzione di Y"
    const _tuttePortzioni = input.match(/(?:una?\s+)?(?:porzione|porzioncina)\s+di\s+[\w\s]+?(?=\s+e\s+una?\s+(?:porzione|porzioncina)|\s*,|\s*$)/gi)||[];
    if(_tuttePortzioni.length > 1){
      // Processa direttamente ogni porzione senza ricorsione
      const _frittiDB2 = {'patate fritte':3.50,'patate':3.50,'nuggets pollo':2.50,'nuggets':2.50,'olive ascolane':2.50,'olive':2.50,'mozzarelline':2.50,'crocchettine patate':2.50,'crocchettine':2.50,'anellini di cipolla':2.50,'anellini':2.50,'misti':2.50,'verdure pastellate':4.00,'alette di pollo':5.50};
      for(const _pRiga of _tuttePortzioni){
        const _nF2 = norm(correggiTypo(_pRiga.replace(/(?:una?\s+)?(?:porzione|porzioncina)\s+di\s+/i,'')).trim());
        const _kF2 = Object.keys(_frittiDB2).find(k=>_nF2.includes(norm(k))||norm(k).includes(_nF2));
        if(_kF2){
          const _is5pz = ['nuggets pollo','nuggets','olive ascolane','olive','mozzarelline','crocchettine patate','crocchettine','anellini di cipolla','anellini','misti'].includes(_kF2);
          const _lbl = _kF2.charAt(0).toUpperCase()+_kF2.slice(1)+(_is5pz?' 5pz':' 10pz');
          const _pr = _is5pz ? 2.50 : _frittiDB2[_kF2];
          ordine.frittini = ordine.frittini||[];
          ordine.frittini.push({qty:1, tipo:_lbl, prezzo:_pr});
        }
      }
      // Processa eventuali bibite rimaste
      let _restoBib = input;
      for(const _pR of _tuttePortzioni) _restoBib = _restoBib.replace(_pR,'');
      _restoBib = _restoBib.replace(/^[,\se]+|[,\se]+$/g,'').trim();
      if(_restoBib.length > 2 && !_restoBib.match(/porzione/i)){
        const _bibK = trovaBibita(_restoBib);
        if(_bibK && BIBITE[_bibK]){
          ordine.bibite = ordine.bibite||[];
          ordine.bibite.push({qty:1,label:BIBITE[_bibK].label,prezzo:BIBITE[_bibK].prezzo});
        }
      }
      const _totFrittAgg = ordine.frittini.reduce((s,f)=>s+f.tipo.includes('pz')?1:0,0);
      return _totFrittAgg > 0 ? 'Aggiunto frittini e bibite 🍟\nVuoi altro o scrivi **"basta"**.' : null;
    }
    const _frittoRe = /(?:una?\s+)?(?:porzione|porzioncina)\s+di\s+([\w\s]+?)(?:\s*,|\s+e\s+una?\s+(?:porzione|porzioncina)|\s*$)/i;
    const _frittoM = input.match(_frittoRe);
    if(_frittoM){
      const _nF = norm(_frittoM[1].trim());
      // "fritto misto" o "misto fritto" → promo 5pz 2,50€ o 10pz/15pz custom
      const frittoMistoM = input.match(/(?:fritto?\s+misto|misto\s+fritto?)(?:\s+da\s+(\d+)\s*(?:pz|pezzi?)?)?/i);
      if(frittoMistoM){
        const nPz = frittoMistoM[1] ? parseInt(frittoMistoM[1]) : 5;
        const prezzoMisto = nPz <= 5 ? 2.50 : nPz <= 10 ? 5.00 : 7.50;
        ordine.frittini = ordine.frittini||[];
        ordine.frittini.push({ qty:1, tipo:'Fritto misto '+nPz+'pz', prezzo:prezzoMisto });
        return 'Aggiunto: 1x Fritto misto '+nPz+'pz — '+fmtE(prezzoMisto)+'€ 🍟\nVuoi altro o scrivi **"basta"**.';
      }
      const _frittiDB = {'patate fritte':3.50,'patate':3.50,'patatine':3.50,'nuggets pollo':2.50,'nuggets':2.50,'olive ascolane':2.50,'olive':2.50,'mozzarelline':2.50,'crocchettine patate':2.50,'crocchettine':2.50,'anellini di cipolla':2.50,'anellini':2.50,'misti':2.50,'verdure pastellate':4.00,'verdure':4.00,'olive ascolane':6.00,'olive':6.00,'mozzarelline':6.00,'nuggets':6.00,'nuggets pollo':6.00,'crocchettine':6.00,'crocchettine patate':6.00,'anellini':3.50,'anellini di cipolla':3.50,'alette':5.50,'alette di pollo':5.50};
      const _kF = Object.keys(_frittiDB).find(k=>_nF.includes(norm(k))||norm(k).includes(_nF));
      if(_kF){
        ordine.frittini = ordine.frittini||[];
        const _isFrittino5pz = ['nuggets pollo','nuggets','olive ascolane','olive','mozzarelline','crocchettine patate','crocchettine','anellini di cipolla','anellini','misti'].includes(_kF);
        const _labelFritto = _isFrittino5pz ? _kF.charAt(0).toUpperCase()+_kF.slice(1)+' 5pz' : _kF.charAt(0).toUpperCase()+_kF.slice(1)+' 10pz';
        const _prezzoFritto = _isFrittino5pz ? 2.50 : _frittiDB[_kF];
        ordine.frittini.push({ qty:1, tipo:_labelFritto, prezzo:_prezzoFritto });
        const _resto = input.replace(_frittoM[0],'').replace(/^[,\se]+/,'').trim();
        // Solo bibite o pizze note — evita ricorsione su "di nuggets" ecc
        if(_resto && _resto.length > 3 && !_resto.match(/\bdi\s+\w+$/i)){
          const _bibaK = trovaBibita(_resto);
          if(_bibaK && BIBITE[_bibaK]){
            ordine.bibite = ordine.bibite||[];
            ordine.bibite.push({qty:1,label:BIBITE[_bibaK].label,prezzo:BIBITE[_bibaK].prezzo});
          } else if(trovaNomePizza(_resto)){
            gestisciOrdine(_resto);
          }
        }
        return 'Aggiunto: 1x '+_labelFritto+' — '+fmtE(_prezzoFritto)+'€ 🍟\nVuoi altro o scrivi **"basta"**.';
      }
    }
    // Split su virgola, newline, e anche 'e' tra pizze (es. '2 margherite e 1 diavola')
    // Frasi tipo "niente acciughe" o "occhio alle X" sono note allergie, non pizze
    if(/\b(?:niente|occhio alle?|attenzione alle?|allergi|intollerante)\b/i.test(input) || /\bsenza lattosio\b/i.test(input) && !trovaNomePizza(input)){
      ordine.note = (ordine.note ? ordine.note + ' — ' : '') + input.trim();
      ordineStep = 'altra';
      return null; // gestito come nota, non come pizza
    }
    // Converti numeri in parole → cifre per il parser quantità
    let _inputNumConv = input
      .replace(/\buno\b/gi,'1').replace(/\buna\b/gi,'1')
      .replace(/\bdue\b/gi,'2').replace(/\btre\b/gi,'3')
      .replace(/\bquattro\b/gi,'4').replace(/\bcinque\b/gi,'5')
      .replace(/\bsei\b/gi,'6').replace(/\bsette\b/gi,'7')
      .replace(/\botto\b/gi,'8').replace(/\bnove\b/gi,'9');
    let _inp = correggiTypo(_inputNumConv)
      .replace(/[\u2018\u2019\u201a\u201b]/g,"'")
      .replace(/\b4\s+formaggi\b/gi,'formaggi')
      .replace(/\b4formaggi\b/gi,'formaggi')
      .replace(/\b4\s+stagioni\b/gi,'quattro stagioni')
      .replace(/\b4stagioni\b/gi,'quattro stagioni')
      .replace(/\bpiu\b|\bpiù\b/gi,'e')
      // Proteggi nomi pizza composti con "e" da split errati
      .replace(/\bsalsiccia\s+e\s+friarielli\b/gi,'salsiccia-e-friarielli')
      .replace(/\btonno\s+e\s+cipolla\b/gi,'tonno-e-cipolla')
      .replace(/\bprosciutto\s+e\s+funghi\b/gi,'prosciutto-e-funghi')
      .replace(/\bciccia\s+e\s+friarielli\b/gi,'ciccia-e-friarielli');
    _inp = _inp.replace(/\buna\s+delle\s+\d+/gi, 'una')
               .replace(/\bperò\s+aggiungi\s+/gi, ' con ')
               .replace(/\bma\s+aggiungi\s+/gi, ' con ');
    _inp = _inp.replace(/\bdell[ae]\s+(?:due|tre|quattro|\d+)\s+con\b/gi, 'con');
    _inp = _inp.replace(/\bperò\s+/gi, ', ')
               .replace(/\bma\s+una\b/gi, ', una')
               .replace(/\bl[''\u2019]altra\s+con\b/gi, ', con')
               .replace(/\bl[''\u2019]altra\s+senza\b/gi, ', senza')
               .replace(/\bl[oa]\s+altra\s+con\b/gi, ', con')
               .replace(/\bl[oa]\s+altra\s+senza\b/gi, ', senza')
               .replace(/\be\s+l[''\u2019]altra\s+/gi, ', ');
    // "N pizze M battute e K normali" → splittale correttamente
    _inp = _inp.replace(/\b(\d+|due|tre|quattro|cinque)\s+battut\w*\s+e\s+(\d+|due|tre|quattro|cinque)\s+normal\w*/gi, (m,nB,nN)=>{
      const nums={'due':2,'tre':3,'quattro':4,'cinque':5};
      const nb=nums[nB.toLowerCase()]||parseInt(nB)||2;
      const nn=nums[nN.toLowerCase()]||parseInt(nN)||2;
      // Genera "però nb battute, nn normali" → sarà gestito dal parser
      return ', '+nb+' battute, '+nn+' normali';
    });
    const righe = _inp.split(/,|\n|(?<=\S)\s+e\s+(?=\d)|(?<=\S)\s+(?=\d+\s+[a-z4-9])|(?<=\S)\s+e\s+(?=una?\s)|(?<=\S)\s+e\s+(?=battut)|(?<=\S)\s+e\s+(?=con\s)|(?<=\S)\s+e\s+(?=senza\s)|(?<=\S)\s+una\s+(?=[a-zA-Z])|(?<=\S)\s+un\s+(?=[a-zA-Z])/).filter(r=>r.trim());
    let trovate = [];
    for(let riga of righe){
      riga = riga.replace(/-e-/g,' e '); // ripristina nomi composti
      // "2 normali" / "tre normali" → ignora (già conteggiate)
      if(/^(\d+|una?|due|tre|quattro|cinque)?\s*normal\w*\s*$/i.test(riga.trim())){
        continue;
      }
      const rn = norm(riga);
      const numMatch = rn.match(/(\d+)/);
      let qty = numMatch ? parseInt(numMatch[1]) : 1;
      // "4 formaggi" / "4 stagioni" → controlla se è un alias pizza (non una quantità)
      if(qty > 1){
        const rigaSenzaQty = riga.replace(/^\s*\d+\s*/,'').trim();
        const aliasCheck = PIZZA_ALIAS[norm(qty+' '+trovaNomePizza(rigaSenzaQty))] || 
                           PIZZA_ALIAS[norm(qty+' '+rigaSenzaQty.split(' ')[0])];
        if(!aliasCheck){
          // Controlla se "N parola" è un alias diretto
          const nParola = qty + ' ' + rigaSenzaQty.split(/\s+/).slice(0,2).join(' ');
          if(PIZZA_ALIAS[norm(nParola)]) qty = 1;
        }
      }
      // Rimuovi numero e prova varie forme
      // Estrai "con X" come nota aggiunta
      const isDoppia = /\bdoppi[ao]?\s+pasta/i.test(riga);
      const isBattuta = /\bbattut/i.test(riga);
      const isBattutaPiccola = /battut\w*\s+piccol/i.test(riga) || /piccol\w*\s+battut/i.test(riga);
      const conMatchRaw = riga.match(/\bcon\s+(.+)$/i);
      let notaAggiunta = conMatchRaw ? conMatchRaw[1].trim() : null;
      // "con doppia pasta" non è un ingrediente aggiunto
      if(notaAggiunta && /^doppi[ao]?\s+pasta/i.test(notaAggiunta)) notaAggiunta = null;
      // Rimuovi "battuta" dalla nota se già riconosciuto come formato
      if(notaAggiunta && isBattuta) notaAggiunta = notaAggiunta.replace(/\bbattut\w*/gi,'').replace(/^[,\s]+|[,\s]+$/g,'').trim() || null;
      // Rimuovi da notaAggiunta le cose già gestite (doppia pasta, senza X riconosciuto)
      if(notaAggiunta){
        notaAggiunta = notaAggiunta
          .replace(/\bdoppi[ao]?\s+pasta\b/gi,'')
          .replace(/\bsenza\s+\w+/gi, '')   // rimuovi "senza X" già gestiti
          .replace(/^[,\s]+|[,\s]+$/g,'').trim() || null;
      }
      // "doppia mozzarella" senza "con" → trattala come nota
      if(!notaAggiunta){
        const doppiaIngMatch = riga.match(/\bdoppi[ao]?\s+(mozzarella|mozz|scamorza|formaggio|salamino|salsiccia|porcini|nduja|wurstel|funghi|prosciutto|acciughe|olive|pomodoro)\b/i);
        if(doppiaIngMatch) notaAggiunta = 'doppia '+doppiaIngMatch[1];
      }
      // Estrai "senza X"
      const senzaMatch = riga.match(/\bsenza\s+([\w\s]+?)(?=\s*,|\s+e\s+[a-z]|\s+ma\s+|\s+però\s+|\s+con\s+|\s+battut|$)/i);
      const ingredienteSenza = senzaMatch ? senzaMatch[1].trim() : null;
      // Estrai "doppia X" o "X extra"
      const extraMatch = riga.match(/([\w\s]+?)\s+(?:extra|in più)(?=\s*,|$)/i);
      const ingredienteExtra = extraMatch ? extraMatch[1].trim() : null;
      const isBaby = /\bbaby\b|\bpoca fame\b/i.test(riga);
      // Se la riga è "battuta [con X]" → formato per pizza precedente
      const isBattutaRiga = /^(?:una?\s+)?battut/i.test(riga.trim());
      // Se riga è "una con X" senza nome pizza → modifica ultima pizza
      const soloCon = /^(?:(?:una?|quello|quella)\s+)?con\s+/i.test(riga.trim());
      if(soloCon && trovate.length > 0 && !ingredienteSenza){
        const ultima = trovate[trovate.length-1];
        const conM2 = riga.match(/\bcon\s+(.+?)(?:\s+però|\s*,|$)/i);
        if(conM2){
          const notaM = conM2[1].trim().replace(/\s+e$/,'').trim();
          if(ultima.qty > 1){
            ultima.qty -= 1;
            trovate.push({ qty:1, nome: ultima.nome.replace(/\s*\(.*\)$/,'')+' (con '+notaM+')', prezzo: ultima.prezzo });
          } else {
            // Crea nuova pizza con modifica invece di modificare l'esistente
            const nomeBase = ultima.nome.replace(/\s*\(con [^)]+\)$/, '');
            trovate.push({ qty:1, nome: nomeBase+' (con '+notaM+')', prezzo: ultima.prezzo });
          }
        }
        continue;
      }
      // "doppia pasta" standalone → applica a ultima pizza (+1€)
      if(/^(?:una?\s+)?doppia\s+pasta$/i.test(riga.trim())){
        const srcDoppia = trovate.length > 0 ? trovate : ordine.pizze;
        if(srcDoppia.length > 0){
          const ulD = srcDoppia[srcDoppia.length-1];
          if(!ulD.nome.includes('doppia pasta')) ulD.nome += ' (doppia pasta)';
          ulD.prezzo += 1.00;
          continue;
        }
      }
      // "N battute" / "battuta" standalone → applica a ultima pizza
      const battStandaloneMatch = riga.trim().match(/^(\d+|una?|due|tre|quattro)?\s*battut/i);
      if(battStandaloneMatch){
        const nums2={'una':1,'un':1,'due':2,'tre':3,'quattro':4};
        const nBatt = battStandaloneMatch[1] ? (nums2[battStandaloneMatch[1].toLowerCase()]||parseInt(battStandaloneMatch[1])||1) : 1;
        const srcArr2 = trovate.length > 0 ? trovate : ordine.pizze;
        if(srcArr2.length > 0){
          const ul = srcArr2[srcArr2.length-1];
          const nTot = ul.qty;
          if(nBatt < nTot){
            ul.qty = nTot - nBatt;
            srcArr2.push({ qty:nBatt, nome:ul.nome.replace(/\s*\(battuta\)/,'')+' (battuta)', prezzo:ul.prezzo+2.00 });
          } else {
            if(!ul.nome.includes('(battuta)')) ul.nome += ' (battuta)';
            ul.prezzo += 2.00;
          }
          continue;
        }
      }
      // VECCHIO CHECK — gestito sopra
      if(false && isBattutaRiga && trovate.length > 0){
        const ultima = trovate[trovate.length-1];
        if(!ultima.nome.includes('(battuta)')) ultima.nome += ' (battuta)';
        const conMatchB = riga.match(/\bcon\s+(.+?)(?:\s+(?:e|pi\u00f9)\s+|$)/i);
        if(conMatchB) ultima.nome += ' con '+conMatchB[1].trim();
        continue;
      }
      const rigaPulita = notaAggiunta ? riga.replace(/\bcon\s+.+$/i,'').trim() : riga;
      const rigaSenzaNum = rigaPulita.replace(/\d+/g,'').trim();
      // rigaSenzaNum PRIMA perché contiene solo il nome senza numero
      // Rimuovi "senza X" dalla riga per trovare il nome pizza senza confusioni
      const rigaPerNome = rigaSenzaNum.replace(/\bsenza\s+[\w\s]+?(?=\s+(?:con\b|doppi|battut|baby|e\s+[a-z])|$)/gi,'').trim();
      const tentativi = [
        rigaPerNome,
        rigaSenzaNum,
        rigaSenzaNum.replace(/e$/,'a'),
        rigaSenzaNum.replace(/he$/,'ha'),
        rigaSenzaNum.replace(/i$/,'a'),
        rigaSenzaNum.replace(/ie$/,'ia'),
        rigaSenzaNum.replace(/ole$/,'ola'),
        rigaSenzaNum.replace(/oni$/,'one'),
        rn.replace(/\d+\s*/g,''),
        rigaPulita,
      ];
      let nomePizza = null;
      for(const t2 of tentativi){ nomePizza = trovaNomePizza(t2); if(nomePizza) break; }
      if(nomePizza){
        const p = PIZZE[nomePizza];
        let nomeDisplay = nomePizza.charAt(0).toUpperCase()+nomePizza.slice(1);
        if(isBaby) nomeDisplay += ' (baby)';
        if(isBattuta && !isBattutaPiccola) nomeDisplay += ' (battuta)';
        if(isDoppia) nomeDisplay += ' (doppia pasta)';
        if(ingredienteSenza) nomeDisplay += ' (senza '+ingredienteSenza+')';
        if(ingredienteExtra && !['pasta','mozzarella','scamorza'].includes(norm(ingredienteExtra)) && !norm(ingredienteExtra).includes(nomePizza) && !(notaAggiunta && norm(notaAggiunta).includes(norm(ingredienteExtra)))){
          nomeDisplay += ' ('+ingredienteExtra+' extra)';
        }
        if(notaAggiunta && norm(notaAggiunta) !== norm(ingredienteExtra||'')){
          // Controlla se l'aggiunta richiede domanda cottura/sostituzione
          const canonNota = trovaNomeIng(notaAggiunta) || notaAggiunta;
          const haMozz = p.ing.some(i=>norm(i).includes('mozzarella'));
          const tipoCheck = checkAggiuntaSpeciale(canonNota, haMozz);
          if(tipoCheck === 'sostituzione'){
            if(trovate.length > 0){
              // Batch: aggiungi direttamente con nota
              nomeDisplay += ' (con '+notaAggiunta+' — chiedi cottura)';
            } else {
              // Anche da sola: aggiungi con nota e chiedi dopo nel flusso "altra"
              nomeDisplay += ' (con '+notaAggiunta+' — chiedi cottura al ritiro)';
            }
          } else if(tipoCheck === 'fine_cottura'){
            nomeDisplay += ' (con '+notaAggiunta+' a fine cottura)';
          } else {
            nomeDisplay += ' (con '+notaAggiunta+')';
          }
        }
        // Pulisci e finale nelle parentesi
        nomeDisplay = nomeDisplay.replace(/\s+e\)$/g,')').replace(/\(con\s+e\)/g,'').trim();
        // Se notaAggiunta non è un ingrediente noto → asterisco
        if(notaAggiunta){
          const notaNorm = norm(notaAggiunta);
          const isIngNoto = Object.keys(ING).some(k=>notaNorm.includes(norm(k))) || 
                            Object.values(ING_ALIAS).some(v=>notaNorm.includes(norm(v)));
          const isVariazioneNota = /\b(?:fine cottura|a crudo|crudo|scamorza|bufala|brie|grana|porcini|wurstel|salamino|acciugh|cipolla|rucola|patatine|mozzarella|doppia|origano|aglio|nduja|porchetta|tartufo|funghi|scamorza|provola|stracchino|ricotta|olive|capperi|tonno|prosciutto|salame|salsiccia|zucchine|melanzane|peperoni|pomodor|rucola|speck|bresaola|lardo|guanciale|pecorino|mortadella|pistacchi|basilico|confettura|miele|noci|nocciole|fichi|lamponi|pistacchio)\b/i.test(notaAggiunta);
          if(!isIngNoto && !isVariazioneNota && notaAggiunta.length > 2){
            const nAst4 = (ordine._noteVariazioni||[]).length + 1;
            nomeDisplay = nomeDisplay.replace(/\(con [^)]+\)$/, '').trim() + ' *'+nAst4;
            ordine._noteVariazioni = ordine._noteVariazioni || [];
            ordine._noteVariazioni.push('*'+nAst4+' '+nomeDisplay.replace(/\s\*\d+$/,'').trim()+': con '+notaAggiunta+' (verificare)');
            notaAggiunta = null; // non duplicare
          }
        }
        
        // ── Variazioni prezzo ──
        let prezzoFinale = p.prezzo;
        const rigaLow = riga.toLowerCase();
        if(isBattuta && !isBattutaPiccola) prezzoFinale += 2.00;  // battuta +2€
        if(isDoppia) prezzoFinale += 1.00;                         // doppia pasta +1€
        if(isBaby) prezzoFinale -= 0.50;                           // baby -0.50€
        
        // Asterisco per richieste no-price (ben cotta, tagliata, poco cotta, spicchi ecc.)
        const richiesteNoteVariazioni = [];
        const patternNoteVariaz = [
          [/\bben\s+cott\w*/i, 'ben cotta'],
          [/\bpoco\s+cott\w*/i, 'poco cotta'],
          [/\btagliat\w*/i, 'tagliata'],
          [/\ba\s+spicchi/i, 'a spicchi'],
          [/\bvegan\w*/i, 'vegan'],
          [/\bsenza\s+lattosio/i, 'senza lattosio (+€ verifica)'],
          [/\blattosio/i, 'lattosio (verifica)'],
          [/\bvegetar\w*/i, 'vegetariana'],
          // croccante NON genera asterisco — va come nota libera
          // [/\bcroccant\w*/i, 'extra croccante'],
          [/\bpoco\s+sal\w*/i, 'poco salata'],
          [/\bmezza\s+e\s+mezza/i, 'mezza e mezza'],
        ];
        for(const [re, label] of patternNoteVariaz){
          if(re.test(riga) && !nomeDisplay.includes(label)) richiesteNoteVariazioni.push(label);
        }
        // Asterisco per variazioni no-price riconosciute
        if(richiesteNoteVariazioni.length > 0){
          nomeDisplay += ' *';
          ordine._noteVariazioni = ordine._noteVariazioni || [];
          ordine._noteVariazioni.push('* '+nomeDisplay.replace(' *','')+': '+richiesteNoteVariazioni.join(', '));
        }
        // Asterisco per senza X non riconosciuto (es. "senza lettosio")
        if(ingredienteSenza){
          const canonSenza = trovaNomeIng(ingredienteSenza)||null;
          const allergenoKnown = ['lattosio','latte','glutine','celiaco','noci','uova','pesce','soia','arachidi','sesamo','senape'].some(k=>norm(ingredienteSenza).includes(k));
          if(!canonSenza && !allergenoKnown){
            const nAst2 = (ordine._noteVariazioni||[]).length + 1;
            nomeDisplay += ' *'+nAst2;
            ordine._noteVariazioni = ordine._noteVariazioni || [];
            ordine._noteVariazioni.push('*'+nAst2+' '+nomeDisplay.replace(' *'+nAst2,'').trim()+': senza '+ingredienteSenza+' (verificare)');
          }
        }
        
        trovate.push({ qty, nome: nomeDisplay, prezzo: prezzoFinale });
      } else {
        // Nessuna pizza trovata — controlla se è un formato per la pizza precedente
        const isBattutaStandalone = /^(?:una?\s+)?battut/i.test(riga.trim());
        // "due battute e due normali" → splitta su "e due normali"
        const dueNormaliMatch = riga.match(/(\d+|due|tre)\s+battut\w*\s+e\s+(\d+|due|tre)\s+normal\w*/i);
        if(dueNormaliMatch && trovate.length > 0){
          const nums = {'due':2,'tre':3,'quattro':4,'cinque':5};
          const nBatt = nums[dueNormaliMatch[1].toLowerCase()]||parseInt(dueNormaliMatch[1])||2;
          const nNorm = nums[dueNormaliMatch[2].toLowerCase()]||parseInt(dueNormaliMatch[2])||2;
          const ultima = trovate[trovate.length-1];
          const nomeBase = ultima.nome;
          trovate.pop();
          trovate.push({ qty:nBatt, nome:nomeBase+' (battuta)', prezzo:ultima.prezzo+2 });
          trovate.push({ qty:nNorm, nome:nomeBase, prezzo:ultima.prezzo });
          continue;
        }
        if(isBattutaStandalone && trovate.length > 0){
          const ultima = trovate[trovate.length-1];
          if(!ultima.nome.includes('(battuta)')) ultima.nome += ' (battuta)';
          if(conMatch) ultima.nome += ' con '+notaAggiunta;
        } else if(ingredienteSenza && trovate.length > 0){
          // "una senza X" → applica alla pizza precedente
          const ultima = trovate[trovate.length-1];
          if(ultima.qty > 1){
            // Splitta: (qty-1) normali + 1 con senza
            ultima.qty -= 1;
            trovate.push({ qty:1, nome: ultima.nome+' (senza '+ingredienteSenza+')', prezzo: ultima.prezzo });
          } else {
            if(!ultima.nome.includes('senza')) ultima.nome += ' (senza '+ingredienteSenza+')';
          }
        } else {
          // Prova a trovare ingredienti e creare pizza custom
          const rigaIngPulita = norm(riga).replace(/^(una?|il|la|lo|le)\s+/,'').replace(/doppi\w*/g,'').replace(/battut\w*/g,'').trim();
          const ingCanon = trovaNomeIng(rigaIngPulita);
          if(ingCanon && ING[ingCanon]){
            const isDoppia2 = /\bdoppi/i.test(riga);
            const nd2 = ingCanon.charAt(0).toUpperCase()+ingCanon.slice(1)+(isDoppia2?' (doppia pasta)':'');
            trovate.push({ qty, nome: nd2+' [custom]', prezzo: 6+ING[ingCanon].prezzo });
          }
        }
      }
    }
    if(trovate.length > 0){
      ordine.pizze.push(...trovate);
      const lista = trovate.map(p=>`${p.qty}x ${p.nome}`).join(', ');
      ordineStep = 'altra';
      return `Aggiunto: ${lista} ✅\n\nVuoi aggiungere altre pizze? Oppure scrivi **"basta"** per procedere.`;
    }
    if(ordine.frittini && ordine.frittini.length > 0 && ordine.pizze.length === 0){
      ordineStep = 'altra';
      return gestisciOrdine('basta');
    }
    return `Non ho trovato pizze nel menù 😅 Prova a scrivere il nome, tipo "2 margherite" o "una diavola".`;
  }

  if(ordineStep === 'domanda_cottura' && ordineDomandaCottura){
    const dc = ordineDomandaCottura;
    const p = PIZZE[dc.nomePizza];
    const nd = dc.nomePizza.charAt(0).toUpperCase()+dc.nomePizza.slice(1);

    if(dc.tipo === 'sostituzione'){
      let nomeDisplay;
      if(['al posto','invece','senza mozzarella','solo','sostituzione'].some(k=>t.includes(norm(k)))){
        // Al posto della mozzarella
        nomeDisplay = nd+' ('+dc.ing+' al posto della mozzarella)';
      } else {
        // In aggiunta — chiedi cottura
        ordineDomandaCottura = { tipo:'cottura', ing:dc.ing, nomePizza:dc.nomePizza, qty:dc.qty, prezzo:dc.prezzo };
        ordineStep = 'domanda_cottura';
        return 'Vuoi la **'+dc.ing+'** in cottura o a fine cottura? 🔥\n(Fine cottura = resta fresca e cremosa, in cottura = si scioglie)';
      }
      ordine.pizze.push({ qty:dc.qty, nome:nomeDisplay, prezzo:dc.prezzo });
      ordineDomandaCottura = null;
      ordineStep = 'altra';
      return 'Aggiunto: '+dc.qty+'x '+nomeDisplay+' ✅\n\nVuoi aggiungere altre pizze? Oppure scrivi **"basta"** per procedere.';
    }

    if(dc.tipo === 'cottura'){
      const quando = ['fine cottura','fine','a crudo','crudo','fuori'].some(k=>t.includes(norm(k))) ? 'a fine cottura' : 'in cottura';
      const nomeDisplay = dc.nomePizza.charAt(0).toUpperCase()+dc.nomePizza.slice(1)+' ('+dc.ing+' '+quando+')';
      ordine.pizze.push({ qty:dc.qty, nome:nomeDisplay, prezzo:dc.prezzo });
      ordineDomandaCottura = null;
      ordineStep = 'altra';
      return 'Aggiunto: '+dc.qty+'x '+nomeDisplay+' ✅\n\nVuoi aggiungere altre pizze? Oppure scrivi **"basta"** per procedere.';
    }
  }

  if(ordineStep === 'altra'){
    // Cambio orario durante ordine
    if(t.includes('cambia') && t.includes('orari') || t.includes('orario diverso') || t.includes('cambio orario')){
      const nuovoOrario = parseOrario(input);
      if(nuovoOrario){
        ordine.orario = nuovoOrario;
        return 'Orario aggiornato a **'+nuovoOrario+'** ✅\nVuoi aggiungere altre pizze o scrivi **"basta"**.';
      }
      return 'Dimmi il nuovo orario 🕐';
    }
    // Rimozione + eventuale aggiunta nella stessa frase
    if(t.includes('togli') || t.includes('rimuovi') || t.includes('cancella')){
      // Estrai parte "togli X" e parte "aggiungi Y"
      const parteTogli = input.match(/(?:togli|rimuovi|cancella|via)\s+(.+?)(?:\s+e\s+(?:aggiungi|metti|anche)\s+|$)/i);
      const parteAggiungi = input.match(/(?:aggiungi|metti|anche|sostituisci con)\s+(.+)$/i);
      let msg = '';
      // Rimuovi
      if(parteTogli){
        const nomeDaTogliere = trovaNomePizza(parteTogli[1]);
        if(nomeDaTogliere){
          const idx2 = ordine.pizze.findIndex(p=>norm(p.nome).includes(norm(nomeDaTogliere)));
          if(idx2>=0){
            const rimossa = ordine.pizze.splice(idx2,1)[0];
            msg += 'Rimosso **'+rimossa.nome+'** ✅  ';
          }
        }
      }
      // Aggiungi
      if(parteAggiungi){
        ordineStep='pizze';
        const aggResult = gestisciOrdine(parteAggiungi[1]);
        ordineStep='altra';
        if(aggResult) msg += aggResult.replace('Aggiunto:','Aggiunto:');
      }
      if(msg) return msg+'\nVuoi altro o scrivi **"basta"**.';
    }
    if(['basta','ok','no','finito','fatto','va bene','è tutto','e tutto'].some(k=>t.includes(k))){
      // Controlla allergeni nelle pizze ordinate
      const avvisiAllergeni = [];
      for(const p of ordine.pizze){
        const nomePizzaClean = p.nome.replace(/\s*\(.*\)$/,'').toLowerCase();
        const pizzaData = PIZZE[nomePizzaClean];
        if(pizzaData){
          const alls = calcolaAllergeni(pizzaData.ing);
          const allFiltrati = alls.filter(a=>a!=='glutine'); // glutine sempre presente
          if(allFiltrati.length) avvisiAllergeni.push('**'+p.nome+'**: '+allFiltrati.join(', '));
        }
      }
      ordineStep = 'note';
      let msg = 'Hai note particolari? (allergie, variazioni, altro)\nOppure scrivi **"no"** per procedere al riepilogo.';
      if(avvisiAllergeni.length){
        msg = '⚠️ **Attenzione allergeni:**\n'+avvisiAllergeni.join('\n')+'\n\n'+msg;
      }
      return msg;
    }
    // Prova ad aggiungere altra pizza
    ordineStep = 'pizze';
    return gestisciOrdine(input);
  }

  if(ordineStep === 'note'){
    const tN = norm(input.trim());
    // Solo "no" secco = nessuna nota
    // Risposte ambigue → ripeti la domanda
    const _ambigui = ['boh','mah','beh','eh','uhm','hmm','?','...'];
    if(_ambigui.some(k=>tN===k)||input.trim().length<2){
      return 'Hai allergie o note particolari? Scrivi pure o **"no"** per procedere 😊';
    }
    if(['no','niente','nessuna','nessuno','nope','nah'].some(k=>tN===k)){
      ordine.note = '';
      ordineStep = 'spicchi';
      return '🔪 Vuole la pizza **tagliata a spicchi**? (sì o no)';
    }
    // "sì/si" secco → chiedi di specificare solo se sembra riferirsi ad allergie
    if(['si','sì','yes','yep'].some(k=>tN===k)){
      // Sì secco nelle note = "sì ho allergie, dimmi" 
      return 'Dimmi pure — allergie, ingredienti da togliere, altro... 📝\nOppure scrivi **"no"** per saltare.';
    }
    let notaTesto = input.trim();
    const mappaAllergeni = {'lattosio':'latte','latte':'latte','latticini':'latte','noci':'frutta a guscio','frutta a guscio':'frutta a guscio','frutta secca':'frutta a guscio','glutine':'glutine','celiaco':'glutine','pesce':'pesce','uova':'uova','uovo':'uova','soia':'soia','senape':'senape'};
    const notaN = norm(notaTesto);
    let allergeneRilevato = null;
    for(const [k,v] of Object.entries(mappaAllergeni)){ if(notaN.includes(k)){ allergeneRilevato=v; break; } }
    let avvisiAllerg = [];
    if(allergeneRilevato){
      for(const p of ordine.pizze){
        const nomePulito = p.nome.replace(/\s*\(.*\)$/,'').toLowerCase();
        const pizzaData = PIZZE[nomePulito];
        if(pizzaData){ const alls=calcolaAllergeni(pizzaData.ing); if(alls.includes(allergeneRilevato)) avvisiAllerg.push('**'+p.nome+'** contiene **'+allergeneRilevato+'**'); }
      }
    }
    if(['allergi','intollerante','intolleranza'].some(k=>notaN.includes(k))) notaTesto = '⚠️ '+notaTesto;
    ordine.note = notaTesto;
    ordineStep = 'spicchi';
    return '🔪 Vuole la pizza **tagliata a spicchi**? (scrivi sì o no)';
  }

  if(ordineStep === 'spicchi'){
    const tS = norm(input.trim());
    if(['si','sì','ok','yes','certo','dai','sì grazie','si grazie'].some(k=>tS.includes(k))){
      if(!ordine.note) ordine.note = '⚡ Tagliare a spicchi';
      else ordine.note += ' — tagliare a spicchi';
    }
    const nPizze = ordine.pizze.reduce((s,p)=>s+p.qty,0);
    const sugFritt = nPizze >= 6 ? 2 : 1;
    // Risposte ambigue → ripeti la domanda
    const _ambS = ['boh','mah','beh','eh','uhm','?','...'];
    if(_ambS.some(k=>norm(input.trim())===k)){
      return '🔪 Tagliata a spicchi sì o no? 😊';
    }
    ordineStep = 'frittini';
    return '🍟 Vuoi aggiungere dei **frittini**? (5pz a 2,50€ l\'uno)\n'+
           (sugFritt > 1 ? 'Con '+nPizze+' pizze potreste volerne anche '+sugFritt+' 😋\n' : '')+
           'Misti o scegli tipo: Olive · Mozzarelline · Nuggets · Crocchettine · Anellini\nOppure **"no"** per procedere.';
  }

  if(ordineStep === 'frittini'){
    // Se ha già frittini nell'ordine → salta a bibita
    if(ordine.frittini && ordine.frittini.length > 0){
      ordineStep = 'bibita';
      return '🥤 Vuoi aggiungere anche una **bibita**?\nCon frittino + bibita analcolica o birra lattina sei a **4,00€** totale!\nOppure **"no"** per procedere.';
    }
    const tF = norm(correggiTypo(input).trim());
    // No esplicito
    if(['no','niente','nope','nah','no grazie','non voglio'].some(k=>tF===k)){
      ordineStep = 'conferma';
      return fmtOrdine() + '\n\nÈ tutto corretto?';
    }
    // Capisce quantità colloquiale: 'no due bastano', 'dai uno', 'sì due', 'fanne 3'
    const nF = input.match(/(\d+|uno|due|tre|quattro|cinque)/i);
    const numFritt = nF ? ({'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5}[nF[1].toLowerCase()]||parseInt(nF[1])||1) : null;
    // Tipo già specificato?
    let tipoF = null;
    if(tF.includes('mist')||tF.includes('assort')) tipoF='Misti';
    else {
      const paroleF = tF.split(/\s+/);
      for(const [nome] of (typeof FRITTINI!=="undefined"?Object.entries(FRITTINI):['olive ascolane','mozzarelline','nuggets pollo','crocchettine patate','anellini di cipolla','verdure pastellate','patate fritte','alette di pollo'].map(n=>[n]))){
        const nomeN2 = norm(nome);
        if(paroleF.some(pw=>nomeN2.includes(pw)&&pw.length>2)){
          tipoF=nome.charAt(0).toUpperCase()+nome.slice(1); break;
        }
      }
    }
    // Fritto misto esplicito
    const mistoF = input.match(/(?:fritto?\s+misto|misto\s+fritto?)(?:\s+da\s+(\d+))?/i);
    if(mistoF){
      const np=mistoF[1]?parseInt(mistoF[1]):5;
      const pr=np<=5?2.50:np<=10?5.00:7.50;
      ordine.frittini.push({qty:1,tipo:'Fritto misto '+np+'pz',prezzo:pr});
      ordineStep='conferma';
      return 'Aggiunto: 1x Fritto misto '+np+'pz — '+fmtE(pr)+'€ 🍟\n\n'+fmtOrdine()+'\n\nÈ tutto corretto?';
    }
    // Ha dato quantità ma non tipo → chiedi tipo
    if(numFritt && !tipoF){
      ordine._frittiniQtyPending = numFritt;
      ordineStep='frittini_tipo';
      return 'Come li vuoi? 🍟\n• **Misti** (assortiti)\n• Olive ascolane\n• Mozzarelline\n• Nuggets pollo\n• Crocchettine patate\n• Anellini di cipolla\n\nOppure più tipi: es. _"uno misto e uno olive"_';
    }
    // Ha dato tipo ma non quantità → assume 1
    if(tipoF && !numFritt){
      ordine.frittini.push({qty:1, tipo:tipoF, prezzo:2.50});
      ordineStep='bibita';
      return 'Aggiunto: 1x Frittino '+tipoF+' 5pz — 2,50€ 🍟\n\nVuoi aggiungere anche una **bibita**? 🥤\nCon frittino + bibita analcolica o birra lattina sei a **4,00€** totale!\nOppure **"no"** per procedere.';
    }
    // Ha dato sia quantità che tipo
    if(numFritt && tipoF){
      ordine.frittini.push({qty:numFritt, tipo:tipoF, prezzo:2.50});
      ordineStep='bibita';
      return 'Aggiunto: '+numFritt+'x Frittino '+tipoF+' 5pz — '+fmtE(numFritt*2.50)+'€ 🍟\n\nVuoi aggiungere anche una **bibita**? 🥤\nCon frittino + bibita analcolica o birra lattina sei a **4,00€** totale!\nOppure **"no"** per procedere.';
    }
    // Sì generico o non capisce → chiedi quanti
    ordineStep='frittini_qty';
    return 'Quanti frittini vuoi? (5pz a 2,50€ l\'uno)\nPuoi prenderne fino a '+Math.min(4,ordine.pizze.reduce((s,p)=>s+p.qty,0))+'.';
  }

  if(ordineStep === 'frittini_qty'){
    const tQ = norm(input.trim());
    if(['no','niente','nope','basta','no grazie'].some(k=>tQ===k)){
      ordineStep='conferma';
      return fmtOrdine()+'\n\nÈ tutto corretto?';
    }
    // Se contiene già un tipo → vai diretto a frittini_tipo
    const _tipiKeywords = ['mist','assort','olive','nugget','mozzarell','crocchett','anellin','pollo'];
    const _hasTipo = _tipiKeywords.some(k=>tQ.includes(k));
    if(_hasTipo){
      // Estrai quantità se presente, altrimenti usa 1 per tipo
      ordineStep='frittini_tipo';
      return gestisciOrdine(input);
    }
    const nQ = input.match(/(\d+|uno|due|tre|quattro|cinque)/i);
    const qtyQ = nQ ? ({'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5}[nQ[1].toLowerCase()]||parseInt(nQ[1])||1) : 1;
    ordine._frittiniQtyPending = qtyQ;
    ordineStep='frittini_tipo';
    return 'Come li vuoi? 🍟\n• **Misti** (assortiti)\n• Olive ascolane\n• Mozzarelline\n• Nuggets pollo\n• Crocchettine patate\n• Anellini di cipolla\n\nOppure più tipi: es. _"uno misto e uno olive"_';
  }

  if(ordineStep === 'frittini_tipo'){
    const tT = norm(correggiTypo(input).trim());
    const qty = ordine._frittiniQtyPending || 1;
    // Solo misti
    const soloMisti = ['misti','misto','assortiti','assortito'].includes(tT);
    if(soloMisti){
      ordine.frittini.push({ qty, tipo:'Misti', prezzo:2.50 });
      delete ordine._frittiniQtyPending;
      ordineStep='bibita';
      return 'Aggiunto: '+qty+'x Frittino Misti 5pz — '+fmtE(qty*2.50)+'€ 🍟\n\nVuoi aggiungere anche una **bibita**? 🥤\nCon frittino + bibita analcolica o birra lattina sei a **4,00€** totale!\nOppure **"no"** per procedere.';
    }
    // Splitta su "e", virgola, o "N tipo N tipo" senza "e"
    const inputNorm2 = correggiTypo(input);
    const inputSplit = inputNorm2.replace(/((?:\d+|uno|due|tre|quattro)\s+\w+(?:\s+\w+)?)\s+(?=(?:\d+|uno|due|tre|quattro))/g,'$1,');
    const partiTipo = inputSplit.split(/\s+e\s+|,/i).filter(p=>p.trim());
    const aggiunti = [];
    for(const parte of partiTipo){
      const tP = norm(parte.trim());
      const nP = parte.match(/(\d+|uno|due|tre)/i);
      const qP = nP ? ({'uno':1,'due':2,'tre':3}[nP[1].toLowerCase()]||parseInt(nP[1])||1) : 1;
      let tipoP = 'Misti';
      if(tP.includes('mist')||tP.includes('assort')) tipoP='Misti';
      else {
        const paroleP = tP.split(/\s+/);
        // Ordina dal più specifico: conta quante parole dell'input matchano il nome
        const _frittiOrd = ['olive ascolane','mozzarelline','nuggets pollo','crocchettine patate','anellini di cipolla','verdure pastellate','patate fritte','alette di pollo','misti'];
        let _bestMatch = null; let _bestScore = 0;
        for(const nome of _frittiOrd){
          const nomeN = norm(nome);
          const nomeParole = nomeN.split(/\s+/);
          // Conta quante parole dell'input corrispondono al nome
          const score = paroleP.filter(pw=>pw.length>2&&nomeN.includes(pw)).length +
                        nomeParole.filter(np=>np.length>2&&tP.includes(np)).length;
          if(score > _bestScore){
            _bestScore = score;
            _bestMatch = nome;
          }
        }
        if(_bestMatch) tipoP = _bestMatch.charAt(0).toUpperCase()+_bestMatch.slice(1);
      }
      // Prezzo corretto dal DB
      const _prezziF = {'misti':2.50,'olive ascolane':2.50,'mozzarelline':2.50,'nuggets pollo':2.50,'crocchettine patate':2.50,'anellini di cipolla':2.50,'verdure pastellate':4.00,'patate fritte':3.50,'alette di pollo':5.50,'fritto misto':2.50};
      const _tipoPLow = tipoP.toLowerCase().replace(/\s*\d+pz$/,'').trim();
      const _prezzoTipo = _prezziF[_tipoPLow] || 2.50;
      ordine.frittini.push({qty:qP, tipo:tipoP, prezzo:_prezzoTipo});
      aggiunti.push(qP+'x '+tipoP);
    }
    delete ordine._frittiniQtyPending;
    // Verifica che aggiunti non siano solo "Misti" da default su input non riconosciuto
    const _inputRecognized = ['mist','assort','olive','nugget','mozzarell','crocchett','anellin','pollo','fritto'].some(k=>norm(input).includes(k));
    if(!_inputRecognized && aggiunti.length > 0 && aggiunti.every(a=>a.includes('Misti'))){
      // Input non riconosciuto → non aggiungere, ripeti domanda
      ordine.frittini = ordine.frittini.filter(f=>!aggiunti.includes(f.qty+'x '+f.tipo));
      return 'Come li vuoi? 🍟\n• **Misti** (assortiti)\n• Olive ascolane\n• Mozzarelline\n• Nuggets pollo\n• Crocchettine patate\n• Anellini di cipolla\n\nEs. _"uno misto e uno olive"_';
    }
    if(ordine.frittini.length > 0){
      ordineStep = 'bibita';
      return 'Aggiunto: '+aggiunti.join(', ')+' 🍟\n\nVuoi aggiungere anche una **bibita**? 🥤\nCon frittino + bibita analcolica o birra lattina sei a **4,00€** totale!\nOppure **"no"** per procedere.';
    }
    ordineStep='conferma';
    return fmtOrdine()+'\n\nÈ tutto corretto?';
  }


  if(ordineStep === 'bibita'){
    const tB = norm(input.trim());
    if(['no','niente','nope','basta','no grazie','non voglio'].some(k=>tB===k||tB.startsWith(k))){
      ordineStep='conferma';
      return fmtOrdine()+'\n\nÈ tutto corretto?';
    }
    const keyBibita = (typeof trovaBibita==='function') ? trovaBibita(input) : null;
    if(keyBibita && typeof BIBITE!=='undefined' && BIBITE[keyBibita]){
      const bib=BIBITE[keyBibita];
      // Combo solo con frittini 5pz (prezzo 2.50€), non con patate/verdure/alette (prezzo pieno)
      const haFrittCombo = ordine.frittini.some(f=>f.prezzo<=2.50);
      const prezBibita=(haFrittCombo&&(bib.tipo==='analcolica'||bib.tipo==='lattina'))?1.50:bib.prezzo;
      ordine.bibite=ordine.bibite||[];
      ordine.bibite.push({qty:1,label:bib.label,prezzo:prezBibita});
      ordineStep='conferma';
      return 'Aggiunto: 1x '+bib.label+' — '+fmtE(prezBibita)+'€ 🥤\n\n'+fmtOrdine()+'\n\nÈ tutto corretto?';
    }
    if(['si','sì','ok','yes','certo','dai'].some(k=>tB===k)){
      return 'Quale bibita vuoi? 🥤\n• Bibita analcolica (Coca, Fanta, Sprite, Lemonsoda) — **1,50€ in più** con combo\n• Birra lattina — **1,50€ in più** con combo\n• Birra bottiglia 33/50/66cl — **3,50€**\n• Franziskaner 50cl — **3,50€**\n• Tuborg 66cl — **3,50€**\n• Birra da litro — **6,00€**';
    }
    ordineStep='conferma';
    return fmtOrdine()+'\n\nÈ tutto corretto?';
  }

  if(ordineStep === 'conferma'){
    const t = norm(input.trim());
    // Aggiunta post-conferma
    if(['aggiungi','aggiungimi','metti anche','e anche','vorrei anche'].some(k=>t.startsWith(norm(k)))||t.includes('aggiungi')){
      const parteAgg=input.replace(/^(?:aggiungi|aggiungimi|metti anche|e anche|vorrei anche)\s*/i,'').trim();
      const prevQt=ordine.pizze.reduce((s,p)=>s+p.qty,0);
      const prevFr=(ordine.frittini||[]).length;
      ordineStep='altra'; gestisciOrdine(parteAgg); ordineStep='conferma';
      if(ordine.pizze.reduce((s,p)=>s+p.qty,0)>prevQt||(ordine.frittini||[]).length>prevFr)
        return '✅ Aggiunto!\n\n'+fmtOrdine()+'\n\nConfermi ora?';
    }
    if(['si','sì','ok','confermo','giusto','esatto','corretto','vai'].some(k=>t.includes(k))){
      return 'MOSTRA_PULSANTE';
    }
    if(['annulla','cancella ordine'].some(k=>t.includes(norm(k)))){
      resetOrdine();
      return 'Ordine annullato. Ricominciamo quando vuoi! 🐧';
    }
    if(t==='no'||t==='sbagliato'){
      return 'Vuoi **annullare** l\'ordine o **modificarlo**? ✏️\nDimmi cosa cambiare oppure scrivi **"annulla"** per ricominciare.';
    }
    return 'Scrivi **"sì"** per confermare o **"no"** per annullare. 🐧';
  }

  return null;
}

function mostraCuriosita(){
  if(!panelOpen) togglePanel();
  setTimeout(()=>{
    const r = rispostaLocale('curiosità');
    if(r) addBotMsg(r);
  }, 350);
}

function quickSend(text){
  if(!panelOpen) togglePanel();
  setTimeout(()=>{ document.getElementById('bp-input').value=text; bpSend(); },350);
}

async function bpSend(){
  // Gestione consenso privacy post-ordine
  if(ordine && ordine._aspettaConsensoPrivacy){
    const t = document.getElementById('bp-input').value.trim();
    document.getElementById('bp-input').value = '';
    addUserMsg(t);
    const tn = t.toLowerCase().trim();
    if(['si','sì','ok','yes','certo','dai','salva'].some(k=>tn===k||tn.includes(k))){
      ordine._aspettaConsensoPrivacy = false;
      fetch('/api/clienti', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          telefono: ordine.telefono,
          nome: ordine.nome,
          pizza_preferita: ordine.pizze && ordine.pizze.length > 0 ? ordine.pizze[0].nome.replace(/\s*\([^)]*\)/g,'').trim() : null
        })
      }).then(()=>{
        setTimeout(()=>addBotMsg('✅ Profilo salvato! La prossima volta ti riconosco subito 🐧\nScrivi **"cancellami"** in qualsiasi momento per eliminare i tuoi dati.'),300);
      }).catch(()=>{
        setTimeout(()=>addBotMsg('⚠️ Non sono riuscito a salvare il profilo, riprova più tardi.'),300);
      });
    } else {
      ordine._aspettaConsensoPrivacy = false;
      setTimeout(()=>addBotMsg('Ok, nessun problema! Ci vediamo al prossimo ordine 🐧'),300);
    }
    return;
  }

  const input = document.getElementById('bp-input');
  const text = input.value.trim();
  if(!text) return;
  input.value = '';
  addUserMsg(text);
  bpLoading = true;

  // Cancellami / cambia numero
  if(norm(text).includes('cancellami')||norm(text).includes('cancella i miei dati')||
     norm(text).includes('cambia numero')||norm(text).includes('cancella profilo')){
    setTimeout(()=>addBotMsg('Per cancellare i tuoi dati o cambiare numero chiama il **0422 670631** o WhatsApp **340 532 7257** 🐧\nProvvediamo entro 24 ore!'),300);
    bpLoading=false; return;
  }

  // Se ordine attivo → gestisciOrdine
  if(ordineAttivo){
    const r = gestisciOrdine(text);
    if(r === 'MOSTRA_PULSANTE'){
      mostraPulsanteConferma();
    } else if(r){
      setTimeout(()=>addBotMsg(r),300);
    } else {
      // Fallback: se null durante ordine, ripeti domanda per lo step corrente
      const fallback = {
        'frittini_tipo': 'Come li vuoi? 🍟\n• **Misti** (assortiti)\n• Olive ascolane\n• Mozzarelline\n• Nuggets pollo\n• Crocchettine patate\n• Anellini di cipolla\n\nEs. "uno misto e uno olive"',
        'frittini_qty': 'Quanti frittini vuoi? (5pz a 2,50€ l\'uno)',
        'frittini': '🍟 Vuoi aggiungere dei **frittini**? Scrivi il tipo (olive, nuggets, misto...) oppure **"no"**',
        'bibita': 'Quale bibita vuoi? Oppure **"no"** per procedere.',
        'note': 'Hai note particolari? Scrivi pure o **"no"** per procedere.',
        'spicchi': '🔪 Vuole la pizza tagliata a spicchi? **sì** o **no**',
      };
      if(fallback[ordineStep]){
        setTimeout(()=>addBotMsg('Non ho capito 😅\n'+fallback[ordineStep]),300);
      }
    }
    bpLoading=false;
    return;
  }

  // Avvio ordine
  const locale = rispostaLocale(text);
  if(locale === 'ORDER'){
    ordineAttivo = true;
    ordineStep = 'nome';
    resetOrdine();
    const orarioGia = parseOrario(norm(text));
    if(orarioGia){
      ordine.orario = orarioGia;
      setTimeout(()=>addBotMsg('Perfetto! 🍕 Ho visto che vuoi venire alle **'+orarioGia+'**.\n\nCome ti chiami? Scrivi nome e cognome 😊'), 300);
    } else {
      setTimeout(()=>addBotMsg('Perfetto! 🍕 Raccogliamo il tuo ordine.\n\nCome ti chiami? Scrivi nome e cognome 😊'), 300);
    }
    bpLoading=false;
    return;
  }
  if(locale === 'COSA_SAI_FARE'){
    setTimeout(()=>addBotMsg('🐧 **Cosa so fare:**\n\n🍕 Calorie e prezzo di ogni pizza\n➕ Consulto ingredienti e allergeni\n📋 **Ordini** — guidati passo passo\n🍟 Frittini e bibite\n🔪 Taglio a spicchi\n⭐ Pizza del giorno\n\nScrivimi pure o premi **Ordina** per iniziare!'),300);
    bpLoading=false;
    return;
  }
  if(locale){
    msgsSinceFritino++;
    const mostraFritino = msgsSinceFritino>=3 && Math.random()<0.4 && locale.includes('kcal');
    if(mostraFritino){ msgsSinceFritino=0; setTimeout(()=>addBotMsg(locale+'\n\n🍟 Vuoi aggiungere un **Fritino da 5pz misti a 2,50€**?'),300); }
    else setTimeout(()=>addBotMsg(locale),300);
    bpLoading=false;
    return;
  }

  setTimeout(()=>addBotMsg(rispostaGenerica(norm(text))),300);
  bpLoading=false;
}

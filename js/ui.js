let ultimaPizzaMenzionata = null;
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
  // Normalizza "18 e 35" → "18:35", "19e5" → "19:05"
  t = t.replace(/(1[89]|2[01])\s*e\s*(\d{1,2})(?!\s*mezz)/g, (m,h,mn)=>h+':'+(mn.length===1?'0'+mn:mn));
  // Prova prima orario esatto o quasi (es. 19:40 → 19:45)
  const matchEsatto = t.match(/\b(1[89]|2[01])[:he]([0-5]\d)\b/);
  if(matchEsatto){
    const hh = parseInt(matchEsatto[1]), mm = parseInt(matchEsatto[2]);
    const minTot = hh*60+mm;
    let best=null, bestDiff=999;
    for(const s of ORARI_DISPONIBILI){
      const [sh,sm]=s.split(':').map(Number);
      const diff=Math.abs(sh*60+sm-minTot);
      if(diff<bestDiff){bestDiff=diff;best=s;}
    }
    if(best && bestDiff<=8) return best;
  }
  for(const o of ORARI_DISPONIBILI){
    const op = o.replace(':','');
    if(t.includes(o) || t.replace(/[:\s]/g,'').includes(op)) return o;
  }
  // Orari colloquiali tipo "7", "7 e mezza", "8 e un quarto", "20 e 30"
  const mappa = [
    [/\b6\s*e\s*mez/,'18:30'], [/\b6\s*e\s*trenta/,'18:30'], [/\b6\s*e\s*30\b/,'18:30'], [/\bsei\s*e\s*mez/i,'18:30'], [/\bsei\s*e\s*trenta/i,'18:30'], [/\bsei\s*e\s*30/i,'18:30'], [/\balle\s*6\s*e\s*mez/,'18:30'],
    [/\b6\s*e\s*un\s*quarto/,'18:45'], [/\balle\s*sei\s*e\s*mez/,'18:30'],
    [/\balle?\s*sei\b/,'18:30'],
    [/\b7\s*e\s*mez/,'19:30'], [/\b7\s*e\s*trenta/,'19:30'], [/\b7\s*e\s*30\b/,'19:30'], [/\bsette\s*e\s*mez/i,'19:30'], [/\bsette\s*e\s*trenta/i,'19:30'],
    [/\b7\s*e\s*un\s*quarto/,'19:15'], [/\balle?\s*sette\s*e\s*mez/,'19:30'],
    [/\balle?\s*sette\b/,'19:00'], [/\balle?\s*7\b/,'19:00'],
    [/\b8\s*e\s*mez/,'20:30'], [/\b8\s*e\s*trenta/,'20:30'], [/\b8\s*e\s*30\b/,'20:30'], [/\botto\s*e\s*mez/i,'20:30'], [/\botto\s*e\s*trenta/i,'20:30'],
    [/\b8\s*e\s*un\s*quarto/,'20:15'], [/\balle?\s*otto\s*e\s*mez/,'20:30'],
    [/\balle?\s*otto\b/,'20:00'], [/\balle?\s*8\b/,'20:00'],
    [/\b9\s*e\s*mez/,'21:30'], [/\b9\s*e\s*trenta/,'21:30'], [/\b9\s*e\s*30\b/,'21:30'], [/\bnove\s*e\s*mez/i,'21:30'], [/\bnove\s*e\s*trenta/i,'21:30'],
    [/\b9\s*e\s*un\s*quarto/,'21:15'], [/\balle?\s*nove\s*e\s*mez/,'21:30'],
    [/\balle?\s*nove\b/,'21:00'], [/\balle?\s*9\b/,'21:00'],
    [/\b18\s*e\s*mez/,'18:30'], [/\b19\s*e\s*mez/,'19:30'],
    [/\b20\s*e\s*mez/,'20:30'], [/\b21\s*e\s*mez/,'21:30'],
    [/\bper\s*le\s*19\b/,'19:00'], [/\bper\s*le\s*20\b/,'20:00'],
    [/\bper\s*le\s*21\b/,'21:00'], [/\bper\s*le\s*18\b/,'18:30'],
    [/\balle?\s*6\b/,'18:30'], [/\balle?\s*sei\b/i,'18:30'],
    [/\bverso\s*(?:le?)?\s*8\b/i,'20:00'], [/\bverso\s*(?:le?)?\s*7\b/i,'19:00'],
    [/\bverso\s*(?:le?)?\s*9\b/i,'21:00'], [/\bverso\s*(?:le?)?\s*6\b/i,'18:30'],
    [/^18$/, '18:30'], [/^19$/, '19:00'], [/^20$/, '20:00'], [/^21$/, '21:00'],
  ];
  for(const [re, orario] of mappa){
    if(re.test(t)) return orario;
  }
  return null;
}

function resetOrdine(){
  ordineAttivo = false;
  ordine = { nome:'', orario:'', pizze:[], note:'', telefono:'', frittini:[], _noteVariazioni:[] };
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
  const totPizze = ordine.pizze.reduce((s,p)=>s+p.prezzo*p.qty,0);
  const totFrit = (ordine.frittini||[]).reduce((s,f)=>s+f.prezzo*f.qty,0);
  const tot = totPizze + totFrit;
  msg += `\n💰 Totale stimato: **${fmtE(tot)}€**`;
  if(ordine._noteVariazioni && ordine._noteVariazioni.length){
    msg += '\n\n📌 *Richieste speciali:*\n'+ordine._noteVariazioni.join('\n');
  }
  if(ordine.note) msg += '\n📝 Note: '+ordine.note;
  return msg;
}

async function inviaOrdine(){
  const totPizze2 = ordine.pizze.reduce((s,p)=>s+p.prezzo*p.qty,0);
  const totFrit2 = (ordine.frittini||[]).reduce((s,f)=>s+f.prezzo*f.qty,0);
  const tot = totPizze2 + totFrit2;
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
        noteVariazioni: ordine._noteVariazioni||[]
      })
    });
    const d = await r.json();
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
    ordine.nome = input.trim();
    ordineStep = 'telefono';
    return 'Perfetto **'+ordine.nome+'**! 🐧\nE il tuo numero di telefono?';
  }

  if(ordineStep === 'telefono'){
    const numM = input.replace(/\s/g,'').match(/[0-9]{6,}/);
    if(!numM) return 'Non ho capito il numero 😅 Scrivi tipo 3401234567';
    ordine.telefono = numM[0];
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
    return `Orario **${ordine.orario}** ✅\n\nOra dimmi le pizze! Scrivi tipo:\n"2 margherite e 1 diavola"\noppure aggiungile una per volta 🍕`;
  }

  if(ordineStep === 'pizze'){
    // "basta" nello step pizze → vai avanti se ha almeno qualcosa
    if(['basta','ok basta','ho finito','fine','finito'].some(k=>norm(input.trim())===k) || norm(input.trim())==='basta'){
      if(ordine.pizze.length > 0 || (ordine.frittini && ordine.frittini.length > 0)){
        ordineStep = 'altra';
        // Torna al check allergeni
        return gestisciOrdine('basta');
      }
    }
    // ── FRITTI come voce separata ──
    const _frittoRe = /(?:una?\s+)?(?:porzione|porzioncina)\s+di\s+([\w\s]+?)(?:\s*,|\s*$)/i;
    const _frittoM = input.match(_frittoRe);
    if(_frittoM){
      const _nF = norm(_frittoM[1].trim());
      const _frittiDB = {'patate fritte':3.50,'patate':3.50,'patatine':3.50,'verdure pastellate':4.00,'verdure':4.00,'olive ascolane':6.00,'olive':6.00,'mozzarelline':6.00,'nuggets':6.00,'nuggets pollo':6.00,'crocchettine':6.00,'crocchettine patate':6.00,'anellini':3.50,'anellini di cipolla':3.50,'alette':5.50,'alette di pollo':5.50};
      const _kF = Object.keys(_frittiDB).find(k=>_nF.includes(norm(k))||norm(k).includes(_nF));
      if(_kF){
        ordine.frittini = ordine.frittini||[];
        ordine.frittini.push({ qty:1, tipo:_kF.charAt(0).toUpperCase()+_kF.slice(1)+' 10pz', prezzo:_frittiDB[_kF] });
        const _resto = input.replace(_frittoM[0],'').replace(/^[,\se]+/,'').trim();
        if(_resto) gestisciOrdine(_resto);
        return 'Aggiunto: 1x '+_kF.charAt(0).toUpperCase()+_kF.slice(1)+' 10pz — '+fmtE(_frittiDB[_kF])+'€ 🍟\nVuoi altro o scrivi **"basta"**.';
      }
    }
    // Split su virgola, newline, e anche 'e' tra pizze (es. '2 margherite e 1 diavola')
    // Frasi tipo "niente acciughe" o "occhio alle X" sono note allergie, non pizze
    if(/\b(?:niente|occhio alle?|attenzione alle?|allergi|intollerante)\b/i.test(input) || /\bsenza lattosio\b/i.test(input) && !trovaNomePizza(input)){
      ordine.note = (ordine.note ? ordine.note + ' — ' : '') + input.trim();
      ordineStep = 'altra';
      return null; // gestito come nota, non come pizza
    }
    let _inp = correggiTypo(input)
      .replace(/[\u2018\u2019\u201a\u201b]/g,"'")
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
    const righe = _inp.split(/,|\n|(?<=\S)\s+e\s+(?=\d)|(?<=\S)\s+(?=\d+\s+[a-z4-9])|(?<=\S)\s+e\s+(?=una?\s)|(?<=\S)\s+e\s+(?=battut)|(?<=\S)\s+e\s+(?=con\s)|(?<=\S)\s+e\s+(?=senza\s)|(?<=\S)\s+una\s+(?=[a-zA-Z])|(?<=\S)\s+un\s+(?=[a-zA-Z])/).filter(r=>r.trim());
    let trovate = [];
    for(let riga of righe){
      riga = riga.replace(/-e-/g,' e '); // ripristina nomi composti
      const rn = norm(riga);
      const numMatch = rn.match(/(\d+)/);
      const qty = numMatch ? parseInt(numMatch[1]) : 1;
      // Rimuovi numero e prova varie forme
      // Estrai "con X" come nota aggiunta
      const conMatchRaw = riga.match(/\bcon\s+(.+)$/i);
      let notaAggiunta = conMatchRaw ? conMatchRaw[1].trim() : null;
      // "con doppia pasta" non è un ingrediente aggiunto
      if(notaAggiunta && /^doppi[ao]?\s+pasta/i.test(notaAggiunta)) notaAggiunta = null;
      // "doppia mozzarella" senza "con" → trattala come nota
      if(!notaAggiunta){
        const doppiaIngMatch = riga.match(/\bdoppi[ao]?\s+(mozzarella|mozz|scamorza|formaggio)\b/i);
        if(doppiaIngMatch) notaAggiunta = 'doppia '+doppiaIngMatch[1];
      }
      // Estrai "senza X"
      const senzaMatch = riga.match(/\bsenza\s+([\w\s]+?)(?=\s*,|\s+e\s+[a-z]|\s+ma\s+|\s+però\s+|\s+con\s+|$)/i);
      const ingredienteSenza = senzaMatch ? senzaMatch[1].trim() : null;
      // Estrai "doppia X" o "X extra"
      const extraMatch = riga.match(/([\w\s]+?)\s+(?:extra|in più)(?=\s*,|$)/i);
      const ingredienteExtra = extraMatch ? extraMatch[1].trim() : null;
      const isBaby = /\bbaby\b|\bpoca fame\b/i.test(riga);
      const isDoppia = /\bdoppi[ao]?\s+pasta/i.test(riga);
      // Se la riga è "battuta [con X]" → formato per pizza precedente
      const isBattutaRiga = /^(?:una?\s+)?battut/i.test(riga.trim());
      const isBattuta = /\bbattut/i.test(riga);
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
      if(isBattutaRiga && trovate.length > 0){
        const ultima = trovate[trovate.length-1];
        if(!ultima.nome.includes('(battuta)')) ultima.nome += ' (battuta)';
        const conMatchB = riga.match(/\bcon\s+(.+?)(?:\s+(?:e|pi\u00f9)\s+|$)/i);
        if(conMatchB) ultima.nome += ' con '+conMatchB[1].trim();
        continue;
      }
      const rigaPulita = notaAggiunta ? riga.replace(/\bcon\s+.+$/i,'').trim() : riga;
      const rigaSenzaNum = rigaPulita.replace(/\d+/g,'').trim();
      // rigaSenzaNum PRIMA perché contiene solo il nome senza numero
      const tentativi = [
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
        
        // ── Variazioni prezzo ──
        let prezzoFinale = p.prezzo;
        const rigaLow = riga.toLowerCase();
        const isBattutaPiccola = /battut\w*\s+piccol/i.test(riga) || /piccol\w*\s+battut/i.test(riga);
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
          [/\bcroccant\w*/i, 'extra croccante'],
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
            if(!nomeDisplay.endsWith(' *')) nomeDisplay += ' *';
            ordine._noteVariazioni = ordine._noteVariazioni || [];
            ordine._noteVariazioni.push('* '+nomeDisplay.replace(' *','')+': senza '+ingredienteSenza+' (verificare)');
          }
        }
        
        trovate.push({ qty, nome: nomeDisplay, prezzo: prezzoFinale });
      } else {
        // Nessuna pizza trovata — controlla se è un formato per la pizza precedente
        const isBattutaStandalone = /^(?:una?\s+)?battut/i.test(riga.trim());
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
    ordineStep = 'frittini';
    return '🍟 Vuoi aggiungere un **fritino** (5pz a 2,50€)?\nMisti o uno solo tra: Olive ascolane · Mozzarelline · Nuggets · Crocchettine · Anellini\nOppure **"no"** per procedere.';
  }

  if(ordineStep === 'frittini'){
    const tF = norm(input.trim());
    if(['no','niente','nope','nah','basta','no grazie'].some(k=>tF.includes(k))){
      ordineStep = 'conferma';
      return fmtOrdine() + '\n\nÈ tutto corretto?';
    }
    // Quanti frittini?
    const nMatch = input.match(/(\d+)/);
    const qty = nMatch ? parseInt(nMatch[1]) : 1;
    // Tipo: misti o specifico
    let tipo = 'Misti';
    for(const [nome] of Object.entries(FRITTINI)){
      if(tF.includes(norm(nome))){ tipo = nome.charAt(0).toUpperCase()+nome.slice(1); break; }
    }
    // Aggiungi frittini all'ordine
    if(qty > 0){
      ordine.frittini = ordine.frittini || [];
      ordine.frittini.push({ qty, tipo, prezzo: 2.50 });
    }
    ordineStep = 'conferma';
    return (qty>0 ? `Perfetto! ${qty}x Fritino ${tipo} (5pz) — ${fmtE(qty*2.50)}€ aggiunto 🍟\n\n` : '') + fmtOrdine() + '\n\nÈ tutto corretto?';
    if(avvisiAllerg.length>0) rispOrdine = '⚠️ **Attenzione!**\n'+avvisiAllerg.join('\n')+'\n\nVuoi procedere lo stesso?\n\n'+rispOrdine;
    return rispOrdine;
  }

  if(ordineStep === 'conferma'){
    if(['si','sì','ok','confermo','giusto','esatto','corretto','vai'].some(k=>t.includes(k))){
      // Mostra pulsante conferma
      return 'MOSTRA_PULSANTE';
    }
    if(['no','sbagliato','annulla'].some(k=>t.includes(k))){
      resetOrdine();
      return 'Ordine annullato. Ricominciamo? Scrivi "voglio ordinare"! 🐧';
    }
    return 'Scrivi **"sì"** per confermare o **"no"** per annullare. 🐧';
  }

  return null;
}

function togglePanel(){
  panelOpen=!panelOpen;
  document.getElementById('bois-panel').classList.toggle('open',panelOpen);
  if(panelOpen&&bpHistory.length===0)
    setTimeout(()=>addBotMsg('Ciao! 🐧🍕 Sono il Pinguino di BoisPizza!\nDimmi che pizza ti va e ti dico calorie e prezzo — oppure chiedimi tutto sul menù!'),300);
}
function addBotMsg(text){
  const el=document.getElementById('bp-messages');
  const d=document.createElement('div'); d.className='bp-msg bot';
  d.innerHTML='<div class="bp-msg-av">🐧</div><div class="bp-bubble">'+fmt(text)+'</div>';
  el.appendChild(d); el.scrollTop=el.scrollHeight;
  bpHistory.push({role:'assistant',content:text});
  if(bpHistory.length>30) bpHistory.shift();
}
function addUserMsg(text){
  const el=document.getElementById('bp-messages');
  const d=document.createElement('div'); d.className='bp-msg user';
  d.innerHTML='<div class="bp-msg-av">👤</div><div class="bp-bubble">'+esc(text)+'</div>';
  el.appendChild(d); el.scrollTop=el.scrollHeight;
  bpHistory.push({role:'user',content:text});
  if(bpHistory.length>30) bpHistory.shift();
}
function showOrderButtons(){
  if(orderShown) return; orderShown=true;
  const el=document.getElementById('bp-messages');
  const d=document.createElement('div'); d.className='bp-msg bot';
  d.innerHTML='<div class="bp-msg-av">🐧</div><div class="bp-bubble"><div style="font-size:0.78rem;color:#9e7a5a;margin-bottom:8px;">Come vuoi contattarci? 👇</div><div class="order-btns"><a href="'+WA+'" target="_blank" class="btn-wa"><span>💬</span> WhatsApp (info)</a><a href="'+TEL+'" class="btn-tel"><span>📞</span> Chiama 0422 670631</a></div></div>';
  el.appendChild(d); el.scrollTop=el.scrollHeight;
}
function showTyping(){
  const el=document.getElementById('bp-messages');
  const d=document.createElement('div'); d.className='bp-msg bot'; d.id='bp-typing';
  d.innerHTML='<div class="bp-msg-av">🐧</div><div class="bp-bubble"><div class="bp-typing"><span></span><span></span><span></span></div></div>';
  el.appendChild(d); el.scrollTop=el.scrollHeight;
}
function removeTyping(){ const t=document.getElementById('bp-typing'); if(t) t.remove(); }

async function bpSend(){
  const inp=document.getElementById('bp-input');
  const text=inp.value.trim();
  if(!text||bpLoading) return;
  inp.value=''; addUserMsg(text);

  // ── FLUSSO ORDINE ATTIVO ──
  if(ordineAttivo){
    const rispOrdine = gestisciOrdine(text);
    if(rispOrdine === 'MOSTRA_PULSANTE'){
      setTimeout(()=>{ addBotMsg(fmtOrdine()); setTimeout(mostraPulsanteConferma, 400); }, 300);
    } else if(rispOrdine){
      setTimeout(()=>addBotMsg(rispOrdine), 300);
    }
    return;
  }

  // ── TRIGGER ORDINE ──
  const triggerOrdine = [
    'voglio ordinare','vorrei ordinare','posso ordinare',
    'fare un ordine','faccio un ordine','mando un ordine','faccio ordine',
    'voglio prenotare','vorrei prenotare',
    'mi servono le pizze','ho bisogno di pizze',
    'prendiamo le pizze','ordiniamo le pizze','ordiniamo stasera',
    'voglio prenotare','prenota per'
  ];
  if(triggerOrdine.some(k=>norm(text).includes(norm(k)))){
    ordineAttivo = true;
    // Prova a estrarre orario già dal messaggio iniziale
    const orarioGia = parseOrario(norm(text));
    if(orarioGia){
      ordine.orario = orarioGia;
      ordineStep = 'nome';
      setTimeout(()=>addBotMsg(`Perfetto! 🍕 Ho visto che vuoi venire alle **${orarioGia}**.\n\nCome ti chiami?`), 300);
    } else {
      ordineStep = 'nome';
      setTimeout(()=>addBotMsg('Perfetto! 🍕 Raccogliamo il tuo ordine.\n\nCome ti chiami?'), 300);
    }
    return;
  }

  const locale=rispostaLocale(text);
  if(locale==='ORDER'){
    addBotMsg('Vuoi ordinare? Scrivi **"voglio ordinare"** e ti guido passo passo! 🐧\nOppure contattaci direttamente:');
    setTimeout(showOrderButtons,300); return;
  }
  if(locale==='COSA_SAI_FARE'){
    setTimeout(()=>addBotMsg('🐧 **Cosa so fare:**\n\n🍕 Calorie e prezzo di ogni pizza\n➕ Calcolo modifiche (senza/con ingredienti)\n🥗 Pizze per carattere: leggera, pesante, piccante, elegante...\n🔍 Pizze con un ingrediente specifico\n⚠️ Allergeni per ogni pizza\n🌿 Ingredienti stagionali\n🍷 Abbinamenti tra ingredienti\n📞 Orari, indirizzo e contatti\n\nSono il tuo complice nei peccati di gola e il tuo personal trainer calorico 🔥🐧'),300);
    return;
  }
  if(locale){
    msgsSinceFritino++;
    const mostraFritino = msgsSinceFritino>=3 && Math.random()<0.4 && locale.includes('kcal');
    if(mostraFritino){ msgsSinceFritino=0; setTimeout(()=>addBotMsg(locale+'\n\n🍟 Vuoi aggiungere un **Fritino da 5pz misti a 2,50€**?'),300); }
    else setTimeout(()=>addBotMsg(locale),300);
    return;
  }

  setTimeout(()=>addBotMsg(rispostaGenerica(norm(text))),300);
  bpLoading=false;
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

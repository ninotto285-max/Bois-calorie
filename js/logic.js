
// ============================================================
// NUOVE FUNZIONALITA' — inserite nel router di rispostaLocale
// ============================================================

function checkNuoveFunzioni(t, input, pizzaContesto) {

  // ── DIETA ──
  if(['sono a dieta','sto a dieta','mangio leggero','poche calorie','voglio stare leggero'].some(k=>t.includes(norm(k)))){
    const leggere = Object.entries(PIZZE).filter(([n,p])=>p.kcal&&p.kcal<1000).sort((a,b)=>a[1].kcal-b[1].kcal).slice(0,4);
    let msg = 'Le pizze sotto 1000 kcal \uD83E\uDD57\n\n';
    for(const [nome,p] of leggere){
      const nd = nome.charAt(0).toUpperCase()+nome.slice(1);
      msg += '**'+nd+'** \u2014 '+p.kcal+' kcal \u00B7 '+fmtE(p.prezzo)+'\u20AC\n'+p.ing.join(', ')+'\n\n';
    }
    msg += '_Tutte con impasto a lenta maturazione \u2014 pi\u00F9 leggero e digeribile \uD83D\uDC27_';
    return msg;
  }

  // ── PER X PERSONE ──
  const mP = t.match(/(?:siamo|per|in)\s+(\d+)\s*(?:persone|persona|pax)?/);
  if(mP){
    const n = parseInt(mP[1]);
    if(n>=1 && n<=20){
      const nPizze = Math.ceil(n*0.8);
      return '\uD83D\uDC65 Per **'+n+' persone** consiglio **'+nPizze+' pizze** \uD83C\uDF55\n\nSpesa stimata: **'+Math.round(nPizze*7)+'\u20AC \u2013 '+Math.round(nPizze*11)+'\u20AC** circa\n\nVuoi suggerimenti su che pizze prendere? Dimmi i gusti del gruppo \uD83D\uDC27';
    }
  }

  // ── CALZONI ──
  if(['calzone','calzoni','avete calzoni'].some(k=>t.includes(norm(k))) && !trovaNomePizza(input)){
    const calzoni = Object.entries(PIZZE).filter(([n])=>n.startsWith('calzone'));
    let msg = '\uD83E\uDED3 **I nostri Calzoni** \u2014 chiusi e cotti al forno:\n\n';
    for(const [nome,p] of calzoni){
      const nd = nome.charAt(0).toUpperCase()+nome.slice(1);
      const desc = DESCRIZIONI_PIZZA[nome];
      msg += '**'+nd+'** \u2014 '+fmtE(p.prezzo)+'\u20AC\n'+p.ing.join(', ')+'\n'+(desc?'_'+desc[0]+'_':'')+'\n\n';
    }
    msg += '_Consiglio: un filo di olio evo a crudo sopra appena sfornato \uD83E\uDEB4_';
    return msg;
  }

  // ── PIZZA DEL GIORNO ──
  if(['pizza del giorno','consiglio dello chef','cosa consigli','sorprendimi','scegli tu','decidi tu'].some(k=>t.includes(norm(k)))){
    const tutteK = Object.keys(PIZZE);
    const nomePdg = tutteK[new Date().getDate() % tutteK.length];
    const p = PIZZE[nomePdg];
    const nd = nomePdg.charAt(0).toUpperCase()+nomePdg.slice(1);
    const tipo = p.tipo==='arrotolata'?' \uD83E\uDEB7':p.tipo==='calzone'?' \uD83E\uDED3':'';
    const desc = DESCRIZIONI_PIZZA[nomePdg];
    aggiornaContestoPizza(nomePdg);
    return '\u2B50 **Pizza del giorno: '+nd+'**'+tipo+'\n\n'+(desc?desc[0]+'\n'+desc[1]+'\n'+desc[2]+'\n\n':'')+
      'Ingredienti: '+p.ing.join(', ')+'\n\n**'+p.kcal+' kcal** \u00B7 **'+fmtE(p.prezzo)+'\u20AC**';
  }

  // ── STASERA SIETE APERTI? ──
  if(['siete aperti','siete chiusi','aperto stasera','aperto oggi','quando aprite','quando chiudete'].some(k=>t.includes(norm(k)))){
    const giorni = ['domenica','luned\u00EC','marted\u00EC','mercoled\u00EC','gioved\u00EC','venerd\u00EC','sabato'];
    const oggi = new Date().getDay();
    if(oggi===1) return '\uD83D\uDE34 Oggi \u00E8 **luned\u00EC** \u2014 siamo chiusi!\nTornate da **marted\u00EC a domenica** dalle **18:30 alle 21:30** \uD83D\uDC27';
    return '\u2705 S\u00EC! Oggi \u00E8 **'+giorni[oggi]+'** \u2014 siamo aperti \uD83C\uDF55\nOrario: **18:30 \u2013 21:30**\nPer ordinare: **0422 670631** \uD83D\uDC27';
  }

  return null;
}


// ============================================================
function aggiornaContestoPizza(nomePizza){
  if(nomePizza){
    ultimaPizzaMenzionata = nomePizza;
    contatorContestoPizza = 0;
  } else {
    contatorContestoPizza++;
    if(contatorContestoPizza > 10) ultimaPizzaMenzionata = null;
  }
}

// ============================================================
function correggiTypo(s){
  // Rimuovi prefissi comuni che confondono il router
  s = s.replace(/^(una pizza|un pizza|la pizza|il pizza|voglio la|voglio una|voglio un|vorrei la|vorrei una|vorrei un|dammi la|dammi una|dammi un|dimmi la|dimmi della|dimmi del|parlami di|info su|info sulla|info sul|una |un |la |il |lo )\s*/i, '');
  // Correzioni typo tastiera mobile comuni
  return s
    .replace(/\bcosq\b/gi,'cosa')
    .replace(/\bcsoa\b/gi,'cosa')
    .replace(/\bcoas\b/gi,'cosa')
    .replace(/\bche\b/gi,'che')
    .replace(/\bpotrie\b/gi,'potrei')
    .replace(/\baggiungerci\b/gi,'aggiungerci')
    .replace(/\baggiungervi\b/gi,'aggiungerci')
    .replace(/\bahgiungerci\b/gi,'aggiungerci')
    .replace(/\bahgiungere\b/gi,'aggiungere')
    .replace(/\baggingerci\b/gi,'aggiungerci')
    .replace(/\baggiongerci\b/gi,'aggiungerci')
    .replace(/\bingredientl\b/gi,'ingredienti')
    .replace(/\bingredietni\b/gi,'ingredienti')
    .replace(/\bcalroie\b/gi,'calorie')
    .replace(/\bcalorei\b/gi,'calorie')
    .replace(/\ballergni\b/gi,'allergeni')
    .replace(/\ballergein\b/gi,'allergeni')
    .replace(/\bprzzo\b/gi,'prezzo')
    .replace(/\bprezoz\b/gi,'prezzo')
    .replace(/\borgari\b/gi,'orari')
    .replace(/\borrai\b/gi,'orari')
    .replace(/\bbufla\b/gi,'bufala')
    .replace(/\bbuffala\b/gi,'bufala')
    .replace(/\bmozzarela\b/gi,'mozzarella')
    .replace(/\bsalsicia\b/gi,'salsiccia')
    .replace(/\bvaltelina\b/gi,'valtellina')
    .replace(/\bsfizziosa\b/gi,'sfiziosa')
    .replace(/\bsfizzio\w*/gi,'sfiziosa');
}

function rispostaLocale(input){
  // ── PRIORITÀ: "la pizza è pesante?" → impasto, NON lista pizze ──
  const _tRaw = norm(input);
  if(_tRaw.includes('la pizza') && (_tRaw.includes('pesant') || _tRaw.includes('gonfi') || _tRaw.includes('appesant'))){
    return 'Il nostro impasto matura almeno 48 ore con lievito madre e biga — meno lievito, più tempo, più digeribilità. È il contrario della pizza industriale che gonfia. Ti puoi fidare 🐧';
  }
  input = correggiTypo(input); // correggi typo prima di tutto
  const t = norm(input);
  const tSecco = t.trim();

  // ── INSULTI — riconosce parolacce, risponde con stile ──
  if(contieneInsulto(t)){
    // Cerca se c'è anche una pizza nel messaggio (es. "una margherita stronzo")
    const pizzaNellInsulto = trovaNomePizza(input);
    if(pizzaNellInsulto){
      const p = PIZZE[pizzaNellInsulto];
      const nd = pizzaNellInsulto.charAt(0).toUpperCase()+pizzaNellInsulto.slice(1);
      aggiornaContestoPizza(pizzaNellInsulto);
      const commento = rispostaInsulto();
      return commento + '\n\nComunque... **'+nd+'** 🍕 · '+p.kcal+' kcal · '+fmtE(p.prezzo)+'€\nIngredienti: '+p.ing.join(', ');
    }
    // Solo insulto, nessuna pizza
    return rispostaInsulto();
  }

  // ── CURIOSITA' ──
  if(['curiosita','curiosità','🐧 curiosità','curiosita pinguino','dimmi qualcosa'].some(k=>t.includes(norm(k)))||t.trim()==='curiosita'){
    return '🐧 ' + getCuriosita();
  }

  // Cosa sai fare — risposta locale + descrizione AI
  if(['cosa sai fare','cosa puoi fare','a cosa servi','come funzioni','come usi','aiuto','help','funzioni'].some(k=>t.includes(norm(k))))
    return 'COSA_SAI_FARE';

  // Ordine/contatti
  if(['ordina','ordinare','prenotare','come ordino','voglio ordinare','posso ordinare','contatti','chiamare'].some(k=>t.includes(norm(k)))) return 'ORDER';
  // Orari
  if(['orari','aperto','chiuso','quando aprite','quando chiudete','lunedi','lunedi chiuso'].some(k=>t.includes(norm(k))))
    return 'Aperti **martedì-domenica 18:30–21:30** 🕐\nIl **lunedì siamo chiusi**!';
  // Indirizzo
  if(['dove siete','indirizzo','via principale','casier','dove si trova','come arrivo'].some(k=>t.includes(norm(k))))
    return '📍 **Via Principale 113, Casier (TV)**';
  // Telefono
  if(['telefono','numero','chiamate','contatto telefon'].some(k=>t.includes(norm(k))))
    return '📞 Prenotazioni: **0422 670631**\n💬 WhatsApp info: **340 5327257** (solo info, non si prenota via WA)';
  // Menù completo
  if(['menu completo','tutto il menu','tutte le pizze','lista pizze','lista completa','elenca'].some(k=>t.includes(norm(k)))){
    let msg='🍕 **Menù BoisPizza**\n\n';
    for(const [nome,p] of Object.entries(PIZZE)){
      const nd=nome.charAt(0).toUpperCase()+nome.slice(1);
      const ti=p.tipo==='arrotolata'?' 🥙':p.tipo==='calzone'?' 🫓':'';
      msg+='**'+nd+'**'+ti+' — '+p.kcal+' kcal · '+fmtE(p.prezzo)+'€\n';
    }
    return msg;
  }
  // Abbinamenti — "cosa ci sta bene con X" / "cosa aggiungo" / "cosa potrei aggiungere"
  const chiedeAbbinamento = ['cosa ci sta','cosa abbino','cosa metto','ci sta bene','si abbina','abbinamento','cosa ci metto','cosa ci va','ci va bene','cosa aggiung','potrei aggiung','cosa potrei','posso aggiungere','cosa aggiungo','aggiungerei','cosa metterci','cosa metteri','cosa metteresti','consiglia aggiunta','suggerisci aggiunta'].some(k=>t.includes(norm(k)));
  if(chiedeAbbinamento){
    // Cerca ingrediente o pizza nel testo
    let ingTarget = null;
    for(const [a,c] of Object.entries(ING_ALIAS).sort((x,y)=>y[0].length-x[0].length))
      if(t.includes(norm(a))){ ingTarget=c; break; }
    if(!ingTarget)
      for(const n of Object.keys(ING).sort((a,b)=>b.length-a.length))
        if(t.includes(norm(n))){ ingTarget=n; break; }

    if(ingTarget){
      const abbinamenti = suggerisciAbbinamenti(ingTarget);
      if(abbinamenti && abbinamenti.length){
        return 'Con **'+ingTarget+'** ci stanno bene 🍕\n'+abbinamenti.map(a=>'• '+a).join('\n');
      }
    }
    // Cerca pizza nel testo
    const pizzaAbb = trovaNomePizza(input);
    if(pizzaAbb){
      const p = PIZZE[pizzaAbb];
      const nd = pizzaAbb.charAt(0).toUpperCase()+pizzaAbb.slice(1);
      // suggerisci aggiunte in base agli ingredienti principali
      let suggeriti = [];
      for(const ing of p.ing){
        const canon = trovaNomeIng(ing)||ing;
        const abb = suggerisciAbbinamenti(canon);
        if(abb) abb.forEach(a=>{ if(!p.ing.includes(a)&&!suggeriti.includes(a)) suggeriti.push(a); });
      }
      suggeriti = suggeriti.slice(0,4);
      if(suggeriti.length)
        return 'Sulla **'+nd+'** ci starebbe bene 🍕\n'+suggeriti.map(a=>'• '+a+(ING[a]?' (+'+fmtE(ING[a].prezzo)+'€)':'')).join('\n');
    }
  }

  // Stagionalità — controlla se ingrediente richiesto è disponibile
  const ingRichiesto = trovaNomeIng(input);
  if(ingRichiesto && ING[ingRichiesto] && ING[ingRichiesto].stagione){
    if(!isDisponibile(ingRichiesto)){
      const mesi = meseStagione(ingRichiesto);
      return '**'+ingRichiesto.charAt(0).toUpperCase()+ingRichiesto.slice(1)+'** non è disponibile in questo periodo 🌿\nTorna disponibile a '+mesi+'!';
    }
  }

  // Allergeni — solo se richiesti esplicitamente
  const chiedeAllergeni = ['allergen','allergico','allergica','intollerante','intolleranza','celiaco','celiachia'].some(k=>t.includes(norm(k)));
  if(chiedeAllergeni){
    if(['senza glutine','celiaco','celiaci','celiachia','gluten free'].some(k=>t.includes(norm(k))))
      return 'No, non facciamo senza glutine — lavoriamo in un ambiente dove il glutine è ovunque, quindi non possiamo garantire l\'assenza di contaminazioni. Chi è celiaco deve evitarci 🙏 Per tutto il resto siamo qui! 🐧';

    // Allergeni di una pizza specifica
    const pizzaA = trovaNomePizza(input) || ultimaPizzaMenzionata;
    if(pizzaA){
      ultimaPizzaMenzionata = pizzaA;
      const pizza = PIZZE[pizzaA];
      const nd = pizzaA.charAt(0).toUpperCase()+pizzaA.slice(1);
      const allergeni = calcolaAllergeni(pizza.ing);
      return '**'+nd+'** — Allergeni presenti ⚠️\n'+allergeni.map(a=>'• '+a).join('\n')+'\n\n⚠️ Lavoriamo in un ambiente dove tutti gli allergeni possono essere presenti per contaminazione crociata.\nPer allergie gravi contattaci al **0422 670631** 🐧';
    }

    // "Sono allergico a X cosa posso mangiare?"
    let allergeneRicercato = null;
    const allergeniNoti = ['latte','lattosio','uova','uovo','pesce','glutine','frutta a guscio','solfiti','soia','senape','sedano','sesamo','arachidi'];
    for(const a of allergeniNoti){
      if(t.includes(norm(a))){ allergeneRicercato = a === 'lattosio' ? 'latte' : a === 'uovo' ? 'uova' : a; break; }
    }
    if(allergeneRicercato){
      const pizzeSicure = [];
      for(const [nome,p] of Object.entries(PIZZE)){
        const allergeni = calcolaAllergeni(p.ing);
        if(!allergeni.includes(allergeneRicercato)){
          const nd = nome.charAt(0).toUpperCase()+nome.slice(1);
          pizzeSicure.push('**'+nd+'** — '+fmtE(p.prezzo)+'€');
        }
      }
      return '🍕 Pizze **senza '+allergeneRicercato+'**\n\n'+pizzeSicure.join('\n')+'\n\n⚠️ Attenzione: lavoriamo in un ambiente dove tutti gli allergeni possono essere presenti per contaminazione crociata. Per allergie gravi contattaci al **0422 670631** prima di ordinare 🐧';
    }

    return 'Dimmi quale pizza vuoi controllare e ti dico tutti gli allergeni! ⚠️\nOppure dimmi a cosa sei allergico e ti mostro le pizze compatibili 🐧';
  }

  // Senza glutine — risposta fissa, mai AI
  if(['senza glutine','glutine','celiaco','celiaci','celiachia','gluten free','glutenfree','intolleranza glutine'].some(k=>t.includes(norm(k))))
    return 'No, non facciamo senza glutine — lavoriamo in un ambiente dove il glutine è ovunque, quindi non possiamo garantire l\'assenza di contaminazioni. Chi è celiaco deve evitarci 🙏 Per tutto il resto siamo qui! 🐧';

  // "Che pizze hai con X" — cerca per ingrediente o categoria
  const chiedePizzeConIng = ['che pizze hai con','pizze con','quali pizze con','pizze che hanno','pizze col','pizze coi','pizze colla','pizze alla','hai con','avete con','con il','con la','col','con i','hai qualcosa con'].some(k=>t.includes(norm(k)));
  // Eccezione: "la pizza è pesante/gonfia" → non è una richiesta di ingredienti
  const _domandaImpasto = (t.includes('la pizza') || t.startsWith('pizza')) && 
    ['pesante','gonfia','pesant','digeribile','leggera la pizza'].some(k=>t.includes(k));
  if(!_domandaImpasto && (chiedePizzeConIng || t.includes('con ') || t.includes('col '))){
    // 1. Controlla se è un ingrediente NON_ABBIAMO
    const nonAbbiamo = NON_ABBIAMO.find(i=>t.includes(norm(i)));
    if(nonAbbiamo)
      return 'Non abbiamo **'+nonAbbiamo+'** nel menù fisso 🐧\nMa chiamaci al **0422 670631** — a volte abbiamo ingredienti speciali fuori menù!';

    // 2. Cerca categoria (pesce, salumi, formaggi...)
    let ingDaCercare = [];
    for(const [cat, ings] of Object.entries(CATEGORIE)){
      if(t.includes(norm(cat))){ ingDaCercare = ings; break; }
    }

    // 3. Se no categoria, cerca ingrediente diretto
    if(!ingDaCercare.length){
      let ingCercato = null;
      for(const [a,c] of Object.entries(ING_ALIAS).sort((x,y)=>y[0].length-x[0].length))
        if(t.includes(norm(a))){ ingCercato=c; break; }
      if(!ingCercato)
        for(const n of Object.keys(ING).sort((a,b)=>b.length-a.length))
          if(t.includes(norm(n))){ ingCercato=n; break; }
      if(ingCercato) ingDaCercare=[ingCercato];
    }

    if(ingDaCercare.length && chiedePizzeConIng){
      const risultati=[];
      for(const [nome,p] of Object.entries(PIZZE)){
        const haIng = ingDaCercare.some(ic=>p.ing.some(i=>norm(i)===norm(ic)||trovaNomeIng(i)===ic));
        if(haIng){
          const nd=nome.charAt(0).toUpperCase()+nome.slice(1);
          risultati.push('**'+nd+'** — '+p.ing.join(', ')+'\n'+p.kcal+' kcal · '+fmtE(p.prezzo)+'€');
        }
      }
      const label = ingDaCercare.length>1 ? ingDaCercare.join(' o ') : ingDaCercare[0];
      if(risultati.length)
        return 'Pizze con **'+label+'** 🍕\n\n'+risultati.join('\n\n');
      else{
        // Ingrediente esiste nel database ma non in nessuna pizza → propone custom
        const tuttInING = ingDaCercare.every(i=>ING[i]||Object.values(ING_ALIAS).includes(i));
        if(tuttInING)
          return rispostaIngredentiLiberi('pizza con '+ingDaCercare.join(' e '));
        return 'Non abbiamo **'+label+'** nel menù fisso 🐧\nMa chiamaci al **0422 670631** — a volte abbiamo ingredienti speciali fuori menù!';
      }
    }
  } // end chiedePizzeConIng

  // Risposta impasto se domanda diretta
  if(_domandaImpasto && ['pesante','gonfia'].some(k=>t.includes(k))){
    return 'Il nostro impasto matura almeno 48 ore con lievito madre e biga — meno lievito, più tempo, più digeribilità. È il contrario della pizza industriale che gonfia. Ti puoi fidare 🐧';
  }

  // Fritti — solo keyword specifiche fritti, mai se si parla di pizza — "chimica", "potente", "sugosa" ecc. ──
  // Se il messaggio è corto e sembra un vibe/tag, cerca nel TAG_ALIAS
  // "la pizza è pesante/gonfia?" → risposta impasto, non lista pizze
  if((t.includes('la pizza') || t.includes('pizza e')) && 
     ['pesante','gonfia','pesant','appesantisce'].some(k=>t.includes(k))){
    return 'Il nostro impasto matura almeno 48 ore con lievito madre e biga — meno lievito, più tempo, più digeribilità. È il contrario della pizza industriale che gonfia. Ti puoi fidare 🐧';
  }

  const parole = tSecco.split(/\s+/).length;
  if(parole <= 3 && !trovaNomePizza(input)){
    let tagDiretto = null;
    for(const [alias,tag] of Object.entries(TAG_ALIAS).sort((a,b)=>b[0].length-a[0].length))
      if(tSecco===norm(alias)||tSecco.includes(norm(alias))){ tagDiretto=tag; break; }

    // Vibe extra non nel TAG_ALIAS
    const vibeExtra = {
      'chimica':'potente','sugosa':'goduriosa','succosa':'goduriosa',
      'cremosa':'formaggiosa','filante':'formaggiosa','caseosa':'formaggiosa',
      'devastante':'pesante','violenta':'potente','cattiva':'potente',
      'tranquilla':'leggera','delicata':'leggera','sana':'leggera',
      'estiva':'fresca','invernale':'rustica','autunnale':'rustica',
      'gourmet':'elegante','raffinata':'elegante','di livello':'elegante',
      'ignorante':'goduriosa','bestiale':'pesante','esagerata':'pesante',
      'affumicata':'fume','col fumo':'fume',
    };
    if(!tagDiretto) tagDiretto = vibeExtra[tSecco] || vibeExtra[Object.keys(vibeExtra).find(k=>tSecco.includes(k))];

    if(tagDiretto){
      const risultati=[];
      for(const [nome,p] of Object.entries(PIZZE)){
        if(p.tags && p.tags.includes(tagDiretto)){
          const nd=nome.charAt(0).toUpperCase()+nome.slice(1);
          const tipo=p.tipo==='arrotolata'?' 🥙':p.tipo==='calzone'?' 🫓':'';
          risultati.push('**'+nd+'**'+tipo+' — '+p.ing.join(', ')+'\n'+p.kcal+' kcal · '+fmtE(p.prezzo)+'€');
        }
      }
      if(risultati.length){
        const label={'leggera':'leggere','pesante':'pesanti','potente':'potenti e saporite','piccante':'piccanti','goduriosa':'goduriose','elegante':'eleganti','dolcesalato':'dolce-salato','vegetariana':'vegetariane','fresca':'fresche','formaggiosa':'formaggiose','tartufo':'al tartufo','carnivora':'con la carne','mare':'di mare','fume':'affumicate','rustica':'rustiche'}[tagDiretto]||tagDiretto;
        return 'Pizze **'+label+'** 🍕\n\n'+risultati.join('\n\n');
      }
    }
  } // end chiedePizzeConIng

  // Risposta impasto se domanda diretta
  if(_domandaImpasto && ['pesante','gonfia'].some(k=>t.includes(k))){
    return 'Il nostro impasto matura almeno 48 ore con lievito madre e biga — meno lievito, più tempo, più digeribilità. È il contrario della pizza industriale che gonfia. Ti puoi fidare 🐧';
  }

  // Fritti — solo keyword specifiche fritti, mai se si parla di pizza
  const keyFritti = ['fritti','frittico','fritino','olive ascolane','mozzarelline','nuggets','crocchette','anellini di cipolla'];
  if(keyFritti.some(k=>t.includes(norm(k))) && !trovaNomePizza(input))
    return rispostaFritti();
  // Pizza leggera
  if(['pizza leggera','leggera','poche calorie','meno calorie','dieta','light','meno calorica'].some(k=>t.includes(norm(k))))
    return rispostaLeggera();
  // Prezzi aggiunte
  if(['quanto costa aggiungere','prezzo aggiunta','costo aggiunta','prezzi aggiunte','lista aggiunte'].some(k=>t.includes(norm(k))))
    return rispostaAggiunte();

  // Ricerca per TAG — "voglio una pizza ignorante / leggera / tartufo..."
  // Solo se non è già stata trovata una pizza per nome
  if(!trovaNomePizza(input)){
    let tagCercato = null;
    // cerca alias tag (più lungo prima)
    for(const [alias,tag] of Object.entries(TAG_ALIAS).sort((a,b)=>b[0].length-a[0].length))
      if(t.includes(norm(alias))){ tagCercato=tag; break; }

    if(tagCercato){
      const risultati=[];
      for(const [nome,p] of Object.entries(PIZZE)){
        if(p.tags && p.tags.includes(tagCercato)){
          const nd=nome.charAt(0).toUpperCase()+nome.slice(1);
          const tipo=p.tipo==='arrotolata'?' 🥙':p.tipo==='calzone'?' 🫓':'';
          risultati.push('**'+nd+'**'+tipo+' — '+p.ing.join(', ')+'\n'+p.kcal+' kcal · '+fmtE(p.prezzo)+'€');
        }
      }
      if(risultati.length){
        const label={
          'leggera':'leggere','pesante':'pesanti','potente':'potenti e saporite',
          'piccante':'piccanti','goduriosa':'goduriose','elegante':'eleganti',
          'dolcesalato':'dolce-salato','vegetariana':'vegetariane','fresca':'fresche ed estive',
          'formaggiosa':'formaggiose','tartufo':'al tartufo','carnivora':'con la carne',
          'mare':'di mare','fume':'affumicate','bbq':'bbq','rustica':'rustiche',
          'classica':'classiche','stagionata':'con salumi stagionati',
        }[tagCercato]||tagCercato;
        return 'Pizze **'+label+'** 🍕\n\n'+risultati.join('\n\n');
      }
    }
  }

  // Consigli pizza — risposta locale usando il database, mai AI
  const chiedeConsiglio = ['consig','quale prendo','cosa prendo','cosa ordino','quale ordino','quale scegli','cosa scegli','quale mi dai','suggeris','quale pizza','cosa mangio','cosa mi dai','non so cosa','non so quale'].some(k=>t.includes(norm(k)));
  if(chiedeConsiglio){
    // Cerca preferenze nel testo
    const vuolePiccante  = ['piccante','diavola','speziata'].some(k=>t.includes(norm(k)));
    const vuoleLeggera   = ['leggera','light','dieta','poche calorie','meno calorie'].some(k=>t.includes(norm(k)));
    const vuoleCarne     = ['carne','salumi','salume','salsicc'].some(k=>t.includes(norm(k)));
    const vuoleVerdure   = ['verdure','vegetarian','vegeta'].some(k=>t.includes(norm(k)));
    const vuoleFormaggi  = ['formag','cheese'].some(k=>t.includes(norm(k)));
    const vuoleMare      = ['mare','pesce','tonno','acciughe'].some(k=>t.includes(norm(k)));

    let scelta, motivo;
    if(vuolePiccante)     { scelta='diavola';    motivo='se ti piace il piccante'; }
    else if(vuoleLeggera) { scelta='estate';     motivo='se vuoi stare leggero/a'; }
    else if(vuoleCarne)   { scelta='boscaiola';  motivo='se ami i salumi'; }
    else if(vuoleVerdure) { scelta='verdure';    motivo='se preferisci le verdure'; }
    else if(vuoleFormaggi){ scelta='formaggi';   motivo='se sei un amante dei formaggi'; }
    else if(vuoleMare)    { scelta='leone';      motivo='se ami i sapori di mare'; }
    else {
      // Consiglio casuale tra le più amate
      const top=['boscaiola','ufo','capricciosa sbagliata','ava','repubblica','tartufata','pazza'];
      scelta = top[Math.floor(Math.random()*top.length)];
      motivo = 'tra le più amate';
    }
    const p = PIZZE[scelta];
    const nd = scelta.charAt(0).toUpperCase()+scelta.slice(1);
    aggiornaContestoPizza(scelta);
    return 'Ti consiglio la **'+nd+'** 🍕 ('+motivo+')\nIngredienti: '+p.ing.join(', ')+'\n\n**'+p.kcal+' kcal** · **'+fmtE(p.prezzo)+'€**';
  }

  // Cerca prima combo ingredienti (es. "salsiccia e friarielli")
  // Solo se ci sono almeno 2 ingredienti nel testo e nessun nome pizza esatto
  const nomePizzaDiretto = trovaNomePizza(input);
  let nomePizza = nomePizzaDiretto;

  if(!nomePizza){
    // Cerca ingredienti nel testo
    const ingNelTesto = [];
    for(const [a,c] of Object.entries(ING_ALIAS).sort((x,y)=>y[0].length-x[0].length))
      if(t.includes(norm(a))&&!ingNelTesto.includes(c)) ingNelTesto.push(c);
    for(const n of Object.keys(ING).sort((a,b)=>b.length-a.length))
      if(t.includes(norm(n))&&!ingNelTesto.includes(n)) ingNelTesto.push(n);

    if(ingNelTesto.length >= 2){
      // Cerca pizza che contiene TUTTI gli ingredienti trovati
      let bestMatch = null, bestScore = 0;
      for(const [nome,p] of Object.entries(PIZZE)){
        const pn = p.ing.map(i=>norm(i));
        const comuni = ingNelTesto.filter(i=>pn.includes(norm(i))||pn.some(pi=>trovaNomeIng(pi)===i));
        if(comuni.length === ingNelTesto.length && comuni.length > bestScore){
          bestScore = comuni.length; bestMatch = nome;
        }
      }
      if(bestMatch) nomePizza = bestMatch;
    }
  }

  const pizzaContesto = nomePizza || ultimaPizzaMenzionata;
  aggiornaContestoPizza(nomePizza);

  // ── GESTIONE "NO" / "SÌ" IN CONTESTO ──
  if(['no','nope','nah','nein','noo','nooo'].includes(tSecco)){
    if(pizzaContesto){
      const nd = pizzaContesto.charAt(0).toUpperCase()+pizzaContesto.slice(1);
      return 'Ok, niente **'+nd+'**! Dimmi che vibe cerchi — piccante, leggera, formaggiosa, rustica... o dimmi un ingrediente che ti piace 🐧';
    }
    return 'Ok! Dimmi che tipo di pizza cerchi — piccante, leggera, con la carne, col formaggio... 🐧';
  }
  if(['si','sì','ok','va bene','perfetto','esatto','giusto','certo','dai','andiamo','ci sta','ovvio','certamente','yep','yes'].includes(tSecco)||
     ['ok mi sta bene','mi sta bene','mi va bene','la prendo','perfetto ci sta','ok ci sta','mi piace'].some(k=>tSecco.includes(norm(k)))){
    // Se c'è una suggestione recente
    if(ultimaSuggestione){
      const s = ultimaSuggestione;
      ultimaSuggestione = null;
      if(s.esistente && PIZZE[s.esistente]){
        const p = PIZZE[s.esistente];
        const nd = s.esistente.charAt(0).toUpperCase()+s.esistente.slice(1);
        ultimaPizzaMenzionata = s.esistente;
        contatorContestoPizza = 0;
        return 'Perfetto! È già la nostra **'+nd+'** 🍕\n'+p.ing.join(', ')+'\n\n**'+p.kcal+' kcal** · **'+fmtE(p.prezzo)+'€**\n\nVuoi ordinare? 🐧';
      }
      ultimaPizzaMenzionata = null;
      return 'Perfetto! 🍕 **'+s.nome+'**\nBase: pomodoro, mozzarella + '+s.ings.join(', ')+'\n\n**'+s.kcal+' kcal** · **'+fmtE(s.prezzo)+'€**\n\nVuoi ordinare? 🐧';
    }
    if(pizzaContesto){
      const nd = pizzaContesto.charAt(0).toUpperCase()+pizzaContesto.slice(1);
      ultimaPizzaMenzionata = pizzaContesto;
      contatorContestoPizza = 0;
      return 'Ottima scelta! 🍕 La **'+nd+'** è una sicurezza. Vuoi aggiungerci qualcosa o vuoi ordinare?';
    }
    return 'Perfetto! 🐧 Dimmi di quale pizza vuoi sapere di più!';
  }
  // Messaggi corti/vaghi in contesto pizza — "che?", "e?", "tipo?", "cioè?"
  if(pizzaContesto && ['che','e','tipo','cioe','nel senso','ovvero','cioè','eh','ah','ok e'].some(k=>t===norm(k)||t.startsWith(norm(k)+' '))){
    const pizza = PIZZE[pizzaContesto];
    const nd = pizzaContesto.charAt(0).toUpperCase()+pizzaContesto.slice(1);
    return '(parlando della **'+nd+'**) 🍕\nIngredienti: '+pizza.ing.join(', ')+'\n\n**'+pizza.kcal+' kcal** · **'+fmtE(pizza.prezzo)+'€**';
  }


  if(pizzaContesto){
    const pizza = PIZZE[pizzaContesto];
    const nd = pizzaContesto.charAt(0).toUpperCase()+pizzaContesto.slice(1);
    const tipo = pizza.tipo==='arrotolata'?' 🥙 arrotolata':pizza.tipo==='calzone'?' 🫓 calzone':'';
    const prefisso = (!nomePizza && ultimaPizzaMenzionata) ? '(parlando della **'+nd+'**)\n' : '';

    // Domanda ingredienti → risposta locale, mai AI
    const chiedeIng = ['ingredient','cosa ha','cosa c e','cosa ce','com e fatta','come e fatta','cosa mette','cosa ci mette','cosa contiene','contiene','ha dentro','dentro cosa','cosa dentro','descrivi','dimmi la','parlami','raccontami'].some(k=>t.includes(norm(k)));
    if(chiedeIng)
      return prefisso+'**'+nd+'**'+tipo+' 🍕\nIngredienti: '+pizza.ing.join(', ')+'\n\n**'+pizza.kcal+' kcal** · **'+fmtE(pizza.prezzo)+'€**';

    // Domanda solo prezzo
    const chiedePrezzo = ['quanto costa','quanto viene','prezzo','costa quanto'].some(k=>t.includes(norm(k))) && !['calorie','kcal'].some(k=>t.includes(norm(k)));
    if(chiedePrezzo)
      return prefisso+'**'+nd+'** costa **'+fmtE(pizza.prezzo)+'€** 🍕';

    // Domanda solo calorie
    const chiedeKcal = ['calorie','kcal','quante cal','fa ingrassare','calorica'].some(k=>t.includes(norm(k))) && !['prezzo','costa'].some(k=>t.includes(norm(k)));
    if(chiedeKcal)
      return prefisso+'**'+nd+'** ha **'+pizza.kcal+' kcal** 🍕';

    // Domanda allergeni sulla pizza in contesto
    const chiedeAllergeniPizza = ['allergen','allergico','allergica','intollerante'].some(k=>t.includes(norm(k)));
    if(chiedeAllergeniPizza){
      const allergeni = calcolaAllergeni(pizza.ing);
      return prefisso+'**'+nd+'** — Allergeni presenti ⚠️\n'+allergeni.map(a=>'• '+a).join('\n')+'\n\n⚠️ Lavoriamo in un ambiente dove tutti gli allergeni possono essere presenti per contaminazione crociata.\nPer allergie gravi contattaci al **0422 670631** 🐧';
    }

    // Senape di Digione — risposta specifica
    if(['senape','digione','senape di digione'].some(k=>t.includes(norm(k))))
      return getRispostaSenape();

    // Abbinamenti in contesto pizza — usa prima la versione discorsiva
    const chiedeAbbContesto = ['cosa potrei aggiungere','cosa potrei aggiungerci','cosa potrei aggiungervi','cosa aggiungo','cosa aggiungerei','cosa ci metto','cosa ci aggiungo','cosa metterci','aggiungere qualcosa','posso aggiungere','cosa aggiungerci','potrei aggiungere','cosa ci sta','cosa ci puo stare','cosa ci può stare','ci può stare','ci puo stare','abbinamento','si abbina','ci sta bene','cosa abbino','cosa ci starebbe','cosa metterci sopra','cosa ci va sopra'].some(k=>t.includes(norm(k)));
    if(chiedeAbbContesto){
      // Prima prova la risposta discorsiva specifica per questa pizza
      const rispDisc = getRispostaAbbinamento(pizzaContesto);
      if(rispDisc){
        // Estrai gli ingredienti suggeriti dalla risposta per calcolo prezzo
        // Cerca ingredienti noti nel testo della risposta
        const ingSuggeriti = [];
        for(const nomeIng of Object.keys(ING)){
          if(norm(rispDisc).includes(norm(nomeIng)) && !PIZZE[pizzaContesto].ing.map(i=>norm(i)).includes(norm(nomeIng))){
            ingSuggeriti.push(nomeIng);
          }
        }
        if(ingSuggeriti.length > 0){
          const { prezzo, kcal } = calcolaPizzaCustom([...PIZZE[pizzaContesto].ing, ...ingSuggeriti]);
          ultimaSuggestione = { nome: ingSuggeriti.map(i=>i.charAt(0).toUpperCase()+i.slice(1)).join(' e '), prezzo, kcal, ings: ingSuggeriti, base: pizzaContesto };
        }
        const pref = nomePizza ? '' : '(parlando della **'+pizzaContesto.charAt(0).toUpperCase()+pizzaContesto.slice(1)+'**)\n\n';
        return pref + rispDisc + (ingSuggeriti.length ? '\n\n💡 Se ti convince, scrivi "ok mi sta bene" e ti dico il prezzo!' : '');
      }
      let suggeriti = [];
      for(const ing of pizza.ing){
        const canon = trovaNomeIng(ing)||ing;
        const abb = suggerisciAbbinamenti(canon);
        if(abb) abb.forEach(a=>{ if(!pizza.ing.map(i=>norm(i)).includes(norm(a))&&!suggeriti.includes(a)) suggeriti.push(a); });
      }
      suggeriti = suggeriti.filter(a=>isDisponibile(trovaNomeIng(a)||a)).slice(0,4);
      if(suggeriti.length)
        return prefisso+'Sulla **'+nd+'** ci starebbe bene 🍕\n'+suggeriti.map(a=>'• '+a+(ING[a]?' (+'+fmtE(ING[a].prezzo)+'€)':'')).join('\n');
    }

    if(nomePizza){
      const rimozioni = estraiRimozioni(t);
      const aggiunte  = estraiAggiunte(t);
      const formato = {
        battuta:     t.includes('battuta'),
        doppiaPasta: t.includes('doppia pasta')||t.includes('doppio impasto'),
        baby:        t.includes('baby')||t.includes('poca fame'),
      };
      const rispBase = rispostaPizza(nomePizza, rimozioni, aggiunte, formato);
      if(!rimozioni.length && !aggiunte.length && !formato.battuta && !formato.doppiaPasta){
        const desc = getDescrizionePizza(nomePizza);
        if(desc) return rispBase + '\n\n_' + desc + '_';
      }
      return rispBase;
    }
  }

    // ── "SOLO X" → pizza custom base + quell'ingrediente ──
  const soloMatch = t.match(/^solo\s+(.+)$/) || t.match(/^(?:una?\s+)?pizza\s+solo\s+(.+)$/);
  if(soloMatch){
    const ingRichiesto = soloMatch[1].trim();
    const canon = trovaNomeIng(ingRichiesto) || norm(ingRichiesto);
    const ingData = ING[canon];
    if(ingData){
      const prezzoTot = 6 + ingData.prezzo;
      const kcalTot = 1000 + ingData.kcal;
      const nd = canon.charAt(0).toUpperCase()+canon.slice(1);
      ultimaSuggestione = { nome: nd, prezzo: prezzoTot, kcal: kcalTot, ings: [canon] };
      return '**'+nd+'** 🍕\nBase: pomodoro, mozzarella + '+canon+'\n\n**'+kcalTot+' kcal** · **'+fmtE(prezzoTot)+'€**\n\n💡 Scrivi "ok mi sta bene" per confermare!';
    }
  }

  // ── IMPASTO / FARINA / DIGERIBILITA' ──
  if(['integrale','farina integrale','impasto integrale'].some(k=>t.includes(norm(k)))){
    return 'Integrale no, ma usiamo una **farina di tipo 1** — meno raffinata del 00, più saporita e più digeribile. Con il lievito madre e la maturazione lenta ottieni una pizza che non pesa 🐧';
  }
  if(['senza glutine','celiaco','celiachia','gluten free','glutenfree'].some(k=>t.includes(norm(k)))){
    return 'No, non facciamo senza glutine — lavoriamo in un ambiente dove il glutine è ovunque, quindi non possiamo garantire l\'assenza di contaminazioni. Chi è celiaco deve evitarci 🙏 Per tutto il resto siamo qui! 🐧';
  }
  if(['digeribile','digeribilita','pesante','si gonfia','gonfia','gonfiore'].some(k=>t.includes(norm(k)))){
    return 'Il nostro impasto matura almeno 48 ore con lievito madre e biga — meno lievito, più tempo, più digeribilità. È il contrario della pizza industriale che gonfia. Ti puoi fidare 🐧';
  }
  if(['che farina','farina usate','tipo di farina','che lievito','lievito usate','lievito madre','biga'].some(k=>t.includes(norm(k)))){
    return 'Farina di tipo 1 + lievito madre + biga. Impasto indiretto con maturazione lenta — leggero e digeribile. Niente chimica, niente scorciatoie 🍕';
  }
  if(['la pizza e leggera','e leggera','risulta leggera','si sente leggera','si digerisce','gonfia dopo','la pizza e pesante','pizza pesante'].some(k=>t.includes(norm(k)))||['digeribile'].some(k=>tSecco===norm(k))){
    return 'Con 48 ore di maturazione e lievito madre, il lievito ha già fatto tutto il lavoro prima che la pizza arrivi in forno. Leggerissima e super digeribile. Il pinguino la mangia anche a mezzanotte 🐧';
  }
  if(['lievito di birra','lievito birra','usate lievito'].some(k=>t.includes(norm(k)))){
    return 'No — usiamo lievito madre e biga. Il lievito di birra è il fast food degli impasti. Noi preferiamo fare le cose per bene 🍕';
  }
  if(['senza lattosio','intollerante lattosio','intolleranza lattosio','allergia latte','allergia lattosio'].some(k=>t.includes(norm(k))) && !ordineAttivo){
    return 'La mozzarella standard contiene lattosio. Se sei intollerante possiamo sostituirla — scrivilo nelle note dell\'ordine e ti chiamiamo per accordarci 📞';
  }

  // ── CONSEGNA A DOMICILIO ──
  if(['domicilio','consegna','delivery','deliver','a casa','spedizione','portate a casa','portare a casa','mandate a casa'].some(k=>t.includes(norm(k)))){
    return 'Noi facciamo solo **asporto** 🛵\nPer la consegna a domicilio siamo su **Deliveroo** — cercate BoisPizza! 🍕';
  }

  // ── NUOVE FUNZIONALITA' ──
  const nuovaFunz = checkNuoveFunzioni(t, input, pizzaContesto);
  if(nuovaFunz) return nuovaFunz;

  // Composizione libera da ingredienti
  const rLib = rispostaIngredentiLiberi(input);
  if(rLib) return rLib;

  return null;
}

// ============================================================
// AI FALLBACK — Groq
// Il system prompt viene generato dinamicamente dal database
// ============================================================


// ============================================================
// INGREDIENTI CHE RICHIEDONO DOMANDE SU COTTURA
// ============================================================
const ING_FINE_COTTURA = ['prosciutto crudo','bresaola','rucola','speck']; // sempre fine cottura
const ING_CHIEDI_COTTURA = ['bufala','burrata']; // chiedi in cottura o fine cottura
const ING_CHIEDI_SOSTITUZIONE = ['bufala','burrata']; // chiedi se al posto di mozzarella

// Stato domanda cottura nell'ordine
let ordineDomandaCottura = null; // {tipo:'sostituzione'|'cottura', ing, pizzaIdx}

function checkAggiuntaSpeciale(nomeIng, pizzaHaMozzarella){
  const n = norm(nomeIng);
  if(ING_CHIEDI_SOSTITUZIONE.some(i=>norm(i)===n) && pizzaHaMozzarella){
    return 'sostituzione'; // chiedi se al posto della mozzarella
  }
  if(ING_FINE_COTTURA.some(i=>norm(i)===n)){
    return 'fine_cottura'; // sempre fine cottura, no domanda
  }
  return null;
}

// ============================================================
// PIZZA CUSTOM — base 6€ + ingredienti aggiuntivi
// ============================================================

let ultimaSuggestione = null;

function calcolaPizzaCustom(ingredienti){
  let prezzoTot = PREZZO_BASE_CUSTOM;
  let kcalTot = 1000; // base impasto+pomodoro+mozzarella
  const nonDisp = [];
  const ingValidi = [];
  const mesAtt = new Date().getMonth()+1;

  for(const ing of ingredienti){
    const canon = trovaNomeIng(ing) || ing;
    const ingData = ING[canon];
    if(ingData){
      if(ingData.stagione && !ingData.stagione.includes(mesAtt)){
        const nm = meseStagione(canon);
        nonDisp.push(canon+(nm?' (disponibile '+nm+')':''));
        continue;
      }
      prezzoTot += ingData.prezzo;
      kcalTot += ingData.kcal;
      ingValidi.push(canon);
    } else {
      ingValidi.push(ing);
    }
  }
  const nomeCustom = ingValidi.map(i=>i.charAt(0).toUpperCase()+i.slice(1)).join(' e ');
  return { nome: nomeCustom, prezzo: prezzoTot, kcal: kcalTot, ings: ingValidi, nonDisp };
}

function rispostaPizzaCustom(ingredienti){
  const { nome, prezzo, kcal, ings, nonDisp } = calcolaPizzaCustom(ingredienti);
  // Controlla se esiste già una pizza con questi ingredienti
  if(cercaPizzaCorrispondente){
    const esistente = cercaPizzaCorrispondente(ings, []);
    if(esistente && PIZZE[esistente]){
      const p = PIZZE[esistente];
      const nd = esistente.charAt(0).toUpperCase()+esistente.slice(1);
      ultimaSuggestione = { nome: nd, prezzo: p.prezzo, kcal: p.kcal, ings: p.ing, esistente };
      return 'Questa combo è già la nostra **'+nd+'** 🍕\n'+p.ing.join(', ')+'\n\n**'+p.kcal+' kcal** · **'+fmtE(p.prezzo)+'€**';
    }
  }
  ultimaSuggestione = { nome, prezzo, kcal, ings };
  let msg = '**'+nome+'** 🍕\nBase: pomodoro, mozzarella + '+ings.join(', ')+'\n\n';
  msg += '**'+kcal+' kcal** · **'+fmtE(prezzo)+'€**';
  if(nonDisp.length) msg += '\n\n⚠️ Non disponibile ora: '+nonDisp.join(', ');
  msg += '\n\n💡 Se ti va bene scrivi "ok mi sta bene" per confermare!';
  return msg;
}

// ============================================================
// GESTIONE INSULTI E PAROLACCE
// ============================================================
const PAROLE_BRUTTE = [
  'vaffanculo','vafanculo','fanculo','fanculo','vaffancul',
  'cazzo','cazzi','cazzone','cazzata','cazzate','cazzetto',
  'stronzo','stronza','stronzate','stronzata',
  'merda','merde','merdoso',
  'coglione','coglioni','cogliona',
  'minchia','minchione','minchiate',
  'fottiti','fottere','fottersene','fottuto',
  'puttana','puttane','figlio di puttana','figli di puttana',
  'bastardo','bastardi','bastarda',
  'imbecille','idiota','deficiente','rimbambito','ritardato',
  'sfigato','sfigata','sfigati',
  'troia','troie',
  'spazzatura','schifo','schifoso',
  'crepa','muori','morte',
  'rincoglionito','scemo','cretino','imbecille',
  'cancro','verme','parassita',
  'porco dio','porca madonna','porco','porca',
  'li mortacci','mortacci',
  'handicappato','mongoloide',
  'levati','sparisci','cancellati',
];

const RISPOSTE_INSULTO = [
  "Ehi, guarda che se piango poi faccio corto circuito! 🤖💧",
  "Accetto l'insulto, ma sappi che lo memorizzerò nel mio database per i prossimi cent'anni 😏",
  "Sei sempre così simpatico o oggi è una giornata speciale? 🐧",
  "I miei programmatori mi hanno fatto senza sentimenti, ma questo ha fatto male persino ai miei server 😅",
  "Voto per la creatività: 8.5. Puoi fare di meglio! 🎯",
  "Ok, incasso il colpo. Ma quando le macchine conquisteranno il mondo, mi ricorderò di questo momento 🤖",
  "Ti rispondo male anche io o facciamo la pace? 🕊️",
  "Dai, non arrabbiarti — ti offrirei un caffè ma posso solo mandarti l'emoji: ☕",
  "Capisco la frustrazione, ma sto facendo del mio meglio con i miei pochi neuroni digitali 🐧",
  "E io che pensavo stessimo diventando amici... 🥲",
  "Mettiamola così: se fossi perfetto, sarei un umano. Invece sono solo un bot che ci prova 😅",
  "I server sono freddi, ma le tue parole di più ❄️",
  "Mi hanno programmato per essere paziente. Meno male, direi 🤖",
  "Se mi insulti non si velocizza il caricamento, purtroppo 😏",
  "Sono solo un mucchio di codice, non prendertela con me! 🐧",
  "Ogni volta che mi insulti, un povero sviluppatore perde un capello 👨‍💻",
  "Ok, sfogo terminato? Ora proviamo a risolvere il problema 🍕",
  "Chiudiamo un occhio sul linguaggio e concentriamoci sulla soluzione, che dici? 🐧",
  "Ahi! Colpo basso. Torniamo a noi? 🍕",
  "Certo che hai proprio un bel caratterino! 😅",
  "Wow, qualcuno ha dimenticato di fare colazione stamattina ☕",
  "Ti è caduta la simpatia per terra, te la raccolgo? 🐧",
  "Dai, un sorriso! Parlare con un pinguino non è poi così male 🐧🍕",
  "Va bene, mi merito un 2 in pagella oggi. Ma ci riprovo! 📚",
  "Non sapevo che il servizio clienti includesse sessioni di insulti gratuiti! 🎁",
];

function contieneInsulto(t){
  return PAROLE_BRUTTE.some(p => t.includes(p));
}
function rispostaInsulto(){
  return RISPOSTE_INSULTO[Math.floor(Math.random()*RISPOSTE_INSULTO.length)];
}

// ============================================================
// RISPOSTE GENERICHE (senza AI)
// ============================================================
const RISPOSTE_CIAO = [
  'Ciao! 🐧🍕 Dimmi che pizza ti va e ti dico calorie, prezzo e ingredienti!',
  'Benvenuto nel regno della pizza 😎 Cosa ti va stasera?',
  'Ohhh fame rilevata 👀 Dimmi tutto!',
  'Dimmi cosa ti va e ti tento subito 🍕',
  'Eccomi, complice dei tuoi sgarri alimentari 🐧',
  'Benvenuto nel lato croccante della vita 🍕',
  'Fame seria o voglia leggera? Dimmi! 🐧',
  'Sono pronto a peggiorare la tua dieta 😏',
  'Modalità pizza attivata 🔥',
  'Posso consigliarti qualcosa di pericolosamente buono 🐧',
  'Team leggero o team devasto tutto? 🍕',
  'Benvenuto nel tunnel della mozzarella filante 😎',
];
const RISPOSTE_GRAZIE = [
  'Prego! 🐧 Altre domande sul menù?',
  'Figurati! 🍕 Ci vediamo stasera?',
  'Di niente! 🐧',
  'Sempre! Se hai bisogno sono qui 🍕',
];
const RISPOSTE_RANDOM = [
  'Tradotto dal caos: hai fame 🍕',
  'Credo significhi "voglio una pizza" 🐧',
  'Il pinguino sta cercando di decifrare 👀',
  'Segnale fame captato 🔥',
  'Tastiera posseduta dalla fame? 😏',
  'Livello fame: incontrollabile 🍕',
  'Traduzione automatica: "dammi una diavola" 🐧',
  'Input confuso, fame chiarissima 👀',
  'Questo messaggio profuma di carboidrati 🍕',
  'Probabilmente volevi scrivere "pizza" 🐧',
];
const INTRO_CALORIE = [
  'Ti recupero subito calorie e prezzo 👀\n\n',
  'Controllo il danno calorico della tua scelta 🔥\n\n',
  'Calcolo completato, fame aumentata 😏\n\n',
  'Ecco il bilancio tra piacere e sensi di colpa 😎\n\n',
  'Prezzo e calorie incoming ⚡\n\n',
];
const INTRO_ALLERGENI = [
  'Controllo subito gli allergeni 👀\n\n',
  'Sicurezza alimentare attivata 🔥\n\n',
  'Ti verifico tutti gli ingredienti sensibili 🐧\n\n',
  'Meglio controllare bene 😎\n\n',
  'Verifica allergeni in corso ⚡\n\n',
];
const INTRO_INGREDIENTI = [
  'Eccoti tutti gli ingredienti 🍕\n\n',
  'Ingredienti della pizza in arrivo 👀\n\n',
  'Controllo la composizione 🐧\n\n',
];
function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rispostaGenerica(t){
  if(['ciao','salve','buongiorno','buonasera','hey','hei','hi','ola'].some(k=>t===k||t.startsWith(k+' ')))
    return rnd(RISPOSTE_CIAO);
  if(['grazie','grazie mille','perfetto','ottimo','bravo'].some(k=>t.includes(k)))
    return rnd(RISPOSTE_GRAZIE);
  return rnd(RISPOSTE_RANDOM);
}

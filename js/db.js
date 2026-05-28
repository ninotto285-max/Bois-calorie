
const WA  = 'https://wa.me/393405327257';
const TEL = 'tel:+390422670631';
// chiave Groq rimossa — gestita dal proxy /api/chat su Vercel

// ============================================================
// DATABASE PIZZE — nome esatto : { kcal, prezzo, ing[], tipo? }
// ============================================================
const PIZZE = {
  'marinara':              { kcal:672,  prezzo:5,    tags:['leggera','vegetariana','classica','rustica'],                              ing:['pomodoro','aglio','origano','olio evo'] },
  'margherita':            { kcal:927, prezzo:5,    tags:['leggera','vegetariana','classica'],                                        ing:['pomodoro','mozzarella'] },
  'diavola':               { kcal:1167, prezzo:8,    tags:['piccante','carnivora','rustica'],                                          ing:['pomodoro','mozzarella','salamino piccante'] },
  'salsiccia':             { kcal:1107, prezzo:8,    tags:['carnivora','rustica','potente'],                                           ing:['pomodoro','mozzarella','salsiccia'] },
  'viennese':              { kcal:1159, prezzo:7.5,  tags:['carnivora','rustica'],                                                     ing:['pomodoro','mozzarella','wurstel di suino'] },
  'pugliese':              { kcal:939, prezzo:7,    tags:['vegetariana','potente','rustica'],                                         ing:['pomodoro','mozzarella','cipolla di tropea'] },
  'prosciutto e funghi':   { kcal:1112, prezzo:8,    tags:['carnivora','classica'],                                                    ing:['pomodoro','mozzarella','prosciutto cotto','funghi'] },
  'capricciosa':           { kcal:1125, prezzo:9,    tags:['carnivora','classica','goduriosa'],                                        ing:['pomodoro','mozzarella','prosciutto cotto','funghi','carciofi'] },
  'tonno e cipolla':       { kcal:1017, prezzo:9,    tags:['mare','potente'],                                                          ing:['pomodoro','mozzarella','tonno','cipolla di tropea'] },
  'bufala':                { kcal:934, prezzo:9,    tags:['leggera','vegetariana','elegante','fresca'],                               ing:['pomodoro','bufala'] },
  'bufalina':              { kcal:945, prezzo:10,   tags:['leggera','vegetariana','elegante','fresca','estiva'],                      ing:['pomodoro','bufala','pomodorini'] },
  'quattro stagioni':      { kcal:1169, prezzo:9,    tags:['carnivora','classica','goduriosa'],                                        ing:['pomodoro','mozzarella','prosciutto cotto','funghi','carciofi','olive'] },
  'romana':                { kcal:948, prezzo:8,    tags:['mare','potente','classica'],                                               ing:['pomodoro','mozzarella','acciughe'] },
  'siciliana':             { kcal:993, prezzo:9,    tags:['mare','potente','saporita'],                                               ing:['pomodoro','mozzarella','acciughe','capperi','olive'] },
  'patatosa':              { kcal:1083, prezzo:8,    tags:['vegetariana','goduriosa','pesante'],                                       ing:['pomodoro','mozzarella','patate fritte'] },
  'parma':                 { kcal:1177, prezzo:10,   tags:['carnivora','elegante','stagionata'],                                       ing:['pomodoro','mozzarella','prosciutto crudo'] },
  'speck':                 { kcal:1101, prezzo:9.5,  tags:['carnivora','elegante','fume','stagionata'],                                ing:['pomodoro','mozzarella','speck alto adige'] },
  'montello':              { kcal:1328, prezzo:10.5, tags:['carnivora','elegante','rustica','potente'],                                ing:['pomodoro','mozzarella','porchetta trevigiana','porcini'] },
  'valtellina':            { kcal:1207, prezzo:10.5, tags:['carnivora','elegante','stagionata','fresca'],                              ing:['pomodoro','mozzarella','bresaola','rucola','grana'] },
  'verdure':               { kcal:987, prezzo:8.5,  tags:['vegetariana','leggera'],                                                   ing:['pomodoro','mozzarella','verdure miste grigliate'] },
  'estate':                { kcal:938,  prezzo:8,    tags:['leggera','vegetariana','fresca','estiva'],                                 ing:['pomodoro','mozzarella','pomodorini datterini conditi'] },
  'norma':                 { kcal:1225, prezzo:9,    tags:['vegetariana','rustica','potente'],                                         ing:['pomodoro','mozzarella','melanzane','ricotta','grana'] },
  'parmigiana':            { kcal:1138, prezzo:8.5,  tags:['vegetariana','rustica'],                                                   ing:['pomodoro','mozzarella','melanzane','grana'] },
  'mike':                  { kcal:1450, prezzo:10.5, tags:['carnivora','formaggiosa','elegante','potente'],                            ing:['rucola cotta','mozzarella','salsiccia','brie','grana'] },
  'ciccia e friarielli':   { kcal:1100, prezzo:9,    tags:['carnivora','rustica','potente'],                                           ing:['mozzarella','salsiccia','friarielli'] },
  'formaggi':              { kcal:1460, prezzo:9,    tags:['formaggiosa','vegetariana','goduriosa','pesante'],                         ing:['mozzarella','gorgonzola','brie','grana'] },
  'paolo':                 { kcal:1349, prezzo:10,   tags:['carnivora','formaggiosa','potente'],                                       ing:['mozzarella','gorgonzola','cipolla','salamino piccante'] },
  'sfiziosa':              { kcal:1506, prezzo:10,   tags:['vegetariana','formaggiosa','elegante','goduriosa'],                        ing:['mozzarella','pesto','melanzane fritte','brie','grana'] },
  'ava':                   { kcal:1529, prezzo:12,   tags:['carnivora','potente','goduriosa'],                                         ing:['mozzarella','salsiccia','salamino piccante','pomodorini','aglio','grana'] },
  'pps':                   { kcal:1397, prezzo:11,   tags:['carnivora','formaggiosa','fume','goduriosa'],                              ing:['mozzarella','porcini','scamorza','pancetta dolce'] },
  'silvia':                { kcal:1473, prezzo:12,   tags:['elegante','dolcesalato','agrodolce','formaggiosa','carnivora'],            ing:['mozzarella','gorgonzola','porchetta trevigiana','senape e miele'] },
  'wilma':                 { kcal:1100, prezzo:8.5,  tags:['vegetariana','fresca','estiva'],                                          ing:['pomodoro','mozzarella','pesto','pomodorini','mais'] },
  'wanda':                 { kcal:1201, prezzo:9,    tags:['mare','potente','saporita'],                                               ing:['pomodoro','mozzarella','carciofi','salamino piccante','acciughe'] },
  'leone':                 { kcal:1083, prezzo:12,   tags:['mare','potente','goduriosa','saporita'],                                   ing:['pomodoro','mozzarella','tonno','cipolla','acciughe','capperi','olive'] },
  'giggino':               { kcal:1211, prezzo:10,   tags:['carnivora','goduriosa','fresca'],                                          ing:['pomodoro','mozzarella','prosciutto cotto','mais','philadelphia','pomodorini'] },
  'titti':                 { kcal:1288, prezzo:11.5, tags:['carnivora','elegante','goduriosa'],                                        ing:['pomodoro','mozzarella','zucchine','philadelphia','prosciutto crudo'] },
  'boscaiola':             { kcal:1360, prezzo:11,   tags:['carnivora','pesante','goduriosa','rustica','potente','onto'],              ing:['pomodoro','mozzarella','salsiccia','salamino piccante','funghi misti'] },
  'tartufata':             { kcal:994, prezzo:11,   tags:['vegetariana','tartufo','elegante','goduriosa'],                            ing:['pomodoro','mozzarella','salsa al tartufo','funghi misti'] },
  'ufo':                   { kcal:1469, prezzo:12,   tags:['carnivora','pesante','goduriosa','potente','rustica','onto'],              ing:['pomodoro','mozzarella','salsiccia','salamino piccante','olive','pomodori secchi'] },
  'pazza':                 { kcal:1604, prezzo:11.5, tags:['carnivora','pesante','potente','piccante','goduriosa','onto'],             ing:['pomodoro','mozzarella','salsiccia','salamino piccante','peperoni','wurstel di suino'] },
  'repubblica':            { kcal:1454, prezzo:11.5, tags:['leggera','elegante','fresca','estiva'],                                   ing:['pomodoro','mozzarella','rucola','pomodorini','bufala','grana'] },
  'capricciosa sbagliata': { kcal:1341, prezzo:12,   tags:['carnivora','elegante','goduriosa','rustica'],                             ing:['pomodoro','mozzarella','porcini','carciofi','porchetta trevigiana'] },
  'amatriciana':           { kcal:1415,  prezzo:10,   tags:['carnivora','classica','potente'],                                         ing:['pomodoro','mozzarella','pancetta dolce','cipolla','grana'] },
  'onta':                  { kcal:1144, prezzo:10,   tags:['carnivora','potente','rustica','piccante','onto'],                         ing:['pomodoro','mozzarella','salsiccia','cipolla','peperoni'] },
  'cri':                   { kcal:1419, prezzo:14,   tags:['dolcesalato','agrodolce','elegante','formaggiosa','carnivora'],            ing:['mozzarella','salsiccia','brie erborinato','noci','confettura di fichi'] },
  'bois':                  { kcal:1737, prezzo:11,   tipo:'arrotolata', tags:['tartufo','formaggiosa','pesante','goduriosa','carnivora','onto'],  ing:['mozzarella','gorgonzola','salsiccia','crema al tartufo','patate fritte'] },
  'pimpa':                 { kcal:1800, prezzo:11,   tipo:'arrotolata', tags:['bbq','fume','pesante','goduriosa','carnivora','onto'],      ing:['mozzarella','scamorza','salsa bbq','cipolla','patate fritte','pancetta dolce'] },
  'calzone classico':      { kcal:1112, prezzo:9,    tipo:'calzone',    tags:['carnivora','classica'],                                    ing:['pomodoro','mozzarella','prosciutto cotto','funghi'] },
  'calzone piccante':      { kcal:1254, prezzo:9,    tipo:'calzone',    tags:['carnivora','piccante'],                                    ing:['pomodoro','mozzarella','salamino piccante','ricotta'] },
  'calzone vegeta':        { kcal:987,  prezzo:9,    tipo:'calzone',    tags:['vegetariana','leggera'],                                   ing:['pomodoro','mozzarella','verdure miste grigliate'] },
  'calzone poro mauretto': { kcal:1649, prezzo:12,   tipo:'calzone',    tags:['carnivora','goduriosa','pesante'],                         ing:['pomodoro','mozzarella','prosciutto cotto','funghi','spinaci','ricotta','salamino piccante','grana'] },
  'calzone ade':           { kcal:1401, prezzo:13,   tipo:'calzone',    tags:['carnivora','tartufo','elegante','goduriosa'],               ing:['pomodoro','mozzarella','salsa al tartufo','funghi misti','salamino piccante','brie'] },
};

// ============================================================
// DATABASE INGREDIENTI — nome canonico : { kcal, prezzo }
// ============================================================
const ING = {
  'pomodoro':                     { kcal:14,  prezzo:0.5,  allergeni:[] },
  'mozzarella':                   { kcal:280, prezzo:1.5,  allergeni:['latte'] },
  'basilico fresco':              { kcal:1,   prezzo:0,    allergeni:[] },
  'olio evo':                     { kcal:44,  prezzo:0,    allergeni:[] },
  'origano':                      { kcal:1,   prezzo:0,    allergeni:[] },
  'aglio':                        { kcal:5,   prezzo:0,    allergeni:[] },
  'pomodorini':                   { kcal:11,  prezzo:1.5,  allergeni:[] },
  'pomodorini datterini conditi': { kcal:11,  prezzo:1.5,  allergeni:[] },
  'cipolla':                      { kcal:12,  prezzo:1,    allergeni:[] },
  'cipolla di tropea':            { kcal:12,  prezzo:1,    allergeni:[] },
  'funghi':                       { kcal:13,  prezzo:1,    allergeni:[] },
  'funghi misti':                 { kcal:15,  prezzo:1,    allergeni:[] },
  'carciofi':                     { kcal:28,  prezzo:1.5,  allergeni:[] },
  'olive':                        { kcal:35,  prezzo:1.5,  allergeni:[] },
  'capperi':                      { kcal:5,   prezzo:0.5,  allergeni:[] },
  'melanzane':                    { kcal:15,  prezzo:1.5,  allergeni:[] },
  'melanzane fritte':             { kcal:60,  prezzo:1.5,  allergeni:[] },
  'zucchine':                     { kcal:10,  prezzo:1,    allergeni:[] },
  'peperoni':                     { kcal:25,  prezzo:1,    allergeni:[] },
  'rucola':                       { kcal:8,   prezzo:1,    allergeni:[] },
  'rucola cotta':                 { kcal:8,   prezzo:1,    allergeni:[] },
  'mais':                         { kcal:29,  prezzo:1,    allergeni:[] },
  'verdure miste grigliate':      { kcal:30,  prezzo:2.5,  allergeni:[] },
  'spinaci':                      { kcal:8,   prezzo:1,    allergeni:[] },
  'porcini':                      { kcal:15,  prezzo:2.5,  allergeni:[] },
  'pomodori secchi':              { kcal:75,  prezzo:2,    allergeni:['solfiti'] },
  'friarielli':                   { kcal:18,  prezzo:1.5,  allergeni:[] },
  'noci':                         { kcal:98,  prezzo:1,    allergeni:['frutta a guscio'] },
  'patate fritte':                { kcal:250, prezzo:1.5,  allergeni:[] },
  'bufala':                       { kcal:934, prezzo:3,    allergeni:['latte'] },
  'gorgonzola':                   { kcal:210, prezzo:1.5,  allergeni:['latte'] },
  'brie':                         { kcal:167, prezzo:1.5,  allergeni:['latte'] },
  'brie erborinato':              { kcal:167, prezzo:1.5,  allergeni:['latte'] },
  'grana':                        { kcal:43,  prezzo:1.5,  allergeni:['latte','uova'] },
  'scamorza':                     { kcal:180, prezzo:1.5,  allergeni:['latte'] },
  'ricotta':                      { kcal:70,  prezzo:1.5,  allergeni:['latte'] },
  'philadelphia':                 { kcal:96,  prezzo:1.5,  allergeni:['latte'] },
  'stracchino':                   { kcal:150, prezzo:2,    allergeni:['latte'] },
  'salamino piccante':            { kcal:252, prezzo:1.5,  allergeni:[] },
  'nduja':                        { kcal:320, prezzo:2,    allergeni:[] },
  'nduja':                        { kcal:320, prezzo:2,    allergeni:[] },
  'salsiccia':                    { kcal:1107, prezzo:2,    allergeni:[] },
  'wurstel di suino':             { kcal:240, prezzo:1,    allergeni:[] },
  'prosciutto cotto':             { kcal:87,  prezzo:1,    allergeni:[] },
  'prosciutto crudo':             { kcal:125, prezzo:3,    allergeni:[] },
  'pancetta dolce':               { kcal:270, prezzo:2.5,  allergeni:[] },
  'speck alto adige':             { kcal:130, prezzo:3,    allergeni:[] },
  'porchetta trevigiana':         { kcal:180, prezzo:3,    allergeni:[] },
  'bresaola':                     { kcal:75,  prezzo:3,    allergeni:[] },
  'tonno':                        { kcal:79,  prezzo:2,    allergeni:['pesce'] },
  'acciughe':                     { kcal:21,  prezzo:1.5,  allergeni:['pesce'] },
  'pesto':                        { kcal:135, prezzo:1,    allergeni:['latte','frutta a guscio','uova'] },
  'crema al tartufo':             { kcal:53,  prezzo:2,    allergeni:['glutine','soia','senape'] },
  'salsa al tartufo':             { kcal:53,  prezzo:2,    allergeni:['glutine','soia','senape'] },
  'salsa bbq':                    { kcal:24,  prezzo:1,    allergeni:['solfiti'] },
  'senape e miele':               { kcal:30,  prezzo:0,    allergeni:[] },
  'confettura di fichi':          { kcal:60,  prezzo:0,    allergeni:[] },
  // ingredienti stagionali
  'burrata':                      { kcal:300, prezzo:3,    allergeni:['latte'],  stagione:[6,7,8]  },
  'asparagi':                     { kcal:20,  prezzo:2,    allergeni:[],         stagione:[3,4,5]  },
  'zucca':                        { kcal:26,  prezzo:2,    allergeni:[],         stagione:[9,10,11] },
  'crema di zucca':               { kcal:40,  prezzo:2,    allergeni:[],         stagione:[9,10,11] },
  'patate al forno':              { kcal:150, prezzo:1.5,  allergeni:[],         stagione:null     },
  'radicchio':                    { kcal:20,  prezzo:2,    allergeni:[],         stagione:[12,1,2] },
};

// ============================================================
// ALLERGENI — calcola da lista ingredienti
// ============================================================
function calcolaAllergeni(ingList) {
  const set = new Set();
  // Aggiungi sempre glutine per l'impasto base
  set.add('glutine');
  for (const i of ingList) {
    const chiave = trovaNomeIng(i) || i;
    const dati = ING[chiave];
    if (dati && dati.allergeni) dati.allergeni.forEach(a => set.add(a));
  }
  return [...set];
}

// ============================================================
// STAGIONALITÀ
// ============================================================
function isDisponibile(nomeIng) {
  const d = ING[nomeIng];
  if (!d || !d.stagione) return true;
  const mese = new Date().getMonth() + 1;
  return d.stagione.includes(mese);
}
function meseStagione(nomeIng) {
  const nomi = ['','gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const d = ING[nomeIng];
  if (!d || !d.stagione) return null;
  return d.stagione.map(m => nomi[m]).join(', ');
}

// ============================================================
// ABBINAMENTI
// ============================================================
const ABBINAMENTI = {
  'bufala':              ['prosciutto crudo','pomodorini','rucola','pesto','bresaola'],
  'burrata':             ['prosciutto crudo','pomodorini','pesto','rucola','acciughe'],
  'gorgonzola':          ['noci','porchetta trevigiana','speck alto adige','pancetta dolce'],
  'brie':                ['noci','salsiccia','funghi misti','porcini'],
  'prosciutto crudo':    ['bufala','rucola','grana','pomodorini'],
  'prosciutto cotto':    ['funghi','carciofi','mais','ricotta'],
  'salsiccia':           ['friarielli','funghi misti','porcini','brie','peperoni'],
  'speck alto adige':    ['gorgonzola','rucola','grana','porcini'],
  'bresaola':            ['rucola','grana','pomodorini','philadelphia'],
  'porchetta trevigiana':['porcini','carciofi','gorgonzola','radicchio'],
  'porcini':             ['salsiccia','porchetta trevigiana','scamorza','crema al tartufo'],
  'crema al tartufo':    ['funghi misti','porcini','grana','salsiccia'],
  'salsa al tartufo':    ['funghi misti','porcini','grana','salsiccia'],
  'rucola':              ['bresaola','prosciutto crudo','bufala','grana'],
  'pomodorini':          ['bufala','rucola','pesto','prosciutto crudo'],
  'zucca':               ['gorgonzola','salsiccia','pancetta dolce','scamorza'],
  'crema di zucca':      ['gorgonzola','salsiccia','pancetta dolce','scamorza'],
  'radicchio':           ['gorgonzola','porchetta trevigiana','speck alto adige','pancetta dolce'],
  'asparagi':            ['prosciutto crudo','speck alto adige','grana'],
  'philadelphia':        ['rucola','pomodorini','bresaola','zucchine'],
  'pancetta dolce':      ['gorgonzola','cipolla','porcini','scamorza'],
  'salsa bbq':           ['scamorza','cipolla','pancetta dolce','salsiccia'],
  'pesto':               ['pomodorini','bufala','melanzane','grana'],
  'melanzane':           ['ricotta','grana','pesto'],
  'peperoni':            ['salsiccia','wurstel di suino','cipolla','salamino piccante'],
  'scamorza':            ['pancetta dolce','porcini','speck alto adige','salsa bbq'],
  'grana':               ['prosciutto crudo','bresaola','rucola','speck alto adige'],
};

function suggerisciAbbinamenti(nomeIng) {
  const lista = ABBINAMENTI[nomeIng];
  if (!lista) return null;
  return lista.filter(i => {
    const canon = trovaNomeIng(i) || i;
    return isDisponibile(canon);
  }).slice(0, 4);
}


// ============================================================
// ABBINAMENTI DISCORSIVI PER PIZZA
// ============================================================
const ABB_PIZZA = {
  'marinara': [
    "Se ti piace il gusto classico e deciso, qualche acciuga sopra dà quella botta sapida che la rende ancora più intensa 🐟",
    "Con dei pomodorini freschi sopra diventa molto più profumata e succosa, senza perdere l'anima semplice della Marinara 🍅",
    "Un po' di burrata sopra a fine cottura crea un contrasto assurdo con aglio e origano — molto cremosa ma equilibrata 🧀",
    "Origano extra e olive nere la fanno diventare super mediterranea, sapore pieno e bello rustico 🫒",
    "Se vuoi trasformarla in qualcosa di più gourmet, burrata, pomodorini e un filo d'olio evo sopra funzionano davvero bene ✨",
  ],
  'margherita': [
    "La Margherita con bufala sopra resta semplice ma cambia completamente livello: più cremosa e molto più ricca 🐃",
    "Con pomodorini freschi e grana sopra viene fuori una versione più estiva e saporita 🍅",
    "Se ti piace più intensa, salamino piccante e grana la trasformano in una bomba 💣",
    "Burrata e pesto sulla Margherita stanno benissimo insieme — super cremosa e profumata 🌿",
    "Con prosciutto crudo aggiunto sopra a fine cottura vai sul classico che funziona sempre 🍖",
  ],
  'diavola': [
    "Con burrata sopra smorza leggermente il piccante e crea un contrasto assurdo 🧀",
    "Pomodorini e grana la rendono più completa e ancora più saporita 🍅",
    "Se vuoi una versione più ignorante, patatine fritte e salamino extra fanno danni seri 🍟",
    "Anche cipolla di Tropea e olive nere ci stanno molto bene: più intensa e cattiva 🧅",
    "Smorzata con gorgonzola o scamorza: se vuoi mitigare il piccante dando cremosità, funziona benissimo 🧀",
  ],
  'salsiccia': [
    "La salsiccia con friarielli è una combo storica, sapore pieno e super equilibrato 🌿",
    "Con scamorza aggiunta diventa molto più affumicata e golosa 🔥",
    "Porcini e salsiccia insieme funzionano benissimo se vuoi una pizza più autunnale e intensa 🍄",
    "Una spolverata di grana sopra le dà ancora più carattere 🧀",
    "Se vuoi esagerare un po', patate fritte e salsiccia sono una combo illegale 🍟",
  ],
  'viennese': [
    "Wurstel e patatine è il classico intramontabile, semplice ma devastante 🍟",
    "Con salsa BBQ sopra diventa ancora più street food e ignorante 🔥",
    "Scamorza e pancetta dolce la rendono molto più ricca e affumicata 🥓",
    "Se vuoi darle più sapore, cipolla croccante e grana ci stanno davvero bene 🧅",
    "Anche un po' di salamino piccante sopra crea un contrasto molto interessante col wurstel 🌶️",
  ],
  'pugliese': [
    "La cipolla di Tropea con acciughe sopra diventa ancora più intensa e saporita, molto sud Italia 🐟",
    "Con olive nere e origano extra prende un gusto super mediterraneo 🫒",
    "Pomodorini freschi e grana la rendono più equilibrata e profumata 🍅",
    "Anche un po' di salamino piccante ci sta bene: dolcezza della cipolla e piccante si sposano da paura 🌶️",
    "Con tonno aggiunto crea la classica tonno e cipolla potenziata, ottima in ogni stagione 🐟",
  ],
  'prosciutto e funghi': [
    "Con porcini aggiunti diventa molto più intensa e boschiva 🍄",
    "Una spolverata di grana sopra le dà ancora più carattere 🧀",
    "Con crema al tartufo cambia completamente livello — la rende gourmet 🎩",
    "Prosciutto cotto e philadelphia insieme la rendono super cremosa 🧀",
    "Con olive e carciofi extra si avvicina a una quattro stagioni, bilanciando la dolcezza del cotto 🫒",
  ],
  'capricciosa': [
    "Con olive extra e acciughe diventa ancora più saporita e completa 🫒",
    "Porcini aggiunti la fanno diventare molto più premium 🍄",
    "Con salamino piccante acquista più carattere senza perdere equilibrio 🌶️",
    "Pomodorini freschi e grana sopra la rendono più moderna e fresca 🍅",
    "La scamorza al posto della mozzarella dona una marcia in più a tutti gli ingredienti 🔥",
  ],
  'tonno e cipolla': [
    "Capperi e olive nere qui sono praticamente perfetti insieme 🫒",
    "Con acciughe aggiunte diventa ancora più intensa e marina 🐟",
    "Pomodorini freschi sopra aiutano tantissimo a bilanciare il tonno 🍅",
    "Se ti piace sapida e decisa, origano extra e capperi spingono forte 🌿",
    "La philadelphia crea un contrasto cremoso e fresco che lega splendidamente col tonno 🧀",
  ],
  'bufala': [
    "Con prosciutto crudo aggiunto diventa elegante e super equilibrata 🍖",
    "Un po' di pesto sopra le dà un profumo assurdo 🌿",
    "Rucola, grana e pomodorini la fanno diventare freschissima e molto estiva 🌱",
    "Con acciughe — una reinterpretazione eccellente della classica Napoli 🐟",
    "Pomodori secchi e pesto di basilico esaltano la freschezza della bufala 🍅",
  ],
  'bufalina': [
    "Con speck Alto Adige a fine cottura crea un contrasto magnifico tra i pomodorini freschi e l'affumicato 🥓",
    "Il pesto si sposa divinamente con bufala e pomodorini — richiama la caprese 🌿",
    "Con zucchine grigliate aggiunte diventa leggera, vegetariana e molto fresca 🥒",
  ],
  'quattro stagioni': [
    "Con funghi misti o porcini al posto dei classici amplifica il profumo della sezione autunnale 🍄",
    "Il salamino piccante ravviva tutto l'insieme degli ingredienti 🌶️",
    "Una spolverata di Grana Padano a fine cottura lega perfettamente carciofi e prosciutto 🧀",
  ],
  'romana': [
    "Con capperi e olive nere la trasformi nella classica Siciliana, potenziando il carattere delle acciughe 🫒",
    "Pomodorini datterini a fine cottura spezzano la sapidità dell'acciuga con la loro dolcezza 🍅",
    "Il salamino piccante crea un abbinamento strong, perfetto per chi ama i sapori veraci 🌶️",
  ],
  'siciliana': [
    "Pomodorini freschi mitigano il salato di acciughe e capperi 🍅",
    "Una base di bufala aggiunta a crudo rende la pizza morbidissima, bilanciando l'intensità 🐃",
    "Un filo di pesto di basilico lega le olive e i capperi in un abbraccio ancora più profumato 🌿",
  ],
  'patatosa': [
    "Wurstel e patate fritte — il classico intramontabile 🍟",
    "Pancetta dolce e scamorza trasformano la pizza in un piatto ricco dal sapore leggermente affumicato 🥓",
    "Un giro di salsa BBQ sopra le patate fritte la rende irresistibilmente sfiziosa 🔥",
  ],
  'parma': [
      "La **senape di Digione** sul prosciutto crudo è un classico francese che funziona anche qui — agrodolce e salato, una combo elegante 🍯",
  
    "Rucola e scaglie di Grana Padano — il classico che esalta la dolcezza del crudo 🌱",
    "I pomodori secchi creano un contrasto favoloso con il salato del crudo 🍅",
    "La philadelphia come base cremosa su cui adagiare il crudo è da provare assolutamente 🧀",
  ],
  'speck': [
      "La **senape di Digione** sullo speck è una combo da montagna — affumicato e agrodolce si incontrano alla perfezione 🍯",
  
    "Il gorgonzola o brie crea un legame cremoso e intenso che sposa l'affumicatura dello speck 🧀",
    "I funghi porcini sono l'alleato ideale per lo speck — profumi del Trentino garantiti 🍄",
    "Le noci tritate donano una parte croccante che contrasta la morbidezza dello speck 🥜",
    "Senape di Digione e miele sopra lo speck è una combo agrodolce devastante — la grassezza e l'affumicato vogliono quel contrasto 🍯",
  ],
  'montello': [
      "La **senape di Digione** ci sta benissimo sulla porchetta trevigiana — quell'agrodolce spezza la grassezza e dà una complessità inaspettata 🍯",
  
    "La salsa al tartufo rende questa pizza un trionfo autunnale indimenticabile 🎩",
    "Il salamino piccante spezza i toni dolci e grassi della porchetta 🌶️",
    "Scaglie di Grana Padano a fine cottura esaltano la porchetta trevigiana 🧀",
  ],
  'valtellina': [
      "Un tocco di **senape di Digione** sulla bresaola è raffinato e inaspettato — esalta il salato con quella nota agrodolce 🍯",
  
    "Pomodorini freschi donano umidità e freschezza, alleggerendo bresaola e rucola 🍅",
    "I funghi porcini si abbinano splendidamente alla bresaola con note terrose 🍄",
    "Un leggero accenno di crema al tartufo sopra la bresaola trasforma radicalmente l'esperienza 🎩",
  ],
  'verdure': [
    "Il gorgonzola o brie si sposa magnificamente con le verdure grigliate 🧀",
    "Il pesto di basilico a fine cottura regala una sferzata di freschezza e profumo 🌿",
    "La scamorza al posto della mozzarella richiama la cottura alla griglia delle verdure 🔥",
  ],
  'estate': [
    "Il prosciutto crudo a fine cottura trasforma questa pizza fresca in un piatto completo e bilanciato 🍖",
    "Olive nere e scaglie di Grana Padano arricchiscono la semplicità del pomodorino datterino 🫒",
    "Il pesto si sposa perfettamente con la dolcezza dei datterini conditi 🌿",
  ],
  'norma': [
    "Il salamino piccante spezza la dolcezza della melanzana e della ricotta 🌶️",
    "Lo speck a fine cottura dona una nota affumicata che si sposa benissimo con la ricotta 🥓",
    "Un tocco di pesto di basilico esalta la freschezza della ricotta e il sapore mediterraneo 🌿",
  ],
  'parmigiana': [
    "Il prosciutto cotto inserito sotto le melanzane ricorda la versione della parmigiana ricca al forno 🍖",
    "La scamorza affumicata accentua il sapore di griglia e rende la pizza super filante 🔥",
    "Il salamino piccante si inserisce perfettamente tra lo strato di melanzane e il Grana 🌶️",
  ],
  'mike': [
    "I funghi porcini su questa base bianca con rucola, salsiccia e brie calzano a pennello 🍄",
    "Le noci tritate creano un fantastico gioco di consistenze con la cremosità del brie 🥜",
    "Un filo di crema al tartufo lega meravigliosamente con la salsiccia e i formaggi 🎩",
  ],
  'ciccia e friarielli': [
    "Il salamino piccante è il completamento naturale per questa accoppiata tipicamente campana 🌶️",
    "Il gorgonzola crea un contrasto cremoso e intenso che avvolge salsiccia e friarielli 🧀",
    "La scamorza esalta il sapore rustico della verdura e della carne 🔥",
  ],
  'formaggi': [
      "La **senape di Digione** sui quattro formaggi è devastante — quella nota piccante-dolce pulisce il palato dalla grassezza e bilancia tutto 🍯",
  
    "Lo speck Alto Adige a fine cottura crea un equilibrio perfetto con la sapidità di gorgonzola e brie 🥓",
    "Le noci tritate sono l'abbinamento classico per eccellenza con il gorgonzola 🥜",
    "La salsa al tartufo trasforma la quattro formaggi in una pizza dal profumo intenso 🎩",
    "Senape di Digione e miele ci stanno benissimo — la grassezza dei quattro formaggi vuole quel tocco agrodolce che pulisce il palato 🍯",
  ],
  'paolo': [
    "I funghi misti smorzano i toni più pungenti di gorgonzola e salamino 🍄",
    "La salsiccia trasforma questa pizza in un tripudio di sapori decisi e invernali 🔥",
    "I pomodori secchi bilanciano l'acidità della cipolla e il piccante del salume 🍅",
  ],
  'sfiziosa': [
    "Il prosciutto crudo a fine cottura su pesto, melanzane fritte e brie è straordinario 🍖",
    "La pancetta dolce in cottura si sposa magnificamente con la dolcezza delle melanzane fritte 🥓",
    "I pomodorini freschi alleggeriscono la struttura importante della frittura e del brie 🍅",
  ],
  'ava': [
    "La philadelphia o il brie aiutano ad amalgamare i sapori forti creando una crema deliziosa 🧀",
    "I friarielli si sposano benissimo con la salsiccia e l'aglio già presenti 🌿",
    "I funghi misti completano perfettamente il profilo rustico di questa pizza super saporita 🍄",
  ],
  'pps': [
    "La salsa al tartufo su porcini, scamorza e pancetta crea un legame eccezionale 🎩",
    "Una spolverata di gorgonzola intensifica il sapore della scamorza e dei funghi 🧀",
    "La rucola fresca a fine cottura spezza la grassezza della pancetta dolce 🌱",
  ],
  'silvia': [
    "Le noci o i funghi porcini trovano il loro posto perfetto tra porchetta, gorgonzola, senape e miele 🥜",
    "Le patate fritte creano un piatto unico super goloso che si sposa benissimo con la senape e miele 🍟",
    "La rucola aggiunta all'uscita pulisce il palato dalla complessità dolce-sapida 🌱",
    "La senape di Digione già presente nella Silvia è la star — esalta la porchetta e il gorgonzola con quella nota agrodolce inconfondibile 🍯",
  ],
  'wilma': [
    "Il prosciutto cotto si abbina perfettamente con pesto e mais — adatta anche ai bambini 🍖",
    "La philadelphia crea un contrasto fresco e cremoso con il pesto e i pomodorini 🧀",
    "Le scaglie di Grana Padano o le acciughe rompono la dolcezza del mais 🐟",
  ],
  'wanda': [
    "Le olive nere completano il profilo mediterraneo di carciofi, salamino e acciughe 🫒",
    "I funghi misti creano un ottimo sottofondo per il salamino e i carciofi 🍄",
    "Una spolverata di Grana Padano lega l'acciuga e il carciofo 🧀",
  ],
  'leone': [
    "I pomodorini freschi all'uscita alleggeriscono la sapidità di questa pizza molto ricca 🍅",
    "Il salamino piccante si inserisce perfettamente in questo contesto di sapori forti 🌶️",
    "La mozzarella extra assicura che la pizza rimanga succulenta nonostante i molti ingredienti 🧀",
  ],
  'giggino': [
    "Il salamino piccante rende graffiante questa pizza altrimenti molto delicata 🌶️",
    "Il pesto di basilico si sposa magnificamente con la philadelphia e i pomodorini 🌿",
    "Lo speck dona una nota affumicata che esalta la dolcezza del mais 🥓",
  ],
  'titti': [
    "Pomodori secchi e noci ci danno la parte croccante che mancava — gourmet d'estate 🥜",
    "Un filo di crema al tartufo sopra la philadelphia e il crudo eleva decisamente il sapore 🎩",
    "Il pesto si sposa divinamente con le zucchine grigliate e la philadelphia 🌿",
  ],
  'boscaiola': [
    "Il gorgonzola o brie fonde creando un sugo spettacolare con salsiccia e funghi 🧀",
    "La salsa al tartufo trasforma la classica boscaiola in una variante lussuosa 🎩",
    "Le patate fritte sopra i funghi e le salsicce — la pizza da vizio per eccellenza 🍟",
  ],
  'tartufata': [
    "Il prosciutto crudo a fine cottura o la salsiccia in cottura completano perfettamente il tartufo 🍖",
    "Scaglie di Grana Padano all'uscita esaltano le note terrose del tartufo 🧀",
    "Il brie crea una base eccezionale che si sposa nativamente con il tartufo 🧀",
  ],
  'ufo': [
    "La scamorza affumicata bilancia la complessità di salsiccia, salamino, olive e pomodori secchi 🔥",
    "La rucola fresca all'uscita spezza l'intensità dei pomodori secchi e dei salumi 🌱",
    "La philadelphia crea isole di freschezza in mezzo al piccante del salamino 🧀",
  ],
  'pazza': [
    "Patate fritte e un giro di salsa BBQ — la bomba definitiva per questa pizza già ricca 🍟",
    "Il gorgonzola si sposa benissimo sia con i peperoni che con la salsiccia 🧀",
    "La cipolla di Tropea accentua la nota rustica e dolce dei peperoni 🧅",
  ],
  'repubblica': [
    "Il prosciutto crudo di Parma all'uscita completa rucola, pomodorini, bufala e grana 🍖",
    "Le acciughe creano un contrasto favoloso con la dolcezza della bufala 🐟",
    "Un giro di pesto esalta la freschezza degli ingredienti crudi 🌿",
  ],
  'capricciosa sbagliata': [
      "La **senape di Digione** sulla porchetta trevigiana è una combo agrodolce che sorprende — prova ad aggiungerla 🍯",
  
    "La crema al tartufo su porcini, carciofi e porchetta è indimenticabile 🎩",
    "Le scaglie di Grana Padano donano la giusta sapidità alla porchetta dolce 🧀",
    "Il salamino piccante spezza la dolcezza complessiva 🌶️",
  ],
  'amatriciana': [
    "Il salamino piccante accentua il carattere romano del piatto 🌶️",
    "I funghi misti o porcini si sposano benissimo con la pancetta dolce e la cipolla 🍄",
    "La scamorza affumicata esalta le note della pancetta cotta nel forno 🔥",
  ],
  'onta': [
    "Le patate fritte la trasformano in un piatto unico super goloso 🍟",
    "Il salamino piccante bilancia perfettamente la dolcezza dei peperoni 🌶️",
    "Il gorgonzola crea un legame cremoso con i peperoni e la cipolla 🧀",
  ],
  'cri': [
      "La **senape di Digione** chiude il cerchio della Cri — fico, brie erborinato e senape formano un triangolo di sapori perfetto 🍯",
  
    "Lo speck Alto Adige all'uscita si sposa divinamente con la confettura di fichi e il brie 🥓",
    "La rucola fresca dona una nota amarognola che pulisce la bocca dalla dolcezza del fico 🌱",
    "Scaglie di Grana Padano per contrastare la dolcezza avvolgente degli ingredienti 🧀",
    "La senape di Digione in piccole dosi esalta il contrasto dolce-salato di questa pizza — fico, brie e senape sono un triangolo perfetto 🍯",
  ],
  'calzone classico': [
    "L'aggiunta di carciofi e olive lo trasforma in un perfetto Calzone Capriccioso 🫒",
    "La ricotta all'interno rende il ripieno di cotto e funghi morbido e vellutato 🧀",
    "Una grattugiata di Grana Padano all'interno intensifica il sapore del prosciutto 🧀",
  ],
  'calzone piccante': [
    "I funghi misti donano consistenza e profumo all'interno 🍄",
    "La cipolla di Tropea mitiga la piccantezza del salamino con una nota zuccherina 🧅",
    "Una spolverata di Grana Padano lega la ricotta con il salume 🧀",
  ],
  'calzone vegeta': [
    "Il brie o gorgonzola filante all'interno dà una marcia in più alle verdure 🧀",
    "Pomodori secchi e olive nere arricchiscono le verdure con note sapide e intense 🫒",
    "La philadelphia all'interno crea un ripieno cremoso e leggero 🧀",
  ],
  'calzone poro mauretto': [
    "I porcini all'interno lo rendono definitivo 🍄",
    "La scamorza rende la cascata di ingredienti ancora più filante 🔥",
    "Un tocco di cipolla di Tropea ne esalta la complessa sapidità 🧅",
  ],
  'calzone ade': [
    "Il prosciutto crudo inserito all'uscita sopra il calzone caldo — la perfezione assoluta 🍖",
    "Le noci all'interno creano un contrasto croccante spettacolare con brie fuso e tartufo 🥜",
    "Una spolverata extra di Grana Padano all'interno sigilla questo calzone tra i più intensi del menù 🧀",
  ],
};

// Abbinamenti senape di Digione
const ABB_SENAPE = [
  "La senape di Digione sulla pizza ai **quattro formaggi** è una combo agrodolce devastante — la grassezza dei formaggi vuole quella nota pungente che pulisce il palato e bilancia tutto 🍯",
  "Sulla **Silvia** (porchetta, gorgonzola, miele) la senape di Digione è già protagonista — è lì che dà il meglio di sé, creando quell'equilibrio dolce-amaro-sapido unico 🍯",
  "Sulla **Parma** o su qualsiasi pizza con prosciutto crudo, un filo di senape di Digione a fine cottura esalta il salato del crudo con una nota agrodolce irresistibile 🍯",
  "Sulla **Speck** la senape di Digione funziona benissimo — affumicato e piccante-dolce si incontrano in un abbinamento da montagna 🍯",
  "Sulla **Cri** (salsiccia, brie erborinato, noci, fichi) la senape di Digione chiude il cerchio — fico, brie e senape sono un triangolo di sapori perfetto 🍯",
  "Su una pizza con **porchetta trevigiana** tipo la Montello o la Capricciosa Sbagliata, la senape di Digione ammorbidisce la grassezza della carne e regala quella nota agrodolce che sorprende 🍯",
];

function getRispostaAbbinamento(nomePizza){
  const k = nomePizza.toLowerCase();
  const lista = ABB_PIZZA[k];
  if(!lista || lista.length===0) return null;
  return lista[Math.floor(Math.random()*lista.length)];
}

function getRispostaSenape(){
  return ABB_SENAPE[Math.floor(Math.random()*ABB_SENAPE.length)];
}

// ============================================================
const ING_ALIAS = {
  'provola':'scamorza', 'provola affumicata':'scamorza', 'scamorza affumicata':'scamorza',
  'provolone':'scamorza', 'provlone':'scamorza', 'provoletta':'scamorza',
  'scamorzza':'scamorza', 'scamorz':'scamorza',
  'nduja':'nduja','nduglia':'nduja','ndugja':'nduja',
  'salame':'salamino piccante','salami':'salamino piccante',
  'salamino':'salamino piccante','salaminino':'salamino piccante',
  'salamine':'salamino piccante','salmino':'salamino piccante',
  'salamio':'salamino piccante','salaminoo':'salamino piccante',
  'salamino piccante':'salamino piccante',
  'prosciutto':'prosciutto cotto','p.cotto':'prosciutto cotto',
  'p cotto':'prosciutto cotto','pcotto':'prosciutto cotto',
  'p.crudo':'prosciutto crudo','p crudo':'prosciutto crudo','pcrudo':'prosciutto crudo',
  'fung':'funghi','funghetti':'funghi','fungo':'funghi',
  'funghi mist':'funghi misti',
  'pom.':'pomodoro','pomodo':'pomodoro',
  'pomodorino':'pomodorini','datterini':'pomodorini datterini conditi',
  'datteri':'pomodorini datterini conditi',
  'pom secchi':'pomodori secchi','pom.secchi':'pomodori secchi',
  'pomodori secch':'pomodori secchi',
  'mozz':'mozzarella','mozz.':'mozzarella',
  'filadelfia':'philadelphia','filadel':'philadelphia',
  'grana a scagli':'grana','grana scagli':'grana',
  'cipollaa':'cipolla','cipollina':'cipolla',
  'wurstel':'wurstel di suino','wurstell':'wurstel di suino',
  'salsicia':'salsiccia','salsicca':'salsiccia',
  'pancetta':'pancetta dolce',
  'speck':'speck alto adige',
  'porchetta':'porchetta trevigiana',
  'bresaolaa':'bresaola',
  'rucol':'rucola','ruggine':'rucola',
  'tartufo':'crema al tartufo','crema tartufo':'crema al tartufo',
  'salsa tartufo':'salsa al tartufo',
  'bbq':'salsa bbq',
  'porcin':'porcini',
  'melanzana':'melanzane',
  'peperone':'peperoni','peperoncino':'peperoni',
  'zucchin':'zucchine',
  'granoturco':'mais',
  'friariell':'friarielli','friarelli':'friarielli','broccoli di rapa':'friarielli',
  'noce':'noci',
  'buffala':'bufala',
  'acciuga':'acciughe','alice':'acciughe','alici':'acciughe',
  'carciofo':'carciofi',
  'patate':'patate fritte','patatine':'patate fritte',
  'verdure':'verdure miste grigliate','verdura':'verdure miste grigliate',
  'basilico':'basilico fresco',
  'olio':'olio evo',
  'senape':'senape e miele','senape miele':'senape e miele','miele':'senape e miele',
  'confettura':'confettura di fichi','fichi':'confettura di fichi',
  'spinaco':'spinaci',
  // stagionali
  'burratina':'burrata','burratta':'burrata',
  'asparago':'asparagi','aspareg':'asparagi',
  'zuccca':'zucca','crema zucca':'crema di zucca','vellutata zucca':'crema di zucca',
  'patate forno':'patate al forno','patate arrosto':'patate al forno','patatine al forno':'patate al forno',
  'radicch':'radicchio','radicchio rosso':'radicchio',
};

// ============================================================
// FRITTI
// ============================================================
const FRITTI = {
  'olive ascolane':    { prezzo:6,   qty:'10pz', fritino:true  },
  'mozzarelline':      { prezzo:6,   qty:'10pz', fritino:true  },
  'nuggets':           { prezzo:6,   qty:'10pz', fritino:true  },
  'crocchette':        { prezzo:6,   qty:'10pz', fritino:true  },
  'anellini di cipolla':{ prezzo:3.5, qty:'10pz', fritino:true  },
  'verdure pastellate':{ prezzo:4,   qty:'porzione', fritino:false },
  'patate fritte':     { prezzo:3.5, qty:'porzione', fritino:false },
  'misto frittico':    { prezzo:15,  qty:'4pz tutto + patate + verdure pastellate', fritino:false },
};
const FRITTI_ALIAS = {
  'olive':'olive ascolane','olives':'olive ascolane',
  'mozzarellina':'mozzarelline','mozzarelle':'mozzarelline',
  'nugget':'nuggets','nugghets':'nuggets',
  'crocchetta':'crocchette','crocchettine':'crocchette',
  'anellini':'anellini di cipolla','anellino':'anellini di cipolla',
  'cipolla fritta':'anellini di cipolla',
  'verdure pastellat':'verdure pastellate',
  'patate':'patate fritte','patatine':'patate fritte',
  'frittico':'misto frittico','misto':'misto frittico',
};

// ============================================================
// UTILS
// ============================================================
function norm(s){ return String(s).toLowerCase().replace(/[àáâä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i').replace(/[òóôö]/g,'o').replace(/[ùúûü]/g,'u').replace(/'/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function fmtE(n){ return Number(n).toFixed(2).replace('.',','); }
function fmt(t){ return esc(t).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/(\d+)\s*kcal/gi,'<span class="cal-box">$1 kcal</span>').replace(/(\d+[,\.]\d+)€/g,'<span class="price-box">$1€</span>').replace(/\n/g,'<br>'); }
function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ============================================================
// ALIAS PIZZA (typo/abbreviazioni → nome canonico in PIZZE)
// ============================================================
const PIZZA_ALIAS = {
  'salsiccia e friarielli':'ciccia e friarielli',
  'salsiccia friarielli':'ciccia e friarielli',
  'ciccia friarielli':'ciccia e friarielli',
  // Abbreviazioni comuni
  'capri sbag':'capricciosa sbagliata',
  'capri sbagh':'capricciosa sbagliata',
  'capricciosa sbag':'capricciosa sbagliata',
  'capri sbagliata':'capricciosa sbagliata',
  'capri':'capricciosa',
  'capricciosa sbagliata':'capricciosa sbagliata',
  'quattro stag':'quattro stagioni',
  '4 stag':'quattro stagioni',
  'quattro formaggi':'formaggi',
  '4 formaggi':'formaggi',
  'prosciutto funghi':'prosciutto e funghi',
  'proscuitto funghi':'prosciutto e funghi',
  'tonno cip':'tonno e cipolla',
  'tonno cipolla':'tonno e cipolla',
  'calzone clas':'calzone classico',
  'calzone pic':'calzone piccante',
  'calzone veg':'calzone vegeta',
  'calzone poro':'calzone poro mauretto',
  'ciccia fri':'ciccia e friarielli',
  'sfiziosa':'sfiziosa',
  'rep':'repubblica',
  'repub':'repubblica',
  'amat':'amatriciana',
  'boscaiol':'boscaiola',
  'tartuf':'tartufata',
  'parmig':'parmigiana',
  'montello battuta':'montello',
  'montello doppia':'montello',
  '4 formaggi':'formaggi',
  'pizza salsiccia piccante':'pps',
  'p.p.s.':'pps',
  '4formaggi':'formaggi',
  'quattro formaggi':'formaggi',
  '4 stagioni':'quattro stagioni',
  '4stagioni':'quattro stagioni',
  '4stagioni':'quattro stagioni','4 stagioni':'quattro stagioni','quatrostagioni':'quattro stagioni',
  'quattrostagioni':'quattro stagioni','4stag':'quattro stagioni',
  'titty':'titti','titties':'titti','tity':'titti','titty':'titti',
  'marcherita':'margherita','margerita':'margherita','marghertia':'margherita',
  'margheita':'margherita','margheritaa':'margherita',
  'diavola piccante':'diavola',
  'salsicia':'salsiccia','salciccia':'salsiccia','salsicca':'salsiccia',
  'vieneese':'viennese','vienese':'viennese','vienness':'viennese',
  'puglieese':'pugliese','pugliesse':'pugliese',
  'capriccosa':'capricciosa','capricciossa':'capricciosa','capricosa':'capricciosa',
  'capriciosa':'capricciosa','caprcciosa':'capricciosa','capricoisa':'capricciosa',
  'tonno cipolla':'tonno e cipolla','tonno e cipollaa':'tonno e cipolla',
  'bufalla':'bufala','buffala':'bufala',
  '4 stagioni':'quattro stagioni','quattrostagioni':'quattro stagioni','quattro stagion':'quattro stagioni',
  'romanna':'romana',
  'sicilinana':'siciliana','sicilana':'siciliana','sicilaiana':'siciliana',
  'patatossa':'patatosa',
  'prosciutto funghi':'prosciutto e funghi','prosciutto e fungo':'prosciutto e funghi',
  'montelo':'montello',
  'valtelina':'valtellina','valtellinna':'valtellina',
  'parmiggiana':'parmigiana','parmigian':'parmigiana',
  'ciccia friarielli':'ciccia e friarielli','ciccia e friarelli':'ciccia e friarielli',
  'ciccia friarelli':'ciccia e friarielli','ciccia friariell':'ciccia e friarielli',
  'formagi':'formaggi','formaggio':'formaggi',
  'sfizosa':'sfiziosa','sfisiosa':'sfiziosa',
  'bosscaiola':'boscaiola','boscaola':'boscaiola','boscaiolaa':'boscaiola',
  'tartuftata':'tartufata','tartuffata':'tartufata',
  'republica':'repubblica','repubblika':'repubblica',
  'capricciosa sbagliata':'capricciosa sbagliata',
  'capri sbagliata':'capricciosa sbagliata','cap sbagliata':'capricciosa sbagliata',
  'capricciosa sbagliatta':'capricciosa sbagliata',
  'capricciosa-sbagliata':'capricciosa sbagliata',
  'amatricana':'amatriciana','amatricanna':'amatriciana',
  'calzone mauretto':'calzone poro mauretto',
  'calzone poro':'calzone poro mauretto',
  'calzone ade':'calzone ade',
  'calzone piccante':'calzone piccante',
  'calzone classico':'calzone classico',
  'calzone vegeta':'calzone vegeta',
  // plurali comuni
  'margherite':'margherita','diavole':'diavola','salsicce':'salsiccia',
  'capricciose':'capricciosa','romane':'romana','bufaline':'bufalina',
  'bufaline':'bufalina','patatose':'patatosa','boscaiole':'boscaiola',
  'tartufate':'tartufata','repubbliche':'repubblica','amatriciane':'amatriciana',
  'quattro stagioni':'quattro stagioni','viennesi':'viennese',
  'pugliesi':'pugliese','siciliane':'siciliana','normine':'norma',
  'marinare':'marinara','wande':'wanda','wilme':'wilma','leoni':'leone',
  'pazze':'pazza','onte':'onta','mike':'mike',
};

// ============================================================
// LOOKUP PIZZA — alias espliciti + lista PIZZE, nessun fuzzy
// ============================================================
function trovaNomePizza(input){
  const t = norm(input);
  // 1. alias esatto
  for(const [a,c] of Object.entries(PIZZA_ALIAS)) if(t===norm(a)) return c;
  // 2. nome pizza esatto
  for(const n of Object.keys(PIZZE)) if(t===norm(n)) return n;
  // 3. alias contenuto (più lungo prima)
  for(const [a,c] of Object.entries(PIZZA_ALIAS).sort((x,y)=>y[0].length-x[0].length))
    if(t.includes(norm(a))) return c;
  // 4. nome pizza contenuto (più lungo prima)
  for(const n of Object.keys(PIZZE).sort((a,b)=>b.length-a.length))
    if(t.includes(norm(n))) return n;
  return null;
}

// ============================================================
// LOOKUP INGREDIENTE — alias espliciti + lista ING, nessun fuzzy
// ============================================================
function trovaNomeIng(s){
  const t = norm(s);
  if(ING[s]) return s;
  for(const [a,c] of Object.entries(ING_ALIAS)) if(t===norm(a)) return c;
  for(const n of Object.keys(ING)) if(t===norm(n)) return n;
  for(const [a,c] of Object.entries(ING_ALIAS).sort((x,y)=>y[0].length-x[0].length))
    if(t.includes(norm(a))) return c;
  for(const n of Object.keys(ING).sort((a,b)=>b.length-a.length))
    if(t.includes(norm(n))) return n;
  return null;
}

// ============================================================
// ESTRAI RIMOZIONI ("senza X", "no X")
// ============================================================
function estraiRimozioni(t){
  const rimossi=[];
  const re=/senza\s+([a-zA-Zàèìòùé\s]+?)(?:\s+e\s+(?!anche)|\s*,\s*|\s+con\s+|\s+aggiungi\s+|$)/gi;
  let m;
  while((m=re.exec(t))!==null){
    const parti = m[1].split(/\s+e\s+|\s*,\s*/);
    for(const p of parti){
      const i=trovaNomeIng(p.trim());
      if(i&&!rimossi.includes(i)) rimossi.push(i);
    }
  }
  return rimossi;
}

// ============================================================
// ESTRAI AGGIUNTE ("con X", "aggiungi X", "e anche X")
// ============================================================
function estraiAggiunte(t){
  const aggiunte=[];
  // Cerca "con X e Y" o "aggiungi X" ma NON dopo "senza"
  const re=/(?:(?<!senza\s)con|aggiungi|e anche|extra)\s+([a-zA-Zàèìòùé\s]+?)(?:\s+senza|\s*,\s*che|\s*$)/gi;
  let m;
  while((m=re.exec(t))!==null){
    const parti = m[1].split(/\s+e\s+|\s*,\s*/);
    for(const p of parti){
      const i=trovaNomeIng(p.trim());
      if(i&&!aggiunte.includes(i)) aggiunte.push(i);
    }
  }
  return aggiunte;
}

// ============================================================
// CERCA PIZZA NEL MENU con stesso set di ingredienti
// (usato per suggerire pizza corrispondente dopo modifica)
// ============================================================
function cercaPizzaCorrispondente(ingFinali, escludiNome){
  const target = ingFinali.map(i=>norm(i)).sort();
  for(const [nome,dati] of Object.entries(PIZZE)){
    if(nome===escludiNome) continue;
    const piz = dati.ing.map(i=>norm(i)).sort();
    if(piz.length===target.length && piz.every((v,i)=>v===target[i])) return nome;
  }
  return null;
}

// ============================================================
// RISPOSTA PIZZA CON MODIFICATORI
// ============================================================
function rispostaPizza(nomePizza, rimozioni, aggiunte, formato){
  const pizza = PIZZE[nomePizza];
  if(!pizza) return null;
  const nd = nomePizza.charAt(0).toUpperCase()+nomePizza.slice(1);
  let ingAttuali = [...pizza.ing];
  let kcal = pizza.kcal;
  let prezzo = pizza.prezzo;
  const noteRim=[], noteAgg=[], avvisi=[];

  // Applica rimozioni
  for(const r of rimozioni){
    const idx = ingAttuali.findIndex(i=>norm(i)===norm(r)||trovaNomeIng(i)===r);
    if(idx!==-1){
      const ingCanon = trovaNomeIng(ingAttuali[idx])||ingAttuali[idx];
      ingAttuali.splice(idx,1);
      const dati = ING[ingCanon]||ING[r];
      if(dati){ kcal-=dati.kcal; prezzo-=dati.prezzo; }
      noteRim.push(r);
    } else {
      avvisi.push('"'+r+'" non è nella '+nd+' di menù');
    }
  }

  // Applica aggiunte
  for(const a of aggiunte){
    const giaPresente = ingAttuali.some(i=>norm(i)===norm(a)||trovaNomeIng(i)===a);
    if(!giaPresente){
      ingAttuali.push(a);
      const dati = ING[a];
      if(dati){ kcal+=dati.kcal; prezzo+=dati.prezzo; noteAgg.push(a+' (+'+fmtE(dati.prezzo)+'€)'); }
      else noteAgg.push(a);
    }
    // se già presente non avvisare — è ovvio
  }

  // Formato
  const noteFormato=[];
  if(formato.battuta){ prezzo+=2; noteFormato.push('battuta +2€'); }
  if(formato.doppiaPasta){ kcal+=675; prezzo+=1; noteFormato.push('doppia pasta +1€ +675 kcal'); }
  if(formato.baby){ prezzo-=0.5; noteFormato.push('baby -0,50€'); }

  kcal=Math.round(kcal); prezzo=Math.round(prezzo*100)/100;

  // Tipo pizza
  const tipoStr = pizza.tipo==='arrotolata' ? ' 🥙 arrotolata' : pizza.tipo==='calzone' ? ' 🫓 calzone' : '';
  let msg = '**'+nd+'**'+tipoStr+' 🍕\n';
  if(noteRim.length) msg+='🚫 Senza: '+noteRim.join(', ')+'\n';
  if(noteAgg.length) msg+='➕ Con: '+noteAgg.join(', ')+'\n';
  if(noteFormato.length) msg+='📝 '+noteFormato.join(' · ')+'\n';
  msg+='\nCalorie: **'+kcal+' kcal** · Prezzo: **'+fmtE(prezzo)+'€**';
  if(avvisi.length) msg+='\n\n⚠️ '+avvisi.join('\n⚠️ ');

  // Suggerisci pizza corrispondente se esiste
  if(rimozioni.length>0||aggiunte.length>0){
    const match = cercaPizzaCorrispondente(ingAttuali, nomePizza);
    if(match){
      const md = match.charAt(0).toUpperCase()+match.slice(1);
      msg+='\n\n💡 Questa combo esiste già nel menù: **'+md+'** ('+PIZZE[match].kcal+' kcal · '+fmtE(PIZZE[match].prezzo)+'€)!';
    }
  }
  return msg;
}

// ============================================================
// COMPOSIZIONE LIBERA DA INGREDIENTI (nessun nome pizza trovato)
// ============================================================
function rispostaIngredentiLiberi(input){
  const t = norm(input);
  const ingTrovati=[];
  // cerca alias (più lungo prima)
  for(const [a,c] of Object.entries(ING_ALIAS).sort((x,y)=>y[0].length-x[0].length))
    if(t.includes(norm(a))&&!ingTrovati.includes(c)) ingTrovati.push(c);
  // cerca nomi diretti (più lungo prima)
  for(const n of Object.keys(ING).sort((a,b)=>b.length-a.length))
    if(t.includes(norm(n))&&!ingTrovati.includes(n)) ingTrovati.push(n);
  if(ingTrovati.length<1) return null;

  // Cerca pizza con >= 80% ingredienti in comune
  let bestMatch=null, bestScore=0;
  for(const [nome,dati] of Object.entries(PIZZE)){
    const pn = dati.ing.map(i=>norm(i));
    const tn = ingTrovati.map(i=>norm(i));
    const comuni = tn.filter(i=>pn.includes(i));
    const score = comuni.length/tn.length;
    if(score>bestScore&&score>=0.8){ bestScore=score; bestMatch=nome; }
  }

  if(bestMatch){
    const pizza=PIZZE[bestMatch];
    const nd=bestMatch.charAt(0).toUpperCase()+bestMatch.slice(1);
    const pn=pizza.ing.map(i=>norm(i));
    const tn=ingTrovati.map(i=>norm(i));
    const mancanti=pizza.ing.filter(i=>!tn.includes(norm(i)));
    let msg='Con **'+ingTrovati.join(', ')+'** la pizza perfetta è la **'+nd+'** 🍕\n';
    msg+='Ingredienti: '+pizza.ing.join(', ')+'\n';
    msg+='\n**'+pizza.kcal+' kcal** · **'+fmtE(pizza.prezzo)+'€**';
    return msg;
  }

  // Calcola composizione custom da base 6€ — usa la funzione centralizzata
  ultimaSuggestione = null;
  const customResult = calcolaPizzaCustom(ingTrovati);
  ultimaSuggestione = { nome: customResult.nome, prezzo: customResult.prezzo, kcal: customResult.kcal, ings: customResult.ings };
  let msg='Questa combo non è nel menù, ma la faccio così 🍕\n';
  msg+='**'+customResult.nome+'**\nBase: pomodoro, mozzarella + '+customResult.ings.join(', ')+'\n';
  msg+='\n**'+customResult.kcal+' kcal** · **'+fmtE(customResult.prezzo)+'€**';
  if(customResult.nonDisp.length) msg+='\n\n⚠️ Non disponibile ora: '+customResult.nonDisp.join(', ');
  msg+='\n\n💡 Se ti va bene scrivi "ok mi sta bene" per confermare!';
  return msg;
}

// ============================================================
// RISPOSTE FISSE
// ============================================================
function rispostaFritti(){
  return 'I nostri fritti 🍟\n• Olive ascolane / Mozzarelline / Nuggets / Crocchette: **6,00€** (10pz)\n• Anellini di cipolla: **3,50€** (10pz)\n• Verdure pastellate: **4,00€**\n• Patate fritte: **3,50€**\n• Misto Frittico (4pz di tutto + patate + verdure): **15,00€**\n\n🐧 Con ogni pizza puoi aggiungere un **Fritino da 5pz misti a 2,50€** (olive, mozzarelline, nuggets, crocchette, anellini) — escluso patate, verdure e alette!';
}
function rispostaLeggera(){
  const lista=[['estate',8],['marinara',5],['bufalina',10],['repubblica',11.5],['valtellina',10.5],['ciccia e friarielli',9]];
  let msg='Le pizze più leggere 🥗\n\n';
  for(const [nome,_] of lista){
    const p=PIZZE[nome]; const nd=nome.charAt(0).toUpperCase()+nome.slice(1);
    msg+='**'+nd+'** — '+p.kcal+' kcal · '+fmtE(p.prezzo)+'€\n'+p.ing.join(', ')+'\n\n';
  }
  msg+='La più leggera: **Estate** con solo 950 kcal! 🌿';
  return msg;
}
function rispostaAggiunte(){
  return 'Prezzi aggiunte su pizza 🧾\n• **0,50€**: pomodoro, capperi\n• **1,00€**: cipolla, funghi, mais, wurstel, p.cotto, pesto, zucchine, peperoni, rucola, bbq, spinaci, noci\n• **1,50€**: mozzarella, salamino, olive, acciughe, carciofi, ricotta, patate, gorgonzola, brie, scamorza, grana, friarielli, philadelphia, melanzane\n• **2,00€**: salsiccia, tonno, tartufo, pom.secchi\n• **2,50€**: porcini, pancetta, verdure miste\n• **3,00€**: bufala, porchetta, bresaola, p.crudo, speck\n\n📝 **Formati**: Battuta +2€ | Doppia pasta +1€ | Baby -0,50€\nAggiunte su battuta: +0,50€ extra ogni aggiunta';
}

// ============================================================
// ENTRY POINT — parse e risposta locale
// ============================================================
// CATEGORIE INGREDIENTI — parole generiche → lista canonici
// ============================================================
const CATEGORIE = {
  'pesce':      ['acciughe','tonno'],
  'mare':       ['acciughe','tonno'],
  'salumi':     ['salamino piccante','salsiccia','prosciutto cotto','prosciutto crudo','pancetta dolce','speck alto adige','porchetta trevigiana','bresaola'],
  'salume':     ['salamino piccante','salsiccia','prosciutto cotto','prosciutto crudo','pancetta dolce','speck alto adige','porchetta trevigiana','bresaola'],
  'carne':      ['salsiccia','porchetta trevigiana','pancetta dolce'],
  'formaggi':   ['gorgonzola','brie','scamorza','philadelphia','bufala','ricotta','stracchino'],
  'formaggio':  ['gorgonzola','brie','scamorza','philadelphia','bufala','ricotta','stracchino'],
  'verdure':    ['verdure miste grigliate','melanzane','melanzane fritte','zucchine','peperoni','carciofi','spinaci','friarielli'],
  'verdura':    ['verdure miste grigliate','melanzane','melanzane fritte','zucchine','peperoni','carciofi','spinaci','friarielli'],
  'piccante':   ['salamino piccante','salsiccia','peperoni'],
  'tartufo':    ['crema al tartufo','salsa al tartufo'],
  'funghi':     ['funghi','funghi misti','porcini'],
  'pomodori':   ['pomodorini','pomodorini datterini conditi','pomodori secchi'],
  'affettati':  ['prosciutto cotto','prosciutto crudo','bresaola','speck alto adige'],
  'stagionati': ['prosciutto crudo','bresaola','speck alto adige'],
};

// ============================================================
// TAG ALIAS — sinonimi → tag canonico
// ============================================================
const TAG_ALIAS = {
  // leggera
  'leggera':'leggera','leggere':'leggera','leggero':'leggera','leggeri':'leggera','light':'leggera','dietetica':'leggera','poco calorica':'leggera',
  'non pesante':'leggera','leggerino':'leggera','leggerissima':'leggera','leggerino':'leggera','leggera leggera':'leggera',
  // pesante — quantità e consistenza
  'pesante':'pesante','pesanti':'pesante','carica':'pesante','cariche':'pesante',
  'calorica':'pesante','caloriche':'pesante','abbondante':'pesante','abbondanti':'pesante',
  'piena':'pesante','caricata':'pesante','carichissimo':'pesante','carichissima':'pesante',
  'imbottito':'pesante','imbottita':'pesante','strapieno':'pesante','strapiena':'pesante',
  'super farcito':'pesante','super farcita':'pesante','strabordante':'pesante',
  'colante':'pesante','grondante':'pesante','esoso':'pesante','pieno di roba':'pesante',
  'tanta roba':'pesante','esagerata':'pesante','esagerate':'pesante',
  // potente — sapore
  'potente':'potente','potenti':'potente','saporita':'potente','saporite':'potente',
  'saporito':'potente','sapido':'potente','sapida':'potente','sapidissimo':'potente',
  'gustoso':'potente','gustosa':'potente','gustosissimo':'potente',
  'ricco di sapore':'potente','aromatico':'potente','aromatica':'potente',
  'profumato':'potente','profumata':'potente','speziato':'potente','speziata':'potente',
  'deciso':'potente','decisa':'potente','intenso':'potente','intensa':'potente',
  'persistente':'potente','esplosivo':'potente','esplosiva':'potente','umami':'potente',
  'pungente':'potente','sapore forte':'potente','carattere':'potente',
  'saporosa':'potente','intensa':'potente','decisa':'potente',
  // onto — grasso e succulento
  'onto':'onto','unta':'onto','untuosa':'onto','untuoso':'onto','unto':'onto',
  'oleoso':'onto','oleosa':'onto','grasso':'onto','grassa':'onto','grassosa':'onto',
  'burroso':'onto','burrosa':'onto','scioglievole':'onto','filante':'onto',
  'cremoso':'onto','cremosa':'onto','vellutato':'onto','vellutata':'onto',
  'succoso':'onto','succosa':'onto','succulento':'onto','succulenta':'onto',
  'umido':'onto','umida':'onto','colante formaggio':'onto','che cola':'onto',
  // potente
  'potente':'potente','potenti':'potente','saporita':'potente','saporite':'potente',
  'intensa':'potente','intense':'potente','decisa':'potente','decise':'potente',
  'saporosa':'potente','carattere':'potente','sapore forte':'potente','potent':'potente',
  // piccante
  'piccante':'piccante','piccanti':'piccante','piccantina':'piccante','speziata':'piccante',
  'speziate':'piccante','che pizzica':'piccante',
  // goduriosa — slang e sensoriale
  'goduriosa':'goduriosa','goduriose':'goduriosa','godurioso':'goduriosa','goduri':'goduriosa',
  'ignorante':'goduriosa','ignoranti':'goduriosa',
  'bomba':'goduriosa','bombe':'goduriosa','atomico':'goduriosa','atomica':'goduriosa',
  'epico':'goduriosa','epica':'goduriosa','illegale':'goduriosa','criminale':'goduriosa',
  'peccaminoso':'goduriosa','peccaminosa':'goduriosa','vizioso':'goduriosa','viziosa':'goduriosa',
  'libidinoso':'goduriosa','orgasmico':'goduriosa','orgasmica':'goduriosa',
  'devastante':'goduriosa','micidiale':'goduriosa','spettacolare':'goduriosa',
  'assurdo':'goduriosa','assurda':'goduriosa','sfondante':'goduriosa',
  'zozzo':'goduriosa','zozza':'goduriosa','tamarro':'goduriosa','tamarra':'goduriosa',
  'over':'goduriosa','xxl':'goduriosa','hardcore':'goduriosa','heavy':'goduriosa','devasto':'goduriosa',
  'cheat meal':'goduriosa','sgarro':'goduriosa','botta calorica':'goduriosa',
  'guilty pleasure':'goduriosa','peccato di gola':'goduriosa','comfort food':'goduriosa',
  'coccoloso':'goduriosa','godereccio':'goduriosa','goderecci':'goduriosa',
  'craving':'goduriosa','munchies':'goduriosa','fame chimica':'goduriosa',
  'attacco di fame':'goduriosa','fame notturna':'goduriosa',
  'irresistibile':'goduriosa','irresistibili':'goduriosa','appagante':'goduriosa','appaganti':'goduriosa',
  'da sbranare':'goduriosa','da divorare':'goduriosa','da impazzire':'goduriosa',
  'una tira l altra':'goduriosa','addictive':'goduriosa','crea dipendenza':'goduriosa',
  'dipendenza':'goduriosa','sfizioso':'goduriosa','sfiziosita':'goduriosa',
  'livello goduria massimo':'goduriosa','soddisfazione pura':'goduriosa',
  'esplosione di gusto':'goduriosa','colpo al palato':'goduriosa','botta di gusto':'goduriosa',
  // elegante
  'elegante':'elegante','eleganti':'elegante','raffinata':'elegante','raffinate':'elegante',
  'gourmet':'elegante','ricercata':'elegante','ricercate':'elegante',
  'sofisticata':'elegante','sofisticate':'elegante','fine':'elegante','di qualita':'elegante',
  // dolcesalato / agrodolce
  'dolcesalato':'dolcesalato','agrodolce':'dolcesalato','dolce e salato':'dolcesalato',
  'contrasto':'dolcesalato','insolita':'dolcesalato',
  // vegetariana
  'vegetariana':'vegetariana','vegeta':'vegetariana','senza carne':'vegetariana',
  'verdure':'vegetariana','vegetale':'vegetariana',
  // fresca / estiva
  'fresca':'fresca','estiva':'fresca','leggera e fresca':'fresca','di stagione':'fresca',
  'primaverile':'fresca','leggera estiva':'fresca',
  // formaggiosa
  'formaggiosa':'formaggiosa','coi formaggi':'formaggiosa','tanto formaggio':'formaggiosa',
  'formaggina':'formaggiosa','formaggiata':'formaggiosa',
  // tartufo
  'tartufo':'tartufo','tartufata':'tartufo','al tartufo':'tartufo',
  // carnivora
  'carnivora':'carnivora','con la carne':'carnivora','carne':'carnivora',
  'salumi':'carnivora','con i salumi':'carnivora',
  // mare / pesce
  'mare':'mare','pesce':'mare','marinara':'mare','frutti di mare':'mare',
  // fume / affumicata
  'affumicata':'fume','fumosa':'fume','affumicato':'fume',
  // bbq
  'bbq':'bbq','barbeque':'bbq','grigliate':'bbq',
  // rustica
  'rustica':'rustica','contadina':'rustica','genuina':'rustica','tradizionale':'rustica',
  // classica
  'classica':'classica','semplice':'classica','tradizionale':'classica',
  // stagionata
  'stagionata':'stagionata','salumi stagionati':'stagionata',
};


const NON_ABBIAMO = ['uovo','uova','ananas','patate dolci','carciofo fresco','gamberi','gamberetti','cozze','vongole','capesante','salmone','baccala','stoccafisso','feta','taleggio','caciocavallo','provola','scamorza affumicata'];


// ============================================================
// FRITTINI — upsell nel flusso ordine
// ============================================================
const FRITTINI = {
  'olive ascolane':    { pz10: 6.00, promo: true },
  'mozzarelline':      { pz10: 6.00, promo: true },
  'nuggets pollo':     { pz10: 6.00, promo: true },
  'crocchettine patate':{ pz10: 6.00, promo: true },
  'anellini di cipolla':{ pz10: 3.50, promo: true },
  'verdure pastellate':{ pz10: 4.00, promo: false },
  'patate fritte':     { pz10: 3.50, promo: false },
  'alette di pollo':   { pz10: 5.50, promo: false },
};


// ============================================================
// BIBITE E BIRRE
// ============================================================
const BIBITE = {
  // Analcoliche
  'bibita analcolica':  { prezzo: 2.50, tipo: 'analcolica', label: 'Bibita analcolica 33cl' },
  'coca cola':          { prezzo: 2.50, tipo: 'analcolica', label: 'Coca-Cola 33cl' },
  'fanta':              { prezzo: 2.50, tipo: 'analcolica', label: 'Fanta 33cl' },
  'sprite':             { prezzo: 2.50, tipo: 'analcolica', label: 'Sprite 33cl' },
  'lemonsoda':          { prezzo: 2.50, tipo: 'analcolica', label: 'Lemonsoda 33cl' },
  // Birre lattina
  'birra lattina':      { prezzo: 2.50, tipo: 'lattina', label: 'Birra lattina 33cl' },
  // Birre bottiglia
  'birra 33cl':         { prezzo: 3.50, tipo: 'bottiglia', label: 'Birra bottiglia 33cl' },
  'birra 50cl':         { prezzo: 3.50, tipo: 'bottiglia', label: 'Birra bottiglia 50cl' },
  'franziskaner':       { prezzo: 3.50, tipo: 'bottiglia', label: 'Franziskaner 50cl' },
  'tuborg':             { prezzo: 3.50, tipo: 'bottiglia', label: 'Tuborg 66cl' },
  'birra 66cl':         { prezzo: 3.50, tipo: 'bottiglia', label: 'Birra bottiglia 66cl' },
  // Birra litro
  'birra litro':        { prezzo: 6.00, tipo: 'litro', label: 'Birra da 1 litro' },
};

// Alias bibite per riconoscimento con errori
const BIBITE_ALIAS = {
  'cocacola':'coca cola','coca':'coca cola','coka':'coca cola','coca cola':'coca cola',
  'fanta':'fanta','fanta arancia':'fanta',
  'sprite':'sprite','spryte':'sprite',
  'lemonsoda':'lemonsoda','lemon soda':'lemonsoda','limonata':'lemonsoda',
  'birra litro':'birra litro','birra grande':'birra litro','birra 1 litro':'birra litro',
  'birra 066':'birra 66cl','birra 66cl':'birra 66cl','birra sessantasei':'birra 66cl',
  'birra 050':'birra 50cl','birra 50cl':'birra 50cl','birra cinquanta':'birra 50cl',
  'birra 033':'birra 33cl','birra 33cl':'birra 33cl',
  'birra 33':'birra 33cl','birra 50':'birra 50cl','birra 66':'birra 66cl','birra':'birra lattina','beer':'birra lattina','peroni':'birra lattina','moretti':'birra lattina',
  'birra in lattina':'birra lattina','lattina':'birra lattina',
  'franziskaner':'franziskaner','franzis':'franziskaner','franzi':'franziskaner',
  'franziskaner 50':'franziskaner','frate':'franziskaner','franzis':'franziskaner',
  'tuborg':'tuborg','tuborg 66':'tuborg','tuburgo':'tuborg','two burg':'tuborg',
  'birra grande':'birra litro','birra da litro':'birra litro','litro':'birra litro',
  'birra bottiglia':'birra 33cl','bottiglia':'birra 33cl',
  'acqua':'bibita analcolica','acqua naturale':'bibita analcolica','acqua frizzante':'bibita analcolica',
};

function trovaBibita(input){
  const t = norm(input);
  // Cerca alias dal più lungo al più corto per evitare match parziali
  const aliasOrdinati = Object.entries(BIBITE_ALIAS).sort((a,b)=>b[0].length-a[0].length);
  for(const [alias, key] of aliasOrdinati){
    if(t.includes(norm(alias))) return key;
  }
  // Cerca chiave diretta dal più lungo al più corto
  const keysOrdinate = Object.keys(BIBITE).sort((a,b)=>b.length-a.length);
  for(const key of keysOrdinate){
    if(t.includes(norm(key))) return key;
  }
  return null;
}

// ============================================================
// CURIOSITA' — chip 🐧 Curiosità
// ============================================================
const CURIOSITA = [
  "L'impasto di BoisPizza riposa almeno 48 ore prima di finire nel forno. Niente fretta, solo buona pizza 🍕",
  "Usiamo pomodoro fresco 100% italiano, coltivato con lotta integrata — pesticidi ridotti del 70% 🍅",
  "La mozzarella arriva dalla Latteria Diana: latte vaccino 100% italiano, in boccia, spaccata a mano in pizzeria 🧀",
  "Il lievito madre che usiamo ha anni di storia. Ogni pizza è diversa dall'altra, come le persone 🐧",
  "La pizza napoletana nasce a Napoli nel 1700. BoisPizza la fa a Casier (TV) dal 2019, ma col rispetto dovuto 🍕",
  "Il cornicione si gonfia così perché l'impasto è vivo — la maturazione lenta crea gas naturale durante la cottura 🔬",
  "La mozzarella buona non si mette in forno troppo presto: rischia di diventare gommosa. Noi sappiamo quando 🧀",
  "I funghi misti della Boscaiola vengono selezionati freschi — non in barattolo. Si sente alla prima forchettata 🍄",
  "La pizza al taglio è un'invenzione romana degli anni '60. La pizza tonda è molto più antica 📜",
  "Il forno a legna raggiunge i 450°C. La pizza cuoce in 60-90 secondi. Il pinguino non entra 🐧🔥",
  "La porchetta trevigiana nella Montello e nella Capricciosa Sbagliata viene da produttori locali del Trevigiano 🐷",
  "Accordi diretti con gli agricoltori = filiera corta = pomodoro che sa di pomodoro. Semplice 🍅",
  "La pizza fritta nasce come pizza povera: l'olio era più economico del forno a legna 🍳",
  "La bufala non va mai in forno troppo a lungo — si sfalda e perde cremosità. A fine cottura è tutta un'altra storia 🧀",
  "Sapevi che il mais sulla pizza è considerato un'eresia in Italia ma viene adorato nel resto del mondo? Noi lo mettiamo lo stesso 🌽",
  "La Valtellina ha la bresaola, le Alpi e pochissima pizza. Ma quando ci mettono la bresaola sopra, fanno centro 🏔️",
  "Il gorgonzola sulla pizza è un'idea del Nord Italia. Al Sud inorridiscono. Al Nord fanno il bis 🧀",
  "La pizza bianca — senza pomodoro — è più antica della margherita. Il pomodoro in Italia arriva nel '500 🍕",
  "Un pinguino non può fare la pizza. Troppo freddo alle pinne. Ma può ordinarla 🐧🍕",
];

function getCuriosita(){
  return CURIOSITA[Math.floor(Math.random()*CURIOSITA.length)];
}

// ============================================================
// DESCRIZIONI GOLOSE PIZZE
// ============================================================
const DESCRIZIONI_PIZZA = {
  'marinara':              ["Pomodoro, aglio e origano: essenziale ma immortale.","Profumata, intensa e sorprendentemente soddisfacente.","🐧 Il pinguino old school approva in silenzio."],
  'margherita':            ["Pomodoro e mozzarella fatti bene non stancano mai.","Filante, semplice e sempre perfetta.","🐧 Anche il pinguino la ordina 'solo per cambiare'."],
  'diavola':               ["Salamino piccante e mozzarella filante: semplice ma assassina.","Picca il giusto e crea dipendenza immediata.","🐧 Il pinguino suda ma non si ferma."],
  'salsiccia':             ["Salsiccia bella saporita sopra una base super filante.","Diretta, ignorante e sempre efficace.","🐧 Il pinguino approva senza fare domande."],
  'viennese':              ["Wurstel e mozzarella: la combo che mette tutti d'accordo.","Semplice, saporita e super nostalgica.","🐧 Il pinguino la mangia guardando i cartoni."],
  'pugliese':              ["Cipolla di Tropea dolce e profumata sopra una base perfetta.","Semplice ma con carattere vero.","🐧 Il pinguino piange… ma di gioia."],
  'prosciutto e funghi':   ["La classica intramontabile fatta come si deve.","Morbida, saporita e sempre soddisfacente.","🐧 Il pinguino la ordina 'per stare tranquillo'."],
  'capricciosa':           ["La classica fatta bene: cotto, funghi e carciofi super equilibrati.","Completa, saporita e sempre una garanzia.","🐧 Pizza cosi affidabile che il pinguino la ordina a occhi chiusi."],
  'tonno e cipolla':       ["Tonno e cipolla di Tropea: combo storica che non tradisce mai.","Saporita, intensa e piena di carattere.","🐧 Il pinguino la ordina quando vuole 'fare il duro'."],
  'bufala':                ["Pomodoro e bufala: semplice ma devastante se ami i sapori puliti.","Fresca, cremosa e super scioglievole.","🐧 Il pinguino approva con un slurp."],
  'bufalina':              ["Bufala cremosa e pomodorini freschi: fresca ma super golosa.","Leggera all'apparenza, ma crea dipendenza dopo due morsi.","🐧 Il pinguino la considera la pizza 'bella ma pericolosa'."],
  'quattro stagioni':      ["Un mix completo che cambia gusto a ogni fetta.","Ricca, varia e super appagante.","🐧 Il pinguino non sa mai da che lato iniziare."],
  'romana':                ["Acciughe e mozzarella: sapore deciso e super classico.","Salata il giusto e piena di personalita.","🐧 Il pinguino qui tira fuori il lato duro."],
  'siciliana':             ["Acciughe, capperi e olive: esplosione mediterranea pura.","Intensa, salata e super profumata.","🐧 Il pinguino la mangia con accento siculo."],
  'patatosa':              ["Patate fritte sopra la pizza: non serve dire altro.","Morbida, croccante e totalmente comfort.","🐧 Il pinguino la ordina nei giorni difficili."],
  'parma':                 ["Prosciutto crudo e mozzarella: pochi ingredienti ma fatti per vincere.","Sapida, elegante e super equilibrata.","🐧 Il pinguino la considera roba da professionisti."],
  'speck':                 ["Speck Alto Adige e mozzarella: affumicato che crea dipendenza.","Saporita, elegante e super equilibrata.","🐧 Il pinguino la difenderebbe con la vita."],
  'montello':              ["Porchetta trevigiana e porcini: profumo devastante appena arriva.","Morbida, intensa e super goduriosa.","🐧 Il pinguino qui perde ogni dignita."],
  'valtellina':            ["Bresaola, rucola e grana: fresca ma super saporita.","Elegante, leggera e con finale perfetto.","🐧 Il pinguino la mangia con classe."],
  'verdure':               ["Verdure grigliate e mozzarella: colorata, fresca e super equilibrata.","Leggera ma piena di gusto vero.","🐧 Il pinguino la ordina per sentirsi sano… poi prende le patatine."],
  'estate':                ["Pomodorini datterini conditi e mozzarella: fresca, dolce e super estiva.","Una pizza leggera ma piena di sapore.","🐧 Il pinguino la mangia immaginando il mare."],
  'norma':                 ["Melanzane, ricotta e grana: cremosa, morbida e super mediterranea.","Semplice ma piena di gusto vero.","🐧 Il pinguino la mangia facendo mamma mia."],
  'parmigiana':            ["Melanzane e grana su base pomodoro: la parmigiana diventata pizza.","Morbida, filante e con quel sapore da domenica in famiglia.","🐧 Il pinguino chiude gli occhi al primo morso."],
  'mike':                  ["Salsiccia, brie e grana su rucola cotta: cremosa e cattiva quanto basta.","Bianca, ricca e con un finale di carattere.","🐧 Pizza cosi carica che il pinguino applaude con le pinne."],
  'ciccia e friarielli':   ["Salsiccia e friarielli: combo ignorante e perfetta.","Rustica, saporita e con quel finale amarognolo che spacca.","🐧 Il pinguino qui tira fuori il lato napoletano."],
  'formaggi':              ["Gorgonzola, brie e grana: cremosa oltre ogni limite.","Forte, filante e super comfort food.","🐧 Dopo questa il pinguino va in letargo."],
  'paolo':                 ["Gorgonzola, cipolla e salamino: combo forte che spinge tantissimo.","Cremosa, piccante e super intensa.","🐧 Dopo questa il pinguino vede le stelle."],
  'sfiziosa':              ["Pesto, brie e melanzane fritte: cremosa e super particolare.","Ricca, morbida e piena di gusto.","🐧 Il pinguino qui fa oooh al primo morso."],
  'ava':                   ["Salsiccia, salamino, aglio e grana: una combo cattiva che spinge forte.","Pomodorini che accendono tutto con un finale super saporito.","🐧 Pizza cosi carica che il pinguino va in modalita turbo."],
  'pps':                   ["Porcini, scamorza e pancetta dolce: combo da fame vera.","Affumicata, cremosa e intensissima.","🐧 Il pinguino ne sogna due alla volta."],
  'silvia':                ["Porchetta trevigiana, gorgonzola e senape e miele: dolce, salato e cremoso.","Una pizza che sorprende ad ogni morso - agrodolce e irresistibile.","🐧 Il pinguino la chiama la pizza degli opposti che si attraggono."],
  'wilma':                 ["Pesto, pomodorini e mais: fresca, dolce e super sfiziosa.","Colorata, morbida e perfetta da finire tutta.","🐧 Il pinguino sorride gia dal profumo."],
  'wanda':                 ["Carciofi, salamino e acciughe: sapore forte e senza compromessi.","Decisa, intensa e piena di personalita.","🐧 Pizza cosi tosta che il pinguino la rispetta."],
  'leone':                 ["Tonno, acciughe, olive e capperi: gusto enorme e zero paura.","Decisa, intensa e salata al punto giusto.","🐧 Solo pinguini coraggiosi finiscono questa da soli."],
  'giggino':               ["Cotto, mais, Philadelphia e pomodorini: cremosa e super equilibrata.","Dolce, fresca e piena di contrasti buoni.","🐧 Il pinguino la chiama la pizza coccola."],
  'titti':                 ["Philadelphia, zucchine e prosciutto crudo: fresca ma super golosa.","Morbida, cremosa e perfetta da divorare.","🐧 Il pinguino qui si sente raffinato."],
  'boscaiola':             ["Funghi misti, salsiccia e salamino: rustica, intensa e super carica.","Una pizza da fame vera, saporita e piena di gusto.","🐧 Il pinguino la difende ringhiando agli amici."],
  'tartufata':             ["Salsa al tartufo e funghi misti: profumo assurdo appena apri il cartone.","Cremosa, intensa e super premium.","🐧 Il pinguino si sente ricco quando la mangia."],
  'ufo':                   ["Salsiccia, salamino, olive e pomodori secchi: gusto spaziale davvero.","Carica, intensa e super ignorante.","🐧 Dopo questa il pinguino decolla."],
  'pazza':                 ["Salsiccia, salamino, peperoni e wurstel: completamente fuori controllo.","Carica, pesante e tremendamente buona.","🐧 Anche il pinguino la guarda con rispetto."],
  'repubblica':            ["Bufala, rucola e grana: fresca ma super elegante.","Cremosa, sapida e bilanciatissima.","🐧 Pizza cosi bella che il pinguino la fotografa prima."],
  'capricciosa sbagliata': ["Porcini, carciofi e porchetta trevigiana: sbagliata solo nel nome.","Ricca, intensa e con una botta di gusto clamorosa.","🐧 Il pinguino dice che questa andava resa illegale."],
  'amatriciana':           ["Pancetta croccante, cipolla dolce e grana: una bomba romana fatta pizza.","Saporita, intensa e bella ignorante - ogni morso sa di comfort puro.","🐧 Il pinguino la mangia cosi veloce che si unge pure le pinne."],
  'onta':                  ["Salsiccia, cipolla e peperoni: rustica, dolce e con carattere vero.","Una pizza senza fronzoli che sa di tradizione e sostanza.","🐧 Il pinguino la ordina quando vuole sentirsi a casa."],
  'cri':                   ["Salsiccia, brie erborinato, noci e confettura di fichi: dolce, salato e cremoso.","Un'esperienza di sapori che non ti aspetti - ogni morso e una scoperta.","🐧 Il pinguino la mangia lentamente per non farla finire."],
  'bois (arrotolata)':     ["Gorgonzola, salsiccia e crema al tartufo: il livello hardcore della golosita.","Arrotolata, cremosa e piena di roba buona fino all'ultimo morso.","🐧 Dopo questa il pinguino rotola via felice."],
  'pimpa (arrotolata)':    ["Salsa BBQ, scamorza e pancetta dolce: americana ma fatta bene.","Arrotolata, fumosa e super goduriosa.","🐧 Il pinguino qui sporca tutto il becco."],
  'calzone classico':      ["Prosciutto cotto e funghi chiusi in un guscio bollente di felicita.","Ogni taglio libera profumo e filantezza assurda.","🐧 Il pinguino si scotta sempre ma lo rifarebbe."],
  'calzone piccante':      ["Salamino piccante e ricotta cremosa: fuoco dentro, morbidezza fuori.","Piccante, filante e bello aggressivo nel gusto.","🐧 Il pinguino beve tre litri dopo questa."],
  'calzone vegeta':        ["Verdure grigliate e mozzarella in un abbraccio caldo e filante.","Leggero ma soddisfacente, perfetto per chi ama il gusto vero delle verdure.","🐧 Il pinguino lo ordina e poi non si sente in colpa."],
  'calzone poro mauretto': ["Prosciutto cotto, funghi, spinaci, ricotta, salamino e grana: il calzone definitivo.","Ogni morso e una sorpresa - ricco, cremoso e impossibile da lasciare.","🐧 Il pinguino ci vuole due ore a finirlo ma ne vale ogni secondo."],
  'calzone ade':           ["Salsa al tartufo, funghi misti, salamino e brie: un calzone da occasione speciale.","Cremoso, intenso e con quel profumo di tartufo che arriva prima di lui.","🐧 Il pinguino lo mangia con le candele accese."],
};

const FRASI_QUALITA = [
  "\n\n_Pomodoro fresco 100% italiano, lotta integrata - la passata la facciamo noi._",
  "\n\n_Mozzarella in boccia, latte vaccino 100% italiano, spaccata a mano in pizzeria._",
  "\n\n_Impasto con lievito madre, maturazione lenta - per una pizza leggera e digeribile._",
  "\n\n_Filiera corta, accordi diretti con gli agricoltori - pomodoro selezionato e pagato giusto._",
];

function getDescrizionePizza(nomePizza){
  const d = DESCRIZIONI_PIZZA[nomePizza.toLowerCase()];
  if(!d) return null;
  const p = PIZZE[nomePizza.toLowerCase()];
  let extra = '';
  if(p && p.ing && p.ing.includes('pomodoro') && p.ing.some(i=>i.includes('mozzarella')) && Math.random()<0.2){
    extra = FRASI_QUALITA[Math.floor(Math.random()*FRASI_QUALITA.length)];
  }
  return d[0]+' '+d[1]+' '+d[2]+extra;
}

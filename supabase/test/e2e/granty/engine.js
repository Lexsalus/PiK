/* =====================================================================
   Granty — silnik wstępnego raportu (regułowy) i słowniki.
   Wspólny dla strony (index.html) i panelu w CRM kancelarii (Lexsalus/PiK → Dotacje),
   który ładuje ten plik z https://lexsalus.github.io/Grants/assets/engine.js.
   Bez zależności od strony: nie używa DOM ani zmiennych globalnych poza window.GRANTY.
   ===================================================================== */
(function(){
const VERSION = '1.0.0';
const FORMS = ['firma','start','rolnik','ngo','jst'];
const GOALS = ['rozwoj','maszyny','innowacje','cyfra','oze','zatrudnienie','eksport','szkolenia','budynek','spoleczne'];
const REGIONS = {
  DS:['dolnośląskie','Нижньосілезьке','Lower Silesian'], KP:['kujawsko-pomorskie','Куявсько-Поморське','Kuyavian-Pomeranian'], LU:['lubelskie','Люблінське','Lublin'],
  LB:['lubuskie','Любуське','Lubusz'], LD:['łódzkie','Лодзинське','Łódź'], MA:['małopolskie','Малопольське','Lesser Poland'], MZ:['mazowieckie','Мазовецьке','Masovian'],
  OP:['opolskie','Опольське','Opole'], PK:['podkarpackie','Підкарпатське','Subcarpathian'], PD:['podlaskie','Підляське','Podlaskie'], PM:['pomorskie','Поморське','Pomeranian'],
  SL:['śląskie','Сілезьке','Silesian'], SK:['świętokrzyskie','Свєнтокшиське','Holy Cross'], WN:['warmińsko-mazurskie','Вармінсько-Мазурське','Warmian-Masurian'],
  WP:['wielkopolskie','Великопольське','Greater Poland'], ZP:['zachodniopomorskie','Західнопоморське','West Pomeranian']
};
const LABELS = {
  pl: { 'f.firma':'Firma (działająca)','f.start':'Planuję założyć firmę','f.rolnik':'Rolnik / gospodarstwo','f.ngo':'Fundacja / stowarzyszenie','f.jst':'Samorząd / jednostka publiczna',
'g.rozwoj':'Rozwój firmy','g.maszyny':'Maszyny i wyposażenie','g.innowacje':'Innowacje / B+R','g.cyfra':'Cyfryzacja / e-sprzedaż','g.oze':'Energia / OZE',
'g.zatrudnienie':'Zatrudnienie','g.eksport':'Eksport / targi','g.szkolenia':'Szkolenia','g.spoleczne':'Projekty społeczne','g.budynek':'Budynek / lokal' },
  uk: { 'f.firma':'Компанія (діюча)','f.start':'Планую відкрити компанію','f.rolnik':'Фермер / господарство','f.ngo':'Фонд / асоціація','f.jst':'Самоврядування / публічна установа',
'g.rozwoj':'Розвиток компанії','g.maszyny':'Обладнання','g.innowacje':'Інновації / НДДКР','g.cyfra':'Цифровізація / e-торгівля','g.oze':'Енергія / ВДЕ',
'g.zatrudnienie':'Працевлаштування','g.eksport':'Експорт / виставки','g.szkolenia':'Навчання','g.spoleczne':'Соціальні проєкти','g.budynek':'Будівля / приміщення' },
  en: { 'f.firma':'Company (operating)','f.start':'Planning to start a business','f.rolnik':'Farmer / farm','f.ngo':'Foundation / association','f.jst':'Local government / public body',
'g.rozwoj':'Business growth','g.maszyny':'Machinery & equipment','g.innowacje':'Innovation / R&D','g.cyfra':'Digitalisation / e-commerce','g.oze':'Energy / renewables',
'g.zatrudnienie':'Hiring','g.eksport':'Export / trade fairs','g.szkolenia':'Training','g.spoleczne':'Social projects','g.budynek':'Building / premises' }
};
/* ---------- silnik raportu (regułowy) ---------- */
const AUTO_FORM = [
  ['ngo', /fundacj|stowarzysz|organizacj[aię] pozarz|\bngo\b|klub sportow|koło gospody/i],
  ['rolnik', /rolni|gospodarstw|hodowl|uprawi|sad\b|sadownic|pszczel/i],
  ['jst', /\bgmin|samorz|powiat|urząd|szkoła publ|dom kultury/i],
  ['start', /(założyć|zalozyc|otworzyć|otworzyc|rozpocząć|rozpoczac|założę|otworzę)\s+(własn\w*\s+|swoj\w*\s+)?(firm|działaln|dzialaln|biznes|sklep|salon|zakład|zaklad|warsztat|restaurac|kawiarni|gabinet)|start ?up|bezrobotn|nie mam (jeszcze )?firmy/i]
];
const AUTO_GOAL = [
  ['maszyny', /maszyn|urządze|urzadze|lini[aię] produk|sprzęt|sprzet|wyposaż|park maszyn|cnc|piec|ploter/i],
  ['innowacje', /innowac|technolog|badan|b\+r|prototyp|patent|wdroże/i],
  ['cyfra', /sklep internet|e-?sklep|online|cyfry|stron[aęy] internet|aplikacj|oprogramow|system (erp|crm)|e-commerce|internet/i],
  ['oze', /fotowolt|\boze\b|pomp[aęy] ciep|energi|panel[ei] słone|magazyn energ|termomoder/i],
  ['zatrudnienie', /zatrudni|pracownik|etat|rekrut/i],
  ['eksport', /eksport|zagranic|targ[iów]|rynk[iu] zagr|niemc|ue\b/i],
  ['szkolenia', /szkole|kurs|kompetenc|certyfik/i],
  ['budynek', /hal[aęi]\b|budyn|lokal|warsztat|remont|rozbudow|modernizac/i],
  ['spoleczne', /społeczn|spoleczn|senior|dzieci|młodzież|niepełnospr|integrac|kultur/i]
];
function analyseInput(inp){
  const txt = (inp.opis||'').toLowerCase();
  let forma = inp.forma;
  if(!forma){ forma = 'firma'; for(const [f,re] of AUTO_FORM) if(re.test(txt)){ forma=f; break; } }
  let cele = (inp.cele||[]).slice();
  if(!cele.length){ for(const [g,re] of AUTO_GOAL) if(re.test(txt)) cele.push(g); }
  if(!cele.length) cele = ['rozwoj'];
  return { txt, forma, cele, region: inp.region||'' };
}
function scoreProgram(p, a){
  if(p.aktywny===false) return null;
  if((p.formy||[]).length && !p.formy.includes(a.forma)) return null;
  if((p.regiony||[]).length && a.region && !p.regiony.includes(a.region)) return null;
  const words = String(p.slowa||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const hits = words.filter(w=>a.txt.includes(w));
  const goals = (p.cele||[]).filter(g=>a.cele.includes(g));
  const w = Number(p.waga)||0;
  let s = w*2 + Math.min(goals.length,2)*15 + Math.min(hits.length,3)*12;
  if(!goals.length && (p.cele||[]).includes('rozwoj')) s += 5;
  return { p, s, hits, goals, w };
}
function buildReport(programs, inp, opts={}){
  const a = analyseInput(inp);
  const scored = programs.map(p=>scoreProgram(p,a)).filter(Boolean).sort((x,y)=>y.s-x.s || (Number(y.p.kwotaMax)||0)-(Number(x.p.kwotaMax)||0));
  const tiers = opts.planC ? ['A','B','C'] : ['A','B'];
  const plans = tiers.map(tr=>{ const best = scored.find(x=>(x.p.tier||'A')===tr); return best ? { tier:tr, ...best } : null; }).filter(Boolean);
  const total = plans.reduce((s,x)=>s+(Number(x.p.kwotaMax)||0),0);
  return { a, plans, total, all:scored };
}
window.GRANTY = { VERSION, FORMS, GOALS, REGIONS, LABELS, analyseInput, scoreProgram, buildReport };
})();

/* Porównaj.to — skrypt strony: kalkulatory, porównywarka, analiza umów, formularz zgłoszeń (wydzielony z index.html) */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const LANGS={pl:{label:'PL',loc:'pl-PL'},uk:{label:'UA',loc:'uk-UA'},en:{label:'EN',loc:'en-GB'}};
let D,cat,sel=new Set(),curCalc,lang='pl',mode='own',enabled=['pl'];

/* ---------- tłumaczenia ---------- */
// t(): tekst źródłowy (polski) -> tłumaczenie z data.json; w trybie Google strona zostaje po polsku, tłumaczy widget
const t=s=>{if(s==null||s==='')return s??'';if(lang==='pl'||mode!=='own')return s;return D.translations?.[lang]?.[s]||s};
const loc=()=>LANGS[mode==='own'?lang:'pl'].loc;
const fmt=(v,d=0)=>Number.isFinite(v)?v.toLocaleString(loc(),{minimumFractionDigits:d,maximumFractionDigits:d}):'—';

function pickLang(){
  const want=new URLSearchParams(location.search).get('lang')||store.get('pk_lang')||(navigator.language||'pl').slice(0,2).replace('ua','uk');
  return enabled.includes(want)?want:'pl';
}
function setGoogleCookie(l){
  const host=location.hostname,past='expires=Thu, 01 Jan 1970 00:00:00 GMT';
  ['',';domain='+host,';domain=.'+host].forEach(dm=>{document.cookie=`googtrans=;path=/${dm};${past}`});
  if(l!=='pl')document.cookie=`googtrans=/pl/${l};path=/`;
}
function loadGoogle(){
  window.gtInit=()=>new google.translate.TranslateElement({pageLanguage:'pl',includedLanguages:enabled.filter(l=>l!=='pl').join(','),autoDisplay:false},'gt');
  const s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=gtInit';document.head.appendChild(s);
}
function renderLang(){
  $('#lang').style.display=enabled.length>1?'':'none';
  $('#lang').innerHTML=enabled.map(l=>`<button class="${l===lang?'on':''}" data-l="${l}">${LANGS[l].label}</button>`).join('');
}
$('#lang').onclick=e=>{const b=e.target.closest('button');if(b&&b.dataset.l!==lang)setLang(b.dataset.l)};
function setLang(l){
  store.set('pk_lang',l);
  const u=new URL(location.href);if(l==='pl')u.searchParams.delete('lang');else u.searchParams.set('lang',l);
  if(mode==='google'){setGoogleCookie(l);location.href=u.toString();return}
  history.replaceState(null,'',u);lang=l;applyLang(true);
}
function applyStatic(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.dataset.src??=el.textContent.trim();el.textContent=t(el.dataset.src)});
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>el.placeholder=t(el.dataset.i18nPh));
  document.querySelectorAll('[data-i18n-title]').forEach(el=>el.title=t(el.dataset.i18nTitle));
}
function applySeo(){
  const s=D.seo||{};
  document.documentElement.lang=mode==='own'?lang:'pl';
  document.title=t(s.title)||t(D.site.name)||'Porównywarka';
  let m=document.querySelector('meta[name=description]');
  if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}
  m.content=t(s.description)||'';
}
function applyLang(keep){
  renderLang();applyStatic();applySeo();
  $('#siteName').textContent=$('#fName').textContent=t(D.site.name)||'';
  $('#tagline').textContent=t(D.site.tagline)||'';
  // zachowaj wybraną kategorię i wartości kalkulatora przy zmianie języka
  const catId=cat?.id;
  renderTabs();setCat(catId||D.categories[0]?.id);
  renderCalcs();
  initContracts();
  Object.entries(BOX).forEach(([k,b])=>{
    const first=b.cur||D.calculators.find(c=>kindOf(c)===k);if(!first)return;
    openCalc(first.id,false,keep&&b.cur?readVals($(b.panel)):null);
  });
}

/* ---------- motyw ---------- */
const th=store.get('theme');if(th)document.documentElement.dataset.theme=th;
$('#theme').onclick=()=>{const v=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=v;store.set('theme',v)};

/* ---------- start ---------- */
const SITE_DB='https://eamobnucjsavahpxilrt.supabase.co',SITE_KEY='sb_publishable_jwyxht3egYyB_dAPrWHkRw_68bmBctB'; // klucz publiczny (publishable) — może być jawny
async function load(){
  const preview=new URLSearchParams(location.search).has('preview');
  if(preview){try{const d=store.get('pk_draft');if(d){D=JSON.parse(d);$('#pv').innerHTML='<div class="preview-flag" data-i18n>PODGLĄD — szkic z CRM (nieopublikowany)</div>'}}catch(e){}}
  if(!D){ // opublikowane treści z bazy (edycja w CRM → Treści strony); zapasowo data.json
    // najpierw tylko data publikacji (kilkadziesiąt bajtów); pełne treści (~90 KB) pobieramy tylko, gdy się zmieniły
    const H={headers:{apikey:SITE_KEY},cache:'no-store'},get=async(sel)=>{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),5000);
      try{const r=await fetch(SITE_DB+'/rest/v1/site_content?id=eq.1&select='+sel,{...H,signal:ac.signal});return r.ok?(await r.json())[0]:null}finally{clearTimeout(t)}};
    try{const m=await get('published_at');
      if(m){let c=null;try{c=JSON.parse(store.get('pk_site')||'null')}catch(e){}
        if(c?.at===m.published_at&&c?.data?.site)D=c.data;
        else{const j=await get('data,published_at');if(j?.data?.site){D=j.data;store.set('pk_site',JSON.stringify({at:j.published_at,data:j.data}))}}}}catch(e){}
  }
  if(!D){
    try{D=await (await fetch('data.json',{cache:'no-store'})).json()}
    catch(e){document.body.innerHTML='<p style="padding:40px">Nie udało się wczytać <code>data.json</code>. Uruchom stronę przez serwer (np. Live Server w VS Code) lub na GitHub Pages.</p>';return}
  }
  const i=D.i18n||{};
  mode=i.mode==='google'?'google':'own';
  enabled=['pl',...(i.languages||[]).filter(l=>l!=='pl'&&LANGS[l])];
  lang=pickLang();
  if(mode==='google'){setGoogleCookie(lang);if(lang!=='pl')loadGoogle()}
  init();
}
function init(){
  const s=D.site||{};
  document.documentElement.style.setProperty('--accent',s.accent||'#7c5cff');
  $('#yr').textContent=new Date().getFullYear();
  $('#stCat').textContent=D.categories.length;
  $('#stItem').textContent=D.categories.reduce((a,c)=>a+c.items.length,0);
  $('#stCalc').textContent=D.calculators.length;
  applyLang(false);
  initConsent();
  initChatbot();
  initPrawo().catch(e=>console.warn('prawo',e));if(window.KREDYTFX)KREDYTFX.load();
  const SV=D.serwis||{};let sb=document.getElementById('serwisBar');if(SV.enabled){if(!sb){sb=document.createElement('div');sb.id='serwisBar';document.body.prepend(sb)}sb.textContent='🚧 '+t(SV.tekst||'Trwają prace serwisowe.')}else if(sb)sb.remove();
  const F=D.firma||{};$('#firma').style.display=F.enabled===false?'none':'';document.querySelectorAll('a[href="#firma"]').forEach(e=>e.style.display=F.enabled===false?'none':'');
  if(window.FIRMA&&F.enabled!==false)FIRMA.render(F);
}

/* ---------- chatbot (Adam — asystent prawny, adam/adam.js) ---------- */
// Wcześniej osadzany był czat Ilona (czat medyczny innego serwisu) — jego adres zamieniamy na Adama.
function initChatbot(){
  const c=D.site?.chatbot;if(c&&c.enabled===false)return;
  const src=!c?.src||/\/Ilona\//i.test(c.src)?'adam/adam.js':c.src;
  window.ADAM_CFG=D.adam||null;
  const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.lang=mode==='own'?lang:'pl';document.body.appendChild(s);
}

/* ---------- porównywarka ---------- */
function renderTabs(){
  $('#catTabs').innerHTML=D.categories.map(c=>`<button class="tab" data-id="${esc(c.id)}">${esc(c.icon||'')} ${esc(t(c.name))}</button>`).join('');
  $('#catTabs').onclick=e=>{const b=e.target.closest('.tab');if(b)setCat(b.dataset.id)};
}
function setCat(id){
  cat=D.categories.find(c=>c.id===id);sel.clear();updBar();
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
  if(!cat){$('#items').innerHTML=`<div class="empty">${esc(t('Brak kategorii.'))}</div>`;return}
  const opts=[`<option value="">${esc(t('Sortuj: domyślnie'))}</option>`];
  cat.fields.filter(f=>f.type==='number').forEach(f=>{
    opts.push(`<option value="${esc(f.key)}:1">${esc(t(f.label))} ${esc(t('rosnąco'))}</option><option value="${esc(f.key)}:-1">${esc(t(f.label))} ${esc(t('malejąco'))}</option>`)});
  $('#sort').innerHTML=opts.join('');$('#q').value='';
  renderItems();
}
function bestMap(items){
  const m={};
  cat.fields.forEach(f=>{
    if(!f.better)return;
    const vals=items.map(i=>f.type==='bool'?(i.values[f.key]?1:0):Number(i.values[f.key])).filter(Number.isFinite);
    if(!vals.length)return;
    m[f.key]=f.better==='lower'?Math.min(...vals):Math.max(...vals);
  });return m;
}
const val=(f,v)=>f.type==='bool'?(v?'✓ '+esc(t('Tak')):'✗ '+esc(t('Nie'))):f.type==='number'?(Number.isFinite(Number(v))?Number(v).toLocaleString(loc(),{maximumFractionDigits:2}):'—')+(f.unit?' '+esc(t(f.unit)):''):esc(t(v));
const isBest=(f,v,m)=>f.key in m&&(f.type==='bool'?(v?1:0):Number(v))===m[f.key];
function renderItems(){
  const q=$('#q').value.trim().toLowerCase();
  let items=cat.items.filter(i=>(i.name+' '+t(i.name)).toLowerCase().includes(q));
  const [sk,sd]=$('#sort').value.split(':');
  if(sk)items=[...items].sort((a,b)=>(a.values[sk]-b.values[sk])*sd);
  const m=bestMap(cat.items);
  $('#items').innerHTML=items.length?items.map((it,n)=>`
   <div class="card fade ${sel.has(it.id)?'sel':''}" style="animation-delay:${n*40}ms">
     ${it.badge?`<div class="badge">${esc(t(it.badge))}</div>`:''}
     <h3>${esc(t(it.name))}</h3>
     <div class="rows">${cat.fields.map(f=>`<div class="row"><span>${esc(t(f.label))}</span><b class="${isBest(f,it.values[f.key],m)?'best':''}">${val(f,it.values[f.key])}</b></div>`).join('')}</div>
     <div class="card-foot">
       <label class="chk"><input type="checkbox" data-id="${esc(it.id)}" ${sel.has(it.id)?'checked':''}>${esc(t('Porównaj'))}</label>
       ${it.url&&it.url!=='#'?`<a class="btn pri" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(t('Zobacz →'))}</a>`:''}
     </div>
   </div>`).join(''):`<div class="empty">${esc(t('Brak wyników.'))}</div>`;
}
$('#q').oninput=renderItems;$('#sort').onchange=renderItems;
$('#items').onchange=e=>{
  const c=e.target.closest('input[type=checkbox]');if(!c)return;
  if(c.checked){if(sel.size>=4){c.checked=false;return}sel.add(c.dataset.id)}else sel.delete(c.dataset.id);
  c.closest('.card').classList.toggle('sel',c.checked);updBar();
};
function updBar(){$('#cbar').classList.toggle('show',sel.size>0);$('#cbarTxt').textContent=`${t('Wybrano')}: ${sel.size}/4`}
$('#cClear').onclick=()=>{sel.clear();updBar();renderItems()};
$('#cGo').onclick=()=>{
  const items=cat.items.filter(i=>sel.has(i.id)),m=bestMap(items);
  $('#mBody').innerHTML=`<table><tr><th></th>${items.map(i=>`<th style="color:var(--txt)">${esc(t(i.name))}</th>`).join('')}</tr>
   ${cat.fields.map(f=>`<tr><th>${esc(t(f.label))}</th>${items.map(i=>`<td class="${items.length>1&&isBest(f,i.values[f.key],m)?'best':''}">${val(f,i.values[f.key])}</td>`).join('')}</tr>`).join('')}</table>`;
  $('#modal').classList.add('show');
};
$('#mClose').onclick=()=>$('#modal').classList.remove('show');
$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.remove('show')};
addEventListener('keydown',e=>{if(e.key==='Escape')$('#modal').classList.remove('show')});

/* ---------- kalkulatory ---------- */
// dwie grupy: „Co mi się należy” (kind:'claim') i narzędzia prawne (pozostałe)
const BOX={claim:{grid:'#ncalcs',panel:'#ncalc',cur:null},tool:{grid:'#calcs',panel:'#calc',cur:null}};
const kindOf=c=>c.kind==='claim'?'claim':'tool';
function renderCalcs(){
  Object.entries(BOX).forEach(([k,b])=>{
    const list=D.calculators.filter(c=>kindOf(c)===k);
    $(b.grid).innerHTML=list.map(c=>`<div class="ccard ${k==='claim'?'claim':''}" data-id="${esc(c.id)}"><div class="ic">${esc(c.icon||'🧮')}</div><h3>${esc(t(c.name))}</h3><p>${esc(window.PRAWO?PRAWO.odsLabel(t(c.description||'')):t(c.description||''))}</p></div>`).join('');
    $(b.grid).onclick=e=>{const c=e.target.closest('.ccard');if(c)openCalc(c.dataset.id,true)};
  });
  const hasClaims=D.calculators.some(c=>kindOf(c)==='claim');
  $('#nalezy').style.display=hasClaims?'':'none';document.querySelectorAll('.nav-claims').forEach(e=>e.style.display=hasClaims?'':'none');
  $('#kalkulatory').style.display=D.calculators.some(c=>kindOf(c)==='tool')?'':'none';
}
function compute(c,vals){
  const scope={...(window.PRAWO?PRAWO.odsScope():{}),...vals};
  return c.outputs.map(o=>{
    let v=NaN;
    try{v=Number(new Function(...Object.keys(scope),'with(Math){return ('+o.formula+')}')(...Object.values(scope)))}catch(e){}
    scope[o.key]=v;return{...o,v};
  });
}
function openCalc(id,scroll,vals){
  const c=D.calculators.find(x=>x.id===id);if(!c)return;
  const k=kindOf(c),b=BOX[k],P=$(b.panel);b.cur=c;if(k==='tool')curCalc=c;
  $(b.grid).querySelectorAll('.ccard').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
  P.innerHTML=`<div class="panel fade"><h3 style="margin-bottom:18px">${esc(c.icon||'')} ${esc(t(c.name))}</h3>
    ${c.inputs.map(i=>{const v=vals?.[i.key]??i.default;return `<div class="inp"><label>${esc(t(i.label))}<span><input class="field" type="number" data-k="${esc(i.key)}" value="${v}" step="${i.step||1}"> ${esc(t(i.unit||''))}</span></label>
    <input type="range" data-k="${esc(i.key)}" min="${i.min}" max="${i.max}" step="${i.step||1}" value="${v}"></div>`}).join('')}
    ${c.note?`<div class="cnote">${esc(t(c.note))}</div>`:''}${fxHelper(c)}</div>
    <div class="panel res fade"><div class="resv"></div>${k==='claim'&&D.leads?.enabled&&((D.leads.mode==='email'&&D.leads.email)||(D.leads.supabaseUrl&&D.leads.supabaseKey))?`<button class="btn pri lead-cta">${esc(t('Chcę bezpłatną analizę mojej sprawy →'))}</button>`:''}</div>`;
  P.oninput=e=>{const kk=e.target.dataset.k;if(!kk)return;P.querySelectorAll(`[data-k="${kk}"]`).forEach(x=>{if(x!==e.target)x.value=e.target.value});calcBox(k)};
  const cta=P.querySelector('.lead-cta');if(cta)cta.onclick=()=>openLead(c,readVals(P),P._fx?{symulacja:P._fx}:undefined);
  fxBind(P,k);
  calcBox(k);if(scroll)P.scrollIntoView({behavior:'smooth',block:'nearest'});
}
/* kredyt walutowy: rata, liczba rat i saldo z kursów NBP (kredyt-walutowy.js) — gdy klient ich nie zna */
const fxOk=c=>window.KREDYTFX&&['CHF','FX'].includes(c.crmCategory)&&['kwota','rata','k','saldo'].every(k=>c.inputs.some(i=>i.key===k));
function fxHelper(c){
  if(!fxOk(c))return '';
  return `<details class="fxh" style="display:none"><summary>${esc(t('📅 Nie znasz raty i salda? Policz z kursów NBP'))}</summary>
    <div class="fxg"><label>${esc(t('Data wypłaty kredytu'))}<input class="field" type="month" data-fx="data" min="2002-01" max="${new Date().toISOString().slice(0,7)}"></label>
    <label>${esc(t('Okres kredytu'))}<span><input class="field" type="number" data-fx="lata" value="30" min="5" max="50"> ${esc(t('lat'))}</span></label>
    <label>${esc(t('Marża banku'))}<span><input class="field" type="number" step="0.01" data-fx="marza" value="1.2"> %</span></label>
    <label>${esc(t('Waluta'))}<select class="field" data-fx="waluta"><option>CHF</option><option>EUR</option></select></label></div>
    <button class="btn" type="button" data-fxgo>${esc(t('Policz i wpisz'))}</button><div class="fxr">${esc(t('Kwotę wypłaconą przez bank ustaw wyżej. Marżę znajdziesz w umowie (oprocentowanie = LIBOR 3M + marża).'))}</div></details>`;
}
function fxBind(P,k){
  const D0=P.querySelector('.fxh');if(!D0)return;
  KREDYTFX.load().then(ok=>{if(ok)D0.style.display=''});
  D0.querySelector('[data-fxgo]').onclick=()=>{
    const g=x=>D0.querySelector(`[data-fx="${x}"]`).value,v=readVals(P),out=D0.querySelector('.fxr');
    const r=KREDYTFX.symuluj({kwota:v.kwota,data:g('data'),okres:Math.round(parseFloat(g('lata'))*12),marza:parseFloat(String(g('marza')).replace(',','.')),waluta:g('waluta')});
    if(r.err){out.innerHTML=`<b>${esc(t(r.err))}</b>`;return}
    const put=(key,val)=>P.querySelectorAll(`[data-k="${key}"]`).forEach(x=>x.value=Math.round(val));
    put('rata',r.rataSrednia);put('k',r.k);put('saldo',r.saldo);P._fx={data:g('data'),okres_mies:r.n,marza:parseFloat(g('marza')),waluta:r.waluta,raty:r.k,wplaty:Math.round(r.wplaty),rata_srednia:r.rataSrednia,rata_teraz:r.rataTeraz,saldo:Math.round(r.saldo),saldo_waluta:r.saldoFx,zrodlo:r.zrodlo};
    out.innerHTML=`${esc(t('Wpisano'))}: <b>${r.k}</b> ${esc(t('rat'))} · ${esc(t('średnia rata'))} <b>${fmt(r.rataSrednia,0)} zł</b> (${esc(t('ostatnio'))} ${fmt(r.rataTeraz,0)} zł) · ${esc(t('saldo'))} <b>${fmt(r.saldo,0)} zł</b> (${fmt(r.saldoFx,0)} ${r.waluta}).<br>${esc(t('Przybliżenie'))}: ${esc(r.zrodlo)}. ${esc(t('Dokładne kwoty ustali kancelaria z zaświadczenia banku.'))}`;
    calcBox(k);
  };
}
function readVals(P){const v={};P.querySelectorAll('input[type=range]').forEach(r=>{const n=P.querySelector(`input[type=number][data-k="${r.dataset.k}"]`);v[r.dataset.k]=parseFloat(n.value)||0});return v}
function calcBox(k){
  const b=BOX[k],P=$(b.panel);if(!b.cur||!P.querySelector('.resv'))return;
  const out=compute(b.cur,readVals(P)),main=out.find(o=>o.main)||out[0];
  const OL=x=>window.PRAWO?PRAWO.odsLabel(x):x;
  P.querySelector('.resv').innerHTML=main?`<span style="color:var(--mut)">${esc(OL(t(main.label)))}</span><div class="main">${fmt(main.v,main.decimals)} ${esc(t(main.unit||''))}</div>
   ${out.filter(o=>o!==main).map(o=>`<div class="sub"><span>${esc(OL(t(o.label)))}</span><b>${fmt(o.v,o.decimals)} ${esc(t(o.unit||''))}</b></div>`).join('')}`:'';
}
const calc=()=>calcBox('tool');

/* ---------- zgłoszenie sprawy (lead) ---------- */
function openLead(c,vals,extra){
  if(D.serwis?.enabled&&D.serwis.blokujFormularz!==false){$('#lBody').innerHTML=`<div class="lok"><div class="big">🚧</div><h3>${esc(t('Formularz chwilowo niedostępny'))}</h3><p style="color:var(--mut);margin-top:8px">${esc(t('Trwają prace serwisowe. Spróbuj ponownie później albo zadzwoń do kancelarii.'))}</p></div>`;$('#lead').classList.add('show');return}
  const L=D.leads||{},out=compute(c,vals),main=out.find(o=>o.main)||out[0];
  const mail=L.mode==='email'&&L.email,sb=!mail&&L.supabaseUrl&&L.supabaseKey;
  $('#lBody').innerHTML=`<form class="lform" id="lForm">
    <div class="lsum">${esc(c.icon||'')} <b style="color:var(--txt)">${esc(t(c.name))}</b><br>${esc(t(main.label))}: <b>${fmt(main.v,main.decimals)} ${esc(t(main.unit||''))}</b></div>
    <label>${esc(t('Imię i nazwisko'))}<input class="field" name="name" required autocomplete="name"></label>
    <label>${esc(t('Telefon'))}<input class="field" name="phone" type="tel" required autocomplete="tel"></label>
    <label>${esc(t('E-mail'))}<input class="field" name="email" type="email" autocomplete="email"></label>
    <label>${esc(t('Krótko o sprawie (opcjonalnie)'))}<textarea class="field" name="msg"></textarea></label>
    <label class="rodo"><input type="checkbox" name="rodo" required><span>${esc(t(L.consent||''))}</span></label>
    <div class="lerr" style="color:var(--bad);font-weight:600;display:none"></div>
    <button class="btn pri" style="justify-content:center">${esc(t('Wyślij zgłoszenie'))}</button></form>`;
  $('#lead').classList.add('show');
  $('#lForm').onsubmit=async e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const btn=e.target.querySelector('button.pri');
    const lead={id:'L'+Date.now().toString(36),created:new Date().toISOString(),lang,category:c.crmCategory||'INNE',calc:{id:c.id,name:c.name,inputs:c.inputs.map(i=>({label:i.label,unit:i.unit,value:vals[i.key]})),outputs:out.map(o=>({label:o.label,unit:o.unit,value:Number.isFinite(o.v)?Math.round(o.v*100)/100:null,main:!!o.main})),...(extra||{})},
      client:{name:f.name.trim(),phone:f.phone.trim(),email:(f.email||'').trim()},message:(f.msg||'').trim(),consent:true,status:'nowe'};
    while(extra?.analiza&&JSON.stringify(lead.calc).length>18000){const A=lead.calc.analiza;if(A.podstawy_w_umowie?.length)A.podstawy_w_umowie.pop();else if(A.zgodnosc?.length)A.zgodnosc.pop();else if(A.klauzule.length>1)A.klauzule.pop();else break}
    if(sb){
      // zapis do Supabase: rola anonimowa może tylko DODAĆ zgłoszenie (RLS), bez odczytu
      btn.disabled=true;btn.textContent=t('Wysyłanie…');
      try{
        const r=await fetch(L.supabaseUrl.replace(/\/$/,'')+'/rest/v1/leads',{method:'POST',headers:{apikey:L.supabaseKey,'Content-Type':'application/json',Prefer:'return=minimal'},
          body:JSON.stringify({category:lead.category,calc:lead.calc,client_name:lead.client.name,phone:lead.client.phone,email:lead.client.email||null,message:lead.message||null,lang,consent:true})});
        if(!r.ok){let m='';try{m=(await r.json()).message||''}catch(e){}throw new Error(/Zbyt wiele zgłoszeń/.test(m)?'LIMIT':'HTTP '+r.status)}
      }catch(err){console.error(err);const x=e.target.querySelector('.lerr');x.textContent=err.message==='LIMIT'?t('Zbyt wiele zgłoszeń z tego adresu e-mail. Spróbuj ponownie za godzinę lub zadzwoń do kancelarii.'):t('Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę lub zadzwoń do kancelarii.');x.style.display='';btn.disabled=false;btn.textContent=t('Wyślij zgłoszenie');return}
    }
    else if(mail){
      const lines=[`${c.name} — ${main.label}: ${fmt(main.v,main.decimals)} ${main.unit||''}`,'',...lead.calc.inputs.map(i=>`${i.label}: ${i.value} ${i.unit||''}`),'',...lead.calc.outputs.map(o=>`${o.label}: ${o.value??'—'} ${o.unit||''}`),'',`Imię i nazwisko: ${lead.client.name}`,`Telefon: ${lead.client.phone}`,`E-mail: ${lead.client.email}`,'',lead.message];
      location.href=`mailto:${encodeURIComponent(L.email)}?subject=${encodeURIComponent('Zgłoszenie: '+c.name+' ('+(c.crmCategory||'')+')')}&body=${encodeURIComponent(lines.join('\n'))}`;
    }
    $('#lBody').innerHTML=`<div class="lok"><div class="big">✅</div><h3>${esc(t('Dziękujemy!'))}</h3><p style="color:var(--mut);margin-top:8px">${esc(t(sb?'Zgłoszenie wysłane. Kancelaria skontaktuje się z Tobą — zwykle w ciągu 1 dnia roboczego.':'Otworzyliśmy Twój program pocztowy z gotową wiadomością — wyślij ją, a kancelaria skontaktuje się z Tobą.'))}</p></div>`;
  };
}
$('#lClose').onclick=()=>$('#lead').classList.remove('show');
$('#lead').onclick=e=>{if(e.target.id==='lead')$('#lead').classList.remove('show')};
addEventListener('keydown',e=>{if(e.key==='Escape')$('#lead').classList.remove('show')});

/* ---------- analiza umów ---------- */
const LIB={  // podpisy kontrolne (SRI): przeglądarka odrzuci zmieniony plik; przy zmianie wersji trzeba podać nowy odcisk
  pdf:['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e'],
  pdfW:['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js','sha384-SnzOobpRMLXZ52iJvZm/C0fYw0OQemTXzTjIsdsfMcrCtCEe9qgzxTd3RSklO5x2'],
  docx:['https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js','sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz'],
  zip:['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG'],
  // rozpoznawanie tekstu ze skanów (OCR) w przeglądarce — model języka polskiego pobiera się przy pierwszym użyciu
  tess:['https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F']};
let IMG=['jpg','jpeg','png','webp'];
const libs={};
const needLib=([src,sri])=>libs[src]??=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.integrity=sri;s.crossOrigin='anonymous';s.onload=res;s.onerror=()=>{delete libs[src];rej(new Error(t('Nie udało się wczytać pliku.')))};document.head.appendChild(s)});
/* worker pdf.js nie obsługuje atrybutu integrity — pobieramy go, sprawdzamy odcisk i uruchamiamy z lokalnej kopii */
let pdfWorkerUrl=null;
async function pdfWorker([src,sri]){if(pdfWorkerUrl)return pdfWorkerUrl;
  const b=await (await fetch(src,{integrity:sri,mode:'cors'})).arrayBuffer();
  pdfWorkerUrl=URL.createObjectURL(new Blob([b],{type:'text/javascript'}));return pdfWorkerUrl}
const LV={high:{w:3,c:'var(--bad)',l:'Wysokie ryzyko'},medium:{w:2,c:'#f5b84a',l:'Do sprawdzenia'},info:{w:0,c:'#5aa9ff',l:'Informacyjnie'}};
let lastRep=null;

function initContracts(){
  const C=D.contracts;const on=!!C?.enabled;
  $('#umowy').style.display=on?'':'none';document.querySelectorAll('.nav-umowy').forEach(e=>e.style.display=on?'':'none');
  if(!on)return;
  if(C.ocr===false)IMG=[];
  const f=[...new Set([...(C.formats||[]),...IMG])];$('#fmts').textContent=f.map(x=>'.'+x).join(' ')+(IMG.length?' · '+t('także zdjęcia lub skan umowy — kilka zdjęć stron naraz'):'');
  $('#file').accept=f.map(x=>'.'+x).join(',')+(IMG.length?',image/*':'');
  if(lastRep)renderReport(lastRep);
}
const dz=$('#drop');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('over')}));
dz.addEventListener('drop',e=>{const fs=[...e.dataTransfer.files];if(fs.length)handleFiles(fs)});
$('#file').onchange=e=>{const fs=[...e.target.files];if(fs.length)handleFiles(fs);e.target.value=''};
$('#pgo').onclick=()=>{const v=$('#ptext').value.trim();if(v)analyze(v,t('Wklej tekst'),0)};

/* kilka plików naraz: zdjęcia kolejnych stron umowy → jeden tekst (kolejność wg nazw plików, np. IMG_001, IMG_002) */
async function handleFiles(fs){
  if(fs.length===1)return handleFile(fs[0]);
  const C=D.contracts,err=m=>{$('#ares').innerHTML=`<div class="err">⚠ ${esc(m)}</div>`},ext=f=>(f.name.split('.').pop()||'').toLowerCase();
  if(!IMG.length||!fs.every(f=>IMG.includes(ext(f))))return err(t('Kilka plików naraz można wgrać tylko jako zdjęcia stron umowy (JPG, PNG, WEBP). Inne formaty — po jednym pliku.'));
  const max=+C.ocrMaxPages||15;if(fs.length>max)return err(`${t('Za dużo zdjęć naraz. Maksymalnie:')} ${max}`);
  const big=fs.find(f=>f.size>(C.maxMB||15)*1048576);if(big)return err(`${t('Plik jest za duży. Maksymalny rozmiar:')} ${C.maxMB} MB (${big.name})`);
  fs.sort((a,b)=>a.name.localeCompare(b.name,'pl',{numeric:true,sensitivity:'base'}));
  try{const text=await ocr(fs);
    if(text.replace(/\s/g,'').length<20)return err(t('Nie udało się odczytać tekstu. Zrób wyraźniejsze zdjęcie (dobre światło, cała strona) albo wklej treść ręcznie.'));
    analyze(text,`${fs.length} ${t(fs.length<5?'zdjęcia':'zdjęć')}: ${fs[0].name} …`,fs.length,true)}
  catch(e){console.error(e);err(e.message||t('Nie udało się wczytać pliku.'))}
}
async function handleFile(f){
  const C=D.contracts,ext=(f.name.split('.').pop()||'').toLowerCase();
  const err=m=>{$('#ares').innerHTML=`<div class="err">⚠ ${esc(m)}</div>`};
  if(f.size>(C.maxMB||15)*1048576)return err(`${t('Plik jest za duży. Maksymalny rozmiar:')} ${C.maxMB} MB`);
  if(ext==='doc')return err(t('Stary format .doc nie jest obsługiwany — zapisz plik jako .docx lub PDF.'));
  if(!(C.formats||[]).includes(ext==='htm'?'html':ext==='md'?'txt':ext)&&!IMG.includes(ext))return err(t('Nieobsługiwany format pliku.'));
  $('#ares').innerHTML=`<div class="priv"><span class="spin"></span> ${esc(t('Wczytywanie pliku…'))}</div>`;
  try{
    const {text,pages,ocr}=await extractText(f,ext);
    if(text.replace(/\s/g,'').length<20)return err(t('Nie udało się odczytać tekstu. Zrób wyraźniejsze zdjęcie (dobre światło, cała strona) albo wklej treść ręcznie.'));
    analyze(text,f.name,pages,ocr);
  }catch(e){console.error(e);err(e.message||t('Nie udało się wczytać pliku.'))}
}
/* OCR: zdjęcia i zeskanowane PDF — rozpoznawanie w przeglądarce (Tesseract), plik nie opuszcza urządzenia */
/* przygotowanie obrazu do OCR: obrót wg EXIF (zdjęcia z telefonu), skala ~2400 px, odcienie szarości,
   rozciągnięcie kontrastu (1–99 percentyl) i wyprostowanie przekosu (±12°, metoda profilu wierszy) */
async function prepImage(src){
  let bmp;
  try{bmp=src instanceof HTMLCanvasElement?src:await createImageBitmap(src,{imageOrientation:'from-image'})}catch(e){return src}
  const W0=bmp.width,H0=bmp.height,sc=Math.min(3,Math.max(.4,2400/Math.max(W0,H0)));
  const W=Math.round(W0*sc),H=Math.round(H0*sc),cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.drawImage(bmp,0,0,W,H);
  const im=cx.getImageData(0,0,W,H),d=im.data,hist=new Uint32Array(256),g=new Uint8ClampedArray(W*H);
  for(let i=0,j=0;i<d.length;i+=4,j++){const v=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000|0;g[j]=v;hist[v]++}
  let lo=0,hi=255,acc=0;const n=W*H;for(let v=0;v<256;v++){acc+=hist[v];if(acc>n*.01){lo=v;break}}acc=0;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>n*.01){hi=v;break}}
  const k=hi>lo+10?255/(hi-lo):1;for(let i=0,j=0;i<d.length;i+=4,j++){const v=Math.max(0,Math.min(255,(g[j]-lo)*k));d[i]=d[i+1]=d[i+2]=v;g[j]=v}
  cx.putImageData(im,0,0);
  // przekos: na pomniejszonej kopii szukamy kąta, przy którym wiersze tekstu dają najostrzejszy profil
  const s2=Math.min(1,700/Math.max(W,H)),w=Math.round(W*s2),h=Math.round(H*s2),sm=document.createElement('canvas');sm.width=w;sm.height=h;
  const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(cv,0,0,w,h);const sd=sx.getImageData(0,0,w,h).data,pts=[];
  for(let y=0;y<h;y+=1)for(let x=0;x<w;x+=1){if(sd[(y*w+x)*4]<110)pts.push(x-w/2,y-h/2)}
  let best=0,bestV=-1;
  if(pts.length>200&&pts.length<w*h*.5){for(let a=-12;a<=12;a+=.5){const r=a*Math.PI/180,c=Math.cos(r),sn=Math.sin(r),rows=new Float32Array(h*2);
      for(let i=0;i<pts.length;i+=2){const yy=Math.round(-pts[i]*sn+pts[i+1]*c+h);if(yy>=0&&yy<h*2)rows[yy]++}
      let sum=0,sq=0;for(const v of rows){sum+=v;sq+=v*v}const varr=sq/rows.length-(sum/rows.length)**2;if(varr>bestV){bestV=varr;best=a}}}
  if(Math.abs(best)<.4)return cv;
  const r=-best*Math.PI/180,c=Math.abs(Math.cos(r)),sn=Math.abs(Math.sin(r)),RW=Math.round(W*c+H*sn),RH=Math.round(W*sn+H*c),rc=document.createElement('canvas');rc.width=RW;rc.height=RH;
  const rx=rc.getContext('2d');rx.fillStyle='#fff';rx.fillRect(0,0,RW,RH);rx.translate(RW/2,RH/2);rx.rotate(r);rx.drawImage(cv,-W/2,-H/2);return rc;
}
function rotCanvas(cv,deg){const q=deg%180!==0,c=document.createElement('canvas');c.width=q?cv.height:cv.width;c.height=q?cv.width:cv.height;
  const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(deg*Math.PI/180);x.drawImage(cv,-cv.width/2,-cv.height/2);return c}
/* typowe pomyłki OCR w umowach: „$ 1.” zamiast „§ 1.” */
const fixOcr=t=>String(t||'').replace(/(^|[\s(])\$\s?(?=\d)/gm,'$1§ ').replace(/(^|[\s(])S\s(?=\d+\.)/gm,'$1§ ');
async function ocr(images){
  const say=m=>{const b=$('#ares');if(b)b.innerHTML=`<div class="priv"><span class="spin"></span> ${esc(m)}</div>`};
  say(t('Rozpoznawanie tekstu ze skanu… (przy pierwszym użyciu pobiera się słownik języka polskiego)'));
  await needLib(LIB.tess);let page=0;
  const w=await Tesseract.createWorker('pol',1,{logger:m=>{if(m.status==='recognizing text')say(`${t('Rozpoznawanie tekstu ze skanu…')} ${images.length>1?`${t('strona')} ${page}/${images.length} · `:''}${Math.round(m.progress*100)}%`)}});
  const out=[];try{for(const im of images){page++;say(`${t('Przygotowanie obrazu…')} ${images.length>1?`${t('strona')} ${page}/${images.length}`:''}`);
    const cv=await prepImage(im);let best=await w.recognize(cv);
    // strona do góry nogami lub obrócona: przy niskiej pewności próbujemy 180°, potem 90° i 270° — zostaje wynik z najwyższą pewnością
    if(best.data.confidence<65&&cv instanceof HTMLCanvasElement){for(const deg of [180,90,270]){say(`${t('Sprawdzanie obrotu strony…')} ${deg}°`);const r=await w.recognize(rotCanvas(cv,deg));
      if(r.data.confidence>best.data.confidence+5)best=r;if(best.data.confidence>=75)break}}
    out.push(fixOcr(best.data.text))}}finally{await w.terminate()}
  return out.join('\n\n');
}
async function extractText(f,ext){
  if(IMG.includes(ext))return{text:await ocr([f]),pages:1,ocr:true};
  if(ext==='txt'||ext==='md')return{text:await f.text()};
  if(ext==='html'||ext==='htm'){const d=new DOMParser().parseFromString(await f.text(),'text/html');d.querySelectorAll('script,style').forEach(x=>x.remove());
    d.querySelectorAll('p,div,br,li,tr,h1,h2,h3,h4').forEach(x=>x.append('\n'));return{text:d.body.textContent}}
  if(ext==='rtf')return{text:rtfText(await f.text())};
  if(ext==='pdf'){
    await needLib(LIB.pdf);pdfjsLib.GlobalWorkerOptions.workerSrc=await pdfWorker(LIB.pdfW);
    const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,out=[];
    for(let i=1;i<=pdf.numPages;i++){const c=await (await pdf.getPage(i)).getTextContent();out.push(c.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join(''))}
    const txt=out.join('\n\n').replace(/(\p{L})-\n(\p{L})/gu,'$1$2');
    if(txt.replace(/\s/g,'').length<40*pdf.numPages){ // skan bez warstwy tekstu → OCR (do 15 stron)
      const imgs=[];for(let i=1;i<=Math.min(pdf.numPages,+D.contracts.ocrMaxPages||15);i++){const p=await pdf.getPage(i),v=p.getViewport({scale:2}),cv=document.createElement('canvas');cv.width=v.width;cv.height=v.height;await p.render({canvasContext:cv.getContext('2d'),viewport:v}).promise;imgs.push(cv)}
      return{text:await ocr(imgs),pages:pdf.numPages,ocr:true};
    }
    return{text:txt,pages:pdf.numPages};
  }
  if(ext==='docx'){await needLib(LIB.docx);return{text:(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value}}
  if(ext==='odt'){
    await needLib(LIB.zip);const z=await JSZip.loadAsync(await f.arrayBuffer()),x=await z.file('content.xml')?.async('string');
    if(!x)throw new Error(t('Nie udało się wczytać pliku.'));
    const d=new DOMParser().parseFromString(x.replace(/<\/text:(p|h)>/g,'\n$&').replace(/<text:(tab|line-break)\/>/g,' '),'application/xml');
    return{text:d.documentElement.textContent};
  }
  throw new Error(t('Nieobsługiwany format pliku.'));
}
function rtfText(r){
  // prosty konwerter RTF: usuwa grupy sterujące, zamienia \'hh (cp1250) i \uN na znaki
  const dec=new TextDecoder('windows-1250');
  r=r.replace(/\{\\\*[^{}]*(\{[^{}]*\}[^{}]*)*\}/g,'').replace(/\{\\(fonttbl|colortbl|stylesheet|info)[\s\S]*?\}\s*\}/g,'');
  r=r.replace(/\\'([0-9a-f]{2})/gi,(_,h)=>dec.decode(new Uint8Array([parseInt(h,16)])))
     .replace(/\\u(-?\d+)\??/g,(_,n)=>String.fromCharCode((+n+65536)%65536))
     .replace(/\\(par|line)\b ?/g,'\n').replace(/\\tab\b ?/g,'\t')
     .replace(/\\[a-z]+-?\d* ?/gi,'').replace(/\\([{}\\])/g,'$1').replace(/[{}]/g,'');
  return r.replace(/\n{3,}/g,'\n\n').trim();
}
const RX={
  amounts:/(?:\d{1,3}(?:[  .]\d{3})+|\d+)(?:,\d{1,2})?\s?(?:zł|PLN|EUR|€|USD|\$|UAH|грн)/gi,
  dates:/\b(?:\d{1,2}[./-]\d{1,2}[./-](?:19|20)?\d{2}|\d{4}-\d{2}-\d{2})\b|\b\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/gi,
  periods:/\b\d+\s?(?:dni|dnia|tygodni\w*|miesi[ąę]c\w*|mies\.|lat|lata|rok\w*|days?|months?|years?)\b/gi,
  percents:/\d+(?:[.,]\d+)?\s?%/g};
function compileRule(r){return (r.patterns||[]).map(p=>{try{return new RegExp(p,'gi')}catch(e){return null}}).filter(Boolean)}
function analyze(raw,name,pages,ocr){
  const text=raw.replace(/\r/g,'').replace(/[ \t ]+/g,' ').replace(/ ?\n ?/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  const flat=text.replace(/\n/g,' ');// dopasowania przez złamania linii, te same indeksy
  const C=D.contracts,findings=runRules(C.rules||[],flat);
  const LC=C.legal&&window.PRAWO?.ods._zrodlo?{...C.legal,maxInterest:PRAWO.ods.ODS_MAX,maxDefault:PRAWO.ods.ODS_MAX_OPOZN,auto:true}:C.legal;
  const legal=C.legal?.enabled?runRules(C.legal.rules||[],flat,LC):null;
  const sus=C.suspicion?.enabled?suspicion(text,flat,C.suspicion):null;
  const ex={};Object.entries(RX).forEach(([k,rx])=>ex[k]=[...new Set((text.match(rx)||[]).map(s=>s.replace(/\s+/g,' ').trim()))].slice(0,30));
  const pts=findings.reduce((a,f)=>a+(LV[f.r.level]?.w||0),0),max=(D.contracts.rules||[]).reduce((a,r)=>a+(LV[r.level]?.w||0),0)||1;
  const score=Math.min(100,Math.round(pts/max*100*1.6));
  const lscore=legal?Math.min(100,legal.reduce((a,f)=>a+({high:30,medium:15,info:5}[f.r.level]||0),0)):0;
  lastRep={name,pages,ocr,text,findings,ex,score,legal,lscore,sus,words:(text.match(/\S+/g)||[]).length};
  renderReport(lastRep);renderZwrot(text);collectRefs(text);
  $('#ares').scrollIntoView({behavior:'smooth',block:'start'});
}
function runRules(rules,flat,cfg){
  const out=[];
  rules.forEach(r=>{
    const hits=[];compileRule(r).forEach(rx=>{for(const m of flat.matchAll(rx)){if(m[0])hits.push([m.index,m.index+m[0].length])}});
    hits.sort((a,b)=>a[0]-b[0]);
    if(r.mode==='interest'){ // procenty w pobliżu słowa „odsetki/oprocentowanie” powyżej limitu
      const bad=[];hits.forEach(([a,b])=>{const win=flat.slice(a,b+120);const dflt=/opóźnieni|zwłok/i.test(flat.slice(Math.max(0,a-80),b+120));
        for(const m of win.matchAll(/(\d+(?:[.,]\d+)?)\s?%/g)){const v=parseFloat(m[1].replace(',','.')),lim=dflt?cfg.maxDefault:cfg.maxInterest;
          if(lim&&v>lim){bad.push([a+m.index,a+m.index+m[0].length]);r=Object.assign({},r,{lim:cfg})}}});
      if(bad.length)out.push({r,hits:bad});
    }
    else if(r.mode==='missing'){if(!hits.length)out.push({r,hits:[],missing:true})}
    else if(hits.length)out.push({r,hits});
  });return out;
}
function suspicion(text,flat,cfg){
  const items=[];let pts=0;
  (cfg.indicators||[]).forEach(r=>{const hits=[];compileRule(r).forEach(rx=>{for(const m of flat.matchAll(rx))if(m[0])hits.push([m.index,m.index+m[0].length])});
    if(hits.length){hits.sort((a,b)=>a[0]-b[0]);const p=Math.min(r.max||100,hits.length*(r.weight||0));pts+=p;items.push({r,hits,p})}});
  const sents=text.split(/(?<=[.!?;])\s+|\n+/).map(x=>(x.match(/\S+/g)||[]).length).filter(n=>n>2);
  const avg=sents.length?Math.round(sents.reduce((a,b)=>a+b,0)/sents.length):0,lim=cfg.longSentence||40,long=sents.filter(n=>n>lim).length;
  const lp=Math.min(cfg.longMax||20,long*(cfg.longWeight||4));pts+=lp;
  return{items:items.sort((a,b)=>b.p-a.p),avg,long,lim,lp,score:Math.min(100,pts)};
}
const verdict=v=>v>=60?['źle','var(--bad)']:v>=30?['uwaga','#f5b84a']:['dobrze','var(--good)'];
const bar=(label,v)=>{const [w,c]=verdict(v);return `<div><div class="bar-l"><span>${esc(t(label))}</span><small><b style="color:${c}">${esc(t(w))}</b> · ${v}/100</small></div><div class="bar" style="--v:${v}%"><i></i></div></div>`};
function snippet(text,[a,b],lc){
  const s=Math.max(0,text.lastIndexOf(' ',Math.max(0,a-90))),e=text.indexOf(' ',Math.min(text.length,b+90));const end=e<0?text.length:e;
  return `<div class="snip" style="--lc:${lc}">${s>0?'…':''}${esc(text.slice(s,a))}<mark>${esc(text.slice(a,b))}</mark>${esc(text.slice(b,end))}${end<text.length?'…':''}</div>`;
}
function highlighted(R){
  const rs=R.findings.flatMap(f=>f.hits.map(h=>[...h,LV[f.r.level].c])).sort((a,b)=>a[0]-b[0]);
  let out='',pos=0;rs.forEach(([a,b,c])=>{if(a<pos)return;out+=esc(R.text.slice(pos,a))+`<mark style="--lc:${c}">${esc(R.text.slice(a,b))}</mark>`;pos=b});
  return out+esc(R.text.slice(pos));
}
function renderReport(R){
  const lvl=R.score>=60?'wysokie':R.score>=30?'średnie':'niskie',rc=R.score>=60?'var(--bad)':R.score>=30?'#f5b84a':'var(--good)';
  const order={high:0,medium:1,info:2},fs=[...R.findings].sort((a,b)=>order[a.r.level]-order[b.r.level]);
  const cnt=k=>R.findings.filter(f=>f.r.level===k).length;
  const exNames={amounts:'Kwoty',dates:'Daty',periods:'Okresy',percents:'Procenty'};
  $('#ares').innerHTML=`<div class="panel fade">
    <div class="ahead"><div><h3>📄 ${esc(R.name)}</h3><small>${R.pages?R.pages+' '+esc(t('stron'))+' · ':''}${R.words.toLocaleString(loc())} ${esc(t('słów'))}${R.ocr?' · '+esc(t('tekst rozpoznany ze skanu')):''}</small></div>
      </div>
    <div id="zwrot"></div>
    <div class="bars">${bar('Ryzyko zapisów',R.score)}${R.legal?bar('Ryzyko prawne',R.lscore):''}${R.sus?bar('Podejrzana treść',R.sus.score):''}</div>
    <div class="asec" style="border:0;margin:0;padding:0"><h4>📋 ${esc(t('Podstawowa analiza'))}</h4></div>
    <div class="counts">${['high','medium','info'].map(k=>`<span style="color:${LV[k].c}">${esc(t(LV[k].l))}: ${cnt(k)}</span>`).join('')}</div>
    ${fs.length?fs.map(f=>{const c=LV[f.r.level].c;return `<div class="finding" style="--lc:${c}"><h4>${esc(t(f.r.name))}<small>${f.missing?esc(t('Brak zapisu')):f.hits.length+'×'}</small></h4><p>${esc(t(f.r.advice))}</p>${f.hits.slice(0,3).map(h=>snippet(R.text,h,c)).join('')}</div>`}).join('')
      :`<p class="priv">${esc(t('Nie wykryto zapisów z listy kontrolnej.'))}</p>`}
    <h4 style="margin:18px 0 6px">${esc(t('Wykryte dane'))}</h4>
    ${Object.entries(R.ex).filter(([,v])=>v.length).map(([k,v])=>`<small style="color:var(--mut)">${esc(t(exNames[k]))}</small><div class="chips">${v.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`).join('')||'<small style="color:var(--mut)">—</small>'}
    ${R.legal?`<div class="asec"><h4>⚖️ ${esc(t('Zgodność z prawem'))}</h4>
      ${R.legal.length?[...R.legal].sort((a,b)=>order[a.r.level]-order[b.r.level]).map(f=>{const c=LV[f.r.level].c;return `<div class="finding" style="--lc:${c}"><h4>${esc(t(f.r.name))}<small>${f.missing?esc(t('Brak zapisu')):f.hits.length+'×'}</small></h4><p>${esc(t(f.r.advice))}${f.r.lim?` (${esc(t('limit:'))} ${fmt(f.r.lim.maxInterest,2)}% / ${fmt(f.r.lim.maxDefault,2)}% ${esc(t('za opóźnienie'))}${f.r.lim.auto?' — '+esc(t('wg aktualnego obwieszczenia')):''})`:''}</p>${f.hits.slice(0,3).map(h=>snippet(R.text,h,c)).join('')}</div>`}).join('')
        :`<p class="priv">✅ ${esc(t('Nie wykryto naruszeń z listy kontrolnej.'))}</p>`}</div>`:''}
    ${R.sus?`<div class="asec"><h4>🔍 ${esc(t('Styl i przejrzystość treści'))}</h4>
      <p class="priv" style="margin:0 0 12px">${esc(t('Średnia długość zdania:'))} ${R.sus.avg} ${esc(t('słów'))}</p>
      ${R.sus.long?`<div class="finding" style="--lc:#f5b84a"><h4>${esc(t('Długie zdania'))} (&gt;${R.sus.lim} ${esc(t('słów'))})<small>${R.sus.long}× · +${R.sus.lp}</small></h4><p>${esc(t('Bardzo długie zdania utrudniają zrozumienie i mogą ukrywać istotne warunki.'))}</p></div>`:''}
      ${R.sus.items.map(x=>{const c=x.p>=15?'var(--bad)':'#f5b84a';return `<div class="finding" style="--lc:${c}"><h4>${esc(t(x.r.name))}<small>${x.hits.length}× · +${x.p}</small></h4><p>${esc(t(x.r.explain))}</p>${x.hits.slice(0,2).map(h=>snippet(R.text,h,c)).join('')}</div>`}).join('')}
      ${!R.sus.long&&!R.sus.items.length?`<p class="priv">✅ ${esc(t('Nie wykryto podejrzanych sygnałów.'))}</p>`:''}</div>`:''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
      <button class="btn" id="aFull">${esc(t('Pokaż pełny tekst'))}</button><button class="btn" id="aDl">⬇ ${esc(t('Pobierz raport'))}</button><button class="btn" id="aNew">${esc(t('Nowa analiza'))}</button></div>
    <div class="full" id="aText" hidden></div>
    <p class="disc">${esc(t(D.contracts.disclaimer||''))}</p></div>`;
  $('#aFull').onclick=()=>{const x=$('#aText');if(!x.innerHTML)x.innerHTML=highlighted(R);x.hidden=!x.hidden};
  $('#aNew').onclick=()=>{lastRep=null;$('#ares').innerHTML='';$('#ptext').value='';$('#umowy').scrollIntoView({behavior:'smooth'})};
  $('#aDl').onclick=()=>{
    const L=[t('Raport analizy umowy'),'='.repeat(40),R.name,`${t('Ryzyko zapisów')}: ${R.score}/100`,''];
    fs.forEach(f=>{L.push(`[${t(LV[f.r.level].l)}] ${t(f.r.name)}${f.missing?' — '+t('Brak zapisu'):' ('+f.hits.length+'×)'}`,'  '+t(f.r.advice));
      f.hits.slice(0,3).forEach(([a,b])=>L.push('  > '+R.text.slice(Math.max(0,a-80),b+80).replace(/\s+/g,' ')));L.push('')});
    Object.entries(R.ex).forEach(([k,v])=>v.length&&L.push(`${t(exNames[k])}: ${v.join('; ')}`));
    if(R.legal){L.push('',`== ${t('Zgodność z prawem')} — ${t('Ryzyko prawne')}: ${R.lscore}/100`);R.legal.forEach(f=>L.push(`[${t(LV[f.r.level].l)}] ${t(f.r.name)}`,'  '+t(f.r.advice)))}
    if(R.zw?.kwalifikuje&&R.zw.main)L.splice(4,0,`!!! ${t('W umowie wykryto klauzule abuzywne — kwalifikujesz się do zwrotu pieniędzy.')} ${t('Szacowana kwota')}: ${fmt(R.zw.main.v,0)} zł`,'');
    if(R.sus){L.push('',`== ${t('Podejrzana treść')}: ${R.sus.score}/100`,`${t('Średnia długość zdania:')} ${R.sus.avg}`);if(R.sus.long)L.push(`${t('Długie zdania')}: ${R.sus.long}`);R.sus.items.forEach(x=>L.push(`${t(x.r.name)} (${x.hits.length}×, +${x.p})`))}
    L.push('',t(D.contracts.disclaimer||''));
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\n')],{type:'text/plain'}));a.download='raport-umowy.txt';a.click();URL.revokeObjectURL(a.href);
  };
}

/* ---------- prawo: przepisy, podstawy prawne w umowie, zmiany w prawie (prawo.js + prawo/*.json) ---------- */
const PL=h=>window.PRAWO?PRAWO.linkify(h):h;
/* podstawy prawne z umowy (uchylone ustawy, nieistniejące artykuły) — NIE pokazujemy klientowi; idą do CRM ze zgłoszeniem */
async function collectRefs(text){
  if(!window.PRAWO||!lastRep)return;const rep=lastRep;let refs=null;try{refs=await PRAWO.contractRefs(text)}catch(e){}
  if(refs)rep.refs=refs.filter(r=>r.lvl!=='ok').slice(0,15).map(r=>({poziom:r.lvl,akt:r.title,uwaga:r.note,fragment:r.label}));
}
/* zwrot z umowy: na stronie komunikat i kwoty; uzasadnienie prawne trafia do CRM ze zgłoszeniem */
function renderZwrot(text){
  const box=$('#zwrot');if(!box||!window.ZWROT||!lastRep)return;
  const ZW=D.zwrot||{};if(ZW.enabled===false){box.innerHTML='';return}
  const r=ZWROT.evaluate(text,D,compute);lastRep.zw=r;
  if(!r||!r.kwalifikuje||!r.calc||ZW[r.typ]===false){box.innerHTML='';return}
  const c=r.calc,vals={...r.vals},OL=x=>window.PRAWO?PRAWO.odsLabel(x):x;
  const miss0=c.inputs.some(i=>!Number.isFinite(vals[i.key]));
  box.innerHTML=`<div class="refund">
    <div class="rhead">⚠️ <b>${esc(t(ZW.naglowek||'W Twojej umowie wykryliśmy klauzule abuzywne (niedozwolone zapisy).'))}</b><br>${esc(t(ZW.podtytul||'Kwalifikujesz się do zwrotu pieniędzy.'))}</div>
    <div class="rres"></div>
    <details class="rdata" ${miss0?'open':''}><summary>${esc(t(miss0?'Uzupełnij dane z umowy':'Sprawdź dane odczytane z umowy'))}</summary>
      <div class="rgrid">${c.inputs.map(i=>`<label>${esc(t(i.label))}<span><input class="field" type="number" step="any" data-zk="${esc(i.key)}" value="${vals[i.key]??''}" placeholder="${esc(t('wpisz'))}"> ${esc(t(i.unit||''))}</span></label>`).join('')}</div></details>
    <button class="btn pri rcta">${esc(t(ZW.cta||'Chcę odzyskać pieniądze — bezpłatna analiza →'))}</button>
    <p class="rnote">${esc(t(ZW.nota||'Szacunek na podstawie treści umowy. Dokładną kwotę bezpłatnie ustali kancelaria.'))}</p></div>`;
  const upd=()=>{
    const miss=c.inputs.some(i=>!Number.isFinite(vals[i.key]));
    const out=miss?null:compute(c,Object.fromEntries(c.inputs.map(i=>[i.key,vals[i.key]]))),main=out&&(out.find(o=>o.main)||out[0]);
    r.main=main;r.out=out;r.vals={...vals};
    box.querySelector('.rres').innerHTML=main&&Number.isFinite(main.v)?`<div class="ramt"><span>${esc(t('Szacowana kwota do odzyskania'))}</span><b>${fmt(Math.max(0,main.v),0)} zł</b></div>
      <div class="rsub">${out.filter(o=>o!==main&&o.unit==='zł'&&!/^rata|^wplaty$/i.test(o.key)&&Number.isFinite(o.v)&&o.v>0).map(o=>`<div><span>${esc(OL(t(o.label)))}</span><b>${fmt(o.v,0)} zł</b></div>`).join('')}</div>`
      :`<div class="rmiss">${esc(t('Uzupełnij dane poniżej, aby zobaczyć kwotę.'))}</div>`;
    box.querySelector('.rcta').disabled=!main;
  };
  box.querySelectorAll('[data-zk]').forEach(x=>x.oninput=()=>{const v=parseFloat(String(x.value).replace(',','.'));if(Number.isFinite(v))vals[x.dataset.zk]=v;else delete vals[x.dataset.zk];upd()});
  box.querySelector('.rcta').onclick=()=>openLead(c,Object.fromEntries(c.inputs.map(i=>[i.key,vals[i.key]])),{analiza:ZWROT.forCrm(r,{plik:lastRep.name,ryzyko:{zapisy:lastRep.score,prawne:lastRep.lscore},podstawy_w_umowie:lastRep.refs||[],zgodnosc:(lastRep.legal||[]).slice(0,10).map(f=>({nazwa:f.r.name,podstawa:f.r.basis||'',brak:!!f.missing})),ocr:!!lastRep.ocr})});
  upd();
}
const PCAT={SKD:'Kredyty konsumenckie',CHF:'Kredyty frankowe',PLN:'Kredyty złotówkowe',FX:'Kredyty walutowe',RST:'Oddłużanie',ROD:'Sprawy rodzinne',CIV:'Sprawy cywilne',INNE:'Konsumenci'};
async function initPrawo(){
  if(!window.PRAWO)return;
  const ZP=D.zmianyPrawa||{};document.querySelectorAll('.nav-prawo').forEach(e=>e.style.display=ZP.enabled===false?'none':'');
  await PRAWO.loadOds();if(typeof renderCalcs==='function'){Object.keys(BOX).forEach(k=>{if(BOX[k].cur&&$(BOX[k].panel).querySelector('.resv'))calcBox(k)})}
  const [z,p,o]=await Promise.allSettled([PRAWO.load('zmiany'),PRAWO.load('projekty'),PRAWO.load('odsetki'),PRAWO.acts()]);
  const Z=[],byEli={};(z.value?.zmiany||[]).forEach(x=>{const y=byEli[x.eli];if(y){if(!y.nazwa.includes(x.nazwa))y.nazwa+=', '+x.nazwa;y.kategorie=[...new Set([...y.kategorie,...x.kategorie])]}else{byEli[x.eli]={...x};Z.push(byEli[x.eli])}}); // jedna ustawa zmieniająca kilka obserwowanych — jeden wpis
  const PR=p.value?.projekty||[],O=o.value;
  if(ZP.enabled===false||(!Z.length&&!PR.length&&!O))return;
  const d=PRAWO.fmtD,tags=ks=>[...new Set((ks||[]).map(k=>PCAT[k]||k))].slice(0,3).map(x=>`<span class="ptag">${esc(t(x))}</span>`).join('');
  const recent=new Date(Date.now()-30*864e5).toISOString().slice(0,10),today=new Date().toISOString().slice(0,10);
  $('#przm').innerHTML=Z.slice(0,ZP.zmian||7).map(x=>`<div class="pitem"><a href="${esc(PRAWO.isapUrl(x.eli))}" target="_blank" rel="noopener">${esc(x.nazwa)}</a><small>${esc(x.tytul)}</small><small>${x.wejscie?(x.wejscie>today?esc(t('wejdzie w życie'))+' ':esc(t('w życie od'))+' ')+d(x.wejscie):''}</small>${(x.wykryto||'')>=recent?`<span class="ptag new">${esc(t('nowe'))}</span>`:''}${tags(x.kategorie)}</div>`).join('')||`<div class="pitem"><small>${esc(t('Brak nowelizacji w ostatnim czasie.'))}</small></div>`;
  $('#prpr').innerHTML=PR.slice(0,ZP.projektow||6).map(x=>`<div class="pitem"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.tytul)}</a><small>${x.etap?esc(x.etap)+' · '+d(x.etap_data):''}${x.uchwalony?' · '+esc(t('uchwalony')):''}</small>${tags(x.kategorie)}</div>`).join('')||`<div class="pitem"><small>${esc(t('Brak projektów w tej chwili.'))}</small></div>`;
  const od=O?.opoznienie,kp=O?.kapitalowe;
  $('#prods').innerHTML=O?`<div><span>${esc(t('Odsetki ustawowe za opóźnienie'))}</span><br><b>${esc(String(od?.stawka??'—').replace('.',','))}%</b></div><div><span>${esc(t('Odsetki ustawowe'))}</span><br><b>${esc(String(kp?.stawka??'—').replace('.',','))}%</b></div><div><span>${esc(t('Odsetki maksymalne'))}</span><br><b>${esc(String(PRAWO.ods.ODS_MAX).replace('.',','))}%</b></div><div><span>${od?.od?esc(t('obowiązują od'))+' '+d(od.od):''}</span></div>`:'';
  $('#prods').style.display=O&&ZP.odsetki!==false?'':'none';
  $('#prawo').style.display='';
}

/* ---------- Google Analytics + zgoda ---------- */
function loadGA(id){
  const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',id,{anonymize_ip:true});
}
function initConsent(){
  const id=(D.seo?.gaId||'').trim();if(!id||new URLSearchParams(location.search).has('preview'))return;
  if(!D.seo.consentBanner){loadGA(id);return}
  const c=store.get('pk_consent');
  if(c==='yes')loadGA(id);else if(c!=='no')$('#consent').classList.add('show');
}
$('#cYes').onclick=()=>{store.set('pk_consent','yes');$('#consent').classList.remove('show');loadGA(D.seo.gaId.trim())};
$('#cNo').onclick=()=>{store.set('pk_consent','no');$('#consent').classList.remove('show')};

fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(v=>{['#ver','#verNav'].forEach(id=>{$(id).textContent='v'+v.version;$(id).title=v.date})}).catch(()=>{});
load();

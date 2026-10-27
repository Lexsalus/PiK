/* =====================================================================
   TREŚCI STRONY (porównywarka) — edycja w CRM, tylko Administrator.
   Przeniesione z dawnego admin.html. Dane strony: opublikowana wersja w bazie
   (tabela site_content, migracja 005); dopóki nic nie opublikowano — data.json.
   Zmiany zapisują się jako szkic w tej przeglądarce (klucz pk_draft — z niego
   korzysta podgląd strony index.html?preview); na stronie pojawiają się po
   „Opublikuj” (funkcja site_publish, wpis w audycie).
   ===================================================================== */
const SITE={pub:null,at:null,src:'',loaded:false};
/* opublikowane treści strony (z bazy, w zapasie data.json) — używa też analiza w karcie sprawy */
async function siteContent(force){
  if(SITE.loaded&&!force)return SITE.pub;
  let pub=null,at=null,src='';
  try{const r=await sb.from('site_content').select('data,published_at').eq('id',1).maybeSingle();if(!r.error&&r.data?.data){pub=r.data.data;at=r.data.published_at;src='db'}}catch(e){}
  if(!pub){try{pub=await (await fetch('data.json',{cache:'no-store'})).json();src='file'}catch(e){}}
  Object.assign(SITE,{pub,at,src,loaded:true});return pub;
}
(()=>{
document.head.insertAdjacentHTML('beforeend',`<style>
#stWrap .box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:18px}
#stWrap .box h3{font-size:1rem;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
#stWrap .f.code{font-family:ui-monospace,Consolas,monospace;font-size:.85rem}
#stWrap .form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
#stWrap .form label{display:grid;gap:6px;color:var(--mut);font-weight:600;font-size:.82rem}
#stWrap .split{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;align-items:start}
#stWrap .list{display:grid;gap:6px}
#stWrap .li{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);cursor:pointer;display:flex;justify-content:space-between;gap:6px}
#stWrap .li.on{border-color:var(--accent);background:var(--card2)}#stWrap .li small{color:var(--mut)}
#stWrap td input[type=checkbox],#stWrap td input[type=radio]{accent-color:var(--accent);width:18px;height:18px}
#stWrap .hint code{background:var(--bg2);padding:1px 6px;border-radius:5px}
#stWrap .test{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:10px}
#stWrap .test div{background:var(--bg2);border-radius:10px;padding:10px 12px}#stWrap .test span{display:block;color:var(--mut);font-size:.78rem}#stWrap .test b.err{color:var(--bad)}
#stWrap .stst{font-size:.82rem;padding:6px 12px;border-radius:20px;background:var(--card);border:1px solid var(--line);color:var(--mut);white-space:nowrap}
#stWrap .stst.dirty{color:var(--warn);border-color:var(--warn)}
#stStale{display:none;background:color-mix(in srgb,var(--warn) 15%,var(--card));border:1px solid var(--warn);border-radius:14px;padding:14px 16px;margin-bottom:18px;gap:12px;align-items:center;flex-wrap:wrap}
@media(max-width:860px){#stWrap .split{grid-template-columns:1fr}}
</style>`);
/* pola i przyciski edytora: data-st / data-stch (kod wykonywany w zakresie tego modułu) */
const VIEW={addEventListener:(t,f)=>document.addEventListener(t,e=>{if(e.target?.closest?.('#stWrap'))f(e)})};
function run(code){return eval(code)}
document.addEventListener('click',e=>{const el=e.target.closest?.('#stWrap [data-st]');if(el&&!el.disabled)run.call(el,el.dataset.st)});
document.addEventListener('change',e=>{const el=e.target.closest?.('#stWrap [data-stch]');if(el)run.call(el,el.dataset.stch)});

const KEY='pk_draft';
let D,ORIG,view='settings',ci=0,ki=0,BASE='',STALE=false,READY=false;
const hash=t=>{let h=5381;for(let i=0;i<t.length;i++)h=(h*33^t.charCodeAt(i))>>>0;return h.toString(36)};
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'id';
const uid=p=>p+Math.random().toString(36).slice(2,7);
const TABS=[['settings','⚙️ Ustawienia','Ustawienia strony'],['cats','🗂️ Kategorie','Kategorie porównywarki'],['calcs','🧮 Kalkulatory','Kalkulatory'],['contracts','📄 Analiza umów','Analiza umów'],['i18n','🌐 Tłumaczenia','Tłumaczenia'],['seo','🔎 SEO','Optymalizacja pod Google (SEO)'],['export','🚀 Publikacja','Publikacja']];

async function load(){
  const p=await siteContent(true);ORIG=p?structuredClone(p):null;if(ORIG?.site)delete ORIG.site.adminHash;
  let draft=null;try{draft=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  BASE=ORIG?hash(JSON.stringify(ORIG)):'';
  let dBase=null;try{dBase=localStorage.getItem(KEY+'_base')}catch(e){}
  if(draft?.site)delete draft.site.adminHash;
  STALE=!!(draft&&ORIG&&dBase!==BASE&&JSON.stringify(draft)!==JSON.stringify(ORIG));
  D=draft||(ORIG&&structuredClone(ORIG));
  if(D){norm();READY=true}
}
/* lista różnic: szkic (ta przeglądarka) ↔ opublikowana wersja */
const DIFF_TOP={site:'Ustawienia strony',leads:'Formularz zgłoszenia',seo:'SEO',i18n:'Tłumaczenia — ustawienia',translations:'Tłumaczenia',categories:'Kategorie',calculators:'Kalkulatory',contracts:'Analiza umów'};
const DIFF_LN={uk:'ukraiński',en:'angielski'};
const DIFF_KEY={items:'oferty',fields:'parametry',inputs:'pola',outputs:'wyniki',rules:'reguły',indicators:'wskaźniki',legal:'zgodność z prawem',suspicion:'podejrzana treść',name:'nazwa',tagline:'hasło (podtytuł)',accent:'kolor akcentu',formula:'wzór',label:'etykieta',description:'opis',note:'uwaga',unit:'jednostka',url:'link',badge:'etykieta oferty',patterns:'wzorce',advice:'porada',formats:'formaty',enabled:'włączone',languages:'języki',mode:'tryb',title:'tytuł',consent:'zgoda RODO'};
function diffList(a,b){
  const out=[],nm=o=>o&&typeof o==='object'?(o.name||o.label||o.key||o.id||''):'',isObj=x=>x&&typeof x==='object';
  const walk=(x,y,path)=>{
    if(out.length>=1000)return;
    if(JSON.stringify(x)===JSON.stringify(y))return;
    if(Array.isArray(x)&&Array.isArray(y)){
      const byId=x.concat(y).every(e=>isObj(e)&&e.id!=null);
      if(byId){const mx=new Map(x.map(e=>[e.id,e])),my=new Map(y.map(e=>[e.id,e]));
        [...new Set([...mx.keys(),...my.keys()])].forEach(id=>walk(mx.get(id),my.get(id),[...path,nm(mx.get(id)||my.get(id))||id]))}
      else if(x.concat(y).every(e=>!isObj(e))){out.push({path,d:x.join(', '),p:y.join(', ')})}
      else for(let i=0;i<Math.max(x.length,y.length);i++)walk(x[i],y[i],[...path,nm(x[i]||y[i])||('#'+(i+1))]);
      return}
    if(isObj(x)&&isObj(y)&&!Array.isArray(x)&&!Array.isArray(y)){
      [...new Set([...Object.keys(x),...Object.keys(y)])].forEach(k=>walk(x[k],y[k],k==='values'?path:[...path,path.length?(path[0]===DIFF_TOP.translations&&path.length===1?(DIFF_LN[k]||k):(path[0]===DIFF_TOP.translations?k:(DIFF_KEY[k]||k))):(DIFF_TOP[k]||k)]));return}
    out.push({path,d:x,p:y})};
  walk(a,b,[]);return out}
const diffVal=v=>v===undefined?'<span class="mut">— brak —</span>':v&&typeof v==='object'?`<span class="mut">${Array.isArray(v)?'lista ('+v.length+')':'element'+(v.name||v.label?' „'+esc(v.name||v.label)+'”':'')}</span>`:esc(String(v).length>160?String(v).slice(0,157)+'…':String(v))||'<span class="mut">(puste)</span>';
function showDiff(){
  if(!D||!ORIG)return;const L=diffList(D,ORIG);
  const sec={};L.forEach(x=>{const k=x.path[0]||'—';sec[k]=(sec[k]||0)+1});
  modal('Różnice: szkic ↔ opublikowana wersja',L.length?`<p class="small mut" style="margin-bottom:8px">${L.length>=1000?'Pierwsze 1000 różnic':L.length+' '+(L.length===1?'różnica':'różnic')} · ${Object.entries(sec).map(([k,n])=>esc(k)+': '+n).join(' · ')}</p>
    <p class="hint" style="margin:0 0 10px">„Użyj opublikowanej wersji” — zostaje prawa kolumna. „Zostaw mój szkic” — zostaje lewa kolumna.${SITE.src==='file'?' Opublikowana wersja to na razie plik <code>data.json</code> z repozytorium (z CRM nic jeszcze nie opublikowano).':''}</p>
    <div class="tw" style="max-height:60vh;overflow:auto"><table><tr><th>Miejsce</th><th>Szkic (ta przeglądarka)</th><th>Opublikowana</th></tr>${L.map(x=>`<tr style="vertical-align:top"><td class="small">${x.path.map(esc).join(' › ')}</td><td class="small">${diffVal(x.d)}</td><td class="small">${diffVal(x.p)}</td></tr>`).join('')}</table></div>`
    :'<div class="empty">Szkic i opublikowana wersja są takie same.</div>',{ok:'',cancel:'Zamknij',wide:true});
}
function useNew(){if(!confirm('Odrzucić szkic i wczytać opublikowaną wersję strony?'))return;D=structuredClone(ORIG);norm();STALE=false;render();toast('Wczytano opublikowaną wersję')}
function keepDraft(){STALE=false;save();render();toast('Zostawiono szkic')}
const dirty=()=>!!D&&JSON.stringify(D)!==JSON.stringify(ORIG);
function save(){
  if(!D)return;
  try{localStorage.setItem(KEY,JSON.stringify(D));if(!STALE)localStorage.setItem(KEY+'_base',BASE)}catch(e){}
  const st=$('#stStatus');if(st){const d=dirty();st.textContent=d?'Szkic — nieopublikowany':(SITE.src==='db'?'Zgodne z opublikowaną':'Zgodne z data.json');st.classList.toggle('dirty',d)}
}
function render(){
  const V=$('#stView');if(!V)return;
  if(!READY){V.innerHTML='<div class="empty">Nie udało się wczytać treści strony.</div>';return}
  save();$('#stStale').style.display=STALE?'flex':'none';
  $('#stTitle').textContent=TABS.find(t=>t[0]===view)[2];
  V.innerHTML=({settings:vSettings,cats:vCats,calcs:vCalcs,contracts:vContracts,i18n:vI18n,seo:vSeo,export:vExport})[view]();
  if(view==='calcs')testCalc();
  if(view==='i18n')renderTl();
  if(view==='seo')seoPreview();
  if(view==='contracts')testRules();
}

ROUTES.strona=sub=>{
  need(isAdmin(),'Treści strony edytuje tylko Administrator.');
  view=TABS.some(t=>t[0]===sub)?sub:'settings';
  return `<div id="stWrap"><div class="ph"><div><h1>Treści strony</h1><p>Porównywarka, kalkulatory, analiza umów, tłumaczenia i SEO. Zmiany zapisują się jako szkic w tej przeglądarce — na stronie pojawią się po „Opublikuj”.</p></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="stst" id="stStatus">…</span><a class="btn" href="index.html?preview" target="_blank" data-tip="Strona ze szkicem z tej przeglądarki (nieopublikowanym)">👁 Podgląd</a><a class="btn" href="index.html" target="_blank">🌐 Strona</a><button class="btn pri" type="button" data-st="publish()">🚀 Opublikuj</button></div></div>
    <div class="tabs">${TABS.map(([k,l])=>`<a class="tab ${k===view?'on':''}" href="#/strona/${k}">${l}</a>`).join('')}</div>
    <div id="stStale"><span style="flex:1;min-width:240px">⚠️ <b>Opublikowana wersja strony zmieniła się</b> od czasu utworzenia Twojego szkicu (np. publikacja z innego komputera). Szkic nie zawiera tych zmian.</span><button class="btn" type="button" data-st="showDiff()" data-tip="Co jest inne w szkicu z tej przeglądarki, a co w opublikowanej wersji">🔍 Pokaż różnice</button><button class="btn pri" type="button" data-st="useNew()">Użyj opublikowanej wersji</button><button class="btn" type="button" data-st="keepDraft()">Zostaw mój szkic</button></div>
    <h2 id="stTitle" style="font-size:1.15rem;margin-bottom:14px"></h2><div id="stView"><div class="empty">Wczytywanie…</div></div></div>`;
};
ROUTES.strona.after=async()=>{if(!READY)await load();render()};

/* ---------- Publikacja ---------- */
function vExport(){
  const d=dirty(),when=SITE.at?new Date(SITE.at).toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'}):'';
  return `<div class="box"><h3>Stan</h3>
    <p>${SITE.src==='db'?`Strona pokazuje wersję opublikowaną <b>${esc(when)}</b>.`:'Strona korzysta jeszcze z pliku <code>data.json</code> — z CRM nic nie opublikowano.'}</p>
    <p style="margin-top:6px">${d?'<b style="color:var(--warn)">Masz nieopublikowane zmiany</b> (szkic w tej przeglądarce).':'Szkic jest zgodny z opublikowaną wersją.'}</p></div>
   <div class="box"><h3>Jak opublikować zmiany</h3>
    <ol class="hint" style="padding-left:18px;font-size:.9rem;color:var(--txt)">
      <li>Edytuj dane — zapisują się automatycznie jako szkic w tej przeglądarce.</li>
      <li>Sprawdź <a href="index.html?preview" target="_blank">podgląd strony</a>.</li>
      <li>Kliknij <b>🚀 Opublikuj</b> — odwiedzający zobaczą zmiany od razu (po odświeżeniu strony).</li></ol>
    <p class="hint"><b>SEO:</b> meta tagi, <code>robots.txt</code> i <code>sitemap.xml</code> tworzy GitHub Actions z pliku <code>data.json</code> w repozytorium. Po zmianach w zakładce SEO pobierz <code>data.json</code> i podmień go w repo.</p></div>
   <div class="box"><h3>Akcje</h3><div style="display:flex;gap:10px;flex-wrap:wrap">
     <button class="btn pri" type="button" data-st="publish()">🚀 Opublikuj na stronie</button>
     <button class="btn" type="button" data-st="dl()">⬇ Pobierz data.json</button>
     <button class="btn" type="button" data-st="navigator.clipboard.writeText(JSON.stringify(D,null,2)).then(()=>toast('Skopiowano JSON'))">📋 Kopiuj JSON</button>
     <label class="btn">📂 Importuj plik<input type="file" accept=".json" hidden data-stch="imp(this.files[0])"></label>
     <button class="btn del" type="button" data-st="reset()">↺ Odrzuć szkic</button></div></div>`;
}
function publish(){
  if(!D)return;if(!dirty()&&SITE.src==='db')return toast('Brak zmian do opublikowania');
  modal('Opublikować treści strony?',`<p>Szkic z tej przeglądarki zastąpi treści na stronie publicznej. Odwiedzający zobaczą zmiany od razu.</p><p class="hint">Publikacja trafia do dziennika audytu.</p>`,{ok:'🚀 Opublikuj',onOk:async()=>{
    const r=await sb.rpc('site_publish',{p_data:D});if(r.error)throw r.error;
    ORIG=structuredClone(D);SITE.pub=structuredClone(D);SITE.at=r.data;SITE.src='db';BASE=hash(JSON.stringify(ORIG));STALE=false;
    render();toast('Opublikowano — strona pokazuje nową wersję')}});
}
function dl(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));a.download='data.json';a.click();URL.revokeObjectURL(a.href);toast('Pobrano data.json')}
function imp(f){if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t);if(!j.site||!j.categories||!j.calculators)throw 0;delete j.site.adminHash;D=j;norm();render();toast('Zaimportowano do szkicu')}catch(e){toast('Nieprawidłowy plik',true)}})}
function reset(){if(!ORIG||!confirm('Odrzucić wszystkie nieopublikowane zmiany?'))return;D=structuredClone(ORIG);norm();STALE=false;try{localStorage.removeItem(KEY)}catch(e){}render();toast('Przywrócono opublikowaną wersję')}

/* ścieżkowe wiązanie pól: data-p="categories.0.name" */
const getP=p=>p.split('.').reduce((o,k)=>o?.[k],D);
function setP(p,v){const ks=p.split('.'),last=ks.pop();ks.reduce((o,k)=>o[k],D)[last]=v}
VIEW.addEventListener('input',e=>{
  const el=e.target,p=el.dataset.p;if(!p)return;
  let v=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.t==='num')v=el.value===''?'':Number(el.value);
  if(el.type==='radio'){ // jeden "main" w kalkulatorze
    D.calculators[ki].outputs.forEach((o,i)=>o.main=i==el.value);save();testCalc();return;
  }
  if(p==='leads.supabaseKey'&&/^sb_secret_|service_role/.test(String(v))){toast('To klucz SECRET — nie wolno go umieszczać na stronie!');el.value='';return}
  setP(p,v);save();
  if(view==='calcs')testCalc();
});
VIEW.addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.rekey!==undefined){ // zmiana klucza pola => migracja wartości ofert
    const c=D.categories[ci],f=c.fields[el.dataset.rekey],nk=slug(el.value),ok=el.dataset.old;
    f.key=nk;c.items.forEach(it=>{if(ok in it.values){it.values[nk]=it.values[ok];if(nk!==ok)delete it.values[ok]}});save();render();
  }
  if(el.dataset.rerender!==undefined)render();
});



/* ---------- Ustawienia ---------- */
function vSettings(){
  const L=D.leads||(D.leads={enabled:true,mode:'supabase',email:'',consent:''});
  const s=D.site;
  return `<div class="box"><h3>Podstawowe</h3><div class="form">
    <label>Nazwa strony<input class="f" data-p="site.name" value="${esc(s.name)}"></label>
    <label>Kolor akcentu<input class="f" type="color" data-p="site.accent" value="${esc(s.accent||'#7c5cff')}" style="height:40px;padding:4px"></label>
    <label style="grid-column:1/-1">Hasło (podtytuł)<input class="f" data-p="site.tagline" value="${esc(s.tagline)}"></label>
  </div></div>
  <div class="box"><h3>Formularz zgłoszenia sprawy</h3><div class="form">
    <label style="display:flex;align-items:center;gap:10px;color:var(--txt)"><input type="checkbox" data-p="leads.enabled" ${L.enabled?'checked':''} style="accent-color:var(--accent);width:18px;height:18px">Przycisk „Chcę bezpłatną analizę” pod kalkulatorami</label>
    <label>Gdzie trafia zgłoszenie<select class="f" data-p="leads.mode"><option value="email" ${L.mode==='email'?'selected':''}>E-mail kancelarii (program pocztowy klienta)</option><option value="supabase" ${L.mode!=='email'?'selected':''}>Baza CRM (Supabase)</option></select></label>
    <label>Supabase — adres projektu<input class="f code" data-p="leads.supabaseUrl" value="${esc(L.supabaseUrl||'')}" placeholder="https://xxxx.supabase.co"></label>
    <label>Supabase — klucz publiczny (publishable)<input class="f code" data-p="leads.supabaseKey" value="${esc(L.supabaseKey||'')}" placeholder="sb_publishable_…"></label>
    <label>Adres e-mail kancelarii<input class="f" type="email" data-p="leads.email" value="${esc(L.email||'')}" placeholder="biuro@kancelaria.pl"></label>
    <label style="grid-column:1/-1">Treść zgody RODO<textarea class="f" data-p="leads.consent" rows="3">${esc(L.consent||'')}</textarea></label></div>
    <p class="hint"><b>E-mail:</b> otwiera program pocztowy klienta z gotową wiadomością do kancelarii (klient musi ją wysłać).<br><b>Baza CRM:</b> zgłoszenie trafia od razu do CRM („Nowe sprawy”). Klucz publiczny może być jawny; <b>nigdy</b> nie wpisuj tu klucza <code>sb_secret_…</code>.</p></div>
  <div class="box"><h3>Chatbot (Ilona)</h3><div class="form">
    <label style="display:flex;align-items:center;gap:10px;color:var(--txt)"><input type="checkbox" data-p="site.chatbot.enabled" ${s.chatbot?.enabled?'checked':''} style="accent-color:var(--accent);width:18px;height:18px">Pokaż chatbota na stronie</label>
    <label style="grid-column:1/-1">Adres skryptu osadzającego<input class="f code" data-p="site.chatbot.src" value="${esc(s.chatbot?.src||'')}"></label></div>
    <p class="hint">Skrypt ładuje się na stronie publicznej (także w podglądzie). Dostaje atrybut <code>data-lang</code> z aktualnym językiem strony.</p></div>`;
}

/* ---------- Kategorie ---------- */
function vCats(){
  const cs=D.categories;ci=Math.min(ci,cs.length-1);
  const list=`<div class="list">${cs.map((c,i)=>`<div class="li ${i===ci?'on':''}" data-st="ci=${i};render()"><span>${esc(c.icon)} ${esc(c.name)}</span><small>${c.items.length}</small></div>`).join('')}
    <button class="btn" data-st="addCat()">+ Nowa kategoria</button></div>`;
  if(ci<0)return `<div class="split">${list}<div class="box">Brak kategorii.</div></div>`;
  const c=cs[ci],P=`categories.${ci}`;
  const fields=c.fields.map((f,i)=>`<tr>
    <td><input class="f code" value="${esc(f.key)}" data-rekey="${i}" data-old="${esc(f.key)}" style="width:110px"></td>
    <td><input class="f" data-p="${P}.fields.${i}.label" value="${esc(f.label)}"></td>
    <td><select class="f" data-p="${P}.fields.${i}.type" data-rerender>${['number','text','bool'].map(t=>`<option ${f.type===t?'selected':''} value="${t}">${{number:'liczba',text:'tekst',bool:'tak/nie'}[t]}</option>`).join('')}</select></td>
    <td><input class="f" data-p="${P}.fields.${i}.unit" value="${esc(f.unit)}" style="width:90px"></td>
    <td><select class="f" data-p="${P}.fields.${i}.better">${[['','—'],['lower','niższa'],['higher','wyższa']].map(([v,l])=>`<option value="${v}" ${f.better===v?'selected':''}>${l}</option>`).join('')}</select></td>
    <td><button class="btn sm" data-st="mv('fields',${i},-1)">↑</button> <button class="btn sm del" data-st="delField(${i})">✕</button></td></tr>`).join('');
  const items=c.items.map((it,i)=>`<tr>
    <td><input class="f" data-p="${P}.items.${i}.name" value="${esc(it.name)}" style="min-width:150px"></td>
    <td><input class="f" data-p="${P}.items.${i}.badge" value="${esc(it.badge)}" style="width:110px"></td>
    ${c.fields.map(f=>{const p=`${P}.items.${i}.values.${f.key}`,v=it.values[f.key];
      return `<td>${f.type==='bool'?`<input type="checkbox" data-p="${p}" ${v?'checked':''}>`:`<input class="f" ${f.type==='number'?'type="number" step="any" data-t="num"':''} data-p="${p}" value="${esc(v)}" style="width:${f.type==='number'?90:130}px">`}</td>`}).join('')}
    <td><input class="f" data-p="${P}.items.${i}.url" value="${esc(it.url)}" style="width:140px" placeholder="https://"></td>
    <td><button class="btn sm" data-st="mv('items',${i},-1)">↑</button> <button class="btn sm del" data-st="delItem(${i})">✕</button></td></tr>`).join('');
  return `<div class="split">${list}<div>
   <div class="box"><h3>Kategoria <button class="btn sm del" data-st="delCat()">Usuń kategorię</button></h3><div class="form">
     <label>Nazwa<input class="f" data-p="${P}.name" value="${esc(c.name)}"></label>
     <label>Ikona (emoji)<input class="f" data-p="${P}.icon" value="${esc(c.icon)}"></label>
     <label>ID<input class="f code" data-p="${P}.id" value="${esc(c.id)}"></label></div></div>
   <div class="box"><h3>Parametry porównania <button class="btn sm" data-st="addField()">+ Parametr</button></h3><div class="tw"><table>
     <tr><th>Klucz</th><th>Etykieta</th><th>Typ</th><th>Jednostka</th><th>Lepsza wartość</th><th></th></tr>${fields}</table></div>
     <p class="hint">„Lepsza wartość” podświetla najlepszą ofertę (★) dla danego parametru.</p></div>
   <div class="box"><h3>Oferty (${c.items.length}) <button class="btn sm pri" data-st="addItem()">+ Oferta</button></h3><div class="tw"><table>
     <tr><th>Nazwa</th><th>Etykieta</th>${c.fields.map(f=>`<th>${esc(f.label)}${f.unit?` (${esc(f.unit)})`:''}</th>`).join('')}<th>Link</th><th></th></tr>${items}</table></div></div>
  </div></div>`;
}
function addCat(){D.categories.push({id:uid('cat_'),name:'Nowa kategoria',icon:'📦',fields:[{key:'cena',label:'Cena',type:'number',unit:'zł',better:'lower'}],items:[]});ci=D.categories.length-1;render()}
function delCat(){if(confirm('Usunąć kategorię „'+D.categories[ci].name+'”?')){D.categories.splice(ci,1);ci=0;render()}}
function addField(){const c=D.categories[ci];let k='param',n=1;while(c.fields.some(f=>f.key===k+n))n++;c.fields.push({key:k+n,label:'Nowy parametr',type:'number',unit:'',better:''});render()}
function delField(i){const c=D.categories[ci],k=c.fields[i].key;if(!confirm('Usunąć parametr i jego wartości?'))return;c.fields.splice(i,1);c.items.forEach(it=>delete it.values[k]);render()}
function addItem(){const c=D.categories[ci];c.items.push({id:uid('it_'),name:'Nowa oferta',url:'',badge:'',values:Object.fromEntries(c.fields.map(f=>[f.key,f.type==='bool'?false:f.type==='number'?0:'']))});render()}
function delItem(i){if(confirm('Usunąć ofertę?')){D.categories[ci].items.splice(i,1);render()}}
function mv(arr,i,d){const a=view==='cats'?D.categories[ci][arr]:D.calculators[ki][arr],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];render()}

/* ---------- Kalkulatory ---------- */
function vCalcs(){
  const cs=D.calculators;ki=Math.min(ki,cs.length-1);
  const list=`<div class="list">${cs.map((c,i)=>`<div class="li ${i===ki?'on':''}" data-st="ki=${i};render()"><span>${esc(c.icon)} ${esc(c.name)}</span></div>`).join('')}
    <button class="btn" data-st="addCalc()">+ Nowy kalkulator</button></div>`;
  if(ki<0)return `<div class="split">${list}<div class="box">Brak kalkulatorów.</div></div>`;
  const c=cs[ki],P=`calculators.${ki}`;
  const ins=c.inputs.map((x,i)=>`<tr>
    <td><input class="f code" data-p="${P}.inputs.${i}.key" value="${esc(x.key)}" style="width:100px"></td>
    <td><input class="f" data-p="${P}.inputs.${i}.label" value="${esc(x.label)}" style="min-width:150px"></td>
    <td><input class="f" data-p="${P}.inputs.${i}.unit" value="${esc(x.unit)}" style="width:70px"></td>
    ${['default','min','max','step'].map(k=>`<td><input class="f" type="number" step="any" data-t="num" data-p="${P}.inputs.${i}.${k}" value="${x[k]}" style="width:85px"></td>`).join('')}
    <td><button class="btn sm" data-st="mv('inputs',${i},-1)">↑</button> <button class="btn sm del" data-st="D.calculators[ki].inputs.splice(${i},1);render()">✕</button></td></tr>`).join('');
  const outs=c.outputs.map((o,i)=>`<tr>
    <td><input type="radio" name="main" value="${i}" data-p="x" ${o.main?'checked':''} title="Wynik główny"></td>
    <td><input class="f code" data-p="${P}.outputs.${i}.key" value="${esc(o.key)}" style="width:90px"></td>
    <td><input class="f" data-p="${P}.outputs.${i}.label" value="${esc(o.label)}" style="min-width:140px"></td>
    <td><input class="f code" data-p="${P}.outputs.${i}.formula" value="${esc(o.formula)}" style="min-width:260px"></td>
    <td><input class="f" data-p="${P}.outputs.${i}.unit" value="${esc(o.unit)}" style="width:60px"></td>
    <td><input class="f" type="number" data-t="num" min="0" max="6" data-p="${P}.outputs.${i}.decimals" value="${o.decimals??0}" style="width:60px"></td>
    <td><button class="btn sm" data-st="mv('outputs',${i},-1)">↑</button> <button class="btn sm del" data-st="D.calculators[ki].outputs.splice(${i},1);render()">✕</button></td></tr>`).join('');
  return `<div class="split">${list}<div>
   <div class="box"><h3>Kalkulator <button class="btn sm del" data-st="delCalc()">Usuń kalkulator</button></h3><div class="form">
     <label>Nazwa<input class="f" data-p="${P}.name" value="${esc(c.name)}"></label>
     <label>Ikona<input class="f" data-p="${P}.icon" value="${esc(c.icon)}"></label>
     <label>ID<input class="f code" data-p="${P}.id" value="${esc(c.id)}"></label>
     <label>Gdzie na stronie<select class="f" data-p="${P}.kind" data-rerender><option value="claim" ${c.kind==='claim'?'selected':''}>Co mi się należy (dla klienta)</option><option value="tool" ${c.kind!=='claim'?'selected':''}>Kalkulatory prawne</option></select></label>
     ${c.kind==='claim'?`<label>Kategoria sprawy w CRM<select class="f" data-p="${P}.crmCategory">${['RST','SKD','CHF','PLN','FX','ROD','CIV','INNE'].map(k=>`<option ${c.crmCategory===k?'selected':''}>${k}</option>`).join('')}</select></label>`:''}
     <label style="grid-column:1/-1">Opis<input class="f" data-p="${P}.description" value="${esc(c.description)}"></label>
     <label style="grid-column:1/-1">Uwaga pod polami (zastrzeżenia, podstawa, warunki)<textarea class="f" data-p="${P}.note" rows="3">${esc(c.note||'')}</textarea></label></div>
     ${c.kind==='claim'?'<p class="hint">Kalkulatory „Co mi się należy” mają przycisk zgłoszenia — wynik i dane klienta trafiają do CRM jako nowa sprawa w wybranej kategorii.</p>':''}</div>
   <div class="box"><h3>Pola wejściowe <button class="btn sm" data-st="addIn()">+ Pole</button></h3><div class="tw"><table>
     <tr><th>Zmienna</th><th>Etykieta</th><th>Jedn.</th><th>Domyślna</th><th>Min</th><th>Max</th><th>Krok</th><th></th></tr>${ins}</table></div></div>
   <div class="box"><h3>Wyniki <button class="btn sm" data-st="addOut()">+ Wynik</button></h3><div class="tw"><table>
     <tr><th title="Wynik główny">★</th><th>Zmienna</th><th>Etykieta</th><th>Wzór</th><th>Jedn.</th><th>Miejsca po przec.</th><th></th></tr>${outs}</table></div>
     <p class="hint">Wzory to wyrażenia JavaScript. Dostępne: zmienne wejściowe, wyniki z wierszy <b>powyżej</b> oraz funkcje <code>pow</code>, <code>sqrt</code>, <code>round</code>, <code>min</code>, <code>max</code>, <code>abs</code>, <code>log</code>, <code>PI</code>. Warunki: <code>a&gt;b ? x : y</code>.</p>
     <h3 style="margin-top:18px">Test na wartościach domyślnych</h3><div class="test" id="stTest"></div></div>
  </div></div>`;
}
function testCalc(){
  const t=$('#stTest');if(!t)return;const c=D.calculators[ki];
  const scope=Object.fromEntries(c.inputs.map(i=>[i.key,Number(i.default)||0]));
  t.innerHTML=c.outputs.map(o=>{let v,err='';
    try{v=new Function(...Object.keys(scope),'with(Math){return ('+o.formula+')}')(...Object.values(scope));if(!Number.isFinite(v))err='nie jest liczbą'}catch(e){err=e.message}
    scope[o.key]=Number(v);
    return `<div><span>${esc(o.label)}${o.main?' ★':''}</span>${err?`<b class="err">⚠ ${esc(err)}</b>`:`<b>${Number(v).toLocaleString('pl-PL',{maximumFractionDigits:o.decimals??2})} ${esc(o.unit)}</b>`}</div>`}).join('');
}
function addCalc(){D.calculators.push({id:uid('calc_'),name:'Nowy kalkulator',icon:'🧮',description:'',inputs:[{key:'a',label:'Wartość A',unit:'',default:10,min:0,max:100,step:1},{key:'b',label:'Wartość B',unit:'',default:5,min:0,max:100,step:1}],outputs:[{key:'suma',label:'Suma',formula:'a+b',unit:'',decimals:0,main:true}]});ki=D.calculators.length-1;render()}
function delCalc(){if(confirm('Usunąć kalkulator?')){D.calculators.splice(ki,1);ki=0;render()}}
function addIn(){D.calculators[ki].inputs.push({key:'x'+D.calculators[ki].inputs.length,label:'Nowe pole',unit:'',default:0,min:0,max:100,step:1});render()}
function addOut(){D.calculators[ki].outputs.push({key:'w'+D.calculators[ki].outputs.length,label:'Nowy wynik',formula:'0',unit:'',decimals:2});render()}

/* uzupełnienie brakujących sekcji (np. stary szkic sprzed aktualizacji) */
function norm(){
  const O=ORIG||{};
  D.seo={...structuredClone(O.seo||{}),...(D.seo||{})};
  D.i18n=D.i18n||structuredClone(O.i18n||{mode:'own',languages:['pl']});
  D.translations=D.translations||structuredClone(O.translations||{});
  ['uk','en'].forEach(l=>D.translations[l]=D.translations[l]||{});
  D.contracts=D.contracts||structuredClone(O.contracts||{enabled:false,maxMB:15,formats:['pdf','docx','txt'],disclaimer:'',rules:[]});
  D.contracts.legal=D.contracts.legal||structuredClone(O.contracts?.legal||{enabled:false,maxInterest:14.5,maxDefault:18.5,rules:[]});
  D.contracts.suspicion=D.contracts.suspicion||structuredClone(O.contracts?.suspicion||{enabled:false,longSentence:40,longWeight:4,longMax:20,indicators:[]});
  D.leads=D.leads||structuredClone(O.leads||{enabled:true,mode:'supabase',email:'',consent:''});
  if(O.calculators&&!D.calculators.some(c=>c.kind==='claim'))D.calculators=[...structuredClone(O.calculators.filter(c=>c.kind==='claim')),...D.calculators];
  delete D.site.adminHash;
  D.site.chatbot=D.site.chatbot||structuredClone(O.site?.chatbot||{enabled:false,src:''});
}

/* ---------- Tłumaczenia ---------- */
const LN={uk:'Ukraiński',en:'Angielski'};
// teksty interfejsu strony (index.html) — źródło po polsku
const UI_KEYS=['Porównaj','Kalkulatory','Panel','Motyw','Porównuj mądrzej.','Licz szybciej.','kategorii','ofert','kalkulatorów','Porównywarka','Zaznacz do 4 ofert, aby zestawić je obok siebie.','Szukaj oferty…','Sortuj: domyślnie','rosnąco','malejąco','Wyniki liczą się na bieżąco.','Panel administracyjny','Wybrano','Wyczyść','Porównanie','Zobacz →','Tak','Nie','Brak wyników.','Brak kategorii.','PODGLĄD — szkic z CRM (nieopublikowany)','Używamy plików cookie do analityki.','Akceptuję','Odrzuć','Umowy','Analiza umów','Analizuj umowę →','Wgraj umowę, a wskażemy ryzykowne zapisy, kwoty, terminy i daty.','Przeciągnij plik tutaj lub kliknij, aby wybrać','Obsługiwane formaty:','lub wklej treść umowy','Analizuj','Plik nie opuszcza Twojej przeglądarki — analiza odbywa się lokalnie.','Wczytywanie pliku…','Ryzyko','niskie','średnie','wysokie','Wysokie ryzyko','Do sprawdzenia','Informacyjnie','Brak zapisu','Wykryte dane','Kwoty','Daty','Okresy','Procenty','Pokaż pełny tekst','Pobierz raport','Nowa analiza','Nie wykryto zapisów z listy kontrolnej.','słów','stron','Nie udało się odczytać tekstu — plik może być skanem (obraz). Wklej treść ręcznie.','Nieobsługiwany format pliku.','Stary format .doc nie jest obsługiwany — zapisz plik jako .docx lub PDF.','Plik jest za duży. Maksymalny rozmiar:','Raport analizy umowy','Nie udało się wczytać pliku.','Wklej tekst','Zgodność z prawem','Podejrzana treść','Ryzyko zapisów','Podstawowa analiza','Styl i przejrzystość treści','Podstawa:','Nie wykryto naruszeń z listy kontrolnej.','Nie wykryto podejrzanych sygnałów.','Średnia długość zdania:','Długie zdania','Bardzo długie zdania utrudniają zrozumienie i mogą ukrywać istotne warunki.','limit:','dobrze','uwaga','źle','Ryzyko prawne','za opóźnienie','Co mi się należy','Sprawdź, co Ci się należy →','Porównaj usługi','Sprawdź, co Ci się należy','Wstępny szacunek w kilka minut. Dokładną analizę Twojej sprawy przygotuje kancelaria.','Chcę bezpłatną analizę mojej sprawy →','Bezpłatna analiza Twojej sprawy','Imię i nazwisko','Telefon','E-mail','Krótko o sprawie (opcjonalnie)','Wyślij zgłoszenie','Dziękujemy!','Otworzyliśmy Twój program pocztowy z gotową wiadomością — wyślij ją, a kancelaria skontaktuje się z Tobą.','Wysyłanie…','Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę lub zadzwoń do kancelarii.','Zgłoszenie wysłane. Kancelaria skontaktuje się z Tobą — zwykle w ciągu 1 dnia roboczego.','Zbyt wiele zgłoszeń z tego adresu e-mail. Spróbuj ponownie za godzinę lub zadzwoń do kancelarii.'];
let TL=[],tlQ='',tlMiss=false;
function collect(){
  const out=new Map(),add=(s,ctx)=>{s=String(s??'').trim();if(s&&!/^[\d\s.,%+\-*/()]+$/.test(s)&&!out.has(s))out.set(s,ctx)};
  add(D.site.name,'Strona');add(D.leads?.consent,'Formularz zgłoszenia');add(D.site.tagline,'Strona');add(D.seo.title,'SEO');add(D.seo.description,'SEO');
  D.categories.forEach(c=>{const x='Kategoria: '+c.name;add(c.name,x);
    c.fields.forEach(f=>{add(f.label,x);add(f.unit,x)});
    c.items.forEach(it=>{add(it.name,x);add(it.badge,x);c.fields.filter(f=>f.type==='text').forEach(f=>add(it.values[f.key],x))})});
  D.calculators.forEach(c=>{const x='Kalkulator: '+c.name;add(c.name,x);add(c.description,x);add(c.note,x);
    c.inputs.forEach(i=>{add(i.label,x);add(i.unit,x)});c.outputs.forEach(o=>{add(o.label,x);add(o.unit,x)})});
  add(D.contracts?.disclaimer,'Analiza umów');(D.contracts?.rules||[]).forEach(r=>{add(r.name,'Analiza umów');add(r.advice,'Analiza umów')});
  (D.contracts?.legal?.rules||[]).forEach(r=>{add(r.name,'Analiza umów — prawo');add(r.advice,'Analiza umów — prawo')});
  (D.contracts?.suspicion?.indicators||[]).forEach(r=>{add(r.name,'Analiza umów — styl');add(r.explain,'Analiza umów — styl')});
  UI_KEYS.forEach(k=>add(k,'Interfejs strony'));
  const used=new Set(out.keys());
  ['uk','en'].forEach(l=>Object.keys(D.translations[l]||{}).forEach(k=>{if(!used.has(k))out.set(k,'Nieużywane')}));
  return [...out].map(([s,ctx])=>({s,ctx}));
}
const langsOn=()=>(D.i18n.languages||[]).filter(l=>l!=='pl');
function vI18n(){
  const i=D.i18n,on=langsOn();
  return `<div class="box"><h3>Ustawienia tłumaczeń</h3><div class="form">
     <label>Tryb tłumaczenia<select class="f" id="tlMode">
       <option value="own" ${i.mode!=='google'?'selected':''}>Własne — tłumaczenia z tabeli poniżej</option>
       <option value="google" ${i.mode==='google'?'selected':''}>Google Translate — automatycznie</option></select></label>
     <label>Języki na stronie<span style="display:flex;gap:16px;padding:9px 0;color:var(--txt)">
       <span>🇵🇱 Polski (źródłowy)</span>
       ${Object.keys(LN).map(l=>`<label style="display:flex;gap:6px;align-items:center;font-weight:500;font-size:.88rem"><input type="checkbox" class="tlLang" value="${l}" ${on.includes(l)?'checked':''} style="accent-color:var(--accent)">${LN[l]}</label>`).join('')}</span></label></div>
     <p class="hint">${i.mode==='google'
       ?'<b>Google:</b> strona jest pisana po polsku, a widget Google tłumaczy ją automatycznie po wybraniu języka. Zero pracy, ale jakość i terminologia zależą od Google, a tłumaczenie działa w przeglądarce (dla wyszukiwarki strona zostaje po polsku). Tabela niżej jest zachowana — możesz wrócić do trybu własnego.'
       :'<b>Własne:</b> każdy tekst tłumaczysz w tabeli. Brakujące tłumaczenie = na stronie pokaże się tekst polski. Przycisk <b>G↗</b> otwiera Tłumacza Google z danym tekstem, żeby szybko skopiować propozycję.'}</p></div>
   <div class="box"><h3>Teksty <span id="tlProg" style="font-weight:500;color:var(--mut);font-size:.85rem"></span></h3>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
       <input class="f" id="tlQ" placeholder="Szukaj tekstu…" value="${esc(tlQ)}" style="max-width:280px">
       <label style="display:flex;gap:6px;align-items:center;color:var(--mut)"><input type="checkbox" id="tlMiss" ${tlMiss?'checked':''} style="accent-color:var(--accent)">Tylko brakujące</label>
       <button class="btn sm del" data-st="delUnused()" style="margin-left:auto">Usuń nieużywane</button></div>
     <div class="tw"><table><thead><tr><th>Polski (źródło)</th>${on.map(l=>`<th>${LN[l]}</th>`).join('')}</tr></thead><tbody id="tlBody"></tbody></table></div>
     <p class="hint">Zmiana tekstu polskiego w kategoriach/kalkulatorach tworzy nowy wpis — stare tłumaczenie trafia do „Nieużywane”.</p></div>`;
}
function renderTl(){
  const on=langsOn(),q=tlQ.toLowerCase();TL=collect();
  const prog=on.map(l=>{const n=TL.filter(x=>x.ctx!=='Nieużywane').length,ok=TL.filter(x=>x.ctx!=='Nieużywane'&&D.translations[l]?.[x.s]).length;return `${LN[l]}: ${ok}/${n}`}).join(' · ');
  $('#tlProg').textContent=prog;
  let last='';
  $('#tlBody').innerHTML=TL.map((x,i)=>({...x,i})).filter(x=>(!q||x.s.toLowerCase().includes(q)||on.some(l=>(D.translations[l]?.[x.s]||'').toLowerCase().includes(q)))&&(!tlMiss||on.some(l=>!D.translations[l]?.[x.s]))).map(x=>{
    const grp=x.ctx!==last?`<tr><td colspan="${on.length+1}" style="padding-top:14px;color:var(--accent);font-weight:700;font-size:.78rem">${esc(x.ctx)}</td></tr>`:'';last=x.ctx;
    return grp+`<tr><td style="max-width:320px">${esc(x.s)}</td>${on.map(l=>`<td><div style="display:flex;gap:4px"><input class="f" data-tl="${l}" data-i="${x.i}" value="${esc(D.translations[l]?.[x.s]||'')}" style="min-width:200px;${D.translations[l]?.[x.s]?'':'border-color:color-mix(in srgb,var(--warn) 50%,var(--line))'}">
      <a class="btn sm" target="_blank" rel="noopener" title="Otwórz w Tłumaczu Google" href="https://translate.google.com/?sl=pl&tl=${l}&op=translate&text=${encodeURIComponent(x.s)}" style="text-decoration:none">G↗</a></div></td>`).join('')}</tr>`}).join('')||`<tr><td class="hint">Brak tekstów.</td></tr>`;
}
VIEW.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.tl){const s=TL[el.dataset.i].s,l=el.dataset.tl,v=el.value.trim();if(v)D.translations[l][s]=v;else delete D.translations[l][s];save();el.style.borderColor=v?'':'color-mix(in srgb,var(--warn) 50%,var(--line))'}
  if(el.id==='tlQ'){tlQ=el.value;renderTl()}
});
VIEW.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='tlMiss'){tlMiss=el.checked;renderTl()}
  if(el.id==='tlMode'){D.i18n.mode=el.value;render()}
  if(el.classList.contains('tlLang')){const s=new Set(langsOn());el.checked?s.add(el.value):s.delete(el.value);D.i18n.languages=['pl',...Object.keys(LN).filter(l=>s.has(l))];render()}
});
function delUnused(){const u=TL.filter(x=>x.ctx==='Nieużywane');if(!u.length)return toast('Brak nieużywanych');if(!confirm(`Usunąć ${u.length} nieużywanych tłumaczeń?`))return;u.forEach(x=>['uk','en'].forEach(l=>delete D.translations[l][x.s]));render()}

/* ---------- SEO ---------- */
function vSeo(){
  const s=D.seo,P='seo',inp=(k,l,ph='',extra='')=>`<label>${l}<input class="f" data-p="${P}.${k}" value="${esc(s[k]??'')}" placeholder="${esc(ph)}" ${extra}></label>`,
    chk=(k,l)=>`<label style="display:flex;gap:8px;align-items:center;color:var(--txt);font-weight:500"><input type="checkbox" data-p="${P}.${k}" ${s[k]?'checked':''} style="accent-color:var(--accent);width:18px;height:18px">${l}</label>`;
  return `<div class="box"><h3>Wynik w Google <span id="seoScore" style="font-size:.85rem"></span></h3>
     <div id="serp" style="background:#fff;color:#202124;border-radius:12px;padding:16px 18px;font-family:Arial,sans-serif;max-width:640px"></div>
     <ul id="seoChecks" class="hint" style="list-style:none;display:grid;gap:4px;margin-top:12px"></ul></div>
   <div class="box"><h3>Podstawowe</h3><div class="form">
     <label style="grid-column:1/-1">Tytuł strony <span id="cTitle"></span><input class="f" data-p="${P}.title" value="${esc(s.title)}"></label>
     <label style="grid-column:1/-1">Opis (meta description) <span id="cDesc"></span><textarea class="f" data-p="${P}.description" rows="3">${esc(s.description)}</textarea></label>
     ${inp('keywords','Słowa kluczowe (po przecinku)','porównywarka, kalkulator')}
     ${inp('siteUrl','Adres strony (kanoniczny)','https://…/')}
     ${inp('author','Autor')}
     ${inp('themeColor','Kolor paska przeglądarki (mobile)','#0b0d14')}</div>
     <p class="hint">Tytuł i opis są tłumaczone w zakładce <b>Tłumaczenia</b> (grupa „SEO”) — wersje językowe dostają je w meta tagach i <code>hreflang</code>.</p></div>
   <div class="box"><h3>Indeksowanie</h3><div class="form">
     ${chk('robotsIndex','Pozwól indeksować (index)')}
     ${chk('robotsFollow','Pozwól śledzić linki (follow)')}
     <label>Częstotliwość zmian (sitemap)<select class="f" data-p="${P}.sitemapChangefreq">${['always','hourly','daily','weekly','monthly','yearly','never'].map(v=>`<option ${s.sitemapChangefreq===v?'selected':''}>${v}</option>`).join('')}</select></label>
     ${inp('sitemapPriority','Priorytet (sitemap, 0.0–1.0)','1.0')}
     <label style="grid-column:1/-1">Dodatkowe reguły robots.txt<textarea class="f code" data-p="${P}.robotsExtra" rows="3" placeholder="Disallow: /prywatne/">${esc(s.robotsExtra)}</textarea></label></div>
     <p class="hint"><code>crm.html</code> jest zawsze wyłączony z indeksowania.</p></div>
   <div class="box"><h3>Google i Bing</h3><div class="form">
     ${inp('googleVerification','Google Search Console — kod weryfikacji','zawartość content="…"')}
     ${inp('bingVerification','Bing Webmaster — kod weryfikacji')}
     ${inp('gaId','Google Analytics 4 — identyfikator','G-XXXXXXXXXX')}
     ${chk('consentBanner','Pytaj o zgodę na cookies przed włączeniem Analytics (RODO)')}</div></div>
   <div class="box"><h3>Udostępnianie (Facebook, LinkedIn, X)</h3><div class="form">
     ${inp('ogImage','Obrazek podglądu (URL, 1200×630)','https://…/og.png')}
     <label>Karta X / Twitter<select class="f" data-p="${P}.twitterCard">${['summary_large_image','summary'].map(v=>`<option ${s.twitterCard===v?'selected':''}>${v}</option>`).join('')}</select></label>
     ${inp('twitterSite','Konto X (@nazwa)','@')}</div>
     <div id="ogPrev" style="margin-top:14px;max-width:520px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--bg2)"></div></div>
   <div class="box"><h3>Dane strukturalne (schema.org)</h3><div class="form">
     <label>Typ<select class="f" data-p="${P}.schemaType">${[['','— wyłączone'],['WebSite','WebSite'],['Organization','Organization'],['LocalBusiness','LocalBusiness']].map(([v,l])=>`<option value="${v}" ${s.schemaType===v?'selected':''}>${l}</option>`).join('')}</select></label>
     ${inp('orgName','Nazwa firmy / organizacji')}
     ${inp('orgLogo','Logo (URL)','https://…/logo.png')}</div></div>
   <div class="box"><h3>Zaawansowane</h3>
     <label class="hint" style="display:grid;gap:6px;font-weight:600">Własny kod w &lt;head&gt; (np. inne meta, piksel)<textarea class="f code" data-p="${P}.headExtra" rows="4">${esc(s.headExtra)}</textarea></label>
     <h3 style="margin-top:16px">Podgląd plików generowanych przy publikacji</h3>
     <div class="form"><label>robots.txt<textarea class="f code" id="pRobots" rows="6" readonly></textarea></label>
     <label>sitemap.xml<textarea class="f code" id="pSitemap" rows="6" readonly></textarea></label></div>
     <p class="hint">Meta tagi, <code>robots.txt</code> i <code>sitemap.xml</code> tworzy automatycznie GitHub Actions (<code>build_seo.py</code>) z pliku <code>data.json</code> w repozytorium — po zmianach SEO pobierz go w zakładce „Publikacja” i podmień w repo.</p></div>`;
}
const trS=(l,s)=>l==='pl'?s:(D.translations[l]?.[s]||s);
function seoPreview(){
  if(!$('#serp'))return;
  const s=D.seo,url=(s.siteUrl||'').trim(),title=s.title||D.site.name,desc=s.description||'';
  const host=url.replace(/^https?:\/\//,'').replace(/\/$/,'');
  $('#serp').innerHTML=`<div style="font-size:12px;color:#4d5156">${esc(host||'twoja-strona.pl')}</div>
    <div style="font-size:20px;color:#1a0dab;margin:2px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(title.length>60?title.slice(0,58)+'…':title)}</div>
    <div style="font-size:14px;line-height:1.5;color:#4d5156">${esc(desc.length>160?desc.slice(0,157)+'…':desc)}</div>`;
  const cnt=(n,a,b)=>`<span style="color:${n>=a&&n<=b?'var(--good)':'var(--warn)'};font-weight:500">(${n} zn., zalecane ${a}–${b})</span>`;
  $('#cTitle').innerHTML=cnt(title.length,30,60);$('#cDesc').innerHTML=cnt(desc.length,70,160);
  const langs=['pl',...langsOn()];
  const checks=[
    [title.length>=30&&title.length<=60,'Długość tytułu 30–60 znaków'],
    [desc.length>=70&&desc.length<=160,'Długość opisu 70–160 znaków'],
    [/^https:\/\/.+\/$/.test(url),'Adres strony z https:// i ukośnikiem na końcu'],
    [s.robotsIndex,'Indeksowanie włączone'],
    [!!s.ogImage,'Obrazek podglądu do udostępniania'],
    [!!s.googleVerification,'Weryfikacja Google Search Console'],
    [!!s.schemaType,'Dane strukturalne schema.org'],
    [langs.length<2||langs.slice(1).every(l=>D.translations[l]?.[s.title]&&D.translations[l]?.[s.description]),'Tytuł i opis przetłumaczone na wszystkie języki'],
    [D.i18n.mode!=='google'||langs.length<2,'Tłumaczenia własne (Google Translate nie jest widoczny dla wyszukiwarki)']];
  const ok=checks.filter(c=>c[0]).length;
  $('#seoScore').innerHTML=`<span style="color:${ok>=7?'var(--good)':'var(--warn)'}">${ok}/${checks.length}</span>`;
  $('#seoChecks').innerHTML=checks.map(([v,l])=>`<li>${v?'✅':'⚠️'} ${l}</li>`).join('');
  $('#ogPrev').innerHTML=(s.ogImage?`<img src="${esc(s.ogImage)}" alt="" style="width:100%;aspect-ratio:1.91;object-fit:cover;display:block" onerror="this.style.display='none'">`:`<div style="aspect-ratio:1.91;display:grid;place-items:center;color:var(--mut);background:var(--card2)">brak obrazka</div>`)+
    `<div style="padding:10px 12px"><div class="hint" style="margin:0">${esc(host.toUpperCase())}</div><b>${esc(title)}</b><div class="hint" style="margin:2px 0 0">${esc(desc.slice(0,110))}</div></div>`;
  const base=url||'https://twoja-strona.pl/';
  $('#pRobots').value=`User-agent: *\n${s.robotsIndex?'Allow: /':'Disallow: /'}\nDisallow: ${new URL('crm.html',base).pathname}\n${s.robotsExtra?s.robotsExtra.trim()+'\n':''}\nSitemap: ${base}sitemap.xml`;
  const today=new Date().toISOString().slice(0,10);
  $('#pSitemap').value=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
    langs.map(l=>`  <url>\n    <loc>${base}${l==='pl'?'':'?lang='+l}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${s.sitemapChangefreq}</changefreq>\n    <priority>${s.sitemapPriority}</priority>\n`+
      (langs.length>1?langs.map(a=>`    <xhtml:link rel="alternate" hreflang="${a}" href="${base}${a==='pl'?'':'?lang='+a}"/>\n`).join(''):'')+`  </url>`).join('\n')+`\n</urlset>`;
}
VIEW.addEventListener('input',e=>{if(view==='seo'&&e.target.dataset.p)seoPreview()});
VIEW.addEventListener('change',e=>{if(view==='seo'&&e.target.dataset.p)seoPreview()});

/* ---------- Analiza umów ---------- */
const FMT={pdf:'PDF',docx:'Word (.docx)',odt:'OpenDocument (.odt)',rtf:'RTF',txt:'Tekst (.txt, .md)',html:'HTML'};
const LVL={high:'🔴 wysokie',medium:'🟠 do sprawdzenia',info:'🔵 informacyjnie'};
const MODE={present:'gdy występuje',missing:'gdy brakuje',interest:'odsetki > limit'};
let ruleTest='Umowa zawarta w dniu 01.11.2026. Umowa przedłuża się automatycznie na kolejny rok. W przypadku wcześniejszego rozwiązania umowy Klient zapłaci opłatę 300 zł. Odsetki za opóźnienie wynoszą 25% w skali roku. Sądem właściwym jest sąd właściwy dla siedziby Sprzedawcy. Szczegóły określa regulamin, w szczególności cennik.';
const chkBox=(path,on,label)=>`<label style="display:flex;gap:10px;align-items:center;color:var(--txt);font-weight:500"><input type="checkbox" data-p="${path}" ${on?'checked':''} style="accent-color:var(--accent);width:18px;height:18px">${label}</label>`;
const patCell=(path,arr)=>`<td><textarea class="f code" data-pat="${path}" rows="3" style="min-width:220px">${esc((arr||[]).join('\n'))}</textarea></td>`;
const rowBtns=(list,i)=>`<td style="white-space:nowrap"><button class="btn sm" data-st="mvRule('${list}',${i})">↑</button> <button class="btn sm del" data-st="delRule('${list}',${i})">✕</button></td>`;
function ruleTable(list,withBasis,modes){
  const arr=getP(list);
  return `<div class="tw"><table><tr><th>Nazwa</th><th>Poziom / kiedy</th><th>Wzorce (jeden w linii)</th><th>Porada dla użytkownika</th>${withBasis?'<th>Podstawa prawna</th>':''}<th></th></tr>
   ${arr.map((r,i)=>{const P=`${list}.${i}`;return `<tr style="vertical-align:top">
    <td><input class="f" data-p="${P}.name" value="${esc(r.name)}" style="min-width:170px"></td>
    <td><select class="f" data-p="${P}.level">${Object.entries(LVL).map(([v,l])=>`<option value="${v}" ${r.level===v?'selected':''}>${l}</option>`).join('')}</select>
      <select class="f" data-p="${P}.mode" style="margin-top:4px">${modes.map(v=>`<option value="${v}" ${(r.mode||'present')===v?'selected':''}>${MODE[v]}</option>`).join('')}</select></td>
    ${patCell(P,r.patterns)}
    <td><textarea class="f" data-p="${P}.advice" rows="3" style="min-width:220px">${esc(r.advice)}</textarea></td>
    ${withBasis?`<td><input class="f" data-p="${P}.basis" value="${esc(r.basis||'')}" style="min-width:140px" placeholder="np. art. 385³ KC"></td>`:''}
    ${rowBtns(list,i)}</tr>`}).join('')}</table></div>`;
}
function vContracts(){
  const C=D.contracts,P='contracts',L=C.legal,S=C.suspicion;
  return `<div class="box"><h3>Ustawienia</h3><div class="form">
     ${chkBox(P+'.enabled',C.enabled,'Pokaż analizę umów na stronie')}
     <label>Maks. rozmiar pliku (MB)<input class="f" type="number" min="1" max="100" data-t="num" data-p="${P}.maxMB" value="${C.maxMB}"></label>
     <label style="grid-column:1/-1">Dozwolone formaty<span style="display:flex;flex-wrap:wrap;gap:14px;color:var(--txt);font-weight:500;padding:6px 0">${Object.entries(FMT).map(([k,l])=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="fmt" value="${k}" ${C.formats.includes(k)?'checked':''} style="accent-color:var(--accent)">${l}</label>`).join('')}</span></label>
     <label style="grid-column:1/-1">Zastrzeżenie pod wynikiem<input class="f" data-p="${P}.disclaimer" value="${esc(C.disclaimer)}"></label></div>
     <p class="hint">Pliki są analizowane w przeglądarce odwiedzającego — nic nie trafia na serwer. Skany (PDF bez warstwy tekstu) i stary format .doc nie są obsługiwane; strona poprosi wtedy o wklejenie tekstu.</p></div>
   <div class="box"><h3>📋 Podstawowa analiza — reguły (${C.rules.length}) <button class="btn sm pri" data-st="addRule('contracts.rules')">+ Reguła</button></h3>
     ${ruleTable('contracts.rules',false,['present','missing'])}
     <p class="hint"><b>Wzorce</b> to wyrażenia regularne, wielkość liter nie ma znaczenia. Przykłady: <code>kar[aąy] umown</code> (różne odmiany), <code>okres\\w* wypowiedzeni</code> (<code>\\w*</code> = dowolna końcówka), <code>.{0,60}</code> = do 60 dowolnych znaków pomiędzy. Wystarczy też zwykły fragment tekstu, np. <code>weksel</code>.<br>
     <b>Gdy brakuje</b> — reguła zgłasza problem, jeśli w umowie <i>nie</i> znaleziono żadnego wzorca.<br>
     <b>Pasek „Ryzyko zapisów”</b> 0–100: wysokie = 3 pkt, do sprawdzenia = 2 pkt, informacyjne = 0 pkt (w stosunku do sumy wszystkich reguł).</p></div>
   <div class="box"><h3>⚖️ Zgodność z prawem (${L.rules.length}) <button class="btn sm pri" data-st="addRule('contracts.legal.rules')">+ Reguła</button></h3>
     <div class="form" style="margin-bottom:14px">
       ${chkBox(P+'.legal.enabled',L.enabled,'Włącz dział „Zgodność z prawem”')}
       <label>Odsetki maksymalne umowne (% rocznie)<input class="f" type="number" step="0.01" data-t="num" data-p="${P}.legal.maxInterest" value="${L.maxInterest}"></label>
       <label>Odsetki maksymalne za opóźnienie (% rocznie)<input class="f" type="number" step="0.01" data-t="num" data-p="${P}.legal.maxDefault" value="${L.maxDefault}"></label></div>
     <p class="hint" style="margin-bottom:12px">Limity zależą od stopy referencyjnej NBP: umowne = 2 × (stopa + 3,5 pp), za opóźnienie = 2 × (stopa + 5,5 pp). Przy stopie 3,75% (od 5.03.2026): 14,5% i 18,5%. <b>Zaktualizuj po każdej zmianie stóp przez RPP.</b></p>
     ${ruleTable('contracts.legal.rules',true,['present','missing','interest'])}
     <p class="hint"><b>Odsetki &gt; limit</b> — wzorce wskazują słowa (np. „odsetki”), a reguła sprawdza procenty do 120 znaków dalej. Jeśli w pobliżu jest „opóźnienie” lub „zwłoka”, porównuje z limitem za opóźnienie.<br>
     <b>Pasek „Ryzyko prawne”</b>: wysokie = 30 pkt, do sprawdzenia = 15 pkt, informacyjne = 5 pkt (maks. 100). Reguły są wskazówkami, nie oceną prawną.</p></div>
   <div class="box"><h3>🔍 Podejrzana treść — wskaźniki (${S.indicators.length}) <button class="btn sm pri" data-st="addInd()">+ Wskaźnik</button></h3>
     <div class="form" style="margin-bottom:14px">
       ${chkBox(P+'.suspicion.enabled',S.enabled,'Włącz dział „Styl i przejrzystość”')}
       <label>Długie zdanie = ponad (słów)<input class="f" type="number" data-t="num" data-p="${P}.suspicion.longSentence" value="${S.longSentence}"></label>
       <label>Punkty za każde długie zdanie<input class="f" type="number" data-t="num" data-p="${P}.suspicion.longWeight" value="${S.longWeight}"></label>
       <label>Maks. punktów za długie zdania<input class="f" type="number" data-t="num" data-p="${P}.suspicion.longMax" value="${S.longMax}"></label></div>
     <div class="tw"><table><tr><th>Nazwa</th><th>Wzorce (jeden w linii)</th><th>Pkt / wystąpienie</th><th>Maks. pkt</th><th>Wyjaśnienie</th><th></th></tr>
     ${S.indicators.map((r,i)=>{const Q=`${P}.suspicion.indicators.${i}`;return `<tr style="vertical-align:top">
       <td><input class="f" data-p="${Q}.name" value="${esc(r.name)}" style="min-width:170px"></td>${patCell(Q,r.patterns)}
       <td><input class="f" type="number" data-t="num" data-p="${Q}.weight" value="${r.weight}" style="width:70px"></td>
       <td><input class="f" type="number" data-t="num" data-p="${Q}.max" value="${r.max}" style="width:70px"></td>
       <td><textarea class="f" data-p="${Q}.explain" rows="3" style="min-width:200px">${esc(r.explain)}</textarea></td>${rowBtns(P+'.suspicion.indicators',i)}</tr>`}).join('')}</table></div>
     <p class="hint"><b>Pasek „Podejrzana treść”</b> = suma punktów wskaźników (każdy ograniczony swoim maksimum) + punkty za długie zdania, maks. 100. Zielony 0–29, żółty 30–59, czerwony 60+.</p></div>
   <div class="box"><h3>Tester reguł</h3>
     <textarea class="f" id="ruleTest" rows="4" placeholder="Wklej fragment umowy…">${esc(ruleTest)}</textarea>
     <div id="ruleOut" style="margin-top:12px;display:grid;gap:6px"></div></div>`;
}
function testRules(){
  const o=$('#ruleOut');if(!o)return;const txt=ruleTest,C=D.contracts;
  const row=(r,kind)=>{
    let bad=[],hits=[];(r.patterns||[]).forEach(p=>{try{const m=txt.match(new RegExp(p,'gi'));if(m)hits.push(...m)}catch(e){bad.push(p)}});
    let found=hits.length>0,flag=r.mode==='missing'?!found:found,info='';
    if(r.mode==='interest'){const pc=[...txt.matchAll(/(\d+(?:[.,]\d+)?)\s?%/g)].map(m=>parseFloat(m[1].replace(',','.')));const over=pc.filter(v=>v>Math.min(C.legal.maxInterest,C.legal.maxDefault));flag=found&&over.length>0;info=flag?'powyżej limitu: '+over.join('%, ')+'%':''}
    return `<div style="display:flex;gap:10px;align-items:baseline;font-size:.85rem"><span style="width:20px">${bad.length?'⚠️':flag?'✅':'·'}</span><span style="width:24px">${kind}</span><b style="min-width:240px;color:${flag?'var(--txt)':'var(--mut)'}">${esc(r.name)}</b>
      <span class="hint" style="margin:0">${bad.length?'<span style="color:var(--bad)">błędny wzorzec: '+esc(bad.join(', '))+'</span>':info||(r.mode==='missing'?(found?'zapis jest — OK':'<b>brak zapisu → zgłoszone</b>'):(found?esc([...new Set(hits)].slice(0,4).join(' · ')):''))}</span></div>`};
  o.innerHTML=C.rules.map(r=>row(r,'📋')).join('')+C.legal.rules.map(r=>row(r,'⚖️')).join('')+C.suspicion.indicators.map(r=>row(r,'🔍')).join('');
}
function addRule(list){getP(list).push({id:uid('r_'),name:'Nowa reguła',level:'medium',mode:'present',patterns:['fragment tekstu'],advice:'',...(list.includes('legal')?{basis:''}:{})});render()}
function addInd(){D.contracts.suspicion.indicators.push({id:uid('s_'),name:'Nowy wskaźnik',patterns:['fragment tekstu'],weight:4,max:20,explain:''});render()}
function delRule(list,i){const a=getP(list);if(confirm('Usunąć „'+a[i].name+'”?')){a.splice(i,1);render()}}
function mvRule(list,i){const a=getP(list);if(i<1)return;[a[i-1],a[i]]=[a[i],a[i-1]];render()}
VIEW.addEventListener('input',e=>{
  if(view!=='contracts')return;const el=e.target;
  if(el.dataset.pat){getP(el.dataset.pat).patterns=el.value.split('\n').map(x=>x.trim()).filter(Boolean);save()}
  if(el.id==='ruleTest')ruleTest=el.value;
  testRules();
});
VIEW.addEventListener('change',e=>{
  if(view==='contracts'&&e.target.classList.contains('fmt')){D.contracts.formats=[...document.querySelectorAll('.fmt:checked')].map(x=>x.value);save()}
});
})();

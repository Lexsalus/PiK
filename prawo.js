/* Prawo — wspólny moduł strony, CRM i czatu Adam.
   Czyta dane z prawo/*.json (codzienna synchronizacja z API Sejmu, tools/prawo_sync.py) i daje:
   - PRAWO.linkify(html)  — klikalne przepisy („art. 385³ pkt 10 KC”) z podglądem treści artykułu,
   - PRAWO.ods            — aktualne odsetki ustawowe (ODS_KAP, ODS_OPOZN, ODS_HANDL, ODS_MAX, ODS_MAX_OPOZN),
   - PRAWO.search(q)      — wyszukiwarka artykułów obserwowanych ustaw,
   - PRAWO.contractRefs() — podstawy prawne w umowie (uchylone ustawy, nieaktualne artykuły, Dz.U.),
   - PRAWO.asOf(id, data) — tekst jednolity i nowelizacje dla stanu prawnego na dzień.
   Treść z ISAP ma charakter informacyjny — prawnie wiążący jest tekst ogłoszony w Dzienniku Ustaw. */
(function(){
'use strict';
if(window.PRAWO)return;
const BASE=new URL('prawo/',(document.currentScript&&document.currentScript.src)||location.href).href;
const ELI='https://api.sejm.gov.pl/eli/acts/';
const cache={},texts={};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const DIA={'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
/* normalizacja jak w czacie Ilona (małe litery, bez polskich znaków i interpunkcji) */
const norm=s=>String(s||'').toLowerCase().replace(/[ąćęłńóśźż]/g,c=>DIA[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const supNum=s=>String(s).replace(/\^(\d+)/g,(m,d)=>[...d].map(x=>SUP[x]).join(''));
const fmtD=d=>{if(!d)return '';const [y,m,dd]=String(d).slice(0,10).split('-');return dd?`${dd}.${m}.${y}`:d};

async function load(name){
  if(!cache[name])cache[name]=fetch(BASE+name+'.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).catch(e=>{delete cache[name];throw e});
  return cache[name];
}
async function text(id){
  if(!texts[id])texts[id]=fetch(BASE+'teksty/'+encodeURIComponent(id)+'.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(t=>{t.map=new Map(t.art.map(a=>[a[0],a]));return t}).catch(e=>{delete texts[id];throw e});
  return texts[id];
}

/* ---------- akty i skróty ---------- */
let ACTS=null,ACT_RX=null,ABBR=new Map();
const DEFAULT_ABBR={kc:['KC','k.c.','Kodeksu cywilnego','kodeksu cywilnego','Kodeks cywilny'],kpc:['KPC','k.p.c.','Kodeksu postępowania cywilnego'],ukk:['ukk','u.k.k.','ustawy o kredycie konsumenckim'],upk:['ustawy o prawach konsumenta'],pb:['Prawa bankowego','prawa bankowego','pr. bank.']};
function buildAbbr(list){
  ABBR=new Map();list.forEach(a=>(a.skrot||[]).forEach(s=>ABBR.set(s.toLowerCase(),a.id)));
  const keys=[...ABBR.keys()].sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  ACT_RX=keys.length?new RegExp('^\\s*(?:ustawy\\s+[-–]\\s+)?('+keys.join('|')+')(?![\\p{L}\\d])','iu'):null;
}
buildAbbr(Object.entries(DEFAULT_ABBR).map(([id,skrot])=>({id,skrot})));
async function acts(){
  if(ACTS)return ACTS;
  const d=await load('akty');ACTS=d;buildAbbr(d.akty||[]);return d;
}
const act=id=>(ACTS?.akty||[]).find(a=>a.id===id);
const textUrl=eli=>eli?ELI+eli+'/text.html':'';
const pdfUrl=eli=>eli?ELI+eli+'/text.pdf':'';
const isapUrl=eli=>{const [p,y,pos]=String(eli).split('/');return pos?`https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=W${p==='MP'?'MP':'DU'}${y}000${String(pos).padStart(4,'0')}`:''};
const curTj=a=>(a?.tj||[]).find(t=>t.html)||(a?.tj||[])[0]||null;

/* ---------- rozpoznawanie przepisów w tekście ---------- */
const NUM='(\\d+[a-z]{0,3}(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]+|\\^\\d+)?)';
const SUB='(?:\\s*(?:§|ust\\.|pkt|lit\\.|zd\\.|zdanie)\\s*[0-9a-z⁰¹²³⁴⁵⁶⁷⁸⁹^]+\\)?)';
const ART_RX=new RegExp('\\bart\\.\\s*'+NUM+'('+SUB+'*)','giu');
const CHAIN_RX=/^\s*(?:,|i|oraz|lub|albo|w zw\.\s*z|w związku z)\s*art\./iu;
function findRefs(str){
  const out=[];let m;ART_RX.lastIndex=0;
  while((m=ART_RX.exec(str))){
    const rest=str.slice(m.index+m[0].length,m.index+m[0].length+90);
    let id=null,end=m.index+m[0].length,am=ACT_RX&&rest.match(ACT_RX);
    if(am){id=ABBR.get(am[1].toLowerCase());end+=am[0].length}
    out.push({start:m.index,end,artEnd:m.index+m[0].length,art:supNum(m[1]),sub:supNum(m[2]||'').trim(),id,chain:!id&&CHAIN_RX.test(rest),label:str.slice(m.index,end)});
  }
  for(let i=out.length-2;i>=0;i--)if(!out[i].id&&out[i].chain&&out[i+1].id)out[i].id=out[i+1].id; // „art. 359 § 2¹ i art. 481 § 2¹ KC”
  return out;
}
/* html: tekst już zabezpieczony (esc). Linkujemy tylko przepisy rozpoznanych ustaw. */
function linkify(html){
  if(!html||!/art\./i.test(html))return html;
  const refs=findRefs(html).filter(r=>r.id);if(!refs.length)return html;
  let out='',pos=0;
  refs.forEach(r=>{if(r.start<pos)return;const a=act(r.id),tj=curTj(a);
    out+=html.slice(pos,r.start)+`<a class="przepis" href="${esc(textUrl(tj?.eli||a?.eli)||'#')}" target="_blank" rel="noopener" data-akt="${esc(r.id)}" data-art="${esc(r.art)}" data-sub="${esc(r.sub)}">${html.slice(r.start,r.end)}</a>`;pos=r.end});
  return out+html.slice(pos);
}
async function article(id,nr){
  const t=await text(id);return t.map.get(supNum(nr))||null;
}

/* ---------- podgląd przepisu ---------- */
let tip=null,tipFor=null,hideT=0;
function css(){
  if(document.getElementById('prawo-css'))return;
  const s=document.createElement('style');s.id='prawo-css';
  s.textContent=`a.przepis{color:inherit;text-decoration:underline dotted color-mix(in srgb,var(--accent,#7c5cff) 70%,transparent);text-underline-offset:3px;cursor:help}
a.przepis:hover{color:var(--accent,#7c5cff)}
.prawo-tip{position:fixed;z-index:2147483000;max-width:min(460px,calc(100vw - 24px));max-height:min(60vh,420px);overflow:auto;background:var(--card,#151927);color:var(--txt,#e8eaf3);border:1px solid var(--line,#262c42);border-radius:14px;box-shadow:0 18px 50px -12px rgba(0,0,0,.55);padding:14px 16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}
.prawo-tip h5{margin:0 0 2px;font-size:14px}.prawo-tip .pm{color:var(--mut,#8b92ad);font-size:12px;margin-bottom:8px}
.prawo-tip .pt{white-space:pre-line}.prawo-tip .pt.unc{color:var(--mut,#8b92ad);font-style:italic}
.prawo-tip .pf{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:12px}.prawo-tip .pf a{color:var(--accent,#7c5cff)}
.prawo-tip .pw{margin-top:8px;font-size:11px;color:var(--mut,#8b92ad)}
.prawo-tip .bad{color:var(--bad,#ff6b81);font-weight:600}`;
  document.head.appendChild(s);
}
function place(el,a){
  const r=a.getBoundingClientRect(),w=el.offsetWidth,h=el.offsetHeight;
  let x=Math.min(Math.max(12,r.left),innerWidth-w-12),y=r.bottom+8;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-8);
  el.style.left=x+'px';el.style.top=y+'px';
}
async function showTip(a){
  css();clearTimeout(hideT);if(tipFor===a&&tip)return;
  tipFor=a;if(!tip){tip=document.createElement('div');tip.className='prawo-tip';tip.setAttribute('role','tooltip');
    tip.onmouseenter=()=>clearTimeout(hideT);tip.onmouseleave=()=>hideTip(250);document.body.appendChild(tip)}
  const id=a.dataset.akt,nr=a.dataset.art,sub=a.dataset.sub;
  tip.innerHTML=`<div class="pm">Wczytywanie przepisu…</div>`;tip.hidden=false;place(tip,a);
  let A=null,art=null,T=null,err='';
  try{await acts();A=act(id)}catch(e){}
  try{T=await text(id);art=T.map.get(nr)||null}catch(e){err='Treść artykułu niedostępna — otwórz pełny tekst.'}
  if(tipFor!==a)return;
  const tj=curTj(A),gone=A&&A.obowiazuje==='NOT_IN_FORCE';
  tip.innerHTML=`<h5>Art. ${esc(nr)}${sub?' '+esc(sub):''} — ${esc(A?.nazwa||T?.nazwa||id)}</h5>
    <div class="pm">${art?.[2]?esc(art[2])+' · ':''}${T?.adres?'tekst jednolity '+esc(T.adres):tj?'tekst jednolity '+esc(tj.adres):''}${A?.liczba_zmian&&tj?` · nowelizacje po nim: ${(A.zmieniajace||[]).filter(z=>(z.ogloszono||'')>(tj.ogloszono||'')).length}`:''}</div>
    ${gone?`<div class="bad">Akt nie obowiązuje (${esc(A.status||'')})</div>`:''}
    ${art?`<div class="pt">${esc(art[1])}</div>`:`<div class="pt unc">${esc(err||'Nie znaleziono tego artykułu w tekście jednolitym.')}</div>`}
    <div class="pf">${tj||A?`<a href="${esc(textUrl(tj?.eli||A.eli))}" target="_blank" rel="noopener">Pełny tekst ↗</a><a href="${esc(isapUrl(tj?.eli||A.eli))}" target="_blank" rel="noopener">ISAP ↗</a>`:''}</div>
    <div class="pw">Tekst informacyjny z ISAP (Sejm). Prawnie wiążący jest tekst w Dzienniku Ustaw.</div>`;
  place(tip,a);
}
function hideTip(ms){clearTimeout(hideT);hideT=setTimeout(()=>{if(tip)tip.hidden=true;tipFor=null},ms||0)}
const touch=matchMedia('(hover: none)').matches;
document.addEventListener('mouseover',e=>{if(touch)return;const a=e.target.closest?.('a.przepis');if(a)showTip(a)});
document.addEventListener('mouseout',e=>{if(touch)return;const a=e.target.closest?.('a.przepis');if(a&&!a.contains(e.relatedTarget))hideTip(250)});
document.addEventListener('click',e=>{
  const a=e.target.closest?.('a.przepis');
  if(a&&touch&&tipFor!==a){e.preventDefault();showTip(a);return} // pierwsze stuknięcie: podgląd, drugie: pełny tekst
  if(tip&&!tip.hidden&&!e.target.closest?.('.prawo-tip')&&!a)hideTip(0);
},true);
addEventListener('scroll',()=>{if(tip&&!tip.hidden&&tipFor)place(tip,tipFor)},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip(0)});

/* ---------- odsetki ustawowe ---------- */
const ods={ODS_KAP:7.25,ODS_OPOZN:9.25,ODS_HANDL:13.75,ODS_MAX:14.5,ODS_MAX_OPOZN:18.5,_zrodlo:null};
async function loadOds(){
  try{const o=await load('odsetki');
    if(o.kapitalowe?.stawka)ods.ODS_KAP=o.kapitalowe.stawka;
    if(o.opoznienie?.stawka)ods.ODS_OPOZN=o.opoznienie.stawka;
    if(o.handlowe?.stawka)ods.ODS_HANDL=o.handlowe.stawka;
    ods.ODS_MAX=o.maks_umowne||+(2*ods.ODS_KAP).toFixed(2);ods.ODS_MAX_OPOZN=o.maks_opoznienie||+(2*ods.ODS_OPOZN).toFixed(2);
    ods._zrodlo=o;return ods}catch(e){return ods}
}
/* {ODS_OPOZN} w etykietach kalkulatorów → „9,25” */
const odsLabel=s=>String(s??'').replace(/\{(ODS_[A-Z_]+)\}/g,(m,k)=>k in ods?Number(ods[k]).toLocaleString('pl-PL',{maximumFractionDigits:2}):m);
const odsScope=()=>{const o={};Object.keys(ods).forEach(k=>{if(!k.startsWith('_'))o[k]=ods[k]});return o};

/* ---------- wyszukiwarka artykułów ---------- */
const STOP=new Set('a aby albo ale ani az bo by byc czy do gdy go i ich ich ja jak jaki jakie jest jesli juz ma mam mi mnie moge moj na nad nie nim o od oraz po pod przez przy sa sie ta tak te ten to tu w we wiec z za ze zeby co czego kiedy ktory ktora ktore mozna moze czym jakim mojej moim moja'.split(' '));
const stem=w=>w.length>6?w.slice(0,6):w;
const toks=s=>norm(s).split(' ').filter(w=>w.length>1&&!STOP.has(w)).map(stem);
const IDX={};
async function index(id){
  if(IDX[id])return IDX[id];
  const t=await text(id),docs=t.art.map(a=>{const tk=toks(a[1]),hd=toks(a[2]||'');const tf=new Map();tk.forEach(w=>tf.set(w,(tf.get(w)||0)+1));hd.forEach(w=>tf.set(w,(tf.get(w)||0)+3)); // tytuł rozdziału liczy się mocniej
    return{a,tf,len:tk.length+hd.length}});
  const df=new Map();docs.forEach(d=>d.tf.forEach((v,w)=>df.set(w,(df.get(w)||0)+1)));
  return IDX[id]={t,docs,df,avg:docs.reduce((s,d)=>s+d.len,0)/(docs.length||1)};
}
async function textIds(){const d=await acts().catch(()=>null);return (d?.akty||[]).filter(a=>a.tekst!==false).map(a=>a.id)}
/* q: pytanie; opts.ids: ustawy; opts.limit. Zwraca [{id,nazwa,adres,nr,text,head,score}] */
const SYN={internet:'odleglosc',internecie:'odleglosc',online:'odleglosc',sklep:'przedsiebiorca',najem:'najmu',wynajem:'najmu',alimenty:'alimentacyjny',rozwod:'rozwiazanie',dlug:'dluznik',dlugi:'dluznik',bank:'bank',kredyt:'kredytu'};
const ACT_W={kc:1.25,upk:1.2,ukk:1.2,kro:1.15,ukh:1,frank:1.1,uksc:.9,kpc:.8,pu:.8,pb:.75};
async function search(q,opts={}){
  const nq=norm(q),qt=[...new Set(toks(q).concat(nq.split(' ').filter(w=>SYN[w]).map(w=>stem(SYN[w]))))];if(!qt.length)return[];
  // bezpośrednie odwołanie: „art. 45 ukk”
  await acts().catch(()=>{});
  const direct=findRefs(supNum(q)).filter(r=>r.id);
  const res=[];
  for(const r of direct){try{const t=await text(r.id),a=t.map.get(r.art);if(a)res.push({id:r.id,nazwa:t.nazwa,adres:t.adres,nr:a[0],text:a[1],head:a[2],score:999})}catch(e){}}
  if(res.length)return res;
  const ids=opts.ids||await textIds();
  for(const id of ids){
    let I;try{I=await index(id)}catch(e){continue}
    const N=I.docs.length;
    I.docs.forEach(d=>{let s=0;qt.forEach(w=>{const f=d.tf.get(w);if(!f)return;const idf=Math.log(1+(N-I.df.get(w)+.5)/(I.df.get(w)+.5));s+=idf*(f*2.2)/(f+1.2*(.25+.75*d.len/I.avg))});
      s*=ACT_W[id]||1;if(s>0&&!/^\(uchylon|^\(brak treści/.test(d.a[1]))res.push({id,nazwa:I.t.nazwa,adres:I.t.adres,nr:d.a[0],text:d.a[1],head:d.a[2],score:s})});
  }
  return res.sort((a,b)=>b.score-a.score).slice(0,opts.limit||5);
}

/* ---------- stan prawny na dzień ---------- */
async function asOf(id,date){
  await acts();const a=act(id);if(!a)return null;const d=String(date||new Date().toISOString()).slice(0,10);
  const tj=(a.tj||[]).filter(t=>(t.ogloszono||'')<=d).sort((x,y)=>(y.ogloszono||'').localeCompare(x.ogloszono||''))[0]||null;
  const after=(a.zmieniajace||[]).filter(z=>(z.wejscie||z.ogloszono||'')<=d&&(!tj||(z.ogloszono||z.wejscie||'')>(tj.ogloszono||''))).slice(0,30);
  const later=(a.zmieniajace||[]).filter(z=>(z.wejscie||'')>d).slice(0,30);
  return{act:a,date:d,tj,after,later,link:textUrl(tj?.eli||a.eli)};
}

/* ---------- podstawy prawne w umowie ---------- */
async function contractRefs(raw){
  const out=[];let d;try{d=await acts()}catch(e){return null}
  const str=supNum(raw).replace(/\s+/g,' ');
  // 1) powołania uchylonych ustaw (nazwa)
  (d.uchylone||[]).forEach(u=>{(u.wzorce||[]).forEach(p=>{let rx;try{rx=new RegExp(p,'giu')}catch(e){return}const m=str.match(rx);if(m){const z=u.zastapiony&&act(u.zastapiony);
    out.push({lvl:u.obowiazuje==='IN_FORCE'?'info':'high',kind:'uchylona',label:m[0],title:u.nazwa,note:u.obowiazuje==='IN_FORCE'?`Akt ma status: ${u.status||'?'}`:`Ustawa nie obowiązuje (${u.status||'uchylona'}).${z?' Obecnie właściwa: '+z.nazwa+'.':''}`,link:isapUrl(u.eli),count:m.length})}})});
  // 2) Dz.U. — rok, (Nr), poz.
  const known=new Map();(d.akty||[]).forEach(a=>{known.set(a.eli,{a,kind:'akt'});(a.tj||[]).forEach(t=>known.set(t.eli,{a,kind:'tj',t}));(a.zmieniajace||[]).forEach(z=>known.set(z.eli,{a,kind:'zm',z}))});
  (d.uchylone||[]).forEach(u=>known.set(u.eli,{u,kind:'uchylona'}));
  const seen=new Set();
  for(const m of str.matchAll(/Dz\.\s*U\.\s*(?:z\s*)?(\d{4})\s*(?:r\.)?\s*(?:,?\s*Nr\s*(\d+))?\s*,?\s*poz\.\s*(\d+)/giu)){
    const eli=`DU/${m[1]}/${m[3]}`;if(seen.has(eli))continue;seen.add(eli);const k=known.get(eli);
    if(!k)out.push({lvl:'info',kind:'dzu',label:m[0],title:`Dz.U. ${m[1]}${m[2]?' Nr '+m[2]:''} poz. ${m[3]}`,note:'Akt spoza obserwowanych — sprawdź status w ISAP.',link:isapUrl(eli)});
    else if(k.kind==='uchylona')out.push({lvl:k.u.obowiazuje==='IN_FORCE'?'info':'high',kind:'dzu',label:m[0],title:k.u.nazwa,note:`Akt ${k.u.status||'uchylony'}.`,link:isapUrl(eli)});
    else if(k.kind==='akt'||k.kind==='tj'){const cur=curTj(k.a),old=k.kind==='tj'&&cur&&cur.eli!==eli;
      out.push({lvl:k.a.obowiazuje==='NOT_IN_FORCE'?'high':old?'info':'ok',kind:'dzu',label:m[0],title:k.a.nazwa,note:k.a.obowiazuje==='NOT_IN_FORCE'?`Akt nie obowiązuje (${k.a.status}).`:old?`Powołano wcześniejszy tekst jednolity (${k.t.adres}); aktualny: ${cur.adres}. Zwykle to nie błąd — sprawdź, czy chodzi o stan prawny z dnia zawarcia umowy.`:'Obowiązuje.',link:isapUrl(eli)})}
    else out.push({lvl:'info',kind:'dzu',label:m[0],title:k.z.tytul||eli,note:`Ustawa zmieniająca ${k.a.nazwa}.`,link:isapUrl(eli)});
  }
  // 3) artykuły obserwowanych ustaw — czy istnieją i nie są uchylone
  const refs=findRefs(str).filter(r=>r.id),done=new Set();
  for(const r of refs){const key=r.id+'|'+r.art;if(done.has(key))continue;done.add(key);const a=act(r.id);let art=null,has=false;
    try{const t=await text(r.id);has=true;art=t.map.get(r.art)}catch(e){}
    if(!has){out.push({lvl:'ok',kind:'art',label:r.label,title:`art. ${r.art} — ${a?.nazwa||r.id}`,note:a?.obowiazuje==='NOT_IN_FORCE'?'Akt nie obowiązuje.':'Ustawa obowiązuje (treść artykułu niedostępna offline).',id:r.id,art:r.art});continue}
    const gone=art&&/^\(?uchylony\)?\.?$/i.test(art[1].trim());
    out.push({lvl:!art||gone?'high':'ok',kind:'art',label:r.label,title:`art. ${r.art}${r.sub?' '+r.sub:''} — ${a?.nazwa||r.id}`,note:!art?'Nie ma takiego artykułu w aktualnym tekście jednolitym — mógł zostać uchylony lub przenumerowany.':gone?'Artykuł uchylony.':'Artykuł obowiązuje.',id:r.id,art:r.art});
  }
  return out;
}

window.PRAWO={BASE,load,text,acts,act,linkify,findRefs,article,showTip,hideTip,ods,loadOds,odsLabel,odsScope,search,asOf,contractRefs,textUrl,pdfUrl,isapUrl,curTj,norm,esc,fmtD,supNum};
})();

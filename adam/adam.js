/* Adam — asystent prawny strony Porównaj.to.
   Bot regułowy działający w całości w przeglądarce (bez AI i bez wysyłania pytań na zewnątrz).
   Z czatu Ilona (repo Lexsalus/Ilona) przejęte: normalizacja tekstu i dopasowanie fraz z tolerancją literówek,
   widżet w Shadow DOM (style strony nie mieszają się z czatem), pełny ekran na telefonie, pamięć rozmowy w sesji.
   Wiedza: adam/wiedza.json; przepisy, odsetki, zmiany w prawie: prawo.js + prawo/*.json (API Sejmu).
   Osadzenie: <script src="adam/adam.js" defer></script> */
(function(){
'use strict';
if(window.__adam)return;window.__adam=true;
const SCRIPT=document.currentScript;
const BASE=new URL('./',SCRIPT?SCRIPT.src:location.href).href;           // …/adam/
const ROOT=new URL('../',BASE).href;                                      // …/ (strona)
const KEY='adam_rozmowa_v1';

/* ---------- tekst (z czatu Ilona: chat/core/text.js) ---------- */
const DIA={'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
const normalize=s=>String(s||'').toLowerCase().replace(/(.)\1{2,}/g,'$1').replace(/[ąćęłńóśźż]/g,c=>DIA[c]).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
function editDistance(a,b,max=1){
  if(Math.abs(a.length-b.length)>max)return max+1;
  let prev=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){const cur=[i];let rowMin=i;
    for(let j=1;j<=b.length;j++){cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));if(cur[j]<rowMin)rowMin=cur[j]}
    if(rowMin>max)return max+1;prev=cur}
  return prev[b.length];
}
function wordMatches(tok,w,prefix,fuzzy){
  if(prefix?tok.startsWith(w):tok===w)return true;if(!fuzzy)return false;
  if(prefix){if(w.length<6||tok.length<w.length-1)return false;for(let k=w.length-1;k<=w.length+1;k++)if(k<=tok.length&&editDistance(tok.slice(0,k),w)<=1)return true;return false}
  return w.length>=5&&tok.length>=5&&editDistance(tok,w)<=1;
}
function matchesPhrase(words,phrase){
  let fuzzy=true;if(phrase.startsWith('=')){phrase=phrase.slice(1);fuzzy=false}
  const parts=phrase.split(' ').filter(Boolean).map(w=>w.endsWith('*')?[w.slice(0,-1),true]:[w,false]);
  if(!parts.length)return false;
  outer:for(let i=0;i+parts.length<=words.length;i++){for(let j=0;j<parts.length;j++)if(!wordMatches(words[i+j],parts[j][0],parts[j][1],fuzzy))continue outer;return true}
  return false;
}

/* ---------- dane ---------- */
let W=null;
const wiedza=()=>W||(W=fetch(BASE+'wiedza.json',{cache:'no-cache'}).then(r=>r.json()));
const prawo=()=>window.PRAWO?Promise.resolve(window.PRAWO):new Promise((ok,no)=>{const s=document.createElement('script');s.src=ROOT+'prawo.js';s.onload=()=>ok(window.PRAWO);s.onerror=no;document.head.appendChild(s)});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtD=d=>{if(!d)return '';const [y,m,dd]=String(d).slice(0,10).split('-');return `${dd}.${m}.${y}`};
const pct=v=>v==null?'—':String(v).replace('.',',')+'%';

/* ---------- odpowiedzi ---------- */
/* wynik intencji: najdłuższa dopasowana fraza + 0,1 za każdą kolejną; „waga” obniża intencje ogólne */
function score(words,it){let best=0,n=0;for(const p of it.frazy){if(matchesPhrase(words,p)){n++;const l=p.replace(/[=*]/g,'').split(' ').length;if(l>best)best=l}}return best?(best+.1*(n-1))*(it.waga??1):0}
async function answer(q){
  const K=await wiedza(),P=await prawo().catch(()=>null);
  const n=normalize(q),words=n.split(' ').filter(Boolean);
  // 1) bezpośrednie odwołanie do przepisu: „art. 45 ukk”
  if(P&&/\bart\.?\s*\d/i.test(q)){
    await P.acts().catch(()=>{});
    const qq=q.replace(/\bart\s+(\d)/i,'art. $1');
    const refs=P.findRefs(P.supNum(qq)).filter(r=>r.id);
    if(refs.length){const out=[];
      for(const r of refs.slice(0,2)){let a=null;try{a=await P.article(r.id,r.art)}catch(e){}const A=P.act(r.id);
        out.push(a?{html:`<b>Art. ${esc(r.art)} — ${esc(A?.nazwa||r.id)}</b>${a[2]?`<div class="mut">${esc(a[2])}</div>`:''}<div class="art">${esc(a[1])}</div>`,src:r}:{html:`Nie znalazłem art. ${esc(r.art)} w aktualnym tekście ${esc(A?.nazwa||r.id)} — mógł zostać uchylony albo przenumerowany.`})}
      return{html:out.map(o=>o.html).join('<hr>')+`<div class="mut small">Tekst informacyjny z ISAP. Wiążący jest Dziennik Ustaw.</div>`,buttons:[{label:'📞 Bezpłatna analiza sprawy',akcja:'href:#nalezy'}]};
    }
  }
  // 2) intencje z wiedzy
  let best=null,bs=0;
  for(const it of K.intencje){const s=score(words,it);if(s>bs||(s===bs&&s>0&&it.id==='nagle')){best=it;bs=s}}
  if(best&&bs>0){
    let html=best.odp.startsWith('@')?await dynamic(best.odp.slice(1),P):esc(best.odp);
    if(P&&best.przepisy?.length){await P.acts().catch(()=>{});html+=`<div class="refs">📜 ${best.przepisy.map(x=>P.linkify(esc(x))).join(' · ')}</div>`}
    const buttons=best.przyciski==='start'?K.start:(best.przyciski||[]);
    return{html,buttons,id:best.id};
  }
  // 3) wyszukiwanie w przepisach
  if(P&&words.length>=2){
    let res=[];try{res=await P.search(q,{limit:3})}catch(e){}
    res=res.filter(r=>r.score>2.5);
    if(res.length){
      return{html:`Nie mam gotowej odpowiedzi, ale te przepisy mogą dotyczyć Twojego pytania:`+res.map(r=>`<div class="hit">${P.linkify(esc(`art. ${r.nr} `+(shortName(P,r.id)||r.nazwa)))} <span class="mut">— ${esc(r.nazwa)}</span><div class="art clip">${esc(r.text.slice(0,420))}${r.text.length>420?'…':''}</div></div>`).join('')+`<div class="mut small">${esc(K.zastrzezenie)}</div>`,
        buttons:[{label:'📞 Bezpłatna analiza sprawy',akcja:'href:#nalezy'},{label:'💰 Co mi się należy?',akcja:'ask:co mi sie nalezy'}]};
    }
  }
  return{html:`Nie jestem pewien, o co chodzi. Napisz, czego dotyczy sprawa (np. „kredyt gotówkowy”, „długi”, „frankowy”, „opłata sądowa”), wpisz przepis („art. 118 KC”) albo wybierz temat:`,buttons:K.start};
}
function shortName(P,id){const a=P.act(id);if(!a)return '';const s=(a.skrot||[]).find(x=>/^[a-zA-Z.]{2,8}$/.test(x));return s||a.skrot?.[0]||''}
async function dynamic(kind,P){
  if(!P)return 'Dane prawne są chwilowo niedostępne. Spróbuj za chwilę.';
  if(kind==='odsetki'){await P.loadOds();const o=P.ods._zrodlo||{};
    return `Aktualne odsetki ustawowe${o.opoznienie?.od?' (od '+fmtD(o.opoznienie.od)+')':''}:<ul><li>za opóźnienie: <b>${pct(P.ods.ODS_OPOZN)}</b> rocznie</li><li>kapitałowe: <b>${pct(P.ods.ODS_KAP)}</b></li><li>w transakcjach handlowych: <b>${pct(P.ods.ODS_HANDL)}</b></li><li>maksymalne umowne: <b>${pct(P.ods.ODS_MAX)}</b>, maksymalne za opóźnienie: <b>${pct(P.ods.ODS_MAX_OPOZN)}</b></li></ul><div class="mut small">Źródło: obwieszczenia w Monitorze Polskim${o.opoznienie?.adres?' ('+esc(o.opoznienie.adres)+')':''}, sprawdzane codziennie.</div>`}
  if(kind==='zmiany'){let z=[];try{z=(await P.load('zmiany')).zmiany||[]}catch(e){}
    if(!z.length)return 'Nie mam teraz listy zmian — spróbuj później.';
    const today=new Date().toISOString().slice(0,10);
    return `Ostatnie nowelizacje ustaw, którymi się zajmujemy:<ul>${z.slice(0,5).map(x=>`<li><b>${esc(x.nazwa)}</b> — <a href="${esc(P.isapUrl(x.eli))}" target="_blank" rel="noopener">${esc(x.tytul.replace(/^Ustawa z dnia /,'ustawa z '))}</a>${x.wejscie?` <span class="mut">(${x.wejscie>today?'wejdzie w życie':'w życie od'} ${fmtD(x.wejscie)})</span>`:''}</li>`).join('')}</ul>Więcej w sekcji „Zmiany w prawie”.`}
  if(kind==='projekty'){let p=[];try{p=(await P.load('projekty')).projekty||[]}catch(e){}
    if(!p.length)return 'Nie mam teraz listy projektów — spróbuj później.';
    return `Projekty w Sejmie w sprawach, którymi się zajmujemy:<ul>${p.slice(0,5).map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.tytul)}</a>${x.etap?` <span class="mut">— ${esc(x.etap)}${x.etap_data?', '+fmtD(x.etap_data):''}</span>`:''}</li>`).join('')}</ul>`}
  return '';
}

/* ---------- widżet ---------- */
const ICON_CHAT='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
const ICON_CLOSE='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_SEND='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
const CSS=`
:host{all:initial}
.w{--a:var(--accent,#7c5cff);--bgx:var(--bg2,#11141e);--cd:var(--card,#151927);--c2:var(--card2,#1b2032);--ln:var(--line,#262c42);--tx:var(--txt,#e8eaf3);--mu:var(--mut,#8b92ad);
  font:15px/1.5 'Plus Jakarta Sans',system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--tx);-webkit-font-smoothing:antialiased}
.w *{box-sizing:border-box}
.fab{position:fixed;right:20px;bottom:20px;z-index:2147482000;display:flex;align-items:center;gap:10px;border:0;cursor:pointer;padding:12px 18px 12px 14px;border-radius:999px;color:#fff;font-weight:600;font-size:15px;line-height:1;font-family:inherit;
  background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 45%,#2fd6a0));box-shadow:0 14px 34px -10px color-mix(in srgb,var(--a) 70%,transparent);transition:transform .2s}
.fab:hover{transform:translateY(-2px)}.fab[hidden]{display:none}
.pan{position:fixed;right:20px;bottom:20px;z-index:2147482001;width:min(400px,calc(100vw - 24px));height:min(620px,calc(100vh - 40px));display:flex;flex-direction:column;background:var(--bgx);border:1px solid var(--ln);border-radius:20px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.6)}
.pan[hidden]{display:none}
.hd{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;border-bottom:1px solid var(--ln);background:var(--cd)}
.av{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:18px;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 45%,#2fd6a0));flex:none}
.hd b{display:block;font-size:16px}.hd small{color:var(--mu);font-size:12px;display:flex;align-items:center;gap:6px}.hd small i{width:7px;height:7px;border-radius:50%;background:#2fd6a0;display:inline-block}
.x{margin-left:auto;width:36px;height:36px;border-radius:10px;border:1px solid var(--ln);background:var(--c2);color:var(--tx);cursor:pointer;display:grid;place-items:center}
.ms{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
.m{max-width:88%;padding:10px 13px;border-radius:16px;word-wrap:break-word}
.m.b{align-self:flex-start;background:var(--cd);border:1px solid var(--ln);border-bottom-left-radius:6px}
.m.u{align-self:flex-end;background:var(--a);color:#fff;border-bottom-right-radius:6px;white-space:pre-wrap}
.m ul{margin:6px 0 4px;padding-left:18px}.m li{margin:3px 0}.m a{color:var(--a)}.m.u a{color:#fff}
.m hr{border:0;border-top:1px solid var(--ln);margin:10px 0}
.mut{color:var(--mu)}.small{font-size:12px;margin-top:8px}
.art{white-space:pre-line;font-size:13.5px;margin-top:6px;max-height:260px;overflow:auto;padding:8px 10px;background:var(--c2);border-radius:10px}
.art.clip{max-height:140px}.hit{margin-top:10px}.refs{margin-top:8px;font-size:13px}
.refs a,.hit a{color:var(--a)}
.qs{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:100%}
.q{border:1px solid color-mix(in srgb,var(--a) 50%,var(--ln));background:color-mix(in srgb,var(--a) 10%,var(--cd));color:var(--tx);border-radius:999px;padding:7px 12px;font-weight:600;font-size:13px;line-height:1.2;font-family:inherit;cursor:pointer;text-align:left}
.q:hover{background:color-mix(in srgb,var(--a) 22%,var(--cd))}
.typ{align-self:flex-start;color:var(--mu);font-size:13px;padding:4px 6px}
.typ i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--mu);margin-right:3px;animation:d 1s infinite}.typ i:nth-child(2){animation-delay:.15s}.typ i:nth-child(3){animation-delay:.3s}
@keyframes d{0%,80%,100%{opacity:.25}40%{opacity:1}}
.ft{display:flex;gap:8px;padding:12px;border-top:1px solid var(--ln);background:var(--cd)}
.ft textarea{flex:1;resize:none;height:44px;max-height:120px;border:1px solid var(--ln);background:var(--bgx);color:var(--tx);border-radius:12px;padding:11px 12px;font-size:15px;line-height:1.35;font-family:inherit;outline:none}
.ft textarea:focus{border-color:var(--a)}
.sd{width:44px;height:44px;border-radius:12px;border:0;background:var(--a);color:#fff;cursor:pointer;display:grid;place-items:center;flex:none}
.disc{font-size:11px;color:var(--mu);text-align:center;padding:0 12px 10px;background:var(--cd)}
@media (max-width:600px),(pointer:coarse) and (max-height:500px){.pan{inset:0;width:100%;height:100%;border-radius:0;border:0}.fab{right:14px;bottom:14px}}
@media (prefers-reduced-motion:reduce){.fab{transition:none}.typ i{animation:none}}`;

function mount(){
  const host=document.createElement('div');host.id='adam-czat';document.body.appendChild(host);
  const sh=host.attachShadow({mode:'open'});
  // podgląd przepisu (prawo.js) działa w dokumencie — linki w czacie otwieramy przez showTip
  sh.innerHTML=`<style>${CSS}</style><div class="w">
    <button class="fab" aria-label="Otwórz czat z asystentem Adam">${ICON_CHAT}<span>Zapytaj Adama</span></button>
    <section class="pan" hidden role="dialog" aria-label="Czat — Adam, asystent prawny">
      <div class="hd"><div class="av">A</div><div><b>Adam</b><small><i></i><span class="sub">asystent prawny</span></small></div><button class="x" aria-label="Zamknij czat">${ICON_CLOSE}</button></div>
      <div class="ms" aria-live="polite"></div>
      <form class="ft"><textarea rows="1" placeholder="Napisz pytanie…" aria-label="Twoje pytanie"></textarea><button class="sd" aria-label="Wyślij">${ICON_SEND}</button></form>
      <div class="disc">Informacja, nie porada prawna · pytania nie opuszczają przeglądarki</div>
    </section></div>`;
  const $=s=>sh.querySelector(s),fab=$('.fab'),pan=$('.pan'),ms=$('.ms'),ta=$('textarea');
  let state={msgs:[],open:false};try{state=JSON.parse(sessionStorage.getItem(KEY))||state}catch(e){}
  const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({msgs:state.msgs.slice(-40),open:state.open}))}catch(e){}};
  const phone=()=>matchMedia('(max-width:600px),(pointer:coarse) and (max-height:500px)').matches;
  let prevOverflow='';
  function setOpen(o){state.open=o;pan.hidden=!o;fab.hidden=o;save();
    if(phone()){if(o){prevOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden'}else document.documentElement.style.overflow=prevOverflow}
    if(o){if(!state.msgs.length)greet();setTimeout(()=>ta.focus(),50);scroll()}}
  const scroll=()=>requestAnimationFrame(()=>{ms.scrollTop=ms.scrollHeight});
  function render(){ms.innerHTML='';state.msgs.forEach((m,i)=>add(m,i===state.msgs.length-1,false));scroll()}
  function add(m,last,push=true){
    if(push){state.msgs.push(m);save()}
    const d=document.createElement('div');d.className='m '+(m.who==='u'?'u':'b');
    if(m.who==='u')d.textContent=m.text;else d.innerHTML=m.html;
    ms.appendChild(d);
    if(m.buttons?.length&&last!==false){const q=document.createElement('div');q.className='qs';
      m.buttons.forEach(b=>{const x=document.createElement('button');x.className='q';x.type='button';x.textContent=b.label;x.onclick=()=>run(b);q.appendChild(x)});ms.appendChild(q)}
    scroll();
  }
  async function greet(){const K=await wiedza().catch(()=>null);if(!K)return;$('.sub').textContent=K.podpis||'asystent prawny';
    add({who:'b',html:esc(K.powitanie),buttons:K.start})}
  function clearQuick(){sh.querySelectorAll('.qs').forEach(x=>x.remove())}
  async function ask(text){
    text=String(text||'').trim().slice(0,600);if(!text)return;clearQuick();add({who:'u',text});
    const t=document.createElement('div');t.className='typ';t.innerHTML='<i></i><i></i><i></i>';ms.appendChild(t);scroll();
    let r;try{[r]=await Promise.all([answer(text),new Promise(ok=>setTimeout(ok,350))])}catch(e){console.error(e);r={html:'Coś poszło nie tak — spróbuj zadać pytanie inaczej.'}}
    t.remove();add({who:'b',html:r.html,buttons:r.buttons});
  }
  function run(b){
    const [k,...rest]=String(b.akcja||'').split(':'),v=rest.join(':');
    if(k==='ask')return ask(b.label.replace(/^[^\p{L}\d]+/u,'')||v);
    if(k==='info')return ask({odsetki:'odsetki',zmiany:'zmiany w prawie',projekty:'projekty ustaw w sejmie'}[v]||v);
    if(k==='calc'){if(typeof window.openCalc==='function'){window.openCalc(v,true);if(phone())setOpen(false)}else location.href=ROOT+'#nalezy';return}
    if(k==='href'){if(v.startsWith('#')){const el=document.querySelector(v);if(el){el.scrollIntoView({behavior:'smooth'});if(phone())setOpen(false)}else location.href=ROOT+v}else location.href=v}
  }
  fab.onclick=()=>setOpen(true);$('.x').onclick=()=>setOpen(false);
  $('.ft').onsubmit=e=>{e.preventDefault();const v=ta.value;ta.value='';ask(v)};
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('.ft').requestSubmit()}});
  sh.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
  // linki „przepis” w czacie: podgląd treści z prawo.js (zdarzenia z Shadow DOM)
  ms.addEventListener('mouseover',e=>{const a=e.target.closest('a.przepis');if(a&&window.PRAWO&&!matchMedia('(hover: none)').matches)PRAWO.showTip(a)});
  ms.addEventListener('mouseout',e=>{const a=e.target.closest('a.przepis');if(a&&window.PRAWO&&!a.contains(e.relatedTarget))PRAWO.hideTip(250)});
  ms.addEventListener('click',e=>{const a=e.target.closest('a.przepis');if(a&&window.PRAWO&&matchMedia('(hover: none)').matches&&!a.dataset.shown){e.preventDefault();a.dataset.shown=1;PRAWO.showTip(a)}});
  render();if(state.open)setOpen(true);
  window.Adam={open:()=>setOpen(true),close:()=>setOpen(false),ask:q=>{setOpen(true);ask(q)},answer};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
prawo().catch(()=>{});
})();

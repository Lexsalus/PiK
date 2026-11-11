/* CRM — zakładka „📜 Prawo”: strażnik zmian w ustawach, projekty z Sejmu, odsetki ustawowe, wyszukiwarka przepisów
   oraz karta „Przepisy” w zakładce Analiza sprawy (dołączenie przepisu ze stanem prawnym na dzień).
   Dane: prawo/*.json (codzienna synchronizacja z API Sejmu — tools/prawo_sync.py, workflow GitHub Actions).
   Nic tu nie zapisuje się w bazie poza wpisem w sprawie (case_entries, te same reguły co „+ Wpis”). */
(function(){
const P=window.PRAWO;if(!P){console.warn('prawo.js nie wczytany');return}
const seenKey=()=>'crm_prawo_seen_'+(ME?.id||'');
const getSeen=()=>{try{return localStorage.getItem(seenKey())||''}catch(e){return ''}};
const setSeen=v=>{try{localStorage.setItem(seenKey(),v)}catch(e){}};
let Z=null,A=null,PR=null,O=null,S=null,OR=null,loadErr='';
const openCases=cats=>myCases().filter(c=>c.status==='open'&&cats.includes(c.category));
/* nowe zmiany dotyczące kategorii moich spraw (licznik w menu) */
window.prawoNew=()=>{if(!Z||!ME)return 0;const s=getSeen(),mine=new Set(myCases().filter(c=>c.status==='open').map(c=>c.category));
  return Z.zmiany.filter(z=>(z.wykryto||'')>s&&(isAdmin()||z.kategorie.some(k=>mine.has(k)))).length};
async function loadAll(force){
  if(Z&&!force)return;
  const r=await Promise.allSettled([P.load('zmiany'),P.acts(),P.load('projekty'),P.loadOds().then(()=>P.load('odsetki')),P.load('stan'),P.load('orzeczenia')]);
  [Z,A,PR,O,S,OR]=r.map(x=>x.status==='fulfilled'?x.value:null);
  loadErr=r.slice(0,5).every(x=>x.status==='rejected')?'Dane prawne nie zostały jeszcze pobrane — synchronizacja z API Sejmu działa raz dziennie (GitHub Actions).':'';
  if(Z&&!Z.zmiany)Z.zmiany=[];
  lawNotify();
}
/* powiadomienia o zmianach w prawie w bazie: automat w Supabase (pg_cron + pg_net) raz dziennie;
   zapasowo — gdy Administrator otworzy CRM, wysyłamy świeże zmiany (baza powiadamia każdą zmianę tylko raz) */
async function lawNotify(){
  try{if(!Z?.zmiany?.length||!ME||!isAdmin()||sessionStorage.getItem('crm_law_notify')===String(Z.pobrano))return;
    sessionStorage.setItem('crm_law_notify',String(Z.pobrano));
    const od=new Date(Date.now()-14*864e5).toISOString().slice(0,10),z=Z.zmiany.filter(x=>(x.wykryto||'')>=od);if(!z.length)return;
    const r=await sb.rpc('law_notify',{p:{zmiany:z}});if(!r.error&&r.data>0){toast(`Wysłano ${r.data} powiadomień o zmianach w prawie`);if(typeof reload==='function'){await reload();renderShell()}}}
  catch(e){console.warn('law_notify',e)}
}
loadAll().then(()=>{if(ME)renderShell()}).catch(()=>{});

/* --- menu: pozycja „Prawo” przed „Treści strony” --- */
const origMenu=menuItems;
window.menuItems=menuItems=function(){const m=origMenu();if(!seesCases())return m;
  const i=m.findIndex(x=>x[0]==='strona'||x[0]==='ustawienia');m.splice(i<0?m.length:i,0,['prawo','📜','Prawo',prawoNew(),'n']);return m};

const TABS=[['zmiany','Zmiany w ustawach'],['projekty','Projekty w Sejmie'],['odsetki','Odsetki'],['przepisy','Przepisy'],['waluty','Kredyt walutowy'],['orzeczenia','Orzecznictwo'],['klauzule','Klauzule UOKiK'],['uodo','Decyzje UODO'],['urzedy','KNF · ZUS · KIS · UOKiK']];
const PRAWO_GROUPS=[{l:'Zmiany',c:'#c08cff',k:['zmiany','projekty']},{l:'Narzędzia',c:'#2fd6a0',k:['odsetki','przepisy','orzeczenia','waluty']},{l:'Urzędy',c:'#ff8a5c',k:['klauzule','uodo','urzedy']}];
Object.assign(TAB_TIPS,{zmiany:'Nowelizacje obserwowanych ustaw i ile spraw dotyczą.',projekty:'Projekty ustaw w Sejmie w kategoriach spraw.',odsetki:'Odsetki z obwieszczeń i kontrola kalkulatorów.',przepisy:'Wyszukiwarka przepisów i dołączanie do spraw.',klauzule:'Rejestr klauzul niedozwolonych UOKiK: wyszukiwarka i porównanie zapisu umowy z wpisami.',uodo:'Najnowsze decyzje Prezesa UODO.',urzedy:'Wyszukiwarki: interpretacje KIS (EUREKA), ZUS, KNF, decyzje UOKiK.',orzeczenia:'Najnowsze orzeczenia sądów w kategoriach spraw (SAOS) i wyszukiwarki orzeczeń.',waluty:'Symulacja kredytu CHF / EUR z kursów NBP: raty, wpłaty, saldo.'});
const catChips=ks=>(ks||[]).map(k=>catBadge(k)).join(' ');
const dl=(d)=>d?P.fmtD(d):'—';
ROUTES.prawo=(sub)=>{
  need(seesCases(),'Zakładka dostępna dla zespołu kancelarii.');
  sub=TABS.some(t=>t[0]===sub)?sub:'zmiany';
  return `<div class="ph"><div><h1>📜 Prawo</h1><p>Zmiany w ustawach i projekty z Sejmu dla kategorii spraw kancelarii · źródło: API Sejmu (ELI), aktualizacja raz dziennie</p></div></div>
  ${groupTabs(TABS,PRAWO_GROUPS,sub,t=>'#/prawo/'+t)}
  <div id="prawoView"><div class="empty">Wczytywanie danych prawnych…</div></div>`;
};
ROUTES.prawo.after=async(sub)=>{
  sub=TABS.some(t=>t[0]===sub)?sub:'zmiany';
  await loadAll();lawNotify();const V=$('#prawoView');if(!V)return;
  if(loadErr){V.innerHTML=`<div class="empty">${esc(loadErr)}</div>`;return}
  try{V.innerHTML=await VIEW[sub]();VIEW[sub].after?.()}catch(e){console.error(e);V.innerHTML=`<div class="empty">Błąd: ${esc(e.message)}</div>`}
  if(sub==='zmiany'&&Z?.zmiany?.length){setTimeout(()=>{setSeen(Z.zmiany[0].wykryto||'');renderShell()},1500)}
};
const stanLine=()=>S?`<p class="hint">Ostatnia synchronizacja: ${S.ostatnio?new Date(S.ostatnio).toLocaleString('pl-PL'):'—'}${S.wynik&&Object.values(S.wynik).some(v=>v!=='ok')?` · <span class="st-overdue">częściowo nieudana: ${esc(Object.entries(S.wynik).filter(([,v])=>v!=='ok').map(([k])=>k).join(', '))}</span>`:''}. Tekst w ISAP jest informacyjny — wiążący jest Dziennik Ustaw.</p>`:'';

const VIEW={};
let fCat='mine';
VIEW.zmiany=async()=>{
  const mine=new Set(myCases().filter(c=>c.status==='open').map(c=>c.category)),seen=getSeen(),today=iso(new Date());
  const list=(Z?.zmiany||[]).filter(z=>fCat==='all'||(fCat==='mine'?z.kategorie.some(k=>mine.has(k)):z.kategorie.includes(fCat)));
  const cats=[...new Set((A?.akty||[]).flatMap(a=>a.kategorie))];
  return `<div class="toolbar"><select class="f" id="pzCat"><option value="mine" ${fCat==='mine'?'selected':''}>Kategorie moich spraw</option><option value="all" ${fCat==='all'?'selected':''}>Wszystkie</option>${cats.map(k=>`<option value="${esc(k)}" ${fCat===k?'selected':''}>${esc(CAT(k).name)}</option>`).join('')}</select><span class="mut small">${list.length} nowelizacji (ostatnie 2 lata)</span></div>
  <div class="card"><h3>Nowelizacje obserwowanych ustaw</h3>${list.length?`<div class="tw"><table><tr><th>Wykryto</th><th>Ustawa</th><th>Akt zmieniający</th><th>Wejście w życie</th><th>Dotyczy</th></tr>${list.slice(0,150).map(z=>{const cs=openCases(z.kategorie);
    return `<tr><td>${dl(z.wykryto)}${(z.wykryto||'')>seen?' <span class="badge" style="background:var(--accent);color:#fff">nowe</span>':''}</td><td><b>${esc(z.nazwa)}</b><div>${catChips(z.kategorie)}</div></td>
    <td><a href="${esc(P.isapUrl(z.eli))}" target="_blank" rel="noopener">${esc(z.tytul)}</a><div class="mut small">${esc(z.eli)}${z.ogloszono?' · ogłoszono '+dl(z.ogloszono):''}</div></td>
    <td>${dl(z.wejscie)}${z.wejscie&&z.wejscie>today?' <span class="badge">wejdzie w życie</span>':''}</td>
    <td>${cs.length?`<span data-tip="${esc(cs.slice(0,12).map(c=>c.number).join(', '))}"><b>${cs.length}</b> ${cs.length===1?'sprawa':'spraw'}</span>`:'<span class="mut">—</span>'}</td></tr>`}).join('')}</table></div>`:'<div class="empty">Brak nowelizacji w wybranych kategoriach.</div>'}</div>
  <div class="card" style="margin-top:14px"><h3>Obserwowane ustawy</h3><div class="tw"><table><tr><th>Ustawa</th><th>Status</th><th>Tekst jednolity</th><th>Nowelizacje</th><th>Kategorie</th></tr>${(A?.akty||[]).map(a=>{const tj=P.curTj(a);
    return `<tr><td><b>${esc(a.nazwa)}</b><div class="mut small">${esc(a.adres||a.eli)}</div></td><td>${a.obowiazuje==='IN_FORCE'?'<span class="badge st-open">obowiązuje</span>':`<span class="badge">${esc(a.status||'—')}</span>`}</td>
      <td>${tj?`<a href="${esc(P.textUrl(tj.eli))}" target="_blank" rel="noopener">${esc(tj.adres)}</a>`:'—'}</td><td>${a.liczba_zmian||0}${a.zmieniajace?.[0]?.wejscie?`<div class="mut small">ostatnia: ${dl(a.zmieniajace[0].wejscie)}</div>`:''}</td><td>${catChips(a.kategorie)}</td></tr>`}).join('')}</table></div>
    <p class="hint">Listę ustaw zmieniasz w CRM → Treści strony → ✨ Nowe funkcje → Obserwowane ustawy (Administrator).</p></div>${stanLine()}`;
};
VIEW.zmiany.after=()=>{const s=$('#pzCat');if(s)s.onchange=()=>{fCat=s.value;ROUTES.prawo.after('zmiany')}};

VIEW.projekty=async()=>{
  const list=PR?.projekty||[];
  return `<div class="card"><h3>Projekty ustaw w Sejmie <span class="mut small">kadencja ${esc(PR?.kadencja||'—')} · zmienione od ${dl(PR?.od)} · dopasowane do kategorii spraw</span></h3>
  ${list.length?list.map(p=>`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b><a href="${esc(p.url)}" target="_blank" rel="noopener">Druk ${esc(p.nr)}: ${esc(p.tytul)}</a></b><span>${p.uchwalony?'<span class="badge st-open">uchwalony</span>':''} ${catChips(p.kategorie)}</span></div>
    ${p.opis?`<div class="small mut" style="margin-top:4px">${esc(p.opis)}</div>`:''}<div class="small" style="margin-top:4px">${p.etap?`Etap: <b>${esc(p.etap)}</b> (${dl(p.etap_data)})`:''}${p.data?` · wniesiony ${dl(p.data)}`:''}</div></div>`).join(''):'<div class="empty">Brak projektów pasujących do kategorii spraw.</div>'}
  <p class="hint">Słowa wyszukiwane w projektach: CRM → Treści strony → ✨ Nowe funkcje → Projekty w Sejmie.</p></div>${stanLine()}`;
};

VIEW.odsetki=async()=>{
  const o=O||{},row=(k,l)=>{const x=o[k]||{};return `<div class="tile" style="cursor:default"><span>${l}</span><b>${x.stawka!=null?x.stawka.toLocaleString('pl-PL')+'%':'—'}</b><small class="mut">${x.od?'od '+dl(x.od):''}${x.adres?` · <a href="${esc(P.isapUrl(x.eli))}" target="_blank" rel="noopener">${esc(x.adres)}</a>`:''}</small></div>`};
  let checks='';
  try{const d=await siteContent();const cur={ODS_KAP:P.ods.ODS_KAP,ODS_OPOZN:P.ods.ODS_OPOZN,ODS_HANDL:P.ods.ODS_HANDL};
    const known=new Set([7.25,9.25,13.75,14.5,18.5,6.75,8.75,13.25,7.5,9.5,8.25,10.25,11.75,15.75,12.25,11.25,5.6,7.6,13.5]);
    const items=(d.calculators||[]).map(c=>{const txt=(c.outputs||[]).map(x=>x.formula+' '+x.label).join(' ')+' '+(c.description||'');
      const auto=/ODS_[A-Z]/.test(txt),nums=[...txt.matchAll(/(\d+[.,]\d+)/g)].map(m=>parseFloat(m[1].replace(',','.'))).filter(v=>known.has(v));
      const curVals=Object.values(cur),stale=nums.filter(v=>!curVals.includes(v)&&!curVals.map(x=>x*2).includes(v));
      return auto?{c,ok:true,msg:'stawki automatyczne (ODS_…)'}:nums.length?{c,ok:!stale.length,msg:stale.length?`stałe stawki ${[...new Set(stale)].join('%, ')}% — różne od aktualnych`:'stałe stawki zgodne z aktualnymi'}:null}).filter(Boolean);
    const L=d.contracts?.legal;const lim=L?[L.maxInterest,L.maxDefault]:null;
    checks=`<div class="card" style="margin-top:14px"><h3>Kalkulatory i analiza umów</h3>${items.map(i=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)">${i.ok?'✅':'⚠️'} <b>${esc(i.c.name)}</b> — <span class="${i.ok?'mut':'st-overdue'}">${esc(i.msg)}</span></div>`).join('')||'<div class="mut">Żaden kalkulator nie używa odsetek ustawowych.</div>'}
      ${lim?`<div style="padding:8px 0">${lim[0]===P.ods.ODS_MAX&&lim[1]===P.ods.ODS_MAX_OPOZN?'✅':'ℹ️'} <b>Analiza umów — limit odsetek</b> — w ustawieniach ${lim[0]}% / ${lim[1]}%; strona i tak liczy z aktualnego obwieszczenia: <b>${P.ods.ODS_MAX}% / ${P.ods.ODS_MAX_OPOZN}%</b></div>`:''}
      <p class="hint">W wzorach kalkulatorów (🌐 Treści strony → Kalkulatory) można używać zmiennych <code>ODS_KAP</code>, <code>ODS_OPOZN</code>, <code>ODS_HANDL</code>, <code>ODS_MAX</code>, <code>ODS_MAX_OPOZN</code>, a w etykietach <code>{ODS_OPOZN}</code> — wtedy stawka zmienia się sama po nowym obwieszczeniu.</p></div>`;
  }catch(e){checks=`<p class="hint">Nie udało się sprawdzić kalkulatorów: ${esc(e.message)}</p>`}
  return `<div class="grid g3">${row('kapitalowe','Odsetki ustawowe (kapitałowe)')}${row('opoznienie','Odsetki ustawowe za opóźnienie')}${row('handlowe','W transakcjach handlowych')}</div>
  <div class="grid g2" style="margin-top:14px"><div class="tile" style="cursor:default"><span>Odsetki maksymalne umowne</span><b>${P.ods.ODS_MAX.toLocaleString('pl-PL')}%</b><small class="mut">2 × odsetki ustawowe (art. 359 § 2¹ KC)</small></div><div class="tile" style="cursor:default"><span>Maksymalne odsetki za opóźnienie</span><b>${P.ods.ODS_MAX_OPOZN.toLocaleString('pl-PL')}%</b><small class="mut">2 × odsetki za opóźnienie (art. 481 § 2¹ KC)</small></div></div>
  ${checks}${stanLine()}`.replace(/\(art\. [^)]*\)/g,m=>P.linkify(m));
};

/* --- wyszukiwarka przepisów (zakładka i karta sprawy) --- */
function searchBox(pref,caseId){
  const ids=(A?.akty||[]).filter(a=>a.tekst);
  return `<div class="toolbar"><input class="f" id="${pref}Q" placeholder="np. art. 45 ukk, sankcja kredytu darmowego, odsetki maksymalne" style="flex:1;min-width:220px">
    <select class="f" id="${pref}Act"><option value="">Wszystkie ustawy</option>${ids.map(a=>`<option value="${esc(a.id)}">${esc(a.nazwa)}</option>`).join('')}</select><button class="btn pri" id="${pref}Go">Szukaj</button></div>
    <div id="${pref}Res"><p class="hint">Wpisz numer artykułu z ustawą (art. 385¹ KC) albo opis słowami. Wyniki z aktualnego tekstu jednolitego (ISAP).</p></div>`;
}
function bindSearch(pref,caseId){
  const go=async()=>{const q=$('#'+pref+'Q').value.trim(),id=$('#'+pref+'Act').value,R=$('#'+pref+'Res');if(!q)return;
    R.innerHTML='<div class="mut">Szukam…</div>';
    try{const res=await P.search(q,{ids:id?[id]:undefined,limit:8});
      R.innerHTML=res.length?res.map((r,i)=>`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Art. ${esc(r.nr)} — ${esc(r.nazwa)}</b><span class="mut small">${esc(r.adres||'')}</span></div>${r.head?`<div class="mut small">${esc(r.head)}</div>`:''}
        <div class="small" style="white-space:pre-line;margin-top:6px;max-height:220px;overflow:auto">${esc(r.text)}</div>${caseId!==false?`<button class="btn sm" style="margin-top:8px" data-attach="${i}">📎 Dołącz do sprawy</button>`:''}</div>`).join(''):'<div class="empty">Nic nie znaleziono.</div>';
      $$('[data-attach]',R).forEach(b=>b.onclick=()=>attachModal(res[+b.dataset.attach],caseId))}
    catch(e){R.innerHTML=`<div class="empty">Wyszukiwarka niedostępna: ${esc(e.message)}</div>`}};
  $('#'+pref+'Go').onclick=go;$('#'+pref+'Q').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
}
/* --- kredyt walutowy: symulacja z kursów NBP (kredyt-walutowy.js) --- */
const FXV={kwota:300000,data:'2008-07',lata:30,marza:1.2,waluta:'CHF'};
VIEW.waluty=async()=>{
  const F=window.KREDYTFX;if(!F)return '<div class="empty">Brak modułu kredyt-walutowy.js.</div>';
  const ok=await F.load();if(!ok)return `<div class="empty">Kursy NBP nie są jeszcze pobrane — pojawią się po najbliższej synchronizacji (plik prawo/kursy.json).</div>${stanLine()}`;
  return `<div class="card"><h3>💱 Kredyt indeksowany / denominowany — symulacja z kursów NBP</h3>
    <div class="grid g3" style="gap:12px"><label class="small">Kwota wypłacona (zł)<input class="f" id="fxKw" type="number" step="1000" value="${FXV.kwota}"></label>
    <label class="small">Data wypłaty<input class="f" id="fxD" type="month" min="${F.months('CHF')[0]}" value="${FXV.data}"></label>
    <label class="small">Okres (lata)<input class="f" id="fxL" type="number" min="5" max="50" value="${FXV.lata}"></label>
    <label class="small">Marża (%)<input class="f" id="fxM" type="number" step="0.01" value="${FXV.marza}"></label>
    <label class="small">Waluta<select class="f" id="fxW">${['CHF','EUR'].map(w=>`<option ${w===FXV.waluta?'selected':''}>${w}</option>`).join('')}</select></label>
    <label class="small">Stan na miesiąc<input class="f" id="fxDo" type="month" value="${new Date().toISOString().slice(0,7)}"></label></div>
    <div id="fxOut" style="margin-top:14px"></div>
    <p class="hint">Wypłata po kursie kupna, raty po kursie sprzedaży z tabeli C NBP (średnie miesięczne; banki stosowały własne tabele z większym spreadem). Raty równe, oprocentowanie zmienne: stopa 3M (LIBOR CHF / SARON, EURIBOR — wartości przybliżone, kwartalne) + marża, nie mniej niż 0%. Szacunek do rozmowy z klientem — do pozwu: zaświadczenie banku. Kursy pobrano: ${esc(F.pobrano||'—')}.</p></div>${stanLine()}`;
};
VIEW.waluty.after=()=>{
  const run=()=>{const v=id=>$('#'+id)?.value;Object.assign(FXV,{kwota:+v('fxKw'),data:v('fxD'),lata:+v('fxL'),marza:parseFloat(v('fxM')),waluta:v('fxW')});
    const r=KREDYTFX.symuluj({kwota:FXV.kwota,data:FXV.data,okres:Math.round(FXV.lata*12),marza:FXV.marza,waluta:FXV.waluta,do:v('fxDo')});$('#fxOut').innerHTML=fxSym(r,true)};
  ['fxKw','fxD','fxL','fxM','fxW','fxDo'].forEach(id=>$('#'+id)?.addEventListener('input',run));run();
};
/* wynik symulacji: z modułu (pełny) albo zapisany w zgłoszeniu ze strony (skrót) */
window.fxSym=(r,full)=>{
  if(!r)return '';if(r.err)return `<div class="empty">${esc(r.err)}</div>`;
  const W=r.waluta||'CHF',m=x=>money(Math.round(x||0)),k=(l,v,h)=>`<div style="display:flex;flex-direction:column;gap:2px;background:var(--bg2);border-radius:10px;padding:10px 12px"><span class="mut small">${l}</span><b>${v}</b>${h?`<span class="mut small">${h}</span>`:''}</div>`;
  if(!full)return `<div class="small" style="margin-top:8px"><span class="mut">Symulacja z kursów NBP (${esc(W)}${r.marza!=null?', marża '+String(r.marza).replace('.',',')+'%':''}${r.data?', wypłata '+esc(r.data):''}):</span> ${r.raty} rat, wpłaty ${m(r.wplaty)}, średnia rata ${m(r.rata_srednia||r.wplaty/r.raty)}, saldo ${m(r.saldo)}${r.saldo_waluta!=null?' ('+money(r.saldo_waluta).replace('zł',W)+')':''}<div class="mut">${esc(r.zrodlo||'')}</div></div>`;
  const ben=r.wplaty+r.saldo-(+$('#fxKw')?.value||0);
  return `<div class="grid g4" style="gap:10px">${k('Zapłacone raty',r.k+' z '+r.n)}${k('Wpłacone do banku',m(r.wplaty),'średnio '+m(r.rataSrednia)+' / mies.')}${k('Ostatnia rata',m(r.rataTeraz))}${k('Saldo wg kursu NBP',m(r.saldo),money(r.saldoFx).replace('zł',W)+' × '+r.kursTeraz.toFixed(4))}
    ${k('Kapitał w walucie',money(r.kapitalFx).replace('zł',W),'kurs wypłaty '+r.kursWyplaty.toFixed(4)+' ('+r.miesiacWyplaty+')')}${k('Wpływ kursu na wpłaty',m(r.bezIndeksacji),'ponad raty liczone po kursie z wypłaty')}${k('Korzyść z unieważnienia',`<span style="color:var(--ok)">${m(ben)}</span>`,'wpłaty + saldo − kwota wypłacona')}</div>
    <div class="tw" style="margin-top:12px"><table><tr><th>Rok</th><th>Raty</th><th>Wpłaty</th><th>Śr. kurs sprzedaży</th><th>Śr. oprocentowanie</th></tr>${r.lata.map(l=>`<tr><td>${l.rok}</td><td>${l.raty}</td><td>${m(l.wplaty)}</td><td>${l.kurs.toFixed(4)}</td><td>${l.stopa.toFixed(2).replace('.',',')}%</td></tr>`).join('')}</table></div>`;
};
/* --- orzecznictwo: SAOS (prawo/orzeczenia.json, codzienna synchronizacja) + wyszukiwarki zewnętrzne --- */
let oCat='mine',oQ='';
const ORZ_SZUKAJ=[['SAOS',q=>'https://www.saos.org.pl/search?all='+encodeURIComponent(q)],['Portal orzeczeń sądów powszechnych',q=>'https://www.google.com/search?q='+encodeURIComponent('site:orzeczenia.ms.gov.pl '+q)],
  ['Sąd Najwyższy',q=>'https://www.google.com/search?q='+encodeURIComponent('site:sn.pl orzeczenie '+q)],['TSUE',q=>'https://www.google.com/search?q='+encodeURIComponent('site:curia.europa.eu '+q)]];
const orzItem=(o,caseId)=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span><a href="${esc(o.url)}" target="_blank" rel="noopener"><b>${esc(o.rodzaj||'orzeczenie')} ${esc(o.sygn||'')}</b></a> · ${esc(o.sad||'')} · ${P.fmtD(o.data)}</span>${caseId!==undefined?`<button class="btn sm" type="button" onclick="orzAttach(${o.id},${caseId?`'${caseId}'`:'null'})">📎 Dołącz do sprawy</button>`:''}</div>
  ${(o.hasla||[]).length?`<div class="small mut">${o.hasla.map(esc).join(' · ')}</div>`:''}${o.fragment?`<div class="small" style="margin-top:4px">${esc(o.fragment)}…</div>`:''}</div>`;
const orzAll=()=>Object.entries(OR?.kategorie||{}).flatMap(([k,v])=>(v.orzeczenia||[]).map(o=>({...o,kat:k})));
VIEW.orzeczenia=async()=>{
  const mine=new Set(myCases().filter(c=>c.status==='open').map(c=>c.category)),K=OR?.kategorie||{};
  const kats=Object.keys(K).filter(k=>oCat==='all'||(oCat==='mine'?mine.has(k)||!mine.size:k===oCat));
  const q=oQ||(kats.length===1?(K[kats[0]].zapytania||[])[0]||'':'');
  return `<div class="card"><h3>🔎 Szukaj orzeczeń</h3><div class="toolbar"><input class="f" id="orQ" value="${esc(q)}" placeholder="np. sankcja kredytu darmowego prowizja" style="flex:1;min-width:220px">${ORZ_SZUKAJ.map(([n,u],i)=>`<a class="btn sm${i?'':' pri'}" target="_blank" rel="noopener" data-orz="${i}" href="${esc(u(q||'kredyt'))}">${esc(n)} ↗</a>`).join('')}</div>
    <p class="hint">Wyszukiwanie otwiera się w bazie orzeczeń (SAOS) albo w wyszukiwarce ograniczonej do serwisu sądu.</p></div>
  ${OR?`<div class="toolbar"><select class="f" id="orCat"><option value="mine" ${oCat==='mine'?'selected':''}>Kategorie moich spraw</option><option value="all" ${oCat==='all'?'selected':''}>Wszystkie</option>${Object.keys(K).map(k=>`<option value="${esc(k)}" ${oCat===k?'selected':''}>${esc(CAT(k).name)}</option>`).join('')}</select></div>
  ${kats.map(k=>`<div class="card"><h3>${catBadge(k)} <span class="mut small">zapytanie: ${esc((K[k].zapytania||[]).join(' · '))}</span></h3>${(K[k].orzeczenia||[]).slice(0,12).map(o=>orzItem(o,null)).join('')||'<div class="empty">Brak orzeczeń.</div>'}</div>`).join('')||'<div class="empty">Brak orzeczeń w tych kategoriach.</div>'}
  <p class="hint">Źródło: SAOS — System Analizy Orzeczeń Sądowych (saos.org.pl), pobrano ${P.fmtD(OR.pobrano)}. Najnowsze orzeczenia w bazie mogą być sprzed kilku lat — aktualne sprawdzaj w portalach sądów. Zapytania zmienisz w CRM → Treści strony → ✨ Nowe funkcje.</p>`
  :'<div class="empty">Orzeczenia z SAOS nie są jeszcze pobrane — pojawią się po najbliższej synchronizacji.</div>'}${stanLine()}`;
};
VIEW.orzeczenia.after=()=>{
  const s=$('#orCat');if(s)s.onchange=()=>{oCat=s.value;oQ='';ROUTES.prawo.after('orzeczenia')};
  const q=$('#orQ');if(q)q.oninput=()=>{oQ=q.value;document.querySelectorAll('[data-orz]').forEach(a=>a.href=ORZ_SZUKAJ[+a.dataset.orz][1](q.value||'kredyt'))};
};
/* dołączenie orzeczenia do sprawy (notatka „analiza”) */
window.orzAttach=(id,caseId)=>{
  const o=orzAll().find(x=>x.id===id);if(!o)return;
  const cs=myCases().filter(c=>c.status==='open'&&caseFlags(c).actionsChange&&DB.stages.some(s=>s.caseId===c.id&&s.status==='open'));
  if(!cs.length)return toast('Brak otwartych spraw, w których możesz dodawać wpisy',true);
  modal('Dołącz orzeczenie do sprawy',`<div class="form"><label class="full">Sprawa<select class="f" name="case">${cs.map(c=>`<option value="${c.id}" ${c.id===caseId?'selected':''}>${esc(c.number)} · ${esc(clientName(c))}</option>`).join('')}</select></label>
    <label class="full">Uwagi<textarea class="f" name="note" placeholder="np. teza istotna dla sprawy"></textarea></label></div>
    <div class="card" style="background:var(--bg2);margin-top:10px">${orzItem(o)}</div>`,{ok:'Dołącz',onOk:async v=>{
    const c=CASE(v.case),st=DB.stages.find(s=>s.caseId===c.id&&s.status==='open');if(!st)throw new Error('Brak otwartego etapu w sprawie');
    const lines=[`${o.rodzaj||'Orzeczenie'} ${o.sygn} — ${o.sad}, ${P.fmtD(o.data)}`,o.url,'',...(o.hasla?.length?['Hasła: '+o.hasla.join(', ')]:[]),...(o.fragment?[o.fragment+'…']:[]),'','Źródło: SAOS (saos.org.pl).'];
    if(v.note?.trim())lines.push('','Uwagi: '+v.note.trim());
    await act(async()=>chk(await sb.from('case_entries').insert({case_id:c.id,stage_id:st.id,type:'notatka',kind:'analiza',title:`Orzeczenie: ${o.sygn} (${o.sad})`.slice(0,300),description:lines.join('\n'),performed_on:iso(new Date())})),`Dołączono do sprawy ${c.number}`);
  }});
};
/* --- rejestr klauzul niedozwolonych UOKiK (prawo/klauzule.json — duży plik, wczytywany na żądanie) --- */
let KL=null,KLp=null;
const klTok=t=>[...new Set(String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l').match(/[a-z0-9]{4,}/g)||[])].map(w=>w.slice(0,6));
function klLoad(){if(KLp)return KLp;KLp=P.load('klauzule').then(j=>{KL=j;(j?.klauzule||[]).forEach(k=>k.t=new Set(klTok(k[4])));return KL}).catch(()=>{KLp=null;return null});return KLp}
/* podobieństwo: część słów zapisu umowy obecna we wpisie (z karą za bardzo krótkie wpisy) */
function klMatch(text,n=5,min=0.3){const q=klTok(text);if(q.length<4||!KL?.klauzule)return [];
  return KL.klauzule.map(k=>{let h=0;q.forEach(w=>k.t.has(w)&&h++);const sc=h/Math.max(q.length,Math.min(k.t.size,q.length*1.5));return{k,sc}}).filter(x=>x.sc>=min).sort((a,b)=>b.sc-a.sc).slice(0,n)}
const klRow=(k,sc)=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="small">${sc!=null?`<span class="badge" style="background:#ff8a5c22;color:#ff8a5c">${Math.round(sc*100)}% zgodności</span> `:''}<b>poz. ${k[0]}</b> · ${esc(k[2])} · ${P.fmtD(k[1])} · <span class="mut">${esc(k[6])}</span> · <a href="https://rejestr.uokik.gov.pl/wyszukiwanie.php?details=${k[7]}#details" target="_blank" rel="noopener">rejestr ↗</a></div><div style="margin-top:3px">„${esc(k[4])}”</div></div>`;
let klQ='',klB='',klZ='';
VIEW.klauzule=async()=>{
  const J=await klLoad();
  if(!J?.klauzule?.length)return `<div class="empty">Rejestr klauzul nie jest jeszcze pobrany — pojawi się po najbliższej synchronizacji (prawo/klauzule.json).</div>${stanLine()}`;
  const br=[...new Set(J.klauzule.map(k=>k[6]))].filter(Boolean).sort();
  return `<div class="card"><h3>⚖️ Porównaj zapis umowy z rejestrem</h3><textarea class="f" id="klZ" rows="3" placeholder="Wklej zapis z umowy klienta, np. „Bank może zmienić wysokość opłat i prowizji w przypadku…”">${esc(klZ)}</textarea><div id="klZo" style="margin-top:8px"></div></div>
  <div class="card"><h3>🔎 Szukaj w rejestrze (${J.klauzule.length.toLocaleString('pl-PL')} wpisów)</h3><div class="toolbar"><input class="f" id="klQ" value="${esc(klQ)}" placeholder="słowa z treści albo sygnatura, np. prowizja, XVII AmC" style="flex:1;min-width:220px"><select class="f" id="klB"><option value="">Wszystkie branże</option>${br.map(b=>`<option ${b===klB?'selected':''}>${esc(b)}</option>`).join('')}</select></div><div id="klO"></div></div>
  <p class="hint">Źródło: rejestr klauzul niedozwolonych UOKiK (rejestr.uokik.gov.pl), wersja zanonimizowana — wpisy z prawomocnych wyroków SOKiK; rejestr prowadzono do 17.04.2026. Pobrano ${P.fmtD(J.pobrano)}${J.komplet?'':' (pobieranie w toku — reszta przy kolejnych synchronizacjach)'}. Wpis jest argumentem, nie przesądza o abuzywności zapisu w innej umowie — oceń w kontekście (art. 385¹ i 479⁴³ KPC w brzmieniu sprzed 17.04.2016).</p>`;
};
VIEW.klauzule.after=()=>{
  const find=()=>{klQ=$('#klQ').value.trim();klB=$('#klB').value;const ws=klQ.toLowerCase().split(/\s+/).filter(Boolean);
    const L=KL.klauzule.filter(k=>(!klB||k[6]===klB)&&ws.every(w=>(k[4]+' '+k[2]).toLowerCase().includes(w)));
    $('#klO').innerHTML=ws.length||klB?`<div class="mut small" style="margin:6px 0">${L.length} wyników${L.length>50?' — pierwsze 50':''}</div>${L.slice(0,50).map(k=>klRow(k)).join('')}`:'<div class="mut small">Wpisz słowa albo wybierz branżę.</div>'};
  const cmp=()=>{klZ=$('#klZ').value;const M=klMatch(klZ,8,0.25);$('#klZo').innerHTML=klZ.trim().length<20?'<div class="mut small">Wklej co najmniej jedno zdanie.</div>':M.length?M.map(x=>klRow(x.k,x.sc)).join(''):'<div class="mut small">Brak podobnych wpisów w rejestrze.</div>'};
  $('#klQ')?.addEventListener('input',find);$('#klB')?.addEventListener('change',find);$('#klZ')?.addEventListener('input',cmp);if($('#klQ')){find();if(klZ)cmp()}
};
/* analiza umowy w zgłoszeniu: podobne wpisy rejestru dla wykrytych zapisów (wypełniane po wczytaniu rejestru) */
const klFill=()=>document.querySelectorAll('.klm:not([data-done])').forEach(el=>{el.dataset.done=1;klLoad().then(J=>{if(!J)return;
  const fr=JSON.parse(el.dataset.q||'[]'),out=fr.map(f=>({f,m:klMatch(f,2,0.35)})).filter(x=>x.m.length);
  el.innerHTML=out.length?`<div class="small" style="margin-top:8px"><b>⚖️ Podobne wpisy w rejestrze klauzul niedozwolonych UOKiK</b>${out.map(x=>x.m.map(y=>klRow(y.k,y.sc)).join('')).join('')}</div>`:''})});
new MutationObserver(klFill).observe(document.body,{childList:true,subtree:true});
/* --- decyzje UODO (prawo/uodo.json) --- */
VIEW.uodo=async()=>{let J=null;try{J=await P.load('uodo')}catch(e){}
  if(!J?.decyzje?.length)return `<div class="empty">Decyzje UODO pojawią się po najbliższej synchronizacji.</div>${stanLine()}`;
  return `<div class="card"><h3>🛡️ Najnowsze decyzje Prezesa UODO <a class="btn sm" href="https://orzeczenia.uodo.gov.pl/" target="_blank" rel="noopener">Wyszukiwarka UODO ↗</a></h3>${J.decyzje.map(d=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><a href="${esc(d.url)}" target="_blank" rel="noopener"><b>${esc(d.sygn)}</b></a> · ${P.fmtD(d.data)}<div class="small">${esc(d.tytul)}</div></div>`).join('')}
  <p class="hint">Źródło: orzeczenia.uodo.gov.pl (publiczne API), pobrano ${P.fmtD(J.pobrano)}.</p></div>${stanLine()}`};
/* --- pozostałe urzędy: bez publicznego API — wyszukiwarki --- */
let urQ='';
const URZ=[['Interpretacje podatkowe — KIS (EUREKA)','https://eureka.mf.gov.pl/','Interpretacje indywidualne i ogólne, objaśnienia; wyszukiwarka Ministerstwa Finansów.','eureka.mf.gov.pl'],
  ['ZUS — interpretacje i wyjaśnienia','https://www.zus.pl/','Decyzje w sprawie interpretacji przepisów i wyjaśnienia ZUS.','zus.pl'],
  ['KNF — stanowiska, rekomendacje, ostrzeżenia','https://www.knf.gov.pl/','Stanowiska i rekomendacje dla banków, lista ostrzeżeń publicznych.','knf.gov.pl'],
  ['UOKiK — decyzje Prezesa','https://decyzje.uokik.gov.pl/bp/dec_prez.nsf','Decyzje w sprawach praktyk naruszających zbiorowe interesy konsumentów i postanowień niedozwolonych (po 17.04.2016).','uokik.gov.pl']];
VIEW.urzedy=async()=>`<div class="card"><h3>🔎 Szukaj w serwisach urzędów</h3><input class="f" id="urQ" value="${esc(urQ)}" placeholder="np. ulga na złe długi, zmiana oprocentowania kredytu" style="width:100%">
  <div style="display:grid;gap:10px;margin-top:12px">${URZ.map(([n,u,o,d],i)=>`<div style="background:var(--bg2);border-radius:10px;padding:10px 12px"><b>${esc(n)}</b><div class="small mut">${esc(o)}</div><div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Otwórz ↗</a><a class="btn sm" data-ur="${esc(d)}" target="_blank" rel="noopener" href="#">Szukaj w serwisie ↗</a></div></div>`).join('')}</div>
  <p class="hint">Te serwisy nie udostępniają publicznego API ani stałego pliku z danymi — dlatego tu są wyszukiwarki, a nie codzienna synchronizacja. Rejestr klauzul UOKiK i decyzje UODO są pobierane automatycznie (osobne zakładki).</p></div>`;
VIEW.urzedy.after=()=>{const q=$('#urQ'),upd=()=>{urQ=q.value;document.querySelectorAll('[data-ur]').forEach(a=>a.href='https://www.google.com/search?q='+encodeURIComponent('site:'+a.dataset.ur+' '+(urQ||'interpretacja')))};q?.addEventListener('input',upd);upd()};
VIEW.przepisy=async()=>`<div class="card"><h3>Wyszukiwarka przepisów</h3>${searchBox('pp')}</div>${stanLine()}`;
VIEW.przepisy.after=()=>bindSearch('pp',null);

/* dołączenie przepisu do sprawy: notatka „analiza” ze stanem prawnym na dzień */
function attachModal(r,caseId){
  const cs=myCases().filter(c=>c.status==='open'&&caseFlags(c).actionsChange&&DB.stages.some(s=>s.caseId===c.id&&s.status==='open'));
  if(!cs.length)return toast('Brak otwartych spraw, w których możesz dodawać wpisy',true);
  modal('Dołącz przepis do sprawy',`<div class="form">
    <label class="full">Sprawa<select class="f" name="case">${cs.map(c=>`<option value="${c.id}" ${c.id===caseId?'selected':''}>${esc(c.number)} · ${esc(clientName(c))}</option>`).join('')}</select></label>
    <label>Stan prawny na dzień<input class="f" type="date" name="date" value="${iso(new Date())}"></label>
    <label class="full">Uwagi<textarea class="f" name="note" placeholder="np. podstawa roszczenia, data zawarcia umowy"></textarea></label></div>
    <div class="card" style="background:var(--bg2);margin-top:10px"><b>Art. ${esc(r.nr)} — ${esc(r.nazwa)}</b><div class="small" style="white-space:pre-line;max-height:160px;overflow:auto;margin-top:6px">${esc(r.text)}</div></div>
    <p class="hint">Do wpisu trafi treść z aktualnego tekstu jednolitego oraz wskazanie tekstu jednolitego i nowelizacji obowiązujących na wybrany dzień. Sprawdź brzmienie z tamtego okresu w Dzienniku Ustaw.</p>`,{ok:'Dołącz',onOk:async v=>{
    const c=CASE(v.case),st=DB.stages.find(s=>s.caseId===c.id&&s.status==='open');if(!st)throw new Error('Brak otwartego etapu w sprawie');
    const s=await P.asOf(r.id,v.date).catch(()=>null);
    const lines=[`Art. ${r.nr} — ${r.nazwa}`,'',r.text,'',`Stan prawny na dzień: ${P.fmtD(v.date)}`];
    if(s){if(s.tj)lines.push(`Tekst jednolity obowiązujący w tym dniu: ${s.tj.adres} (${P.textUrl(s.tj.eli)})`);
      if(s.after.length)lines.push(`Nowelizacje po tym tekście jednolitym, w mocy na ten dzień: ${s.after.map(z=>z.eli+(z.wejscie?' od '+P.fmtD(z.wejscie):'')).join('; ')}`);
      if(s.later.length)lines.push(`Późniejsze nowelizacje: ${s.later.slice(0,8).map(z=>z.eli+(z.wejscie?' od '+P.fmtD(z.wejscie):'')).join('; ')}`)}
    lines.push(`Treść powyżej: ${r.adres||'aktualny tekst jednolity'} (ISAP, tekst informacyjny).`);
    if(v.note?.trim())lines.push('','Uwagi: '+v.note.trim());
    await act(async()=>chk(await sb.from('case_entries').insert({case_id:c.id,stage_id:st.id,type:'notatka',kind:'analiza',title:`Przepis: art. ${r.nr} ${r.nazwa}`.slice(0,300),description:lines.join('\n'),performed_on:iso(new Date())})),`Dołączono do sprawy ${c.number}`);
  }});
}

/* --- analiza umowy klienta ze strony (zgłoszenie) — podstawy prawne widzi tylko zespół kancelarii --- */
const TYP={rst:'Restrukturyzacja firmy',skd:'Kredyt konsumencki — sankcja kredytu darmowego',chf:'Kredyt indeksowany / denominowany (CHF, waluta)',wibor:'Kredyt złotówkowy (WIBOR)'};
window.leadAnaliza=a=>{if(!a)return '';const L=x=>P.linkify(esc(x||''));
  return `<details class="card" style="margin-top:10px;background:var(--bg2)" open><summary style="cursor:pointer"><b>📄 Analiza umowy klienta</b> — ${esc(TYP[a.typ]||a.typ||'')}${a.kwalifikuje?' · <span class="st-overdue">klient zobaczył: kwalifikuje się do zwrotu</span>':''}${a.plik?` · <span class="mut small">${esc(a.plik)}${a.ocr?' (skan, OCR)':''}</span>`:''}</summary>
  ${a.data_umowy?`<div class="small" style="margin-top:8px">Data umowy (odczytana): <b>${P.fmtD(a.data_umowy)}</b></div>`:''}
  ${(a.klauzule||[]).length?`<div class="tw" style="margin-top:8px"><table><tr><th>Wykryty zapis / brak</th><th>Podstawa prawna</th><th>Orzecznictwo</th></tr>${a.klauzule.map(k=>`<tr><td><b>${esc(k.nazwa)}</b>${k.brak?' <span class="badge">brak w umowie</span>':''}${k.fragment?`<div class="mut small" style="margin-top:4px">„${esc(k.fragment)}”</div>`:''}</td><td class="small">${L(k.podstawa)}</td><td class="small">${esc(k.orzecznictwo||'—')}</td></tr>`).join('')}</table></div>`:''}
  ${a.odczytane&&Object.keys(a.odczytane).length?`<div class="small" style="margin-top:8px"><span class="mut">Dane odczytane z umowy:</span> ${Object.entries(a.odczytane).map(([k,v])=>`${esc(k)}: „${esc(v)}”`).join(' · ')}</div>`:''}
  ${(a.podstawy_w_umowie||[]).length?`<div class="small" style="margin-top:8px"><span class="mut">Podstawy prawne powołane w umowie (stan z API Sejmu):</span><ul style="margin:4px 0 0 18px">${a.podstawy_w_umowie.map(r=>`<li>${r.poziom==='high'?'⛔':'ℹ️'} <b>${esc(r.akt)}</b> — ${esc(r.uwaga)}${r.fragment?` <span class="mut">(„${esc(r.fragment)}”)</span>`:''}</li>`).join('')}</ul></div>`:''}
  ${a.typ==='rst'?`<div class="tw" style="margin-top:8px"><table><tr><th>Dług</th><th>Kwota</th><th>Rata</th><th>Opr.</th><th>Zaległe</th><th></th></tr>${(a.dlugi||[]).map(d=>`<tr><td>${esc(d.rodzaj)}</td><td>${money(d.kwota)}</td><td>${money(d.rata)}</td><td>${d.opr}%</td><td>${money(d.zalegle)}</td><td class="small">${d.egzekucja?'⚠️ egzekucja ':''}${d.zabezpieczony?'🔒 zabezpieczony ':''}${d.w_ukladzie?'':'poza układem'}</td></tr>`).join('')}</table></div>
    ${a.wynik?`<div class="small" style="margin-top:8px">Wariant: umorzenie ${a.wariant?.umorzenie_proc}%, ${a.wariant?.raty_mies} rat, karencja ${a.wariant?.karencja_mies} mies. → raty ${money(a.wynik.raty_teraz)} → <b>${money(a.wynik.raty_po)}</b>/mies., mniej odsetek ${money(a.wynik.mniej_odsetek)}, umorzenie ${money(a.wynik.umorzenie)}, nadwyżka firmy ${money(a.wynik.nadwyzka)}/mies.</div>`:''}
    ${(a.harmonogram||[]).length?`<div class="tw" style="margin-top:8px"><table><tr><th>Plan dla wierzycieli</th><th>Dług</th><th>Umorzenie</th><th>Do spłaty</th><th>Rata</th><th>Miesiące</th></tr>${a.harmonogram.map(h=>`<tr><td>${esc(h.wierzyciel)}${h.w_ukladzie?'':' <span class="badge">poza układem</span>'}</td><td>${money(h.dlug)}</td><td>${money(h.umorzenie)}</td><td>${money(h.do_splaty)}</td><td><b>${money(h.rata)}</b></td><td>${h.w_ukladzie?h.od_mies+'–'+h.do_mies:'jak dotąd'}</td></tr>`).join('')}</table><p class="hint">Miesiące liczone od zgłoszenia: 1–4 ochrona, potem karencja, potem raty.</p></div>`:''}
    <div class="small" style="margin-top:8px"><span class="mut">Ścieżki (prawo restrukturyzacyjne):</span><ul style="margin:4px 0 0 18px">${(a.warianty||[]).map(w=>`<li><b>${esc(w.nazwa)}</b> — ${esc(w.podstawa)}<div class="mut">${esc(w.kiedy)}</div></li>`).join('')}</ul></div>
    <div class="small" style="margin-top:6px"><span class="mut">Zasady do sprawdzenia:</span><ul style="margin:4px 0 0 18px">${(a.zasady||[]).map(z=>`<li>${esc(z)}</li>`).join('')}</ul></div>`:''}
  ${(a.zgodnosc||[]).length?`<div class="small" style="margin-top:8px"><span class="mut">Zgodność z prawem (reguły analizy umów):</span><ul style="margin:4px 0 0 18px">${a.zgodnosc.map(z=>`<li><b>${esc(z.nazwa)}</b>${z.brak?' — brak zapisu':''}${z.podstawa?` — ${L(z.podstawa)}`:''}</li>`).join('')}</ul></div>`:''}
  ${a.symulacja?fxSym(a.symulacja):''}
  ${(a.klauzule||[]).some(k=>k.fragment)?`<div class="klm" data-q="${esc(JSON.stringify(a.klauzule.filter(k=>k.fragment).map(k=>k.fragment)))}"></div>`:''}
  ${a.ryzyko?`<div class="mut small" style="margin-top:6px">Ocena ze strony: ryzyko zapisów ${a.ryzyko.zapisy??'—'}/100, ryzyko prawne ${a.ryzyko.prawne??'—'}/100</div>`:''}
  <p class="hint">Wynik automatycznej analizy wzorców w treści umowy — wymaga weryfikacji prawnika. Klientowi pokazano tylko komunikat i kwotę, bez podstaw prawnych.</p></details>`};

/* --- karta „Przepisy” w zakładce Analiza sprawy --- */
const origAnaliza=CTAB.analiza;
const orzCase=c=>{const L=(OR?.kategorie?.[c.category]?.orzeczenia||[]).slice(0,5);return L.length?`<div class="card" style="margin-top:14px"><h3>⚖️ Orzecznictwo — ${esc(CAT(c.category).name)} <a class="btn sm" href="#/prawo/orzeczenia">Więcej</a></h3>${L.map(o=>orzItem(o,c.id)).join('')}</div>`:''};
CTAB.analiza=c=>origAnaliza(c)+orzCase(c)+(c.leadData?.analiza?leadAnaliza(c.leadData.analiza):'')+(c.leadData?.symulacja?`<div class="card" style="margin-top:10px;background:var(--bg2)"><b>💱 Kredyt walutowy — symulacja klienta ze strony</b>${fxSym(c.leadData.symulacja)}</div>`:'')+`<div class="card" style="margin-top:14px"><h3>📜 Przepisy <span class="mut small">wyszukaj i dołącz do sprawy ze stanem prawnym na wybrany dzień</span></h3><div id="caPrawo">${searchBox('cp',c.id)}</div></div>`;
const origAfter=ROUTES.sprawa.after;
ROUTES.sprawa.after=(id,tab)=>{origAfter?.(id,tab);if((tab||'')==='analiza'&&$('#cpGo')){loadAll().then(()=>{const sel=$('#cpAct');if(sel&&sel.options.length<=1)sel.innerHTML=`<option value="">Wszystkie ustawy</option>`+(A?.akty||[]).filter(a=>a.tekst).map(a=>`<option value="${esc(a.id)}">${esc(a.nazwa)}</option>`).join('');
  const cat=CASE(id)?.category,pref=(A?.akty||[]).find(a=>a.tekst&&a.kategorie[0]===cat);if(pref&&sel)sel.value=pref.id}).catch(()=>{});bindSearch('cp',id)}};

/* --- pulpit: zmiany w prawie dotyczące moich spraw --- */
const origPulpitAfter=ROUTES.pulpit.after;
ROUTES.pulpit.after=(...a)=>{origPulpitAfter?.(...a);loadAll().then(()=>{lawNotify();const n=prawoNew();if(!n||!location.hash.startsWith('#/pulpit'))return;const V=$('#view .ph');if(!V||$('#prawoPulpit'))return;
  V.insertAdjacentHTML('afterend',`<a id="prawoPulpit" class="card" href="#/prawo/zmiany" style="display:flex;gap:12px;align-items:center;margin-bottom:16px;border-color:var(--accent)"><span style="font-size:1.4rem">📜</span><span><b>${n} ${n===1?'nowa zmiana':'nowe zmiany'} w prawie</b> w kategoriach Twoich spraw<br><small class="mut">Zobacz w zakładce Prawo</small></span></a>`)}).catch(()=>{})};
})();

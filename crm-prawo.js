/* CRM — zakładka „📜 Prawo”: strażnik zmian w ustawach, projekty z Sejmu, odsetki ustawowe, wyszukiwarka przepisów
   oraz karta „Przepisy” w zakładce Analiza sprawy (dołączenie przepisu ze stanem prawnym na dzień).
   Dane: prawo/*.json (codzienna synchronizacja z API Sejmu — tools/prawo_sync.py, workflow GitHub Actions).
   Nic tu nie zapisuje się w bazie poza wpisem w sprawie (case_entries, te same reguły co „+ Wpis”). */
(function(){
const P=window.PRAWO;if(!P){console.warn('prawo.js nie wczytany');return}
const seenKey=()=>'crm_prawo_seen_'+(ME?.id||'');
const getSeen=()=>{try{return localStorage.getItem(seenKey())||''}catch(e){return ''}};
const setSeen=v=>{try{localStorage.setItem(seenKey(),v)}catch(e){}};
let Z=null,A=null,PR=null,O=null,S=null,loadErr='';
const openCases=cats=>myCases().filter(c=>c.status==='open'&&cats.includes(c.category));
/* nowe zmiany dotyczące kategorii moich spraw (licznik w menu) */
window.prawoNew=()=>{if(!Z||!ME)return 0;const s=getSeen(),mine=new Set(myCases().filter(c=>c.status==='open').map(c=>c.category));
  return Z.zmiany.filter(z=>(z.wykryto||'')>s&&(isAdmin()||z.kategorie.some(k=>mine.has(k)))).length};
async function loadAll(force){
  if(Z&&!force)return;
  const r=await Promise.allSettled([P.load('zmiany'),P.acts(),P.load('projekty'),P.loadOds().then(()=>P.load('odsetki')),P.load('stan')]);
  [Z,A,PR,O,S]=r.map(x=>x.status==='fulfilled'?x.value:null);
  loadErr=r.every(x=>x.status==='rejected')?'Dane prawne nie zostały jeszcze pobrane — synchronizacja z API Sejmu działa raz dziennie (GitHub Actions).':'';
  if(Z&&!Z.zmiany)Z.zmiany=[];
}
loadAll().then(()=>{if(ME)renderShell()}).catch(()=>{});

/* --- menu: pozycja „Prawo” przed „Treści strony” --- */
const origMenu=menuItems;
window.menuItems=menuItems=function(){const m=origMenu();if(!seesCases())return m;
  const i=m.findIndex(x=>x[0]==='strona'||x[0]==='ustawienia');m.splice(i<0?m.length:i,0,['prawo','📜','Prawo',prawoNew(),'n']);return m};

const TABS=[['zmiany','Zmiany w ustawach'],['projekty','Projekty w Sejmie'],['odsetki','Odsetki'],['przepisy','Przepisy']];
const catChips=ks=>(ks||[]).map(k=>catBadge(k)).join(' ');
const dl=(d)=>d?P.fmtD(d):'—';
ROUTES.prawo=(sub)=>{
  need(seesCases(),'Zakładka dostępna dla zespołu kancelarii.');
  sub=TABS.some(t=>t[0]===sub)?sub:'zmiany';
  return `<div class="ph"><div><h1>📜 Prawo</h1><p>Zmiany w ustawach i projekty z Sejmu dla kategorii spraw kancelarii · źródło: API Sejmu (ELI), aktualizacja raz dziennie</p></div></div>
  <div class="tabs">${TABS.map(([t,l])=>`<a class="tab ${t===sub?'on':''}" href="#/prawo/${t}">${l}</a>`).join('')}</div>
  <div id="prawoView"><div class="empty">Wczytywanie danych prawnych…</div></div>`;
};
ROUTES.prawo.after=async(sub)=>{
  sub=TABS.some(t=>t[0]===sub)?sub:'zmiany';
  await loadAll();const V=$('#prawoView');if(!V)return;
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
    <p class="hint">Lista ustaw: plik <code>prawo/obserwowane.json</code> w repozytorium (opis w INSTRUKCJA.md).</p></div>${stanLine()}`;
};
VIEW.zmiany.after=()=>{const s=$('#pzCat');if(s)s.onchange=()=>{fCat=s.value;ROUTES.prawo.after('zmiany')}};

VIEW.projekty=async()=>{
  const list=PR?.projekty||[];
  return `<div class="card"><h3>Projekty ustaw w Sejmie <span class="mut small">kadencja ${esc(PR?.kadencja||'—')} · zmienione od ${dl(PR?.od)} · dopasowane do kategorii spraw</span></h3>
  ${list.length?list.map(p=>`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b><a href="${esc(p.url)}" target="_blank" rel="noopener">Druk ${esc(p.nr)}: ${esc(p.tytul)}</a></b><span>${p.uchwalony?'<span class="badge st-open">uchwalony</span>':''} ${catChips(p.kategorie)}</span></div>
    ${p.opis?`<div class="small mut" style="margin-top:4px">${esc(p.opis)}</div>`:''}<div class="small" style="margin-top:4px">${p.etap?`Etap: <b>${esc(p.etap)}</b> (${dl(p.etap_data)})`:''}${p.data?` · wniesiony ${dl(p.data)}`:''}</div></div>`).join(''):'<div class="empty">Brak projektów pasujących do kategorii spraw.</div>'}
  <p class="hint">Słowa wyszukiwane w projektach: <code>prawo/obserwowane.json</code> → „projekty”.</p></div>${stanLine()}`;
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
    <div class="small" style="margin-top:8px"><span class="mut">Ścieżki (prawo restrukturyzacyjne):</span><ul style="margin:4px 0 0 18px">${(a.warianty||[]).map(w=>`<li><b>${esc(w.nazwa)}</b> — ${esc(w.podstawa)}<div class="mut">${esc(w.kiedy)}</div></li>`).join('')}</ul></div>
    <div class="small" style="margin-top:6px"><span class="mut">Zasady do sprawdzenia:</span><ul style="margin:4px 0 0 18px">${(a.zasady||[]).map(z=>`<li>${esc(z)}</li>`).join('')}</ul></div>`:''}
  ${(a.zgodnosc||[]).length?`<div class="small" style="margin-top:8px"><span class="mut">Zgodność z prawem (reguły analizy umów):</span><ul style="margin:4px 0 0 18px">${a.zgodnosc.map(z=>`<li><b>${esc(z.nazwa)}</b>${z.brak?' — brak zapisu':''}${z.podstawa?` — ${L(z.podstawa)}`:''}</li>`).join('')}</ul></div>`:''}
  ${a.ryzyko?`<div class="mut small" style="margin-top:6px">Ocena ze strony: ryzyko zapisów ${a.ryzyko.zapisy??'—'}/100, ryzyko prawne ${a.ryzyko.prawne??'—'}/100</div>`:''}
  <p class="hint">Wynik automatycznej analizy wzorców w treści umowy — wymaga weryfikacji prawnika. Klientowi pokazano tylko komunikat i kwotę, bez podstaw prawnych.</p></details>`};

/* --- karta „Przepisy” w zakładce Analiza sprawy --- */
const origAnaliza=CTAB.analiza;
CTAB.analiza=c=>origAnaliza(c)+(c.leadData?.analiza?leadAnaliza(c.leadData.analiza):'')+`<div class="card" style="margin-top:14px"><h3>📜 Przepisy <span class="mut small">wyszukaj i dołącz do sprawy ze stanem prawnym na wybrany dzień</span></h3><div id="caPrawo">${searchBox('cp',c.id)}</div></div>`;
const origAfter=ROUTES.sprawa.after;
ROUTES.sprawa.after=(id,tab)=>{origAfter?.(id,tab);if((tab||'')==='analiza'&&$('#cpGo')){loadAll().then(()=>{const sel=$('#cpAct');if(sel&&sel.options.length<=1)sel.innerHTML=`<option value="">Wszystkie ustawy</option>`+(A?.akty||[]).filter(a=>a.tekst).map(a=>`<option value="${esc(a.id)}">${esc(a.nazwa)}</option>`).join('');
  const cat=CASE(id)?.category,pref=(A?.akty||[]).find(a=>a.tekst&&a.kategorie[0]===cat);if(pref&&sel)sel.value=pref.id}).catch(()=>{});bindSearch('cp',id)}};

/* --- pulpit: zmiany w prawie dotyczące moich spraw --- */
const origPulpitAfter=ROUTES.pulpit.after;
ROUTES.pulpit.after=(...a)=>{origPulpitAfter?.(...a);loadAll().then(()=>{const n=prawoNew();if(!n||!location.hash.startsWith('#/pulpit'))return;const V=$('#view .ph');if(!V||$('#prawoPulpit'))return;
  V.insertAdjacentHTML('afterend',`<a id="prawoPulpit" class="card" href="#/prawo/zmiany" style="display:flex;gap:12px;align-items:center;margin-bottom:16px;border-color:var(--accent)"><span style="font-size:1.4rem">📜</span><span><b>${n} ${n===1?'nowa zmiana':'nowe zmiany'} w prawie</b> w kategoriach Twoich spraw<br><small class="mut">Zobacz w zakładce Prawo</small></span></a>`)}).catch(()=>{})};
})();

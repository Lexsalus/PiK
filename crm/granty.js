/* =====================================================================
   DOTACJE — panel serwisu dotacji (Lexsalus/Grants) w CRM.
   Zakładki w grupach: Klienci (zgłoszenia DOT) · Katalog (źródła finansowania, podgląd raportu)
   · Serwis (treści i ustawienia, publikacja).
   Silnik raportu: dotacje/assets/engine.js (ten sam co w serwisie dotacji).
   Szkic zmian: w tej przeglądarce; publikacja: tabela grants_content (migracja 012, Administrator).
   Brak opublikowanej wersji → start od plików dotacje/data/*.json.
   ===================================================================== */
(()=>{
const GR_BASE='dotacje/';   // serwis dotacji w tym samym repozytorium (dawniej Lexsalus/Grants)
const GR_TABS=[['zgloszenia','Zgłoszenia'],['zrodla','Źródła finansowania'],['podglad','Podgląd raportu'],['strona','Treści i ustawienia'],['publikacja','Publikacja']];
const GR_GROUPS=[{l:'Klienci',c:'#ff8a5c',k:['zgloszenia']},{l:'Katalog',c:'#f5b84a',k:['zrodla','podglad']},{l:'Serwis',c:'#5aa9ff',k:['strona','publikacja']}];
Object.assign(TAB_TIPS,{zgloszenia:'Klienci, którzy zostawili kontakt po wstępnym raporcie dotacji.',zrodla:'Katalog źródeł finansowania: plany A/B/C, kwoty, dla kogo, słowa-klucze.',
  podglad:'Raport tak, jak zobaczy go klient — z punktacją i powodem dopasowania.',strona:'Nazwa, teksty (PL/UK/EN), kontakt, licznik, Plan C.',publikacja:'Szkic a wersja na stronie; publikacja zmian.'});
const DK='crm.granty.draft',TIER={A:['A — mniejsze, szybsze','#2fd6a0'],B:['B — duże inwestycje','#5aa9ff'],C:['C — dodatkowe (pożyczki, ulgi)','#f5b84a']};
const G={pub:null,pubAt:null,draft:null,loaded:false,brak:false,engine:null,err:''};
const gAccess=()=>can('new_cases')||isAdmin();
const ls={get(){try{return JSON.parse(localStorage.getItem(DK))}catch(e){return null}},set(v){try{localStorage.setItem(DK,JSON.stringify(v))}catch(e){}},del(){try{localStorage.removeItem(DK)}catch(e){}}};
function engine(){
  if(G.engine)return G.engine;
  G.engine=new Promise((ok,no)=>{if(window.GRANTY)return ok(window.GRANTY);const s=document.createElement('script');s.src=GR_BASE+'assets/engine.js?v='+Date.now();s.onload=()=>window.GRANTY?ok(window.GRANTY):no(new Error('brak silnika'));s.onerror=()=>no(new Error('Nie udało się wczytać silnika raportu z serwisu dotacji'));document.head.appendChild(s)});
  G.engine.catch(()=>{G.engine=null});return G.engine;
}
async function load(force){
  if(G.loaded&&!force)return;
  G.err='';
  try{await engine()}catch(e){G.err=e.message}
  try{const r=await sb.from('grants_content').select('data,published_at').eq('id',1).maybeSingle();if(r.error)throw r.error;G.pub=r.data?.data||null;G.pubAt=r.data?.published_at||null;G.brak=false}
  catch(e){G.brak=true;G.pub=null}
  if(!G.pub){try{const [p,s]=await Promise.all(['programy','settings'].map(n=>fetch(GR_BASE+'data/'+n+'.json',{cache:'no-store'}).then(r=>r.ok?r.json():null)));if(Array.isArray(p))G.pub={programy:p,settings:s||{},zPliku:true}}catch(e){}}
  G.draft=ls.get();G.loaded=true;
}
const D=()=>G.draft||G.pub||{programy:[],settings:{}};
const edit=()=>{if(!G.draft)G.draft=structuredClone({programy:D().programy,settings:D().settings});return G.draft};
const saveD=()=>{ls.set(G.draft);rerender()};
const dirty=()=>!!G.draft&&JSON.stringify({programy:G.draft.programy,settings:G.draft.settings})!==JSON.stringify({programy:G.pub?.programy||[],settings:G.pub?.settings||{}});
const PL=k=>window.GRANTY?.LABELS.pl[k]||k,regionPL=k=>window.GRANTY?.REGIONS[k]?.[0]||k;
const ml=o=>!o?'':typeof o==='string'?o:(o.pl||o.en||o.uk||'');
const zl=n=>(+n||0).toLocaleString('pl-PL')+' zł',amount=p=>p.kwotaMin?`${zl(p.kwotaMin)} – ${zl(p.kwotaMax)}`:`do ${zl(p.kwotaMax)}`;

/* --- menu: grupa „Dotacje” za „Prawem” --- */
NAV_GROUPS.splice(NAV_GROUPS.findIndex(g=>g.id==='admin'),0,{id:'dotacje',l:'Dotacje',c:'#ff8a5c',tip:'Serwis dotacji: zgłoszenia klientów po wstępnym raporcie, katalog źródeł finansowania, treści strony.',k:['dotacje']});
NAV_WHY.dotacje='uprawnienie „Nowe sprawy” albo Administrator';
const origMenu=menuItems;
window.menuItems=menuItems=function(){const m=origMenu();if(!gAccess())return m;
  const n=can('new_cases')?DB.leads.filter(l=>l.category==='DOT'&&l.status==='nowe').length:0;
  const i=m.findIndex(x=>x[0]==='strona'||x[0]==='podglad'||x[0]==='ustawienia');m.splice(i<0?m.length:i,0,['dotacje','💶','Dotacje',n,'n']);return m};

ROUTES.dotacje=sub=>{
  need(gAccess(),'Serwis dotacji obsługują Administrator i osoby z uprawnieniem „Nowe sprawy”.');
  const tabs=GR_TABS.filter(([k])=>k==='zgloszenia'?can('new_cases'):k==='podglad'?true:isAdmin());
  sub=tabs.some(t=>t[0]===sub)?sub:tabs[0][0];curSub=sub;
  if(!G.loaded){load().then(()=>location.hash.startsWith('#/dotacje')&&rerender());}
  const head=`<div class="ph"><div><h1>💶 Dotacje</h1><p>Serwis <a href="${GR_BASE}" target="_blank" rel="noopener">${esc(D().settings?.siteName||'Granty')} ↗</a> — wstępny raport finansowania dla klienta${dirty()?' · <span class="badge b-warn">nieopublikowane zmiany</span>':''}</p></div></div>`;
  const tb=groupTabs(tabs,GR_GROUPS,sub,k=>'#/dotacje/'+k);
  if(!G.loaded&&sub!=='zgloszenia')return head+tb+'<div class="empty">Wczytywanie…</div>';
  return head+tb+(G.err&&sub!=='zgloszenia'?`<div class="note" style="margin-bottom:12px">⚠️ ${esc(G.err)}</div>`:'')+VIEW[sub]();
};
const VIEW={};let curSub='';
ROUTES.dotacje.after=()=>{if(G.loaded||curSub==='zgloszenia')VIEW[curSub]?.after?.()};
VIEW.zgloszenia=()=>{
  const L=DB.leads.filter(l=>l.category==='DOT').sort((a,b)=>b.created.localeCompare(a.created)),open=L.filter(l=>l.status==='nowe');
  return `<p class="mut" style="margin-bottom:12px">${open.length} do obsłużenia · ${L.length} wszystkich. „Załóż sprawę” tworzy sprawę w kategorii „Dotacje i granty”.</p>${(()=>{const Pg=pageOf('dotacje',L,30);return L.length?Pg.items.map(leadCard).join('')+Pg.more:'<div class="empty">Brak zgłoszeń z serwisu dotacji.</div>'})()}`;
};
VIEW.zrodla=()=>{
  const P=[...D().programy].sort((a,b)=>'ABC'.indexOf(a.tier||'A')-'ABC'.indexOf(b.tier||'A')||(b.waga||0)-(a.waga||0));
  return `<div class="card"><h3>Źródła finansowania (${P.length}) <button class="btn sm pri" onclick="grEdit()">+ Dodaj źródło</button></h3>
    ${P.length?`<div class="tw"><table><tr><th>Plan</th><th>Źródło</th><th>Potencjał</th><th>Dla kogo</th><th>Waga</th><th></th></tr>${P.map(p=>`<tr style="${p.aktywny===false?'opacity:.5':''}">
      <td><span class="badge" style="background:${TIER[p.tier||'A'][1]}22;color:${TIER[p.tier||'A'][1]}">${p.tier||'A'}</span></td>
      <td><a href="#" onclick="event.preventDefault();grEdit('${esc(p.id)}')"><b>${esc(ml(p.nazwa))}</b></a><div class="mut small">${(p.cele||[]).map(g=>esc(PL('g.'+g))).join(', ')}${(p.regiony||[]).length?' · '+p.regiony.map(regionPL).join(', '):''}</div></td>
      <td class="small" style="white-space:nowrap">${amount(p)}</td><td class="small">${(p.formy||[]).map(f=>esc(PL('f.'+f))).join(', ')||'—'}</td><td>${p.waga??''}</td>
      <td style="white-space:nowrap"><button class="btn sm" onclick="grToggle('${esc(p.id)}')">${p.aktywny===false?'Włącz':'Wyłącz'}</button> <button class="btn sm del" onclick="grDel('${esc(p.id)}')">Usuń</button></td></tr>`).join('')}</table></div>`:'<div class="empty">Brak źródeł.</div>'}
    <p class="hint">Raport pokazuje najlepiej dopasowane źródło z każdego planu (A, B, opcjonalnie C). Punkty: waga × 2 + zgodne cele (do 2 × 15) + słowa-klucze w opisie (do 3 × 12). Zmiany trafiają do szkicu — na stronę po publikacji.</p></div>`;
};
const cbx=(name,keys,label,sel,radio)=>`<div style="display:flex;flex-wrap:wrap;gap:6px 14px">${keys.map(k=>`<label class="chk"><input type="${radio?'radio':'checkbox'}" name="${name}" value="${esc(k)}" ${(sel||[]).includes(k)?'checked':''}>${esc(label(k))}</label>`).join('')}</div>`;
window.grEdit=id=>{
  const E=window.GRANTY;if(!E)return toast('Brak silnika raportu — sprawdź połączenie z serwisem dotacji',true);
  const p=id?D().programy.find(x=>x.id===id):{tier:'A',nazwa:{},opis:{},formy:['firma'],cele:['rozwoj'],regiony:[],slowa:'',waga:5,aktywny:true};
  const nz=typeof p.nazwa==='string'?{pl:p.nazwa}:(p.nazwa||{}),op=typeof p.opis==='string'?{pl:p.opis}:(p.opis||{});
  modal(id?'Edytuj źródło finansowania':'Nowe źródło finansowania',`<div class="form">
    <div class="full fl">Plan${cbx('tier',['A','B','C'],k=>TIER[k][0],[p.tier||'A'],true)}</div>
    <label class="full">Nazwa (PL)<input class="f" name="nazwa_pl" value="${esc(nz.pl||'')}" required></label>
    <label class="full">Krótki opis — co można uzyskać (PL)<textarea class="f" name="opis_pl" rows="3">${esc(op.pl||'')}</textarea></label>
    <details class="full"><summary class="mut small" style="cursor:pointer">Tłumaczenia (UK, EN — opcjonalnie)</summary><div class="form" style="margin-top:8px">
      <label>Nazwa (UK)<input class="f" name="nazwa_uk" value="${esc(nz.uk||'')}"></label><label>Nazwa (EN)<input class="f" name="nazwa_en" value="${esc(nz.en||'')}"></label>
      <label>Opis (UK)<textarea class="f" name="opis_uk" rows="2">${esc(op.uk||'')}</textarea></label><label>Opis (EN)<textarea class="f" name="opis_en" rows="2">${esc(op.en||'')}</textarea></label></div></details>
    <label>Kwota od (zł)<input class="f" type="number" name="kwotaMin" min="0" step="1000" value="${p.kwotaMin??''}"></label><label>Kwota do (zł)<input class="f" type="number" name="kwotaMax" min="0" step="1000" value="${p.kwotaMax??''}" required></label>
    <label>Waga (0–10)<input class="f" type="number" name="waga" min="0" max="10" value="${p.waga??5}"></label>
    <div class="full fl">Dla kogo${cbx('formy',E.FORMS,k=>PL('f.'+k),p.formy)}</div>
    <div class="full fl">Cele${cbx('cele',E.GOALS,k=>PL('g.'+k),p.cele)}</div>
    <label class="full">Słowa-klucze branży (rdzenie, po przecinku)<textarea class="f" name="slowa" rows="2" placeholder="np. drewn, meb, stolar">${esc(p.slowa||'')}</textarea></label>
    <div class="full fl">Województwa (puste = cała Polska)${cbx('regiony',Object.keys(E.REGIONS),regionPL,p.regiony)}</div>
    <label class="chk full"><input type="checkbox" name="aktywny" ${p.aktywny!==false?'checked':''}> Aktywne</label></div>`,{wide:true,onOk:v=>{
      const sel=n=>[...document.querySelectorAll(`#mform [name="${n}"]:checked`)].map(x=>x.value);
      const pick=pre=>Object.fromEntries(['pl','uk','en'].map(l=>[l,(v[pre+'_'+l]||'').trim()]).filter(([,x])=>x));
      if(!(v.nazwa_pl||'').trim())throw new Error('Podaj nazwę');if(!(+v.kwotaMax>0))throw new Error('Podaj kwotę „do”');
      const n={tier:sel('tier')[0]||'A',nazwa:pick('nazwa'),opis:pick('opis'),kwotaMin:+v.kwotaMin||0,kwotaMax:+v.kwotaMax||0,formy:sel('formy'),cele:sel('cele'),regiony:sel('regiony'),slowa:(v.slowa||'').trim(),waga:v.waga===''?5:Math.max(0,Math.min(10,+v.waga)),aktywny:!!document.querySelector('#mform [name=aktywny]').checked};
      const d=edit();if(id)Object.assign(d.programy.find(x=>x.id===id),n);else d.programy.push({id:'p'+Date.now().toString(36),...n});saveD();toast('Zapisano w szkicu — opublikuj, by zmiana była na stronie')}});
};
window.grToggle=id=>{const p=edit().programy.find(x=>x.id===id);p.aktywny=p.aktywny===false;saveD()};
window.grDel=id=>{const d=edit(),p=d.programy.find(x=>x.id===id);if(!confirm(`Usunąć „${ml(p.nazwa)}”?`))return;d.programy=d.programy.filter(x=>x.id!==id);saveD()};

let PV={opis:'',forma:'',cele:[],region:''};
VIEW.podglad=()=>{
  const E=window.GRANTY;if(!E)return '<div class="empty">Brak silnika raportu.</div>';
  return `<div class="card"><h3>Podgląd raportu (szkic)</h3><div class="form">
    <label class="full">Czym zajmuje się klient?<textarea class="f" id="gpO" rows="3" placeholder="np. mam firmę produkującą wyroby z drewna, chcę kupić nowe maszyny…">${esc(PV.opis)}</textarea></label>
    <label>Kim jest<select class="f" id="gpF"><option value="">— rozpoznaj z opisu —</option>${E.FORMS.map(k=>`<option value="${k}" ${PV.forma===k?'selected':''}>${esc(PL('f.'+k))}</option>`).join('')}</select></label>
    <label>Województwo<select class="f" id="gpR"><option value="">— dowolnie —</option>${Object.keys(E.REGIONS).map(k=>`<option value="${k}" ${PV.region===k?'selected':''}>${esc(regionPL(k))}</option>`).join('')}</select></label>
    <div class="full fl">Cele (puste = rozpoznaj z opisu)${cbx('gpC',E.GOALS,k=>PL('g.'+k),PV.cele)}</div></div>
    <div id="gpOut" style="margin-top:14px"></div></div>`;
};
VIEW.podglad.after=()=>{
  const run=()=>{if(!window.GRANTY||!$('#gpO'))return;PV={opis:$('#gpO').value.trim(),forma:$('#gpF').value,region:$('#gpR').value,cele:[...document.querySelectorAll('[name=gpC]:checked')].map(x=>x.value)};
    if(PV.opis.length<3){$('#gpOut').innerHTML='<div class="empty">Wpisz opis działalności.</div>';return}
    const r=GRANTY.buildReport(D().programy,PV,{planC:!!D().settings?.planC});
    const why=x=>[x.hits.length?'słowa-klucze: '+x.hits.join(', '):'',x.goals.length?'cele: '+x.goals.map(g=>PL('g.'+g)).join(', '):'','waga '+x.w].filter(Boolean).join(' · ');
    $('#gpOut').innerHTML=`<p class="small mut">Rozpoznano: <b>${esc(PL('f.'+r.a.forma))}</b> · cele: <b>${r.a.cele.map(g=>esc(PL('g.'+g))).join(', ')}</b></p>
      ${r.plans.length?`<div class="grid g3" style="gap:10px;margin:10px 0">${r.plans.map(x=>`<div class="card" style="border-top:3px solid ${TIER[x.tier][1]};margin:0"><div class="mut small">Plan ${x.tier}</div><b style="font-size:1.15rem">${amount(x.p)}</b><div style="margin-top:4px"><b>${esc(ml(x.p.nazwa))}</b></div><div class="small mut">${esc(ml(x.p.opis))}</div></div>`).join('')}</div>
      <div class="card" style="background:var(--bg2)">Łączny potencjał finansowania: <b>do ${zl(r.total)}</b></div>`:'<div class="empty">Brak dopasowanych źródeł — klient zobaczy prośbę o kontakt.</div>'}
      <div class="tw" style="margin-top:12px"><table><tr><th>Plan</th><th>Źródło i powód</th><th>Punkty</th></tr>${r.all.map(x=>`<tr><td>${x.p.tier||'A'}</td><td>${esc(ml(x.p.nazwa))}<div class="mut small">${esc(why(x))}</div></td><td><b>${x.s}</b></td></tr>`).join('')}</table></div>`};
  ['gpO','gpF','gpR'].forEach(id=>$('#'+id)?.addEventListener('input',run));document.querySelectorAll('[name=gpC]').forEach(x=>x.addEventListener('change',run));run();
};

VIEW.strona=()=>{
  const S=D().settings||{},T=S.texts||{},C=S.contact||{},L=['pl','uk','en'],LN={pl:'PL',uk:'UK',en:'EN'};
  const mlf=(k,l,rows)=>L.map(x=>`<label>${l} (${LN[x]})${rows?`<textarea class="f" data-gs="texts.${k}.${x}" rows="${rows}">${esc((T[k]||{})[x]||'')}</textarea>`:`<input class="f" data-gs="texts.${k}.${x}" value="${esc((T[k]||{})[x]||'')}">`}</label>`).join('');
  const f=(p,l,v,type='text',ex='')=>`<label>${l}<input class="f" type="${type}" data-gs="${p}" value="${esc(v??'')}" ${ex}></label>`;
  return `<div class="card"><h3>Serwis</h3><div class="form">${f('siteName','Nazwa serwisu',S.siteName||'Granty')}
    <label>Domyślny język<select class="f" data-gs="defaultLang">${L.map(x=>`<option value="${x}" ${x===(S.defaultLang||'pl')?'selected':''}>${LN[x]}</option>`).join('')}</select></label>
    <label>Domyślny motyw<select class="f" data-gs="defaultTheme"><option value="light" ${S.defaultTheme!=='dark'?'selected':''}>Dzień</option><option value="dark" ${S.defaultTheme==='dark'?'selected':''}>Noc</option></select></label>
    ${f('timerSec','Czas licznika (sekundy)',S.timerSec??270,'number','min="5" max="900"')}
    <label class="chk full"><input type="checkbox" data-gs="planC" ${S.planC?'checked':''}> Pokazuj Plan C (pożyczki, ulgi)</label></div></div>
  <div class="card"><h3>Teksty strony <span class="mut small">puste = tekst domyślny</span></h3><div class="form">${mlf('heroTitle','Nagłówek')}${mlf('heroLead','Podtytuł',2)}${mlf('about','„O nas”',4)}</div></div>
  <div class="card"><h3>Kontakt na stronie</h3><div class="form">${f('contact.email','E-mail',C.email,'email')}${f('contact.phone','Telefon',C.phone)}${f('contact.address','Adres',C.address)}</div>
    <p class="hint">Zgłoszenia z formularza trafiają do CRM (Dotacje → Zgłoszenia i Nowe sprawy, kategoria „Dotacje i granty”). Gdy baza jest niedostępna, strona otwiera program pocztowy klienta z wiadomością na ten e-mail.</p></div>`;
};
VIEW.strona.after=()=>document.querySelectorAll('[data-gs]').forEach(el=>el.addEventListener('change',()=>{
  const d=edit(),path=el.dataset.gs.split('.');let o=d.settings||(d.settings={});for(const k of path.slice(0,-1))o=o[k]||(o[k]={});
  const v=el.type==='checkbox'?el.checked:el.type==='number'?(+el.value||0):el.value.trim();o[path[path.length-1]]=v;saveD()}));

VIEW.publikacja=()=>{
  const d=dirty(),P=D().programy;
  return `<div class="card"><h3>Publikacja</h3>
    <div class="grid g3" style="gap:10px">${[['Na stronie',G.pub?(G.pub.zPliku?'pliki dotacje/data/*.json':'opublikowano '+fDT(G.pubAt)):'—'],['Szkic',d?'zmiany do opublikowania':'bez zmian'],['Źródła finansowania',`${P.filter(p=>p.aktywny!==false).length} aktywnych z ${P.length}`]].map(([l,v])=>`<div style="background:var(--bg2);border-radius:10px;padding:10px 12px"><div class="mut small">${l}</div><b>${esc(v)}</b></div>`).join('')}</div>
    ${G.brak?'<div class="note" style="margin-top:12px">⚠️ Brak tabeli treści serwisu w bazie (migracja 012) — publikacja niedostępna, strona używa plików dotacje/data/*.json.</div>':''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" ${G.brak||(!d&&!G.pub?.zPliku)?'disabled':''} onclick="grPublish()">🚀 Opublikuj na stronie</button><button class="btn" ${d?'':'disabled'} onclick="grDiscard()">↺ Odrzuć szkic</button><a class="btn" href="${GR_BASE}" target="_blank" rel="noopener">Otwórz serwis ↗</a></div>
    <p class="hint">Szkic jest zapisany w tej przeglądarce. Publikacja (Administrator, w audycie) zmienia stronę od razu — bez wysyłki na GitHub. Strona czyta treści z bazy; gdy ich nie ma, używa plików <code>dotacje/data/*.json</code>.</p></div>`;
};
window.grPublish=()=>{const d=D();if(!confirm(`Opublikować serwis dotacji (${d.programy.length} źródeł finansowania)?`))return;
  act(async()=>{chk(await sb.rpc('grants_publish',{p_data:{programy:d.programy,settings:d.settings}}));ls.del();G.draft=null;await load(true)},'Opublikowano serwis dotacji')};
window.grDiscard=()=>{if(!confirm('Odrzucić nieopublikowane zmiany?'))return;ls.del();G.draft=null;rerender()};

/* --- zgłoszenie z serwisu: opis, plany, potencjał (karta zgłoszenia i Analiza sprawy) --- */
window.grantLead=d=>{
  if(!d)return '';const reg=d.region&&(window.GRANTY?.REGIONS[d.region]?.[0]||d.region);
  return `<div class="card" style="margin-top:10px;background:var(--bg2)"><b>💶 Wstępny raport dotacji</b>
    <div class="small" style="margin-top:6px">„${esc(d.opis||'')}”</div>
    <div class="small mut" style="margin-top:4px">${esc(PL('f.'+d.forma))}${d.forma_wpisana?'':' (rozpoznane z opisu)'} · cele: ${(d.cele||[]).map(g=>esc(PL('g.'+g))).join(', ')}${reg?' · '+esc(reg):''}</div>
    ${(d.plany||[]).length?`<div class="tw" style="margin-top:8px"><table><tr><th>Plan</th><th>Źródło</th><th>Kwota</th></tr>${d.plany.map(p=>`<tr><td><span class="badge" style="background:${(TIER[p.plan]||TIER.A)[1]}22;color:${(TIER[p.plan]||TIER.A)[1]}">${esc(p.plan)}</span></td><td>${esc(p.nazwa)}</td><td style="white-space:nowrap">${p.od?zl(p.od)+' – ':'do '}${zl(p.do)}</td></tr>`).join('')}</table></div>`:'<div class="small mut">Brak dopasowanych źródeł — do indywidualnej oceny.</div>'}
    <div style="margin-top:6px">Łączny potencjał: <b>do ${zl(d.laczne)}</b></div></div>`;
};
const origAn=CTAB.analiza;
CTAB.analiza=c=>origAn(c)+(c.leadData?.dotacje?grantLead(c.leadData.dotacje):'');
engine().catch(()=>{});   // etykiety w kartach zgłoszeń DOT (Nowe sprawy)
})();

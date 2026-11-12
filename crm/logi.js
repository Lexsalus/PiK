/* =====================================================================
   LOGI — menu Administracja → 📜 Logi (uprawnienie „Dziennik audytu”).
   Czytelny podgląd dziennika audytu w grupach: Publikacje (kto, kiedy, co się zmieniło),
   Logowania i bezpieczeństwo, Konfiguracja i konta, Sprawy, Pełny dziennik (z weryfikacją łańcucha).
   Dane: tabela audit_log (tylko do odczytu — wpisów nie może zmienić nikt), po 300 najnowszych.
   ===================================================================== */
(()=>{
const LG_TABS=[['publikacje','Publikacje'],['logowania','Logowania i bezpieczeństwo'],['konfiguracja','Konfiguracja i konta'],['sprawy','Sprawy'],['wszystko','Pełny dziennik']];
const LG_GROUPS=[{l:'Zmiany',c:'#2fd6a0',k:['publikacje','konfiguracja']},{l:'Dostęp',c:'#f5b84a',k:['logowania']},{l:'Praca',c:'#5aa9ff',k:['sprawy']},{l:'Całość',c:'#c08cff',k:['wszystko']}];
Object.assign(TAB_TIPS,{publikacje:'Publikacje treści strony i serwisu dotacji: kto, kiedy, co się zmieniło.',logowania:'Logowania, wylogowania, 2FA, przełącznik 2FA, dostęp awaryjny.',
  konfiguracja:'Zmiany ustawień, kategorii, procesów, kont i uprawnień, migracje bazy.',sprawy:'Zakładanie spraw, etapy, korekty, dokumenty, eksporty.',wszystko:'Cały dziennik audytu z wyszukiwarką i weryfikacją łańcucha skrótów.'});
/* filtry PostgREST (or) dla grup */
const LG_OR={
  publikacje:'action.eq.strona.publikacja,action.eq.dotacje.publikacja,action.eq.publikacja.zmiany',
  logowania:'action.like.logowanie*,action.eq.wylogowanie,action.like.bezpieczenstwo.*,action.like.awaryjny*,action.like.dostep*',
  konfiguracja:'action.like.konfiguracja.*,action.like.konto.*,action.like.uprawnien*,action.like.uzytkownik*,action.like.system.*,action.like.rola*',
  sprawy:'action.like.sprawa.*,action.like.etap.*,action.like.korekta.*,action.like.dokument.*,action.like.eksport.*,action.like.pismo.*,action.like.konflikt.*,action.like.pesel*'};
const LG={tab:'',rows:[],busy:false,q:''};
NAV_GROUPS.find(g=>g.id==='admin')?.k.splice(1,0,'logi');
NAV_WHY.logi='uprawnienie „Dziennik audytu”';
const origMenuL=menuItems;
window.menuItems=menuItems=function(){const m=origMenuL();if(can('audit'))m.push(['logi','📜','Logi']);return m};
async function lgLoad(tab){
  LG.busy=true;LG.tab=tab;LG.rows=[];
  let q=sb.from('audit_log').select('id,at,user_id,action,target,details').order('id',{ascending:false}).limit(300);
  if(LG_OR[tab])q=q.or(LG_OR[tab]);
  const r=await q;LG.rows=r.error?null:(r.data||[]);LG.busy=false;
  if(location.hash.startsWith('#/logi'))rerender();
}
/* publikacje: zdarzenie publikacji + log zmian (zapisywane w odstępie sekund) łączone w jeden wiersz */
function pubRows(rows){
  const out=[];[...rows].reverse().forEach(x=>{const last=out[out.length-1],near=last&&last.target===x.target&&Math.abs(new Date(last.at)-new Date(x.at))<120000;
    if(x.action==='publikacja.zmiany'){if(near&&!last.zm)last.zm=x.details;else out.push({at:x.at,user:x.user_id,target:x.target,zm:x.details})}
    else{if(near&&!last.det)last.det=x.details;else out.push({at:x.at,user:x.user_id,target:x.target,det:x.details})}});
  return out.reverse();
}
const actName=a=>({'strona.publikacja':'Publikacja treści strony','dotacje.publikacja':'Publikacja serwisu dotacji','logowanie':'Logowanie','wylogowanie':'Wylogowanie','logowanie.2fa_konfiguracja':'Konfiguracja 2FA',
  'bezpieczenstwo.2fa_wylaczone':'⚠️ 2FA wyłączone','bezpieczenstwo.2fa_wlaczone':'2FA włączone','konto.utworzenie':'Nowe konto','system.migracja':'Migracja bazy'})[a]||a;
ROUTES.logi=sub=>{
  need(can('audit'),'Logi widzi osoba z uprawnieniem „Dziennik audytu”.');
  sub=LG_TABS.some(t=>t[0]===sub)?sub:'publikacje';
  const head=`<div class="ph"><div><h1>📜 Logi</h1><p>Kto, kiedy i co zrobił — z dziennika audytu (wpisów nie może zmienić nikt)</p></div></div>${groupTabs(LG_TABS,LG_GROUPS,sub,k=>'#/logi/'+k)}`;
  if(sub==='wszystko')return head+SET.audyt();
  if(LG.tab!==sub&&!LG.busy){lgLoad(sub);return head+'<div class="empty">Wczytywanie…</div>'}
  if(LG.busy)return head+'<div class="empty">Wczytywanie…</div>';
  if(LG.rows===null)return head+'<div class="empty">Nie udało się wczytać dziennika.</div>';
  const f=x=>!LG.q||[x.action,x.target,x.details,U(x.user_id||x.user).name].join(' ').toLowerCase().includes(LG.q.toLowerCase());
  const bar=`<div class="toolbar"><input class="f" id="lgQ" placeholder="Szukaj (osoba, akcja, treść)…" value="${esc(LG.q)}" style="flex:1;min-width:200px"><button class="btn sm" onclick="LGreload()">↻ Odśwież</button></div>`;
  if(sub==='publikacje'){const P=pubRows(LG.rows).filter(p=>!LG.q||[p.target,p.zm,p.det,U(p.user).name].join(' ').toLowerCase().includes(LG.q.toLowerCase()));
    return head+bar+(P.length?`<div class="card" style="padding:6px 8px"><div class="tw"><table><tr><th>Kiedy</th><th>Kto</th><th>Co</th><th>Zmiany</th></tr>${P.map(p=>`<tr style="vertical-align:top"><td class="small" style="white-space:nowrap">${fDT(p.at)}</td><td class="small">${esc(U(p.user).name)}</td><td class="small"><b>${esc(p.target==='serwis dotacji'?'💶 Dotacje':'🌐 Treści strony')}</b><div class="mut">${esc(p.det||'')}</div></td><td class="small" style="white-space:pre-line">${esc(p.zm||'—')}</td></tr>`).join('')}</table></div></div>`:'<div class="empty">Brak publikacji.</div>')
      +'<p class="hint">Zmiany opisywane są od wersji 1.39 — wcześniejsze publikacje mają tylko datę, osobę i rozmiar.</p>';}
  const L=LG.rows.filter(f),Pg=pageOf('logi-'+sub,L,100);
  return head+bar+(L.length?`<div class="card" style="padding:6px 8px"><div class="tw"><table><tr><th>Kiedy</th><th>Kto</th><th>Zdarzenie</th><th>Dotyczy</th><th>Szczegóły</th></tr>${Pg.items.map(x=>`<tr style="vertical-align:top"><td class="small" style="white-space:nowrap">${fDT(x.at)}</td><td class="small">${esc(x.user_id?U(x.user_id).name:'system')}</td><td class="small">${esc(actName(x.action))}</td><td class="small">${esc(x.target||'')}</td><td class="small" style="white-space:pre-line">${esc(x.details||'')}</td></tr>`).join('')}</table></div></div>${Pg.more}`:'<div class="empty">Brak wpisów.</div>')
    +'<p class="hint">Pokazane najnowsze 300 wpisów z tej grupy. Starsze i wyszukiwanie w całości: zakładka „Pełny dziennik”.</p>';
};
ROUTES.logi.after=()=>{const q=$('#lgQ');if(q){q.oninput=()=>{LG.q=q.value;const p=q.selectionStart;rerender();const n=$('#lgQ');if(n){n.focus();n.setSelectionRange(p,p)}}}};
window.LGreload=()=>{LG.tab='';rerender()};
})();

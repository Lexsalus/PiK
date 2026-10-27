/* =====================================================================
   PODGLĄD PANELU (tylko Administrator) — jak CRM wygląda dla wybranej roli
   albo konkretnej osoby. Tylko do odczytu: zapisy, publikacje i wywołania
   funkcji bazy są zablokowane.
   Podgląd stosuje te same reguły co CRM (rola, nadania indywidualne, zespół
   sprawy, flagi dostępu) na danych wczytanych przez Administratora. Baza i tak
   pilnuje dostępu osobno; w podglądzie nie ma cudzych powiadomień ani raportów
   (liczy je baza dla zalogowanej osoby).
   ===================================================================== */
let PREVIEW=null;   // {u: oglądany użytkownik, real: Administrator, label}
(()=>{
document.head.insertAdjacentHTML('beforeend',`<style>
#pvBar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:color-mix(in srgb,var(--accent) 16%,var(--card));border:1px solid var(--accent);border-radius:12px;padding:10px 14px;margin:16px 24px 0;max-width:1272px}
@media(max-width:760px){#pvBar{margin:12px 16px 0}}
#pvBar b{font-weight:800}#pvBar .sp{flex:1}
</style>`);

/* blokada zapisów w podglądzie */
const RO=()=>{throw new Error('Podgląd — tylko do odczytu')};
{const f=sb.from,r=sb.rpc,s=sb.storage.from.bind(sb.storage);
 sb.from=t=>{const b=f(t);if(PREVIEW)['insert','update','upsert','delete'].forEach(m=>b[m]=RO);return b};
 sb.rpc=(n,a)=>{if(PREVIEW){if(n==='log_event'||n==='log_login')return Promise.resolve({data:null,error:null});return Promise.resolve({data:null,error:{message:'Podgląd — tylko do odczytu'}})}return r(n,a)};
 sb.storage.from=bk=>{const o=s(bk);if(PREVIEW){o.upload=()=>Promise.resolve({data:null,error:{message:'Podgląd — tylko do odczytu'}})}return o}}
{const a=act;act=async(fn,okMsg)=>{if(PREVIEW){toast('Podgląd — tylko do odczytu',true);throw new Error('Podgląd — tylko do odczytu')}return a(fn,okMsg)}}

/* lewe menu: pozycja „Podgląd” dla Administratora */
{const m=menuItems;menuItems=()=>{const L=m();if(!PREVIEW&&isAdmin()){const i=L.findIndex(x=>x[0]==='ustawienia');L.splice(i<0?L.length:i,0,['podglad','👁','Podgląd'])}return L}}

/* pasek „Podgląd jako …” nad treścią */
{const rs=renderShell;renderShell=()=>{rs();let b=$('#pvBar');
  if(PREVIEW){if(!b){b=document.createElement('div');b.id='pvBar';$('#view').before(b)}
    b.innerHTML=`<span>👁 Podgląd jako <b>${esc(PREVIEW.label)}</b> — tylko do odczytu</span><span class="sp"></span><span class="small mut" data-tip="W podglądzie nie ma cudzych powiadomień ani raportów — liczy je baza dla zalogowanej osoby. Dostępu i tak pilnuje baza.">wg reguł CRM</span><button class="btn sm pri" type="button" onclick="previewEnd()">Zakończ podgląd</button>`}
  else b?.remove()}}

ROUTES.podglad=()=>{
  need(isAdmin(),'Podgląd panelu: tylko Administrator.');
  const users=DB.users.filter(u=>u.id!==ME.id&&u.active!==false);
  return `<div class="ph"><div><h1>Podgląd panelu</h1><p>Jak CRM wygląda dla wybranej roli albo konkretnej osoby — menu, sprawy, zakładki i przyciski. Tylko do odczytu.</p></div></div>
  <div class="grid g2" style="align-items:start">
    <div class="card"><h3>Jako rola</h3><p class="small mut" style="margin-bottom:10px">Domyślne uprawnienia roli, bez przypisań do spraw (jak nowe konto tej roli).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${Object.entries(ROLES).filter(([k])=>k!=='admin').map(([k,l])=>`<button class="btn" type="button" onclick="previewStart('role','${k}')">${esc(l)}</button>`).join('')}</div></div>
    <div class="card"><h3>Jako osoba</h3><p class="small mut" style="margin-bottom:10px">Rola, nadania indywidualne i sprawy, w których osoba jest w zespole.</p>
      ${users.length?`<div class="tw"><table><tr><th>Osoba</th><th>Rola</th><th></th></tr>${users.map(u=>`<tr><td>${av(u.id)} ${esc(u.name)}</td><td>${esc(ROLES[u.role]||u.role)}</td><td style="text-align:right"><button class="btn sm" type="button" onclick="previewStart('user','${u.id}')">Podgląd</button></td></tr>`).join('')}</table></div>`:'<div class="empty">Brak innych aktywnych kont</div>'}</div></div>
  <p class="hint">Podgląd stosuje te same reguły co CRM na danych wczytanych przez Administratora. W podglądzie nie ma cudzych powiadomień ani raportów (liczy je baza dla zalogowanej osoby). Dostępu do danych i tak pilnuje baza.</p>`;
};

window.previewStart=(kind,id)=>{
  if(!isAdmin())return;
  const real=ME;let u,label;
  if(kind==='role'){u={id:'podglad-'+id,name:'Podgląd: '+ROLES[id],role:id,email:'',color:'#888',active:true};label='rola '+ROLES[id]}
  else{const x=DB.users.find(y=>y.id===id);if(!x)return;u={...x};label=x.name+' ('+(ROLES[x.role]||x.role)+')'}
  PREVIEW={u,real,label};ME=u;
  const go=seesCases(u)?'#/pulpit':'#/ustawienia';if(location.hash===go)route();else location.hash=go;
};
window.previewEnd=()=>{if(!PREVIEW)return;ME=PREVIEW.real;PREVIEW=null;if(location.hash==='#/podglad')route();else location.hash='#/podglad'};

/* raporty liczy baza dla zalogowanej osoby — w podglądzie bez liczb */
{const ra=ROUTES.raporty.after;ROUTES.raporty.after=(...x)=>{if(PREVIEW){const h=$('#repAt');if(h)h.textContent='Raporty liczy baza dla zalogowanej osoby — w podglądzie liczby są niedostępne.';return}return ra?.(...x)}}
/* odświeżenie danych w tle nie przerywa podglądu */
{const rl=reload;reload=async o=>{await rl(o);if(PREVIEW){PREVIEW.real=ME;const x=DB.users.find(y=>y.id===PREVIEW.u.id);if(x)PREVIEW.u={...x};ME=PREVIEW.u}}}
/* wylogowanie kończy podgląd */
{const lo=$('#logout').onclick;$('#logout').onclick=e=>{if(PREVIEW){ME=PREVIEW.real;PREVIEW=null}return lo(e)}}
})();

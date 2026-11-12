/* Granty — strona dla klienta: opis → licznik → raport → kontakt */
let PROGRAMS = [];
let SITE = {};
let RUN = null;      // { endAt, total, input }
let REPORT = null;
let tick = null;

async function loadJSON(path, def){
  try{ const r = await fetch(path+'?v='+Date.now(), {cache:'no-store'}); if(!r.ok) throw 0; return await r.json(); }
  catch(e){ return def; }
}
const ss = { get(k){ try{ return JSON.parse(sessionStorage.getItem('granty.'+k)); }catch(e){ return null; } }, set(k,v){ try{ sessionStorage.setItem('granty.'+k, JSON.stringify(v)); }catch(e){} }, del(k){ try{ sessionStorage.removeItem('granty.'+k);}catch(e){} } };

function show(v){ ['vInput','vRun','vReport'].forEach(id=>$('#'+id).classList.toggle('hidden', id!==v)); }

/* treści opublikowane w CRM (CRM → Dotacje → Publikacja) */
async function loadDB(){
  try{
    const r = await fetch(`${KANCELARIA.url}/rest/v1/grants_content?id=eq.1&select=data`, { headers:{ apikey:KANCELARIA.key, Accept:'application/json' }, cache:'no-store' });
    if(!r.ok) return null;
    const d = (await r.json())[0]?.data;
    return d && Array.isArray(d.programy) && d.settings ? d : null;
  }catch(e){ return null; }
}

/* --- krok 1 --- */
function renderInputs(){
  const selF = $$('#cForm .on').map(c=>c.dataset.k), selG = $$('#cGoals .on').map(c=>c.dataset.k), reg = $('#region').value;
  $('#cForm').innerHTML = FORMS.map(k=>`<span class="chip ${selF.includes(k)?'on':''}" data-k="${k}" onclick="pickOne(this)">${t('f.'+k)}</span>`).join('');
  $('#cGoals').innerHTML = GOALS.map(k=>`<span class="chip ${selG.includes(k)?'on':''}" data-k="${k}" onclick="this.classList.toggle('on')">${t('g.'+k)}</span>`).join('');
  $('#region').innerHTML = `<option value="">${t('in.any')}</option>` + Object.keys(REGIONS).map(k=>`<option value="${k}">${esc(regionName(k))}</option>`).join('');
  $('#region').value = reg;
}
function pickOne(el){ const on = el.classList.contains('on'); $$('#cForm .chip').forEach(c=>c.classList.remove('on')); if(!on) el.classList.add('on'); }

function startCheck(){
  const opis = $('#opis').value.trim();
  if(opis.length < 10){ toast(t('in.short')); $('#opis').focus(); return; }
  const input = { opis, forma: ($('#cForm .on')||{}).dataset?.k || '', cele: $$('#cGoals .on').map(c=>c.dataset.k), region: $('#region').value };
  const total = Math.max(5, Number(SITE.timerSec)||270);
  RUN = { endAt: Date.now()+total*1000, total, input };
  ss.set('run', RUN); ss.del('report');
  runView();
}

/* --- krok 2: licznik --- */
const STEPS = ['run.s1','run.s2','run.s3','run.s4','run.s5','run.s6','run.s7'];
function runView(){
  show('vRun'); window.scrollTo({top:0,behavior:'smooth'});
  clearInterval(tick); tick = setInterval(updateRun, 250); updateRun();
}
function updateRun(){
  const left = Math.max(0, RUN.endAt - Date.now());
  const sec = Math.ceil(left/1000);
  $('#clock').textContent = Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  const prog = 1 - left/(RUN.total*1000);
  $('#runBar').style.width = (prog*100).toFixed(1)+'%';
  const cur = Math.min(STEPS.length-1, Math.floor(prog*STEPS.length));
  if(RUN.cur !== cur){ RUN.cur = cur;   // przerysowanie tylko przy zmianie kroku — inaczej kółeczko zaczynało obrót od nowa co 250 ms
  $('#steps').innerHTML = STEPS.map((k,i)=>`<li class="${i<cur?'done':i===cur?'cur':''}">${i<cur?'✓':i===cur?'<span class="spin"></span>':'•'} ${t(k)}</li>`).join(''); }
  document.title = $('#clock').textContent+' · '+(SITE.siteName||'Granty');
  if(left<=0){ clearInterval(tick); finishRun(); }
}
function finishRun(){
  REPORT = { input: RUN.input };
  ss.set('report', REPORT); ss.del('run'); RUN = null;
  document.title = SITE.siteName||'Granty';
  reportView();
}

/* --- krok 3: raport + formularz --- */
function reportView(){
  show('vReport');
  const r = buildReport(PROGRAMS, REPORT.input, { planC: !!SITE.planC }); REPORT.res = r;
  const c = SITE.contact||{};
  $('#vReport').innerHTML = `
  <div class="hero"><h1>${t('rep.title')}</h1><p><span class="muted">${t('rep.for')}</span> „${esc(REPORT.input.opis)}”</p></div>
  ${r.plans.length ? `
  <div class="grid ${r.plans.length>2?'g3':'g2'}">
    ${r.plans.map(x=>`
    <div class="card plan plan-${x.tier}">
      <div class="plan-tag">${t('rep.plan',{x:x.tier})}</div>
      <div class="muted small">${t('rep.potential')}</div>
      <div class="plan-amt">${amountText(x.p)}</div>
      <h3>${esc(ml(x.p.nazwa))}</h3>
      <p class="muted">${esc(ml(x.p.opis))}</p>
    </div>`).join('')}
  </div>
  <div class="card mt total"><span>${t('rep.total')}</span><b>${t('rep.upto',{x:fmtMoney(r.total)})}</b></div>`
  : `<div class="card">${t('rep.none')}</div>`}
  <p class="muted small mt">${t('rep.note')}</p>

  <div class="card mt" id="leadBox">
    <h2>${t('rep.cta')}</h2>
    <form id="fLead" class="grid" onsubmit="event.preventDefault();sendLead()">
      <div class="grid g2">
        <label class="f">${t('cf.name')} *<input type="text" name="name" autocomplete="name" required></label>
        <label class="f">${t('cf.company')}<input type="text" name="company" autocomplete="organization"></label>
        <label class="f">${t('cf.email')}<input type="email" name="email" autocomplete="email"></label>
        <label class="f">${t('cf.phone')} *<input type="tel" name="phone" autocomplete="tel" required></label>
      </div>
      <label class="f">${t('cf.msg')}<textarea name="msg" rows="3"></textarea></label>
      <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" name="consent" style="margin-top:3px"> <span>${t('cf.consent')}</span></label>
      <input type="text" name="_gotcha" class="hidden" tabindex="-1" autocomplete="off">
      <div class="row"><button class="btn pri lg">${t('cf.send')}</button><button type="button" class="btn" onclick="resetAll()">${t('rep.again')}</button></div>
    </form>
  </div>`;
  REPORT.plans = r.plans.map(x=>`Plan ${x.tier}: ${ml(x.p.nazwa)} (${amountText(x.p)})`);
}
/* zgłoszenie dla CRM: opis, dopasowane plany i łączny potencjał (wynik główny) */
function leadCalc(){
  const r = REPORT.res || buildReport(PROGRAMS, REPORT.input, { planC: !!SITE.planC }), I = REPORT.input;
  return { id:'granty', name:'Dotacje — wstępny raport', inputs:[], outputs:[{ label:'Łączny potencjał finansowania', unit:'zł', value:r.total, main:true }],
    dotacje:{ opis:String(I.opis).slice(0,1000), forma:r.a.forma, forma_wpisana:!!I.forma, cele:r.a.cele, region:I.region||'',
      plany:r.plans.map(x=>({ plan:x.tier, id:x.p.id, nazwa:(x.p.nazwa&&x.p.nazwa.pl)||String(x.p.nazwa||''), od:Number(x.p.kwotaMin)||0, do:Number(x.p.kwotaMax)||0, punkty:x.s })),
      laczne:r.total, wersja:APP_VERSION } };
}
function leadText(v){
  return [
    `Opis działalności: ${REPORT.input.opis}`,
    REPORT.input.forma?`Kim jest: ${t('f.'+REPORT.input.forma)}`:null,
    REPORT.input.region?`Województwo: ${regionName(REPORT.input.region)}`:null,
    (REPORT.input.cele||[]).length?`Cele: ${REPORT.input.cele.map(g=>t('g.'+g)).join(', ')}`:null,
    '', 'Raport:', ...(REPORT.plans||[]), '',
    `Imię i nazwisko: ${v.name}`, `Firma: ${v.company}`, `E-mail: ${v.email}`, `Telefon: ${v.phone}`, v.msg?`Wiadomość: ${v.msg}`:null, `Język: ${LANG.toUpperCase()}`
  ].filter(x=>x!==null).join('\n');
}
async function sendLead(){
  const f = $('#fLead');
  const v = { name:f.name.value.trim(), company:f.company.value.trim(), email:f.email.value.trim(), phone:f.phone.value.trim(), msg:f.msg.value.trim() };
  if(v.name.length<2 || v.phone.replace(/\D/g,'').length<6 || !f.consent.checked){ toast(t('cf.req')); return; }
  if(f._gotcha.value) return;
  const body = leadText(v);
  const btn0 = $('button.pri', f); btn0.disabled = true;
  /* 1) CRM kancelarii: zgłoszenie trafia do „Nowe sprawy” / „Dotacje → Zgłoszenia” */
  try{
    const r = await fetch(`${KANCELARIA.url}/rest/v1/leads`, { method:'POST', headers:{ apikey:KANCELARIA.key, 'Content-Type':'application/json', Prefer:'return=minimal' },
      body: JSON.stringify({ category:'DOT', calc: leadCalc(), client_name:v.name.slice(0,120), phone:v.phone.slice(0,30), email:v.email.slice(0,120)||null,
        message:[v.company?`Firma / organizacja: ${v.company}`:'', v.msg].filter(Boolean).join('\n').slice(0,2000)||null, lang:LANG, consent:true }) });
    if(r.ok){ $('#leadBox').innerHTML = `<h2>✓ ${t('cf.sent')}</h2>`; return; }
    let m=''; try{ m=(await r.json()).message||''; }catch(e){}
    if(/Zbyt wiele|Chwilowo/.test(m)){ toast(t('cf.limit')); btn0.disabled=false; return; }
  }catch(e){}
  btn0.disabled = false;
  /* 2) zapasowo: formularz zewnętrzny albo program pocztowy */
  const subject = `Zapytanie o dotacje — ${v.company || v.name || v.email || v.phone}`;
  const ep = (SITE.form||{}).endpoint;
  const btn = $('button.pri', f); btn.disabled = true;
  if(ep){
    try{
      const payload = { subject, name:v.name, email:v.email, phone:v.phone, company:v.company, message:body, from_name: SITE.siteName||'Granty' };
      if((SITE.form||{}).key) payload.access_key = SITE.form.key;
      const r = await fetch(ep, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify(payload) });
      if(!r.ok) throw new Error(r.status);
      $('#leadBox').innerHTML = `<h2>✓ ${t('cf.sent')}</h2>`;
    }catch(e){ toast(t('cf.err')); btn.disabled = false; }
    return;
  }
  const to = (SITE.contact||{}).email || '';
  location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  $('#leadBox').insertAdjacentHTML('beforeend', `<p class="mt"><span class="badge b-open">${t('cf.mailto')}</span></p>`);
  btn.disabled = false;
}
function resetAll(){ ss.del('report'); ss.del('run'); REPORT=null; show('vInput'); window.scrollTo({top:0,behavior:'smooth'}); }

/* --- treści stałe --- */
function txt(key, def){ const o = (SITE.texts||{})[key]; return ml(o) || t(def); }
function renderStatic(){
  const name = SITE.siteName || 'Granty';
  $('#siteName').textContent = name; $('#siteName2').textContent = name; if(!RUN) document.title = name;
  $('#heroTitle').textContent = txt('heroTitle','hero.title');
  $('#heroLead').textContent = txt('heroLead','hero.lead');
  $('#aboutText').innerHTML = nl2p(txt('about','about.text'));
  const c = SITE.contact||{}, parts=[];
  if(c.email) parts.push(`✉ <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  if(c.phone) parts.push(`☎ <a href="tel:${esc(c.phone.replace(/\s/g,''))}">${esc(c.phone)}</a>`);
  if(c.address) parts.push(`📍 ${esc(c.address)}`);
  $('#kontakt').classList.toggle('hidden', !parts.length);
  $('#contactBox').innerHTML = parts.map(p=>`<p>${p}</p>`).join('');
}

document.addEventListener('langchange', ()=>{ renderInputs(); renderStatic(); if(REPORT && !$('#vReport').classList.contains('hidden')) reportView(); if(RUN) updateRun(); });

(async function init(){
  $('#tools').innerHTML = toolsHTML();
  $('#year').textContent = new Date().getFullYear();
  $('#ver').textContent = APP_VERSION;
  const db = await loadDB();   // opublikowane w CRM kancelarii; brak — pliki z repozytorium
  SITE = db?.settings || await loadJSON('data/settings.json', {});
  initPrefs(SITE.defaultLang, SITE.defaultTheme);
  PROGRAMS = db?.programy || await loadJSON('data/programy.json', []);
  renderInputs(); renderStatic();
  RUN = ss.get('run'); REPORT = ss.get('report');
  if(RUN) runView(); else if(REPORT) reportView(); else show('vInput');
})();

/* Restrukturyzacja firmy — kalkulator dla przedsiębiorcy (sekcja #firma na stronie).
   Przedsiębiorca wpisuje długi (bank, leasing, ZUS, podatki, dostawcy…), przychody i koszty.
   Strona pokazuje tylko kwoty: raty teraz i po układzie, raty wstrzymane w okresie ochrony, mniej odsetek, umorzenie.
   Warianty postępowań z podstawami prawnymi trafiają ze zgłoszeniem do CRM (leads.calc.analiza).
   Model jest orientacyjny — parametry układu (umorzenie, liczba rat, karencja) zmienia się suwakami. */
(function(){
'use strict';
const TYPES=[
  {k:'bank',l:'Kredyt bankowy',lt:'kredyt'},
  {k:'leasing',l:'Leasing',lt:'leasing'},
  {k:'pozyczka',l:'Pożyczka (pozabankowa, prywatna)',lt:'kredyt'},
  {k:'dostawcy',l:'Dostawcy / kontrahenci (faktury)',lt:'handel'},
  {k:'us',l:'Podatki (urząd skarbowy)',lt:'publ'},
  {k:'zus',l:'ZUS (składki)',lt:'zus'},
  {k:'inne',l:'Inne',lt:'handel'}];
const PRAWO_RST={  // tylko do CRM
  warianty:[
    {id:'pzu',nazwa:'Postępowanie o zatwierdzenie układu (PZU)',podstawa:'art. 210–226g p.r.; ochrona od obwieszczenia w KRZ do 4 mies. (art. 226g p.r.) — zawieszenie egzekucji (art. 259 p.r. w zw. z art. 226c p.r.), zakaz wypowiedzenia m.in. umów kredytu, leasingu, najmu (art. 256 p.r.)',kiedy:'najszybsze (ok. 4 mies.), dłużnik sam zbiera głosy z nadzorcą układu; gdy wierzytelności sporne < 15% sumy'},
    {id:'ppu',nazwa:'Przyspieszone postępowanie układowe',podstawa:'art. 227–264 p.r.',kiedy:'gdy suma wierzytelności spornych ≤ 15% i potrzebna ochrona sądu'},
    {id:'pu',nazwa:'Postępowanie układowe',podstawa:'art. 265–282 p.r.',kiedy:'gdy wierzytelności sporne > 15%'},
    {id:'san',nazwa:'Sanacja',podstawa:'art. 283–323 p.r.',kiedy:'głęboki kryzys, potrzebne działania sanacyjne (np. odstąpienie od umów, redukcja zatrudnienia)'}],
  zasady:[
    'Układ: większość wierzycieli głosujących, mających łącznie co najmniej 2/3 sumy wierzytelności (art. 119 p.r.)',
    'Propozycje układowe: odroczenie, rozłożenie na raty, zmniejszenie wysokości, konwersja na udziały (art. 156 p.r.)',
    'Wierzytelności zabezpieczone rzeczowo — w układzie tylko w części niezaspokojonej z zabezpieczenia albo za zgodą wierzyciela (art. 151 ust. 2 p.r.)',
    'Wierzytelności ze stosunku pracy nie są objęte układem (art. 151 ust. 2 p.r.)',
    'ZUS i podatki — układ może stanowić pomoc publiczną; wymaga zgody/warunków organu (do weryfikacji w sprawie)',
    'Leasing w PZU: bieżące raty po otwarciu płacone na bieżąco, zaległe objęte układem (do weryfikacji w umowie)']
};
const S={rows:[{t:'bank',kw:200000,rata:6000,opr:11,zal:18000,egz:false,zab:false},{t:'leasing',kw:120000,rata:4200,opr:9,zal:8400,egz:false,zab:false},{t:'zus',kw:45000,rata:0,opr:0,zal:45000,egz:true,zab:false},{t:'dostawcy',kw:80000,rata:0,opr:0,zal:80000,egz:false,zab:false}],
  przychod:60000,koszty:48000,red:30,mies:48,kar:6,init:false};
const $=s=>document.querySelector(s);
const tt=x=>typeof t==='function'?t(x):x;
const e=s=>typeof esc==='function'?esc(s):String(s);
const zl=v=>Math.round(v).toLocaleString('pl-PL')+' zł';
/* odsetki do końca spłaty z raty annuitetowej: n = −ln(1 − r·K/R)/ln(1+r) */
function interestLeft(K,R,opr){const r=opr/1200;if(!K||!R||!r)return 0;const x=1-r*K/R;if(x<=0)return K*r*120;const n=-Math.log(x)/Math.log(1+r);return Math.max(0,R*n-K)}
function calc(){
  const T=k=>TYPES.find(x=>x.k===k)||TYPES[6];
  let rNow=0,rAfter=0,odsetki=0,umorz=0,wstrz=0,objete=0,zabSuma=0;
  const rows=S.rows.map(r=>{
    const typ=T(r.t),kw=+r.kw||0,rata=+r.rata||0,zal=+r.zal||0,opr=+r.opr||0;
    const due=rata>0?rata:0;rNow+=due;
    const inPlan=!r.zab; // zabezpieczone rzeczowo — domyślnie poza układem (spłacane jak dotąd)
    if(!inPlan){rAfter+=due;zabSuma+=kw;return{...r,inPlan,rataPo:due}}
    objete+=kw;
    const odsPrzysz=interestLeft(kw,rata,opr),odsZal=zal>0&&opr>0?zal*opr/100/2:0; // zaległe: ok. pół roku odsetek
    odsetki+=odsPrzysz+odsZal;
    const red=typ.lt==='zus'||typ.lt==='publ'?0:S.red/100; // ZUS i podatki: w modelu tylko rozłożenie na raty
    const um=kw*red;umorz+=um;
    const po=(kw-um)/Math.max(1,S.mies);rAfter+=po;
    wstrz+=due>0?due*4:(zal>0?zal/Math.max(1,S.mies)*4:0);
    return{...r,inPlan,rataPo:po,umorz:um};
  });
  const zdol=(+S.przychod||0)-(+S.koszty||0);
  return{rows,rNow,rAfter,odsetki,umorz,wstrz,objete,zabSuma,zdol,razem:odsetki+umorz,stac:zdol>=rAfter};
}
function pseudoCalc(R){
  const o=(key,label,v,main)=>({key,label,unit:'zł',formula:String(Math.round(v)),decimals:0,main:!!main});
  return{id:'firma',name:'Restrukturyzacja firmy',icon:'🏢',crmCategory:'RST',
    inputs:[{key:'dlugi',label:'Suma długów',unit:'zł'},{key:'raty',label:'Raty miesięcznie teraz',unit:'zł'},{key:'przychod',label:'Przychód miesięcznie',unit:'zł'},{key:'koszty',label:'Koszty stałe miesięcznie',unit:'zł'},{key:'red',label:'Umorzenie w wariancie',unit:'%'},{key:'mies',label:'Liczba rat w układzie',unit:'mies.'},{key:'kar',label:'Karencja',unit:'mies.'}],
    outputs:[o('razem','Łącznie mniej do zapłaty',R.razem,true),o('rataPo','Raty po układzie (mies.)',R.rAfter),o('wstrz','Raty wstrzymane w okresie ochrony (do 4 mies.)',R.wstrz),o('odsetki','Mniej odsetek',R.odsetki),o('umorz','Umorzenie części długu',R.umorz)]};
}
function render(cfg){
  const box=$('#firmaCalc');if(!box)return;
  if(cfg&&!S.init){['red','mies','kar'].forEach(k=>{if(Number.isFinite(+cfg[k])&&cfg[k]!=='')S[k]=+cfg[k]})}
  const R=calc(),opt=TYPES.map(x=>`<option value="${x.k}">${e(tt(x.l))}</option>`).join('');
  if(!S.init){S.init=true;
    box.innerHTML=`<div class="panel fade fpanel">
      <h3>🏢 ${e(tt('Długi firmy'))}</h3>
      <div class="ftw"><table class="ftab"><thead><tr><th>${e(tt('Rodzaj'))}</th><th>${e(tt('Do spłaty'))} (zł)</th><th>${e(tt('Rata / mies.'))} (zł)</th><th>${e(tt('Oprocentowanie'))} (%)</th><th>${e(tt('Zaległe'))} (zł)</th><th title="${e(tt('Komornik lub egzekucja z urzędu'))}">${e(tt('Egzekucja'))}</th><th title="${e(tt('Hipoteka, zastaw, przewłaszczenie'))}">${e(tt('Zabezpieczony'))}</th><th></th></tr></thead><tbody id="fRows"></tbody></table></div>
      <button class="btn" id="fAdd">+ ${e(tt('Dodaj dług'))}</button>
      <div class="frow2"><label>${e(tt('Przychód miesięcznie (netto)'))}<input class="field" type="number" id="fPrz" value="${S.przychod}"></label><label>${e(tt('Koszty stałe miesięcznie (bez rat)'))}<input class="field" type="number" id="fKos" value="${S.koszty}"></label></div>
      <h3 style="margin-top:18px">${e(tt('Wariant układu'))}</h3>
      <div class="frow3">${[['red','Umorzenie części długu',0,70,5,'%'],['mies','Rozłożenie na raty',12,120,6,'mies.'],['kar','Karencja (bez spłat)',0,24,1,'mies.']].map(([k,l,mi,ma,st,u])=>`<label>${e(tt(l))}: <b id="fv_${k}">${S[k]} ${e(tt(u))}</b><input type="range" data-fs="${k}" min="${mi}" max="${ma}" step="${st}" value="${S[k]}"></label>`).join('')}</div></div>
      <div class="panel res fade" id="fRes"></div>`;
    $('#fAdd').onclick=()=>{S.rows.push({t:'dostawcy',kw:0,rata:0,opr:0,zal:0,egz:false,zab:false});drawRows();render()};
    $('#fPrz').oninput=x=>{S.przychod=+x.target.value||0;render()};$('#fKos').oninput=x=>{S.koszty=+x.target.value||0;render()};
    box.querySelectorAll('[data-fs]').forEach(x=>x.oninput=()=>{S[x.dataset.fs]=+x.value;$('#fv_'+x.dataset.fs).textContent=x.value+' '+tt(x.dataset.fs==='red'?'%':'mies.');render()});
    drawRows();
  }
  const ok=R.stac;
  $('#fRes').innerHTML=`<span style="color:var(--mut)">${e(tt('Łącznie mniej do zapłaty'))}</span><div class="main">${zl(R.razem)}</div>
    <div class="sub"><span>${e(tt('Raty teraz'))}</span><b>${zl(R.rNow)} / ${e(tt('mies.'))}</b></div>
    <div class="sub"><span>${e(tt('Raty po układzie'))}</span><b>${zl(R.rAfter)} / ${e(tt('mies.'))}</b></div>
    <div class="sub"><span>${e(tt('Raty i egzekucje wstrzymane'))}</span><b>${e(tt('do 4 mies.'))} · ${zl(R.wstrz)}</b></div>
    ${S.kar?`<div class="sub"><span>${e(tt('Karencja w układzie'))}</span><b>${S.kar} ${e(tt('mies.'))} ${e(tt('bez spłat'))}</b></div>`:''}
    <div class="sub"><span>${e(tt('Mniej odsetek'))}</span><b>${zl(R.odsetki)}</b></div>
    <div class="sub"><span>${e(tt('Umorzenie części długu'))}</span><b>${zl(R.umorz)}</b></div>
    <div class="sub"><span>${e(tt('Firma udźwignie nowe raty?'))}</span><b style="color:${ok?'var(--good)':'var(--bad)'}">${ok?e(tt('tak')):e(tt('trzeba większej redukcji'))} (${e(tt('nadwyżka'))} ${zl(R.zdol)})</b></div>
    ${R.zabSuma?`<div class="cnote" style="margin-top:10px">${e(tt('Długi zabezpieczone (hipoteka, zastaw) liczymy jak dotąd — można je objąć układem za zgodą wierzyciela.'))}</div>`:''}
    <button class="btn pri lead-cta" id="fLead">${e(tt('Chcę zrestrukturyzować długi — bezpłatna analiza →'))}</button>
    <p class="cnote" style="margin-top:10px">${e(tt('Szacunek orientacyjny. Dokładny plan i najlepszą ścieżkę przygotuje kancelaria.'))}</p>`;
  $('#fLead').onclick=()=>{const c=pseudoCalc(R),vals={dlugi:R.rows.reduce((a,r)=>a+(+r.kw||0),0),raty:R.rNow,przychod:S.przychod,koszty:S.koszty,red:S.red,mies:S.mies,kar:S.kar};
    const T=k=>TYPES.find(x=>x.k===k)?.l||k;
    openLead(c,vals,{analiza:{zrodlo:'restrukturyzacja firmy',typ:'rst',kwalifikuje:true,
      dlugi:R.rows.map(r=>({rodzaj:T(r.t),kwota:+r.kw||0,rata:+r.rata||0,opr:+r.opr||0,zalegle:+r.zal||0,egzekucja:!!r.egz,zabezpieczony:!!r.zab,w_ukladzie:r.inPlan})).slice(0,20),
      wariant:{umorzenie_proc:S.red,raty_mies:S.mies,karencja_mies:S.kar},wynik:{raty_teraz:Math.round(R.rNow),raty_po:Math.round(R.rAfter),wstrzymane:Math.round(R.wstrz),mniej_odsetek:Math.round(R.odsetki),umorzenie:Math.round(R.umorz),nadwyzka:Math.round(R.zdol)},
      warianty:PRAWO_RST.warianty,zasady:PRAWO_RST.zasady,egzekucja:R.rows.some(r=>r.egz)}})};
}
function drawRows(){
  const tb=$('#fRows');if(!tb)return;
  tb.innerHTML=S.rows.map((r,i)=>`<tr><td><select class="field" data-i="${i}" data-f="t">${TYPES.map(x=>`<option value="${x.k}" ${x.k===r.t?'selected':''}>${e(tt(x.l))}</option>`).join('')}</select></td>
    ${['kw','rata','opr','zal'].map(f=>`<td><input class="field" type="number" min="0" step="any" data-i="${i}" data-f="${f}" value="${r[f]}"></td>`).join('')}
    <td><input type="checkbox" data-i="${i}" data-f="egz" ${r.egz?'checked':''}></td><td><input type="checkbox" data-i="${i}" data-f="zab" ${r.zab?'checked':''}></td>
    <td><button class="icon-btn" data-del="${i}" title="${e(tt('Usuń'))}">✕</button></td></tr>`).join('');
  tb.querySelectorAll('[data-f]').forEach(x=>{const ev=x.type==='checkbox'||x.tagName==='SELECT'?'change':'input';x.addEventListener(ev,()=>{const r=S.rows[+x.dataset.i];r[x.dataset.f]=x.type==='checkbox'?x.checked:x.tagName==='SELECT'?x.value:(+x.value||0);render()})});
  tb.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{S.rows.splice(+b.dataset.del,1);drawRows();render()});
}
window.FIRMA={render,calc,PRAWO_RST};
})();

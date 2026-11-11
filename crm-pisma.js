/* =====================================================================
   PISMA Z SZABLONÓW — karta sprawy → Dokumenty → 📝 Pismo z szablonu.
   Szablon: tekst z polami {{klient.nazwa}}, {{kwota}}… Pola z systemu wypełniają się same
   (klient, sprawa, kancelaria, pełnomocnik, data), pozostałe wpisuje się w formularzu.
   Wynik: DOCX (Word, bez zewnętrznych bibliotek), wydruk / PDF albo zapis w dokumentach sprawy.
   Znaczniki w treści: „# ” tytuł (wyśrodkowany, pogrubiony), „>> ” do prawej, **pogrubienie**.
   Dane kancelarii i własne szablony: tabela office_settings (migracja 011), zmienia Administrator
   w Ustawienia → Pisma. Bez migracji działają szablony wbudowane.
   ===================================================================== */
(()=>{
const DOM=[
 {id:'skd',nazwa:'Oświadczenie o skorzystaniu z sankcji kredytu darmowego',kategorie:['SKD'],tresc:`>> {{miejscowosc}}, {{data}}

{{klient.nazwa}}
{{klient.adres}}

>> **{{adresat}}**
>> {{adresat_adres}}

# OŚWIADCZENIE O SKORZYSTANIU Z SANKCJI KREDYTU DARMOWEGO

Działając w imieniu {{klient.nazwa}} (pełnomocnictwo w załączeniu), na podstawie art. 45 ust. 1 ustawy z dnia 12 maja 2011 r. o kredycie konsumenckim oświadczam, że Kredytobiorca korzysta z sankcji kredytu darmowego w odniesieniu do umowy nr {{umowa_numer}} z dnia {{umowa_data}}.

Umowa narusza obowiązki informacyjne kredytodawcy określone w art. 30 ust. 1 ustawy o kredycie konsumenckim, w szczególności: {{naruszenia}}.

W związku z powyższym Kredytobiorca zwraca wyłącznie kredyt, bez odsetek i innych kosztów kredytu należnych kredytodawcy, w terminie i w sposób ustalony w umowie. Wzywam do zwrotu kwoty {{kwota}} zł, pobranej dotychczas tytułem odsetek i kosztów kredytu, w terminie {{termin_dni}} dni od dnia otrzymania niniejszego oświadczenia, na rachunek nr {{rachunek}}, oraz do przesłania harmonogramu spłaty obejmującego wyłącznie kapitał.

>> {{pelnomocnik}}
>> {{kancelaria.nazwa}}

Załącznik: pełnomocnictwo`},
 {id:'chf_wezwanie',nazwa:'Wezwanie do zapłaty — nieważność umowy kredytu walutowego',kategorie:['CHF','FX'],tresc:`>> {{miejscowosc}}, {{data}}

{{klient.nazwa}}
{{klient.adres}}

>> **{{adresat}}**
>> {{adresat_adres}}

# WEZWANIE DO ZAPŁATY

Działając w imieniu {{klient.nazwa}} (pełnomocnictwo w załączeniu), w związku z umową kredytu nr {{umowa_numer}} z dnia {{umowa_data}}, indeksowanego (denominowanego) do waluty {{waluta}}, wzywam do zapłaty kwoty {{kwota}} zł w terminie {{termin_dni}} dni od dnia otrzymania niniejszego wezwania, na rachunek nr {{rachunek}}.

Umowa zawiera niedozwolone postanowienia umowne (art. 385¹ § 1 Kodeksu cywilnego), które kształtują mechanizm przeliczeń walutowych według kursów z tabel ustalanych jednostronnie przez bank. Postanowienia te nie wiążą Kredytobiorcy, a bez nich umowa nie może obowiązywać, co skutkuje jej nieważnością (art. 58 § 1 KC). Świadczenia spełnione w jej wykonaniu są świadczeniami nienależnymi i podlegają zwrotowi (art. 405 w zw. z art. 410 KC).

Kredytobiorca, świadomy skutków nieważności umowy, nie wyraża zgody na dalsze stosowanie niedozwolonych postanowień ani na utrzymanie umowy w mocy. Żądana kwota obejmuje świadczenia spełnione na rzecz banku w wykonaniu umowy.

Brak zapłaty w wyznaczonym terminie spowoduje skierowanie sprawy na drogę postępowania sądowego.

>> {{pelnomocnik}}
>> {{kancelaria.nazwa}}

Załącznik: pełnomocnictwo`},
 {id:'zaswiadczenie',nazwa:'Wniosek o zaświadczenie o historii kredytu',kategorie:['CHF','FX','PLN'],tresc:`>> {{miejscowosc}}, {{data}}

{{klient.nazwa}}
{{klient.adres}}

>> **{{adresat}}**
>> {{adresat_adres}}

# WNIOSEK O WYDANIE ZAŚWIADCZENIA

Działając w imieniu {{klient.nazwa}} (pełnomocnictwo w załączeniu), wnoszę o wydanie zaświadczenia dotyczącego umowy kredytu nr {{umowa_numer}} z dnia {{umowa_data}}, zawierającego:
1) kwoty i daty wypłaty kredytu (transz) w złotych i w walucie kredytu oraz zastosowane kursy;
2) wysokość i daty wszystkich wpłat (rat kapitałowo-odsetkowych) w złotych i w walucie kredytu oraz zastosowane kursy;
3) wysokość oprocentowania w poszczególnych okresach;
4) pobrane opłaty, prowizje i składki ubezpieczeniowe;
5) saldo zadłużenia na dzień wydania zaświadczenia.

Zaświadczenie proszę przesłać na adres kancelarii w terminie {{termin_dni}} dni.

>> {{pelnomocnik}}
>> {{kancelaria.nazwa}}
>> {{kancelaria.adres}}

Załącznik: pełnomocnictwo`},
 {id:'wezwanie',nazwa:'Przedsądowe wezwanie do zapłaty',kategorie:[],tresc:`>> {{miejscowosc}}, {{data}}

**{{kancelaria.nazwa}}**
{{kancelaria.adres}}

>> **{{adresat}}**
>> {{adresat_adres}}

# PRZEDSĄDOWE WEZWANIE DO ZAPŁATY

Działając w imieniu {{klient.nazwa}} (pełnomocnictwo w załączeniu), wzywam do zapłaty kwoty {{kwota}} zł tytułem {{tytul}} w terminie {{termin_dni}} dni od dnia otrzymania niniejszego wezwania, na rachunek nr {{rachunek}}.

Jednocześnie informuję, że mój Mocodawca jest otwarty na polubowne rozwiązanie sporu — w tym celu proszę o kontakt z kancelarią: {{kancelaria.telefon}}, {{kancelaria.email}}.

Brak zapłaty w wyznaczonym terminie spowoduje skierowanie sprawy na drogę postępowania sądowego, co narazi Państwa na dodatkowe koszty.

>> {{pelnomocnik}}

Załącznik: pełnomocnictwo`},
 {id:'pelnomocnictwo',nazwa:'Pełnomocnictwo',kategorie:[],tresc:`>> {{miejscowosc}}, {{data}}

# PEŁNOMOCNICTWO

Ja, niżej podpisany(-a) {{klient.nazwa}}, PESEL ………………………, zamieszkały(-a): {{klient.adres}}, udzielam pełnomocnictwa {{pelnomocnik_tytul}} {{pelnomocnik}} ({{kancelaria.nazwa}}, {{kancelaria.adres}}) do reprezentowania mnie w sprawie: {{przedmiot}} — przed sądami wszystkich instancji, Sądem Najwyższym, organami egzekucyjnymi oraz wobec {{adresat}}, w tym do składania i odbierania oświadczeń woli i wiedzy, wezwań do zapłaty oraz zawarcia ugody.

Pełnomocnictwo obejmuje umocowanie do udzielania dalszych pełnomocnictw substytucyjnych.

>> …………………………………
>> {{klient.nazwa}}`}];
const FIELD={adresat:'Adresat (bank / dłużnik)',adresat_adres:'Adres adresata',umowa_numer:'Numer umowy',umowa_data:'Data umowy',kwota:'Kwota (zł)',termin_dni:'Termin (dni)',rachunek:'Rachunek do zapłaty',
  naruszenia:'Naruszenia (opis)',tytul:'Tytułem (za co)',przedmiot:'Przedmiot sprawy',pelnomocnik_tytul:'Tytuł zawodowy pełnomocnika',waluta:'Waluta kredytu',
  'klient.nazwa':'Klient','klient.adres':'Adres klienta','klient.email':'E-mail klienta','klient.telefon':'Telefon klienta','sprawa.numer':'Numer sprawy','sprawa.kategoria':'Kategoria sprawy',
  'kancelaria.nazwa':'Kancelaria','kancelaria.adres':'Adres kancelarii','kancelaria.telefon':'Telefon kancelarii','kancelaria.email':'E-mail kancelarii','kancelaria.nip':'NIP kancelarii',miejscowosc:'Miejscowość',data:'Data pisma',pelnomocnik:'Pełnomocnik'};
const LONG=new Set(['naruszenia','przedmiot','adresat_adres']);
const S={kancelaria:{},wlasne:[],loaded:false,brak:false};
async function loadSettings(force){
  if(S.loaded&&!force)return S;
  try{const r=await sb.from('office_settings').select('key,value');if(r.error)throw r.error;
    const m=Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));S.kancelaria=m.kancelaria||{};S.wlasne=Array.isArray(m.pisma)?m.pisma:[];S.brak=false}
  catch(e){S.brak=true}
  S.loaded=true;return S;
}
/* szablony: wbudowane + własne (ten sam id = zmieniony wbudowany; ukryty:true = wyłączony) */
const szablony=()=>{const w=new Map(S.wlasne.map(t=>[t.id,t]));return [...DOM.map(t=>w.has(t.id)?{...t,...w.get(t.id),wbudowany:true}:{...t,wbudowany:true}),...S.wlasne.filter(t=>!DOM.some(d=>d.id===t.id))].filter(t=>!t.ukryty)};
const keys=tr=>[...new Set([...String(tr).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m=>m[1]))];
function auto(c){
  const k=c?CLIENT(c.clientId):{},K=S.kancelaria||{},main=c?.leadData?.outputs?.find(o=>o.main);
  return{'klient.nazwa':`${k.first||''} ${k.last||''}`.trim(),'klient.adres':k.address||'','klient.email':k.email||'','klient.telefon':k.phone||'',
    'sprawa.numer':c?.number||'','sprawa.kategoria':c?CAT(c.category).name:'','kancelaria.nazwa':K.nazwa||'','kancelaria.adres':K.adres||'','kancelaria.telefon':K.telefon||'','kancelaria.email':K.email||'','kancelaria.nip':K.nip||'',
    miejscowosc:K.miejscowosc||'',data:new Date().toLocaleDateString('pl-PL'),pelnomocnik:ME?.name||'',pelnomocnik_tytul:K.tytul||'',termin_dni:'14',waluta:c?.currency||'CHF',
    kwota:main&&Number.isFinite(+main.value)?Math.round(+main.value).toLocaleString('pl-PL'):'',adresat:'',przedmiot:c?CAT(c.category).name:''};
}
const fill=(tr,v)=>String(tr).replace(/\{\{\s*([\w.]+)\s*\}\}/g,(m,k)=>String(v[k]??'').trim()||'…………………');
/* treść → akapity: {al, title, runs:[{t,b}]} */
function blocks(txt){
  return String(txt).replace(/\r/g,'').split('\n').map(l=>{let al='left',title=false;
    if(l.startsWith('# ')){al='center';title=true;l=l.slice(2)}else if(l.startsWith('>> ')||l==='>>'){al='right';l=l.slice(3)}else if(l.length>90)al='both';
    const runs=l.split(/\*\*(.+?)\*\*/).map((t,i)=>({t,b:title||i%2===1})).filter(r=>r.t);return{al,title,runs}});
}
const xe=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toHtml(txt){return blocks(txt).map(p=>`<p style="text-align:${p.al==='both'?'justify':p.al};${p.title?'font-size:14pt;margin:18px 0 12px;':''}">${p.runs.map(r=>r.b?`<b>${xe(r.t)}</b>`:xe(r.t)).join('')||'&nbsp;'}</p>`).join('')}
/* --- DOCX: minimalny pakiet OOXML w archiwum ZIP (bez kompresji) --- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function zip(files,type){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const f of files){const nm=enc.encode(f.name),d=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(d);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);
    parts.push(new Uint8Array(h.buffer),nm,d);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+d.length}
  const sz=cd.reduce((s,x)=>s+x.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,sz,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type});
}
function docx(txt){
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const body=blocks(txt).map(p=>`<w:p><w:pPr><w:jc w:val="${p.al}"/>${p.title?'<w:spacing w:before="240" w:after="240"/>':''}</w:pPr>${p.runs.map(r=>`<w:r>${r.b||p.title?`<w:rPr>${r.b?'<w:b/>':''}${p.title?'<w:sz w:val="28"/>':''}</w:rPr>`:''}<w:t xml:space="preserve">${xe(r.t)}</w:t></w:r>`).join('')}</w:p>`).join('');
  return zip([
    {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
    {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name:'word/_rels/document.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'word/styles.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="pl-PL"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`},
    {name:'word/document.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`}
  ],'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
function printHtml(title,txt){
  const w=window.open('','_blank');if(!w)return toast('Przeglądarka zablokowała nowe okno — zezwól na wyskakujące okna',true);
  w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${xe(title)}</title><style>@page{size:A4;margin:25mm}body{font:12pt/1.45 "Times New Roman",serif;color:#000;max-width:170mm;margin:0 auto}p{margin:0 0 4px}</style></head><body>${toHtml(txt)}<script>onload=()=>setTimeout(()=>print(),200)<\/script></body></html>`);w.document.close();
}
const fname=(t,c)=>`${t.nazwa} ${c?.number||''}`.replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim().slice(0,90)+'.docx';
const dl=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};

/* --- okno pisma --- */
window.pismoModal=async(tid,caseId)=>{
  await loadSettings();const t=szablony().find(x=>x.id===tid),c=caseId?CASE(caseId):null;if(!t)return;
  const A=auto(c),ks=keys(t.tresc),canSave=c&&caseFlags(c).docsChange;
  const inp=k=>LONG.has(k)?`<textarea class="f" name="${k}" rows="2">${esc(A[k]||'')}</textarea>`:`<input class="f" name="${k}" value="${esc(A[k]||'')}">`;
  const sys=ks.filter(k=>k.includes('.')||['data','miejscowosc','pelnomocnik'].includes(k)),own=ks.filter(k=>!sys.includes(k));
  modal(t.nazwa,`<div class="form">${own.map(k=>`<label class="${LONG.has(k)?'full':''}">${esc(FIELD[k]||k)}${inp(k)}</label>`).join('')}</div>
    <details style="margin-top:10px"><summary class="mut small" style="cursor:pointer">Dane z systemu (klient, kancelaria, data) — możesz poprawić</summary><div class="form" style="margin-top:8px">${sys.map(k=>`<label>${esc(FIELD[k]||k)}${inp(k)}</label>`).join('')}</div></details>
    <div class="card" id="pmPrev" style="background:#fff;color:#111;margin-top:12px;max-height:340px;overflow:auto;font:11pt/1.45 'Times New Roman',serif"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" id="pmDocx">⬇ Pobierz DOCX</button><button type="button" class="btn" id="pmPrint">🖨️ Drukuj / PDF</button></div>
    ${!S.kancelaria?.nazwa?`<p class="hint">Brak danych kancelarii do pism — uzupełnij w Ustawienia → Pisma${S.brak?' (wymaga migracji 011)':''}.</p>`:''}
    <p class="hint">Sprawdź treść przed wysłaniem — szablon nie zastępuje oceny prawnika.</p>`,
    {wide:true,ok:canSave?'💾 Zapisz w dokumentach sprawy (DOCX)':'',cancel:'Zamknij',onOk:canSave?async v=>{await uploadDoc(c.id,new File([docx(fill(t.tresc,v))],fname(t,c),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}))}:undefined});
  const vals=()=>Object.fromEntries(new FormData($('#mform')).entries()),upd=()=>{$('#pmPrev').innerHTML=toHtml(fill(t.tresc,vals()))};
  $('#mform').addEventListener('input',upd);upd();
  $('#pmDocx').onclick=()=>{dl(docx(fill(t.tresc,vals())),fname(t,c));if(c)sb.rpc('log_event',{p_action:'pismo.wygenerowanie',p_target:c.number,p_details:t.nazwa}).then(()=>{},()=>{})};
  $('#pmPrint').onclick=()=>printHtml(t.nazwa,fill(t.tresc,vals()));
};
/* --- karta sprawy → Dokumenty: lista szablonów --- */
const origDocs=CTAB.dokumenty;
CTAB.dokumenty=c=>{
  if(!S.loaded)loadSettings().then(()=>{if(location.hash.includes(c.id)&&location.hash.endsWith('/dokumenty'))rerender()});
  const L=szablony(),mine=L.filter(t=>t.kategorie?.includes(c.category)),rest=L.filter(t=>!t.kategorie?.includes(c.category));
  const b=t=>`<button class="btn sm${t.kategorie?.includes(c.category)?' pri':''}" type="button" onclick="pismoModal('${esc(t.id)}','${c.id}')">${esc(t.nazwa)}</button>`;
  return origDocs(c)+`<div class="card" style="margin-top:14px"><h3>📝 Pismo z szablonu</h3><div style="display:flex;gap:8px;flex-wrap:wrap">${[...mine,...rest].map(b).join('')}</div>
    <p class="hint">Pola klienta, sprawy i kancelarii wypełniają się same. Wynik: DOCX, wydruk / PDF albo zapis w dokumentach sprawy (nowy plik z historią wersji).${isAdmin()?' Szablony i dane kancelarii: <a href="#/ustawienia/pisma">Ustawienia → Pisma</a>.':''}</p></div>`;
};
/* --- Ustawienia → Pisma (Administrator) --- */
let edId=null;
SET_TABS.splice(SET_TABS.findIndex(t=>t[0]==='system'),0,['pisma','Pisma i szablony',()=>isAdmin()]);
SET_GROUPS.find(g=>g.k.includes('kategorie'))?.k.push('pisma');
Object.assign(TAB_TIPS,{pisma:'Dane kancelarii do pism i szablony pism (DOCX / PDF).'});
SET.pisma=()=>{
  if(!S.loaded){loadSettings().then(()=>location.hash.startsWith('#/ustawienia/pisma')&&rerender());return '<div class="empty">Wczytywanie…</div>'}
  const K=S.kancelaria||{},L=[...szablony(),...S.wlasne.filter(t=>t.ukryty).map(t=>({...DOM.find(d=>d.id===t.id),...t}))],t=L.find(x=>x.id===edId)||L[0];edId=t?.id;
  const cats=[...DB.categories].sort((a,b)=>a.order-b.order),f=(k,l)=>`<label>${l}<input class="f" id="pk_${k}" value="${esc(K[k]||'')}"></label>`;
  return `${S.brak?'<div class="note" style="margin-bottom:14px">⚠️ Brak tabeli ustawień w bazie (migracja 011). Działają szablony wbudowane; zmian nie można zapisać.</div>':''}
  <div class="card"><h3>Dane kancelarii do pism</h3><div class="form">${f('nazwa','Nazwa kancelarii')}${f('adres','Adres')}${f('miejscowosc','Miejscowość (w nagłówku pisma)')}${f('telefon','Telefon')}${f('email','E-mail')}${f('nip','NIP')}${f('tytul','Tytuł zawodowy pełnomocnika (np. adwokat)')}</div>
    <button class="btn pri" style="margin-top:12px" ${S.brak?'disabled':''} onclick="pismaSaveK()">Zapisz dane kancelarii</button></div>
  <div class="card"><h3>Szablony pism <button class="btn sm pri" ${S.brak?'disabled':''} onclick="pismaNew()">+ Nowy szablon</button></h3>
    <div class="split" style="display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;align-items:start"><div style="display:grid;gap:6px">${L.map(x=>`<button class="btn sm${x.id===edId?' pri':''}" style="justify-content:flex-start;text-align:left" onclick="pismaEd('${esc(x.id)}')">${x.ukryty?'🚫 ':''}${esc(x.nazwa)}</button>`).join('')}</div>
    ${t?`<div><div class="form"><label class="full">Nazwa<input class="f" id="ptN" value="${esc(t.nazwa)}"></label></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0"><span class="mut small">Proponuj w kategoriach:</span>${cats.map(k=>`<label class="chk"><input type="checkbox" class="ptK" value="${esc(k.code)}" ${(t.kategorie||[]).includes(k.code)?'checked':''}>${esc(k.name)}</label>`).join('')}</div>
      <textarea class="f" id="ptT" rows="16" style="font-family:ui-monospace,Consolas,monospace;font-size:.84rem">${esc(t.tresc)}</textarea>
      <p class="hint">Pola: ${Object.entries(FIELD).map(([k,l])=>`<code title="${esc(l)}">{{${k}}}</code>`).join(' ')} — można dodać własne, np. <code>{{numer_ksiegi}}</code> (pojawi się w formularzu). Znaczniki: <code># </code> tytuł, <code>&gt;&gt; </code> do prawej, <code>**pogrubienie**</code>.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" ${S.brak?'disabled':''} onclick="pismaSaveT()">Zapisz szablon</button><button class="btn" onclick="pismoModal('${esc(t.id)}')" ${t.ukryty?'disabled':''}>👁 Podgląd</button>
      ${t.wbudowany||DOM.some(d=>d.id===t.id)?`${S.wlasne.some(w=>w.id===t.id)?`<button class="btn" ${S.brak?'disabled':''} onclick="pismaDel('${esc(t.id)}')">↺ Przywróć wbudowany</button>`:''}<button class="btn" ${S.brak?'disabled':''} onclick="pismaHide('${esc(t.id)}',${!t.ukryty})">${t.ukryty?'Włącz':'Wyłącz'}</button>`:`<button class="btn del" ${S.brak?'disabled':''} onclick="pismaDel('${esc(t.id)}')">Usuń</button>`}</div></div>`:''}</div></div>`;
};
const saveP=async(key,val,msg)=>{await act(async()=>{chk(await sb.rpc('office_setting_save',{p_key:key,p_value:val}))},msg);await loadSettings(true);rerender()};
window.pismaEd=id=>{edId=id;rerender()};
window.pismaSaveK=()=>saveP('kancelaria',Object.fromEntries(['nazwa','adres','miejscowosc','telefon','email','nip','tytul'].map(k=>[k,($('#pk_'+k)?.value||'').trim()])),'Zapisano dane kancelarii');
window.pismaSaveT=()=>{const t={id:edId,nazwa:$('#ptN').value.trim()||'Bez nazwy',kategorie:[...document.querySelectorAll('.ptK:checked')].map(x=>x.value),tresc:$('#ptT').value};
  const W=S.wlasne.filter(x=>x.id!==edId),old=S.wlasne.find(x=>x.id===edId);if(old?.ukryty)t.ukryty=true;saveP('pisma',[...W,t],'Zapisano szablon')};
window.pismaNew=()=>{const id='w'+Date.now().toString(36);edId=id;saveP('pisma',[...S.wlasne,{id,nazwa:'Nowe pismo',kategorie:[],tresc:'>> {{miejscowosc}}, {{data}}\n\n# TYTUŁ PISMA\n\nTreść…\n\n>> {{pelnomocnik}}'}],'Dodano szablon')};
window.pismaDel=id=>{if(!confirm(DOM.some(d=>d.id===id)?'Przywrócić wbudowaną treść szablonu?':'Usunąć szablon?'))return;saveP('pisma',S.wlasne.filter(x=>x.id!==id),'Zapisano')};
window.pismaHide=(id,h)=>{const o=S.wlasne.find(x=>x.id===id);saveP('pisma',[...S.wlasne.filter(x=>x.id!==id),{...(o||{id}),ukryty:h||undefined}],h?'Szablon wyłączony':'Szablon włączony')};
window.PISMA={docx,toHtml,fill,keys,szablony,loadSettings,DOM};
})();

/* Zwrot pieniędzy z umowy — ocena umowy kredytu i wyliczenie kwoty do odzyskania.
   Strona (klient) pokazuje WYŁĄCZNIE komunikat „klauzule abuzywne — kwalifikujesz się do zwrotu” i kwoty.
   Podstawy prawne, orzecznictwo i wykryte zapisy trafiają razem ze zgłoszeniem do CRM (leads.calc.analiza).

   Typy umów:
   - skd — kredyt konsumencki (gotówkowy, ratalny, pożyczka, karta): sankcja kredytu darmowego, art. 45 ukk.
           Kwota: kalkulator „skd” (dane odczytane z umowy, klient może je poprawić).
   - chf — kredyt indeksowany / denominowany do waluty obcej: klauzule przeliczeniowe (tabele kursowe banku)
           jako niedozwolone, art. 385¹ KC. Kwota: kalkulator „chf”; rata, liczba rat i saldo z symulacji na kursach NBP (kredyt-walutowy.js),
           gdy w umowie jest kwota, data i okres (marża z umowy albo przyjęta 1,2%).
   - wibor — kredyt złotówkowy ze zmiennym oprocentowaniem: bez automatycznej kwalifikacji (wyrok TSUE C‑471/24).
   Reguły to wzorce językowe — wynik jest wstępny i wymaga oceny prawnika w CRM. */
(function(){
'use strict';
const MIES={stycznia:1,lutego:2,marca:3,kwietnia:4,maja:5,czerwca:6,lipca:7,sierpnia:8,września:9,października:10,listopada:11,grudnia:12};
const ukk='ustawa o kredycie konsumenckim (ukk)';
/* reguły: mode present = zapis znaleziony; missing = brak obowiązkowej informacji (tylko dla pełnych umów) */
const RULES={
  skd:[
    {id:'koszty_kredytowane',nazwa:'Odsetki naliczane od kredytowanych kosztów (prowizja, ubezpieczenie doliczone do kwoty kredytu)',mode:'present',kwal:true,
      rx:[/(prowizj\w*|opłat\w*|ubezpiecz\w*|składk\w*)[^.;]{0,160}?(kredytowan\w*|z kwoty kredytu|ze środków kredytu|z udzielonego kredytu|doliczon\w* do kwoty|wliczon\w* do kwoty|potrącon\w* z kwoty|sfinansowan\w* z kredytu)/giu,/kwot\w* (udzielonego )?kredytu[^.;]{0,100}?(obejmuj\w*|w tym|zawiera)[^.;]{0,80}?(prowizj|opłat|ubezpiecz|składk)/giu],
      podstawa:'art. 30 ust. 1 pkt 7 i art. 45 ust. 1 ukk — RRSO i całkowity koszt kredytu podane z uwzględnieniem odsetek od kosztów pozaodsetkowych',
      orzecznictwo:'wyrok TSUE z 13.02.2025 r., C‑472/23 (ocena informacji o RRSO i kosztach); linia orzecznicza sądów okręgowych w sprawach SKD'},
    {id:'zmiana_oplat',nazwa:'Jednostronna zmiana opłat, prowizji lub oprocentowania bez konkretnych przesłanek',mode:'present',kwal:true,
      rx:[/(bank|kredytodawc\w*|pożyczkodawc\w*)[^.;]{0,80}?(może|jest uprawnion\w*|zastrzega sobie)[^.;]{0,80}?zmian\w*[^.;]{0,80}?(opłat|prowizj|tabel\w* opłat|oprocentowani)/giu],
      podstawa:'art. 30 ust. 1 pkt 10 ukk (warunki zmiany kosztów); art. 385¹ § 1 i art. 385³ pkt 10 KC',
      orzecznictwo:'wyrok TSUE z 21.03.2013 r., C‑92/11 (RWE Vertrieb) — przejrzystość warunków zmiany opłat'},
    {id:'brak_rrso',nazwa:'Brak rzeczywistej rocznej stopy oprocentowania (RRSO)',mode:'missing',kwal:true,
      rx:[/RRSO|rzeczywist\w* roczn\w* stop\w* oprocentowania/iu],podstawa:'art. 30 ust. 1 pkt 7 ukk',orzecznictwo:''},
    {id:'brak_calk',nazwa:'Brak całkowitego kosztu kredytu / całkowitej kwoty do zapłaty',mode:'missing',kwal:true,
      rx:[/całkowit\w* kwot\w* do zapłaty|całkowit\w* koszt\w* kredytu/iu],podstawa:'art. 30 ust. 1 pkt 7 ukk',orzecznictwo:''},
    {id:'brak_odstapienia',nazwa:'Brak informacji o prawie odstąpienia od umowy (14 dni)',mode:'missing',kwal:true,
      rx:[/odstąpi\w*/iu],podstawa:'art. 30 ust. 1 pkt 15 i art. 53 ukk',orzecznictwo:''},
    {id:'brak_wczesniejszej',nazwa:'Brak zasad obniżenia kosztów przy wcześniejszej spłacie',mode:'missing',kwal:true,
      rx:[/wcześniejsz\w* spłat|przedterminow\w* spłat|spłat\w* przed terminem/iu],podstawa:'art. 30 ust. 1 pkt 16 i art. 49 ukk',orzecznictwo:'wyrok TSUE z 11.09.2019 r., C‑383/18 (Lexitor)'}
  ],
  chf:[
    {id:'tabela_kursow',nazwa:'Przeliczenia według kursów z tabeli banku (klauzula indeksacyjna / przeliczeniowa)',mode:'present',kwal:true,
      rx:[/tabel\w* kurs\w*/giu,/kurs\w* (kupna|sprzedaży)[^.;]{0,80}?(obowiązując\w* w banku|ustalan\w* przez bank|banku|z dnia)/giu],
      podstawa:'art. 385¹ § 1 KC — kształtowanie kursu jednostronnie przez bank; skutek: nieważność umowy (art. 58 KC) i zwrot świadczeń (art. 405, 410 KC)',
      orzecznictwo:'wyrok TSUE z 3.10.2019 r., C‑260/18 (Dziubak); uchwała pełnego składu Izby Cywilnej SN z 25.04.2024 r., III CZP 25/22; wyrok TSUE z 15.06.2023 r., C‑520/21 (Bank M.)'},
    {id:'spread',nazwa:'Różne kursy przy wypłacie (kupno) i spłacie (sprzedaż) — spread walutowy',mode:'present',kwal:true,
      rx:[/kurs\w* kupna[^]{0,300}?kurs\w* sprzedaży/giu],podstawa:'art. 385¹ § 1 KC',orzecznictwo:'uchwała pełnego składu Izby Cywilnej SN z 25.04.2024 r., III CZP 25/22; wyrok TSUE z 3.10.2019 r., C‑260/18 (Dziubak)'},
    {id:'ryzyko',nazwa:'Pouczenie o ryzyku kursowym — do oceny, czy było rzetelne',mode:'present',kwal:false,
      rx:[/ryzyk\w* (kursow\w*|walutow\w*|zmiany kursu)/giu],podstawa:'art. 385¹ § 1 KC (przejrzystość)',orzecznictwo:'wyrok TSUE z 20.09.2017 r., C‑186/16 (Andriciuc); wyrok TSUE z 10.06.2021 r., C‑776/19 (BNP Paribas)'}
  ]
};

/* ---------- odczyt danych z umowy ---------- */
const AMT=/(\d{1,3}(?:[ . ]\d{3})+|\d+)(?:,(\d{1,2}))?\s*(zł|PLN|złotych|CHF|EUR|USD)/giu;
const num=(a,b)=>parseFloat(String(a).replace(/[ . ]/g,'')+(b?'.'+b:''));
function amountAfter(t,labels,win=180,cur=/zł|PLN|złotych/i){
  for(const l of labels){const re=new RegExp(l,'giu');let m;while((m=re.exec(t))){const seg=t.slice(m.index+m[0].length,m.index+m[0].length+win);AMT.lastIndex=0;let a;
    while((a=AMT.exec(seg))){if(cur.test(a[3])){const v=num(a[1],a[2]);if(v>=100)return{v,txt:a[0],at:m.index}}}}}
  return null;
}
const pctAfter=(t,labels,win=120)=>{for(const l of labels){const re=new RegExp(l,'giu');let m;while((m=re.exec(t))){const seg=t.slice(m.index,m.index+m[0].length+win);
  const p=seg.match(/(\d{1,2}(?:[,.]\d{1,4})?)\s?%/);if(p&&!/RRSO|rzeczywist/i.test(seg.slice(0,seg.indexOf(p[0]))))return parseFloat(p[1].replace(',','.'))}}return null};
function contractDate(t){
  const today=new Date(),ok=(y,m,d)=>{const x=new Date(y,m-1,d);return y>=1995&&x<=today&&m>=1&&m<=12&&d>=1&&d<=31?x:null};
  const near=t.match(/(zawart\w*|sporządzon\w*|podpisan\w*)[^.]{0,40}?(?:w dniu|dnia|dn\.)\s*(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{4})/iu);
  if(near){const x=ok(+near[4],+near[3],+near[2]);if(x)return x}
  const near2=t.match(/(zawart\w*|sporządzon\w*)[^.]{0,40}?(?:w dniu|dnia)\s*(\d{1,2})\s+(\p{L}+)\s+(\d{4})/iu);
  if(near2&&MIES[near2[3].toLowerCase()]){const x=ok(+near2[4],MIES[near2[3].toLowerCase()],+near2[2]);if(x)return x}
  const any=[...t.matchAll(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/]((?:19|20)\d{2})\b/g)].map(m=>ok(+m[3],+m[2],+m[1])).filter(Boolean);
  return any.length?any.sort((a,b)=>a-b)[0]:null;
}
const monthsSince=d=>d?Math.max(0,(new Date().getFullYear()-d.getFullYear())*12+new Date().getMonth()-d.getMonth()):null;
function rates(t){
  let m=t.match(/(\d{1,3})\s*(?:równych\s*)?(?:(?:miesięczn|ratal)\p{L}*\s*)?rat(?:a|y|ach|ami|\b)/iu);if(m&&+m[1]>=3&&+m[1]<=480)return +m[1];
  m=t.match(/okres\w*[^.]{0,60}?(\d{1,3})\s*(?:miesi|m-c)/iu);if(m&&+m[1]>=3)return +m[1];
  m=t.match(/okres\w*[^.]{0,60}?(\d{1,2})\s*lat/iu);if(m)return +m[1]*12;
  return null;
}

/* ---------- typ umowy ---------- */
function kind(t){
  const c=r=>(t.match(r)||[]).length;
  const fx=c(/\bCHF\b|frank\w* szwajcar\w*|indeksowan\w*|denominowan\w*|walut\w* obc\w*|\bEUR\b[^.]{0,40}indeks/giu);
  const cons=c(/kredyt\w* konsumenck\w*|umow\w* pożyczki|pożyczk\w* gotówkow\w*|kredyt\w* gotówkow\w*|kredyt\w* ratal\w*|kart\w* kredytow\w*|RRSO|rzeczywist\w* roczn\w* stop\w*/giu);
  const mort=c(/hipote\w*|kredyt\w* mieszkaniow\w*|nieruchomoś\w*|księg\w* wieczyst\w*/giu);
  const wib=c(/WIBOR|WIRON|POLSTR/gu);
  if(fx>=2&&/indeksowan|denominowan|\bCHF\b|frank/iu.test(t))return 'chf';
  if(cons>=1&&mort===0)return 'skd';
  if(wib>=1)return 'wibor';
  if(cons>=1)return 'skd';
  return null;
}

/* ---------- ocena ---------- */
function snippet(t,i,len){const s=Math.max(0,i-60);return (s?'…':'')+t.slice(s,i+len+90).replace(/\s+/g,' ').trim()+'…'}
function runRules(t,list,full){
  const out=[];
  for(const r of list){
    if(r.mode==='missing'){if(!full)continue;if(!r.rx.some(x=>{x.lastIndex=0;return x.test(t)}))out.push({...r,fragment:''});continue}
    let hit=null;for(const x of r.rx){x.lastIndex=0;const m=x.exec(t);if(m){hit=m;break}}
    if(hit)out.push({...r,fragment:snippet(t,hit.index,hit[0].length)});
  }
  return out;
}
/* D — treść strony (kalkulatory), compute — funkcja liczenia kalkulatora ze strony */
function evaluate(text,D,compute){
  const t=String(text||'').replace(/\r/g,'').replace(/[ \t ]+/g,' ');
  const typ=kind(t);if(!typ)return null;
  const full=t.length>2500; // reguły „brak informacji” tylko dla pełnych umów
  const kl=RULES[typ]?runRules(t,RULES[typ],full):[];
  const kwal=kl.some(k=>k.kwal);
  const calcId={skd:'skd',chf:'chf',wibor:'wibor'}[typ],calc=(D?.calculators||[]).find(c=>c.id===calcId);
  const d=contractDate(t),n=rates(t),since=monthsSince(d),vals={},src={};let extraSim=null;
  const set=(k,v,how)=>{if(v!=null&&Number.isFinite(v)){vals[k]=Math.round(v*100)/100;src[k]=how}};
  if(typ==='skd'){
    const kw=amountAfter(t,['całkowit\\w* kwot\\w* kredytu','kwot\\w* (kredytu |pożyczki )?do wypłaty','kwot\\w* wypłat\\w*','kwot\\w* pożyczki','kwot\\w* kredytu']);
    set('kwota',kw?.v,kw?.txt);
    const ckk=amountAfter(t,['całkowit\\w* koszt\\w* kredytu','całkowit\\w* koszt\\w* pożyczki']),ods=amountAfter(t,['odsetki( umowne)? (w kwocie|wynoszą|w wysokości)','łączn\\w* kwot\\w* odsetek','odsetk\\w* (kapitałow\\w* )?w kwocie']);
    if(ckk&&ods&&ckk.v>ods.v)set('koszty',ckk.v-ods.v,`całkowity koszt ${ckk.txt} − odsetki ${ods.txt}`);
    else{let s=0,parts=[];for(const l of ['prowizj\\w*','opłat\\w* przygotowawcz\\w*','opłat\\w* (administracyjn\\w*|za udzielenie)','(składk\\w*|opłat\\w*) (ubezpieczeni\\w*|za ubezpieczenie)','ubezpieczeni\\w*']){const a=amountAfter(t,[l],90);if(a&&!parts.some(p=>p.v===a.v)){s+=a.v;parts.push(a)}}
      if(parts.length)set('koszty',s,parts.map(p=>p.txt).join(' + '))}
    set('opr',pctAfter(t,['oprocentowani\\w*( nominaln\\w*| stał\\w*| zmienn\\w*)?','stop\\w* oprocentowania']),'oprocentowanie z umowy');
    set('n',n,'liczba rat z umowy');
    if(n!=null&&since!=null)set('k',Math.min(n,since),'miesiące od zawarcia umowy');
  }else if(typ==='chf'){
    const kw=amountAfter(t,['kwot\\w* (kredytu )?(do )?wypłat\\w*','wypłat\\w* kredytu','kwot\\w* kredytu','kwot\\w* udzielonego kredytu'],220);
    set('kwota',kw?.v,kw?.txt);
    if(n!=null&&since!=null)set('k',Math.min(n,since),'miesiące od zawarcia umowy');
    /* rata i saldo z historycznych kursów NBP (kredyt-walutowy.js), gdy znamy kwotę, datę i okres */
    const FX=window.KREDYTFX;
    if(FX?.ready&&vals.kwota&&d&&n){
      const mz=pctAfter(t,['marż\\w*( banku)?']),wal=(t.match(/\bEUR\b|\beuro\b/giu)||[]).length>(t.match(/\bCHF\b|frank\w* szwajcar/giu)||[]).length?'EUR':'CHF';
      const marza=mz!=null&&mz<8?mz:1.2,sim=FX.symuluj({kwota:vals.kwota,data:d.toISOString().slice(0,7),okres:n,marza,waluta:wal});
      if(!sim.err){const how=`symulacja: ${sim.zrodlo}${mz==null?' (marża przyjęta — brak w umowie)':''}`;
        set('rata',sim.rataSrednia,how);set('saldo',sim.saldo,how);set('k',sim.k,how);extraSim={waluta:sim.waluta,marza,raty:sim.k,wplaty:Math.round(sim.wplaty),saldo:Math.round(sim.saldo),saldo_waluta:sim.saldoFx,zrodlo:sim.zrodlo}}
    }
  }
  const missing=calc?calc.inputs.filter(i=>!(i.key in vals)).map(i=>i.key):[];
  let out=null;
  if(calc&&!missing.length&&compute){const all={};calc.inputs.forEach(i=>all[i.key]=vals[i.key]);out=compute(calc,all)}
  const main=out?(out.find(o=>o.main)||out[0]):null;
  return{typ,symulacja:extraSim,kwalifikuje:kwal&&typ!=='wibor',klauzule:kl,calc,calcId,vals,src,missing,out,main,data:d?d.toISOString().slice(0,10):null,liczbaRat:n};
}
/* dane dla CRM (mieszczą się w limicie leads.calc) */
function forCrm(r,extra={}){
  if(!r)return null;
  const cut=(s,n)=>String(s||'').slice(0,n);
  return{zrodlo:'analiza umowy',typ:r.typ,kwalifikuje:r.kwalifikuje,data_umowy:r.data,
    klauzule:r.klauzule.slice(0,10).map(k=>({nazwa:cut(k.nazwa,160),podstawa:cut(k.podstawa,260),orzecznictwo:cut(k.orzecznictwo,260),fragment:cut(k.fragment,300),brak:k.mode==='missing',kwal:!!k.kwal})),
    odczytane:Object.fromEntries(Object.entries(r.src).map(([k,v])=>[k,cut(v,160)])),...(r.symulacja?{symulacja:r.symulacja}:{}),...extra};
}
window.ZWROT={evaluate,forCrm,RULES,kind};
})();

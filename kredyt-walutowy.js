/* =====================================================================
   Kredyt walutowy (CHF / EUR) — symulacja z historycznych kursów NBP.
   Z danych umowy (kwota w zł, data wypłaty, okres, marża) liczy przybliżone raty w zł,
   sumę wpłat i saldo — klient nie musi znać raty ani salda.
   Kursy: prawo/kursy.json (codzienna synchronizacja z api.nbp.pl): średnie miesięczne
   [średni z tabeli A, kupno, sprzedaż z tabeli C]. Wypłata po kursie kupna, raty po kursie sprzedaży
   (banki stosowały własne tabele z większym spreadem — wynik jest szacunkiem).
   Stopa: LIBOR 3M (od 2022 r. SARON / EURIBOR 3M) — wartości przybliżone, kwartalne, + marża z umowy.
   Używają: strona (kalkulator CHF, zwrot z umowy), CRM (Prawo → Kredyt walutowy).
   ===================================================================== */
(()=>{
/* stopy referencyjne 3M w %, [I, II, III, IV kwartał] — przybliżenia do symulacji, nie dane źródłowe */
const STOPY={
  CHF:{2002:[1.85,1.35,1.2,0.75],2003:[0.6,0.3,0.25,0.25],2004:[0.25,0.3,0.6,0.7],2005:[0.75,0.75,0.75,0.95],2006:[1.05,1.3,1.5,1.85],
       2007:[2.1,2.35,2.75,2.75],2008:[2.75,2.8,2.85,1.6],2009:[0.45,0.4,0.3,0.25],2010:[0.25,0.15,0.17,0.17],2011:[0.17,0.18,0.03,0.05],
       2012:[0.05,0.08,0.02,0.01],2013:[0.02,0.02,0.02,0.02],2014:[0.02,0.01,0.0,-0.06],2015:[-0.75,-0.8,-0.75,-0.75],2016:[-0.75,-0.75,-0.75,-0.75],
       2017:[-0.73,-0.73,-0.73,-0.74],2018:[-0.74,-0.73,-0.73,-0.72],2019:[-0.71,-0.71,-0.75,-0.7],2020:[-0.68,-0.6,-0.7,-0.75],2021:[-0.75,-0.76,-0.76,-0.77],
       2022:[-0.7,-0.65,0.0,0.6],2023:[1.0,1.45,1.7,1.7],2024:[1.7,1.45,1.2,0.95],2025:[0.45,0.2,0.0,0.0],2026:[0.0,0.0,0.0,0.0]},
  EUR:{2002:[3.35,3.4,3.35,3.1],2003:[2.8,2.5,2.15,2.15],2004:[2.1,2.05,2.1,2.15],2005:[2.15,2.15,2.15,2.35],2006:[2.6,2.9,3.2,3.5],
       2007:[3.75,4.0,4.5,4.7],2008:[4.6,4.85,4.95,4.3],2009:[1.6,1.3,0.9,0.7],2010:[0.66,0.7,0.88,1.0],2011:[1.05,1.4,1.55,1.5],
       2012:[1.1,0.7,0.35,0.2],2013:[0.2,0.2,0.22,0.24],2014:[0.29,0.3,0.15,0.08],2015:[0.05,0.0,-0.03,-0.1],2016:[-0.2,-0.26,-0.3,-0.31],
       2017:[-0.33,-0.33,-0.33,-0.33],2018:[-0.33,-0.32,-0.32,-0.32],2019:[-0.31,-0.32,-0.4,-0.4],2020:[-0.4,-0.3,-0.48,-0.52],2021:[-0.54,-0.54,-0.55,-0.57],
       2022:[-0.55,-0.4,0.5,1.6],2023:[2.6,3.3,3.8,3.95],2024:[3.9,3.8,3.5,3.0],2025:[2.6,2.2,2.0,2.0],2026:[2.0,2.0,2.0,2.0]}};
const K={data:null,ready:false,p:null};
function load(base){
  if(K.p)return K.p;
  K.p=fetch((base||'')+'prawo/kursy.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j?.waluty?.CHF&&Object.keys(j.waluty.CHF).length){K.data=j;K.ready=true}return K.ready}).catch(()=>false);
  return K.p;
}
const ym=(y,m)=>y+'-'+String(m).padStart(2,'0');
const addM=(s,n)=>{let[y,m]=s.split('-').map(Number);m+=n;y+=Math.floor((m-1)/12);m=((m-1)%12+12)%12+1;return ym(y,m)};
const nowYM=()=>{const d=new Date();return ym(d.getFullYear(),d.getMonth()+1)};
function months(w){return K.data?.waluty?.[w]?Object.keys(K.data.waluty[w]).sort():[]}
/* kurs dla miesiąca: [średni, kupno, sprzedaż]; brak — najbliższy wcześniejszy (albo pierwszy); brak tabeli C — średni ± 2% */
function kurs(w,m){
  const T=K.data?.waluty?.[w];if(!T)return null;const ms=months(w);if(!ms.length)return null;
  let k=T[m]?m:null;if(!k){const prev=ms.filter(x=>x<=m);k=prev.length?prev[prev.length-1]:ms[0]}
  let[mid,bid,ask]=T[k];mid=mid??(bid&&ask?(bid+ask)/2:null);if(!mid)return null;
  return{m:k,mid,kupno:bid||mid*0.98,sprzedaz:ask||mid*1.02};
}
function stopa(w,m){
  const S=STOPY[w]||STOPY.CHF,ys=Object.keys(S).map(Number);let[y,mo]=m.split('-').map(Number);
  if(y<ys[0])return S[ys[0]][0];if(y>ys[ys.length-1])return S[ys[ys.length-1]][3];
  return S[y][Math.floor((mo-1)/3)];
}
/* p: {kwota (zł wypłacone), data ('RRRR-MM' lub 'RRRR-MM-DD'), okres (miesiące), marza (%), waluta ('CHF'|'EUR'), do ('RRRR-MM', domyślnie bieżący miesiąc)} */
function symuluj(p){
  if(!K.ready)return{err:'Kursy NBP nie są jeszcze dostępne'};
  const w=STOPY[p.waluta]?p.waluta:'CHF',kw=+p.kwota,n=Math.round(+p.okres),marza=+p.marza;
  const start=String(p.data||'').slice(0,7);
  if(!(kw>0)||!/^\d{4}-\d{2}$/.test(start)||!(n>=12&&n<=600)||!Number.isFinite(marza))return{err:'Uzupełnij kwotę, datę wypłaty, okres i marżę'};
  const first=months(w)[0];if(start<first)return{err:`Kursy NBP są dostępne od ${first}`};
  const koniec=p.do||nowYM(),k0=kurs(w,start);
  let K0=kw/k0.kupno,wpl=0,wplFx=0,odsFx=0,k=0,m=start,lata={},ostatnia=null;
  for(let i=0;i<n;i++){
    m=addM(start,i+1);if(m>koniec)break;
    const ref=stopa(w,m),r=Math.max(0,ref+marza)/1200,left=n-i;
    const rataFx=r>0?K0*r/(1-Math.pow(1+r,-left)):K0/left,odsetki=K0*r,kap=rataFx-odsetki;
    const kr=kurs(w,m),pln=rataFx*kr.sprzedaz;
    K0=Math.max(0,K0-kap);wpl+=pln;wplFx+=rataFx;odsFx+=odsetki;k++;
    const y=m.slice(0,4),L=lata[y]||(lata[y]={rok:y,raty:0,wplaty:0,kurs:0,stopa:0});L.raty++;L.wplaty+=pln;L.kurs+=kr.sprzedaz;L.stopa+=ref+marza;
    ostatnia={m,pln,fx:rataFx,kurs:kr.sprzedaz,stopa:ref+marza};
  }
  const kn=kurs(w,koniec>nowYM()?nowYM():koniec),r2=x=>Math.round(x*100)/100;
  return{waluta:w,k,n,kapitalFx:r2(kw/k0.kupno),kursWyplaty:Math.round(k0.kupno*1e4)/1e4,miesiacWyplaty:k0.m,
    wplaty:r2(wpl),rataSrednia:k?r2(wpl/k):0,rataTeraz:ostatnia?r2(ostatnia.pln):0,saldoFx:r2(K0),saldo:r2(K0*kn.sprzedaz),kursTeraz:kn.sprzedaz,kursMiesiac:kn.m,
    odsetkiFx:r2(odsFx),bezIndeksacji:r2(wpl-wplFx*k0.kupno),
    lata:Object.values(lata).map(L=>({rok:L.rok,raty:L.raty,wplaty:r2(L.wplaty),kurs:Math.round(L.kurs/L.raty*1e4)/1e4,stopa:r2(L.stopa/L.raty)})),
    zrodlo:`kursy NBP (tabela C) do ${months(w).slice(-1)[0]}, stopa ${w==='CHF'?'LIBOR CHF 3M / SARON':'EURIBOR 3M'} (przybliżona) + marża ${String(marza).replace('.',',')}%`};
}
window.KREDYTFX={load,symuluj,kurs,stopa,months,get ready(){return K.ready},get pobrano(){return K.data?.pobrano||null},STOPY,_set(d){K.data=d;K.ready=!!d;K.p=Promise.resolve(K.ready)}};
})();

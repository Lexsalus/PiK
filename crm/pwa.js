/* CRM — aplikacja (PWA): rejestracja service workera i przycisk „Zainstaluj aplikację” */
/* --- aplikacja (PWA): przycisk „Zainstaluj aplikację” na ekranie logowania i w górnym pasku --- */
if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('crm-sw.js').catch(e=>console.warn('sw',e)));
let pwaPrompt=null,pwaJustInstalled=false;
const PWA_MODES=['standalone','minimal-ui','fullscreen','window-controls-overlay'];
const pwaInstalled=()=>pwaJustInstalled||PWA_MODES.some(m=>matchMedia(`(display-mode: ${m})`).matches)||navigator.standalone===true;
const pwaIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const pwaShow=()=>$$('.pwabtn').forEach(b=>b.hidden=pwaInstalled());
addEventListener('beforeinstallprompt',e=>{e.preventDefault();pwaPrompt=e;pwaShow()});
PWA_MODES.forEach(m=>matchMedia(`(display-mode: ${m})`).addEventListener?.('change',pwaShow));
addEventListener('appinstalled',()=>{pwaPrompt=null;pwaJustInstalled=true;pwaShow();toast('Aplikacja zainstalowana')});
document.addEventListener('click',async e=>{if(!e.target.closest?.('.pwabtn'))return;
  if(pwaPrompt){const p=pwaPrompt;pwaPrompt=null;p.prompt();try{await p.userChoice}catch(x){}pwaShow();return}
  modal('Zainstaluj aplikację',`<div class="note" style="line-height:1.6">${pwaIOS()
    ?`<p>Na iPhonie / iPadzie (Safari):</p><p>1. Stuknij <b>Udostępnij</b> (kwadrat ze strzałką w górę).</p><p>2. Wybierz <b>Do ekranu początkowego</b>.</p><p>3. Stuknij <b>Dodaj</b>.</p>`
    :`<p>Przeglądarka nie pokazała okna instalacji. Spróbuj tak:</p><p>Android (Chrome): menu <b>⋮</b> → <b>Zainstaluj aplikację</b> albo <b>Dodaj do ekranu głównego</b>.</p><p>Komputer (Chrome / Edge): ikona instalacji na końcu paska adresu albo menu → <b>Zainstaluj</b>.</p>`}</div>`,{ok:'',cancel:'Zamknij'});
});
addEventListener('DOMContentLoaded',pwaShow);addEventListener('load',()=>{pwaShow();setTimeout(pwaShow,1000)});

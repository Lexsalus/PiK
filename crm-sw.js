/* Aplikacja CRM (PWA): pliki CRM zawsze z sieci, a gdy sieci brak — ostatnia zapisana wersja.
   Obsługuje tylko pliki CRM; strona publiczna, baza (Supabase) i inne serwery idą prosto do sieci. */
const CACHE='crm-v4';
const SHELL=['crm.html','crm/crm.css','crm/rdzen.js','crm/pwa.js','crm/tresci-strony.js','wspolne/prawo.js','wspolne/kredyt-walutowy.js','crm/prawo.js','crm/pisma.js','crm/granty.js','crm/logi.js','crm/podglad.js','crm/pomoc.js','version.json','crm.webmanifest','icons/crm-192.png','icons/crm-512.png'];
const OWN=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('crm-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||!OWN.has(u.pathname))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(CACHE).then(c=>c.put(e.request,k))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true})));
});

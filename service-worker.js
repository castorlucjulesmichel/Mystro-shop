const CACHE_NAME="mystro-shop-v12";
const CORE=["./","./index.html","./style.css?v=12","./script.js?v=12","./checkout.html?v=12","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{const req=event.request;if(req.method!=="GET")return;event.respondWith(fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{})}return res}).catch(()=>caches.match(req).then(hit=>hit||((req.mode==="navigate")?caches.match("./index.html"):undefined))))});

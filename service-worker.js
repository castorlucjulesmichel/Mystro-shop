const CACHE_NAME="mystro-shop-v39";
const CORE_FILES=[
  "./","./index.html","./style.css","./mobile-fix.css","./ui-fix.js",
  "./script.js","./registration-fix.js","./profile-save-fix.js","./account-control.js",
  "./manual-wallet.js","./private-chat.js","./live-fixes.js",
  "./manifest.json","./icon-192.png","./icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(CORE_FILES.map(async url=>{
      try{
        const response=await fetch(url,{cache:"reload"});
        if(response.ok)await cache.put(url,response.clone());
      }catch{}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    if(request.mode==="navigate")return(await cache.match("./index.html"))||Response.error();
    return Response.error();
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request,{ignoreSearch:true});
  if(cached){
    fetch(request).then(r=>{if(r.ok)cache.put(request,r.clone())}).catch(()=>{});
    return cached;
  }
  const response=await fetch(request);
  if(response.ok)await cache.put(request,response.clone());
  return response;
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==="navigate"){
    event.respondWith(networkFirst(request));
    return;
  }
  const destination=request.destination;
  if(destination==="script"||destination==="style"||destination==="worker"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(destination==="image"||destination==="font"){
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});

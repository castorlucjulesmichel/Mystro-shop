import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,onSnapshot,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const HEARTBEAT_MS=20000;
const TOUCH_THROTTLE_MS=12000;
let stopWatch=null,heartbeat=null,currentRef=null,lastTouch=0,touching=false;

function clear(){
  stopWatch?.();stopWatch=null;
  if(heartbeat)clearInterval(heartbeat);
  heartbeat=null;currentRef=null;lastTouch=0;touching=false;
}

async function touch(online=true,force=false){
  if(!currentRef||touching)return;
  if(online&&!force&&document.visibilityState!=="visible")return;
  const now=Date.now();
  if(!force&&online&&now-lastTouch<TOUCH_THROTTLE_MS)return;
  touching=true;
  try{
    await updateDoc(currentRef,{
      lastSeen:serverTimestamp(),
      lastActiveAt:serverTimestamp(),
      presenceUpdatedAt:serverTimestamp(),
      isOnline:online
    });
    lastTouch=now;
  }catch(e){console.warn("presence",e)}
  finally{touching=false}
}

function start(){
  if(!getApps().length)return;
  const app=getApp(),auth=getAuth(app),db=getFirestore(app);

  onAuthStateChanged(auth,user=>{
    clear();
    if(!user)return;
    currentRef=doc(db,"users",user.uid);

    stopWatch=onSnapshot(currentRef,async snap=>{
      if(!snap.exists())return;
      const status=String(snap.data().accountStatus||"active").toLowerCase();
      if(status==="blocked"||status==="deleted"){
        const text=status==="blocked"?"Kont sa a bloke. Kontakte administrasyon Mystro-Shop.":"Kont sa a pa aktif ankò.";
        await touch(false,true);
        clear();
        await signOut(auth);
        alert(text);
        if(!location.pathname.endsWith("index.html"))location.href="./index.html";
      }
    },e=>console.warn("account watch",e));

    if(document.visibilityState==="visible")touch(true,true);
    heartbeat=setInterval(()=>{
      if(document.visibilityState==="visible")touch(true);
    },HEARTBEAT_MS);
  });

  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")touch(true,true);
    else touch(false,true);
  });
  window.addEventListener("focus",()=>touch(true,true));
  window.addEventListener("online",()=>touch(true,true));
  window.addEventListener("pagehide",()=>touch(false,true));
  window.addEventListener("beforeunload",()=>touch(false,true));
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

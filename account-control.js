import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,onSnapshot,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let stopWatch=null,heartbeat=null,currentRef=null,lastTouch=0,touching=false;
function clear(){
  stopWatch?.();stopWatch=null;
  if(heartbeat)clearInterval(heartbeat);
  heartbeat=null;currentRef=null;lastTouch=0;touching=false;
}
async function touch(online=true,force=false){
  if(!currentRef||touching)return;
  const now=Date.now();
  if(!force&&online&&now-lastTouch<30000)return;
  touching=true;
  try{
    await updateDoc(currentRef,{lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:online});
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
        clear();
        await signOut(auth);
        alert(text);
        if(!location.pathname.endsWith("index.html"))location.href="./index.html";
      }
    },e=>console.warn("account watch",e));
    touch(true,true);
    heartbeat=setInterval(()=>touch(true),60000);
  });
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")touch(true)});
  window.addEventListener("focus",()=>touch(true));
  window.addEventListener("pagehide",()=>touch(false,true));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

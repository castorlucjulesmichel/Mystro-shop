import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,onSnapshot,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let stopWatch=null,heartbeat=null,currentRef=null,currentUser=null,lastTouch=0,touching=false;
const HEARTBEAT_MS=12000;
const MIN_WRITE_MS=7000;

function clearPresence(){
  stopWatch?.(); stopWatch=null;
  if(heartbeat)clearInterval(heartbeat);
  heartbeat=null; currentRef=null; currentUser=null; lastTouch=0; touching=false;
}

async function touch(isOnline=true,force=false){
  if(!currentRef||!currentUser||touching)return;
  const now=Date.now();
  if(!force&&isOnline&&now-lastTouch<MIN_WRITE_MS)return;
  touching=true;
  try{
    await updateDoc(currentRef,{
      isOnline,
      lastSeen:serverTimestamp(),
      lastActiveAt:serverTimestamp(),
      presenceVersion:6
    });
    lastTouch=now;
  }catch(e){
    if(navigator.onLine)console.warn("presence",e);
  }finally{touching=false}
}

async function disconnectBlocked(status){
  const messages={
    blocked:"Kont sa a bloke. Kontakte administrasyon Mystro-Shop.",
    rejected:"Kont sa a rejte pa administrasyon an.",
    deleted:"Kont sa a pa aktif ankò."
  };
  try{await touch(false,true)}catch{}
  clearPresence();
  try{await signOut(getAuth(getApp()))}catch{}
  alert(messages[status]||"Kont sa a pa aktif.");
  if(!location.pathname.endsWith("index.html")&&!location.pathname.endsWith("/"))location.href="./index.html";
}

function start(){
  if(!getApps().length)return;
  const app=getApp(),auth=getAuth(app),db=getFirestore(app);

  onAuthStateChanged(auth,user=>{
    clearPresence();
    if(!user)return;
    currentUser=user;
    currentRef=doc(db,"users",user.uid);

    stopWatch=onSnapshot(currentRef,snap=>{
      if(!snap.exists())return;
      const status=String(snap.data().accountStatus||"active").toLowerCase();
      if(["blocked","rejected","deleted"].includes(status))disconnectBlocked(status);
    },e=>console.warn("account watch",e));

    touch(document.visibilityState==="visible",true);
    heartbeat=setInterval(()=>{
      if(document.visibilityState==="visible")touch(true,true);
    },HEARTBEAT_MS);
  });

  const active=()=>{if(document.visibilityState==="visible")touch(true)};
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")touch(true,true);
    else touch(false,true);
  });
  window.addEventListener("focus",()=>touch(true,true));
  window.addEventListener("blur",()=>{if(document.visibilityState!=="visible")touch(false,true)});
  window.addEventListener("pagehide",()=>touch(false,true));
  window.addEventListener("online",()=>{if(document.visibilityState==="visible")touch(true,true)});
  ["pointerdown","touchstart","keydown","input"].forEach(ev=>document.addEventListener(ev,active,{passive:true}));
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

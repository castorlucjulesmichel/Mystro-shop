import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,onSnapshot,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let stopWatch=null,heartbeat=null,currentRef=null;
function clear(){stopWatch?.();stopWatch=null;if(heartbeat)clearInterval(heartbeat);heartbeat=null;currentRef=null}
async function touch(online=true){if(!currentRef)return;try{await updateDoc(currentRef,{lastSeen:serverTimestamp(),isOnline:online})}catch{}}
function start(){if(!getApps().length)return;const app=getApp(),auth=getAuth(app),db=getFirestore(app);onAuthStateChanged(auth,user=>{clear();if(!user)return;currentRef=doc(db,"users",user.uid);stopWatch=onSnapshot(currentRef,async snap=>{if(!snap.exists())return;const status=String(snap.data().accountStatus||"active").toLowerCase();if(status==="blocked"||status==="deleted"){clear();await signOut(auth);alert(status==="blocked"?"Kont sa a bloke. Kontakte administrasyon Mystro-Shop.":"Kont sa a pa aktif ankò.");if(!location.pathname.endsWith("index.html"))location.href="./index.html";return}touch(true)});touch(true);heartbeat=setInterval(()=>touch(true),60000)});document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")touch(true)});window.addEventListener("pagehide",()=>touch(false))}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const FIREBASE_CONFIG={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const $=id=>document.getElementById(id);
const app=()=>getApps().length?getApp():initializeApp(FIREBASE_CONFIG);
const TEXT={
  ht:{saving:"Ap anrejistre...",saved:"✅ Pwofil la anrejistre.",login:"Ou dwe konekte anvan.",missing:"Mete omwen siyati ak prenon.",failed:"Nou pa ka anrejistre pwofil la.",fix:"📍 Fikse lokalizasyon mwen",locating:"Ap chèche GPS presi...",locSaved:"✅ Pozisyon GPS la fikse",locDenied:"Lokalizasyon pa disponib oswa pèmisyon an pa bay.",accuracy:"Presizyon",map:"Louvri sou kat"},
  fr:{saving:"Enregistrement...",saved:"✅ Profil enregistré.",login:"Connectez-vous d’abord.",missing:"Indiquez au moins le nom et le prénom.",failed:"Impossible d’enregistrer le profil.",fix:"📍 Fixer ma localisation",locating:"Recherche du GPS précis...",locSaved:"✅ Position GPS fixée",locDenied:"Localisation indisponible ou permission refusée.",accuracy:"Précision",map:"Ouvrir sur la carte"},
  en:{saving:"Saving...",saved:"✅ Profile saved.",login:"Please sign in first.",missing:"Enter at least first and last name.",failed:"Unable to save the profile.",fix:"📍 Fix my location",locating:"Getting precise GPS...",locSaved:"✅ GPS position fixed",locDenied:"Location unavailable or permission denied.",accuracy:"Accuracy",map:"Open map"},
  es:{saving:"Guardando...",saved:"✅ Perfil guardado.",login:"Inicie sesión primero.",missing:"Ingrese al menos nombre y apellido.",failed:"No se pudo guardar el perfil.",fix:"📍 Fijar mi ubicación",locating:"Buscando GPS preciso...",locSaved:"✅ Posición GPS fijada",locDenied:"Ubicación no disponible o permiso denegado.",accuracy:"Precisión",map:"Abrir mapa"}
};
function lang(){const x=$("languageSelector")?.value||localStorage.getItem("mystroLanguage")||"ht";return TEXT[x]?x:"ht"}
function tr(k){return TEXT[lang()][k]||TEXT.ht[k]||k}
function toast(message,ok=true){
  let box=$("profileSaveToast");
  if(!box){box=document.createElement("div");box.id="profileSaveToast";box.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000005;max-width:min(92vw,520px);padding:13px 16px;border-radius:13px;color:#fff;font-weight:850;text-align:center;box-shadow:0 12px 35px #0003";document.body.appendChild(box)}
  box.style.background=ok?"#067647":"#b42318";box.textContent=message;box.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.hidden=true,5200)
}
function errorText(e){
  const code=String(e?.code||"").replace(/^firestore\//,"");
  if(code==="permission-denied")return `${tr("failed")} (permission-denied)`;
  if(code==="unavailable")return `${tr("failed")} (rezo indisponib)`;
  if(code==="unauthenticated")return tr("login");
  return `${tr("failed")}${code?` (${code})`:e?.message?` (${String(e.message).slice(0,80)})`:""}`;
}
function addLocationUi(){
  const save=$("saveProfileBtn");if(!save||$("fixProfileLocationBtn"))return;
  const wrap=document.createElement("div");wrap.style.cssText="display:grid;gap:8px;margin:12px 0";
  wrap.innerHTML='<button id="fixProfileLocationBtn" class="secondary" type="button"></button><div id="fixedLocationStatus" style="font-size:13px;color:#667085;line-height:1.45"></div>';
  save.parentNode.insertBefore(wrap,save);
  $("fixProfileLocationBtn").addEventListener("click",fixLocation);
  translateLocationUi();
  $("languageSelector")?.addEventListener("change",()=>setTimeout(translateLocationUi,0));
}
function translateLocationUi(){const b=$("fixProfileLocationBtn");if(b)b.textContent=tr("fix")}
function bestPosition(timeoutMs=12000){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(Error("GEO_UNAVAILABLE"));
    let best=null,watchId=null,done=false;
    const finish=()=>{if(done)return;done=true;if(watchId!==null)navigator.geolocation.clearWatch(watchId);best?resolve(best):reject(Error("GEO_TIMEOUT"))};
    const timer=setTimeout(finish,timeoutMs);
    watchId=navigator.geolocation.watchPosition(pos=>{
      if(!best||Number(pos.coords.accuracy||999999)<Number(best.coords.accuracy||999999))best=pos;
      if(Number(pos.coords.accuracy||999999)<=35){clearTimeout(timer);finish()}
    },err=>{clearTimeout(timer);if(watchId!==null)navigator.geolocation.clearWatch(watchId);reject(err)},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
  });
}
async function reverseAddress(lat,lng){
  try{
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const r=await fetch(url,{headers:{"Accept":"application/json"}});if(!r.ok)return"";const j=await r.json();return String(j.display_name||"").trim();
  }catch{return""}
}
async function fixLocation(){
  const b=$("fixProfileLocationBtn"),status=$("fixedLocationStatus"),firebaseApp=app();
  const auth=getAuth(firebaseApp),user=auth.currentUser;if(!user)return toast(tr("login"),false);
  const old=b.textContent;b.disabled=true;b.textContent=tr("locating");if(status)status.textContent=tr("locating");
  try{
    const pos=await bestPosition(),lat=Number(pos.coords.latitude),lng=Number(pos.coords.longitude),accuracy=Math.round(Number(pos.coords.accuracy||0)),fixedAddress=await reverseAddress(lat,lng);
    const db=getFirestore(firebaseApp),ref=doc(db,"users",user.uid);
    await updateDoc(ref,{geo:{lat,lng,accuracy},geoAccuracy:accuracy,fixedAddress,locationSource:"gps",locationUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true});
    const map=`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
    if(status)status.innerHTML=`${tr("locSaved")} · ${tr("accuracy")}: ±${accuracy} m${fixedAddress?`<br>${fixedAddress}`:""}<br><a href="${map}" target="_blank" rel="noopener noreferrer">${tr("map")}</a>`;
    toast(tr("locSaved"),true);
  }catch(e){console.error("profile gps",e);if(status)status.textContent=tr("locDenied");toast(errorText(e),false)}
  finally{b.disabled=false;b.textContent=old||tr("fix")}
}
async function save(){
  const button=$("saveProfileBtn");if(!button||button.disabled)return;
  const firebaseApp=app(),auth=getAuth(firebaseApp),user=auth.currentUser;if(!user)return toast(tr("login"),false);
  const lastName=$("profileLastName")?.value.trim()||"",firstName=$("profileFirstName")?.value.trim()||"";
  if(!lastName||!firstName)return toast(tr("missing"),false);
  const data={
    lastName,firstName,name:`${firstName} ${lastName}`.trim(),
    address:$("profileAddress")?.value.trim()||"",
    addressRoute:$("profileAddress")?.value.trim()||"",
    phone:$("profilePhone")?.value.trim()||"",
    country:$("profileCountry")?.value.trim()||"",
    profileUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true
  };
  const old=button.textContent;button.disabled=true;button.textContent=tr("saving");
  try{
    const db=getFirestore(firebaseApp),ref=doc(db,"users",user.uid),snap=await getDoc(ref);
    if(!snap.exists())throw Error("USER_PROFILE_NOT_FOUND");
    await updateDoc(ref,data);
    if($("profileName"))$("profileName").textContent=data.name;
    const initial=(data.firstName||data.lastName||user.email||"M").trim().charAt(0).toUpperCase();
    if($("profileAvatar"))$("profileAvatar").textContent=initial;if($("profileBtn"))$("profileBtn").textContent=initial;
    toast(tr("saved"),true);
  }catch(e){console.error("profile save",e);toast(errorText(e),false)}
  finally{button.disabled=false;button.textContent=old}
}

document.addEventListener("click",e=>{
  const b=e.target.closest?.("#saveProfileBtn");if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();save();
},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addLocationUi,{once:true});else addLocationUi();

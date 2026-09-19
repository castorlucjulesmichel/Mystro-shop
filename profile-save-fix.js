import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const FIREBASE_CONFIG={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const $=id=>document.getElementById(id);
const app=()=>getApps().length?getApp():initializeApp(FIREBASE_CONFIG);
const TEXT={
 ht:{saving:"Ap anrejistre...",saved:"✅ Pwofil la anrejistre.",login:"Ou dwe konekte anvan.",missing:"Mete omwen siyati ak prenon.",failed:"Nou pa ka anrejistre pwofil la.",fix:"📍 Jwenn pozisyon mwen",locating:"Ap chèche pozisyon ou...",locSaved:"✅ Lokalizasyon an anrejistre.",locDenied:"Lokalizasyon pa disponib oswa pèmisyon an pa bay.",accuracy:"Presizyon",map:"Louvri pwen an sou kat",direct:"Adrès",photo:"📷 Chwazi foto pwofil",photoSaving:"Ap prepare foto a...",photoSaved:"✅ Foto pwofil la anrejistre.",photoBad:"Chwazi yon foto JPEG, PNG oswa WebP ki pa depase 6 MB."},
 fr:{saving:"Enregistrement...",saved:"✅ Profil enregistré.",login:"Connectez-vous d’abord.",missing:"Indiquez au moins le nom et le prénom.",failed:"Impossible d’enregistrer le profil.",fix:"📍 Trouver ma position",locating:"Recherche de votre position...",locSaved:"✅ Localisation enregistrée.",locDenied:"Localisation indisponible ou permission refusée.",accuracy:"Précision",map:"Ouvrir le point sur la carte",direct:"Adresse",photo:"📷 Choisir une photo de profil",photoSaving:"Préparation de la photo...",photoSaved:"✅ Photo de profil enregistrée.",photoBad:"Choisissez une image JPEG, PNG ou WebP de 6 Mo maximum."},
 en:{saving:"Saving...",saved:"✅ Profile saved.",login:"Please sign in first.",missing:"Enter at least first and last name.",failed:"Unable to save the profile.",fix:"📍 Find my location",locating:"Getting your location...",locSaved:"✅ Location saved.",locDenied:"Location unavailable or permission denied.",accuracy:"Accuracy",map:"Open point on map",direct:"Address",photo:"📷 Choose profile photo",photoSaving:"Preparing photo...",photoSaved:"✅ Profile photo saved.",photoBad:"Choose a JPEG, PNG or WebP image up to 6 MB."},
 es:{saving:"Guardando...",saved:"✅ Perfil guardado.",login:"Inicie sesión primero.",missing:"Ingrese al menos nombre y apellido.",failed:"No se pudo guardar el perfil.",fix:"📍 Buscar mi ubicación",locating:"Buscando su ubicación...",locSaved:"✅ Ubicación guardada.",locDenied:"Ubicación no disponible o permiso denegado.",accuracy:"Precisión",map:"Abrir punto en el mapa",direct:"Dirección",photo:"📷 Elegir foto de perfil",photoSaving:"Preparando foto...",photoSaved:"✅ Foto de perfil guardada.",photoBad:"Elija una imagen JPEG, PNG o WebP de hasta 6 MB."}
};
function lang(){const x=$("languageSelector")?.value||localStorage.getItem("mystroLanguage")||"ht";return TEXT[x]?x:"ht"}
function tr(k){return TEXT[lang()][k]||TEXT.ht[k]||k}
function clean(v){return String(v||"").trim()}
function toast(message,ok=true){
 let box=$("profileSaveToast");
 if(!box){box=document.createElement("div");box.id="profileSaveToast";box.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000005;max-width:min(92vw,520px);padding:13px 16px;border-radius:13px;color:#fff;font-weight:850;text-align:center;box-shadow:0 12px 35px #0003";document.body.appendChild(box)}
 box.style.background=ok?"#067647":"#b42318";box.textContent=message;box.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.hidden=true,4500);
}
function errorText(e){const code=String(e?.code||"").replace(/^firestore\//,"");if(code==="permission-denied")return `${tr("failed")} (permission-denied)`;if(code==="unavailable")return `${tr("failed")} (rezo indisponib)`;return e?.message||tr("failed")}
function roleFromPage(){const r=clean($("profileRole")?.textContent).toLowerCase();return /seller|vandè|vendeur|vendedor/.test(r)?"seller":"buyer"}
async function ensureUserDoc(db,user){
 const ref=doc(db,"users",user.uid),snap=await getDoc(ref);
 if(snap.exists())return ref;
 await setDoc(ref,{uid:user.uid,email:user.email||"",role:roleFromPage(),balance:0,balances:{HTG:0,USD:0,EUR:0,CAD:0,GBP:0,DOP:0,XOF:0},accountStatus:"active",createdAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true});
 return ref;
}
function applyPhoto(url){
 const safe=String(url||"");
 for(const id of ["profileAvatar","profileBtn"]){
   const el=$(id); if(!el)continue;
   if(safe){el.style.backgroundImage=`url("${safe.replace(/"/g,"%22")}")`;el.style.backgroundSize="cover";el.style.backgroundPosition="center";el.style.backgroundRepeat="no-repeat";el.style.color="transparent";}
   else{el.style.backgroundImage="";el.style.color="";}
 }
 const preview=$("profilePhotoPreview");if(preview){preview.src=safe||"";preview.hidden=!safe}
}
function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=()=>reject(Error("READ_FAILED"));r.readAsDataURL(file)})}
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error("IMAGE_FAILED"));i.src=src})}
async function compressProfilePhoto(file){
 if(!file||!["image/jpeg","image/jpg","image/png","image/webp"].includes(file.type)||file.size>6*1024*1024)throw Error(tr("photoBad"));
 const src=await readDataUrl(file),img=await loadImage(src),size=320,canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{alpha:false});
 canvas.width=size;canvas.height=size;ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);
 const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
 ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
 const out=canvas.toDataURL("image/jpeg",.72);
 if(out.length>220000)throw Error(tr("photoBad"));
 return out;
}
async function savePhoto(file){
 const auth=getAuth(app()),user=auth.currentUser;if(!user)return toast(tr("login"),false);
 const label=$("profilePhotoLabel"),old=label?.textContent||tr("photo");if(label)label.textContent=tr("photoSaving");
 try{
   const photoURL=await compressProfilePhoto(file),db=getFirestore(app()),ref=await ensureUserDoc(db,user);
   await updateDoc(ref,{photoURL,photoUpdatedAt:serverTimestamp(),profileUpdatedAt:serverTimestamp()});
   applyPhoto(photoURL);toast(tr("photoSaved"),true);
 }catch(e){console.error("profile photo",e);toast(errorText(e),false)}
 finally{if(label)label.textContent=old}
}
function addProfileTools(){
 const save=$("saveProfileBtn");if(!save||$("profileTools"))return;
 const wrap=document.createElement("div");wrap.id="profileTools";wrap.style.cssText="display:grid;gap:9px;margin:12px 0";
 wrap.innerHTML=`<img id="profilePhotoPreview" alt="Profile" hidden style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 5px 18px #0002"><label class="secondary" style="display:flex;align-items:center;justify-content:center;cursor:pointer"><span id="profilePhotoLabel">${tr("photo")}</span><input id="profilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><button id="fixProfileLocationBtn" class="secondary" type="button">${tr("fix")}</button><div id="fixedLocationStatus" style="font-size:13px;color:#475467;line-height:1.5"></div>`;
 save.parentNode.insertBefore(wrap,save);
 $("profilePhotoInput").addEventListener("change",e=>{const file=e.target.files?.[0];if(file)savePhoto(file);e.target.value=""});
 $("fixProfileLocationBtn").addEventListener("click",fixLocation);
 $("languageSelector")?.addEventListener("change",()=>setTimeout(()=>{if($("profilePhotoLabel"))$("profilePhotoLabel").textContent=tr("photo");if($("fixProfileLocationBtn"))$("fixProfileLocationBtn").textContent=tr("fix")},0));
}
function bestPosition(timeoutMs=15000){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(Error("GEO_UNAVAILABLE"));let best=null,watchId=null,done=false;const finish=()=>{if(done)return;done=true;if(watchId!==null)navigator.geolocation.clearWatch(watchId);best?resolve(best):reject(Error("GEO_TIMEOUT"))};const timer=setTimeout(finish,timeoutMs);watchId=navigator.geolocation.watchPosition(pos=>{if(!best||Number(pos.coords.accuracy||999999)<Number(best.coords.accuracy||999999))best=pos;if(Number(pos.coords.accuracy||999999)<=30){clearTimeout(timer);finish()}},err=>{clearTimeout(timer);if(watchId!==null)navigator.geolocation.clearWatch(watchId);reject(err)},{enableHighAccuracy:true,maximumAge:0,timeout:14000})})}
function formatDirectAddress(a,j){const road=clean(a.road||a.pedestrian||a.residential||a.path),house=clean(a.house_number),area=clean(a.neighbourhood||a.suburb||a.quarter),city=clean(a.city||a.town||a.village||a.municipality||a.city_district),county=clean(a.county),state=clean(a.state||a.region),country=clean(a.country);return [[house,road].filter(Boolean).join(" "),area,city,county,state,country].filter((v,i,x)=>v&&x.indexOf(v)===i).join(", ")||clean(j.display_name)}
async function reverseAddress(lat,lng){try{const l={ht:"ht",fr:"fr",en:"en",es:"es"}[lang()]||"fr",r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=${l}`,{headers:{Accept:"application/json"},cache:"no-store"});if(!r.ok)return null;const j=await r.json(),a=j.address||{};return{formatted:formatDirectAddress(a,j),road:clean(a.road||a.pedestrian||a.residential||a.path),commune:clean(a.city||a.town||a.village||a.municipality||a.city_district),department:clean(a.state||a.region||a.county),country:clean(a.country)}}catch{return null}}
async function fixLocation(){
 const b=$("fixProfileLocationBtn"),status=$("fixedLocationStatus"),auth=getAuth(app()),user=auth.currentUser;if(!user)return toast(tr("login"),false);
 const old=b.textContent;b.disabled=true;b.textContent=tr("locating");if(status)status.textContent=tr("locating");
 try{
  const pos=await bestPosition(),lat=Number(pos.coords.latitude),lng=Number(pos.coords.longitude),accuracy=Math.round(Number(pos.coords.accuracy||0)),rev=await reverseAddress(lat,lng),fixedAddress=rev?.formatted||`${lat.toFixed(6)}, ${lng.toFixed(6)}`,db=getFirestore(app()),ref=await ensureUserDoc(db,user);
  if($("profileAddress"))$("profileAddress").value=fixedAddress;if($("profileCountry")&&rev?.country)$("profileCountry").value=rev.country;
  await updateDoc(ref,{address:fixedAddress,addressRoute:rev?.road||fixedAddress,fixedAddress,commune:rev?.commune||"",department:rev?.department||"",country:rev?.country||$("profileCountry")?.value||"",geo:{lat,lng,accuracy},locationSource:"gps_user_consent",locationUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true});
  const map=`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=19/${lat}/${lng}`;
  if(status)status.innerHTML=`<strong>${tr("direct")}:</strong> ${fixedAddress}<br>${tr("accuracy")}: ±${accuracy} m<br><a href="${map}" target="_blank" rel="noopener noreferrer">${tr("map")}</a>`;
  toast(tr("locSaved"),true);
 }catch(e){console.error("profile gps",e);if(status)status.textContent=tr("locDenied");toast(tr("locDenied"),false)}
 finally{b.disabled=false;b.textContent=old||tr("fix")}
}
async function save(){
 const button=$("saveProfileBtn");if(!button||button.disabled)return;const auth=getAuth(app()),user=auth.currentUser;if(!user)return toast(tr("login"),false);
 const lastName=$("profileLastName")?.value.trim()||"",firstName=$("profileFirstName")?.value.trim()||"";if(!lastName||!firstName)return toast(tr("missing"),false);
 const data={lastName,firstName,name:`${firstName} ${lastName}`.trim(),address:$("profileAddress")?.value.trim()||"",addressRoute:$("profileAddress")?.value.trim()||"",phone:$("profilePhone")?.value.trim()||"",country:$("profileCountry")?.value.trim()||"",profileUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true};
 const old=button.textContent;button.disabled=true;button.textContent=tr("saving");
 try{const db=getFirestore(app()),ref=await ensureUserDoc(db,user);await updateDoc(ref,data);if($("profileName"))$("profileName").textContent=data.name;toast(tr("saved"),true)}
 catch(e){console.error("profile save",e);toast(errorText(e),false)}
 finally{button.disabled=false;button.textContent=old}
}
async function loadVisual(user){if(!user)return applyPhoto("");try{const snap=await getDoc(doc(getFirestore(app()),"users",user.uid));applyPhoto(snap.exists()?snap.data().photoURL||"":"")}catch(e){console.warn("profile visual",e)}}
function start(){
 addProfileTools();
 document.addEventListener("click",e=>{const b=e.target.closest?.("#saveProfileBtn");if(!b)return;e.preventDefault();e.stopImmediatePropagation();save()},true);
 onAuthStateChanged(getAuth(app()),user=>{if(user)setTimeout(()=>loadVisual(user),80);else applyPhoto("")});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

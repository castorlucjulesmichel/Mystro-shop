import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,deleteUser} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id),PENDING_KEY="mystroPendingRegistrationV3";
let auth=null,db=null,creating=false,authWatcherStarted=false;
function bindFirebase(){if(!getApps().length)return false;const app=getApp();auth=getAuth(app);db=getFirestore(app);return true}

function manualValue(selectId,inputId){
  const s=$(selectId);if(!s)return"";
  if(s.value==="__manual__")return $(inputId)?.value.trim()||"";
  return String(s.value||"").trim();
}
function readRegistration(){
  const country=String($("authCountry")?.value||"").trim();
  const department=manualValue("authDepartment","authDepartmentManual");
  const commune=manualValue("authCommune","authCommuneManual");
  const address=String($("authAddressRoute")?.value||"").trim();
  const role=String($("authRole")?.value||"buyer").toLowerCase();
  return{
    lastName:String($("authLastName")?.value||"").trim(),
    firstName:String($("authFirstName")?.value||"").trim(),
    email:String($("authEmail")?.value||"").trim().toLowerCase(),
    password:String($("authPassword")?.value||""),
    role:["buyer","seller"].includes(role)?role:"buyer",
    phone:String($("authPhone")?.value||"").trim(),country,
    countryCode:$("authCountry")?.selectedOptions?.[0]?.dataset?.code||"",
    department,commune,address,addressRoute:address
  };
}
function valid(d){return d.lastName&&d.firstName&&d.email&&d.password.length>=6&&d.country&&d.department&&d.commune&&d.address.length>=3}
function profileData(user,d={}){
  const firstName=String(d.firstName||$("authFirstName")?.value||"").trim();
  const lastName=String(d.lastName||$("authLastName")?.value||"").trim();
  const email=String(user.email||d.email||"").trim();
  const role=["buyer","seller"].includes(String(d.role||"").toLowerCase())?String(d.role).toLowerCase():"buyer";
  const complete=Boolean(d.country&&d.department&&d.commune&&(d.address||d.addressRoute));
  return{
    firstName,lastName,name:[firstName,lastName].filter(Boolean).join(" ")||email||"Itilizatè",email,
    role,phone:d.phone||"",country:d.country||"",countryCode:d.countryCode||"",department:d.department||"",commune:d.commune||"",
    address:d.address||d.addressRoute||"",addressRoute:d.addressRoute||d.address||"",balance:0,balances:{HTG:0},accountStatus:"active",
    profileComplete:complete,legacyRecovered:!complete,
    createdAt:serverTimestamp(),profileUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true,presenceVersion:4
  };
}
async function writeProfile(user,d){
  const ref=doc(db,"users",user.uid),data=profileData(user,d);let last;
  for(let i=0;i<5;i++){
    try{await setDoc(ref,data);return true}catch(e){last=e;await new Promise(r=>setTimeout(r,350*(i+1)))}
  }
  throw last||Error("PROFILE_CREATE_FAILED");
}
async function registerNow(e){
  if($("authModal")?.dataset.mode!=="register")return;
  e.preventDefault();e.stopImmediatePropagation();
  if(creating)return;
  if(!bindFirebase()){alert("Firebase poko pare. Tann yon ti moman epi eseye ankò.");return}
  const d=readRegistration();
  if(!valid(d)){alert("Pou enskri, ranpli non, prenon, imèl, modpas epi chwazi peyi, depatman/eta, komin/vil ak adrès egzak la.");return}
  creating=true;const b=$("authSubmitBtn"),old=b?.textContent||"";if(b){b.disabled=true;b.textContent="Ap kreye kont..."}
  sessionStorage.setItem(PENDING_KEY,JSON.stringify({...d,password:undefined,capturedAt:Date.now()}));
  sessionStorage.setItem("mystroPendingAddress",JSON.stringify({...d,password:undefined,capturedAt:Date.now()}));
  let credential=null;
  try{
    credential=await createUserWithEmailAndPassword(auth,d.email,d.password);
    await writeProfile(credential.user,d);
    sessionStorage.removeItem(PENDING_KEY);sessionStorage.removeItem("mystroPendingAddress");
    document.dispatchEvent(new CustomEvent("mystroUserProfileCreated",{detail:{uid:credential.user.uid}}));
    const m=$("authModal");if(m){m.classList.remove("open");m.setAttribute("aria-hidden","true")}
    alert("✅ Kont lan kreye. Enfòmasyon itilizatè a anrejistre.");
  }catch(err){
    console.error("registration",err);
    if(credential?.user){try{await deleteUser(credential.user)}catch{}}
    const code=String(err?.code||err?.message||"REGISTRATION_FAILED");
    alert(`Enskripsyon an echwe: ${code}`);
  }finally{creating=false;if(b){b.disabled=false;b.textContent=old||"Enskri"}}
}
function captureRegistration(){const form=$("authForm");if(!form||form.dataset.regFixV3==="1")return;form.dataset.regFixV3="1";form.addEventListener("submit",registerNow,true)}
function pending(){
  for(const k of [PENDING_KEY,"mystroPendingAddress"]){
    try{const p=JSON.parse(sessionStorage.getItem(k)||"null");if(p&&typeof p==="object")return p}catch{}
  }
  return null;
}
async function ensureProfile(user){
  if(!user||!db)return;const ref=doc(db,"users",user.uid);
  try{
    const s=await getDoc(ref);if(s.exists())return;
    const p=pending()||{};
    await setDoc(ref,profileData(user,p));
    sessionStorage.removeItem(PENDING_KEY);sessionStorage.removeItem("mystroPendingAddress");
    document.dispatchEvent(new CustomEvent("mystroUserProfileCreated",{detail:{uid:user.uid,recovered:true}}));
  }catch(e){console.warn("profile repair",e)}
}
function watchAuthWhenReady(){
  if(authWatcherStarted)return;
  if(!bindFirebase()){setTimeout(watchAuthWhenReady,60);return}
  authWatcherStarted=true;onAuthStateChanged(auth,u=>{if(u)setTimeout(()=>ensureProfile(u),250)});
}
function start(){captureRegistration();watchAuthWhenReady()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

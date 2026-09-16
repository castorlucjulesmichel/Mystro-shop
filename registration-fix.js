import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,deleteUser,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const PENDING_KEY="mystroPendingRegistrationV4";
let auth=null,db=null,creating=false,authWatcherStarted=false;

function bindFirebase(){
  if(!getApps().length)return false;
  const app=getApp();
  auth=getAuth(app);
  db=getFirestore(app);
  return true;
}
function value(id){return String($(id)?.value||"").trim()}
function manualValue(selectId,inputId){
  const s=$(selectId);
  if(!s)return"";
  return s.value==="__manual__"?value(inputId):String(s.value||"").trim();
}
function readRegistration(){
  const role=value("authRole").toLowerCase();
  const country=value("authCountry");
  const address=value("authAddressRoute")||value("authAddress");
  return{
    lastName:value("authLastName"),
    firstName:value("authFirstName"),
    email:value("authEmail").toLowerCase(),
    password:String($("authPassword")?.value||""),
    role:["buyer","seller"].includes(role)?role:"buyer",
    phone:value("authPhone"),
    country,
    countryCode:$("authCountry")?.selectedOptions?.[0]?.dataset?.code||"",
    department:manualValue("authDepartment","authDepartmentManual"),
    commune:manualValue("authCommune","authCommuneManual"),
    address,
    addressRoute:address
  };
}
function validCore(d){return Boolean(d.lastName&&d.firstName&&d.email&&d.password.length>=6)}
function profileData(user,d={}){
  const firstName=String(d.firstName||"").trim();
  const lastName=String(d.lastName||"").trim();
  const email=String(user?.email||d.email||"").trim().toLowerCase();
  const role=["buyer","seller"].includes(String(d.role||"").toLowerCase())?String(d.role).toLowerCase():"buyer";
  const address=String(d.address||d.addressRoute||"").trim();
  const complete=Boolean(d.country&&d.department&&d.commune&&address);
  return{
    firstName,lastName,
    name:[firstName,lastName].filter(Boolean).join(" ")||email||"Itilizatè",
    email,role,
    phone:String(d.phone||"").trim(),
    country:String(d.country||"").trim(),
    countryCode:String(d.countryCode||"").trim(),
    department:String(d.department||"").trim(),
    commune:String(d.commune||"").trim(),
    address,addressRoute:address,
    balance:0,balances:{HTG:0},
    accountStatus:"active",
    profileComplete:complete,
    legacyRecovered:!complete,
    createdAt:serverTimestamp(),
    profileUpdatedAt:serverTimestamp(),
    lastSeen:serverTimestamp(),
    lastActiveAt:serverTimestamp(),
    isOnline:true,
    presenceVersion:5
  };
}
async function writeProfile(user,d){
  const ref=doc(db,"users",user.uid);
  let lastError=null;
  for(let i=0;i<5;i++){
    try{
      await setDoc(ref,profileData(user,d));
      const verify=await getDoc(ref);
      if(verify.exists())return true;
      lastError=Error("PROFILE_NOT_CONFIRMED");
    }catch(e){lastError=e}
    await new Promise(r=>setTimeout(r,300*(i+1)));
  }
  throw lastError||Error("PROFILE_CREATE_FAILED");
}
function savePending(d){
  const safe={...d,password:undefined,capturedAt:Date.now()};
  try{sessionStorage.setItem(PENDING_KEY,JSON.stringify(safe));sessionStorage.setItem("mystroPendingAddress",JSON.stringify(safe))}catch{}
}
function clearPending(){
  try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.removeItem("mystroPendingAddress");sessionStorage.removeItem("mystroPendingRegistrationV3")}catch{}
}
function pending(){
  for(const k of [PENDING_KEY,"mystroPendingRegistrationV3","mystroPendingAddress"]){
    try{const p=JSON.parse(sessionStorage.getItem(k)||"null");if(p&&typeof p==="object")return p}catch{}
  }
  return null;
}
async function registerNow(e){
  if($("authModal")?.dataset.mode!=="register")return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(creating)return;
  if(!bindFirebase()){
    alert("Firebase poko pare. Fèmen fenèt la, relouvri Enskri epi eseye ankò.");
    return;
  }
  const d=readRegistration();
  if(!validCore(d)){
    alert("Pou enskri, antre siyati, prenon, imèl ak yon modpas ki gen omwen 6 karaktè. Adrès la ka konplete apre kont lan kreye.");
    return;
  }
  creating=true;
  const button=$("authSubmitBtn"),old=button?.textContent||"";
  if(button){button.disabled=true;button.textContent="Ap kreye kont..."}
  savePending(d);
  let credential=null;
  try{
    credential=await createUserWithEmailAndPassword(auth,d.email,d.password);
    await writeProfile(credential.user,d);
    clearPending();
    document.dispatchEvent(new CustomEvent("mystroUserProfileCreated",{detail:{uid:credential.user.uid}}));
    const modal=$("authModal");
    if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
    alert("✅ Kont lan kreye epi pwofil itilizatè a anrejistre nan sistèm admin lan.");
  }catch(err){
    console.error("registration",err);
    if(credential?.user){
      try{await deleteUser(credential.user)}catch{try{await signOut(auth)}catch{}}
    }
    const code=String(err?.code||err?.message||"REGISTRATION_FAILED");
    alert(`Enskripsyon an echwe: ${code}`);
  }finally{
    creating=false;
    if(button){button.disabled=false;button.textContent=old||"Enskri"}
  }
}
function captureRegistration(){
  const form=$("authForm");
  if(!form||form.dataset.regFixV4==="1")return;
  form.dataset.regFixV4="1";
  form.addEventListener("submit",registerNow,true);
}
async function ensureProfile(user){
  if(!user||!db)return;
  const ref=doc(db,"users",user.uid);
  try{
    const current=await getDoc(ref);
    if(current.exists())return;
    const data=pending()||{email:user.email||"",role:"buyer"};
    await writeProfile(user,data);
    clearPending();
    document.dispatchEvent(new CustomEvent("mystroUserProfileCreated",{detail:{uid:user.uid,recovered:true}}));
  }catch(e){
    console.error("profile repair failed",e);
  }
}
function watchAuthWhenReady(){
  if(authWatcherStarted)return;
  if(!bindFirebase()){setTimeout(watchAuthWhenReady,80);return}
  authWatcherStarted=true;
  onAuthStateChanged(auth,user=>{if(user)setTimeout(()=>ensureProfile(user),120)});
}
function start(){captureRegistration();watchAuthWhenReady()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

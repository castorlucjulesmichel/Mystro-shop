import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const cfg={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const PENDING_KEY="mystroPendingRegistrationV2";

function manualValue(selectId,inputId){
  const s=$(selectId);if(!s)return"";
  if(s.value==="__manual__")return $(inputId)?.value.trim()||"";
  return String(s.value||"").trim();
}
function captureRegistration(){
  const form=$("authForm");if(!form||form.dataset.regFix==="1")return;
  form.dataset.regFix="1";
  form.addEventListener("submit",e=>{
    if($("authModal")?.dataset.mode!=="register")return;
    const country=String($("authCountry")?.value||"").trim();
    const department=manualValue("authDepartment","authDepartmentManual");
    const commune=manualValue("authCommune","authCommuneManual");
    const address=String($("authAddressRoute")?.value||"").trim();
    if(!country||!department||!commune||address.length<3){
      e.preventDefault();e.stopImmediatePropagation();
      alert("Pou enskri, chwazi peyi, depatman/eta, komin/vil epi antre adrès egzak la.");
      return;
    }
    const data={
      lastName:String($("authLastName")?.value||"").trim(),
      firstName:String($("authFirstName")?.value||"").trim(),
      email:String($("authEmail")?.value||"").trim().toLowerCase(),
      role:["buyer","seller"].includes(String($("authRole")?.value||"").toLowerCase())?String($("authRole").value).toLowerCase():"buyer",
      phone:String($("authPhone")?.value||"").trim(),
      country,
      countryCode:$("authCountry")?.selectedOptions?.[0]?.dataset?.code||"",
      department,commune,address,addressRoute:address,
      capturedAt:Date.now()
    };
    sessionStorage.setItem(PENDING_KEY,JSON.stringify(data));
    sessionStorage.setItem("mystroPendingAddress",JSON.stringify(data));
  },true);
}
function pending(){
  for(const k of [PENDING_KEY,"mystroPendingAddress"]){
    try{const x=JSON.parse(sessionStorage.getItem(k)||"null");if(x&&typeof x==="object")return x}catch{}
  }
  return null;
}
async function ensureProfile(user){
  if(!user)return;
  const ref=doc(db,"users",user.uid),p=pending();
  try{
    const snap=await getDoc(ref);
    if(snap.exists()){
      if(p){
        const patch={country:p.country||snap.data().country||"",countryCode:p.countryCode||snap.data().countryCode||"",department:p.department||snap.data().department||"",commune:p.commune||snap.data().commune||"",address:p.address||snap.data().address||"",addressRoute:p.addressRoute||p.address||snap.data().addressRoute||"",profileUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true};
        if(p.phone)patch.phone=p.phone;
        await setDoc(ref,patch,{merge:true});
        sessionStorage.removeItem(PENDING_KEY);sessionStorage.removeItem("mystroPendingAddress");
      }
      return;
    }
    const role=["buyer","seller"].includes(String(p?.role||"").toLowerCase())?String(p.role).toLowerCase():"buyer";
    const firstName=String(p?.firstName||"").trim(),lastName=String(p?.lastName||"").trim();
    const data={
      firstName,lastName,name:[firstName,lastName].filter(Boolean).join(" ")||user.email||"Itilizatè",
      email:user.email||p?.email||"",role,
      country:p?.country||"",countryCode:p?.countryCode||"",department:p?.department||"",commune:p?.commune||"",address:p?.address||"",addressRoute:p?.addressRoute||p?.address||"",phone:p?.phone||"",
      balance:0,balances:{HTG:0},accountStatus:"active",createdAt:serverTimestamp(),profileUpdatedAt:serverTimestamp(),lastSeen:serverTimestamp(),lastActiveAt:serverTimestamp(),isOnline:true,presenceVersion:2
    };
    await setDoc(ref,data);
    sessionStorage.removeItem(PENDING_KEY);sessionStorage.removeItem("mystroPendingAddress");
    document.dispatchEvent(new CustomEvent("mystroUserProfileCreated",{detail:{uid:user.uid}}));
  }catch(e){console.error("registration profile repair",e)}
}
function start(){captureRegistration();onAuthStateChanged(auth,u=>{if(u)setTimeout(()=>ensureProfile(u),150)});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

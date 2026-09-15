import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const TEXT={
  ht:{saving:"Ap anrejistre...",saved:"✅ Pwofil la anrejistre.",login:"Ou dwe konekte anvan.",missing:"Mete omwen siyati ak prenon.",failed:"Nou pa ka anrejistre pwofil la."},
  fr:{saving:"Enregistrement...",saved:"✅ Profil enregistré.",login:"Connectez-vous d’abord.",missing:"Indiquez au moins le nom et le prénom.",failed:"Impossible d’enregistrer le profil."},
  en:{saving:"Saving...",saved:"✅ Profile saved.",login:"Please sign in first.",missing:"Enter at least first and last name.",failed:"Unable to save the profile."},
  es:{saving:"Guardando...",saved:"✅ Perfil guardado.",login:"Inicie sesión primero.",missing:"Ingrese al menos nombre y apellido.",failed:"No se pudo guardar el perfil."}
};
function lang(){const x=$("languageSelector")?.value||localStorage.getItem("mystroLanguage")||"ht";return TEXT[x]?x:"ht"}
function tr(k){return TEXT[lang()][k]||TEXT.ht[k]||k}
function toast(message,ok=true){
  let box=$("profileSaveToast");
  if(!box){box=document.createElement("div");box.id="profileSaveToast";box.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000005;max-width:min(92vw,520px);padding:13px 16px;border-radius:13px;color:#fff;font-weight:850;text-align:center;box-shadow:0 12px 35px #0003";document.body.appendChild(box)}
  box.style.background=ok?"#067647":"#b42318";box.textContent=message;box.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.hidden=true,4200)
}
async function save(){
  const button=$("saveProfileBtn");if(!button||button.disabled)return;
  if(!getApps().length)return toast(tr("failed"),false);
  const auth=getAuth(getApp()),user=auth.currentUser;if(!user)return toast(tr("login"),false);
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
    const db=getFirestore(getApp()),ref=doc(db,"users",user.uid),snap=await getDoc(ref);
    if(!snap.exists())throw Error("USER_PROFILE_NOT_FOUND");
    await updateDoc(ref,data);
    if($("profileName"))$("profileName").textContent=data.name;
    const initial=(data.firstName||data.lastName||user.email||"M").trim().charAt(0).toUpperCase();
    if($("profileAvatar"))$("profileAvatar").textContent=initial;if($("profileBtn"))$("profileBtn").textContent=initial;
    toast(tr("saved"),true);
  }catch(e){console.error("profile save",e);const suffix=e?.code?` (${e.code})`:"";toast(tr("failed")+suffix,false)}
  finally{button.disabled=false;button.textContent=old}
}

document.addEventListener("click",e=>{
  const b=e.target.closest?.("#saveProfileBtn");if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();save();
},true);

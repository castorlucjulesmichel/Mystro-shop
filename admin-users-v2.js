import{getApps,getApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,collection,query,limit,onSnapshot,doc,updateDoc,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const MAX_USERS=500,ONLINE_WINDOW_MS=35000;
let users=[],stopUsers=null,clockTimer=null;
const T={
ht:{title:"Tout itilizatè yo",sub:"Tout nouvo achtè ak vandè parèt otomatikman an tan reyèl.",search:"Chèche non, imèl, telefòn oswa UID...",refresh:"Rekonekte",online:"● Aktif kounye a",offline:"Pa aktif kounye a",signal:"Dènye siyal",none:"Pa gen itilizatè.",locate:"📍 Lokalize",noLocation:"Pa gen lokalizasyon pataje pou itilizatè sa a.",dept:"Depatman / Eta",commune:"Komin / Vil",route:"Route / Adrès",block:"Bloke",unblock:"Debloke",blocked:"Bloke",deleted:"Siprime",rejected:"Rejte"},
fr:{title:"Tous les utilisateurs",sub:"Tous les nouveaux acheteurs et vendeurs apparaissent automatiquement en temps réel.",search:"Rechercher nom, e-mail, téléphone ou UID...",refresh:"Reconnecter",online:"● Actif maintenant",offline:"Pas actif maintenant",signal:"Dernier signal",none:"Aucun utilisateur.",locate:"📍 Localiser",noLocation:"Aucune localisation partagée pour cet utilisateur.",dept:"Département / État",commune:"Commune / Ville",route:"Rue / Adresse",block:"Bloquer",unblock:"Débloquer",blocked:"Bloqué",deleted:"Supprimé",rejected:"Rejeté"},
en:{title:"All users",sub:"All new buyers and sellers appear automatically in real time.",search:"Search name, email, phone or UID...",refresh:"Reconnect",online:"● Active now",offline:"Not active now",signal:"Last signal",none:"No users.",locate:"📍 Locate",noLocation:"No shared location for this user.",dept:"Department / State",commune:"Municipality / City",route:"Street / Address",block:"Block",unblock:"Unblock",blocked:"Blocked",deleted:"Deleted",rejected:"Rejected"},
es:{title:"Todos los usuarios",sub:"Todos los compradores y vendedores nuevos aparecen automáticamente en tiempo real.",search:"Buscar nombre, correo, teléfono o UID...",refresh:"Reconectar",online:"● Activo ahora",offline:"No activo ahora",signal:"Última señal",none:"No hay usuarios.",locate:"📍 Localizar",noLocation:"No hay ubicación compartida para este usuario.",dept:"Departamento / Estado",commune:"Municipio / Ciudad",route:"Calle / Dirección",block:"Bloquear",unblock:"Desbloquear",blocked:"Bloqueado",deleted:"Eliminado",rejected:"Rechazado"}
};
const lang=()=>{const x=$("adminLanguage")?.value||localStorage.getItem("mystroAdminLang")||"ht";return T[x]?x:"ht"};
const tr=k=>T[lang()][k]||T.ht[k]||k;
const dt=v=>{try{const d=v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?new Date(v):null;return d&&!isNaN(d)?d:null}catch{return null}};
const ms=v=>dt(v)?.getTime()||0;
const fmt=v=>dt(v)?.toLocaleString(lang()==="ht"?"fr-HT":lang(),{dateStyle:"medium",timeStyle:"medium"})||"—";
const nameOf=u=>u.name||u.displayName||[u.firstName,u.lastName].filter(Boolean).join(" ")||u.email||"Itilizatè";
const statusOf=u=>String(u.accountStatus||"active").toLowerCase();
const lastMs=u=>ms(u.lastSeen||u.lastActiveAt||u.profileUpdatedAt);
const createdMs=u=>ms(u.createdAt);
const online=u=>statusOf(u)==="active"&&u.isOnline===true&&lastMs(u)>0&&Date.now()-lastMs(u)<=ONLINE_WINDOW_MS;
const ageText=u=>{const t=lastMs(u);if(!t)return"—";const s=Math.max(0,Math.floor((Date.now()-t)/1000));if(s<60)return`${s}s`;const m=Math.floor(s/60);if(m<60)return`${m} min`;const h=Math.floor(m/60);if(h<24)return`${h} h`;return`${Math.floor(h/24)} j`};
const addressText=u=>[u.fixedAddress||u.addressRoute||u.address,u.commune,u.department,u.country].filter(Boolean).join(", ");
function mapHref(u){const lat=Number(u.geo?.lat),lng=Number(u.geo?.lng);if(Number.isFinite(lat)&&Number.isFinite(lng))return`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;const q=addressText(u);return q?`https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`:""}
function sortUsers(){users.sort((a,b)=>(createdMs(b)-createdMs(a))||(lastMs(b)-lastMs(a))||nameOf(a).localeCompare(nameOf(b)))}
function syncStats(){const uc=$("adminUsersCount"),sc=$("adminSellersCount");if(uc)uc.textContent=String(users.length);if(sc)sc.textContent=String(users.filter(u=>String(u.role||"").toLowerCase()==="seller").length);document.dispatchEvent(new CustomEvent("adminUsersSynced",{detail:{count:users.length}}))}
function ensureStyle(){
 if($("adminUsersLiveCss"))return;
 const s=document.createElement("style");s.id="adminUsersLiveCss";
 s.textContent=`#adminAllUsersList .presence.online{background:#dcfae6!important;color:#067647!important;box-shadow:0 0 0 1px #86efac inset}#adminAllUsersList .presence.offline{background:#f2f4f7!important;color:#667085!important}.admin-user-card.user-online{box-shadow:0 0 0 2px #86efac inset}.presence-age{display:block;margin-top:3px;color:#667085;font-size:10px;text-align:right}.user-location-summary{border:0;border-radius:999px;padding:6px 9px;background:#eaf8ef;color:#067647;font-size:12px;font-weight:900}.user-location-summary.no-location{background:#f2f4f7;color:#667085}.admin-users-note{font-size:12px;color:#667085;margin:8px 0}.admin-user-summary{display:flex;align-items:center;gap:10px}.admin-user-photo{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#eef2ff;flex:0 0 42px}.admin-user-fallback{display:grid;place-items:center;font-weight:900;color:#3159db}.user-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.user-actions button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.block-user{background:#fff1f2;color:#b42318}.unblock-user{background:#ecfdf3;color:#067647}`;document.head.appendChild(s)
}
function addPanel(){
 const dash=$("adminDashboard");if(!dash||$("adminUsersManager"))return;
 const stats=dash.querySelector(".stats-grid");
 stats.insertAdjacentHTML("afterend",`<section id="adminUsersManager" class="panel admin-users-manager"><div class="panel-head"><div><h2 id="adminUsersTitle"></h2><p id="adminUsersSub" class="panel-sub"></p></div><button id="adminUsersRefresh" class="ghost" type="button"></button></div><input id="adminUsersSearch" class="admin-search" type="search"><div id="adminUsersNote" class="admin-users-note"></div><div id="adminAllUsersList" class="admin-users-list"><div class="empty">Ap chaje...</div></div></section>`);
 $("adminUsersRefresh").onclick=()=>startStream(true);
 $("adminUsersSearch").oninput=render;
 $("adminAllUsersList").addEventListener("click",act);
 $("adminLanguage")?.addEventListener("change",render);
}
function translate(){
 if(!$("adminUsersManager"))return;
 $("adminUsersTitle").textContent=tr("title");$("adminUsersSub").textContent=tr("sub");$("adminUsersRefresh").textContent=tr("refresh");$("adminUsersSearch").placeholder=tr("search");
 const liveCount=users.filter(online).length;
 $("adminUsersNote").textContent=`${users.length} itilizatè · ${liveCount} aktif nan dènye ${Math.round(ONLINE_WINDOW_MS/1000)} segond yo · mizajou Firestore an tan reyèl`;
}
function badge(u){
 const st=statusOf(u),on=online(u);
 let label=on?tr("online"):tr("offline");
 if(st==="blocked")label=tr("blocked");else if(st==="deleted")label=tr("deleted");else if(st==="rejected")label=tr("rejected");
 return`<span class="presence ${on?"online":"offline"}">${esc(label)}</span><small class="presence-age">${esc(tr("signal"))}: ${esc(ageText(u))}</small>`;
}
function photoHtml(u){
 const url=String(u.photoURL||u.profilePhotoURL||"");
 if(url)return`<img class="admin-user-photo" src="${esc(url)}" alt="">`;
 return`<div class="admin-user-photo admin-user-fallback">${esc(nameOf(u).charAt(0).toUpperCase()||"U")}</div>`;
}
function detailsHtml(u){
 const bal=u.balances||{},href=mapHref(u),isAdmin=String(u.role||"").toLowerCase()==="admin",st=statusOf(u);
 return`<div class="user-details"><div><b>UID</b><span>${esc(u.id)}</span></div><div><b>Non</b><span>${esc(nameOf(u))}</span></div><div><b>Imèl</b><span>${esc(u.email||"—")}</span></div><div><b>Telefòn</b><span>${esc(u.phone||u.phoneNumber||"—")}</span></div><div><b>Peyi</b><span>${esc(u.country||"—")}</span></div><div><b>${esc(tr("dept"))}</b><span>${esc(u.department||"—")}</span></div><div><b>${esc(tr("commune"))}</b><span>${esc(u.commune||"—")}</span></div><div><b>${esc(tr("route"))}</b><span>${esc(u.fixedAddress||u.addressRoute||u.address||"—")}</span></div><div><b>Kreye</b><span>${esc(fmt(u.createdAt))}</span></div><div><b>Dènye aktivite</b><span>${esc(fmt(u.lastSeen||u.lastActiveAt))}</span></div><div><b>Balans</b><span>${Number(bal.HTG??u.balance??0).toLocaleString()} HTG · ${Number(bal.USD||0).toLocaleString()} USD · ${Number(bal.EUR||0).toLocaleString()} EUR</span></div><div><b>Pozisyon</b><span>${href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(tr("locate"))}</a>`:esc(tr("noLocation"))}</span></div></div>${isAdmin?'<p class="panel-sub">Kont admin pa ka bloke isit la.</p>':`<div class="user-actions">${st==="blocked"||st==="rejected"?`<button class="unblock-user" data-user-action="unblock" data-uid="${esc(u.id)}">${esc(tr("unblock"))}</button>`:`<button class="block-user" data-user-action="block" data-uid="${esc(u.id)}">${esc(tr("block"))}</button>`}</div>`}`;
}
function render(){
 const box=$("adminAllUsersList");if(!box)return;translate();syncStats();
 const q=($("adminUsersSearch")?.value||"").trim().toLowerCase();
 const rows=users.filter(u=>!q||[nameOf(u),u.email,u.phone,u.phoneNumber,u.id,u.country,u.department,u.commune,u.role].some(v=>String(v||"").toLowerCase().includes(q)));
 box.innerHTML=rows.length?rows.map(u=>{const on=online(u),href=mapHref(u);return`<details class="admin-user-card ${on?"user-online":"user-offline"}" data-uid="${esc(u.id)}"><summary><div class="admin-user-summary">${photoHtml(u)}<div><strong>${esc(nameOf(u))}</strong><small>${esc(u.email||"—")} · ${esc(u.phone||u.phoneNumber||"Pa gen telefòn")}</small></div></div><div class="user-badges"><span class="role">${esc(u.role||"buyer")}</span><div class="presence-wrap">${badge(u)}</div><button type="button" class="user-location-summary ${href?"":"no-location"}" data-locate="${esc(u.id)}">${esc(tr("locate"))}</button></div></summary><div class="user-details-slot"></div></details>`}).join(""):`<div class="empty">${esc(tr("none"))}</div>`;
 box.querySelectorAll("details.admin-user-card").forEach(card=>card.addEventListener("toggle",()=>{if(!card.open)return;const u=users.find(x=>x.id===card.dataset.uid),slot=card.querySelector(".user-details-slot");if(u&&slot)slot.innerHTML=detailsHtml(u)}));
}
function updatePresenceOnly(){
 translate();syncStats();
 document.querySelectorAll("details.admin-user-card").forEach(card=>{const u=users.find(x=>x.id===card.dataset.uid);if(!u)return;const on=online(u),wrap=card.querySelector(".presence-wrap");card.classList.toggle("user-online",on);card.classList.toggle("user-offline",!on);if(wrap)wrap.innerHTML=badge(u)});
}
async function act(e){
 const loc=e.target.closest?.("[data-locate]");
 if(loc){e.preventDefault();e.stopPropagation();const u=users.find(x=>x.id===loc.dataset.locate),href=u&&mapHref(u);if(href)window.open(href,"_blank","noopener,noreferrer");else alert(tr("noLocation"));return}
 const b=e.target.closest?.("[data-user-action]");if(!b||!getApps().length)return;
 const uid=b.dataset.uid,action=b.dataset.userAction,u=users.find(x=>x.id===uid),auth=getAuth(getApp());if(!u||!auth.currentUser)return;
 if(action==="block"&&!confirm(`Bloke kont ${nameOf(u)}?`))return;
 b.disabled=true;
 try{
   const ref=doc(getFirestore(getApp()),"users",uid);
   if(action==="unblock")await updateDoc(ref,{accountStatus:"active",unblockedAt:serverTimestamp(),unblockedBy:auth.currentUser.uid});
   else await updateDoc(ref,{accountStatus:"blocked",blockedAt:serverTimestamp(),blockedBy:auth.currentUser.uid,isOnline:false});
 }catch(err){console.error(err);alert(err.message||"Aksyon an echwe.")}
 finally{b.disabled=false}
}
function startStream(force=false){
 if(!getApps().length)return;
 const auth=getAuth(getApp());if(!auth.currentUser)return;
 stopUsers?.(); stopUsers=null;
 const db=getFirestore(getApp()),q=query(collection(db,"users"),limit(MAX_USERS));
 stopUsers=onSnapshot(q,snap=>{users=snap.docs.map(d=>({id:d.id,...d.data()}));sortUsers();render()},err=>{console.error("users live",err);const box=$("adminAllUsersList");if(box&&!users.length)box.innerHTML='<div class="empty">Nou pa ka chaje itilizatè yo.</div>'});
}
function start(){
 ensureStyle();addPanel();if(!getApps().length)return;
 onAuthStateChanged(getAuth(getApp()),u=>{stopUsers?.();stopUsers=null;clearInterval(clockTimer);if(u){startStream(true);clockTimer=setInterval(updatePresenceOnly,5000)}});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&getAuth(getApp()).currentUser)startStream(true)});
 document.addEventListener("adminOverviewLoaded",()=>{if(document.visibilityState==="visible"&&!stopUsers)startStream(true)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

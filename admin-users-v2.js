import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,getDocs,query,limit,where,Timestamp,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const MAX_USERS=100,MAX_RECENT=100,ONLINE_MS=55000,PRESENCE_POLL_MS=20000;
let users=[],loading=false,presenceLoading=false,presenceTimer=null,uiTimer=null;
const T={
 ht:{dept:"Depatman / Eta",commune:"Komin / Vil",route:"Route / Adrès",gps:"Pozisyon",locate:"📍 Lokalize",gpsLive:"GPS pataje",declared:"Adrès deklare",noLocation:"Pa gen pozisyon",updated:"Mizajou",none:"Pa gen itilizatè ki koresponn.",loading:"Ap chaje itilizatè yo...",refresh:"Rafrechi",more:`Premye ${MAX_USERS} itilizatè yo + tout moun ki aktif kounye a.`,online:"● An liy kounye a",offline:"Pa an liy",signal:"Dènye siyal"},
 fr:{dept:"Département / État",commune:"Commune / Ville",route:"Rue / Adresse",gps:"Position",locate:"📍 Localiser",gpsLive:"GPS partagé",declared:"Adresse déclarée",noLocation:"Aucune position",updated:"Mise à jour",none:"Aucun utilisateur correspondant.",loading:"Chargement des utilisateurs...",refresh:"Actualiser",more:`Les ${MAX_USERS} premiers utilisateurs + tous les utilisateurs actifs.`,online:"● En ligne maintenant",offline:"Hors ligne",signal:"Dernier signal"},
 en:{dept:"Department / State",commune:"Municipality / City",route:"Street / Address",gps:"Location",locate:"📍 Locate",gpsLive:"Shared GPS",declared:"Declared address",noLocation:"No location",updated:"Updated",none:"No matching users.",loading:"Loading users...",refresh:"Refresh",more:`First ${MAX_USERS} users + everyone currently active.`,online:"● Online now",offline:"Offline",signal:"Last signal"},
 es:{dept:"Departamento / Estado",commune:"Municipio / Ciudad",route:"Calle / Dirección",gps:"Ubicación",locate:"📍 Localizar",gpsLive:"GPS compartido",declared:"Dirección declarada",noLocation:"Sin ubicación",updated:"Actualizado",none:"No hay usuarios coincidentes.",loading:"Cargando usuarios...",refresh:"Actualizar",more:`Primeros ${MAX_USERS} usuarios + todos los usuarios activos.`,online:"● En línea ahora",offline:"Fuera de línea",signal:"Última señal"}
};
const lang=()=>{const x=$("adminLanguage")?.value||localStorage.getItem("mystroAdminLang")||"ht";return T[x]?x:"ht"},tr=k=>T[lang()][k]||T.ht[k]||k;
const dt=v=>{try{const d=v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?new Date(v):null;return d&&!isNaN(d)?d:null}catch{return null}};
const fmt=v=>dt(v)?.toLocaleString(lang()==="ht"?"fr-HT":lang(),{dateStyle:"medium",timeStyle:"medium"})||"—";
const nameOf=u=>u.name||u.displayName||[u.firstName,u.lastName].filter(Boolean).join(" ")||u.email||"Itilizatè";
const statusOf=u=>String(u.accountStatus||"active").toLowerCase();
const online=u=>{const d=dt(u.lastSeen||u.lastActiveAt);return statusOf(u)==="active"&&!!d&&Date.now()-d.getTime()<ONLINE_MS};
const ageText=u=>{const d=dt(u.lastSeen||u.lastActiveAt);if(!d)return"—";const s=Math.max(0,Math.floor((Date.now()-d.getTime())/1000));if(s<60)return`${s}s`;const m=Math.floor(s/60);if(m<60)return`${m} min`;const h=Math.floor(m/60);return`${h} h`};
const addressText=u=>[u.addressRoute||u.address,u.commune,u.department,u.country].filter(Boolean).join(", ");
function mapHref(u){const lat=Number(u.geo?.lat),lng=Number(u.geo?.lng);if(Number.isFinite(lat)&&Number.isFinite(lng))return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;const q=addressText(u);return q?`https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`:""}
function locationLabel(u){const lat=Number(u.geo?.lat),lng=Number(u.geo?.lng),has=Number.isFinite(lat)&&Number.isFinite(lng);return has?`${tr("gpsLive")} · ${tr("updated")}: ${fmt(u.locationUpdatedAt)}`:addressText(u)?tr("declared"):tr("noLocation")}
function sortUsers(){users.sort((a,b)=>(Number(online(b))-Number(online(a)))||nameOf(a).localeCompare(nameOf(b)))}

function ensureStyle(){
 if($("adminUsersLiteCss"))return;
 const s=document.createElement("style");s.id="adminUsersLiteCss";s.textContent=`
 #adminAllUsersList .user-location-summary{border:0;border-radius:999px;padding:6px 9px;background:#eaf8ef;color:#067647;font-size:12px;font-weight:900;white-space:nowrap;box-shadow:0 0 0 1px #abefc6 inset}
 #adminAllUsersList .user-location-summary.no-location{background:#f2f4f7;color:#667085;box-shadow:none}
 #adminAllUsersList details>summary{cursor:pointer;touch-action:manipulation}
 #adminAllUsersList .presence.online{background:#dcfae6!important;color:#067647!important;box-shadow:0 0 0 1px #86efac inset}
 #adminAllUsersList .presence.offline{background:#f2f4f7!important;color:#667085!important}
 #adminAllUsersList .user-online{box-shadow:0 0 0 1px #abefc6 inset}
 #adminAllUsersList .presence-age{display:block;margin-top:3px;color:#667085;font-size:10px;text-align:right;white-space:nowrap}
 .admin-users-note{margin:8px 0;color:#667085;font-size:12px}`;
 document.head.appendChild(s)
}
function addPanel(){
 const dashboard=$("adminDashboard");if(!dashboard||$("adminUsersManager"))return;
 const stats=dashboard.querySelector(".stats-grid");
 stats.insertAdjacentHTML("afterend",`<section id="adminUsersManager" class="panel admin-users-manager"><div class="panel-head"><div><h2>Tout itilizatè yo</h2><p class="panel-sub">Non, imèl, telefòn, adrès, peyi, wòl, balans, UID, dènye aktivite ak estati an liy.</p></div><button id="adminUsersRefresh" class="ghost" type="button"></button></div><input id="adminUsersSearch" class="admin-search" type="search" placeholder="Chèche non, imèl, telefòn oswa UID..."><div id="adminUsersNote" class="admin-users-note"></div><div id="adminAllUsersList" class="admin-users-list"><div class="empty">${esc(tr("loading"))}</div></div></section>`);
 $("adminUsersRefresh").onclick=()=>loadUsers(true);$("adminUsersSearch").oninput=render;$("adminAllUsersList").addEventListener("click",act);$("adminLanguage")?.addEventListener("change",()=>setTimeout(render,0));
}
function mergeSnapshots(snaps){
 const map=new Map(users.map(u=>[u.id,u]));
 for(const s of snaps.filter(Boolean))for(const d of s.docs)map.set(d.id,{id:d.id,...d.data()});
 users=[...map.values()];sortUsers();
}
async function recentSnapshot(){
 if(!getApps().length)return null;
 const db=getFirestore(getApp()),cut=Timestamp.fromDate(new Date(Date.now()-120000));
 try{return await getDocs(query(collection(db,"users"),where("lastSeen",">=",cut),limit(MAX_RECENT)))}catch(e){console.warn("presence recent",e);return null}
}
async function loadUsers(force=false){
 if(loading||!getApps().length||!getAuth(getApp()).currentUser)return;
 loading=true;const box=$("adminAllUsersList");if(box&&!users.length)box.innerHTML=`<div class="empty">${esc(tr("loading"))}</div>`;
 try{
  const db=getFirestore(getApp()),ref=collection(db,"users");
  const base=await getDocs(query(ref,limit(MAX_USERS)));
  const recent=await recentSnapshot();
  if(force)users=[];
  mergeSnapshots([base,recent]);render();
 }catch(err){console.error(err);if(box&&!users.length)box.innerHTML='<div class="empty">Nou pa ka chaje itilizatè yo.</div>'}
 finally{loading=false}
}
async function refreshPresence(){
 const panel=$("adminUsersManager");
 if(presenceLoading||!panel||panel.hidden||document.visibilityState!=="visible"||!getAuth(getApp()).currentUser)return;
 presenceLoading=true;
 try{
  const before=new Set(users.map(u=>u.id)),recent=await recentSnapshot();
  if(recent){mergeSnapshots([recent]);const added=recent.docs.some(d=>!before.has(d.id));if(added&&!$("adminAllUsersList")?.querySelector("details[open]"))render();else updatePresenceOnly()}
 }finally{presenceLoading=false}
}
function detailsHtml(u){const st=statusOf(u),bal=u.balances||{},isAdmin=String(u.role||"").toLowerCase()==="admin",href=mapHref(u);return `<div class="user-details"><div><b>UID</b><span>${esc(u.id)}</span></div><div><b>Non</b><span>${esc(nameOf(u))}</span></div><div><b>Imèl</b><span>${esc(u.email||"—")}</span></div><div><b>Telefòn</b><span>${esc(u.phone||u.phoneNumber||"—")}</span></div><div><b>Adrès</b><span>${esc(u.address||u.addressRoute||"—")}</span></div><div><b>Peyi</b><span>${esc(u.country||"—")}</span></div><div><b>Kalite kont</b><span>${esc(u.role||"buyer")}</span></div><div><b>Kreye</b><span>${esc(fmt(u.createdAt))}</span></div><div><b>Dènye aktivite</b><span>${esc(fmt(u.lastSeen||u.lastActiveAt))}</span></div><div><b>Balans HTG</b><span>${Number(bal.HTG??u.balance??0).toLocaleString()} HTG</span></div><div><b>USD</b><span>${Number(bal.USD||0).toLocaleString()} USD</span></div><div><b>EUR / CAD</b><span>${Number(bal.EUR||0).toLocaleString()} EUR · ${Number(bal.CAD||0).toLocaleString()} CAD</span></div><div><b>${esc(tr("dept"))}</b><span>${esc(u.department||"—")}</span></div><div><b>${esc(tr("commune"))}</b><span>${esc(u.commune||"—")}</span></div><div><b>${esc(tr("route"))}</b><span>${esc(u.addressRoute||u.address||"—")}</span></div><div><b>${esc(tr("gps"))}</b><span>${esc(locationLabel(u))}${href?` · <a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(tr("locate"))}</a>`:""}</span></div></div>${isAdmin?'<p class="panel-sub">Kont admin pa ka bloke oswa siprime isit la.</p>':`<div class="user-actions">${st==="blocked"?`<button class="unblock-user" data-user-action="unblock" data-uid="${esc(u.id)}">Debloke</button>`:`<button class="block-user" data-user-action="block" data-uid="${esc(u.id)}">Bloke</button>`}<button class="delete-user" data-user-action="delete" data-uid="${esc(u.id)}">Siprime kont</button></div>`}`}
function badgeHtml(u){const st=statusOf(u),isOn=online(u),text=st==="blocked"?"Bloke":st==="deleted"?"Siprime":isOn?tr("online"):tr("offline");return `<span class="presence ${st} ${isOn?"online":"offline"}">${esc(text)}</span><small class="presence-age">${esc(tr("signal"))}: ${esc(ageText(u))}</small>`}
function render(){
 const box=$("adminAllUsersList");if(!box)return;const q=($("adminUsersSearch")?.value||"").trim().toLowerCase();$("adminUsersRefresh").textContent=tr("refresh");$("adminUsersNote").textContent=tr("more");
 const rows=users.filter(u=>!q||[nameOf(u),u.email,u.phone,u.phoneNumber,u.country,u.department,u.commune,u.address,u.addressRoute,u.id,u.role].some(v=>String(v||"").toLowerCase().includes(q)));
 box.innerHTML=rows.length?rows.map(u=>{const href=mapHref(u),isOn=online(u);return `<details class="admin-user-card ${isOn?"user-online":"user-offline"}" data-uid="${esc(u.id)}"><summary><div><strong>${esc(nameOf(u))}</strong><small>${esc(u.email||"—")} · ${esc(u.phone||u.phoneNumber||"Pa gen telefòn")}</small></div><div class="user-badges"><span class="role">${esc(u.role||"buyer")}</span><div class="presence-wrap">${badgeHtml(u)}</div><button type="button" class="user-location-summary ${href?"":"no-location"}" data-locate="${esc(u.id)}">${esc(tr("locate"))}</button></div></summary><div class="user-details-slot"></div></details>`}).join(""):`<div class="empty">${esc(tr("none"))}</div>`;
 box.querySelectorAll("details.admin-user-card").forEach(card=>card.addEventListener("toggle",()=>{if(!card.open||card.dataset.ready==="1")return;card.dataset.ready="1";const u=users.find(x=>x.id===card.dataset.uid),slot=card.querySelector(".user-details-slot");if(u&&slot)slot.innerHTML=detailsHtml(u)}));
}
function updatePresenceOnly(){
 const box=$("adminAllUsersList");if(!box)return;
 box.querySelectorAll("details.admin-user-card").forEach(card=>{
  const u=users.find(x=>x.id===card.dataset.uid);if(!u)return;const isOn=online(u),wrap=card.querySelector(".presence-wrap");
  card.classList.toggle("user-online",isOn);card.classList.toggle("user-offline",!isOn);if(wrap)wrap.innerHTML=badgeHtml(u);
 });
}
async function act(e){
 const loc=e.target.closest?.("[data-locate]");if(loc){e.preventDefault();e.stopPropagation();const u=users.find(x=>x.id===loc.dataset.locate),href=u&&mapHref(u);if(href)window.open(href,"_blank","noopener,noreferrer");else alert(tr("noLocation"));return}
 const b=e.target.closest?.("[data-user-action]");if(!b||!getApps().length)return;const uid=b.dataset.uid,action=b.dataset.userAction,u=users.find(x=>x.id===uid);if(!u)return;const auth=getAuth(getApp());if(!auth.currentUser)return;const label=nameOf(u);if(action==="delete"&&!confirm(`Siprime aksè kont ${label}? Istorik tranzaksyon li ap rete konsève.`))return;if(action==="block"&&!confirm(`Bloke kont ${label}?`))return;b.disabled=true;try{const db=getFirestore(getApp());if(action==="unblock")await updateDoc(doc(db,"users",uid),{accountStatus:"active",isOnline:false,unblockedAt:serverTimestamp(),unblockedBy:auth.currentUser.uid});else if(action==="block")await updateDoc(doc(db,"users",uid),{accountStatus:"blocked",isOnline:false,blockedAt:serverTimestamp(),blockedBy:auth.currentUser.uid});else await updateDoc(doc(db,"users",uid),{accountStatus:"deleted",isOnline:false,deletedAt:serverTimestamp(),deletedBy:auth.currentUser.uid});await loadUsers(true)}catch(err){console.error(err);alert(err.message||"Aksyon an echwe.")}finally{b.disabled=false}}
function start(){
 ensureStyle();addPanel();if(!getApps().length)return;
 onAuthStateChanged(getAuth(getApp()),u=>{if(u){loadUsers(true);clearInterval(presenceTimer);clearInterval(uiTimer);presenceTimer=setInterval(refreshPresence,PRESENCE_POLL_MS);uiTimer=setInterval(updatePresenceOnly,5000)}else{clearInterval(presenceTimer);clearInterval(uiTimer)}});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshPresence()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

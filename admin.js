import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,doc,getDoc,collection,getDocs,getDocsFromServer,getCountFromServer,query,limit,where,orderBy}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const loginView=$("adminLoginView"),dashboard=$("adminDashboard"),logoutBtn=$("adminLogoutBtn"),msg=$("adminLoginMessage"),status=$("adminStatus");
const CACHE_KEY="mystroAdminOverviewCacheV5",AUTO_MS=15000;
let refreshTimer=null,loading=false;

const T={
ht:{adminAccess:"Aksè Administrasyon",adminOnly:"Paj sa a rezève sèlman pou kont ki gen wòl admin.",email:"Imèl",password:"Modpas",login:"Konekte kòm Admin",logout:"Dekonekte",backShop:"← Retounen nan Mystro-Shop",secureSpace:"ESPAS SEKIRIZE",dashboard:"Tablo de bò Admin",users:"Itilizatè",sellers:"Vandè",products:"Pwodwi",orders:"Kòmand",paidOrders:"Kòmand peye",platformCommission:"Komisyon platfòm",recentUsers:"Dènye itilizatè",recentOrders:"Dènye kòmand",refresh:"Rafrechi",controlCenter:"Sant kontwòl",wallet:"Pòtfèy",statistics:"Estatistik",denied:"Kont sa a pa gen otorizasyon admin.",loading:"Ap rafrechi done admin yo...",loadError:"Rezo a pran tan. Dènye done ki te sove yo rete vizib."},
fr:{adminAccess:"Accès Administration",adminOnly:"Cette page est réservée aux comptes ayant le rôle admin.",email:"E-mail",password:"Mot de passe",login:"Se connecter comme Admin",logout:"Déconnexion",backShop:"← Retour à Mystro-Shop",secureSpace:"ESPACE SÉCURISÉ",dashboard:"Tableau de bord Admin",users:"Utilisateurs",sellers:"Vendeurs",products:"Produits",orders:"Commandes",paidOrders:"Commandes payées",platformCommission:"Commission plateforme",recentUsers:"Utilisateurs récents",recentOrders:"Commandes récentes",refresh:"Actualiser",controlCenter:"Centre de contrôle",wallet:"Portefeuille",statistics:"Statistiques",denied:"Ce compte n'a pas l'autorisation administrateur.",loading:"Actualisation des données admin...",loadError:"Le réseau est lent. Les dernières données enregistrées restent affichées."},
en:{adminAccess:"Administration Access",adminOnly:"This page is only for accounts with the admin role.",email:"Email",password:"Password",login:"Sign in as Admin",logout:"Sign out",backShop:"← Back to Mystro-Shop",secureSpace:"SECURE AREA",dashboard:"Admin Dashboard",users:"Users",sellers:"Sellers",products:"Products",orders:"Orders",paidOrders:"Paid orders",platformCommission:"Platform commission",recentUsers:"Recent users",recentOrders:"Recent orders",refresh:"Refresh",controlCenter:"Control center",wallet:"Wallet",statistics:"Statistics",denied:"This account does not have admin permission.",loading:"Refreshing admin data...",loadError:"The network is slow. The last saved data remains visible."},
es:{adminAccess:"Acceso de Administración",adminOnly:"Esta página está reservada a cuentas con rol de administrador.",email:"Correo",password:"Contraseña",login:"Entrar como Admin",logout:"Cerrar sesión",backShop:"← Volver a Mystro-Shop",secureSpace:"ÁREA SEGURA",dashboard:"Panel de Admin",users:"Usuarios",sellers:"Vendedores",products:"Productos",orders:"Pedidos",paidOrders:"Pedidos pagados",platformCommission:"Comisión de plataforma",recentUsers:"Usuarios recientes",recentOrders:"Pedidos recientes",refresh:"Actualizar",controlCenter:"Centro de control",wallet:"Cartera",statistics:"Estadísticas",denied:"Esta cuenta no tiene permiso de administrador.",loading:"Actualizando datos de administrador...",loadError:"La red está lenta. Los últimos datos guardados siguen visibles."}
};
let lang=localStorage.getItem("mystroAdminLang")||"ht";
const tr=k=>T[lang]?.[k]||T.ht[k]||k;
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll("[data-t]").forEach(el=>el.textContent=tr(el.dataset.t));$("adminLanguage").value=lang}
$("adminLanguage").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("mystroAdminLang",lang);applyLang()});applyLang();

function showLogin(text=""){loginView.hidden=false;dashboard.hidden=true;logoutBtn.hidden=true;msg.textContent=text;clearInterval(refreshTimer);refreshTimer=null}
function showDashboard(user){loginView.hidden=true;dashboard.hidden=false;logoutBtn.hidden=false;$("adminIdentity").textContent=user.email||user.uid;msg.textContent=""}
const moneyHTG=n=>new Intl.NumberFormat("fr-HT",{style:"currency",currency:"HTG",maximumFractionDigits:2}).format(Number(n)||0);
function safeDate(v){try{if(v?.toDate)return v.toDate().toLocaleString();if(v?.seconds)return new Date(v.seconds*1000).toLocaleString();if(v)return new Date(v).toLocaleString()}catch{}return"—"}
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ts=v=>{try{return v?.toMillis?.()||v?.seconds*1000||new Date(v||0).getTime()||0}catch{return 0}};
function renderList(el,rows,type){if(!el)return;if(!rows?.length){el.innerHTML='<div class="empty">—</div>';return}el.innerHTML=rows.map(x=>type==="user"?`<div class="list-item"><div><strong>${esc(x.name||x.displayName||[x.firstName,x.lastName].filter(Boolean).join(" ")||x.email||"Itilizatè")}</strong><small>${esc(x.email||"")}</small></div><span class="role">${esc(x.role||"buyer")}</span></div>`:`<div class="list-item"><div><strong>${esc(x.id||"Kòmand")}</strong><small>${esc(x.status||"pending")} · ${safeDate(x.createdAt)}</small></div><span class="role">${esc(String(x.currency||"HTG"))}</span></div>`).join("")}
function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null")}catch{return null}}
function writeCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify(data))}catch{}}
function renderSnapshot(s){if(!s)return;const set=(id,v)=>{if(v!==undefined&&v!==null)$(id).textContent=v};set("adminUsersCount",s.userCount);set("adminSellersCount",s.sellerCount);set("adminProductsCount",s.productCount);set("adminOrdersCount",s.orderCount);set("adminPaidOrdersCount",s.paidCount);if(s.commission!==undefined)set("adminCommissionTotal",moneyHTG(s.commission));renderList($("adminUsersList"),s.recentUsers||[],"user");renderList($("adminOrdersList"),s.recentOrders||[],"order")}
function timeout(p,ms=9000){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Error("TIMEOUT")),ms))])}
async function serverDocs(q){try{return await timeout(getDocsFromServer(q),9000)}catch(e){console.warn("server read fallback",e);return timeout(getDocs(q),7000)}}
async function count(q){try{return (await timeout(getCountFromServer(q),9000)).data().count}catch(e){console.warn("count",e);return null}}
async function recent(ref,n=8){try{const s=await serverDocs(query(ref,orderBy("createdAt","desc"),limit(n)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn("recent ordered",e);try{const s=await serverDocs(query(ref,limit(60)));return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>ts(b.createdAt)-ts(a.createdAt)).slice(0,n)}catch{return[]}}}

async function loadAdminData(force=false){
 if(loading||!auth.currentUser)return;
 const cached=readCache();if(cached)renderSnapshot(cached);
 loading=true;if(force)status.textContent=tr("loading");
 try{
  const usersRef=collection(db,"users"),productsRef=collection(db,"products"),ordersRef=collection(db,"orders");
  const paidQ=query(ordersRef,where("status","in",["paid","completed","success"]));
  const [userCount,sellerCount,productCount,orderCount,paidCount,recentUsers,recentOrders,paidSnap]=await Promise.all([
   count(usersRef),count(query(usersRef,where("role","==","seller"))),count(productsRef),count(ordersRef),count(paidQ),recent(usersRef,8),recent(ordersRef,8),serverDocs(query(paidQ,limit(350))).catch(()=>null)
  ]);
  let commission=cached?.commission||0;
  if(paidSnap){commission=0;for(const d of paidSnap.docs){const o=d.data(),direct=Number(o.platformCommission??o.platformFee??o.commission);commission+=Number.isFinite(direct)&&direct>0?direct:Number(o.subtotal??o.totalProducts??o.total??0)*.10}}
  const next={savedAt:Date.now(),userCount:userCount??cached?.userCount??0,sellerCount:sellerCount??cached?.sellerCount??0,productCount:productCount??cached?.productCount??0,orderCount:orderCount??cached?.orderCount??0,paidCount:paidCount??cached?.paidCount??0,commission,recentUsers:recentUsers.length?recentUsers:cached?.recentUsers||[],recentOrders:recentOrders.length?recentOrders:cached?.recentOrders||[]};
  writeCache(next);renderSnapshot(next);status.textContent="";
 }catch(e){console.error(e);status.textContent=tr("loadError")}finally{loading=false}
}

function startAutoRefresh(){clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(document.visibilityState==="visible"&&!dashboard.hidden)loadAdminData(false)},AUTO_MS)}
async function verifyAdmin(user){if(!user){showLogin();return}try{const snap=await timeout(getDoc(doc(db,"users",user.uid)),8000),role=String(snap.data()?.role||"").toLowerCase();if(role!=="admin"){await signOut(auth);showLogin(tr("denied"));return}showDashboard(user);const cache=readCache();if(cache)renderSnapshot(cache);await loadAdminData(true);startAutoRefresh()}catch(e){console.error(e);showLogin(tr("loadError"))}}

$("adminLoginForm").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="";const btn=$("adminLoginBtn");btn.disabled=true;try{await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value)}catch(err){msg.textContent=err.code==="auth/invalid-credential"?"Imèl oswa modpas pa kòrèk.":err.message||"Connexion impossible"}finally{btn.disabled=false}});
logoutBtn.addEventListener("click",()=>signOut(auth));$("refreshAdminBtn").addEventListener("click",()=>loadAdminData(true));document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!dashboard.hidden)loadAdminData(true)});onAuthStateChanged(auth,verifyAdmin);

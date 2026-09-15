import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,doc,getDoc,collection,getDocs,query,limit}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const loginView=$("adminLoginView"),dashboard=$("adminDashboard"),logoutBtn=$("adminLogoutBtn"),msg=$("adminLoginMessage"),status=$("adminStatus");
const CACHE_KEY="mystroAdminOverviewCacheV4",MAX_DOCS=300;

const T={
ht:{adminAccess:"Aksè Administrasyon",adminOnly:"Paj sa a rezève sèlman pou kont ki gen wòl admin.",email:"Imèl",password:"Modpas",login:"Konekte kòm Admin",logout:"Dekonekte",backShop:"← Retounen nan Mystro-Shop",secureSpace:"ESPAS SEKIRIZE",dashboard:"Tablo de bò Admin",users:"Itilizatè",sellers:"Vandè",products:"Pwodwi",orders:"Kòmand",paidOrders:"Kòmand peye",platformCommission:"Komisyon platfòm",recentUsers:"Dènye itilizatè",recentOrders:"Dènye kòmand",refresh:"Rafrechi",controlCenter:"Sant kontwòl",wallet:"Pòtfèy",statistics:"Estatistik",denied:"Kont sa a pa gen otorizasyon admin.",loading:"Ap rafrechi done admin yo...",loadError:"Rezo a pran tan. Dènye done ki te sove yo rete vizib."},
fr:{adminAccess:"Accès Administration",adminOnly:"Cette page est réservée aux comptes ayant le rôle admin.",email:"E-mail",password:"Mot de passe",login:"Se connecter comme Admin",logout:"Déconnexion",backShop:"← Retour à Mystro-Shop",secureSpace:"ESPACE SÉCURISÉ",dashboard:"Tableau de bord Admin",users:"Utilisateurs",sellers:"Vendeurs",products:"Produits",orders:"Commandes",paidOrders:"Commandes payées",platformCommission:"Commission plateforme",recentUsers:"Utilisateurs récents",recentOrders:"Commandes récentes",refresh:"Actualiser",controlCenter:"Centre de contrôle",wallet:"Portefeuille",statistics:"Statistiques",denied:"Ce compte n'a pas l'autorisation administrateur.",loading:"Actualisation des données admin...",loadError:"Le réseau est lent. Les dernières données enregistrées restent affichées."},
en:{adminAccess:"Administration Access",adminOnly:"This page is only for accounts with the admin role.",email:"Email",password:"Password",login:"Sign in as Admin",logout:"Sign out",backShop:"← Back to Mystro-Shop",secureSpace:"SECURE AREA",dashboard:"Admin Dashboard",users:"Users",sellers:"Sellers",products:"Products",orders:"Orders",paidOrders:"Paid orders",platformCommission:"Platform commission",recentUsers:"Recent users",recentOrders:"Recent orders",refresh:"Refresh",controlCenter:"Control center",wallet:"Wallet",statistics:"Statistics",denied:"This account does not have admin permission.",loading:"Refreshing admin data...",loadError:"The network is slow. The last saved data remains visible."},
es:{adminAccess:"Acceso de Administración",adminOnly:"Esta página está reservada a cuentas con rol de administrador.",email:"Correo",password:"Contraseña",login:"Entrar como Admin",logout:"Cerrar sesión",backShop:"← Volver a Mystro-Shop",secureSpace:"ÁREA SEGURA",dashboard:"Panel de Admin",users:"Usuarios",sellers:"Vendedores",products:"Productos",orders:"Pedidos",paidOrders:"Pedidos pagados",platformCommission:"Comisión de plataforma",recentUsers:"Usuarios recientes",recentOrders:"Pedidos recientes",refresh:"Actualizar",controlCenter:"Centro de control",wallet:"Cartera",statistics:"Estadísticas",denied:"Esta cuenta no tiene permiso de administrador.",loading:"Actualizando datos de administrador...",loadError:"La red está lenta. Los últimos datos guardados siguen visibles."}
};
let lang=localStorage.getItem("mystroAdminLang")||"ht",loading=false,lastLoadAt=0;
function tr(k){return T[lang]?.[k]||T.ht[k]||k}
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll("[data-t]").forEach(el=>el.textContent=tr(el.dataset.t));$("adminLanguage").value=lang}
$("adminLanguage").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("mystroAdminLang",lang);applyLang()});applyLang();

function showLogin(text=""){loginView.hidden=false;dashboard.hidden=true;logoutBtn.hidden=true;msg.textContent=text}
function showDashboard(user){loginView.hidden=true;dashboard.hidden=false;logoutBtn.hidden=false;$("adminIdentity").textContent=user.email||user.uid;msg.textContent=""}
function moneyHTG(n){return new Intl.NumberFormat("fr-HT",{style:"currency",currency:"HTG",maximumFractionDigits:2}).format(Number(n)||0)}
function safeDate(v){try{if(v?.toDate)return v.toDate().toLocaleString();if(v?.seconds)return new Date(v.seconds*1000).toLocaleString();if(v)return new Date(v).toLocaleString()}catch{}return"—"}
function escapeHtml(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function renderList(el,rows,type){if(!el)return;if(!rows?.length){el.innerHTML='<div class="empty">—</div>';return}el.innerHTML=rows.map(x=>type==="user"?`<div class="list-item"><div><strong>${escapeHtml(x.name||x.displayName||x.email||"Itilizatè")}</strong><small>${escapeHtml(x.email||"")}</small></div><span class="role">${escapeHtml(x.role||"buyer")}</span></div>`:`<div class="list-item"><div><strong>${escapeHtml(x.id||"Kòmand")}</strong><small>${escapeHtml(x.status||"pending")} · ${safeDate(x.createdAtMs||x.createdAt)}</small></div><span class="role">${escapeHtml(String(x.currency||"HTG"))}</span></div>`).join("")}
function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null")}catch{return null}}
function writeCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify(data))}catch{}}
function renderSnapshot(s){if(!s)return;const set=(id,v)=>{if(v!==undefined&&v!==null)$(id).textContent=v};set("adminUsersCount",s.userCount);set("adminSellersCount",s.sellerCount);set("adminProductsCount",s.productCount);set("adminOrdersCount",s.orderCount);set("adminPaidOrdersCount",s.paidCount);if(s.commission!==undefined)set("adminCommissionTotal",moneyHTG(s.commission));renderList($("adminUsersList"),s.recentUsers||[],"user");renderList($("adminOrdersList"),s.recentOrders||[],"order")}
function timeout(p,ms=8000){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Error("TIMEOUT")),ms))])}
async function readCollection(name){try{const s=await timeout(getDocs(query(collection(db,name),limit(MAX_DOCS))),8000);return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn("admin read",name,e);return null}}
function ts(v){try{return v?.toMillis?.()||v?.seconds*1000||new Date(v||0).getTime()||0}catch{return 0}}
function compactUser(u){return{id:u.id,name:u.name||"",displayName:u.displayName||"",email:u.email||"",role:u.role||"buyer",createdAtMs:ts(u.createdAt)}}
function compactOrder(o){return{id:o.id,status:o.status||"pending",currency:o.currency||"HTG",createdAtMs:ts(o.createdAt),total:Number(o.total||0)}}

async function loadAdminData(force=false){
 if(loading)return;
 const cache=readCache();
 if(cache)renderSnapshot(cache);
 if(!force&&cache?.savedAt&&Date.now()-cache.savedAt<30000){status.textContent="";return}
 loading=true;status.textContent=tr("loading");
 try{
  const [users,products,orders]=await Promise.all([readCollection("users"),readCollection("products"),readCollection("orders")]);
  const prev=cache||{};const next={...prev,savedAt:Date.now()};let changed=false;
  if(users){next.userCount=users.length+(users.length===MAX_DOCS?"+":"");next.sellerCount=users.filter(u=>String(u.role||"").toLowerCase()==="seller").length;next.recentUsers=[...users].sort((a,b)=>ts(b.createdAt)-ts(a.createdAt)).slice(0,8).map(compactUser);changed=true}
  if(products){next.productCount=products.length+(products.length===MAX_DOCS?"+":"");changed=true}
  if(orders){const paid=orders.filter(o=>["paid","completed","success"].includes(String(o.status||"").toLowerCase()));next.orderCount=orders.length+(orders.length===MAX_DOCS?"+":"");next.paidCount=paid.length;next.recentOrders=[...orders].sort((a,b)=>ts(b.createdAt)-ts(a.createdAt)).slice(0,8).map(compactOrder);let commission=0;for(const o of paid){const direct=Number(o.platformCommission??o.platformFee??o.commission);if(Number.isFinite(direct)&&direct>0)commission+=direct;else commission+=Number(o.subtotal??o.totalProducts??o.total??0)*.10}next.commission=commission;changed=true}
  if(changed){writeCache(next);renderSnapshot(next);lastLoadAt=Date.now();status.textContent=""}else status.textContent=tr("loadError");
 }catch(e){console.error(e);status.textContent=tr("loadError")}finally{loading=false}
}

async function verifyAdmin(user){if(!user){showLogin();return}try{const snap=await timeout(getDoc(doc(db,"users",user.uid)),8000);const role=String(snap.data()?.role||"").toLowerCase();if(role!=="admin"){await signOut(auth);showLogin(tr("denied"));return}showDashboard(user);const cache=readCache();if(cache)renderSnapshot(cache);setTimeout(()=>loadAdminData(false),150)}catch(e){console.error(e);showLogin(tr("loadError"))}}

$("adminLoginForm").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="";const btn=$("adminLoginBtn");btn.disabled=true;try{await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value)}catch(err){msg.textContent=err.code==="auth/invalid-credential"?"Imèl oswa modpas pa kòrèk.":err.message||"Connexion impossible"}finally{btn.disabled=false}});
logoutBtn.addEventListener("click",()=>signOut(auth));$("refreshAdminBtn").addEventListener("click",()=>loadAdminData(true));onAuthStateChanged(auth,verifyAdmin);

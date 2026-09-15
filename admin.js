import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,doc,getDoc,collection,getDocs,getCountFromServer,query,where,orderBy,limit}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const loginView=$("adminLoginView"),dashboard=$("adminDashboard"),logoutBtn=$("adminLogoutBtn"),msg=$("adminLoginMessage"),status=$("adminStatus");

const T={
ht:{adminAccess:"Aksè Administrasyon",adminOnly:"Paj sa a rezève sèlman pou kont ki gen wòl admin.",email:"Imèl",password:"Modpas",login:"Konekte kòm Admin",logout:"Dekonekte",backShop:"← Retounen nan Mystro-Shop",secureSpace:"ESPAS SEKIRIZE",dashboard:"Tablo de bò Admin",users:"Itilizatè",sellers:"Vandè",products:"Pwodwi",orders:"Kòmand",paidOrders:"Kòmand peye",platformCommission:"Komisyon platfòm",recentUsers:"Dènye itilizatè",recentOrders:"Dènye kòmand",refresh:"Rafrechi",controlCenter:"Sant kontwòl",wallet:"Pòtfèy",statistics:"Estatistik",denied:"Kont sa a pa gen otorizasyon admin.",loading:"Ap chaje rezime admin...",loadError:"Nou pa t kapab chaje kèk done admin."},
fr:{adminAccess:"Accès Administration",adminOnly:"Cette page est réservée aux comptes ayant le rôle admin.",email:"E-mail",password:"Mot de passe",login:"Se connecter comme Admin",logout:"Déconnexion",backShop:"← Retour à Mystro-Shop",secureSpace:"ESPACE SÉCURISÉ",dashboard:"Tableau de bord Admin",users:"Utilisateurs",sellers:"Vendeurs",products:"Produits",orders:"Commandes",paidOrders:"Commandes payées",platformCommission:"Commission plateforme",recentUsers:"Utilisateurs récents",recentOrders:"Commandes récentes",refresh:"Actualiser",controlCenter:"Centre de contrôle",wallet:"Portefeuille",statistics:"Statistiques",denied:"Ce compte n'a pas l'autorisation administrateur.",loading:"Chargement du résumé admin...",loadError:"Certaines données admin n'ont pas pu être chargées."},
en:{adminAccess:"Administration Access",adminOnly:"This page is only for accounts with the admin role.",email:"Email",password:"Password",login:"Sign in as Admin",logout:"Sign out",backShop:"← Back to Mystro-Shop",secureSpace:"SECURE AREA",dashboard:"Admin Dashboard",users:"Users",sellers:"Sellers",products:"Products",orders:"Orders",paidOrders:"Paid orders",platformCommission:"Platform commission",recentUsers:"Recent users",recentOrders:"Recent orders",refresh:"Refresh",controlCenter:"Control center",wallet:"Wallet",statistics:"Statistics",denied:"This account does not have admin permission.",loading:"Loading admin overview...",loadError:"Some admin data could not be loaded."},
es:{adminAccess:"Acceso de Administración",adminOnly:"Esta página está reservada a cuentas con rol de administrador.",email:"Correo",password:"Contraseña",login:"Entrar como Admin",logout:"Cerrar sesión",backShop:"← Volver a Mystro-Shop",secureSpace:"ÁREA SEGURA",dashboard:"Panel de Admin",users:"Usuarios",sellers:"Vendedores",products:"Productos",orders:"Pedidos",paidOrders:"Pedidos pagados",platformCommission:"Comisión de plataforma",recentUsers:"Usuarios recientes",recentOrders:"Pedidos recientes",refresh:"Actualizar",controlCenter:"Centro de control",wallet:"Cartera",statistics:"Estadísticas",denied:"Esta cuenta no tiene permiso de administrador.",loading:"Cargando resumen de administrador...",loadError:"No se pudieron cargar algunos datos de administrador."}
};
let lang=localStorage.getItem("mystroAdminLang")||"ht",loading=false;
function tr(k){return T[lang]?.[k]||T.ht[k]||k}
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll("[data-t]").forEach(el=>el.textContent=tr(el.dataset.t));$("adminLanguage").value=lang}
$("adminLanguage").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("mystroAdminLang",lang);applyLang()});applyLang();

function showLogin(text=""){loginView.hidden=false;dashboard.hidden=true;logoutBtn.hidden=true;msg.textContent=text}
function showDashboard(user){loginView.hidden=true;dashboard.hidden=false;logoutBtn.hidden=false;$("adminIdentity").textContent=user.email||user.uid;msg.textContent=""}
function moneyHTG(n){return new Intl.NumberFormat("fr-HT",{style:"currency",currency:"HTG",maximumFractionDigits:2}).format(Number(n)||0)}
function safeDate(v){try{if(v?.toDate)return v.toDate().toLocaleString();if(v)return new Date(v).toLocaleString()}catch{}return"—"}
function escapeHtml(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function renderList(el,rows,type){if(!el)return;if(!rows.length){el.innerHTML='<div class="empty">—</div>';return}el.innerHTML=rows.map(x=>type==="user"?`<div class="list-item"><div><strong>${escapeHtml(x.name||x.displayName||x.email||"Itilizatè")}</strong><small>${escapeHtml(x.email||"")}</small></div><span class="role">${escapeHtml(x.role||"buyer")}</span></div>`:`<div class="list-item"><div><strong>${escapeHtml(x.id||"Kòmand")}</strong><small>${escapeHtml(x.status||"pending")} · ${safeDate(x.createdAt)}</small></div><span class="role">${escapeHtml(String(x.currency||"HTG"))}</span></div>`).join("")}
async function countOf(ref){try{return (await getCountFromServer(ref)).data().count||0}catch(e){console.warn("count",e);return 0}}
async function recent(ref,n=8){try{return (await getDocs(query(ref,orderBy("createdAt","desc"),limit(n)))).docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn("recent ordered",e);try{return (await getDocs(query(ref,limit(n)))).docs.map(d=>({id:d.id,...d.data()}))}catch{return[]}}}

async function loadAdminData(){
 if(loading)return;loading=true;status.textContent=tr("loading");
 try{
  const usersRef=collection(db,"users"),productsRef=collection(db,"products"),ordersRef=collection(db,"orders");
  const paidQuery=query(ordersRef,where("status","in",["paid","completed","success"]));
  const [userCount,sellerCount,productCount,orderCount,paidCount,recentUsers,recentOrders,recentPaid]=await Promise.all([
    countOf(usersRef),countOf(query(usersRef,where("role","==","seller"))),countOf(productsRef),countOf(ordersRef),countOf(paidQuery),recent(usersRef,8),recent(ordersRef,8),
    getDocs(query(paidQuery,limit(100))).then(s=>s.docs.map(d=>d.data())).catch(()=>[])
  ]);
  let commission=0;for(const o of recentPaid){const direct=Number(o.platformCommission??o.platformFee??o.commission);if(Number.isFinite(direct)&&direct>0)commission+=direct;else{const gross=Number(o.subtotal??o.totalProducts??o.total??0);commission+=gross*.10}}
  $("adminUsersCount").textContent=userCount;$("adminSellersCount").textContent=sellerCount;$("adminProductsCount").textContent=productCount;$("adminOrdersCount").textContent=orderCount;$("adminPaidOrdersCount").textContent=paidCount;$("adminCommissionTotal").textContent=moneyHTG(commission);
  renderList($("adminUsersList"),recentUsers,"user");renderList($("adminOrdersList"),recentOrders,"order");status.textContent="";
 }catch(e){console.error(e);status.textContent=tr("loadError")}finally{loading=false}
}

async function verifyAdmin(user){if(!user){showLogin();return}try{const snap=await getDoc(doc(db,"users",user.uid));const role=String(snap.data()?.role||"").toLowerCase();if(role!=="admin"){await signOut(auth);showLogin(tr("denied"));return}showDashboard(user);loadAdminData()}catch(e){console.error(e);showLogin(tr("loadError"))}}

$("adminLoginForm").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="";const btn=$("adminLoginBtn");btn.disabled=true;try{await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value)}catch(err){msg.textContent=err.code==="auth/invalid-credential"?"Imèl oswa modpas pa kòrèk.":err.message||"Connexion impossible"}finally{btn.disabled=false}});
logoutBtn.addEventListener("click",()=>signOut(auth));$("refreshAdminBtn").addEventListener("click",loadAdminData);onAuthStateChanged(auth,verifyAdmin);

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, doc, serverTimestamp, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const firebaseConfig = {
  apiKey: "AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",
  authDomain: "mystroshop-eab92.firebaseapp.com",
  projectId: "mystroshop-eab92",
  storageBucket: "mystroshop-eab92.firebasestorage.app",
  messagingSenderId: "104073035061",
  appId: "1:104073035061:web:59d2779f2db7a8a3be207c",
  measurementId: "G-QTLV6VFLXQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const supabase = createClient("https://cesfjdrlnfxffrtoggoz.supabase.co", "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu");

const API = "https://mystroshop-api.castormystro.workers.dev";
const BUCKET = "product-images";
const MAX_IMG = 5 * 1024 * 1024;
const IMG_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const CURRENCIES = ["HTG", "USD", "EUR", "CAD", "GBP", "DOP", "XOF"];
const SYMBOL = { HTG: "G", USD: "$", EUR: "€", CAD: "CA$", GBP: "£", DOP: "RD$", XOF: "CFA" };
const DELIVERY = { HTG: 1000, USD: 5, EUR: 5 };
const ADMIN_PERIODS = [7, 15, 30, 90];
const FALLBACK_FX = { base: "USD", rates: { USD: 1, HTG: 131, EUR: 0.86, CAD: 1.36, GBP: 0.74, DOP: 63.5, XOF: 565 }, updated: null };

const TXT = {
  fr: {
    welcomeLead:"Achetez, vendez et développez votre activité partout dans le monde.", internationalMarket:"Marché international", internationalMarketCaps:"MYSTRO-SHOP — MARCHÉ INTERNATIONAL", home:"Accueil", dashboard:"Tableau de bord", products:"Produits", sell:"Vendre", wallet:"Portefeuille", statistics:"Statistiques", clients:"Clients actifs", orders:"Commandes", history:"Historique d'achat", chat:"Chat", comments:"Commentaires", services:"Services", profile:"Profil", help:"Aide", logout:"Déconnexion", login:"Se connecter", register:"S'inscrire", search:"Rechercher sur Mystro-Shop...", welcome:"Bienvenue à Mystro-Shop", subtitle:"Achetez et vendez facilement partout dans le monde.", discover:"Découvrir les produits", sellProduct:"Vendre un produit", popular:"Produits populaires", publish:"Publier le produit", cart:"Panier", subtotal:"Sous-total", delivery:"Livraison à domicile", total:"Total", checkout:"Placer la commande / Paiement", emptyCart:"Votre panier est vide.", saved:"Enregistré.", loading:"Chargement...", unavailable:"Service externe non configuré.", balance:"Solde disponible", exchange:"Échange de monnaie", saveProfile:"Enregistrer le profil", assistantHello:"Bonjour 👋 Comment puis-je vous aider ?", commentSaved:"Commentaire publié.", notificationEmpty:"Aucune nouvelle notification.", liveRate:"Taux en ligne", fallbackRate:"Taux de secours", revenue:"💰 Revenus", sales:"Ventes", publishProductTitle:"Publier un produit", productName:"Nom du produit", category:"Catégorie", currency:"Devise", price:"Prix", discount:"Réduction (%)", photos:"Photos (1 à 5)", description:"Description", moncashDeposit:"Dépôt MonCash", moncashWithdraw:"Retrait MonCash", natcashDeposit:"Dépôt NatCash", natcashWithdraw:"Retrait NatCash", deliveryRule:"Frais par produit : 5 USD / 5 EUR / 1000 HTG", periodSales:"Ventes période", unitsSold:"Produits vendus", productAmount:"Montant produits", platformProfit:"Profit plateforme", sellers:"Vendeurs", allSales:"Total des ventes", paidOrders:"Commandes payées", types:"Types", amount:"Montant", topProduct:"Plus demandé", writeMessage:"Écrire un message...", send:"Envoyer", marketplaceService:"Marketplace internationale", internationalDelivery:"Livraison internationale", deliveryProviderNote:"Organisation sécurisée selon le transporteur disponible.", walletService:"Portefeuille Mystro-Shop", marketing:"Marketing", virtualAssistant:"Assistance virtuelle", accountType:"Type de compte", lastName:"Nom", firstName:"Prénom", address:"Adresse", phone:"Téléphone", country:"Pays", helpSell:"Ouvrez Vendre, ajoutez les informations du produit et jusqu'à cinq photos.", payment:"Paiement", helpPay:"Rechargez le compte Mystro-Shop puis payez depuis le portefeuille. Un paiement n'est final qu'après confirmation sécurisée.", helpDelivery:"Les frais de livraison à domicile sont affichés séparément et payés avant la livraison.", email:"E-mail", password:"Mot de passe", buyer:"Acheteur", seller:"Vendeur", forgotPassword:"Mot de passe oublié ?", writeComment:"Votre commentaire...", notifications:"Notifications", walletTopup:"Recharge portefeuille", provider:"Prestataire", amountHTG:"Montant HTG", continue:"Continuer", verifyTopup:"Vérifier une recharge en attente", withdraw:"Retrait", submitRequest:"Envoyer la demande", from:"De", to:"Vers", transferRequest:"Demande de transfert", method:"Méthode", details:"Détails du bénéficiaire", askQuestion:"Écrivez votre question..."
  },
  ht: {
    welcomeLead:"Achte, vann epi devlope aktivite ou toupatou nan mond lan.", internationalMarket:"Mache entènasyonal", internationalMarketCaps:"MYSTRO-SHOP — MACHE ENTÈNASYONAL", home:"Akèy", dashboard:"Tablo bò", products:"Pwodwi", sell:"Vann", wallet:"Pòtfèy", statistics:"Estatistik", clients:"Kliyan aktif", orders:"Kòmand", history:"Istwa acha", chat:"Chat", comments:"Kòmantè", services:"Sèvis", profile:"Pwofil", help:"Èd", logout:"Dekonekte", login:"Konekte", register:"Enskri", search:"Chèche sou Mystro-Shop...", welcome:"Byenveni sou Mystro-Shop", subtitle:"Achte ak vann fasil toupatou nan mond lan.", discover:"Dekouvri pwodwi yo", sellProduct:"Vann yon pwodwi", popular:"Pwodwi popilè", publish:"Pibliye pwodwi a", cart:"Panyen", subtotal:"Sou-total", delivery:"Livrezon lakay", total:"Total", checkout:"Mete kòmand / Peman", emptyCart:"Panyen ou vid.", saved:"Anrejistre.", loading:"Ap chaje...", unavailable:"Sèvis ekstèn nan poko konfigire.", balance:"Balans disponib", exchange:"Echanj lajan", saveProfile:"Anrejistre pwofil", assistantHello:"Bonjou 👋 Kijan mwen ka ede w?", commentSaved:"Kòmantè a pibliye.", notificationEmpty:"Pa gen nouvo notifikasyon.", liveRate:"To sou entènèt", fallbackRate:"To sekou", revenue:"💰 Revni", sales:"Vant", publishProductTitle:"Pibliye yon pwodwi", productName:"Non pwodwi", category:"Kategori", currency:"Lajan", price:"Pri", discount:"Rabè (%)", photos:"Foto (1 a 5)", description:"Deskripsyon", moncashDeposit:"Depo MonCash", moncashWithdraw:"Retrè MonCash", natcashDeposit:"Depo NatCash", natcashWithdraw:"Retrè NatCash", deliveryRule:"Frè pa pwodwi: 5 USD / 5 EUR / 1000 HTG", periodSales:"Vant peryòd", unitsSold:"Pwodwi vann", productAmount:"Montan pwodwi", platformProfit:"Pwofi platfòm", sellers:"Vandè", allSales:"Total vant", paidOrders:"Kòmand peye", types:"Kalite", amount:"Montan", topProduct:"Pi mande", writeMessage:"Ekri yon mesaj...", send:"Voye", marketplaceService:"Mache entènasyonal", internationalDelivery:"Livrezon entènasyonal", deliveryProviderNote:"Òganizasyon sekirize selon transpòtè ki disponib.", walletService:"Pòtfèy Mystro-Shop", marketing:"Maketing", virtualAssistant:"Asistan vityèl", accountType:"Kalite kont", lastName:"Siyati", firstName:"Prenon", address:"Adrès", phone:"Telefòn", country:"Peyi", helpSell:"Louvri Vann, mete enfòmasyon pwodwi a epi ajoute jiska senk foto.", payment:"Peman", helpPay:"Rechaje kont Mystro-Shop epi peye ak pòtfèy la. Peman an final sèlman apre konfimasyon sekirize.", helpDelivery:"Frè livrezon lakay la parèt apa epi li peye anvan livrezon.", email:"Imèl", password:"Modpas", buyer:"Achtè", seller:"Vandè", forgotPassword:"Ou bliye modpas la?", writeComment:"Kòmantè ou...", notifications:"Notifikasyon", walletTopup:"Rechaje pòtfèy", provider:"Founisè", amountHTG:"Montan HTG", continue:"Kontinye", verifyTopup:"Verifye yon rechaj annatant", withdraw:"Retrè", submitRequest:"Voye demann lan", from:"Soti nan", to:"Ale nan", transferRequest:"Demann transfè", method:"Metòd", details:"Detay benefisyè", askQuestion:"Ekri kestyon ou..."
  },
  en: {
    welcomeLead:"Buy, sell and grow your activity anywhere in the world.", internationalMarket:"International marketplace", internationalMarketCaps:"MYSTRO-SHOP — INTERNATIONAL MARKETPLACE", home:"Home", dashboard:"Dashboard", products:"Products", sell:"Sell", wallet:"Wallet", statistics:"Statistics", clients:"Active clients", orders:"Orders", history:"Purchase history", chat:"Chat", comments:"Comments", services:"Services", profile:"Profile", help:"Help", logout:"Log out", login:"Log in", register:"Sign up", search:"Search Mystro-Shop...", welcome:"Welcome to Mystro-Shop", subtitle:"Buy and sell easily around the world.", discover:"Discover products", sellProduct:"Sell a product", popular:"Popular products", publish:"Publish product", cart:"Cart", subtotal:"Subtotal", delivery:"Home delivery", total:"Total", checkout:"Place order / Payment", emptyCart:"Your cart is empty.", saved:"Saved.", loading:"Loading...", unavailable:"External service is not configured.", balance:"Available balance", exchange:"Currency exchange", saveProfile:"Save profile", assistantHello:"Hello 👋 How can I help?", commentSaved:"Comment posted.", notificationEmpty:"No new notifications.", liveRate:"Live rate", fallbackRate:"Fallback rate", revenue:"💰 Revenue", sales:"Sales", publishProductTitle:"Publish a product", productName:"Product name", category:"Category", currency:"Currency", price:"Price", discount:"Discount (%)", photos:"Photos (1 to 5)", description:"Description", moncashDeposit:"MonCash deposit", moncashWithdraw:"MonCash withdrawal", natcashDeposit:"NatCash deposit", natcashWithdraw:"NatCash withdrawal", deliveryRule:"Fee per product: 5 USD / 5 EUR / 1000 HTG", periodSales:"Period sales", unitsSold:"Units sold", productAmount:"Product amount", platformProfit:"Platform profit", sellers:"Sellers", allSales:"Total sales", paidOrders:"Paid orders", types:"Types", amount:"Amount", topProduct:"Most requested", writeMessage:"Write a message...", send:"Send", marketplaceService:"International marketplace", internationalDelivery:"International delivery", deliveryProviderNote:"Secure arrangement according to the available carrier.", walletService:"Mystro-Shop wallet", marketing:"Marketing", virtualAssistant:"Virtual assistant", accountType:"Account type", lastName:"Last name", firstName:"First name", address:"Address", phone:"Phone", country:"Country", helpSell:"Open Sell, add the product information and up to five photos.", payment:"Payment", helpPay:"Top up your Mystro-Shop account, then pay from the wallet. Payment is final only after secure confirmation.", helpDelivery:"Home delivery fees are shown separately and paid before delivery.", email:"Email", password:"Password", buyer:"Buyer", seller:"Seller", forgotPassword:"Forgot password?", writeComment:"Your comment...", notifications:"Notifications", walletTopup:"Wallet top-up", provider:"Provider", amountHTG:"Amount HTG", continue:"Continue", verifyTopup:"Verify pending top-up", withdraw:"Withdrawal", submitRequest:"Submit request", from:"From", to:"To", transferRequest:"Transfer request", method:"Method", details:"Beneficiary details", askQuestion:"Write your question..."
  },
  es: {
    welcomeLead:"Compre, venda y desarrolle su actividad en todo el mundo.", internationalMarket:"Mercado internacional", internationalMarketCaps:"MYSTRO-SHOP — MERCADO INTERNACIONAL", home:"Inicio", dashboard:"Panel", products:"Productos", sell:"Vender", wallet:"Cartera", statistics:"Estadísticas", clients:"Clientes activos", orders:"Pedidos", history:"Historial de compras", chat:"Chat", comments:"Comentarios", services:"Servicios", profile:"Perfil", help:"Ayuda", logout:"Cerrar sesión", login:"Iniciar sesión", register:"Registrarse", search:"Buscar en Mystro-Shop...", welcome:"Bienvenido a Mystro-Shop", subtitle:"Compre y venda fácilmente en todo el mundo.", discover:"Descubrir productos", sellProduct:"Vender un producto", popular:"Productos populares", publish:"Publicar producto", cart:"Carrito", subtotal:"Subtotal", delivery:"Entrega a domicilio", total:"Total", checkout:"Realizar pedido / Pago", emptyCart:"Su carrito está vacío.", saved:"Guardado.", loading:"Cargando...", unavailable:"El servicio externo no está configurado.", balance:"Saldo disponible", exchange:"Cambio de moneda", saveProfile:"Guardar perfil", assistantHello:"Hola 👋 ¿Cómo puedo ayudar?", commentSaved:"Comentario publicado.", notificationEmpty:"No hay nuevas notificaciones.", liveRate:"Tasa en línea", fallbackRate:"Tasa de respaldo", revenue:"💰 Ingresos", sales:"Ventas", publishProductTitle:"Publicar un producto", productName:"Nombre del producto", category:"Categoría", currency:"Moneda", price:"Precio", discount:"Descuento (%)", photos:"Fotos (1 a 5)", description:"Descripción", moncashDeposit:"Depósito MonCash", moncashWithdraw:"Retiro MonCash", natcashDeposit:"Depósito NatCash", natcashWithdraw:"Retiro NatCash", deliveryRule:"Tarifa por producto: 5 USD / 5 EUR / 1000 HTG", periodSales:"Ventas del período", unitsSold:"Productos vendidos", productAmount:"Monto de productos", platformProfit:"Beneficio de la plataforma", sellers:"Vendedores", allSales:"Ventas totales", paidOrders:"Pedidos pagados", types:"Tipos", amount:"Monto", topProduct:"Más solicitado", writeMessage:"Escriba un mensaje...", send:"Enviar", marketplaceService:"Mercado internacional", internationalDelivery:"Entrega internacional", deliveryProviderNote:"Organización segura según el transportista disponible.", walletService:"Cartera Mystro-Shop", marketing:"Marketing", virtualAssistant:"Asistente virtual", accountType:"Tipo de cuenta", lastName:"Apellido", firstName:"Nombre", address:"Dirección", phone:"Teléfono", country:"País", helpSell:"Abra Vender, agregue la información del producto y hasta cinco fotos.", payment:"Pago", helpPay:"Recargue la cuenta Mystro-Shop y pague desde la cartera. El pago es final solo después de una confirmación segura.", helpDelivery:"Los gastos de entrega a domicilio se muestran por separado y se pagan antes de la entrega.", email:"Correo electrónico", password:"Contraseña", buyer:"Comprador", seller:"Vendedor", forgotPassword:"¿Olvidó su contraseña?", writeComment:"Su comentario...", notifications:"Notificaciones", walletTopup:"Recarga de cartera", provider:"Proveedor", amountHTG:"Monto HTG", continue:"Continuar", verifyTopup:"Verificar recarga pendiente", withdraw:"Retiro", submitRequest:"Enviar solicitud", from:"De", to:"A", transferRequest:"Solicitud de transferencia", method:"Método", details:"Datos del beneficiario", askQuestion:"Escriba su pregunta..."
  }
};

const state = {
  user: null,
  profile: null,
  products: [],
  orders: [],
  users: [],
  comments: [],
  notifications: [],
  cart: loadJSON("mystroCart", []),
  language: localStorage.getItem("mystroLanguage") || "fr",
  currency: localStorage.getItem("mystroCurrency") || "HTG",
  delivery: localStorage.getItem("mystroDelivery") === "1",
  balanceHidden: localStorage.getItem("mystroBalanceHidden") === "1",
  fx: FALLBACK_FX,
  fxLive: false,
  adminPeriod: Number(localStorage.getItem("mystroAdminPeriod")) || 7,
  currentPage: "home",
  charts: {}
};

const $ = id => document.getElementById(id);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const t = key => TXT[state.language]?.[key] || TXT.fr[key] || key;
function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function norm(v=""){ return String(v).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function esc(v=""){ return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function role(){ const r=norm(state.profile?.role); return ["seller","vendeur"].includes(r)?"seller":["admin","administrateur","administrator"].includes(r)?"admin":"buyer"; }
function money(n, currency=state.currency){ return `${SYMBOL[currency]||currency} ${(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
function toast(message, type="info"){ let x=$("mystroToast"); if(!x){ x=document.createElement("div"); x.id="mystroToast"; document.body.appendChild(x); } x.className=`toast ${type}`; x.textContent=message; x.style.opacity="1"; clearTimeout(toast.timer); toast.timer=setTimeout(()=>x.style.opacity="0",3500); }
function busy(button,on,text=""){ if(!button)return; if(on){ button.dataset.old=button.textContent; button.disabled=true; button.textContent=text||t("loading"); } else { button.disabled=false; button.textContent=button.dataset.old||button.textContent; } }
function toMillis(v){ if(!v)return 0; if(v.toDate)return v.toDate().getTime(); if(v.seconds)return v.seconds*1000; const n=new Date(v).getTime(); return Number.isFinite(n)?n:0; }

async function api(path, body=null, method="POST"){
  const headers={"Content-Type":"application/json"};
  if(auth.currentUser) headers.Authorization=`Bearer ${await auth.currentUser.getIdToken(false)}`;
  const response=await fetch(API+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw Error(data.error||data.message||`HTTP_${response.status}`);
  return data;
}

async function loadFx(){
  try{ state.fx=await api("/fx/rates",null,"GET"); state.fxLive=!!state.fx?.rates; }
  catch{
    try{ const response=await fetch("https://open.er-api.com/v6/latest/USD"); const data=await response.json(); if(response.ok&&data.result==="success"){ state.fx={base:"USD",rates:data.rates,updated:data.time_last_update_utc||null}; state.fxLive=true; } }
    catch{}
  }
  updateFxLabel(); renderProducts(); renderCart();
}
function updateFxLabel(){ ["fxStatus","fxStatusWallet"].forEach(id=>{ if($(id)) $(id).textContent=state.fxLive?`${t("liveRate")}${state.fx.updated?` · ${state.fx.updated}`:""}`:t("fallbackRate"); }); }
function convert(n,from,to){ const rates=state.fx?.rates||FALLBACK_FX.rates,a=Number(rates[from]),b=Number(rates[to]); return !a||!b?Number(n)||0:(Number(n)||0)/a*b; }

function applyLanguage(lang){
  if(!TXT[lang]) lang="fr";
  state.language=lang; localStorage.setItem("mystroLanguage",lang); document.documentElement.lang=lang;
  $$('[data-i18n]').forEach(el=>{ const key=el.dataset.i18n; if(TXT[lang][key]) el.textContent=TXT[lang][key]; });
  $$('[data-i18n-placeholder]').forEach(el=>{ const key=el.dataset.i18nPlaceholder; if(TXT[lang][key]) el.placeholder=TXT[lang][key]; });
  if($("languageSelector")) $("languageSelector").value=lang;
  applyRoleUI(); renderProducts(); renderCart(); renderOrders(); renderComments(); renderNotifications(); updateFxLabel(); updateAuthModeText();
}

function openPage(page){
  const el=$(`${page}Page`); if(!el)return;
  $$('.app-page').forEach(x=>x.classList.remove('active-page')); el.classList.add('active-page'); state.currentPage=page;
  $$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page)); $("mobileNav")?.classList.remove("open");
  if(page==="profile")renderProfile(); if(page==="orders")renderOrders(); if(page==="comments")renderComments(); if(["dashboard","statistics"].includes(page))refreshStats(); window.scrollTo(0,0);
}
function applyRoleUI(){
  const r=role();
  const sets={ buyer:["home","dashboard","products","wallet","cart","orders","chat","services","profile","help"], seller:["home","dashboard","products","sell","wallet","statistics","cart","orders","chat","comments","services","profile","help"], admin:["home","dashboard","products","sell","wallet","statistics","clients","cart","orders","chat","comments","services","profile","help"] };
  const allowed=new Set(sets[r]);
  $$('#mobileNav [data-page]').forEach(b=>b.hidden=!allowed.has(b.dataset.page));
  $$('#homePage [data-page="sell"]').forEach(b=>b.hidden=r==="buyer");
  if($("ordersHeading"))$("ordersHeading").textContent=r==="buyer"?t("history"):t("orders");
  const pageOrder=document.querySelector('#ordersPage .page-title h2'); if(pageOrder)pageOrder.textContent=r==="buyer"?t("history"):t("orders");
  if($("adminStatsPanel"))$("adminStatsPanel").hidden=r!=="admin";
  if(state.user && !allowed.has(state.currentPage))openPage("home");
}
function setupNav(){
  $("menuBtn")?.addEventListener("click",()=>$("mobileNav")?.classList.toggle("open"));
  $$('[data-page]').forEach(b=>b.addEventListener("click",e=>{ e.preventDefault(); const page=b.dataset.page; if(page==="sell"&&role()==="buyer")return; openPage(page); }));
  $("profileBtn")?.addEventListener("click",()=>state.user?openPage("profile"):openAuth("login"));
}
function openModal(id){ const m=$(id); if(!m)return; m.classList.add("open"); m.setAttribute("aria-hidden","false"); }
function closeModal(id){ const m=$(id); if(!m)return; m.classList.remove("open"); m.setAttribute("aria-hidden","true"); }
function openAuth(mode="login"){ openModal("authModal"); setAuthMode(mode); }
function updateAuthModeText(){ const mode=$("authModal")?.dataset.mode||"login"; if($("authSubmitBtn"))$("authSubmitBtn").textContent=mode==="register"?t("register"):t("login"); }
function setAuthMode(mode){ const reg=mode==="register"; $("authModal").dataset.mode=mode; $("authRegisterFields").hidden=!reg; $("authCountry").required=reg; $("authPassword").autocomplete=reg?"new-password":"current-password"; $("forgotPasswordBtn").hidden=reg; $("loginTab").classList.toggle("active",!reg); $("registerTab").classList.toggle("active",reg); updateAuthModeText(); }

async function loadProfile(user){
  try{ const snap=await getDoc(doc(db,"users",user.uid)); if(snap.exists())return{id:snap.id,...snap.data()}; }
  catch(e){ console.warn("Profile",e); }
  return{name:user.email?.split("@")[0]||"Utilisateur",email:user.email||"",role:"buyer",balance:0,balances:{HTG:0}};
}
function balances(){ const p=state.profile||{},b={...(p.balances||{})}; if(!Number.isFinite(Number(b.HTG)))b.HTG=Number(p.balance)||0; return b; }
function renderProfile(){
  const p=state.profile||{},r=role(),b=balances(),name=p.name||[p.firstName,p.lastName].filter(Boolean).join(" ")||"Utilisateur",initial=name.charAt(0).toUpperCase();
  const values={profileName:name,profileEmail:p.email||state.user?.email||"",profileRole:r==="admin"?"Administrateur":r==="seller"?t("seller"):t("buyer"),profileLastName:p.lastName||"",profileFirstName:p.firstName||"",profileAddress:p.address||"",profilePhone:p.phone||"",profileCountry:p.country||""};
  Object.entries(values).forEach(([id,v])=>{ const el=$(id); if(!el)return; if("value" in el)el.value=v; else el.textContent=v; });
  if($("profileAvatar"))$("profileAvatar").textContent=initial; if($("profileBtn"))$("profileBtn").textContent=initial;
  const display=state.balanceHidden?"••••••":money(b[state.currency]||0,state.currency); if($("walletBalance"))$("walletBalance").textContent=display; if($("profileBalance"))$("profileBalance").textContent=display; if($("toggleBalanceBtn"))$("toggleBalanceBtn").textContent=state.balanceHidden?"🙈":"👁"; renderBalanceList();
}
function renderBalanceList(){ const c=$("balanceList"); if(!c)return; const b=balances(); c.innerHTML=CURRENCIES.map(cur=>`<div><span>${cur}</span><strong>${state.balanceHidden?"••••":money(b[cur]||0,cur)}</strong></div>`).join(""); }
async function saveProfile(){
  if(!auth.currentUser)return;
  const data={lastName:$("profileLastName")?.value.trim()||"",firstName:$("profileFirstName")?.value.trim()||"",address:$("profileAddress")?.value.trim()||"",phone:$("profilePhone")?.value.trim()||"",country:$("profileCountry")?.value.trim()||""}; data.name=`${data.firstName} ${data.lastName}`.trim();
  await setDoc(doc(db,"users",auth.currentUser.uid),data,{merge:true}); state.profile={...state.profile,...data}; renderProfile(); toast(t("saved"),"success");
}
function setupAuth(){
  $("welcomeLoginBtn")?.addEventListener("click",()=>openAuth("login"));
  $("welcomeRegisterBtn")?.addEventListener("click",()=>openAuth("register"));
  $$('[data-welcome-lang]').forEach(b=>b.addEventListener("click",()=>applyLanguage(b.dataset.welcomeLang)));
  $("loginTab")?.addEventListener("click",()=>setAuthMode("login")); $("registerTab")?.addEventListener("click",()=>setAuthMode("register"));
  $("logoutBtn")?.addEventListener("click",()=>signOut(auth)); $("profileLogoutBtn")?.addEventListener("click",()=>signOut(auth));
  $("saveProfileBtn")?.addEventListener("click",()=>saveProfile().catch(e=>toast(e.message||"Erreur","error")));
  $("toggleBalanceBtn")?.addEventListener("click",()=>{ state.balanceHidden=!state.balanceHidden; localStorage.setItem("mystroBalanceHidden",state.balanceHidden?"1":"0"); renderProfile(); });
  $("authForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const mode=$("authModal").dataset.mode||"login",email=$("authEmail").value.trim(),password=$("authPassword").value,lastName=$("authLastName").value.trim(),firstName=$("authFirstName").value.trim(),button=$("authSubmitBtn");
    if(!lastName||!firstName||!email||password.length<6)return toast("Informations incomplètes.","error");
    busy(button,true);
    try{
      if(mode==="register"){
        const credential=await createUserWithEmailAndPassword(auth,email,password);
        await setDoc(doc(db,"users",credential.user.uid),{lastName,firstName,name:`${firstName} ${lastName}`.trim(),email,role:$("authRole").value,country:$("authCountry").value.trim(),balance:0,balances:{HTG:0},createdAt:serverTimestamp()});
      }else{
        const credential=await signInWithEmailAndPassword(auth,email,password),profile=await loadProfile(credential.user);
        if((profile.lastName&&norm(profile.lastName)!==norm(lastName))||(profile.firstName&&norm(profile.firstName)!==norm(firstName))){ await signOut(auth); throw Error("Nom ou prénom incorrect."); }
      }
      closeModal("authModal"); $("authForm").reset(); setAuthMode("login");
    }catch(err){ toast(readableAuthError(err),"error"); }
    finally{ busy(button,false); }
  });
  $("forgotPasswordBtn")?.addEventListener("click",async()=>{ const email=$("authEmail").value.trim(); if(!email)return toast("Entrez votre e-mail.","error"); try{ await sendPasswordResetEmail(auth,email); toast("E-mail envoyé.","success"); }catch(e){ toast(readableAuthError(e),"error"); } });
}
function readableAuthError(err){ const code=String(err?.code||""); if(code.includes("email-already-in-use"))return"Cet e-mail est déjà utilisé."; if(code.includes("invalid-credential")||code.includes("wrong-password"))return"E-mail ou mot de passe incorrect."; if(code.includes("too-many-requests"))return"Trop de tentatives. Réessayez plus tard."; if(code.includes("network-request-failed"))return"Connexion internet indisponible."; return err?.message||"Connexion impossible."; }

const DEMO=[
  {id:"demo1",name:"Robe élégante",category:"Mode",price:24.99,currency:"USD",stock:12,imageUrls:["https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=80"],description:"Robe moderne."},
  {id:"demo2",name:"Sac tendance",category:"Accessoires",price:18.5,currency:"USD",stock:10,imageUrls:["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80"],description:"Sac moderne."}
];
async function loadProducts(){
  let arr=[];
  try{ const snap=await getDocs(query(collection(db,"products"),orderBy("createdAt","desc"),limit(150))); arr=snap.docs.map(d=>({id:d.id,...d.data()})); }
  catch{ try{ const snap=await getDocs(collection(db,"products")); arr=snap.docs.map(d=>({id:d.id,...d.data()})); }catch{} }
  state.products=arr.length?arr:DEMO; renderProducts(); handleDeepLink();
}
function finalPrice(p){ return (Number(p.price)||0)*(1-Math.max(0,Math.min(90,Number(p.discountPercent)||0))/100); }
function displayPrice(p){ return convert(finalPrice(p),String(p.currency||"HTG").toUpperCase(),state.currency); }
function card(p){ const imgs=p.imageUrls?.length?p.imageUrls:[p.imageUrl||p.image||"https://placehold.co/600x800?text=Mystro-Shop"],discount=Number(p.discountPercent)||0; return `<article class="product-card" data-product-id="${esc(p.id)}"><div class="product-media"><img src="${esc(imgs[0])}" alt="${esc(p.name||"Produit")}" loading="lazy">${discount?`<span class="discount">-${discount}%</span>`:""}</div><div class="product-body"><small>${esc(p.category||"Marketplace")}</small><h3>${esc(p.name||"Produit")}</h3><strong>${money(displayPrice(p))}</strong><div class="product-actions"><button type="button" data-details="${esc(p.id)}">👁</button><button type="button" data-comment="${esc(p.id)}">💬</button><button type="button" data-share="${esc(p.id)}">↗</button><button type="button" class="dark" data-cart="${esc(p.id)}">+</button></div></div></article>`; }
function renderProducts(){
  const q=norm($("searchInput")?.value||""),arr=state.products.filter(p=>!q||norm(`${p.name} ${p.category} ${p.description}`).includes(q)),html=arr.map(card).join("")||'<div class="empty-state">Aucun produit.</div>';
  [$("productsGrid"),$("productsContainer")].filter(Boolean).forEach(c=>c.innerHTML=html);
  $$('[data-cart]').forEach(b=>b.onclick=()=>addCart(b.dataset.cart)); $$('[data-share]').forEach(b=>b.onclick=()=>shareProduct(b.dataset.share)); $$('[data-details]').forEach(b=>b.onclick=()=>showProduct(b.dataset.details)); $$('[data-comment]').forEach(b=>b.onclick=()=>openComment(b.dataset.comment)); refreshStats();
}
function showProduct(id){ const p=state.products.find(x=>String(x.id)===String(id)); if(!p)return; const imgs=p.imageUrls?.length?p.imageUrls:[p.imageUrl||""]; $("productDetailBody").innerHTML=`<div class="detail-gallery">${imgs.map(x=>`<img src="${esc(x)}" alt="">`).join("")}</div><h2>${esc(p.name)}</h2><p>${esc(p.description||"")}</p><p><strong>${money(displayPrice(p))}</strong> · Stock ${Number(p.stock)||0}</p>`; openModal("productDetailModal"); }
function handleDeepLink(){ const id=new URLSearchParams(location.search).get("product"); if(id&&state.products.some(p=>String(p.id)===id))setTimeout(()=>showProduct(id),200); }
async function shareProduct(id){ const p=state.products.find(x=>String(x.id)===String(id)); if(!p)return; const url=`${location.origin}${location.pathname}?product=${encodeURIComponent(id)}`; try{ if(navigator.share)await navigator.share({title:p.name,text:`${p.name} — Mystro-Shop`,url}); else{ await navigator.clipboard.writeText(url); toast("Lien copié.","success"); } }catch(e){ if(e.name!=="AbortError")toast("Partage impossible.","error"); } }
function addCart(id){ const p=state.products.find(x=>String(x.id)===String(id)); if(!p)return; const x=state.cart.find(i=>String(i.id)===String(id)); if(x)x.qty=Math.min(Number(p.stock)||99,(Number(x.qty)||1)+1); else state.cart.push({...p,qty:1}); saveJSON("mystroCart",state.cart); renderCart(); toast("Produit ajouté au panier.","success"); }
function deliveryFee(){ if(!state.delivery)return 0; const units=state.cart.reduce((s,i)=>s+(Number(i.qty)||1),0); if(DELIVERY[state.currency]!=null)return DELIVERY[state.currency]*units; return convert(5,"USD",state.currency)*units; }
function renderCart(){
  const c=$("cartItems"); if(!c)return;
  if($("cartCount"))$("cartCount").textContent=state.cart.reduce((s,i)=>s+(Number(i.qty)||1),0);
  c.innerHTML=state.cart.length?state.cart.map(i=>`<div class="cart-line"><img src="${esc(i.imageUrls?.[0]||i.imageUrl||"https://placehold.co/100")}" alt=""><div><strong>${esc(i.name)}</strong><div>${money(displayPrice(i))}</div><div class="qty"><button type="button" data-minus="${esc(i.id)}">−</button><span>${i.qty||1}</span><button type="button" data-plus="${esc(i.id)}">+</button></div></div><button type="button" data-remove="${esc(i.id)}">×</button></div>`).join(""):`<div class="empty-state">${t("emptyCart")}</div>`;
  const sub=state.cart.reduce((s,i)=>s+displayPrice(i)*(Number(i.qty)||1),0),del=deliveryFee(); if($("cartSubtotal"))$("cartSubtotal").textContent=money(sub); if($("cartDeliveryFee"))$("cartDeliveryFee").textContent=money(del); if($("cartTotal"))$("cartTotal").textContent=money(sub+del); if($("homeDeliveryRequested"))$("homeDeliveryRequested").checked=state.delivery;
  $$('[data-minus]').forEach(b=>b.onclick=()=>qty(b.dataset.minus,-1)); $$('[data-plus]').forEach(b=>b.onclick=()=>qty(b.dataset.plus,1)); $$('[data-remove]').forEach(b=>b.onclick=()=>{ state.cart=state.cart.filter(x=>String(x.id)!==String(b.dataset.remove)); saveJSON("mystroCart",state.cart); renderCart(); });
}
function qty(id,delta){ const x=state.cart.find(i=>String(i.id)===String(id)); if(!x)return; const p=state.products.find(i=>String(i.id)===String(id)); x.qty=Math.max(1,Math.min(Number(p?.stock)||99,(Number(x.qty)||1)+delta)); saveJSON("mystroCart",state.cart); renderCart(); }

function validImg(file){ return file&&IMG_TYPES.includes(file.type)&&file.size<=MAX_IMG; }
function setupImages(){ $("productImage")?.addEventListener("change",e=>{ const files=[...e.target.files].slice(0,5),bad=files.find(f=>!validImg(f)); if(bad){ e.target.value=""; $("productImagePreview").innerHTML=""; return toast("Chaque photo doit être JPEG, PNG ou WebP et ≤ 5 Mo.","error"); } $("productImagePreview").innerHTML=files.map(f=>`<img src="${URL.createObjectURL(f)}" alt="">`).join(""); }); }
async function uploadImages(files){ const urls=[],paths=[]; for(const file of files){ const ext=(file.name.split('.').pop()||"jpg").toLowerCase(),path=`${auth.currentUser.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,result=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type}); if(result.error)throw Error(result.error.message); const url=supabase.storage.from(BUCKET).getPublicUrl(result.data.path).data.publicUrl; if(!url)throw Error("URL photo indisponible"); urls.push(url); paths.push(result.data.path); } return{urls,paths}; }
async function publishProduct(e){
  e.preventDefault(); if(!auth.currentUser)return openAuth("login"); if(!["seller","admin"].includes(role()))return toast("Fonction réservée aux vendeurs.","error");
  const files=[...$("productImage").files].slice(0,5); if(!files.length||files.some(f=>!validImg(f)))return toast("Ajoutez 1 à 5 photos valides.","error"); const button=$("publishProductBtn"); busy(button,true);
  try{ const upload=await uploadImages(files),data={name:$("productName").value.trim(),category:$("productCategory").value,currency:$("productCurrency").value,price:Number($("productPrice").value),discountPercent:Math.max(0,Math.min(90,Number($("productDiscount").value)||0)),stock:Math.max(1,Math.floor(Number($("productStock").value)||1)),description:$("productDescription").value.trim(),imageUrls:upload.urls,imagePaths:upload.paths,imageUrl:upload.urls[0],sellerId:auth.currentUser.uid,sellerEmail:auth.currentUser.email||"",sellerName:state.profile?.name||"Vendeur",status:"active",createdAt:serverTimestamp()}; if(!data.name||!data.price||data.price<=0)throw Error("Nom et prix requis"); const ref=await addDoc(collection(db,"products"),data); state.products.unshift({id:ref.id,...data}); $("productForm").reset(); $("productImagePreview").innerHTML=""; renderProducts(); toast("Produit publié.","success"); openPage("products"); }catch(err){ toast(`Publication échouée: ${err.message}`,"error"); }finally{ busy(button,false); }
}

async function openComment(productId){ if(!auth.currentUser)return openAuth("login"); $("commentProductId").value=productId; $("commentText").value=""; openModal("commentModal"); }
async function saveComment(){ const p=state.products.find(x=>String(x.id)===String($("commentProductId").value)),text=$("commentText").value.trim(); if(!p||!text)return; try{ await addDoc(collection(db,"comments"),{productId:p.id,productName:p.name,sellerId:p.sellerId||"",buyerId:auth.currentUser.uid,buyerName:state.profile?.name||auth.currentUser.email||"Client",text,createdAt:serverTimestamp()}); closeModal("commentModal"); toast(t("commentSaved"),"success"); await loadComments(); }catch(e){ toast("Commentaire impossible.","error"); } }
async function loadComments(){ state.comments=[]; if(!auth.currentUser)return; try{ let q; if(role()==="admin")q=query(collection(db,"comments"),limit(200)); else if(role()==="seller")q=query(collection(db,"comments"),where("sellerId","==",auth.currentUser.uid),limit(200)); else return renderComments(); const snap=await getDocs(q); state.comments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>toMillis(b.createdAt)-toMillis(a.createdAt)); }catch{} renderComments(); }
function renderComments(){ const c=$("commentsList"); if(!c)return; c.innerHTML=state.comments.length?state.comments.map(x=>`<div class="list-item"><strong>${esc(x.productName||"Produit")}</strong><p>${esc(x.text)}</p><small>${esc(x.buyerName||"Client")}</small></div>`).join(""):'<div class="empty-state">Aucun commentaire.</div>'; }

async function loadOrders(){
  state.orders=[]; if(!auth.currentUser)return;
  try{ const uid=auth.currentUser.uid,r=role(); let snaps=[]; if(r==="admin")snaps=[await getDocs(query(collection(db,"orders"),limit(500)))]; else if(r==="buyer")snaps=[await getDocs(query(collection(db,"orders"),where("buyerId","==",uid),limit(300)))]; else{ snaps=[await getDocs(query(collection(db,"orders"),where("sellerIds","array-contains",uid),limit(300)))]; }
    const map=new Map(); snaps.forEach(s=>s.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}))); state.orders=[...map.values()].sort((a,b)=>toMillis(b.createdAt)-toMillis(a.createdAt));
  }catch(e){ console.warn("Orders",e); }
  renderOrders(); refreshStats();
}
function sellerItems(order,uid=auth.currentUser?.uid){ const id=String(uid||""); if(!id)return[]; const items=Array.isArray(order.items)?order.items:[]; const matched=items.filter(i=>String(i.sellerId||"")===id); if(matched.length)return matched; if(String(order.sellerId||"")===id)return items; return[]; }
function orderSubtotal(order){ return convert(Number(order.subtotal)||Math.max(0,(Number(order.total)||0)-(Number(order.deliveryFee)||0)),order.currency||"HTG",state.currency); }
function sellerSubtotal(order,uid=auth.currentUser?.uid){ const items=sellerItems(order,uid); if(items.length)return items.reduce((sum,i)=>{ const qty=Math.max(1,Number(i.qty)||1),line=Number(i.lineTotal),raw=Number.isFinite(line)&&line>=0?line:(Number(i.unitPrice)||Number(i.price)||0)*qty; return sum+convert(raw,order.currency||"HTG",state.currency); },0); return String(order.sellerId||"")===String(uid||"")?orderSubtotal(order):0; }
function renderOrders(){ const c=$("ordersList"); if(!c)return; const r=role(),uid=auth.currentUser?.uid; c.innerHTML=state.orders.length?state.orders.map(o=>{ const amount=r==="seller"?sellerSubtotal(o,uid)*0.9:convert(Number(o.total)||0,o.currency||"HTG",state.currency); return `<div class="list-item"><strong>${esc(o.id)}</strong><span>${esc(o.status||"pending")}</span><small>${money(amount)}</small></div>`; }).join(""):'<div class="empty-state">Aucune commande.</div>'; }
async function loadUsers(){ state.users=[]; if(role()!=="admin")return; try{ const snap=await getDocs(collection(db,"users")); state.users=snap.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ console.warn("Users",e); } renderClients(); refreshStats(); }
function renderClients(){ const c=$("clientsList"); if(!c||role()!=="admin")return; const sellers=state.users.filter(u=>norm(u.role)==="seller"); c.innerHTML=sellers.length?sellers.map(s=>`<div class="list-item"><strong>${esc(s.name||"Vendeur")}</strong><span>${esc(s.country||"—")}</span></div>`).join(""):'<div class="empty-state">Aucun vendeur.</div>'; }
function paid(o){ return["paid","completed","successful","success"].includes(norm(o.status)); }
function aggregate(arr,uid=null){ let gross=0,units=0; const pc=new Map(),types=new Set(); arr.forEach(o=>{ const items=uid?sellerItems(o,uid):(Array.isArray(o.items)?o.items:[]); gross+=uid?sellerSubtotal(o,uid):orderSubtotal(o); items.forEach(i=>{ const q=Number(i.qty)||1; units+=q; pc.set(i.name,(pc.get(i.name)||0)+q); if(i.category)types.add(i.category); }); }); const top=[...pc.entries()].sort((a,b)=>b[1]-a[1])[0]; return{gross,units,types:types.size,top:top?`${top[0]} (${top[1]})`:"—"}; }
function refreshStats(){
  const r=role(),po=state.orders.filter(paid),uid=r==="seller"?auth.currentUser?.uid:null,a=aggregate(po,uid),products=r==="seller"?state.products.filter(p=>p.sellerId===auth.currentUser?.uid).length:state.products.length;
  [["dashboardProducts",products],["dashboardOrders",state.orders.length],["statProducts",products],["statSales",po.length]].forEach(([id,v])=>{ if($(id))$(id).textContent=v; });
  if($("dashboardRevenue"))$("dashboardRevenue").textContent=r==="buyer"?"—":money(r==="admin"?a.gross*0.1:a.gross*0.9); if($("statRevenue"))$("statRevenue").textContent=r==="admin"?money(a.gross*0.1):r==="seller"?money(a.gross*0.9):"—"; renderAdminStats(); renderChart();
}
function renderAdminStats(){ if(role()!=="admin")return; const all=state.orders.filter(paid),cut=Date.now()-state.adminPeriod*86400000,period=all.filter(o=>toMillis(o.paidAt||o.createdAt)>=cut),pa=aggregate(period),aa=aggregate(all),sellers=state.users.filter(u=>norm(u.role)==="seller"),countries={}; sellers.forEach(s=>countries[s.country||"—"]=(countries[s.country||"—"]||0)+1); const vals={adminPeriodSales:period.length,adminPeriodUnits:pa.units,adminPeriodGross:money(pa.gross),adminPeriodProfit:money(pa.gross*0.1),adminSellerCount:sellers.length,adminAllSales:all.length,adminAllUnits:aa.units,adminProductTypes:aa.types,adminAllGross:money(aa.gross),adminAllProfit:money(aa.gross*0.1),adminTopProduct:aa.top}; Object.entries(vals).forEach(([id,v])=>{if($(id))$(id).textContent=v;}); if($("adminSellerCountries"))$("adminSellerCountries").innerHTML=Object.entries(countries).map(([c,n])=>`<div><span>${esc(c)}</span><strong>${n}</strong></div>`).join("")||"—"; $$('[data-admin-period]').forEach(b=>b.classList.toggle('active',Number(b.dataset.adminPeriod)===state.adminPeriod)); }
function renderChart(){ if(typeof Chart==="undefined")return; const el=$("activityChart"); if(!el)return; const data=[state.products.length,state.orders.length,role()==="admin"?state.users.filter(u=>norm(u.role)==="seller").length:0]; state.charts.activity?.destroy?.(); state.charts.activity=new Chart(el,{type:"doughnut",data:{labels:[t("products"),t("orders"),t("sellers")],datasets:[{data}]},options:{responsive:true,maintainAspectRatio:false}}); }

async function loadChat(){ const c=$("chatMessages"); if(!c||!auth.currentUser)return; try{ const snap=await getDocs(query(collection(db,"messages"),orderBy("createdAt","desc"),limit(100))); const arr=snap.docs.map(d=>({id:d.id,...d.data()})).reverse(); c.innerHTML=arr.length?arr.map(m=>`<div class="chat-message ${m.userId===auth.currentUser.uid?"user":""}"><strong>${esc(m.name||"Utilisateur")}</strong><span>${esc(m.text||"")}</span></div>`).join(""):'<div class="empty-state">Aucun message.</div>'; c.scrollTop=c.scrollHeight; }catch(e){ c.innerHTML='<div class="empty-state">Chat indisponible.</div>'; } }
async function sendChat(){ const input=$("chatInput"),text=input?.value.trim(); if(!text||!auth.currentUser)return; try{ await addDoc(collection(db,"messages"),{userId:auth.currentUser.uid,name:state.profile?.name||auth.currentUser.email||"Utilisateur",text,createdAt:serverTimestamp()}); input.value=""; await loadChat(); }catch(e){ toast("Message impossible.","error"); } }
function setupChat(){ $("sendChatBtn")?.addEventListener("click",sendChat); $("chatInput")?.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); sendChat(); } }); }

async function loadNotifications(){ state.notifications=[]; if(!auth.currentUser)return; try{ const snap=await getDocs(query(collection(db,"notifications"),where("userId","==",auth.currentUser.uid),limit(100))); state.notifications=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>toMillis(b.createdAt)-toMillis(a.createdAt)); }catch{} if($("notificationBadge")){ $("notificationBadge").hidden=!state.notifications.length; $("notificationBadge").textContent=state.notifications.length>99?"99+":state.notifications.length; } renderNotifications(); }
function renderNotifications(){ const c=$("notificationList"); if(!c)return; c.innerHTML=state.notifications.length?state.notifications.map(n=>`<div class="list-item"><strong>${esc(n.title||"Mystro-Shop")}</strong><p>${esc(n.message||n.text||"")}</p></div>`).join(""):`<div class="empty-state">${t("notificationEmpty")}</div>`; }

function assistantReply(q){ const x=norm(q); const lang=state.language; const text={
  fr:{pay:"Pour payer, ajoutez vos produits au panier puis ouvrez Paiement. Vous pouvez recharger le portefeuille avec un prestataire configuré.",sell:"Pour vendre, utilisez la page Vendre et ajoutez 1 à 5 photos.",delivery:"Les frais à domicile sont calculés par produit et affichés avant le paiement.",help:"Je peux vous aider avec la vente, le paiement, le portefeuille, la livraison ou votre compte."},
  ht:{pay:"Pou peye, mete pwodwi yo nan panyen epi ouvri Peman. Ou ka rechaje pòtfèy la ak yon founisè ki konfigire.",sell:"Pou vann, ale nan paj Vann epi mete 1 a 5 foto.",delivery:"Frè livrezon lakay la kalkile pou chak pwodwi epi li parèt anvan peman.",help:"Mwen ka ede w ak vant, peman, pòtfèy, livrezon oswa kont ou."},
  en:{pay:"To pay, add products to the cart and open Payment. You can top up the wallet through a configured provider.",sell:"To sell, use the Sell page and add 1 to 5 photos.",delivery:"Home delivery fees are calculated per product and shown before payment.",help:"I can help with selling, payment, wallet, delivery or your account."},
  es:{pay:"Para pagar, agregue productos al carrito y abra Pago. Puede recargar la cartera mediante un proveedor configurado.",sell:"Para vender, use la página Vender y agregue de 1 a 5 fotos.",delivery:"Los gastos de entrega a domicilio se calculan por producto y se muestran antes del pago.",help:"Puedo ayudarle con ventas, pagos, cartera, entrega o su cuenta."}
  }[lang]||{}; if(/pay|peman|pago|paiement|moncash|natcash/.test(x))return text.pay; if(/sell|vann|vender|vend|produit|pwodwi|producto/.test(x))return text.sell; if(/delivery|livraison|livrezon|entrega/.test(x))return text.delivery; return text.help; }
function pushAssistant(text,cls){ const c=$("assistantMessages"); if(!c)return; c.insertAdjacentHTML("beforeend",`<div class="chat-message ${cls}">${esc(text)}</div>`); c.scrollTop=c.scrollHeight; }
function setupAssistant(){ const open=()=>{ $("assistantPanel").classList.add("open"); $("assistantPanel").setAttribute("aria-hidden","false"); if(!$("assistantMessages").children.length)pushAssistant(t("assistantHello"),"assistant"); }; const close=()=>{ $("assistantPanel").classList.remove("open"); $("assistantPanel").setAttribute("aria-hidden","true"); }; $("assistantBtn")?.addEventListener("click",open); $("assistantCloseBtn")?.addEventListener("click",close); const send=()=>{ const input=$("assistantInput"),q=input?.value.trim(); if(!q)return; pushAssistant(q,"user"); input.value=""; setTimeout(()=>pushAssistant(assistantReply(q),"assistant"),150); }; $("assistantSendBtn")?.addEventListener("click",send); $("assistantInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send();}}); }

function providerError(e){ const m=String(e.message||e); return /NOT_CONFIGURED/.test(m)?t("unavailable"):m; }
async function startTopup(provider){ if(!auth.currentUser)return openAuth("login"); const amount=Number($("walletAmount").value); if(!amount||amount<20)return toast("Minimum 20 HTG.","error"); try{ const d=await api(`/${provider}/deposit`,{amount}); localStorage.setItem("mystroTopupProvider",provider); localStorage.setItem("mystroTopupReference",d.reference||""); if(d.redirectUrl)location.href=d.redirectUrl; else toast("Recharge créée.","success"); }catch(e){ toast(providerError(e),"error"); } }
async function verifyTopup(){ const provider=localStorage.getItem("mystroTopupProvider"),reference=localStorage.getItem("mystroTopupReference"); if(!provider||!reference)return toast("Aucune recharge en attente.","info"); try{ const d=await api(`/${provider}/verify`,{reference}); if(d.ok){ localStorage.removeItem("mystroTopupProvider"); localStorage.removeItem("mystroTopupReference"); state.profile=await loadProfile(auth.currentUser); renderProfile(); toast("Recharge confirmée.","success"); }else toast("Confirmation encore en attente.","info"); }catch(e){ toast(providerError(e),"error"); } }
async function withdraw(provider){ const amount=Number($("withdrawAmount").value),phone=$("withdrawPhone").value.trim(); if(!amount||!phone)return toast("Montant et téléphone requis.","error"); try{ const d=await api(`/${provider}/withdraw`,{amount,phone}); toast(`Demande ${d.reference||""} envoyée.`,"success"); closeModal("withdrawModal"); state.profile=await loadProfile(auth.currentUser); renderProfile(); }catch(e){ toast(providerError(e),"error"); } }
async function exchange(){ const from=$("exchangeFrom").value,to=$("exchangeTo").value,amount=Number($("exchangeAmount").value); if(from===to)return toast("Choisissez deux devises différentes.","error"); if(!amount||amount<=0)return toast("Montant invalide.","error"); try{ const d=await api("/wallet/exchange",{from,to,amount}); state.profile=await loadProfile(auth.currentUser); renderProfile(); toast(`${money(d.debited,from)} → ${money(d.credited,to)}`,"success"); closeModal("exchangeModal"); }catch(e){ toast(providerError(e),"error"); } }
function setupWallet(){
  $("moncashDepositBtn")?.addEventListener("click",()=>{openModal("walletModal");$("walletProvider").value="moncash";}); $("natcashDepositBtn")?.addEventListener("click",()=>{openModal("walletModal");$("walletProvider").value="natcash";}); $("walletTopupBtn")?.addEventListener("click",()=>startTopup($("walletProvider").value)); $("verifyTopupBtn")?.addEventListener("click",verifyTopup);
  $("moncashWithdrawBtn")?.addEventListener("click",()=>{openModal("withdrawModal");$("withdrawProvider").value="moncash";}); $("natcashWithdrawBtn")?.addEventListener("click",()=>{openModal("withdrawModal");$("withdrawProvider").value="natcash";}); $("withdrawSubmitBtn")?.addEventListener("click",()=>withdraw($("withdrawProvider").value));
  $("exchangeBtn")?.addEventListener("click",()=>openModal("exchangeModal")); $("exchangeSubmitBtn")?.addEventListener("click",exchange);
  [["bankBtn","bnc"],["transferBtn","ria"]].forEach(([id,method])=>$(id)?.addEventListener("click",()=>{ $("payoutMethod").value=method; openModal("payoutRequestModal"); }));
  $("payoutRequestSubmit")?.addEventListener("click",async()=>{ try{ const d=await api("/payout/request",{method:$("payoutMethod").value,amount:Number($("payoutAmount").value),currency:$("payoutCurrency").value,details:$("payoutDetails").value.trim()}); toast(`Demande ${d.reference} enregistrée.`,"success"); closeModal("payoutRequestModal"); }catch(e){ toast(providerError(e),"error"); } });
}

function setupGeneral(){
  $("searchInput")?.addEventListener("input",renderProducts);
  $("currencySelector")?.addEventListener("change",e=>{ state.currency=e.target.value; localStorage.setItem("mystroCurrency",state.currency); renderProducts(); renderCart(); renderProfile(); renderOrders(); refreshStats(); });
  $("languageSelector")?.addEventListener("change",e=>applyLanguage(e.target.value));
  $("homeDeliveryRequested")?.addEventListener("change",e=>{ state.delivery=e.target.checked; localStorage.setItem("mystroDelivery",state.delivery?"1":"0"); renderCart(); });
  $("productForm")?.addEventListener("submit",publishProduct); $("saveCommentBtn")?.addEventListener("click",saveComment); $("notificationBtn")?.addEventListener("click",()=>{renderNotifications();openModal("notificationModal");});
  $$('[data-close-modal]').forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.closeModal)));
  $$('.modal').forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id);}));
  $$('[data-admin-period]').forEach(b=>b.addEventListener("click",()=>{state.adminPeriod=Number(b.dataset.adminPeriod);localStorage.setItem("mystroAdminPeriod",state.adminPeriod);renderAdminStats();}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){$$('.modal.open').forEach(x=>closeModal(x.id));$("mobileNav")?.classList.remove("open");}});
}

onAuthStateChanged(auth,async user=>{
  state.user=user;
  if(user){
    state.profile=await loadProfile(user); $("welcomePage").hidden=true; $("mainApp").hidden=false; applyRoleUI(); renderProfile();
    await Promise.all([loadProducts(),loadOrders(),loadComments(),loadChat(),loadNotifications(),role()==="admin"?loadUsers():Promise.resolve()]);
    if(localStorage.getItem("mystroTopupReference"))setTimeout(verifyTopup,800);
  }else{
    state.profile=null; state.products=DEMO; state.orders=[]; state.comments=[]; state.users=[]; $("welcomePage").hidden=false; $("mainApp").hidden=true; renderProducts();
  }
  applyLanguage(state.language);
});

function init(){
  if(!ADMIN_PERIODS.includes(state.adminPeriod))state.adminPeriod=7;
  setupNav(); setupAuth(); setupImages(); setupChat(); setupAssistant(); setupWallet(); setupGeneral();
  if($("currencySelector"))$("currencySelector").value=state.currency; if($("languageSelector"))$("languageSelector").value=state.language;
  renderCart(); applyLanguage(state.language); loadFx();
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js?v=12",{updateViaCache:"none"}).catch(()=>{}));
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true}); else init();

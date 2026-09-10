/* ============================================================
   MYSTRO-SHOP — SCRIPT.JS
   Correction rôles + commission 10% + livraison par produit
   Firebase Auth / Firestore / Supabase Storage / MonCash Worker
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, getDoc, setDoc, doc,
  serverTimestamp, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const SUPABASE_URL = "https://cesfjdrlnfxffrtoggoz.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";
const PRODUCT_BUCKET = "product-images";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const API_URL = "https://mystroshop-api.castormystro.workers.dev";
const COMMISSION_RATE = 0.10;
const SELLER_RATE = 0.90;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DELIVERY_PER_ITEM = { HTG: 1000, USD: 5, EUR: 5 };

const CURRENCY_SYMBOLS = { HTG:"G", USD:"$", EUR:"€", CAD:"CA$", GBP:"£", DOP:"RD$", XOF:"CFA" };
const FX = { USD:1, HTG:131, EUR:0.86, CAD:1.36, GBP:0.74, DOP:63.5, XOF:565 };

const state = {
  user: null,
  profile: null,
  products: [],
  filteredProducts: [],
  orders: [],
  cart: loadJSON("mystroCart", []),
  deliveryRequested: localStorage.getItem("mystroDelivery") === "1",
  balanceHidden: localStorage.getItem("mystroBalanceHidden") === "1",
  language: localStorage.getItem("mystroLanguage") || "fr",
  currency: localStorage.getItem("mystroCurrency") || "HTG",
  currentPage: "home",
  charts: {}
};

const $ = id => document.getElementById(id);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function normalizeText(v="") { return String(v).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function escapeHTML(v="") { return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function normalizeRole(role="buyer") {
  const r = normalizeText(role);
  if (["seller","vendeur","vande","vandè"].includes(r)) return "seller";
  if (["admin","administrateur","administrator"].includes(r)) return "admin";
  return "buyer";
}
function isSeller() { return ["seller","admin"].includes(normalizeRole(state.profile?.role)); }

function convertAmount(amount, from, to) {
  const n = Number(amount) || 0;
  if (!FX[from] || !FX[to]) return n;
  return (n / FX[from]) * FX[to];
}
function money(amount, currency=state.currency) {
  const n = Number(amount) || 0;
  return `${CURRENCY_SYMBOLS[currency] || currency} ${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}

function toast(message, type="info") {
  let box = $("mystroToast");
  if (!box) {
    box = document.createElement("div");
    box.id = "mystroToast";
    box.style.cssText = "position:fixed;left:50%;bottom:95px;transform:translateX(-50%);z-index:999999;max-width:90%;min-width:220px;padding:13px 18px;border-radius:12px;background:#111;color:#fff;text-align:center;font:600 14px/1.4 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.22);opacity:0;transition:.2s;pointer-events:none";
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.background = type === "error" ? "#c52216" : type === "success" ? "#15803d" : "#111";
  box.style.opacity = "1";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.style.opacity = "0", 3500);
}
function setBusy(button, busy, text="") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText ||= button.textContent;
    button.disabled = true;
    button.textContent = text || t("loading");
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}
function openModal(id) { const m=$(id); if(m){m.classList.add("open");m.setAttribute("aria-hidden","false");} }
function closeModal(id) { const m=$(id); if(m){m.classList.remove("open");m.setAttribute("aria-hidden","true");} }
function closeAllModals(){ $$(".mystro-modal.open").forEach(m=>{m.classList.remove("open");m.setAttribute("aria-hidden","true");}); }

const I18N = {
  fr:{home:"Accueil",products:"Produits",sell:"Vendre",wallet:"Portefeuille",cart:"Panier",statistics:"Statistiques",chat:"Chat",logout:"Déconnexion",search:"Rechercher sur Mystro-Shop...",loading:"Chargement...",login:"Se connecter",register:"S'inscrire",welcome:"Bienvenue sur Mystro-Shop",publicationSuccess:"Produit publié avec succès.",publicationError:"Publication du produit échouée.",imageRequired:"Choisissez une photo du produit.",imageInvalid:"La photo doit être JPEG, PNG ou WebP et ne pas dépasser 5 Mo.",uploadStarting:"Envoi de la photo...",savingProduct:"Enregistrement du produit...",sellerRequired:"Cette fonction est réservée aux vendeurs.",loginRequired:"Connectez-vous d'abord.",cartAdded:"Produit ajouté au panier.",emptyCart:"Votre panier est vide.",invalidAmount:"Entrez un montant valide.",operationUnavailable:"Cette fonction n'est pas encore activée.",assistantHello:"Bonjour 👋 Comment puis-je vous aider ?"},
  ht:{home:"Akèy",products:"Pwodwi",sell:"Vann",wallet:"Pòtfèy",cart:"Panyen",statistics:"Estatistik",chat:"Chat",logout:"Dekonekte",search:"Chèche sou Mystro-Shop...",loading:"Ap chaje...",login:"Konekte",register:"Enskri",welcome:"Byenveni sou Mystro-Shop",publicationSuccess:"Pwodwi a pibliye avèk siksè.",publicationError:"Piblikasyon pwodwi a echwe.",imageRequired:"Chwazi yon foto pwodwi a.",imageInvalid:"Foto a dwe JPEG, PNG oswa WebP epi li pa dwe depase 5 MB.",uploadStarting:"Ap voye foto a...",savingProduct:"Ap anrejistre pwodwi a...",sellerRequired:"Fonksyon sa a rezève pou vandè yo.",loginRequired:"Konekte anvan.",cartAdded:"Pwodwi a ajoute nan panyen.",emptyCart:"Panyen ou vid.",invalidAmount:"Antre yon montan ki valab.",operationUnavailable:"Fonksyon sa a poko aktive.",assistantHello:"Bonjou 👋 Kijan mwen ka ede w?"},
  en:{home:"Home",products:"Products",sell:"Sell",wallet:"Wallet",cart:"Cart",statistics:"Statistics",chat:"Chat",logout:"Log out",search:"Search Mystro-Shop...",loading:"Loading...",login:"Log in",register:"Sign up",welcome:"Welcome to Mystro-Shop",publicationSuccess:"Product published successfully.",publicationError:"Product publication failed.",imageRequired:"Choose a product photo.",imageInvalid:"The photo must be JPEG, PNG or WebP and no larger than 5 MB.",uploadStarting:"Uploading photo...",savingProduct:"Saving product...",sellerRequired:"This feature is reserved for sellers.",loginRequired:"Please log in first.",cartAdded:"Product added to cart.",emptyCart:"Your cart is empty.",invalidAmount:"Enter a valid amount.",operationUnavailable:"This feature is not active yet.",assistantHello:"Hello 👋 How can I help you?"},
  es:{home:"Inicio",products:"Productos",sell:"Vender",wallet:"Cartera",cart:"Carrito",statistics:"Estadísticas",chat:"Chat",logout:"Cerrar sesión",search:"Buscar en Mystro-Shop...",loading:"Cargando...",login:"Iniciar sesión",register:"Registrarse",welcome:"Bienvenido a Mystro-Shop",publicationSuccess:"Producto publicado correctamente.",publicationError:"La publicación del producto falló.",imageRequired:"Seleccione una foto del producto.",imageInvalid:"La foto debe ser JPEG, PNG o WebP y no superar 5 MB.",uploadStarting:"Subiendo foto...",savingProduct:"Guardando producto...",sellerRequired:"Esta función está reservada para vendedores.",loginRequired:"Inicie sesión primero.",cartAdded:"Producto añadido al carrito.",emptyCart:"Su carrito está vacío.",invalidAmount:"Ingrese un monto válido.",operationUnavailable:"Esta función aún no está activa.",assistantHello:"Hola 👋 ¿Cómo puedo ayudarle?"}
};
function t(key){ return I18N[state.language]?.[key] || I18N.fr[key] || key; }
function applyLanguage(language){
  if(!I18N[language]) language="fr";
  state.language=language; localStorage.setItem("mystroLanguage",language); document.documentElement.lang=language;
  $$("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(I18N[language][key])el.textContent=I18N[language][key];});
  $$("[data-i18n-placeholder]").forEach(el=>{const key=el.dataset.i18nPlaceholder;if(I18N[language][key])el.placeholder=I18N[language][key];});
  if($("searchInput")) $("searchInput").placeholder=t("search");
  if($("languageSelector")) $("languageSelector").value=language;
  renderProducts(); renderCart();
}

function openPage(page){
  const target=$(`${page}Page`); if(!target) return;
  $$(".app-page").forEach(el=>el.classList.remove("active-page")); target.classList.add("active-page"); state.currentPage=page;
  $$("[data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===page));
  $("mobileNav")?.classList.remove("open"); document.body.classList.remove("nav-open");
  if(["home","products"].includes(page)) renderProducts();
  if(page==="cart") renderCart();
  if(page==="profile") renderProfile();
  if(["dashboard","statistics"].includes(page)) refreshStats();
  if(page==="orders") renderOrders();
  window.scrollTo(0,0);
}
function setupNavigation(){
  $("menuBtn")?.addEventListener("click",()=>{$("mobileNav")?.classList.toggle("open");document.body.classList.toggle("nav-open");});
  $$("[data-page]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();openPage(el.dataset.page);}));
}

function ensureDynamicUI(){
  if(!$("commentsPage")){
    const main=document.querySelector("main.app-content");
    const sec=document.createElement("section"); sec.id="commentsPage"; sec.className="app-page";
    sec.innerHTML='<div class="page-title"><h2>💬 Commentaires</h2><p>Commentaires et avis liés à votre activité Mystro-Shop.</p></div><div class="list-container"><div class="empty-state">Aucun commentaire pour le moment.</div></div>';
    main?.appendChild(sec);
  }
  if(!document.querySelector('[data-page="comments"]')){
    const btn=document.createElement("button"); btn.type="button"; btn.dataset.page="comments"; btn.innerHTML="💬 <span>Commentaires</span>";
    const nav=$("mobileNav"), services=nav?.querySelector('[data-page="services"]'); nav?.insertBefore(btn,services||null);
    btn.addEventListener("click",e=>{e.preventDefault();openPage("comments");});
  }
  if(!$("productDiscount")){
    const price=$("productPrice")?.closest(".form-group");
    if(price){
      const box=document.createElement("div"); box.className="form-group";
      box.innerHTML='<label for="productDiscount">Réduction (%)</label><input type="number" id="productDiscount" min="0" max="90" step="1" value="0" placeholder="Ex. 10">';
      price.after(box);
    }
  }
  const summary=document.querySelector(".cart-summary");
  if(summary && !$("homeDeliveryRequested")){
    const totalRow=summary.querySelector(".cart-summary-total");
    const delivery=document.createElement("div"); delivery.className="cart-delivery-box";
    delivery.style.cssText="margin:12px 0;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc";
    delivery.innerHTML='<label style="display:flex;gap:9px;align-items:flex-start;font-weight:700"><input type="checkbox" id="homeDeliveryRequested" style="margin-top:3px"> Demander une livraison à domicile</label><small id="deliveryRule" style="display:block;margin-top:7px">Frais par produit : 5 USD / 5 EUR / 1000 HTG</small>';
    summary.insertBefore(delivery,totalRow);
    const row=document.createElement("div"); row.className="cart-summary-row"; row.innerHTML='<span>Livraison à domicile</span><strong id="cartDeliveryFee">0</strong>';
    summary.insertBefore(row,totalRow);
    $("homeDeliveryRequested").checked=state.deliveryRequested;
    $("homeDeliveryRequested").addEventListener("change",e=>{state.deliveryRequested=e.target.checked;localStorage.setItem("mystroDelivery",state.deliveryRequested?"1":"0");renderCart();});
  }
  const balance=$("walletBalance");
  if(balance && !$("toggleBalanceBtn")){
    const btn=document.createElement("button"); btn.type="button"; btn.id="toggleBalanceBtn"; btn.textContent="👁"; btn.setAttribute("aria-label","Afficher ou masquer le solde");
    btn.style.cssText="margin-left:10px;border:0;background:transparent;font-size:20px";
    balance.after(btn); btn.addEventListener("click",()=>{state.balanceHidden=!state.balanceHidden;localStorage.setItem("mystroBalanceHidden",state.balanceHidden?"1":"0");renderProfile();});
  }
  const grid=document.querySelector("#servicesPage .services-grid");
  if(grid && !$("deliveryServiceCard")){
    const card=document.createElement("div"); card.id="deliveryServiceCard"; card.className="service-card"; card.innerHTML="🚚<strong>Livraison internationale</strong><small>À domicile : 5 USD / 5 EUR / 1000 HTG par produit</small>"; grid.appendChild(card);
  }
  $$("#servicesPage .service-card").forEach(card=>{
    if(card.textContent.includes("Google Ads + TikTok Ads")) card.innerHTML='📣<strong>Publicité — Jeen Ads / Facebook / Instagram / TikTok</strong>';
  });
}

function applyRoleUI(){
  const role=normalizeRole(state.profile?.role);
  const allowed={
    buyer:new Set(["home","dashboard","products","wallet","cart","orders","chat","services","profile","help"]),
    seller:new Set(["home","dashboard","products","sell","wallet","statistics","cart","orders","chat","comments","services","profile","help"]),
    admin:new Set(["home","dashboard","products","sell","wallet","statistics","clients","cart","orders","chat","comments","services","profile","help"])
  }[role];
  $$("#mobileNav [data-page]").forEach(btn=>btn.style.display=allowed.has(btn.dataset.page)?"":"none");
  const heroSell=document.querySelector('#homePage [data-page="sell"]'); if(heroSell) heroSell.style.display=role==="buyer"?"none":"";
  const orderTitle=document.querySelector("#ordersPage .page-title h2");
  const orderText=document.querySelector("#ordersPage .page-title p");
  if(role==="buyer") { if(orderTitle) orderTitle.textContent="🧾 Historique d'achat"; if(orderText) orderText.textContent="Retrouvez vos commandes et achats Mystro-Shop."; }
  else { if(orderTitle) orderTitle.textContent="📦 Commandes"; if(orderText) orderText.textContent="Suivez les commandes de Mystro-Shop."; }
  if(!allowed.has(state.currentPage)) openPage("home");
}

async function loadProfile(user){
  if(!user) return null;
  try{const snap=await getDoc(doc(db,"users",user.uid));if(snap.exists())return{id:snap.id,...snap.data()};}catch(e){console.warn("Profil",e);}
  return {name:user.email?.split("@")[0]||"Utilisateur",email:user.email||"",role:"buyer",balance:0};
}

function createAuthModal(){
  if($("authModal")) return;
  const modal=document.createElement("div"); modal.id="authModal"; modal.className="mystro-modal";
  modal.innerHTML=`<div class="modal-card" style="max-width:440px"><button type="button" data-close-modal="authModal" style="float:right;border:0;background:none;font-size:28px">×</button><h2>Mystro-Shop</h2><div style="display:flex;gap:8px;margin:15px 0"><button type="button" id="loginTab" style="flex:1">Se connecter</button><button type="button" id="registerTab" style="flex:1">S'inscrire</button></div><form id="authForm"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label>Nom</label><input id="authLastName" type="text" required></div><div><label>Prénom</label><input id="authFirstName" type="text" required></div></div><label>E-mail</label><input id="authEmail" type="email" required><label>Mot de passe</label><input id="authPassword" type="password" minlength="6" required><div id="authRegisterFields" style="display:none"><label>Type de compte</label><select id="authRole"><option value="buyer">Acheteur</option><option value="seller">Vendeur</option></select><label>Pays</label><input id="authCountry" type="text" placeholder="Ex. Haïti"></div><button id="authSubmitBtn" type="submit" style="width:100%;margin-top:15px">Se connecter</button><button id="forgotPasswordBtn" type="button" style="width:100%;margin-top:8px">Mot de passe oublié ?</button></form></div>`;
  document.body.appendChild(modal);
  let mode="login";
  const setMode=next=>{mode=next;$("authRegisterFields").style.display=next==="register"?"block":"none";$("authCountry").required=next==="register";$("forgotPasswordBtn").style.display=next==="login"?"block":"none";$("authSubmitBtn").textContent=next==="login"?t("login"):t("register");};
  $("loginTab").onclick=()=>setMode("login"); $("registerTab").onclick=()=>setMode("register");
  $("authForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const email=$("authEmail").value.trim(), password=$("authPassword").value;
    const lastName=$("authLastName").value.trim(), firstName=$("authFirstName").value.trim();
    const button=$("authSubmitBtn"); setBusy(button,true);
    try{
      if(mode==="register"){
        const credential=await createUserWithEmailAndPassword(auth,email,password);
        await setDoc(doc(db,"users",credential.user.uid),{lastName,firstName,name:`${firstName} ${lastName}`.trim(),email,role:$("authRole").value,country:$("authCountry").value.trim(),balance:0,createdAt:serverTimestamp()},{merge:true});
        toast("Compte créé.","success");
      }else{
        const credential=await signInWithEmailAndPassword(auth,email,password);
        const profile=await loadProfile(credential.user);
        const storedLast=normalizeText(profile?.lastName||""); const storedFirst=normalizeText(profile?.firstName||"");
        if((storedLast && storedLast!==normalizeText(lastName)) || (storedFirst && storedFirst!==normalizeText(firstName))){ await signOut(auth); throw new Error("Nom ou prénom incorrect pour ce compte."); }
      }
      closeModal("authModal");
    }catch(error){console.error("Connexion",error);toast(error.message||"Connexion impossible.","error");}
    finally{setBusy(button,false);}
  });
  $("forgotPasswordBtn").onclick=async()=>{const email=$("authEmail").value.trim();if(!email)return toast("Entrez votre e-mail.","error");try{await sendPasswordResetEmail(auth,email);toast("E-mail envoyé.","success");}catch(e){toast(e.message,"error");}};
}
function openAuth(mode="login"){createAuthModal();(mode==="register"?$("registerTab"):$("loginTab"))?.click();openModal("authModal");}
function setupAuthButtons(){
  $("welcomeLoginBtn")?.addEventListener("click",()=>openAuth("login"));
  $("welcomeRegisterBtn")?.addEventListener("click",()=>openAuth("register"));
  $("logoutBtn")?.addEventListener("click",()=>signOut(auth)); $("profileLogoutBtn")?.addEventListener("click",()=>signOut(auth));
  $("profileBtn")?.addEventListener("click",()=>state.user?openPage("profile"):openAuth("login"));
}

const DEMO_PRODUCTS=[
  {id:"demo1",name:"Robe élégante",category:"Mode",price:24.99,currency:"USD",stock:12,imageUrl:"https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=80",description:"Robe moderne."},
  {id:"demo2",name:"Sac tendance",category:"Accessoires",price:18.50,currency:"USD",stock:10,imageUrl:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",description:"Sac moderne."},
  {id:"demo3",name:"Chaussures",category:"Chaussures",price:31,currency:"USD",stock:20,imageUrl:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",description:"Chaussures confortables."}
];
async function loadProducts(){
  let products=[];
  try{const snap=await getDocs(query(collection(db,"products"),orderBy("createdAt","desc"),limit(100)));products=snap.docs.map(d=>({id:d.id,...d.data()}));}
  catch(e){console.warn("Lecture produits",e);try{const snap=await getDocs(collection(db,"products"));products=snap.docs.map(d=>({id:d.id,...d.data()}));}catch{}}
  state.products=products.length?products:DEMO_PRODUCTS; state.filteredProducts=[...state.products]; renderProducts(); refreshStats();
}
async function loadOrders(){
  state.orders=[]; if(!auth.currentUser) return;
  try{const snap=await getDocs(query(collection(db,"orders"),orderBy("createdAt","desc"),limit(100)));state.orders=snap.docs.map(d=>({id:d.id,...d.data()}));}
  catch(e){console.warn("Lecture commandes",e);}
  renderOrders(); refreshStats();
}
function discountedBasePrice(product){
  const price=Number(product.price)||0, discount=Math.max(0,Math.min(90,Number(product.discountPercent)||0));
  return price*(1-discount/100);
}
function productCurrentPrice(product){return convertAmount(discountedBasePrice(product),product.currency||"USD",state.currency);}
function createProductCard(product){
  const name=escapeHTML(product.name||"Produit"), image=escapeHTML(product.imageUrl||product.image||"https://placehold.co/600x800?text=Mystro-Shop"), category=escapeHTML(product.category||"Marketplace");
  const discount=Number(product.discountPercent)||0;
  return `<article class="product-card" data-product-id="${escapeHTML(product.id)}"><div style="position:relative;width:100%;aspect-ratio:3/4;overflow:hidden;background:#f3f3f3"><img src="${image}" alt="${name}" loading="lazy" style="width:100%;height:100%;object-fit:cover"><button type="button" class="product-favorite" style="position:absolute;right:8px;top:8px;width:36px;height:36px;border:none;border-radius:50%;background:white;font-size:20px">♡</button>${discount?`<span style="position:absolute;left:8px;top:8px;background:#b91c1c;color:white;padding:5px 8px;border-radius:999px;font-weight:800">-${discount}%</span>`:""}</div><div style="padding:9px 4px 12px"><small>${category}</small><h3 style="margin:4px 0;font-size:14px">${name}</h3><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${money(productCurrentPrice(product))}</strong><div style="display:flex;gap:6px"><button type="button" data-share-product="${escapeHTML(product.id)}" aria-label="Partager" style="width:36px;height:36px;border:0;border-radius:50%;background:#e8eefc">↗</button><button type="button" data-add-cart="${escapeHTML(product.id)}" style="width:36px;height:36px;border:0;border-radius:50%;background:#111;color:white;font-size:20px">+</button></div></div></div></article>`;
}
function renderProducts(){
  const containers=[$("productsGrid"),$("productsContainer"),$("homeProducts"),$("featuredProducts")].filter(Boolean);
  if(!containers.length)return;
  const html=state.filteredProducts.length?state.filteredProducts.map(createProductCard).join(""):'<div class="empty-state">Aucun produit.</div>';
  containers.forEach(c=>c.innerHTML=html); setupProductCardButtons();
}
function setupProductCardButtons(){
  $$("[data-add-cart]").forEach(b=>b.onclick=()=>addToCart(b.dataset.addCart));
  $$("[data-share-product]").forEach(b=>b.onclick=()=>shareProduct(b.dataset.shareProduct));
  $$(".product-favorite").forEach(b=>b.onclick=()=>b.textContent=b.textContent==="♡"?"♥":"♡");
}
async function shareProduct(id){
  const p=state.products.find(x=>String(x.id)===String(id)); if(!p)return;
  const url=`${location.origin}${location.pathname}?product=${encodeURIComponent(id)}`;
  const data={title:p.name,text:`${p.name} — Mystro-Shop`,url};
  try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(url);toast("Lien copié.","success");}}catch(e){if(e.name!=="AbortError")toast("Partage impossible.","error");}
}
function setupSearch(){ $("searchInput")?.addEventListener("input",()=>{const s=normalizeText($("searchInput").value);state.filteredProducts=state.products.filter(p=>normalizeText(`${p.name||""} ${p.category||""} ${p.description||""}`).includes(s));renderProducts();}); }

function validateProductImage(file){if(!file)return{ok:false,message:t("imageRequired")};if(!ALLOWED_IMAGE_TYPES.includes(file.type)||file.size>MAX_IMAGE_SIZE)return{ok:false,message:t("imageInvalid")};return{ok:true};}
function setupImagePreview(){
  $("productImage")?.addEventListener("change",e=>{const file=e.target.files?.[0],v=validateProductImage(file),preview=$("productImagePreview");if(!v.ok){if(file)toast(v.message,"error");e.target.value="";if(preview)preview.innerHTML="";return;}const u=URL.createObjectURL(file);if(preview)preview.innerHTML=`<img src="${u}" alt="Aperçu produit" style="width:100%;max-height:360px;object-fit:cover;border-radius:14px">`;});
}
function createImagePath(file,userId){let ext=file.name?.split(".").pop()?.toLowerCase();if(!["jpg","jpeg","png","webp"].includes(ext))ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;}
async function uploadProductImage(file){
  const user=auth.currentUser;if(!user)throw new Error(t("loginRequired"));const v=validateProductImage(file);if(!v.ok)throw new Error(v.message);
  const path=createImagePath(file,user.uid);
  let result;try{result=await supabase.storage.from(PRODUCT_BUCKET).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});}catch{throw new Error("Impossible de contacter le stockage des photos.");}
  if(result.error){const msg=String(result.error.message||"");if(/policy|row-level|unauthorized|jwt/i.test(msg))throw new Error("Le stockage refuse l'envoi. La politique Supabase du bucket product-images doit autoriser l'upload ou passer par le backend sécurisé.");throw new Error(msg||"Échec de l'envoi de la photo.");}
  const publicUrl=supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(result.data.path)?.data?.publicUrl;if(!publicUrl)throw new Error("URL publique de la photo indisponible.");
  return {imageUrl:publicUrl,imagePath:result.data.path};
}
async function publishProduct(event){
  event?.preventDefault();const user=auth.currentUser;if(!user){toast(t("loginRequired"),"error");openAuth("login");return;}if(!isSeller()){toast(t("sellerRequired"),"error");return;}
  const name=$("productName")?.value.trim(),category=$("productCategory")?.value,currency=$("productCurrency")?.value||"HTG",price=Number($("productPrice")?.value),discount=Math.max(0,Math.min(90,Number($("productDiscount")?.value)||0)),stock=Number($("productStock")?.value),description=$("productDescription")?.value.trim()||"",file=$("productImage")?.files?.[0];
  if(!name||!category||!Number.isFinite(price)||price<=0||!Number.isFinite(stock)||stock<1)return toast("Vérifiez le nom, la catégorie, le prix et le stock.","error");const v=validateProductImage(file);if(!v.ok)return toast(v.message,"error");
  const button=$("publishProductBtn");setBusy(button,true,t("uploadStarting"));
  try{const upload=await uploadProductImage(file);if(button)button.textContent=t("savingProduct");const productData={name,category,currency,price,discountPercent:discount,stock,description,imageUrl:upload.imageUrl,imagePath:upload.imagePath,sellerId:user.uid,sellerEmail:user.email||"",sellerName:state.profile?.name||user.email||"Vendeur",commissionRate:COMMISSION_RATE,sellerPercentage:90,mystroPercentage:10,status:"active",createdAt:serverTimestamp()};const ref=await addDoc(collection(db,"products"),productData);state.products.unshift({id:ref.id,...productData});state.filteredProducts=[...state.products];$("productForm")?.reset();if($("productDiscount"))$("productDiscount").value="0";if($("productImagePreview"))$("productImagePreview").innerHTML="";renderProducts();refreshStats();toast(t("publicationSuccess"),"success");setTimeout(()=>openPage("products"),400);}catch(e){console.error("PUBLICATION PRODUIT",e);toast(`${t("publicationError")} ${e.message||""}`,"error");}finally{setBusy(button,false);}
}
function setupProductPublishing(){ $("productForm")?.addEventListener("submit",publishProduct); }

function updateCartBadge(){const total=state.cart.reduce((s,i)=>s+(Number(i.qty)||1),0);if($("cartCount"))$("cartCount").textContent=total;$$("[data-cart-count]").forEach(e=>e.textContent=total);}
function addToCart(id){const p=state.products.find(x=>String(x.id)===String(id));if(!p)return;const e=state.cart.find(x=>String(x.id)===String(id));if(e)e.qty=(Number(e.qty)||1)+1;else state.cart.push({...p,qty:1});saveJSON("mystroCart",state.cart);renderCart();toast(t("cartAdded"),"success");}
function removeFromCart(id){state.cart=state.cart.filter(x=>String(x.id)!==String(id));saveJSON("mystroCart",state.cart);renderCart();}
function changeQuantity(id,delta){const x=state.cart.find(p=>String(p.id)===String(id));if(!x)return;x.qty=Math.max(1,(Number(x.qty)||1)+delta);saveJSON("mystroCart",state.cart);renderCart();}
function deliveryFeeForCart(){
  if(!state.deliveryRequested)return 0;
  const perItem=DELIVERY_PER_ITEM[state.currency]; if(perItem==null)return null;
  const units=state.cart.reduce((s,i)=>s+(Number(i.qty)||1),0); return perItem*units;
}
function renderCart(){
  updateCartBadge();const c=$("cartItems");if(!c)return;
  c.innerHTML=state.cart.length?state.cart.map(i=>`<div style="display:grid;grid-template-columns:75px 1fr auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #eee"><img src="${escapeHTML(i.imageUrl||"https://placehold.co/150x190")}" style="width:75px;height:95px;object-fit:cover"><div><strong>${escapeHTML(i.name)}</strong><div>${money(productCurrentPrice(i))}</div><div style="display:flex;align-items:center;gap:8px;margin-top:8px"><button data-minus="${escapeHTML(i.id)}">−</button><span>${i.qty||1}</span><button data-plus="${escapeHTML(i.id)}">+</button></div></div><button data-remove="${escapeHTML(i.id)}">×</button></div>`).join(""):`<div class="empty-state">🛒 ${t("emptyCart")}</div>`;
  const subtotal=state.cart.reduce((s,i)=>s+productCurrentPrice(i)*(Number(i.qty)||1),0);
  const commission=subtotal*COMMISSION_RATE;
  const sellerNet=subtotal-commission;
  const delivery=deliveryFeeForCart();
  if($("cartSubtotal"))$("cartSubtotal").textContent=money(subtotal);
  if($("cartFees")){
    const label=$("cartFees").previousElementSibling;if(label)label.textContent="Commission Mystro-Shop (prélevée sur vendeur)";
    $("cartFees").textContent=`${money(commission)} incluse`;
  }
  if($("cartDeliveryFee"))$("cartDeliveryFee").textContent=delivery===null?"Choisir HTG, USD ou EUR":money(delivery||0);
  if($("homeDeliveryRequested"))$("homeDeliveryRequested").checked=state.deliveryRequested;
  if($("cartTotal"))$("cartTotal").textContent=delivery===null?money(subtotal):money(subtotal+(delivery||0));
  const summary=document.querySelector(".cart-summary");
  let sellerInfo=$("sellerSplitInfo");
  if(summary && !sellerInfo){sellerInfo=document.createElement("small");sellerInfo.id="sellerSplitInfo";sellerInfo.style.cssText="display:block;margin:8px 0;color:#64748b";summary.insertBefore(sellerInfo,$("checkoutBtn"));}
  if(sellerInfo)sellerInfo.textContent=`Sur le prix des produits : vendeur 90 % = ${money(sellerNet)} · Mystro-Shop 10 % = ${money(commission)}. La livraison est séparée.`;
  $$("[data-minus]").forEach(b=>b.onclick=()=>changeQuantity(b.dataset.minus,-1));$$("[data-plus]").forEach(b=>b.onclick=()=>changeQuantity(b.dataset.plus,1));$$("[data-remove]").forEach(b=>b.onclick=()=>removeFromCart(b.dataset.remove));
}
async function checkout(){
  if(!state.cart.length)return toast(t("emptyCart"),"error");if(!auth.currentUser)return openAuth("login");
  const delivery=deliveryFeeForCart();if(delivery===null)return toast("Pour une livraison à domicile, choisissez HTG, USD ou EUR afin d'appliquer le tarif défini.","error");
  toast("Commande préparée. Choisissez maintenant un mode de paiement.","success");openPage("wallet");
}

async function workerPOST(path,payload){const user=auth.currentUser;const token=user?await user.getIdToken(false):"";const r=await fetch(`${API_URL}${path}`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||data.message||`HTTP ${r.status}`);return data;}
async function depositMoncash(){const user=auth.currentUser;if(!user)return openAuth("login");const amount=Number($("moncashDepositAmount")?.value);if(!Number.isFinite(amount)||amount<=0)return toast(t("invalidAmount"),"error");const b=$("startMoncashDepositBtn");setBusy(b,true);try{const response=await workerPOST("/moncash/deposit",{amount,currency:"HTG",userId:user.uid});const url=response.redirectUrl||response.paymentUrl||response.url;if(url)window.location.href=url;else toast("Demande MonCash initialisée; attendez la confirmation du serveur.","success");}catch(e){toast(e.message,"error");}finally{setBusy(b,false);}}
async function withdrawMoncash(){const user=auth.currentUser;if(!user)return openAuth("login");const amount=Number($("moncashWithdrawAmount")?.value),phone=$("moncashWithdrawPhone")?.value.trim();if(!Number.isFinite(amount)||amount<=0||!phone)return toast(t("invalidAmount"),"error");const b=$("startMoncashWithdrawBtn");setBusy(b,true);try{await workerPOST("/moncash/withdraw",{amount,phone,currency:"HTG",userId:user.uid});toast("Demande de retrait envoyée; le retrait n'est final qu'après confirmation du serveur.","success");closeModal("moncashWithdrawModal");}catch(e){toast(e.message,"error");}finally{setBusy(b,false);}}
function setupWallet(){
  $("moncashDepositBtn")?.addEventListener("click",()=>auth.currentUser?openModal("moncashDepositModal"):openAuth("login"));
  $("moncashWithdrawBtn")?.addEventListener("click",()=>auth.currentUser?openModal("moncashWithdrawModal"):openAuth("login"));
  $("startMoncashDepositBtn")?.addEventListener("click",depositMoncash);$("startMoncashWithdrawBtn")?.addEventListener("click",withdrawMoncash);
  ["natcashBtn","bankBtn","transferBtn","exchangeBtn"].forEach(id=>$(id)?.addEventListener("click",()=>toast(t("operationUnavailable"))));
}

function renderProfile(){
  const p=state.profile||{},u=auth.currentUser,name=p.name||[p.firstName,p.lastName].filter(Boolean).join(" ")||u?.email?.split("@")[0]||"Mystro-Shop",email=p.email||u?.email||"",role=normalizeRole(p.role);const roleLabel=role==="seller"?"Vendeur":role==="admin"?"Administrateur":"Acheteur";const initial=String(name).charAt(0).toUpperCase();
  if($("profileName"))$("profileName").textContent=name;if($("profileEmail"))$("profileEmail").textContent=email;if($("profileRole"))$("profileRole").textContent=roleLabel;if($("profileAvatar"))$("profileAvatar").textContent=initial;if($("userInitials"))$("userInitials").textContent=initial;
  const balance=Number(p.balance)||0,display=state.balanceHidden?"••••••":money(balance,"HTG");if($("walletBalance"))$("walletBalance").textContent=display;if($("profileBalance"))$("profileBalance").textContent=display;if($("toggleBalanceBtn"))$("toggleBalanceBtn").textContent=state.balanceHidden?"🙈":"👁";
}
function userOrders(){
  const uid=auth.currentUser?.uid,role=normalizeRole(state.profile?.role);if(!uid)return[];if(role==="admin")return state.orders;if(role==="seller")return state.orders.filter(o=>o.sellerId===uid||o.items?.some?.(i=>i.sellerId===uid));return state.orders.filter(o=>o.buyerId===uid||o.userId===uid);
}
function renderOrders(){const c=$("ordersList");if(!c)return;const orders=userOrders();c.innerHTML=orders.length?orders.map(o=>`<div class="list-item" style="padding:12px;border-bottom:1px solid #e5e7eb"><strong>Commande ${escapeHTML(o.id||"")}</strong><div>${escapeHTML(o.status||"en attente")}</div><small>${o.total!=null?money(convertAmount(Number(o.total)||0,o.currency||state.currency,state.currency)):""}</small></div>`).join(""):'<div class="empty-state">Aucune commande pour le moment.</div>';}
function refreshStats(){
  const orders=userOrders(),paid=orders.filter(o=>["paid","completed","complete","payee","payé"].includes(normalizeText(o.status))),totalProducts=state.products.length;let gross=0;paid.forEach(o=>gross+=convertAmount(Number(o.subtotal??o.total??0),o.currency||state.currency,state.currency));const role=normalizeRole(state.profile?.role);const revenue=role==="seller"?gross*SELLER_RATE:role==="admin"?gross*COMMISSION_RATE:0;
  [["dashboardProducts",totalProducts],["statProducts",totalProducts],["dashboardOrders",orders.length],["statSales",paid.length],["dashboardClients",0],["statClients",0]].forEach(([id,v])=>{if($(id))$(id).textContent=String(v);});if($("dashboardRevenue"))$("dashboardRevenue").textContent=money(revenue);if($("statRevenue"))$("statRevenue").textContent=money(revenue);setupCharts();
}
function setupCharts(){if(typeof Chart==="undefined")return;const sales=$("salesChart");if(sales&&!state.charts.sales)state.charts.sales=new Chart(sales,{type:"line",data:{labels:["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],datasets:[{label:"Ventes",data:[0,0,0,0,0,0,0]}]},options:{responsive:true,maintainAspectRatio:false}});const activity=$("activityChart");if(activity&&!state.charts.activity)state.charts.activity=new Chart(activity,{type:"doughnut",data:{labels:["Produits","Commandes","Clients"],datasets:[{data:[state.products.length,userOrders().length,0]}]},options:{responsive:true,maintainAspectRatio:false}});}

function addChatMessage(c,m,type){if(!c||!m)return;const b=document.createElement("div");b.className=`chat-message ${type}`;b.textContent=m;c.appendChild(b);c.scrollTop=c.scrollHeight;}
function setupChat(){const send=()=>{const i=$("chatInput"),m=i?.value.trim();if(!m)return;addChatMessage($("chatMessages"),m,"user");i.value="";};$("sendChatBtn")?.addEventListener("click",send);$("chatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send();}});}
function assistantReply(message){const x=normalizeText(message);if(x.includes("moncash"))return"Ouvrez Portefeuille puis choisissez Dépôt ou Retrait MonCash. Une opération réelle n'est finale qu'après confirmation du serveur.";if(/vann|vendre|sell|vender/.test(x))return"Ouvrez Vendre, remplissez le formulaire, ajoutez une photo puis publiez.";if(/livraison|delivery/.test(x))return"Livraison à domicile : 5 USD, 5 EUR ou 1000 HTG par produit. Le frais de livraison est séparé de la commission.";if(/commission|10%/.test(x))return"Mystro-Shop prend 10 % du prix de vente. Le vendeur reçoit 90 %. La commission n'est pas ajoutée au prix payé par l'acheteur.";return t("assistantHello");}
function setupAssistant(){$("assistantBtn")?.addEventListener("click",()=>$("assistantPanel")?.classList.toggle("open"));$("assistantCloseBtn")?.addEventListener("click",()=>$("assistantPanel")?.classList.remove("open"));const send=()=>{const i=$("assistantInput"),m=i?.value.trim();if(!m)return;const c=$("assistantMessages");addChatMessage(c,m,"user");i.value="";setTimeout(()=>addChatMessage(c,assistantReply(m),"assistant"),200);};$("assistantSendBtn")?.addEventListener("click",send);$("assistantInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send();}});}
function setupSelectors(){const c=$("currencySelector");if(c){c.value=state.currency;c.addEventListener("change",e=>{state.currency=e.target.value;localStorage.setItem("mystroCurrency",state.currency);renderProducts();renderCart();renderProfile();});}const l=$("languageSelector");if(l){l.value=state.language;l.addEventListener("change",e=>applyLanguage(e.target.value));}}
function setupGlobalUI(){document.addEventListener("click",e=>{const b=e.target.closest("[data-close-modal]");if(b)closeModal(b.dataset.closeModal);});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAllModals();});$("checkoutBtn")?.addEventListener("click",checkout);}

onAuthStateChanged(auth,async user=>{
  state.user=user;
  if(user){state.profile=await loadProfile(user);$("welcomePage")&&( $("welcomePage").style.display="none" );$("mainApp")&&( $("mainApp").style.display="block" );renderProfile();applyRoleUI();await Promise.all([loadProducts(),loadOrders()]);}
  else{state.profile=null;$("welcomePage")&&( $("welcomePage").style.display="" );$("mainApp")&&( $("mainApp").style.display="none" );state.products=DEMO_PRODUCTS;state.filteredProducts=[...DEMO_PRODUCTS];state.orders=[];renderProducts();}
  applyLanguage(state.language);
});
function registerServiceWorker(){if(!("serviceWorker" in navigator))return;window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(e=>console.warn("Service Worker",e)));}
function initMystroShop(){
  ensureDynamicUI();createAuthModal();setupNavigation();setupAuthButtons();setupSelectors();setupSearch();setupImagePreview();setupProductPublishing();setupWallet();setupChat();setupAssistant();setupGlobalUI();updateCartBadge();renderCart();applyLanguage(state.language);registerServiceWorker();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initMystroShop,{once:true});else initMystroShop();

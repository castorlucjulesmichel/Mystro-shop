import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",
  authDomain: "mystroshop-eab92.firebaseapp.com",
  projectId: "mystroshop-eab92",
  storageBucket: "mystroshop-eab92.firebasestorage.app",
  messagingSenderId: "104073035061",
  appId: "1:104073035061:web:59d2779f2db7a8a3be207c",
  measurementId: "G-QTLV6VFLXQ"
};


const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";

const COMMISSION_RATE =
  0.10;


const $ =
  selector =>
    document.querySelector(selector);

const $$ =
  selector =>
    [...document.querySelectorAll(selector)];


let currentUser =
  null;

let currentProfile =
  null;

let products =
  [];

let cartCount =
  0;

let currency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let language =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";


const rates = {
  USD: 1,
  HTG: 130,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79
};


/* =========================
   TRANSLATIONS
========================= */

const translations = {

  fr: {
    authSubtitle: "Achetez, vendez et développez votre activité.",
    login: "Se connecter",
    signup: "S'inscrire",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    fullName: "Nom complet",
    role: "Rôle",
    confirmPassword: "Confirmer le mot de passe",
    createAccount: "Créer mon compte",
    buyer: "Acheteur",
    seller: "Vendeur",

    home: "Accueil",
    dashboard: "Tableau de bord",
    products: "Produits",
    sell: "Vendre",
    wallet: "Portefeuille",
    stats: "Statistiques",
    clients: "Clients",
    orders: "Commandes",
    chat: "Chat",
    services: "Services",
    profile: "Profil",
    help: "Aide",
    logout: "Se déconnecter",

    marketTitle:
      "Mystro-Shop — Marché international",

    welcome:
      "Bienvenue sur Mystro-Shop",

    welcomeText:
      "Achetez et vendez partout dans le monde.",

    discoverProducts:
      "Découvrir les produits",

    featured:
      "Produits populaires",

    sales:
      "Ventes",

    balance:
      "Solde",

    revenue:
      "Revenus",

    salesEvolution:
      "Évolution des ventes",

    publishProduct:
      "Publier un produit",

    productName:
      "Nom du produit",

    category:
      "Catégorie",

    priceCurrency:
      "Devise du prix",

    price:
      "Prix",

    stock:
      "Stock",

    productPhoto:
      "Photo du produit",

    description:
      "Description",

    publish:
      "Publier le produit",

    publishing:
      "Publication...",

    commission:
      "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.",

    availableBalance:
      "Solde disponible",

    walletDescription:
      "Gérez vos dépôts et retraits.",

    paymentMethods:
      "Méthodes",

    depositWithdraw:
      "Dépôt / retrait",

    pendingIntegration:
      "En attente d'intégration",

    bankTransfer:
      "Transfert bancaire",

    partnerIntegration:
      "Intégration partenaire requise",

    recentTransactions:
      "Transactions récentes",

    noTransactions:
      "Aucune transaction.",

    noClients:
      "Aucun client pour le moment.",

    noOrders:
      "Aucune commande pour le moment.",

    servicesText:
      "Les services Mystro-Shop seront ajoutés ici.",

    currency:
      "Devise",

    howSell:
      "Comment vendre ?",

    howSellAnswer:
      "Ouvrez Vendre, ajoutez votre produit et sa photo puis publiez.",

    commissionQuestion:
      "Quelle commission prend Mystro-Shop ?",

    commissionAnswer:
      "Mystro-Shop prélève 10% sur chaque vente finalisée.",

    addCart:
      "Ajouter au panier",

    search:
      "Rechercher sur Mystro-Shop...",

    searchProduct:
      "Rechercher un produit...",

    deposit:
      "+ Déposer",

    withdraw:
      "Retirer",

    depositAmount:
      "Montant du dépôt MonCash en HTG :",

    withdrawAmount:
      "Montant du retrait MonCash en HTG :",

    moncashNumber:
      "Numéro MonCash : 509XXXXXXXX",

    assistantWelcome:
      "Bonjour 👋 Je suis l'assistant Mystro-Shop. Je peux vous aider avec les achats, les ventes, MonCash, les devises et les langues.",

    assistantPlaceholder:
      "Posez votre question..."
  },


  ht: {
    authSubtitle: "Achte, vann epi devlope aktivite ou.",
    login: "Konekte",
    signup: "Enskri",
    password: "Modpas",
    forgotPassword: "Ou bliye modpas la ?",
    fullName: "Non konplè",
    role: "Wòl",
    confirmPassword: "Konfime modpas",
    createAccount: "Kreye kont mwen",
    buyer: "Achtè",
    seller: "Vandè",

    home: "Akèy",
    dashboard: "Tablo kontwòl",
    products: "Pwodwi",
    sell: "Vann",
    wallet: "Pòtfèy",
    stats: "Estatistik",
    clients: "Kliyan",
    orders: "Kòmand",
    chat: "Mesaj",
    services: "Sèvis",
    profile: "Pwofil",
    help: "Èd",
    logout: "Dekonekte",

    marketTitle:
      "Mystro-Shop — Mache entènasyonal",

    welcome:
      "Byenveni sou Mystro-Shop",

    welcomeText:
      "Achte epi vann atravè lemond.",

    discoverProducts:
      "Dekouvri pwodwi",

    featured:
      "Pwodwi popilè",

    sales:
      "Lavant",

    balance:
      "Balans",

    revenue:
      "Revni",

    salesEvolution:
      "Evolisyon lavant",

    publishProduct:
      "Pibliye yon pwodwi",

    productName:
      "Non pwodwi",

    category:
      "Kategori",

    priceCurrency:
      "Deviz pri a",

    price:
      "Pri",

    stock:
      "Stòk",

    productPhoto:
      "Foto pwodwi",

    description:
      "Deskripsyon",

    publish:
      "Pibliye pwodwi",

    publishing:
      "Ap pibliye...",

    commission:
      "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.",

    availableBalance:
      "Balans disponib",

    walletDescription:
      "Jere depo ak retrè ou yo.",

    paymentMethods:
      "Metòd",

    depositWithdraw:
      "Depo / retrè",

    pendingIntegration:
      "Entegrasyon poko disponib",

    bankTransfer:
      "Transfè labank",

    partnerIntegration:
      "Entegrasyon patnè nesesè",

    recentTransactions:
      "Dènye tranzaksyon",

    noTransactions:
      "Pa gen tranzaksyon.",

    noClients:
      "Pa gen kliyan pou kounye a.",

    noOrders:
      "Pa gen kòmand pou kounye a.",

    servicesText:
      "Sèvis Mystro-Shop yo ap parèt isit la.",

    currency:
      "Deviz",

    howSell:
      "Kijan pou vann ?",

    howSellAnswer:
      "Ale nan Vann, mete pwodwi ak foto li epi pibliye li.",

    commissionQuestion:
      "Ki komisyon Mystro-Shop pran ?",

    commissionAnswer:
      "Mystro-Shop pran 10% sou chak vant finalize.",

    addCart:
      "Ajoute nan panyen",

    search:
      "Chèche sou Mystro-Shop...",

    searchProduct:
      "Chèche yon pwodwi...",

    deposit:
      "+ Depoze",

    withdraw:
      "Retire",

    depositAmount:
      "Montan depo MonCash an HTG :",

    withdrawAmount:
      "Montan retrè MonCash an HTG :",

    moncashNumber:
      "Nimewo MonCash : 509XXXXXXXX",

    assistantWelcome:
      "Bonjou 👋 Mwen se asistan Mystro-Shop. Mwen ka ede w ak acha, vant, MonCash, deviz ak lang.",

    assistantPlaceholder:
      "Poze kesyon ou..."
  },


  en: {
    authSubtitle: "Buy, sell and grow your business.",
    login: "Log in",
    signup: "Sign up",
    password: "Password",
    forgotPassword: "Forgot password?",
    fullName: "Full name",
    role: "Role",
    confirmPassword: "Confirm password",
    createAccount: "Create my account",
    buyer: "Buyer",
    seller: "Seller",

    home: "Home",
    dashboard: "Dashboard",
    products: "Products",
    sell: "Sell",
    wallet: "Wallet",
    stats: "Statistics",
    clients: "Clients",
    orders: "Orders",
    chat: "Chat",
    services: "Services",
    profile: "Profile",
    help: "Help",
    logout: "Log out",

    marketTitle:
      "Mystro-Shop — International Marketplace",

    welcome:
      "Welcome to Mystro-Shop",

    welcomeText:
      "Buy and sell worldwide.",

    discoverProducts:
      "Discover products",

    featured:
      "Popular products",

    sales:
      "Sales",

    balance:
      "Balance",

    revenue:
      "Revenue",

    salesEvolution:
      "Sales evolution",

    publishProduct:
      "Publish a product",

    productName:
      "Product name",

    category:
      "Category",

    priceCurrency:
      "Price currency",

    price:
      "Price",

    stock:
      "Stock",

    productPhoto:
      "Product photo",

    description:
      "Description",

    publish:
      "Publish product",

    publishing:
      "Publishing...",

    commission:
      "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.",

    availableBalance:
      "Available balance",

    walletDescription:
      "Manage your deposits and withdrawals.",

    paymentMethods:
      "Methods",

    depositWithdraw:
      "Deposit / withdrawal",

    pendingIntegration:
      "Integration pending",

    bankTransfer:
      "Bank transfer",

    partnerIntegration:
      "Partner integration required",

    recentTransactions:
      "Recent transactions",

    noTransactions:
      "No transactions.",

    noClients:
      "No clients yet.",

    noOrders:
      "No orders yet.",

    servicesText:
      "Mystro-Shop services will appear here.",

    currency:
      "Currency",

    howSell:
      "How do I sell?",

    howSellAnswer:
      "Open Sell, add your product and photo, then publish.",

    commissionQuestion:
      "What commission does Mystro-Shop charge?",

    commissionAnswer:
      "Mystro-Shop charges 10% on every completed sale.",

    addCart:
      "Add to cart",

    search:
      "Search Mystro-Shop...",

    searchProduct:
      "Search for a product...",

    deposit:
      "+ Deposit",

    withdraw:
      "Withdraw",

    depositAmount:
      "MonCash deposit amount in HTG:",

    withdrawAmount:
      "MonCash withdrawal amount in HTG:",

    moncashNumber:
      "MonCash number: 509XXXXXXXX",

    assistantWelcome:
      "Hello 👋 I'm the Mystro-Shop assistant. I can help with buying, selling, MonCash, currencies and languages.",

    assistantPlaceholder:
      "Ask your question..."
  },


  es: {
    authSubtitle: "Compra, vende y desarrolla tu actividad.",
    login: "Iniciar sesión",
    signup: "Registrarse",
    password: "Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    fullName: "Nombre completo",
    role: "Rol",
    confirmPassword: "Confirmar contraseña",
    createAccount: "Crear mi cuenta",
    buyer: "Comprador",
    seller: "Vendedor",

    home: "Inicio",
    dashboard: "Panel",
    products: "Productos",
    sell: "Vender",
    wallet: "Cartera",
    stats: "Estadísticas",
    clients: "Clientes",
    orders: "Pedidos",
    chat: "Chat",
    services: "Servicios",
    profile: "Perfil",
    help: "Ayuda",
    logout: "Cerrar sesión",

    marketTitle:
      "Mystro-Shop — Mercado internacional",

    welcome:
      "Bienvenido a Mystro-Shop",

    welcomeText:
      "Compra y vende en todo el mundo.",

    discoverProducts:
      "Descubrir productos",

    featured:
      "Productos populares",

    sales:
      "Ventas",

    balance:
      "Saldo",

    revenue:
      "Ingresos",

    salesEvolution:
      "Evolución de ventas",

    publishProduct:
      "Publicar un producto",

    productName:
      "Nombre del producto",

    category:
      "Categoría",

    priceCurrency:
      "Moneda del precio",

    price:
      "Precio",

    stock:
      "Stock",

    productPhoto:
      "Foto del producto",

    description:
      "Descripción",

    publish:
      "Publicar producto",

    publishing:
      "Publicando...",

    commission:
      "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.",

    availableBalance:
      "Saldo disponible",

    walletDescription:
      "Gestiona tus depósitos y retiros.",

    paymentMethods:
      "Métodos",

    depositWithdraw:
      "Depósito / retiro",

    pendingIntegration:
      "Integración pendiente",

    bankTransfer:
      "Transferencia bancaria",

    partnerIntegration:
      "Se requiere integración con el socio",

    recentTransactions:
      "Transacciones recientes",

    noTransactions:
      "No hay transacciones.",

    noClients:
      "No hay clientes todavía.",

    noOrders:
      "No hay pedidos todavía.",

    servicesText:
      "Los servicios de Mystro-Shop aparecerán aquí.",

    currency:
      "Moneda",

    howSell:
      "¿Cómo vender?",

    howSellAnswer:
      "Abra Vender, añada el producto y su foto y publíquelo.",

    commissionQuestion:
      "¿Qué comisión cobra Mystro-Shop?",

    commissionAnswer:
      "Mystro-Shop cobra el 10% de cada venta completada.",

    addCart:
      "Añadir al carrito",

    search:
      "Buscar en Mystro-Shop...",

    searchProduct:
      "Buscar un producto...",

    deposit:
      "+ Depositar",

    withdraw:
      "Retirar",

    depositAmount:
      "Monto del depósito MonCash en HTG:",

    withdrawAmount:
      "Monto del retiro MonCash en HTG:",

    moncashNumber:
      "Número MonCash: 509XXXXXXXX",

    assistantWelcome:
      "Hola 👋 Soy el asistente de Mystro-Shop. Puedo ayudarte con compras, ventas, MonCash, monedas e idiomas.",

    assistantPlaceholder:
      "Haz tu pregunta..."
  }
};


function t(key) {
  return (
    translations[language]?.[key] ||
    translations.fr[key] ||
    key
  );
}


/* =========================
   MONEY
========================= */

function convertCurrency(
  amount,
  from,
  to
) {

  const value =
    Number(amount);


  if (!Number.isFinite(value)) {
    return 0;
  }


  if (!rates[from] || !rates[to]) {
    return value;
  }


  const usdValue =
    value / rates[from];


  return usdValue * rates[to];
}


function formatMoney(
  amount,
  code
) {

  const locales = {
    fr: "fr-FR",
    ht: "fr-HT",
    en: "en-US",
    es: "es-ES"
  };


  try {

    return new Intl.NumberFormat(
      locales[language] || "fr-FR",
      {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }
    ).format(
      Number(amount) || 0
    );

  } catch {

    return (
      Number(amount || 0)
        .toFixed(2) +
      " " +
      code
    );
  }
}


function productMoney(product) {

  const converted =
    convertCurrency(
      product.price,
      product.currency || "USD",
      currency
    );


  return formatMoney(
    converted,
    currency
  );
}


/* =========================
   TOAST
========================= */

function showToast(message) {

  const toast =
    $("#toast");


  if (!toast) {

    alert(message);

    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2500);
}


/* =========================
   LOGIN / SIGNUP
========================= */

function switchAuthMode(mode) {

  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");

  const loginTab =
    $("#loginTab");

  const signupTab =
    $("#signupTab");

  const showLogin =
    mode === "login";


  if (loginForm) {

    loginForm.hidden =
      !showLogin;

    loginForm.style.display =
      showLogin
        ? "block"
        : "none";
  }


  if (signupForm) {

    signupForm.hidden =
      showLogin;

    signupForm.style.display =
      showLogin
        ? "none"
        : "block";
  }


  loginTab
    ?.classList
    .toggle(
      "active",
      showLogin
    );


  signupTab
    ?.classList
    .toggle(
      "active",
      !showLogin
    );
}


/* =========================
   PROFILE
========================= */

function initials(name = "MS") {

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      word =>
        word.charAt(0)
          .toUpperCase()
    )
    .join("") ||
    "MS";
}


function isSeller() {

  const role =
    String(
      currentProfile?.role ||
      ""
    ).toLowerCase();


  return (
    role === "seller" ||
    role === "vendeur"
  );
}


function updateProfileUI() {

  if (!currentUser) {
    return;
  }


  const name =
    currentProfile?.name ||
    currentUser.email
      ?.split("@")[0] ||
    "Utilisateur";


  const email =
    currentProfile?.email ||
    currentUser.email ||
    "—";


  const role =
    isSeller()
      ? t("seller")
      : t("buyer");


  const avatar =
    initials(name);


  [
    "#sidebarAvatar",
    "#topAvatar",
    "#profileAvatar"
  ].forEach(
    selector => {

      const element =
        $(selector);

      if (element) {
        element.textContent =
          avatar;
      }
    }
  );


  const values = [
    ["#sidebarUserName", name],
    ["#sidebarUserRole", role],
    ["#profileName", name],
    ["#profileEmail", email],
    ["#profileRole", role],
    ["#profileNameInfo", name],
    ["#profileEmailInfo", email],
    ["#profileRoleInfo", role],
    ["#profileCurrencyInfo", currency]
  ];


  values.forEach(
    ([selector, value]) => {

      const element =
        $(selector);

      if (element) {
        element.textContent =
          value;
      }
    }
  );
}


/* =========================
   LANGUAGE
========================= */

function applyLanguage() {

  document.documentElement.lang =
    language;


  $$("[data-i18n]")
    .forEach(
      element => {

        const key =
          element.dataset.i18n;


        if (
          translations[language]?.[key]
        ) {

          element.textContent =
            translations[language][key];
        }
      }
    );


  if ($("#globalSearch")) {

    $("#globalSearch").placeholder =
      t("search");
  }


  if ($("#productSearch")) {

    $("#productSearch").placeholder =
      t("searchProduct");
  }


  if ($("#buyerOption")) {

    $("#buyerOption").textContent =
      t("buyer");
  }


  if ($("#sellerOption")) {

    $("#sellerOption").textContent =
      t("seller");
  }


  if ($("#depositBtn")) {

    $("#depositBtn").textContent =
      t("deposit");
  }


  if ($("#withdrawBtn")) {

    $("#withdrawBtn").textContent =
      t("withdraw");
  }


  if ($("#assistantInput")) {

    $("#assistantInput").placeholder =
      t("assistantPlaceholder");
  }


  renderProducts();

  updateProfileUI();
}


/* =========================
   AUTH DISPLAY
========================= */

function showAuth() {

  $("#authScreen")
    ?.classList
    .remove("hidden");


  $("#appShell")
    ?.classList
    .remove("app-ready");


  $("#appShell")
    ?.classList
    .add("app-locked");


  switchAuthMode(
    "login"
  );
}


function showApp() {

  $("#authScreen")
    ?.classList
    .add("hidden");


  $("#appShell")
    ?.classList
    .remove("app-locked");


  $("#appShell")
    ?.classList
    .add("app-ready");


  applyLanguage();

  showPage(
    "home"
  );
}


/* =========================
   AUTH ACTIONS
========================= */

async function handleLogin(
  event
) {

  event.preventDefault();


  try {

    await signInWithEmailAndPassword(
      auth,
      $("#loginEmail")
        ?.value
        .trim() || "",
      $("#loginPassword")
        ?.value || ""
    );


    showToast(
      "Connexion réussie."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Connexion impossible."
    );
  }
}


async function handleSignup(
  event
) {

  event.preventDefault();


  const name =
    $("#signupName")
      ?.value
      .trim();


  const email =
    $("#signupEmail")
      ?.value
      .trim();


  const role =
    $("#signupRole")
      ?.value ||
    "buyer";


  const password =
    $("#signupPassword")
      ?.value ||
    "";


  const confirm =
    $("#signupPasswordConfirm")
      ?.value ||
    "";


  if (
    !name ||
    !email ||
    password.length < 6
  ) {

    showToast(
      "Vérifiez les informations."
    );

    return;
  }


  if (
    password !==
    confirm
  ) {

    showToast(
      "Les mots de passe ne correspondent pas."
    );

    return;
  }


  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await setDoc(
      doc(
        db,
        "users",
        result.user.uid
      ),
      {
        name,
        email,
        role,
        currency,
        createdAt:
          serverTimestamp()
      }
    );


    showToast(
      "Compte créé avec succès."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Impossible de créer le compte."
    );
  }
}


async function forgotPassword() {

  const email =
    $("#loginEmail")
      ?.value
      .trim();


  if (!email) {

    showToast(
      "Entrez votre email."
    );

    return;
  }


  try {

    await sendPasswordResetEmail(
      auth,
      email
    );


    showToast(
      "Email envoyé."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Impossible d'envoyer l'email."
    );
  }
}


/* =========================
   PROFILE FIRESTORE
========================= */

async function loadProfile(user) {

  const reference =
    doc(
      db,
      "users",
      user.uid
    );


  let snapshot =
    await getDoc(
      reference
    );


  if (!snapshot.exists()) {

    await setDoc(
      reference,
      {
        name:
          user.email
            ?.split("@")[0] ||
          "Utilisateur",

        email:
          user.email || "",

        role:
          "buyer",

        currency,

        createdAt:
          serverTimestamp()
      }
    );


    snapshot =
      await getDoc(
        reference
      );
  }


  currentProfile =
    snapshot.data();


  updateProfileUI();
}


/* =========================
   NAVIGATION
========================= */

function closeSidebar() {

  $("#sidebar")
    ?.classList
    .remove("open");


  $("#overlay")
    ?.classList
    .remove("show");
}


function showPage(pageId) {

  /*
    Portefeuille n'est PAS ici.
    Il est disponible aussi
    pour les acheteurs.
  */

  const sellerPages =
    new Set([
      "dashboard",
      "sell",
      "stats",
      "clients"
    ]);


  if (
    sellerPages.has(pageId) &&
    !isSeller()
  ) {

    showToast(
      language === "ht"
        ? "Paj sa a rezève pou vandè."
        : language === "en"
          ? "This page is reserved for sellers."
          : language === "es"
            ? "Esta página está reservada a vendedores."
            : "Cette page est réservée aux vendeurs."
    );


    pageId =
      "home";
  }


  $$(".page")
    .forEach(
      page => {

        page.classList.toggle(
          "active",
          page.id === pageId
        );
      }
    );


  $$("[data-page]")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page === pageId
        );
      }
    );


  closeSidebar();


  if (
    pageId === "stats"
  ) {

    setTimeout(
      drawStats,
      80
    );
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   PRODUCTS
========================= */

const demoProducts = [

  {
    id: "1",
    name: "Sac premium",
    category: "Mode",
    price: 45,
    currency: "USD",
    stock: 6,
    emoji: "👜"
  },

  {
    id: "2",
    name: "Écouteurs sans fil",
    category: "Électronique",
    price: 35,
    currency: "USD",
    stock: 9,
    emoji: "🎧"
  },

  {
    id: "3",
    name: "Lampe décorative",
    category: "Maison",
    price: 2500,
    currency: "HTG",
    stock: 5,
    emoji: "💡"
  }

];


function createProductCard(
  product
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "product-card";


  const media =
    document.createElement(
      "div"
    );


  media.className =
    "product-image";


  if (product.imageUrl) {

    const image =
      document.createElement(
        "img"
      );


    image.src =
      product.imageUrl;


    image.alt =
      product.name ||
      "Produit";


    image.loading =
      "lazy";


    image.style.width =
      "100%";


    image.style.height =
      "100%";


    image.style.objectFit =
      "cover";


    media.appendChild(
      image
    );

  } else {

    media.textContent =
      product.emoji ||
      "📦";
  }


  const body =
    document.createElement(
      "div"
    );


  body.className =
    "product-body";


  const category =
    document.createElement(
      "div"
    );


  category.className =
    "product-category";


  category.textContent =
    product.category ||
    "";


  const name =
    document.createElement(
      "h3"
    );


  name.textContent =
    product.name ||
    "Produit";


  const price =
    document.createElement(
      "div"
    );


  price.className =
    "product-price";


  price.textContent =
    productMoney(
      product
    );


  const stock =
    document.createElement(
      "small"
    );


  stock.textContent =
    `${t("stock")} : ${
      Number(product.stock || 0)
    }`;


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "btn btn-primary";


  button.textContent =
    t("addCart");


  button.addEventListener(
    "click",
    () => {

      cartCount++;


      showToast(
        `${t("addCart")} (${cartCount})`
      );
    }
  );


  body.append(
    category,
    name,
    price,
    stock,
    button
  );


  card.append(
    media,
    body
  );


  return card;
}


function filteredProducts() {

  const search =
    $("#productSearch")
      ?.value
      .trim()
      .toLowerCase() ||
    "";


  const category =
    $("#categoryFilter")
      ?.value ||
    "all";


  return products.filter(
    product => {

      const text =
        `${
          product.name || ""
        } ${
          product.category || ""
        }`
          .toLowerCase();


      return (
        (
          !search ||
          text.includes(search)
        )
        &&
        (
          category === "all" ||
          product.category === category
        )
      );
    }
  );
}


function renderProducts() {

  const grid =
    $("#productGrid");


  if (grid) {

    grid.replaceChildren();


    filteredProducts()
      .forEach(
        product => {

          grid.appendChild(
            createProductCard(
              product
            )
          );
        }
      );
  }


  const featured =
    $("#featuredProducts");


  if (featured) {

    featured.replaceChildren();


    products
      .slice(0, 4)
      .forEach(
        product => {

          featured.appendChild(
            createProductCard(
              product
            )
          );
        }
      );
  }
}


async function loadProducts() {

  try {

    const productsQuery =
      query(
        collection(
          db,
          "products"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(
        productsQuery
      );


    products =
      snapshot.docs.map(
        item => ({
          id:
            item.id,
          ...item.data()
        })
      );


    if (
      !products.length
    ) {

      products =
        [...demoProducts];
    }

  } catch (error) {

    console.warn(
      error
    );


    products =
      [...demoProducts];
  }


  renderProducts();
}


/* =========================
   IMAGE PREVIEW
========================= */

function previewImage() {

  const file =
    $("#productImage")
      ?.files?.[0];


  const box =
    $("#productImagePreview");


  if (!box) {
    return;
  }


  box.replaceChildren();


  if (!file) {
    return;
  }


  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type)
  ) {

    showToast(
      "JPEG, PNG ou WebP uniquement."
    );

    return;
  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    showToast(
      "Maximum 5 MB."
    );

    return;
  }


  const image =
    document.createElement(
      "img"
    );


  image.src =
    URL.createObjectURL(
      file
    );


  image.style.width =
    "100%";


  image.style.maxHeight =
    "300px";


  image.style.objectFit =
    "cover";


  image.style.borderRadius =
    "18px";


  box.appendChild(
    image
  );
}


/* =========================
   IMAGE UPLOAD
========================= */

async function uploadProductImage(
  file
) {

  const token =
    await currentUser
      .getIdToken(true);


  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  const response =
    await fetch(
      `${API_URL}/products/image-upload`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`
        },

        body:
          formData
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (
    !response.ok ||
    !data.ok ||
    !data.imageUrl
  ) {

    throw new Error(
      data.error ||
      "UPLOAD_FAILED"
    );
  }


  return data;
}


/* =========================
   PUBLISH PRODUCT
========================= */

async function publishProduct(
  event
) {

  event.preventDefault();


  if (
    !currentUser ||
    !isSeller()
  ) {

    showToast(
      "Compte vendeur requis."
    );

    return;
  }


  const name =
    $("#productName")
      ?.value
      .trim();


  const category =
    $("#productCategory")
      ?.value;


  const price =
    Number(
      $("#productPrice")
        ?.value
    );


  const productCurrency =
    $("#productCurrency")
      ?.value;


  const stock =
    Number(
      $("#productStock")
        ?.value
    );


  const description =
    $("#productDescription")
      ?.value
      .trim() ||
    "";


  const file =
    $("#productImage")
      ?.files?.[0];


  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 1 ||
    !file
  ) {

    showToast(
      "Vérifiez le formulaire."
    );

    return;
  }


  const button =
    $("#publishProductBtn");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      t("publishing");
  }


  try {

    const uploaded =
      await uploadProductImage(
        file
      );


    await addDoc(
      collection(
        db,
        "products"
      ),
      {
        sellerId:
          currentUser.uid,

        sellerName:
          currentProfile?.name ||
          "",

        name,

        category,

        description,

        price,

        currency:
          productCurrency,

        stock,

        imageUrl:
          uploaded.imageUrl,

        imagePath:
          uploaded.path ||
          "",

        commissionRate:
          COMMISSION_RATE,

        active:
          true,

        createdAt:
          serverTimestamp()
      }
    );


    event.currentTarget
      .reset();


    if (
      $("#productStock")
    ) {

      $("#productStock").value =
        "1";
    }


    $("#productImagePreview")
      ?.replaceChildren();


    await loadProducts();


    showToast(
      "Produit publié."
    );


    showPage(
      "products"
    );

  } catch (error) {

    console.error(error);


    showToast(
      "Publication impossible."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        t("publish");
    }
  }
}


/* =========================
   MONCASH DEPOSIT
========================= */

async function monCashDeposit() {

  const raw =
    prompt(
      t("depositAmount")
    );


  if (
    raw === null
  ) {
    return;
  }


  const amount =
    Number(
      String(raw)
        .replace(
          ",",
          "."
        )
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Montant invalide."
    );

    return;
  }


  try {

    const response =
      await fetch(
        `${API_URL}/moncash/deposit`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              amount
            })
        }
      );


    const data =
      await response
        .json();


    if (
      !response.ok ||
      !data.ok ||
      !data.redirectUrl
    ) {

      throw new Error(
        data.error ||
        "DEPOSIT_FAILED"
      );
    }


    window.location.href =
      data.redirectUrl;

  } catch (error) {

    console.error(error);


    showToast(
      "Dépôt impossible."
    );
  }
}


/* =========================
   MONCASH WITHDRAW
========================= */

async function monCashWithdraw() {

  if (!currentUser) {

    showToast(
      "Connectez-vous."
    );

    return;
  }


  const raw =
    prompt(
      t("withdrawAmount")
    );


  if (
    raw === null
  ) {
    return;
  }


  const amount =
    Number(
      String(raw)
        .replace(
          ",",
          "."
        )
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Montant invalide."
    );

    return;
  }


  const phone =
    prompt(
      t("moncashNumber")
    );


  if (!phone) {
    return;
  }


  const receiver =
    String(phone)
      .replace(
        /\D/g,
        ""
      );


  if (
    !/^509\d{8}$/
      .test(receiver)
  ) {

    showToast(
      "Numéro invalide."
    );

    return;
  }


  try {

    const token =
      await currentUser
        .getIdToken(true);


    const reference =
      `MSW-${currentUser.uid.slice(0,10)}-${Date.now()}`;


    const response =
      await fetch(
        `${API_URL}/moncash/withdraw`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              amount,
              receiver,
              reference
            })
        }
      );


    const data =
      await response
        .json();


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.error ||
        "WITHDRAW_FAILED"
      );
    }


    showToast(
      `${amount} HTG ✓`
    );

  } catch (error) {

    console.error(error);


    showToast(
      "Retrait impossible."
    );
  }
}


/* =========================
   STATISTICS
========================= */

function drawLineChart(
  canvas,
  values
) {

  if (
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return;
  }


  const width =
    canvas.clientWidth ||
    600;


  const height =
    240;


  canvas.width =
    width;


  canvas.height =
    height;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const padding =
    28;


  const maximum =
    Math.max(
      ...values,
      1
    );


  ctx.lineWidth =
    3;


  ctx.beginPath();


  values.forEach(
    (value, index) => {

      const x =
        padding +
        (
          index /
          Math.max(
            values.length - 1,
            1
          )
        ) *
        (
          width -
          padding * 2
        );


      const y =
        height -
        padding -
        (
          value /
          maximum
        ) *
        (
          height -
          padding * 2
        );


      if (
        index === 0
      ) {

        ctx.moveTo(
          x,
          y
        );

      } else {

        ctx.lineTo(
          x,
          y
        );
      }
    }
  );


  ctx.stroke();
}


function drawStats() {

  drawLineChart(
    $("#statsChart"),
    [
      2,
      5,
      4,
      8,
      6,
      11,
      13
    ]
  );


  drawLineChart(
    $("#revenueChart"),
    [
      3,
      4,
      7,
      6,
      10,
      13,
      15
    ]
  );
}


/* =========================
   ASSISTANT
========================= */

function assistantAnswer(message) {

  const text =
    String(message)
      .toLowerCase();


  if (
    /depot|dépôt|deposit|depoz/.test(
      text
    )
  ) {

    if (language === "ht") {
      return "Ale nan Pòtfèy epi peze Depoze pou chwazi montan MonCash la.";
    }

    if (language === "en") {
      return "Open Wallet and tap Deposit to choose your MonCash deposit amount.";
    }

    if (language === "es") {
      return "Abra Cartera y pulse Depositar para elegir el monto MonCash.";
    }

    return "Ouvrez Portefeuille puis Déposer pour choisir le montant MonCash.";
  }


  if (
    /retrait|withdraw|retire|retirar/.test(
      text
    )
  ) {

    if (language === "ht") {
      return "Ale nan Pòtfèy, peze Retire, antre montan an ak nimewo MonCash ou.";
    }

    if (language === "en") {
      return "Open Wallet, tap Withdraw, enter the amount and your MonCash number.";
    }

    if (language === "es") {
      return "Abra Cartera, pulse Retirar e introduzca el monto y su número MonCash.";
    }

    return "Ouvrez Portefeuille, appuyez sur Retirer puis entrez le montant et le numéro MonCash.";
  }


  if (
    /vend|vann|sell|vender/.test(
      text
    )
  ) {

    if (language === "ht") {
      return "Ale nan Vann, mete enfòmasyon pwodwi a ak foto li epi pibliye li.";
    }

    if (language === "en") {
      return "Open Sell, add the product information and photo, then publish it.";
    }

    if (language === "es") {
      return "Abra Vender, añada la información y la foto del producto y publíquelo.";
    }

    return "Ouvrez Vendre, ajoutez les informations et la photo du produit puis publiez.";
  }


  if (
    /commission|10%|komisyon/.test(
      text
    )
  ) {

    if (language === "ht") {
      return "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.";
    }

    if (language === "en") {
      return "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.";
    }

    if (language === "es") {
      return "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.";
    }

    return "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.";
  }


  return t(
    "assistantWelcome"
  );
}


function addAssistantMessage(
  message,
  user = false
) {

  const box =
    $("#assistantMessages");


  if (!box) {
    return;
  }


  const bubble =
    document.createElement(
      "div"
    );


  bubble.textContent =
    message;


  bubble.style.padding =
    "10px";


  bubble.style.margin =
    "7px 0";


  bubble.style.borderRadius =
    "12px";


  bubble.style.maxWidth =
    "85%";


  if (user) {

    bubble.style.marginLeft =
      "auto";

    bubble.style.background =
      "#2563eb";

    bubble.style.color =
      "white";

  } else {

    bubble.style.background =
      "#e2e8f0";
  }


  box.appendChild(
    bubble
  );


  box.scrollTop =
    box.scrollHeight;
}


/* =========================
   EVENTS
========================= */

function initEvents() {

  $("#loginTab")
    ?.addEventListener(
      "click",
      () =>
        switchAuthMode(
          "login"
        )
    );


  $("#signupTab")
    ?.addEventListener(
      "click",
      () =>
        switchAuthMode(
          "signup"
        )
    );


  $("#loginForm")
    ?.addEventListener(
      "submit",
      handleLogin
    );


  $("#signupForm")
    ?.addEventListener(
      "submit",
      handleSignup
    );


  $("#forgotPasswordBtn")
    ?.addEventListener(
      "click",
      forgotPassword
    );


  $("#logoutBtn")
    ?.addEventListener(
      "click",
      () =>
        signOut(auth)
    );


  $("#profileLogoutBtn")
    ?.addEventListener(
      "click",
      () =>
        signOut(auth)
    );


  $("#menuToggle")
    ?.addEventListener(
      "click",
      () => {

        $("#sidebar")
          ?.classList
          .add("open");


        $("#overlay")
          ?.classList
          .add("show");
      }
    );


  $("#overlay")
    ?.addEventListener(
      "click",
      closeSidebar
    );


  document.addEventListener(
    "click",
    event => {

      const target =
        event.target instanceof Element
          ? event.target
          : null;


      const page =
        target?.closest(
          "[data-page]"
        );


      if (page) {

        showPage(
          page.dataset.page
        );
      }


      const go =
        target?.closest(
          "[data-go]"
        );


      if (go) {

        showPage(
          go.dataset.go
        );
      }
    }
  );


  $("#currencySelect")
    ?.addEventListener(
      "change",
      event => {

        currency =
          event.target.value;


        localStorage.setItem(
          "mystroCurrency",
          currency
        );


        renderProducts();

        updateProfileUI();
      }
    );


  $("#languageSelect")
    ?.addEventListener(
      "change",
      event => {

        language =
          event.target.value;


        localStorage.setItem(
          "mystroLanguage",
          language
        );


        applyLanguage();
      }
    );


  $("#productSearch")
    ?.addEventListener(
      "input",
      renderProducts
    );


  $("#categoryFilter")
    ?.addEventListener(
      "change",
      renderProducts
    );


  $("#productImage")
    ?.addEventListener(
      "change",
      previewImage
    );


  $("#productForm")
    ?.addEventListener(
      "submit",
      publishProduct
    );


  $("#depositBtn")
    ?.addEventListener(
      "click",
      monCashDeposit
    );


  $("#withdrawBtn")
    ?.addEventListener(
      "click",
      monCashWithdraw
    );


  $("#assistantToggle")
    ?.addEventListener(
      "click",
      () => {

        const panel =
          $("#assistantPanel");


        if (!panel) {
          return;
        }


        panel.style.display =
          "block";


        if (
          !$("#assistantMessages")
            ?.children.length
        ) {

          addAssistantMessage(
            t("assistantWelcome")
          );
        }
      }
    );


  $("#assistantClose")
    ?.addEventListener(
      "click",
      () => {

        const panel =
          $("#assistantPanel");


        if (panel) {

          panel.style.display =
            "none";
        }
      }
    );


  $("#assistantForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const input =
          $("#assistantInput");


        const message =
          input?.value
            .trim();


        if (!message) {
          return;
        }


        addAssistantMessage(
          message,
          true
        );


        input.value =
          "";


        setTimeout(
          () => {

            addAssistantMessage(
              assistantAnswer(
                message
              )
            );

          },
          200
        );
      }
    );


  $("#globalSearch")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key !==
          "Enter"
        ) {

          return;
        }


        showPage(
          "products"
        );


        if (
          $("#productSearch")
        ) {

          $("#productSearch").value =
            event.target.value;
        }


        renderProducts();
      }
    );
}


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user) {

      currentProfile =
        null;


      showAuth();

      return;
    }


    try {

      await loadProfile(
        user
      );


      showApp();


      await loadProducts();


      drawStats();

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Erreur de chargement."
      );
    }
  }
);


/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (
      $("#currencySelect")
    ) {

      $("#currencySelect").value =
        currency;
    }


    if (
      $("#languageSelect")
    ) {

      $("#languageSelect").value =
        language;
    }


    products =
      [...demoProducts];


    initEvents();


    switchAuthMode(
      "login"
    );


    applyLanguage();


    renderProducts();


    drawStats();
  }
);
/* =========================
   PWA SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );

      console.log(
        "Mystro-Shop PWA active :",
        registration.scope
      );

    } catch (error) {
      console.error(
        "Erreur Service Worker :",
        error
      );
    }
  });
     }

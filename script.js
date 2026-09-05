/* =========================================================
   MYSTRO-SHOP - SCRIPT.JS
   Firebase + Firestore + Supabase + MonCash
   Multi-langues + Multi-devises
   Version production-ready côté navigateur
========================================================= */

/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

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

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    accessToken: async () => {
      const user = auth.currentUser;

      if (!user) {
        return null;
      }

      return await user.getIdToken(false);
    }
  }
);


/* =========================================================
   MYSTRO-SHOP BACKEND
========================================================= */

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";


/* =========================================================
   MONCASH OFFICIAL LIVE URLS
========================================================= */

/*
  IMPORTANT :

  Ces URL sont publiques.

  Le CLIENT ID et le CLIENT SECRET MonCash
  NE DOIVENT JAMAIS être placés ici.

  Ils doivent rester comme secrets
  dans Cloudflare Worker.
*/

const MONCASH_LIVE_API_ORIGIN =
  "https://moncashbutton.digicelgroup.com";

const MONCASH_LIVE_API =
  "https://moncashbutton.digicelgroup.com/Api";

const MONCASH_LIVE_GATEWAY =
  "https://moncashbutton.digicelgroup.com/Moncash-middleware";


/* =========================================================
   MYSTRO-SHOP SETTINGS
========================================================= */

const COMMISSION_RATE = 0.10;

const PRODUCT_IMAGE_MAX_SIZE =
  5 * 1024 * 1024;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let products = [];

let cart = [];

let currency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let language =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";


/* =========================================================
   CURRENCIES
========================================================= */

/*
  Valeurs indicatives.
  Elles ne sont PAS des taux Forex live.
*/

const rates = {
  USD: 1,
  HTG: 130,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79
};


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

  fr: {

    login: "Se connecter",
    signup: "S'inscrire",

    buyer: "Acheteur",
    seller: "Vendeur",

    home: "Accueil",
    dashboard: "Tableau de bord",
    products: "Produits",
    sell: "Vendre",
    wallet: "Portefeuille",
    stats: "Statistiques",
    clients: "Clients actifs",
    orders: "Commandes",
    chat: "Chat",
    services: "Services",
    profile: "Profil",
    help: "Aide",
    logout: "Se déconnecter",

    marketTitle:
      "Mystro-Shop — Marché international",

    welcome:
      "Bienvenue à Mystro-Shop",

    welcomeText:
      "Achetez et vendez partout dans le monde.",

    discoverProducts:
      "Découvrir les produits",

    featured:
      "Produits populaires",

    addCart:
      "Ajouter au panier",

    stock:
      "Stock",

    publish:
      "Publier le produit",

    publishing:
      "Publication...",

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

    assistantPlaceholder:
      "Posez votre question...",

    assistantWelcome:
      "Bonjour 👋 Je suis l'assistant Mystro-Shop. Je peux vous aider avec les achats, ventes, MonCash, devises et langues.",

    paymentPending:
      "Paiement en attente de confirmation.",

    paymentSuccess:
      "Dépôt MonCash confirmé.",

    paymentFailed:
      "Le paiement MonCash n'a pas été confirmé.",

    withdrawalSuccess:
      "Retrait MonCash confirmé.",

    liveRequired:
      "Le serveur MonCash n'est pas encore confirmé en mode Production.",

    loginRequired:
      "Connectez-vous d'abord."
  },


  ht: {

    login: "Konekte",
    signup: "Enskri",

    buyer: "Achtè",
    seller: "Vandè",

    home: "Akèy",
    dashboard: "Tablo kontwòl",
    products: "Pwodwi",
    sell: "Vann",
    wallet: "Pòtfèy",
    stats: "Estatistik",
    clients: "Kliyan aktif",
    orders: "Kòmand",
    chat: "Mesaj",
    services: "Sèvis",
    profile: "Pwofil",
    help: "Èd",
    logout: "Dekonekte",

    marketTitle:
      "Mystro-Shop — Mache entènasyonal",

    welcome:
      "Byenveni nan Mystro-Shop",

    welcomeText:
      "Achte epi vann atravè lemond.",

    discoverProducts:
      "Dekouvri pwodwi",

    featured:
      "Pwodwi popilè",

    addCart:
      "Ajoute nan panyen",

    stock:
      "Stòk",

    publish:
      "Pibliye pwodwi",

    publishing:
      "Ap pibliye...",

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

    assistantPlaceholder:
      "Poze kesyon ou...",

    assistantWelcome:
      "Bonjou 👋 Mwen se asistan Mystro-Shop. Mwen ka ede w ak acha, vant, MonCash, deviz ak lang.",

    paymentPending:
      "Peman an ap tann konfimasyon.",

    paymentSuccess:
      "Depo MonCash la konfime.",

    paymentFailed:
      "Peman MonCash la pa konfime.",

    withdrawalSuccess:
      "Retrè MonCash la konfime.",

    liveRequired:
      "Sèvè MonCash la poko konfime nan mòd Production.",

    loginRequired:
      "Konekte anvan."
  },


  en: {

    login: "Log in",
    signup: "Sign up",

    buyer: "Buyer",
    seller: "Seller",

    home: "Home",
    dashboard: "Dashboard",
    products: "Products",
    sell: "Sell",
    wallet: "Wallet",
    stats: "Statistics",
    clients: "Active clients",
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

    addCart:
      "Add to cart",

    stock:
      "Stock",

    publish:
      "Publish product",

    publishing:
      "Publishing...",

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

    assistantPlaceholder:
      "Ask your question...",

    assistantWelcome:
      "Hello 👋 I'm the Mystro-Shop assistant. I can help with purchases, sales, MonCash, currencies and languages.",

    paymentPending:
      "Payment is awaiting confirmation.",

    paymentSuccess:
      "MonCash deposit confirmed.",

    paymentFailed:
      "MonCash payment was not confirmed.",

    withdrawalSuccess:
      "MonCash withdrawal confirmed.",

    liveRequired:
      "The MonCash server is not yet confirmed in Production mode.",

    loginRequired:
      "Please log in first."
  },


  es: {

    login: "Iniciar sesión",
    signup: "Registrarse",

    buyer: "Comprador",
    seller: "Vendedor",

    home: "Inicio",
    dashboard: "Panel",
    products: "Productos",
    sell: "Vender",
    wallet: "Cartera",
    stats: "Estadísticas",
    clients: "Clientes activos",
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

    addCart:
      "Añadir al carrito",

    stock:
      "Stock",

    publish:
      "Publicar producto",

    publishing:
      "Publicando...",

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

    assistantPlaceholder:
      "Haz tu pregunta...",

    assistantWelcome:
      "Hola 👋 Soy el asistente de Mystro-Shop. Puedo ayudarte con compras, ventas, MonCash, monedas e idiomas.",

    paymentPending:
      "El pago está pendiente de confirmación.",

    paymentSuccess:
      "Depósito MonCash confirmado.",

    paymentFailed:
      "El pago MonCash no fue confirmado.",

    withdrawalSuccess:
      "Retiro MonCash confirmado.",

    liveRequired:
      "El servidor MonCash aún no está confirmado en modo Producción.",

    loginRequired:
      "Inicie sesión primero."
  }
};


/* =========================================================
   TRANSLATION HELPER
========================================================= */

function t(key) {

  return (
    translations[language]?.[key] ||
    translations.fr[key] ||
    key
  );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast = $("#toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3000);
}


/* =========================================================
   MONEY
========================================================= */

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

  if (
    !rates[from] ||
    !rates[to]
  ) {
    return value;
  }

  const amountUSD =
    value / rates[from];

  return (
    amountUSD *
    rates[to]
  );
}


function formatMoney(
  amount,
  code = currency
) {

  const locales = {
    fr: "fr-FR",
    ht: "fr-HT",
    en: "en-US",
    es: "es-ES"
  };

  try {

    return new Intl.NumberFormat(
      locales[language] ||
      "fr-FR",
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

  const value =
    convertCurrency(
      product.price,
      product.currency || "USD",
      currency
    );

  return formatMoney(
    value,
    currency
  );
}


/* =========================================================
   AUTH TABS
========================================================= */

function switchAuthMode(mode) {

  const loginForm =
    $("#loginForm");

  const signupForm =
    $("#signupForm");

  const loginTab =
    $("#loginTab");

  const signupTab =
    $("#signupTab");

  const login =
    mode === "login";

  if (loginForm) {

    loginForm.hidden =
      !login;

    loginForm.style.display =
      login
        ? "block"
        : "none";
  }

  if (signupForm) {

    signupForm.hidden =
      login;

    signupForm.style.display =
      login
        ? "none"
        : "block";
  }

  loginTab?.classList.toggle(
    "active",
    login
  );

  signupTab?.classList.toggle(
    "active",
    !login
  );
}


/* =========================================================
   AUTH DISPLAY
========================================================= */

function showAuth() {

  $("#authScreen")
    ?.classList.remove(
      "hidden"
    );

  $("#appShell")
    ?.classList.remove(
      "app-ready"
    );

  $("#appShell")
    ?.classList.add(
      "app-locked"
    );

  switchAuthMode(
    "login"
  );
}


function showApp() {

  $("#authScreen")
    ?.classList.add(
      "hidden"
    );

  $("#appShell")
    ?.classList.remove(
      "app-locked"
    );

  $("#appShell")
    ?.classList.add(
      "app-ready"
    );

  applyLanguage();

  showPage("home");
}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

  event.preventDefault();

  const email =
    $("#loginEmail")
      ?.value
      .trim() || "";

  const password =
    $("#loginPassword")
      ?.value || "";

  if (
    !email ||
    !password
  ) {

    showToast(
      "Email et mot de passe requis."
    );

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    showToast(
      "Connexion réussie."
    );

  } catch (error) {

    console.error(
      "LOGIN:",
      error
    );

    showToast(
      "Connexion impossible."
    );
  }
}


/* =========================================================
   SIGNUP
========================================================= */

async function handleSignup(event) {

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
    !email
  ) {

    showToast(
      "Complétez le formulaire."
    );

    return;
  }

  if (
    password.length < 6
  ) {

    showToast(
      "Mot de passe : minimum 6 caractères."
    );

    return;
  }

  if (
    password !== confirm
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
      "Compte créé."
    );

  } catch (error) {

    console.error(
      "SIGNUP:",
      error
    );

    showToast(
      "Création du compte impossible."
    );
  }
}


/* =========================================================
   PASSWORD RESET
========================================================= */

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

    console.error(
      "PASSWORD RESET:",
      error
    );

    showToast(
      "Impossible d'envoyer l'email."
    );
  }
}


/* =========================================================
   PROFILE
========================================================= */

function initials(
  name = "MS"
) {

  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        word =>
          word
            .charAt(0)
            .toUpperCase()
      )
      .join("") ||
    "MS"
  );
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


async function loadProfile(user) {

  const reference =
    doc(
      db,
      "users",
      user.uid
    );

  let snapshot =
    await getDoc(reference);

  if (!snapshot.exists()) {

    await setDoc(
      reference,
      {
        name:
          user.email
            ?.split("@")[0] ||
          "Utilisateur",

        email:
          user.email ||
          "",

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

    [
      "#sidebarUserName",
      name
    ],

    [
      "#sidebarUserRole",
      role
    ],

    [
      "#profileName",
      name
    ],

    [
      "#profileEmail",
      email
    ],

    [
      "#profileRole",
      role
    ],

    [
      "#profileNameInfo",
      name
    ],

    [
      "#profileEmailInfo",
      email
    ],

    [
      "#profileRoleInfo",
      role
    ],

    [
      "#profileCurrencyInfo",
      currency
    ]
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


/* =========================================================
   LANGUAGE
========================================================= */

function applyLanguage() {

  document.documentElement.lang =
    language;

  $$("[data-i18n]")
    .forEach(element => {

      const key =
        element.dataset.i18n;

      if (
        translations[language]?.[key]
      ) {

        element.textContent =
          translations[language][key];
      }
    });

  if ($("#globalSearch")) {

    $("#globalSearch")
      .placeholder =
      "Rechercher sur Mystro-Shop...";
  }

  if ($("#productSearch")) {

    $("#productSearch")
      .placeholder =
      language === "ht"
        ? "Chèche yon pwodwi..."
        : language === "en"
          ? "Search for a product..."
          : language === "es"
            ? "Buscar un producto..."
            : "Rechercher un produit...";
  }

  if ($("#assistantInput")) {

    $("#assistantInput")
      .placeholder =
      t("assistantPlaceholder");
  }

  if ($("#depositBtn")) {

    $("#depositBtn")
      .textContent =
      t("deposit");
  }

  if ($("#withdrawBtn")) {

    $("#withdrawBtn")
      .textContent =
      t("withdraw");
  }

  renderProducts();

  updateProfileUI();
}


/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar() {

  $("#sidebar")
    ?.classList.add(
      "open"
    );

  $("#overlay")
    ?.classList.add(
      "show"
    );
}


function closeSidebar() {

  $("#sidebar")
    ?.classList.remove(
      "open"
    );

  $("#overlay")
    ?.classList.remove(
      "show"
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId) {

  /*
    Le portefeuille reste accessible
    aux acheteurs ET aux vendeurs.
  */

  const sellerOnlyPages =
    new Set([
      "dashboard",
      "sell",
      "stats",
      "clients"
    ]);

  if (
    sellerOnlyPages.has(pageId) &&
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
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === pageId
      );
    });

  $$("[data-page]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page ===
          pageId
      );
    });

  closeSidebar();

  if (
    pageId === "stats" ||
    pageId === "dashboard"
  ) {

    setTimeout(
      drawStats,
      100
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   PRODUCTS DEMO
========================================================= */

const demoProducts = [

  {
    id: "demo-1",
    name: "Sac premium",
    category: "Mode",
    price: 45,
    currency: "USD",
    stock: 6,
    emoji: "👜"
  },

  {
    id: "demo-2",
    name: "Écouteurs sans fil",
    category: "Électronique",
    price: 35,
    currency: "USD",
    stock: 9,
    emoji: "🎧"
  },

  {
    id: "demo-3",
    name: "Lampe décorative",
    category: "Maison",
    price: 2500,
    currency: "HTG",
    stock: 5,
    emoji: "💡"
  }
];


/* =========================================================
   PRODUCT CARD
========================================================= */

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
      Number(
        product.stock || 0
      )
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

      cart.push({
        ...product
      });

      updateCartCounter();

      showToast(
        language === "ht"
          ? "Pwodwi ajoute nan panyen."
          : language === "en"
            ? "Product added to cart."
            : language === "es"
              ? "Producto añadido al carrito."
              : "Produit ajouté au panier."
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


/* =========================================================
   CART COUNTER
========================================================= */

function updateCartCounter() {

  const counters = [
    "#cartCount",
    "#cartBadge"
  ];

  counters.forEach(
    selector => {

      const element =
        $(selector);

      if (element) {
        element.textContent =
          String(
            cart.length
          );
      }
    }
  );
}


/* =========================================================
   FILTER PRODUCTS
========================================================= */

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
        } ${
          product.description || ""
        }`
          .toLowerCase();

      const matchesSearch =
        !search ||
        text.includes(
          search
        );

      const matchesCategory =
        category === "all" ||
        product.category ===
          category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

  const grid =
    $("#productGrid");

  if (grid) {

    grid.replaceChildren();

    const visibleProducts =
      filteredProducts();

    visibleProducts.forEach(
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


/* =========================================================
   LOAD FIRESTORE PRODUCTS
========================================================= */

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

    const firestoreProducts =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    products =
      firestoreProducts.length
        ? firestoreProducts
        : [...demoProducts];

  } catch (error) {

    console.error(
      "LOAD PRODUCTS:",
      error
    );

    products =
      [...demoProducts];
  }

  renderProducts();
}


/* =========================================================
   PRODUCT IMAGE PREVIEW
========================================================= */

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


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showToast(
      "Image JPEG, PNG ou WebP uniquement."
    );

    return;
  }


  if (
    file.size >
    PRODUCT_IMAGE_MAX_SIZE
  ) {

    showToast(
      "Image trop grande. Maximum 5 MB."
    );

    return;
  }


  const image =
    document.createElement(
      "img"
    );

  const previewURL =
    URL.createObjectURL(
      file
    );

  image.src =
    previewURL;

  image.onload =
    () => {
      URL.revokeObjectURL(
        previewURL
      );
    };

  box.appendChild(
    image
  );
}


/* =========================================================
   PRODUCT IMAGE UPLOAD
========================================================= */

async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "USER_NOT_CONNECTED"
    );
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "INVALID_IMAGE_TYPE"
    );
  }


  if (
    file.size >
    PRODUCT_IMAGE_MAX_SIZE
  ) {

    throw new Error(
      "IMAGE_TOO_LARGE"
    );
  }


  const rawExtension =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    ).toLowerCase();


  const extension =
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(
      rawExtension
    )
      ? rawExtension
      : "jpg";


  const randomPart =
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : Math.random()
          .toString(36)
          .slice(2);


  const path =
    `${currentUser.uid}/${Date.now()}-${randomPart}.${extension}`;


  const {
    error: uploadError
  } =
    await supabase.storage
      .from(
        "product-images"
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (uploadError) {

    console.error(
      "SUPABASE UPLOAD:",
      uploadError
    );

    throw uploadError;
  }


  const {
    data
  } =
    supabase.storage
      .from(
        "product-images"
      )
      .getPublicUrl(
        path
      );


  if (
    !data?.publicUrl
  ) {

    throw new Error(
      "PUBLIC_URL_NOT_FOUND"
    );
  }


  return {
    imageUrl:
      data.publicUrl,

    path
  };
}


/* =========================================================
   PUBLISH PRODUCT
========================================================= */

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
      ?.value ||
    "HTG";


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
      "Vérifiez toutes les informations du produit."
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
          uploaded.path,

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

      $("#productStock")
        .value =
        "1";
    }


    $("#productImagePreview")
      ?.replaceChildren();


    await loadProducts();


    showToast(
      "Produit publié avec succès."
    );


    showPage(
      "products"
    );

  } catch (error) {

    console.error(
      "PUBLISH PRODUCT:",
      error
    );


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


/* =========================================================
   MONCASH HELPERS
========================================================= */

function normalizeHTGAmount(
  value
) {

  const amount =
    Number(
      String(value)
        .replace(
          ",",
          "."
        )
        .trim()
    );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return null;
  }

  return Number(
    amount.toFixed(2)
  );
}


function normalizeHaitiPhone(
  value
) {

  let digits =
    String(value || "")
      .replace(
        /\D/g,
        ""
      );


  if (
    digits.length === 8
  ) {

    digits =
      `509${digits}`;
  }


  if (
    !/^509\d{8}$/.test(
      digits
    )
  ) {

    return null;
  }


  return digits;
}


/* =========================================================
   FIREBASE ID TOKEN
========================================================= */

async function getSecureIdToken() {

  const user =
    auth.currentUser;

  if (!user) {

    throw new Error(
      "AUTH_REQUIRED"
    );
  }


  return await user.getIdToken(
    true
  );
}


/* =========================================================
   VERIFY LIVE MONCASH REDIRECT
========================================================= */

function isOfficialLiveMonCashURL(
  value
) {

  try {

    const url =
      new URL(value);


    return (
      url.origin ===
        MONCASH_LIVE_API_ORIGIN &&
      url.pathname.startsWith(
        "/Moncash-middleware/"
      )
    );

  } catch {

    return false;
  }
}


/* =========================================================
   MONCASH REAL DEPOSIT
========================================================= */

async function monCashDeposit() {

  if (!currentUser) {

    showToast(
      t("loginRequired")
    );

    return;
  }


  const raw =
    prompt(
      t("depositAmount")
    );


  if (raw === null) {
    return;
  }


  const amount =
    normalizeHTGAmount(
      raw
    );


  if (!amount) {

    showToast(
      "Montant invalide."
    );

    return;
  }


  try {

    const idToken =
      await getSecureIdToken();


    showToast(
      t("paymentPending")
    );


    const response =
      await fetch(
        `${API_URL}/moncash/deposit`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`
          },

          body:
            JSON.stringify({
              amount
            })
        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.error ||
        `HTTP_${response.status}`
      );
    }


    const redirectUrl =
      data.redirectUrl ||
      data.redirect_url ||
      data.url;


    const orderId =
      String(
        data.orderId ||
        data.order_id ||
        ""
      );


    if (!redirectUrl) {

      throw new Error(
        "MONCASH_REDIRECT_MISSING"
      );
    }


    /*
      Pour l'argent réel,
      on refuse une URL Sandbox.
    */

    if (
      !isOfficialLiveMonCashURL(
        redirectUrl
      )
    ) {

      console.error(
        "MonCash URL reçue :",
        redirectUrl
      );


      throw new Error(
        "MONCASH_NOT_LIVE"
      );
    }


    if (orderId) {

      localStorage.setItem(
        "mystro_pending_moncash_order",
        orderId
      );


      localStorage.setItem(
        "mystro_pending_moncash_amount",
        String(amount)
      );
    }


    window.location.assign(
      redirectUrl
    );

  } catch (error) {

    console.error(
      "MONCASH DEPOSIT:",
      error
    );


    if (
      error.message ===
      "MONCASH_NOT_LIVE"
    ) {

      showToast(
        t("liveRequired")
      );

      return;
    }


    showToast(
      "Dépôt MonCash impossible."
    );
  }
}


/* =========================================================
   VERIFY MONCASH ORDER
========================================================= */

async function verifyMonCashOrder(
  orderId
) {

  if (
    !currentUser ||
    !orderId
  ) {

    return false;
  }


  try {

    const idToken =
      await getSecureIdToken();


    const response =
      await fetch(
        `${API_URL}/moncash/verify-order`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`
          },

          body:
            JSON.stringify({
              orderId
            })
        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.error ||
        `HTTP_${response.status}`
      );
    }


    /*
      Plusieurs structures possibles,
      suivant ton Worker.
    */

    const payment =
      data.payment ||
      data.moncash?.payment ||
      data.result?.payment ||
      {};


    const message =
      String(
        payment.message ||
        data.message ||
        ""
      ).toLowerCase();


    const status =
      Number(
        data.status ||
        data.moncash?.status ||
        0
      );


    const confirmed =
      data.ok === true &&
      (
        message ===
          "successful" ||
        data.success ===
          true ||
        status ===
          200
      );


    if (!confirmed) {

      return false;
    }


    const transactionId =
      payment.transaction_id ||
      payment.transactionId ||
      data.transactionId ||
      data.transaction_id ||
      "";


    const amount =
      Number(
        payment.cost ||
        payment.amount ||
        data.amount ||
        localStorage.getItem(
          "mystro_pending_moncash_amount"
        ) ||
        0
      );


    /*
      Enregistrement Firestore facultatif.
      Le paiement est déjà confirmé
      par le serveur avant cette étape.
    */

    try {

      await addDoc(
        collection(
          db,
          "transactions"
        ),
        {

          userId:
            currentUser.uid,

          type:
            "deposit",

          provider:
            "MonCash",

          amount,

          currency:
            "HTG",

          orderId,

          transactionId:
            String(
              transactionId
            ),

          status:
            "successful",

          createdAt:
            serverTimestamp()
        }
      );

    } catch (firestoreError) {

      console.warn(
        "Transaction Firestore non enregistrée :",
        firestoreError
      );
    }


    localStorage.removeItem(
      "mystro_pending_moncash_order"
    );


    localStorage.removeItem(
      "mystro_pending_moncash_amount"
    );


    showToast(
      t("paymentSuccess")
    );


    return true;

  } catch (error) {

    console.error(
      "VERIFY MONCASH:",
      error
    );


    return false;
  }
}


/* =========================================================
   VERIFY RETURN AFTER MONCASH
========================================================= */

async function checkPendingMonCashPayment() {

  if (!currentUser) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const queryOrderId =
    params.get(
      "orderId"
    ) ||
    params.get(
      "order_id"
    );


  const savedOrderId =
    localStorage.getItem(
      "mystro_pending_moncash_order"
    );


  const orderId =
    queryOrderId ||
    savedOrderId;


  if (!orderId) {
    return;
  }


  showToast(
    t("paymentPending")
  );


  const success =
    await verifyMonCashOrder(
      orderId
    );


  if (!success) {

    showToast(
      t("paymentFailed")
    );

    return;
  }


  /*
    Nettoie les paramètres
    sans recharger la page.
  */

  if (
    window.history &&
    window.location.search
  ) {

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}


/* =========================================================
   MONCASH REAL WITHDRAWAL / PAYOUT
========================================================= */

async function monCashWithdraw() {

  if (!currentUser) {

    showToast(
      t("loginRequired")
    );

    return;
  }


  const rawAmount =
    prompt(
      t("withdrawAmount")
    );


  if (
    rawAmount === null
  ) {
    return;
  }


  const amount =
    normalizeHTGAmount(
      rawAmount
    );


  if (!amount) {

    showToast(
      "Montant invalide."
    );

    return;
  }


  const rawPhone =
    prompt(
      t("moncashNumber")
    );


  if (
    rawPhone === null
  ) {
    return;
  }


  const receiver =
    normalizeHaitiPhone(
      rawPhone
    );


  if (!receiver) {

    showToast(
      "Numéro MonCash invalide."
    );

    return;
  }


  const confirmed =
    confirm(
      `Confirmer le retrait de ${formatMoney(
        amount,
        "HTG"
      )} vers ${receiver} ?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const idToken =
      await getSecureIdToken();


    /*
      Le Worker doit :

      1. vérifier le Firebase ID Token
      2. identifier l'utilisateur
      3. vérifier son vrai solde
      4. empêcher les doubles retraits
      5. générer la référence côté serveur
      6. utiliser MonCash LIVE /v1/Transfert
      7. confirmer la réponse MonCash
      8. débiter le portefeuille atomiquement

      Le navigateur ne doit jamais faire
      ces contrôles financiers seul.
    */


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
              `Bearer ${idToken}`
          },

          body:
            JSON.stringify({
              amount,
              receiver
            })
        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.error ||
        `HTTP_${response.status}`
      );
    }


    /*
      Pour un retrait réel,
      le serveur doit explicitement
      confirmer le mode live.
    */

    const serverMode =
      String(
        data.mode ||
        data.moncashMode ||
        data.environment ||
        ""
      ).toLowerCase();


    if (
      serverMode !== "live" &&
      serverMode !== "production"
    ) {

      throw new Error(
        "MONCASH_NOT_LIVE"
      );
    }


    const transfer =
      data.transfer ||
      data.result?.transfer ||
      {};


    const transactionId =
      transfer.transaction_id ||
      transfer.transactionId ||
      data.transactionId ||
      data.transaction_id;


    const message =
      String(
        transfer.message ||
        data.message ||
        ""
      ).toLowerCase();


    const success =
      data.ok === true &&
      (
        message ===
          "successful" ||
        data.success ===
          true
      ) &&
      Boolean(
        transactionId
      );


    if (!success) {

      throw new Error(
        "WITHDRAW_NOT_CONFIRMED"
      );
    }


    try {

      await addDoc(
        collection(
          db,
          "transactions"
        ),
        {

          userId:
            currentUser.uid,

          type:
            "withdrawal",

          provider:
            "MonCash",

          receiver,

          amount,

          currency:
            "HTG",

          transactionId:
            String(
              transactionId
            ),

          status:
            "successful",

          createdAt:
            serverTimestamp()
        }
      );

    } catch (firestoreError) {

      console.warn(
        "Historique Firestore non enregistré :",
        firestoreError
      );
    }


    showToast(
      `${t("withdrawalSuccess")} #${transactionId}`
    );


  } catch (error) {

    console.error(
      "MONCASH WITHDRAW:",
      error
    );


    if (
      error.message ===
      "MONCASH_NOT_LIVE"
    ) {

      showToast(
        t("liveRequired")
      );

      return;
    }


    showToast(
      "Retrait MonCash non confirmé."
    );
  }
}


/* =========================================================
   WALLET
========================================================= */

async function loadWallet() {

  if (!currentUser) {
    return;
  }


  /*
    Pour de l'argent réel,
    le solde ne doit pas être calculé
    par localStorage.

    On demande toujours le serveur.
  */

  try {

    const idToken =
      await getSecureIdToken();


    const response =
      await fetch(
        `${API_URL}/wallet/balance`,
        {

          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${idToken}`
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        "WALLET_BALANCE_FAILED"
      );
    }


    const data =
      await response.json();


    const balance =
      Number(
        data.balance || 0
      );


    if (
      $("#walletBalance")
    ) {

      $("#walletBalance")
        .textContent =
        formatMoney(
          balance,
          data.currency ||
          "HTG"
        );
    }

  } catch (error) {

    console.warn(
      "WALLET:",
      error
    );


    if (
      $("#walletBalance")
    ) {

      $("#walletBalance")
        .textContent =
        "— HTG";
    }
  }
}


/* =========================================================
   STATS
========================================================= */

function drawLineChart(
  canvas,
  values
) {

  if (
    !(canvas instanceof
      HTMLCanvasElement)
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


  if (!ctx) {
    return;
  }


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const padding =
    30;


  const maximum =
    Math.max(
      ...values,
      1
    );


  ctx.beginPath();


  ctx.lineWidth =
    3;


  values.forEach(
    (value, index) => {

      const x =
        padding +
        (
          index /
          Math.max(
            values.length -
            1,
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
      7,
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
      16
    ]
  );
}


/* =========================================================
   ASSISTANT
========================================================= */

function assistantAnswer(
  message
) {

  const text =
    String(message)
      .toLowerCase();


  if (
    /moncash|depot|dépôt|deposit|depoz/.test(
      text
    )
  ) {

    if (
      language === "ht"
    ) {

      return "Ale nan Pòtfèy epi peze Depoze. Mystro-Shop ap ouvri paj ofisyèl MonCash pou peman an.";
    }


    if (
      language === "en"
    ) {

      return "Open Wallet and tap Deposit. Mystro-Shop will open the official MonCash payment page.";
    }


    if (
      language === "es"
    ) {

      return "Abra Cartera y pulse Depositar. Mystro-Shop abrirá la página oficial de pago MonCash.";
    }


    return "Ouvrez Portefeuille puis Déposer. Mystro-Shop ouvrira la page officielle de paiement MonCash.";
  }


  if (
    /retrait|withdraw|retire|retirar/.test(
      text
    )
  ) {

    if (
      language === "ht"
    ) {

      return "Ale nan Pòtfèy, peze Retire epi antre montan an ak nimewo MonCash la.";
    }


    if (
      language === "en"
    ) {

      return "Open Wallet, tap Withdraw and enter the amount and MonCash number.";
    }


    if (
      language === "es"
    ) {

      return "Abra Cartera, pulse Retirar e introduzca el monto y el número MonCash.";
    }


    return "Ouvrez Portefeuille, appuyez sur Retirer puis entrez le montant et le numéro MonCash.";
  }


  if (
    /vann|vend|sell|vender/.test(
      text
    )
  ) {

    if (
      language === "ht"
    ) {

      return "Ale nan Vann, mete enfòmasyon pwodwi a ak foto li epi pibliye li.";
    }


    if (
      language === "en"
    ) {

      return "Open Sell, add the product information and photo, then publish.";
    }


    if (
      language === "es"
    ) {

      return "Abra Vender, añada los datos y la foto del producto y publíquelo.";
    }


    return "Ouvrez Vendre, ajoutez les informations du produit et sa photo puis publiez.";
  }


  if (
    /commission|10%|komisyon/.test(
      text
    )
  ) {

    if (
      language === "ht"
    ) {

      return "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.";
    }


    if (
      language === "en"
    ) {

      return "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.";
    }


    if (
      language === "es"
    ) {

      return "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.";
    }


    return "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.";
  }


  return t(
    "assistantWelcome"
  );
}


/* =========================================================
   ASSISTANT MESSAGE
========================================================= */

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


  bubble.className =
    user
      ? "assistant-message user"
      : "assistant-message bot";


  bubble.style.padding =
    "10px 12px";


  bubble.style.margin =
    "7px 0";


  bubble.style.borderRadius =
    "14px";


  bubble.style.maxWidth =
    "85%";


  if (user) {

    bubble.style.marginLeft =
      "auto";

    bubble.style.background =
      "#2563eb";

    bubble.style.color =
      "#fff";

  } else {

    bubble.style.background =
      "#e2e8f0";

    bubble.style.color =
      "#0f172a";
  }


  box.appendChild(
    bubble
  );


  box.scrollTop =
    box.scrollHeight;
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

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
      openSidebar
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


      const pageButton =
        target?.closest(
          "[data-page]"
        );


      if (pageButton) {

        showPage(
          pageButton.dataset.page
        );
      }


      const goButton =
        target?.closest(
          "[data-go]"
        );


      if (goButton) {

        showPage(
          goButton.dataset.go
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
            t(
              "assistantWelcome"
            )
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
          input?.value.trim();


        if (!message) {
          return;
        }


        addAssistantMessage(
          message,
          true
        );


        if (input) {

          input.value =
            "";
        }


        setTimeout(
          () => {

            addAssistantMessage(
              assistantAnswer(
                message
              )
            );

          },
          250
        );
      }
    );
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user ||
      null;


    currentProfile =
      null;


    if (!user) {

      products =
        [...demoProducts];


      renderProducts();


      showAuth();


      return;
    }


    try {

      await loadProfile(
        user
      );

    } catch (error) {

      console.error(
        "PROFILE:",
        error
      );


      currentProfile = {

        name:
          user.email
            ?.split("@")[0] ||
          "Utilisateur",

        email:
          user.email ||
          "",

        role:
          "buyer"
      };
    }


    try {

      await loadProducts();

    } catch (error) {

      console.error(
        "PRODUCTS:",
        error
      );
    }


    showApp();


    /*
      Vérifie un dépôt MonCash
      après retour du portail.
    */

    setTimeout(
      async () => {

        await checkPendingMonCashPayment();

        await loadWallet();

      },
      500
    );
  }
);


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const currencySelect =
      $("#currencySelect");


    if (
      currencySelect
    ) {

      currencySelect.value =
        currency;
    }


    const languageSelect =
      $("#languageSelect");


    if (
      languageSelect
    ) {

      languageSelect.value =
        language;
    }


    initEvents();


    applyLanguage();


    products =
      [...demoProducts];


    renderProducts();


    updateCartCounter();


    switchAuthMode(
      "login"
    );
  }
);


/* =========================================================
   PWA SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in
  navigator
) {

  window.addEventListener(
    "load",
    async () => {

      try {

        const registration =
          await navigator
            .serviceWorker
            .register(
              "./service-worker.js"
            );


        console.log(
          "Mystro-Shop PWA active :",
          registration.scope
        );

      } catch (error) {

        console.warn(
          "Service Worker :",
          error
        );
      }
    }
  );
}


/* =========================================================
   SECURITY NOTES
========================================================= */

/*
  IMPORTANT POUR L'ARGENT RÉEL :

  1. Ne jamais mettre MONCASH_CLIENT_ID
     dans script.js.

  2. Ne jamais mettre MONCASH_CLIENT_SECRET
     dans script.js.

  3. Les secrets doivent rester dans
     Cloudflare Worker.

  4. Le Worker doit vérifier le Firebase
     ID Token pour les opérations financières.

  5. Le Worker doit utiliser en Production :

     REST API :
     https://moncashbutton.digicelgroup.com/Api

     Gateway :
     https://moncashbutton.digicelgroup.com/Moncash-middleware

  6. Dépôt :
     MonCash /v1/CreatePayment

  7. Vérification :
     MonCash /v1/RetrieveOrderPayment
     ou /v1/RetrieveTransactionPayment

  8. Retrait/Payout :
     MonCash /v1/Transfert

  9. Un retrait ne doit jamais être marqué
     réussi uniquement parce que fetch()
     a répondu HTTP 200.

     Il faut vérifier le résultat MonCash.

  10. Le solde réel doit être modifié
      côté serveur, jamais avec localStorage.

  11. La commission de 10% doit être appliquée
      côté serveur lors d'une vraie vente.

  12. Le navigateur ne doit jamais pouvoir
      décider lui-même qu'un paiement est réussi.
*/

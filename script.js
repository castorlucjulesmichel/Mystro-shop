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


/* =========================
   FIREBASE
========================= */

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


/* =========================
   DOM
========================= */

const $ =
  (selector, root = document) =>
    root.querySelector(selector);

const $$ =
  (selector, root = document) =>
    [...root.querySelectorAll(selector)];


/* =========================
   STATE
========================= */

let currentUser = null;

let currentProfile = null;

let products = [];

let cartCount = 0;

let currency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let language =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";


/* =========================
   CURRENCY
========================= */

const rates = {
  USD: 1,
  HTG: 130,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79
};


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


  const usd =
    value / rates[from];


  return usd * rates[to];
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

  const original =
    product.currency || "USD";


  const converted =
    convertCurrency(
      product.price,
      original,
      currency
    );


  return formatMoney(
    converted,
    currency
  );
}


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

    welcome: "Bienvenue sur Mystro-Shop",
    welcomeText: "Achetez et vendez facilement.",
    discoverProducts: "Découvrir les produits",
    featured: "Produits populaires",

    sales: "Ventes",
    balance: "Solde",
    revenue: "Revenus",

    publishProduct: "Publier un produit",
    productName: "Nom du produit",
    category: "Catégorie",
    priceCurrency: "Devise du prix",
    price: "Prix",
    stock: "Stock",
    productPhoto: "Photo du produit",
    description: "Description",
    publish: "Publier le produit",
    publishing: "Publication...",

    commission:
      "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.",

    availableBalance: "Solde disponible",
    sellerBalance: "Solde vendeur après commission de 10%",
    paymentMethods: "Méthodes",
    depositWithdraw: "Dépôt / retrait",
    pendingIntegration: "En attente d'intégration",
    bankTransfer: "Transfert bancaire",
    partnerIntegration: "Intégration partenaire requise",
    recentTransactions: "Transactions récentes",
    noTransactions: "Aucune transaction.",
    noClients: "Aucun client pour le moment.",
    noOrders: "Aucune commande pour le moment.",
    servicesText: "Les services Mystro-Shop seront ajoutés ici.",
    currency: "Devise",

    howSell: "Comment vendre ?",
    howSellAnswer:
      "Ouvrez Vendre, ajoutez votre produit et sa photo, puis publiez.",

    commissionQuestion:
      "Quelle commission prend Mystro-Shop ?",

    commissionAnswer:
      "Mystro-Shop retient 10% sur chaque vente finalisée.",

    addCart: "Ajouter au panier",
    search: "Rechercher sur Mystro-Shop...",
    searchProduct: "Rechercher un produit...",
    allCategories: "Toutes les catégories",

    deposit: "+ Déposer",
    withdraw: "Retirer",
    depositAmount: "Montant du dépôt MonCash en HTG :",
    withdrawAmount: "Montant du retrait MonCash en HTG :",
    moncashNumber: "Numéro MonCash : 509XXXXXXXX",
    invalidAmount: "Montant invalide.",
    invalidPhone: "Numéro MonCash invalide.",
    openingMoncash: "Ouverture de MonCash...",
    depositError: "Impossible de démarrer le dépôt MonCash.",
    withdrawError: "Impossible d'effectuer le retrait MonCash.",

    productPublished: "Produit publié avec succès.",
    productPlaceholder: "Ex. Sac premium",
    descriptionPlaceholder: "Décrivez votre produit...",

    mode: "Mode",
    electronic: "Électronique",
    homeCategory: "Maison",
    beauty: "Beauté",
    sports: "Sports",
    food: "Alimentation",

    assistantTitle: "Assistant virtuel",
    assistantPlaceholder: "Posez votre question...",
    assistantWelcome:
      "Bonjour 👋 Je suis l'assistant Mystro-Shop. Je peux vous aider à acheter, vendre, utiliser MonCash, changer la devise ou la langue."
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

    welcome: "Byenveni sou Mystro-Shop",
    welcomeText: "Achte epi vann fasil.",
    discoverProducts: "Dekouvri pwodwi",
    featured: "Pwodwi popilè",

    sales: "Lavant",
    balance: "Balans",
    revenue: "Revni",

    publishProduct: "Pibliye yon pwodwi",
    productName: "Non pwodwi",
    category: "Kategori",
    priceCurrency: "Deviz pri a",
    price: "Pri",
    stock: "Stòk",
    productPhoto: "Foto pwodwi",
    description: "Deskripsyon",
    publish: "Pibliye pwodwi",
    publishing: "Ap pibliye...",

    commission:
      "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.",

    availableBalance: "Balans disponib",
    sellerBalance: "Balans vandè apre komisyon 10%",
    paymentMethods: "Metòd",
    depositWithdraw: "Depo / retrè",
    pendingIntegration: "Entegrasyon poko disponib",
    bankTransfer: "Transfè labank",
    partnerIntegration: "Entegrasyon patnè nesesè",
    recentTransactions: "Dènye tranzaksyon",
    noTransactions: "Pa gen tranzaksyon.",
    noClients: "Pa gen kliyan pou kounye a.",
    noOrders: "Pa gen kòmand pou kounye a.",
    servicesText: "Sèvis Mystro-Shop yo ap parèt isit la.",
    currency: "Deviz",

    howSell: "Kijan pou vann ?",
    howSellAnswer:
      "Ale nan Vann, mete enfòmasyon ak foto pwodwi a epi pibliye li.",

    commissionQuestion:
      "Ki komisyon Mystro-Shop pran ?",

    commissionAnswer:
      "Mystro-Shop pran 10% sou chak vant finalize.",

    addCart: "Ajoute nan panyen",
    search: "Chèche sou Mystro-Shop...",
    searchProduct: "Chèche yon pwodwi...",
    allCategories: "Tout kategori",

    deposit: "+ Depoze",
    withdraw: "Retire",
    depositAmount: "Montan depo MonCash an HTG :",
    withdrawAmount: "Montan retrè MonCash an HTG :",
    moncashNumber: "Nimewo MonCash : 509XXXXXXXX",
    invalidAmount: "Montan an pa valab.",
    invalidPhone: "Nimewo MonCash la pa valab.",
    openingMoncash: "Nap ouvri MonCash...",
    depositError: "Depo MonCash la pa kapab kòmanse.",
    withdrawError: "Retrè MonCash la pa kapab fèt.",

    productPublished: "Pwodwi a pibliye avèk siksè.",
    productPlaceholder: "Eg. Sak premium",
    descriptionPlaceholder: "Dekri pwodwi ou a...",

    mode: "Mòd",
    electronic: "Elektwonik",
    homeCategory: "Kay",
    beauty: "Bote",
    sports: "Espò",
    food: "Alimantasyon",

    assistantTitle: "Asistan vityèl",
    assistantPlaceholder: "Poze kesyon ou...",
    assistantWelcome:
      "Bonjou 👋 Mwen se asistan Mystro-Shop. Mwen ka ede w achte, vann, itilize MonCash, chanje deviz oswa lang."
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

    welcome: "Welcome to Mystro-Shop",
    welcomeText: "Buy and sell easily.",
    discoverProducts: "Discover products",
    featured: "Popular products",

    sales: "Sales",
    balance: "Balance",
    revenue: "Revenue",

    publishProduct: "Publish a product",
    productName: "Product name",
    category: "Category",
    priceCurrency: "Price currency",
    price: "Price",
    stock: "Stock",
    productPhoto: "Product photo",
    description: "Description",
    publish: "Publish product",
    publishing: "Publishing...",

    commission:
      "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.",

    availableBalance: "Available balance",
    sellerBalance: "Seller balance after 10% commission",
    paymentMethods: "Methods",
    depositWithdraw: "Deposit / withdrawal",
    pendingIntegration: "Integration pending",
    bankTransfer: "Bank transfer",
    partnerIntegration: "Partner integration required",
    recentTransactions: "Recent transactions",
    noTransactions: "No transactions.",
    noClients: "No clients yet.",
    noOrders: "No orders yet.",
    servicesText: "Mystro-Shop services will appear here.",
    currency: "Currency",

    howSell: "How do I sell?",
    howSellAnswer:
      "Open Sell, add the product information and photo, then publish.",

    commissionQuestion:
      "What commission does Mystro-Shop charge?",

    commissionAnswer:
      "Mystro-Shop charges 10% on every completed sale.",

    addCart: "Add to cart",
    search: "Search Mystro-Shop...",
    searchProduct: "Search for a product...",
    allCategories: "All categories",

    deposit: "+ Deposit",
    withdraw: "Withdraw",
    depositAmount: "MonCash deposit amount in HTG:",
    withdrawAmount: "MonCash withdrawal amount in HTG:",
    moncashNumber: "MonCash number: 509XXXXXXXX",
    invalidAmount: "Invalid amount.",
    invalidPhone: "Invalid MonCash number.",
    openingMoncash: "Opening MonCash...",
    depositError: "Unable to start MonCash deposit.",
    withdrawError: "Unable to make MonCash withdrawal.",

    productPublished: "Product published successfully.",
    productPlaceholder: "Example: Premium bag",
    descriptionPlaceholder: "Describe your product...",

    mode: "Fashion",
    electronic: "Electronics",
    homeCategory: "Home",
    beauty: "Beauty",
    sports: "Sports",
    food: "Food",

    assistantTitle: "Virtual assistant",
    assistantPlaceholder: "Ask your question...",
    assistantWelcome:
      "Hello 👋 I'm the Mystro-Shop assistant. I can help you buy, sell, use MonCash, change currency or language."
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

    welcome: "Bienvenido a Mystro-Shop",
    welcomeText: "Compra y vende fácilmente.",
    discoverProducts: "Descubrir productos",
    featured: "Productos populares",

    sales: "Ventas",
    balance: "Saldo",
    revenue: "Ingresos",

    publishProduct: "Publicar un producto",
    productName: "Nombre del producto",
    category: "Categoría",
    priceCurrency: "Moneda del precio",
    price: "Precio",
    stock: "Stock",
    productPhoto: "Foto del producto",
    description: "Descripción",
    publish: "Publicar producto",
    publishing: "Publicando...",

    commission:
      "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.",

    availableBalance: "Saldo disponible",
    sellerBalance: "Saldo del vendedor después de la comisión del 10%",
    paymentMethods: "Métodos",
    depositWithdraw: "Depósito / retiro",
    pendingIntegration: "Integración pendiente",
    bankTransfer: "Transferencia bancaria",
    partnerIntegration: "Se requiere integración con el socio",
    recentTransactions: "Transacciones recientes",
    noTransactions: "No hay transacciones.",
    noClients: "No hay clientes todavía.",
    noOrders: "No hay pedidos todavía.",
    servicesText: "Los servicios de Mystro-Shop aparecerán aquí.",
    currency: "Moneda",

    howSell: "¿Cómo vender?",
    howSellAnswer:
      "Abra Vender, añada la información y la foto del producto y publíquelo.",

    commissionQuestion:
      "¿Qué comisión cobra Mystro-Shop?",

    commissionAnswer:
      "Mystro-Shop cobra el 10% de cada venta completada.",

    addCart: "Añadir al carrito",
    search: "Buscar en Mystro-Shop...",
    searchProduct: "Buscar un producto...",
    allCategories: "Todas las categorías",

    deposit: "+ Depositar",
    withdraw: "Retirar",
    depositAmount: "Monto del depósito MonCash en HTG:",
    withdrawAmount: "Monto del retiro MonCash en HTG:",
    moncashNumber: "Número MonCash: 509XXXXXXXX",
    invalidAmount: "Monto inválido.",
    invalidPhone: "Número MonCash inválido.",
    openingMoncash: "Abriendo MonCash...",
    depositError: "No se puede iniciar el depósito MonCash.",
    withdrawError: "No se puede realizar el retiro MonCash.",

    productPublished: "Producto publicado correctamente.",
    productPlaceholder: "Ej. Bolso premium",
    descriptionPlaceholder: "Describe tu producto...",

    mode: "Moda",
    electronic: "Electrónica",
    homeCategory: "Hogar",
    beauty: "Belleza",
    sports: "Deportes",
    food: "Alimentación",

    assistantTitle: "Asistente virtual",
    assistantPlaceholder: "Haz tu pregunta...",
    assistantWelcome:
      "Hola 👋 Soy el asistente de Mystro-Shop. Puedo ayudarte a comprar, vender, usar MonCash, cambiar moneda o idioma."
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
   LANGUAGE
========================= */

function categoryTranslation(
  category
) {

  const map = {

    "Mode":
      "mode",

    "Électronique":
      "electronic",

    "Maison":
      "homeCategory",

    "Beauté":
      "beauty",

    "Sports":
      "sports",

    "Alimentation":
      "food"

  };


  return t(
    map[category]
  ) || category;
}


function updateCategoryOptions() {

  $$(
    "#categoryFilter [data-category-option]"
  ).forEach(option => {

    option.textContent =
      categoryTranslation(
        option.value
      );
  });


  $$("#productCategory option")
    .forEach(option => {

      option.textContent =
        categoryTranslation(
          option.value
        );
    });


  if ($("#allCategoriesOption")) {

    $("#allCategoriesOption")
      .textContent =
      t("allCategories");
  }
}


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

    $("#globalSearch").placeholder =
      t("search");
  }


  if ($("#productSearch")) {

    $("#productSearch").placeholder =
      t("searchProduct");
  }


  if ($("#productName")) {

    $("#productName").placeholder =
      t("productPlaceholder");
  }


  if ($("#productDescription")) {

    $("#productDescription").placeholder =
      t("descriptionPlaceholder");
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


  if ($("#assistantStatus")) {

    $("#assistantStatus").textContent =
      t("assistantTitle");
  }


  if ($("#assistantInput")) {

    $("#assistantInput").placeholder =
      t("assistantPlaceholder");
  }


  updateCategoryOptions();

  renderProducts();

  updateProfileUI();
}


/* =========================
   PROFILE
========================= */

function initials(
  name = "Mystro Shop"
) {

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part =>
      part.charAt(0)
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
  ].forEach(selector => {

    const element =
      $(selector);


    if (element) {

      element.textContent =
        avatar;
    }
  });


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
   AUTH DISPLAY
========================= */

function switchAuthMode(mode) {

  const login =
    mode === "login";


  $("#loginTab")
    ?.classList
    .toggle(
      "active",
      login
    );


  $("#signupTab")
    ?.classList
    .toggle(
      "active",
      !login
    );


  $("#loginForm")
    ?.classList
    .toggle(
      "active",
      login
    );


  $("#signupForm")
    ?.classList
    .toggle(
      "active",
      !login
    );
}


function showAuth(
  mode = "login"
) {

  $("#authScreen")
    ?.classList
    .remove("hidden");


  $("#appShell")
    ?.classList
    .remove("app-ready");


  $("#appShell")
    ?.classList
    .add("app-locked");


  switchAuthMode(mode);
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

  const sellerOnly =
    new Set([
      "dashboard",
      "sell",
      "wallet",
      "stats",
      "clients"
    ]);


  if (
    sellerOnly.has(pageId) &&
    !isSeller()
  ) {

    showToast(
      language === "ht"
        ? "Paj sa a rezève pou vandè."
        : language === "en"
          ? "This page is for sellers."
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
        button.dataset.page === pageId
      );
    });


  closeSidebar();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   AUTH
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
      language === "ht"
        ? "Koneksyon reyisi."
        : language === "en"
          ? "Login successful."
          : language === "es"
            ? "Inicio de sesión correcto."
            : "Connexion réussie."
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
      ?.value || "";


  const confirm =
    $("#signupPasswordConfirm")
      ?.value || "";


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
    password !== confirm
  ) {

    showToast(
      "Les mots de passe ne correspondent pas."
    );

    return;
  }


  try {

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await setDoc(
      doc(
        db,
        "users",
        credential.user.uid
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
   PRODUCTS
========================= */

const demoProducts = [

  {
    id: "demo1",
    name: "Sac premium",
    category: "Mode",
    price: 45,
    currency: "USD",
    stock: 6,
    emoji: "👜"
  },

  {
    id: "demo2",
    name: "Écouteurs sans fil",
    category: "Électronique",
    price: 35,
    currency: "USD",
    stock: 9,
    emoji: "🎧"
  },

  {
    id: "demo3",
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
    categoryTranslation(
      product.category
    );


  const title =
    document.createElement(
      "h3"
    );


  title.textContent =
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
    "btn btn-primary add-cart";


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
    title,
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


  const selectedCategory =
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
        ) &&
        (
          selectedCategory === "all" ||
          product.category === selectedCategory
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
      .forEach(product => {

        grid.appendChild(
          createProductCard(
            product
          )
        );
      });
  }


  const featured =
    $("#featuredProducts");


  if (featured) {

    featured.replaceChildren();


    products
      .slice(0, 4)
      .forEach(product => {

        featured.appendChild(
          createProductCard(
            product
          )
        );
      });
  }
}


async function loadProducts() {

  try {

    const q =
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
      await getDocs(q);


    products =
      snapshot.docs.map(
        item => ({
          id:
            item.id,

          ...item.data()
        })
      );


    if (!products.length) {

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
   IMAGE
========================= */

function previewImage() {

  const file =
    $("#productImage")
      ?.files?.[0];


  const preview =
    $("#productImagePreview");


  if (!preview) {
    return;
  }


  preview.replaceChildren();


  if (!file) {
    return;
  }


  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowed.includes(
      file.type
    )
  ) {

    showToast(
      "JPEG, PNG ou WebP."
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


  preview.appendChild(
    image
  );
}


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
        method: "POST",

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
      .catch(() => ({}));


  if (
    !response.ok ||
    !data.ok ||
    !data.imageUrl
  ) {

    throw new Error(
      data.error ||
      "IMAGE_UPLOAD_FAILED"
    );
  }


  return data;
}


/* =========================
   PUBLISH
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


  const productCurrency =
    $("#productCurrency")
      ?.value ||
    "USD";


  const price =
    Number(
      $("#productPrice")
        ?.value
    );


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


    if ($("#productStock")) {

      $("#productStock")
        .value =
        "1";
    }


    $("#productImagePreview")
      ?.replaceChildren();


    await loadProducts();


    showToast(
      t("productPublished")
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


  if (raw === null) {
    return;
  }


  const amount =
    Number(
      String(raw)
        .replace(",", ".")
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      t("invalidAmount")
    );

    return;
  }


  try {

    showToast(
      t("openingMoncash")
    );


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
        .json()
        .catch(() => ({}));


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
      t("depositError")
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


  if (raw === null) {
    return;
  }


  const amount =
    Number(
      String(raw)
        .replace(",", ".")
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      t("invalidAmount")
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
      t("invalidPhone")
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
        .json()
        .catch(() => ({}));


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
      t("withdrawError")
    );
  }
}


/* =========================
   ASSISTANT VIRTUEL
========================= */

function assistantText(
  key
) {

  const answers = {

    fr: {
      buy:
        "Pour acheter : ouvrez Produits, choisissez un article puis appuyez sur « Ajouter au panier ».",

      sell:
        "Pour vendre : créez un compte Vendeur, ouvrez Vendre, ajoutez le nom, le prix, la devise, le stock et une photo.",

      deposit:
        "Pour déposer : ouvrez Portefeuille → Déposer, entrez le montant HTG puis continuez avec MonCash.",

      withdraw:
        "Pour retirer : ouvrez Portefeuille → Retirer, choisissez le montant et saisissez votre numéro MonCash.",

      commission:
        "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.",

      currency:
        "Utilisez le sélecteur USD, HTG, EUR, CAD ou GBP en haut de l'écran.",

      language:
        "Utilisez le sélecteur de langue en haut pour choisir Français, Kreyòl, English ou Español.",

      default:
        "Je peux vous aider avec les produits, les achats, la vente, MonCash, les devises, les langues et la commission Mystro-Shop."
    },


    ht: {
      buy:
        "Pou achte : ouvri Pwodwi, chwazi yon atik epi peze « Ajoute nan panyen ».",

      sell:
        "Pou vann : kreye yon kont Vandè, ouvri Vann, mete non, pri, deviz, stòk ak foto pwodwi a.",

      deposit:
        "Pou depoze : ouvri Pòtfèy → Depoze, antre montan HTG a epi kontinye ak MonCash.",

      withdraw:
        "Pou retire : ouvri Pòtfèy → Retire, antre montan an ak nimewo MonCash ou.",

      commission:
        "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.",

      currency:
        "Sèvi ak selektè USD, HTG, EUR, CAD oswa GBP anlè ekran an.",

      language:
        "Sèvi ak selektè lang lan pou chwazi Français, Kreyòl, English oswa Español.",

      default:
        "Mwen ka ede w ak pwodwi, acha, vant, MonCash, deviz, lang ak komisyon Mystro-Shop."
    },


    en: {
      buy:
        "To buy: open Products, choose an item and tap Add to cart.",

      sell:
        "To sell: create a Seller account, open Sell and add the name, price, currency, stock and product photo.",

      deposit:
        "To deposit: open Wallet → Deposit, enter the HTG amount and continue with MonCash.",

      withdraw:
        "To withdraw: open Wallet → Withdraw, choose the amount and enter your MonCash number.",

      commission:
        "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.",

      currency:
        "Use the USD, HTG, EUR, CAD or GBP selector at the top of the screen.",

      language:
        "Use the language selector at the top to choose French, Kreyòl, English or Spanish.",

      default:
        "I can help with products, buying, selling, MonCash, currencies, languages and Mystro-Shop commissions."
    },


    es: {
      buy:
        "Para comprar: abre Productos, elige un artículo y pulsa « Añadir al carrito ».",

      sell:
        "Para vender: crea una cuenta de Vendedor, abre Vender y añade nombre, precio, moneda, stock y foto.",

      deposit:
        "Para depositar: abre Cartera → Depositar, introduce el monto en HTG y continúa con MonCash.",

      withdraw:
        "Para retirar: abre Cartera → Retirar, elige el monto e introduce tu número MonCash.",

      commission:
        "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.",

      currency:
        "Usa el selector USD, HTG, EUR, CAD o GBP en la parte superior.",

      language:
        "Usa el selector de idioma para elegir Français, Kreyòl, English o Español.",

      default:
        "Puedo ayudarte con productos, compras, ventas, MonCash, monedas, idiomas y la comisión Mystro-Shop."
    }

  };


  return (
    answers[language]?.[key] ||
    answers.fr[key]
  );
}


function addAssistantMessage(
  message,
  sender = "bot"
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
    "10px 12px";


  bubble.style.margin =
    "7px 0";


  bubble.style.borderRadius =
    "14px";


  bubble.style.maxWidth =
    "88%";


  bubble.style.whiteSpace =
    "pre-wrap";


  if (sender === "user") {

    bubble.style.marginLeft =
      "auto";


    bubble.style.background =
      "#2563eb";


    bubble.style.color =
      "#fff";

  } else {

    bubble.style.marginRight =
      "auto";


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


function detectAssistantIntent(
  message
) {

  const text =
    String(message)
      .toLowerCase();


  if (
    /achet|buy|compr|achte|panier|carrito|cart/.test(text)
  ) {
    return "buy";
  }


  if (
    /vend|sell|vann|producto|produit|publish|publicar|pibliye/.test(text)
  ) {
    return "sell";
  }


  if (
    /d[eé]p[oô]t|deposit|depoz|depositar/.test(text)
  ) {
    return "deposit";
  }


  if (
    /retrait|withdraw|retire|retirar|retr[eè]/.test(text)
  ) {
    return "withdraw";
  }


  if (
    /commission|10%|komisyon/.test(text)
  ) {
    return "commission";
  }


  if (
    /devise|currency|moneda|deviz|usd|htg|eur|cad|gbp/.test(text)
  ) {
    return "currency";
  }


  if (
    /langue|language|idioma|lang|fran[cç]ais|krey[oò]l|english|espa[nñ]ol/.test(text)
  ) {
    return "language";
  }


  return "default";
}


function openAssistant() {

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


  $("#assistantInput")
    ?.focus();
}


function closeAssistant() {

  const panel =
    $("#assistantPanel");


  if (panel) {

    panel.style.display =
      "none";
  }
}


/* =========================
   WALLET UI
========================= */

function updateCurrencyUI() {

  if ($("#currencySelect")) {

    $("#currencySelect")
      .value =
      currency;
  }


  if ($("#walletBalance")) {

    $("#walletBalance")
      .textContent =
      formatMoney(
        0,
        currency
      );
  }


  if ($("#homeBalance")) {

    $("#homeBalance")
      .textContent =
      formatMoney(
        0,
        currency
      );
  }


  if ($("#profileCurrencyInfo")) {

    $("#profileCurrencyInfo")
      .textContent =
      currency;
  }


  renderProducts();
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


        updateCurrencyUI();

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
      openAssistant
    );


  $("#assistantClose")
    ?.addEventListener(
      "click",
      closeAssistant
    );


  $$(".assistant-quick")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const key =
            button.dataset.question;


          addAssistantMessage(
            assistantText(key)
          );
        }
      );
    });


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
          "user"
        );


        input.value =
          "";


        const intent =
          detectAssistantIntent(
            message
          );


        setTimeout(
          () => {

            addAssistantMessage(
              assistantText(intent)
            );

          },
          250
        );
      }
    );


  $("#globalSearch")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key !== "Enter"
        ) {
          return;
        }


        showPage(
          "products"
        );


        if ($("#productSearch")) {

          $("#productSearch").value =
            event.target.value;
        }


        renderProducts();
      }
    );
}


/* =========================
   FIREBASE AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user) {

      currentProfile =
        null;


      showAuth(
        "login"
      );


      return;
    }


    try {

      await loadProfile(
        user
      );


      showApp();


      await loadProducts();

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

    if ($("#currencySelect")) {

      $("#currencySelect").value =
        currency;
    }


    if ($("#languageSelect")) {

      $("#languageSelect").value =
        language;
    }


    products =
      [...demoProducts];


    initEvents();

    applyLanguage();

    updateCurrencyUI();
  }
);

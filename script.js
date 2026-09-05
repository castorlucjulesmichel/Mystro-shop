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
   CONFIGURATION
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
    Array.from(
      root.querySelectorAll(selector)
    );


/* =========================
   STATE
========================= */

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


/* =========================
   CURRENCY
========================= */

/*
  Taux indicatifs :
  nombre d'unités de chaque devise
  pour environ 1 USD.
*/

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


  if (
    !Number.isFinite(value)
  ) {

    return 0;
  }


  if (
    !rates[from] ||
    !rates[to]
  ) {

    return value;
  }


  const usdValue =
    value / rates[from];


  return (
    usdValue *
    rates[to]
  );
}


function formatMoney(
  amount,
  code
) {

  const value =
    Number(amount) || 0;


  try {

    return new Intl.NumberFormat(
      language === "ht"
        ? "fr-HT"
        : language === "en"
          ? "en-US"
          : language === "es"
            ? "es-ES"
            : "fr-FR",
      {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }
    ).format(value);

  } catch {

    return (
      value.toFixed(2) +
      " " +
      code
    );
  }
}


function productMoney(
  product
) {

  const originalCurrency =
    product.currency ||
    "USD";


  const converted =
    convertCurrency(
      product.price,
      originalCurrency,
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

    commission:
      "Mystro-Shop prélève 10% sur chaque vente finalisée. Le vendeur reçoit 90%.",

    availableBalance:
      "Solde disponible",

    sellerBalance:
      "Solde vendeur après commission de 10%",

    paymentMethods:
      "Méthodes",

    moncashReal:
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

    name: "Nom",
    role: "Rôle",
    currency: "Devise",

    howSell:
      "Comment vendre ?",

    howSellAnswer:
      "Ouvrez la page Vendre, ajoutez les informations et la photo du produit puis publiez.",

    commissionQuestion:
      "Quelle commission prend Mystro-Shop ?",

    commissionAnswer:
      "Mystro-Shop prélève 10% sur chaque vente finalisée.",

    addCart:
      "Ajouter au panier",

    buyer:
      "Acheteur",

    seller:
      "Vendeur",

    search:
      "Rechercher sur Mystro-Shop...",

    searchProduct:
      "Rechercher un produit...",

    allCategories:
      "Toutes les catégories",

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

    invalidAmount:
      "Montant invalide.",

    invalidPhone:
      "Numéro MonCash invalide.",

    openingMoncash:
      "Ouverture de MonCash...",

    depositError:
      "Impossible de démarrer le dépôt MonCash.",

    withdrawError:
      "Impossible d'effectuer le retrait MonCash.",

    productPublished:
      "Produit publié avec succès.",

    publishing:
      "Publication...",

    publish:
      "Publier le produit"
  },


  ht: {

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
    discoverProducts: "Gade pwodwi yo",
    featured: "Pwodwi popilè",

    sales: "Lavant",
    balance: "Balans",
    revenue: "Revni",

    publishProduct: "Pibliye yon pwodwi",
    productName: "Non pwodwi",
    category: "Kategori",
    priceCurrency: "Lajan pou pri a",
    price: "Pri",
    stock: "Stòk",
    productPhoto: "Foto pwodwi",
    description: "Deskripsyon",

    commission:
      "Mystro-Shop pran 10% sou chak vant finalize. Vandè a resevwa 90%.",

    availableBalance:
      "Balans disponib",

    sellerBalance:
      "Balans vandè apre komisyon 10%",

    paymentMethods:
      "Metòd",

    moncashReal:
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
      "Sèvis Mystro-Shop yo ap ajoute isit la.",

    name: "Non",
    role: "Wòl",
    currency: "Deviz",

    howSell:
      "Kijan pou vann ?",

    howSellAnswer:
      "Ale nan paj Vann, ajoute enfòmasyon ak foto pwodwi a epi pibliye li.",

    commissionQuestion:
      "Ki komisyon Mystro-Shop pran ?",

    commissionAnswer:
      "Mystro-Shop pran 10% sou chak vant finalize.",

    addCart:
      "Ajoute nan panyen",

    buyer:
      "Achtè",

    seller:
      "Vandè",

    search:
      "Chèche sou Mystro-Shop...",

    searchProduct:
      "Chèche yon pwodwi...",

    allCategories:
      "Tout kategori",

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

    invalidAmount:
      "Montan an pa valab.",

    invalidPhone:
      "Nimewo MonCash la pa valab.",

    openingMoncash:
      "Nap ouvri MonCash...",

    depositError:
      "Depo MonCash la pa kapab kòmanse.",

    withdrawError:
      "Retrè MonCash la pa kapab fèt.",

    productPublished:
      "Pwodwi a pibliye avèk siksè.",

    publishing:
      "Ap pibliye...",

    publish:
      "Pibliye pwodwi"
  },


  en: {

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

    commission:
      "Mystro-Shop charges 10% on each completed sale. The seller receives 90%.",

    availableBalance:
      "Available balance",

    sellerBalance:
      "Seller balance after 10% commission",

    paymentMethods:
      "Methods",

    moncashReal:
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

    name: "Name",
    role: "Role",
    currency: "Currency",

    howSell:
      "How do I sell?",

    howSellAnswer:
      "Open Sell, add the product information and photo, then publish.",

    commissionQuestion:
      "What commission does Mystro-Shop charge?",

    commissionAnswer:
      "Mystro-Shop charges 10% on every completed sale.",

    addCart:
      "Add to cart",

    buyer:
      "Buyer",

    seller:
      "Seller",

    search:
      "Search Mystro-Shop...",

    searchProduct:
      "Search for a product...",

    allCategories:
      "All categories",

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

    invalidAmount:
      "Invalid amount.",

    invalidPhone:
      "Invalid MonCash number.",

    openingMoncash:
      "Opening MonCash...",

    depositError:
      "Unable to start MonCash deposit.",

    withdrawError:
      "Unable to make MonCash withdrawal.",

    productPublished:
      "Product published successfully.",

    publishing:
      "Publishing...",

    publish:
      "Publish product"
  },


  es: {

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

    commission:
      "Mystro-Shop cobra el 10% de cada venta completada. El vendedor recibe el 90%.",

    availableBalance:
      "Saldo disponible",

    sellerBalance:
      "Saldo del vendedor después de la comisión del 10%",

    paymentMethods:
      "Métodos",

    moncashReal:
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

    name: "Nombre",
    role: "Rol",
    currency: "Moneda",

    howSell:
      "¿Cómo vender?",

    howSellAnswer:
      "Abra Vender, añada la información y la foto del producto y publíquelo.",

    commissionQuestion:
      "¿Qué comisión cobra Mystro-Shop?",

    commissionAnswer:
      "Mystro-Shop cobra el 10% de cada venta completada.",

    addCart:
      "Añadir al carrito",

    buyer:
      "Comprador",

    seller:
      "Vendedor",

    search:
      "Buscar en Mystro-Shop...",

    searchProduct:
      "Buscar un producto...",

    allCategories:
      "Todas las categorías",

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

    invalidAmount:
      "Monto inválido.",

    invalidPhone:
      "Número MonCash inválido.",

    openingMoncash:
      "Abriendo MonCash...",

    depositError:
      "No se puede iniciar el depósito MonCash.",

    withdrawError:
      "No se puede realizar el retiro MonCash.",

    productPublished:
      "Producto publicado correctamente.",

    publishing:
      "Publicando...",

    publish:
      "Publicar producto"
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

    }, 2600);
}


/* =========================
   LANGUAGE
========================= */

function applyLanguage() {

  document.documentElement.lang =
    language === "ht"
      ? "ht"
      : language;


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


  if ($("#depositBtn")) {

    $("#depositBtn").textContent =
      t("deposit");
  }


  if ($("#withdrawBtn")) {

    $("#withdrawBtn").textContent =
      t("withdraw");
  }


  if ($("#buyerOption")) {

    $("#buyerOption").textContent =
      t("buyer");
  }


  if ($("#sellerOption")) {

    $("#sellerOption").textContent =
      t("seller");
  }


  if ($("#publishProductBtn")) {

    $("#publishProductBtn").textContent =
      t("publish");
  }


  renderProducts();
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
    .join("") || "MS";
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


/* =========================
   AUTH UI
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

  updateProfileUI();

  showPage("home");
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

  const sellerPages =
    new Set([
      "dashboard",
      "sell",
      "wallet",
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
   LOGIN
========================= */

async function handleLogin(event) {

  event.preventDefault();


  const email =
    $("#loginEmail")
      ?.value
      .trim() || "";


  const password =
    $("#loginPassword")
      ?.value || "";


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
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
      language === "ht"
        ? "Email oswa modpas la pa kòrèk."
        : language === "en"
          ? "Incorrect email or password."
          : language === "es"
            ? "Correo o contraseña incorrectos."
            : "Email ou mot de passe incorrect."
    );
  }
}


/* =========================
   SIGNUP
========================= */

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

        currency:
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


/* =========================
   PASSWORD RESET
========================= */

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
   PROFILE FROM FIRESTORE
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

        currency:
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
   DEMO PRODUCTS
========================= */

const demoProducts = [

  {

    id:
      "demo1",

    name:
      "Sac premium",

    category:
      "Mode",

    price:
      45,

    currency:
      "USD",

    stock:
      6,

    emoji:
      "👜"
  },


  {

    id:
      "demo2",

    name:
      "Écouteurs sans fil",

    category:
      "Électronique",

    price:
      35,

    currency:
      "USD",

    stock:
      9,

    emoji:
      "🎧"
  },


  {

    id:
      "demo3",

    name:
      "Lampe décorative",

    category:
      "Maison",

    price:
      2500,

    currency:
      "HTG",

    stock:
      5,

    emoji:
      "💡"
  }

];


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(product) {

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


/* =========================
   PRODUCTS FILTER
========================= */

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
          product.category ===
            category
        )

      );
    }
  );
}


/* =========================
   RENDER PRODUCTS
========================= */

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


/* =========================
   FIRESTORE PRODUCTS
========================= */

async function loadProducts() {

  try {

    const productQuery =
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
        productQuery
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
      products.length === 0
    ) {

      products =
        [...demoProducts];
    }

  } catch (error) {

    console.warn(
      "Products:",
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


  const preview =
    $("#productImagePreview");


  if (!preview) {
    return;
  }


  preview.replaceChildren();


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


  image.alt =
    "Preview";


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


/* =========================
   UPLOAD IMAGE
========================= */

async function uploadProductImage(file) {

  if (!currentUser) {

    throw new Error(
      "NOT_CONNECTED"
    );
  }


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
      "IMAGE_UPLOAD_FAILED"
    );
  }


  return data;
}


/* =========================
   PUBLISH PRODUCT
========================= */

async function publishProduct(event) {

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


    event.currentTarget.reset();


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

    console.error(
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
        .catch(
          () => ({})
        );


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

    console.error(
      error
    );


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


  if (
    raw === null
  ) {

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
        .catch(
          () => ({})
        );


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
      language === "ht"
        ? `Retrè ${amount} HTG lan voye.`
        : language === "en"
          ? `${amount} HTG withdrawal submitted.`
          : language === "es"
            ? `Retiro de ${amount} HTG enviado.`
            : `Retrait de ${amount} HTG envoyé.`
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      t("withdrawError")
    );
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
   CHAT
========================= */

function initChat() {

  const messages =
    $("#messages");


  if (
    messages &&
    !messages.children.length
  ) {

    const message =
      document.createElement(
        "div"
      );


    message.className =
      "bubble them";


    message.textContent =
      "Bienvenue sur Mystro-Shop.";


    messages.appendChild(
      message
    );
  }
}


/* =========================
   CHART
========================= */

function drawChart(
  selector,
  values
) {

  const canvas =
    $(selector);


  if (
    !(canvas instanceof HTMLCanvasElement)
  ) {

    return;
  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const width =
    canvas.clientWidth ||
    600;


  const height =
    220;


  canvas.width =
    width;


  canvas.height =
    height;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const padding =
    25;


  const maximum =
    Math.max(
      ...values
    );


  ctx.beginPath();


  values.forEach(
    (value, index) => {

      const x =
        padding +
        (
          index /
          Math.max(
            1,
            values.length - 1
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


        updateProfileUI();
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


  $("#chatForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const input =
          $("#messageInput");


        const value =
          input?.value
            .trim();


        if (!value) {
          return;
        }


        const message =
          document.createElement(
            "div"
          );


        message.className =
          "bubble me";


        message.textContent =
          value;


        $("#messages")
          ?.appendChild(
            message
          );


        input.value =
          "";
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


        if ($("#productSearch")) {

          $("#productSearch")
            .value =
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
   INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if ($("#currencySelect")) {

      $("#currencySelect")
        .value =
        currency;
    }


    if ($("#languageSelect")) {

      $("#languageSelect")
        .value =
        language;
    }


    products =
      [...demoProducts];


    initEvents();

    initChat();

    applyLanguage();

    updateCurrencyUI();


    drawChart(
      "#revenueChart",
      [
        42,
        58,
        49,
        73,
        65,
        88,
        96
      ]
    );


    drawChart(
      "#statsChart",
      [
        48,
        62,
        55,
        77,
        85,
        92
      ]
    );
  }
);

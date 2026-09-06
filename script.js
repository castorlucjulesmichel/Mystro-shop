/* ============================================================
   MYSTRO-SHOP — SCRIPT.JS UNIQUE
   Mobile marketplace / interface classique e-commerce
   Firebase Auth + Firestore + Supabase Storage + Worker MonCash
   Langues: Français / Kreyòl / English / Español
   Commission Mystro-Shop: 10%
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ============================================================
   CONFIGURATION
============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",
  authDomain: "mystroshop-eab92.firebaseapp.com",
  projectId: "mystroshop-eab92",
  storageBucket: "mystroshop-eab92.firebasestorage.app",
  messagingSenderId: "104073035061",
  appId: "1:104073035061:web:59d2779f2db7a8a3be207c",
  measurementId: "G-QTLV6VFLXQ"
};


const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const PRODUCT_BUCKET =
  "product-images";

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";

const COMMISSION_RATE = 0.10;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];


const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      accessToken: async () => {

        const user =
          auth.currentUser;

        return user
          ? await user.getIdToken(false)
          : null;
      }
    }
  );


/* ============================================================
   ÉTAT
============================================================ */

const state = {

  user: null,

  profile: null,

  products: [],

  filteredProducts: [],

  cart:
    loadJSON(
      "mystroCart",
      []
    ),

  currency:
    localStorage.getItem(
      "mystroCurrency"
    ) || "USD",

  language:
    localStorage.getItem(
      "mystroLanguage"
    ) || "fr",

  currentPage:
    "home",

  charts: {}
};


const CURRENCY_SYMBOLS = {

  USD: "$",

  HTG: "G",

  EUR: "€",

  CAD: "CA$",

  GBP: "£",

  DOP: "RD$",

  XOF: "CFA"
};


const FX = {

  USD: 1,

  HTG: 131,

  EUR: 0.86,

  CAD: 1.36,

  GBP: 0.74,

  DOP: 63.5,

  XOF: 565
};


/* ============================================================
   OUTILS
============================================================ */

const $ =
  id =>
    document.getElementById(id);


const $$ =
  (selector, root = document) =>
    [
      ...root.querySelectorAll(
        selector
      )
    ];


function loadJSON(
  key,
  fallback
) {

  try {

    const value =
      JSON.parse(
        localStorage.getItem(key)
      );

    return value ?? fallback;

  } catch {

    return fallback;
  }
}


function saveJSON(
  key,
  value
) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function escapeHTML(
  value = ""
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


function normalizeText(
  value = ""
) {

  return String(value)

    .trim()

    .toLowerCase()

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function setBusy(
  button,
  busy,
  label = ""
) {

  if (!button) {
    return;
  }


  if (busy) {

    button.dataset.originalText =
      button.textContent;

    button.disabled =
      true;

    button.textContent =
      label ||
      t("loading");

  } else {

    button.disabled =
      false;

    button.textContent =
      button.dataset.originalText ||
      button.textContent;
  }
}


function toast(
  message,
  type = "info"
) {

  let box =
    $("mystroToast");


  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.id =
      "mystroToast";


    box.style.cssText = `
      position:fixed;
      left:50%;
      bottom:88px;
      transform:translateX(-50%);
      z-index:99999;
      max-width:88%;
      padding:12px 16px;
      border-radius:10px;
      background:#111;
      color:#fff;
      font:600 14px/1.35 system-ui;
      box-shadow:0 8px 26px rgba(0,0,0,.22);
      opacity:0;
      transition:.2s;
      pointer-events:none;
      text-align:center;
    `;

    document.body.appendChild(
      box
    );
  }


  box.textContent =
    message;


  box.style.background =
    type === "error"
      ? "#b42318"
      : type === "success"
        ? "#166534"
        : "#111";


  box.style.opacity =
    "1";


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      () => {

        box.style.opacity =
          "0";

      },
      2800
    );
}


function openModal(id) {

  const modal =
    $(id);

  if (!modal) {
    return;
  }

  modal.classList.add(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeModal(id) {

  const modal =
    $(id);

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );
}


function closeAllModals() {

  $$(".mystro-modal.open")
    .forEach(
      modal => {

        modal.classList.remove(
          "open"
        );

        modal.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    );
}


function convertAmount(
  amount,
  from,
  to
) {

  const n =
    Number(amount) || 0;


  if (
    !FX[from] ||
    !FX[to]
  ) {

    return n;
  }


  return (
    n /
    FX[from]
  ) * FX[to];
}


function money(
  amount,
  currency = state.currency
) {

  const n =
    Number(amount) || 0;


  const symbol =
    CURRENCY_SYMBOLS[currency] ||
    currency;


  return (
    symbol +
    n.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


/* ============================================================
   TRADUCTIONS
============================================================ */

const I18N = {

  fr: {

    home:
      "Accueil",

    dashboard:
      "Tableau de bord",

    products:
      "Produits",

    sell:
      "Vendre",

    wallet:
      "Portefeuille",

    cart:
      "Panier",

    statistics:
      "Statistiques",

    clients:
      "Clients actifs",

    orders:
      "Commandes",

    chat:
      "Chat",

    services:
      "Services",

    profile:
      "Profil",

    help:
      "Aide",

    logout:
      "Déconnexion",

    search:
      "Rechercher des produits...",

    loading:
      "Chargement...",

    login:
      "Se connecter",

    register:
      "S'inscrire",

    email:
      "E-mail",

    password:
      "Mot de passe",

    name:
      "Nom complet",

    buyer:
      "Acheteur",

    seller:
      "Vendeur",

    accountType:
      "Type de compte",

    forgot:
      "Mot de passe oublié ?",

    cancel:
      "Annuler",

    send:
      "Envoyer",

    close:
      "Fermer",

    welcome:
      "Bienvenue à Mystro-Shop",

    market:
      "Marché international",

    discover:
      "Découvrez les produits disponibles.",

    noProducts:
      "Aucun produit disponible.",

    addCart:
      "Ajouter au panier",

    buyNow:
      "Acheter",

    stock:
      "Stock",

    category:
      "Catégorie",

    publishProduct:
      "Publier le produit",

    publishTitle:
      "Publier un produit",

    productName:
      "Nom du produit",

    price:
      "Prix",

    priceCurrency:
      "Devise du prix",

    productPhoto:
      "Photo du produit",

    description:
      "Description",

    selectImage:
      "Choisissez une image JPEG, PNG ou WebP de moins de 5 Mo.",

    publicationSuccess:
      "Produit publié avec succès.",

    publicationError:
      "Publication impossible.",

    loginRequired:
      "Connectez-vous d'abord.",

    sellerRequired:
      "Cette fonction est réservée aux comptes vendeurs.",

    invalidImage:
      "Image invalide. Utilisez JPEG, PNG ou WebP, maximum 5 Mo.",

    dashboardSubtitle:
      "Suivez l'activité de votre boutique Mystro-Shop.",

    revenue:
      "Revenus",

    availableBalance:
      "Solde disponible",

    deposit:
      "Dépôt",

    withdrawal:
      "Retrait",

    depositWithdrawal:
      "Dépôt / Retrait",

    bank:
      "Banque",

    transfer:
      "Transfert",

    currencies:
      "Devises",

    conversion:
      "Conversion",

    walletSubtitle:
      "Dépôts, retraits et transferts.",

    cartSubtitle:
      "Vérifiez vos produits avant le paiement.",

    emptyCart:
      "Votre panier est vide.",

    subtotal:
      "Sous-total",

    commission:
      "Commission Mystro-Shop",

    total:
      "Total",

    checkout:
      "Continuer vers le paiement",

    remove:
      "Retirer",

    quantity:
      "Quantité",

    assistant:
      "Assistant Mystro-Shop",

    assistantHello:
      "Bonjour 👋 Comment puis-je vous aider ?",

    assistantPlaceholder:
      "Écrivez votre question...",

    chatPlaceholder:
      "Écrire un message...",

    myProfile:
      "Mon profil",

    payments:
      "Paiements",

    howToSell:
      "Comment vendre ?",

    operationUnavailable:
      "Cette opération n'est pas encore disponible.",

    moncashAmount:
      "Montant MonCash",

    invalidAmount:
      "Entrez un montant valide.",

    paymentStarted:
      "Paiement MonCash démarré.",

    withdrawalSent:
      "Demande de retrait envoyée.",

    authError:
      "E-mail ou mot de passe incorrect.",

    registerSuccess:
      "Compte créé avec succès.",

    resetSent:
      "E-mail de réinitialisation envoyé.",

    cartAdded:
      "Produit ajouté au panier.",

    orderSaved:
      "Commande enregistrée.",

    noOrders:
      "Aucune commande.",

    noClients:
      "Aucun client à afficher."
  },


  ht: {

    home:
      "Akèy",

    dashboard:
      "Tablo kontwòl",

    products:
      "Pwodwi",

    sell:
      "Vann",

    wallet:
      "Pòtfèy",

    cart:
      "Panyen",

    statistics:
      "Estatistik",

    clients:
      "Kliyan aktif",

    orders:
      "Kòmand",

    chat:
      "Mesaj",

    services:
      "Sèvis",

    profile:
      "Pwofil",

    help:
      "Èd",

    logout:
      "Dekonekte",

    search:
      "Chèche pwodwi...",

    loading:
      "Ap chaje...",

    login:
      "Konekte",

    register:
      "Enskri",

    email:
      "Imèl",

    password:
      "Modpas",

    name:
      "Non konplè",

    buyer:
      "Achtè",

    seller:
      "Vandè",

    accountType:
      "Kalite kont",

    forgot:
      "Ou bliye modpas la?",

    cancel:
      "Anile",

    send:
      "Voye",

    close:
      "Fèmen",

    welcome:
      "Byenveni sou Mystro-Shop",

    market:
      "Mache entènasyonal",

    discover:
      "Dekouvri pwodwi ki disponib yo.",

    noProducts:
      "Pa gen pwodwi disponib.",

    addCart:
      "Ajoute nan panyen",

    buyNow:
      "Achte",

    stock:
      "Kantite",

    category:
      "Kategori",

    publishProduct:
      "Pibliye pwodwi a",

    publishTitle:
      "Pibliye yon pwodwi",

    productName:
      "Non pwodwi",

    price:
      "Pri",

    priceCurrency:
      "Lajan pou pri a",

    productPhoto:
      "Foto pwodwi",

    description:
      "Deskripsyon",

    selectImage:
      "Chwazi yon imaj JPEG, PNG oswa WebP ki mwens pase 5 MB.",

    publicationSuccess:
      "Pwodwi a pibliye avèk siksè.",

    publicationError:
      "Piblikasyon an echwe.",

    loginRequired:
      "Konekte anvan.",

    sellerRequired:
      "Fonksyon sa a rezève pou kont vandè yo.",

    invalidImage:
      "Imaj la pa valab. JPEG, PNG oswa WebP, maksimòm 5 MB.",

    dashboardSubtitle:
      "Swiv aktivite boutik Mystro-Shop ou a.",

    revenue:
      "Revni",

    availableBalance:
      "Balans disponib",

    deposit:
      "Depo",

    withdrawal:
      "Retrè",

    depositWithdrawal:
      "Depo / Retrè",

    bank:
      "Bank",

    transfer:
      "Transfè",

    currencies:
      "Lajan",

    conversion:
      "Konvèsyon",

    walletSubtitle:
      "Depo, retrè ak transfè.",

    cartSubtitle:
      "Verifye pwodwi ou yo anvan peman.",

    emptyCart:
      "Panyen ou vid.",

    subtotal:
      "Sou-total",

    commission:
      "Komisyon Mystro-Shop",

    total:
      "Total",

    checkout:
      "Kontinye pou peman",

    remove:
      "Retire",

    quantity:
      "Kantite",

    assistant:
      "Asistan Mystro-Shop",

    assistantHello:
      "Bonjou 👋 Kijan mwen ka ede w?",

    assistantPlaceholder:
      "Ekri kesyon ou...",

    chatPlaceholder:
      "Ekri yon mesaj...",

    myProfile:
      "Pwofil mwen",

    payments:
      "Peman",

    howToSell:
      "Kijan pou vann?",

    operationUnavailable:
      "Operasyon sa a poko disponib.",

    moncashAmount:
      "Montan MonCash",

    invalidAmount:
      "Antre yon montan ki valab.",

    paymentStarted:
      "Peman MonCash la kòmanse.",

    withdrawalSent:
      "Demann retrè a voye.",

    authError:
      "Imèl oswa modpas la pa kòrèk.",

    registerSuccess:
      "Kont la kreye avèk siksè.",

    resetSent:
      "Imèl pou reset modpas la voye.",

    cartAdded:
      "Pwodwi a ajoute nan panyen.",

    orderSaved:
      "Kòmand lan anrejistre.",

    noOrders:
      "Pa gen kòmand.",

    noClients:
      "Pa gen kliyan pou montre."
  },


  en: {

    home:
      "Home",

    dashboard:
      "Dashboard",

    products:
      "Products",

    sell:
      "Sell",

    wallet:
      "Wallet",

    cart:
      "Cart",

    statistics:
      "Statistics",

    clients:
      "Active clients",

    orders:
      "Orders",

    chat:
      "Chat",

    services:
      "Services",

    profile:
      "Profile",

    help:
      "Help",

    logout:
      "Log out",

    search:
      "Search products...",

    loading:
      "Loading...",

    login:
      "Log in",

    register:
      "Sign up",

    email:
      "Email",

    password:
      "Password",

    name:
      "Full name",

    buyer:
      "Buyer",

    seller:
      "Seller",

    accountType:
      "Account type",

    forgot:
      "Forgot password?",

    cancel:
      "Cancel",

    send:
      "Send",

    close:
      "Close",

    welcome:
      "Welcome to Mystro-Shop",

    market:
      "International marketplace",

    discover:
      "Discover available products.",

    noProducts:
      "No products available.",

    addCart:
      "Add to cart",

    buyNow:
      "Buy now",

    stock:
      "Stock",

    category:
      "Category",

    publishProduct:
      "Publish product",

    publishTitle:
      "Publish a product",

    productName:
      "Product name",

    price:
      "Price",

    priceCurrency:
      "Price currency",

    productPhoto:
      "Product photo",

    description:
      "Description",

    selectImage:
      "Choose a JPEG, PNG or WebP image under 5 MB.",

    publicationSuccess:
      "Product published successfully.",

    publicationError:
      "Unable to publish product.",

    loginRequired:
      "Please log in first.",

    sellerRequired:
      "This feature is reserved for seller accounts.",

    invalidImage:
      "Invalid image. Use JPEG, PNG or WebP, maximum 5 MB.",

    dashboardSubtitle:
      "Follow your Mystro-Shop store activity.",

    revenue:
      "Revenue",

    availableBalance:
      "Available balance",

    deposit:
      "Deposit",

    withdrawal:
      "Withdrawal",

    depositWithdrawal:
      "Deposit / Withdrawal",

    bank:
      "Bank",

    transfer:
      "Transfer",

    currencies:
      "Currencies",

    conversion:
      "Conversion",

    walletSubtitle:
      "Deposits, withdrawals and transfers.",

    cartSubtitle:
      "Review your products before payment.",

    emptyCart:
      "Your cart is empty.",

    subtotal:
      "Subtotal",

    commission:
      "Mystro-Shop commission",

    total:
      "Total",

    checkout:
      "Continue to payment",

    remove:
      "Remove",

    quantity:
      "Quantity",

    assistant:
      "Mystro-Shop Assistant",

    assistantHello:
      "Hello 👋 How can I help you?",

    assistantPlaceholder:
      "Write your question...",

    chatPlaceholder:
      "Write a message...",

    myProfile:
      "My profile",

    payments:
      "Payments",

    howToSell:
      "How to sell?",

    operationUnavailable:
      "This operation is not available yet.",

    moncashAmount:
      "MonCash amount",

    invalidAmount:
      "Enter a valid amount.",

    paymentStarted:
      "MonCash payment started.",

    withdrawalSent:
      "Withdrawal request sent.",

    authError:
      "Incorrect email or password.",

    registerSuccess:
      "Account created successfully.",

    resetSent:
      "Password reset email sent.",

    cartAdded:
      "Product added to cart.",

    orderSaved:
      "Order saved.",

    noOrders:
      "No orders.",

    noClients:
      "No clients to display."
  },


  es: {

    home:
      "Inicio",

    dashboard:
      "Panel de control",

    products:
      "Productos",

    sell:
      "Vender",

    wallet:
      "Cartera",

    cart:
      "Carrito",

    statistics:
      "Estadísticas",

    clients:
      "Clientes activos",

    orders:
      "Pedidos",

    chat:
      "Chat",

    services:
      "Servicios",

    profile:
      "Perfil",

    help:
      "Ayuda",

    logout:
      "Cerrar sesión",

    search:
      "Buscar productos...",

    loading:
      "Cargando...",

    login:
      "Iniciar sesión",

    register:
      "Registrarse",

    email:
      "Correo electrónico",

    password:
      "Contraseña",

    name:
      "Nombre completo",

    buyer:
      "Comprador",

    seller:
      "Vendedor",

    accountType:
      "Tipo de cuenta",

    forgot:
      "¿Olvidó su contraseña?",

    cancel:
      "Cancelar",

    send:
      "Enviar",

    close:
      "Cerrar",

    welcome:
      "Bienvenido a Mystro-Shop",

    market:
      "Mercado internacional",

    discover:
      "Descubra los productos disponibles.",

    noProducts:
      "No hay productos disponibles.",

    addCart:
      "Añadir al carrito",

    buyNow:
      "Comprar ahora",

    stock:
      "Existencias",

    category:
      "Categoría",

    publishProduct:
      "Publicar producto",

    publishTitle:
      "Publicar un producto",

    productName:
      "Nombre del producto",

    price:
      "Precio",

    priceCurrency:
      "Moneda del precio",

    productPhoto:
      "Foto del producto",

    description:
      "Descripción",

    selectImage:
      "Elija una imagen JPEG, PNG o WebP de menos de 5 MB.",

    publicationSuccess:
      "Producto publicado correctamente.",

    publicationError:
      "No se pudo publicar el producto.",

    loginRequired:
      "Inicie sesión primero.",

    sellerRequired:
      "Esta función está reservada para cuentas de vendedor.",

    invalidImage:
      "Imagen no válida. Use JPEG, PNG o WebP, máximo 5 MB.",

    dashboardSubtitle:
      "Siga la actividad de su tienda Mystro-Shop.",

    revenue:
      "Ingresos",

    availableBalance:
      "Saldo disponible",

    deposit:
      "Depósito",

    withdrawal:
      "Retiro",

    depositWithdrawal:
      "Depósito / Retiro",

    bank:
      "Banco",

    transfer:
      "Transferencia",

    currencies:
      "Monedas",

    conversion:
      "Conversión",

    walletSubtitle:
      "Depósitos, retiros y transferencias.",

    cartSubtitle:
      "Revise sus productos antes del pago.",

    emptyCart:
      "Su carrito está vacío.",

    subtotal:
      "Subtotal",

    commission:
      "Comisión Mystro-Shop",

    total:
      "Total",

    checkout:
      "Continuar al pago",

    remove:
      "Eliminar",

    quantity:
      "Cantidad",

    assistant:
      "Asistente Mystro-Shop",

    assistantHello:
      "Hola 👋 ¿Cómo puedo ayudarle?",

    assistantPlaceholder:
      "Escriba su pregunta...",

    chatPlaceholder:
      "Escriba un mensaje...",

    myProfile:
      "Mi perfil",

    payments:
      "Pagos",

    howToSell:
      "¿Cómo vender?",

    operationUnavailable:
      "Esta operación aún no está disponible.",

    moncashAmount:
      "Monto MonCash",

    invalidAmount:
      "Ingrese un monto válido.",

    paymentStarted:
      "Pago MonCash iniciado.",

    withdrawalSent:
      "Solicitud de retiro enviada.",

    authError:
      "Correo o contraseña incorrectos.",

    registerSuccess:
      "Cuenta creada correctamente.",

    resetSent:
      "Correo de restablecimiento enviado.",

    cartAdded:
      "Producto añadido al carrito.",

    orderSaved:
      "Pedido guardado.",

    noOrders:
      "No hay pedidos.",

    noClients:
      "No hay clientes para mostrar."
  }
};


function t(key) {

  return (
    I18N[state.language]?.[key] ||
    I18N.fr[key] ||
    key
  );
}


/* ============================================================
   TRADUCTION DES TEXTES EXISTANTS
============================================================ */

const TEXT_ALIASES = {

  "Accueil":
    "home",

  "Home":
    "home",

  "Akèy":
    "home",

  "Inicio":
    "home",


  "Tableau de bord":
    "dashboard",

  "Dashboard":
    "dashboard",

  "Tablo kontwòl":
    "dashboard",

  "Panel de control":
    "dashboard",


  "Produits":
    "products",

  "Products":
    "products",

  "Pwodwi":
    "products",

  "Productos":
    "products",


  "Vendre":
    "sell",

  "Sell":
    "sell",

  "Vann":
    "sell",

  "Vender":
    "sell",


  "Portefeuille":
    "wallet",

  "Wallet":
    "wallet",

  "Pòtfèy":
    "wallet",

  "Cartera":
    "wallet",


  "Panier":
    "cart",

  "Cart":
    "cart",

  "Panyen":
    "cart",

  "Carrito":
    "cart",


  "Statistiques":
    "statistics",

  "Statistics":
    "statistics",

  "Estatistik":
    "statistics",

  "Estadísticas":
    "statistics",


  "Clients actifs":
    "clients",

  "Active clients":
    "clients",

  "Kliyan aktif":
    "clients",

  "Clientes activos":
    "clients",


  "Commandes":
    "orders",

  "Orders":
    "orders",

  "Kòmand":
    "orders",

  "Pedidos":
    "orders",


  "Services":
    "services",

  "Sèvis":
    "services",

  "Servicios":
    "services",


  "Profil":
    "profile",

  "Profile":
    "profile",

  "Pwofil":
    "profile",

  "Perfil":
    "profile",


  "Aide":
    "help",

  "Help":
    "help",

  "Èd":
    "help",

  "Ayuda":
    "help",


  "Déconnexion":
    "logout",

  "Log out":
    "logout",

  "Dekonekte":
    "logout",

  "Cerrar sesión":
    "logout",


  "Marché international":
    "market",

  "International marketplace":
    "market",

  "Mache entènasyonal":
    "market",

  "Mercado internacional":
    "market",


  "Bienvenue à Mystro-Shop":
    "welcome",

  "Welcome to Mystro-Shop":
    "welcome",

  "Byenveni sou Mystro-Shop":
    "welcome",

  "Bienvenido a Mystro-Shop":
    "welcome",


  "Suivez l'activité de votre boutique Mystro-Shop.":
    "dashboardSubtitle",

  "Follow your Mystro-Shop store activity.":
    "dashboardSubtitle",

  "Swiv aktivite boutik Mystro-Shop ou a.":
    "dashboardSubtitle",

  "Siga la actividad de su tienda Mystro-Shop.":
    "dashboardSubtitle",


  "Revenus":
    "revenue",

  "Revenue":
    "revenue",

  "Revni":
    "revenue",

  "Ingresos":
    "revenue",


  "Dépôts, retraits et transferts.":
    "walletSubtitle",

  "Deposits, withdrawals and transfers.":
    "walletSubtitle",

  "Depo, retrè ak transfè.":
    "walletSubtitle",

  "Depósitos, retiros y transferencias.":
    "walletSubtitle",


  "Solde disponible":
    "availableBalance",

  "Available balance":
    "availableBalance",

  "Balans disponib":
    "availableBalance",

  "Saldo disponible":
    "availableBalance",


  "Dépôt":
    "deposit",

  "Deposit":
    "deposit",

  "Depo":
    "deposit",

  "Depósito":
    "deposit",


  "Retrait":
    "withdrawal",

  "Withdrawal":
    "withdrawal",

  "Retrè":
    "withdrawal",

  "Retiro":
    "withdrawal",


  "Banque":
    "bank",

  "Bank":
    "bank",

  "Banco":
    "bank",


  "Transfert":
    "transfer",

  "Transfer":
    "transfer",

  "Transfè":
    "transfer",

  "Transferencia":
    "transfer",


  "Devises":
    "currencies",

  "Currencies":
    "currencies",

  "Lajan":
    "currencies",

  "Monedas":
    "currencies",


  "Conversion":
    "conversion",

  "Konvèsyon":
    "conversion",

  "Conversión":
    "conversion",


  "Vérifiez vos produits avant le paiement.":
    "cartSubtitle",

  "Review your products before payment.":
    "cartSubtitle",

  "Verifye pwodwi ou yo anvan peman.":
    "cartSubtitle",

  "Revise sus productos antes del pago.":
    "cartSubtitle",


  "Votre panier est vide.":
    "emptyCart",

  "Your cart is empty.":
    "emptyCart",

  "Panyen ou vid.":
    "emptyCart",

  "Su carrito está vacío.":
    "emptyCart",


  "Sous-total":
    "subtotal",

  "Subtotal":
    "subtotal",

  "Sou-total":
    "subtotal",


  "Commission Mystro-Shop":
    "commission",

  "Mystro-Shop commission":
    "commission",

  "Komisyon Mystro-Shop":
    "commission",

  "Comisión Mystro-Shop":
    "commission",


  "Continuer vers le paiement":
    "checkout",

  "Continue to payment":
    "checkout",

  "Kontinye pou peman":
    "checkout",

  "Continuar al pago":
    "checkout",


  "Assistant Mystro-Shop":
    "assistant",

  "Mystro-Shop Assistant":
    "assistant",

  "Asistan Mystro-Shop":
    "assistant",

  "Asistente Mystro-Shop":
    "assistant",


  "Bonjour 👋 Comment puis-je vous aider ?":
    "assistantHello",

  "Hello 👋 How can I help you?":
    "assistantHello",

  "Bonjou 👋 Kijan mwen ka ede w?":
    "assistantHello",

  "Hola 👋 ¿Cómo puedo ayudarle?":
    "assistantHello",


  "Publier un produit":
    "publishTitle",

  "Publish a product":
    "publishTitle",

  "Pibliye yon pwodwi":
    "publishTitle",

  "Publicar un producto":
    "publishTitle",


  "Nom du produit":
    "productName",

  "Product name":
    "productName",

  "Non pwodwi":
    "productName",

  "Nombre del producto":
    "productName",


  "Catégorie":
    "category",

  "Category":
    "category",

  "Kategori":
    "category",

  "Categoría":
    "category",


  "Prix":
    "price",

  "Price":
    "price",

  "Pri":
    "price",

  "Precio":
    "price",


  "Photo du produit":
    "productPhoto",

  "Product photo":
    "productPhoto",

  "Foto pwodwi":
    "productPhoto",

  "Foto del producto":
    "productPhoto",


  "Description":
    "description",

  "Deskripsyon":
    "description",

  "Descripción":
    "description",


  "Publier le produit":
    "publishProduct",

  "Publish product":
    "publishProduct",

  "Pibliye pwodwi a":
    "publishProduct",

  "Publicar producto":
    "publishProduct"
};


function applyLanguage(
  lang = state.language
) {

  if (!I18N[lang]) {

    lang =
      "fr";
  }


  state.language =
    lang;


  localStorage.setItem(
    "mystroLanguage",
    lang
  );


  document.documentElement.lang =
    lang;


  $$("[data-i18n]")
    .forEach(
      element => {

        const key =
          element.dataset.i18n;

        if (
          I18N[lang][key]
        ) {

          element.textContent =
            t(key);
        }
      }
    );


  const walker =
    document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );


  const nodes = [];


  while (
    walker.nextNode()
  ) {

    nodes.push(
      walker.currentNode
    );
  }


  nodes.forEach(
    node => {

      const value =
        node.nodeValue.trim();


      if (!value) {
        return;
      }


      const key =
        TEXT_ALIASES[value];


      if (!key) {
        return;
      }


      const before =
        node.nodeValue.match(
          /^\s*/
        )?.[0] || "";


      const after =
        node.nodeValue.match(
          /\s*$/
        )?.[0] || "";


      node.nodeValue =
        `${before}${t(key)}${after}`;
    }
  );


  if ($("searchInput")) {

    $("searchInput").placeholder =
      t("search");
  }


  if ($("assistantInput")) {

    $("assistantInput").placeholder =
      t("assistantPlaceholder");
  }


  if ($("chatInput")) {

    $("chatInput").placeholder =
      t("chatPlaceholder");
  }


  if ($("languageSelector")) {

    $("languageSelector").value =
      lang;
  }


  renderProducts();

  renderCart();
}


/* ============================================================
   NAVIGATION
============================================================ */

function pageElement(
  page
) {

  return $(
    `${page}Page`
  );
}


function openPage(
  page
) {

  const target =
    pageElement(page);


  if (!target) {
    return;
  }


  $$(".app-page")
    .forEach(
      element => {

        element.classList.remove(
          "active-page"
        );
      }
    );


  target.classList.add(
    "active-page"
  );


  state.currentPage =
    page;


  $$("[data-page]")
    .forEach(
      link => {

        link.classList.toggle(
          "active",
          link.dataset.page === page
        );
      }
    );


  const nav =
    $("mobileNav");


  if (nav) {

    nav.classList.remove(
      "open"
    );
  }


  document.body.classList.remove(
    "nav-open"
  );


  if (
    page === "products" ||
    page === "home"
  ) {

    renderProducts();
  }


  if (
    page === "cart"
  ) {

    renderCart();
  }


  if (
    page === "dashboard" ||
    page === "statistics"
  ) {

    refreshStats();
  }


  if (
    page === "profile"
  ) {

    renderProfile();
  }


  if (
    page === "orders"
  ) {

    renderOrders();
  }


  if (
    page === "clients"
  ) {

    renderClients();
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  setTimeout(
    () => {

      applyLanguage(
        state.language
      );

    },
    0
  );
}


function setupNavigation() {

  $("menuBtn")
    ?.addEventListener(
      "click",
      () => {

        $("mobileNav")
          ?.classList.toggle(
            "open"
          );


        document.body.classList.toggle(
          "nav-open"
        );
      }
    );


  $$("[data-page]")
    .forEach(
      link => {

        link.addEventListener(
          "click",
          event => {

            event.preventDefault();

            openPage(
              link.dataset.page
            );
          }
        );
      }
    );
}


/* ============================================================
   AUTH
============================================================ */

function ensureAuthModal() {

  if (
    $("authModal")
  ) {

    return;
  }


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "authModal";


  modal.className =
    "mystro-modal";


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.innerHTML = `
    <div class="modal-card" style="max-width:430px">

      <button
        type="button"
        class="modal-close"
        data-close-modal="authModal"
      >
        ×
      </button>

      <div
        style="
          display:flex;
          gap:8px;
          margin-bottom:16px;
        "
      >

        <button
          type="button"
          id="authLoginTab"
          class="btn primary"
          style="flex:1"
        >
          ${t("login")}
        </button>

        <button
          type="button"
          id="authRegisterTab"
          class="btn"
          style="flex:1"
        >
          ${t("register")}
        </button>

      </div>

      <form id="authForm">

        <div
          id="authNameWrap"
          style="display:none"
        >

          <label>
            ${t("name")}
          </label>

          <input
            id="authName"
            autocomplete="name"
          >

        </div>

        <label>
          ${t("email")}
        </label>

        <input
          id="authEmail"
          type="email"
          autocomplete="email"
          required
        >

        <label>
          ${t("password")}
        </label>

        <input
          id="authPassword"
          type="password"
          minlength="6"
          required
        >

        <div
          id="authRoleWrap"
          style="display:none"
        >

          <label>
            ${t("accountType")}
          </label>

          <select id="authRole">

            <option value="buyer">
              ${t("buyer")}
            </option>

            <option value="seller">
              ${t("seller")}
            </option>

          </select>

        </div>

        <button
          id="authSubmitBtn"
          class="btn primary"
          type="submit"
          style="
            width:100%;
            margin-top:14px;
          "
        >
          ${t("login")}
        </button>

        <button
          id="authForgotBtn"
          type="button"
          class="btn ghost"
          style="
            width:100%;
            margin-top:8px;
          "
        >
          ${t("forgot")}
        </button>

      </form>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  let mode =
    "login";


  const setMode =
    next => {

      mode =
        next;


      $("authNameWrap").style.display =
        mode === "register"
          ? "block"
          : "none";


      $("authRoleWrap").style.display =
        mode === "register"
          ? "block"
          : "none";


      $("authForgotBtn").style.display =
        mode === "login"
          ? "block"
          : "none";


      $("authSubmitBtn").textContent =
        mode === "login"
          ? t("login")
          : t("register");
    };


  $("authLoginTab")
    .addEventListener(
      "click",
      () => {

        setMode(
          "login"
        );
      }
    );


  $("authRegisterTab")
    .addEventListener(
      "click",
      () => {

        setMode(
          "register"
        );
      }
    );


  $("authForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("authEmail")
            .value
            .trim();


        const password =
          $("authPassword")
            .value;


        const button =
          $("authSubmitBtn");


        setBusy(
          button,
          true
        );


        try {

          if (
            mode === "register"
          ) {

            const credential =
              await createUserWithEmailAndPassword(
                auth,
                email,
                password
              );


            const profile = {

              name:
                $("authName")
                  .value
                  .trim() ||
                email.split("@")[0],

              email,

              role:
                $("authRole").value,

              balance:
                0,

              createdAt:
                serverTimestamp()
            };


            await setDoc(
              doc(
                db,
                "users",
                credential.user.uid
              ),
              profile,
              {
                merge: true
              }
            );


            toast(
              t("registerSuccess"),
              "success"
            );

          } else {

            await signInWithEmailAndPassword(
              auth,
              email,
              password
            );
          }


          closeModal(
            "authModal"
          );


        } catch (error) {

          console.error(
            "Auth:",
            error
          );


          toast(
            error?.message ||
            t("authError"),
            "error"
          );

        } finally {

          setBusy(
            button,
            false
          );


          button.textContent =
            mode === "login"
              ? t("login")
              : t("register");
        }
      }
    );


  $("authForgotBtn")
    .addEventListener(
      "click",
      async () => {

        const email =
          $("authEmail")
            .value
            .trim();


        if (!email) {

          return toast(
            t("email"),
            "error"
          );
        }


        try {

          await sendPasswordResetEmail(
            auth,
            email
          );


          toast(
            t("resetSent"),
            "success"
          );


        } catch (error) {

          toast(
            error?.message ||
            t("authError"),
            "error"
          );
        }
      }
    );
}


function openAuth(
  mode = "login"
) {

  ensureAuthModal();


  if (
    mode === "register"
  ) {

    $("authRegisterTab")
      ?.click();

  } else {

    $("authLoginTab")
      ?.click();
  }


  openModal(
    "authModal"
  );
}


async function loadUserProfile(
  user
) {

  if (!user) {

    return null;
  }


  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );


    if (
      snapshot.exists()
    ) {

      return {
        id:
          snapshot.id,

        ...snapshot.data()
      };
    }


  } catch (error) {

    console.warn(
      "Profile:",
      error
    );
  }


  return {

    name:
      user.email
        ?.split("@")[0] ||
      "Utilisateur",

    email:
      user.email || "",

    role:
      "buyer",

    balance:
      0
  };
}


function isSeller() {

  return (
    state.profile?.role ===
      "seller" ||

    state.profile?.role ===
      "admin"
  );
}


function setupAuthButtons() {

  $("welcomeLoginBtn")
    ?.addEventListener(
      "click",
      () => {

        openAuth(
          "login"
        );
      }
    );


  $("welcomeRegisterBtn")
    ?.addEventListener(
      "click",
      () => {

        openAuth(
          "register"
        );
      }
    );


  $("logoutBtn")
    ?.addEventListener(
      "click",
      () => {

        signOut(auth);
      }
    );


  $("profileLogoutBtn")
    ?.addEventListener(
      "click",
      () => {

        signOut(auth);
      }
    );


  $("profileBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.user
        ) {

          openPage(
            "profile"
          );

        } else {

          openAuth(
            "login"
          );
        }
      }
    );
}


/* ============================================================
   PRODUITS
============================================================ */

const DEMO_PRODUCTS = [

  {
    id:
      "demo-1",

    name:
      "Robe élégante",

    category:
      "Mode",

    price:
      24.99,

    currency:
      "USD",

    stock:
      12,

    imageUrl:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=80",

    description:
      "Style moderne pour toutes occasions."
  },


  {
    id:
      "demo-2",

    name:
      "Sac tendance",

    category:
      "Accessoires",

    price:
      18.50,

    currency:
      "USD",

    stock:
      8,

    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",

    description:
      "Sac pratique et élégant."
  },


  {
    id:
      "demo-3",

    name:
      "Chaussures casual",

    category:
      "Chaussures",

    price:
      31,

    currency:
      "USD",

    stock:
      15,

    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",

    description:
      "Confort et style au quotidien."
  }
];


async function loadProducts() {

  let products = [];


  try {

    const request =
      query(
        collection(
          db,
          "products"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(100)
      );


    const snapshot =
      await getDocs(
        request
      );


    products =
      snapshot.docs.map(
        documentItem => ({
          id:
            documentItem.id,

          ...documentItem.data()
        })
      );


  } catch (error) {

    console.warn(
      "Products:",
      error
    );


    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "products"
          )
        );


      products =
        snapshot.docs.map(
          documentItem => ({
            id:
              documentItem.id,

            ...documentItem.data()
          })
        );


    } catch (fallbackError) {

      console.error(
        "Products fallback:",
        fallbackError
      );
    }
  }


  state.products =
    products.length
      ? products
      : DEMO_PRODUCTS;


  state.filteredProducts =
    [
      ...state.products
    ];


  renderProducts();

  refreshStats();
}


function productPriceInCurrentCurrency(
  product
) {

  const from =
    product.currency ||
    "USD";


  return convertAmount(
    Number(
      product.price
    ) || 0,
    from,
    state.currency
  );
}


function productCard(
  product
) {

  const name =
    escapeHTML(
      product.name ||
      "Produit"
    );


  const image =
    escapeHTML(
      product.imageUrl ||
      product.image ||
      "https://placehold.co/600x750?text=Mystro-Shop"
    );


  const category =
    escapeHTML(
      product.category ||
      "Marketplace"
    );


  const price =
    money(
      productPriceInCurrentCurrency(
        product
      )
    );


  return `
    <article
      class="
        product-card
        mystro-fashion-card
      "
      data-product-id="${escapeHTML(product.id)}"
    >

      <div
        class="product-image-wrap"
        style="
          position:relative;
          aspect-ratio:3/4;
          overflow:hidden;
          background:#f5f5f5;
        "
      >

        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
          "
        >

        <button
          type="button"
          class="product-heart"
          style="
            position:absolute;
            right:9px;
            top:9px;
            border:0;
            background:#fff;
            width:34px;
            height:34px;
            border-radius:50%;
            font-size:18px;
          "
        >
          ♡
        </button>

      </div>

      <div class="product-info">

        <div
          style="
            font-size:11px;
            opacity:.62;
            text-transform:uppercase;
          "
        >
          ${category}
        </div>

        <h3
          style="
            margin:4px 0 5px;
            font-size:14px;
          "
        >
          ${name}
        </h3>

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <strong>
            ${price}
          </strong>

          <button
            type="button"
            data-add-cart="${escapeHTML(product.id)}"
            style="
              border:0;
              background:#111;
              color:#fff;
              width:34px;
              height:34px;
              border-radius:50%;
              font-size:19px;
            "
          >
            +
          </button>

        </div>

      </div>

    </article>
  `;
}


function renderProducts() {

  const containers = [

    $("productsGrid"),

    $("homeProducts"),

    $("featuredProducts")

  ].filter(Boolean);


  if (
    !containers.length
  ) {

    return;
  }


  const products =
    state.filteredProducts;


  const html =
    products.length

      ? products
          .map(
            productCard
          )
          .join("")

      : `
        <div class="empty-state">
          ${t("noProducts")}
        </div>
      `;


  containers.forEach(
    container => {

      container.innerHTML =
        html;
    }
  );


  bindProductButtons();
}


function bindProductButtons() {

  $$("[data-add-cart]")
    .forEach(
      button => {

        button.onclick =
          () => {

            addToCart(
              button.dataset.addCart
            );
          };
      }
    );


  $$(".product-heart")
    .forEach(
      button => {

        button.onclick =
          () => {

            button.textContent =
              button.textContent === "♡"
                ? "♥"
                : "♡";
          };
      }
    );
}


/* ============================================================
   RECHERCHE
============================================================ */

function filterProducts() {

  const search =
    normalizeText(
      $("searchInput")
        ?.value ||
      ""
    );


  state.filteredProducts =
    state.products.filter(
      product => {

        const text =
          normalizeText(
            `${
              product.name || ""
            } ${
              product.category || ""
            } ${
              product.description || ""
            }`
          );


        return (
          !search ||
          text.includes(search)
        );
      }
    );


  renderProducts();
}


function setupSearch() {

  $("searchInput")
    ?.addEventListener(
      "input",
      filterProducts
    );
}


/* ============================================================
   APERÇU PHOTO
============================================================ */

function validateImage(
  file
) {

  if (!file) {

    return false;
  }


  return (
    ACCEPTED_IMAGE_TYPES.includes(
      file.type
    ) &&
    file.size <=
      MAX_IMAGE_SIZE
  );
}


function setupImagePreview() {

  $("productImage")
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target
            .files?.[0];


        const preview =
          $("productImagePreview");


        if (!file) {

          if (preview) {

            preview.innerHTML =
              "";
          }

          return;
        }


        if (
          !validateImage(file)
        ) {

          event.target.value =
            "";


          if (preview) {

            preview.innerHTML =
              "";
          }


          toast(
            t("invalidImage"),
            "error"
          );

          return;
        }


        const url =
          URL.createObjectURL(
            file
          );


        if (!preview) {

          return;
        }


        if (
          preview.tagName ===
          "IMG"
        ) {

          preview.src =
            url;

          preview.style.display =
            "block";

        } else {

          preview.innerHTML = `
            <img
              src="${url}"
              alt="Aperçu"
              style="
                max-width:100%;
                max-height:320px;
                object-fit:cover;
                border-radius:12px;
              "
            >
          `;
        }
      }
    );
}


/* ============================================================
   UPLOAD PHOTO
============================================================ */

async function uploadImageToWorker(
  file
) {

  const form =
    new FormData();


  form.append(
    "image",
    file
  );


  form.append(
    "file",
    file
  );


  form.append(
    "userId",
    state.user?.uid ||
    ""
  );


  const token =
    state.user
      ? await state.user.getIdToken(false)
      : "";


  const response =
    await fetch(
      `${API_URL}/products/image-upload`,
      {
        method:
          "POST",

        headers:
          token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {},

        body:
          form
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Worker upload HTTP ${response.status}`
    );
  }


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  const url =
    data.url ||
    data.imageUrl ||
    data.publicUrl ||
    data.secure_url;


  if (!url) {

    throw new Error(
      "URL image manquante"
    );
  }


  return url;
}


async function uploadImageToSupabase(
  file
) {

  const extension =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    )
      .toLowerCase();


  const safeExtension =
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(extension)
      ? extension
      : "jpg";


  const path =
    `${
      state.user.uid
    }/${
      Date.now()
    }-${
      Math.random()
        .toString(36)
        .slice(2)
    }.${safeExtension}`;


  const {
    error
  } =
    await supabase
      .storage
      .from(
        PRODUCT_BUCKET
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


  if (error) {

    throw error;
  }


  const {
    data
  } =
    supabase
      .storage
      .from(
        PRODUCT_BUCKET
      )
      .getPublicUrl(
        path
      );


  if (
    !data?.publicUrl
  ) {

    throw new Error(
      "URL Supabase manquante"
    );
  }


  return data.publicUrl;
}


async function uploadProductImage(
  file
) {

  try {

    return await uploadImageToWorker(
      file
    );


  } catch (workerError) {

    console.warn(
      "Worker upload impossible.",
      workerError
    );


    return await uploadImageToSupabase(
      file
    );
  }
}


/* ============================================================
   PUBLICATION PRODUIT
============================================================ */

async function publishProduct(
  event
) {

  event?.preventDefault();


  if (
    !state.user
  ) {

    openAuth(
      "login"
    );

    return;
  }


  if (
    !isSeller()
  ) {

    toast(
      t("sellerRequired"),
      "error"
    );

    return;
  }


  const name =
    $("productName")
      ?.value
      .trim();


  const category =
    $("productCategory")
      ?.value
      .trim();


  const currency =
    $("productCurrency")
      ?.value ||
    "USD";


  const price =
    Number(
      $("productPrice")
        ?.value
    );


  const stock =
    Number(
      $("productStock")
        ?.value
    );


  const description =
    $("productDescription")
      ?.value
      .trim() ||
    "";


  const file =
    $("productImage")
      ?.files?.[0];


  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(stock) ||
    stock < 0 ||
    !file
  ) {

    toast(
      t("publicationError"),
      "error"
    );

    return;
  }


  if (
    !validateImage(file)
  ) {

    toast(
      t("invalidImage"),
      "error"
    );

    return;
  }


  const button =
    $("publishProductBtn") ||
    $("productForm")
      ?.querySelector(
        'button[type="submit"]'
      );


  setBusy(
    button,
    true,
    t("loading")
  );


  try {

    const imageUrl =
      await uploadProductImage(
        file
      );


    const payload = {

      name,

      category,

      currency,

      price,

      stock,

      description,

      imageUrl,

      sellerId:
        state.user.uid,

      sellerName:
        state.profile?.name ||
        state.user.email ||
        "Seller",

      commissionRate:
        COMMISSION_RATE,

      status:
        "active",

      createdAt:
        serverTimestamp()
    };


    const reference =
      await addDoc(
        collection(
          db,
          "products"
        ),
        payload
      );


    state.products.unshift({

      id:
        reference.id,

      ...payload
    });


    state.filteredProducts =
      [
        ...state.products
      ];


    $("productForm")
      ?.reset();


    const preview =
      $("productImagePreview");


    if (preview) {

      if (
        preview.tagName ===
        "IMG"
      ) {

        preview.src =
          "";

        preview.style.display =
          "none";

      } else {

        preview.innerHTML =
          "";
      }
    }


    toast(
      t("publicationSuccess"),
      "success"
    );


    renderProducts();


    openPage(
      "products"
    );


  } catch (error) {

    console.error(
      "Publication:",
      error
    );


    toast(
      `${t("publicationError")} ${
        error?.message ||
        ""
      }`,
      "error"
    );


  } finally {

    setBusy(
      button,
      false
    );
  }
}


function setupProductForm() {

  const form =
    $("productForm");


  if (form) {

    form.addEventListener(
      "submit",
      publishProduct
    );
  }


  const button =
    $("publishProductBtn");


  if (
    button &&
    button.type !==
      "submit"
  ) {

    button.addEventListener(
      "click",
      publishProduct
    );
  }
}


/* ============================================================
   PANIER
============================================================ */

function cartLinePrice(
  item
) {

  return (
    convertAmount(
      Number(
        item.price
      ) || 0,
      item.currency ||
      "USD",
      state.currency
    ) *
    (
      Number(
        item.qty
      ) || 1
    )
  );
}


function updateCartBadge() {

  const count =
    state.cart.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.qty
          ) || 1
        ),
      0
    );


  if (
    $("cartCount")
  ) {

    $("cartCount")
      .textContent =
      count;
  }


  $$("[data-cart-count]")
    .forEach(
      element => {

        element.textContent =
          count;
      }
    );
}


function addToCart(
  productId
) {

  const product =
    state.products.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (!product) {

    return;
  }


  const existing =
    state.cart.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (existing) {

    existing.qty =
      (
        existing.qty ||
        1
      ) + 1;

  } else {

    state.cart.push({
      ...product,
      qty: 1
    });
  }


  saveJSON(
    "mystroCart",
    state.cart
  );


  updateCartBadge();

  renderCart();


  toast(
    t("cartAdded"),
    "success"
  );
}


function changeCartQty(
  id,
  delta
) {

  const item =
    state.cart.find(
      product =>
        String(product.id) ===
        String(id)
    );


  if (!item) {

    return;
  }


  item.qty =
    Math.max(
      1,
      (
        Number(
          item.qty
        ) || 1
      ) +
      delta
    );


  saveJSON(
    "mystroCart",
    state.cart
  );


  renderCart();
}


function removeCartItem(
  id
) {

  state.cart =
    state.cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  saveJSON(
    "mystroCart",
    state.cart
  );


  renderCart();
}


function renderCart() {

  updateCartBadge();


  const container =
    $("cartItems");


  if (!container) {

    return;
  }


  if (
    !state.cart.length
  ) {

    container.innerHTML = `
      <div class="empty-state">
        ${t("emptyCart")}
      </div>
    `;

  } else {

    container.innerHTML =
      state.cart
        .map(
          item => `

            <div
              class="cart-item"
              style="
                display:grid;
                grid-template-columns:72px 1fr auto;
                gap:12px;
                align-items:center;
                padding:12px 0;
                border-bottom:1px solid #eee;
              "
            >

              <img
                src="${
                  escapeHTML(
                    item.imageUrl ||
                    item.image ||
                    "https://placehold.co/120x150"
                  )
                }"
                style="
                  width:72px;
                  height:90px;
                  object-fit:cover;
                "
              >

              <div>

                <strong>
                  ${escapeHTML(item.name)}
                </strong>

                <div>
                  ${
                    money(
                      productPriceInCurrentCurrency(
                        item
                      )
                    )
                  }
                </div>

                <div
                  style="
                    display:flex;
                    gap:7px;
                    align-items:center;
                    margin-top:7px;
                  "
                >

                  <button
                    type="button"
                    data-qty-minus="${escapeHTML(item.id)}"
                  >
                    −
                  </button>

                  <span>
                    ${item.qty || 1}
                  </span>

                  <button
                    type="button"
                    data-qty-plus="${escapeHTML(item.id)}"
                  >
                    +
                  </button>

                </div>

              </div>

              <button
                type="button"
                data-remove-cart="${escapeHTML(item.id)}"
              >
                ×
              </button>

            </div>

          `
        )
        .join("");
  }


  const subtotal =
    state.cart.reduce(
      (
        total,
        item
      ) =>
        total +
        cartLinePrice(item),
      0
    );


  const fees =
    subtotal *
    COMMISSION_RATE;


  const total =
    subtotal +
    fees;


  if (
    $("cartSubtotal")
  ) {

    $("cartSubtotal")
      .textContent =
      money(subtotal);
  }


  if (
    $("cartFees")
  ) {

    $("cartFees")
      .textContent =
      money(fees);
  }


  if (
    $("cartTotal")
  ) {

    $("cartTotal")
      .textContent =
      money(total);
  }


  $$("[data-qty-minus]")
    .forEach(
      button => {

        button.onclick =
          () =>
            changeCartQty(
              button.dataset.qtyMinus,
              -1
            );
      }
    );


  $$("[data-qty-plus]")
    .forEach(
      button => {

        button.onclick =
          () =>
            changeCartQty(
              button.dataset.qtyPlus,
              1
            );
      }
    );


  $$("[data-remove-cart]")
    .forEach(
      button => {

        button.onclick =
          () =>
            removeCartItem(
              button.dataset.removeCart
            );
      }
    );
}


/* ============================================================
   COMMANDER
============================================================ */

async function checkout() {

  if (
    !state.cart.length
  ) {

    toast(
      t("emptyCart"),
      "error"
    );

    return;
  }


  if (
    !state.user
  ) {

    openAuth(
      "login"
    );

    return;
  }


  try {

    const subtotal =
      state.cart.reduce(
        (
          total,
          item
        ) =>
          total +
          cartLinePrice(item),
        0
      );


    const commission =
      subtotal *
      COMMISSION_RATE;


    await addDoc(
      collection(
        db,
        "orders"
      ),
      {

        buyerId:
          state.user.uid,

        buyerEmail:
          state.user.email ||
          "",

        items:
          state.cart.map(
            item => ({

              id:
                item.id,

              name:
                item.name,

              price:
                item.price,

              currency:
                item.currency,

              qty:
                item.qty,

              sellerId:
                item.sellerId ||
                ""
            })
          ),

        currency:
          state.currency,

        subtotal,

        commission,

        total:
          subtotal +
          commission,

        status:
          "pending_payment",

        createdAt:
          serverTimestamp()
      }
    );


    toast(
      t("orderSaved"),
      "success"
    );


    openPage(
      "wallet"
    );


  } catch (error) {

    console.error(
      "Checkout:",
      error
    );


    toast(
      t("publicationError"),
      "error"
    );
  }
}


/* ============================================================
   MONCASH
============================================================ */

async function postWorker(
  path,
  payload
) {

  const token =
    state.user
      ? await state.user.getIdToken(false)
      : "";


  const response =
    await fetch(
      `${API_URL}${path}`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          ...(
            token
              ? {
                  Authorization:
                    `Bearer ${token}`
                }
              : {}
          )
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (
    !response.ok
  ) {

    throw new Error(
      data.error ||
      data.message ||
      `HTTP ${response.status}`
    );
  }


  return data;
}


async function startMoncashDeposit() {

  if (
    !state.user
  ) {

    openAuth(
      "login"
    );

    return;
  }


  const amount =
    Number(
      $("moncashDepositAmount")
        ?.value
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    toast(
      t("invalidAmount"),
      "error"
    );

    return;
  }


  const button =
    $("startMoncashDepositBtn");


  setBusy(
    button,
    true
  );


  try {

    const data =
      await postWorker(
        "/moncash/deposit",
        {

          amount,

          currency:
            "HTG",

          userId:
            state.user.uid
        }
      );


    const url =
      data.redirectUrl ||
      data.paymentUrl ||
      data.url;


    if (url) {

      window.location.href =
        url;

    } else {

      toast(
        t("paymentStarted"),
        "success"
      );
    }


  } catch (error) {

    console.error(
      "MonCash:",
      error
    );


    toast(
      error.message ||
      t("operationUnavailable"),
      "error"
    );


  } finally {

    setBusy(
      button,
      false
    );
  }
}


async function startMoncashWithdraw() {

  if (
    !state.user
  ) {

    openAuth(
      "login"
    );

    return;
  }


  const amount =
    Number(
      $("moncashWithdrawAmount")
        ?.value
    );


  const phone =
    $("moncashWithdrawPhone")
      ?.value
      .trim();


  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !phone
  ) {

    toast(
      t("invalidAmount"),
      "error"
    );

    return;
  }


  const button =
    $("startMoncashWithdrawBtn");


  setBusy(
    button,
    true
  );


  try {

    await postWorker(
      "/moncash/withdraw",
      {

        amount,

        phone,

        currency:
          "HTG",

        userId:
          state.user.uid
      }
    );


    toast(
      t("withdrawalSent"),
      "success"
    );


    closeModal(
      "moncashWithdrawModal"
    );


  } catch (error) {

    console.error(
      "Withdrawal:",
      error
    );


    toast(
      error.message ||
      t("operationUnavailable"),
      "error"
    );


  } finally {

    setBusy(
      button,
      false
    );
  }
}


function setupWallet() {

  $("moncashDepositBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.user
        ) {

          openModal(
            "moncashDepositModal"
          );

        } else {

          openAuth(
            "login"
          );
        }
      }
    );


  $("moncashWithdrawBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.user
        ) {

          openModal(
            "moncashWithdrawModal"
          );

        } else {

          openAuth(
            "login"
          );
        }
      }
    );


  $("startMoncashDepositBtn")
    ?.addEventListener(
      "click",
      startMoncashDeposit
    );


  $("startMoncashWithdrawBtn")
    ?.addEventListener(
      "click",
      startMoncashWithdraw
    );


  [
    "natcashBtn",
    "bankBtn",
    "transferBtn",
    "exchangeBtn"
  ].forEach(
    id => {

      $(id)
        ?.addEventListener(
          "click",
          () => {

            toast(
              t(
                "operationUnavailable"
              ),
              "info"
            );
          }
        );
    }
  );
}


/* ============================================================
   PROFIL
============================================================ */

function renderProfile() {

  const profile =
    state.profile ||
    {};


  const name =
    profile.name ||
    state.user
      ?.email
      ?.split("@")[0] ||
    "Mystro-Shop";


  const email =
    profile.email ||
    state.user?.email ||
    "";


  const role =
    profile.role === "seller"
      ? t("seller")
      : t("buyer");


  const initial =
    (
      name[0] ||
      "M"
    ).toUpperCase();


  if (
    $("profileName")
  ) {

    $("profileName")
      .textContent =
      name;
  }


  if (
    $("profileEmail")
  ) {

    $("profileEmail")
      .textContent =
      email;
  }


  if (
    $("profileRole")
  ) {

    $("profileRole")
      .textContent =
      role;
  }


  if (
    $("profileAvatar")
  ) {

    $("profileAvatar")
      .textContent =
      initial;
  }


  if (
    $("userInitials")
  ) {

    $("userInitials")
      .textContent =
      initial;
  }


  if (
    $("profileNameModal")
  ) {

    $("profileNameModal")
      .textContent =
      name;
  }


  if (
    $("profileEmailModal")
  ) {

    $("profileEmailModal")
      .textContent =
      email;
  }


  const balance =
    convertAmount(
      profile.balance ||
      0,
      "USD",
      state.currency
    );


  if (
    $("profileBalance")
  ) {

    $("profileBalance")
      .textContent =
      money(balance);
  }


  if (
    $("walletBalance")
  ) {

    $("walletBalance")
      .textContent =
      money(balance);
  }
}


/* ============================================================
   STATISTIQUES
============================================================ */

function destroyChart(
  key
) {

  if (
    state.charts[key]
  ) {

    state.charts[key]
      .destroy();


    delete state.charts[key];
  }
}


function refreshStats() {

  const productCount =
    state.products.length;


  const clientCount =
    new Set(
      state.products
        .map(
          product =>
            product.sellerId
        )
        .filter(Boolean)
    ).size;


  const revenue =
    state.products.reduce(
      (
        total,
        product
      ) =>
        total +
        (
          Number(
            product.price
          ) || 0
        ),
      0
    );


  if (
    $("dashboardProducts")
  ) {

    $("dashboardProducts")
      .textContent =
      productCount;
  }


  if (
    $("dashboardClients")
  ) {

    $("dashboardClients")
      .textContent =
      clientCount;
  }


  if (
    $("dashboardRevenue")
  ) {

    $("dashboardRevenue")
      .textContent =
      money(
        convertAmount(
          revenue,
          "USD",
          state.currency
        )
      );
  }


  if (
    $("statProducts")
  ) {

    $("statProducts")
      .textContent =
      productCount;
  }


  if (
    $("statClients")
  ) {

    $("statClients")
      .textContent =
      clientCount;
  }


  if (
    $("statRevenue")
  ) {

    $("statRevenue")
      .textContent =
      money(
        convertAmount(
          revenue,
          "USD",
          state.currency
        )
      );
  }


  if (
    window.Chart &&
    $("salesChart")
  ) {

    destroyChart(
      "sales"
    );


    state.charts.sales =
      new Chart(
        $("salesChart"),
        {

          type:
            "line",

          data: {

            labels: [
              "Lun",
              "Mar",
              "Mer",
              "Jeu",
              "Ven",
              "Sam",
              "Dim"
            ],

            datasets: [
              {

                label:
                  t("revenue"),

                data:
                  [
                    2,
                    5,
                    4,
                    8,
                    6,
                    11,
                    9
                  ],

                tension:
                  0.35
              }
            ]
          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false
          }
        }
      );
  }
}


/* ============================================================
   COMMANDES
============================================================ */

async function renderOrders() {

  const container =
    $("ordersList");


  if (!container) {

    return;
  }


  if (
    !state.user
  ) {

    container.innerHTML = `
      <div class="empty-state">
        ${t("loginRequired")}
      </div>
    `;

    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "orders"
        )
      );


    const rows =
      snapshot.docs

        .map(
          item => ({
            id:
              item.id,

            ...item.data()
          })
        )

        .filter(
          order =>
            order.buyerId ===
              state.user.uid ||

            order.items
              ?.some(
                item =>
                  item.sellerId ===
                  state.user.uid
              )
        );


    container.innerHTML =
      rows.length

        ? rows
            .map(
              order => `
                <div class="list-card">

                  <strong>
                    #${escapeHTML(order.id.slice(0, 8))}
                  </strong>

                  <span>
                    ${escapeHTML(order.status || "pending")}
                  </span>

                  <b>
                    ${
                      money(
                        order.total ||
                        0,
                        order.currency ||
                        state.currency
                      )
                    }
                  </b>

                </div>
              `
            )
            .join("")

        : `
          <div class="empty-state">
            ${t("noOrders")}
          </div>
        `;


  } catch (error) {

    console.error(
      "Orders:",
      error
    );


    container.innerHTML = `
      <div class="empty-state">
        ${t("noOrders")}
      </div>
    `;
  }
}


/* ============================================================
   CLIENTS
============================================================ */

async function renderClients() {

  const container =
    $("clientsList");


  if (!container) {

    return;
  }


  if (
    !state.user ||
    !isSeller()
  ) {

    container.innerHTML = `
      <div class="empty-state">
        ${t("sellerRequired")}
      </div>
    `;

    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "orders"
        )
      );


    const clients =
      new Map();


    snapshot.docs

      .map(
        item =>
          item.data()
      )

      .filter(
        order =>
          order.items
            ?.some(
              item =>
                item.sellerId ===
                state.user.uid
            )
      )

      .forEach(
        order => {

          if (
            order.buyerId
          ) {

            clients.set(
              order.buyerId,
              {
                id:
                  order.buyerId,

                email:
                  order.buyerEmail ||
                  "Client"
              }
            );
          }
        }
      );


    const rows =
      [
        ...clients.values()
      ];


    container.innerHTML =
      rows.length

        ? rows
            .map(
              client => `
                <div class="list-card">

                  <strong>
                    ${escapeHTML(client.email)}
                  </strong>

                </div>
              `
            )
            .join("")

        : `
          <div class="empty-state">
            ${t("noClients")}
          </div>
        `;


  } catch {

    container.innerHTML = `
      <div class="empty-state">
        ${t("noClients")}
      </div>
    `;
  }
}


/* ============================================================
   CHAT
============================================================ */

function appendChat(
  container,
  text,
  who = "user"
) {

  if (
    !container ||
    !text
  ) {

    return;
  }


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    `chat-bubble ${who}`;


  bubble.textContent =
    text;


  container.appendChild(
    bubble
  );


  container.scrollTop =
    container.scrollHeight;
}


function setupChat() {

  $("sendChatBtn")
    ?.addEventListener(
      "click",
      () => {

        const input =
          $("chatInput");


        const text =
          input
            ?.value
            .trim();


        if (!text) {

          return;
        }


        appendChat(
          $("chatMessages"),
          text,
          "user"
        );


        input.value =
          "";
      }
    );


  $("chatInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();


          $("sendChatBtn")
            ?.click();
        }
      }
    );
}


/* ============================================================
   ASSISTANT
============================================================ */

function assistantReply(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    text.includes("vann") ||
    text.includes("sell") ||
    text.includes("vendre") ||
    text.includes("vender")
  ) {

    return t(
      "howToSell"
    );
  }


  if (
    text.includes("moncash") ||
    text.includes("peman") ||
    text.includes("payment") ||
    text.includes("paiement")
  ) {

    return t(
      "payments"
    );
  }


  if (
    text.includes("panier") ||
    text.includes("cart") ||
    text.includes("panyen") ||
    text.includes("carrito")
  ) {

    return t(
      "cartSubtitle"
    );
  }


  return t(
    "assistantHello"
  );
}


function setupAssistant() {

  $("assistantBtn")
    ?.addEventListener(
      "click",
      () => {

        $("assistantPanel")
          ?.classList.toggle(
            "open"
          );
      }
    );


  $("assistantCloseBtn")
    ?.addEventListener(
      "click",
      () => {

        $("assistantPanel")
          ?.classList.remove(
            "open"
          );
      }
    );


  const send =
    () => {

      const input =
        $("assistantInput");


      const text =
        input
          ?.value
          .trim();


      if (!text) {

        return;
      }


      appendChat(
        $("assistantMessages"),
        text,
        "user"
      );


      input.value =
        "";


      setTimeout(
        () => {

          appendChat(
            $("assistantMessages"),
            assistantReply(text),
            "assistant"
          );

        },
        250
      );
    };


  $("assistantSendBtn")
    ?.addEventListener(
      "click",
      send
    );


  $("assistantInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          send();
        }
      }
    );
}


/* ============================================================
   LANGUES / DEVISES
============================================================ */

function setupSelectors() {

  if (
    $("currencySelector")
  ) {

    $("currencySelector").value =
      state.currency;


    $("currencySelector")
      .addEventListener(
        "change",
        event => {

          state.currency =
            event.target.value;


          localStorage.setItem(
            "mystroCurrency",
            state.currency
          );


          renderProducts();

          renderCart();

          renderProfile();

          refreshStats();
        }
      );
  }


  if (
    $("languageSelector")
  ) {

    $("languageSelector").value =
      state.language;


    $("languageSelector")
      .addEventListener(
        "change",
        event => {

          applyLanguage(
            event.target.value
          );
        }
      );
  }
}


/* ============================================================
   INTERFACE GLOBALE
============================================================ */

function setupGlobalUI() {

  document.addEventListener(
    "click",
    event => {

      const closeButton =
        event.target.closest(
          "[data-close-modal]"
        );


      if (
        closeButton
      ) {

        closeModal(
          closeButton.dataset.closeModal
        );
      }


      if (
        event.target
          .classList
          ?.contains(
            "mystro-modal"
          )
      ) {

        event.target.classList.remove(
          "open"
        );


        event.target.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeAllModals();
      }
    }
  );


  $("checkoutBtn")
    ?.addEventListener(
      "click",
      checkout
    );
}


/* ============================================================
   FIREBASE AUTH STATE
============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    state.user =
      user;


    state.profile =
      user
        ? await loadUserProfile(
            user
          )
        : null;


    const welcome =
      $("welcomePage");


    const main =
      $("mainApp");


    if (user) {

      if (welcome) {

        welcome.style.display =
          "none";
      }


      if (main) {

        main.style.display =
          "block";
      }


      renderProfile();

      await loadProducts();


    } else {

      if (welcome) {

        welcome.style.display =
          "";
      }


      if (main) {

        main.style.display =
          "none";
      }


      state.profile =
        null;
    }


    applyLanguage(
      state.language
    );
  }
);


/* ============================================================
   SERVICE WORKER
============================================================ */

function registerServiceWorker() {

  if (
    !(
      "serviceWorker"
      in navigator
    )
  ) {

    return;
  }


  window.addEventListener(
    "load",
    () => {

      navigator
        .serviceWorker
        .register(
          "./service-worker.js"
        )
        .catch(
          error => {

            console.warn(
              "Service worker:",
              error
            );
          }
        );
    }
  );
}


/* ============================================================
   DÉMARRAGE
============================================================ */

function initMystroShop() {

  ensureAuthModal();

  setupNavigation();

  setupAuthButtons();

  setupSelectors();

  setupSearch();

  setupImagePreview();

  setupProductForm();

  setupWallet();

  setupChat();

  setupAssistant();

  setupGlobalUI();

  updateCartBadge();

  renderCart();

  applyLanguage(
    state.language
  );

  registerServiceWorker();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initMystroShop,
    {
      once: true
    }
  );

} else {

  initMystroShop();
}

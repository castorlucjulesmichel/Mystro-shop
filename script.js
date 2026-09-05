/* ============================================================
   MYSTRO-SHOP V4
   SCRIPT.JS COMPLET
   ------------------------------------------------------------
   Firebase Authentication
   Firestore
   Supabase Storage
   Produits avec photos
   Panier
   Multi-devises
   Multi-langues
   Profil
   Menu latéral
   Statistiques
   Graphiques
   Chat
   Assistant virtuel
   MonCash
   Commission Mystro-Shop : 10 %
   ============================================================ */


/* ============================================================
   1. IMPORTS FIREBASE
   ============================================================ */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";


import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ============================================================
   2. FIREBASE
   ============================================================ */

const firebaseConfig = {

  apiKey:
    "AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",

  authDomain:
    "mystroshop-eab92.firebaseapp.com",

  projectId:
    "mystroshop-eab92",

  storageBucket:
    "mystroshop-eab92.firebasestorage.app",

  messagingSenderId:
    "104073035061",

  appId:
    "1:104073035061:web:59d2779f2db7a8a3be207c",

  measurementId:
    "G-QTLV6VFLXQ"
};


const firebaseApp =
  initializeApp(firebaseConfig);


const auth =
  getAuth(firebaseApp);


const db =
  getFirestore(firebaseApp);


/* ============================================================
   3. SUPABASE
   ============================================================ */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";


const SUPABASE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/*
  Le script essayera ces buckets dans l'ordre.
*/

const SUPABASE_BUCKETS = [

  "products",

  "product-images",

  "images"

];


/* ============================================================
   4. MONCASH
   ============================================================ */

/*
  IMPORTANT :

  Remplacez uniquement la valeur ci-dessous
  lorsque vous avez l'URL exacte de votre
  Cloudflare Worker MonCash.

  Exemple :

  const MONCASH_WORKER_URL =
    "https://mystro-shop-api.nom.workers.dev";

  NE METTEZ JAMAIS LE CLIENT SECRET MONCASH ICI.
*/

const MONCASH_WORKER_URL = "";


/* ============================================================
   5. VARIABLES PRINCIPALES
   ============================================================ */

let currentUser = null;

let currentProfile = null;

let products = [];

let cart = [];

let selectedCurrency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let selectedLanguage =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";


const MYSTRO_COMMISSION_RATE =
  0.10;


/* ============================================================
   6. TAUX DE DEVISES
   ============================================================ */

/*
  Ces taux servent seulement à l'affichage.

  Ils ne doivent pas être utilisés pour
  calculer une transaction bancaire réelle.
*/

const currencyRates = {

  HTG: 1,

  USD: 132,

  EUR: 145,

  CAD: 97,

  GBP: 169,

  DOP: 2.25,

  XOF: 0.22

};


/* ============================================================
   7. OUTILS
   ============================================================ */

function $(selector) {

  return document.querySelector(
    selector
  );

}


function $all(selector) {

  return Array.from(
    document.querySelectorAll(
      selector
    )
  );

}


function safeNumber(
  value,
  fallback = 0
) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

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


function normalizeFileName(
  name = "image.jpg"
) {

  return String(name)

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )

    .toLowerCase();

}


/* ============================================================
   8. TOAST
   ============================================================ */

function showToast(
  message,
  type = "info"
) {

  let toast =
    document.getElementById(
      "mystroToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "mystroToast";


    Object.assign(
      toast.style,
      {

        position:
          "fixed",

        left:
          "50%",

        bottom:
          "95px",

        transform:
          "translateX(-50%)",

        zIndex:
          "99999999",

        maxWidth:
          "90%",

        padding:
          "15px 20px",

        borderRadius:
          "16px",

        color:
          "#ffffff",

        fontWeight:
          "800",

        textAlign:
          "center",

        boxShadow:
          "0 12px 35px rgba(0,0,0,.25)"

      }
    );


    document.body.appendChild(
      toast
    );

  }


  const colors = {

    success:
      "#15803d",

    error:
      "#b91c1c",

    warning:
      "#b45309",

    info:
      "#1d4ed8"

  };


  toast.style.background =
    colors[type] ||
    colors.info;


  toast.textContent =
    message;


  toast.style.display =
    "block";


  clearTimeout(
    window.__mystroToastTimer
  );


  window.__mystroToastTimer =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      4200
    );

}


/* ============================================================
   9. BOUTONS CHARGEMENT
   ============================================================ */

function setButtonLoading(
  button,
  loading,
  loadingText = "Chargement..."
) {

  if (!button) {

    return;

  }


  if (loading) {

    if (
      !button.dataset.originalText
    ) {

      button.dataset.originalText =
        button.textContent;

    }


    button.disabled =
      true;


    button.style.opacity =
      ".65";


    button.textContent =
      loadingText;

  }

  else {

    button.disabled =
      false;


    button.style.opacity =
      "1";


    if (
      button.dataset.originalText
    ) {

      button.textContent =
        button.dataset.originalText;

    }

  }

}


/* ============================================================
   10. TRADUCTIONS
   ============================================================ */

const translations = {


  /* ======================
     FRANÇAIS
     ====================== */

  fr: {

    authWelcome:
      "Achetez, vendez et développez votre activité.",

    login:
      "Se connecter",

    register:
      "S'inscrire",

    logout:
      "Se déconnecter",

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
      "Mon profil",

    help:
      "Aide",

    search:
      "Rechercher sur Mystro-Shop...",

    welcome:
      "Bienvenue sur Mystro-Shop",

    welcomeSubtitle:
      "Achetez et vendez facilement partout dans le monde.",

    discoverProducts:
      "Découvrir les produits",

    sellProduct:
      "Vendre un produit",

    popularProducts:
      "Produits populaires",

    productName:
      "Nom du produit",

    category:
      "Catégorie",

    productPhoto:
      "Photo du produit",

    description:
      "Description",

    addToCart:
      "Ajouter au panier",

    emptyCart:
      "Votre panier est vide.",

    quantity:
      "Quantité",

    remove:
      "Supprimer",

    password:
      "Mot de passe",

    forgotPassword:
      "Mot de passe oublié ?",

    alreadyAccount:
      "J'ai déjà un compte",

    name:
      "Nom",

    accountType:
      "Type de compte",

    balance:
      "Solde",

    buyer:
      "Acheteur",

    seller:
      "Vendeur",

    productPublished:
      "Produit publié avec succès.",

    publicationError:
      "Publication impossible.",

    processingPhoto:
      "Traitement de la photo...",

    choosePhoto:
      "Choisissez une photo du produit.",

    invalidImage:
      "Le fichier sélectionné n'est pas une image.",

    invalidPrice:
      "Entrez un prix valide.",

    invalidStock:
      "Le stock doit être au minimum 1.",

    enterProductName:
      "Entrez le nom du produit.",

    enterDescription:
      "Ajoutez une description.",

    loginRequired:
      "Connectez-vous pour continuer.",

    accountCreated:
      "Compte créé avec succès.",

    loginSuccess:
      "Connexion réussie.",

    logoutSuccess:
      "Déconnexion réussie.",

    emailExists:
      "Cette adresse email possède déjà un compte.",

    invalidCredentials:
      "Email ou mot de passe incorrect.",

    weakPassword:
      "Le mot de passe doit contenir au moins 6 caractères.",

    resetSent:
      "Email de réinitialisation envoyé.",

    noProducts:
      "Aucun produit disponible.",

    assistantHello:
      "Bonjour 👋 Comment puis-je vous aider sur Mystro-Shop ?",

    assistantProduct:
      "Pour publier un produit, ouvrez Vendre, remplissez le formulaire, choisissez une photo puis appuyez sur Publier le produit.",

    assistantCart:
      "Ajoutez un produit au panier puis ouvrez Panier pour vérifier votre commande.",

    assistantWallet:
      "Le portefeuille permet d'accéder aux dépôts, retraits et moyens de paiement.",

    assistantAccount:
      "Appuyez sur votre avatar ou sur Mon profil pour voir votre compte.",

    assistantLanguage:
      "Vous pouvez changer la langue avec le sélecteur situé en haut.",

    assistantCurrency:
      "Vous pouvez changer la devise avec le sélecteur de monnaie situé en haut.",

    assistantDefault:
      "Je peux vous aider avec votre compte, les produits, le panier, les devises, les langues, le portefeuille et les ventes."

  },


  /* ======================
     KREYÒL
     ====================== */

  ht: {

    authWelcome:
      "Achte, vann epi devlope aktivite ou.",

    login:
      "Konekte",

    register:
      "Enskri",

    logout:
      "Dekonekte",

    home:
      "Akèy",

    dashboard:
      "Tablo de bò",

    products:
      "Pwodwi",

    sell:
      "Vann",

    wallet:
      "Pòtfolyo",

    statistics:
      "Estatistik",

    clients:
      "Kliyan aktif",

    orders:
      "Kòmand",

    chat:
      "Chat",

    services:
      "Sèvis",

    profile:
      "Pwofil mwen",

    help:
      "Èd",

    search:
      "Chèche sou Mystro-Shop...",

    welcome:
      "Byenveni sou Mystro-Shop",

    welcomeSubtitle:
      "Achte epi vann fasil toupatou nan mond lan.",

    discoverProducts:
      "Dekouvri pwodwi yo",

    sellProduct:
      "Vann yon pwodwi",

    popularProducts:
      "Pwodwi popilè",

    productName:
      "Non pwodwi a",

    category:
      "Kategori",

    productPhoto:
      "Foto pwodwi a",

    description:
      "Deskripsyon",

    addToCart:
      "Ajoute nan panye",

    emptyCart:
      "Panye ou vid.",

    quantity:
      "Kantite",

    remove:
      "Retire",

    password:
      "Modpas",

    forgotPassword:
      "Ou bliye modpas la?",

    alreadyAccount:
      "Mwen deja gen yon kont",

    name:
      "Non",

    accountType:
      "Kalite kont",

    balance:
      "Balans",

    buyer:
      "Achtè",

    seller:
      "Vandè",

    productPublished:
      "Pwodwi a pibliye avèk siksè.",

    publicationError:
      "Piblikasyon an pa posib.",

    processingPhoto:
      "N ap prepare foto a...",

    choosePhoto:
      "Chwazi yon foto pwodwi a.",

    invalidImage:
      "Fichye sa a pa yon imaj.",

    invalidPrice:
      "Antre yon pri ki valab.",

    invalidStock:
      "Stock la dwe omwen 1.",

    enterProductName:
      "Antre non pwodwi a.",

    enterDescription:
      "Ajoute yon deskripsyon.",

    loginRequired:
      "Konekte pou kontinye.",

    accountCreated:
      "Kont lan kreye avèk siksè.",

    loginSuccess:
      "Koneksyon reyisi.",

    logoutSuccess:
      "Ou dekonekte avèk siksè.",

    emailExists:
      "Imel sa a deja gen yon kont.",

    invalidCredentials:
      "Imel oswa modpas la pa bon.",

    weakPassword:
      "Modpas la dwe gen omwen 6 karaktè.",

    resetSent:
      "Nou voye imel pou chanje modpas la.",

    noProducts:
      "Pa gen pwodwi disponib.",

    assistantHello:
      "Bonjou 👋 Kijan mwen ka ede ou sou Mystro-Shop?",

    assistantProduct:
      "Pou pibliye yon pwodwi, ale nan Vann, ranpli fòm nan, chwazi foto a epi peze Pibliye.",

    assistantCart:
      "Ajoute pwodwi a nan panye epi ouvri Panye pou verifye kòmand lan.",

    assistantWallet:
      "Nan Pòtfolyo ou jwenn depo, retrè ak mwayen peman.",

    assistantAccount:
      "Peze sou avatar ou oswa Pwofil mwen pou wè kont ou.",

    assistantLanguage:
      "Ou ka chanje lang lan avèk selektè ki anlè a.",

    assistantCurrency:
      "Ou ka chanje lajan an avèk selektè deviz ki anlè a.",

    assistantDefault:
      "Mwen ka ede ou ak kont, pwodwi, panye, deviz, lang, pòtfolyo ak vant."

  },


  /* ======================
     ESPAÑOL
     ====================== */

  es: {

    authWelcome:
      "Compra, vende y desarrolla tu actividad.",

    login:
      "Iniciar sesión",

    register:
      "Registrarse",

    logout:
      "Cerrar sesión",

    home:
      "Inicio",

    dashboard:
      "Panel de control",

    products:
      "Productos",

    sell:
      "Vender",

    wallet:
      "Billetera",

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
      "Mi perfil",

    help:
      "Ayuda",

    search:
      "Buscar en Mystro-Shop...",

    welcome:
      "Bienvenido a Mystro-Shop",

    welcomeSubtitle:
      "Compra y vende fácilmente en todo el mundo.",

    discoverProducts:
      "Descubrir productos",

    sellProduct:
      "Vender un producto",

    popularProducts:
      "Productos populares",

    productName:
      "Nombre del producto",

    category:
      "Categoría",

    productPhoto:
      "Foto del producto",

    description:
      "Descripción",

    addToCart:
      "Añadir al carrito",

    emptyCart:
      "Tu carrito está vacío.",

    quantity:
      "Cantidad",

    remove:
      "Eliminar",

    password:
      "Contraseña",

    forgotPassword:
      "¿Olvidaste tu contraseña?",

    alreadyAccount:
      "Ya tengo una cuenta",

    name:
      "Nombre",

    accountType:
      "Tipo de cuenta",

    balance:
      "Saldo",

    buyer:
      "Comprador",

    seller:
      "Vendedor",

    productPublished:
      "Producto publicado correctamente.",

    publicationError:
      "No se pudo publicar.",

    processingPhoto:
      "Procesando foto...",

    choosePhoto:
      "Selecciona una foto del producto.",

    invalidImage:
      "El archivo seleccionado no es una imagen.",

    invalidPrice:
      "Introduce un precio válido.",

    invalidStock:
      "El stock debe ser al menos 1.",

    enterProductName:
      "Introduce el nombre del producto.",

    enterDescription:
      "Añade una descripción.",

    loginRequired:
      "Inicia sesión para continuar.",

    accountCreated:
      "Cuenta creada correctamente.",

    loginSuccess:
      "Inicio de sesión correcto.",

    logoutSuccess:
      "Sesión cerrada correctamente.",

    emailExists:
      "Este correo ya tiene una cuenta.",

    invalidCredentials:
      "Correo o contraseña incorrectos.",

    weakPassword:
      "La contraseña debe contener al menos 6 caracteres.",

    resetSent:
      "Correo de recuperación enviado.",

    noProducts:
      "No hay productos disponibles.",

    assistantHello:
      "Hola 👋 ¿Cómo puedo ayudarte en Mystro-Shop?",

    assistantProduct:
      "Para publicar un producto abre Vender, completa el formulario, selecciona una foto y pulsa Publicar.",

    assistantCart:
      "Añade un producto al carrito y abre Carrito para revisar tu pedido.",

    assistantWallet:
      "La billetera permite acceder a depósitos, retiros y medios de pago.",

    assistantAccount:
      "Pulsa tu avatar o Mi perfil para ver tu cuenta.",

    assistantLanguage:
      "Puedes cambiar el idioma con el selector situado arriba.",

    assistantCurrency:
      "Puedes cambiar la moneda con el selector situado arriba.",

    assistantDefault:
      "Puedo ayudarte con tu cuenta, productos, carrito, monedas, idiomas, billetera y ventas."

  },


  /* ======================
     ENGLISH
     ====================== */

  en: {

    authWelcome:
      "Buy, sell and grow your business.",

    login:
      "Log in",

    register:
      "Sign up",

    logout:
      "Log out",

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

    statistics:
      "Statistics",

    clients:
      "Active customers",

    orders:
      "Orders",

    chat:
      "Chat",

    services:
      "Services",

    profile:
      "My profile",

    help:
      "Help",

    search:
      "Search Mystro-Shop...",

    welcome:
      "Welcome to Mystro-Shop",

    welcomeSubtitle:
      "Buy and sell easily around the world.",

    discoverProducts:
      "Discover products",

    sellProduct:
      "Sell a product",

    popularProducts:
      "Popular products",

    productName:
      "Product name",

    category:
      "Category",

    productPhoto:
      "Product photo",

    description:
      "Description",

    addToCart:
      "Add to cart",

    emptyCart:
      "Your cart is empty.",

    quantity:
      "Quantity",

    remove:
      "Remove",

    password:
      "Password",

    forgotPassword:
      "Forgot password?",

    alreadyAccount:
      "I already have an account",

    name:
      "Name",

    accountType:
      "Account type",

    balance:
      "Balance",

    buyer:
      "Buyer",

    seller:
      "Seller",

    productPublished:
      "Product published successfully.",

    publicationError:
      "Unable to publish product.",

    processingPhoto:
      "Processing photo...",

    choosePhoto:
      "Choose a product photo.",

    invalidImage:
      "The selected file is not an image.",

    invalidPrice:
      "Enter a valid price.",

    invalidStock:
      "Stock must be at least 1.",

    enterProductName:
      "Enter the product name.",

    enterDescription:
      "Add a description.",

    loginRequired:
      "Log in to continue.",

    accountCreated:
      "Account created successfully.",

    loginSuccess:
      "Login successful.",

    logoutSuccess:
      "Logged out successfully.",

    emailExists:
      "This email already has an account.",

    invalidCredentials:
      "Incorrect email or password.",

    weakPassword:
      "Password must contain at least 6 characters.",

    resetSent:
      "Password reset email sent.",

    noProducts:
      "No products available.",

    assistantHello:
      "Hello 👋 How can I help you on Mystro-Shop?",

    assistantProduct:
      "To publish a product, open Sell, complete the form, choose a photo and press Publish.",

    assistantCart:
      "Add a product to your cart and open Cart to review your order.",

    assistantWallet:
      "The wallet provides access to deposits, withdrawals and payment methods.",

    assistantAccount:
      "Tap your avatar or My profile to view your account.",

    assistantLanguage:
      "You can change the language using the selector at the top.",

    assistantCurrency:
      "You can change the currency using the selector at the top.",

    assistantDefault:
      "I can help with your account, products, cart, currencies, languages, wallet and sales."

  }

};


/* ============================================================
   11. FONCTION TRADUCTION
   ============================================================ */

function t(key) {

  return (

    translations[
      selectedLanguage
    ]?.[key]

    ||

    translations.fr[key]

    ||

    key

  );

}


/* ============================================================
   12. APPLIQUER LANGUE
   ============================================================ */

function applyLanguage() {

  document.documentElement.lang =
    selectedLanguage;


  $all(
    "[data-i18n]"
  )
  .forEach(
    element => {

      const key =
        element.dataset.i18n;


      const text =
        translations[
          selectedLanguage
        ]?.[key];


      if (
        text !==
        undefined
      ) {

        element.textContent =
          text;

      }

    }
  );


  $all(
    "[data-i18n-placeholder]"
  )
  .forEach(
    element => {

      const key =
        element.dataset
          .i18nPlaceholder;


      const text =
        translations[
          selectedLanguage
        ]?.[key];


      if (
        text !==
        undefined
      ) {

        element.placeholder =
          text;

      }

    }
  );


  renderProducts();

  renderCart();

  updateUserInterface();

}


/* ============================================================
   13. SÉLECTEUR LANGUE
   ============================================================ */

function setupLanguageSelector() {

  const selector =
    document.getElementById(
      "languageSelector"
    );


  if (!selector) {

    return;

  }


  selector.value =
    selectedLanguage;


  if (
    selector.dataset.ready ===
    "1"
  ) {

    return;

  }


  selector.dataset.ready =
    "1";


  selector.addEventListener(
    "change",
    () => {

      selectedLanguage =
        selector.value;


      localStorage.setItem(
        "mystroLanguage",
        selectedLanguage
      );


      applyLanguage();

    }
  );

}


/* ============================================================
   14. APPLICATION / AUTH SCREEN
   ============================================================ */

function showMainApp() {

  const mainApp =
    document.getElementById(
      "mainApp"
    );


  if (mainApp) {

    mainApp.style.display =
      "block";

  }

}


function hideMainApp() {

  const mainApp =
    document.getElementById(
      "mainApp"
    );


  if (mainApp) {

    mainApp.style.display =
      "none";

  }

}


function showWelcome() {

  const welcome =
    document.getElementById(
      "welcomePage"
    );


  if (welcome) {

    welcome.style.display =
      "flex";

  }


  hideMainApp();

}


function hideWelcome() {

  const welcome =
    document.getElementById(
      "welcomePage"
    );


  if (welcome) {

    welcome.style.display =
      "none";

  }


  showMainApp();

}


/* ============================================================
   15. MODALE AUTH
   ============================================================ */

function removeAuthModal() {

  document
    .getElementById(
      "mystroAuthModal"
    )
    ?.remove();

}


/* ============================================================
   16. STYLES AUTH
   ============================================================ */

function installAuthStyles() {

  if (
    document.getElementById(
      "mystroAuthStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "mystroAuthStyles";


  style.textContent = `

    .mystro-auth-overlay {

      position: fixed;

      inset: 0;

      z-index: 999999;

      display: flex;

      justify-content: center;

      align-items: center;

      padding: 20px;

      background:
        rgba(15,23,42,.78);

    }


    .mystro-auth-box {

      position: relative;

      width: 100%;

      max-width: 430px;

      padding: 28px 24px;

      border-radius: 25px;

      background: #ffffff;

      box-shadow:
        0 30px 80px
        rgba(0,0,0,.3);

    }


    .mystro-auth-box h2 {

      margin:
        0 0 20px;

    }


    .mystro-auth-box label {

      display: block;

      margin:
        15px 0 7px;

      font-weight: 800;

    }


    .mystro-auth-box input {

      width: 100%;

      padding: 14px;

      box-sizing: border-box;

      border:
        1px solid #d1d5db;

      border-radius: 14px;

      font-size: 16px;

    }


    .mystro-auth-main {

      width: 100%;

      margin-top: 20px;

      padding: 15px;

      border: 0;

      border-radius: 14px;

      background: #3159db;

      color: #ffffff;

      font-weight: 800;

      font-size: 16px;

    }


    .mystro-auth-link {

      width: 100%;

      margin-top: 8px;

      padding: 12px;

      border: 0;

      background: transparent;

      color: #2563eb;

      font-weight: 700;

    }


    .mystro-auth-close {

      position: absolute;

      top: 12px;

      right: 16px;

      border: 0;

      background: transparent;

      font-size: 30px;

    }

  `;


  document.head.appendChild(
    style
  );

}


/* ============================================================
   17. CONNEXION
   ============================================================ */

function openLoginModal() {

  removeAuthModal();

  installAuthStyles();


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "mystroAuthModal";


  modal.className =
    "mystro-auth-overlay";


  modal.innerHTML = `

    <div class="mystro-auth-box">

      <button
        id="closeAuthModal"
        type="button"
        class="mystro-auth-close"
      >
        ×
      </button>


      <h2>
        ${escapeHTML(
          t("login")
        )}
      </h2>


      <form id="loginForm">


        <label>
          Email
        </label>


        <input
          id="loginEmail"
          type="email"
          autocomplete="email"
          required
        >


        <label>
          ${escapeHTML(
            t("password")
          )}
        </label>


        <input
          id="loginPassword"
          type="password"
          autocomplete="current-password"
          required
        >


        <button
          id="loginSubmitBtn"
          class="mystro-auth-main"
          type="submit"
        >
          ${escapeHTML(
            t("login")
          )}
        </button>


      </form>


      <button
        type="button"
        id="forgotPasswordBtn"
        class="mystro-auth-link"
      >
        ${escapeHTML(
          t("forgotPassword")
        )}
      </button>


      <button
        type="button"
        id="openRegisterBtn"
        class="mystro-auth-link"
      >
        ${escapeHTML(
          t("register")
        )}
      </button>


    </div>
  `;


  document.body.appendChild(
    modal
  );


  $("#closeAuthModal")
    ?.addEventListener(
      "click",
      removeAuthModal
    );


  $("#openRegisterBtn")
    ?.addEventListener(
      "click",
      openRegisterModal
    );


  $("#forgotPasswordBtn")
    ?.addEventListener(
      "click",
      async () => {

        const email =
          $("#loginEmail")
            ?.value
            ?.trim();


        if (!email) {

          showToast(
            "Email requis.",
            "warning"
          );

          return;

        }


        try {

          await sendPasswordResetEmail(
            auth,
            email
          );


          showToast(
            t("resetSent"),
            "success"
          );

        }

        catch (error) {

          console.error(
            error
          );


          showToast(
            error.message,
            "error"
          );

        }

      }
    );


  $("#loginForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        event.stopPropagation();


        const email =
          $("#loginEmail")
            ?.value
            ?.trim();


        const password =
          $("#loginPassword")
            ?.value || "";


        const button =
          $("#loginSubmitBtn");


        setButtonLoading(
          button,
          true,
          "..."
        );


        try {

          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );


          showToast(
            t("loginSuccess"),
            "success"
          );


          removeAuthModal();

        }

        catch (error) {

          console.error(
            "Connexion Firebase:",
            error
          );


          let message =
            error.message;


          if (
            error.code ===
              "auth/invalid-credential" ||

            error.code ===
              "auth/wrong-password" ||

            error.code ===
              "auth/user-not-found"
          ) {

            message =
              t(
                "invalidCredentials"
              );

          }


          showToast(
            message,
            "error"
          );

        }

        finally {

          setButtonLoading(
            button,
            false
          );

        }

      }
    );

}


/* ============================================================
   18. INSCRIPTION
   ============================================================ */

function openRegisterModal() {

  removeAuthModal();

  installAuthStyles();


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "mystroAuthModal";


  modal.className =
    "mystro-auth-overlay";


  modal.innerHTML = `

    <div class="mystro-auth-box">

      <button
        id="closeAuthModal"
        type="button"
        class="mystro-auth-close"
      >
        ×
      </button>


      <h2>
        ${escapeHTML(
          t("register")
        )}
      </h2>


      <form id="registerForm">


        <label>
          ${escapeHTML(
            t("name")
          )}
        </label>


        <input
          id="registerName"
          type="text"
          autocomplete="name"
          required
        >


        <label>
          Email
        </label>


        <input
          id="registerEmail"
          type="email"
          autocomplete="email"
          required
        >


        <label>
          ${escapeHTML(
            t("password")
          )}
        </label>


        <input
          id="registerPassword"
          type="password"
          minlength="6"
          autocomplete="new-password"
          required
        >


        <button
          id="registerSubmitBtn"
          type="submit"
          class="mystro-auth-main"
        >
          ${escapeHTML(
            t("register")
          )}
        </button>


      </form>


      <button
        id="openLoginBtn"
        type="button"
        class="mystro-auth-link"
      >
        ${escapeHTML(
          t("alreadyAccount")
        )}
      </button>


    </div>
  `;


  document.body.appendChild(
    modal
  );


  $("#closeAuthModal")
    ?.addEventListener(
      "click",
      removeAuthModal
    );


  $("#openLoginBtn")
    ?.addEventListener(
      "click",
      openLoginModal
    );


  $("#registerForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        event.stopPropagation();


        const name =
          $("#registerName")
            ?.value
            ?.trim();


        const email =
          $("#registerEmail")
            ?.value
            ?.trim();


        const password =
          $("#registerPassword")
            ?.value || "";


        const button =
          $("#registerSubmitBtn");


        if (
          !name ||
          !email ||
          password.length < 6
        ) {

          showToast(
            t("weakPassword"),
            "warning"
          );

          return;

        }


        setButtonLoading(
          button,
          true,
          "..."
        );


        try {

          const credential =
            await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );


          await updateProfile(
            credential.user,
            {
              displayName:
                name
            }
          );


          /*
            Même si le profil Firestore échoue,
            le compte Firebase est bien créé.
          */

          try {

            await setDoc(
              doc(
                db,
                "users",
                credential.user.uid
              ),
              {

                uid:
                  credential.user.uid,

                name,

                email,

                role:
                  "buyer",

                balance:
                  0,

                createdAt:
                  serverTimestamp()

              },
              {

                merge:
                  true

              }
            );

          }

          catch (profileError) {

            console.error(
              "Profil Firestore:",
              profileError
            );

          }


          showToast(
            t("accountCreated"),
            "success"
          );


          removeAuthModal();

        }

        catch (error) {

          console.error(
            "Inscription Firebase:",
            error
          );


          let message =
            error.message;


          if (
            error.code ===
            "auth/email-already-in-use"
          ) {

            message =
              t("emailExists");

          }


          if (
            error.code ===
            "auth/weak-password"
          ) {

            message =
              t("weakPassword");

          }


          showToast(
            message,
            "error"
          );

        }

        finally {

          setButtonLoading(
            button,
            false
          );

        }

      }
    );

}


/* ============================================================
   19. BOUTONS AUTH ACCUEIL
   ============================================================ */

function setupAuthButtons() {

  const loginButton =
    document.getElementById(
      "welcomeLoginBtn"
    );


  const registerButton =
    document.getElementById(
      "welcomeRegisterBtn"
    );


  if (
    loginButton &&
    loginButton.dataset.ready !==
      "1"
  ) {

    loginButton.dataset.ready =
      "1";


    loginButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        openLoginModal();

      }
    );

  }


  if (
    registerButton &&
    registerButton.dataset.ready !==
      "1"
  ) {

    registerButton.dataset.ready =
      "1";


    registerButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        openRegisterModal();

      }
    );

  }

}


/* ============================================================
   20. PROFIL FIRESTORE
   ============================================================ */

async function loadUserProfile(
  user
) {

  if (!user) {

    return;

  }


  try {

    const profileRef =
      doc(
        db,
        "users",
        user.uid
      );


    const snapshot =
      await getDoc(
        profileRef
      );


    if (
      snapshot.exists()
    ) {

      currentProfile =
        snapshot.data();

    }

    else {

      currentProfile = {

        uid:
          user.uid,

        name:
          user.displayName ||
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


      try {

        await setDoc(
          profileRef,
          {

            ...currentProfile,

            createdAt:
              serverTimestamp()

          },
          {

            merge:
              true

          }
        );

      }

      catch (error) {

        console.error(
          "Création profil:",
          error
        );

      }

    }

  }

  catch (error) {

    console.error(
      "Lecture profil:",
      error
    );


    currentProfile = {

      uid:
        user.uid,

      name:
        user.displayName ||
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


  updateUserInterface();

}


/* ============================================================
   21. INTERFACE UTILISATEUR
   ============================================================ */

function getCurrentUserName() {

  return (

    currentProfile?.name

    ||

    currentUser?.displayName

    ||

    currentUser?.email
      ?.split("@")[0]

    ||

    "Mystro-Shop"

  );

}


function getInitials(
  name
) {

  return String(name)

    .split(" ")

    .filter(Boolean)

    .map(
      word =>
        word.charAt(0)
    )

    .join("")

    .substring(0, 2)

    .toUpperCase()

    ||

    "MS";

}


function updateUserInterface() {

  if (!currentUser) {

    return;

  }


  const name =
    getCurrentUserName();


  const initials =
    getInitials(name);


  const role =
    currentProfile?.role ||
    "buyer";


  const roleText =
    role === "seller"
      ? t("seller")
      : t("buyer");


  const headerAvatar =
    document.getElementById(
      "userInitials"
    );


  const drawerAvatar =
    document.getElementById(
      "drawerUserInitials"
    );


  const drawerName =
    document.getElementById(
      "drawerUserName"
    );


  const drawerRole =
    document.getElementById(
      "drawerUserRole"
    );


  if (headerAvatar) {

    headerAvatar.textContent =
      initials;

  }


  if (drawerAvatar) {

    drawerAvatar.textContent =
      initials;

  }


  if (drawerName) {

    drawerName.textContent =
      name;

  }


  if (drawerRole) {

    drawerRole.textContent =
      role === "seller"
        ? roleText
        : `${t("buyer")} & ${t("seller")}`;

  }


  const balance =
    safeNumber(
      currentProfile?.balance,
      0
    );


  const walletBalance =
    document.getElementById(
      "walletBalance"
    );


  if (walletBalance) {

    walletBalance.textContent =
      formatMoney(
        convertPrice(
          balance,
          "HTG",
          selectedCurrency
        ),
        selectedCurrency
      );

  }


  const profileName =
    document.getElementById(
      "profileName"
    );


  const profileEmail =
    document.getElementById(
      "profileEmail"
    );


  const profileRole =
    document.getElementById(
      "profileRole"
    );


  const profileBalance =
    document.getElementById(
      "profileBalance"
    );


  if (profileName) {

    profileName.textContent =
      name;

  }


  if (profileEmail) {

    profileEmail.textContent =
      currentUser.email || "—";

  }


  if (profileRole) {

    profileRole.textContent =
      roleText;

  }


  if (profileBalance) {

    profileBalance.textContent =
      formatMoney(
        balance,
        "HTG"
      );

  }

}


/* ============================================================
   22. MODALE PROFIL
   ============================================================ */

function openProfileModal() {

  if (!currentUser) {

    openLoginModal();

    return;

  }


  updateUserInterface();


  document
    .getElementById(
      "profileModal"
    )
    ?.classList.add(
      "open"
    );

}


function closeProfileModal() {

  document
    .getElementById(
      "profileModal"
    )
    ?.classList.remove(
      "open"
    );

}


function setupProfileButtons() {

  const buttons = [

    document.getElementById(
      "profileBtn"
    ),

    document.getElementById(
      "drawerProfileBtn"
    ),

    document.getElementById(
      "drawerProfileMenuBtn"
    )

  ].filter(Boolean);


  buttons.forEach(
    button => {

      if (
        button.dataset.profileReady ===
        "1"
      ) {

        return;

      }


      button.dataset.profileReady =
        "1";


      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          closeDrawer();

          openProfileModal();

        }
      );

    }
  );


  const closeButton =
    document.getElementById(
      "closeProfileModalBtn"
    );


  if (
    closeButton &&
    closeButton.dataset.ready !==
      "1"
  ) {

    closeButton.dataset.ready =
      "1";


    closeButton.addEventListener(
      "click",
      closeProfileModal
    );

  }


  const profileLogout =
    document.getElementById(
      "profileLogoutBtn"
    );


  if (
    profileLogout &&
    profileLogout.dataset.ready !==
      "1"
  ) {

    profileLogout.dataset.ready =
      "1";


    profileLogout.addEventListener(
      "click",
      async () => {

        await logoutUser();

        closeProfileModal();

      }
    );

  }

}


/* ============================================================
   23. DÉCONNEXION
   ============================================================ */

async function logoutUser() {

  try {

    await signOut(
      auth
    );


    showToast(
      t("logoutSuccess"),
      "success"
    );

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      error.message,
      "error"
    );

  }

}


function setupLogoutButton() {

  const button =
    document.getElementById(
      "logoutBtn"
    );


  if (
    !button ||
    button.dataset.ready ===
      "1"
  ) {

    return;

  }


  button.dataset.ready =
    "1";


  button.addEventListener(
    "click",
    async event => {

      event.preventDefault();

      await logoutUser();

    }
  );

}


/* ============================================================
   24. MENU LATÉRAL
   ============================================================ */

/*
  Votre dernier index.html possède déjà un
  petit script qui ouvre le menu.

  Les fonctions ci-dessous servent aussi
  au script principal, notamment quand on
  change de page.
*/

function openDrawer() {

  const menu =
    document.getElementById(
      "mobileNav"
    );


  const overlay =
    document.getElementById(
      "menuOverlay"
    );


  menu?.classList.add(
    "open"
  );


  overlay?.classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";

}


function closeDrawer() {

  const menu =
    document.getElementById(
      "mobileNav"
    );


  const overlay =
    document.getElementById(
      "menuOverlay"
    );


  menu?.classList.remove(
    "open"
  );


  overlay?.classList.remove(
    "open"
  );


  document.body.style.overflow =
    "";

}


/* ============================================================
   25. NAVIGATION
   ============================================================ */

function openPage(
  pageName
) {

  $all(
    ".app-page"
  )
  .forEach(
    page => {

      page.style.display =
        "none";


      page.classList.remove(
        "active-page"
      );

    }
  );


  const target =
    document.getElementById(
      `${pageName}Page`
    );


  if (target) {

    target.style.display =
      "block";


    target.classList.add(
      "active-page"
    );

  }


  $all(
    ".bottom-nav-item"
  )
  .forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.page ===
          pageName
      );

    }
  );


  $all(
    ".drawer-menu-item"
  )
  .forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.page ===
          pageName
      );

    }
  );


  closeDrawer();


  if (
    pageName ===
    "statistics"
  ) {

    setTimeout(
      renderCharts,
      100
    );

  }


  if (
    pageName ===
    "dashboard"
  ) {

    setTimeout(
      renderCharts,
      100
    );

  }

}


function setupNavigation() {

  $all(
    "[data-page]"
  )
  .forEach(
    button => {

      if (
        button.dataset.pageReady ===
        "1"
      ) {

        return;

      }


      button.dataset.pageReady =
        "1";


      button.addEventListener(
        "click",
        event => {

          event.preventDefault();


          const pageName =
            button.dataset.page;


          if (pageName) {

            openPage(
              pageName
            );

          }

        }
      );

    }
  );

}


/* ============================================================
   26. VALIDATION IMAGE
   ============================================================ */

function validateImage(
  file
) {

  if (!file) {

    throw new Error(
      t("choosePhoto")
    );

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      t("invalidImage")
    );

  }


  if (
    file.size >
    12 * 1024 * 1024
  ) {

    throw new Error(
      "Photo trop volumineuse. Maximum 12 Mo."
    );

  }

}


/* ============================================================
   27. COMPRESSION IMAGE
   ============================================================ */

function compressImage(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onerror =
        () => {

          reject(
            new Error(
              "Impossible de lire la photo."
            )
          );

        };


      reader.onload =
        event => {

          const image =
            new Image();


          image.onerror =
            () => {

              reject(
                new Error(
                  "Photo invalide."
                )
              );

            };


          image.onload =
            () => {

              let width =
                image.width;


              let height =
                image.height;


              const maximum =
                900;


              if (
                width > maximum ||
                height > maximum
              ) {

                const ratio =
                  Math.min(
                    maximum / width,
                    maximum / height
                  );


                width =
                  Math.round(
                    width * ratio
                  );


                height =
                  Math.round(
                    height * ratio
                  );

              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const context =
                canvas.getContext(
                  "2d"
                );


              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );


              let quality =
                0.75;


              let dataUrl =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );


              while (
                dataUrl.length >
                  650000 &&
                quality >
                  0.30
              ) {

                quality -=
                  0.08;


                dataUrl =
                  canvas.toDataURL(
                    "image/jpeg",
                    quality
                  );

              }


              if (
                dataUrl.length >
                850000
              ) {

                reject(
                  new Error(
                    "La photo reste trop lourde. Choisissez une photo plus petite."
                  )
                );


                return;

              }


              resolve(
                dataUrl
              );

            };


          image.src =
            event.target.result;

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* ============================================================
   28. UPLOAD SUPABASE
   ============================================================ */

async function uploadImageToSupabase(
  file,
  userId
) {

  const filename =
    `${Date.now()}_${normalizeFileName(
      file.name
    )}`;


  const filePath =
    `${userId}/${filename}`;


  let lastError =
    null;


  for (
    const bucket
    of SUPABASE_BUCKETS
  ) {

    try {

      const {
        data,
        error
      } =
        await supabase
          .storage
          .from(bucket)
          .upload(
            filePath,
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

        lastError =
          error;


        console.warn(
          `Supabase ${bucket}:`,
          error
        );


        continue;

      }


      const {
        data: publicURL
      } =
        supabase
          .storage
          .from(bucket)
          .getPublicUrl(
            data.path
          );


      if (
        publicURL?.publicUrl
      ) {

        return {

          success:
            true,

          imageUrl:
            publicURL.publicUrl,

          storage:
            "supabase",

          bucket,

          path:
            data.path

        };

      }

    }

    catch (error) {

      lastError =
        error;


      console.warn(
        "Supabase Failed to fetch:",
        error
      );

    }

  }


  return {

    success:
      false,

    error:
      lastError

  };

}


/* ============================================================
   29. PRÉPARER PHOTO
   ============================================================ */

async function prepareProductImage(
  file,
  userId
) {

  validateImage(
    file
  );


  /*
    1. Supabase
  */

  try {

    const result =
      await uploadImageToSupabase(
        file,
        userId
      );


    if (
      result.success
    ) {

      return result;

    }

  }

  catch (error) {

    console.warn(
      "Supabase indisponible:",
      error
    );

  }


  /*
    2. Secours :
       compression dans Firestore.

    À terme, Supabase doit rester
    la solution principale.
  */

  showToast(
    "Compression de la photo...",
    "info"
  );


  const dataUrl =
    await compressImage(
      file
    );


  return {

    success:
      true,

    imageUrl:
      dataUrl,

    storage:
      "firestore-data-url",

    bucket:
      null,

    path:
      null

  };

}


/* ============================================================
   30. APERÇU PHOTO
   ============================================================ */

function setupImagePreview() {

  const input =
    document.getElementById(
      "productImage"
    );


  if (
    !input ||
    input.dataset.ready ===
      "1"
  ) {

    return;

  }


  input.dataset.ready =
    "1";


  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];


      const preview =
        document.getElementById(
          "productImagePreview"
        );


      if (
        !file ||
        !preview
      ) {

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          t("invalidImage"),
          "warning"
        );


        input.value =
          "";


        preview.innerHTML =
          "";


        return;

      }


      const imageURL =
        URL.createObjectURL(
          file
        );


      preview.innerHTML = `

        <img

          src="${imageURL}"

          alt="Aperçu"

          style="
            width:100%;
            max-height:300px;
            object-fit:cover;
            margin-bottom:20px;
            border-radius:20px;
          "

        >

      `;

    }
  );

}


/* ============================================================
   31. COMMISSION
   ============================================================ */

function calculateCommission(
  price
) {

  const total =
    safeNumber(price);


  const commission =
    Number(
      (
        total *
        MYSTRO_COMMISSION_RATE
      )
      .toFixed(2)
    );


  const sellerAmount =
    Number(
      (
        total -
        commission
      )
      .toFixed(2)
    );


  return {

    total,

    commission,

    sellerAmount,

    commissionRate:
      MYSTRO_COMMISSION_RATE

  };

}


/* ============================================================
   32. PUBLIER PRODUIT
   ============================================================ */

async function publishProduct() {

  if (!currentUser) {

    showToast(
      t("loginRequired"),
      "warning"
    );


    openLoginModal();


    return;

  }


  const name =
    $("#productName")
      ?.value
      ?.trim();


  const category =
    $("#productCategory")
      ?.value ||
    "Autres";


  const currency =
    $("#productCurrency")
      ?.value ||
    "HTG";


  const price =
    safeNumber(
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
      ?.trim();


  const file =
    $("#productImage")
      ?.files?.[0];


  const button =
    $("#publishProductBtn");


  if (!name) {

    showToast(
      t("enterProductName"),
      "warning"
    );


    return;

  }


  if (
    price <= 0
  ) {

    showToast(
      t("invalidPrice"),
      "warning"
    );


    return;

  }


  if (
    !Number.isInteger(
      stock
    ) ||
    stock < 1
  ) {

    showToast(
      t("invalidStock"),
      "warning"
    );


    return;

  }


  if (!file) {

    showToast(
      t("choosePhoto"),
      "warning"
    );


    return;

  }


  if (!description) {

    showToast(
      t("enterDescription"),
      "warning"
    );


    return;

  }


  setButtonLoading(
    button,
    true,
    "Publication..."
  );


  try {

    showToast(
      t("processingPhoto"),
      "info"
    );


    const image =
      await prepareProductImage(
        file,
        currentUser.uid
      );


    const financial =
      calculateCommission(
        price
      );


    const productData = {

      name,

      title:
        name,

      category,

      currency,

      price,

      stock,

      description,

      imageUrl:
        image.imageUrl,

      imageStorage:
        image.storage,

      imageBucket:
        image.bucket,

      imagePath:
        image.path,

      sellerId:
        currentUser.uid,

      sellerEmail:
        currentUser.email || "",

      sellerName:
        getCurrentUserName(),

      status:
        "active",

      sold:
        0,

      views:
        0,

      commissionRate:
        0.10,

      platformCommission:
        financial.commission,

      sellerAmount:
        financial.sellerAmount,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    await addDoc(
      collection(
        db,
        "products"
      ),
      productData
    );


    showToast(
      t("productPublished"),
      "success"
    );


    $("#productForm")
      ?.reset();


    if (
      $("#productStock")
    ) {

      $("#productStock").value =
        "1";

    }


    if (
      $("#productImagePreview")
    ) {

      $("#productImagePreview")
        .innerHTML =
        "";

    }


    await loadProducts();


    openPage(
      "home"
    );

  }

  catch (error) {

    console.error(
      "Publication produit:",
      error
    );


    showToast(
      `${t("publicationError")} ${error.message || ""}`,
      "error"
    );

  }

  finally {

    setButtonLoading(
      button,
      false
    );

  }

}


/* ============================================================
   33. FORMULAIRE PRODUIT
   ============================================================ */

function setupProductForm() {

  const form =
    document.getElementById(
      "productForm"
    );


  if (
    !form ||
    form.dataset.ready ===
      "1"
  ) {

    return;

  }


  form.dataset.ready =
    "1";


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      event.stopPropagation();


      await publishProduct();

    }
  );

}


/* ============================================================
   34. CHARGEMENT PRODUITS
   ============================================================ */

async function loadProducts() {

  try {

    let snapshot;


    try {

      snapshot =
        await getDocs(
          query(
            collection(
              db,
              "products"
            ),
            orderBy(
              "createdAt",
              "desc"
            )
          )
        );

    }

    catch {

      snapshot =
        await getDocs(
          collection(
            db,
            "products"
          )
        );

    }


    products =
      snapshot.docs.map(
        snapshotDoc => ({

          id:
            snapshotDoc.id,

          ...snapshotDoc.data()

        })
      );


    renderProducts();

    updateStatistics();

  }

  catch (error) {

    console.error(
      "Chargement produits:",
      error
    );

  }

}


/* ============================================================
   35. CONVERSION DEVISES
   ============================================================ */

function convertPrice(
  amount,
  fromCurrency,
  toCurrency
) {

  amount =
    safeNumber(
      amount
    );


  if (
    fromCurrency ===
    toCurrency
  ) {

    return amount;

  }


  const fromRate =
    currencyRates[
      fromCurrency
    ];


  const toRate =
    currencyRates[
      toCurrency
    ];


  if (
    !fromRate ||
    !toRate
  ) {

    return amount;

  }


  const inHTG =
    amount *
    fromRate;


  return (
    inHTG /
    toRate
  );

}


/* ============================================================
   36. FORMAT MONNAIE
   ============================================================ */

function formatMoney(
  amount,
  currency
) {

  try {

    let locale =
      "fr-FR";


    if (
      selectedLanguage ===
      "en"
    ) {

      locale =
        "en-US";

    }


    if (
      selectedLanguage ===
      "es"
    ) {

      locale =
        "es-ES";

    }


    return new Intl.NumberFormat(
      locale,
      {

        style:
          "currency",

        currency,

        maximumFractionDigits:
          2

      }
    )
    .format(
      safeNumber(amount)
    );

  }

  catch {

    return (
      safeNumber(
        amount
      )
      .toFixed(2)
      +
      " "
      +
      currency
    );

  }

}


/* ============================================================
   37. AFFICHER PRODUITS
   ============================================================ */

function renderProducts() {

  const containers = [

    document.getElementById(
      "productsContainer"
    ),

    document.getElementById(
      "productsGrid"
    )

  ]
  .filter(Boolean);


  if (
    containers.length ===
    0
  ) {

    return;

  }


  const activeProducts =
    products.filter(
      product =>
        product.status !==
        "deleted"
    );


  let html;


  if (
    activeProducts.length ===
    0
  ) {

    html = `

      <div class="content-card">

        🛍️

        <p>
          ${escapeHTML(
            t("noProducts")
          )}
        </p>

      </div>

    `;

  }

  else {

    html =
      activeProducts.map(
        product => {


          const convertedPrice =
            convertPrice(
              safeNumber(
                product.price
              ),
              product.currency ||
                "HTG",
              selectedCurrency
            );


          const image =
            product.imageUrl ||
            "";


          return `

            <article
              class="product-card"
              data-product-id="${escapeHTML(product.id)}"
            >


              ${
                image

                  ? `

                    <img
                      src="${escapeHTML(image)}"
                      class="product-image"
                      alt="${escapeHTML(product.name || "Produit")}"
                      loading="lazy"
                    >

                  `

                  : `

                    <div
                      class="product-image"
                      style="
                        display:flex;
                        justify-content:center;
                        align-items:center;
                        font-size:70px;
                      "
                    >
                      🛍️
                    </div>

                  `
              }


              <div class="product-info">


                <small>

                  ${escapeHTML(
                    product.category ||
                    "Autres"
                  )}

                </small>


                <h3>

                  ${escapeHTML(
                    product.name ||
                    product.title ||
                    "Produit"
                  )}

                </h3>


                <strong>

                  ${formatMoney(
                    convertedPrice,
                    selectedCurrency
                  )}

                </strong>


                <p>

                  Stock :
                  ${safeNumber(
                    product.stock
                  )}

                </p>


                <button

                  type="button"

                  class="primary-btn"

                  style="width:100%"

                  data-add-cart="${escapeHTML(product.id)}"

                >

                  ${escapeHTML(
                    t("addToCart")
                  )}

                </button>


              </div>


            </article>

          `;

        }
      )
      .join("");

  }


  containers.forEach(
    container => {

      container.innerHTML =
        html;

    }
  );


  setupCartProductButtons();

  filterProducts();

}


/* ============================================================
   38. RECHERCHE
   ============================================================ */

function filterProducts() {

  const text =
    $("#searchInput")
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    "";


  $all(
    ".product-card"
  )
  .forEach(
    card => {

      const content =
        card.textContent
          .toLowerCase();


      card.style.display =
        content.includes(
          text
        )
          ? ""
          : "none";

    }
  );

}


function setupSearch() {

  const input =
    $("#searchInput");


  if (
    !input ||
    input.dataset.ready ===
      "1"
  ) {

    return;

  }


  input.dataset.ready =
    "1";


  input.addEventListener(
    "input",
    filterProducts
  );

}


/* ============================================================
   39. PANIER
   ============================================================ */

function loadCart() {

  try {

    cart =
      JSON.parse(
        localStorage.getItem(
          "mystroCart"
        ) || "[]"
      );

  }

  catch {

    cart =
      [];

  }


  renderCart();

}


function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(
      cart
    )
  );


  renderCart();

}


/* ============================================================
   40. AJOUTER AU PANIER
   ============================================================ */

function addToCart(
  productId
) {

  const product =
    products.find(
      item =>
        item.id ===
        productId
    );


  if (!product) {

    showToast(
      "Produit introuvable.",
      "error"
    );


    return;

  }


  const existing =
    cart.find(
      item =>
        item.id ===
        productId
    );


  if (existing) {

    existing.quantity +=
      1;

  }

  else {

    cart.push(
      {

        id:
          product.id,

        name:
          product.name ||
          product.title,

        price:
          safeNumber(
            product.price
          ),

        currency:
          product.currency ||
          "HTG",

        imageUrl:
          product.imageUrl ||
          "",

        sellerId:
          product.sellerId ||
          "",

        quantity:
          1

      }
    );

  }


  saveCart();


  showToast(
    t("addToCart"),
    "success"
  );

}


/* ============================================================
   41. BOUTONS PRODUITS PANIER
   ============================================================ */

function setupCartProductButtons() {

  $all(
    "[data-add-cart]"
  )
  .forEach(
    button => {

      if (
        button.dataset.ready ===
        "1"
      ) {

        return;

      }


      button.dataset.ready =
        "1";


      button.addEventListener(
        "click",
        () => {

          addToCart(
            button.dataset
              .addCart
          );

        }
      );

    }
  );

}


/* ============================================================
   42. MODIFIER PANIER
   ============================================================ */

function removeCartItem(
  id
) {

  cart =
    cart.filter(
      item =>
        item.id !== id
    );


  saveCart();

}


function changeCartQuantity(
  id,
  difference
) {

  const item =
    cart.find(
      product =>
        product.id === id
    );


  if (!item) {

    return;

  }


  item.quantity +=
    difference;


  if (
    item.quantity <=
    0
  ) {

    removeCartItem(
      id
    );


    return;

  }


  saveCart();

}


/* ============================================================
   43. TOTAL PANIER
   ============================================================ */

function getCartTotal() {

  return cart.reduce(
    (
      total,
      item
    ) => {


      const converted =
        convertPrice(
          item.price,
          item.currency,
          selectedCurrency
        );


      return (
        total +
        converted *
        safeNumber(
          item.quantity,
          1
        )
      );

    },
    0
  );

}


/* ============================================================
   44. AFFICHER PANIER
   ============================================================ */

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );


  const count =
    cart.reduce(
      (
        total,
        item
      ) =>
        total +
        safeNumber(
          item.quantity
        ),
      0
    );


  const countElement =
    document.getElementById(
      "cartCount"
    );


  if (countElement) {

    countElement.textContent =
      count;

  }


  if (!container) {

    return;

  }


  if (
    cart.length ===
    0
  ) {

    container.innerHTML = `

      <div class="content-card">

        🛒

        ${escapeHTML(
          t("emptyCart")
        )}

      </div>

    `;


    updateCartTotals();


    return;

  }


  container.innerHTML =
    cart.map(
      item => {


        const converted =
          convertPrice(
            item.price,
            item.currency,
            selectedCurrency
          );


        return `

          <div
            class="product-card"
            style="margin-bottom:16px"
          >


            ${
              item.imageUrl

                ? `

                  <img

                    class="product-image"

                    src="${escapeHTML(item.imageUrl)}"

                    alt="${escapeHTML(item.name)}"

                  >

                `

                : ""
            }


            <div class="product-info">


              <h3>

                ${escapeHTML(
                  item.name
                )}

              </h3>


              <strong>

                ${formatMoney(
                  converted,
                  selectedCurrency
                )}

              </strong>


              <p>

                ${escapeHTML(
                  t("quantity")
                )}
                :
                ${item.quantity}

              </p>


              <div
                style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                "
              >


                <button
                  type="button"
                  data-cart-minus="${escapeHTML(item.id)}"
                >
                  −
                </button>


                <button
                  type="button"
                  data-cart-plus="${escapeHTML(item.id)}"
                >
                  +
                </button>


                <button
                  type="button"
                  data-cart-remove="${escapeHTML(item.id)}"
                >
                  ${escapeHTML(
                    t("remove")
                  )}
                </button>


              </div>


            </div>


          </div>

        `;

      }
    )
    .join("");


  $all(
    "[data-cart-minus]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          changeCartQuantity(
            button.dataset
              .cartMinus,
            -1
          );

        }
      );

    }
  );


  $all(
    "[data-cart-plus]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          changeCartQuantity(
            button.dataset
              .cartPlus,
            1
          );

        }
      );

    }
  );


  $all(
    "[data-cart-remove]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          removeCartItem(
            button.dataset
              .cartRemove
          );

        }
      );

    }
  );


  updateCartTotals();

}


/* ============================================================
   45. TOTAUX PANIER
   ============================================================ */

function updateCartTotals() {

  const subtotal =
    getCartTotal();


  const subtotalElement =
    $("#cartSubtotal");


  const feesElement =
    $("#cartFees");


  const totalElement =
    $("#cartTotal");


  if (subtotalElement) {

    subtotalElement.textContent =
      formatMoney(
        subtotal,
        selectedCurrency
      );

  }


  if (feesElement) {

    feesElement.textContent =
      formatMoney(
        0,
        selectedCurrency
      );

  }


  if (totalElement) {

    totalElement.textContent =
      formatMoney(
        subtotal,
        selectedCurrency
      );

  }

}


/* ============================================================
   46. DEVISES
   ============================================================ */

function setupCurrencySelector() {

  const selector =
    document.getElementById(
      "currencySelector"
    );


  if (!selector) {

    return;

  }


  selector.value =
    selectedCurrency;


  if (
    selector.dataset.ready ===
    "1"
  ) {

    return;

  }


  selector.dataset.ready =
    "1";


  selector.addEventListener(
    "change",
    () => {

      selectedCurrency =
        selector.value;


      localStorage.setItem(
        "mystroCurrency",
        selectedCurrency
      );


      renderProducts();

      renderCart();

      updateUserInterface();

    }
  );

}


/* ============================================================
   47. CHAT
   ============================================================ */

function setupChat() {

  const input =
    $("#chatInput");


  const button =
    $("#sendChatBtn");


  const messages =
    $("#chatMessages");


  if (
    !input ||
    !button ||
    !messages ||
    button.dataset.ready ===
      "1"
  ) {

    return;

  }


  button.dataset.ready =
    "1";


  function send() {

    const message =
      input.value.trim();


    if (!message) {

      return;

    }


    const bubble =
      document.createElement(
        "div"
      );


    bubble.textContent =
      message;


    bubble.style.margin =
      "10px 0";


    bubble.style.padding =
      "12px 15px";


    bubble.style.borderRadius =
      "16px";


    bubble.style.background =
      "#3159db";


    bubble.style.color =
      "#fff";


    messages.appendChild(
      bubble
    );


    input.value =
      "";


    messages.scrollTop =
      messages.scrollHeight;

  }


  button.addEventListener(
    "click",
    send
  );


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        send();

      }

    }
  );

}


/* ============================================================
   48. ASSISTANT VIRTUEL
   ============================================================ */

function getAssistantReply(
  message
) {

  const text =
    String(message)

      .toLowerCase()

      .normalize("NFD")

      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  if (
    text.includes("produit") ||
    text.includes("vann") ||
    text.includes("sell") ||
    text.includes("producto")
  ) {

    return t(
      "assistantProduct"
    );

  }


  if (
    text.includes("panier") ||
    text.includes("panye") ||
    text.includes("cart") ||
    text.includes("carrito")
  ) {

    return t(
      "assistantCart"
    );

  }


  if (
    text.includes("moncash") ||
    text.includes("portefeuille") ||
    text.includes("potfolyo") ||
    text.includes("wallet") ||
    text.includes("billetera")
  ) {

    return t(
      "assistantWallet"
    );

  }


  if (
    text.includes("profil") ||
    text.includes("pwofil") ||
    text.includes("profile") ||
    text.includes("cuenta")
  ) {

    return t(
      "assistantAccount"
    );

  }


  if (
    text.includes("langue") ||
    text.includes("lang") ||
    text.includes("idioma") ||
    text.includes("language")
  ) {

    return t(
      "assistantLanguage"
    );

  }


  if (
    text.includes("devise") ||
    text.includes("monnaie") ||
    text.includes("currency") ||
    text.includes("moneda")
  ) {

    return t(
      "assistantCurrency"
    );

  }


  return t(
    "assistantDefault"
  );

}


/* ============================================================
   49. ASSISTANT UI
   ============================================================ */

function setupAssistant() {

  const button =
    $("#assistantBtn");


  const panel =
    $("#assistantPanel");


  const close =
    $("#assistantCloseBtn");


  const input =
    $("#assistantInput");


  const send =
    $("#assistantSendBtn");


  const messages =
    $("#assistantMessages");


  if (
    button &&
    panel &&
    button.dataset.ready !==
      "1"
  ) {

    button.dataset.ready =
      "1";


    button.addEventListener(
      "click",
      () => {

        panel.classList.toggle(
          "open"
        );

      }
    );

  }


  if (
    close &&
    panel &&
    close.dataset.ready !==
      "1"
  ) {

    close.dataset.ready =
      "1";


    close.addEventListener(
      "click",
      () => {

        panel.classList.remove(
          "open"
        );

      }
    );

  }


  if (
    input &&
    send &&
    messages &&
    send.dataset.ready !==
      "1"
  ) {

    send.dataset.ready =
      "1";


    function sendAssistantMessage() {

      const text =
        input.value.trim();


      if (!text) {

        return;

      }


      const userBubble =
        document.createElement(
          "div"
        );


      userBubble.textContent =
        text;


      userBubble.style.padding =
        "10px";


      userBubble.style.margin =
        "8px 0";


      userBubble.style.borderRadius =
        "13px";


      userBubble.style.background =
        "#3159db";


      userBubble.style.color =
        "#fff";


      messages.appendChild(
        userBubble
      );


      const reply =
        document.createElement(
          "div"
        );


      reply.textContent =
        getAssistantReply(
          text
        );


      reply.style.padding =
        "10px";


      reply.style.margin =
        "8px 0";


      reply.style.borderRadius =
        "13px";


      reply.style.background =
        "#eef2ff";


      messages.appendChild(
        reply
      );


      input.value =
        "";


      messages.scrollTop =
        messages.scrollHeight;

    }


    send.addEventListener(
      "click",
      sendAssistantMessage
    );


    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          sendAssistantMessage();

        }

      }
    );

  }

}


/* ============================================================
   50. STATISTIQUES
   ============================================================ */

function updateStatistics() {

  const ownProducts =
    products.filter(
      product =>
        product.sellerId ===
        currentUser?.uid
    );


  const productCount =
    ownProducts.length;


  const salesCount =
    ownProducts.reduce(
      (
        total,
        product
      ) =>
        total +
        safeNumber(
          product.sold
        ),
      0
    );


  const revenue =
    ownProducts.reduce(
      (
        total,
        product
      ) => {

        return (
          total +
          safeNumber(
            product.sold
          )
          *
          safeNumber(
            product.sellerAmount ||
            product.price * 0.9
          )
        );

      },
      0
    );


  const ids = {

    statProducts:
      productCount,

    dashboardProducts:
      productCount,

    statSales:
      salesCount,

    dashboardSales:
      salesCount,

    dashboardClients:
      0,

    statClients:
      0

  };


  Object.entries(
    ids
  )
  .forEach(
    ([id, value]) => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.textContent =
          value;

      }

    }
  );


  const revenues = [

    $("#statRevenue"),

    $("#dashboardRevenue")

  ];


  revenues.forEach(
    element => {

      if (element) {

        element.textContent =
          formatMoney(
            revenue,
            selectedCurrency
          );

      }

    }
  );


  renderCharts();

}


/* ============================================================
   51. GRAPHIQUES
   ============================================================ */

let salesChartInstance =
  null;


let commissionChartInstance =
  null;


let dashboardRevenueChartInstance =
  null;


let dashboardSalesChartInstance =
  null;


function renderCharts() {

  if (
    typeof Chart ===
    "undefined"
  ) {

    return;

  }


  const monthlyValues = [

    0,
    0,
    0,
    0,
    0,
    0,
    0

  ];


  const salesCanvas =
    document.getElementById(
      "salesChart"
    );


  if (salesCanvas) {

    salesChartInstance
      ?.destroy();


    salesChartInstance =
      new Chart(
        salesCanvas,
        {

          type:
            "bar",

          data: {

            labels: [

              "Jan",
              "Fév",
              "Mar",
              "Avr",
              "Mai",
              "Juin",
              "Juil"

            ],

            datasets: [

              {

                label:
                  "Revenus",

                data:
                  monthlyValues,

                borderRadius:
                  9

              }

            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {

              legend: {

                display:
                  false

              }

            },

            scales: {

              y: {

                beginAtZero:
                  true

              }

            }

          }

        }
      );

  }


  const commissionCanvas =
    document.getElementById(
      "commissionChart"
    );


  if (
    commissionCanvas
  ) {

    commissionChartInstance
      ?.destroy();


    commissionChartInstance =
      new Chart(
        commissionCanvas,
        {

          type:
            "doughnut",

          data: {

            labels: [

              "Vendeur 90 %",
              "Mystro-Shop 10 %"

            ],

            datasets: [

              {

                data:
                  [90, 10]

              }

            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            cutout:
              "68%"

          }

        }
      );

  }


  const dashboardRevenueCanvas =
    document.getElementById(
      "dashboardRevenueChart"
    );


  if (
    dashboardRevenueCanvas
  ) {

    dashboardRevenueChartInstance
      ?.destroy();


    dashboardRevenueChartInstance =
      new Chart(
        dashboardRevenueCanvas,
        {

          type:
            "bar",

          data: {

            labels: [

              "Jan",
              "Fév",
              "Mar",
              "Avr",
              "Mai",
              "Juin",
              "Juil"

            ],

            datasets: [

              {

                label:
                  "Revenus",

                data:
                  monthlyValues,

                borderRadius:
                  10

              }

            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {

              legend: {

                display:
                  false

              }

            }

          }

        }
      );

  }


  const dashboardSalesCanvas =
    document.getElementById(
      "dashboardSalesChart"
    );


  if (
    dashboardSalesCanvas
  ) {

    dashboardSalesChartInstance
      ?.destroy();


    dashboardSalesChartInstance =
      new Chart(
        dashboardSalesCanvas,
        {

          type:
            "doughnut",

          data: {

            labels: [

              "Électronique",
              "Mode",
              "Maison",
              "Autres"

            ],

            datasets: [

              {

                data:
                  [0, 0, 0, 0]

              }

            ]

          },

          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,

            cutout:
              "60%"

          }

        }
      );

  }

}


/* ============================================================
   52. MONCASH
   ============================================================ */

async function startMoncashDeposit(
  amount
) {

  if (
    !MONCASH_WORKER_URL
  ) {

    showToast(
      "L'URL du serveur MonCash n'est pas encore renseignée dans script.js.",
      "warning"
    );


    return;

  }


  if (
    !currentUser
  ) {

    openLoginModal();


    return;

  }


  try {

    showToast(
      "Connexion à MonCash...",
      "info"
    );


    const response =
      await fetch(
        `${MONCASH_WORKER_URL}/moncash/create-payment`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(
              {

                amount:
                  safeNumber(
                    amount
                  ),

                userId:
                  currentUser.uid,

                email:
                  currentUser.email

              }
            )

        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `Serveur MonCash : ${response.status}`
      );

    }


    const data =
      await response.json();


    const paymentURL =

      data.redirectUrl

      ||

      data.paymentUrl

      ||

      data.url;


    if (!paymentURL) {

      throw new Error(
        "Le serveur MonCash n'a pas retourné de lien de paiement."
      );

    }


    window.location.href =
      paymentURL;

  }

  catch (error) {

    console.error(
      "MonCash:",
      error
    );


    showToast(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   53. MODALE DÉPÔT MONCASH
   ============================================================ */

function openMoncashDepositModal() {

  if (!currentUser) {

    openLoginModal();

    return;

  }


  const amountText =
    prompt(
      "Montant du dépôt MonCash en HTG :"
    );


  if (
    amountText ===
    null
  ) {

    return;

  }


  const amount =
    safeNumber(
      amountText
    );


  if (
    amount <= 0
  ) {

    showToast(
      "Montant invalide.",
      "warning"
    );


    return;

  }


  startMoncashDeposit(
    amount
  );

}


/* ============================================================
   54. RETRAIT MONCASH
   ============================================================ */

async function requestMoncashWithdrawal() {

  if (
    !currentUser
  ) {

    openLoginModal();

    return;

  }


  const phone =
    prompt(
      "Numéro MonCash :"
    );


  if (!phone) {

    return;

  }


  const amountText =
    prompt(
      "Montant du retrait HTG :"
    );


  if (
    amountText ===
    null
  ) {

    return;

  }


  const amount =
    safeNumber(
      amountText
    );


  if (
    amount <= 0
  ) {

    showToast(
      "Montant invalide.",
      "warning"
    );


    return;

  }


  if (
    !MONCASH_WORKER_URL
  ) {

    showToast(
      "L'URL du serveur sécurisé MonCash doit être ajoutée avant un retrait réel.",
      "warning"
    );


    return;

  }


  try {

    const response =
      await fetch(
        `${MONCASH_WORKER_URL}/moncash/withdraw`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(
              {

                userId:
                  currentUser.uid,

                phone,

                amount

              }
            )

        }
      );


    const data =
      await response.json();


    if (
      !response.ok
    ) {

      throw new Error(
        data.error ||
        "Retrait refusé."
      );

    }


    showToast(
      "Demande de retrait envoyée.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Retrait MonCash:",
      error
    );


    showToast(
      error.message,
      "error"
    );

  }

}


/* ============================================================
   55. BOUTONS PORTEFEUILLE
   ============================================================ */

function setupWalletButtons() {

  const deposit =
    $("#moncashDepositBtn");


  const withdraw =
    $("#moncashWithdrawBtn");


  if (
    deposit &&
    deposit.dataset.ready !==
      "1"
  ) {

    deposit.dataset.ready =
      "1";


    deposit.addEventListener(
      "click",
      openMoncashDepositModal
    );

  }


  if (
    withdraw &&
    withdraw.dataset.ready !==
      "1"
  ) {

    withdraw.dataset.ready =
      "1";


    withdraw.addEventListener(
      "click",
      requestMoncashWithdrawal
    );

  }


  const natcash =
    $("#natcashBtn");


  if (
    natcash &&
    natcash.dataset.ready !==
      "1"
  ) {

    natcash.dataset.ready =
      "1";


    natcash.addEventListener(
      "click",
      () => {

        showToast(
          "NatCash sera activé lorsqu'une intégration marchand sécurisée sera disponible.",
          "info"
        );

      }
    );

  }


  const bank =
    $("#bankBtn");


  if (
    bank &&
    bank.dataset.ready !==
      "1"
  ) {

    bank.dataset.ready =
      "1";


    bank.addEventListener(
      "click",
      () => {

        showToast(
          "BNC / Unibank : configuration bancaire à compléter.",
          "info"
        );

      }
    );

  }


  const transfer =
    $("#transferBtn");


  if (
    transfer &&
    transfer.dataset.ready !==
      "1"
  ) {

    transfer.dataset.ready =
      "1";


    transfer.addEventListener(
      "click",
      () => {

        showToast(
          "MoneyGram / Ria : configuration à compléter.",
          "info"
        );

      }
    );

  }


  const exchange =
    $("#exchangeBtn");


  if (
    exchange &&
    exchange.dataset.ready !==
      "1"
  ) {

    exchange.dataset.ready =
      "1";


    exchange.addEventListener(
      "click",
      () => {

        showToast(
          "Utilisez le sélecteur de devise situé en haut.",
          "info"
        );

      }
    );

  }

}


/* ============================================================
   56. CHECKOUT
   ============================================================ */

function setupCheckout() {

  const checkout =
    $("#checkoutBtn");


  if (
    !checkout ||
    checkout.dataset.ready ===
      "1"
  ) {

    return;

  }


  checkout.dataset.ready =
    "1";


  checkout.addEventListener(
    "click",
    () => {

      if (
        !currentUser
      ) {

        openLoginModal();

        return;

      }


      if (
        cart.length ===
        0
      ) {

        showToast(
          t("emptyCart"),
          "warning"
        );


        return;

      }


      /*
        Le paiement MonCash réel doit
        être calculé en HTG côté serveur.

        Ici nous utilisons la valeur
        actuellement affichée uniquement
        comme point de départ.
      */

      const total =
        getCartTotal();


      if (
        selectedCurrency !==
        "HTG"
      ) {

        showToast(
          "Pour MonCash, le montant final doit être reconverti en HTG par le serveur.",
          "info"
        );

      }


      startMoncashDeposit(
        total
      );

    }
  );

}


/* ============================================================
   57. FIREBASE AUTH OBSERVER
   ============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (user) {

      hideWelcome();


      await loadUserProfile(
        user
      );


      await loadProducts();


      updateUserInterface();

    }

    else {

      currentProfile =
        null;


      showWelcome();

    }

  }
);


/* ============================================================
   58. ERREURS GLOBALES
   ============================================================ */

window.addEventListener(
  "error",
  event => {

    console.error(
      "Erreur JavaScript Mystro-Shop:",
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "Promesse non gérée:",
      event.reason
    );

  }
);


/* ============================================================
   59. API PUBLIQUE
   ============================================================ */

window.MystroShop = {

  auth,

  db,

  supabase,

  openPage,

  openDrawer,

  closeDrawer,

  openLogin:
    openLoginModal,

  openRegister:
    openRegisterModal,

  openProfile:
    openProfileModal,

  logout:
    logoutUser,

  loadProducts,

  publishProduct,

  addToCart,

  calculateCommission,

  startMoncashDeposit,

  requestMoncashWithdrawal,

  getCurrentUser() {

    return currentUser;

  },

  getCurrentProfile() {

    return currentProfile;

  },

  getProducts() {

    return products;

  },

  getCart() {

    return cart;

  }

};


/* ============================================================
   60. DÉMARRAGE
   ============================================================ */

async function startMystroShop() {

  console.log(
    "🚀 Mystro-Shop démarre..."
  );


  setupAuthButtons();

  setupNavigation();

  setupProfileButtons();

  setupLogoutButton();

  setupLanguageSelector();

  setupCurrencySelector();

  setupProductForm();

  setupImagePreview();

  setupSearch();

  setupChat();

  setupAssistant();

  setupWalletButtons();

  setupCheckout();


  loadCart();


  applyLanguage();


  /*
    Les produits publics peuvent être
    chargés même avant connexion.
  */

  await loadProducts();


  openPage(
    "home"
  );


  /*
    Certains éléments peuvent être
    recréés dynamiquement.
  */

  const observer =
    new MutationObserver(
      () => {

        setupNavigation();

        setupProfileButtons();

        setupLogoutButton();

        setupProductForm();

        setupImagePreview();

        setupSearch();

        setupWalletButtons();

        setupCheckout();

      }
    );


  observer.observe(
    document.body,
    {

      childList:
        true,

      subtree:
        true

    }
  );


  console.log(
    "✅ Mystro-Shop prêt."
  );

}


/* ============================================================
   61. LANCEMENT
   ============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startMystroShop
  );

}

else {

  startMystroShop();

}


/* ============================================================
   FIN SCRIPT.JS
   ============================================================ */

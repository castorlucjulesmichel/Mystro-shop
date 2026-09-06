/* ============================================================
   MYSTRO-SHOP — SCRIPT.JS UNIQUE
   VERSION PUBLICATION PHOTO CORRIGÉE

   Firebase Auth
   Firestore
   Supabase Storage direct
   MonCash via Worker
   FR / HT / EN / ES
   Commission Mystro-Shop : 10 %
============================================================ */


/* ============================================================
   IMPORTS FIREBASE
============================================================ */

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit
}
from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  createClient
}
from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ============================================================
   FIREBASE
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
   SUPABASE
============================================================ */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_PUBLIC_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const PRODUCT_BUCKET =
  "product-images";


/*
  IMPORTANT :

  Firebase reste le système de connexion.

  À chaque requête Supabase,
  nous récupérons le token Firebase actuel.
*/

const supabase =
  createClient(

    SUPABASE_URL,

    SUPABASE_PUBLIC_KEY,

    {

      accessToken:
        async () => {

          const user =
            auth.currentUser;

          if (!user) {
            return null;
          }

          try {

            return await user.getIdToken(
              false
            );

          } catch (error) {

            console.error(
              "Firebase token:",
              error
            );

            return null;
          }
        }
    }
  );


/* ============================================================
   WORKER
   Seulement pour MonCash
============================================================ */

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";


/* ============================================================
   PARAMÈTRES
============================================================ */

const COMMISSION_RATE =
  0.10;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [

  "image/jpeg",

  "image/jpg",

  "image/png",

  "image/webp"
];


/* ============================================================
   ÉTAT APPLICATION
============================================================ */

const state = {

  user:
    null,

  profile:
    null,

  products:
    [],

  filteredProducts:
    [],

  cart:
    loadJSON(
      "mystroCart",
      []
    ),

  language:
    localStorage.getItem(
      "mystroLanguage"
    ) ||
    "fr",

  currency:
    localStorage.getItem(
      "mystroCurrency"
    ) ||
    "HTG",

  currentPage:
    "home",

  charts:
    {}
};


/* ============================================================
   DEVISES
============================================================ */

const CURRENCY_SYMBOLS = {

  HTG:
    "G",

  USD:
    "$",

  EUR:
    "€",

  CAD:
    "CA$",

  GBP:
    "£",

  DOP:
    "RD$",

  XOF:
    "CFA"
};


const FX = {

  USD:
    1,

  HTG:
    131,

  EUR:
    0.86,

  CAD:
    1.36,

  GBP:
    0.74,

  DOP:
    63.5,

  XOF:
    565
};


/* ============================================================
   SÉLECTEURS
============================================================ */

function $(id) {

  return document.getElementById(
    id
  );
}


function $$(
  selector,
  root = document
) {

  return Array.from(
    root.querySelectorAll(
      selector
    )
  );
}


/* ============================================================
   STOCKAGE LOCAL
============================================================ */

function loadJSON(
  key,
  fallback
) {

  try {

    const value =
      localStorage.getItem(
        key
      );

    if (!value) {
      return fallback;
    }

    return JSON.parse(
      value
    );

  } catch (error) {

    console.warn(
      "LocalStorage:",
      error
    );

    return fallback;
  }
}


function saveJSON(
  key,
  value
) {

  try {

    localStorage.setItem(

      key,

      JSON.stringify(
        value
      )
    );

  } catch (error) {

    console.warn(
      "LocalStorage:",
      error
    );
  }
}


/* ============================================================
   SÉCURITÉ TEXTE
============================================================ */

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

    .normalize(
      "NFD"
    )

    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


/* ============================================================
   MONTANTS
============================================================ */

function convertAmount(
  amount,
  from,
  to
) {

  const number =
    Number(amount) || 0;

  if (
    !FX[from] ||
    !FX[to]
  ) {

    return number;
  }

  return (
    number /
    FX[from]
  ) *
  FX[to];
}


function money(
  amount,
  currency = state.currency
) {

  const number =
    Number(amount) || 0;

  const symbol =
    CURRENCY_SYMBOLS[
      currency
    ] ||
    currency;

  return (
    symbol +
    " " +
    number.toLocaleString(

      undefined,

      {

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2
      }
    )
  );
}


/* ============================================================
   TOAST
============================================================ */

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

      bottom:95px;

      transform:translateX(-50%);

      z-index:999999;

      max-width:90%;

      min-width:220px;

      padding:13px 18px;

      border-radius:12px;

      background:#111;

      color:white;

      text-align:center;

      font-family:Arial,sans-serif;

      font-size:14px;

      font-weight:600;

      line-height:1.4;

      box-shadow:
        0 10px 30px
        rgba(0,0,0,.22);

      opacity:0;

      transition:
        opacity .2s ease;

      pointer-events:none;
    `;

    document.body.appendChild(
      box
    );
  }


  box.textContent =
    message;


  if (
    type ===
    "error"
  ) {

    box.style.background =
      "#c52216";

  } else if (
    type ===
    "success"
  ) {

    box.style.background =
      "#15803d";

  } else {

    box.style.background =
      "#111";
  }


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

      3500
    );
}


/* ============================================================
   BOUTONS EN CHARGEMENT
============================================================ */

function setBusy(
  button,
  busy,
  text = ""
) {

  if (!button) {
    return;
  }


  if (busy) {

    if (
      !button.dataset.originalText
    ) {

      button.dataset.originalText =
        button.textContent;
    }

    button.disabled =
      true;

    button.textContent =
      text ||
      t("loading");

  } else {

    button.disabled =
      false;

    button.textContent =
      button.dataset.originalText ||
      button.textContent;
  }
}


/* ============================================================
   MODALES
============================================================ */

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
      "Mon profil",

    help:
      "Aide",

    logout:
      "Se déconnecter",

    search:
      "Rechercher sur Mystro-Shop...",

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

    fullName:
      "Nom complet",

    buyer:
      "Acheteur",

    seller:
      "Vendeur",

    accountType:
      "Type de compte",

    forgot:
      "Mot de passe oublié ?",

    welcome:
      "Bienvenue sur Mystro-Shop",

    market:
      "Marché international",

    publicationSuccess:
      "Produit publié avec succès.",

    publicationError:
      "Publication du produit échouée.",

    imageRequired:
      "Choisissez une photo du produit.",

    imageInvalid:
      "La photo doit être JPEG, PNG ou WebP et ne pas dépasser 5 Mo.",

    uploadStarting:
      "Envoi de la photo...",

    savingProduct:
      "Enregistrement du produit...",

    sellerRequired:
      "Cette fonction est réservée aux vendeurs.",

    loginRequired:
      "Connectez-vous d'abord.",

    addCart:
      "Ajouter au panier",

    emptyCart:
      "Votre panier est vide.",

    cartAdded:
      "Produit ajouté au panier.",

    operationUnavailable:
      "Cette fonction sera bientôt disponible.",

    invalidAmount:
      "Entrez un montant valide.",

    assistantHello:
      "Bonjour 👋 Comment puis-je vous aider ?"
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
      "Chat",

    services:
      "Sèvis",

    profile:
      "Pwofil mwen",

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

    fullName:
      "Non konplè",

    buyer:
      "Achtè",

    seller:
      "Vandè",

    accountType:
      "Kalite kont",

    forgot:
      "Ou bliye modpas la?",

    welcome:
      "Byenveni sou Mystro-Shop",

    market:
      "Mache entènasyonal",

    publicationSuccess:
      "Pwodwi a pibliye avèk siksè.",

    publicationError:
      "Piblikasyon pwodwi a echwe.",

    imageRequired:
      "Chwazi yon foto pwodwi a.",

    imageInvalid:
      "Foto a dwe JPEG, PNG oswa WebP epi li pa dwe depase 5 MB.",

    uploadStarting:
      "Ap voye foto a...",

    savingProduct:
      "Ap anrejistre pwodwi a...",

    sellerRequired:
      "Fonksyon sa a rezève pou vandè yo.",

    loginRequired:
      "Konekte anvan.",

    addCart:
      "Ajoute nan panyen",

    emptyCart:
      "Panyen ou vid.",

    cartAdded:
      "Pwodwi a ajoute nan panyen.",

    operationUnavailable:
      "Fonksyon sa a ap disponib pita.",

    invalidAmount:
      "Antre yon montan ki valab.",

    assistantHello:
      "Bonjou 👋 Kijan mwen ka ede w?"
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
      "My profile",

    help:
      "Help",

    logout:
      "Log out",

    search:
      "Search Mystro-Shop...",

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

    fullName:
      "Full name",

    buyer:
      "Buyer",

    seller:
      "Seller",

    accountType:
      "Account type",

    forgot:
      "Forgot password?",

    welcome:
      "Welcome to Mystro-Shop",

    market:
      "International marketplace",

    publicationSuccess:
      "Product published successfully.",

    publicationError:
      "Product publication failed.",

    imageRequired:
      "Choose a product photo.",

    imageInvalid:
      "The photo must be JPEG, PNG or WebP and no larger than 5 MB.",

    uploadStarting:
      "Uploading photo...",

    savingProduct:
      "Saving product...",

    sellerRequired:
      "This feature is reserved for sellers.",

    loginRequired:
      "Please log in first.",

    addCart:
      "Add to cart",

    emptyCart:
      "Your cart is empty.",

    cartAdded:
      "Product added to cart.",

    operationUnavailable:
      "This feature will be available soon.",

    invalidAmount:
      "Enter a valid amount.",

    assistantHello:
      "Hello 👋 How can I help you?"
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
      "Mi perfil",

    help:
      "Ayuda",

    logout:
      "Cerrar sesión",

    search:
      "Buscar en Mystro-Shop...",

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

    fullName:
      "Nombre completo",

    buyer:
      "Comprador",

    seller:
      "Vendedor",

    accountType:
      "Tipo de cuenta",

    forgot:
      "¿Olvidó su contraseña?",

    welcome:
      "Bienvenido a Mystro-Shop",

    market:
      "Mercado internacional",

    publicationSuccess:
      "Producto publicado correctamente.",

    publicationError:
      "La publicación del producto falló.",

    imageRequired:
      "Seleccione una foto del producto.",

    imageInvalid:
      "La foto debe ser JPEG, PNG o WebP y no superar los 5 MB.",

    uploadStarting:
      "Subiendo foto...",

    savingProduct:
      "Guardando producto...",

    sellerRequired:
      "Esta función está reservada para vendedores.",

    loginRequired:
      "Inicie sesión primero.",

    addCart:
      "Añadir al carrito",

    emptyCart:
      "Su carrito está vacío.",

    cartAdded:
      "Producto añadido al carrito.",

    operationUnavailable:
      "Esta función estará disponible próximamente.",

    invalidAmount:
      "Ingrese un monto válido.",

    assistantHello:
      "Hola 👋 ¿Cómo puedo ayudarle?"
  }
};


function t(key) {

  return (

    I18N[
      state.language
    ]?.[key] ||

    I18N.fr[
      key
    ] ||

    key
  );
}


/* ============================================================
   LANGUE
============================================================ */

function applyLanguage(
  language
) {

  if (
    !I18N[language]
  ) {

    language =
      "fr";
  }


  state.language =
    language;


  localStorage.setItem(
    "mystroLanguage",
    language
  );


  document.documentElement.lang =
    language;


  $$("[data-i18n]")
    .forEach(

      element => {

        const key =
          element.dataset.i18n;

        if (
          I18N[
            language
          ][key]
        ) {

          element.textContent =
            I18N[
              language
            ][key];
        }
      }
    );


  $$("[data-i18n-placeholder]")
    .forEach(

      element => {

        const key =
          element.dataset
            .i18nPlaceholder;

        if (
          I18N[
            language
          ][key]
        ) {

          element.placeholder =
            I18N[
              language
            ][key];
        }
      }
    );


  if (
    $("searchInput")
  ) {

    $("searchInput").placeholder =
      t("search");
  }


  if (
    $("languageSelector")
  ) {

    $("languageSelector").value =
      language;
  }


  renderProducts();

  renderCart();
}


/* ============================================================
   NAVIGATION
============================================================ */

function openPage(page) {

  const target =
    $(
      `${page}Page`
    );

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

      button => {

        button.classList.toggle(

          "active",

          button.dataset.page ===
            page
        );
      }
    );


  $("mobileNav")
    ?.classList.remove(
      "open"
    );


  document.body.classList.remove(
    "nav-open"
  );


  if (
    page === "home" ||
    page === "products"
  ) {

    renderProducts();
  }


  if (
    page === "cart"
  ) {

    renderCart();
  }


  if (
    page === "profile"
  ) {

    renderProfile();
  }


  if (
    page === "dashboard" ||
    page === "statistics"
  ) {

    refreshStats();
  }


  window.scrollTo(
    0,
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

      element => {

        element.addEventListener(

          "click",

          event => {

            event.preventDefault();

            openPage(
              element.dataset.page
            );
          }
        );
      }
    );
}


/* ============================================================
   PROFIL
============================================================ */

async function loadProfile(user) {

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
      "Profil:",
      error
    );
  }


  return {

    name:
      user.email
        ?.split("@")[0] ||
      "Utilisateur",

    email:
      user.email ||
      "",

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
      "vendeur" ||

    state.profile?.role ===
      "admin"
  );
}


/* ============================================================
   AUTH MODAL
============================================================ */

function createAuthModal() {

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


  modal.innerHTML = `

    <div
      class="modal-card"
      style="
        max-width:420px;
      "
    >

      <button
        type="button"
        data-close-modal="authModal"
        style="
          float:right;
          border:0;
          background:none;
          font-size:28px;
        "
      >
        ×
      </button>

      <h2>
        Mystro-Shop
      </h2>

      <div
        style="
          display:flex;
          gap:8px;
          margin:15px 0;
        "
      >

        <button
          type="button"
          id="loginTab"
          style="flex:1"
        >
          Se connecter
        </button>

        <button
          type="button"
          id="registerTab"
          style="flex:1"
        >
          S'inscrire
        </button>

      </div>


      <form id="authForm">

        <div
          id="authNameBox"
          style="display:none"
        >

          <label>
            Nom
          </label>

          <input
            id="authName"
            type="text"
          >

        </div>


        <label>
          E-mail
        </label>

        <input
          id="authEmail"
          type="email"
          required
        >


        <label>
          Mot de passe
        </label>

        <input
          id="authPassword"
          type="password"
          minlength="6"
          required
        >


        <div
          id="authRoleBox"
          style="display:none"
        >

          <label>
            Type de compte
          </label>

          <select id="authRole">

            <option value="buyer">
              Acheteur
            </option>

            <option value="seller">
              Vendeur
            </option>

          </select>

        </div>


        <button
          id="authSubmitBtn"
          type="submit"
          style="
            width:100%;
            margin-top:15px;
          "
        >
          Se connecter
        </button>


        <button
          id="forgotPasswordBtn"
          type="button"
          style="
            width:100%;
            margin-top:8px;
          "
        >
          Mot de passe oublié ?
        </button>

      </form>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  let mode =
    "login";


  function setMode(next) {

    mode =
      next;


    $("authNameBox").style.display =
      next === "register"
        ? "block"
        : "none";


    $("authRoleBox").style.display =
      next === "register"
        ? "block"
        : "none";


    $("forgotPasswordBtn")
      .style.display =
      next === "login"
        ? "block"
        : "none";


    $("authSubmitBtn")
      .textContent =
      next === "login"
        ? t("login")
        : t("register");
  }


  $("loginTab")
    .addEventListener(

      "click",

      () => {

        setMode(
          "login"
        );
      }
    );


  $("registerTab")
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
            mode ===
            "register"
          ) {

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

                name:
                  $("authName")
                    .value
                    .trim() ||
                  email.split("@")[0],

                email:
                  email,

                role:
                  $("authRole").value,

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


            toast(
              "Compte créé.",
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
            "Connexion:",
            error
          );


          toast(
            error.message,
            "error"
          );

        } finally {

          setBusy(
            button,
            false
          );
        }
      }
    );


  $("forgotPasswordBtn")
    .addEventListener(

      "click",

      async () => {

        const email =
          $("authEmail")
            .value
            .trim();


        if (!email) {

          toast(
            "Entrez votre e-mail.",
            "error"
          );

          return;
        }


        try {

          await sendPasswordResetEmail(
            auth,
            email
          );


          toast(
            "E-mail envoyé.",
            "success"
          );


        } catch (error) {

          toast(
            error.message,
            "error"
          );
        }
      }
    );
}


function openAuth(
  mode = "login"
) {

  createAuthModal();


  if (
    mode === "register"
  ) {

    $("registerTab")
      ?.click();

  } else {

    $("loginTab")
      ?.click();
  }


  openModal(
    "authModal"
  );
}


/* ============================================================
   BOUTONS AUTH
============================================================ */

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

        signOut(
          auth
        );
      }
    );


  $("profileLogoutBtn")
    ?.addEventListener(

      "click",

      () => {

        signOut(
          auth
        );
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
   PRODUITS DE DÉMONSTRATION
============================================================ */

const DEMO_PRODUCTS = [

  {

    id:
      "demo1",

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
      "Robe moderne."
  },


  {

    id:
      "demo2",

    name:
      "Sac tendance",

    category:
      "Accessoires",

    price:
      18.50,

    currency:
      "USD",

    stock:
      10,

    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",

    description:
      "Sac moderne."
  },


  {

    id:
      "demo3",

    name:
      "Chaussures",

    category:
      "Chaussures",

    price:
      31,

    currency:
      "USD",

    stock:
      20,

    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",

    description:
      "Chaussures confortables."
  }
];


/* ============================================================
   CHARGEMENT PRODUITS
============================================================ */

async function loadProducts() {

  let products =
    [];


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

        limit(
          100
        )
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
      "Lecture produits:",
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


/* ============================================================
   PRIX PRODUIT
============================================================ */

function productCurrentPrice(
  product
) {

  return convertAmount(

    Number(
      product.price
    ) || 0,

    product.currency ||
      "USD",

    state.currency
  );
}


/* ============================================================
   CARTE PRODUIT
============================================================ */

function createProductCard(
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

      "https://placehold.co/600x800?text=Mystro-Shop"
    );


  const category =
    escapeHTML(
      product.category ||
      "Marketplace"
    );


  return `

    <article
      class="product-card"
      data-product-id="${escapeHTML(product.id)}"
    >

      <div
        style="
          position:relative;
          width:100%;
          aspect-ratio:3/4;
          overflow:hidden;
          background:#f3f3f3;
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

          class="product-favorite"

          style="
            position:absolute;
            right:8px;
            top:8px;
            width:36px;
            height:36px;
            border:none;
            border-radius:50%;
            background:white;
            font-size:20px;
          "
        >
          ♡
        </button>

      </div>


      <div
        style="
          padding:9px 4px 12px;
        "
      >

        <small>
          ${category}
        </small>


        <h3
          style="
            margin:4px 0;
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
            gap:8px;
          "
        >

          <strong>
            ${
              money(
                productCurrentPrice(
                  product
                )
              )
            }
          </strong>


          <button

            type="button"

            data-add-cart="${escapeHTML(product.id)}"

            style="
              width:36px;
              height:36px;
              border:0;
              border-radius:50%;
              background:#111;
              color:white;
              font-size:20px;
            "
          >
            +
          </button>

        </div>

      </div>

    </article>
  `;
}


/* ============================================================
   AFFICHAGE PRODUITS
============================================================ */

function renderProducts() {

  const containers = [

    $("productsGrid"),

    $("homeProducts"),

    $("featuredProducts")

  ].filter(
    Boolean
  );


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
            createProductCard
          )
          .join("")

      : `
        <div class="empty-state">
          Aucun produit.
        </div>
      `;


  containers.forEach(

    container => {

      container.innerHTML =
        html;
    }
  );


  setupProductCardButtons();
}


/* ============================================================
   FAVORIS + PANIER PRODUIT
============================================================ */

function setupProductCardButtons() {

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


  $$(".product-favorite")
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

function searchProducts() {

  const search =
    normalizeText(
      $("searchInput")
        ?.value ||
      ""
    );


  state.filteredProducts =
    state.products.filter(

      product => {

        const haystack =
          normalizeText(
            `${product.name || ""} ${product.category || ""} ${product.description || ""}`
          );


        return (

          search === "" ||

          haystack.includes(
            search
          )
        );
      }
    );


  renderProducts();
}


function setupSearch() {

  $("searchInput")
    ?.addEventListener(

      "input",

      searchProducts
    );
}


/* ============================================================
   VALIDATION PHOTO
============================================================ */

function validateProductImage(
  file
) {

  if (!file) {

    return {

      ok:
        false,

      message:
        t("imageRequired")
    };
  }


  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type
    )
  ) {

    return {

      ok:
        false,

      message:
        t("imageInvalid")
    };
  }


  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {

    return {

      ok:
        false,

      message:
        t("imageInvalid")
    };
  }


  return {

    ok:
      true
  };
}


/* ============================================================
   APERÇU PHOTO
============================================================ */

function setupImagePreview() {

  const input =
    $("productImage");


  if (!input) {
    return;
  }


  input.addEventListener(

    "change",

    event => {

      const file =
        event.target.files?.[0];


      const validation =
        validateProductImage(
          file
        );


      const preview =
        $("productImagePreview");


      if (
        !validation.ok
      ) {

        if (file) {

          toast(
            validation.message,
            "error"
          );
        }


        input.value =
          "";


        if (
          preview
        ) {

          if (
            preview.tagName ===
            "IMG"
          ) {

            preview.removeAttribute(
              "src"
            );

            preview.style.display =
              "none";

          } else {

            preview.innerHTML =
              "";
          }
        }


        return;
      }


      const objectURL =
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
          objectURL;

        preview.style.display =
          "block";

      } else {

        preview.innerHTML = `

          <img

            src="${objectURL}"

            alt="Aperçu produit"

            style="
              width:100%;
              max-height:360px;
              object-fit:cover;
              border-radius:14px;
            "
          >
        `;
      }
    }
  );
}


/* ============================================================
   NOM FICHIER SÉCURISÉ
============================================================ */

function createImagePath(
  file,
  userId
) {

  let extension =
    file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();


  if (
    ![
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(extension)
  ) {

    switch (
      file.type
    ) {

      case "image/png":

        extension =
          "png";

        break;


      case "image/webp":

        extension =
          "webp";

        break;


      default:

        extension =
          "jpg";
    }
  }


  const random =
    Math.random()
      .toString(36)
      .slice(2);


  return (
    `${userId}/` +
    `${Date.now()}-` +
    `${random}.` +
    `${extension}`
  );
}


/* ============================================================
   UPLOAD PHOTO
   VERSION CORRIGÉE

   PAS DE WORKER
   PAS DE FETCH MANUEL

   Supabase uniquement.
============================================================ */

async function uploadProductImage(
  file
) {

  const user =
    auth.currentUser;


  if (!user) {

    throw new Error(
      t("loginRequired")
    );
  }


  const validation =
    validateProductImage(
      file
    );


  if (
    !validation.ok
  ) {

    throw new Error(
      validation.message
    );
  }


  /*
    Force le renouvellement
    du token Firebase.

    Important après une modification
    des custom claims Firebase.
  */

  try {

    await user.getIdToken(
      true
    );

  } catch (error) {

    console.error(
      "Renouvellement token:",
      error
    );

    throw new Error(
      "Impossible de vérifier votre connexion Firebase."
    );
  }


  const filePath =
    createImagePath(
      file,
      user.uid
    );


  console.log(
    "Upload Supabase:",
    PRODUCT_BUCKET,
    filePath
  );


  let result;


  try {

    result =
      await supabase

        .storage

        .from(
          PRODUCT_BUCKET
        )

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


  } catch (networkError) {

    console.error(
      "Erreur réseau Supabase:",
      networkError
    );


    throw new Error(
      "Impossible de contacter Supabase. Vérifiez la connexion Internet ou la configuration du stockage."
    );
  }


  const {
    data,
    error
  } =
    result;


  if (error) {

    console.error(
      "Supabase Storage:",
      error
    );


    const message =
      String(
        error.message ||
        ""
      );


    if (
      message
        .toLowerCase()
        .includes(
          "row-level security"
        ) ||

      message
        .toLowerCase()
        .includes(
          "policy"
        ) ||

      message
        .toLowerCase()
        .includes(
          "unauthorized"
        ) ||

      message
        .toLowerCase()
        .includes(
          "jwt"
        )
    ) {

      throw new Error(
        "Supabase refuse l'autorisation de publier la photo. Vérifiez l'authentification Firebase/Supabase."
      );
    }


    if (
      message
        .toLowerCase()
        .includes(
          "bucket"
        )
    ) {

      throw new Error(
        "Le bucket product-images est introuvable."
      );
    }


    throw new Error(
      message ||
      "Échec de l'envoi de la photo."
    );
  }


  if (
    !data?.path
  ) {

    throw new Error(
      "Supabase n'a pas retourné le chemin de la photo."
    );
  }


  const publicResult =
    supabase

      .storage

      .from(
        PRODUCT_BUCKET
      )

      .getPublicUrl(
        data.path
      );


  const publicUrl =
    publicResult
      ?.data
      ?.publicUrl;


  if (!publicUrl) {

    throw new Error(
      "Impossible d'obtenir l'URL publique de la photo."
    );
  }


  console.log(
    "Photo publiée:",
    publicUrl
  );


  return {

    imageUrl:
      publicUrl,

    imagePath:
      data.path
  };
}


/* ============================================================
   PUBLICATION PRODUIT
============================================================ */

async function publishProduct(
  event
) {

  event?.preventDefault();


  const user =
    auth.currentUser;


  if (!user) {

    toast(
      t("loginRequired"),
      "error"
    );

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
      ?.trim();


  const category =
    $("productCategory")
      ?.value
      ?.trim();


  const currency =
    $("productCurrency")
      ?.value ||
    "HTG";


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
      ?.trim() ||
    "";


  const file =
    $("productImage")
      ?.files?.[0];


  if (!name) {

    toast(
      "Entrez le nom du produit.",
      "error"
    );

    return;
  }


  if (!category) {

    toast(
      "Choisissez une catégorie.",
      "error"
    );

    return;
  }


  if (
    !Number.isFinite(
      price
    ) ||
    price <= 0
  ) {

    toast(
      "Entrez un prix valide.",
      "error"
    );

    return;
  }


  if (
    !Number.isFinite(
      stock
    ) ||
    stock < 0
  ) {

    toast(
      "Entrez un stock valide.",
      "error"
    );

    return;
  }


  const validation =
    validateProductImage(
      file
    );


  if (
    !validation.ok
  ) {

    toast(
      validation.message,
      "error"
    );

    return;
  }


  const publishButton =
    $("publishProductBtn") ||

    $("productForm")
      ?.querySelector(
        'button[type="submit"]'
      );


  setBusy(

    publishButton,

    true,

    t("uploadStarting")
  );


  try {

    /*
      ÉTAPE 1
      Upload photo Supabase
    */

    const upload =
      await uploadProductImage(
        file
      );


    if (
      !upload.imageUrl
    ) {

      throw new Error(
        "URL photo manquante."
      );
    }


    if (
      publishButton
    ) {

      publishButton.textContent =
        t("savingProduct");
    }


    /*
      ÉTAPE 2
      Produit Firestore
    */

    const productData = {

      name:
        name,

      category:
        category,

      currency:
        currency,

      price:
        price,

      stock:
        stock,

      description:
        description,

      imageUrl:
        upload.imageUrl,

      imagePath:
        upload.imagePath,

      sellerId:
        user.uid,

      sellerEmail:
        user.email ||
        "",

      sellerName:
        state.profile?.name ||
        user.email ||
        "Vendeur",

      commissionRate:
        COMMISSION_RATE,

      sellerPercentage:
        90,

      mystroPercentage:
        10,

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

        productData
      );


    /*
      Produit local
    */

    state.products.unshift({

      id:
        reference.id,

      ...productData
    });


    state.filteredProducts =
      [
        ...state.products
      ];


    /*
      Réinitialisation formulaire
    */

    $("productForm")
      ?.reset();


    const preview =
      $("productImagePreview");


    if (
      preview
    ) {

      if (
        preview.tagName ===
        "IMG"
      ) {

        preview.removeAttribute(
          "src"
        );

        preview.style.display =
          "none";

      } else {

        preview.innerHTML =
          "";
      }
    }


    renderProducts();

    refreshStats();


    toast(
      t("publicationSuccess"),
      "success"
    );


    setTimeout(

      () => {

        openPage(
          "products"
        );
      },

      500
    );


  } catch (error) {

    console.error(
      "PUBLICATION PRODUIT:",
      error
    );


    let message =
      error?.message ||
      t("publicationError");


    /*
      Message plus utile que
      simplement Failed to fetch.
    */

    if (
      message ===
      "Failed to fetch"
    ) {

      message =
        "Connexion au stockage impossible.";
    }


    toast(

      `${t("publicationError")} ${message}`,

      "error"
    );


  } finally {

    setBusy(
      publishButton,
      false
    );
  }
}


/* ============================================================
   FORMULAIRE PUBLICATION
============================================================ */

function setupProductPublishing() {

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

function updateCartBadge() {

  const total =
    state.cart.reduce(

      (
        sum,
        item
      ) =>

        sum +
        (
          Number(
            item.qty
          ) ||
          1
        ),

      0
    );


  if (
    $("cartCount")
  ) {

    $("cartCount")
      .textContent =
      total;
  }


  $$("[data-cart-count]")
    .forEach(

      element => {

        element.textContent =
          total;
      }
    );
}


function addToCart(
  productId
) {

  const product =
    state.products.find(

      item =>
        String(
          item.id
        ) ===
        String(
          productId
        )
    );


  if (!product) {

    return;
  }


  const existing =
    state.cart.find(

      item =>
        String(
          item.id
        ) ===
        String(
          productId
        )
    );


  if (
    existing
  ) {

    existing.qty =
      (
        Number(
          existing.qty
        ) ||
        1
      ) +
      1;

  } else {

    state.cart.push({

      ...product,

      qty:
        1
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


function removeFromCart(
  id
) {

  state.cart =
    state.cart.filter(

      item =>
        String(
          item.id
        ) !==
        String(
          id
        )
    );


  saveJSON(
    "mystroCart",
    state.cart
  );


  renderCart();
}


function changeQuantity(
  id,
  delta
) {

  const item =
    state.cart.find(

      product =>
        String(
          product.id
        ) ===
        String(
          id
        )
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
        ) ||
        1
      ) +
      delta
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

        🛒 ${t("emptyCart")}

      </div>
    `;

  } else {

    container.innerHTML =
      state.cart

        .map(

          item => {

            const converted =
              productCurrentPrice(
                item
              );


            return `

              <div
                style="
                  display:grid;
                  grid-template-columns:75px 1fr auto;
                  gap:10px;
                  align-items:center;
                  padding:12px 0;
                  border-bottom:1px solid #eee;
                "
              >

                <img

                  src="${
                    escapeHTML(
                      item.imageUrl ||
                      "https://placehold.co/150x190"
                    )
                  }"

                  style="
                    width:75px;
                    height:95px;
                    object-fit:cover;
                  "
                >


                <div>

                  <strong>
                    ${escapeHTML(item.name)}
                  </strong>


                  <div>
                    ${money(converted)}
                  </div>


                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:8px;
                      margin-top:8px;
                    "
                  >

                    <button
                      data-minus="${escapeHTML(item.id)}"
                    >
                      −
                    </button>

                    <span>
                      ${item.qty || 1}
                    </span>

                    <button
                      data-plus="${escapeHTML(item.id)}"
                    >
                      +
                    </button>

                  </div>

                </div>


                <button
                  data-remove="${escapeHTML(item.id)}"
                >
                  ×
                </button>

              </div>
            `;
          }
        )

        .join("");
  }


  const subtotal =
    state.cart.reduce(

      (
        sum,
        item
      ) =>

        sum +
        (
          productCurrentPrice(
            item
          ) *
          (
            Number(
              item.qty
            ) ||
            1
          )
        ),

      0
    );


  const fee =
    subtotal *
    COMMISSION_RATE;


  const total =
    subtotal +
    fee;


  if (
    $("cartSubtotal")
  ) {

    $("cartSubtotal")
      .textContent =
      money(
        subtotal
      );
  }


  if (
    $("cartFees")
  ) {

    $("cartFees")
      .textContent =
      money(
        fee
      );
  }


  if (
    $("cartTotal")
  ) {

    $("cartTotal")
      .textContent =
      money(
        total
      );
  }


  $$("[data-minus]")
    .forEach(

      button => {

        button.onclick =
          () => {

            changeQuantity(
              button.dataset.minus,
              -1
            );
          };
      }
    );


  $$("[data-plus]")
    .forEach(

      button => {

        button.onclick =
          () => {

            changeQuantity(
              button.dataset.plus,
              1
            );
          };
      }
    );


  $$("[data-remove]")
    .forEach(

      button => {

        button.onclick =
          () => {

            removeFromCart(
              button.dataset.remove
            );
          };
      }
    );
}


/* ============================================================
   PAIEMENT COMMANDE
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
    !auth.currentUser
  ) {

    openAuth(
      "login"
    );

    return;
  }


  toast(
    "Choisissez votre mode de paiement.",
    "success"
  );


  openPage(
    "wallet"
  );
}


/* ============================================================
   MONCASH
============================================================ */

async function workerPOST(
  path,
  payload
) {

  const user =
    auth.currentUser;


  const token =
    user
      ? await user.getIdToken(
          false
        )
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


async function depositMoncash() {

  const user =
    auth.currentUser;


  if (!user) {

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
    !Number.isFinite(
      amount
    ) ||
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

    const response =
      await workerPOST(

        "/moncash/deposit",

        {

          amount:
            amount,

          currency:
            "HTG",

          userId:
            user.uid
        }
      );


    const redirectURL =

      response.redirectUrl ||

      response.paymentUrl ||

      response.url;


    if (
      redirectURL
    ) {

      window.location.href =
        redirectURL;

    } else {

      toast(
        "Paiement MonCash initialisé.",
        "success"
      );
    }


  } catch (error) {

    console.error(
      "MonCash dépôt:",
      error
    );


    toast(
      error.message,
      "error"
    );


  } finally {

    setBusy(
      button,
      false
    );
  }
}


/* ============================================================
   RETRAIT MONCASH
============================================================ */

async function withdrawMoncash() {

  const user =
    auth.currentUser;


  if (!user) {

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
      ?.trim();


  if (
    !Number.isFinite(
      amount
    ) ||
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

    await workerPOST(

      "/moncash/withdraw",

      {

        amount:
          amount,

        phone:
          phone,

        currency:
          "HTG",

        userId:
          user.uid
      }
    );


    toast(
      "Demande de retrait envoyée.",
      "success"
    );


    closeModal(
      "moncashWithdrawModal"
    );


  } catch (error) {

    console.error(
      "Retrait MonCash:",
      error
    );


    toast(
      error.message,
      "error"
    );


  } finally {

    setBusy(
      button,
      false
    );
  }
}


/* ============================================================
   WALLET
============================================================ */

function setupWallet() {

  $("moncashDepositBtn")
    ?.addEventListener(

      "click",

      () => {

        if (
          auth.currentUser
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
          auth.currentUser
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

      depositMoncash
    );


  $("startMoncashWithdrawBtn")
    ?.addEventListener(

      "click",

      withdrawMoncash
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
              t("operationUnavailable")
            );
          }
        );
    }
  );
}


/* ============================================================
   PROFIL UI
============================================================ */

function renderProfile() {

  const profile =
    state.profile ||
    {};


  const user =
    auth.currentUser;


  const name =

    profile.name ||

    user
      ?.email
      ?.split("@")[0] ||

    "Mystro-Shop";


  const email =

    profile.email ||

    user?.email ||

    "";


  const role =

    isSeller()
      ? t("seller")
      : t("buyer");


  const initial =
    String(
      name
    )
      .charAt(0)
      .toUpperCase();


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


  const balance =
    Number(
      profile.balance
    ) ||
    0;


  if (
    $("walletBalance")
  ) {

    $("walletBalance")
      .textContent =
      money(
        balance,
        "HTG"
      );
  }


  if (
    $("profileBalance")
  ) {

    $("profileBalance")
      .textContent =
      money(
        balance,
        "HTG"
      );
  }
}


/* ============================================================
   STATISTIQUES
============================================================ */

function refreshStats() {

  const totalProducts =
    state.products.length;


  if (
    $("dashboardProducts")
  ) {

    $("dashboardProducts")
      .textContent =
      totalProducts;
  }


  if (
    $("statProducts")
  ) {

    $("statProducts")
      .textContent =
      totalProducts;
  }


  if (
    $("dashboardOrders")
  ) {

    $("dashboardOrders")
      .textContent =
      "0";
  }


  if (
    $("dashboardClients")
  ) {

    $("dashboardClients")
      .textContent =
      "0";
  }


  if (
    $("dashboardRevenue")
  ) {

    $("dashboardRevenue")
      .textContent =
      money(
        0
      );
  }


  if (
    $("statSales")
  ) {

    $("statSales")
      .textContent =
      "0";
  }


  if (
    $("statClients")
  ) {

    $("statClients")
      .textContent =
      "0";
  }


  if (
    $("statRevenue")
  ) {

    $("statRevenue")
      .textContent =
      money(
        0
      );
  }


  setupCharts();
}


/* ============================================================
   CHARTS
============================================================ */

function setupCharts() {

  if (
    typeof Chart ===
    "undefined"
  ) {

    return;
  }


  const salesCanvas =
    $("salesChart");


  if (
    salesCanvas &&
    !state.charts.sales
  ) {

    state.charts.sales =
      new Chart(

        salesCanvas,

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
                  "Ventes",

                data:
                  [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
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


  const activityCanvas =
    $("activityChart");


  if (
    activityCanvas &&
    !state.charts.activity
  ) {

    state.charts.activity =
      new Chart(

        activityCanvas,

        {

          type:
            "doughnut",

          data: {

            labels: [

              "Produits",

              "Ventes",

              "Clients"
            ],

            datasets: [

              {

                data: [

                  state.products.length,

                  0,

                  0
                ]
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
   CHAT
============================================================ */

function addChatMessage(
  container,
  message,
  type
) {

  if (
    !container ||
    !message
  ) {

    return;
  }


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    `chat-message ${type}`;


  bubble.textContent =
    message;


  container.appendChild(
    bubble
  );


  container.scrollTop =
    container.scrollHeight;
}


function setupChat() {

  function sendMessage() {

    const input =
      $("chatInput");


    const message =
      input
        ?.value
        ?.trim();


    if (!message) {

      return;
    }


    addChatMessage(

      $("chatMessages"),

      message,

      "user"
    );


    input.value =
      "";
  }


  $("sendChatBtn")
    ?.addEventListener(

      "click",

      sendMessage
    );


  $("chatInput")
    ?.addEventListener(

      "keydown",

      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          sendMessage();
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
    text.includes(
      "moncash"
    )
  ) {

    return (
      "Pour MonCash, ouvrez Portefeuille puis choisissez Dépôt ou Retrait MonCash."
    );
  }


  if (
    text.includes(
      "vann"
    ) ||

    text.includes(
      "vendre"
    ) ||

    text.includes(
      "sell"
    ) ||

    text.includes(
      "vender"
    )
  ) {

    return (
      "Ouvrez la page Vendre, remplissez le formulaire, choisissez une photo puis publiez le produit."
    );
  }


  if (
    text.includes(
      "panier"
    ) ||

    text.includes(
      "panyen"
    ) ||

    text.includes(
      "cart"
    )
  ) {

    return (
      "Vous pouvez ajouter vos produits au panier avec le bouton +."
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


  function sendAssistant() {

    const input =
      $("assistantInput");


    const message =
      input
        ?.value
        ?.trim();


    if (!message) {

      return;
    }


    const container =
      $("assistantMessages");


    addChatMessage(

      container,

      message,

      "user"
    );


    input.value =
      "";


    setTimeout(

      () => {

        addChatMessage(

          container,

          assistantReply(
            message
          ),

          "assistant"
        );
      },

      250
    );
  }


  $("assistantSendBtn")
    ?.addEventListener(

      "click",

      sendAssistant
    );


  $("assistantInput")
    ?.addEventListener(

      "keydown",

      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          sendAssistant();
        }
      }
    );
}


/* ============================================================
   DEVISES + LANGUES
============================================================ */

function setupSelectors() {

  const currency =
    $("currencySelector");


  if (currency) {

    currency.value =
      state.currency;


    currency.addEventListener(

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
      }
    );
  }


  const language =
    $("languageSelector");


  if (language) {

    language.value =
      state.language;


    language.addEventListener(

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
   MODALES GLOBALES
============================================================ */

function setupGlobalUI() {

  document.addEventListener(

    "click",

    event => {

      const button =
        event.target.closest(
          "[data-close-modal]"
        );


      if (button) {

        closeModal(
          button.dataset
            .closeModal
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
   AUTH STATE
============================================================ */

onAuthStateChanged(

  auth,

  async user => {

    state.user =
      user;


    if (user) {

      state.profile =
        await loadProfile(
          user
        );


      if (
        $("welcomePage")
      ) {

        $("welcomePage")
          .style.display =
          "none";
      }


      if (
        $("mainApp")
      ) {

        $("mainApp")
          .style.display =
          "block";
      }


      renderProfile();


      await loadProducts();


    } else {

      state.profile =
        null;


      if (
        $("welcomePage")
      ) {

        $("welcomePage")
          .style.display =
          "";
      }


      if (
        $("mainApp")
      ) {

        $("mainApp")
          .style.display =
          "none";
      }


      state.products =
        DEMO_PRODUCTS;


      state.filteredProducts =
        [
          ...DEMO_PRODUCTS
        ];


      renderProducts();
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

      navigator.serviceWorker

        .register(
          "./service-worker.js"
        )

        .catch(

          error => {

            console.warn(
              "Service Worker:",
              error
            );
          }
        );
    }
  );
}


/* ============================================================
   INITIALISATION
============================================================ */

function initMystroShop() {

  console.log(
    "Mystro-Shop démarrage"
  );


  createAuthModal();


  setupNavigation();


  setupAuthButtons();


  setupSelectors();


  setupSearch();


  setupImagePreview();


  setupProductPublishing();


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


  console.log(
    "Mystro-Shop prêt"
  );
}


/* ============================================================
   DÉMARRAGE UNIQUE
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(

    "DOMContentLoaded",

    initMystroShop,

    {
      once:
        true
    }
  );

} else {

  initMystroShop();
   }

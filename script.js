/* ============================================================
   MYSTRO-SHOP - SCRIPT.JS COMPLET
   Compatible avec index.html + style.css fournis
============================================================ */

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
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ============================================================
   1. FIREBASE
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* ============================================================
   2. SUPABASE
============================================================ */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    accessToken: async () => {
      const user = auth.currentUser;

      return user
        ? await user.getIdToken(false)
        : null;
    }
  }
);


/* ============================================================
   3. API MYSTRO-SHOP
============================================================ */

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";


/* ============================================================
   4. CONSTANTES
============================================================ */

const COMMISSION_RATE = 0.10;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const rates = {
  USD: 1,
  HTG: 130,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79,
  DOP: 58,
  XOF: 600
};


/* ============================================================
   5. ÉTAT GLOBAL
============================================================ */

let currentUser = null;
let currentProfile = null;

let products = [];
let cart = [];

let currentCurrency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let currentLanguage =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";

let salesChartInstance = null;
let activityChartInstance = null;


/* ============================================================
   6. DOM
============================================================ */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


/* ============================================================
   7. NOTIFICATIONS
============================================================ */

function showToast(
  message,
  type = "info"
) {

  let toast =
    $("#mystroToast");

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
        position: "fixed",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        zIndex: "999999",
        padding: "12px 16px",
        borderRadius: "12px",
        color: "white",
        fontWeight: "800",
        maxWidth: "90vw",
        textAlign: "center",
        boxShadow:
          "0 12px 30px rgba(0,0,0,.22)"
      }
    );

    document.body
      .appendChild(toast);
  }

  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
    info: "#3159db"
  };

  toast.style.background =
    colors[type] ||
    colors.info;

  toast.textContent =
    message;

  toast.style.display =
    "block";

  clearTimeout(
    showToast._timer
  );

  showToast._timer =
    setTimeout(
      () => {
        toast.style.display =
          "none";
      },
      3200
    );
}


/* ============================================================
   8. MODALES
============================================================ */

function openModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {
    modal.classList.add(
      "open"
    );
  }
}


function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {
    modal.classList.remove(
      "open"
    );
  }
}


/* ============================================================
   9. NAVIGATION
============================================================ */

function openPage(
  pageName
) {

  $$(".app-page")
    .forEach(
      page => {

        page.classList.remove(
          "active-page"
        );

        page.style.display =
          "none";
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

  $$("[data-page]")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageName
        );
      }
    );

  $("#mobileNav")
    ?.classList.remove(
      "open"
    );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ============================================================
   10. MENU
============================================================ */

function setupMenu() {

  const btn =
    $("#menuBtn");

  const nav =
    $("#mobileNav");

  if (!btn || !nav) {
    return;
  }

  btn.addEventListener(
    "click",
    () => {
      nav.classList.toggle(
        "open"
      );
    }
  );
}


/* ============================================================
   11. NAVIGATION BOUTONS
============================================================ */

function setupNavigation() {

  $$("[data-page]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openPage(
              button.dataset.page
            );
          }
        );
      }
    );
}


/* ============================================================
   12. DEVISES
============================================================ */

function convertCurrency(
  amount,
  from,
  to
) {

  const value =
    Number(amount);

  if (
    !Number.isFinite(value) ||
    !rates[from] ||
    !rates[to]
  ) {
    return value || 0;
  }

  return (
    value /
    rates[from]
  ) *
  rates[to];
}


function formatCurrency(
  amount,
  currency =
    currentCurrency
) {

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }
    ).format(
      Number(amount) || 0
    );

  } catch {

    return (
      `${Number(amount || 0).toFixed(2)} ${currency}`
    );
  }
}


function setupCurrency() {

  const selector =
    $("#currencySelector");

  if (!selector) {
    return;
  }

  selector.value =
    currentCurrency;

  selector.addEventListener(
    "change",
    () => {

      currentCurrency =
        selector.value;

      localStorage.setItem(
        "mystroCurrency",
        currentCurrency
      );

      renderProducts();
      renderCart();
    }
  );
}


/* ============================================================
   13. LANGUES
============================================================ */

const translations = {

  fr: {
    authWelcome:
      "Achetez, vendez et développez votre activité.",

    login:
      "Se connecter",

    register:
      "S'inscrire",

    internationalMarket:
      "Marché international",

    search:
      "Rechercher sur Mystro-Shop...",

    home:
      "Accueil",

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

    chat:
      "Chat",

    logout:
      "Déconnexion",

    welcome:
      "Bienvenue à Mystro-Shop",

    welcomeSubtitle:
      "Achetez et vendez facilement partout dans le monde.",

    discoverProducts:
      "Découvrir les produits",

    sellProduct:
      "Vendre un produit",

    popularProducts:
      "Produits populaires",

    productsSubtitle:
      "Découvrez les produits disponibles.",

    publishProduct:
      "Publier un produit"
  },


  ht: {
    authWelcome:
      "Achte, vann epi devlope aktivite ou.",

    login:
      "Konekte",

    register:
      "Enskri",

    internationalMarket:
      "Mache entènasyonal",

    search:
      "Chèche sou Mystro-Shop...",

    home:
      "Akèy",

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

    chat:
      "Mesaj",

    logout:
      "Dekonekte",

    welcome:
      "Byenveni nan Mystro-Shop",

    welcomeSubtitle:
      "Achte epi vann fasil atravè mond lan.",

    discoverProducts:
      "Dekouvri pwodwi",

    sellProduct:
      "Vann yon pwodwi",

    popularProducts:
      "Pwodwi popilè",

    productsSubtitle:
      "Dekouvri pwodwi ki disponib yo.",

    publishProduct:
      "Pibliye yon pwodwi"
  },


  en: {
    authWelcome:
      "Buy, sell and grow your business.",

    login:
      "Log in",

    register:
      "Sign up",

    internationalMarket:
      "International marketplace",

    search:
      "Search on Mystro-Shop...",

    home:
      "Home",

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

    chat:
      "Chat",

    logout:
      "Log out",

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

    productsSubtitle:
      "Discover available products.",

    publishProduct:
      "Publish a product"
  },


  es: {
    authWelcome:
      "Compra, vende y desarrolla tu actividad.",

    login:
      "Iniciar sesión",

    register:
      "Registrarse",

    internationalMarket:
      "Mercado internacional",

    search:
      "Buscar en Mystro-Shop...",

    home:
      "Inicio",

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

    chat:
      "Chat",

    logout:
      "Cerrar sesión",

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

    productsSubtitle:
      "Descubre los productos disponibles.",

    publishProduct:
      "Publicar un producto"
  }
};


function applyLanguage() {

  const dict =
    translations[
      currentLanguage
    ] ||
    translations.fr;

  document.documentElement.lang =
    currentLanguage;

  $$("[data-i18n]")
    .forEach(
      element => {

        const key =
          element.dataset.i18n;

        if (
          dict[key] !==
          undefined
        ) {
          element.textContent =
            dict[key];
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
          dict[key] !==
          undefined
        ) {
          element.placeholder =
            dict[key];
        }
      }
    );
}


function setupLanguage() {

  const selector =
    $("#languageSelector");

  if (!selector) {
    return;
  }

  selector.value =
    currentLanguage;

  applyLanguage();

  selector.addEventListener(
    "change",
    () => {

      currentLanguage =
        selector.value;

      localStorage.setItem(
        "mystroLanguage",
        currentLanguage
      );

      applyLanguage();
      renderProducts();
    }
  );
}


/* ============================================================
   14. PROFIL UTILISATEUR
============================================================ */

function getInitials(
  name = "MS"
) {

  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        word =>
          word[0]
            ?.toUpperCase() ||
          ""
      )
      .join("") ||
    "MS"
  );
}


function normalizeRole(
  role
) {

  const value =
    String(
      role ||
      "buyer"
    )
      .toLowerCase();

  return (
    value === "seller" ||
    value === "vendeur"
  )
    ? "seller"
    : "buyer";
}


function isSeller() {

  return (
    normalizeRole(
      currentProfile?.role
    ) ===
    "seller"
  );
}


async function loadUserProfile(
  user
) {

  const ref =
    doc(
      db,
      "users",
      user.uid
    );

  let snap =
    await getDoc(ref);

  if (!snap.exists()) {

    await setDoc(
      ref,
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

        balance:
          0,

        createdAt:
          serverTimestamp()
      }
    );

    snap =
      await getDoc(ref);
  }

  currentProfile =
    snap.data();

  updateProfileUI();
}


function updateProfileUI() {

  const name =
    currentProfile?.name ||
    currentUser?.email
      ?.split("@")[0] ||
    "Utilisateur";

  const email =
    currentProfile?.email ||
    currentUser?.email ||
    "—";

  const role =
    normalizeRole(
      currentProfile?.role
    ) ===
    "seller"
      ? "Vendeur"
      : "Acheteur";

  const balance =
    Number(
      currentProfile?.balance ||
      0
    );

  const initials =
    getInitials(name);


  [
    "#userInitials",
    "#profileAvatar"
  ]
    .forEach(
      selector => {

        const element =
          $(selector);

        if (element) {
          element.textContent =
            initials;
        }
      }
    );


  [
    "#profileName",
    "#profileNameModal"
  ]
    .forEach(
      selector => {

        const element =
          $(selector);

        if (element) {
          element.textContent =
            name;
        }
      }
    );


  [
    "#profileEmail",
    "#profileEmailModal"
  ]
    .forEach(
      selector => {

        const element =
          $(selector);

        if (element) {
          element.textContent =
            email;
        }
      }
    );


  if ($("#profileRole")) {
    $("#profileRole")
      .textContent =
      role;
  }

  if ($("#profileBalance")) {
    $("#profileBalance")
      .textContent =
      formatCurrency(
        balance,
        "HTG"
      );
  }

  if ($("#walletBalance")) {
    $("#walletBalance")
      .textContent =
      formatCurrency(
        balance,
        "HTG"
      );
  }
}


/* ============================================================
   15. BOUTON PROFIL
============================================================ */

function setupProfileButton() {

  $("#profileBtn")
    ?.addEventListener(
      "click",
      () => {

        updateProfileUI();

        openModal(
          "profileModal"
        );
      }
    );
}


/* ============================================================
   16. NOTIFICATIONS
============================================================ */

function setupNotifications() {

  $("#notificationBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "Aucune nouvelle notification.",
          "info"
        );
      }
    );
}


/* ============================================================
   17. FERMETURE MODALES
============================================================ */

function setupModalCloseButtons() {

  $$("[data-close-modal]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            closeModal(
              button.dataset
                .closeModal
            );
          }
        );
      }
    );


  $$(".mystro-modal")
    .forEach(
      modal => {

        modal.addEventListener(
          "click",
          event => {

            if (
              event.target ===
              modal
            ) {
              modal.classList.remove(
                "open"
              );
            }
          }
        );
      }
    );
}


/* ============================================================
   18. PRODUITS DE DÉMONSTRATION
============================================================ */

const demoProducts = [

  {
    id: "demo1",
    name: "Sac premium",
    category: "Mode",
    price: 45,
    currency: "USD",
    stock: 5,
    emoji: "👜"
  },

  {
    id: "demo2",
    name: "Écouteurs Bluetooth",
    category: "Electronique",
    price: 35,
    currency: "USD",
    stock: 8,
    emoji: "🎧"
  },

  {
    id: "demo3",
    name: "Parfum",
    category: "Cosmetique",
    price: 2500,
    currency: "HTG",
    stock: 7,
    emoji: "🌸"
  }
];


/* ============================================================
   19. CARTE PRODUIT
============================================================ */

function productPriceText(
  product
) {

  const converted =
    convertCurrency(
      product.price,
      product.currency ||
      "HTG",
      currentCurrency
    );

  return formatCurrency(
    converted,
    currentCurrency
  );
}


function createProductCard(
  product
) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "product-card";


  const image =
    document.createElement(
      "div"
    );

  image.className =
    "product-image";


  if (product.imageUrl) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      product.imageUrl;

    img.alt =
      product.name ||
      "Produit";

    img.loading =
      "lazy";

    image.appendChild(img);

  } else {

    image.textContent =
      product.emoji ||
      "📦";
  }


  const body =
    document.createElement(
      "div"
    );

  body.className =
    "product-body";


  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    product.name ||
    "Produit";


  const price =
    document.createElement(
      "strong"
    );

  price.className =
    "product-price";

  price.textContent =
    productPriceText(
      product
    );


  const stock =
    document.createElement(
      "small"
    );

  stock.textContent =
    `Stock : ${
      Number(
        product.stock ||
        0
      )
    }`;


  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "primary-btn";


  button.textContent =
    currentLanguage === "ht"
      ? "Ajoute nan panyen"
      : currentLanguage === "en"
        ? "Add to cart"
        : currentLanguage === "es"
          ? "Añadir al carrito"
          : "Ajouter au panier";


  button.addEventListener(
    "click",
    () => {

      addToCart(
        product
      );
    }
  );


  body.append(
    title,
    price,
    stock,
    button
  );

  card.append(
    image,
    body
  );

  return card;
}


/* ============================================================
   20. AFFICHAGE PRODUITS
============================================================ */

function renderProducts(
  list = products
) {

  [
    $("#productsContainer"),
    $("#productsGrid")
  ]
    .forEach(
      container => {

        if (!container) {
          return;
        }

        container
          .replaceChildren();


        list.forEach(
          product => {

            container
              .appendChild(
                createProductCard(
                  product
                )
              );
          }
        );
      }
    );
}


/* ============================================================
   21. CHARGEMENT FIRESTORE
============================================================ */

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


    const snap =
      await getDocs(q);


    const remote =
      snap.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    products =
      remote.length
        ? remote
        : [...demoProducts];

  } catch (error) {

    console.error(
      "Chargement produits:",
      error
    );

    products =
      [...demoProducts];
  }


  renderProducts();

  updateStatistics();
}


/* ============================================================
   22. APERÇU PHOTO
============================================================ */

function setupImagePreview() {

  $("#productImage")
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target
            .files?.[0];

        const preview =
          $("#productImagePreview");

        if (!preview) {
          return;
        }

        preview
          .replaceChildren();


        if (!file) {
          return;
        }


        if (
          !ALLOWED_IMAGE_TYPES
            .includes(
              file.type
            )
        ) {

          showToast(
            "Utilisez une image JPEG, PNG ou WebP.",
            "warning"
          );

          event.target.value =
            "";

          return;
        }


        if (
          file.size >
          MAX_IMAGE_SIZE
        ) {

          showToast(
            "Image trop grande. Maximum 5 Mo.",
            "warning"
          );

          event.target.value =
            "";

          return;
        }


        const img =
          document.createElement(
            "img"
          );


        const url =
          URL.createObjectURL(
            file
          );


        img.src =
          url;


        img.onload =
          () => {

            URL.revokeObjectURL(
              url
            );
          };


        preview
          .appendChild(img);
      }
    );
}


/* ============================================================
   23. UPLOAD IMAGE SUPABASE
============================================================ */

async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "AUTH_REQUIRED"
    );
  }


  const ext =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    )
      .toLowerCase();


  const safeExt =
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ]
      .includes(ext)
      ? ext
      : "jpg";


  const unique =
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;


  const path =
    `${currentUser.uid}/${Date.now()}-${unique}.${safeExt}`;


  const {
    error
  } =
    await supabase
      .storage
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


  if (error) {
    throw error;
  }


  const {
    data
  } =
    supabase
      .storage
      .from(
        "product-images"
      )
      .getPublicUrl(
        path
      );


  if (!data?.publicUrl) {

    throw new Error(
      "PUBLIC_URL_NOT_FOUND"
    );
  }


  return {
    imageUrl:
      data.publicUrl,

    imagePath:
      path
  };
}


/* ============================================================
   24. PUBLICATION PRODUIT
============================================================ */

async function publishProduct(
  event
) {

  event.preventDefault();


  if (!currentUser) {

    showToast(
      "Connectez-vous avant de publier.",
      "warning"
    );

    return;
  }


  if (!isSeller()) {

    showToast(
      "Cette fonction est réservée aux comptes vendeurs.",
      "warning"
    );

    return;
  }


  const name =
    $("#productName")
      ?.value
      .trim();


  const category =
    $("#productCategory")
      ?.value ||
    "Autres";


  const currency =
    $("#productCurrency")
      ?.value ||
    "HTG";


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
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 1 ||
    !description ||
    !file
  ) {

    showToast(
      "Complétez correctement tous les champs et ajoutez une photo.",
      "warning"
    );

    return;
  }


  const button =
    $("#publishProductBtn");


  const oldText =
    button?.textContent ||
    "Publier le produit";


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Publication...";
    }


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

        currency,

        price,

        stock,

        description,

        imageUrl:
          uploaded.imageUrl,

        imagePath:
          uploaded.imagePath,

        commissionRate:
          COMMISSION_RATE,

        active:
          true,

        createdAt:
          serverTimestamp()
      }
    );


    $("#productForm")
      ?.reset();


    $("#productImagePreview")
      ?.replaceChildren();


    await loadProducts();


    showToast(
      "Produit publié avec succès.",
      "success"
    );


    openPage(
      "products"
    );

  } catch (error) {

    console.error(
      "Publication produit:",
      error
    );


    showToast(
      "Publication impossible. Vérifiez Firebase/Supabase et les autorisations du bucket.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        oldText;
    }
  }
}


function setupProductForm() {

  $("#productForm")
    ?.addEventListener(
      "submit",
      publishProduct
    );
}


/* ============================================================
   25. PANIER
============================================================ */

function loadCart() {

  try {

    cart =
      JSON.parse(
        localStorage.getItem(
          "mystroCart"
        ) ||
        "[]"
      );

  } catch {

    cart = [];
  }
}


function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(cart)
  );
}


function addToCart(
  product
) {

  const existing =
    cart.find(
      item =>
        item.id ===
        product.id
    );


  if (existing) {

    existing.quantity +=
      1;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });
  }


  saveCart();

  renderCart();


  showToast(
    "Produit ajouté au panier.",
    "success"
  );
}


function removeCartItem(
  id
) {

  cart =
    cart.filter(
      item =>
        item.id !== id
    );

  saveCart();

  renderCart();
}


function renderCart() {

  const count =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity ||
          1
        ),
      0
    );


  if ($("#cartCount")) {

    $("#cartCount")
      .textContent =
      String(count);
  }


  const container =
    $("#cartItems");


  if (!container) {
    return;
  }


  container
    .replaceChildren();


  if (!cart.length) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "empty-state";

    empty.textContent =
      "🛒 Votre panier est vide.";

    container
      .appendChild(empty);

  } else {

    cart.forEach(
      item => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "cart-item";


        const title =
          document.createElement(
            "strong"
          );

        title.textContent =
          `${item.name} × ${item.quantity}`;


        const price =
          document.createElement(
            "span"
          );


        price.textContent =
          productPriceText({
            ...item,

            price:
              Number(
                item.price
              ) *
              Number(
                item.quantity
              )
          });


        const remove =
          document.createElement(
            "button"
          );

        remove.type =
          "button";

        remove.textContent =
          "Supprimer";


        remove.addEventListener(
          "click",
          () => {

            removeCartItem(
              item.id
            );
          }
        );


        row.append(
          title,
          price,
          remove
        );


        container
          .appendChild(row);
      }
    );
  }


  const subtotal =
    cart.reduce(
      (
        sum,
        item
      ) => {

        return (
          sum +
          convertCurrency(
            Number(
              item.price
            ) *
            Number(
              item.quantity
            ),

            item.currency ||
            "HTG",

            currentCurrency
          )
        );
      },
      0
    );


  const fees =
    subtotal *
    COMMISSION_RATE;


  const total =
    subtotal +
    fees;


  if ($("#cartSubtotal")) {

    $("#cartSubtotal")
      .textContent =
      formatCurrency(
        subtotal,
        currentCurrency
      );
  }


  if ($("#cartFees")) {

    $("#cartFees")
      .textContent =
      formatCurrency(
        fees,
        currentCurrency
      );
  }


  if ($("#cartTotal")) {

    $("#cartTotal")
      .textContent =
      formatCurrency(
        total,
        currentCurrency
      );
  }
}


/* ============================================================
   26. CHECKOUT
============================================================ */

function setupCheckout() {

  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      () => {

        if (!cart.length) {

          showToast(
            "Votre panier est vide.",
            "warning"
          );

          return;
        }


        showToast(
          "Paiement de commande : connexion serveur requise avant production.",
          "info"
        );
      }
    );
}


/* ============================================================
   27. MONCASH MODALES
============================================================ */

function setupMonCashModals() {

  $("#moncashDepositBtn")
    ?.addEventListener(
      "click",
      () => {

        if (!currentUser) {

          showToast(
            "Connectez-vous d'abord.",
            "warning"
          );

          return;
        }


        openModal(
          "moncashDepositModal"
        );
      }
    );


  $("#moncashWithdrawBtn")
    ?.addEventListener(
      "click",
      () => {

        if (!currentUser) {

          showToast(
            "Connectez-vous d'abord.",
            "warning"
          );

          return;
        }


        openModal(
          "moncashWithdrawModal"
        );
      }
    );
}


/* ============================================================
   28. MONCASH DÉPÔT
============================================================ */

async function startMonCashDeposit() {

  if (!currentUser) {

    showToast(
      "Connectez-vous.",
      "warning"
    );

    return;
  }


  const amount =
    Number(
      $("#moncashDepositAmount")
        ?.value
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Montant invalide.",
      "warning"
    );

    return;
  }


  try {

    const token =
      await currentUser
        .getIdToken(true);


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
              `Bearer ${token}`
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
      "MonCash dépôt:",
      error
    );


    showToast(
      "Dépôt MonCash impossible.",
      "error"
    );
  }
}


/* ============================================================
   29. MONCASH RETRAIT
============================================================ */

async function startMonCashWithdraw() {

  if (!currentUser) {

    showToast(
      "Connectez-vous.",
      "warning"
    );

    return;
  }


  const amount =
    Number(
      $("#moncashWithdrawAmount")
        ?.value
    );


  let receiver =
    String(
      $("#moncashWithdrawPhone")
        ?.value ||
      ""
    )
      .replace(
        /\D/g,
        ""
      );


  if (
    receiver.length ===
    8
  ) {

    receiver =
      `509${receiver}`;
  }


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Montant invalide.",
      "warning"
    );

    return;
  }


  if (
    !/^509\d{8}$/.test(
      receiver
    )
  ) {

    showToast(
      "Numéro MonCash invalide.",
      "warning"
    );

    return;
  }


  try {

    const token =
      await currentUser
        .getIdToken(true);


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
              receiver
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


    closeModal(
      "moncashWithdrawModal"
    );


    showToast(
      "Demande de retrait envoyée.",
      "success"
    );

  } catch (error) {

    console.error(
      "MonCash retrait:",
      error
    );


    showToast(
      "Retrait MonCash impossible.",
      "error"
    );
  }
}


/* ============================================================
   30. ACTIONS MONCASH
============================================================ */

function setupMonCashActions() {

  $("#startMoncashDepositBtn")
    ?.addEventListener(
      "click",
      startMonCashDeposit
    );


  $("#startMoncashWithdrawBtn")
    ?.addEventListener(
      "click",
      startMonCashWithdraw
    );
}


/* ============================================================
   31. AUTRES PAIEMENTS
============================================================ */

function setupOtherPaymentMethods() {

  $("#natcashBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "NatCash nécessite encore une intégration API officielle.",
          "info"
        );
      }
    );


  $("#bankBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "BNC / Unibank : intégration bancaire à connecter.",
          "info"
        );
      }
    );


  $("#transferBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "MoneyGram / Ria : intégration partenaire requise.",
          "info"
        );
      }
    );


  $("#exchangeBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "Utilisez le sélecteur de devise en haut pour convertir l'affichage.",
          "info"
        );
      }
    );
}


/* ============================================================
   32. RECHERCHE
============================================================ */

function setupSearch() {

  $("#searchInput")
    ?.addEventListener(
      "input",
      event => {

        const term =
          event.target.value
            .trim()
            .toLowerCase();


        if (!term) {

          renderProducts();

          return;
        }


        const filtered =
          products.filter(
            product =>

              `${product.name || ""} ${product.category || ""}`
                .toLowerCase()
                .includes(term)
          );


        renderProducts(
          filtered
        );


        openPage(
          "products"
        );
      }
    );
}


/* ============================================================
   33. CHAT
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
    !messages
  ) {
    return;
  }


  const send =
    () => {

      const text =
        input.value
          .trim();


      if (!text) {
        return;
      }


      const msg =
        document.createElement(
          "div"
        );


      msg.className =
        "assistant-message";


      msg.textContent =
        text;


      messages
        .appendChild(msg);


      input.value =
        "";


      messages.scrollTop =
        messages.scrollHeight;
    };


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

        send();
      }
    }
  );
}


/* ============================================================
   34. ASSISTANT
============================================================ */

function assistantReply(
  message
) {

  const text =
    message
      .toLowerCase();


  if (
    text.includes("moncash") ||
    text.includes("dépôt") ||
    text.includes("depot")
  ) {

    return (
      "Ouvrez Portefeuille puis Dépôt MonCash."
    );
  }


  if (
    text.includes("retrait") ||
    text.includes("withdraw")
  ) {

    return (
      "Ouvrez Portefeuille puis Retrait MonCash."
    );
  }


  if (
    text.includes("vendre") ||
    text.includes("vann") ||
    text.includes("sell")
  ) {

    return (
      "Ouvrez Vendre, ajoutez le produit, la photo, le prix et la devise puis publiez."
    );
  }


  if (
    text.includes("commission") ||
    text.includes("10%")
  ) {

    return (
      "Mystro-Shop prévoit une commission de 10 % sur chaque vente finalisée."
    );
  }


  if (
    text.includes("langue") ||
    text.includes("language")
  ) {

    return (
      "Choisissez Français, Kreyòl, Español ou English dans le sélecteur en haut."
    );
  }


  return (
    "Je peux vous aider avec les produits, le panier, les devises, le portefeuille et la navigation."
  );
}


function setupAssistant() {

  const panel =
    $("#assistantPanel");


  $("#assistantBtn")
    ?.addEventListener(
      "click",
      () => {

        panel
          ?.classList.toggle(
            "open"
          );
      }
    );


  $("#assistantCloseBtn")
    ?.addEventListener(
      "click",
      () => {

        panel
          ?.classList.remove(
            "open"
          );
      }
    );


  const input =
    $("#assistantInput");

  const sendButton =
    $("#assistantSendBtn");

  const messages =
    $("#assistantMessages");


  if (
    !input ||
    !sendButton ||
    !messages
  ) {
    return;
  }


  const send =
    () => {

      const text =
        input.value
          .trim();


      if (!text) {
        return;
      }


      const userMsg =
        document.createElement(
          "div"
        );


      userMsg.className =
        "assistant-message";


      userMsg.textContent =
        text;


      messages
        .appendChild(
          userMsg
        );


      input.value =
        "";


      setTimeout(
        () => {

          const bot =
            document.createElement(
              "div"
            );


          bot.className =
            "assistant-message";


          bot.textContent =
            assistantReply(
              text
            );


          messages
            .appendChild(
              bot
            );


          messages.scrollTop =
            messages.scrollHeight;

        },
        200
      );
    };


  sendButton
    .addEventListener(
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

        send();
      }
    }
  );
}


/* ============================================================
   35. STATISTIQUES
============================================================ */

function updateStatistics() {

  const totalProducts =
    products.length;


  if ($("#statProducts")) {

    $("#statProducts")
      .textContent =
      String(
        totalProducts
      );
  }


  if ($("#dashboardProducts")) {

    $("#dashboardProducts")
      .textContent =
      String(
        totalProducts
      );
  }


  if ($("#statSales")) {

    $("#statSales")
      .textContent =
      "0";
  }


  if ($("#statClients")) {

    $("#statClients")
      .textContent =
      "0";
  }


  if ($("#statRevenue")) {

    $("#statRevenue")
      .textContent =
      "0 HTG";
  }


  if ($("#dashboardRevenue")) {

    $("#dashboardRevenue")
      .textContent =
      "0 HTG";
  }


  if ($("#dashboardOrders")) {

    $("#dashboardOrders")
      .textContent =
      "0";
  }


  if ($("#dashboardClients")) {

    $("#dashboardClients")
      .textContent =
      "0";
  }


  renderCharts();
}


/* ============================================================
   36. GRAPHIQUES
============================================================ */

function renderCharts() {

  if (!window.Chart) {
    return;
  }


  const salesCanvas =
    $("#salesChart");


  if (salesCanvas) {

    salesChartInstance
      ?.destroy();


    salesChartInstance =
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

                data: [
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ],

                tension:
                  0.35,

                fill:
                  false
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
    $("#activityChart");


  if (activityCanvas) {

    activityChartInstance
      ?.destroy();


    activityChartInstance =
      new Chart(
        activityCanvas,
        {

          type:
            "doughnut",

          data: {

            labels: [
              "Produits",
              "Commandes",
              "Clients"
            ],

            datasets: [
              {

                data: [
                  Math.max(
                    products.length,
                    1
                  ),
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
   37. CONNEXION / INSCRIPTION
============================================================ */

function createAuthModal(
  mode
) {

  $("#dynamicAuthModal")
    ?.remove();


  const isLogin =
    mode ===
    "login";


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "dynamicAuthModal";


  modal.className =
    "mystro-modal open";


  modal.innerHTML =
    `
    <div class="mystro-modal-card">

      <button
        type="button"
        class="modal-close"
        id="dynamicAuthClose"
      >
        ×
      </button>

      <h2>
        ${
          isLogin
            ? "Se connecter"
            : "Créer un compte"
        }
      </h2>

      ${
        !isLogin
          ? `
          <div class="payment-field">

            <label>
              Nom complet
            </label>

            <input
              id="dynamicAuthName"
              type="text"
              autocomplete="name"
            >

          </div>

          <div class="payment-field">

            <label>
              Type de compte
            </label>

            <select
              id="dynamicAuthRole"
            >

              <option value="buyer">
                Acheteur
              </option>

              <option value="seller">
                Vendeur
              </option>

            </select>

          </div>
          `
          : ""
      }

      <div class="payment-field">

        <label>
          Email
        </label>

        <input
          id="dynamicAuthEmail"
          type="email"
          autocomplete="email"
        >

      </div>

      <div class="payment-field">

        <label>
          Mot de passe
        </label>

        <input
          id="dynamicAuthPassword"
          type="password"
          autocomplete="current-password"
        >

      </div>

      <button
        type="button"
        id="dynamicAuthSubmit"
        class="primary-btn full-width"
      >
        ${
          isLogin
            ? "Se connecter"
            : "S'inscrire"
        }
      </button>

      ${
        isLogin
          ? `
          <button
            type="button"
            id="dynamicForgotPassword"
            class="secondary-btn full-width"
            style="margin-top:10px"
          >
            Mot de passe oublié ?
          </button>
          `
          : ""
      }

    </div>
    `;


  document.body
    .appendChild(
      modal
    );


  $("#dynamicAuthClose")
    ?.addEventListener(
      "click",
      () => {

        modal.remove();
      }
    );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modal
      ) {

        modal.remove();
      }
    }
  );


  $("#dynamicAuthSubmit")
    ?.addEventListener(
      "click",
      async () => {

        const email =
          $("#dynamicAuthEmail")
            ?.value
            .trim();


        const password =
          $("#dynamicAuthPassword")
            ?.value ||
          "";


        if (
          !email ||
          password.length <
            6
        ) {

          showToast(
            "Email valide et mot de passe de 6 caractères minimum requis.",
            "warning"
          );

          return;
        }


        try {

          if (isLogin) {

            await signInWithEmailAndPassword(
              auth,
              email,
              password
            );


            showToast(
              "Connexion réussie.",
              "success"
            );

          } else {

            const name =
              $("#dynamicAuthName")
                ?.value
                .trim();


            const role =
              $("#dynamicAuthRole")
                ?.value ||
              "buyer";


            if (!name) {

              showToast(
                "Entrez votre nom.",
                "warning"
              );

              return;
            }


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

                balance:
                  0,

                createdAt:
                  serverTimestamp()
              }
            );


            showToast(
              "Compte créé avec succès.",
              "success"
            );
          }


          modal.remove();

        } catch (error) {

          console.error(
            "Authentification:",
            error
          );


          const code =
            error?.code ||
            "";


          if (
            code.includes(
              "email-already-in-use"
            )
          ) {

            showToast(
              "Cet email est déjà utilisé.",
              "warning"
            );

          } else if (
            code.includes(
              "invalid-credential"
            )
          ) {

            showToast(
              "Email ou mot de passe incorrect.",
              "error"
            );

          } else {

            showToast(
              "Authentification impossible.",
              "error"
            );
          }
        }
      }
    );


  $("#dynamicForgotPassword")
    ?.addEventListener(
      "click",
      async () => {

        const email =
          $("#dynamicAuthEmail")
            ?.value
            .trim();


        if (!email) {

          showToast(
            "Entrez votre email.",
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
            "Email de réinitialisation envoyé.",
            "success"
          );

        } catch {

          showToast(
            "Impossible d'envoyer l'email.",
            "error"
          );
        }
      }
    );
}


/* ============================================================
   38. BOUTONS AUTH
============================================================ */

function setupAuthButtons() {

  $("#welcomeLoginBtn")
    ?.addEventListener(
      "click",
      () => {

        createAuthModal(
          "login"
        );
      }
    );


  $("#welcomeRegisterBtn")
    ?.addEventListener(
      "click",
      () => {

        createAuthModal(
          "register"
        );
      }
    );
}


/* ============================================================
   39. DÉCONNEXION
============================================================ */

async function logout() {

  try {

    await signOut(
      auth
    );


    showToast(
      "Déconnexion réussie.",
      "success"
    );

  } catch {

    showToast(
      "Déconnexion impossible.",
      "error"
    );
  }
}


function setupLogout() {

  $("#logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  $("#profileLogoutBtn")
    ?.addEventListener(
      "click",
      logout
    );
}


/* ============================================================
   40. ÉTAT FIREBASE AUTH
============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user ||
      null;


    if (!user) {

      currentProfile =
        null;


      if ($("#welcomePage")) {

        $("#welcomePage")
          .style.display =
          "flex";
      }


      if ($("#mainApp")) {

        $("#mainApp")
          .style.display =
          "none";
      }


      return;
    }


    try {

      await loadUserProfile(
        user
      );

    } catch (error) {

      console.error(
        "Profil utilisateur:",
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
          "buyer",

        balance:
          0
      };


      updateProfileUI();
    }


    if ($("#welcomePage")) {

      $("#welcomePage")
        .style.display =
        "none";
    }


    if ($("#mainApp")) {

      $("#mainApp")
        .style.display =
        "block";
    }


    await loadProducts();


    openPage(
      "home"
    );
  }
);


/* ============================================================
   41. DÉMARRAGE
============================================================ */

function startMystroShop() {

  loadCart();

  setupMenu();

  setupNavigation();

  setupCurrency();

  setupLanguage();

  setupProfileButton();

  setupNotifications();

  setupModalCloseButtons();

  setupImagePreview();

  setupProductForm();

  setupCheckout();

  setupMonCashModals();

  setupMonCashActions();

  setupOtherPaymentMethods();

  setupSearch();

  setupChat();

  setupAssistant();

  setupAuthButtons();

  setupLogout();


  products =
    [...demoProducts];


  renderProducts();

  renderCart();

  updateStatistics();

  openPage(
    "home"
  );


  console.log(
    "Mystro-Shop chargé correctement."
  );
}


/* ============================================================
   42. DOM READY
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startMystroShop
  );

} else {

  startMystroShop();
}


/* ============================================================
   43. SERVICE WORKER
============================================================ */

if (
  "serviceWorker" in
  navigator
) {

  window.addEventListener(
    "load",
    async () => {

      try {

        await navigator
          .serviceWorker
          .register(
            "./service-worker.js"
          );

      } catch (error) {

        console.warn(
          "Service Worker:",
          error
        );
      }
    }
  );
}


/* ============================================================
   FIN SCRIPT.JS
============================================================ */

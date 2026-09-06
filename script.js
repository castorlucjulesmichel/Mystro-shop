/* ============================================================
   MYSTRO-SHOP
   SCRIPT.JS PROPRE ET STRUCTURÉ
   Firebase + Firestore + Supabase + MonCash
============================================================ */

/* ============================================================
   1. FIREBASE
============================================================ */

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
   2. CONFIGURATION FIREBASE
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
    SUPABASE_KEY,
    {
      accessToken: async () => {

        const user =
          auth.currentUser;

        if (!user) {
          return null;
        }

        return await user.getIdToken(false);
      }
    }
  );


/* ============================================================
   4. API MYSTRO-SHOP / MONCASH
============================================================ */

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";


/* ============================================================
   5. CONSTANTES
============================================================ */

const COMMISSION_RATE =
  0.10;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const rates = {
  HTG: 130,
  USD: 1,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79,
  DOP: 58,
  XOF: 600
};


/* ============================================================
   6. ÉTAT GLOBAL
============================================================ */

let currentUser =
  null;

let currentProfile =
  null;

let products =
  [];

let cart =
  [];

let currentCurrency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";

let currentLanguage =
  localStorage.getItem(
    "mystroLanguage"
  ) || "fr";


/* ============================================================
   7. HELPERS DOM
============================================================ */

const $ =
  selector =>
    document.querySelector(selector);

const $$ =
  selector =>
    [...document.querySelectorAll(selector)];


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

    toast.style.position =
      "fixed";

    toast.style.left =
      "50%";

    toast.style.bottom =
      "25px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "9999999";

    toast.style.padding =
      "12px 18px";

    toast.style.borderRadius =
      "14px";

    toast.style.color =
      "#ffffff";

    toast.style.fontWeight =
      "700";

    toast.style.fontSize =
      "14px";

    toast.style.maxWidth =
      "90vw";

    toast.style.textAlign =
      "center";

    toast.style.boxShadow =
      "0 12px 30px rgba(0,0,0,.25)";

    document.body.appendChild(
      toast
    );
  }

  const backgrounds = {
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
    info: "#1d4ed8"
  };

  toast.style.background =
    backgrounds[type] ||
    backgrounds.info;

  toast.textContent =
    message;

  toast.style.display =
    "block";

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      3000
    );
}


/* ============================================================
   9. MODALES
============================================================ */

function openModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.classList.add(
    "open"
  );
}


function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "open"
  );
}


/* ============================================================
   10. NAVIGATION
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

  const page =
    document.getElementById(
      `${pageName}Page`
    );

  if (page) {

    page.style.display =
      "block";

    page.classList.add(
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
   11. MENU
============================================================ */

function setupMenu() {

  const menuBtn =
    $("#menuBtn");

  const nav =
    $("#mobileNav");

  if (
    !menuBtn ||
    !nav
  ) {
    return;
  }

  menuBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      nav.classList.toggle(
        "open"
      );
    }
  );
}


/* ============================================================
   12. NAVIGATION BOUTONS
============================================================ */

function setupNavigation() {

  $$("[data-page]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            openPage(
              button.dataset.page
            );
          }
        );
      }
    );
}


/* ============================================================
   13. DEVISES
============================================================ */

function convertCurrency(
  amount,
  fromCurrency,
  toCurrency
) {

  const value =
    Number(amount);

  if (
    !Number.isFinite(value) ||
    !rates[fromCurrency] ||
    !rates[toCurrency]
  ) {
    return value || 0;
  }

  const usd =
    value /
    rates[fromCurrency];

  return (
    usd *
    rates[toCurrency]
  );
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

      updateWalletDisplay();
    }
  );
}


/* ============================================================
   14. LANGUES
============================================================ */

const translations = {

  fr: {
    home: "Accueil",
    products: "Produits",
    sell: "Vendre",
    wallet: "Portefeuille",
    cart: "Panier",
    statistics: "Statistiques",
    chat: "Chat",
    logout: "Déconnexion",
    welcome: "Bienvenue sur Mystro-Shop",
    internationalMarket: "Marché international",
    discoverProducts: "Découvrir les produits",
    sellProduct: "Vendre un produit",
    popularProducts: "Produits populaires",
    publishProduct: "Publier un produit",
    publishButton: "Publier le produit",
    deposit: "Dépôt",
    withdraw: "Retrait"
  },

  ht: {
    home: "Akèy",
    products: "Pwodwi",
    sell: "Vann",
    wallet: "Pòtfèy",
    cart: "Panyen",
    statistics: "Estatistik",
    chat: "Mesaj",
    logout: "Dekonekte",
    welcome: "Byenveni nan Mystro-Shop",
    internationalMarket: "Mache entènasyonal",
    discoverProducts: "Dekouvri pwodwi",
    sellProduct: "Vann yon pwodwi",
    popularProducts: "Pwodwi popilè",
    publishProduct: "Pibliye yon pwodwi",
    publishButton: "Pibliye pwodwi a",
    deposit: "Depoze",
    withdraw: "Retire"
  },

  en: {
    home: "Home",
    products: "Products",
    sell: "Sell",
    wallet: "Wallet",
    cart: "Cart",
    statistics: "Statistics",
    chat: "Chat",
    logout: "Log out",
    welcome: "Welcome to Mystro-Shop",
    internationalMarket: "International marketplace",
    discoverProducts: "Discover products",
    sellProduct: "Sell a product",
    popularProducts: "Popular products",
    publishProduct: "Publish a product",
    publishButton: "Publish product",
    deposit: "Deposit",
    withdraw: "Withdraw"
  },

  es: {
    home: "Inicio",
    products: "Productos",
    sell: "Vender",
    wallet: "Cartera",
    cart: "Carrito",
    statistics: "Estadísticas",
    chat: "Chat",
    logout: "Cerrar sesión",
    welcome: "Bienvenido a Mystro-Shop",
    internationalMarket: "Mercado internacional",
    discoverProducts: "Descubrir productos",
    sellProduct: "Vender un producto",
    popularProducts: "Productos populares",
    publishProduct: "Publicar un producto",
    publishButton: "Publicar producto",
    deposit: "Depositar",
    withdraw: "Retirar"
  }
};


function applyLanguage() {

  const dictionary =
    translations[currentLanguage] ||
    translations.fr;

  document.documentElement.lang =
    currentLanguage;

  $$("[data-i18n]")
    .forEach(
      element => {

        const key =
          element.dataset.i18n;

        if (
          dictionary[key] !==
          undefined
        ) {

          element.textContent =
            dictionary[key];
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
   15. PROFIL UTILISATEUR
============================================================ */

function getInitials(
  name = "MS"
) {

  const text =
    String(name)
      .trim();

  if (!text) {
    return "MS";
  }

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map(
      word =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}


function isSeller() {

  const role =
    String(
      currentProfile?.role ||
      ""
    )
      .toLowerCase();

  return (
    role === "seller" ||
    role === "vendeur"
  );
}


async function loadUserProfile(
  user
) {

  const reference =
    doc(
      db,
      "users",
      user.uid
    );

  let snapshot =
    await getDoc(reference);

  if (!snapshot.exists()) {

    const profile = {
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
    };

    await setDoc(
      reference,
      profile
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
    currentProfile?.role ||
    "buyer";

  const balance =
    Number(
      currentProfile?.balance ||
      0
    );

  if ($("#userInitials")) {

    $("#userInitials")
      .textContent =
      getInitials(name);
  }

  if ($("#profileName")) {

    $("#profileName")
      .textContent =
      name;
  }

  if ($("#profileEmail")) {

    $("#profileEmail")
      .textContent =
      email;
  }

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

  updateWalletDisplay();
}


/* ============================================================
   16. PROFIL BOUTON
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
   17. NOTIFICATIONS
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
   18. FERMETURE MODALES
============================================================ */

function setupModalCloseButtons() {

  $$("[data-close-modal]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            closeModal(
              button.dataset.closeModal
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
              event.target === modal
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
   19. PRODUITS
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


  const imageArea =
    document.createElement(
      "div"
    );

  imageArea.className =
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

    imageArea.appendChild(
      img
    );

  } else {

    imageArea.textContent =
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
    imageArea,
    body
  );

  return card;
}


function renderProducts() {

  const containers = [
    $("#productsContainer"),
    $("#productsGrid")
  ];

  containers.forEach(
    container => {

      if (!container) {
        return;
      }

      container.replaceChildren();

      products.forEach(
        product => {

          container.appendChild(
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
   20. CHARGEMENT FIRESTORE
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

    const snapshot =
      await getDocs(q);

    const remoteProducts =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    products =
      remoteProducts.length
        ? remoteProducts
        : [...demoProducts];

  } catch (error) {

    console.error(
      "Chargement produits :",
      error
    );

    products =
      [...demoProducts];
  }

  renderProducts();

  updateStatistics();
}


/* ============================================================
   21. APERÇU PHOTO
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

        preview.replaceChildren();

        if (!file) {
          return;
        }

        if (
          !allowedImageTypes.includes(
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
            "Image trop grande. Maximum 5 MB.",
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
          () =>
            URL.revokeObjectURL(
              url
            );

        preview.appendChild(
          img
        );
      }
    );
}


/* ============================================================
   22. UPLOAD SUPABASE
============================================================ */

async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "AUTH_REQUIRED"
    );
  }

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

  const id =
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  const path =
    `${currentUser.uid}/${Date.now()}-${id}.${safeExtension}`;

  const {
    error
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

  if (error) {

    throw error;
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

    imagePath:
      path
  };
}


/* ============================================================
   23. PUBLICATION PRODUIT
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
      "Un compte vendeur est nécessaire.",
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
    !file
  ) {

    showToast(
      "Complétez correctement le produit et ajoutez une photo.",
      "warning"
    );

    return;
  }


  const button =
    $("#publishProductBtn");

  const previousText =
    button?.textContent;


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
      "Publication produit :",
      error
    );


    showToast(
      "Publication impossible. Vérifiez l'accès Supabase.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        previousText ||
        "Publier le produit";
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
   24. PANIER
============================================================ */

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


function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(cart)
  );
}


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

  const container =
    $("#cartItems");

  const count =
    cart.reduce(
      (total, item) =>
        total +
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


  if (!container) {
    return;
  }

  container.replaceChildren();


  if (
    cart.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "empty-state";

    empty.textContent =
      "🛒 Votre panier est vide.";

    container.appendChild(
      empty
    );

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
              Number(item.price) *
              Number(item.quantity)
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
          () =>
            removeCartItem(
              item.id
            )
        );


        row.append(
          title,
          price,
          remove
        );

        container.appendChild(
          row
        );
      }
    );
  }


  const subtotal =
    cart.reduce(
      (total, item) => {

        return (
          total +
          convertCurrency(
            Number(item.price) *
            Number(item.quantity),
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
   25. CHECKOUT
============================================================ */

function setupCheckout() {

  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          cart.length === 0
        ) {

          showToast(
            "Votre panier est vide.",
            "warning"
          );

          return;
        }

        showToast(
          "Le paiement de commande sera connecté au système sécurisé.",
          "info"
        );
      }
    );
}


/* ============================================================
   26. PORTEFEUILLE
============================================================ */

function updateWalletDisplay() {

  const balance =
    Number(
      currentProfile?.balance ||
      0
    );

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
   27. MONCASH - MODALES
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
      await currentUser.getIdToken(
        true
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
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              amount
            })
        }
      );


    const data =
      await response.json();


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
      "MonCash dépôt :",
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
    receiver.length === 8
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
      await response.json();


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
      "MonCash retrait :",
      error
    );


    showToast(
      "Retrait MonCash impossible.",
      "error"
    );
  }
}


/* ============================================================
   30. BOUTONS MONCASH
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
   31. AUTRES MÉTHODES DE PAIEMENT
============================================================ */

function setupOtherPaymentMethods() {

  $("#natcashBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "NatCash : intégration officielle en attente.",
          "info"
        );
      }
    );


  $("#bankBtn")
    ?.addEventListener(
      "click",
      () => {

        showToast(
          "BNC / Unibank : transfert bancaire.",
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
          "Change de devise disponible dans le sélecteur de devises.",
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
              String(
                product.name ||
                ""
              )
                .toLowerCase()
                .includes(term)
          );


        const container =
          $("#productsGrid");


        if (container) {

          container.replaceChildren();


          filtered.forEach(
            product => {

              container.appendChild(
                createProductCard(
                  product
                )
              );
            }
          );
        }


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
        input.value.trim();


      if (!text) {
        return;
      }


      const message =
        document.createElement(
          "div"
        );


      message.className =
        "assistant-message";


      message.textContent =
        text;


      messages.appendChild(
        message
      );


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
   34. ASSISTANT VIRTUEL
============================================================ */

function assistantReply(
  message
) {

  const text =
    message
      .toLowerCase();


  if (
    text.includes("moncash") ||
    text.includes("depot") ||
    text.includes("dépôt")
  ) {

    return "Ouvrez Portefeuille puis Dépôt MonCash.";
  }


  if (
    text.includes("ret") ||
    text.includes("withdraw")
  ) {

    return "Ouvrez Portefeuille puis Retrait MonCash.";
  }


  if (
    text.includes("vendre") ||
    text.includes("vann") ||
    text.includes("sell")
  ) {

    return "Ouvrez la page Vendre, ajoutez les informations et la photo du produit puis publiez.";
  }


  if (
    text.includes("commission") ||
    text.includes("10")
  ) {

    return "Mystro-Shop prélève 10 % sur chaque vente finalisée.";
  }


  return "Je peux vous aider avec les produits, le portefeuille, MonCash, les devises et la navigation.";
}


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


  button?.addEventListener(
    "click",
    () => {

      panel?.classList.toggle(
        "open"
      );
    }
  );


  close?.addEventListener(
    "click",
    () => {

      panel?.classList.remove(
        "open"
      );
    }
  );


  const sendMessage =
    () => {

      const text =
        input?.value
          .trim();


      if (
        !text ||
        !messages
      ) {
        return;
      }


      const userMessage =
        document.createElement(
          "div"
        );


      userMessage.className =
        "assistant-message";


      userMessage.textContent =
        text;


      messages.appendChild(
        userMessage
      );


      if (input) {

        input.value =
          "";
      }


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


          messages.appendChild(
            bot
          );


          messages.scrollTop =
            messages.scrollHeight;

        },
        250
      );
    };


  send?.addEventListener(
    "click",
    sendMessage
  );


  input?.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        sendMessage();
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
}


/* ============================================================
   36. CONNEXION / INSCRIPTION
============================================================ */

function createAuthModal(
  mode
) {

  let modal =
    $("#dynamicAuthModal");


  if (modal) {

    modal.remove();
  }


  modal =
    document.createElement(
      "div"
    );


  modal.id =
    "dynamicAuthModal";


  modal.className =
    "mystro-modal open";


  const isLogin =
    mode ===
    "login";


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
            <label>Nom complet</label>
            <input
              id="dynamicAuthName"
              type="text"
            >
          </div>

          <div class="payment-field">
            <label>Type de compte</label>
            <select id="dynamicAuthRole">
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
        <label>Email</label>
        <input
          id="dynamicAuthEmail"
          type="email"
        >
      </div>

      <div class="payment-field">
        <label>Mot de passe</label>
        <input
          id="dynamicAuthPassword"
          type="password"
        >
      </div>

      <button
        type="button"
        id="dynamicAuthSubmit"
        class="primary-btn"
        style="width:100%;margin-top:20px"
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
            class="secondary-btn"
            style="width:100%;margin-top:10px"
          >
            Mot de passe oublié ?
          </button>
          `
          : ""
      }

    </div>
    `;


  document.body.appendChild(
    modal
  );


  $("#dynamicAuthClose")
    ?.addEventListener(
      "click",
      () =>
        modal.remove()
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
          password.length < 6
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
                balance: 0,
                createdAt:
                  serverTimestamp()
              }
            );


            showToast(
              "Compte créé.",
              "success"
            );
          }


          modal.remove();

        } catch (error) {

          console.error(
            "Authentification :",
            error
          );


          showToast(
            "Authentification impossible.",
            "error"
          );
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
   37. BOUTONS AUTH
============================================================ */

function setupAuthButtons() {

  $("#welcomeLoginBtn")
    ?.addEventListener(
      "click",
      () =>
        createAuthModal(
          "login"
        )
    );


  $("#welcomeRegisterBtn")
    ?.addEventListener(
      "click",
      () =>
        createAuthModal(
          "register"
        )
    );
}


/* ============================================================
   38. LOGOUT
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
   39. AUTH STATE
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


      $("#welcomePage")
        ?.style
        .setProperty(
          "display",
          "flex"
        );


      $("#mainApp")
        ?.style
        .setProperty(
          "display",
          "none"
        );


      return;
    }


    try {

      await loadUserProfile(
        user
      );

    } catch (error) {

      console.error(
        "Profil :",
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
   40. INITIALISATION
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
   41. DOM READY
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
   42. PWA
============================================================ */

if (
  "serviceWorker" in navigator
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
          "Service Worker :",
          error
        );
      }
    }
  );
  }

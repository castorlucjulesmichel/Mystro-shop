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


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const API_URL =
  "https://mystroshop-api.castormystro.workers.dev";

const COMMISSION_RATE = 0.10;

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


let currentUser = null;
let currentProfile = null;
let products = [];
let cartCount = 0;

let currency =
  localStorage.getItem("mystroCurrency") ||
  "HTG";


const symbols = {
  USD: "$",
  HTG: "G",
  EUR: "€",
  CAD: "$",
  GBP: "£"
};


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
   MONEY
========================= */

function money(
  value,
  code = "USD"
) {

  const amount =
    Number(value) || 0;

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }
    ).format(amount);

  } catch {

    return (
      `${symbols[code] || code} ` +
      amount.toFixed(2)
    );
  }
}


/* =========================
   PROFILE
========================= */

function initials(
  name = "Mystro Shop"
) {

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word =>
      word[0]?.toUpperCase() || ""
    )
    .join("") || "MS";
}


function isSeller() {

  const role =
    String(
      currentProfile?.role || ""
    ).toLowerCase();

  return (
    role === "seller" ||
    role === "vendeur"
  );
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
    isSeller()
      ? "Vendeur"
      : "Acheteur";

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
      "Cette section est réservée aux vendeurs."
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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   LOGIN
========================= */

async function handleLogin(
  event
) {

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
      "Connexion réussie."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Email ou mot de passe incorrect."
    );
  }
}


/* =========================
   SIGNUP
========================= */

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

  const confirmation =
    $("#signupPasswordConfirm")
      ?.value || "";


  if (
    !name ||
    !email ||
    password.length < 6
  ) {

    showToast(
      "Remplissez tous les champs."
    );

    return;
  }


  if (
    password !==
    confirmation
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
        currency: "HTG",
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
      "Email de réinitialisation envoyé."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Impossible d'envoyer l'email."
    );
  }
}


/* =========================
   FIRESTORE PROFILE
========================= */

async function loadProfile(
  user
) {

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
          "HTG",

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
   PRODUCT CARD
========================= */

function createProductCard(
  product
) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
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
    "Produit";


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
    money(
      product.price,
      product.currency ||
      "USD"
    );


  const stock =
    document.createElement(
      "small"
    );

  stock.textContent =
    `Stock : ${Number(
      product.stock || 0
    )}`;


  const button =
    document.createElement(
      "button"
    );

  button.className =
    "btn btn-primary add-cart";

  button.type =
    "button";

  button.textContent =
    "Ajouter au panier";


  button.addEventListener(
    "click",
    () => {

      cartCount += 1;

      showToast(
        `Produit ajouté au panier (${cartCount}).`
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

  article.append(
    media,
    body
  );

  return article;
}


/* =========================
   FILTER PRODUCTS
========================= */

function filteredProducts() {

  const search =
    $("#productSearch")
      ?.value
      .trim()
      .toLowerCase() || "";


  const category =
    $("#categoryFilter")
      ?.value ||
    "all";


  return products.filter(
    product => {

      const searchable =
        `${
          product.name || ""
        } ${
          product.category || ""
        }`
          .toLowerCase();


      return (
        (
          !search ||
          searchable.includes(
            search
          )
        ) &&
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
   LOAD FIRESTORE PRODUCTS
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
      error
    );

    products =
      [...demoProducts];
  }


  renderProducts();
}


/* =========================
   PRODUCT IMAGE PREVIEW
========================= */

function previewProductImage() {

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


  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !validTypes.includes(
      file.type
    )
  ) {

    showToast(
      "Utilisez JPEG, PNG ou WebP."
    );

    return;
  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    showToast(
      "La photo ne doit pas dépasser 5 MB."
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
    "Aperçu du produit";


  image.style.maxWidth =
    "100%";

  image.style.maxHeight =
    "300px";

  image.style.objectFit =
    "cover";

  image.style.borderRadius =
    "16px";


  preview.appendChild(
    image
  );
}


/* =========================
   UPLOAD IMAGE TO SUPABASE
========================= */

async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "USER_NOT_CONNECTED"
    );
  }


  const firebaseToken =
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
            `Bearer ${firebaseToken}`
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
      .trim() || "";


  const imageFile =
    $("#productImage")
      ?.files?.[0];


  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 1 ||
    !imageFile
  ) {

    showToast(
      "Vérifiez tous les champs du produit."
    );

    return;
  }


  const submitButton =
    event.currentTarget
      .querySelector(
        'button[type="submit"]'
      );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Publication...";
  }


  try {

    const uploaded =
      await uploadProductImage(
        imageFile
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

        active:
          true,

        commissionRate:
          COMMISSION_RATE,

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
      error
    );


    showToast(
      "Impossible de publier le produit."
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Publier le produit";
    }
  }
}


/* =========================
   MONCASH DEPOSIT
========================= */

async function startMonCashDeposit() {

  const rawAmount =
    prompt(
      "Montant du dépôt MonCash en HTG :"
    );


  if (
    rawAmount === null
  ) {

    return;
  }


  const amount =
    Number(
      String(rawAmount)
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
      "Montant de dépôt invalide."
    );

    return;
  }


  try {

    showToast(
      "Ouverture de MonCash..."
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
      "Impossible de démarrer le dépôt MonCash."
    );
  }
}


/* =========================
   MONCASH WITHDRAW
========================= */

async function startMonCashWithdraw() {

  if (!currentUser) {

    showToast(
      "Connectez-vous d'abord."
    );

    return;
  }


  const rawAmount =
    prompt(
      "Montant du retrait MonCash en HTG :"
    );


  if (
    rawAmount === null
  ) {

    return;
  }


  const amount =
    Number(
      String(rawAmount)
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
      "Montant de retrait invalide."
    );

    return;
  }


  const phone =
    prompt(
      "Numéro MonCash : 509XXXXXXXX"
    );


  if (!phone) {
    return;
  }


  const receiver =
    phone.replace(
      /\D/g,
      ""
    );


  if (
    !/^509\d{8}$/
      .test(receiver)
  ) {

    showToast(
      "Numéro MonCash invalide."
    );

    return;
  }


  const reference =
    `MSW-${currentUser.uid.slice(0,10)}-${Date.now()}`;


  try {

    const firebaseToken =
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
              `Bearer ${firebaseToken}`
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
      response.status === 403 &&
      data.error ===
        "PAYOUT_APPROVAL_REQUIRED"
    ) {

      showToast(
        "Le retrait réel est encore verrouillé par la sécurité du serveur."
      );

      return;
    }


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
      `Retrait de ${amount} HTG envoyé à MonCash.`
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Impossible d'effectuer le retrait MonCash."
    );
  }
}


/* =========================
   CURRENCY
========================= */

function updateCurrencyUI() {

  if (
    $("#currencySelect")
  ) {

    $("#currencySelect")
      .value =
      currency;
  }


  if (
    $("#profileCurrencyInfo")
  ) {

    $("#profileCurrencyInfo")
      .textContent =
      currency;
  }


  if (
    $("#walletBalance")
  ) {

    $("#walletBalance")
      .textContent =
      money(
        0,
        currency
      );
  }
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


      const nav =
        target?.closest(
          "[data-page]"
        );


      if (nav) {

        showPage(
          nav.dataset.page
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


      const category =
        target?.closest(
          "[data-category]"
        );


      if (category) {

        showPage(
          "products"
        );


        if (
          $("#categoryFilter")
        ) {

          $("#categoryFilter")
            .value =
            category.dataset.category;
        }


        renderProducts();
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
      previewProductImage
    );


  $("#productForm")
    ?.addEventListener(
      "submit",
      publishProduct
    );


  $("#depositBtn")
    ?.addEventListener(
      "click",
      startMonCashDeposit
    );


  $("#withdrawBtn")
    ?.addEventListener(
      "click",
      startMonCashWithdraw
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
        "Erreur de chargement du compte."
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

    initEvents();

    updateCurrencyUI();

    products =
      [...demoProducts];

    renderProducts();
  }
);

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

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


let currentUser = null;
let currentProfile = null;
let cartCount = 0;
let products = [];

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


/* ======================
   TOAST
====================== */

function showToast(message) {

  const el = $("#toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(() => {
      el.classList.remove("show");
    }, 2800);
}


/* ======================
   MONEY
====================== */

function formatMoney(
  amount,
  code = "USD"
) {

  const value =
    Number(amount) || 0;

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      }
    ).format(value);

  } catch {

    return (
      `${symbols[code] || code} ` +
      value.toFixed(2)
    );
  }
}


/* ======================
   PROFILE
====================== */

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


function roleIsSeller() {

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
    roleIsSeller()
      ? "Vendeur"
      : "Acheteur";

  const avatar =
    initials(name);


  [
    "#sidebarAvatar",
    "#topAvatar",
    "#profileAvatar"
  ].forEach(selector => {

    if ($(selector)) {
      $(selector).textContent =
        avatar;
    }
  });


  if ($("#sidebarUserName"))
    $("#sidebarUserName")
      .textContent = name;

  if ($("#sidebarUserRole"))
    $("#sidebarUserRole")
      .textContent = role;

  if ($("#profileName"))
    $("#profileName")
      .textContent = name;

  if ($("#profileEmail"))
    $("#profileEmail")
      .textContent = email;

  if ($("#profileRole"))
    $("#profileRole")
      .textContent = role;

  if ($("#profileNameInfo"))
    $("#profileNameInfo")
      .textContent = name;

  if ($("#profileEmailInfo"))
    $("#profileEmailInfo")
      .textContent = email;

  if ($("#profileRoleInfo"))
    $("#profileRoleInfo")
      .textContent = role;

  if ($("#profileCurrencyInfo"))
    $("#profileCurrencyInfo")
      .textContent = currency;
}


/* ======================
   NAVIGATION
====================== */

function closeSidebar() {

  $("#sidebar")
    ?.classList
    .remove("open");

  $("#overlay")
    ?.classList
    .remove("show");
}


function showPage(id) {

  const sellerPages =
    new Set([
      "dashboard",
      "sell",
      "wallet",
      "stats",
      "clients"
    ]);


  if (
    sellerPages.has(id) &&
    !roleIsSeller()
  ) {

    showToast(
      "Cette page est réservée aux vendeurs."
    );

    id = "home";
  }


  $$(".page").forEach(page => {

    page.classList.toggle(
      "active",
      page.id === id
    );
  });


  $$("[data-page]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === id
      );
    });


  closeSidebar();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ======================
   AUTH
====================== */

function switchAuthMode(mode) {

  const login =
    mode === "login";

  $("#loginForm")
    ?.classList
    .toggle("hidden", !login);

  $("#signupForm")
    ?.classList
    .toggle("hidden", login);

  $("#loginTab")
    ?.classList
    .toggle("active", login);

  $("#signupTab")
    ?.classList
    .toggle("active", !login);
}


function showAuth(
  mode = "login"
) {

  $("#authScreen")
    ?.classList
    .remove("hidden");

  $("#appShell")
    ?.classList
    .add("hidden");

  switchAuthMode(mode);
}


function showApp() {

  $("#authScreen")
    ?.classList
    .add("hidden");

  $("#appShell")
    ?.classList
    .remove("hidden");

  showPage("home");
}


async function handleLogin(event) {

  event.preventDefault();

  const email =
    $("#loginEmail")
      ?.value.trim();

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


async function handleSignup(event) {

  event.preventDefault();

  const name =
    $("#signupName")
      ?.value.trim();

  const email =
    $("#signupEmail")
      ?.value.trim();

  const role =
    $("#signupRole")
      ?.value || "buyer";

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
      "Remplissez correctement tous les champs."
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


async function forgotPassword() {

  const email =
    $("#loginEmail")
      ?.value.trim();


  if (!email) {

    showToast(
      "Entrez d'abord votre adresse email."
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


async function logout() {

  await signOut(auth);
}


/* ======================
   FIRESTORE PROFILE
====================== */

async function loadProfile(user) {

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
          user.email || "",

        role:
          "buyer",

        currency:
          "HTG",

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


/* ======================
   PRODUCTS
====================== */

function makeProductCard(product) {

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

    image.referrerPolicy =
      "no-referrer";

    media.appendChild(image);

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
      "small"
    );

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
      "strong"
    );

  price.className =
    "product-price";

  price.textContent =
    formatMoney(
      product.price,
      product.currency || "USD"
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

      cartCount++;

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
      .toLowerCase() || "";


  const category =
    $("#categoryFilter")
      ?.value || "all";


  return products.filter(
    product => {

      const text =
        `${product.name || ""} ${product.category || ""}`
          .toLowerCase();


      return (
        (!search ||
          text.includes(search)) &&

        (
          category === "all" ||
          product.category ===
            category
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
          makeProductCard(
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
          makeProductCard(
            product
          )
        );
      });
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
          id: item.id,
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
      "Firestore products:",
      error
    );

    products =
      [...demoProducts];
  }


  renderProducts();
}


/* ======================
   IMAGE PREVIEW
====================== */

function previewProductImage() {

  const file =
    $("#productImage")
      ?.files?.[0];

  const box =
    $("#productImagePreview");


  if (!box) return;


  box.replaceChildren();


  if (!file) return;


  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type)
  ) {

    showToast(
      "Image JPEG, PNG ou WebP uniquement."
    );

    return;
  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    showToast(
      "Image trop grande : maximum 5 MB."
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


  box.appendChild(image);
}


/* ======================
   IMAGE UPLOAD
====================== */

async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "USER_NOT_CONNECTED"
    );
  }


  const token =
    await currentUser
      .getIdToken(true);


  const form =
    new FormData();


  form.append(
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
          form
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


/* ======================
   PUBLISH PRODUCT
====================== */

async function addProductFromForm(
  event
) {

  event.preventDefault();


  if (
    !currentUser ||
    !roleIsSeller()
  ) {

    showToast(
      "Compte vendeur requis."
    );

    return;
  }


  const name =
    $("#productName")
      ?.value.trim();


  const category =
    $("#productCategory")
      ?.value;


  const productCurrency =
    $("#productCurrency")
      ?.value || "USD";


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
      ?.value.trim() || "";


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
      "Vérifiez tous les champs du produit."
    );

    return;
  }


  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type) ||

    file.size >
      5 * 1024 * 1024
  ) {

    showToast(
      "Photo invalide ou supérieure à 5 MB."
    );

    return;
  }


  const submit =
    event.currentTarget
      .querySelector(
        'button[type="submit"]'
      );


  if (submit) {

    submit.disabled =
      true;

    submit.textContent =
      "Publication...";
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
          uploaded.path || "",

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


    if ($("#productStock")) {

      $("#productStock")
        .value = "1";
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

    console.error(error);


    if (
      String(error.message)
        .includes(
          "SELLER_ONLY"
        )
    ) {

      showToast(
        "Upload réservé aux vendeurs."
      );

    } else if (
      String(error.message)
        .includes(
          "UNAUTHORIZED"
        )
    ) {

      showToast(
        "Reconnectez-vous puis réessayez."
      );

    } else {

      showToast(
        "Publication impossible. Vérifiez Firestore et l'upload photo."
      );
    }

  } finally {

    if (submit) {

      submit.disabled =
        false;

      submit.textContent =
        "Publier le produit";
    }
  }
}


/* ======================
   MONCASH DEPOSIT
====================== */

async function openMonCashDeposit(
  amount
) {

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
            amount:
              Number(amount)
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
      "MONCASH_DEPOSIT_FAILED"
    );
  }


  window.location.href =
    data.redirectUrl;
}


async function handleDeposit() {

  const raw =
    prompt(
      "Montant du dépôt MonCash en HTG (0,01 à 5000) :"
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
    amount <= 0 ||
    amount > 5000
  ) {

    showToast(
      "Montant invalide. Entrez entre 0,01 et 5000 HTG."
    );

    return;
  }


  try {

    showToast(
      "Ouverture de MonCash..."
    );


    await openMonCashDeposit(
      amount
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Impossible de démarrer le dépôt MonCash."
    );
  }
}


/* ======================
   MONCASH WITHDRAWAL
====================== */

function handleWithdraw() {

  /*
    IMPORTANT :
    ne jamais mettre
    MONCASH_PAYOUT_KEY ici.

    Cette clé est secrète
    et doit rester côté serveur.
  */

  showToast(
    "Le retrait MonCash réel doit être autorisé côté serveur."
  );
}


/* ======================
   WALLET
====================== */

function updateCurrencyUI() {

  if ($("#currencySelect")) {

    $("#currencySelect")
      .value =
      currency;
  }


  if ($("#profileCurrencyInfo")) {

    $("#profileCurrencyInfo")
      .textContent =
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
}


/* ======================
   CLIENTS / ORDERS
====================== */

function renderClients() {

  const element =
    $("#clientList") ||
    $("#clientsList");

  if (!element) return;
}


function renderOrders() {

  const element =
    $("#ordersPreview");

  if (!element) return;
}


/* ======================
   CHAT
====================== */

function initChat() {

  const list =
    $("#chatList");

  const messages =
    $("#messages");


  if (
    list &&
    !list.children.length
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "chat-user active";

    button.textContent =
      "Support Mystro-Shop";


    list.appendChild(
      button
    );
  }


  if (
    messages &&
    !messages.children.length
  ) {

    const bubble =
      document.createElement(
        "div"
      );


    bubble.className =
      "bubble them";


    bubble.textContent =
      "Bienvenue sur Mystro-Shop.";


    messages.appendChild(
      bubble
    );
  }
}


/* ======================
   CHART
====================== */

function drawChart(
  selector,
  values = []
) {

  const canvas =
    $(selector);


  if (
    !(canvas instanceof HTMLCanvasElement) ||
    !values.length
  ) {

    return;
  }


  const ctx =
    canvas.getContext("2d");


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


  const max =
    Math.max(...values);

  const min =
    Math.min(...values);

  const pad =
    20;


  ctx.beginPath();


  values.forEach(
    (value, index) => {

      const x =
        pad +
        index *
        (
          (width - pad * 2) /
          Math.max(
            1,
            values.length - 1
          )
        );


      const y =
        height -
        pad -
        (
          (value - min) /
          Math.max(
            1,
            max - min
          )
        ) *
        (
          height -
          pad * 2
        );


      if (index === 0) {

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


/* ======================
   EVENTS
====================== */

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
      logout
    );


  $("#profileLogoutBtn")
    ?.addEventListener(
      "click",
      logout
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
        event.target
          instanceof Element
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


  $("#clientSearch")
    ?.addEventListener(
      "input",
      renderClients
    );


  $("#productImage")
    ?.addEventListener(
      "change",
      previewProductImage
    );


  $("#productForm")
    ?.addEventListener(
      "submit",
      addProductFromForm
    );


  /*
    NOUVEAU :
    le dépôt utilise maintenant
    le montant choisi.
  */

  $("#depositBtn")
    ?.addEventListener(
      "click",
      handleDeposit
    );


  $("#withdrawBtn")
    ?.addEventListener(
      "click",
      handleWithdraw
    );


  $("#chatForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const input =
          $("#messageInput") ||
          $("#chatInput");


        const value =
          input?.value.trim();


        if (!value) return;


        const bubble =
          document.createElement(
            "div"
          );


        bubble.className =
          "bubble me";


        bubble.textContent =
          value;


        $("#messages")
          ?.appendChild(
            bubble
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
          event.key !== "Enter"
        ) {

          return;
        }


        showPage(
          "products"
        );


        if (
          $("#productSearch")
        ) {

          $("#productSearch")
            .value =
            event.target.value;
        }


        renderProducts();
      }
    );
}


/* ======================
   AUTH STATE
====================== */

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

      console.error(error);

      showToast(
        "Erreur de chargement du profil."
      );
    }
  }
);


/* ======================
   INIT
====================== */

function init() {

  initEvents();

  updateCurrencyUI();

  initChat();

  products =
    [...demoProducts];

  renderProducts();


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


document.addEventListener(
  "DOMContentLoaded",
  init
);

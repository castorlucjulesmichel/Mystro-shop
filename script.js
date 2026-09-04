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
  getDoc
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

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


/* ==============================
   DONNÉES
============================== */

const products = [
  {
    id: 1,
    name: "Sac urbain premium",
    category: "Mode",
    price: 89,
    emoji: "👜"
  },
  {
    id: 2,
    name: "Smartphone Nova",
    category: "Électronique",
    price: 399,
    emoji: "📱"
  },
  {
    id: 3,
    name: "Lampe design",
    category: "Maison",
    price: 65,
    emoji: "💡"
  },
  {
    id: 4,
    name: "Soin visage naturel",
    category: "Beauté",
    price: 32,
    emoji: "✨"
  },
  {
    id: 5,
    name: "Chaussures sport",
    category: "Sports",
    price: 75,
    emoji: "👟"
  },
  {
    id: 6,
    name: "Panier gourmand",
    category: "Alimentation",
    price: 45,
    emoji: "🧺"
  }
];


const orders = [
  ["#1048", "Jean M.", 240, "Payée"],
  ["#1047", "Marie L.", 180, "Expédition"],
  ["#1046", "Paul R.", 95, "Préparation"],
  ["#1045", "Sarah K.", 320, "Payée"]
];


const clients = [
  {
    name: "Jean M.",
    email: "jean@example.com",
    orders: 12,
    total: 1240,
    online: true
  },
  {
    name: "Marie L.",
    email: "marie@example.com",
    orders: 8,
    total: 820,
    online: true
  },
  {
    name: "Paul R.",
    email: "paul@example.com",
    orders: 6,
    total: 540,
    online: false
  },
  {
    name: "Sarah K.",
    email: "sarah@example.com",
    orders: 15,
    total: 1680,
    online: true
  }
];


const chats = [
  {
    name: "Jean M.",
    messages: [
      [
        "them",
        "Bonjour, le smartphone est-il encore disponible ?"
      ],
      [
        "me",
        "Bonjour ! Oui, il est disponible."
      ]
    ]
  },
  {
    name: "Marie L.",
    messages: [
      [
        "them",
        "Merci pour votre aide !"
      ],
      [
        "me",
        "Avec plaisir 😊"
      ]
    ]
  }
];


const rates = {
  USD: 1,
  HTG: 130,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79
};


const symbols = {
  USD: "$",
  HTG: "G",
  EUR: "€",
  CAD: "$",
  GBP: "£"
};


let currency =
  localStorage.getItem("mystroCurrency") ||
  "USD";

let currentUser = null;
let currentProfile = null;
let selectedChat = 0;


/* ==============================
   OUTILS
============================== */

function toast(message) {

  const box = $("#toast");

  if (!box) {
    alert(message);
    return;
  }

  box.textContent = message;
  box.classList.add("show");

  clearTimeout(
    window.mystroToastTimer
  );

  window.mystroToastTimer =
    setTimeout(() => {

      box.classList.remove("show");

    }, 2600);
}


function money(value) {

  const amount =
    Number(value) *
    (rates[currency] || 1);

  return (
    (symbols[currency] || "$") +
    " " +
    amount.toLocaleString(
      "fr-FR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


function initials(
  name = "Mystro Shop"
) {

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      part =>
        part[0].toUpperCase()
    )
    .join("") || "MS";
}


function roleLabel(role) {

  return role === "seller"
    ? "Vendeur"
    : "Acheteur";
}


/* ==============================
   CONNEXION / INSCRIPTION
============================== */

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
    ?.style
    .setProperty(
      "display",
      "flex"
    );

  $("#appShell")
    ?.classList
    .add(
      "app-locked"
    );

  $("#appShell")
    ?.style
    .setProperty(
      "display",
      "none"
    );

  switchAuthMode(mode);
}


function showApp() {

  $("#authScreen")
    ?.style
    .setProperty(
      "display",
      "none"
    );

  $("#appShell")
    ?.classList
    .remove(
      "app-locked"
    );

  $("#appShell")
    ?.style
    .setProperty(
      "display",
      "block"
    );

  updateProfileUI();
  applyRolePermissions();
  showPage("home");
}


async function loadProfile(user) {

  const reference =
    doc(
      db,
      "users",
      user.uid
    );

  const snap =
    await getDoc(reference);


  if (snap.exists()) {

    return snap.data();
  }


  const profile = {

    name:
      user.email
        ?.split("@")[0] ||
      "Utilisateur",

    email:
      user.email || "",

    role:
      "buyer",

    createdAt:
      new Date()
        .toISOString()

  };


  await setDoc(
    reference,
    profile,
    {
      merge: true
    }
  );


  return profile;
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
      .trim()
      .toLowerCase();


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
    !email ||
    password.length < 6
  ) {

    toast(
      "Remplis tous les champs. Mot de passe : 6 caractères minimum."
    );

    return;
  }


  if (
    password !== confirm
  ) {

    toast(
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
        createdAt:
          new Date()
            .toISOString()
      }
    );


    event
      .currentTarget
      .reset();


    toast(
      "Compte créé avec succès."
    );

  } catch (error) {

    console.error(error);


    if (
      error.code ===
      "auth/email-already-in-use"
    ) {

      toast(
        "Un compte existe déjà avec cet email."
      );

    } else if (
      error.code ===
      "auth/invalid-email"
    ) {

      toast(
        "Adresse email invalide."
      );

    } else if (
      error.code ===
      "auth/weak-password"
    ) {

      toast(
        "Mot de passe trop faible."
      );

    } else {

      toast(
        "Impossible de créer le compte."
      );
    }
  }
}


async function handleLogin(
  event
) {

  event.preventDefault();


  const email =
    $("#loginEmail")
      ?.value
      .trim()
      .toLowerCase();


  const password =
    $("#loginPassword")
      ?.value ||
    "";


  if (
    !email ||
    !password
  ) {

    toast(
      "Entre ton email et ton mot de passe."
    );

    return;
  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    event
      .currentTarget
      .reset();


    toast(
      "Connexion réussie."
    );

  } catch (error) {

    console.error(error);

    toast(
      "Email ou mot de passe incorrect."
    );
  }
}


async function handleForgotPassword() {

  const email =
    $("#loginEmail")
      ?.value
      .trim()
      .toLowerCase();


  if (!email) {

    toast(
      "Entre d'abord ton adresse email."
    );

    return;
  }


  try {

    await sendPasswordResetEmail(
      auth,
      email
    );


    toast(
      "Email de réinitialisation envoyé."
    );

  } catch (error) {

    console.error(error);

    toast(
      "Impossible d'envoyer l'email de réinitialisation."
    );
  }
}


async function logout() {

  try {

    await signOut(auth);

    toast(
      "Vous êtes déconnecté."
    );

  } catch (error) {

    console.error(error);

    toast(
      "Erreur pendant la déconnexion."
    );
  }
}


/* ==============================
   PROFIL
============================== */

function updateProfileUI() {

  if (!currentUser) {
    return;
  }


  const profile =
    currentProfile || {};


  const name =
    profile.name ||
    currentUser.email
      ?.split("@")[0] ||
    "Utilisateur";


  const email =
    profile.email ||
    currentUser.email ||
    "";


  const role =
    profile.role ||
    "buyer";


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


  if ($("#sidebarUserName")) {

    $("#sidebarUserName")
      .textContent =
      name;
  }


  if ($("#sidebarUserRole")) {

    $("#sidebarUserRole")
      .textContent =
      roleLabel(role);
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
      roleLabel(role);
  }


  if ($("#profileNameInfo")) {

    $("#profileNameInfo")
      .textContent =
      name;
  }


  if ($("#profileEmailInfo")) {

    $("#profileEmailInfo")
      .textContent =
      email;
  }


  if ($("#profileRoleInfo")) {

    $("#profileRoleInfo")
      .textContent =
      roleLabel(role);
  }


  if ($("#profileCurrencyInfo")) {

    $("#profileCurrencyInfo")
      .textContent =
      currency;
  }
}


function applyRolePermissions() {

  const role =
    currentProfile
      ?.role ||
    "buyer";


  const sellerPages = [
    "dashboard",
    "sell",
    "wallet",
    "stats",
    "clients"
  ];


  $$(".nav-btn[data-page]")
    .forEach(
      button => {

        button
          .classList
          .toggle(
            "hidden-by-role",
            sellerPages.includes(
              button.dataset.page
            ) &&
            role !== "seller"
          );
      }
    );


  $$(".seller-only")
    .forEach(
      element => {

        element
          .classList
          .toggle(
            "hidden-by-role",
            role !== "seller"
          );
      }
    );
}


/* ==============================
   NAVIGATION
============================== */

function closeSidebar() {

  $("#sidebar")
    ?.classList
    .remove("open");

  $("#overlay")
    ?.classList
    .remove("show");
}


function showPage(pageId) {

  if (!currentUser) {

    showAuth("login");

    return;
  }


  const role =
    currentProfile
      ?.role ||
    "buyer";


  const sellerPages = [
    "dashboard",
    "sell",
    "wallet",
    "stats",
    "clients"
  ];


  if (
    sellerPages.includes(
      pageId
    ) &&
    role !== "seller"
  ) {

    toast(
      "Cette section est réservée aux vendeurs."
    );

    pageId =
      "home";
  }


  $$(".page")
    .forEach(
      page => {

        page.classList.toggle(
          "active",
          page.id === pageId
        );
      }
    );


  $$(".nav-btn")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageId
        );
      }
    );


  if (
    pageId === "profile"
  ) {

    updateProfileUI();
  }


  if (
    pageId === "dashboard"
  ) {

    drawChart(
      "revenueChart",
      [
        6200,
        7200,
        6900,
        8400,
        9300,
        10800,
        12480
      ],
      [
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Aoû"
      ]
    );
  }


  if (
    pageId === "stats"
  ) {

    drawChart(
      "statsChart",
      [
        4200,
        5600,
        5100,
        7100,
        8400,
        9800
      ],
      [
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Aoû"
      ]
    );
  }


  closeSidebar();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ==============================
   PRODUITS
============================== */

function productCard(
  product
) {

  return `
    <article class="product-card">

      <div class="product-image">
        ${product.emoji}
      </div>

      <div class="product-body">

        <h3>
          ${product.name}
        </h3>

        <div class="product-category">
          ${product.category}
        </div>

        <div class="product-price">
          ${money(product.price)}
        </div>

        <button
          class="btn btn-primary add-cart"
          data-product-id="${product.id}"
          type="button"
        >
          Ajouter au panier
        </button>

      </div>

    </article>
  `;
}


function renderProducts() {

  const search =
    (
      $("#productSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const category =
    $("#categoryFilter")
      ?.value ||
    "all";


  const filtered =
    products.filter(
      product => {

        const textMatch =
          !search ||
          (
            product.name +
            " " +
            product.category
          )
            .toLowerCase()
            .includes(search);


        const categoryMatch =
          category === "all" ||
          product.category ===
            category;


        return (
          textMatch &&
          categoryMatch
        );
      }
    );


  if ($("#productGrid")) {

    $("#productGrid")
      .innerHTML =
      filtered.length
        ? filtered
            .map(productCard)
            .join("")
        : `
            <div class="panel">
              Aucun produit trouvé.
            </div>
          `;
  }


  if ($("#featuredProducts")) {

    $("#featuredProducts")
      .innerHTML =
      products
        .slice(0, 4)
        .map(productCard)
        .join("");
  }
}


/* ==============================
   COMMANDES
============================== */

function renderOrders() {

  const rows =
    orders.map(
      order => {

        const commission =
          order[2] *
          COMMISSION_RATE;


        const sellerAmount =
          order[2] -
          commission;


        return `
          <tr>

            <td>
              <b>${order[0]}</b>
            </td>

            <td>
              ${order[1]}
            </td>

            <td>
              ${money(order[2])}
            </td>

            <td>
              ${money(commission)}
            </td>

            <td>
              ${money(sellerAmount)}
            </td>

            <td>

              <span
                class="status ${
                  order[3] !== "Payée"
                    ? "wait"
                    : ""
                }"
              >
                ${order[3]}
              </span>

            </td>

          </tr>
        `;
      }
    )
    .join("");


  if ($("#ordersTable")) {

    $("#ordersTable")
      .innerHTML =
      rows;
  }


  if ($("#ordersPreview")) {

    $("#ordersPreview")
      .innerHTML = `
        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>

            </thead>

            <tbody>

              ${
                orders
                  .slice(0, 3)
                  .map(
                    order => `
                      <tr>
                        <td>${order[0]}</td>
                        <td>${order[1]}</td>
                        <td>${money(order[2])}</td>
                        <td>${order[3]}</td>
                      </tr>
                    `
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>
      `;
  }
}


/* ==============================
   CLIENTS
============================== */

function renderClients() {

  const search =
    (
      $("#clientSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    clients.filter(
      client => {

        return (
          client.name +
          " " +
          client.email
        )
          .toLowerCase()
          .includes(search);
      }
    );


  if ($("#clientGrid")) {

    $("#clientGrid")
      .innerHTML =
      filtered.map(
        client => `
          <article class="client">

            <div class="avatar">
              ${initials(client.name)}
            </div>

            <div class="client-info">

              <strong>
                ${client.name}
              </strong>

              <br>

              <small>
                ${client.email}
                ·
                ${client.orders}
                commandes
                ·
                ${money(client.total)}
              </small>

            </div>

            <span>

              ${
                client.online
                  ? "🟢 En ligne"
                  : "⚪ Hors ligne"
              }

            </span>

          </article>
        `
      )
      .join("");
  }
}


/* ==============================
   CHAT
============================== */

function renderChats() {

  if (
    !$("#chatList") ||
    !$("#messages")
  ) {

    return;
  }


  $("#chatList")
    .innerHTML =
    chats.map(
      (
        chat,
        index
      ) => {

        const last =
          chat.messages[
            chat.messages.length - 1
          ]?.[1] || "";


        return `
          <button
            class="chat-user ${
              index === selectedChat
                ? "active"
                : ""
            }"
            data-chat-index="${index}"
            type="button"
          >

            <b>
              ${chat.name}
            </b>

            <br>

            <small>
              ${last}
            </small>

          </button>
        `;
      }
    )
    .join("");


  const active =
    chats[selectedChat];


  $("#messages")
    .innerHTML =
    active.messages
      .map(
        message => `
          <div
            class="bubble ${message[0]}"
          >
            ${message[1]}
          </div>
        `
      )
      .join("");


  $("#messages")
    .scrollTop =
    $("#messages")
      .scrollHeight;
}


/* ==============================
   GRAPHIQUES
============================== */

function drawChart(
  id,
  values,
  labels
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  const max =
    Math.max(...values);


  element.innerHTML =
    values.map(
      (
        value,
        index
      ) => {

        const height =
          Math.max(
            12,
            value /
            max *
            90
          );


        return `
          <div
            class="bar"
            style="height:${height}%"
          >

            <span>
              ${labels[index]}
            </span>

          </div>
        `;
      }
    )
    .join("");
}


/* ==============================
   PORTEFEUILLE
============================== */

function updateWallet() {

  /*
   * Aucun faux solde financier.
   *
   * Le vrai solde devra venir
   * du backend.
   */

  if ($("#walletBalance")) {

    $("#walletBalance")
      .textContent =
      money(0);
  }
}


/* ==============================
   MONCASH SANDBOX
============================== */

function openMonCashSandbox() {

  window.location.href =
    API_URL +
    "/moncash/test-payment";
}


function monCashWithdrawalUnavailable() {

  toast(
    "Retrait MonCash pas encore activé."
  );
}


/* ==============================
   ÉVÉNEMENTS
============================== */

function bindUI() {

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
      handleForgotPassword
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
          .toggle("open");


        $("#overlay")
          ?.classList
          .toggle("show");
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
        event.target;


      const pageButton =
        target.closest(
          "[data-page]"
        );


      if (pageButton) {

        showPage(
          pageButton
            .dataset.page
        );
      }


      const goButton =
        target.closest(
          "[data-go]"
        );


      if (goButton) {

        showPage(
          goButton
            .dataset.go
        );
      }


      const categoryButton =
        target.closest(
          "[data-category]"
        );


      if (categoryButton) {

        showPage(
          "products"
        );


        if (
          $("#categoryFilter")
        ) {

          $("#categoryFilter")
            .value =
            categoryButton
              .dataset.category;
        }


        renderProducts();
      }


      const chatButton =
        target.closest(
          "[data-chat-index]"
        );


      if (chatButton) {

        selectedChat =
          Number(
            chatButton
              .dataset
              .chatIndex
          );


        renderChats();
      }


      if (
        target.closest(
          ".add-cart"
        )
      ) {

        toast(
          "Produit ajouté au panier."
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
        renderOrders();
        renderClients();
        updateWallet();
        updateProfileUI();


        toast(
          "Devise changée."
        );
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


  $("#productForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        if (
          (
            currentProfile
              ?.role ||
            "buyer"
          ) !== "seller"
        ) {

          toast(
            "Cette action est réservée aux vendeurs."
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


        if (
          !name ||
          !Number.isFinite(
            price
          ) ||
          price <= 0
        ) {

          toast(
            "Vérifie le nom et le prix."
          );

          return;
        }


        products.unshift({
          id: Date.now(),
          name,
          category,
          price,
          emoji: "📦"
        });


        event
          .currentTarget
          .reset();


        if (
          $("#productStock")
        ) {

          $("#productStock")
            .value =
            1;
        }


        renderProducts();

        showPage(
          "products"
        );


        toast(
          "Produit publié."
        );
      }
    );


  $("#chatForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const input =
          $("#messageInput");


        const text =
          input
            ?.value
            .trim();


        if (!text) {
          return;
        }


        chats[
          selectedChat
        ]
          .messages
          .push([
            "me",
            text
          ]);


        input.value =
          "";


        renderChats();
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


        if (
          $("#productSearch")
        ) {

          $("#productSearch")
            .value =
            event
              .currentTarget
              .value;
        }


        renderProducts();
      }
    );


  $("#depositBtn")
    ?.addEventListener(
      "click",
      openMonCashSandbox
    );


  $("#withdrawBtn")
    ?.addEventListener(
      "click",
      monCashWithdrawalUnavailable
    );
}


/* ==============================
   DÉMARRAGE
============================== */

bindUI();


if ($("#currencySelect")) {

  $("#currencySelect")
    .value =
    currency;
}


renderProducts();
renderOrders();
renderClients();
renderChats();
updateWallet();


drawChart(
  "revenueChart",
  [
    6200,
    7200,
    6900,
    8400,
    9300,
    10800,
    12480
  ],
  [
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Aoû"
  ]
);


/* ==============================
   ÉTAT FIREBASE AUTH
============================== */

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

      currentProfile =
        await loadProfile(
          user
        );


      showApp();

    } catch (error) {

      console.error(
        error
      );


      currentProfile = {

        name:
          user.email
            ?.split("@")[0] ||
          "Utilisateur",

        email:
          user.email || "",

        role:
          "buyer"

      };


      showApp();


      toast(
        "Connecté, mais le profil n'a pas pu être chargé."
      );
    }
  }
);

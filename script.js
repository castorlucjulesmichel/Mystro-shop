'use strict';

/* =====================================================
   MYSTRO-SHOP V4
   FIREBASE AUTHENTICATION + CLOUD FIRESTORE
===================================================== */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


/* =====================================================
   CONFIGURATION FIREBASE
===================================================== */

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


/* =====================================================
   COMMISSION MYSTRO-SHOP
===================================================== */

const MYSTRO_COMMISSION_RATE = 0.10;

/*
  10 % = Mystro-Shop
  90 % = vendeur

  IMPORTANT :
  le calcul financier réel sera effectué côté serveur.
*/


/* =====================================================
   DEVISES
===================================================== */

const rates = {
  USD: 1,
  HTG: 131.5,
  EUR: 0.92,
  CAD: 1.36,
  GBP: 0.79
};

const symbols = {
  USD: '$',
  HTG: 'G',
  EUR: '€',
  CAD: 'C$',
  GBP: '£'
};

let currency =
  localStorage.getItem('mystroCurrency') || 'USD';

let currentUser = null;

let currentProfile = null;

let products = [];

let cartCount = 0;

let unsubscribeProducts = null;


/* =====================================================
   RACCOURCIS DOM
===================================================== */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));


/* =====================================================
   ARGENT
===================================================== */

function money(valueUSD) {

  const converted =
    Number(valueUSD || 0) * rates[currency];

  const locale =
    currency === 'HTG'
      ? 'fr-HT'
      : 'fr-FR';

  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted)
    +
    ' '
    +
    symbols[currency]
  );
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  const toast = $('#toast');

  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;

  toast.classList.add('show');

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove('show');

    }, 2200);
}


/* =====================================================
   ERREURS FIREBASE
===================================================== */

function firebaseErrorMessage(error) {

  const code = error?.code || '';

  const messages = {

    'auth/email-already-in-use':
      'Cette adresse e-mail est déjà utilisée.',

    'auth/invalid-email':
      'Adresse e-mail invalide.',

    'auth/weak-password':
      'Le mot de passe doit contenir au moins 6 caractères.',

    'auth/invalid-credential':
      'E-mail ou mot de passe incorrect.',

    'auth/user-not-found':
      'Compte introuvable.',

    'auth/wrong-password':
      'E-mail ou mot de passe incorrect.',

    'auth/too-many-requests':
      'Trop de tentatives. Réessaie plus tard.',

    'auth/network-request-failed':
      'Vérifie ta connexion Internet.'

  };

  return (
    messages[code]
    ||
    'Une erreur Firebase est survenue.'
  );
}


/* =====================================================
   SÉCURITÉ HTML
===================================================== */

function escapeHTML(value) {

  return String(value ?? '')

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#039;');
}


/* =====================================================
   PROFIL
===================================================== */

function initials(name) {

  return (
    String(name || 'MS')

      .trim()

      .split(/\s+/)

      .slice(0, 2)

      .map(
        part =>
          part.charAt(0).toUpperCase()
      )

      .join('')

    || 'MS'
  );
}


function roleLabel(role) {

  return role === 'seller'
    ? 'Vendeur'
    : 'Acheteur';
}


/* =====================================================
   ÉCRAN AUTH
===================================================== */

function showAuth(mode = 'login') {

  $('#authScreen')
    ?.classList.remove('hidden');

  $('#appShell')
    ?.classList.add('app-locked');

  $('#appShell')
    ?.classList.remove('app-ready');

  switchAuthMode(mode);
}


function showApp() {

  $('#authScreen')
    ?.classList.add('hidden');

  $('#appShell')
    ?.classList.remove('app-locked');

  $('#appShell')
    ?.classList.add('app-ready');

  updateProfileUI();

  applyRolePermissions();

  showPage('home');
}


function switchAuthMode(mode) {

  const login =
    mode === 'login';

  $('#loginTab')
    ?.classList.toggle(
      'active',
      login
    );

  $('#signupTab')
    ?.classList.toggle(
      'active',
      !login
    );

  $('#loginForm')
    ?.classList.toggle(
      'active',
      login
    );

  $('#signupForm')
    ?.classList.toggle(
      'active',
      !login
    );
}


/* =====================================================
   FIRESTORE : PROFIL
===================================================== */

async function createProfile(
  uid,
  data
) {

  await setDoc(
    doc(
      db,
      'users',
      uid
    ),
    {

      name:
        data.name,

      email:
        data.email,

      role:
        data.role,

      currency:
        currency,

      createdAt:
        serverTimestamp()

    }
  );
}


async function loadProfile(uid) {

  const snapshot =
    await getDoc(
      doc(
        db,
        'users',
        uid
      )
    );

  if (!snapshot.exists()) {

    return null;
  }

  return {

    id:
      snapshot.id,

    ...snapshot.data()

  };
}


/* =====================================================
   INSCRIPTION FIREBASE
===================================================== */

async function handleSignup(event) {

  event.preventDefault();

  const name =
    $('#signupName')
      ?.value
      .trim();

  const email =
    $('#signupEmail')
      ?.value
      .trim()
      .toLowerCase();

  const role =
    $('#signupRole')
      ?.value
      ||
      'buyer';

  const password =
    $('#signupPassword')
      ?.value
      ||
      '';

  const confirm =
    $('#signupPasswordConfirm')
      ?.value
      ||
      '';


  if (
    !name
    ||
    !email
    ||
    password.length < 6
  ) {

    showToast(
      'Remplis tous les champs. Mot de passe : 6 caractères minimum.'
    );

    return;
  }


  if (
    ![
      'buyer',
      'seller'
    ].includes(role)
  ) {

    showToast(
      'Rôle utilisateur invalide.'
    );

    return;
  }


  if (
    password !== confirm
  ) {

    showToast(
      'Les mots de passe ne correspondent pas.'
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


    await createProfile(
      credential.user.uid,
      {
        name,
        email,
        role
      }
    );


    event.currentTarget.reset();


    showToast(
      'Compte Firebase créé avec succès.'
    );

  }

  catch (error) {

    console.error(error);

    showToast(
      firebaseErrorMessage(error)
    );
  }
}


/* =====================================================
   CONNEXION FIREBASE
===================================================== */

async function handleLogin(event) {

  event.preventDefault();

  const email =
    $('#loginEmail')
      ?.value
      .trim()
      .toLowerCase();

  const password =
    $('#loginPassword')
      ?.value
      ||
      '';


  if (
    !email
    ||
    !password
  ) {

    showToast(
      'Entre ton e-mail et ton mot de passe.'
    );

    return;
  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    event.currentTarget.reset();


    showToast(
      'Connexion réussie.'
    );

  }

  catch (error) {

    console.error(error);

    showToast(
      firebaseErrorMessage(error)
    );
  }
}


/* =====================================================
   MOT DE PASSE OUBLIÉ
===================================================== */

async function resetPassword() {

  const email =
    $('#loginEmail')
      ?.value
      .trim()
      .toLowerCase();


  if (!email) {

    showToast(
      'Entre d’abord ton adresse e-mail.'
    );

    return;
  }


  try {

    await sendPasswordResetEmail(
      auth,
      email
    );


    showToast(
      'E-mail de réinitialisation envoyé.'
    );

  }

  catch (error) {

    console.error(error);

    showToast(
      firebaseErrorMessage(error)
    );
  }
}


/* =====================================================
   DÉCONNEXION
===================================================== */

async function logout() {

  try {

    await signOut(auth);

    showToast(
      'Vous êtes déconnecté.'
    );

  }

  catch (error) {

    console.error(error);

    showToast(
      'Impossible de se déconnecter.'
    );
  }
}


/* =====================================================
   AFFICHAGE DU PROFIL
===================================================== */

function updateProfileUI() {

  if (!currentProfile) {
    return;
  }

  const avatar =
    initials(
      currentProfile.name
    );

  const label =
    roleLabel(
      currentProfile.role
    );


  [
    '#sidebarAvatar',
    '#topAvatar',
    '#profileAvatar'
  ].forEach(
    selector => {

      const el =
        $(selector);

      if (el) {
        el.textContent =
          avatar;
      }
    }
  );


  if ($('#sidebarUserName')) {

    $('#sidebarUserName')
      .textContent =
      currentProfile.name;
  }


  if ($('#sidebarUserRole')) {

    $('#sidebarUserRole')
      .textContent =
      label;
  }


  if ($('#profileName')) {

    $('#profileName')
      .textContent =
      currentProfile.name;
  }


  if ($('#profileEmail')) {

    $('#profileEmail')
      .textContent =
      currentProfile.email;
  }


  if ($('#profileRole')) {

    $('#profileRole')
      .textContent =
      label;
  }


  if ($('#profileNameInfo')) {

    $('#profileNameInfo')
      .textContent =
      currentProfile.name;
  }


  if ($('#profileEmailInfo')) {

    $('#profileEmailInfo')
      .textContent =
      currentProfile.email;
  }


  if ($('#profileRoleInfo')) {

    $('#profileRoleInfo')
      .textContent =
      label;
  }


  if ($('#profileCurrencyInfo')) {

    $('#profileCurrencyInfo')
      .textContent =
      currency;
  }
}


/* =====================================================
   PERMISSIONS ACHETEUR / VENDEUR
===================================================== */

function applyRolePermissions() {

  const sellerPages = [

    'dashboard',
    'sell',
    'wallet',
    'stats',
    'clients'

  ];


  const isSeller =
    currentProfile?.role ===
    'seller';


  $$('.nav-btn[data-page]')
    .forEach(button => {

      button.classList.toggle(

        'hidden-by-role',

        sellerPages.includes(
          button.dataset.page
        )
        &&
        !isSeller
      );

    });


  $$('.seller-only')
    .forEach(el => {

      el.classList.toggle(
        'hidden-by-role',
        !isSeller
      );

    });
}


/* =====================================================
   MENU
===================================================== */

function closeSidebar() {

  $('#sidebar')
    ?.classList.remove('open');

  $('#overlay')
    ?.classList.remove('show');
}


/* =====================================================
   NAVIGATION
===================================================== */

function showPage(pageId) {

  if (
    !currentUser
    ||
    !currentProfile
  ) {

    showAuth('login');

    return;
  }


  const sellerPages = [

    'dashboard',
    'sell',
    'wallet',
    'stats',
    'clients'

  ];


  if (
    sellerPages.includes(pageId)
    &&
    currentProfile.role !==
      'seller'
  ) {

    showToast(
      'Cette section est réservée aux vendeurs.'
    );

    pageId =
      'home';
  }


  $$('.page')
    .forEach(page => {

      page.classList.toggle(
        'active',
        page.id === pageId
      );

    });


  $$('.nav-btn')
    .forEach(btn => {

      btn.classList.toggle(
        'active',
        btn.dataset.page === pageId
      );

    });


  if (
    pageId === 'profile'
  ) {

    updateProfileUI();
  }


  closeSidebar();


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =====================================================
   PRODUITS
===================================================== */

function emojiForCategory(category) {

  const map = {

    Mode:
      '👜',

    'Électronique':
      '📱',

    Maison:
      '🏠',

    Beauté:
      '✨',

    Sports:
      '👟',

    Alimentation:
      '🍎'

  };

  return (
    map[category]
    ||
    '📦'
  );
}


function productCard(product) {

  return `
    <article class="product-card">

      <div class="product-image">

        ${
          product.emoji
          ||
          emojiForCategory(
            product.category
          )
        }

      </div>

      <div class="product-body">

        <h3>
          ${
            escapeHTML(
              product.name
              ||
              'Produit'
            )
          }
        </h3>

        <div class="product-category">

          ${
            escapeHTML(
              product.category
              ||
              ''
            )
          }

        </div>

        <div class="product-price">

          ${
            money(
              product.price
            )
          }

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


/* =====================================================
   AFFICHER PRODUITS
===================================================== */

function renderProducts() {

  const grid =
    $('#productGrid');

  if (!grid) {
    return;
  }


  const search =
    (
      $('#productSearch')
        ?.value
      ||
      ''
    )
    .trim()
    .toLowerCase();


  const category =
    $('#categoryFilter')
      ?.value
    ||
    'all';


  const filtered =
    products.filter(
      product => {

        const text =
          `${
            product.name
            ||
            ''
          } ${
            product.category
            ||
            ''
          }`
          .toLowerCase();


        const matchesSearch =
          text.includes(search);


        const matchesCategory =
          category === 'all'
          ||
          product.category ===
            category;


        return (
          matchesSearch
          &&
          matchesCategory
        );
      }
    );


  grid.innerHTML =

    filtered
      .map(productCard)
      .join('')

    ||

    `
      <div class="panel">
        Aucun produit trouvé.
      </div>
    `;
}


/* =====================================================
   PRODUITS EN VEDETTE
===================================================== */

function renderFeatured() {

  const featured =
    $('#featuredProducts');


  if (!featured) {
    return;
  }


  featured.innerHTML =

    products
      .slice(0, 4)
      .map(productCard)
      .join('')

    ||

    `
      <div class="panel">
        Les produits apparaîtront ici.
      </div>
    `;
}


/* =====================================================
   ÉCOUTE FIRESTORE PRODUITS
===================================================== */

function startProductsListener() {

  if (unsubscribeProducts) {

    unsubscribeProducts();
  }


  const productsQuery =
    query(

      collection(
        db,
        'products'
      ),

      where(
        'active',
        '==',
        true
      )

    );


  unsubscribeProducts =
    onSnapshot(

      productsQuery,

      snapshot => {

        products =
          snapshot.docs
            .map(item => ({

              id:
                item.id,

              ...item.data()

            }));


        products.sort(
          (a, b) => {

            const dateA =
              a.createdAt
                ?.seconds
              ||
              0;

            const dateB =
              b.createdAt
                ?.seconds
              ||
              0;

            return (
              dateB
              -
              dateA
            );
          }
        );


        renderProducts();

        renderFeatured();
      },


      error => {

        console.error(error);

        showToast(
          'Impossible de charger les produits.'
        );
      }
    );
}


/* =====================================================
   PUBLIER PRODUIT FIRESTORE
===================================================== */

async function addProductFromForm(
  event
) {

  event.preventDefault();


  if (
    currentProfile?.role !==
    'seller'
  ) {

    showToast(
      'Seuls les vendeurs peuvent publier des produits.'
    );

    return;
  }


  const name =
    $('#productName')
      ?.value
      .trim();


  const category =
    $('#productCategory')
      ?.value;


  const price =
    Number(
      $('#productPrice')
        ?.value
    );


  const stock =
    Number.parseInt(

      $('#productStock')
        ?.value
      ||
      '0',

      10
    );


  const description =
    $('#productDescription')
      ?.value
      .trim()
    ||
    '';


  if (
    !name
    ||
    !category
    ||
    !Number.isFinite(price)
    ||
    price <= 0
  ) {

    showToast(
      'Vérifie le nom, la catégorie et le prix.'
    );

    return;
  }


  if (
    !Number.isInteger(stock)
    ||
    stock < 0
  ) {

    showToast(
      'Le stock doit être un nombre entier positif.'
    );

    return;
  }


  try {

    await addDoc(

      collection(
        db,
        'products'
      ),

      {

        sellerId:
          currentUser.uid,

        sellerName:
          currentProfile.name,

        name,

        category,

        price,

        stock,

        description,

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    event.currentTarget
      .reset();


    if ($('#productStock')) {

      $('#productStock')
        .value =
        '1';
    }


    showToast(
      'Produit publié dans Mystro-Shop.'
    );


    showPage(
      'products'
    );

  }

  catch (error) {

    console.error(error);

    showToast(
      'Impossible de publier le produit.'
    );
  }
}


/* =====================================================
   COMMANDES
   BLOQUÉES JUSQU'AU SERVEUR SÉCURISÉ
===================================================== */

function renderOrdersLocked() {

  const tbody =
    $('#ordersTable');


  if (tbody) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Les commandes sécurisées seront activées avec le système serveur Mystro-Shop.
        </td>
      </tr>
    `;
  }


  const preview =
    $('#ordersPreview');


  if (preview) {

    preview.innerHTML = `
      <div class="transaction">

        <span>
          Commandes sécurisées
        </span>

        <strong>
          Prochaine étape
        </strong>

      </div>
    `;
  }
}


/* =====================================================
   GRAPHIQUES
===================================================== */

function renderChart(
  containerId,
  values,
  labels
) {

  const el =
    $(containerId);


  if (!el) {
    return;
  }


  const max =
    Math.max(...values);


  el.innerHTML =

    values
      .map(
        (value, index) => {

          const height =
            Math.max(

              12,

              Math.round(
                (
                  value
                  /
                  max
                )
                *
                210
              )

            );


          return `
            <div
              class="bar"
              style="height:${height}px"
            >

              <span>
                ${labels[index]}
              </span>

            </div>
          `;
        }
      )
      .join('');
}


/* =====================================================
   DEVISE
===================================================== */

function updateCurrencyUI() {

  const select =
    $('#currencySelect');


  if (select) {

    select.value =
      currency;
  }


  if (
    $('#profileCurrencyInfo')
  ) {

    $('#profileCurrencyInfo')
      .textContent =
      currency;
  }


  renderProducts();

  renderFeatured();


  /*
    Le portefeuille réel n'est pas encore activé.
  */

  const balance =
    $('#walletBalance');


  if (balance) {

    balance.textContent =
      money(0);
  }
}


/* =====================================================
   CHAT
===================================================== */

function initChatPlaceholder() {

  const list =
    $('#chatList');

  const messages =
    $('#messages');


  if (list) {

    list.innerHTML = `
      <button
        class="chat-user active"
        type="button"
      >

        <strong>
          Messagerie Mystro-Shop
        </strong>

        <br>

        <small>
          Chat sécurisé bientôt disponible.
        </small>

      </button>
    `;
  }


  if (messages) {

    messages.innerHTML = `
      <div class="bubble them">

        La messagerie Firestore sera activée
        lors de la prochaine étape.

      </div>
    `;
  }
}


/* =====================================================
   ÉVÉNEMENTS
===================================================== */

function initEvents() {

  $('#loginTab')
    ?.addEventListener(
      'click',
      () =>
        switchAuthMode(
          'login'
        )
    );


  $('#signupTab')
    ?.addEventListener(
      'click',
      () =>
        switchAuthMode(
          'signup'
        )
    );


  $('#loginForm')
    ?.addEventListener(
      'submit',
      handleLogin
    );


  $('#signupForm')
    ?.addEventListener(
      'submit',
      handleSignup
    );


  $('#forgotPasswordBtn')
    ?.addEventListener(
      'click',
      resetPassword
    );


  $('#logoutBtn')
    ?.addEventListener(
      'click',
      logout
    );


  $('#profileLogoutBtn')
    ?.addEventListener(
      'click',
      logout
    );


  $('#menuToggle')
    ?.addEventListener(
      'click',
      () => {

        $('#sidebar')
          ?.classList.add(
            'open'
          );

        $('#overlay')
          ?.classList.add(
            'show'
          );
      }
    );


  $('#overlay')
    ?.addEventListener(
      'click',
      closeSidebar
    );


  document.addEventListener(
    'click',
    event => {

      const target =
        event.target;


      if (
        !(
          target
          instanceof
          Element
        )
      ) {

        return;
      }


      const nav =
        target.closest(
          '[data-page]'
        );


      if (nav) {

        showPage(
          nav.getAttribute(
            'data-page'
          )
        );
      }


      const go =
        target.closest(
          '[data-go]'
        );


      if (go) {

        showPage(
          go.getAttribute(
            'data-go'
          )
        );
      }


      const category =
        target.closest(
          '[data-category]'
        );


      if (category) {

        showPage(
          'products'
        );


        if (
          $('#categoryFilter')
        ) {

          $('#categoryFilter')
            .value =
            category.getAttribute(
              'data-category'
            );
        }


        renderProducts();
      }


      const cartButton =
        target.closest(
          '.add-cart'
        );


      if (cartButton) {

        cartCount += 1;


        showToast(
          `Produit ajouté au panier (${cartCount}).`
        );
      }
    }
  );


  $('#currencySelect')
    ?.addEventListener(
      'change',
      event => {

        currency =
          event.target.value;


        localStorage.setItem(
          'mystroCurrency',
          currency
        );


        updateCurrencyUI();
      }
    );


  $('#productSearch')
    ?.addEventListener(
      'input',
      renderProducts
    );


  $('#categoryFilter')
    ?.addEventListener(
      'change',
      renderProducts
    );


  $('#productForm')
    ?.addEventListener(
      'submit',
      addProductFromForm
    );


  /* =====================================
     PAIEMENTS RÉELS BLOQUÉS
  ===================================== */

  $('#depositBtn')
    ?.addEventListener(
      'click',
      () => {

        showToast(
          'Les dépôts réels ne sont pas encore activés.'
        );
      }
    );


  $('#withdrawBtn')
    ?.addEventListener(
      'click',
      () => {

        showToast(
          'Les retraits réels ne sont pas encore activés.'
        );
      }
    );


  $('#chatForm')
    ?.addEventListener(
      'submit',
      event => {

        event.preventDefault();

        showToast(
          'Le chat sécurisé sera activé à la prochaine étape.'
        );
      }
    );
}


/* =====================================================
   INTERFACE STATIQUE
===================================================== */

function initStaticUI() {

  renderChart(

    '#revenueChart',

    [
      42,
      58,
      49,
      73,
      65,
      88,
      96
    ],

    [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil'
    ]
  );


  renderChart(

    '#statsChart',

    [
      48,
      62,
      55,
      77,
      85,
      92
    ],

    [
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil'
    ]
  );


  renderOrdersLocked();

  initChatPlaceholder();

  updateCurrencyUI();
}


/* =====================================================
   SURVEILLER CONNEXION FIREBASE
===================================================== */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user) {

      currentProfile =
        null;


      if (
        unsubscribeProducts
      ) {

        unsubscribeProducts();

        unsubscribeProducts =
          null;
      }


      showAuth(
        'login'
      );


      return;
    }


    try {

      currentProfile =
        await loadProfile(
          user.uid
        );


      if (
        !currentProfile
      ) {

        showToast(
          'Profil Firestore introuvable.'
        );


        await signOut(
          auth
        );


        return;
      }


      showApp();


      startProductsListener();

    }

    catch (error) {

      console.error(error);


      showToast(
        'Impossible de charger ton profil.'
      );


      await signOut(
        auth
      );
    }
  }
);


/* =====================================================
   DÉMARRAGE
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initStaticUI();

    initEvents();
  }
);


/* =====================================================
   RÈGLE FINANCIÈRE
===================================================== */

/*
  Mystro-Shop prélève exactement 10 %
  sur chaque vente finalisée.

  Exemple :

  Vente : 100 USD
  Mystro-Shop : 10 USD
  Vendeur : 90 USD

  Cette opération ne sera PAS exécutée
  directement dans ce navigateur.

  Elle sera sécurisée côté serveur
  dans la prochaine phase.
*/

void MYSTRO_COMMISSION_RATE;

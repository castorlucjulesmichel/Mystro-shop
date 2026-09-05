/* ============================================================
   MYSTRO-SHOP V4
   SCRIPT.JS COMPLET CORRIGÉ
   Firebase + Firestore + Supabase
   Authentification + Produits + Panier
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
  sendPasswordResetEmail,
  signOut,
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

console.log("✅ Firebase connecté");


/* ============================================================
   3. SUPABASE
   ============================================================ */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

console.log("✅ Supabase connecté");


/* ============================================================
   4. VARIABLES
   ============================================================ */

let currentUser = null;

let currentProfile = null;

let products = [];

let cart = [];

const MYSTRO_COMMISSION_RATE =
  0.10;

let selectedCurrency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";


/* ============================================================
   5. TAUX D'AFFICHAGE
   ============================================================ */

const currencyRates = {

  HTG: 1,

  USD: 132,

  EUR: 145,

  CAD: 96,

  GBP: 170,

  DOP: 2.2,

  XOF: 0.22
};


/* ============================================================
   6. OUTILS
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


function getFirstElement(
  selectors
) {

  for (
    const selector
    of selectors
  ) {

    const element =
      document.querySelector(
        selector
      );

    if (element) {

      return element;
    }
  }

  return null;
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
  name = "image"
) {

  return name
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
   7. TOAST
   ============================================================ */

function showToast(
  message,
  type = "info"
) {

  console.log(
    `[Mystro-Shop ${type}]`,
    message
  );

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
      "35px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "9999999";

    toast.style.maxWidth =
      "90%";

    toast.style.padding =
      "15px 22px";

    toast.style.borderRadius =
      "16px";

    toast.style.color =
      "#ffffff";

    toast.style.fontSize =
      "16px";

    toast.style.fontWeight =
      "700";

    toast.style.textAlign =
      "center";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.3)";

    document.body.appendChild(
      toast
    );
  }

  if (
    type === "success"
  ) {

    toast.style.background =
      "#15803d";
  }

  else if (
    type === "warning"
  ) {

    toast.style.background =
      "#b45309";
  }

  else if (
    type === "error"
  ) {

    toast.style.background =
      "#991b1b";
  }

  else {

    toast.style.background =
      "#1d4ed8";
  }

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
      4500
    );
}


/* ============================================================
   8. CHARGEMENT BOUTON
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
      !button.dataset.oldText
    ) {

      button.dataset.oldText =
        button.textContent;
    }

    button.disabled = true;

    button.style.opacity =
      "0.7";

    button.textContent =
      loadingText;
  }

  else {

    button.disabled = false;

    button.style.opacity =
      "1";

    if (
      button.dataset.oldText
    ) {

      button.textContent =
        button.dataset.oldText;
    }
  }
}


/* ============================================================
   9. AFFICHAGE APPLICATION
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


function hideWelcomeScreen() {

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


function showWelcomeScreen() {

  const welcome =
    document.getElementById(
      "welcomePage"
    );

  if (welcome) {

    welcome.style.display =
      "flex";
  }

  showMainApp();
}


/* ============================================================
   10. MODALE AUTH
   ============================================================ */

function removeGeneratedAuthModal() {

  const modal =
    document.getElementById(
      "generatedAuthModal"
    );

  if (modal) {

    modal.remove();
  }
}


function addGeneratedAuthStyles() {

  if (
    document.getElementById(
      "mystroGeneratedAuthStyles"
    )
  ) {

    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "mystroGeneratedAuthStyles";

  style.textContent = `

    .mystro-auth-overlay {

      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(8,18,49,.80);

    }

    .mystro-auth-box {

      position: relative;
      width: 100%;
      max-width: 440px;
      padding: 30px 24px;
      box-sizing: border-box;
      border-radius: 25px;
      background: #ffffff;
      box-shadow:
        0 20px 60px
        rgba(0,0,0,.25);

    }

    .mystro-auth-box h2 {

      margin: 0 0 8px;
      font-size: 27px;
      color: #111827;

    }

    .mystro-auth-box p {

      margin-bottom: 22px;
      color: #6b7280;

    }

    .mystro-auth-box label {

      display: block;
      margin: 14px 0 7px;
      font-weight: 700;
      color: #111827;

    }

    .mystro-auth-box input {

      width: 100%;
      box-sizing: border-box;
      padding: 15px;
      border: 1px solid #d1d5db;
      border-radius: 13px;
      outline: none;
      font-size: 16px;

    }

    .mystro-auth-box input:focus {

      border-color: #3159db;

    }

    .mystro-main-auth-btn {

      width: 100%;
      margin-top: 22px;
      padding: 16px;
      border: 0;
      border-radius: 14px;
      background: #3159db;
      color: white;
      font-size: 17px;
      font-weight: 800;

    }

    .mystro-link-auth {

      width: 100%;
      margin-top: 12px;
      padding: 12px;
      border: 0;
      background: transparent;
      color: #2563eb;
      font-weight: 700;

    }

    .mystro-close-auth {

      position: absolute;
      top: 12px;
      right: 16px;
      border: 0;
      background: transparent;
      color: #374151;
      font-size: 32px;

    }

  `;

  document.head.appendChild(
    style
  );
}


/* ============================================================
   11. OUVRIR CONNEXION
   ============================================================ */

function openGeneratedLogin() {

  removeGeneratedAuthModal();

  addGeneratedAuthStyles();

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "generatedAuthModal";

  overlay.innerHTML = `

    <div class="mystro-auth-overlay">

      <div class="mystro-auth-box">

        <button
          id="closeGeneratedAuth"
          type="button"
          class="mystro-close-auth"
        >
          ×
        </button>

        <h2>
          Se connecter
        </h2>

        <p>
          Connectez-vous à votre compte Mystro-Shop.
        </p>

        <form id="generatedLoginForm">

          <label for="generatedLoginEmail">
            Email
          </label>

          <input
            id="generatedLoginEmail"
            type="email"
            autocomplete="email"
            placeholder="Votre adresse email"
            required
          >

          <label for="generatedLoginPassword">
            Mot de passe
          </label>

          <input
            id="generatedLoginPassword"
            type="password"
            autocomplete="current-password"
            placeholder="Votre mot de passe"
            required
          >

          <button
            id="realLoginSubmitBtn"
            type="submit"
            class="mystro-main-auth-btn"
          >
            Se connecter
          </button>

        </form>

        <button
          type="button"
          id="forgotPasswordBtn"
          class="mystro-link-auth"
        >
          Mot de passe oublié ?
        </button>

        <button
          id="goGeneratedRegister"
          type="button"
          class="mystro-link-auth"
        >
          Créer un compte
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeGeneratedAuth"
    )
    .addEventListener(
      "click",
      removeGeneratedAuthModal
    );


  document
    .getElementById(
      "goGeneratedRegister"
    )
    .addEventListener(
      "click",
      openGeneratedRegister
    );


  document
    .getElementById(
      "forgotPasswordBtn"
    )
    .addEventListener(
      "click",
      async () => {

        const email =
          document
            .getElementById(
              "generatedLoginEmail"
            )
            .value
            .trim();

        await resetPassword(
          email
        );
      }
    );


  const form =
    document.getElementById(
      "generatedLoginForm"
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      event.stopPropagation();

      const email =
        document
          .getElementById(
            "generatedLoginEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "generatedLoginPassword"
          )
          .value;

      const button =
        document.getElementById(
          "realLoginSubmitBtn"
        );

      if (
        !email ||
        !password
      ) {

        showToast(
          "Entrez votre email et votre mot de passe.",
          "warning"
        );

        return;
      }

      setButtonLoading(
        button,
        true,
        "Connexion..."
      );

      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        showToast(
          "Connexion réussie.",
          "success"
        );

        removeGeneratedAuthModal();

        hideWelcomeScreen();

      }

      catch (error) {

        console.error(
          "Erreur connexion Firebase:",
          error
        );

        let message =
          "Connexion impossible.";

        if (
          error.code ===
            "auth/invalid-credential" ||
          error.code ===
            "auth/wrong-password" ||
          error.code ===
            "auth/user-not-found"
        ) {

          message =
            "Email ou mot de passe incorrect.";
        }

        else if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Adresse email invalide.";
        }

        else if (
          error.code ===
          "auth/too-many-requests"
        ) {

          message =
            "Trop de tentatives. Réessayez plus tard.";
        }

        else if (
          error.code ===
          "auth/operation-not-allowed"
        ) {

          message =
            "La connexion par email n'est pas activée dans Firebase.";
        }

        else if (
          error.message
        ) {

          message =
            "Connexion impossible : " +
            error.message;
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
   12. OUVRIR INSCRIPTION
   ============================================================ */

function openGeneratedRegister() {

  removeGeneratedAuthModal();

  addGeneratedAuthStyles();

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "generatedAuthModal";

  overlay.innerHTML = `

    <div class="mystro-auth-overlay">

      <div class="mystro-auth-box">

        <button
          id="closeGeneratedAuth"
          type="button"
          class="mystro-close-auth"
        >
          ×
        </button>

        <h2>
          S'inscrire
        </h2>

        <p>
          Créez votre compte Mystro-Shop.
        </p>

        <form id="generatedRegisterForm">

          <label for="generatedRegisterName">
            Nom
          </label>

          <input
            id="generatedRegisterName"
            type="text"
            autocomplete="name"
            placeholder="Votre nom"
            required
          >

          <label for="generatedRegisterEmail">
            Email
          </label>

          <input
            id="generatedRegisterEmail"
            type="email"
            autocomplete="email"
            placeholder="Votre adresse email"
            required
          >

          <label for="generatedRegisterPassword">
            Mot de passe
          </label>

          <input
            id="generatedRegisterPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            placeholder="6 caractères minimum"
            required
          >

          <button
            id="realRegisterSubmitBtn"
            type="submit"
            class="mystro-main-auth-btn"
          >
            S'inscrire
          </button>

        </form>

        <button
          id="goGeneratedLogin"
          type="button"
          class="mystro-link-auth"
        >
          J'ai déjà un compte
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeGeneratedAuth"
    )
    .addEventListener(
      "click",
      removeGeneratedAuthModal
    );


  document
    .getElementById(
      "goGeneratedLogin"
    )
    .addEventListener(
      "click",
      openGeneratedLogin
    );


  const form =
    document.getElementById(
      "generatedRegisterForm"
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      event.stopPropagation();

      const name =
        document
          .getElementById(
            "generatedRegisterName"
          )
          .value
          .trim();

      const email =
        document
          .getElementById(
            "generatedRegisterEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "generatedRegisterPassword"
          )
          .value;

      const button =
        document.getElementById(
          "realRegisterSubmitBtn"
        );

      if (
        !name ||
        !email ||
        !password
      ) {

        showToast(
          "Remplissez tous les champs.",
          "warning"
        );

        return;
      }

      if (
        password.length < 6
      ) {

        showToast(
          "Le mot de passe doit contenir au moins 6 caractères.",
          "warning"
        );

        return;
      }

      setButtonLoading(
        button,
        true,
        "Création..."
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

              name:
                name,

              email:
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

        catch (
          firestoreError
        ) {

          console.error(
            "Erreur profil Firestore:",
            firestoreError
          );

          /*
            Le compte Firebase existe quand même.
            On ne présente donc pas l'inscription
            entière comme échouée.
          */
        }


        showToast(
          "Compte créé avec succès.",
          "success"
        );

        removeGeneratedAuthModal();

        hideWelcomeScreen();

      }

      catch (error) {

        console.error(
          "Erreur inscription Firebase:",
          error
        );

        let message =
          "Inscription impossible.";

        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          message =
            "Cette adresse email possède déjà un compte.";
        }

        else if (
          error.code ===
          "auth/weak-password"
        ) {

          message =
            "Le mot de passe doit contenir au moins 6 caractères.";
        }

        else if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Adresse email invalide.";
        }

        else if (
          error.code ===
          "auth/operation-not-allowed"
        ) {

          message =
            "L'inscription par email n'est pas activée dans Firebase.";
        }

        else if (
          error.message
        ) {

          message =
            "Inscription impossible : " +
            error.message;
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
   13. BOUTONS AUTH DE L'ÉCRAN D'ACCUEIL
   CORRECTION IMPORTANTE :
   ON NE RECHERCHE PLUS TOUS LES BOUTONS PAR LEUR TEXTE.
   ============================================================ */

function setupWelcomeAuthButtons() {

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
    loginButton.dataset
      .mystroWelcomeReady !==
      "1"
  ) {

    loginButton.dataset
      .mystroWelcomeReady =
      "1";

    loginButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        openGeneratedLogin();
      }
    );
  }


  if (
    registerButton &&
    registerButton.dataset
      .mystroWelcomeReady !==
      "1"
  ) {

    registerButton.dataset
      .mystroWelcomeReady =
      "1";

    registerButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        openGeneratedRegister();
      }
    );
  }
}


/* ============================================================
   14. OBSERVATEUR AUTH FIREBASE
   ============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;

    if (user) {

      console.log(
        "✅ Utilisateur connecté:",
        user.uid
      );

      hideWelcomeScreen();

      await loadUserProfile(
        user
      );

      updateAuthInterface(
        true
      );

      await loadProducts();
    }

    else {

      console.log(
        "Utilisateur déconnecté"
      );

      currentProfile =
        null;

      updateAuthInterface(
        false
      );

      showWelcomeScreen();
    }
  }
);


/* ============================================================
   15. PROFIL UTILISATEUR
   ============================================================ */

async function loadUserProfile(
  user
) {

  try {

    const ref =
      doc(
        db,
        "users",
        user.uid
      );

    const snapshot =
      await getDoc(
        ref
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
          ref,
          {
            ...currentProfile,

            createdAt:
              serverTimestamp()
          }
        );

      }

      catch (error) {

        console.error(
          "Impossible de créer le profil Firestore:",
          error
        );
      }
    }

    updateProfileInterface();

  }

  catch (error) {

    console.error(
      "Erreur profil:",
      error
    );
  }
}


/* ============================================================
   16. INTERFACE UTILISATEUR
   ============================================================ */

function updateAuthInterface(
  loggedIn
) {

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  )
  .forEach(
    element => {

      element.style.display =
        loggedIn
          ? ""
          : "none";
    }
  );

  updateProfileInterface();
}


function updateProfileInterface() {

  if (!currentUser) {

    return;
  }

  const name =

    currentProfile?.name ||

    currentUser.displayName ||

    currentUser.email
      ?.split("@")[0] ||

    "Utilisateur";


  $all(
    "[data-user-name]"
  )
  .forEach(
    element => {

      element.textContent =
        name;
    }
  );


  const initials =
    document.getElementById(
      "userInitials"
    );

  if (initials) {

    initials.textContent =
      name
        .split(" ")
        .filter(Boolean)
        .map(
          word =>
            word.charAt(0)
        )
        .join("")
        .substring(0, 2)
        .toUpperCase();
  }
}


/* ============================================================
   17. MOT DE PASSE OUBLIÉ
   ============================================================ */

async function resetPassword(
  email
) {

  if (!email) {

    showToast(
      "Entrez d'abord votre adresse email.",
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
  }

  catch (error) {

    console.error(
      "Reset password:",
      error
    );

    showToast(
      "Impossible d'envoyer l'email de réinitialisation.",
      "error"
    );
  }
}


/* ============================================================
   18. DÉCONNEXION
   ============================================================ */

async function logoutUser() {

  try {

    await signOut(
      auth
    );

    showToast(
      "Déconnexion réussie.",
      "success"
    );

    showWelcomeScreen();
  }

  catch (error) {

    console.error(
      "Déconnexion:",
      error
    );

    showToast(
      "Déconnexion impossible.",
      "error"
    );
  }
}


/* ============================================================
   19. BOUTON DÉCONNEXION
   ============================================================ */

function setupLogoutButtons() {

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  )
  .forEach(
    button => {

      if (
        button.dataset
          .mystroLogoutReady ===
        "1"
      ) {

        return;
      }

      button.dataset
        .mystroLogoutReady =
        "1";

      button.addEventListener(
        "click",
        async event => {

          event.preventDefault();

          await logoutUser();
        }
      );
    }
  );
}


/* ============================================================
   20. NAVIGATION ENTRE PAGES
   ============================================================ */

function openPage(
  pageName
) {

  $all(
    ".app-page"
  )
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
      pageName + "Page"
    );

  if (target) {

    target.classList.add(
      "active-page"
    );

    target.style.display =
      "block";
  }


  $all(
    ".bottom-nav-item"
  )
  .forEach(
    button => {

      button.classList.remove(
        "active"
      );

      if (
        button.dataset.page ===
        pageName
      ) {

        button.classList.add(
          "active"
        );
      }
    }
  );


  const menu =
    document.getElementById(
      "mobileNav"
    );

  if (menu) {

    menu.classList.remove(
      "open"
    );
  }
}


function setupPageNavigation() {

  $all(
    "[data-page]"
  )
  .forEach(
    button => {

      if (
        button.dataset
          .mystroPageReady ===
        "1"
      ) {

        return;
      }

      button.dataset
        .mystroPageReady =
        "1";

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
   21. MENU MOBILE
   ============================================================ */

function setupMobileMenu() {

  const button =
    document.getElementById(
      "menuBtn"
    );

  const menu =
    document.getElementById(
      "mobileNav"
    );

  if (
    !button ||
    !menu
  ) {

    return;
  }

  if (
    button.dataset
      .mystroMenuReady ===
    "1"
  ) {

    return;
  }

  button.dataset
    .mystroMenuReady =
    "1";

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      menu.classList.toggle(
        "open"
      );
    }
  );
}


/* ============================================================
   22. CHAMPS PRODUIT
   ============================================================ */

function getProductFields() {

  return {

    name:
      document.getElementById(
        "productName"
      ),

    category:
      document.getElementById(
        "productCategory"
      ),

    price:
      document.getElementById(
        "productPrice"
      ),

    currency:
      document.getElementById(
        "productCurrency"
      ),

    stock:
      document.getElementById(
        "productStock"
      ),

    image:
      document.getElementById(
        "productImage"
      ),

    description:
      document.getElementById(
        "productDescription"
      )
  };
}


/* ============================================================
   23. PHOTO PRODUIT
   ============================================================ */

function validateImage(
  file
) {

  if (!file) {

    throw new Error(
      "Choisissez une photo du produit."
    );
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "Le fichier sélectionné n'est pas une image."
    );
  }

  if (
    file.size >
    8 * 1024 * 1024
  ) {

    throw new Error(
      "La photo dépasse 8 Mo."
    );
  }
}


const SUPABASE_BUCKETS = [

  "products",

  "product-images",

  "images",

  "public"
];


async function uploadProductImage(
  file,
  userId
) {

  validateImage(
    file
  );

  const safeName =
    normalizeFileName(
      file.name
    );

  const path =
    `${userId}/${Date.now()}_${safeName}`;

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

        lastError =
          error;

        console.warn(
          `Supabase ${bucket}:`,
          error.message
        );

        continue;
      }


      const {
        data: publicData
      } =
        supabase
          .storage
          .from(bucket)
          .getPublicUrl(
            data.path
          );


      if (
        publicData?.publicUrl
      ) {

        return {

          url:
            publicData.publicUrl,

          bucket:
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
        "Upload Supabase:",
        error
      );
    }
  }


  throw new Error(
    lastError?.message ||
    "Impossible d'envoyer la photo."
  );
}


/* ============================================================
   24. COMMISSION MYSTRO-SHOP
   ============================================================ */

function calculateCommission(
  salePrice
) {

  const total =
    Number(
      salePrice || 0
    );

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
   25. PUBLIER UN PRODUIT
   ============================================================ */

async function publishProduct(
  button = null
) {

  if (!currentUser) {

    showToast(
      "Connectez-vous avant de publier un produit.",
      "warning"
    );

    openGeneratedLogin();

    return;
  }


  const fields =
    getProductFields();


  const name =
    fields.name
      ?.value
      ?.trim();


  const category =
    fields.category
      ?.value ||
    "Autres";


  const price =
    Number(
      fields.price
        ?.value
    );


  const currency =
    fields.currency
      ?.value ||
    "HTG";


  const stock =
    Number(
      fields.stock
        ?.value
    );


  const description =
    fields.description
      ?.value
      ?.trim();


  const file =
    fields.image
      ?.files?.[0];


  if (!name) {

    showToast(
      "Entrez le nom du produit.",
      "warning"
    );

    return;
  }


  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {

    showToast(
      "Entrez un prix valide.",
      "warning"
    );

    return;
  }


  if (
    !Number.isInteger(stock) ||
    stock < 1
  ) {

    showToast(
      "Le stock doit être au minimum 1.",
      "warning"
    );

    return;
  }


  if (!file) {

    showToast(
      "Choisissez une photo du produit.",
      "warning"
    );

    return;
  }


  if (!description) {

    showToast(
      "Ajoutez une description.",
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
      "Envoi de la photo...",
      "info"
    );


    const image =
      await uploadProductImage(
        file,
        currentUser.uid
      );


    const financial =
      calculateCommission(
        price
      );


    const productData = {

      name:
        name,

      title:
        name,

      category:
        category,

      price:
        price,

      currency:
        currency,

      stock:
        stock,

      description:
        description,

      imageUrl:
        image.url,

      imageBucket:
        image.bucket,

      imagePath:
        image.path,

      sellerId:
        currentUser.uid,

      sellerEmail:
        currentUser.email ||
        "",

      sellerName:
        currentProfile?.name ||
        currentUser.displayName ||
        currentUser.email
          ?.split("@")[0] ||
        "Vendeur",

      /*
        La commission réelle est appliquée
        lors de la vente.
      */

      commissionRate:
        0.10,

      platformCommission:
        financial.commission,

      sellerAmount:
        financial.sellerAmount,

      status:
        "active",

      sold:
        0,

      views:
        0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    };


    const productRef =
      await addDoc(
        collection(
          db,
          "products"
        ),
        productData
      );


    console.log(
      "✅ Produit créé:",
      productRef.id
    );


    showToast(
      "Produit publié avec succès.",
      "success"
    );


    fields.name.value =
      "";

    fields.price.value =
      "";

    fields.stock.value =
      "1";

    fields.description.value =
      "";

    fields.image.value =
      "";


    const preview =
      document.getElementById(
        "productImagePreview"
      );

    if (preview) {

      preview.innerHTML =
        "";
    }


    await loadProducts();

    openPage(
      "home"
    );
  }

  catch (error) {

    console.error(
      "❌ Publication:",
      error
    );

    const text =
      String(
        error?.message ||
        ""
      )
      .toLowerCase();


    let message =
      "Publication impossible.";


    if (
      text.includes(
        "row-level"
      ) ||
      text.includes(
        "policy"
      ) ||
      text.includes(
        "rls"
      )
    ) {

      message =
        "Publication impossible : Supabase bloque l'envoi de la photo.";
    }

    else if (
      text.includes(
        "bucket"
      )
    ) {

      message =
        "Publication impossible : le bucket Supabase est introuvable.";
    }

    else if (
      text.includes(
        "permission"
      )
    ) {

      message =
        "Publication impossible : Firestore refuse l'enregistrement.";
    }

    else if (
      error?.message
    ) {

      message =
        "Publication impossible : " +
        error.message;
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


/* ============================================================
   26. FORMULAIRE PUBLICATION
   ============================================================ */

function setupProductPublishing() {

  const form =
    document.getElementById(
      "productForm"
    );

  const button =
    document.getElementById(
      "publishProductBtn"
    );


  if (
    form &&
    form.dataset
      .mystroPublishReady !==
      "1"
  ) {

    form.dataset
      .mystroPublishReady =
      "1";

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        await publishProduct(
          button
        );
      }
    );
  }


  if (
    !form &&
    button &&
    button.dataset
      .mystroPublishReady !==
      "1"
  ) {

    button.dataset
      .mystroPublishReady =
      "1";

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        await publishProduct(
          button
        );
      }
    );
  }
}


/* ============================================================
   27. APERÇU PHOTO
   ============================================================ */

function setupImagePreview() {

  const input =
    document.getElementById(
      "productImage"
    );

  if (!input) {

    return;
  }

  if (
    input.dataset
      .mystroPreviewReady ===
    "1"
  ) {

    return;
  }

  input.dataset
    .mystroPreviewReady =
    "1";


  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];

      if (!file) {

        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          "Sélectionnez une image.",
          "warning"
        );

        input.value =
          "";

        return;
      }


      const preview =
        document.getElementById(
          "productImagePreview"
        );

      if (!preview) {

        return;
      }


      const url =
        URL.createObjectURL(
          file
        );


      preview.innerHTML = `

        <img

          src="${url}"

          alt="Aperçu du produit"

          style="
            width:100%;
            max-height:260px;
            object-fit:cover;
            border-radius:15px;
          "

        >
      `;
    }
  );
}


/* ============================================================
   28. CHARGER LES PRODUITS
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

    catch (
      orderError
    ) {

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
        documentSnapshot => ({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()
        })
      );


    console.log(
      "Produits:",
      products.length
    );


    renderProducts();
  }

  catch (error) {

    console.error(
      "Chargement produits:",
      error
    );
  }
}


/* ============================================================
   29. DEVISES
   ============================================================ */

function convertPrice(
  amount,
  fromCurrency,
  toCurrency
) {

  const from =
    currencyRates[
      fromCurrency
    ];

  const to =
    currencyRates[
      toCurrency
    ];


  if (
    !from ||
    !to
  ) {

    return Number(
      amount
    );
  }


  const amountHTG =
    Number(amount) *
    from;


  return (
    amountHTG /
    to
  );
}


function formatMoney(
  amount,
  currency
) {

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {

        style:
          "currency",

        currency:
          currency,

        maximumFractionDigits:
          2
      }
    )
    .format(
      Number(amount)
    );

  }

  catch {

    return (
      Number(amount)
        .toFixed(2) +
      " " +
      currency
    );
  }
}


/* ============================================================
   30. AFFICHER LES PRODUITS
   ============================================================ */

function renderProducts() {

  const containers = [

    document.getElementById(
      "productsContainer"
    ),

    document.getElementById(
      "productsGrid"
    )

  ].filter(Boolean);


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


  const html =
    activeProducts.length

      ? activeProducts
          .map(
            product => {


              const converted =
                convertPrice(
                  Number(
                    product.price ||
                    0
                  ),
                  product.currency ||
                  "HTG",
                  selectedCurrency
                );


              return `

                <article
                  class="product-card"
                  data-product-id="${escapeHTML(product.id)}"
                >

                  ${
                    product.imageUrl
                      ? `

                        <img
                          class="product-image"
                          src="${escapeHTML(product.imageUrl)}"
                          alt="${escapeHTML(product.name || "Produit")}"
                          loading="lazy"
                        >

                      `
                      : ""
                  }

                  <div class="product-info">

                    <h3>
                      ${escapeHTML(
                        product.name ||
                        product.title ||
                        "Produit"
                      )}
                    </h3>

                    <p>
                      ${escapeHTML(
                        product.description ||
                        ""
                      )}
                    </p>

                    <strong>
                      ${formatMoney(
                        converted,
                        selectedCurrency
                      )}
                    </strong>

                    <p>
                      Stock :
                      ${Number(
                        product.stock ||
                        0
                      )}
                    </p>

                    <button
                      type="button"
                      data-add-cart="${escapeHTML(product.id)}"
                    >
                      Ajouter au panier
                    </button>

                  </div>

                </article>
              `;
            }
          )
          .join("")

      : `

        <div class="empty-state">

          🛍️

          <p>
            Aucun produit disponible.
          </p>

        </div>
      `;


  containers.forEach(
    container => {

      container.innerHTML =
        html;
    }
  );


  setupCartButtons();
}


/* ============================================================
   31. RECHERCHE
   ============================================================ */

function setupSearch() {

  const input =
    document.getElementById(
      "searchInput"
    );

  if (!input) {

    return;
  }

  if (
    input.dataset
      .mystroSearchReady ===
    "1"
  ) {

    return;
  }

  input.dataset
    .mystroSearchReady =
    "1";


  input.addEventListener(
    "input",
    event => {

      const search =
        event.target.value
          .trim()
          .toLowerCase();


      $all(
        ".product-card"
      )
      .forEach(
        card => {

          const text =
            card.textContent
              .toLowerCase();

          card.style.display =
            text.includes(
              search
            )
              ? ""
              : "none";
        }
      );
    }
  );
}


/* ============================================================
   32. PANIER
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
  }

  catch {

    cart =
      [];
  }

  updateCartCount();

  renderCart();
}


function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(
      cart
    )
  );

  updateCartCount();

  renderCart();
}


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

    if (
      Number(existing.quantity) <
      Number(
        product.stock ||
        999999
      )
    ) {

      existing.quantity +=
        1;
    }
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
          Number(
            product.price ||
            0
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
    "Produit ajouté au panier.",
    "success"
  );
}


function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      item =>
        item.id !==
        productId
    );

  saveCart();
}


function changeCartQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      product =>
        product.id ===
        productId
    );

  if (!item) {

    return;
  }

  item.quantity +=
    amount;

  if (
    item.quantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;
  }

  saveCart();
}


function updateCartCount() {

  const count =
    cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity ||
          0
        ),
      0
    );


  $all(
    "#cartCount, .cart-count, [data-cart-count]"
  )
  .forEach(
    element => {

      element.textContent =
        String(count);
    }
  );
}


function setupCartButtons() {

  $all(
    "[data-add-cart]"
  )
  .forEach(
    button => {

      if (
        button.dataset
          .mystroCartReady ===
        "1"
      ) {

        return;
      }

      button.dataset
        .mystroCartReady =
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
   33. AFFICHAGE PANIER
   ============================================================ */

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!container) {

    return;
  }


  if (
    cart.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        🛒

        <p>
          Votre panier est vide.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    cart
      .map(
        item => `

          <div
            class="product-card"
            style="margin-bottom:12px"
          >

            <div class="product-info">

              <h3>
                ${escapeHTML(item.name)}
              </h3>

              <strong>
                ${formatMoney(
                  item.price,
                  item.currency
                )}
              </strong>

              <p>
                Quantité :
                ${item.quantity}
              </p>

              <div
                style="
                  display:flex;
                  gap:8px;
                  margin-top:10px;
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
                  Supprimer
                </button>

              </div>

            </div>

          </div>
        `
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

          removeFromCart(
            button.dataset
              .cartRemove
          );
        }
      );
    }
  );
}


/* ============================================================
   34. DEVISE
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
    selector.dataset
      .mystroCurrencyReady ===
    "1"
  ) {

    return;
  }


  selector.dataset
    .mystroCurrencyReady =
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
    }
  );
}


/* ============================================================
   35. CHAT LOCAL
   ============================================================ */

function setupChat() {

  const input =
    document.getElementById(
      "chatInput"
    );

  const button =
    document.getElementById(
      "sendChatBtn"
    );

  const messages =
    document.getElementById(
      "chatMessages"
    );


  if (
    !input ||
    !button ||
    !messages
  ) {

    return;
  }


  if (
    button.dataset
      .mystroChatReady ===
    "1"
  ) {

    return;
  }


  button.dataset
    .mystroChatReady =
    "1";


  function sendMessage() {

    const text =
      input.value
        .trim();

    if (!text) {

      return;
    }


    const bubble =
      document.createElement(
        "div"
      );

    bubble.className =
      "user-chat-message";

    bubble.textContent =
      text;

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
    sendMessage
  );


  input.addEventListener(
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
   36. ASSISTANT
   ============================================================ */

function setupVirtualAssistant() {

  const button =
    document.getElementById(
      "assistantBtn"
    );

  const panel =
    document.getElementById(
      "assistantPanel"
    );


  if (
    !button ||
    !panel
  ) {

    return;
  }


  if (
    button.dataset
      .mystroAssistantReady ===
    "1"
  ) {

    return;
  }


  button.dataset
    .mystroAssistantReady =
    "1";


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      panel.classList.toggle(
        "open"
      );
    }
  );
}


/* ============================================================
   37. STATISTIQUES SIMPLES
   ============================================================ */

function updateStatistics() {

  const productStat =
    document.getElementById(
      "statProducts"
    );

  if (productStat) {

    productStat.textContent =
      String(
        products.filter(
          product =>
            product.sellerId ===
            currentUser?.uid
        ).length
      );
  }
}


/* ============================================================
   38. API MYSTRO-SHOP
   ============================================================ */

window.MystroShop = {

  auth,

  db,

  supabase,

  openLogin:
    openGeneratedLogin,

  openRegister:
    openGeneratedRegister,

  logoutUser,

  resetPassword,

  publishProduct,

  loadProducts,

  addToCart,

  calculateCommission,

  openPage,

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
   39. ERREURS GLOBALES
   ============================================================ */

window.addEventListener(
  "error",
  event => {

    console.error(
      "❌ ERREUR JAVASCRIPT:",
      event.error ||
      event.message
    );
  }
);


window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "❌ PROMESSE NON GÉRÉE:",
      event.reason
    );
  }
);


/* ============================================================
   40. DÉMARRAGE
   ============================================================ */

async function startMystroShop() {

  console.log(
    "🚀 Démarrage Mystro-Shop..."
  );

  try {

    showMainApp();

    loadCart();

    setupWelcomeAuthButtons();

    setupLogoutButtons();

    setupPageNavigation();

    setupMobileMenu();

    setupProductPublishing();

    setupImagePreview();

    setupSearch();

    setupCurrencySelector();

    setupChat();

    setupVirtualAssistant();


    await loadProducts();

    updateStatistics();


    /*
      Page initiale.
    */

    openPage(
      "home"
    );


    /*
      Détection des éléments ajoutés dynamiquement.
      IMPORTANT :
      setupWelcomeAuthButtons() ne touche maintenant
      qu'aux deux boutons welcomeLoginBtn
      et welcomeRegisterBtn.
    */

    const observer =
      new MutationObserver(
        () => {

          setupWelcomeAuthButtons();

          setupLogoutButtons();

          setupPageNavigation();

          setupProductPublishing();

          setupImagePreview();

          setupSearch();
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

  catch (error) {

    console.error(
      "❌ Erreur démarrage:",
      error
    );

    showToast(
      "Erreur lors du démarrage de Mystro-Shop.",
      "error"
    );
  }
}


/* ============================================================
   41. LANCEMENT
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
   FIN DU SCRIPT.JS MYSTRO-SHOP
   ============================================================ */

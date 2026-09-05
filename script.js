/* ============================================================
   MYSTRO-SHOP V4
   SCRIPT.JS COMPLET
   Firebase + Firestore + Supabase
   Connexion + Inscription + Produits + Panier
   Commission Mystro-Shop : 10 %
   ============================================================ */


/* ============================================================
   1. IMPORTS
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
  apiKey: "AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",
  authDomain: "mystroshop-eab92.firebaseapp.com",
  projectId: "mystroshop-eab92",
  storageBucket: "mystroshop-eab92.firebasestorage.app",
  messagingSenderId: "104073035061",
  appId: "1:104073035061:web:59d2779f2db7a8a3be207c",
  measurementId: "G-QTLV6VFLXQ"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

console.log("✅ Firebase connecté");


/* ============================================================
   3. SUPABASE
   ============================================================ */

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";

const supabase = createClient(
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

const MYSTRO_COMMISSION_RATE = 0.10;

let selectedCurrency =
  localStorage.getItem("mystroCurrency") ||
  "HTG";


/* ============================================================
   5. DEVISES
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
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function getFirstElement(selectors) {

  for (const selector of selectors) {

    const element =
      document.querySelector(selector);

    if (element) {
      return element;
    }
  }

  return null;
}


function escapeHTML(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeFileName(name = "image") {

  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}


/* ============================================================
   7. TOAST
   ============================================================ */

function showToast(message, type = "info") {

  console.log(`[${type}] ${message}`);

  let toast =
    document.getElementById("mystroToast");

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id = "mystroToast";

    Object.assign(
      toast.style,
      {
        position: "fixed",
        left: "50%",
        bottom: "35px",
        transform: "translateX(-50%)",
        zIndex: "999999",
        maxWidth: "90%",
        padding: "15px 22px",
        borderRadius: "16px",
        fontSize: "16px",
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        boxShadow:
          "0 10px 30px rgba(0,0,0,.30)"
      }
    );

    document.body.appendChild(toast);
  }

  if (type === "success") {
    toast.style.background = "#15803d";
  }

  else if (type === "warning") {
    toast.style.background = "#b45309";
  }

  else if (type === "error") {
    toast.style.background = "#111827";
  }

  else {
    toast.style.background = "#1d4ed8";
  }

  toast.textContent = message;

  toast.style.display = "block";

  clearTimeout(
    window.__mystroToastTimer
  );

  window.__mystroToastTimer =
    setTimeout(
      () => {
        toast.style.display = "none";
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

  if (!button) return;

  if (loading) {

    if (!button.dataset.oldText) {
      button.dataset.oldText =
        button.textContent;
    }

    button.disabled = true;
    button.style.opacity = ".7";
    button.textContent = loadingText;

  } else {

    button.disabled = false;
    button.style.opacity = "1";

    if (button.dataset.oldText) {
      button.textContent =
        button.dataset.oldText;
    }
  }
}


/* ============================================================
   9. ÉCRAN AUTH
   ============================================================ */

function hideWelcomeScreen() {

  const selectors = [
    "#welcomePage",
    "#authWelcome",
    ".welcome-page",
    ".auth-welcome",
    ".auth-screen",
    ".login-screen"
  ];

  selectors.forEach(selector => {

    document
      .querySelectorAll(selector)
      .forEach(element => {
        element.style.display = "none";
      });
  });
}


function showWelcomeScreen() {

  const welcome =
    getFirstElement([
      "#welcomePage",
      "#authWelcome",
      ".welcome-page",
      ".auth-welcome",
      ".auth-screen",
      ".login-screen"
    ]);

  if (welcome) {
    welcome.style.display = "";
  }
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
    document.createElement("style");

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
      background: rgba(8,18,49,.78);
      padding: 20px;
    }

    .mystro-auth-box {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: white;
      border-radius: 25px;
      padding: 30px 24px;
      box-sizing: border-box;
      box-shadow:
        0 20px 60px rgba(0,0,0,.25);
    }

    .mystro-auth-box h2 {
      margin: 0 0 8px;
      color: #111827;
      font-size: 27px;
    }

    .mystro-auth-box p {
      color: #6b7280;
      margin-bottom: 22px;
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
      font-size: 16px;
      outline: none;
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
      background: transparent;
      border: 0;
      color: #2563eb;
      font-weight: 700;
      font-size: 15px;
    }

    .mystro-close-auth {
      position: absolute;
      top: 12px;
      right: 16px;
      border: 0;
      background: transparent;
      font-size: 32px;
      color: #374151;
    }

  `;

  document.head.appendChild(style);
}


/* ============================================================
   11. CONNEXION
   ============================================================ */

function openGeneratedLogin() {

  removeGeneratedAuthModal();

  addGeneratedAuthStyles();

  const overlay =
    document.createElement("div");

  overlay.id =
    "generatedAuthModal";

  overlay.innerHTML = `

    <div class="mystro-auth-overlay">

      <div class="mystro-auth-box">

        <button
          type="button"
          class="mystro-close-auth"
          id="closeGeneratedAuth"
        >
          ×
        </button>

        <h2>
          Se connecter
        </h2>

        <p>
          Connectez-vous à Mystro-Shop.
        </p>

        <form id="generatedLoginForm">

          <label>Email</label>

          <input
            id="generatedLoginEmail"
            type="email"
            placeholder="Votre adresse email"
            required
          >

          <label>Mot de passe</label>

          <input
            id="generatedLoginPassword"
            type="password"
            placeholder="Votre mot de passe"
            required
          >

          <button
            type="submit"
            class="mystro-main-auth-btn"
          >
            Se connecter
          </button>

        </form>

        <button
          type="button"
          class="mystro-link-auth"
          id="goGeneratedRegister"
        >
          Créer un compte
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("closeGeneratedAuth")
    .onclick =
    removeGeneratedAuthModal;

  document
    .getElementById("goGeneratedRegister")
    .onclick =
    openGeneratedRegister;

  document
    .getElementById("generatedLoginForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();

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
          event.currentTarget
            .querySelector(
              "button[type='submit']"
            );

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

        } catch (error) {

          console.error(
            "Erreur connexion:",
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

          showToast(
            message,
            "error"
          );

        } finally {

          setButtonLoading(
            button,
            false
          );
        }
      }
    );
}


/* ============================================================
   12. INSCRIPTION
   ============================================================ */

function openGeneratedRegister() {

  removeGeneratedAuthModal();

  addGeneratedAuthStyles();

  const overlay =
    document.createElement("div");

  overlay.id =
    "generatedAuthModal";

  overlay.innerHTML = `

    <div class="mystro-auth-overlay">

      <div class="mystro-auth-box">

        <button
          type="button"
          class="mystro-close-auth"
          id="closeGeneratedAuth"
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

          <label>Nom</label>

          <input
            id="generatedRegisterName"
            type="text"
            placeholder="Votre nom"
            required
          >

          <label>Email</label>

          <input
            id="generatedRegisterEmail"
            type="email"
            placeholder="Votre adresse email"
            required
          >

          <label>Mot de passe</label>

          <input
            id="generatedRegisterPassword"
            type="password"
            minlength="6"
            placeholder="6 caractères minimum"
            required
          >

          <button
            type="submit"
            class="mystro-main-auth-btn"
          >
            S'inscrire
          </button>

        </form>

        <button
          type="button"
          class="mystro-link-auth"
          id="goGeneratedLogin"
        >
          J'ai déjà un compte
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("closeGeneratedAuth")
    .onclick =
    removeGeneratedAuthModal;

  document
    .getElementById("goGeneratedLogin")
    .onclick =
    openGeneratedLogin;

  document
    .getElementById(
      "generatedRegisterForm"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();

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
          event.currentTarget
            .querySelector(
              "button[type='submit']"
            );

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

          if (name) {

            await updateProfile(
              credential.user,
              {
                displayName:
                  name
              }
            );
          }

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

          showToast(
            "Compte créé avec succès.",
            "success"
          );

          removeGeneratedAuthModal();

          hideWelcomeScreen();

        } catch (error) {

          console.error(
            "Erreur inscription:",
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

          showToast(
            message,
            "error"
          );

        } finally {

          setButtonLoading(
            button,
            false
          );
        }
      }
    );
}


/* ============================================================
   13. BOUTONS ACCUEIL
   ============================================================ */

function setupWelcomeAuthButtons() {

  const buttons =
    document.querySelectorAll(
      "button, a"
    );

  buttons.forEach(button => {

    const text =
      String(
        button.textContent || ""
      )
      .trim()
      .toLowerCase();

    if (
      text === "se connecter" ||
      text === "connexion"
    ) {

      if (
        button.dataset
          .mystroWelcomeReady ===
        "1"
      ) {
        return;
      }

      button.dataset
        .mystroWelcomeReady =
        "1";

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          openGeneratedLogin();
        }
      );
    }

    if (
      text === "s'inscrire" ||
      text === "s’inscrire" ||
      text === "inscription"
    ) {

      if (
        button.dataset
          .mystroWelcomeReady ===
        "1"
      ) {
        return;
      }

      button.dataset
        .mystroWelcomeReady =
        "1";

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          openGeneratedRegister();
        }
      );
    }
  });
}


/* ============================================================
   14. AUTH FIREBASE
   ============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (user) {

      console.log(
        "✅ Utilisateur connecté:",
        user.uid
      );

      await loadUserProfile(user);

      updateAuthInterface(true);

      hideWelcomeScreen();

      await loadProducts();

    } else {

      currentProfile = null;

      updateAuthInterface(false);

      showWelcomeScreen();
    }
  }
);


/* ============================================================
   15. PROFIL UTILISATEUR
   ============================================================ */

async function loadUserProfile(user) {

  try {

    const ref =
      doc(
        db,
        "users",
        user.uid
      );

    const snapshot =
      await getDoc(ref);

    if (snapshot.exists()) {

      currentProfile =
        snapshot.data();

    } else {

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

      await setDoc(
        ref,
        {
          ...currentProfile,
          createdAt:
            serverTimestamp()
        }
      );
    }

    updateProfileInterface();

  } catch (error) {

    console.error(
      "Erreur profil:",
      error
    );
  }
}


/* ============================================================
   16. INTERFACE AUTH
   ============================================================ */

function updateAuthInterface(
  loggedIn
) {

  $all(
    "#loginBtn, .login-btn, [data-action='login']"
  )
  .forEach(element => {

    element.style.display =
      loggedIn
        ? "none"
        : "";
  });

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  )
  .forEach(element => {

    element.style.display =
      loggedIn
        ? ""
        : "none";
  });

  updateProfileInterface();
}


function updateProfileInterface() {

  if (!currentUser) return;

  const name =
    currentProfile?.name ||
    currentUser.displayName ||
    currentUser.email
      ?.split("@")[0] ||
    "Utilisateur";

  $all(
    "[data-user-name]"
  )
  .forEach(element => {

    element.textContent = name;
  });

  const initials =
    getFirstElement([
      "#userInitials",
      "#profileInitials",
      ".user-initials"
    ]);

  if (initials) {

    initials.textContent =
      name
        .split(" ")
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
   17. DÉCONNEXION
   ============================================================ */

async function logoutUser() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie.",
      "success"
    );

    showWelcomeScreen();

  } catch (error) {

    console.error(error);

    showToast(
      "Déconnexion impossible.",
      "error"
    );
  }
}


/* ============================================================
   18. MOT DE PASSE OUBLIÉ
   ============================================================ */

async function resetPassword(email) {

  if (!email) {

    showToast(
      "Entrez votre adresse email.",
      "warning"
    );

    return;
  }

  try {

    await sendPasswordResetEmail(
      auth,
      email.trim()
    );

    showToast(
      "Email de réinitialisation envoyé.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Impossible d'envoyer l'email.",
      "error"
    );
  }
}


/* ============================================================
   19. PRODUIT — CHAMPS
   ============================================================ */

function getProductFields() {

  return {

    name:
      getFirstElement([
        "#productName",
        "#productTitle",
        "#title",
        "[name='productName']",
        "[name='title']"
      ]),

    category:
      getFirstElement([
        "#productCategory",
        "#category",
        "[name='category']"
      ]),

    price:
      getFirstElement([
        "#productPrice",
        "#price",
        "[name='price']"
      ]),

    currency:
      getFirstElement([
        "#productCurrency",
        "#currency",
        "[name='currency']"
      ]),

    stock:
      getFirstElement([
        "#productStock",
        "#stock",
        "[name='stock']"
      ]),

    image:
      getFirstElement([
        "#productImage",
        "#productPhoto",
        "#photo",
        "#image",
        "input[type='file']"
      ]),

    description:
      getFirstElement([
        "#productDescription",
        "#description",
        "[name='description']",
        "textarea"
      ])
  };
}


/* ============================================================
   20. PHOTO
   ============================================================ */

function validateImage(file) {

  if (!file) {

    throw new Error(
      "Choisissez une photo du produit."
    );
  }

  if (
    !file.type.startsWith("image/")
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


/* ============================================================
   21. SUPABASE STORAGE
   ============================================================ */

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

  validateImage(file);

  const safeName =
    normalizeFileName(
      file.name
    );

  const path =
    `${userId}/${Date.now()}_${safeName}`;

  let lastError = null;

  for (
    const bucket
    of SUPABASE_BUCKETS
  ) {

    try {

      console.log(
        "Essai bucket:",
        bucket
      );

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

        lastError = error;

        console.warn(
          bucket,
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

          bucket,

          path:
            data.path
        };
      }

    } catch (error) {

      lastError = error;

      console.warn(error);
    }
  }

  throw new Error(
    lastError?.message ||
    "Impossible d'envoyer la photo dans Supabase."
  );
}


/* ============================================================
   22. COMMISSION
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
      ).toFixed(2)
    );

  const sellerAmount =
    Number(
      (
        total -
        commission
      ).toFixed(2)
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
   23. PUBLIER PRODUIT
   ============================================================ */

async function publishProduct(
  button = null
) {

  if (!currentUser) {

    showToast(
      "Connectez-vous avant de publier.",
      "warning"
    );

    return;
  }

  const fields =
    getProductFields();

  const name =
    fields.name
      ?.value
      ?.trim() ||
    "Produit";

  const category =
    fields.category
      ?.value
      ?.trim() ||
    "Autres";

  const price =
    Number(
      fields.price?.value
    );

  const stock =
    Number(
      fields.stock?.value ||
      1
    );

  const currency =
    fields.currency
      ?.value ||
    selectedCurrency ||
    "HTG";

  const description =
    fields.description
      ?.value
      ?.trim() ||
    "";

  const file =
    fields.image
      ?.files?.[0];

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
      "Choisissez une photo.",
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

    const imageResult =
      await uploadProductImage(
        file,
        currentUser.uid
      );

    const finance =
      calculateCommission(
        price
      );

    const productData = {

      name,
      title: name,
      description,
      category,
      price,
      currency,
      stock,

      imageUrl:
        imageResult.url,

      imageBucket:
        imageResult.bucket,

      imagePath:
        imageResult.path,

      sellerId:
        currentUser.uid,

      sellerEmail:
        currentUser.email || "",

      sellerName:
        currentProfile?.name ||
        currentUser.displayName ||
        currentUser.email
          ?.split("@")[0] ||
        "Vendeur",

      commissionRate:
        0.10,

      platformCommission:
        finance.commission,

      sellerAmount:
        finance.sellerAmount,

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
      "Produit:",
      productRef.id
    );

    showToast(
      "Produit publié avec succès.",
      "success"
    );

    if (fields.name) {
      fields.name.value = "";
    }

    if (fields.price) {
      fields.price.value = "";
    }

    if (fields.stock) {
      fields.stock.value = "1";
    }

    if (fields.description) {
      fields.description.value = "";
    }

    if (fields.image) {
      fields.image.value = "";
    }

    await loadProducts();

  } catch (error) {

    console.error(
      "ERREUR PUBLICATION:",
      error
    );

    const text =
      String(
        error?.message ||
        ""
      ).toLowerCase();

    let message =
      "Publication impossible.";

    if (
      text.includes("policy") ||
      text.includes("rls") ||
      text.includes("row-level")
    ) {

      message =
        "Publication impossible : Supabase bloque la photo.";

    }

    else if (
      text.includes("bucket")
    ) {

      message =
        "Publication impossible : bucket Supabase introuvable.";

    }

    else if (
      text.includes(
        "missing or insufficient permissions"
      ) ||
      text.includes(
        "permission-denied"
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

  } finally {

    setButtonLoading(
      button,
      false
    );
  }
}


/* ============================================================
   24. BOUTON PUBLIER
   ============================================================ */

function findPublishButtons() {

  const results = [];

  const selectors = [
    "#publishProductBtn",
    "#publishBtn",
    "#addProductBtn",
    "[data-action='publish-product']",
    ".publish-product-btn"
  ];

  selectors.forEach(selector => {

    $all(selector)
      .forEach(button => {

        if (
          !results.includes(button)
        ) {
          results.push(button);
        }
      });
  });

  $all(
    "button, input[type='submit']"
  )
  .forEach(button => {

    const text =
      String(
        button.textContent ||
        button.value ||
        ""
      )
      .trim()
      .toLowerCase();

    if (
      text.includes(
        "publier le produit"
      ) ||
      text === "publier"
    ) {

      if (
        !results.includes(button)
      ) {

        results.push(button);
      }
    }
  });

  return results;
}


function setupProductPublishing() {

  const buttons =
    findPublishButtons();

  buttons.forEach(button => {

    if (
      button.dataset
        .mystroPublishReady ===
      "1"
    ) {
      return;
    }

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
  });
}


/* ============================================================
   25. PRODUITS FIRESTORE
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

    } catch {

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
        item => ({
          id:
            item.id,
          ...item.data()
        })
      );

    renderProducts();

  } catch (error) {

    console.error(
      "Erreur produits:",
      error
    );
  }
}


/* ============================================================
   26. DEVISES
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

  if (!from || !to) {

    return Number(amount);
  }

  const htg =
    Number(amount) *
    from;

  return htg / to;
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

        currency,

        maximumFractionDigits:
          2
      }
    )
    .format(
      Number(amount)
    );

  } catch {

    return (
      Number(amount)
        .toFixed(2) +
      " " +
      currency
    );
  }
}


/* ============================================================
   27. AFFICHER PRODUITS
   ============================================================ */

function renderProducts() {

  const container =
    getFirstElement([
      "#productsContainer",
      "#productGrid",
      "#productsGrid",
      ".products-grid",
      ".product-grid",
      "[data-products]"
    ]);

  if (!container) {
    return;
  }

  const active =
    products.filter(
      product =>
        product.status !==
        "deleted"
    );

  if (!active.length) {

    container.innerHTML = `
      <div
        style="
          padding:30px;
          width:100%;
          text-align:center;
        "
      >
        Aucun produit disponible.
      </div>
    `;

    return;
  }

  container.innerHTML =
    active
      .map(product => {

        const converted =
          convertPrice(
            Number(
              product.price || 0
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
                    src="${escapeHTML(product.imageUrl)}"
                    alt="${escapeHTML(product.name || "Produit")}"
                    class="product-image"
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
                  product.stock || 0
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

      })
      .join("");

  setupCartButtons();
}


/* ============================================================
   28. PANIER
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

  updateCartCount();
}


function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(cart)
  );

  updateCartCount();
}


function addToCart(productId) {

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

    existing.quantity += 1;

  } else {

    cart.push({
      id:
        product.id,

      name:
        product.name ||
        product.title ||
        "Produit",

      price:
        Number(
          product.price || 0
        ),

      currency:
        product.currency ||
        "HTG",

      imageUrl:
        product.imageUrl || "",

      sellerId:
        product.sellerId || "",

      quantity:
        1
    });
  }

  saveCart();

  showToast(
    "Produit ajouté au panier.",
    "success"
  );
}


function setupCartButtons() {

  $all(
    "[data-add-cart]"
  )
  .forEach(button => {

    button.onclick = () => {

      addToCart(
        button.dataset.addCart
      );
    };
  });
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
          item.quantity || 0
        ),
      0
    );

  $all(
    "#cartCount, .cart-count, [data-cart-count]"
  )
  .forEach(element => {

    element.textContent =
      String(count);
  });
}


/* ============================================================
   29. TOTAL PANIER
   ============================================================ */

function getCartTotalHTG() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      const amount =
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 1
        );

      const rate =
        currencyRates[
          item.currency
        ] || 1;

      return (
        total +
        amount * rate
      );

    },
    0
  );
}


/* ============================================================
   30. SÉLECTEUR DEVISE
   ============================================================ */

function setupCurrencySelector() {

  $all(
    "#currencySelector, #currencySelect, [data-currency-selector]"
  )
  .forEach(selector => {

    if (
      selector.tagName !==
      "SELECT"
    ) {
      return;
    }

    selector.value =
      selectedCurrency;

    selector.addEventListener(
      "change",
      event => {

        selectedCurrency =
          event.target.value;

        localStorage.setItem(
          "mystroCurrency",
          selectedCurrency
        );

        renderProducts();
      }
    );
  });
}


/* ============================================================
   31. RECHERCHE
   ============================================================ */

function setupSearch() {

  const input =
    getFirstElement([
      "#searchInput",
      "#search",
      "[data-search]"
    ]);

  if (!input) return;

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

      const value =
        event.target.value
          .trim()
          .toLowerCase();

      $all(
        ".product-card"
      )
      .forEach(card => {

        const text =
          card.textContent
            .toLowerCase();

        card.style.display =
          text.includes(value)
            ? ""
            : "none";
      });
    }
  );
}


/* ============================================================
   32. PHOTO PREVIEW
   ============================================================ */

function setupImagePreview() {

  const input =
    getProductFields()
      .image;

  if (!input) return;

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

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          "Choisissez une image valide.",
          "warning"
        );

        input.value = "";

        return;
      }

      const preview =
        getFirstElement([
          "#productImagePreview",
          "#imagePreview",
          ".product-image-preview"
        ]);

      if (!preview) return;

      const url =
        URL.createObjectURL(
          file
        );

      if (
        preview.tagName ===
        "IMG"
      ) {

        preview.src = url;

      } else {

        preview.innerHTML = `
          <img
            src="${url}"
            alt="Aperçu"
            style="
              width:100%;
              max-height:250px;
              object-fit:cover;
              border-radius:15px;
            "
          >
        `;
      }
    }
  );
}


/* ============================================================
   33. LOGOUT BUTTONS
   ============================================================ */

function setupLogoutButtons() {

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  )
  .forEach(button => {

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
  });
}


/* ============================================================
   34. MENU MOBILE
   ============================================================ */

function setupMobileMenu() {

  const button =
    getFirstElement([
      "#menuBtn",
      "#mobileMenuBtn",
      ".menu-btn",
      "[data-menu-button]"
    ]);

  const menu =
    getFirstElement([
      "#mobileNav",
      "#sideMenu",
      ".mobile-nav",
      ".side-menu"
    ]);

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
    () => {

      menu.classList.toggle(
        "open"
      );

      if (
        menu.style.display ===
        "none"
      ) {

        menu.style.display =
          "block";

      } else if (
        !menu.classList
          .contains("open")
      ) {

        menu.style.display =
          "none";
      }
    }
  );
}


/* ============================================================
   35. ASSISTANT
   ============================================================ */

function setupVirtualAssistant() {

  const button =
    getFirstElement([
      "#assistantBtn",
      ".assistant-btn",
      "[data-assistant]"
    ]);

  const panel =
    getFirstElement([
      "#assistantPanel",
      ".assistant-panel"
    ]);

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
    () => {

      panel.classList.toggle(
        "open"
      );
    }
  );
}


/* ============================================================
   36. ERREURS
   ============================================================ */

window.addEventListener(
  "error",
  event => {

    console.error(
      "ERREUR JAVASCRIPT:",
      event.error ||
      event.message
    );
  }
);

window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "PROMESSE NON GÉRÉE:",
      event.reason
    );
  }
);


/* ============================================================
   37. API PUBLIQUE
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

  getCartTotalHTG,

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
   38. DÉMARRAGE
   ============================================================ */

async function startMystroShop() {

  console.log(
    "🚀 Démarrage Mystro-Shop..."
  );

  try {

    loadCart();

    setupWelcomeAuthButtons();

    setupProductPublishing();

    setupCurrencySelector();

    setupSearch();

    setupImagePreview();

    setupLogoutButtons();

    setupMobileMenu();

    setupVirtualAssistant();

    await loadProducts();


    /* --------------------------------------------------------
       Les éléments de certaines pages peuvent apparaître
       après le chargement.
       -------------------------------------------------------- */

    const observer =
      new MutationObserver(
        () => {

          setupWelcomeAuthButtons();

          setupProductPublishing();

          setupSearch();

          setupImagePreview();

          setupLogoutButtons();
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

  } catch (error) {

    console.error(
      "Erreur démarrage:",
      error
    );

    showToast(
      "Erreur lors du démarrage de Mystro-Shop.",
      "error"
    );
  }
}


/* ============================================================
   39. LANCEMENT FINAL
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
   FIN SCRIPT.JS
   ============================================================ */

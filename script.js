/* =========================================================
   MYSTRO-SHOP V4
   script.js complet
   Firebase + Firestore + Supabase
   Commission Mystro-Shop : 10 %
   ========================================================= */

/* =========================================================
   1. IMPORTS
   ========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment
} from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  createClient
} from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================================
   2. CONFIGURATION
   ========================================================= */

const FIREBASE_PROJECT_ID = "mystroshop-eab92";

const SUPABASE_URL =
  "https://cesfjdrlnfxffrtoggoz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_h8tIKBP_l7Bx-jjsX2eoRw_uJbytWIu";


/* =========================================================
   3. VARIABLES GLOBALES
   ========================================================= */

let firebaseApp = null;
let auth = null;
let db = null;

let currentUser = null;
let currentProfile = null;

let products = [];
let cart = [];

const PLATFORM_COMMISSION_RATE = 0.10;
const SELLER_RATE = 0.90;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   4. DEVISES
   ========================================================= */

const currencyRates = {
  HTG: 1,
  USD: 132,
  EUR: 145,
  CAD: 96,
  GBP: 170,
  DOP: 2.2,
  XOF: 0.22
};

let selectedCurrency =
  localStorage.getItem("mystroCurrency") || "HTG";


/* =========================================================
   5. UTILITAIRES
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function getFirstElement(selectors = []) {

  for (const selector of selectors) {

    const element = document.querySelector(selector);

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


function generateId(prefix = "id") {

  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 10)
  );
}


function normalizeFileName(name = "image") {

  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}


function showToast(message, type = "info") {

  console.log(`[${type}] ${message}`);

  let toast = document.getElementById("mystroToast");

  if (!toast) {

    toast = document.createElement("div");

    toast.id = "mystroToast";

    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "35px";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "999999";
    toast.style.maxWidth = "90%";
    toast.style.padding = "14px 20px";
    toast.style.borderRadius = "15px";
    toast.style.fontWeight = "700";
    toast.style.fontSize = "16px";
    toast.style.textAlign = "center";
    toast.style.color = "white";
    toast.style.background = "#111827";
    toast.style.boxShadow = "0 8px 30px rgba(0,0,0,.25)";

    document.body.appendChild(toast);
  }

  if (type === "success") {
    toast.style.background = "#15803d";
  }

  else if (type === "error") {
    toast.style.background = "#111827";
  }

  else if (type === "warning") {
    toast.style.background = "#b45309";
  }

  else {
    toast.style.background = "#1e40af";
  }

  toast.textContent = message;

  toast.style.display = "block";

  clearTimeout(window.__mystroToastTimer);

  window.__mystroToastTimer = setTimeout(() => {

    toast.style.display = "none";

  }, 4500);
}


function setButtonLoading(button, loading, text = "") {

  if (!button) return;

  if (loading) {

    button.dataset.oldText =
      button.textContent || "";

    button.disabled = true;

    button.style.opacity = ".7";

    button.textContent = text || "Chargement...";

  } else {

    button.disabled = false;

    button.style.opacity = "1";

    button.textContent =
      button.dataset.oldText ||
      text ||
      button.textContent;
  }
}


/* =========================================================
   6. FIREBASE CONFIG AUTOMATIQUE
   ========================================================= */

async function getFirebaseConfig() {

  /*
    Firebase expose normalement la configuration publique
    du projet sur /__/firebase/init.json.
  */

  const urls = [

    `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/firebase/init.json`,

    `https://${FIREBASE_PROJECT_ID}.web.app/__/firebase/init.json`
  ];

  for (const url of urls) {

    try {

      const response = await fetch(url);

      if (!response.ok) continue;

      const config = await response.json();

      if (
        config &&
        config.apiKey &&
        config.projectId
      ) {

        console.log(
          "Configuration Firebase chargée."
        );

        return config;
      }

    } catch (error) {

      console.warn(
        "Configuration Firebase non disponible :",
        error
      );
    }
  }

  /*
    Configuration minimale de secours.
    Si Firebase Auth réclame apiKey,
    le message apparaîtra dans la console.
  */

  return {
    projectId: FIREBASE_PROJECT_ID,
    authDomain:
      `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    storageBucket:
      `${FIREBASE_PROJECT_ID}.firebasestorage.app`
  };
}


/* =========================================================
   7. INITIALISATION FIREBASE
   ========================================================= */

async function initializeFirebase() {

  try {

    const firebaseConfig =
      await getFirebaseConfig();

    firebaseApp =
      initializeApp(firebaseConfig);

    auth =
      getAuth(firebaseApp);

    db =
      getFirestore(firebaseApp);

    console.log(
      "✅ Firebase initialisé."
    );

    setupAuthObserver();

    return true;

  } catch (error) {

    console.error(
      "Firebase initialization error:",
      error
    );

    showToast(
      "Erreur de connexion Firebase.",
      "error"
    );

    return false;
  }
}


/* =========================================================
   8. AUTHENTIFICATION
   ========================================================= */

function setupAuthObserver() {

  if (!auth) return;

  onAuthStateChanged(
    auth,
    async (user) => {

      currentUser = user;

      if (user) {

        console.log(
          "Utilisateur connecté:",
          user.uid
        );

        await loadUserProfile(user);

        updateAuthInterface(true);

      } else {

        currentProfile = null;

        updateAuthInterface(false);
      }
    }
  );
}


async function loadUserProfile(user) {

  try {

    const profileRef =
      doc(db, "users", user.uid);

    const snapshot =
      await getDoc(profileRef);

    if (snapshot.exists()) {

      currentProfile =
        snapshot.data();

    } else {

      currentProfile = {

        uid: user.uid,

        email: user.email || "",

        name:
          user.displayName ||
          user.email?.split("@")[0] ||
          "Utilisateur",

        role: "buyer",

        balance: 0,

        createdAt:
          new Date().toISOString()
      };

      await setDoc(
        profileRef,
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


function updateAuthInterface(loggedIn) {

  const loginButtons =
    $all(
      "[data-action='login'], .login-btn, #loginBtn"
    );

  const logoutButtons =
    $all(
      "[data-action='logout'], .logout-btn, #logoutBtn"
    );

  loginButtons.forEach(button => {

    button.style.display =
      loggedIn ? "none" : "";

  });

  logoutButtons.forEach(button => {

    button.style.display =
      loggedIn ? "" : "none";

  });

  updateProfileInterface();
}


function updateProfileInterface() {

  if (!currentUser) return;

  const initials =
    getFirstElement([
      "#userInitials",
      "#profileInitials",
      ".user-initials"
    ]);

  const name =
    currentProfile?.name ||
    currentUser.displayName ||
    currentUser.email?.split("@")[0] ||
    "Utilisateur";

  if (initials) {

    initials.textContent =
      name
        .split(" ")
        .map(x => x[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
  }

  $all(
    "[data-user-name]"
  ).forEach(element => {

    element.textContent = name;

  });
}


/* =========================================================
   9. INSCRIPTION
   ========================================================= */

async function registerUser(
  email,
  password,
  name = ""
) {

  if (!auth) {

    showToast(
      "Firebase n'est pas encore prêt.",
      "error"
    );

    return;
  }

  try {

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    if (name.trim()) {

      await updateProfile(
        credential.user,
        {
          displayName:
            name.trim()
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

        name:
          name.trim() ||
          email.split("@")[0],

        email:
          credential.user.email,

        role:
          "buyer",

        balance:
          0,

        createdAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    showToast(
      "Compte créé avec succès.",
      "success"
    );

    closeModals();

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
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
  }
}


/* =========================================================
   10. CONNEXION
   ========================================================= */

async function loginUser(
  email,
  password
) {

  try {

    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    showToast(
      "Connexion réussie.",
      "success"
    );

    closeModals();

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    showToast(
      "Email ou mot de passe incorrect.",
      "error"
    );
  }
}


/* =========================================================
   11. DÉCONNEXION
   ========================================================= */

async function logoutUser() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Déconnexion impossible.",
      "error"
    );
  }
}


/* =========================================================
   12. MOT DE PASSE OUBLIÉ
   ========================================================= */

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


/* =========================================================
   13. TROUVER LES CHAMPS PRODUIT
   ========================================================= */

function getProductFields() {

  const name =
    getFirstElement([
      "#productName",
      "#productTitle",
      "#title",
      "[name='productName']",
      "[name='title']"
    ]);

  const category =
    getFirstElement([
      "#productCategory",
      "#category",
      "[name='category']"
    ]);

  const price =
    getFirstElement([
      "#productPrice",
      "#price",
      "[name='price']"
    ]);

  const currency =
    getFirstElement([
      "#productCurrency",
      "#currency",
      "[name='currency']"
    ]);

  const stock =
    getFirstElement([
      "#productStock",
      "#stock",
      "[name='stock']"
    ]);

  const description =
    getFirstElement([
      "#productDescription",
      "#description",
      "[name='description']",
      "textarea"
    ]);

  const image =
    getFirstElement([
      "#productImage",
      "#productPhoto",
      "#photo",
      "#image",
      "input[type='file']"
    ]);

  return {
    name,
    category,
    price,
    currency,
    stock,
    description,
    image
  };
}


/* =========================================================
   14. VALIDATION IMAGE
   ========================================================= */

function validateImage(file) {

  if (!file) {

    throw new Error(
      "Sélectionnez une photo du produit."
    );
  }

  if (
    !file.type.startsWith("image/")
  ) {

    throw new Error(
      "Le fichier sélectionné doit être une image."
    );
  }

  const maxSize =
    8 * 1024 * 1024;

  if (file.size > maxSize) {

    throw new Error(
      "L'image ne doit pas dépasser 8 Mo."
    );
  }

  return true;
}


/* =========================================================
   15. UPLOAD SUPABASE
   ========================================================= */

async function uploadProductImage(
  file,
  userId
) {

  validateImage(file);

  const safeName =
    normalizeFileName(file.name);

  const path =
    `${userId}/${Date.now()}_${safeName}`;

  /*
    Le code essaie plusieurs noms de bucket
    afin d'être compatible avec votre projet actuel.
  */

  const buckets = [
    "products",
    "product-images",
    "images",
    "public"
  ];

  let lastError = null;

  for (const bucket of buckets) {

    try {

      console.log(
        `Tentative upload bucket: ${bucket}`
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
          `Bucket ${bucket}:`,
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

        console.log(
          "✅ Image publiée:",
          publicData.publicUrl
        );

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

      console.warn(
        "Upload error:",
        error
      );
    }
  }

  console.error(
    "Aucun bucket Supabase utilisable.",
    lastError
  );

  throw new Error(
    lastError?.message ||
    "Impossible d'envoyer la photo dans Supabase."
  );
}


/* =========================================================
   16. PUBLICATION PRODUIT
   ========================================================= */

async function publishProduct(
  button = null
) {

  console.log(
    "===== PUBLICATION PRODUIT ====="
  );

  if (!currentUser) {

    showToast(
      "Connectez-vous avant de publier un produit.",
      "warning"
    );

    return;
  }

  const fields =
    getProductFields();

  const productName =
    fields.name?.value?.trim() ||
    "Produit";

  const category =
    fields.category?.value?.trim() ||
    "Autres";

  const price =
    Number(
      fields.price?.value
    );

  const currency =
    fields.currency?.value ||
    selectedCurrency ||
    "HTG";

  const stock =
    Number(
      fields.stock?.value || 1
    );

  const description =
    fields.description
      ?.value
      ?.trim() || "";

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

    /*
      1. Upload photo
    */

    showToast(
      "Envoi de la photo...",
      "info"
    );

    const imageResult =
      await uploadProductImage(
        file,
        currentUser.uid
      );


    /*
      2. Calcul commission
    */

    const platformCommission =
      Number(
        (
          price *
          PLATFORM_COMMISSION_RATE
        ).toFixed(2)
      );

    const sellerAmount =
      Number(
        (
          price *
          SELLER_RATE
        ).toFixed(2)
      );


    /*
      3. Création produit Firestore
    */

    const productData = {

      name:
        productName,

      title:
        productName,

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
        PLATFORM_COMMISSION_RATE,

      platformCommission,

      sellerAmount,

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


    const result =
      await addDoc(
        collection(
          db,
          "products"
        ),
        productData
      );


    console.log(
      "✅ Produit Firestore:",
      result.id
    );


    /*
      4. Confirmation
    */

    showToast(
      "Produit publié avec succès.",
      "success"
    );


    /*
      5. Réinitialisation formulaire
    */

    if (fields.name) {
      fields.name.value = "";
    }

    if (fields.description) {
      fields.description.value = "";
    }

    if (fields.price) {
      fields.price.value = "";
    }

    if (fields.stock) {
      fields.stock.value = "1";
    }

    if (fields.image) {
      fields.image.value = "";
    }


    /*
      6. Actualisation catalogue
    */

    await loadProducts();


  } catch (error) {

    console.error(
      "❌ PUBLICATION ERROR:",
      error
    );

    let message =
      "Publication impossible.";

    const text =
      String(
        error?.message ||
        ""
      ).toLowerCase();


    if (
      text.includes("row-level") ||
      text.includes("policy") ||
      text.includes("rls")
    ) {

      message =
        "Publication impossible : vérifiez les règles Supabase Storage.";
    }

    else if (
      text.includes("bucket")
    ) {

      message =
        "Publication impossible : le bucket Supabase est introuvable.";
    }

    else if (
      text.includes("permission") ||
      text.includes(
        "missing or insufficient permissions"
      )
    ) {

      message =
        "Publication impossible : Firestore refuse l'enregistrement.";
    }

    else if (
      text.includes("network") ||
      text.includes("fetch")
    ) {

      message =
        "Publication impossible : vérifiez votre connexion Internet.";
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


/* =========================================================
   17. TROUVER LE BOUTON PUBLIER
   ========================================================= */

function findPublishButtons() {

  const direct =
    $all(
      `
      #publishProductBtn,
      #publishBtn,
      #addProductBtn,
      [data-action="publish-product"],
      .publish-product-btn
      `
    );

  const buttons =
    $all(
      "button, input[type='submit']"
    );

  buttons.forEach(button => {

    const text =
      (
        button.textContent ||
        button.value ||
        ""
      ).toLowerCase();

    if (
      text.includes(
        "publier le produit"
      ) ||
      text === "publier" ||
      text.includes(
        "publish product"
      )
    ) {

      if (
        !direct.includes(button)
      ) {

        direct.push(button);
      }
    }
  });

  return direct;
}


/* =========================================================
   18. ACTIVER PUBLICATION
   ========================================================= */

function setupProductPublishing() {

  const buttons =
    findPublishButtons();

  console.log(
    "Boutons publication trouvés:",
    buttons.length
  );

  buttons.forEach(button => {

    if (
      button.dataset
        .mystroPublishReady
    ) {

      return;
    }

    button.dataset
      .mystroPublishReady =
      "true";

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        event.stopPropagation();

        await publishProduct(
          button
        );
      }
    );
  });


  /*
    Évite qu'un formulaire recharge la page.
  */

  const fields =
    getProductFields();

  const form =
    fields.price
      ?.closest("form") ||
    fields.image
      ?.closest("form");

  if (
    form &&
    !form.dataset
      .mystroReady
  ) {

    form.dataset.mystroReady =
      "true";

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const button =
          findPublishButtons()[0];

        await publishProduct(
          button
        );
      }
    );
  }
}


/* =========================================================
   19. CHARGER PRODUITS
   ========================================================= */

async function loadProducts() {

  if (!db) return;

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
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

    console.log(
      `${products.length} produits chargés.`
    );

    renderProducts();

  } catch (error) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      error
    );
  }
}


/* =========================================================
   20. CONVERSION DEVISE
   ========================================================= */

function convertPrice(
  amount,
  fromCurrency,
  toCurrency
) {

  if (
    !currencyRates[fromCurrency] ||
    !currencyRates[toCurrency]
  ) {

    return amount;
  }

  const amountInHTG =
    amount *
    currencyRates[fromCurrency];

  return (
    amountInHTG /
    currencyRates[toCurrency]
  );
}


function formatMoney(
  amount,
  currency = selectedCurrency
) {

  try {

    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }
    ).format(amount);

  } catch {

    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}


/* =========================================================
   21. AFFICHER PRODUITS
   ========================================================= */

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

  if (!products.length) {

    container.innerHTML = `
      <div style="
        padding:30px;
        text-align:center;
        width:100%;
      ">
        Aucun produit disponible.
      </div>
    `;

    return;
  }

  container.innerHTML =
    products
      .filter(
        product =>
          product.status !==
          "deleted"
      )
      .map(product => {

        const originalPrice =
          Number(
            product.price || 0
          );

        const originalCurrency =
          product.currency ||
          "HTG";

        const converted =
          convertPrice(
            originalPrice,
            originalCurrency,
            selectedCurrency
          );

        const image =
          product.imageUrl ||
          product.image ||
          "";

        return `
          <article
            class="product-card"
            data-product-id="${product.id}"
          >

            ${
              image
                ? `
                <img
                  src="${escapeHTML(image)}"
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

              <p class="product-description">
                ${escapeHTML(
                  product.description ||
                  ""
                )}
              </p>

              <strong class="product-price">

                ${formatMoney(
                  converted,
                  selectedCurrency
                )}

              </strong>

              <div class="product-stock">

                Stock :
                ${Number(
                  product.stock || 0
                )}

              </div>

              <button
                type="button"
                data-add-cart="${product.id}"
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


/* =========================================================
   22. PANIER
   ========================================================= */

function loadCart() {

  try {

    cart =
      JSON.parse(
        localStorage.getItem(
          "mystroCart"
        ) || "[]"
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
        item.id === productId
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
        item.id === productId
    );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      id:
        product.id,

      name:
        product.name ||
        product.title,

      price:
        Number(
          product.price || 0
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
  ).forEach(button => {

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
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  $all(
    "#cartCount, .cart-count, [data-cart-count]"
  ).forEach(element => {

    element.textContent =
      String(count);
  });
}


/* =========================================================
   23. TOTAL PANIER
   ========================================================= */

function getCartTotalHTG() {

  return cart.reduce(
    (total, item) => {

      const amount =
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 1
        );

      return (
        total +
        amount *
        (
          currencyRates[
            item.currency
          ] || 1
        )
      );

    },
    0
  );
}


/* =========================================================
   24. COMMISSION 10 %
   ========================================================= */

function calculateCommission(
  amount
) {

  const gross =
    Number(amount || 0);

  const commission =
    Number(
      (
        gross *
        PLATFORM_COMMISSION_RATE
      ).toFixed(2)
    );

  const seller =
    Number(
      (
        gross -
        commission
      ).toFixed(2)
    );

  return {

    gross,

    commission,

    seller,

    rate:
      PLATFORM_COMMISSION_RATE
  };
}


/* =========================================================
   25. ENREGISTREMENT VENTE
   ========================================================= */

async function createSale(
  product,
  quantity = 1
) {

  if (!currentUser) {

    throw new Error(
      "Utilisateur non connecté."
    );
  }

  const total =
    Number(
      product.price || 0
    ) *
    quantity;

  const distribution =
    calculateCommission(
      total
    );

  return addDoc(
    collection(
      db,
      "sales"
    ),
    {

      productId:
        product.id,

      productName:
        product.name ||
        product.title ||
        "Produit",

      buyerId:
        currentUser.uid,

      sellerId:
        product.sellerId,

      quantity,

      currency:
        product.currency ||
        "HTG",

      total:
        distribution.gross,

      platformCommission:
        distribution.commission,

      sellerAmount:
        distribution.seller,

      commissionRate:
        PLATFORM_COMMISSION_RATE,

      status:
        "pending",

      createdAt:
        serverTimestamp()
    }
  );
}


/* =========================================================
   26. DEVISE
   ========================================================= */

function setupCurrencySelector() {

  const selectors =
    $all(
      "#currencySelector, #currencySelect, [data-currency-selector]"
    );

  selectors.forEach(selector => {

    selector.value =
      selectedCurrency;

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
  });
}


/* =========================================================
   27. RECHERCHE PRODUITS
   ========================================================= */

function setupSearch() {

  const search =
    getFirstElement([
      "#searchInput",
      "#search",
      "[data-search]"
    ]);

  if (!search) return;

  search.addEventListener(
    "input",
    event => {

      const value =
        event.target.value
          .trim()
          .toLowerCase();

      $all(
        ".product-card"
      ).forEach(card => {

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


/* =========================================================
   28. MENU MOBILE
   ========================================================= */

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

  button.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "open"
      );

      const currentlyHidden =
        menu.style.display ===
        "none";

      if (
        !menu.classList
          .contains("open")
      ) {

        menu.style.display =
          "none";

      } else {

        menu.style.display =
          "block";
      }
    }
  );
}


/* =========================================================
   29. FERMER MODALES
   ========================================================= */

function closeModals() {

  $all(
    ".modal.open, .modal.active"
  ).forEach(modal => {

    modal.classList.remove(
      "open",
      "active"
    );
  });
}


/* =========================================================
   30. FORMULAIRE LOGIN
   ========================================================= */

function setupLoginForms() {

  $all(
    "#loginForm, [data-login-form]"
  ).forEach(form => {

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const email =
          form.querySelector(
            "input[type='email']"
          )?.value || "";

        const password =
          form.querySelector(
            "input[type='password']"
          )?.value || "";

        await loginUser(
          email,
          password
        );
      }
    );
  });
}


/* =========================================================
   31. FORMULAIRE INSCRIPTION
   ========================================================= */

function setupRegisterForms() {

  $all(
    "#registerForm, #signupForm, [data-register-form]"
  ).forEach(form => {

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const email =
          form.querySelector(
            "input[type='email']"
          )?.value || "";

        const password =
          form.querySelector(
            "input[type='password']"
          )?.value || "";

        const name =
          form.querySelector(
            "[name='name'], #registerName, #signupName"
          )?.value || "";

        await registerUser(
          email,
          password,
          name
        );
      }
    );
  });
}


/* =========================================================
   32. BOUTONS LOGOUT
   ========================================================= */

function setupLogoutButtons() {

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  ).forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        await logoutUser();
      }
    );
  });
}


/* =========================================================
   33. APERÇU PHOTO
   ========================================================= */

function setupImagePreview() {

  const input =
    getProductFields().image;

  if (!input) return;

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
          "Choisissez une image.",
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

      if (preview) {

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

          preview.innerHTML =
            `<img
               src="${url}"
               style="
                 width:100%;
                 max-height:250px;
                 object-fit:cover;
                 border-radius:15px;
               "
             >`;
        }
      }
    }
  );
}


/* =========================================================
   34. ASSISTANT VIRTUEL
   ========================================================= */

function setupVirtualAssistant() {

  const button =
    getFirstElement([
      "#assistantBtn",
      ".assistant-btn",
      "[data-assistant]"
    ]);

  if (!button) return;

  button.addEventListener(
    "click",
    () => {

      const panel =
        getFirstElement([
          "#assistantPanel",
          ".assistant-panel"
        ]);

      if (panel) {

        panel.classList.toggle(
          "open"
        );

        panel.style.display =
          panel.style.display ===
          "block"
            ? "none"
            : "block";
      }
    }
  );
}


/* =========================================================
   35. GESTION DES ERREURS
   ========================================================= */

window.addEventListener(
  "error",
  event => {

    console.error(
      "GLOBAL JS ERROR:",
      event.error ||
      event.message
    );
  }
);


window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "PROMISE ERROR:",
      event.reason
    );
  }
);


/* =========================================================
   36. FONCTIONS PUBLIQUES
   ========================================================= */

window.MystroShop = {

  publishProduct,

  loadProducts,

  loginUser,

  registerUser,

  logoutUser,

  resetPassword,

  addToCart,

  calculateCommission,

  getCartTotalHTG,

  getCurrentUser() {
    return currentUser;
  },

  getProducts() {
    return products;
  },

  getCart() {
    return cart;
  }
};


/* =========================================================
   37. INITIALISATION
   ========================================================= */

async function startMystroShop() {

  console.log(
    "🚀 Démarrage Mystro-Shop..."
  );

  loadCart();

  setupCurrencySelector();

  setupSearch();

  setupMobileMenu();

  setupLoginForms();

  setupRegisterForms();

  setupLogoutButtons();

  setupImagePreview();

  setupVirtualAssistant();


  const firebaseReady =
    await initializeFirebase();

  if (firebaseReady) {

    await loadProducts();
  }


  /*
    On active les boutons de publication
    après le chargement initial.
  */

  setupProductPublishing();


  /*
    Certains éléments peuvent être
    ajoutés dynamiquement au DOM.
  */

  const observer =
    new MutationObserver(() => {

      setupProductPublishing();
    });

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );


  console.log(
    "✅ Mystro-Shop prêt."
  );
}


/* =========================================================
   38. LANCEMENT
   ========================================================= */

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

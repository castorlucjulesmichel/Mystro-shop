/* ============================================================
   MYSTRO-SHOP V4
   SCRIPT.JS COMPLET
   Firebase Authentication + Firestore + Supabase Storage
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
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/* ============================================================
   2. IMPORT SUPABASE
   ============================================================ */

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ============================================================
   3. CONFIGURATION FIREBASE WEB
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


/* ============================================================
   4. INITIALISATION FIREBASE
   ============================================================ */

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


console.log(
  "✅ Firebase Mystro-Shop connecté."
);


/* ============================================================
   5. CONFIGURATION SUPABASE
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


console.log(
  "✅ Supabase Mystro-Shop initialisé."
);


/* ============================================================
   6. VARIABLES GLOBALES
   ============================================================ */

let currentUser = null;

let currentProfile = null;

let products = [];

let cart = [];

let selectedCurrency =
  localStorage.getItem(
    "mystroCurrency"
  ) || "HTG";


/* ============================================================
   7. COMMISSION MYSTRO-SHOP
   ============================================================ */

const MYSTRO_COMMISSION_RATE = 0.10;

const SELLER_RATE = 0.90;


/* ============================================================
   8. DEVISES
   Valeurs approximatives utilisées pour affichage local.
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
   9. UTILITAIRES DOM
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


function getFirstElement(selectors) {

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


/* ============================================================
   10. PROTECTION HTML
   ============================================================ */

function escapeHTML(value = "") {

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


/* ============================================================
   11. TOAST
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
      "999999";

    toast.style.maxWidth =
      "90%";

    toast.style.padding =
      "16px 22px";

    toast.style.borderRadius =
      "16px";

    toast.style.fontSize =
      "16px";

    toast.style.fontWeight =
      "700";

    toast.style.color =
      "#ffffff";

    toast.style.textAlign =
      "center";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.30)";


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
      "#111827";

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
    window.mystroToastTimeout
  );


  window.mystroToastTimeout =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      4500
    );

}


/* ============================================================
   12. BOUTON CHARGEMENT
   ============================================================ */

function setButtonLoading(
  button,
  loading,
  loadingText =
    "Chargement..."
) {

  if (!button) return;


  if (loading) {

    if (
      !button.dataset.oldText
    ) {

      button.dataset.oldText =
        button.textContent;

    }


    button.disabled =
      true;


    button.style.opacity =
      "0.7";


    button.textContent =
      loadingText;

  }

  else {

    button.disabled =
      false;


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
   13. AUTHENTIFICATION FIREBASE
   ============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (user) {

      console.log(
        "✅ Utilisateur connecté :",
        user.uid
      );


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
        "Utilisateur déconnecté."
      );


      currentProfile =
        null;


      updateAuthInterface(
        false
      );

    }

  }
);


/* ============================================================
   14. PROFIL UTILISATEUR
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

  }

  catch (error) {

    console.error(
      "Erreur profil :",
      error
    );

  }

}


/* ============================================================
   15. INTERFACE CONNEXION
   ============================================================ */

function updateAuthInterface(
  loggedIn
) {

  $all(
    "#loginBtn, .login-btn, [data-action='login']"
  )
  .forEach(
    element => {

      element.style.display =
        loggedIn
          ? "none"
          : "";

    }
  );


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


/* ============================================================
   16. INTERFACE PROFIL
   ============================================================ */

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
  .forEach(
    element => {

      element.textContent =
        name;

    }
  );


  const initials =
    getFirstElement(
      [

        "#userInitials",

        "#profileInitials",

        ".user-initials"

      ]
    );


  if (initials) {

    initials.textContent =
      name
        .split(" ")
        .map(
          word =>
            word.charAt(0)
        )
        .join("")
        .substring(
          0,
          2
        )
        .toUpperCase();

  }

}


/* ============================================================
   17. INSCRIPTION
   ============================================================ */

async function registerUser(
  email,
  password,
  name = ""
) {

  try {

    if (
      !email ||
      !password
    ) {

      showToast(
        "Remplissez l'email et le mot de passe.",
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


    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );


    if (
      name.trim()
    ) {

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
        merge:
          true
      }
    );


    showToast(
      "Compte créé avec succès.",
      "success"
    );


    closeModals();

  }

  catch (error) {

    console.error(
      "Erreur inscription :",
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
      "auth/invalid-email"
    ) {

      message =
        "Adresse email invalide.";

    }


    else if (
      error.code ===
      "auth/weak-password"
    ) {

      message =
        "Mot de passe trop faible.";

    }


    else if (
      error.message
    ) {

      message =
        error.message;

    }


    showToast(
      message,
      "error"
    );

  }

}


/* ============================================================
   18. CONNEXION
   ============================================================ */

async function loginUser(
  email,
  password
) {

  try {

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

  }

  catch (error) {

    console.error(
      "Erreur connexion :",
      error
    );


    showToast(
      "Email ou mot de passe incorrect.",
      "error"
    );

  }

}


/* ============================================================
   19. DÉCONNEXION
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

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Déconnexion impossible.",
      "error"
    );

  }

}


/* ============================================================
   20. MOT DE PASSE OUBLIÉ
   ============================================================ */

async function resetPassword(
  email
) {

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

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Impossible d'envoyer l'email.",
      "error"
    );

  }

}


/* ============================================================
   21. TROUVER LES CHAMPS PRODUIT
   ============================================================ */

function getProductFields() {

  return {

    name:
      getFirstElement(
        [

          "#productName",

          "#productTitle",

          "#title",

          "[name='productName']",

          "[name='title']"

        ]
      ),


    category:
      getFirstElement(
        [

          "#productCategory",

          "#category",

          "[name='category']"

        ]
      ),


    price:
      getFirstElement(
        [

          "#productPrice",

          "#price",

          "[name='price']"

        ]
      ),


    currency:
      getFirstElement(
        [

          "#productCurrency",

          "#currency",

          "[name='currency']"

        ]
      ),


    stock:
      getFirstElement(
        [

          "#productStock",

          "#stock",

          "[name='stock']"

        ]
      ),


    image:
      getFirstElement(
        [

          "#productImage",

          "#productPhoto",

          "#photo",

          "#image",

          "input[type='file']"

        ]
      ),


    description:
      getFirstElement(
        [

          "#productDescription",

          "#description",

          "[name='description']",

          "textarea"

        ]
      )

  };

}


/* ============================================================
   22. NETTOYAGE NOM PHOTO
   ============================================================ */

function normalizeFileName(
  name = "photo"
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
   23. VALIDATION PHOTO
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


  const MAX_SIZE =
    8 *
    1024 *
    1024;


  if (
    file.size >
    MAX_SIZE
  ) {

    throw new Error(
      "La photo dépasse 8 Mo."
    );

  }


  return true;

}


/* ============================================================
   24. BUCKET SUPABASE
   ============================================================ */

/*
   Mystro-Shop essaiera ces noms de bucket.

   Si votre bucket Supabase s'appelle "products",
   le premier sera utilisé immédiatement.
*/

const SUPABASE_BUCKETS = [

  "products",

  "product-images",

  "images",

  "public"

];


/* ============================================================
   25. UPLOAD PHOTO SUPABASE
   ============================================================ */

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

      console.log(
        "Tentative bucket Supabase :",
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

        console.warn(
          `Bucket ${bucket} :`,
          error.message
        );


        lastError =
          error;


        continue;

      }


      const {
        data: publicUrlData
      } =
        supabase
          .storage
          .from(bucket)
          .getPublicUrl(
            data.path
          );


      const imageUrl =
        publicUrlData
          ?.publicUrl;


      if (!imageUrl) {

        lastError =
          new Error(
            "URL publique indisponible."
          );


        continue;

      }


      console.log(
        "✅ Photo Supabase publiée :",
        imageUrl
      );


      return {

        url:
          imageUrl,

        bucket:
          bucket,

        path:
          data.path

      };

    }

    catch (error) {

      console.warn(
        "Erreur Supabase :",
        error
      );


      lastError =
        error;

    }

  }


  throw new Error(

    lastError
      ?.message ||

    "Aucun bucket Supabase disponible."

  );

}


/* ============================================================
   26. CALCUL COMMISSION
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

    total:
      total,

    commission:
      commission,

    sellerAmount:
      sellerAmount,

    commissionRate:
      MYSTRO_COMMISSION_RATE

  };

}


/* ============================================================
   27. PUBLICATION PRODUIT
   ============================================================ */

async function publishProduct(
  button = null
) {

  console.log(
    "============================"
  );

  console.log(
    "PUBLICATION MYSTRO-SHOP"
  );

  console.log(
    "============================"
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
      fields.price
        ?.value
    );


  const stock =
    Number(
      fields.stock
        ?.value ||
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
      ?.files
      ?.[0];


  /* ----------------------------
     Vérification prix
     ---------------------------- */

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


  /* ----------------------------
     Vérification stock
     ---------------------------- */

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


  /* ----------------------------
     Vérification photo
     ---------------------------- */

  if (!file) {

    showToast(
      "Choisissez une photo du produit.",
      "warning"
    );

    return;

  }


  /* ----------------------------
     Vérification description
     ---------------------------- */

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

    /* ========================================================
       ÉTAPE 1 : ENVOI PHOTO
       ======================================================== */

    showToast(
      "Envoi de la photo...",
      "info"
    );


    const imageResult =
      await uploadProductImage(
        file,
        currentUser.uid
      );


    console.log(
      "Image :",
      imageResult
    );


    /* ========================================================
       ÉTAPE 2 : CALCUL 10 %
       ======================================================== */

    const financial =
      calculateCommission(
        price
      );


    /* ========================================================
       ÉTAPE 3 : DONNÉES PRODUIT
       ======================================================== */

    const productData = {

      name:
        productName,

      title:
        productName,

      description:
        description,

      category:
        category,

      price:
        price,

      currency:
        currency,

      stock:
        stock,

      imageUrl:
        imageResult.url,

      imageBucket:
        imageResult.bucket,

      imagePath:
        imageResult.path,


      /* VENDEUR */

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


      /* COMMISSION */

      commissionRate:
        0.10,

      platformCommission:
        financial.commission,

      sellerAmount:
        financial.sellerAmount,


      /* STATUT */

      status:
        "active",

      sold:
        0,

      views:
        0,


      /* DATES */

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    /* ========================================================
       ÉTAPE 4 : FIRESTORE
       ======================================================== */

    const productRef =
      await addDoc(
        collection(
          db,
          "products"
        ),
        productData
      );


    console.log(
      "✅ Produit Firestore ID :",
      productRef.id
    );


    /* ========================================================
       ÉTAPE 5 : SUCCÈS
       ======================================================== */

    showToast(
      "Produit publié avec succès.",
      "success"
    );


    /* ========================================================
       ÉTAPE 6 : RÉINITIALISATION FORMULAIRE
       ======================================================== */

    if (
      fields.name
    ) {

      fields.name.value =
        "";

    }


    if (
      fields.price
    ) {

      fields.price.value =
        "";

    }


    if (
      fields.stock
    ) {

      fields.stock.value =
        "1";

    }


    if (
      fields.description
    ) {

      fields.description.value =
        "";

    }


    if (
      fields.image
    ) {

      fields.image.value =
        "";

    }


    /* ========================================================
       ÉTAPE 7 : ACTUALISER PRODUITS
       ======================================================== */

    await loadProducts();

  }

  catch (error) {

    console.error(
      "❌ ERREUR PUBLICATION :",
      error
    );


    const errorText =
      String(
        error?.message ||
        error ||
        ""
      )
      .toLowerCase();


    let message =
      "Publication impossible.";


    /* SUPABASE RLS */

    if (
      errorText.includes(
        "row-level"
      ) ||

      errorText.includes(
        "row level"
      ) ||

      errorText.includes(
        "policy"
      ) ||

      errorText.includes(
        "rls"
      )
    ) {

      message =
        "Publication impossible : Supabase bloque l'envoi de la photo.";

    }


    /* BUCKET */

    else if (
      errorText.includes(
        "bucket"
      )
    ) {

      message =
        "Publication impossible : bucket Supabase introuvable.";

    }


    /* FIRESTORE */

    else if (
      errorText.includes(
        "missing or insufficient permissions"
      ) ||

      errorText.includes(
        "permission-denied"
      )
    ) {

      message =
        "Publication impossible : les règles Firestore refusent l'enregistrement.";

    }


    /* RÉSEAU */

    else if (
      errorText.includes(
        "network"
      ) ||

      errorText.includes(
        "failed to fetch"
      )
    ) {

      message =
        "Publication impossible : vérifiez votre connexion Internet.";

    }


    /* AUTRE ERREUR */

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
   28. TROUVER BOUTON PUBLIER
   ============================================================ */

function findPublishButtons() {

  const results =
    [];


  const selectors = [

    "#publishProductBtn",

    "#publishBtn",

    "#addProductBtn",

    "[data-action='publish-product']",

    ".publish-product-btn"

  ];


  selectors
    .forEach(
      selector => {

        $all(
          selector
        )
        .forEach(
          button => {

            if (
              !results.includes(
                button
              )
            ) {

              results.push(
                button
              );

            }

          }
        );

      }
    );


  $all(
    "button, input[type='submit']"
  )
  .forEach(
    button => {

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

        text ===
          "publier" ||

        text.includes(
          "publish product"
        )
      ) {

        if (
          !results.includes(
            button
          )
        ) {

          results.push(
            button
          );

        }

      }

    }
  );


  return results;

}


/* ============================================================
   29. ACTIVER PUBLICATION
   ============================================================ */

function setupProductPublishing() {

  const buttons =
    findPublishButtons();


  buttons
    .forEach(
      button => {

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

      }
    );

}


/* ============================================================
   30. CHARGER PRODUITS FIRESTORE
   ============================================================ */

async function loadProducts() {

  try {

    let snapshot;


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


      snapshot =
        await getDocs(
          productsQuery
        );

    }

    catch (
      orderError
    ) {

      console.warn(
        "OrderBy indisponible, chargement simple."
      );


      snapshot =
        await getDocs(
          collection(
            db,
            "products"
          )
        );

    }


    products =
      snapshot.docs
        .map(
          documentSnapshot => {

            return {

              id:
                documentSnapshot.id,

              ...documentSnapshot.data()

            };

          }
        );


    console.log(
      "Produits chargés :",
      products.length
    );


    renderProducts();

  }

  catch (error) {

    console.error(
      "Erreur chargement produits :",
      error
    );

  }

}


/* ============================================================
   31. CONVERSION DEVISES
   ============================================================ */

function convertPrice(
  amount,
  fromCurrency,
  toCurrency
) {

  const fromRate =
    currencyRates[
      fromCurrency
    ];


  const toRate =
    currencyRates[
      toCurrency
    ];


  if (
    !fromRate ||
    !toRate
  ) {

    return Number(
      amount
    );

  }


  const amountHTG =
    Number(
      amount
    ) *
    fromRate;


  return (
    amountHTG /
    toRate
  );

}


/* ============================================================
   32. FORMAT PRIX
   ============================================================ */

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
      Number(
        amount
      )
    );

  }

  catch (error) {

    return (
      Number(
        amount
      ).toFixed(2) +
      " " +
      currency
    );

  }

}


/* ============================================================
   33. AFFICHER PRODUITS
   ============================================================ */

function renderProducts() {

  const container =
    getFirstElement(
      [

        "#productsContainer",

        "#productGrid",

        "#productsGrid",

        ".products-grid",

        ".product-grid",

        "[data-products]"

      ]
    );


  if (!container) {

    return;

  }


  const activeProducts =
    products.filter(
      product => {

        return (
          product.status !==
          "deleted"
        );

      }
    );


  if (
    activeProducts.length ===
    0
  ) {

    container.innerHTML = `

      <div
        style="
          padding:30px;
          text-align:center;
          width:100%;
        "
      >

        Aucun produit disponible.

      </div>

    `;


    return;

  }


  container.innerHTML =
    activeProducts
      .map(
        product => {

          const originalPrice =
            Number(
              product.price ||
              0
            );


          const originalCurrency =
            product.currency ||
            "HTG";


          const convertedPrice =
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
              data-product-id="${escapeHTML(product.id)}"
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


              <div
                class="product-info"
              >

                <h3>

                  ${escapeHTML(
                    product.name ||
                    product.title ||
                    "Produit"
                  )}

                </h3>


                <p
                  class="product-description"
                >

                  ${escapeHTML(
                    product.description ||
                    ""
                  )}

                </p>


                <strong
                  class="product-price"
                >

                  ${formatMoney(
                    convertedPrice,
                    selectedCurrency
                  )}

                </strong>


                <div
                  class="product-stock"
                >

                  Stock :
                  ${Number(
                    product.stock ||
                    0
                  )}

                </div>


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
      .join("");


  setupCartButtons();

}


/* ============================================================
   34. PANIER
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

  catch (error) {

    cart =
      [];

  }


  updateCartCount();

}


/* ============================================================
   35. SAUVEGARDER PANIER
   ============================================================ */

function saveCart() {

  localStorage.setItem(
    "mystroCart",
    JSON.stringify(
      cart
    )
  );


  updateCartCount();

}


/* ============================================================
   36. AJOUTER PANIER
   ============================================================ */

function addToCart(
  productId
) {

  const product =
    products.find(
      item => {

        return (
          item.id ===
          productId
        );

      }
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
      item => {

        return (
          item.id ===
          productId
        );

      }
    );


  if (existing) {

    existing.quantity +=
      1;

  }

  else {

    cart.push(
      {

        id:
          product.id,

        name:
          product.name ||
          product.title ||
          "Produit",

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


/* ============================================================
   37. BOUTONS PANIER
   ============================================================ */

function setupCartButtons() {

  $all(
    "[data-add-cart]"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          addToCart(
            button.dataset
              .addCart
          );

        };

    }
  );

}


/* ============================================================
   38. NOMBRE PANIER
   ============================================================ */

function updateCartCount() {

  const count =
    cart.reduce(
      (
        total,
        item
      ) => {

        return (
          total +
          Number(
            item.quantity ||
            0
          )
        );

      },
      0
    );


  $all(
    "#cartCount, .cart-count, [data-cart-count]"
  )
  .forEach(
    element => {

      element.textContent =
        String(
          count
        );

    }
  );

}


/* ============================================================
   39. TOTAL PANIER HTG
   ============================================================ */

function getCartTotalHTG() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      const itemTotal =

        Number(
          item.price ||
          0
        )

        *

        Number(
          item.quantity ||
          1
        );


      const rate =
        currencyRates[
          item.currency
        ] ||
        1;


      return (
        total +
        itemTotal *
        rate
      );

    },
    0
  );

}


/* ============================================================
   40. ENREGISTRER VENTE
   ============================================================ */

async function createSale(
  product,
  quantity = 1
) {

  if (!currentUser) {

    throw new Error(
      "Utilisateur non connecté."
    );

  }


  const quantityNumber =
    Math.max(
      1,
      Number(
        quantity
      )
    );


  const grossTotal =

    Number(
      product.price ||
      0
    )

    *

    quantityNumber;


  const financial =
    calculateCommission(
      grossTotal
    );


  const saleRef =
    await addDoc(
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

        quantity:
          quantityNumber,

        currency:
          product.currency ||
          "HTG",

        total:
          financial.total,

        platformCommission:
          financial.commission,

        sellerAmount:
          financial.sellerAmount,

        commissionRate:
          0.10,

        status:
          "pending",

        createdAt:
          serverTimestamp()

      }
    );


  return saleRef;

}


/* ============================================================
   41. SÉLECTEUR DEVISES
   ============================================================ */

function setupCurrencySelector() {

  $all(
    "#currencySelector, #currencySelect, [data-currency-selector]"
  )
  .forEach(
    selector => {

      if (
        selector.tagName ===
        "SELECT"
      ) {

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

      }

    }
  );

}


/* ============================================================
   42. RECHERCHE PRODUITS
   ============================================================ */

function setupSearch() {

  const input =
    getFirstElement(
      [

        "#searchInput",

        "#search",

        "[data-search]"

      ]
    );


  if (!input) {

    return;

  }


  input.addEventListener(
    "input",
    event => {

      const searchValue =
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
              searchValue
            )

            ? ""

            : "none";

        }
      );

    }
  );

}


/* ============================================================
   43. APERÇU PHOTO
   ============================================================ */

function setupImagePreview() {

  const fields =
    getProductFields();


  const input =
    fields.image;


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
        input.files
          ?.[0];


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          "Choisissez une image valide.",
          "warning"
        );


        input.value =
          "";


        return;

      }


      const preview =
        getFirstElement(
          [

            "#productImagePreview",

            "#imagePreview",

            ".product-image-preview"

          ]
        );


      if (!preview) {

        return;

      }


      const url =
        URL.createObjectURL(
          file
        );


      if (
        preview.tagName ===
        "IMG"
      ) {

        preview.src =
          url;

      }

      else {

        preview.innerHTML = `

          <img

            src="${url}"

            alt="Aperçu produit"

            style="
              width:100%;
              max-height:260px;
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
   44. FORMULAIRE CONNEXION
   ============================================================ */

function setupLoginForms() {

  $all(
    "#loginForm, [data-login-form]"
  )
  .forEach(
    form => {

      if (
        form.dataset
          .mystroReady ===
        "1"
      ) {

        return;

      }


      form.dataset
        .mystroReady =
        "1";


      form.addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          const email =
            form.querySelector(
              "input[type='email']"
            )
            ?.value ||
            "";


          const password =
            form.querySelector(
              "input[type='password']"
            )
            ?.value ||
            "";


          await loginUser(
            email,
            password
          );

        }
      );

    }
  );

}


/* ============================================================
   45. FORMULAIRE INSCRIPTION
   ============================================================ */

function setupRegisterForms() {

  $all(
    "#registerForm, #signupForm, [data-register-form]"
  )
  .forEach(
    form => {

      if (
        form.dataset
          .mystroReady ===
        "1"
      ) {

        return;

      }


      form.dataset
        .mystroReady =
        "1";


      form.addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          const email =
            form.querySelector(
              "input[type='email']"
            )
            ?.value ||
            "";


          const password =
            form.querySelector(
              "input[type='password']"
            )
            ?.value ||
            "";


          const name =
            form.querySelector(
              "[name='name'], #registerName, #signupName"
            )
            ?.value ||
            "";


          await registerUser(
            email,
            password,
            name
          );

        }
      );

    }
  );

}


/* ============================================================
   46. BOUTONS DÉCONNEXION
   ============================================================ */

function setupLogoutButtons() {

  $all(
    "#logoutBtn, .logout-btn, [data-action='logout']"
  )
  .forEach(
    button => {

      if (
        button.dataset
          .mystroReady ===
        "1"
      ) {

        return;

      }


      button.dataset
        .mystroReady =
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
   47. FERMER MODALES
   ============================================================ */

function closeModals() {

  $all(
    ".modal.open, .modal.active"
  )
  .forEach(
    modal => {

      modal.classList.remove(
        "open"
      );


      modal.classList.remove(
        "active"
      );

    }
  );

}


/* ============================================================
   48. MENU MOBILE
   ============================================================ */

function setupMobileMenu() {

  const button =
    getFirstElement(
      [

        "#menuBtn",

        "#mobileMenuBtn",

        ".menu-btn",

        "[data-menu-button]"

      ]
    );


  const menu =
    getFirstElement(
      [

        "#mobileNav",

        "#sideMenu",

        ".mobile-nav",

        ".side-menu"

      ]
    );


  if (
    !button ||
    !menu
  ) {

    return;

  }


  if (
    button.dataset
      .mystroReady ===
    "1"
  ) {

    return;

  }


  button.dataset
    .mystroReady =
    "1";


  button.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "open"
      );

    }
  );

}


/* ============================================================
   49. ASSISTANT VIRTUEL
   ============================================================ */

function setupVirtualAssistant() {

  const button =
    getFirstElement(
      [

        "#assistantBtn",

        ".assistant-btn",

        "[data-assistant]"

      ]
    );


  const panel =
    getFirstElement(
      [

        "#assistantPanel",

        ".assistant-panel"

      ]
    );


  if (
    !button ||
    !panel
  ) {

    return;

  }


  if (
    button.dataset
      .mystroReady ===
    "1"
  ) {

    return;

  }


  button.dataset
    .mystroReady =
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
   50. ERREURS JAVASCRIPT GLOBALES
   ============================================================ */

window.addEventListener(
  "error",
  event => {

    console.error(
      "❌ ERREUR JAVASCRIPT :",
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "❌ PROMESSE NON GÉRÉE :",
      event.reason
    );

  }
);


/* ============================================================
   51. FONCTIONS ACCESSIBLES DEPUIS HTML
   ============================================================ */

window.MystroShop = {

  auth,

  db,

  supabase,

  publishProduct,

  loadProducts,

  registerUser,

  loginUser,

  logoutUser,

  resetPassword,

  addToCart,

  createSale,

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
   52. INITIALISATION PRINCIPALE
   ============================================================ */

async function startMystroShop() {

  console.log(
    "🚀 Démarrage Mystro-Shop..."
  );


  try {

    loadCart();


    setupCurrencySelector();


    setupSearch();


    setupMobileMenu();


    setupLoginForms();


    setupRegisterForms();


    setupLogoutButtons();


    setupImagePreview();


    setupVirtualAssistant();


    setupProductPublishing();


    await loadProducts();


    /*
      MutationObserver :
      si certaines pages ou boutons apparaissent
      après le chargement, Mystro-Shop les détecte.
    */

    const observer =
      new MutationObserver(
        () => {

          setupProductPublishing();

          setupLoginForms();

          setupRegisterForms();

          setupLogoutButtons();

          setupImagePreview();

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
      "❌ Erreur démarrage Mystro-Shop :",
      error
    );


    showToast(
      "Erreur lors du démarrage de Mystro-Shop.",
      "error"
    );

  }

}


/* ============================================================
   53. LANCEMENT
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

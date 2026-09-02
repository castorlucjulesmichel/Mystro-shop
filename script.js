// @ts-nocheck
"use strict";

/* =========================================
   MYSTRO-SHOP V2
   SCRIPT.JS
   ========================================= */


/* ---------- PRODUITS ---------- */

const products = [
  {
    name: "Sac urbain premium",
    category: "Mode",
    price: 89,
    icon: "👜"
  },
  {
    name: "Smartphone Nova",
    category: "Électronique",
    price: 399,
    icon: "📱"
  },
  {
    name: "Lampe design",
    category: "Maison",
    price: 65,
    icon: "💡"
  },
  {
    name: "Soin visage naturel",
    category: "Beauté",
    price: 32,
    icon: "💄"
  },
  {
    name: "Chaussures sport",
    category: "Sports",
    price: 75,
    icon: "👟"
  },
  {
    name: "Panier gourmand",
    category: "Alimentation",
    price: 45,
    icon: "🧺"
  },
  {
    name: "Casque audio",
    category: "Électronique",
    price: 75,
    icon: "🎧"
  },
  {
    name: "Montre élégante",
    category: "Mode",
    price: 120,
    icon: "⌚"
  }
];


/* ---------- CLIENTS ---------- */

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


/* ---------- DEVISES ---------- */

const rates = {
  USD: 1,
  EUR: 0.92,
  CAD: 1.37,
  GBP: 0.79,
  HTG: 130,
  XOF: 605,
  JPY: 148
};

const symbols = {
  USD: "$",
  EUR: "€",
  CAD: "$",
  GBP: "£",
  HTG: "G",
  XOF: "CFA",
  JPY: "¥"
};


let currentCurrency =
  localStorage.getItem("mystroCurrency") || "USD";

let balance =
  Number(localStorage.getItem("mystroBalance")) || 8420;

let cartCount =
  Number(localStorage.getItem("mystroCart")) || 0;


/* ---------- OUTILS ---------- */

function getElement(id) {
  return document.getElementById(id);
}


function money(value) {

  const rate =
    rates[currentCurrency] || 1;

  const symbol =
    symbols[currentCurrency] || "$";

  const amount =
    Number(value) * rate;

  return (
    symbol +
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


/* =========================================
   NAVIGATION
   ========================================= */

function showPage(pageName) {

  const pages =
    document.querySelectorAll(".page");

  const buttons =
    document.querySelectorAll(".nav-btn");


  pages.forEach(function (page) {

    if (page.id === pageName) {

      page.classList.add("active");

    } else {

      page.classList.remove("active");

    }

  });


  buttons.forEach(function (button) {

    const destination =
      button.getAttribute("data-page");

    if (destination === pageName) {

      button.classList.add("active");

    } else {

      button.classList.remove("active");

    }

  });


  const nav =
    getElement("nav");

  if (nav) {

    nav.classList.remove("open");

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================
   PRODUITS
   ========================================= */

function renderProducts(searchText) {

  const grid =
    getElement("productGrid");

  if (!grid) {
    return;
  }


  const search =
    String(searchText || "")
      .trim()
      .toLowerCase();


  grid.innerHTML = "";


  const filteredProducts =
    products.filter(function (product) {

      const text =
        (
          product.name +
          " " +
          product.category
        ).toLowerCase();

      return text.includes(search);

    });


  if (filteredProducts.length === 0) {

    grid.innerHTML =
      "<p>Aucun produit trouvé.</p>";

    return;

  }


  filteredProducts.forEach(function (product) {

    const card =
      document.createElement("article");

    card.className = "product";


    const emoji =
      document.createElement("div");

    emoji.className = "emoji";
    emoji.textContent = product.icon;


    const title =
      document.createElement("h3");

    title.textContent = product.name;


    const category =
      document.createElement("p");

    category.textContent =
      product.category;


    const price =
      document.createElement("div");

    price.className = "price";

    price.textContent =
      money(product.price);


    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "primary";

    button.textContent =
      "Ajouter au panier";


    button.addEventListener(
      "click",
      function () {

        cartCount++;

        localStorage.setItem(
          "mystroCart",
          String(cartCount)
        );

        updateCart();

        showToast(
          product.name +
          " ajouté au panier"
        );

      }
    );


    card.appendChild(emoji);

    card.appendChild(title);

    card.appendChild(category);

    card.appendChild(price);

    card.appendChild(button);


    grid.appendChild(card);

  });

}


/* =========================================
   PANIER
   ========================================= */

function updateCart() {

  const cart =
    getElement("cartCount");

  if (cart) {

    cart.textContent =
      String(cartCount);

  }

}


/* =========================================
   CLIENTS
   ========================================= */

function renderClients(searchText) {

  const list =
    getElement("clientList");

  if (!list) {
    return;
  }


  const search =
    String(searchText || "")
      .trim()
      .toLowerCase();


  list.innerHTML = "";


  const filteredClients =
    clients.filter(function (client) {

      const text =
        (
          client.name +
          " " +
          client.email
        ).toLowerCase();

      return text.includes(search);

    });


  if (filteredClients.length === 0) {

    list.innerHTML =
      "<p>Aucun client trouvé.</p>";

    return;

  }


  filteredClients.forEach(
    function (client) {

      const card =
        document.createElement("article");

      card.className = "client";


      const avatar =
        document.createElement("div");

      avatar.className =
        "client-avatar";

      avatar.textContent =
        client.name.charAt(0);


      const information =
        document.createElement("div");

      information.className =
        "client-info";


      const name =
        document.createElement("strong");

      name.textContent =
        client.name;


      const details =
        document.createElement("small");

      details.textContent =
        client.email +
        " • " +
        client.orders +
        " commandes • " +
        money(client.total);


      information.appendChild(name);

      information.appendChild(
        document.createElement("br")
      );

      information.appendChild(details);


      const status =
        document.createElement("span");

      status.textContent =
        client.online
          ? "🟢 En ligne"
          : "⚪ Hors ligne";


      card.appendChild(avatar);

      card.appendChild(information);

      card.appendChild(status);


      list.appendChild(card);

    }
  );

}


/* =========================================
   PORTEFEUILLE
   ========================================= */

function updateBalance() {

  const balanceElement =
    getElement("balance");

  if (balanceElement) {

    balanceElement.textContent =
      money(balance);

  }


  localStorage.setItem(
    "mystroBalance",
    String(balance)
  );

}


/* =========================================
   NOTIFICATION
   ========================================= */

function showToast(message) {

  let toast =
    getElement("toast");


  if (!toast) {

    toast =
      document.createElement("div");

    toast.id = "toast";

    toast.style.position =
      "fixed";

    toast.style.bottom =
      "25px";

    toast.style.left =
      "50%";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.background =
      "#172033";

    toast.style.color =
      "#ffffff";

    toast.style.padding =
      "12px 20px";

    toast.style.borderRadius =
      "10px";

    toast.style.zIndex =
      "9999";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;

  toast.style.display =
    "block";


  window.setTimeout(
    function () {

      toast.style.display =
        "none";

    },
    2200
  );

}


/* =========================================
   INITIALISATION
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {


    /* MENU MOBILE */

    const menuButton =
      getElement("menuBtn");

    const nav =
      getElement("nav");


    if (menuButton && nav) {

      menuButton.addEventListener(
        "click",
        function () {

          nav.classList.toggle(
            "open"
          );

        }
      );

    }


    /* NAVIGATION */

    const navigationButtons =
      document.querySelectorAll(
        "[data-page]"
      );


    navigationButtons.forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const page =
              button.getAttribute(
                "data-page"
              );

            if (page) {

              showPage(page);

            }

          }
        );

      }
    );


    /* BOUTONS ACCUEIL */

    const goButtons =
      document.querySelectorAll(
        "[data-go]"
      );


    goButtons.forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const page =
              button.getAttribute(
                "data-go"
              );

            if (page) {

              showPage(page);

            }

          }
        );

      }
    );


    /* DEVISE */

    const currency =
      getElement("currency");


    if (currency) {

      currency.value =
        currentCurrency;


      currency.addEventListener(
        "change",
        function () {

          currentCurrency =
            currency.value;


          localStorage.setItem(
            "mystroCurrency",
            currentCurrency
          );


          renderProducts(
            getElement("productSearch")
              ? getElement("productSearch").value
              : ""
          );


          renderClients(
            getElement("clientSearch")
              ? getElement("clientSearch").value
              : ""
          );


          updateBalance();

        }
      );

    }


    /* RECHERCHE PRODUITS */

    const productSearch =
      getElement("productSearch");


    if (productSearch) {

      productSearch.addEventListener(
        "input",
        function () {

          renderProducts(
            productSearch.value
          );

        }
      );

    }


    /* RECHERCHE CLIENTS */

    const clientSearch =
      getElement("clientSearch");


    if (clientSearch) {

      clientSearch.addEventListener(
        "input",
        function () {

          renderClients(
            clientSearch.value
          );

        }
      );

    }


    /* AJOUTER PRODUIT */

    const addProduct =
      getElement("addProduct");


    if (addProduct) {

      addProduct.addEventListener(
        "click",
        function () {

          const nameInput =
            getElement(
              "newProductName"
            );

          const priceInput =
            getElement(
              "newProductPrice"
            );

          const categoryInput =
            getElement(
              "newProductCategory"
            );

          const message =
            getElement(
              "sellMessage"
            );


          if (
            !nameInput ||
            !priceInput ||
            !categoryInput
          ) {

            return;

          }


          const name =
            nameInput.value.trim();

          const category =
            categoryInput.value.trim()
            || "Autre";

          const price =
            Number(
              priceInput.value
            );


          if (
            !name ||
            !Number.isFinite(price) ||
            price <= 0
          ) {

            if (message) {

              message.textContent =
                "Entre un nom et un prix valides.";

            }

            return;

          }


          products.unshift({
            name: name,
            category: category,
            price: price,
            icon: "📦"
          });


          nameInput.value = "";

          priceInput.value = "";

          categoryInput.value = "";


          if (message) {

            message.textContent =
              "Produit ajouté avec succès.";

          }


          renderProducts("");

          showToast(
            "Produit ajouté"
          );

        }
      );

    }


    /* PORTEFEUILLE */

    const depositButton =
      getElement("depositBtn");


    if (depositButton) {

      depositButton.addEventListener(
        "click",
        function () {

          balance += 100;

          updateBalance();

          showToast(
            "100 ajoutés au portefeuille"
          );

        }
      );

    }


    /* CHAT */

    const chatForm =
      getElement("chatForm");

    const chatInput =
      getElement("chatInput");

    const messages =
      getElement("messages");


    if (
      chatForm &&
      chatInput &&
      messages
    ) {

      chatForm.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();


          const text =
            chatInput.value.trim();


          if (!text) {
            return;
          }


          const message =
            document.createElement(
              "div"
            );


          message.className =
            "message sent";

          message.textContent =
            text;


          messages.appendChild(
            message
          );


          chatInput.value =
            "";


          messages.scrollTop =
            messages.scrollHeight;

        }
      );

    }


    /* PREMIER AFFICHAGE */

    renderProducts("");

    renderClients("");

    updateBalance();

    updateCart();

  }
);

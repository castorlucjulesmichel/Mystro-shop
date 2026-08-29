// @ts-nocheck
"use strict";

/* =========================================================
   MYSTRO-SHOP V2 — SCRIPT.JS
   Version propre et sécurisée pour Acode
   ========================================================= */

/* ---------- PRODUITS ---------- */

const products = [
  {
    name: "Sac urbain premium",
    category: "Mode",
    price: 45
  },
  {
    name: "Smartphone Nova",
    category: "Électronique",
    price: 299
  },
  {
    name: "Lampe design",
    category: "Maison",
    price: 35
  },
  {
    name: "Soin visage naturel",
    category: "Beauté",
    price: 25
  },
  {
    name: "Chaussures sport",
    category: "Sports",
    price: 60
  },
  {
    name: "Panier gourmand",
    category: "Alimentation",
    price: 40
  },
  {
    name: "Casque audio",
    category: "Électronique",
    price: 75
  },
  {
    name: "Montre élégante",
    category: "Mode",
    price: 120
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

/* ---------- DONNÉES ---------- */

let currentCurrency =
  localStorage.getItem("mystroCurrency") || "USD";

let balance = Number(
  localStorage.getItem("mystroBalance") || 0
);

let walletMode = "deposit";

/* ---------- OUTILS ---------- */

/**
 * Récupère un élément sans provoquer d'erreur
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Convertit un prix USD vers la devise sélectionnée
 */
function convertPrice(priceUSD) {
  const rate = rates[currentCurrency] || 1;
  return Number(priceUSD) * rate;
}

/**
 * Formate un montant
 */
function formatMoney(amount) {
  const symbol = symbols[currentCurrency] || "$";

  return (
    symbol +
    Number(amount).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

/**
 * Affiche un message
 */
function showMessage(message) {
  const messageElement =
    $("message") ||
    $("messages") ||
    $("notification") ||
    $("toast");

  if (messageElement) {
    messageElement.textContent = message;
    messageElement.style.display = "block";

    setTimeout(function () {
      messageElement.style.display = "none";
    }, 3000);

    return;
  }

  console.log(message);
}

/* =========================================================
   DEVISE
   ========================================================= */

function updateCurrency() {
  const currencySelect =
    $("currency") ||
    $("currencySelect") ||
    $("devise");

  if (currencySelect) {
    currentCurrency = currencySelect.value || "USD";

    localStorage.setItem(
      "mystroCurrency",
      currentCurrency
    );
  }

  updatePrices();
}

/**
 * Met à jour tous les prix affichés
 */
function updatePrices() {
  const priceElements =
    document.querySelectorAll("[data-price]");

  priceElements.forEach(function (element) {
    const usdPrice = Number(
      element.getAttribute("data-price")
    );

    if (!Number.isNaN(usdPrice)) {
      element.textContent =
        formatMoney(convertPrice(usdPrice));
    }
  });

  const currencyLabels =
    document.querySelectorAll("[data-currency]");

  currencyLabels.forEach(function (element) {
    element.textContent = currentCurrency;
  });
}

/* =========================================================
   PORTEFEUILLE
   ========================================================= */

function updateBalance() {
  const balanceElements = [
    $("balance"),
    $("solde"),
    $("walletBalance"),
    $("wallet-balance")
  ];

  balanceElements.forEach(function (element) {
    if (element) {
      element.textContent = formatMoney(balance);
    }
  });

  localStorage.setItem(
    "mystroBalance",
    String(balance)
  );
}

/**
 * Dépôt
 */
function deposit(amount) {
  amount = Number(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage("Veuillez entrer un montant valide.");
    return;
  }

  balance += amount;
  updateBalance();

  showMessage(
    "Dépôt effectué : " + formatMoney(amount)
  );
}

/**
 * Retrait
 */
function withdraw(amount) {
  amount = Number(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage("Veuillez entrer un montant valide.");
    return;
  }

  if (amount > balance) {
    showMessage("Solde insuffisant.");
    return;
  }

  balance -= amount;
  updateBalance();

  showMessage(
    "Retrait effectué : " + formatMoney(amount)
  );
}

/* =========================================================
   PRODUITS
   ========================================================= */

function displayProducts(list) {
  const container =
    $("products") ||
    $("productList") ||
    $("listeProduits");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML =
      "<p>Aucun produit trouvé.</p>";
    return;
  }

  list.forEach(function (product) {
    const card = document.createElement("div");

    card.className = "product-card";

    card.innerHTML = `
      <h3>${escapeHTML(product.name)}</h3>
      <p>${escapeHTML(product.category)}</p>
      <strong>${formatMoney(
        convertPrice(product.price)
      )}</strong>
      <button type="button"
              data-product="${escapeHTML(product.name)}">
        Ajouter
      </button>
    `;

    container.appendChild(card);
  });
}

/**
 * Recherche de produits
 */
function searchProducts(value) {
  const query = String(value || "")
    .trim()
    .toLowerCase();

  if (!query) {
    displayProducts(products);
    return;
  }

  const result = products.filter(function (product) {
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  displayProducts(result);
}

/**
 * Sécurité pour les textes insérés dans HTML
 */
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   NAVIGATION DES PAGES
   ========================================================= */

function showPage(pageName) {
  const pages =
    document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.remove("active");

    const identifier =
      page.getAttribute("identifiant") ||
      page.getAttribute("data-page") ||
      page.id;

    if (identifier === pageName) {
      page.classList.add("active");
    }
  });

  /* Compatibilité avec les sections utilisant des IDs */
  const target = $(pageName);

  if (target) {
    pages.forEach(function (page) {
      page.classList.remove("active");
    });

    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   CLIENTS
   ========================================================= */

const clients = [
  {
    name: "Client 1",
    orders: 8,
    total: 420
  },
  {
    name: "Client 2",
    orders: 5,
    total: 275
  },
  {
    name: "Client 3",
    orders: 12,
    total: 680
  },
  {
    name: "Client 4",
    orders: 3,
    total: 150
  }
];

function displayClients() {
  const container =
    $("clientsList") ||
    $("clientList") ||
    $("clients");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  clients.forEach(function (client) {
    const item = document.createElement("div");

    item.className = "client-card";

    item.innerHTML = `
      <h3>${escapeHTML(client.name)}</h3>
      <p>Commandes : ${client.orders}</p>
      <strong>
        Total : ${formatMoney(
          convertPrice(client.total)
        )}
      </strong>
    `;

    container.appendChild(item);
  });
}

/* =========================================================
   CHAT
   ========================================================= */

function sendChatMessage(message) {
  const text = String(message || "").trim();

  if (!text) {
    return;
  }

  const chat =
    $("chatMessages") ||
    $("messagesChat") ||
    $("chat");

  if (!chat) {
    return;
  }

  const messageElement =
    document.createElement("div");

  messageElement.className = "chat-message user";

  messageElement.textContent = text;

  chat.appendChild(messageElement);

  chat.scrollTop = chat.scrollHeight;
}

/* =========================================================
   STATISTIQUES
   ========================================================= */

const statistics = {
  sales: 125,
  orders: 48,
  clients: 32,
  revenue: 4280
};

function updateStatistics() {
  const sales = $("statSales");
  const orders = $("statOrders");
  const clientCount = $("statClients");
  const revenue = $("statRevenue");

  if (sales) {
    sales.textContent = statistics.sales;
  }

  if (orders) {
    orders.textContent = statistics.orders;
  }

  if (clientCount) {
    clientCount.textContent = statistics.clients;
  }

  if (revenue) {
    revenue.textContent =
      formatMoney(
        convertPrice(statistics.revenue)
      );
  }
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* Devise */
  const currencySelect =
    $("currency") ||
    $("currencySelect") ||
    $("devise");

  if (currencySelect) {
    currencySelect.value = currentCurrency;

    currencySelect.addEventListener(
      "change",
      updateCurrency
    );
  }

  /* Recherche */
  const searchInput =
    $("search") ||
    $("searchInput") ||
    $("recherche");

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      function () {
        searchProducts(this.value);
      }
    );
  }

  /* Boutons de navigation */
  document.addEventListener(
    "click",
    function (event) {
      const button =
        event.target.closest("[data-page]");

      if (button) {
        const page =
          button.getAttribute("data-page");

        if (page) {
          showPage(page);
        }
      }
    }
  );

  /* Initialisation */
  updateBalance();
  updatePrices();
  displayProducts(products);
  displayClients();
  updateStatistics();

  console.log(
    "Mystro-Shop V2 : script.js chargé correctement."
  );
});

/* =========================================================
   FIN
   ========================================================= */

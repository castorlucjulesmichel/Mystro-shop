const products = [
  {name:"Sac urbain premium", category:"Mode", price:49.99, icon:"👜"},
  {name:"Smartphone Nova", category:"Électronique", price:299.99, icon:"📱"},
  {name:"Lampe design", category:"Maison", price:39.99, icon:"💡"},
  {name:"Soin visage naturel", category:"Beauté", price:24.99, icon:"🧴"},
  {name:"Chaussures sport", category:"Sports", price:69.99, icon:"👟"},
  {name:"Panier gourmand", category:"Alimentation", price:34.99, icon:"🍎"},
  {name:"Casque audio", category:"Électronique", price:89.99, icon:"🎧"},
  {name:"Montre élégante", category:"Mode", price:79.99, icon:"⌚"}
];

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

let currentCurrency = "USD";
let cartCount = 0;

const grid = document.getElementById("productGrid");
const empty = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const currencySelect = document.getElementById("currencySelect");
const cartCountEl = document.getElementById("cartCount");
const toast = document.getElementById("toast");

/* 💰 Affichage des prix */
function money(/** @type {number} */ usd) {
  const value = usd * rates[currentCurrency];

  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${symbols[currentCurrency]}`;
}

/* 🛍️ Affichage des produits */
function render(list = products) {
  grid.innerHTML = "";

  empty.classList.toggle("hidden", list.length !== 0);

  list.forEach((p) => {
    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">${p.icon}</div>

      <div class="product-info">
        <div class="product-category">${p.category}</div>

        <h3>${p.name}</h3>

        <div class="product-price">
          ${money(p.price)}
        </div>

        <button class="add-btn">
          Ajouter au panier
        </button>
      </div>
    `;

    card.querySelector(".add-btn").addEventListener("click", () => {
      cartCount++;

      cartCountEl.textContent = cartCount;

      showToast(`${p.name} ajouté au panier`);
    });

    grid.appendChild(card);
  });
}

/* 🔎 Recherche */
function filter() {
  const q = searchInput.value.trim().toLowerCase();

  render(
    products.filter((p) =>
      `${p.name} ${p.category}`
        .toLowerCase()
        .includes(q)
    )
  );
}

/* 🔔 Message */
function showToast(/** @type {string} */ message) {
  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* 💱 Changement de devise */
currencySelect.addEventListener("change", () => {
  currentCurrency = currencySelect.value;

  filter();

  showToast(`Devise : ${currentCurrency}`);
});

/* 🔎 Recherche en direct */
searchInput.addEventListener("input", filter);

/* 🔎 Bouton recherche */
document.getElementById("searchBtn").addEventListener("click", filter);

/* 🔄 Réinitialiser */
document.getElementById("resetBtn").addEventListener("click", () => {
  searchInput.value = "";
  render(products);
});

/* 📂 Catégories */
document.querySelectorAll(".category-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;

    render(
      products.filter(
        (p) => p.category === category
      )
    );

    document
      .getElementById("products")
      .scrollIntoView({
        behavior: "smooth"
      });
  });
});

/* ☰ Menu mobile */
document.getElementById("menuBtn").addEventListener("click", () => {
  document
    .getElementById("mobileNav")
    .classList.toggle("open");
});

/* 🏪 Espace vendeur */
document.getElementById("sellerBtn").addEventListener("click", () => {
  showToast(
    "Espace vendeur : prochaine étape de Mystro-Shop"
  );
});

/* 🚀 Démarrage */
render();

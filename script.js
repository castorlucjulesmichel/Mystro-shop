'use strict';

const products = [
  { id: 1, name: 'Sac urbain premium', category: 'Mode', price: 49.99, emoji: '👜' },
  { id: 2, name: 'Smartphone Nova', category: 'Électronique', price: 299.99, emoji: '📱' },
  { id: 3, name: 'Lampe design', category: 'Maison', price: 39.99, emoji: '💡' },
  { id: 4, name: 'Soin visage naturel', category: 'Beauté', price: 24.99, emoji: '🧴' },
  { id: 5, name: 'Chaussures sport', category: 'Sports', price: 69.99, emoji: '👟' },
  { id: 6, name: 'Panier gourmand', category: 'Alimentation', price: 34.99, emoji: '🍎' },
  { id: 7, name: 'Casque audio', category: 'Électronique', price: 89.99, emoji: '🎧' },
  { id: 8, name: 'Montre élégante', category: 'Mode', price: 79.99, emoji: '⌚' }
];

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

const clients = [
  {
    name: 'Jean M.',
    email: 'jean@example.com',
    orders: 12,
    total: 1240,
    online: true
  },
  {
    name: 'Marie L.',
    email: 'marie@example.com',
    orders: 8,
    total: 820,
    online: true
  },
  {
    name: 'Paul R.',
    email: 'paul@example.com',
    orders: 6,
    total: 540,
    online: false
  }
];

const orders = [
  {
    id: '#1048',
    client: 'Jean M.',
    amount: 240,
    status: 'Payée'
  },
  {
    id: '#1047',
    client: 'Marie L.',
    amount: 180,
    status: 'Expédiée'
  },
  {
    id: '#1046',
    client: 'Paul R.',
    amount: 95,
    status: 'Préparation'
  }
];

let currency =
  localStorage.getItem('mystroCurrency') || 'USD';

let balanceUSD =
  Number(localStorage.getItem('mystroBalanceUSD')) || 2450;

let cartCount = 0;


/* =========================================
   RACCOURCIS DOM
   ========================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));


/* =========================================
   FORMAT MONNAIE
   ========================================= */

function money(valueUSD) {
  const converted = valueUSD * rates[currency];

  const locale =
    currency === 'HTG'
      ? 'fr-HT'
      : 'fr-FR';

  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted) +
    ' ' +
    symbols[currency]
  );
}


/* =========================================
   TOAST
   ========================================= */

function showToast(message) {
  const toast = $('#toast');

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add('show');

  window.clearTimeout(showToast.timer);

  showToast.timer =
    window.setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
}


/* =========================================
   SIDEBAR
   ========================================= */

function closeSidebar() {
  $('#sidebar')?.classList.remove('open');
  $('#overlay')?.classList.remove('show');
}


/* =========================================
   NAVIGATION
   ========================================= */

function showPage(pageId) {
  $$('.page').forEach((page) => {
    page.classList.toggle(
      'active',
      page.id === pageId
    );
  });

  $$('.nav-btn').forEach((btn) => {
    btn.classList.toggle(
      'active',
      btn.dataset.page === pageId
    );
  });

  closeSidebar();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================
   CARTE PRODUIT
   ========================================= */

function productCard(product) {
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


/* =========================================
   PRODUITS
   ========================================= */

function renderProducts() {
  const grid = $('#productGrid');

  if (!grid) {
    return;
  }

  const query =
    ($('#productSearch')?.value || '')
      .trim()
      .toLowerCase();

  const category =
    $('#categoryFilter')?.value || 'all';

  const filtered =
    products.filter((product) => {
      const matchesQuery =
        product.name
          .toLowerCase()
          .includes(query) ||
        product.category
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === 'all' ||
        product.category === category;

      return (
        matchesQuery &&
        matchesCategory
      );
    });

  grid.innerHTML =
    filtered.length
      ? filtered.map(productCard).join('')
      : '<div class="panel">Aucun produit trouvé.</div>';
}


/* =========================================
   PRODUITS EN VEDETTE
   ========================================= */

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
      .join('');
}


/* =========================================
   CLIENTS
   ========================================= */

function renderClients() {
  const grid =
    $('#clientGrid');

  if (!grid) {
    return;
  }

  const query =
    ($('#clientSearch')?.value || '')
      .trim()
      .toLowerCase();

  const filtered =
    clients.filter((client) => {
      return (
        client.name
          .toLowerCase()
          .includes(query) ||
        client.email
          .toLowerCase()
          .includes(query)
      );
    });

  grid.innerHTML =
    filtered.map((client) => `
      <article class="client-card">

        <div class="avatar">
          ${client.name.charAt(0)}
        </div>

        <div class="client-meta">

          <strong>
            ${client.name}
          </strong>

          <small>
            ${client.email}
            ·
            ${client.orders}
            commandes
            ·
            ${money(client.total)}
          </small>

        </div>

        <span
          class="${
            client.online
              ? 'online'
              : 'offline'
          }"
        >
          ${
            client.online
              ? '● En ligne'
              : '● Hors ligne'
          }
        </span>

      </article>
    `).join('');
}


/* =========================================
   COMMANDES
   ========================================= */

function renderOrders() {
  const tbody =
    $('#ordersTable');

  if (tbody) {
    tbody.innerHTML =
      orders.map((order) => `
        <tr>

          <td>
            ${order.id}
          </td>

          <td>
            ${order.client}
          </td>

          <td>
            ${money(order.amount)}
          </td>

          <td>
            <span
              class="status ${
                order.status ===
                'Préparation'
                  ? 'wait'
                  : ''
              }"
            >
              ${order.status}
            </span>
          </td>

        </tr>
      `).join('');
  }

  const preview =
    $('#ordersPreview');

  if (preview) {
    preview.innerHTML =
      orders
        .slice(0, 3)
        .map((order) => `
          <div class="transaction">

            <span>
              ${order.id}
              ·
              ${order.client}
            </span>

            <strong>
              ${money(order.amount)}
            </strong>

          </div>
        `)
        .join('');
  }
}


/* =========================================
   GRAPHIQUES
   ========================================= */

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
    values.map((value, index) => {
      const height =
        Math.max(
          12,
          Math.round(
            (value / max) * 210
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
    }).join('');
}


/* =========================================
   DEVISE
   ========================================= */

function updateCurrencyUI() {
  const select =
    $('#currencySelect');

  if (select) {
    select.value = currency;
  }

  const balance =
    $('#walletBalance');

  if (balance) {
    balance.textContent =
      money(balanceUSD);
  }

  renderProducts();
  renderFeatured();
  renderClients();
  renderOrders();
}


/* =========================================
   AJOUT PRODUIT
   ========================================= */

function addProductFromForm(event) {
  event.preventDefault();

  const name =
    $('#productName')?.value.trim();

  const category =
    $('#productCategory')?.value;

  const price =
    Number(
      $('#productPrice')?.value
    );

  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    showToast(
      'Vérifie le nom, la catégorie et le prix.'
    );

    return;
  }

  const emojiMap = {
    Mode: '👜',
    Électronique: '📱',
    Maison: '🏠',
    Beauté: '✨',
    Sports: '👟',
    Alimentation: '🍎'
  };

  products.unshift({
    id: Date.now(),
    name: name,
    category: category,
    price: price,
    emoji:
      emojiMap[category] ||
      '📦'
  });

  event.currentTarget.reset();

  const stock =
    $('#productStock');

  if (stock) {
    stock.value = '1';
  }

  renderProducts();
  renderFeatured();

  showToast(
    'Produit publié.'
  );

  showPage(
    'products'
  );
}


/* =========================================
   CHAT
   ========================================= */

function initChat() {
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
          Jean M.
        </strong>

        <br>

        <small>
          Produit disponible ?
        </small>
      </button>

      <button
        class="chat-user"
        type="button"
      >
        <strong>
          Marie L.
        </strong>

        <br>

        <small>
          Merci pour la livraison.
        </small>
      </button>

      <button
        class="chat-user"
        type="button"
      >
        <strong>
          Paul R.
        </strong>

        <br>

        <small>
          Quel est le délai ?
        </small>
      </button>
    `;
  }

  if (messages) {
    messages.innerHTML = `
      <div class="bubble them">
        Bonjour, le produit est-il encore disponible ?
      </div>

      <div class="bubble me">
        Bonjour ! Oui, il est disponible.
      </div>
    `;
  }
}


/* =========================================
   ÉVÉNEMENTS
   ========================================= */

function initEvents() {
  $('#menuToggle')
    ?.addEventListener(
      'click',
      () => {
        $('#sidebar')
          ?.classList.add('open');

        $('#overlay')
          ?.classList.add('show');
      }
    );

  $('#overlay')
    ?.addEventListener(
      'click',
      closeSidebar
    );

  document.addEventListener(
    'click',
    (event) => {
      const target =
        event.target;

      if (
        !(target instanceof Element)
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
        const value =
          category.getAttribute(
            'data-category'
          );

        showPage(
          'products'
        );

        const filter =
          $('#categoryFilter');

        if (filter) {
          filter.value =
            value;
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
      (event) => {
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

  $('#clientSearch')
    ?.addEventListener(
      'input',
      renderClients
    );

  $('#productForm')
    ?.addEventListener(
      'submit',
      addProductFromForm
    );

  $('#depositBtn')
    ?.addEventListener(
      'click',
      () => {
        balanceUSD += 100;

        localStorage.setItem(
          'mystroBalanceUSD',
          String(balanceUSD)
        );

        updateCurrencyUI();

        showToast(
          '100 USD ajoutés au solde de démonstration.'
        );
      }
    );

  $('#withdrawBtn')
    ?.addEventListener(
      'click',
      () => {
        if (
          balanceUSD < 100
        ) {
          showToast(
            'Solde insuffisant.'
          );

          return;
        }

        balanceUSD -= 100;

        localStorage.setItem(
          'mystroBalanceUSD',
          String(balanceUSD)
        );

        updateCurrencyUI();

        showToast(
          'Retrait de démonstration : 100 USD.'
        );
      }
    );

  $('#chatForm')
    ?.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();

        const input =
          $('#messageInput');

        const value =
          input?.value.trim();

        if (!value) {
          return;
        }

        const bubble =
          document.createElement(
            'div'
          );

        bubble.className =
          'bubble me';

        bubble.textContent =
          value;

        const messages =
          $('#messages');

        messages
          ?.appendChild(
            bubble
          );

        input.value = '';

        if (messages) {
          messages.scrollTop =
            messages.scrollHeight;
        }
      }
    );
}


/* =========================================
   INITIALISATION
   ========================================= */

function init() {
  updateCurrencyUI();

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

  initChat();
  initEvents();

  showPage(
    'home'
  );
}


/* =========================================
   DÉMARRAGE
   ========================================= */

document.addEventListener(
  'DOMContentLoaded',
  init
);

// @ts-nocheck
"use strict";

const products = [
  {name:"Sac urbain premium",category:"Mode",price:49.99,icon:"👜"},
  {name:"Smartphone Nova",category:"Électronique",price:299.99,icon:"📱"},
  {name:"Lampe design",category:"Maison",price:39.99,icon:"💡"},
  {name:"Soin visage naturel",category:"Beauté",price:24.99,icon:"🧴"},
  {name:"Chaussures sport",category:"Sports",price:69.99,icon:"👟"},
  {name:"Panier gourmand",category:"Alimentation",price:34.99,icon:"🍎"},
  {name:"Casque audio",category:"Électronique",price:89.99,icon:"🎧"},
  {name:"Montre élégante",category:"Mode",price:79.99,icon:"⌚"}
];

const rates = {USD:1,EUR:0.92,CAD:1.37,GBP:0.79,HTG:130,XOF:605,JPY:148};
const symbols = {USD:"$",EUR:"€",CAD:"$",GBP:"£",HTG:"G",XOF:"CFA",JPY:"¥"};

let currentCurrency = localStorage.getItem("mystroCurrency") || "USD";
let balance = Number(localStorage.getItem("mystroBalance") || 2450);
let sales = [
  {name:"Sac urbain premium",amount:49.99,icon:"👜",date:"Aujourd'hui"},
  {name:"Casque audio",amount:89.99,icon:"🎧",date:"Hier"},
  {name:"Chaussures sport",amount:69.99,icon:"👟",date:"Hier"},
  {name:"Smartphone Nova",amount:299.99,icon:"📱",date:"Il y a 3 jours"}
];

const clients = [
  {name:"Sophie Martin",country:"France",status:"En ligne",icon:"👩"},
  {name:"Jean Pierre",country:"Haïti",status:"En ligne",icon:"👨"},
  {name:"Amina Diallo",country:"Sénégal",status:"Il y a 5 min",icon:"👩🏾"},
  {name:"Lucas Brown",country:"Canada",status:"Il y a 12 min",icon:"👨🏽"},
  {name:"Maya Chen",country:"Japon",status:"Il y a 18 min",icon:"👩🏻"},
  {name:"Daniel Smith",country:"États-Unis",status:"Il y a 22 min",icon:"👨🏻"}
];

/** @param {string} id */
const $ = (id) => document.getElementById(id);

/** @param {number} usd */
function money(usd){
  const value = Number(usd || 0) * rates[currentCurrency];
  return `${value.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} ${symbols[currentCurrency]}`;
}

/** @param {string} message */
function showToast(message){
  const toast = $("toast");
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.mystroToastTimer);
  window.mystroToastTimer = setTimeout(() => toast.classList.remove("show"),2200);
}

function updateBalance(){
  if($("walletBalance")) $("walletBalance").textContent = money(balance);
  if($("homeBalance")) $("homeBalance").textContent = money(balance);
  localStorage.setItem("mystroBalance",String(balance));
}

function totalRevenue(){
  return sales.reduce((sum,item) => sum + item.amount,0);
}

function renderDashboard(){
  if($("revenueValue")) $("revenueValue").textContent = money(totalRevenue());
  if($("salesValue")) $("salesValue").textContent = String(sales.length);
  if($("clientsValue")) $("clientsValue").textContent = String(clients.length);

  const recent = $("recentSales");
  if(recent){
    recent.innerHTML = sales.map(item => `
      <div class="sale-row">
        <div class="sale-icon">${item.icon}</div>
        <div class="grow"><strong>${item.name}</strong><small>${item.date}</small></div>
        <div class="price">+${money(item.amount)}</div>
      </div>
    `).join("");
  }

  const active = $("activeClients");
  if(active){
    active.innerHTML = clients.slice(0,5).map(client => `
      <div class="client-row">
        <div class="client-avatar">${client.icon}</div>
        <div class="grow"><strong>${client.name}</strong><small>${client.country}</small></div>
        <span class="online">${client.status}</span>
      </div>
    `).join("");
  }
}

function renderCategories(){
  const box = $("categoryButtons");
  if(!box) return;

  const categories = ["Toutes",...new Set(products.map(product => product.category))];
  box.innerHTML = categories.map((category,index) =>
    `<button class="chip ${index === 0 ? "active":""}" data-category="${category}">${category}</button>`
  ).join("");

  box.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click",() => {
      box.querySelectorAll(".chip").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      const category = button.dataset.category;
      renderProducts(category === "Toutes" ? products : products.filter(item => item.category === category));
    });
  });
}

function renderProducts(list = products){
  const grid = $("productGrid");
  if(!grid) return;

  const empty = $("emptyState");
  grid.innerHTML = "";

  if(empty) empty.classList.toggle("hidden",list.length !== 0);

  list.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">${product.icon}</div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3>${product.name}</h3>
        <div class="product-price">${money(product.price)}</div>
        <button class="add-btn">Ajouter au panier</button>
      </div>
    `;

    card.querySelector(".add-btn").addEventListener("click",() => {
      showToast(`${product.name} ajouté au panier`);
    });

    grid.appendChild(card);
  });
}

function filterProducts(){
  const input = $("searchInput");
  if(!input) return;

  const query = input.value.trim().toLowerCase();
  renderProducts(products.filter(product =>
    `${product.name} ${product.category}`.toLowerCase().includes(query)
  ));
}

function renderSales(){
  const box = $("salesList");
  if(!box) return;

  box.innerHTML = sales.map(item => `
    <div class="sale-row">
      <div class="sale-icon">${item.icon}</div>
      <div class="grow"><strong>${item.name}</strong><small>${item.date}</small></div>
      <div class="price">${money(item.amount)}</div>
    </div>
  `).join("");
}

function renderClients(){
  const box = $("clientsPage");
  if(!box) return;

  box.innerHTML = clients.map(client => `
    <div class="client-card">
      <div class="client-avatar">${client.icon}</div>
      <div><strong>${client.name}</strong><div>${client.country}</div><span class="online">${client.status}</span></div>
    </div>
  `).join("");
}

function renderStatistics(){
  if($("avgOrder")) $("avgOrder").textContent = money(sales.length ? totalRevenue()/sales.length : 0);
  if($("productCount")) $("productCount").textContent = String(products.length);

  const chart = $("salesChart");
  if(!chart) return;

  const values = [35,58,42,72,66,88,78];
  chart.innerHTML = values.map((value,index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${value}%"></div>
      <small>J${index+1}</small>
    </div>
  `).join("");
}

function renderChatContacts(){
  const box = $("chatContacts");
  if(!box) return;

  box.innerHTML = clients.slice(0,5).map((client,index) =>
    `<div class="contact ${index === 0 ? "active":""}">${client.icon} ${client.name}</div>`
  ).join("");
}

function showPage(pageName){
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

  const target = $(pageName);
  if(target) target.classList.add("active");

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active",button.dataset.page === pageName);
  });

  $("sidebar")?.classList.remove("open");

  if(pageName === "dashboard") renderDashboard();
  if(pageName === "products") { renderCategories(); renderProducts(); }
  if(pageName === "sales") renderSales();
  if(pageName === "statistics") renderStatistics();
  if(pageName === "clients") renderClients();
  if(pageName === "chat") renderChatContacts();

  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click",(event) => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});

$("menuBtn")?.addEventListener("click",() => $("sidebar")?.classList.toggle("open"));

$("currencySelect")?.addEventListener("change",event => {
  currentCurrency = event.target.value;
  localStorage.setItem("mystroCurrency",currentCurrency);
  updateBalance();
  renderDashboard();
  renderProducts();
  renderSales();
  renderStatistics();
  showToast(`Devise : ${currentCurrency}`);
});

if($("currencySelect")) $("currencySelect").value = currentCurrency;

$("searchBtn")?.addEventListener("click",filterProducts);
$("searchInput")?.addEventListener("input",filterProducts);

$("resetBtn")?.addEventListener("click",() => {
  if($("searchInput")) $("searchInput").value = "";
  renderCategories();
  renderProducts();
});

/**
 * @param {string} mode
 * @param {string} [method]
 */
function openWallet(mode,method){
  window.walletMode = mode;
  if($("modalTitle")) $("modalTitle").textContent =
    mode === "deposit" ? "Dépôt" : mode === "withdraw" ? "Retrait" : "Transfert";
  if(method && $("walletMethod")) $("walletMethod").value = method;
  $("modal")?.classList.remove("hidden");
}

$("depositBtn")?.addEventListener("click",() => openWallet("deposit"));
$("withdrawBtn")?.addEventListener("click",() => openWallet("withdraw"));
$("transferBtn")?.addEventListener("click",() => openWallet("transfer"));

document.querySelectorAll(".pay").forEach((button) => {
  button.addEventListener("click",() => openWallet("deposit",button.dataset.method));
});

$("closeModal")?.addEventListener("click",() => $("modal")?.classList.add("hidden"));

$("modal")?.addEventListener("click",event => {
  if(event.target === $("modal")) $("modal").classList.add("hidden");
});

$("walletForm")?.addEventListener("submit",event => {
  event.preventDefault();

  const amount = Number($("walletAmount")?.value || 0);
  const method = $("walletMethod")?.value || "Moyen de paiement";

  if(amount <= 0){
    showToast("Montant invalide.");
    return;
  }

  if(window.walletMode === "deposit"){
    balance += amount;
    showToast(`Dépôt de ${money(amount)} via ${method} enregistré.`);
  }else{
    if(amount > balance){
      showToast("Solde insuffisant.");
      return;
    }
    balance -= amount;
    const label = window.walletMode === "withdraw" ? "Retrait" : "Transfert";
    showToast(`${label} de ${money(amount)} via ${method} enregistré.`);
  }

  updateBalance();
  $("walletForm").reset();
  $("modal")?.classList.add("hidden");
});

$("productForm")?.addEventListener("submit",event => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "").trim();
  const price = Number(form.get("price") || 0);

  if(!name || !category || price <= 0){
    showToast("Veuillez remplir correctement le formulaire.");
    return;
  }

  products.unshift({name,category,price,icon:"🛍️"});
  event.currentTarget.reset();
  renderCategories();
  renderProducts();
  showPage("products");
  showToast("Produit publié avec succès.");
});

$("chatForm")?.addEventListener("submit",event => {
  event.preventDefault();

  const input = $("chatInput");
  const text = input?.value.trim();

  if(!text) return;

  const message = document.createElement("div");
  message.className = "message sent";
  message.textContent = text;
  $("messages")?.appendChild(message);

  input.value = "";
  $("messages").scrollTop = $("messages").scrollHeight;
  showToast("Message envoyé.");
});

$("notificationsBtn")?.addEventListener("click",() => {
  showToast("3 notifications : nouvelle vente, message client et portefeuille.");
});

updateBalance();
renderCategories();
renderProducts();
renderDashboard();
renderSales();
renderStatistics();
renderClients();

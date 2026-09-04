// @ts-nocheck
"use strict";

(function () {

  const API_URL =
    "https://mystroshop-api.castormystro.workers.dev";


  // ==========================================
  // PRODUITS
  // ==========================================

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
      icon: "✨"
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


  // ==========================================
  // CLIENTS
  // ==========================================

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


  // ==========================================
  // COMMANDES
  // ==========================================

  const orders = [
    ["#1048", "Jean M.", 240, "Payée"],
    ["#1047", "Marie L.", 180, "Expédition"],
    ["#1046", "Paul R.", 95, "Préparation"],
    ["#1045", "Sarah K.", 320, "Payée"]
  ];


  // ==========================================
  // CHAT
  // ==========================================

  const chats = [
    {
      name: "Jean M.",
      messages: [
        [
          "them",
          "Bonjour, le smartphone est-il encore disponible ?"
        ],
        [
          "me",
          "Bonjour ! Oui, il est disponible."
        ]
      ]
    },
    {
      name: "Marie L.",
      messages: [
        [
          "them",
          "Merci pour votre aide !"
        ],
        [
          "me",
          "Avec plaisir 😊"
        ]
      ]
    },
    {
      name: "Sarah K.",
      messages: [
        [
          "them",
          "Je voudrais deux unités."
        ],
        [
          "me",
          "Très bien, je peux les réserver."
        ]
      ]
    }
  ];


  // ==========================================
  // DEVISES
  // ==========================================

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

  let currency =
    localStorage.getItem("mystroCurrency") ||
    "USD";

  /*
   * IMPORTANT :
   *
   * Ce solde est uniquement un affichage
   * temporaire de l'interface.
   *
   * Un paiement MonCash ne modifie jamais
   * ce solde automatiquement côté navigateur.
   *
   * Plus tard le vrai solde viendra du backend.
   */

  let balance = Number(
    localStorage.getItem("mystroBalance") ||
    2450
  );

  let selectedChat = 0;


  // ==========================================
  // OUTILS
  // ==========================================

  function byId(id) {
    return document.getElementById(id);
  }


  function money(value) {

    const amount =
      Number(value) *
      (rates[currency] || 1);

    return (
      (symbols[currency] || "$") +
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


  function toast(text) {

    const box = byId("toast");

    if (!box) {
      alert(text);
      return;
    }

    box.textContent = text;

    box.classList.add("show");

    clearTimeout(
      window.mystroToast
    );

    window.mystroToast =
      setTimeout(
        function () {

          box.classList.remove(
            "show"
          );

        },
        2500
      );
  }


  // ==========================================
  // NAVIGATION
  // ==========================================

  function showPage(name) {

    document
      .querySelectorAll(".page")
      .forEach(function (page) {

        page.classList.toggle(
          "active",
          page.id === name
        );

      });


    document
      .querySelectorAll(
        ".menu button"
      )
      .forEach(function (button) {

        button.classList.toggle(
          "active",
          button.dataset.page === name
        );

      });


    const sidebar =
      byId("sidebar");

    if (sidebar) {
      sidebar.classList.remove(
        "open"
      );
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


    if (name === "dashboard") {

      drawChart(
        "revenueChart",
        [
          6200,
          7200,
          6900,
          8400,
          9300,
          10800,
          12480
        ],
        [
          "Fév",
          "Mar",
          "Avr",
          "Mai",
          "Juin",
          "Juil",
          "Aoû"
        ]
      );

    }


    if (name === "stats") {

      drawChart(
        "statsChart",
        [
          4200,
          5600,
          5100,
          7100,
          8400,
          9800
        ],
        [
          "Mar",
          "Avr",
          "Mai",
          "Juin",
          "Juil",
          "Aoû"
        ]
      );

    }
  }


  // ==========================================
  // PRODUITS
 // ==========================================

  function productCard(product) {

    return `
      <article class="product-card">

        <div class="product-img">
          ${product.icon}
        </div>

        <div class="product-info">

          <h3>
            ${product.name}
          </h3>

          <p>
            ${product.category}
          </p>

          <div class="price">
            ${money(product.price)}
          </div>

          <button
            class="btn primary add-cart"
            data-name="${product.name}"
          >
            Ajouter au panier
          </button>

        </div>

      </article>
    `;
  }


  function renderProducts() {

    const search =
      (
        byId("productSearch")
          ?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const category =
      byId("categoryFilter")
        ?.value ||
      "";


    const list =
      products.filter(
        function (product) {

          const matchesCategory =
            !category ||
            product.category ===
              category;


          const matchesSearch =
            !search ||
            (
              product.name +
              " " +
              product.category
            )
              .toLowerCase()
              .includes(search);


          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );


    const productGrid =
      byId("productGrid");

    const homeProducts =
      byId("homeProducts");


    if (productGrid) {

      productGrid.innerHTML =
        list.length
          ? list
              .map(productCard)
              .join("")
          : `
              <div class="panel">
                Aucun produit trouvé.
              </div>
            `;
    }


    if (homeProducts) {

      homeProducts.innerHTML =
        products
          .slice(0, 4)
          .map(productCard)
          .join("");
    }
  }


  // ==========================================
  // CLIENTS
 // ==========================================

  function renderClients() {

    const search =
      (
        byId("clientSearch")
          ?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const list =
      clients.filter(
        function (client) {

          return (
            client.name +
            " " +
            client.email
          )
            .toLowerCase()
            .includes(search);
        }
      );


    const container =
      byId("clientList");


    if (!container) {
      return;
    }


    container.innerHTML =
      list
        .map(
          function (client) {

            return `
              <article class="client">

                <div class="avatar">
                  ${client.name.charAt(0)}
                </div>

                <div class="client-info">

                  <strong>
                    ${client.name}
                  </strong>

                  <br>

                  <small>

                    ${client.email}

                    ·

                    ${client.orders}
                    commandes

                    ·

                    ${money(client.total)}

                  </small>

                </div>

                <span>

                  ${
                    client.online
                      ? "🟢 En ligne"
                      : "⚪ Hors ligne"
                  }

                </span>

              </article>
            `;
          }
        )
        .join("");
  }


  // ==========================================
 // COMMANDES
  // ==========================================

  function renderOrders() {

    const body =
      byId("ordersTable");


    if (!body) {
      return;
    }


    body.innerHTML =
      orders
        .map(
          function (order) {

            return `
              <tr>

                <td>
                  <b>
                    ${order[0]}
                  </b>
                </td>

                <td>
                  ${order[1]}
                </td>

                <td>
                  ${money(order[2])}
                </td>

                <td>

                  <span
                    class="status ${
                      order[3] !==
                      "Payée"
                        ? "wait"
                        : ""
                    }"
                  >
                    ${order[3]}
                  </span>

                </td>

              </tr>
            `;
          }
        )
        .join("");


    const recent =
      byId("recentOrders");


    if (recent) {

      recent.innerHTML = `
        <div class="table-wrap">

          <table>

            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              ${body.innerHTML}
            </tbody>

          </table>

        </div>
      `;
    }
  }


  //=========================================
  // CHAT
  // ==========================================

  function renderChats() {

    const users =
      byId("chatUsers");

    const title =
      byId("chatTitle");

    const messages =
      byId("messages");


    if (
      !users ||
      !title ||
      !messages
    ) {
      return;
    }


    users.innerHTML =
      chats
        .map(
          function (chat, index) {

            const last =
              chat.messages[
                chat.messages.length -
                1
              ][1];


            return `
              <button
                class="chat-user ${
                  index ===
                  selectedChat
                    ? "active"
                    : ""
                }"
                data-chat="${index}"
              >

                <b>
                  ${chat.name}
                </b>

                <br>

                <small>
                  ${last}
                </small>

              </button>
            `;
          }
        )
        .join("");


    const activeChat =
      chats[selectedChat];


    title.textContent =
      activeChat.name;


    messages.innerHTML =
      activeChat.messages
        .map(
          function (message) {

            return `
              <div
                class="bubble ${message[0]}"
              >
                ${message[1]}
              </div>
            `;
          }
        )
        .join("");


    messages.scrollTop =
      messages.scrollHeight;
  }


  // ==========================================
  // GRAPHIQUES
  // ==========================================

  function drawChart(
    id,
    values,
    labels
  ) {

    const element =
      byId(id);


    if (!element) {
      return;
    }


    const max =
      Math.max.apply(
        null,
        values
      );


    element.innerHTML =
      values
        .map(
          function (
            value,
            index
          ) {

            const height =
              Math.max(
                12,
                (
                  value /
                  max
                ) *
                  90
              );


            return `
              <div
                class="bar"
                style="height:${height}%"
              >
                <span>
                  ${labels[index]}
                </span>
              </div>
            `;
          }
        )
        .join("");
  }


  //==========================================
  // PORTEFEUILLE
  //=======================================

  function updateWallet() {

    const balanceElement =
      byId("balance");

    const walletBalance =
      byId("walletBalance");


    if (balanceElement) {

      balanceElement.textContent =
        money(balance);
    }


    if (walletBalance) {

      walletBalance.textContent =
        money(balance);
    }
  }


  // ==========================================
  // MONCASH SANDBOX
  //=========================================

  function openMonCashTestPayment() {

    /*
     * Cette URL ouvre actuellement
     * le paiement MonCash Sandbox
     * de 10 HTG déjà validé.
     *
     * Aucun argent n'est ajouté
     * automatiquement au portefeuille.
     */

    const url =
      API_URL +
      "/moncash/test-payment";


    toast(
      "Ouverture de MonCash Sandbox..."
    );


    setTimeout(
      function () {

        window.location.href =
          url;

      },
      500
    );
  }


  function monCashWithdrawalUnavailable() {

    /*
     * IMPORTANT :
     *
     * Ne jamais soustraire le solde
     * simplement dans JavaScript.
     *
     * Le retrait doit être confirmé
     * par le backend et MonCash.
     */

    toast(
      "Retrait MonCash pas encore activé."
    );
  }


  // ==========================================
  // INITIALISATION
  //========================================

  document.addEventListener(
    "DOMContentLoaded",
    function () {


      //  --------------------------------------
      // DEVISE
      //--––------------------------------------

      const currencySelect =
        byId("currency");


      if (currencySelect) {

        currencySelect.value =
          currency;


        currencySelect
          .addEventListener(
            "change",
            function () {

              currency =
                currencySelect.value;


              localStorage.setItem(
                "mystroCurrency",
                currency
              );


              renderProducts();

              renderClients();

              renderOrders();

              updateWallet();


              toast(
                "Devise changée"
              );
            }
          );
      }


      // --------------------------------------
      // MENU MOBILE
      //--------------------------------------

      const menuBtn =
        byId("menuBtn");


      if (menuBtn) {

        menuBtn
          .addEventListener(
            "click",
            function () {

              const sidebar =
                byId(
                  "sidebar"
                );


              if (sidebar) {

                sidebar.classList.toggle(
                  "open"
                );
              }
            }
          );
      }


      //--------------------------------------
      // CLICS GÉNÉRAUX
      //--------------------------------------

      document.addEventListener(
        "click",
        function (event) {

          const target =
            event.target;


          const pageButton =
            target.closest(
              "[data-page]"
            );


          if (pageButton) {

            showPage(
              pageButton
                .dataset.page
            );
          }


          const goButton =
            target.closest(
              "[data-go]"
            );


          if (goButton) {

            showPage(
              goButton.dataset.go
            );
          }


          const categoryButton =
            target.closest(
              "[data-category]"
            );


          if (categoryButton) {

            showPage(
              "products"
            );


            const categoryFilter =
              byId(
                "categoryFilter"
              );


            if (
              categoryFilter
            ) {

              categoryFilter.value =
                categoryButton
                  .dataset
                  .category;
            }


            renderProducts();
          }


          const addButton =
            target.closest(
              ".add-cart"
            );


          if (addButton) {

            toast(
              addButton
                .dataset.name +
              " ajouté au panier"
            );
          }


          const chatButton =
            target.closest(
              "[data-chat]"
            );


          if (chatButton) {

            selectedChat =
              Number(
                chatButton
                  .dataset.chat
              );


            renderChats();
          }
        }
      );


      //--------------------------------------
      // RECHERCHE PRODUITS
      // --------------------------------------

      const productSearch =
        byId(
          "productSearch"
        );


      if (productSearch) {

        productSearch
          .addEventListener(
            "input",
            renderProducts
          );
      }


      const categoryFilter =
        byId(
          "categoryFilter"
        );


      if (categoryFilter) {

        categoryFilter
          .addEventListener(
            "change",
            renderProducts
          );
      }


      const clientSearch =
        byId(
          "clientSearch"
        );


      if (clientSearch) {

        clientSearch
          .addEventListener(
            "input",
            renderClients
          );
      }


      // --------------------------------------
      // PUBLIER UN PRODUIT
      // --------------------------------------

      const sellForm =
        byId("sellForm");


      if (sellForm) {

        sellForm
          .addEventListener(
            "submit",
            function (event) {

              event.preventDefault();


              const name =
                byId(
                  "sellName"
                )
                  ?.value
                  .trim();


              const price =
                Number(
                  byId(
                    "sellPrice"
                  )
                    ?.value
                );


              const category =
                byId(
                  "sellCategory"
                )
                  ?.value;


              if (
                !name ||
                !Number.isFinite(
                  price
                ) ||
                price <= 0
              ) {

                toast(
                  "Vérifiez le nom et le prix."
                );

                return;
              }


              products.unshift({
                name: name,
                category:
                  category,
                price:
                  price,
                icon:
                  "📦"
              });


              sellForm.reset();


              const stock =
                byId(
                  "sellStock"
                );


              if (stock) {

                stock.value =
                  1;
              }


              renderProducts();


              toast(
                "Produit publié ✅"
              );


              showPage(
                "products"
              );
            }
          );
      }


      // ======================================
      // DÉPÔT MONCASH
      //======================================

      const deposit100 =
        byId(
          "deposit100"
        );


      if (deposit100) {

        deposit100
          .addEventListener(
            "click",
            openMonCashTestPayment
          );
      }


      /*
       * Compatibilité avec les versions
       * de Mystro-Shop utilisant
       * id="depositBtn"
       */

      const depositBtn =
        byId(
          "depositBtn"
        );


      if (depositBtn) {

        depositBtn
          .addEventListener(
            "click",
            openMonCashTestPayment
          );
      }


      // ======================================
      // RETRAIT MONCASH
      //======================================

      const withdraw100 =
        byId(
          "withdraw100"
        );


      if (withdraw100) {

        withdraw100
          .addEventListener(
            "click",
            monCashWithdrawalUnavailable
          );
      }


      const withdrawBtn =
        byId(
          "withdrawBtn"
        );


      if (withdrawBtn) {

        withdrawBtn
          .addEventListener(
            "click",
            monCashWithdrawalUnavailable
          );
      }


      // --------------------------------------
      // CHAT
      //--------------------------------------

      const chatForm =
        byId("chatForm");


      if (chatForm) {

        chatForm
          .addEventListener(
            "submit",
            function (event) {

              event.preventDefault();


              const input =
                byId(
                  "chatInput"
                );


              if (!input) {
                return;
              }


              const text =
                input.value
                  .trim();


              if (!text) {
                return;
              }


              chats[
                selectedChat
              ]
                .messages
                .push([
                  "me",
                  text
                ]);


              input.value =
                "";


              renderChats();
            }
          );
      }


      // --------------------------------------
      // RECHERCHE GLOBALE
      // --------------------------------------
      const globalSearch =
        byId(
          "globalSearch"
        );


      if (globalSearch) {

        globalSearch
          .addEventListener(
            "keydown",
            function (event) {

              if (
                event.key ===
                "Enter"
              ) {

                showPage(
                  "products"
                );


                const search =
                  byId(
                    "productSearch"
                  );


                if (search) {

                  search.value =
                    globalSearch
                      .value;
                }


                renderProducts();
              }
            }
          );
      }


      // --------------------------------------
      // AFFICHAGE INITIAL
      //
    --------------------------------------

      renderProducts();

      renderClients();

      renderOrders();

      renderChats();

      updateWallet();


      drawChart(
        "revenueChart",
        [
          6200,
          7200,
          6900,
          8400,
          9300,
          10800,
          12480
        ],
        [
          "Fév",
          "Mar",
          "Avr",
          "Mai",
          "Juin",
          "Juil",
          "Aoû"
        ]
      );

    }
  );

}());

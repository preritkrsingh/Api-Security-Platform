/**
 * ShopNex - India & Global Enterprise E-Commerce Storefront
 * Advanced Controller: Amazon & Flipkart UI/UX, Authentication, Carousel, Wishlist, 1-Click Buy Now
 */

(function () {
  'use strict';

  const CATEGORY_ICONS = {
    'Computing': '💻',
    'Displays': '🖥️',
    'Audio': '🎧',
    'Keyboards': '⌨️',
    'Wearables': '⌚',
    'Accessories': '🔌',
    'Developer Gear': '🛠️',
    'Electronics': '⚡'
  };

  const state = {
    allProducts: [],
    filteredProducts: [],
    activeCategory: 'all',
    searchQuery: '',
    minRating: 0,
    minDiscount: 0,
    maxPrice: 2500,
    stockFilter: 'all',
    sortBy: 'featured',
    
    // Auth State
    currentUser: null,
    
    // Wishlist State (Array of product IDs)
    wishlist: [],
    
    // Carousel State
    currentSlide: 0,
    carouselTimer: null,
    
    // 1-Click Buy Now Item
    buyNowProduct: null
  };

  const elements = {};

  function initDOMElements() {
    // Navigation & Toolbar
    elements.navbar = document.getElementById('navbar');
    elements.navLocationBtn = document.getElementById('nav-location-btn');
    elements.locDeliverTo = document.getElementById('loc-deliver-to');
    elements.locCity = document.getElementById('loc-city');
    elements.searchCatSelect = document.getElementById('search-cat-select');
    elements.searchInput = document.getElementById('search-input');
    elements.searchSubmitBtn = document.getElementById('search-submit-btn');
    elements.apiStatusPill = document.getElementById('api-status-pill');

    // Auth & Account
    elements.authTriggerBtn = document.getElementById('auth-trigger-btn');
    elements.navUserGreeting = document.getElementById('nav-user-greeting');
    elements.navUserAccountLbl = document.getElementById('nav-user-account-lbl');
    elements.accountMenuDropdown = document.getElementById('account-menu-dropdown');
    elements.menuLoggedOutHeader = document.getElementById('menu-logged-out-header');
    elements.menuLoggedInHeader = document.getElementById('menu-logged-in-header');
    elements.menuDisplayName = document.getElementById('menu-display-name');
    elements.menuDisplayEmail = document.getElementById('menu-display-email');
    elements.btnMenuSignin = document.getElementById('btn-menu-signin');
    elements.menuRegisterLink = document.getElementById('menu-register-link');
    elements.menuLinkWishlist = document.getElementById('menu-link-wishlist');
    elements.menuWishlistCount = document.getElementById('menu-wishlist-count');
    elements.menuLinkOrders = document.getElementById('menu-link-orders');
    elements.menuLinkProfile = document.getElementById('menu-link-profile');
    elements.menuLinkAddProduct = document.getElementById('menu-link-add-product');
    elements.menuBtnSignout = document.getElementById('menu-btn-signout');

    // Orders & Wishlist & Cart Nav Buttons
    elements.ordersToggleBtn = document.getElementById('orders-toggle-btn');
    elements.wishlistToggleBtn = document.getElementById('wishlist-toggle-btn');
    elements.wishlistCount = document.getElementById('wishlist-count');
    elements.cartToggleBtn = document.getElementById('cart-toggle-btn');
    elements.cartCount = document.getElementById('cart-count');
    elements.cartNavTotal = document.getElementById('cart-nav-total');

    // Mega Subnav
    elements.megaDrawerTrigger = document.getElementById('mega-drawer-trigger');

    // Hero Carousel
    elements.carouselTrack = document.getElementById('carousel-track');
    elements.carouselSlides = document.querySelectorAll('.carousel-slide');
    elements.carouselPrev = document.getElementById('carousel-prev');
    elements.carouselNext = document.getElementById('carousel-next');
    elements.carouselDots = document.querySelectorAll('.carousel-dots .dot');

    // Quad Cards
    elements.btnQuickAddDeal = document.getElementById('btn-quick-add-deal');
    elements.linkExploreAllCat = document.getElementById('link-explore-all-cat');
    elements.quadBoxLoggedOut = document.getElementById('quad-box-logged-out');
    elements.quadBoxLoggedIn = document.getElementById('quad-box-logged-in');
    elements.btnQuadSignin = document.getElementById('btn-quad-signin');
    elements.quadWelcomeTitle = document.getElementById('quad-welcome-title');
    elements.quadWelcomeSub = document.getElementById('quad-welcome-sub');
    elements.quadBtnMyOrders = document.getElementById('quad-btn-my-orders');
    elements.quadBtnMyWishlist = document.getElementById('quad-btn-my-wishlist');

    // Storefront Sidebar
    elements.sidebarCategoryList = document.getElementById('sidebar-category-list');
    elements.btnClearCategory = document.getElementById('btn-clear-category');
    elements.priceSlider = document.getElementById('price-slider');
    elements.priceSliderLabel = document.getElementById('price-slider-label');
    elements.btnResetAllFilters = document.getElementById('btn-reset-all-filters');

    // Storefront Main
    elements.catalogTitle = document.getElementById('catalog-title');
    elements.productCountBadge = document.getElementById('product-count-badge');
    elements.sortSelect = document.getElementById('sort-select');
    elements.activeFiltersBar = document.getElementById('active-filters-bar');
    elements.productsGrid = document.getElementById('products-grid');

    // Auth Modal
    elements.authModal = document.getElementById('auth-modal');
    elements.authModalClose = document.getElementById('auth-modal-close');
    elements.tabBtnSignin = document.getElementById('tab-btn-signin');
    elements.tabBtnRegister = document.getElementById('tab-btn-register');
    elements.paneSignin = document.getElementById('pane-signin');
    elements.paneRegister = document.getElementById('pane-register');
    elements.formSignin = document.getElementById('form-signin');
    elements.formRegister = document.getElementById('form-register');

    // Mega Drawer
    elements.megaDrawerOverlay = document.getElementById('mega-drawer-overlay');
    elements.megaDrawerClose = document.getElementById('mega-drawer-close');
    elements.megaGreetingTitle = document.getElementById('mega-greeting-title');
    elements.megaGreetingSub = document.getElementById('mega-greeting-sub');
    elements.megaLinkSignin = document.getElementById('mega-link-signin');
    elements.megaLinkSignout = document.getElementById('mega-link-signout');

    // Wishlist Drawer
    elements.wishlistDrawerOverlay = document.getElementById('wishlist-drawer-overlay');
    elements.wishlistDrawerClose = document.getElementById('wishlist-drawer-close');
    elements.wishlistItemsContainer = document.getElementById('wishlist-items-container');
    elements.wishlistItemsSummary = document.getElementById('wishlist-items-summary');

    // 1-Click Buy Now Modal
    elements.buyNowModal = document.getElementById('buy-now-modal');
    elements.buyNowClose = document.getElementById('buy-now-close');
    elements.buyNowContent = document.getElementById('buy-now-content');

    // Cart Drawer
    elements.cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
    elements.cartDrawerClose = document.getElementById('cart-drawer-close');
    elements.cartItemsContainer = document.getElementById('cart-items-container');
    elements.cartItemsSummary = document.getElementById('cart-items-summary');
    elements.cartSubtotalVal = document.getElementById('cart-subtotal-val');
    elements.cartTotalAmount = document.getElementById('cart-total-amount');
    elements.customerSelect = document.getElementById('customer-select');
    elements.checkoutBtn = document.getElementById('checkout-btn');

    // Orders Drawer
    elements.ordersDrawerOverlay = document.getElementById('orders-drawer-overlay');
    elements.ordersDrawerClose = document.getElementById('orders-drawer-close');
    elements.ordersListContainer = document.getElementById('orders-list-container');

    // Quick View Modal
    elements.quickViewModal = document.getElementById('quick-view-modal');
    elements.quickViewClose = document.getElementById('quick-view-close');
    elements.qvTitle = document.getElementById('qv-title');
    elements.quickViewContent = document.getElementById('quick-view-content');

    // Add Product Modal
    elements.addProductModal = document.getElementById('add-product-modal');
    elements.addProductClose = document.getElementById('add-product-close');
    elements.addProductForm = document.getElementById('add-product-form');

    // Order Success Modal
    elements.orderSuccessModal = document.getElementById('order-success-modal');
    elements.orderSuccessClose = document.getElementById('order-success-close');
    elements.orderSuccessDetails = document.getElementById('order-success-details');

    // Ticker & Back to Top
    elements.tickerTimerVal = document.getElementById('ticker-timer-val');
    elements.btnBackToTop = document.getElementById('btn-back-to-top');

    // Toast Container
    elements.toastContainer = document.getElementById('toast-container');
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================================================
  // AUTHENTICATION SUBSYSTEM (Amazon / Flipkart Style)
  // ==========================================================================
  function initAuthState() {
    // Check localStorage for logged-in user
    try {
      const saved = localStorage.getItem('shopnex_auth_user');
      if (saved) {
        state.currentUser = JSON.parse(saved);
      } else {
        // Default to Demo Customer 1 (Alice Vance) for an instant rich experience
        state.currentUser = {
          id: 1,
          name: 'Alice Vance',
          email: 'alice.vance@example.com',
          phone: '+1-555-0101',
          address: '124 Market Street, Suite 400, Austin, TX 78701',
          token: 'snx_tk_demo_alice_01'
        };
        localStorage.setItem('shopnex_auth_user', JSON.stringify(state.currentUser));
      }
    } catch (e) {
      state.currentUser = null;
    }

    // Load Wishlist
    try {
      const savedWishlist = localStorage.getItem('shopnex_wishlist');
      if (savedWishlist) {
        state.wishlist = JSON.parse(savedWishlist);
      }
    } catch (e) {
      state.wishlist = [];
    }

    updateAuthUI();
    updateWishlistUI();
  }

  function updateAuthUI() {
    const user = state.currentUser;

    if (user) {
      // Navbar greeting
      const firstName = user.name.split(' ')[0];
      if (elements.navUserGreeting) elements.navUserGreeting.textContent = `Hello, ${firstName}`;
      if (elements.navUserAccountLbl) elements.navUserAccountLbl.innerHTML = `Account &amp; Lists <span class="arrow-down">▾</span>`;
      
      // Delivery location
      if (elements.locDeliverTo) elements.locDeliverTo.textContent = `Deliver to ${firstName}`;
      if (elements.locCity) {
        const cityPart = user.address ? user.address.split(',')[0].trim() : 'Austin 78701';
        elements.locCity.textContent = `${cityPart} ▼`;
      }

      // Dropdown menu state
      if (elements.menuLoggedOutHeader) elements.menuLoggedOutHeader.style.display = 'none';
      if (elements.menuLoggedInHeader) elements.menuLoggedInHeader.style.display = 'block';
      if (elements.menuDisplayName) elements.menuDisplayName.textContent = user.name;
      if (elements.menuDisplayEmail) elements.menuDisplayEmail.textContent = user.email;
      if (elements.menuBtnSignout) elements.menuBtnSignout.style.display = 'block';

      // Quad card state
      if (elements.quadBoxLoggedOut) elements.quadBoxLoggedOut.style.display = 'none';
      if (elements.quadBoxLoggedIn) elements.quadBoxLoggedIn.style.display = 'block';
      if (elements.quadWelcomeTitle) elements.quadWelcomeTitle.textContent = `Welcome back, ${firstName}!`;
      if (elements.quadWelcomeSub) elements.quadWelcomeSub.textContent = `Deliver to ${user.address || 'Austin 78701'} • Prime Member`;

      // Mega drawer header
      if (elements.megaGreetingTitle) elements.megaGreetingTitle.textContent = `Hello, ${user.name}`;
      if (elements.megaGreetingSub) elements.megaGreetingSub.textContent = 'ShopNex Prime Member';
      if (elements.megaLinkSignin) elements.megaLinkSignin.style.display = 'none';
      if (elements.megaLinkSignout) elements.megaLinkSignout.style.display = 'block';

      // Customer select in Cart
      if (elements.customerSelect) {
        let optExists = false;
        for (let opt of elements.customerSelect.options) {
          if (parseInt(opt.value, 10) === user.id) {
            optExists = true;
            opt.selected = true;
            break;
          }
        }
        if (!optExists) {
          const newOpt = document.createElement('option');
          newOpt.value = user.id;
          newOpt.textContent = `${user.name} (${user.email})`;
          newOpt.selected = true;
          elements.customerSelect.appendChild(newOpt);
        }
      }

    } else {
      // Guest state
      if (elements.navUserGreeting) elements.navUserGreeting.textContent = 'Hello, Sign In';
      if (elements.navUserAccountLbl) elements.navUserAccountLbl.innerHTML = `Account &amp; Lists <span class="arrow-down">▾</span>`;
      if (elements.locDeliverTo) elements.locDeliverTo.textContent = 'Deliver to Guest';
      if (elements.locCity) elements.locCity.textContent = 'Select address ▼';

      if (elements.menuLoggedOutHeader) elements.menuLoggedOutHeader.style.display = 'block';
      if (elements.menuLoggedInHeader) elements.menuLoggedInHeader.style.display = 'none';
      if (elements.menuBtnSignout) elements.menuBtnSignout.style.display = 'none';

      if (elements.quadBoxLoggedOut) elements.quadBoxLoggedOut.style.display = 'block';
      if (elements.quadBoxLoggedIn) elements.quadBoxLoggedIn.style.display = 'none';

      if (elements.megaGreetingTitle) elements.megaGreetingTitle.textContent = 'Hello, Sign In';
      if (elements.megaGreetingSub) elements.megaGreetingSub.textContent = 'ShopNex Prime Member';
      if (elements.megaLinkSignin) elements.megaLinkSignin.style.display = 'block';
      if (elements.megaLinkSignout) elements.megaLinkSignout.style.display = 'none';
    }
  }

  function openAuthModal(defaultTab = 'signin') {
    switchAuthTab(defaultTab);
    if (elements.authModal) elements.authModal.classList.add('active');
  }

  function closeAuthModal() {
    if (elements.authModal) elements.authModal.classList.remove('active');
  }

  function switchAuthTab(tab) {
    if (tab === 'signin') {
      if (elements.tabBtnSignin) elements.tabBtnSignin.classList.add('active');
      if (elements.tabBtnRegister) elements.tabBtnRegister.classList.remove('active');
      if (elements.paneSignin) elements.paneSignin.classList.add('active');
      if (elements.paneRegister) elements.paneRegister.classList.remove('active');
    } else {
      if (elements.tabBtnSignin) elements.tabBtnSignin.classList.remove('active');
      if (elements.tabBtnRegister) elements.tabBtnRegister.classList.add('active');
      if (elements.paneSignin) elements.paneSignin.classList.remove('active');
      if (elements.paneRegister) elements.paneRegister.classList.add('active');
    }
  }

  async function handleLogin(email, password) {
    try {
      const res = await Api.login(email, password);
      state.currentUser = {
        ...res.customer,
        token: res.token
      };
      localStorage.setItem('shopnex_auth_user', JSON.stringify(state.currentUser));
      updateAuthUI();
      closeAuthModal();
      showToast(`Welcome back, ${state.currentUser.name}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleRegister(userData) {
    try {
      const res = await Api.register(userData);
      state.currentUser = {
        ...res.customer,
        token: res.token
      };
      localStorage.setItem('shopnex_auth_user', JSON.stringify(state.currentUser));
      updateAuthUI();
      closeAuthModal();
      showToast(`Account created! Welcome to ShopNex, ${state.currentUser.name}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleSignOut() {
    state.currentUser = null;
    localStorage.removeItem('shopnex_auth_user');
    updateAuthUI();
    showToast('Signed out of ShopNex account.', 'info');
  }

  // ==========================================================================
  // WISHLIST SUBSYSTEM (Flipkart Style)
  // ==========================================================================
  function toggleWishlist(productId) {
    const idx = state.wishlist.indexOf(productId);
    const prod = state.allProducts.find(p => p.id === productId);
    const prodName = prod ? prod.name : `Item #${productId}`;

    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast(`Removed "${prodName}" from your Wishlist.`, 'info');
    } else {
      state.wishlist.push(productId);
      showToast(`❤️ Added "${prodName}" to your Wishlist!`, 'success');
    }

    localStorage.setItem('shopnex_wishlist', JSON.stringify(state.wishlist));
    updateWishlistUI();
    renderProducts();
  }

  function updateWishlistUI() {
    const count = state.wishlist.length;
    if (elements.wishlistCount) elements.wishlistCount.textContent = count;
    if (elements.menuWishlistCount) elements.menuWishlistCount.textContent = count;
    if (elements.wishlistItemsSummary) elements.wishlistItemsSummary.textContent = `${count} ${count === 1 ? 'item' : 'items'} saved`;
  }

  function openWishlistDrawer() {
    if (elements.wishlistDrawerOverlay) elements.wishlistDrawerOverlay.classList.add('active');
    renderWishlistDrawerItems();
  }

  function closeWishlistDrawer() {
    if (elements.wishlistDrawerOverlay) elements.wishlistDrawerOverlay.classList.remove('active');
  }

  function renderWishlistDrawerItems() {
    if (!elements.wishlistItemsContainer) return;

    if (state.wishlist.length === 0) {
      elements.wishlistItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div style="font-size: 36px; margin-bottom: 8px;">❤️</div>
          <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Your Wishlist is Empty</div>
          <div style="font-size: 13px; color: var(--text-muted);">Click the heart icon on any product card to save it here.</div>
        </div>
      `;
      return;
    }

    const savedProducts = state.allProducts.filter(p => state.wishlist.includes(p.id));

    elements.wishlistItemsContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${savedProducts.map(p => {
          const icon = CATEGORY_ICONS[p.category] || '📦';
          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 30px; width: 44px; height: 44px; background: rgba(255,255,255,0.03); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                ${icon}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(p.name)}
                </div>
                <div style="font-size: 13px; color: var(--amazon-amber); font-weight: 800; margin-top: 2px;">
                  $${Number(p.price).toFixed(2)}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="btn-amazon-primary" style="padding: 4px 10px; font-size: 11px;" data-action="wl-move-cart" data-id="${p.id}">
                  + Cart
                </button>
                <button class="btn-text-small" style="color: #f87171; text-align: center;" data-action="wl-remove" data-id="${p.id}">
                  Remove
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Wishlist drawer button handlers
    elements.wishlistItemsContainer.querySelectorAll('button[data-action="wl-move-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const prod = state.allProducts.find(p => p.id === id);
        if (prod) {
          Cart.addItem(prod, 1);
          toggleWishlist(id);
          showToast(`Moved "${prod.name}" to cart.`, 'success');
          renderWishlistDrawerItems();
        }
      });
    });

    elements.wishlistItemsContainer.querySelectorAll('button[data-action="wl-remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        toggleWishlist(id);
        renderWishlistDrawerItems();
      });
    });
  }

  // ==========================================================================
  // 1-CLICK INSTANT "BUY NOW" MODAL (Amazon Style)
  // ==========================================================================
  function openBuyNowModal(productId) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product) return;

    state.buyNowProduct = product;
    const user = state.currentUser || {
      id: 1,
      name: 'Alice Vance',
      email: 'alice.vance@example.com',
      address: '124 Market Street, Austin, TX 78701'
    };

    if (elements.buyNowContent) {
      elements.buyNowContent.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 38px; width: 56px; height: 56px; background: rgba(255,255,255,0.04); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              ${CATEGORY_ICONS[product.category] || '📦'}
            </div>
            <div>
              <h4 style="font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 4px;">${escapeHtml(product.name)}</h4>
              <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(product.category)} &bull; SKU: SNX-${String(product.id).padStart(5, '0')}</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--amazon-amber); margin-top: 4px;">$${Number(product.price).toFixed(2)}</div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; font-size: 12.5px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Deliver To:</span>
              <strong style="color: #fff;">${escapeHtml(user.name)} (${escapeHtml(user.address || 'Austin 78701')})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Delivery Speed:</span>
              <span style="color: #34d399; font-weight: 700;">✓ FREE Express Prime (Tomorrow, 11 AM)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Payment Method:</span>
              <span style="color: #94a3b8;">ShopNex 1-Click Pay / Pre-Authorized Visa **** 4012</span>
            </div>
          </div>
        </div>

        <button class="btn-amazon-primary" id="btn-confirm-buy-now" style="width: 100%; padding: 12px; font-size: 14px;">
          Place Your Order and Pay $${Number(product.price).toFixed(2)}
        </button>
        <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 10px;">
          Directly commits Spring Data JPA transaction in PostgreSQL via VEYRION API Gateway.
        </p>
      `;

      const confirmBtn = document.getElementById('btn-confirm-buy-now');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Committing ACID Transaction with VEYRION...';

          try {
            const orderPayload = {
              customerId: user.id,
              items: [{ productId: product.id, quantity: 1 }]
            };
            const order = await Api.createOrder(orderPayload);
            closeBuyNowModal();
            showOrderSuccessModal(order);
            await loadProducts();
          } catch (err) {
            showToast(err.message, 'error');
            confirmBtn.disabled = false;
            confirmBtn.textContent = `Place Your Order and Pay $${Number(product.price).toFixed(2)}`;
          }
        });
      }
    }

    if (elements.buyNowModal) elements.buyNowModal.classList.add('active');
  }

  function closeBuyNowModal() {
    if (elements.buyNowModal) elements.buyNowModal.classList.remove('active');
    state.buyNowProduct = null;
  }

  // ==========================================================================
  // CAROUSEL & TICKER LOGIC
  // ==========================================================================
  function initCarousel() {
    if (!elements.carouselSlides || elements.carouselSlides.length === 0) return;

    function goToSlide(n) {
      elements.carouselSlides.forEach(s => s.classList.remove('active'));
      elements.carouselDots.forEach(d => d.classList.remove('active'));
      state.currentSlide = (n + elements.carouselSlides.length) % elements.carouselSlides.length;
      elements.carouselSlides[state.currentSlide].classList.add('active');
      elements.carouselDots[state.currentSlide].classList.add('active');
    }

    if (elements.carouselPrev) {
      elements.carouselPrev.addEventListener('click', () => {
        clearInterval(state.carouselTimer);
        goToSlide(state.currentSlide - 1);
        startAutoSlide();
      });
    }

    if (elements.carouselNext) {
      elements.carouselNext.addEventListener('click', () => {
        clearInterval(state.carouselTimer);
        goToSlide(state.currentSlide + 1);
        startAutoSlide();
      });
    }

    elements.carouselDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearInterval(state.carouselTimer);
        goToSlide(idx);
        startAutoSlide();
      });
    });

    function startAutoSlide() {
      state.carouselTimer = setInterval(() => {
        goToSlide(state.currentSlide + 1);
      }, 5500);
    }

    startAutoSlide();

    // Carousel CTA buttons
    document.querySelectorAll('.btn-carousel-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dept = e.currentTarget.getAttribute('data-dept');
        if (dept) setCategory(dept);
        const catalogSec = document.getElementById('catalog-section');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initCountdownTimer() {
    if (!elements.tickerTimerVal) return;
    let secondsLeft = 5 * 3600 + 24 * 60 + 18; // 05h : 24m : 18s

    setInterval(() => {
      secondsLeft--;
      if (secondsLeft < 0) secondsLeft = 24 * 3600;

      const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
      const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
      const s = String(secondsLeft % 60).padStart(2, '0');

      elements.tickerTimerVal.textContent = `${h}h : ${m}m : ${s}s`;
    }, 1000);
  }

  // ==========================================================================
  // CATALOG DATA FETCHING & FILTERING
  // ==========================================================================
  async function loadProducts() {
    try {
      const data = await Api.fetchProducts('', '', 0, 100, 'id', 'asc');
      state.allProducts = data.content || [];
      updateCategoryCounts();
      applyFiltersAndRender();
    } catch (err) {
      showToast('Error loading products: ' + err.message, 'error');
      if (elements.productsGrid) {
        elements.productsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 64px 24px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
            <h3 style="color: var(--text-primary); margin-bottom: 8px;">Failed to Reach Backend API</h3>
            <p style="font-size: 14px; max-width: 480px; margin: 0 auto 16px;">${escapeHtml(err.message)}</p>
            <p style="font-size: 12px; color: var(--text-muted);">Ensure ShopNex is running on port 8081 through VEYRION Gateway port 8080.</p>
          </div>
        `;
      }
    }
  }

  function updateCategoryCounts() {
    const counts = { all: state.allProducts.length };
    state.allProducts.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    document.querySelectorAll('.cat-filter-item').forEach(item => {
      const cat = item.getAttribute('data-category');
      const countEl = item.querySelector('.cat-pill-count');
      if (countEl) {
        countEl.textContent = counts[cat] !== undefined ? counts[cat] : 0;
      }
    });
  }

  function applyFiltersAndRender() {
    let result = [...state.allProducts];

    // Category
    if (state.activeCategory && state.activeCategory !== 'all') {
      result = result.filter(p => (p.category || '').toLowerCase() === state.activeCategory.toLowerCase());
    }

    // Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    // Rating
    if (state.minRating > 0) {
      result = result.filter(p => Number(p.rating || 4.8) >= state.minRating);
    }

    // Discount %
    if (state.minDiscount > 0) {
      result = result.filter(p => Number(p.discountPercent || 20) >= state.minDiscount);
    }

    // Max Price
    result = result.filter(p => Number(p.price) <= state.maxPrice);

    // Stock Filter
    if (state.stockFilter === 'instock') {
      result = result.filter(p => p.stockQuantity > 0);
    }

    // Sort
    if (state.sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (state.sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (state.sortBy === 'rating-desc') {
      result.sort((a, b) => Number(b.rating || 4.8) - Number(a.rating || 4.8));
    } else if (state.sortBy === 'discount-desc') {
      result.sort((a, b) => Number(b.discountPercent || 20) - Number(a.discountPercent || 20));
    } else if (state.sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => a.id - b.id);
    }

    state.filteredProducts = result;
    renderProducts();
    renderActiveFilterTags();
  }

  // ==========================================================================
  // PRODUCTS GRID RENDERING (Amazon & Flipkart Style Cards)
  // ==========================================================================
  function renderProducts() {
    if (!elements.productsGrid) return;

    const count = state.filteredProducts.length;
    if (elements.productCountBadge) elements.productCountBadge.textContent = `${count} ${count === 1 ? 'Product' : 'Products'}`;
    if (elements.catalogTitle) {
      if (state.activeCategory === 'all') {
        elements.catalogTitle.textContent = state.searchQuery ? `Results for "${state.searchQuery}"` : 'All Hardware & Developer Equipment';
      } else {
        elements.catalogTitle.textContent = `${state.activeCategory} Hardware`;
      }
    }

    if (count === 0) {
      elements.productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 64px 24px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
          <h3 style="color: var(--text-primary); margin-bottom: 8px;">No Products Found</h3>
          <p style="font-size: 14px; max-width: 440px; margin: 0 auto 16px;">
            No items matched your current criteria. Try adjusting your filters or price range.
          </p>
          <button class="btn-amazon-primary" id="btn-empty-reset" style="max-width: 200px; margin: 0 auto;">
            Reset All Filters
          </button>
        </div>
      `;
      const btnReset = document.getElementById('btn-empty-reset');
      if (btnReset) btnReset.addEventListener('click', resetAllFilters);
      return;
    }

    elements.productsGrid.innerHTML = state.filteredProducts.map(product => {
      const isOutOfStock = product.stockQuantity <= 0;
      const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
      const icon = CATEGORY_ICONS[product.category] || '📦';
      const isWishlisted = state.wishlist.includes(product.id);

      // Amazon/Flipkart Badge
      const badgeRaw = product.badge || 'SHOPNEX ASSURED';
      let badgeClass = 'shopnex-assured';
      if (badgeRaw.includes('BEST')) badgeClass = 'best-seller';
      else if (badgeRaw.includes('AMAZON') || badgeRaw.includes('CHOICE')) badgeClass = 'amazon-choice';
      else if (badgeRaw.includes('DEAL') || badgeRaw.includes('HOT')) badgeClass = 'deal-day';

      const originalPrice = product.originalPrice ? Number(product.originalPrice) : (Number(product.price) * 1.25);
      const discountPercent = product.discountPercent ? product.discountPercent : Math.round((1 - (Number(product.price) / originalPrice)) * 100);
      const savings = originalPrice - Number(product.price);
      const rating = product.rating ? Number(product.rating).toFixed(1) : (4.7 + ((product.id * 7) % 3) * 0.1).toFixed(1);
      const reviews = product.reviewCount || (80 + ((product.id * 23) % 400));

      return `
        <div class="product-card" data-id="${product.id}">
          <div>
            <!-- Top Badge & Wishlist Heart -->
            <div class="card-header-bar">
              <span class="card-badge-pill ${badgeClass}">${escapeHtml(badgeRaw)}</span>
              <button class="btn-card-wishlist ${isWishlisted ? 'active' : ''}" data-action="toggle-wishlist" data-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            <!-- Avatar visual box -->
            <div class="card-avatar-box">
              ${icon}
            </div>

            <!-- Rating Row -->
            <div class="card-rating-row">
              <span class="card-stars">★★★★★</span>
              <span class="card-rating-num">${rating}</span>
              <span class="card-reviews-count">(${reviews.toLocaleString()})</span>
            </div>

            <!-- Product Title -->
            <h3 class="card-title" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
            <p class="card-desc">${escapeHtml(product.description || 'Precision enterprise-grade hardware device.')}</p>

            <!-- Flipkart / Amazon Price Display -->
            <div class="card-pricing-block">
              <div class="pricing-row-main">
                <span class="card-discount-tag">-${discountPercent}%</span>
                <span class="card-deal-price">$${Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="pricing-row-sub">
                <span>M.R.P.: <span class="card-mrp-price">$${originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                <span class="card-save-text">Save $${savings.toFixed(2)}</span>
              </div>
            </div>

            <!-- Prime Delivery & Stock Alert -->
            <div class="delivery-promise">
              <strong>✓ Prime</strong> Delivery by <strong>Tomorrow, 11 AM</strong>
            </div>
            ${isLowStock ? `<div class="stock-urgency">⚡ Only ${product.stockQuantity} left in stock - order soon.</div>` : ''}
            ${isOutOfStock ? `<div class="stock-urgency" style="color: #ef4444;">Sold Out / Currently Unavailable</div>` : ''}
          </div>

          <!-- Dual Amazon & Flipkart Action Buttons -->
          <div class="card-action-row">
            <button class="btn-card-cart" data-action="add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
              Add to Cart
            </button>
            <button class="btn-card-buy-now" data-action="buy-now" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
              Buy Now
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Action Handlers
    elements.productsGrid.querySelectorAll('button[data-action="add-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const prod = state.allProducts.find(p => p.id === id);
        if (prod) {
          Cart.addItem(prod, 1);
          showToast(`Added "${prod.name}" to your Cart.`, 'success');
        }
      });
    });

    elements.productsGrid.querySelectorAll('button[data-action="buy-now"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        openBuyNowModal(id);
      });
    });

    elements.productsGrid.querySelectorAll('button[data-action="toggle-wishlist"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        toggleWishlist(id);
      });
    });
  }

  // ==========================================================================
  // ACTIVE FILTERS BAR
  // ==========================================================================
  function renderActiveFilterTags() {
    if (!elements.activeFiltersBar) return;
    const tags = [];

    if (state.activeCategory !== 'all') {
      tags.push({ label: `Department: ${state.activeCategory}`, onRemove: () => setCategory('all') });
    }
    if (state.searchQuery) {
      tags.push({ label: `Search: "${state.searchQuery}"`, onRemove: () => {
        state.searchQuery = '';
        if (elements.searchInput) elements.searchInput.value = '';
        applyFiltersAndRender();
      }});
    }
    if (state.minRating > 0) {
      tags.push({ label: `${state.minRating}★ & Up`, onRemove: () => {
        state.minRating = 0;
        document.querySelectorAll('.rating-filter-item').forEach(r => r.classList.remove('active'));
        applyFiltersAndRender();
      }});
    }
    if (state.minDiscount > 0) {
      tags.push({ label: `${state.minDiscount}% Off or More`, onRemove: () => {
        state.minDiscount = 0;
        const radio = document.querySelector('input[name="discount-filter"][value="0"]');
        if (radio) radio.checked = true;
        applyFiltersAndRender();
      }});
    }
    if (state.maxPrice < 2500) {
      tags.push({ label: `Max: $${state.maxPrice}`, onRemove: () => {
        state.maxPrice = 2500;
        if (elements.priceSlider) elements.priceSlider.value = 2500;
        if (elements.priceSliderLabel) elements.priceSliderLabel.textContent = '$2,500';
        applyFiltersAndRender();
      }});
    }
    if (state.stockFilter !== 'all') {
      tags.push({ label: 'In Stock Only', onRemove: () => {
        state.stockFilter = 'all';
        const radio = document.querySelector('input[name="stock-filter"][value="all"]');
        if (radio) radio.checked = true;
        applyFiltersAndRender();
      }});
    }

    if (tags.length === 0) {
      elements.activeFiltersBar.style.display = 'none';
      elements.activeFiltersBar.innerHTML = '';
      return;
    }

    elements.activeFiltersBar.style.display = 'flex';
    elements.activeFiltersBar.innerHTML = tags.map((t, idx) => `
      <span class="filter-tag">
        <span>${escapeHtml(t.label)}</span>
        <button class="filter-tag-remove" data-idx="${idx}">&times;</button>
      </span>
    `).join('') + `
      <button class="filter-tag-clear-all" id="btn-clear-tags">Clear All</button>
    `;

    elements.activeFiltersBar.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (tags[idx]) tags[idx].onRemove();
      });
    });

    const clearAll = document.getElementById('btn-clear-tags');
    if (clearAll) clearAll.addEventListener('click', resetAllFilters);
  }

  function setCategory(category) {
    state.activeCategory = category;

    // Sync search category dropdown
    if (elements.searchCatSelect) elements.searchCatSelect.value = category;

    // Sync sidebar
    document.querySelectorAll('.cat-filter-item').forEach(item => {
      if (item.getAttribute('data-category').toLowerCase() === category.toLowerCase()) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    applyFiltersAndRender();
  }

  function resetAllFilters() {
    state.activeCategory = 'all';
    state.searchQuery = '';
    state.minRating = 0;
    state.minDiscount = 0;
    state.maxPrice = 2500;
    state.stockFilter = 'all';
    state.sortBy = 'featured';

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchCatSelect) elements.searchCatSelect.value = 'all';
    if (elements.priceSlider) elements.priceSlider.value = 2500;
    if (elements.priceSliderLabel) elements.priceSliderLabel.textContent = '$2,500';
    if (elements.sortSelect) elements.sortSelect.value = 'featured';

    const radioDisc = document.querySelector('input[name="discount-filter"][value="0"]');
    if (radioDisc) radioDisc.checked = true;

    const radioStock = document.querySelector('input[name="stock-filter"][value="all"]');
    if (radioStock) radioStock.checked = true;

    document.querySelectorAll('.cat-filter-item').forEach(i => {
      if (i.getAttribute('data-category') === 'all') i.classList.add('active');
      else i.classList.remove('active');
    });

    document.querySelectorAll('.rating-filter-item').forEach(r => r.classList.remove('active'));

    applyFiltersAndRender();
    showToast('Filters reset to default.', 'info');
  }

  // ==========================================================================
  // CART DRAWER & CHECKOUT
  // ==========================================================================
  function updateCartUI() {
    const items = Cart.getItems();
    const count = Cart.getTotalCount();
    const total = Cart.getTotalAmount();

    if (elements.cartCount) elements.cartCount.textContent = count;
    if (elements.cartNavTotal) elements.cartNavTotal.textContent = `$${total.toFixed(2)}`;
    if (elements.cartItemsSummary) elements.cartItemsSummary.textContent = `${count} ${count === 1 ? 'item' : 'items'} in cart`;
    if (elements.cartSubtotalVal) elements.cartSubtotalVal.textContent = `$${total.toFixed(2)}`;
    if (elements.cartTotalAmount) elements.cartTotalAmount.textContent = `$${total.toFixed(2)}`;

    if (!elements.cartItemsContainer) return;

    if (items.length === 0) {
      elements.cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div style="font-size: 38px; margin-bottom: 8px;">🛒</div>
          <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Your Cart is Empty</div>
          <div style="font-size: 13px; color: var(--text-muted);">Explore our deals and add items to begin checkout.</div>
        </div>
      `;
      if (elements.checkoutBtn) elements.checkoutBtn.disabled = true;
      return;
    }

    if (elements.checkoutBtn) elements.checkoutBtn.disabled = false;
    elements.cartItemsContainer.innerHTML = `
      <div class="cart-items-list">
        ${items.map(item => `
          <div class="cart-item">
            <div class="cart-item-icon-box">${CATEGORY_ICONS[item.category] || '📦'}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${escapeHtml(item.name)}</div>
              <div class="cart-item-price">$${Number(item.price).toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Quantity handlers
    elements.cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const action = e.currentTarget.getAttribute('data-action');
        const item = items.find(i => i.id === id);
        if (!item) return;

        try {
          if (action === 'increase') {
            Cart.updateQuantity(id, item.quantity + 1);
          } else if (action === 'decrease') {
            Cart.updateQuantity(id, item.quantity - 1);
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }

  function openCartDrawer() {
    if (elements.cartDrawerOverlay) elements.cartDrawerOverlay.classList.add('active');
  }

  function closeCartDrawer() {
    if (elements.cartDrawerOverlay) elements.cartDrawerOverlay.classList.remove('active');
  }

  async function handleCheckout() {
    const items = Cart.getItems();
    if (items.length === 0) return;

    if (elements.checkoutBtn) {
      elements.checkoutBtn.disabled = true;
      elements.checkoutBtn.textContent = 'Processing Transaction with VEYRION...';
    }

    const customerId = state.currentUser ? state.currentUser.id : (elements.customerSelect ? parseInt(elements.customerSelect.value, 10) : 1);
    const orderPayload = {
      customerId: customerId,
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const order = await Api.createOrder(orderPayload);
      Cart.clearCart();
      closeCartDrawer();
      showOrderSuccessModal(order);
      await loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (elements.checkoutBtn) {
        elements.checkoutBtn.disabled = false;
        elements.checkoutBtn.textContent = 'Proceed to Checkout (POST /api/orders)';
      }
    }
  }

  function showOrderSuccessModal(order) {
    if (elements.orderSuccessDetails) {
      elements.orderSuccessDetails.innerHTML = `
        <div style="background: var(--bg-card); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 13px;">Order Confirmation:</span>
            <strong style="color: var(--accent-cyan); font-family: monospace; font-size: 14px;">#${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 13px;">Customer:</span>
            <span>${escapeHtml(order.customerName || 'Customer #' + order.customerId)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 13px;">Status:</span>
            <span style="color: #34d399; font-weight: 700;">${order.status} &bull; Express Prime</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 8px; margin-top: 8px;">
            <span style="color: var(--text-muted); font-size: 13px;">Total Paid:</span>
            <strong style="font-size: 18px; color: #ffffff;">$${Number(order.totalAmount).toFixed(2)}</strong>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
          Your order was securely authenticated and routed through the VEYRION Gateway proxy. PostgreSQL ACID stock has been atomically decremented.
        </p>
      `;
    }
    if (elements.orderSuccessModal) elements.orderSuccessModal.classList.add('active');
    showToast(`Order #${order.id} placed successfully!`, 'success');
  }

  // ==========================================================================
  // ORDERS HISTORY DRAWER
  // ==========================================================================
  async function openOrdersDrawer() {
    if (elements.ordersDrawerOverlay) elements.ordersDrawerOverlay.classList.add('active');
    if (elements.ordersListContainer) {
      elements.ordersListContainer.innerHTML = '<div style="text-align: center; padding: 32px; color: var(--text-muted);">Fetching order records...</div>';
    }

    try {
      const data = await Api.fetchOrders(0, 50);
      const orders = data.content || [];

      if (!elements.ordersListContainer) return;

      if (orders.length === 0) {
        elements.ordersListContainer.innerHTML = `
          <div class="cart-empty-state">
            <div style="font-size: 32px; margin-bottom: 8px;">📜</div>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No Orders Found</div>
            <div style="font-size: 13px; color: var(--text-muted);">Orders placed through the store will be logged here.</div>
          </div>
        `;
        return;
      }

      elements.ordersListContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${orders.map(order => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: var(--accent-cyan); font-size: 14px;">Order #${order.id}</strong>
                <span style="font-size: 11px; background: rgba(16, 185, 129, 0.1); color: #34d399; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${order.status}</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
                Customer: <strong>${escapeHtml(order.customerName || 'Customer #' + order.customerId)}</strong>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                Items: ${(order.items || []).map(i => `${i.quantity}x ${escapeHtml(i.productName)}`).join(', ')}
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 13px;">
                <span style="color: var(--text-muted);">Total:</span>
                <strong style="color: #ffffff;">$${Number(order.totalAmount).toFixed(2)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      if (elements.ordersListContainer) {
        elements.ordersListContainer.innerHTML = `<div style="color: var(--accent-rose); padding: 24px; text-align: center;">Failed to load orders: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function closeOrdersDrawer() {
    if (elements.ordersDrawerOverlay) elements.ordersDrawerOverlay.classList.remove('active');
  }

  // ==========================================================================
  // MEGA DRAWER ("☰ All")
  // ==========================================================================
  function openMegaDrawer() {
    if (elements.megaDrawerOverlay) elements.megaDrawerOverlay.classList.add('active');
  }

  function closeMegaDrawer() {
    if (elements.megaDrawerOverlay) elements.megaDrawerOverlay.classList.remove('active');
  }

  // ==========================================================================
  // EVENT LISTENERS & SETUP
  // ==========================================================================
  function setupEventListeners() {
    // 1. Auth Modal Trigger & Toggles
    if (elements.authTriggerBtn) elements.authTriggerBtn.addEventListener('click', () => openAuthModal('signin'));
    if (elements.btnMenuSignin) elements.btnMenuSignin.addEventListener('click', () => openAuthModal('signin'));
    if (elements.menuRegisterLink) elements.menuRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('register');
    });
    if (elements.btnQuadSignin) elements.btnQuadSignin.addEventListener('click', () => openAuthModal('signin'));
    if (elements.authModalClose) elements.authModalClose.addEventListener('click', closeAuthModal);
    if (elements.tabBtnSignin) elements.tabBtnSignin.addEventListener('click', () => switchAuthTab('signin'));
    if (elements.tabBtnRegister) elements.tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));

    // Auth Form Submits
    if (elements.formSignin) {
      elements.formSignin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value.trim();
        const pass = document.getElementById('signin-password').value;
        handleLogin(email, pass);
      });
    }

    if (elements.formRegister) {
      elements.formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
          name: document.getElementById('reg-name').value.trim(),
          email: document.getElementById('reg-email').value.trim(),
          password: document.getElementById('reg-password').value,
          phone: document.getElementById('reg-phone').value.trim(),
          address: document.getElementById('reg-address').value.trim()
        };
        handleRegister(userData);
      });
    }

    // 1-Click Demo Login Buttons
    document.querySelectorAll('.btn-demo-acc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const email = e.currentTarget.getAttribute('data-demo-email');
        handleLogin(email, 'password123');
      });
    });

    document.querySelectorAll('.demo-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const num = e.currentTarget.getAttribute('data-demo-user');
        const emails = { '1': 'alice.vance@example.com', '2': 'bob.martin@example.com', '3': 'charlie.davis@example.com' };
        if (emails[num]) handleLogin(emails[num], 'password123');
      });
    });

    // Sign Out
    if (elements.menuBtnSignout) elements.menuBtnSignout.addEventListener('click', (e) => {
      e.preventDefault();
      handleSignOut();
    });
    if (elements.megaLinkSignout) elements.megaLinkSignout.addEventListener('click', (e) => {
      e.preventDefault();
      handleSignOut();
      closeMegaDrawer();
    });
    if (elements.megaLinkSignin) elements.megaLinkSignin.addEventListener('click', (e) => {
      e.preventDefault();
      closeMegaDrawer();
      openAuthModal('signin');
    });

    // 2. Mega Search Bar
    if (elements.searchCatSelect) {
      elements.searchCatSelect.addEventListener('change', (e) => {
        setCategory(e.target.value);
      });
    }

    let searchTimeout;
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        state.searchQuery = e.target.value.trim();
        searchTimeout = setTimeout(() => applyFiltersAndRender(), 200);
      });
    }

    if (elements.searchSubmitBtn) {
      elements.searchSubmitBtn.addEventListener('click', () => {
        applyFiltersAndRender();
        const catalogSec = document.getElementById('catalog-section');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // 3. Subnav Bar Department Links
    document.querySelectorAll('.subnav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        const dept = e.currentTarget.getAttribute('data-dept');
        if (dept) setCategory(dept);
      });
    });

    // 4. Mega Drawer ("☰ All")
    if (elements.megaDrawerTrigger) elements.megaDrawerTrigger.addEventListener('click', openMegaDrawer);
    if (elements.megaDrawerClose) elements.megaDrawerClose.addEventListener('click', closeMegaDrawer);
    if (elements.megaDrawerOverlay) {
      elements.megaDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.megaDrawerOverlay) closeMegaDrawer();
      });
    }

    document.querySelectorAll('.mega-item[data-mega-dept]').forEach(item => {
      item.addEventListener('click', (e) => {
        const dept = e.currentTarget.getAttribute('data-mega-dept');
        if (dept) setCategory(dept);
        closeMegaDrawer();
      });
    });

    // 5. Sidebar Category Click
    document.querySelectorAll('.cat-filter-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-category');
        setCategory(cat);
      });
    });

    if (elements.btnClearCategory) {
      elements.btnClearCategory.addEventListener('click', () => setCategory('all'));
    }

    // 6. Rating Filter Items
    document.querySelectorAll('.rating-filter-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.rating-filter-item').forEach(r => r.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.minRating = parseFloat(e.currentTarget.getAttribute('data-min-rating'));
        applyFiltersAndRender();
      });
    });

    // 7. Discount Filter Radios
    document.querySelectorAll('input[name="discount-filter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.minDiscount = parseInt(e.target.value, 10);
        applyFiltersAndRender();
      });
    });

    // 8. Price Slider
    if (elements.priceSlider) {
      elements.priceSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.maxPrice = val;
        if (elements.priceSliderLabel) elements.priceSliderLabel.textContent = `$${val.toLocaleString()}`;
        applyFiltersAndRender();
      });
    }

    // 9. Stock Radios
    document.querySelectorAll('input[name="stock-filter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.stockFilter = e.target.value;
        applyFiltersAndRender();
      });
    });

    // 10. Sort Select
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFiltersAndRender();
      });
    }

    if (elements.btnResetAllFilters) {
      elements.btnResetAllFilters.addEventListener('click', resetAllFilters);
    }

    // 11. Deal of the Day Button in Quad Card
    if (elements.btnQuickAddDeal) {
      elements.btnQuickAddDeal.addEventListener('click', () => {
        const dealItem = state.allProducts.find(p => (p.name || '').includes('Titanium Studio Workstation')) || state.allProducts[0];
        if (dealItem) {
          Cart.addItem(dealItem, 1);
          showToast(`⚡ Added Deal of the Day "${dealItem.name}" to cart!`, 'success');
        }
      });
    }

    // 12. Mini Tile Category Clicks
    document.querySelectorAll('.mini-tile[data-dept]').forEach(tile => {
      tile.addEventListener('click', (e) => {
        const dept = e.currentTarget.getAttribute('data-dept');
        setCategory(dept);
        const sec = document.getElementById('catalog-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // 13. Wishlist Drawer Toggles
    if (elements.wishlistToggleBtn) elements.wishlistToggleBtn.addEventListener('click', openWishlistDrawer);
    if (elements.wishlistDrawerClose) elements.wishlistDrawerClose.addEventListener('click', closeWishlistDrawer);
    if (elements.menuLinkWishlist) elements.menuLinkWishlist.addEventListener('click', (e) => {
      e.preventDefault();
      openWishlistDrawer();
    });
    if (elements.quadBtnMyWishlist) elements.quadBtnMyWishlist.addEventListener('click', openWishlistDrawer);
    if (elements.wishlistDrawerOverlay) {
      elements.wishlistDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.wishlistDrawerOverlay) closeWishlistDrawer();
      });
    }

    // 14. 1-Click Buy Now Modal Close
    if (elements.buyNowClose) elements.buyNowClose.addEventListener('click', closeBuyNowModal);
    if (elements.buyNowModal) {
      elements.buyNowModal.addEventListener('click', (e) => {
        if (e.target === elements.buyNowModal) closeBuyNowModal();
      });
    }

    // 15. Cart Drawer Toggles
    if (elements.cartToggleBtn) elements.cartToggleBtn.addEventListener('click', openCartDrawer);
    if (elements.cartDrawerClose) elements.cartDrawerClose.addEventListener('click', closeCartDrawer);
    if (elements.cartDrawerOverlay) {
      elements.cartDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.cartDrawerOverlay) closeCartDrawer();
      });
    }
    if (elements.checkoutBtn) elements.checkoutBtn.addEventListener('click', handleCheckout);

    // 16. Orders Drawer Toggles
    if (elements.ordersToggleBtn) elements.ordersToggleBtn.addEventListener('click', openOrdersDrawer);
    if (elements.ordersDrawerClose) elements.ordersDrawerClose.addEventListener('click', closeOrdersDrawer);
    if (elements.menuLinkOrders) elements.menuLinkOrders.addEventListener('click', (e) => {
      e.preventDefault();
      openOrdersDrawer();
    });
    if (elements.quadBtnMyOrders) elements.quadBtnMyOrders.addEventListener('click', openOrdersDrawer);
    if (elements.ordersDrawerOverlay) {
      elements.ordersDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.ordersDrawerOverlay) closeOrdersDrawer();
      });
    }

    // 17. Add Product Modal
    if (elements.menuLinkAddProduct) elements.menuLinkAddProduct.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.addProductModal) elements.addProductModal.classList.add('active');
    });
    if (elements.addProductClose) elements.addProductClose.addEventListener('click', () => {
      if (elements.addProductModal) elements.addProductModal.classList.remove('active');
    });
    if (elements.addProductForm) {
      elements.addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const prodData = {
          name: form.name.value.trim(),
          category: form.category.value.trim(),
          price: parseFloat(form.price.value),
          stockQuantity: parseInt(form.stockQuantity.value, 10),
          description: form.description.value.trim()
        };
        try {
          const created = await Api.createProduct(prodData);
          showToast(`Product "${created.name}" created!`, 'success');
          form.reset();
          if (elements.addProductModal) elements.addProductModal.classList.remove('active');
          await loadProducts();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 18. Back to Top
    if (elements.btnBackToTop) {
      elements.btnBackToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 19. Cart Updated Custom Event
    window.addEventListener('shopnex-cart-updated', () => {
      updateCartUI();
    });

    // 20. Escape Key Closes Any Modal/Drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAuthModal();
        closeMegaDrawer();
        closeWishlistDrawer();
        closeBuyNowModal();
        closeCartDrawer();
        closeOrdersDrawer();
        if (elements.addProductModal) elements.addProductModal.classList.remove('active');
        if (elements.orderSuccessModal) elements.orderSuccessModal.classList.remove('active');
      }
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function checkBackendHealth() {
    if (!elements.apiStatusPill) return;
    const health = await Api.checkHealth();
    if (health.status === 'UP') {
      elements.apiStatusPill.innerHTML = `
        <span class="pulse-dot"></span>
        <span>Gateway: Shielded</span>
      `;
    } else {
      elements.apiStatusPill.innerHTML = `
        <span class="pulse-dot" style="background: #f43f5e; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7);"></span>
        <span style="color: #f87171;">Gateway: Offline</span>
      `;
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  async function init() {
    initDOMElements();
    initAuthState();
    setupEventListeners();
    initCarousel();
    initCountdownTimer();
    updateCartUI();
    checkBackendHealth();
    await loadProducts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

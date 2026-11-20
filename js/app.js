/**
 * ============================================================
 * FireTopUp — Core Engine (Pixel-Perfect Matching)
 * ============================================================
 */

(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `${APP_CONFIG.currency || '₹'}${Number(n).toLocaleString('en-IN')}`;

  const PLAYER_KEY = 'ff_player';
  const savePlayer = (p) => {
    try { sessionStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch (_) {}
    try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch (_) {}
  };
  const loadPlayer = () => {
    try {
      const s = sessionStorage.getItem(PLAYER_KEY) || localStorage.getItem(PLAYER_KEY);
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  };
  const clearPlayer = () => {
    try { sessionStorage.removeItem(PLAYER_KEY); localStorage.removeItem(PLAYER_KEY); } catch (_) {}
  };

  const state = {
    player: loadPlayer(),
    currentCat: null,
    categories: []
  };

  let payCtx = null;

  /* ============================================================
     Branding Sync from APP_CONFIG
     ============================================================ */
  function initBranding() {
    if (window.APP_CONFIG && APP_CONFIG.brand) {
      const b = APP_CONFIG.brand;
      if ($('#siteBrandName')) $('#siteBrandName').textContent = b.name;
      if ($('#siteBrandSub')) $('#siteBrandSub').textContent = b.tagline;
      if ($('#footerBrandName')) $('#footerBrandName').textContent = b.name;
      if ($('#footerBrandSub')) $('#footerBrandSub').textContent = b.tagline;
      if ($('#copyBrandName')) $('#copyBrandName').textContent = b.name;
    }
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ============================================================
     Dark / Light Theme Toggle
     ============================================================ */
  function initTheme() {
    const btn = $('#themeToggle');
    if (!btn) return;
    const root = document.documentElement;
    const setIcon = () => {
      btn.textContent = root.classList.contains('dark') ? '☀️' : '🌙';
    };
    setIcon();
    btn.addEventListener('click', () => {
      root.classList.toggle('dark');
      try {
        localStorage.setItem('ff_theme', root.classList.contains('dark') ? 'dark' : 'light');
      } catch (_) {}
      setIcon();
    });
  }

  /* ============================================================
     Header Navigation (Mobile Drawer)
     ============================================================ */
  function initNav() {
    const navToggle = $('#navToggle');
    const mainNav = $('#mainNav');
    if (!navToggle || !mainNav) return;

    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      navToggle.classList.toggle('open');
    });

    $$('.main-nav a').forEach(a => a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
    }));
  }

  /* ============================================================
     Banner Carousel
     ============================================================ */
  function initCarousel() {
    const track = $('#carouselTrack');
    if (!track) return;
    const slides = $$('.slide', track);
    const dotsWrap = $('#carouselDots');
    const total = slides.length;
    let index = 0;
    let timer = null;
    const INTERVAL = 4500;

    dotsWrap.innerHTML = slides.map((_, i) =>
      `<button role="tab" aria-label="Go to slide ${i + 1}"${i === 0 ? ' class="active"' : ''}></button>`
    ).join('');
    const dots = $$('button', dotsWrap);

    function go(i) {
      index = (i + total) % total;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('active', di === index));
    }

    const next = () => go(index + 1);
    const prev = () => go(index - 1);
    const start = () => { stop(); timer = setInterval(next, INTERVAL); };
    const stop = () => { if (timer) clearInterval(timer); };

    $('#carNext')?.addEventListener('click', () => { next(); start(); });
    $('#carPrev')?.addEventListener('click', () => { prev(); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));

    const carousel = $('#home');
    if (carousel) {
      carousel.addEventListener('mouseenter', stop);
      carousel.addEventListener('mouseleave', start);
    }

    // Touch Swipe
    let startX = 0, dx = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      dx = 0;
      stop();
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      dx = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (Math.abs(dx) > 40) {
        if (dx < 0) next();
        else prev();
      }
      start();
    });

    go(0);
    start();
  }

  /* ============================================================
     Modals Management
     ============================================================ */
  function openModal(el) {
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal(el) {
    if (!el) return;
    el.hidden = true;
    document.body.style.overflow = '';
  }

  function initModals() {
    $$('.modal-overlay').forEach(ov =>
      ov.addEventListener('click', (e) => {
        if (e.target === ov) closeModal(ov);
      })
    );
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') $$('.modal-overlay').forEach(closeModal);
    });
  }

  function toast(msg, type = '') {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type}`;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => (t.hidden = true), 300);
    }, 3200);
  }

  /* ============================================================
     UID Verification Flow
     ============================================================ */
  function initUidFlow() {
    const uidForm = $('#uidForm');
    if (!uidForm) return;

    const uidInput = $('#uidInput');
    const uidHint = $('#uidHint');
    const verifyBtn = $('#verifyBtn');
    const modalOverlay = $('#modalOverlay');
    const wrap = $('.input-wrap');

    const setLoading = (on) => {
      verifyBtn.disabled = on;
      $('.btn-label', verifyBtn).textContent = on ? 'Verifying…' : 'Verify UID';
      $('.spinner', verifyBtn).hidden = !on;
    };

    const showWarning = (msg) => {
      wrap.classList.add('invalid');
      uidHint.classList.add('error');
      uidHint.textContent = msg;
    };

    const clearWarning = () => {
      wrap.classList.remove('invalid');
      uidHint.classList.remove('error');
      uidHint.textContent = 'Your UID is shown on your in-game profile.';
    };

    uidInput.addEventListener('input', () => {
      uidInput.value = uidInput.value.replace(/\D/g, '');
      clearWarning();
    });

    uidForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uid = uidInput.value.trim();
      if (!/^\d{6,14}$/.test(uid)) {
        showWarning('Please enter a valid numeric UID (6–14 digits).');
        return;
      }

      setLoading(true);
      clearWarning();
      try {
        const player = await fetchPlayerInfo(uid);
        state.player = player;
        savePlayer(player);
        showPlayerModal(player);
        updateVerifiedBanner();
      } catch (err) {
        showWarning(err.message || 'Could not verify UID.');
      } finally {
        setLoading(false);
      }
    });

    function showPlayerModal(p) {
      $('#pNick').textContent = p.nickname;
      $('#pUid').textContent = p.uid;
      $('#pLevel').textContent = p.level;
      $('#pRegion').textContent = p.region;
      $('#pLikes').textContent = p.likes != null ? Number(p.likes).toLocaleString('en-IN') : '—';
      const rowClan = $('#rowClan');
      if (p.clan) {
        rowClan.hidden = false;
        $('#pClan').textContent = p.clan;
      } else {
        rowClan.hidden = true;
      }

      $('#pSub').innerHTML = p.elitePass
        ? '🎉 Congratulations — <b style="color:var(--brand-2)">Elite Pass ✨</b> holder!'
        : '🎉 Congratulations — your account is ready!';

      openModal(modalOverlay);
      launchConfetti();
    }

    $('#modalClose')?.addEventListener('click', () => closeModal(modalOverlay));
    $('#notMeBtn')?.addEventListener('click', () => {
      closeModal(modalOverlay);
      state.player = null;
      clearPlayer();
      updateVerifiedBanner();
      uidInput.value = '';
      uidInput.focus();
    });

    $('#proceedBtn')?.addEventListener('click', () => {
      closeModal(modalOverlay);
      if (state.player && state.player.uid) {
        window.location.assign('store.html?uid=' + encodeURIComponent(state.player.uid));
      } else {
        window.location.assign('store.html');
      }
    });
  }

  function updateVerifiedBanner() {
    const banner = $('#verifiedPlayerBanner') || $('.verified-bar')?.parentElement?.parentElement;
    if (!banner) return;
    if (state.player) {
      if ($('#vNick')) $('#vNick').textContent = state.player.nickname;
      if ($('#vUid')) $('#vUid').textContent = state.player.uid;
      if ($('#vLevel')) $('#vLevel').textContent = 'Level ' + state.player.level + (state.player.region ? ' (' + state.player.region + ')' : '');
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  }

  function launchConfetti() {
    const box = $('#confetti');
    if (!box) return;
    box.innerHTML = '';
    const colors = ['#ff7a18', '#ff3d3d', '#7b5cff', '#22d3ee', '#22c55e', '#ffd700'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.5 + Math.random() * 1.5 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(c);
    }
  }

  /* Player Lookup API */
  async function fetchPlayerInfo(uid) {
    if (window.APP_CONFIG && APP_CONFIG.api && APP_CONFIG.api.useMock) {
      return mockPlayer(uid);
    }
    try {
      const endpoint = (APP_CONFIG.api.endpoint || 'api/verify.php?uid={UID}').replace('{UID}', encodeURIComponent(uid));
      const res = await fetch(endpoint, {
        headers: APP_CONFIG.api.headers || {}
      });
      if (!res.ok) throw new Error('UID not found');
      const data = await res.json();
      return normalizePlayer(data, uid);
    } catch (_) {
      return mockPlayer(uid);
    }
  }

  function normalizePlayer(data, uid) {
    const d = data.data || data;
    const info = d.basicInfo || d.basicinfo || d.AccountInfo || d.player || d;
    const clan = d.clanBasicInfo || d.clanbasicinfo || d.clan || {};
    const nick = info.nickname || info.name || info.AccountName || info.username;
    if (!nick) return mockPlayer(uid);

    return {
      nickname: String(nick),
      uid: String(info.accountId || info.uid || uid),
      level: info.level != null ? info.level : 45,
      region: info.region || 'IND',
      likes: info.liked || info.likes || 1420,
      clan: clan.clanName || clan.name || null,
      elitePass: Boolean(info.hasElitePass || info.elitePass)
    };
  }

  function mockPlayer(uid) {
    const names = ['ShadowSlayer', 'BooyahKing', 'PhantomX', 'GhostRider', 'NoScopeRaj', 'DesiGamerz', 'ProBunny', 'VortexFF'];
    const regions = ['IND', 'SG', 'BR', 'ID'];
    const seed = [...uid].reduce((a, c) => a + (+c), 0);
    return {
      nickname: names[seed % names.length] + '_' + (seed % 99),
      uid: uid,
      level: 25 + (seed % 55),
      region: regions[seed % regions.length],
      likes: 850 + (seed * 62),
      clan: 'Mummy Team',
      elitePass: seed % 2 === 0
    };
  }

  /* ============================================================
     Store Catalogue & Exact Product Card Rendering
     ============================================================ */
  async function loadCatalogue() {
    const cfg = window.APP_CONFIG || (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : null);
    if (cfg && cfg.catalog && cfg.catalog.length) {
      return cfg.catalog;
    }

    try {
      const res = await fetch('products.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.categories) && data.categories.length) {
          return data.categories;
        }
      }
    } catch (_) {}

    return [];
  }

  async function initStore() {
    const tabsWrap = $('#tabs');
    const grid = $('#productGrid');
    if (!tabsWrap || !grid) return;

    // Check if on dedicated store page
    const isStorePage = window.location.pathname.includes('store');
    if (isStorePage) {
      const urlParams = new URLSearchParams(window.location.search);
      const qUid = urlParams.get('uid');
      if (!state.player && qUid) {
        try {
          state.player = await fetchPlayerInfo(qUid);
          savePlayer(state.player);
        } catch (_) {}
      }
      if (!state.player) {
        window.location.replace('index.html#topup');
        return;
      }
      updateVerifiedBanner();

      $('#changeAccount')?.addEventListener('click', (e) => {
        e.preventDefault();
        clearPlayer();
        state.player = null;
        window.location.assign('index.html#topup');
      });
    }

    const categories = await loadCatalogue();
    state.categories = categories;
    if (!categories.length) return;

    const catMap = {};
    categories.forEach(c => {
      catMap[c.slug] = c.items || [];
    });

    // Render Tabs exactly like original
    tabsWrap.innerHTML = categories.map((c, i) =>
      `<button class="tab ${i === 0 ? 'active' : ''}" data-cat="${c.slug}">` +
      `${c.image ? `<img class="tab-ic" src="${esc(c.image)}" alt="">` : (c.icon || '💎')} ${esc(c.name)}</button>`
    ).join('');

    function renderProducts(slug) {
      const items = catMap[slug] || [];
      grid.innerHTML = items.map((p, i) => {
        const out = p.inStock === false;
        const stockLine = out
          ? `<span class="p-stock out">Out of stock</span>`
          : `<span class="p-stock${(p.stock ?? 0) <= 25 ? ' low' : ''}">${p.stock ?? 100} in stock</span>`;

        const rawTag = typeof p.tag === 'string' ? p.tag.trim() : '';
        const tagInfo = (() => {
          if (!rawTag) return null;
          const k = rawTag.toLowerCase();
          if (k.includes('best')) return { cls: 'best', text: rawTag };
          if (k.includes('hot')) return { cls: 'hot', text: rawTag };
          if (k.includes('new')) return { cls: 'new', text: rawTag };
          if (k.includes('limited')) return { cls: 'limited', text: rawTag };
          return { cls: 'custom', text: rawTag };
        })();

        return `
          <article class="product${out ? ' is-out' : ''}" data-id="${p.id}" style="animation-delay:${i * 60}ms">
            ${out ? '<span class="out-badge">Out of stock</span>' : (tagInfo ? `<span class="tag ${tagInfo.cls}">${esc(tagInfo.text)}</span>` : '')}
            <div class="p-icon">${p.image ? `<img class="p-img" src="${esc(p.image)}" alt="" loading="lazy">` : p.icon}</div>
            <div class="p-amount">${p.amount}</div>
            <div class="p-name">${p.name}</div>
            <div class="p-sub">${p.sub}</div>
            ${stockLine}
            <div class="p-foot">
              <div class="p-price">${money(p.price)}${(p.old || p.oldPrice) ? `<span class="p-old">${money(p.old || p.oldPrice)}</span>` : ''}</div>
              <span class="p-buy">${out ? 'Sold out' : 'Buy →'}</span>
            </div>
          </article>
        `;
      }).join('') || '<p class="muted center">No products in this category yet.</p>';

      $$('.product', grid).forEach(el => el.addEventListener('click', () => {
        const prod = Object.values(catMap).flat().find(x => x.id === el.dataset.id);
        if (!prod || prod.inStock === false) {
          toast('This item is out of stock.', 'err');
          return;
        }
        if (!state.player) {
          toast('Please enter and verify your UID first!', 'err');
          $('#topup')?.scrollIntoView({ behavior: 'smooth' });
          $('#uidInput')?.focus();
          return;
        }
        showPaymentModal(prod, state.player);
      }));
    }

    tabsWrap.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      $$('.tab', tabsWrap).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderProducts(tab.dataset.cat);
    });

    renderProducts(categories[0]?.slug);
  }

  /* ============================================================
     Payment Flow & UPI Deep Links
     ============================================================ */
  function showPaymentModal(product, player) {
    const overlay = $('#payOverlay');
    const amount = Number(product.price) || 0;
    let selectedMethod = 'phonepe';
    openModal(overlay);

    const methods = [
      { id: 'phonepe', name: 'PhonePe', tag: 'Fastest', icon: 'assets/payment/phonepe.svg' },
      { id: 'paytm', name: 'Paytm', tag: '', icon: 'assets/payment/paytm_icon.svg' },
      { id: 'upi', name: 'Other UPI app', tag: '', icon: 'assets/payment/bhim.png' },
      { id: 'qr', name: 'Scan QR Code', tag: 'Works with any UPI app', icon: 'assets/payment/qr.png' },
    ];

    const render = () => {
      $('#payBody').innerHTML = `
        <h3 class="modal-title">Choose payment method</h3>
        <p class="modal-sub">Select an app to continue securely.</p>
        <div class="checkout-summary">
          <div class="cs-row"><span>Account</span><strong>${esc(player.nickname)}</strong></div>
          <div class="cs-row"><span>UID</span><strong>${esc(player.uid)}</strong></div>
          <div class="cs-row"><span>Item</span><strong>${product.image ? '' : esc(product.icon || '💎') + ' '}${esc(product.name)}</strong></div>
          <div class="cs-row total"><span>Total</span><strong>${money(amount)}</strong></div>
        </div>
        <div class="deep-payment-options" role="radiogroup" aria-label="Payment methods">
          ${methods.map((m, i) => `
            <button type="button" class="deep-payment-option${i === 0 ? ' selected' : ''}" data-method="${m.id}" role="radio" aria-checked="${i === 0 ? 'true' : 'false'}">
              <span class="deep-payment-left">
                <span class="deep-payment-icon"><img src="${m.icon}" alt=""></span>
                <span><b>${m.name}</b>${m.tag ? `<small>${m.tag}</small>` : ''}</span>
              </span>
              <span class="deep-payment-radio"></span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-block" id="deepPayBtn">Pay ${money(amount)} →</button>
        <p class="muted center">You will be redirected to your selected payment app.</p>
        <button class="btn btn-text" type="button" id="deepCancelBtn">Cancel</button>
      `;

      $$('.deep-payment-option', $('#payBody')).forEach((btn) => btn.addEventListener('click', () => {
        selectedMethod = btn.dataset.method;
        $$('.deep-payment-option', $('#payBody')).forEach((b) => {
          const active = b === btn;
          b.classList.toggle('selected', active);
          b.setAttribute('aria-checked', active ? 'true' : 'false');
        });
      }));

      $('#deepPayBtn').addEventListener('click', () => launchPaymentDeepLink(selectedMethod, amount, product, player));
      $('#deepCancelBtn').addEventListener('click', closePayment);
      $('#payClose').onclick = closePayment;
    };

    render();
  }

  let pollInterval = null;

  async function launchPaymentDeepLink(method, amount, product, player) {
    $('#payBody').innerHTML = `<div class="pay-loading"><span class="spinner big"></span><p>Creating secure payment order…</p></div>`;

    let orderData = null;
    try {
      const res = await fetch('api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          uid: player.uid,
          nickname: player.nickname,
          callbackUrl: window.location.href
        })
      });
      const resJson = await res.json();
      if (resJson.status === 'success' && resJson.data) {
        orderData = resJson.data;
      }
    } catch (_) {}

    const orderId = orderData?.order_id || ('FF_' + Date.now() + Math.floor(Math.random() * 900 + 100));
    const upiUri = orderData?.upi_uri || `upi://pay?pa=test@upi&pn=FireTopUp&am=${amount.toFixed(2)}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(product.name + ' - UID ' + player.uid)}`;
    const qrImageUrl = orderData?.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiUri)}`;

    if (method === 'qr') {
      showQrPayment(amount, product, player, orderId, upiUri, qrImageUrl);
      return;
    }

    let redirectUrl = upiUri;
    if (method === 'phonepe') {
      const payload = {
        p2pPaymentCheckoutParams: {
          checkoutType: 'COLLECT',
          initialAmount: Math.round(amount * 100),
          note: { type: 'text', message: `${product.name} - UID ${player.uid} - ${orderId}` },
          supportedInstruments: -1,
        },
        contact: { type: 'EXTERNAL_MERCHANT', name: 'FireTopUp', vpa: 'paytmqr123456@paytm' },
      };
      redirectUrl = (orderData?.payment_url && orderData.payment_url.startsWith('http'))
        ? orderData.payment_url
        : `phonepe://native?data=${encodeURIComponent(btoa(JSON.stringify(payload)))}&id=p2ppayment`;
    } else if (method === 'paytm') {
      redirectUrl = (orderData?.payment_url && orderData.payment_url.startsWith('http'))
        ? orderData.payment_url
        : `paytmmp://cash_wallet?pa=paytmqr123456@paytm&pn=FireTopUp&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(product.name + ' - UID ' + player.uid + ' - ' + orderId)}&featuretype=money_transfer`;
    } else if (method === 'upi') {
      redirectUrl = (orderData?.payment_url && orderData.payment_url.startsWith('http'))
        ? orderData.payment_url
        : upiUri;
    }

    window.location.href = redirectUrl;

    setTimeout(() => {
      $('#payBody').innerHTML = `
        <div class="success-ring"><span class="check">↗</span></div>
        <h3 class="modal-title">Payment app opened</h3>
        <p class="modal-sub">Complete the payment in your selected app. Diamonds will be credited to UID <b>${player.uid}</b>.</p>
        <button class="btn btn-primary btn-block" type="button" id="backToMethods">Back to payment options</button>
        <button class="btn btn-text" type="button" id="closeAfterRedirect">Close</button>
      `;
      $('#backToMethods').addEventListener('click', () => showPaymentModal(product, player));
      $('#closeAfterRedirect').addEventListener('click', closePayment);
      startStatusPolling(orderId, player);
    }, 1800);
  }

  function showQrPayment(amount, product, player, orderId, upiUri, qrImageUrl) {
    clearPaymentTimer();
    $('#payBody').innerHTML = `
      <button class="modal-close qr-close" id="qrClose" aria-label="Close">✕</button>
      <h3 class="modal-title">Scan & Pay</h3>
      <p class="modal-sub">Scan this fresh QR using any UPI app.</p>
      <div class="qr-box"><img class="generated-qr" src="${esc(qrImageUrl)}" alt="UPI payment QR" width="280" height="280"></div>
      <div class="pay-amount">${money(amount)}</div>
      <div class="checkout-summary">
        <div class="cs-row"><span>Account</span><strong>${esc(player.nickname)}</strong></div>
        <div class="cs-row"><span>UID</span><strong>${esc(player.uid)}</strong></div>
        <div class="cs-row"><span>Item</span><strong>${esc(product.name)}</strong></div>
      </div>
      <p class="pay-status">QR expires in <span id="qrTimer">6:00</span></p>
      <button class="btn btn-primary btn-block" id="qrBackBtn" type="button">Back to payment methods</button>
    `;

    $('#qrClose').addEventListener('click', () => showPaymentModal(product, player));
    $('#qrBackBtn').addEventListener('click', () => showPaymentModal(product, player));

    startStatusPolling(orderId, player);

    let remaining = 360;
    const tick = () => {
      const timer = $('#qrTimer');
      const m = Math.floor(remaining / 60);
      const s = String(remaining % 60).padStart(2, '0');
      if (timer) timer.textContent = `${m}:${s}`;
      if (remaining <= 0) {
        clearPaymentTimer();
        $('#payBody').innerHTML = `
          <h3 class="modal-title">QR expired</h3>
          <p class="modal-sub">This QR was valid for six minutes.</p>
          <button class="btn btn-primary btn-block" id="qrRetryBtn" type="button">Choose payment method</button>
        `;
        $('#qrRetryBtn').addEventListener('click', () => showPaymentModal(product, player));
        return;
      }
      remaining -= 1;
    };
    tick();
    payCtx = setInterval(tick, 1000);
  }

  function startStatusPolling(orderId, player) {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`api/check-status?order_id=${encodeURIComponent(orderId)}`);
        const json = await res.json();
        if (json.status === 'success' && json.data && json.data.payment_status === 'success') {
          clearPaymentTimer();
          $('#payBody').innerHTML = `
            <div class="success-ring"><span class="check">✓</span></div>
            <h3 class="modal-title">Payment Confirmed!</h3>
            <p class="modal-sub">UTR: <b>${esc(json.data.utr || 'Verified')}</b><br>Diamonds have been credited to UID <b>${esc(player.uid)}</b>.</p>
            <button class="btn btn-primary btn-block" type="button" id="donePaymentBtn">Done</button>
          `;
          $('#donePaymentBtn')?.addEventListener('click', closePayment);
          launchConfetti();
        }
      } catch (_) {}
    }, 3500);
  }

  function clearPaymentTimer() {
    if (payCtx) { clearInterval(payCtx); payCtx = null; }
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  function closePayment() {
    clearPaymentTimer();
    closeModal($('#payOverlay'));
  }

  /* ============================================================
     FAQ Accordion
     ============================================================ */
  function initFaq() {
    $$('.acc-q').forEach(q =>
      q.addEventListener('click', () => {
        const item = q.parentElement;
        const open = item.classList.contains('open');
        $$('.acc-item').forEach(i => {
          i.classList.remove('open');
          $('.acc-a', i).style.maxHeight = null;
        });
        if (!open) {
          item.classList.add('open');
          $('.acc-a', item).style.maxHeight = $('.acc-a', item).scrollHeight + 'px';
        }
      })
    );
  }

  /* ============================================================
     Real-Time Purchase Activity Popups
     ============================================================ */
  function initSalePops() {
    const names = ['Rahul', 'Aman', 'Arjun', 'Karan', 'Rohit', 'Vikram', 'Sahil', 'Aditya', 'Dev', 'Kabir', 'Aryan', 'Rohan', 'Akash', 'Raj', 'Ankit'];
    const states = ['Delhi', 'Maharashtra', 'Uttar Pradesh', 'Karnataka', 'West Bengal', 'Gujarat', 'Rajasthan', 'Punjab', 'Bihar', 'Madhya Pradesh'];
    const rand = (a) => a[Math.floor(Math.random() * a.length)];

    let products = (state.categories || []).flatMap(c => c.items || []);

    const pop = document.createElement('div');
    pop.className = 'sale-pop';
    pop.hidden = true;
    document.body.appendChild(pop);

    const scheduleNext = () => setTimeout(show, 7000);
    function show() {
      const pay = $('#payOverlay');
      if (pay && !pay.hidden) { scheduleNext(); return; }
      if (!products.length) {
        products = (state.categories || []).flatMap(c => c.items || []);
        if (!products.length) { scheduleNext(); return; }
      }
      const p = rand(products);
      const mins = 1 + Math.floor(Math.random() * 8);
      const icon = p.image ? `<img src="${esc(p.image)}" alt="" style="width:28px;height:28px;object-fit:contain;">` : (p.icon || '💎');
      pop.innerHTML = `
        <div class="sp-icon">${icon}</div>
        <div class="sp-body">
          <strong>${rand(names)} <span class="sp-state">from ${rand(states)}</span></strong>
          <span>just bought <b>${esc(p.name)}</b></span>
          <small><i class="sp-dot"></i>${mins} min ago · Verified ✓</small>
        </div>
      `;
      pop.hidden = false;
      requestAnimationFrame(() => pop.classList.add('show'));
      setTimeout(hide, 4000);
    }
    function hide() {
      pop.classList.remove('show');
      setTimeout(() => { pop.hidden = true; }, 400);
      scheduleNext();
    }
    setTimeout(show, 4000);
  }

  /* ============================================================
     Scroll Reveal
     ============================================================ */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    $$('.section-head, .step, .uid-card, .acc-item, .product').forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ============================================================
     Init All Modules
     ============================================================ */
  function init() {
    initBranding();
    initTheme();
    initNav();
    initModals();
    initCarousel();
    initUidFlow();
    initStore();
    initFaq();
    initSalePops();
    initReveal();
    updateVerifiedBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * BaseRocky i18n — full auto ID/EN across UI
 * - data-i18n / data-i18n-placeholder
 * - text-map walk for leftover Indonesian/English strings
 * - setLang triggers re-render of active screens
 */
(function (global) {
  'use strict';

  var dict = {
    loading: { id: 'Memuat…', en: 'Loading…' },
    loading_ellipsis: { id: 'Memuat...', en: 'Loading...' },
    save: { id: 'Simpan', en: 'Save' },
    cancel: { id: 'Batal', en: 'Cancel' },
    continue: { id: 'Lanjutkan', en: 'Continue' },
    back: { id: 'Kembali', en: 'Back' },
    copy: { id: 'Salin', en: 'Copy' },
    success: { id: 'Berhasil', en: 'Success' },
    error: { id: 'Gagal', en: 'Error' },
    done: { id: 'Selesai', en: 'Done' },
    confirm: { id: 'Konfirmasi', en: 'Confirm' },
    search: { id: 'Cari', en: 'Search' },
    search_short: { id: 'Cari', en: 'Search' },
    search_apps: { id: 'Cari aplikasi', en: 'Search apps' },
    all: { id: 'Semua ▾', en: 'All ▾' },
    more: { id: 'Lainnya', en: 'More' },
    close: { id: 'Tutup', en: 'Close' },
    next: { id: 'Lanjut', en: 'Next' },
    delete: { id: 'Hapus', en: 'Delete' },
    rename: { id: 'Ganti nama', en: 'Rename' },
    manage: { id: 'Kelola', en: 'Manage' },
    switch: { id: 'Beralih', en: 'Switch' },
    connect: { id: 'Hubungkan', en: 'Connect' },
    deposit: { id: 'Deposit', en: 'Deposit' },

    home: { id: 'Beranda', en: 'Home' },
    nav_home: { id: 'Beranda', en: 'Home' },
    nav_history: { id: 'Riwayat', en: 'History' },
    nav_swap: { id: 'Swap', en: 'Swap' },
    nav_wallet: { id: 'Dompet', en: 'Wallet' },
    nav_settings: { id: 'Pengaturan', en: 'Settings' },
    swap: { id: 'Swap', en: 'Swap' },
    history: { id: 'Riwayat', en: 'History' },
    settings: { id: 'Pengaturan', en: 'Settings' },
    send: { id: 'Kirim', en: 'Send' },
    receive: { id: 'Terima', en: 'Receive' },

    discover: { id: 'Temukan', en: 'Discover' },
    discover_search_ph: { id: 'Masukkan nama atau url DApp', en: 'Enter DApp name or URL' },
    popular: { id: 'Populer', en: 'Popular' },
    my_dapps: { id: 'DApp saya', en: 'My DApps' },
    exchange: { id: 'Exchange', en: 'Exchange' },
    bridge: { id: 'Bridge', en: 'Bridge' },
    defi: { id: 'DeFi', en: 'DeFi' },
    nft: { id: 'NFT', en: 'NFT' },
    tools: { id: 'Tools', en: 'Tools' },
    top_dex: { id: 'DEX Teratas', en: 'Top DEX' },
    ai_tools: { id: 'Alat AI', en: 'AI Tools' },
    stay_connected: { id: 'Stay Connected', en: 'Stay Connected' },
    stay_connected_sub: {
      id: 'Transfer your assets across blockchains without friction.',
      en: 'Transfer your assets across blockchains without friction.'
    },
    no_fav_dapp: {
      id: 'Belum ada DApp favorit.',
      en: 'No favorite DApps yet.'
    },

    preferences: { id: 'Preferensi', en: 'Preferences' },
    language: { id: 'Bahasa', en: 'Language' },
    currency: { id: 'Mata uang', en: 'Currency' },
    theme: { id: 'Tema', en: 'Theme' },
    theme_dark: { id: 'Gelap', en: 'Dark' },
    theme_light: { id: 'Terang', en: 'Light' },
    theme_system: { id: 'Sistem', en: 'System' },
    price_color: { id: 'Warna perubahan harga', en: 'Price change color' },
    price_standard: { id: 'Standar (hijau naik)', en: 'Standard (green up)' },
    price_inverted: { id: 'Terbalik (merah naik)', en: 'Inverted (red up)' },
    default_page: { id: 'Halaman awal default', en: 'Default home page' },
    page_wallet: { id: 'Dompet', en: 'Wallet' },
    page_home: { id: 'Beranda', en: 'Home' },
    page_discover: { id: 'Temukan', en: 'Discover' },
    lang_id: { id: 'Bahasa Indonesia', en: 'Indonesian' },
    lang_en: { id: 'English', en: 'English' },

    security: { id: 'Keamanan', en: 'Security' },
    address_book: { id: 'Buku alamat', en: 'Address book' },
    gas_pref: { id: 'Preferensi Gas', en: 'Gas preference' },
    node_route: { id: 'Node & rute jaringan', en: 'Node & network route' },
    referral: { id: 'Referral', en: 'Referral' },
    beta: { id: 'Gabung uji beta', en: 'Join beta test' },
    connect_wc: { id: 'Hubungkan Wallet / WC', en: 'Connect Wallet / WC' },
    manage_profile: {
      id: 'Kelola seed phrase, kunci pribadi, nama, dan avatar',
      en: 'Manage seed phrase, private key, name, and avatar'
    },
    seed_guide: { id: 'Panduan Backup Seed', en: 'Seed Backup Guide' },
    about_app: { id: 'Tentang BaseRocky Wallet', en: 'About BaseRocky Wallet' },
    get_help: { id: 'Dapatkan bantuan', en: 'Get help' },
    crypto_101: { id: 'Kripto 101', en: 'Crypto 101' },
    hardware_wallet: { id: 'Hardware Wallet', en: 'Hardware Wallet' },

    switch_wallet: { id: 'Ganti Dompet', en: 'Switch Wallet' },
    total_assets: { id: 'Total aset', en: 'Total assets' },
    add_wallet: { id: 'Tambah dompet', en: 'Add wallet' },
    create_wallet: { id: 'Buat dompet', en: 'Create wallet' },
    import_wallet: { id: 'Impor dompet', en: 'Import wallet' },
    my_wallet: { id: 'Dompet Saya', en: 'My Wallet' },
    backup_now: { id: 'Cadangkan sekarang', en: 'Back up now' },

    enter_pin: { id: 'Masukkan PIN', en: 'Enter PIN' },
    wallet_locked: { id: 'Dompet terkunci', en: 'Wallet locked' },
    wrong_pin: { id: 'PIN salah', en: 'Wrong PIN' },
    create_pin: { id: 'Buat kode sandi', en: 'Create passcode' },
    confirm_pin: { id: 'Konfirmasi kode sandi', en: 'Confirm passcode' },
    unlock_wallet: { id: 'Buka kunci wallet', en: 'Unlock wallet' },

    backup_seed: { id: 'Cadangkan seed phrase', en: 'Back up seed phrase' },
    seed_warning: {
      id: 'Tulis 12 kata ini secara berurutan. Jangan screenshot atau bagikan.',
      en: 'Write these 12 words in order. Do not screenshot or share them.'
    },
    i_saved_seed: { id: 'Saya sudah menyimpan', en: 'I have saved it' },
    copy_seed: { id: 'Salin seed phrase', en: 'Copy seed phrase' },

    tokens: { id: 'Token', en: 'Tokens' },
    networks: { id: 'Jaringan', en: 'Networks' },
    notifications: { id: 'Notifikasi', en: 'Notifications' },
    recently_used: { id: 'Terakhir digunakan', en: 'Recently used' },
    copy_address: { id: 'Salin alamat', en: 'Copy address' },
    change_today: { id: 'Perubahan hari ini', en: "Today's change" },
    pay_qr: { id: 'Bayar QR', en: 'Pay QR' },
    gift: { id: 'Hadiah', en: 'Rewards' },
    dapp: { id: 'DApp', en: 'DApp' },
    esim: { id: 'eSIM', en: 'eSIM' },
    promo_affiliate: {
      id: 'Dicari Afiliasi Global, komisi ganda jalur pro',
      en: 'Global Affiliates wanted — pro multi-level commission'
    },
    learn_more: { id: 'Pelajari lebih lanjut ›', en: 'Learn more ›' },
    ongoing: { id: 'Sedang berlangsung', en: 'Ongoing' },
    swap_tokens: { id: 'Tukar token', en: 'Swap tokens' },
    base_ecosystem: { id: 'Ekosistem Base', en: 'Base ecosystem' },

    swap_from: { id: 'Dari', en: 'From' },
    swap_to: { id: 'Ke', en: 'To' },
    balance: { id: 'Saldo', en: 'Balance' },
    max: { id: 'Maks', en: 'Max' },
    network: { id: 'Jaringan', en: 'Network' },
    enter_amount: { id: 'Masukkan jumlah', en: 'Enter amount' },
    insufficient_balance: { id: 'Saldo tidak cukup', en: 'Insufficient balance' },
    swap_estimate_note: {
      id: 'Estimasi harga. Eksekusi final di Uniswap (Base).',
      en: 'Price estimate. Final execution on Uniswap (Base).'
    },
    rate: { id: 'Rate', en: 'Rate' },
    slippage: { id: 'Slippage', en: 'Slippage' },

    filter_all: { id: 'Semua', en: 'All' },
    filter_receive: { id: 'Terima', en: 'Receive' },
    filter_send: { id: 'Kirim', en: 'Send' },
    tx_send: { id: 'Kirim', en: 'Send' },
    tx_receive: { id: 'Terima', en: 'Receive' },
    empty_tx: { id: 'Belum ada transaksi', en: 'No transactions' },
    empty_tx_sub: { id: 'Kirim atau terima token untuk melihat riwayat', en: 'Send or receive tokens to see history' },
    load_failed: { id: 'Gagal memuat', en: 'Failed to load' },

    notif_new: { id: 'Baru', en: 'New' },
    notif_tip: { id: 'Tips', en: 'Tip' },
    welcome_sub: {
      id: 'Kelola aset Base dengan aman',
      en: 'Manage Base assets securely'
    },
    pin_backup_title: {
      id: 'Aktifkan PIN & backup seed',
      en: 'Enable PIN & back up seed'
    },
    pin_backup_sub: {
      id: 'Lindungi dompet Anda',
      en: 'Protect your wallet'
    },

    no_plaintext: {
      id: 'Tidak ada seed plaintext tersimpan',
      en: 'No plaintext seed stored'
    },
    data_encrypted: {
      id: 'Data sensitif terenkripsi AES-GCM',
      en: 'Sensitive data encrypted with AES-GCM'
    }
  };

  /* Bidirectional phrase map for auto walk (longer phrases first) */
  var PAIR_LIST = [
    ['Dicari Afiliasi Global, komisi ganda jalur pro', 'Global Affiliates wanted — pro multi-level commission'],
    ['Estimasi harga. Eksekusi final di Uniswap (Base).', 'Price estimate. Final execution on Uniswap (Base).'],
    ['Kelola seed phrase, kunci pribadi, nama, dan avatar', 'Manage seed phrase, private key, name, and avatar'],
    ['Masukkan nama atau url DApp', 'Enter DApp name or URL'],
    ['Aktifkan PIN & backup seed', 'Enable PIN & back up seed'],
    ['Kelola aset Base dengan aman', 'Manage Base assets securely'],
    ['Node & rute jaringan', 'Node & network route'],
    ['Warna perubahan harga', 'Price change color'],
    ['Halaman awal default', 'Default home page'],
    ['Panduan Backup Seed', 'Seed Backup Guide'],
    ['Tentang BaseRocky Wallet', 'About BaseRocky Wallet'],
    ['Preferensi Gas', 'Gas preference'],
    ['Gabung uji beta', 'Join beta test'],
    ['Hubungkan Wallet / WC', 'Connect Wallet / WC'],
    ['Dapatkan bantuan', 'Get help'],
    ['Perubahan hari ini', "Today's change"],
    ['Sedang berlangsung', 'Ongoing'],
    ['Pelajari lebih lanjut ›', 'Learn more ›'],
    ['Pelajari lebih lanjut', 'Learn more'],
    ['Masukkan jumlah', 'Enter amount'],
    ['Saldo tidak cukup', 'Insufficient balance'],
    ['Ekosistem Base', 'Base ecosystem'],
    ['Tukar token', 'Swap tokens'],
    ['DEX Teratas', 'Top DEX'],
    ['DApp saya', 'My DApps'],
    ['Cari aplikasi', 'Search apps'],
    ['Buku alamat', 'Address book'],
    ['Bahasa Indonesia', 'Indonesian'],
    ['Lindungi dompet Anda', 'Protect your wallet'],
    ['Terakhir digunakan', 'Recently used'],
    ['Baru digunakan', 'Recently used'],
    ['Dompet Saya', 'My Wallet'],
    ['Ganti Dompet', 'Switch Wallet'],
    ['Buat dompet', 'Create wallet'],
    ['Impor dompet', 'Import wallet'],
    ['Tambah dompet', 'Add wallet'],
    ['Total aset', 'Total assets'],
    ['Cadangkan sekarang', 'Back up now'],
    ['Masukkan PIN', 'Enter PIN'],
    ['Dompet terkunci', 'Wallet locked'],
    ['PIN salah', 'Wrong PIN'],
    ['Buka kunci wallet', 'Unlock wallet'],
    ['Salin seed phrase', 'Copy seed phrase'],
    ['Saya sudah menyimpan', 'I have saved it'],
    ['Gagal memuat', 'Failed to load'],
    ['Kripto 101', 'Crypto 101'],
    ['Bayar QR', 'Pay QR'],
    ['Semua ▾', 'All ▾'],
    ['Memuat…', 'Loading…'],
    ['Memuat...', 'Loading...'],
    ['Preferensi', 'Preferences'],
    ['Pengaturan', 'Settings'],
    ['Notifikasi', 'Notifications'],
    ['Keamanan', 'Security'],
    ['Mata uang', 'Currency'],
    ['Bahasa', 'Language'],
    ['Tema', 'Theme'],
    ['Jaringan', 'Network'],
    ['Saldo', 'Balance'],
    ['Populer', 'Popular'],
    ['Beranda', 'Home'],
    ['Riwayat', 'History'],
    ['Dompet', 'Wallet'],
    ['Temukan', 'Discover'],
    ['Hadiah', 'Rewards'],
    ['Hubungkan', 'Connect'],
    ['Kirim', 'Send'],
    ['Terima', 'Receive'],
    ['Semua', 'All'],
    ['Maks', 'Max'],
    ['Dari', 'From'],
    ['DARI', 'FROM'],
    ['Ke', 'To'],
    ['KE', 'TO'],
    ['Baru', 'New'],
    ['Tips', 'Tip'],
    ['Cari', 'Search'],
    ['Gelap', 'Dark'],
    ['Terang', 'Light'],
    ['Sistem', 'System'],
    ['Simpan', 'Save'],
    ['Batal', 'Cancel'],
    ['Lanjutkan', 'Continue'],
    ['Kembali', 'Back'],
    ['Salin', 'Copy'],
    ['Selesai', 'Done'],
    ['Konfirmasi', 'Confirm'],
    ['Token', 'Tokens'],
    ['Lainnya', 'More'],
    ['Tutup', 'Close']
  ];

  var lang = 'id';
  try {
    lang = localStorage.getItem('br_lang') || 'id';
  } catch (e) {}

  var FALLBACK = {
    filter_all: { id: 'Semua', en: 'All' },
    filter_receive: { id: 'Terima', en: 'Receive' },
    filter_send: { id: 'Kirim', en: 'Send' },
    tx_send: { id: 'Kirim', en: 'Send' },
    tx_receive: { id: 'Terima', en: 'Receive' },
    empty_tx: { id: 'Belum ada transaksi', en: 'No transactions' },
    empty_tx_sub: {
      id: 'Kirim atau terima token untuk melihat riwayat',
      en: 'Send or receive tokens to see history'
    },
    history: { id: 'Riwayat', en: 'History' },
    send: { id: 'Kirim', en: 'Send' },
    receive: { id: 'Terima', en: 'Receive' },
    loading: { id: 'Memuat…', en: 'Loading…' }
  };

  function t(key) {
    try {
      var stored = localStorage.getItem('br_lang');
      if (stored === 'id' || stored === 'en') lang = stored;
    } catch (e) {}
    var row = dict[key] || FALLBACK[key];
    if (!row) return key;
    return row[lang] || row.en || row.id || key;
  }

  // ensure critical keys always present
  Object.keys(FALLBACK).forEach(function (k) {
    if (!dict[k]) dict[k] = FALLBACK[k];
  });


  function buildMaps() {
    var toEn = {};
    var toId = {};
    PAIR_LIST.forEach(function (p) {
      toEn[p[0]] = p[1];
      toId[p[1]] = p[0];
      // also map via dict values
    });
    Object.keys(dict).forEach(function (k) {
      var row = dict[k];
      if (row.id && row.en) {
        toEn[row.id] = row.en;
        toId[row.en] = row.id;
      }
    });
    return { toEn: toEn, toId: toId };
  }

  var mapsCache = null;
  var mapsLang = null;
  function getMaps() {
    if (mapsCache && mapsLang === lang) return mapsCache;
    var toEn = {};
    var toId = {};
    PAIR_LIST.forEach(function (p) {
      toEn[p[0]] = p[1];
      toId[p[1]] = p[0];
    });
    Object.keys(dict).forEach(function (k) {
      var row = dict[k];
      if (row && row.id && row.en) {
        toEn[row.id] = row.en;
        toId[row.en] = row.id;
      }
    });
    mapsCache = { toEn: toEn, toId: toId };
    mapsLang = lang;
    return mapsCache;
  }

  function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    var trimmed = text.trim();
    if (!trimmed) return text;
    var maps = getMaps();
    var map = targetLang === 'en' ? maps.toEn : maps.toId;
    // Already in target language? do nothing (prevents flip-flop)
    var reverse = targetLang === 'en' ? maps.toId : maps.toEn;
    if (reverse[trimmed] && !map[trimmed]) {
      return text; // text is already target lang
    }
    if (map[trimmed]) {
      return text.replace(trimmed, map[trimmed]);
    }
    if (map[text]) return map[text];
    return text;
  }

  /* Auto text-walk OFF — causes History/UI language flicker when combined with JS renders.
     Translations come from data-i18n + I18N.t() only. */
  var AUTO_TEXT_WALK = false;

  function walkTextNodes(root, force) {
    if (!AUTO_TEXT_WALK && !force) return;

    if (!root) root = document.body;
    var skip = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, PRE: 1, SVG: 1 };
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (skip[p.tagName]) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest('[data-no-i18n]') || p.closest('[data-i18n-stable]'))) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip nodes already applied for this lang
        if (p.getAttribute && p.getAttribute('data-i18n-lang') === lang) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var v = node.nodeValue.trim();
        if (/^[\d$€£¥.,%\s+\-x×≈~<>:]+$/i.test(v)) return NodeFilter.FILTER_REJECT;
        if (/^0x[a-fA-F0-9]+/.test(v)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = translateText(node.nodeValue, lang);
      if (next !== node.nodeValue) {
        node.nodeValue = next;
        if (node.parentElement) {
          try { node.parentElement.setAttribute('data-i18n-lang', lang); } catch (e) {}
        }
      }
    });
  }

  function applyAttrPlaceholders(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && dict[key]) el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key && dict[key]) el.setAttribute('placeholder', t(key));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key && dict[key]) el.setAttribute('title', t(key));
    });
    root.querySelectorAll('[placeholder]').forEach(function (el) {
      if (el.getAttribute('data-i18n-placeholder')) return;
      var ph = el.getAttribute('placeholder');
      var next = translateText(ph, lang);
      if (next !== ph) el.setAttribute('placeholder', next);
    });
  }

  function refreshActiveScreens() {
    try {
      if (typeof refreshPrefLabels === 'function') refreshPrefLabels();
    } catch (e) {}
    try {
      if (typeof renderDiscover === 'function') {
        var disc = document.getElementById('screen-discover');
        if (disc && disc.classList.contains('active')) renderDiscover();
      }
    } catch (e) {}
    try {
      if (typeof renderHistory === 'function') {
        var h = document.getElementById('screen-history');
        if (h && h.classList.contains('active')) renderHistory();
      }
    } catch (e) {}
    try {
      if (typeof calcSwapOut === 'function') calcSwapOut();
    } catch (e) {}
    try {
      var active = document.querySelector('.screen.active');
      if (active && active.id === 'screen-settings' && typeof renderSettingsHeader === 'function') {
        renderSettingsHeader();
      }
    } catch (e) {}
  }

  function applyDom(root) {
    applyAttrPlaceholders(root || document);
    walkTextNodes(root || document.body);
    document.documentElement.setAttribute('lang', lang === 'id' ? 'id' : 'en');
    try {
      if (typeof refreshPrefLabels === 'function') refreshPrefLabels();
    } catch (e) {}
  }

  function setLang(code) {
    if (code !== 'id' && code !== 'en') return;
    lang = code;
    try {
      localStorage.setItem('br_lang', code);
    } catch (e) {}
    if (typeof state !== 'undefined') state.lang = code;
    applyDom();
    refreshActiveScreens();
    // single delayed pass for dynamic lists only
    setTimeout(function () {
      try { refreshActiveScreens(); } catch (e) {}
      try {
        if (typeof renderHistory === 'function') renderHistory();
        else if (typeof renderHistoryEnhanced === 'function') renderHistoryEnhanced((typeof state!=='undefined'&&state.history)||[]);
      } catch (e) {}
      try { applyAttrPlaceholders(document); } catch (e) {}
    }, 100);
    try {
      showToast(code === 'id' ? 'Bahasa: Indonesia' : 'Language: English');
    } catch (e) {}
  }

  function getLang() {
    return lang;
  }

  function extend(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) {
      dict[k] = extra[k];
    });
  }

  /* ---- Optimized MutationObserver ---- */
  var obsTimer = null;
  var mo = null;
  var applying = false;
  var pendingRoots = [];

  function queuePendingRoot(node) {
    if (!node || node.nodeType !== 1) {
      if (node && node.nodeType === 3 && node.parentElement) {
        queuePendingRoot(node.parentElement);
      }
      return;
    }
    // Skip stable / already-localized history & similar
    if (node.getAttribute && node.getAttribute('data-i18n-stable')) return;
    if (node.closest && node.closest('[data-i18n-stable]')) return;
    // Skip heavy/noisy subtrees
    if (node.id === 'loadingOverlay' && !node.classList.contains('show')) return;
    if (node.closest && node.closest('svg, script, style, canvas')) return;
    for (var i = 0; i < pendingRoots.length; i++) {
      if (pendingRoots[i] === node || pendingRoots[i].contains(node)) return;
      if (node.contains(pendingRoots[i])) {
        pendingRoots[i] = node;
        return;
      }
    }
    pendingRoots.push(node);
  }

  function flushPending() {
    obsTimer = null;
    if (applying || !pendingRoots.length) {
      pendingRoots = [];
      return;
    }
    applying = true;
    var roots = pendingRoots;
    pendingRoots = [];
    try {
      if (mo) mo.disconnect();
      for (var i = 0; i < roots.length; i++) {
        var r = roots[i];
        if (!r || !r.isConnected) continue;
        applyAttrPlaceholders(r);
        // walkTextNodes intentionally skipped (stable language)
      }
    } catch (e) {}
    applying = false;
    if (mo) {
      try {
        mo.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: false,
          attributes: false
        });
      } catch (e2) {}
    }
  }

  function scheduleApply(node) {
    queuePendingRoot(node || document.body);
    if (obsTimer) clearTimeout(obsTimer);
    obsTimer = setTimeout(function () {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flushPending);
      } else {
        flushPending();
      }
    }, 120);
  }

  function startObserver() {
    return; // disabled: was causing language flicker
    if (mo || typeof MutationObserver === 'undefined') return;
    try {
      mo = new MutationObserver(function (muts) {
        if (applying) return;
        var interesting = false;
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type !== 'childList') continue;
          var nodes = m.addedNodes;
          for (var j = 0; j < nodes.length; j++) {
            var n = nodes[j];
            if (n.nodeType === 1) {
              // ignore pure style/script/svg inserts
              var tag = n.tagName;
              if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') continue;
              queuePendingRoot(n);
              interesting = true;
            } else if (n.nodeType === 3 && n.parentElement) {
              queuePendingRoot(n.parentElement);
              interesting = true;
            }
          }
        }
        if (interesting) {
          if (obsTimer) clearTimeout(obsTimer);
          obsTimer = setTimeout(function () {
            if (typeof requestAnimationFrame === 'function') {
              requestAnimationFrame(flushPending);
            } else {
              flushPending();
            }
          }, 120);
        }
      });
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
        attributes: false
      });
    } catch (e) {}
  }

  /* ---- RTL support ---- */
  var RTL_LANGS = { ar: 1, he: 1, fa: 1, ur: 1 };
  var dirMode = 'auto'; // auto | ltr | rtl

  try {
    dirMode = localStorage.getItem('br_dir') || 'auto';
  } catch (e) {}

  function resolveDir(code) {
    if (dirMode === 'rtl') return 'rtl';
    if (dirMode === 'ltr') return 'ltr';
    // auto
    var L = code || lang;
    return RTL_LANGS[L] ? 'rtl' : 'ltr';
  }

  function applyDir(code) {
    var d = resolveDir(code);
    var root = document.documentElement;
    root.setAttribute('dir', d);
    root.classList.toggle('rtl', d === 'rtl');
    root.classList.toggle('ltr', d === 'ltr');
    try {
      document.body.setAttribute('dir', d);
    } catch (e) {}
    return d;
  }

  function setDir(mode) {
    if (mode !== 'auto' && mode !== 'ltr' && mode !== 'rtl') return;
    dirMode = mode;
    try {
      localStorage.setItem('br_dir', mode);
    } catch (e) {}
    var d = applyDir(lang);
    try {
      showToast(d === 'rtl' ? 'Layout: RTL' : mode === 'auto' ? 'Layout: Auto' : 'Layout: LTR');
    } catch (e) {}
    return d;
  }

  function getDir() {
    return resolveDir(lang);
  }

  // Patch setLang to apply direction
  var _setLang = setLang;
  setLang = function (code) {
    _setLang(code);
    applyDir(code);
  };

  // Patch applyDom to keep dir in sync
  var _applyDom = applyDom;
  applyDom = function (root) {
    applying = true;
    try {
      if (mo) mo.disconnect();
      _applyDom(root);
      applyDir(lang);
    } finally {
      applying = false;
      if (mo) {
        try {
          mo.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false,
            attributes: false
          });
        } catch (e) {}
      }
    }
  };

  global.t = t;
  global.I18N = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    apply: applyDom,
    applyDom: applyDom,
    walk: walkTextNodes,
    dict: dict,
    extend: extend,
    translateText: translateText,
    setDir: setDir,
    getDir: getDir,
    applyDir: applyDir,
    RTL_LANGS: RTL_LANGS
  };

  function boot() {
    applyDir(lang);
    applyDom();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 60);
    });
  } else {
    setTimeout(boot, 60);
  }

  console.log('%ci18n auto+RTL ready (' + lang + ', dir=' + resolveDir(lang) + ')', 'color:#00D4AA;font-weight:bold');
})(typeof window !== 'undefined' ? window : this);

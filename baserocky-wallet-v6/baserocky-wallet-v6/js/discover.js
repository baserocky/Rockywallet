/**
 * BaseRocky Discover — Bitget Wallet style
 * Layout, icons, sections, favorites, search
 */
(function DiscoverBitgetStyle() {
  'use strict';

  state.discTab = state.discTab || 'populer';
  try {
    state.myDapps = JSON.parse(localStorage.getItem('br_my_dapps') || '[]');
  } catch (e) {
    state.myDapps = [];
  }
  try {
    state.recentDapps = JSON.parse(localStorage.getItem('br_recent_dapps') || '[]');
  } catch (e) {
    state.recentDapps = [];
  }

  function favicon(domain) {
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=128';
  }
  function cg(path) {
    return 'https://assets.coingecko.com/' + path;
  }
  var ICO = {
    uniswap: cg('coins/images/12504/small/uniswap-logo.png'),
    pancake: cg('coins/images/12632/small/pancakeswap-cake-logo.png'),
    aero: cg('coins/images/31745/small/token.png'),
    inch: cg('coins/images/13469/small/1inch-token.png'),
    sushi: cg('coins/images/12271/small/512x512_Logo_no_chop.png'),
    aave: cg('coins/images/12645/small/aave-token-round.png'),
    base: cg('asset_platforms/images/131/small/base.png'),
    eth: cg('coins/images/279/small/ethereum.png'),
    bnb: cg('coins/images/825/small/bnb-icon2_2x.png'),
    opensea: 'https://opensea.io/static/images/logos/opensea-logo.svg',
    hyperliquid: 'https://app.hyperliquid.xyz/favicon.ico',
    jumper: favicon('jumper.exchange'),
    relay: favicon('relay.link'),
    superbridge: favicon('superbridge.app'),
    moonwell: favicon('moonwell.fi'),
    seamless: favicon('seamless.protocol.com'),
    extra: favicon('extrafi.io'),
    basescan: favicon('basescan.org'),
    debank: favicon('debank.com'),
    defillama: favicon('defillama.com'),
    zora: favicon('zora.co'),
    warpcast: favicon('warpcast.com'),
    coinbase: favicon('coinbase.com'),
    odos: favicon('odos.xyz'),
    layer3: favicon('layer3.xyz'),
    galxe: favicon('galxe.com'),
    stargate: cg('coins/images/24413/small/STG_LOGO.png'),
    across: favicon('across.to'),
    compound: cg('coins/images/10775/small/COMP.png'),
    curve: cg('coins/images/12124/small/Curve.png'),
    gmx: cg('coins/images/18323/small/arbit.png'),
    pendle: cg('coins/images/15069/small/Pendle_Logo_Normal-03.png'),
    morpho: favicon('morpho.org'),
    blur: favicon('blur.io'),
    magiceden: favicon('magiceden.io'),
    chat: favicon('chatgpt.com'),
    perplexity: favicon('perplexity.ai'),
    midjourney: favicon('midjourney.com')
  };

  function logoOr(fallback) {
    return typeof LOGO !== 'undefined' && LOGO ? LOGO : fallback;
  }

  window.DAPPS = [
    {
      id: 'baserocky',
      name: 'BaseRocky',
      desc: 'Official BaseRocky ecosystem portal',
      url: 'https://baserocky.com',
      cat: ['populer', 'defi'],
      icon: logoOr(favicon('baserocky.com')),
      chain: ICO.base,
      section: 'dex',
      featured: true
    },
    {
      id: 'uni',
      name: 'Uniswap V3',
      desc: 'Decentralized trading protocol',
      url: 'https://app.uniswap.org/swap?chain=base',
      cat: ['populer', 'exchange', 'defi'],
      icon: ICO.uniswap,
      chain: ICO.eth,
      section: 'dex',
      featured: true
    },
    {
      id: 'pancake',
      name: 'PancakeSwap',
      desc: 'Trade, earn, and win crypto on the most popular DEX',
      url: 'https://pancakeswap.finance',
      cat: ['populer', 'exchange', 'defi'],
      icon: ICO.pancake,
      chain: ICO.bnb,
      section: 'dex',
      featured: true
    },
    {
      id: 'hyperliquid',
      name: 'Hyperliquid',
      desc: 'L1 with performant native components',
      url: 'https://app.hyperliquid.xyz',
      cat: ['populer', 'exchange', 'defi'],
      icon: ICO.hyperliquid,
      chain: '',
      section: 'dex',
      featured: true
    },
    {
      id: 'aero',
      name: 'Aerodrome',
      desc: 'Central trading and liquidity marketplace on Base',
      url: 'https://aerodrome.finance',
      cat: ['populer', 'exchange', 'defi'],
      icon: ICO.aero,
      chain: ICO.base,
      section: 'dex',
      featured: true
    },
    {
      id: '1inch',
      name: '1inch',
      desc: 'DEX aggregator — best rates across chains',
      url: 'https://app.1inch.io/#/8453/simple/swap/ETH',
      cat: ['exchange', 'defi', 'populer'],
      icon: ICO.inch,
      chain: ICO.base,
      section: 'dex'
    },
    {
      id: 'sushi',
      name: 'SushiSwap',
      desc: 'Community-driven DEX',
      url: 'https://www.sushi.com/swap?chainId=8453',
      cat: ['exchange', 'defi'],
      icon: ICO.sushi,
      chain: ICO.base,
      section: 'dex'
    },
    {
      id: 'odos',
      name: 'Odos',
      desc: 'Smart order routing for best swap rates',
      url: 'https://app.odos.xyz',
      cat: ['exchange', 'defi'],
      icon: ICO.odos,
      chain: ICO.base,
      section: 'dex'
    },
    {
      id: 'gmx',
      name: 'GMX',
      desc: 'Decentralized perpetual exchange',
      url: 'https://app.gmx.io',
      cat: ['exchange', 'defi'],
      icon: ICO.gmx,
      chain: ICO.eth,
      section: 'dex'
    },
    {
      id: 'base-bridge',
      name: 'Base Bridge',
      desc: 'Official bridge to Base',
      url: 'https://bridge.base.org',
      cat: ['bridge', 'populer'],
      icon: ICO.base,
      chain: ICO.base,
      section: 'bridge',
      featured: true
    },
    {
      id: 'superbridge',
      name: 'Superbridge',
      desc: 'Bridge assets to Base quickly',
      url: 'https://superbridge.app/base',
      cat: ['bridge', 'populer'],
      icon: ICO.superbridge,
      chain: ICO.base,
      section: 'bridge'
    },
    {
      id: 'jumper',
      name: 'Jumper Exchange',
      desc: 'Multi-chain bridge & swap',
      url: 'https://jumper.exchange',
      cat: ['bridge', 'exchange'],
      icon: ICO.jumper,
      chain: ICO.eth,
      section: 'bridge'
    },
    {
      id: 'relay',
      name: 'Relay',
      desc: 'Fast cross-chain bridging',
      url: 'https://relay.link',
      cat: ['bridge'],
      icon: ICO.relay,
      chain: ICO.base,
      section: 'bridge'
    },
    {
      id: 'stargate',
      name: 'Stargate',
      desc: 'Omnichain liquidity protocol',
      url: 'https://stargate.finance/transfer',
      cat: ['bridge', 'defi'],
      icon: ICO.stargate,
      chain: ICO.eth,
      section: 'bridge'
    },
    {
      id: 'across',
      name: 'Across',
      desc: 'Fast & secure cross-chain bridge',
      url: 'https://across.to',
      cat: ['bridge'],
      icon: ICO.across,
      chain: ICO.eth,
      section: 'bridge'
    },
    {
      id: 'aave',
      name: 'Aave',
      desc: 'Open source liquidity protocol',
      url: 'https://app.aave.com',
      cat: ['defi', 'populer'],
      icon: ICO.aave,
      chain: ICO.eth,
      section: 'defi'
    },
    {
      id: 'moonwell',
      name: 'Moonwell',
      desc: 'Lending market on Base',
      url: 'https://moonwell.fi',
      cat: ['defi'],
      icon: ICO.moonwell,
      chain: ICO.base,
      section: 'defi'
    },
    {
      id: 'extra',
      name: 'Extra Finance',
      desc: 'Leveraged yield on Base',
      url: 'https://app.extrafi.io',
      cat: ['defi'],
      icon: ICO.extra,
      chain: ICO.base,
      section: 'defi'
    },
    {
      id: 'seamless',
      name: 'Seamless',
      desc: 'Native Base money market',
      url: 'https://www.seamless.protocol.com',
      cat: ['defi'],
      icon: ICO.seamless,
      chain: ICO.base,
      section: 'defi'
    },
    {
      id: 'morpho',
      name: 'Morpho',
      desc: 'Optimized lending protocol',
      url: 'https://app.morpho.org',
      cat: ['defi'],
      icon: ICO.morpho,
      chain: ICO.eth,
      section: 'defi'
    },
    {
      id: 'pendle',
      name: 'Pendle',
      desc: 'Yield trading protocol',
      url: 'https://app.pendle.finance',
      cat: ['defi'],
      icon: ICO.pendle,
      chain: ICO.eth,
      section: 'defi'
    },
    {
      id: 'compound',
      name: 'Compound',
      desc: 'Algorithmic money markets',
      url: 'https://app.compound.finance',
      cat: ['defi'],
      icon: ICO.compound,
      chain: ICO.eth,
      section: 'defi'
    },
    {
      id: 'basescan',
      name: 'Basescan',
      desc: 'Base block explorer',
      url: 'https://basescan.org',
      cat: ['tool', 'populer'],
      icon: ICO.basescan,
      chain: ICO.base,
      section: 'tool'
    },
    {
      id: 'debank',
      name: 'DeBank',
      desc: 'Portfolio tracker',
      url: 'https://debank.com',
      cat: ['tool', 'populer'],
      icon: ICO.debank,
      chain: '',
      section: 'tool'
    },
    {
      id: 'defillama',
      name: 'DefiLlama',
      desc: 'TVL analytics for Base',
      url: 'https://defillama.com/chain/Base',
      cat: ['tool'],
      icon: ICO.defillama,
      chain: '',
      section: 'tool'
    },
    {
      id: 'layer3',
      name: 'Layer3',
      desc: 'Quests & onchain discovery',
      url: 'https://app.layer3.xyz',
      cat: ['tool', 'populer'],
      icon: ICO.layer3,
      chain: ICO.base,
      section: 'tool'
    },
    {
      id: 'galxe',
      name: 'Galxe',
      desc: 'Web3 credential network',
      url: 'https://galxe.com',
      cat: ['tool'],
      icon: ICO.galxe,
      chain: '',
      section: 'tool'
    },
    {
      id: 'opensea',
      name: 'OpenSea',
      desc: 'NFT marketplace',
      url: 'https://opensea.io',
      cat: ['nft', 'populer'],
      icon: ICO.opensea,
      chain: ICO.eth,
      section: 'nft'
    },
    {
      id: 'zora',
      name: 'Zora',
      desc: 'Create & collect on Zora',
      url: 'https://zora.co',
      cat: ['nft'],
      icon: ICO.zora,
      chain: ICO.base,
      section: 'nft'
    },
    {
      id: 'blur',
      name: 'Blur',
      desc: 'NFT marketplace for pro traders',
      url: 'https://blur.io',
      cat: ['nft'],
      icon: ICO.blur,
      chain: ICO.eth,
      section: 'nft'
    },
    {
      id: 'magiceden',
      name: 'Magic Eden',
      desc: 'Multi-chain NFT marketplace',
      url: 'https://magiceden.io',
      cat: ['nft'],
      icon: ICO.magiceden,
      chain: '',
      section: 'nft'
    },
    {
      id: 'warpcast',
      name: 'Warpcast',
      desc: 'Farcaster social client',
      url: 'https://warpcast.com',
      cat: ['social', 'populer', 'tool'],
      icon: ICO.warpcast,
      chain: '',
      section: 'tool'
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      desc: 'Buy crypto with fiat',
      url: 'https://www.coinbase.com',
      cat: ['exchange'],
      icon: ICO.coinbase,
      chain: '',
      section: 'dex'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      desc: 'AI assistant by OpenAI',
      url: 'https://chatgpt.com',
      cat: ['tool', 'populer'],
      icon: ICO.chat,
      chain: '',
      section: 'ai'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      desc: 'AI-powered search engine',
      url: 'https://www.perplexity.ai',
      cat: ['tool'],
      icon: ICO.perplexity,
      chain: '',
      section: 'ai'
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      desc: 'AI image generation',
      url: 'https://www.midjourney.com',
      cat: ['tool'],
      icon: ICO.midjourney,
      chain: '',
      section: 'ai'
    }
  ];

  function saveMy() {
    try {
      localStorage.setItem('br_my_dapps', JSON.stringify(state.myDapps || []));
    } catch (e) {}
  }
  function saveRecent() {
    try {
      localStorage.setItem('br_recent_dapps', JSON.stringify((state.recentDapps || []).slice(0, 12)));
    } catch (e) {}
  }
  function isFav(id) {
    return (state.myDapps || []).indexOf(id) >= 0;
  }

  window.toggleDappFav = function (id, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    var list = state.myDapps || [];
    var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.unshift(id);
    state.myDapps = list.slice(0, 30);
    saveMy();
    if (typeof showToast === 'function') {
      showToast(i >= 0 ? 'Dihapus dari favorit' : 'Ditambah ke DApp saya', 'success');
    }
    renderDiscover();
  };

  window.openDapp = function (id, url) {
    if (id) {
      state.recentDapps = (state.recentDapps || []).filter(function (x) {
        return x !== id;
      });
      state.recentDapps.unshift(id);
      saveRecent();
    }
    if (url) {
      if (typeof brOpen === 'function') brOpen(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  function letterFallback(name, color) {
    var ch = (name || '?').charAt(0).toUpperCase();
    var c = color || '#2a3344';
    return (
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88">' +
          '<rect width="88" height="88" rx="20" fill="' +
          c +
          '"/>' +
          '<text x="44" y="56" text-anchor="middle" font-size="36" font-family="system-ui,sans-serif" font-weight="700" fill="#e8edf5">' +
          ch +
          '</text></svg>'
      )
    );
  }

  function _esc(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _safeUrl(u) {
    if (typeof safeUrl === 'function') return safeUrl(u);
    u = String(u || '').trim();
    if (/^https?:\/\//i.test(u) || /^data:image\//i.test(u)) return u.replace(/"/g, '%22');
    return '';
  }

  function iconHtml(src, name) {
    var fb = letterFallback(name);
    var safe = _safeUrl(src) || fb;
    safe = String(safe).replace(/'/g, '%27');
    fb = String(fb).replace(/'/g, '%27');
    return (
      '<div class="dapp-ico">' +
      '<img src="' +
      safe +
      '" alt="" loading="lazy" referrerpolicy="no-referrer" ' +
      'onerror="this.onerror=null;this.src=\'' +
      fb +
      '\'">' +
      '</div>'
    );
  }

  function chainHtml(src) {
    if (!src) return '<span class="dapp-chain-spacer"></span>';
    var u = _safeUrl(src);
    if (!u) return '<span class="dapp-chain-spacer"></span>';
    return (
      '<img class="dapp-chain" src="' +
      u +
      '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">'
    );
  }

  function rowHtml(d) {
    var id = _esc(d.id || '');
    var url = _safeUrl(d.url || '') || _esc(d.url || '');
    return (
      '<div class="dapp-row bg-style" data-id="' +
      id +
      '" data-url="' +
      url +
      '" role="button" tabindex="0">' +
      iconHtml(d.icon, d.name) +
      '<div class="info">' +
      '<div class="n">' +
      _esc(d.name) +
      '</div>' +
      '<div class="d">' +
      _esc(d.desc) +
      '</div>' +
      '</div>' +
      chainHtml(d.chain) +
      '</div>'
    );
  }

  function sectionTitle(label) {
    return (
      '<div class="disc-sec"><span>' +
      label +
      '</span><span class="disc-sec-more">›</span></div>'
    );
  }

  function filterList(tab, q) {
    return DAPPS.filter(function (d) {
      if (tab === 'mine') return isFav(d.id);
      if (tab && tab !== 'populer' && (d.cat || []).indexOf(tab) < 0) return false;
      if (q && (d.name + ' ' + d.desc + ' ' + d.url).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function looksLikeUrl(s) {
    return /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/|\?|$)/i.test(s);
  }
  function normalizeUrl(s) {
    s = String(s || '').trim();
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s.replace(/'/g, '');
  }

  function promoBannerHtml() {
    return (
      '<div class="disc-promo disc-promo-bitget" onclick="openDapp(\'base-bridge\',\'https://bridge.base.org\')">' +
      '<div class="disc-promo-badge">AD</div>' +
      '<div class="disc-promo-inner">' +
      '<div class="disc-promo-brand">BASE</div>' +
      '<div class="disc-promo-title">Stay Connected</div>' +
      '<div class="disc-promo-sub">Transfer your assets across<br>blockchains without friction.</div>' +
      '</div>' +
      '<div class="disc-promo-glow"></div>' +
      '</div>'
    );
  }

  window.renderDiscover = function () {
    try {
      if (typeof I18N !== 'undefined' && I18N.apply) I18N.apply();
      var tabMap = { populer: 'popular', mine: 'my_dapps', exchange: 'exchange', bridge: 'bridge', defi: 'defi', nft: 'nft', tools: 'tools' };
      document.querySelectorAll('#discTabs span[data-tab]').forEach(function (sp) {
        var k = tabMap[sp.getAttribute('data-tab')];
        if (k && I18N.t) sp.textContent = I18N.t(k);
      });
    } catch (e) {}

    var qEl = document.getElementById('dappSearch');
    var q = ((qEl && qEl.value) || '').toLowerCase().trim();
    var tab = state.discTab || 'populer';
    var box = document.getElementById('dappList');
    if (!box) return;

    var html = '';

    if (tab === 'populer' && !q) {
      html += promoBannerHtml();
    }

    if (q && looksLikeUrl(q)) {
      html +=
        '<button type="button" class="disc-open-url" onclick="openDapp(\'\',\'' +
        normalizeUrl(q) +
        '\')">Buka URL · ' +
        q.slice(0, 40) +
        '</button>';
    }

    var list = filterList(tab, q);

    if (tab === 'populer' && !q) {
      var dex = list.filter(function (d) {
        return d.section === 'dex';
      });
      var bridge = list.filter(function (d) {
        return d.section === 'bridge';
      });
      var defi = list.filter(function (d) {
        return d.section === 'defi';
      });
      var ai = list.filter(function (d) {
        return d.section === 'ai';
      });
      var tool = list.filter(function (d) {
        return d.section === 'tool' || d.section === 'nft';
      });
      if (dex.length) {
        html += sectionTitle((typeof I18N!=='undefined'&&I18N.t)?I18N.t('top_dex'):'DEX Teratas');
        html += dex.map(rowHtml).join('');
      }
      if (bridge.length) {
        html += sectionTitle('Bridge');
        html += bridge.map(rowHtml).join('');
      }
      if (defi.length) {
        html += sectionTitle('DeFi');
        html += defi.map(rowHtml).join('');
      }
      if (ai.length) {
        html += sectionTitle('Alat AI');
        html += ai.map(rowHtml).join('');
      }
      if (tool.length) {
        html += sectionTitle('Tools & NFT');
        html += tool.map(rowHtml).join('');
      }
    } else if (tab === 'mine') {
      if (!list.length) {
        html +=
          '<div class="disc-empty">Belum ada DApp favorit.<br><span>Buka DApp lalu tandai dari daftar Populer.</span></div>';
      } else {
        html += sectionTitle((typeof I18N!=='undefined'&&I18N.t)?I18N.t('my_dapps'):'DApp saya');
        html += list.map(rowHtml).join('');
      }
    } else {
      if (!list.length) {
        html += '<div class="disc-empty">Tidak ada DApp di kategori ini</div>';
      } else {
        var labelMap = {
          exchange: 'Exchange',
          bridge: 'Bridge',
          defi: 'DeFi',
          nft: 'NFT',
          tool: 'Tools'
        };
        html += sectionTitle(labelMap[tab] || 'DApp');
        html += list.map(rowHtml).join('');
      }
    }

    box.innerHTML = html;

    box.querySelectorAll('.dapp-row').forEach(function (el) {
      el.onclick = function () {
        openDapp(el.getAttribute('data-id'), el.getAttribute('data-url'));
      };
    });

    document.querySelectorAll('#discTabs span').forEach(function (sp) {
      var t = sp.getAttribute('data-tab');
      sp.classList.toggle('on', t === tab);
      sp.onclick = function () {
        state.discTab = t;
        renderDiscover();
      };
    });
  };

  window.showDiscover = function () {
    if (typeof showScreen === 'function') showScreen('discover');
    setTimeout(function () {
      try {
        renderDiscover();
      } catch (e) {}
    }, 30);
  };

  function bindOnce() {
    var tabs = document.getElementById('discTabs');
    if (!tabs || tabs._bound) return;
    tabs._bound = true;
    tabs.querySelectorAll('span').forEach(function (sp) {
      sp.addEventListener('click', function () {
        state.discTab = sp.getAttribute('data-tab') || 'populer';
        renderDiscover();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindOnce);
  } else {
    bindOnce();
  }

  // Ensure this definition wins over any earlier overrides in core.js
  setTimeout(function () {
    try {
      if (
        document.getElementById('screen-discover') &&
        document.getElementById('screen-discover').classList.contains('active')
      ) {
        renderDiscover();
      }
    } catch (e) {}
  }, 50);

  console.log('%cDiscover Bitget-style ready', 'color:#00D4AA;font-weight:bold');
})();

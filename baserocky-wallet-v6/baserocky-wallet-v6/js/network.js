/**
 * BaseRocky Wallet — Network / RPC / Provider
 * Depends on: config.js (NETWORKS, state), ethers
 */

/* ===== RPC configuration + failover ===== */
var RPC_CONFIG = {
  base: {
    chainId: 8453,
    name: 'Base',
    explorer: 'https://basescan.org',
    native: 'ETH',
    rpcs: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://base-mainnet.public.blastapi.io',
      'https://1rpc.io/base',
      'https://base.meowrpc.com'
    ]
  },
  eth: {
    chainId: 1,
    name: 'Ethereum',
    explorer: 'https://etherscan.io',
    native: 'ETH',
    rpcs: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://1rpc.io/eth'
    ]
  },
  bnb: {
    chainId: 56,
    name: 'BNB Chain',
    explorer: 'https://bscscan.com',
    native: 'BNB',
    rpcs: [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
      'https://bsc.publicnode.com',
      'https://1rpc.io/bnb'
    ]
  },
  pol: {
    chainId: 137,
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    native: 'MATIC',
    rpcs: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon.llamarpc.com'
    ]
  },
  arb: {
    chainId: 42161,
    name: 'Arbitrum',
    explorer: 'https://arbiscan.io',
    native: 'ETH',
    rpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.llamarpc.com'
    ]
  },
  op: {
    chainId: 10,
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io',
    native: 'ETH',
    rpcs: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://optimism.llamarpc.com'
    ]
  },
  sol: {
    chainId: null,
    name: 'sol',
    explorer: 'https://solscan.io',
    native: 'SOL',
    kind: 'sol',
    rpcs: [
      'https://solana.drpc.org',
      'https://solana-rpc.publicnode.com',
      'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana',
      'https://1rpc.io/sol',
      'https://solana.public-rpc.com',
      'https://endpoints.omniatech.io/v1/sol/mainnet/public',
      'https://solana-mainnet.rpc.extrnode.com'
    ]
  }
};

// Sync RPC_CONFIG into NETWORKS if present
function applyRpcConfigToNetworks(){
  if(typeof NETWORKS === 'undefined') return;
  NETWORKS.forEach(function(n){
    var cfg = RPC_CONFIG[n.id];
    if(cfg){
      n.rpc = cfg.rpcs.slice();
      n.chainId = cfg.chainId;
      n.explorer = cfg.explorer;
      n.native = cfg.native;
    }
  });
}
try{ applyRpcConfigToNetworks(); }catch(e){}

var _provider = null;
var _providerNet = null;
var _rpcIndex = 0;

function getRpcList(){
  var id = state.network || 'base';
  try {
    if (typeof window.getRpcList === 'function' && window.getRpcList !== getRpcList) {
      // avoid recursion — window.getRpcList from core may exist
    }
  } catch (e) {}
  var cfg = RPC_CONFIG[id];
  if(cfg && cfg.rpcs) return cfg.rpcs.slice();
  if(typeof RPCS !== 'undefined' && RPCS && RPCS.length) return RPCS.slice();
  if (id === 'sol') {
    return (RPC_CONFIG.sol && RPC_CONFIG.sol.rpcs) ? RPC_CONFIG.sol.rpcs.slice() : [];
  }
  return RPC_CONFIG.base.rpcs.slice();
}

function getChainId(){
  var id = state.network || 'base';
  var cfg = RPC_CONFIG[id];
  if(cfg) return cfg.chainId;
  return typeof CHAIN_ID !== 'undefined' ? CHAIN_ID : 8453;
}

async function getProvider(force){
  var net = state.network || 'base';
  if(!force && _provider && _providerNet === net) return _provider;
  var list = getRpcList();
  var lastErr = null;
  for(var i = 0; i < list.length; i++){
    var idx = (_rpcIndex + i) % list.length;
    var url = list[idx];
    try{
      var p = new ethers.JsonRpcProvider(url, getChainId(), { staticNetwork: true });
      // quick health check
      var block = await Promise.race([
        p.getBlockNumber(),
        new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('timeout')); }, 4000); })
      ]);
      if(typeof block === 'number'){
        _provider = p;
        _providerNet = net;
        _rpcIndex = idx;
        RPCS = list;
        CHAIN_ID = getChainId();
        return p;
      }
    }catch(e){ lastErr = e; }
  }
  // last resort: first URL without check
  _provider = new ethers.JsonRpcProvider(list[0], getChainId(), { staticNetwork: true });
  _providerNet = net;
  return _provider;
}

async function getSigner(){
  if(state.hwType === 'ledger' || state.hwType === 'trezor'){
    throw new Error('Gunakan perangkat hardware untuk menandatangani');
  }
  var pk = state.privateKey;
  if(!pk && SecureStore && SecureStore._key){
    try{ pk = await SecureStore.get('pk'); }catch(e){}
  }
  if(!pk) pk = localStorage.getItem('br_pk') || localStorage.getItem('privateKey') || '';
  if(!pk) throw new Error('Private key tidak tersedia');
  var provider = await getProvider();
  return new ethers.Wallet(pk, provider);
}

async function web3GetBalance(address){
  var p = await getProvider();
  return p.getBalance(address);
}

async function web3GetTokenBalance(tokenAddress, owner, decimals){
  var p = await getProvider();
  var abi = ['function balanceOf(address) view returns (uint256)'];
  var c = new ethers.Contract(tokenAddress, abi, p);
  var bal = await c.balanceOf(owner);
  return Number(ethers.formatUnits(bal, decimals || 18));
}

async function web3SendNative(to, amountEth){
  showLoading('Mengirim transaksi…');
  try{
    var signer = await getSigner();
    var tx = await signer.sendTransaction({
      to: to,
      value: ethers.parseEther(String(amountEth))
    });
    showLoading('Menunggu konfirmasi…');
    var rec = await tx.wait();
    hideLoading();
    return rec;
  }catch(e){
    hideLoading();
    throw e;
  }
}

async function web3SendToken(tokenAddress, to, amount, decimals){
  showLoading('Mengirim token…');
  try{
    var signer = await getSigner();
    var abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    var c = new ethers.Contract(tokenAddress, abi, signer);
    var tx = await c.transfer(to, ethers.parseUnits(String(amount), decimals || 18));
    showLoading('Menunggu konfirmasi…');
    var rec = await tx.wait();
    hideLoading();
    return rec;
  }catch(e){
    hideLoading();
    throw e;
  }
}

async function web3EstimateGas(){
  try{
    var p = await getProvider();
    var fee = await p.getFeeData();
    return fee;
  }catch(e){ return null; }
}

// Inject ethereum provider shim for DApps (window.ethereum style)
function installWalletProvider(){
  if(window.ethereum && window.ethereum.isBaseRocky) return;
  var chainIdHex = '0x' + getChainId().toString(16);
  var provider = {
    isBaseRocky: true,
    isMetaMask: false,
    chainId: chainIdHex,
    networkVersion: String(getChainId()),
    selectedAddress: state.address || null,
    request: async function(args){
      var method = args.method;
      var params = args.params || [];
      if(method === 'eth_chainId') return '0x' + getChainId().toString(16);
      if(method === 'net_version') return String(getChainId());
      if(method === 'eth_accounts' || method === 'eth_requestAccounts'){
        if(!state.address) throw { code: 4001, message: 'No wallet' };
        return [state.address];
      }
      if(method === 'eth_getBalance'){
        var bal = await web3GetBalance(params[0]);
        return ethers.toBeHex(bal);
      }
      if(method === 'personal_sign' || method === 'eth_sign'){
        var signer = await getSigner();
        var msg = params[0];
        // personal_sign: [msg, address]
        if(method === 'personal_sign') msg = params[0];
        return signer.signMessage(ethers.getBytes(msg.startsWith('0x') ? msg : ethers.toUtf8Bytes(msg)));
      }
      if(method === 'eth_sendTransaction'){
        var txReq = params[0];
        var signer = await getSigner();
        showLoading('Konfirmasi transaksi…');
        try{
          var tx = await signer.sendTransaction({
            to: txReq.to,
            value: txReq.value || 0,
            data: txReq.data || '0x',
            gasLimit: txReq.gas || txReq.gasLimit
          });
          showLoading('Menunggu konfirmasi…');
          await tx.wait();
          hideLoading();
          return tx.hash;
        }catch(e){ hideLoading(); throw e; }
      }
      if(method === 'wallet_switchEthereumChain'){
        var cid = parseInt(params[0].chainId, 16);
        var found = Object.keys(RPC_CONFIG).find(function(k){ return RPC_CONFIG[k].chainId === cid; });
        if(found && typeof selectNetwork === 'function'){
          await selectNetwork(found);
          return null;
        }
        throw { code: 4902, message: 'Chain not supported' };
      }
      // fallback to rpc
      var p = await getProvider();
      return p.send(method, params);
    },
    on: function(){ return provider; },
    removeListener: function(){ return provider; }
  };
  window.ethereum = provider;
  window.baseRocky = provider;
}

// Enhance refresh with spinner
async function refresh(showSpin){ return refreshWeb3(showSpin); }
async function refreshBalances(showSpin){ return refreshWeb3(showSpin); }
async function refreshWeb3(showSpin){
  if(!state.address) return;
  if(showSpin) showLoading('Sinkronisasi saldo…');
  try{
    var p = await getProvider(true);
    var native = await p.getBalance(state.address);
    var nativeBal = Number(ethers.formatEther(native));
    var net = state.network || 'base';
    state.balances.ETH = nativeBal;
    if(net === 'bnb') state.balances.BNB = nativeBal;
    if(net === 'pol'){ state.balances.MATIC = nativeBal; state.balances.POL = nativeBal; }

    // token balances in parallel (limit 6 concurrent)
    var tokens = (state.tokens || []).filter(function(t){ return t.address; });
    var i = 0;
    async function next(){
      if(i >= tokens.length) return;
      var t = tokens[i++];
      try{
        state.balances[t.id] = await web3GetTokenBalance(t.address, state.address, t.decimals);
      }catch(e){}
      return next();
    }
    await Promise.all([next(), next(), next(), next()]);
    if(typeof fetchPrices === 'function') await fetchPrices();
    if(typeof renderHome === 'function') renderHome();
    if(typeof updateBerandaHeader === 'function') updateBerandaHeader();
  }catch(e){
    console.log('refreshWeb3', e);
    showToast('Gagal sinkron RPC');
  }finally{
    if(showSpin) hideLoading();
  }
}


/* ===== RPC Health Check + Auto Fallback ===== */
state.rpcHealth = {}; // url -> {ok, ms, at}
state.activeRpc = '';

function isSolRpcUrl(url){
  url = String(url || '').toLowerCase();
  if(/solana|\/sol\b|1rpc\.io\/sol|hellomoon|helius|triton\.one|extrnode|publicnode\.com\/\?.*sol/i.test(url)) return true;
  if((typeof state !== 'undefined') && state.network === 'sol') return true;
  return false;
}

async function pingRpc(url, timeoutMs){
  timeoutMs = timeoutMs || 4000;
  var t0 = Date.now();
  var sol = isSolRpcUrl(url);
  // Solana: try getSlot then getEpochInfo; EVM: eth_blockNumber
  var methods = sol
    ? [
        { method: 'getSlot', params: [] },
        { method: 'getEpochInfo', params: [] },
        { method: 'getVersion', params: [] }
      ]
    : [
        { method: 'eth_blockNumber', params: [] }
      ];

  var lastErr = 'fail';
  for (var mi = 0; mi < methods.length; mi++) {
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function(){ ctrl.abort(); }, timeoutMs);
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: methods[mi].method, params: methods[mi].params }),
        signal: ctrl.signal
      });
      clearTimeout(to);
      if (!res.ok) {
        lastErr = 'HTTP ' + res.status;
        continue;
      }
      var data = await res.json();
      if (data.error) {
        lastErr = data.error.message || 'rpc error';
        continue;
      }
      var ms = Date.now() - t0;
      return { ok: true, ms: ms, block: data.result, sol: sol };
    } catch (e) {
      lastErr = (e && e.message) || 'fail';
    }
  }
  return { ok: false, ms: Date.now() - t0, error: lastErr };
}

async function healthCheckAllRpc(netId){
  netId = netId || state.network || 'base';
  var cfg = (typeof RPC_CONFIG !== 'undefined' && RPC_CONFIG[netId]) ? RPC_CONFIG[netId] : null;
  var list = cfg ? cfg.rpcs.slice() : getRpcList();
  // Merge user custom RPCs (from RPC settings)
  try {
    if (typeof window.getRpcList === 'function') {
      var custom = window.getRpcList(netId) || [];
      custom.forEach(function (u) {
        if (u && list.indexOf(u) < 0) list.unshift(u);
      });
    }
  } catch (e) {}
  if (typeof showLoading === 'function') showLoading('Cek kesehatan RPC…');
  var results = [];
  await Promise.all(list.map(async function(url){
    var r = await pingRpc(url, 4500);
    state.rpcHealth[url] = { ok:r.ok, ms:r.ms, at:Date.now(), error:r.error };
    results.push({ url:url, ok:r.ok, ms:r.ms, error: r.error });
  }));
  if (typeof hideLoading === 'function') hideLoading();
  results.sort(function(a,b){
    if(a.ok !== b.ok) return a.ok ? -1 : 1;
    return a.ms - b.ms;
  });
  return results;
}

async function pickBestRpc(netId){
  netId = netId || state.network || 'base';
  var results = await healthCheckAllRpc(netId);
  var best = results.find(function(r){ return r.ok; });
  if(best){
    state.activeRpc = best.url;
    var list = results.map(function(r){ return r.url; });
    // put best first
    list = [best.url].concat(list.filter(function(u){ return u !== best.url; }));
    try { RPCS = list; } catch (e) {}
    _provider = null;
    _providerNet = null;
    _rpcIndex = 0;
    // Persist for Solana + EVM custom
    try {
      if (netId === 'sol' && typeof window.setCustomRpc === 'function') {
        window.setCustomRpc('sol', best.url);
      } else if (typeof RPC_CONFIG !== 'undefined' && RPC_CONFIG[netId]) {
        RPC_CONFIG[netId].rpcs = list;
      }
      localStorage.setItem('br_active_rpc_' + netId, best.url);
    } catch (e) {}
    return best;
  }
  return null;
}

/** Auto-select best RPC when switching network (especially Solana) */
async function autoSelectRpc(netId){
  netId = netId || state.network || 'base';
  try {
    var saved = localStorage.getItem('br_active_rpc_' + netId);
    if (saved) {
      var probe = await pingRpc(saved, 3000);
      if (probe.ok) {
        state.activeRpc = saved;
        return { url: saved, ms: probe.ms, ok: true };
      }
    }
  } catch (e) {}
  return pickBestRpc(netId);
}


async function getProviderWithFallback(force){
  var net = state.network || 'base';
  if(!force && _provider && _providerNet === net) return _provider;
  var list = getRpcList();
  // Prefer last known good
  if(state.activeRpc && list.indexOf(state.activeRpc) >= 0){
    list = [state.activeRpc].concat(list.filter(function(u){ return u !== state.activeRpc; }));
  }
  var lastErr = null;
  for(var i = 0; i < list.length; i++){
    var url = list[i];
    try{
      var ping = await pingRpc(url, 3000);
      state.rpcHealth[url] = { ok:ping.ok, ms:ping.ms, at:Date.now() };
      if(!ping.ok){ lastErr = new Error(ping.error||'ping fail'); continue; }
      var p = new ethers.JsonRpcProvider(url, getChainId(), { staticNetwork: true });
      var block = await Promise.race([
        p.getBlockNumber(),
        new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('timeout')); }, 3000); })
      ]);
      if(typeof block === 'number'){
        _provider = p;
        _providerNet = net;
        state.activeRpc = url;
        _rpcIndex = i;
        return p;
      }
    }catch(e){
      lastErr = e;
      state.rpcHealth[url] = { ok:false, ms:0, at:Date.now(), error:(e&&e.message)||'err' };
    }
  }
  // absolute fallback
  var fallback = list[0];
  _provider = new ethers.JsonRpcProvider(fallback, getChainId(), { staticNetwork: true });
  _providerNet = net;
  state.activeRpc = fallback;
  return _provider;
}

// Replace getProvider to use fallback version
async function getProvider(force){
  return getProviderWithFallback(force);
}

function openRpcHealth(){
  var net = state.network || 'base';
  var cfg = RPC_CONFIG[net];
  var html = '<h3>🩺 Status RPC</h3>';
  html += '<p class="hint">Jaringan: <b>'+(cfg?cfg.name:net)+'</b></p>';
  html += '<div id="rpcHealthBox" class="rpc-status"><div class="hd"><span>Memeriksa…</span><span class="inline-spin"></span></div></div>';
  html += '<button class="btn btn-primary" style="max-width:none;margin-top:12px" id="rpcRecheck">Periksa ulang & pilih terbaik</button>';
  openModal(html);
  runRpcHealthUI();
  var btn = document.getElementById('rpcRecheck');
  if(btn) btn.onclick = async function(){
    setBtnLoading(btn, true);
    await pickBestRpc(net);
    setBtnLoading(btn, false);
    runRpcHealthUI();
    showToast(state.activeRpc ? 'RPC aktif: '+state.activeRpc.replace(/^https?:\/\//,'') : 'Tidak ada RPC sehat');
  };
}

async function runRpcHealthUI(){
  var box = document.getElementById('rpcHealthBox');
  if(!box) return;
  var net = state.network || 'base';
  var results = await healthCheckAllRpc(net);
  var best = results.find(function(r){ return r.ok; });
  if(best) state.activeRpc = best.url;
  var hd = best
    ? '<span class="rpc-badge">● Online · '+best.ms+'ms</span>'
    : '<span class="rpc-badge bad">● Semua RPC gagal</span>';
  box.innerHTML = '<div class="hd"><span>Node</span>'+hd+'</div>' + results.map(function(r){
    var host = r.url.replace(/^https?:\/\//,'').split('/')[0];
    var dot = r.ok ? 'ok' : 'fail';
    var active = state.activeRpc === r.url ? ' <b style="color:var(--mint)">← aktif</b>' : '';
    return '<div class="rpc-row"><span class="dot '+dot+'"></span><span>'+host+active+'</span><span class="ms">'+(r.ok?r.ms+'ms':'fail')+'</span></div>';
  }).join('');
}




/* exports + auto RPC on Solana */
window.autoSelectRpc = typeof autoSelectRpc === 'function' ? autoSelectRpc : null;
window.pickBestRpc = pickBestRpc;
window.healthCheckAllRpc = healthCheckAllRpc;
window.pingRpc = pingRpc;
if (typeof openRpcHealth === 'function') window.openRpcHealth = openRpcHealth;

// When network is sol, auto-pick best RPC (non-blocking)
(function(){
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    if (typeof state === 'undefined') return;
    if (state.network === 'sol' && typeof autoSelectRpc === 'function' && !window._solRpcAutoDone) {
      window._solRpcAutoDone = true;
      autoSelectRpc('sol').then(function(best){
        if (best && best.url && typeof console !== 'undefined') {
          console.log('[RPC] Solana auto-selected', best.url, best.ms || '');
        }
        // R4 owns the single balance refresh after a network switch.
        // Do not refresh again from the RPC auto-selector.
      }).catch(function(){});
    }
    if (tries > 20) clearInterval(t);
  }, 500);
})();

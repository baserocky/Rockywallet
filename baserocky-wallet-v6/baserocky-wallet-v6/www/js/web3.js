/**
 * BaseRocky Web3 integration layer
 * - Ensures EIP-1193 / EIP-6963 provider is installed
 * - Connect external wallets (MetaMask, injected)
 * - Sync window.ethereum / window.baseRocky with state
 */
(function (global) {
  'use strict';

  function ensureInpageProvider() {
    try {
      if (typeof Web3Provider !== 'undefined' && Web3Provider.install) {
        return Web3Provider.install(false);
      }
      if (typeof installWalletProvider === 'function') {
        return installWalletProvider();
      }
    } catch (e) {
      console.warn('[Web3] ensureInpageProvider', e);
    }
    return global.baseRocky || global.ethereum || null;
  }

  async function connectInjected() {
    var eth = global.ethereum;
    if (!eth || typeof eth.request !== 'function') {
      if (typeof showToast === 'function') {
        showToast(
          (typeof I18N !== 'undefined' && I18N.getLang && I18N.getLang() === 'en')
            ? 'No injected wallet found'
            : 'Wallet eksternal tidak ditemukan',
          'warn'
        );
      }
      return null;
    }
    try {
      var accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        if (typeof state !== 'undefined') {
          state.externalAddress = accounts[0];
          state.externalProvider = eth;
        }
        if (typeof showToast === 'function') {
          showToast(
            ((typeof I18N !== 'undefined' && I18N.getLang && I18N.getLang() === 'en')
              ? 'Connected: '
              : 'Terhubung: ') + accounts[0].slice(0, 6) + '…',
            'success'
          );
        }
        try {
          if (typeof refreshBalances === 'function') refreshBalances(true);
        } catch (e) {}
        return accounts[0];
      }
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message || 'Connect failed', 'error');
    }
    return null;
  }

  async function switchToBase() {
    var eth = global.ethereum;
    if (!eth || !eth.request) return false;
    var chainId = '0x2105';
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }]
      });
      return true;
    } catch (e) {
      if (e && (e.code === 4902 || e.code === -32603)) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainId,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org']
            }]
          });
          return true;
        } catch (e2) {
          if (typeof showToast === 'function') showToast(e2.message || 'Add chain failed', 'error');
        }
      }
      return false;
    }
  }

  function status() {
    var p = global.baseRocky || global.ethereum;
    return {
      hasProvider: !!p,
      isBaseRocky: !!(p && p.isBaseRocky),
      selectedAddress: (p && (p.selectedAddress || (typeof state !== 'undefined' && state.address))) || null,
      chainId: p && p.chainId
    };
  }

  global.BRWeb3 = {
    ensure: ensureInpageProvider,
    connectInjected: connectInjected,
    switchToBase: switchToBase,
    status: status
  };

  function boot() {
    try {
      ensureInpageProvider();
      if (window.BR_DEBUG) console.log('%cBRWeb3 ready', 'color:#00D4AA;font-weight:bold', status());
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 200);
    });
  } else {
    setTimeout(boot, 200);
  }
})(typeof window !== 'undefined' ? window : this);

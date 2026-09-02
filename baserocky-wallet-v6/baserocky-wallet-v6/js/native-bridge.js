/**
 * BaseRocky Native Bridge
 * - Aman untuk browser biasa (web)
 * - Siap dipakai saat dibungkus Capacitor (Android/iOS)
 * - Tidak merusak struktur kode lama
 */
(function (global) {
  'use strict';

  var isNative = false;
  try {
    isNative = !!(
      global.Capacitor &&
      typeof global.Capacitor.isNativePlatform === 'function' &&
      global.Capacitor.isNativePlatform()
    );
  } catch (e) {}

  /**
   * Buka link eksternal (Uniswap, explorer, MoonPay, Twitter, dll.)
   * Di native → pakai Capacitor Browser plugin
   * Di web → window.open biasa
   */
  function openExternal(url) {
    if (!url) return;
    url = String(url);
    if (isNative && global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Browser) {
      global.Capacitor.Plugins.Browser.open({ url: url }).catch(function () {
        try { global.open(url, '_blank'); } catch (e) {}
      });
      return;
    }
    try {
      global.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      try { global.open(url, '_blank'); } catch (e2) {}
    }
  }

  /**
   * Salin teks ke clipboard
   */
  function copyText(text) {
    text = String(text || '');
    if (isNative && global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Clipboard) {
      return global.Capacitor.Plugins.Clipboard.write({ string: text });
    }
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Listen app masuk background / foreground (untuk auto-lock nanti)
   */
  function onAppStateChange(callback) {
    if (!isNative || !global.Capacitor || !global.Capacitor.Plugins || !global.Capacitor.Plugins.App) {
      return function () {};
    }
    var handle = global.Capacitor.Plugins.App.addListener('appStateChange', function (state) {
      try {
        callback(!!state.isActive);
      } catch (e) {}
    });
    return function () {
      if (handle && handle.remove) handle.remove();
    };
  }

  global.BRNative = {
    isNative: isNative,
    openExternal: openExternal,
    copyText: copyText,
    onAppStateChange: onAppStateChange
  };

  // Helper global supaya mudah dipanggil dari core.js
  global.brOpen = openExternal;

  // Auto-lock saat app masuk background (hanya di native Capacitor)
  // Tidak mengubah perilaku di browser biasa
  function setupAutoLockOnBackground() {
    onAppStateChange(function (isActive) {
      if (isActive) return;
      try {
        if (typeof lockWallet === 'function') {
          lockWallet();
        } else if (typeof requirePin === 'function' && state && state.address) {
          // fallback ringan: tampilkan pin overlay jika ada
          var ov = document.getElementById('pinOverlay');
          if (ov) ov.classList.add('show');
        }
      } catch (e) {}
    });
  }

  if (isNative) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(setupAutoLockOnBackground, 500);
      });
    } else {
      setTimeout(setupAutoLockOnBackground, 500);
    }
  }

  console.log('%cBRNative ready', 'color:#00D4AA;font-weight:bold', { isNative: isNative });
})(typeof window !== 'undefined' ? window : this);

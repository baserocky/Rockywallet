/**
 * BaseRocky Secure Storage helpers
 * AES-GCM + PBKDF2, plaintext scan & wipe, migration
 * Complements SecureStore in core.js
 */
(function (global) {
  'use strict';

  var SENSITIVE_KEYS = [
    'br_mnemonic',
    'mnemonic',
    'br_phrase',
    'br_pk',
    'privateKey',
    'br_private_key',
    'br_v4_mnemonic',
    'br_v4_pk',
    'br_pending_seed',
    'br_seed_plain',
    'br_seed',
    'br_temp_pk',
    'br_temp_mnemonic'
  ];

  var ENC_META_KEY = 'br_secure_meta_v1';
  var ENC_BLOB_KEY = 'br_secure_blob_v1';

  function b64encode(buf) {
    var bytes = new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function b64decode(str) {
    var s = atob(str);
    var bytes = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes.buffer;
  }

  var CryptoBox = {
    async deriveKeyFromPin(pin, salt, iterations) {
      iterations = iterations || 120000;
      var enc = new TextEncoder();
      var base = await crypto.subtle.importKey(
        'raw',
        enc.encode(String(pin)),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },

    async encrypt(key, text) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var data = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        new TextEncoder().encode(String(text))
      );
      var packed = new Uint8Array(iv.length + data.byteLength);
      packed.set(iv, 0);
      packed.set(new Uint8Array(data), iv.length);
      return b64encode(packed.buffer);
    },

    async decrypt(key, b64) {
      var packed = new Uint8Array(b64decode(b64));
      var iv = packed.slice(0, 12);
      var data = packed.slice(12);
      var plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      return new TextDecoder().decode(plain);
    }
  };

  function scanPlaintextSecrets() {
    var found = [];
    SENSITIVE_KEYS.forEach(function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v && String(v).length > 8) found.push(k);
      } catch (e) {}
    });
    try {
      var sess = sessionStorage.getItem('br_pending_seed');
      if (sess && sess.length > 8) found.push('session:br_pending_seed');
    } catch (e) {}
    // Scan multi-wallet list for embedded private keys / mnemonics
    try {
      var raw = localStorage.getItem('br_wallets_v3');
      if (raw) {
        var all = JSON.parse(raw);
        if (Array.isArray(all)) {
          all.forEach(function (w, i) {
            if (w && (w.privateKey || w.phrase || w.mnemonic || w.pk)) {
              found.push('br_wallets_v3[' + i + ']');
            }
          });
        }
      }
    } catch (e) {}
    try {
      var sk = localStorage.getItem('br_wallet_v3');
      if (sk) {
        var d = JSON.parse(sk);
        if (d && (d.privateKey || d.phrase || d.mnemonic)) found.push('br_wallet_v3');
      }
    } catch (e) {}
    return found;
  }

  function wipePlaintextSecrets() {
    var wiped = [];
    SENSITIVE_KEYS.forEach(function (k) {
      try {
        if (localStorage.getItem(k)) {
          localStorage.removeItem(k);
          wiped.push(k);
        }
      } catch (e) {}
    });
    try {
      if (sessionStorage.getItem('br_pending_seed')) {
        sessionStorage.removeItem('br_pending_seed');
        wiped.push('session:br_pending_seed');
      }
    } catch (e) {}
    // Strip secrets from multi-wallet list (keep public metadata)
    try {
      var raw = localStorage.getItem('br_wallets_v3');
      if (raw) {
        var all = JSON.parse(raw);
        if (Array.isArray(all)) {
          var changed = false;
          all = all.map(function (w) {
            if (!w || typeof w !== 'object') return w;
            if (w.privateKey || w.phrase || w.mnemonic || w.pk) {
              changed = true;
              return {
                address: w.address || null,
                name: w.name || 'Wallet',
                hasMnemonic: !!(w.hasMnemonic || w.phrase || w.mnemonic),
                encrypted: true,
                created: w.created || Date.now()
              };
            }
            return w;
          });
          if (changed) {
            localStorage.setItem('br_wallets_v3', JSON.stringify(all));
            wiped.push('br_wallets_v3:stripped');
          }
        }
      }
    } catch (e) {}
    // Strip single-wallet storage secrets
    try {
      var sk = localStorage.getItem('br_wallet_v3');
      if (sk) {
        var d = JSON.parse(sk);
        if (d && (d.privateKey || d.phrase || d.mnemonic || d.pk)) {
          localStorage.setItem(
            'br_wallet_v3',
            JSON.stringify({
              address: d.address || null,
              name: d.name || 'Wallet',
              hasMnemonic: !!(d.hasMnemonic || d.phrase || d.mnemonic),
              encrypted: true,
              created: d.created || Date.now()
            })
          );
          wiped.push('br_wallet_v3:stripped');
        }
      }
    } catch (e) {}
    return wiped;
  }

  function collectPlaintextPayload() {
    var payload = {};
    SENSITIVE_KEYS.forEach(function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v && String(v).length > 0) payload[k] = v;
      } catch (e) {}
    });
    // Single-wallet STORAGE_KEY may hold privateKey
    try {
      var sk = localStorage.getItem('br_wallet_v3');
      if (sk) {
        var d = JSON.parse(sk);
        if (d && d.privateKey) payload['__wallet_v3_pk'] = d.privateKey;
        if (d && d.phrase) payload['__wallet_v3_phrase'] = d.phrase;
        if (d && d.mnemonic) payload['__wallet_v3_mnemonic'] = d.mnemonic;
      }
    } catch (e) {}
    // Multi-wallet list secrets
    try {
      var raw = localStorage.getItem('br_wallets_v3');
      if (raw) {
        var all = JSON.parse(raw);
        if (Array.isArray(all)) {
          all.forEach(function (w, i) {
            if (!w) return;
            if (w.privateKey) payload['__wallets_v3_' + i + '_pk'] = w.privateKey;
            if (w.phrase) payload['__wallets_v3_' + i + '_phrase'] = w.phrase;
            if (w.mnemonic) payload['__wallets_v3_' + i + '_mnemonic'] = w.mnemonic;
            if (w.pk) payload['__wallets_v3_' + i + '_pk2'] = w.pk;
          });
        }
      }
    } catch (e) {}
    try {
      var sess = sessionStorage.getItem('br_pending_seed');
      if (sess) payload['session:br_pending_seed'] = sess;
    } catch (e) {}
    return payload;
  }

  async function migrateToEncrypted(pin) {
    if (!pin || String(pin).length < 4) throw new Error('PIN required');
    var payload = collectPlaintextPayload();

    // Merge with existing encrypted blob (keep old secrets if still needed)
    try {
      var existing = await unlockEncrypted(pin);
      if (existing && typeof existing === 'object') {
        Object.keys(existing).forEach(function (k) {
          if (payload[k] == null) payload[k] = existing[k];
        });
      }
    } catch (e) {
      // Wrong pin or no blob — start fresh from plaintext only
    }

    if (!Object.keys(payload).length) {
      // Still strip any residual shells
      var wipedEmpty = wipePlaintextSecrets();
      return { migrated: [], wiped: wipedEmpty, skipped: true };
    }

    var salt = crypto.getRandomValues(new Uint8Array(16));
    var key = await CryptoBox.deriveKeyFromPin(pin, salt, 120000);
    var blob = await CryptoBox.encrypt(key, JSON.stringify(payload));
    localStorage.setItem(
      ENC_META_KEY,
      JSON.stringify({
        v: 2,
        salt: b64encode(salt.buffer),
        iter: 120000,
        at: Date.now()
      })
    );
    localStorage.setItem(ENC_BLOB_KEY, blob);
    var wiped = wipePlaintextSecrets();
    // Also strip privateKey from br_wallet_v3 single slot
    try {
      var sk2 = localStorage.getItem('br_wallet_v3');
      if (sk2) {
        var d2 = JSON.parse(sk2);
        if (d2 && (d2.privateKey || d2.phrase || d2.mnemonic)) {
          localStorage.setItem(
            'br_wallet_v3',
            JSON.stringify({
              address: d2.address || null,
              name: d2.name || 'Wallet',
              hasMnemonic: !!(d2.hasMnemonic || d2.phrase || d2.mnemonic),
              encrypted: true,
              created: d2.created || Date.now()
            })
          );
          wiped.push('br_wallet_v3:stripped');
        }
      }
    } catch (e) {}
    return { migrated: Object.keys(payload), wiped: wiped, ok: true };
  }

  async function unlockEncrypted(pin) {
    var metaRaw = localStorage.getItem(ENC_META_KEY);
    var blob = localStorage.getItem(ENC_BLOB_KEY);
    if (!metaRaw || !blob) return null;
    var meta = JSON.parse(metaRaw);
    var salt = new Uint8Array(b64decode(meta.salt));
    var key = await CryptoBox.deriveKeyFromPin(pin, salt, meta.iter || 120000);
    var json = await CryptoBox.decrypt(key, blob);
    return JSON.parse(json);
  }

  function securityReport() {
    var plain = scanPlaintextSecrets();
    var hasEnc = !!(localStorage.getItem(ENC_BLOB_KEY) && localStorage.getItem(ENC_META_KEY));
    var pinOn = !!(
      localStorage.getItem('br_pin') ||
      localStorage.getItem('br_pin_hash') ||
      localStorage.getItem('br_pin_v6') ||
      localStorage.getItem('br_pin_hash_v3') ||
      localStorage.getItem('br_pin_verifier_v2')
    );
    return {
      plaintextKeys: plain,
      hasEncryptedBlob: hasEnc,
      pinEnabled: pinOn,
      safe: plain.length === 0
    };
  }

  /** Hook after PIN setup / unlock — migrate if plaintext remains */
  async function ensureSecureAfterPin(pin) {
    try {
      var found = scanPlaintextSecrets();
      if (!found.length) return { skipped: true, safe: true };
      var r = await migrateToEncrypted(pin);
      if (window.BR_DEBUG) console.log('%cSecure migrate', 'color:#00D4AA', r);
      // Push into SecureStore memory from encrypted blob (plaintext already wiped)
      try {
        if (typeof SecureStore !== 'undefined' && SecureStore.unlock) {
          await SecureStore.unlock(pin);
          var data = await unlockEncrypted(pin);
          if (data) {
            var mnemonic =
              data.br_mnemonic ||
              data.mnemonic ||
              data.br_phrase ||
              data.__wallet_v3_mnemonic ||
              data.__wallet_v3_phrase ||
              '';
            var pk =
              data.br_pk ||
              data.privateKey ||
              data.__wallet_v3_pk ||
              '';
            Object.keys(data).forEach(function (k) {
              if (!pk && /_pk/.test(k)) pk = data[k];
              if (!mnemonic && /(phrase|mnemonic)/.test(k)) mnemonic = data[k];
            });
            if ((mnemonic || pk) && SecureStore.setSensitive) {
              await SecureStore.setSensitive(mnemonic || '', pk || '');
            }
          }
        }
      } catch (e2) {
        if (window.BR_DEBUG) console.warn('SecureStore sync', e2);
      }
      return r;
    } catch (e) {
      console.warn('ensureSecureAfterPin', e);
      return { error: String(e && e.message || e) };
    }
  }

  /** Call after every successful PIN unlock */
  async function autoMigrateOnUnlock(pin) {
    if (!pin || String(pin).length < 4) return null;
    try {
      if (!scanPlaintextSecrets().length) return { safe: true };
      return await ensureSecureAfterPin(pin);
    } catch (e) {
      console.warn('autoMigrateOnUnlock', e);
      return null;
    }
  }

  // Periodic soft check — silent unless window.BR_DEBUG = true
  try {
    setTimeout(function () {
      if (!window.BR_DEBUG) return;
      var r = securityReport();
      if (!r.safe) {
        console.info(
          '[BaseRocky Security] Plaintext secrets in storage (set PIN to migrate):',
          r.plaintextKeys
        );
      }
    }, 2500);
  } catch (e) {}

  global.CryptoBox = global.CryptoBox || CryptoBox;
  global.SecureLocal = {
    CryptoBox: CryptoBox,
    scanPlaintextSecrets: scanPlaintextSecrets,
    wipePlaintextSecrets: wipePlaintextSecrets,
    migrateToEncrypted: migrateToEncrypted,
    unlockEncrypted: unlockEncrypted,
    securityReport: securityReport,
    ensureSecureAfterPin: ensureSecureAfterPin,
    autoMigrateOnUnlock: autoMigrateOnUnlock,
    collectPlaintextPayload: collectPlaintextPayload,
    SENSITIVE_KEYS: SENSITIVE_KEYS
  };

  if (window.BR_DEBUG) console.log('%cSecureLocal ready', 'color:#00D4AA;font-weight:bold');
})(typeof window !== 'undefined' ? window : this);

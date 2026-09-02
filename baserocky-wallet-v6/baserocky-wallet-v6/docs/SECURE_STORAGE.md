# Secure Storage — AES-GCM, SecureStore vs AsyncStorage

## AES-GCM di BaseRocky

```
PIN ──► PBKDF2 (SHA-256, 100k–120k iter, random salt)
          │
          ▼
     AES-GCM-256 key (non-extractable CryptoKey)
          │
          ├─ encrypt(plaintext) → [IV 12B][ciphertext+tag] → base64 → storage
          └─ decrypt(blob)      → plaintext
```

### Contoh enkripsi langsung

```js
// Derive key from PIN
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await CryptoBox.deriveKeyFromPin('123456', salt, 120000);

// Encrypt
const packedB64 = await CryptoBox.encrypt(key, 'seed phrase words ...');

// Decrypt
const plain = await CryptoBox.decrypt(key, packedB64);
```

### Contoh lewat SecureStore

```js
await SecureStore.unlock(pin);
await SecureStore.set('mnemonic', phrase);
await SecureStore.set('pk', privateKey);

const m = await SecureStore.get('mnemonic');
```

---

## SecureStore vs AsyncStorage

| | **AsyncStorage (RN)** | **SecureStore (model kita / expo-secure-store)** |
|--|----------------------|--------------------------------------------------|
| Platform | React Native | RN (Keychain/Keystore) atau Web (AES-GCM + PIN) |
| Enkripsi default | ❌ Tidak | ✅ Ya |
| Bergantung OS keystore | Tidak | Ya (native) / PIN-derived (web) |
| Cocok untuk seed/PK | ❌ Jangan plaintext | ✅ |
| Performa | Cepat | Sedikit lebih lambat (KDF + decrypt) |
| Backup OS | Kadang ikut backup | Sering tidak ikut iCloud/Play backup |

**Kesimpulan:**  
AsyncStorage ≈ `localStorage` (KV biasa).  
Jangan simpan seed/private key plaintext di AsyncStorage.  
Pakai SecureStore / Keychain / AES-GCM + PIN seperti `SecureStore` di proyek ini.

---

## Contoh migrasi

### 1) Web: plaintext localStorage → encrypted

```js
// Setelah user set PIN pertama kali:
const report = await SecureStore.migrateFromPlaintext(pin, { wipe: true });
// report.migrated → ['mnemonic','pk']
// report.skipped  → keys not found
// Plaintext keys dihapus otomatis
```

Atau helper ringkas:

```js
await migrateToEncrypted(pin);
```

### 2) React Native AsyncStorage → SecureStore

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store'; // native

async function migrateRnWallet(pin) {
  const keys = ['mnemonic', 'br_mnemonic', 'privateKey', 'br_pk', 'br_plain_mnemonic'];
  const pairs = await AsyncStorage.multiGet(keys);
  const map = Object.fromEntries(pairs);

  // Option A — bridge ke web SecureStore API (jika shared codebase)
  if (map.mnemonic || map.br_mnemonic) {
    localStorage.setItem('br_mnemonic', map.mnemonic || map.br_mnemonic);
  }
  if (map.privateKey || map.br_pk) {
    localStorage.setItem('br_pk', map.privateKey || map.br_pk);
  }
  const report = await SecureStore.migrateFromPlaintext(pin, { wipe: true });

  // Option B — native SecureStore
  // if (map.mnemonic) await SecureStore.setItemAsync('mnemonic', map.mnemonic);
  // if (map.privateKey) await SecureStore.setItemAsync('pk', map.privateKey);

  await AsyncStorage.multiRemove(keys);
  return report;
}
```

### 3) Session pending seed → encrypted session + SecureStore

```js
// Dulu (tidak aman):
// sessionStorage.setItem('br_pending_seed', phrase);

// Sekarang:
await SeedManager.setPhrase(phrase, { pendingBackup: true });
// ciphertext di sessionStorage; key hanya di RAM

// Setelah PIN:
await migrateToEncrypted(pin);
```

### 4) Verifikasi pasca-migrasi

```js
await SecureStore.unlock(pin);
const { mnemonic, pk } = await SecureStore.loadSensitive();
console.assert(mnemonic.split(' ').length === 12 || mnemonic.split(' ').length === 24);
// Pastikan legacy keys kosong:
console.assert(!localStorage.getItem('br_mnemonic'));
console.assert(!sessionStorage.getItem('br_pending_seed'));
```

---

## API ringkas

| API | Fungsi |
|-----|--------|
| `CryptoBox.deriveKeyFromPin(pin, salt, iter)` | PBKDF2 → AES key |
| `CryptoBox.encrypt(key, text)` | AES-GCM pack base64 |
| `CryptoBox.decrypt(key, b64)` | decrypt |
| `SecureStore.unlock(pin)` | derive + verify |
| `SecureStore.set/get` | encrypted KV |
| `SecureStore.migrateFromPlaintext(pin)` | migrasi + wipe |
| `migrateToEncrypted(pin)` | helper satu panggilan |
| `SeedManager.setPhrase` | session terenkripsi |

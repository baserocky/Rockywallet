# BaseRocky Wallet v6 — Dokumentasi Integrasi SDK

Dokumen ini menjelaskan SDK yang dipakai, cara integrasi, dan optimasi performa QR.

---

## 1. Daftar SDK

| SDK | Versi | CDN | Fungsi |
|-----|-------|-----|--------|
| **ethers.js** | 6.13.4 | jsDelivr | Wallet, provider, transaksi EVM |
| **qrcode** | 1.5.4 | jsDelivr | Fallback generator QR (canvas) |
| **qr-code-styling** | 1.9.2 | jsDelivr | QR modern (rounded dots, logo, corner style) |

### Script di `index.html`

```html
<script src="https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js" defer></script>
<script src="app.js" defer></script>
```

Semua script memakai atribut `defer` agar tidak memblokir parsing HTML.

---

## 2. Integrasi QR Code Modern

### API utama

```js
renderModernQR(hostId, data, opts)
```

| Param | Tipe | Keterangan |
|-------|------|------------|
| `hostId` | `string` | `id` elemen container (div kosong) |
| `data` | `string` | Payload QR (alamat wallet / URL referral) |
| `opts.size` | `number` | Ukuran px (default `200`) |
| `opts.dark` | `string` | Warna modul (default `#0a1628`) |
| `opts.light` | `string` | Warna latar (default `#ffffff`) |
| `opts.dotType` | `string` | `rounded` \| `dots` \| `classy` \| `square` |
| `opts.withLogo` | `boolean` | Sisipkan logo `LOGO` di tengah |
| `opts.cornerDot` | `string` | Warna titik sudut (mint) |
| `opts.ecl` | `string` | Error correction: `L` `M` `Q` `H` |
| `opts.margin` | `number` | Margin quiet zone |

### Helper lain

```js
preloadQR(hostId, data, opts)  // render di idle time
clearQR(hostId)                // bersihkan instance + DOM
```

### Contoh pemakaian

**Halaman Terima (alamat wallet):**

```js
renderModernQR('qrCanvasHost', state.address, {
  size: 200,
  withLogo: true,
  dark: '#0a1628',
  cornerDot: '#00c9a0',
  dotType: 'rounded',
  ecl: 'H'
});
```

**QR kecil di kartu share referral:**

```js
renderModernQR('refShareQrHost', getRefLink(), {
  size: 56,
  withLogo: false,
  margin: 2,
  ecl: 'M'
});
```

### Markup HTML yang dibutuhkan

```html
<!-- Receive -->
<div class="qr-wrap qr-wrap-modern">
  <div id="qrCanvasHost" class="qr-host"></div>
</div>

<!-- Share preview (kecil) -->
<div id="refShareQrHost" class="qr-host qr-host-sm"></div>
```

Jangan taruh `<canvas>` manual di host modern — library yang mengisi kontennya.

---

## 3. Optimasi Performa Rendering QR

Implementasi di `app.js` memakai beberapa teknik:

### 3.1 Skip render identik

Setiap render di-hash dari `data + size + warna + logo + ecl`.  
Jika hash sama dengan yang sudah ditampilkan di host tersebut, fungsi **langsung return** (0 kerja DOM).

### 3.2 Reuse instance `QRCodeStyling`

```js
// Pertama kali
qr = new QRCodeStyling(cfg);
qr.append(host);

// Berikutnya (data berubah)
qr.update(cfg);  // jauh lebih murah daripada new + append
```

### 3.3 Debounce 16ms

Panggilan beruntun ke host yang sama digabung dalam satu frame (~1 frame @60fps).

### 3.4 `requestAnimationFrame`

Append/update DOM dilakukan di dalam rAF agar selaras dengan frame browser dan mengurangi layout thrashing.

### 3.5 Cache fallback (qrcode → canvas)

Jika `QRCodeStyling` tidak tersedia, hasil `qrcode` disimpan sebagai `dataURL` (maks. 20 entri) sehingga scan ulang tidak menghitung ulang matrix.

### 3.6 Defer saat animasi sheet

Pada pratinjau share, QR baru dirender **setelah** animasi sheet mulai, supaya tidak memperebutkan main thread:

```js
requestAnimationFrame(function () {
  setTimeout(function () {
    renderModernQR('refShareQrHost', link, { size: 56, ... });
  }, 40);
});
```

### 3.7 Preload di idle

```js
preloadQR('qrCanvasHost', state.address, { size: 200, withLogo: true });
```

Memakai `requestIdleCallback` (fallback `setTimeout`) agar QR halaman Terima siap sebelum user membuka layar.

### 3.8 Bersihkan saat logout

```js
clearQR('qrCanvasHost');
clearQR('refShareQrHost');
```

---

## 4. Integrasi ethers.js (ringkas)

### Provider & wallet

```js
// Multi-RPC fallback (Base)
const provider = new ethers.JsonRpcProvider(rpcUrl, 8453);
const wallet = new ethers.Wallet(privateKey, provider);

// Atau dari mnemonic
const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);
```

### Kirim native / ERC-20

```js
// Native ETH
await signer.sendTransaction({ to, value: ethers.parseEther(amount) });

// ERC-20
const erc20 = new ethers.Contract(tokenAddress, [
  'function transfer(address,uint256) returns (bool)'
], signer);
await erc20.transfer(to, ethers.parseUnits(amount, decimals));
```

Simpan private key **hanya** di `localStorage` perangkat (non-custodial). Jangan kirim ke server.

---

## 5. Alur Referral + QR

```
Settings → Referral
  → openReferralCenter()
  → renderReferralCenter()          // stats, kode, tier
  → openRefSharePreview()           // sheet + QR kecil
  → renderModernQR('refShareQrHost', link, { size: 56 })

Receive
  → showScreen('receive')
  → renderReceive()
  → renderModernQR('qrCanvasHost', address, { size: 200, withLogo: true })
```

Link undangan: `{origin}{path}?ref=KODE`  
Kode di-generate deterministik dari alamat wallet (`generateRefCode`).

---

## 6. Offline / tanpa CDN

Untuk build production tanpa CDN:

1. Unduh file UMD:
   - `ethers.umd.min.js`
   - `qrcode.min.js`
   - `qr-code-styling.js`
2. Simpan di folder `vendor/`
3. Ganti path script di `index.html`:

```html
<script src="vendor/ethers.umd.min.js" defer></script>
<script src="vendor/qrcode.min.js" defer></script>
<script src="vendor/qr-code-styling.js" defer></script>
<script src="app.js" defer></script>
```

Pastikan global berikut tersedia sebelum `app.js` jalan:

- `ethers`
- `QRCode` (fallback)
- `QRCodeStyling` (utama)

---

## 7. Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| QR kosong | SDK belum load (`defer`) | Tunggu `DOMContentLoaded` + cek `typeof QRCodeStyling` |
| QR kotak klasik | `QRCodeStyling` gagal / blocked | Fallback `qrcode` otomatis aktif |
| Logo tidak muncul | `LOGO` belum terdefinisi | Pastikan konstanta `LOGO` (data URL) di `app.js` |
| Lag saat buka share | Render QR di thread animasi | Sudah di-defer 40ms pasca rAF |
| QR tidak update | Hash sama | Ubah `data` atau panggil `clearQR` dulu |

---

## 8. Lisensi SDK (ringkas)

- **ethers.js** — MIT  
- **qrcode** — MIT  
- **qr-code-styling** — MIT  

Cocok untuk produk komersial selama atribut lisensi MIT dipenuhi di distribusi source jika diwajibkan.

---

*BaseRocky Wallet v6 — dokumentasi integrasi SDK & optimasi QR*

---

## 9. Web3 Provider (EIP-1193 + EIP-6963)

BaseRocky meng-expose provider kompatibel DApp:

```js
window.ethereum          // EIP-1193
window.baseRocky         // alias
window.Web3Provider      // API helper
```

### Fitur

| Method | Keterangan |
|--------|------------|
| `eth_requestAccounts` | Minta akses akun |
| `eth_accounts` | Daftar akun aktif |
| `eth_chainId` / `net_version` | Chain ID (Base = `0x2105`) |
| `personal_sign` | Tanda tangan pesan |
| `eth_signTypedData_v4` | EIP-712 |
| `eth_sendTransaction` | Kirim tx (konfirmasi UI) |
| `eth_call` / `eth_estimateGas` / … | Proxy ke RPC |
| `wallet_switchEthereumChain` | Ganti network in-app |
| Events | `accountsChanged`, `chainChanged`, `connect` |

### Integrasi dari DApp

```js
// Modern
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

// ethers v6
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

### Helper

```js
Web3Provider.install(force?)
Web3Provider.getBrowserProvider()
Web3Provider.notifyAccountsChanged(accounts)
Web3Provider.notifyChainChanged(chainIdHex)
openWeb3Connect()   // UI: in-app / MetaMask / WC / Ledger
```

### Catatan

- Jika MetaMask sudah ter-inject, BaseRocky **tidak menimpa**-nya; provider tersedia di `window.baseRocky` dan EIP-6963.
- Mode external (`connectMetaMask`) meneruskan request ke provider browser.
- Mode in-app memakai private key lokal + RPC BaseRocky.


---

## 10. EIP-6963 Provider Discovery

BaseRocky mengumumkan diri ke DApp lewat **EIP-6963**:

```js
// Otomatis saat boot
EIP6963.install(window.ethereum)

// DApp meminta daftar wallet
window.dispatchEvent(new Event('eip6963:requestProvider'))

// BaseRocky merespons
window.addEventListener('eip6963:announceProvider', (e) => {
  console.log(e.detail.info)     // { uuid, name, icon, rdns }
  console.log(e.detail.provider) // EIP-1193 provider
})
```

### API

```js
EIP6963.install(provider)   // daftarkan & announce
EIP6963.announce()          // ulang announce
EIP6963.discover(timeoutMs) // temukan wallet lain (Promise)
EIP6963.getInfo()           // { uuid, name, icon, rdns }
```

`rdns`: `com.baserocky.wallet`

---

## 11. Manajemen Gas Otomatis (`GasManager`)

| Fitur | Keterangan |
|-------|------------|
| EIP-1559 | `maxFeePerGas` + `maxPriorityFeePerGas` |
| Legacy | `gasPrice` jika chain tidak 1559 |
| Speed | `slow` 0.9× · `normal` 1.0× · `fast` 1.25× |
| Buffer limit | estimateGas + ~15% |
| Cache fee | 12 detik per chain |

```js
// Bangun field gas lengkap
const gas = await GasManager.buildTxGas({
  from: address,
  to: recipient,
  value: 0n,
  data: '0x'
}, { speed: 'fast' })

// gas.gasLimit, gas.maxFeePerGas, gas.maxPriorityFeePerGas
// gas.estimatedCostWei, gas.eip1559, gas.speed

GasManager.formatCost(gas)        // "~0.000021 ETH ($0.04)"
GasManager.refreshSendGasUI()     // update layar Kirim
GasManager.clearCache()
```

Preferensi speed disimpan di `localStorage` (`br_gas_pref`) — UI **Preferensi Gas** di Settings.

---

## 12. Modul Signer (`RockySigner`)

Prioritas signer:
1. MetaMask / injected external  
2. WalletConnect external  
3. In-app `ethers.Wallet` (local key)

```js
// Signer ethers v6
const signer = await RockySigner.getEthersSigner()

// Personal sign
const sig = await RockySigner.signMessage('Hello BaseRocky')

// EIP-712
const sig2 = await RockySigner.signTypedData(domain, types, value)

// Kirim tx + auto gas + konfirmasi
const tx = await RockySigner.sendTransaction({
  to: '0x…',
  value: ethers.parseEther('0.01')
})

// Transfer native / ERC-20
await RockySigner.transfer(tokenObj, toAddress, '1.5')

// Alamat aktif
const addr = await RockySigner.getAddress()
```

`sendTx()` di layar **Kirim** memakai `RockySigner.transfer` + `GasManager` secara otomatis.


---

## 13. Estimasi Gas Teroptimasi

`GasManager.estimateLimitOptimized` memakai:

1. **Cache 30 detik** per `(from, to, selector, value)`
2. `provider.estimateGas` (+ retry tanpa `value` untuk ERC-20)
3. **Heuristic selector**: `transfer` 65k · `approve` 55k · generic 150k
4. **Buffer** 12% (simple) / 20% (kontrak)
5. Cap 5,000,000 gas

```js
const limit = await GasManager.estimateLimitOptimized({
  from, to, data, value
})
await GasManager.warmup()       // prefetch fee data
GasManager.clearLimitCache()
```

`buildTxGas` otomatis memakai estimator ini.

---

## 14. ENS (Ethereum Name Service)

Resolusi lewat **Ethereum mainnet** RPC (ENS registry di L1).

```js
// Nama → alamat
await ENS.resolve('vitalik.eth')
// → 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

// Alamat → nama primary
await ENS.lookup('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
// → vitalik.eth

// Input campuran
await ENS.resolveInput('vitalik.eth')
// → { address, ensName, input }

ENS.resolveInputDebounced(val, callback, 400)
```

**UI Kirim:** field penerima menerima `0x…` atau `nama.eth`.  
Hint menampilkan hasil resolve / reverse lookup.

---

## 15. Contoh Transaksi (`TxExamples`)

Jalankan di konsol browser:

```js
// Demo ENS + gas
await TxExamples.runDemo()

// Native transfer (ENS didukung)
await TxExamples.sendNative('vitalik.eth', '0.001')

// ERC-20 transfer
await TxExamples.sendERC20(
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  'nama.eth',
  '1.5',
  6
)

// Approve max
await TxExamples.approve(tokenAddress, spenderAddress, 'max', 18)

// Personal sign
await TxExamples.signLogin('Login to MyDApp')

// EIP-712
await TxExamples.signTypedMail('Alice', 'Bob', 'Hello')
```

Semua pengiriman memakai `RockySigner` + gas otomatis + konfirmasi pengguna.


---

## 16. Enkripsi PIN (`PinCrypto`)

PIN tidak hanya di-hash — dipakai untuk **derivasi kunci AES-GCM**:

| Langkah | Detail |
|---------|--------|
| KDF | PBKDF2 · SHA-256 · **120.000 iterasi** · salt 16 byte |
| Cipher | AES-GCM 256-bit · IV 12 byte per payload |
| Verifier | Ciphertext `baserocky-pin-ok-v2` di `br_pin_verifier_v2` |
| Secrets | Seed / private key lewat `SecureStore` terenkripsi |

```js
await PinCrypto.setup('123456')     // atur PIN + enkripsi
await PinCrypto.verify('123456')    // true/false + buka sesi
await PinCrypto.encryptSecret('note', 'data')
await PinCrypto.decryptSecret('note')
PinCrypto.lock()                    // hapus kunci dari memori
PinCrypto.isEncrypted()             // boolean
```

Sesi kunci hanya di RAM (`PinCrypto._sessionKey`). Auto-lock memanggil `lock()`.

---

## 17. Autentikasi biometrik (`Biometric`)

Memakai **WebAuthn** + platform authenticator (Touch ID, Face ID, Windows Hello, sidik jari Android).

```js
Biometric.supported()           // browser support
await Biometric.platformAvailable()
await Biometric.register(userId)
await Biometric.authenticate()
Biometric.isEnabled()
Biometric.disable()
await tryBiometricUnlock()      // untuk layar kunci
```

- Credential disimpan di `localStorage` (`br_webauthn_cred`) — hanya ID; private key credential tetap di secure enclave perangkat.
- PIN tetap wajib untuk dekripsi data sensitif; biometrik membuka UI / sesi aplikasi.
- Settings → Keamanan → **Biometrik**.

**Syarat:** HTTPS (atau localhost), perangkat dengan platform authenticator.



---

## 18. Adaptive PBKDF2 (`CryptoTune`)

Iterasi PBKDF2 dikalibrasi per perangkat:

| Parameter | Nilai |
|-----------|--------|
| Target latency | ~280 ms |
| Minimum | 80.000 |
| Maksimum | 600.000 |
| Default | 120.000 |
| Sample | 40.000 iterasi |

```js
await CryptoTune.calibrate()   // benchmark & cache
CryptoTune.getIterations()     // iterasi aktif
```

Hasil disimpan di `localStorage` (`br_pbkdf2_iters_v1`) agar tidak diukur ulang setiap buka app.

---

## 19. Enkripsi End-to-End (`E2EVault`)

Saat PIN aktif, private key & seed **tidak disimpan plaintext**:

1. `SecureStore` — AES-GCM per field (`mnemonic`, `pk`)
2. `E2EVault` — blob wallet terenkripsi (`br_vault_e2e_v1`)
3. `STORAGE_KEY` — hanya shell publik (`address`, `name`, `encrypted: true`)

```js
await E2EVault.securePersist()          // simpan terenkripsi
await E2EVault.secureLoad(pin)          // muat & dekripsi
await E2EVault.encryptWalletPayload(obj, pin)
await E2EVault.decryptWalletPayload(pin)
E2EVault.hasVault()
E2EVault.clear()
```

`persistWallet()` otomatis memakai jalur E2E jika sesi PIN terbuka.  
Legacy plaintext hanya dipakai jika PIN belum diatur.


---

## 20. Validasi Input (`InputValidator`)

```js
InputValidator.isAddress(v)
InputValidator.isPrivateKey(v)
InputValidator.normalizePrivateKey(v)
InputValidator.isEmail(v)
InputValidator.isPin(v)              // 6 digit
InputValidator.isPositiveAmount(v, decimals?)
InputValidator.field('address'|'privateKey'|'email'|'pin'|'amount'|'name', value, opts)
// → { ok, error, value }
```

---

## 21. Validasi Seed Phrase (`SeedValidator`)

BIP39 via `ethers` (checksum) + cek jumlah kata:

```js
SeedValidator.validate(phrase)
// → { ok, error, words, invalidWords, phrase }

SeedValidator.analyzeLive(phrase)
// → { count, countOk, valid, error, details }
```

Jumlah kata sah: 12 / 15 / 18 / 21 / 24.  
Layar import menampilkan hint live saat mengetik.

---

## 22. MPC / Keyless Wallet (`MPCWallet`)

Model **client-side 3-share** (XOR):

| Share | Peran |
|-------|--------|
| Device | Tersimpan di `localStorage` |
| Cloud | Slot lokal (simulasi cloud) |
| Recovery | Ditampilkan sekali — wajib di-backup user |

```js
const { address, recoveryShare, wallet } = await MPCWallet.create(email, pin)
const w = await MPCWallet.unlock(email, pin, recoveryShare)
MPCWallet.hasVault()
MPCWallet.getMeta()
```

UI: **Import → Dompet tanpa kunci** atau `openMpcCreate()` / `openMpcUnlock()`.

> Catatan: ini MPC-style lokal untuk UX keyless, bukan jaringan MPC terdesentralisasi. Recovery share = faktor kritis.


---

## 23. ClipboardKit — API alternatif & debug izin

Urutan baca clipboard:

1. `navigator.clipboard.readText()`
2. `navigator.clipboard.read()` + `ClipboardItem` (`text/plain`)
3. `document.execCommand('paste')` (legacy)
4. Modal tempel manual + event `paste`

```js
await ClipboardKit.readText()
await ClipboardKit.writeText('hello')
await ClipboardKit.pasteInto('#importPhrase')
await ClipboardKit.diagnostics()
ClipboardKit.showClipboardDebug()
```

### Diagnostik
| Field | Arti |
|-------|------|
| `secureContext` | `true` hanya di HTTPS / localhost |
| `permission.state` | `granted` / `denied` / `prompt` / `unsupported-query` |
| `mobile` | Deteksi UA mobile |
| `lastError` / `lastMethod` | Hasil upaya terakhir |

### Tips mobile
- iOS Safari sering **menolak** baca clipboard tanpa gesture + kadang sama sekali
- Android Chrome: butuh HTTPS; izin bisa `prompt` lalu `denied`
- File dibuka sebagai `file://` → clipboard API tidak tersedia → selalu fallback manual


---

## 24. SecureClipboard — fallback manual & keamanan

### Fallback tempel manual
Tidak bergantung izin clipboard OS:

```js
await SecureClipboard.openManualPaste({ sensitive: true })
await SecureClipboard.securePasteInto('#importPhrase', { sensitive: true })
await SecureClipboard.secureCopy(secret, { sensitive: true })
```

Alur `securePasteInto`:
1. Coba baca clipboard (ClipboardKit)
2. Jika gagal → modal tempel manual (`paste` event + textarea)
3. Opsi hapus field setelah dipakai

### Praktik keamanan web
| Risiko | Mitigasi di BaseRocky |
|--------|------------------------|
| Seed di clipboard history OS | Peringatan UI; opsi clear field |
| Log / analytics bocor | Nilai sensitif **tidak** di-`console.log` |
| `file://` tanpa secure context | Fallback manual selalu tersedia |
| Password manager autofill | `autocomplete=off` + `data-lpignore` |
| Shoulder surfing | Field bisa dikosongkan setelah pakai |

```js
SecureClipboard.looksSensitive(text)  // deteksi seed / pk
openClipboardSecurityInfo()           // tips di UI
```

> Menghapus isi clipboard OS (`writeText('')`) sering **diblokir** browser — jangan diandalkan sebagai kontrol keamanan tunggal.


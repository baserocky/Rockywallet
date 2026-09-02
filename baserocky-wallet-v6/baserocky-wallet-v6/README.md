# BaseRocky Wallet v6.7.1

Non-custodial web wallet focused on **Base Network**, with Bitget-style UI/UX.

Pure HTML / CSS / JavaScript — no build step required.  
Works in Chrome / Brave / Edge, and mobile browsers (e.g. Acode localhost).

---

## Quick Start

1. Extract this folder  
2. Open `index.html` in Chrome / Brave / Edge  
   (or serve with `npx serve .` / Live Server / Acode)  
3. Create a new wallet or import seed / private key  
4. Set a **PIN** (recommended — enables encryption)

### Cache note

Scripts use a query string (`?v=…`). After updating files, do a **hard refresh** or close the tab so the new JS is loaded.

---

## Project Structure

```
baserocky-wallet-v6/
├── index.html              # App shell & all screens
├── styles.css              # Theme, layout, Bitget polish (light/dark)
├── app.js                  # Legacy stub (do not add logic here)
├── README.md               # This file
├── FIXES.md                # Recent bugfix notes
├── js/
│   ├── config.js           # LOGO, tokens, NETWORKS, NET_TOKENS, state
│   ├── i18n.js             # Full ID / EN dictionary + DOM apply + RTL
│   ├── secure.js           # AES-GCM helpers, plaintext scan / wipe / migrate
│   ├── ui.js               # showScreen, toast, modal, navigation
│   ├── network.js          # RPC config, provider, failover
│   ├── native-bridge.js    # Capacitor / mobile bridge
│   ├── discover.js         # DApp list & Discover UI (Bitget-style)
│   ├── core.js             # Main logic (wallet, transfer, swap, security, market…)
│   └── web3.js             # EIP-1193 / EIP-6963 + external connect
└── docs/
    ├── SDK_INTEGRATION.md
    ├── SECURE_STORAGE.md
    ├── VALIDATION_API.md
    └── I18N.md
```

### Required Script Load Order

1. CDN: `ethers@6.13.4` · `qrcode@1.5.4` · `qr-code-styling@1.9.2`  
2. `js/config.js`  
3. `js/i18n.js`  
4. `js/secure.js`  
5. `js/ui.js`  
6. `js/network.js`  
7. `js/native-bridge.js`  
8. `js/core.js`  
9. `js/web3.js`  
10. `js/discover.js`

---

## Features

### 1. Core Wallet
- Create wallet (BIP-39 12/24 words) + seed confirmation flow
- Import via seed phrase or private key
- Multi-wallet support (switch, rename, manage)
- PIN lock / unlock / change PIN
- Backup guide + full wipe
- Watch-only / external address support

### 2. Networks
- **Primary**: Base (chainId 8453)
- **EVM**: Ethereum, BNB Chain, Polygon, Arbitrum, Optimism
- Multi-RPC failover per chain
- Network picker with search
- **Solana**: UI + token list + balance refresh (experimental; swap via Jupiter UI path)
- Other non-EVM (Tron, Sui, …): listed in UI only

### 3. Tokens & Balance
- Per-network default token lists (`NET_TOKENS`)
- Zero-balance defaults still shown (core tokens)
- Empty-balance tip (“Saldo masih kosong”) — single tip, network-aware
- Custom tokens + hide / manage tokens
- Price feeds (CoinGecko / Binance / DexScreener fallbacks)

### 4. Transfer & Swap
- Send native + ERC-20 (EVM)
- Gas selector / estimates
- Swap UI (Uniswap path on Base; Jupiter path on Solana UI)
- Address book

### 5. UX / UI
- Bitget-inspired home (actions, feature cards, token list)
- Light / dark theme
- Indonesian + English i18n
- Preferences page
- Discover / DApp browser entry
- Pull-to-refresh, toasts, modals

### 6. Security
- PIN with unified verify (legacy hash + PinCrypto PBKDF2)
- Optional AES-GCM encrypted storage (`SecureLocal` / `SecureStore`)
- Boot-time plaintext scrub where possible
- XSS-conscious escaping on token / list rendering

---

## Debug Console

By default the console is **quiet** (no green “loaded / ready” spam).

```js
// Enable diagnostic logs
BR_DEBUG = true
// then refresh the page
```

Useful helpers:

```js
ensureHomeTokenList('manual')   // force paint token rows
SecureLocal.securityReport()    // plaintext keys check
SecureLocal.wipePlaintextSecrets()
```

---

## Security Quick API

```js
SecureLocal.securityReport();               // { plaintextKeys, safe, … }
SecureLocal.wipePlaintextSecrets();
await SecureLocal.migrateToEncrypted(pin);
await SecureLocal.ensureSecureAfterPin(pin);

await SecureStore.unlock(pin);
await SecureStore.set('mnemonic', phrase);
const m = await SecureStore.get('mnemonic');
```

Sensitive keys scanned:  
`br_mnemonic`, `mnemonic`, `br_pk`, `privateKey`, `br_v4_*`, session pending seed, etc.

Full details → `docs/SECURE_STORAGE.md`.

---

## Stack

| Library         | Version | Purpose               |
|-----------------|---------|-----------------------|
| ethers.js       | 6.13.4  | Wallet, provider, txs |
| qrcode          | 1.5.4   | Fallback QR           |
| qr-code-styling | 1.9.2   | Styled QR + logo      |

No bundler required for end users.

---

## Changelog (recent)

### v6.7.1-fix10c — Solana Buffer polyfill
- Fix `Buffer is not defined` when sending SOL in browser/Acode
- Load `buffer@6` before `@solana/web3.js`

### v6.7.1-fix10b — Solana address + RPC + token click
- Accept Solana base58 addresses in transfer UI (not only 0x)
- Fix invalid custom RPC (`br_sol_rpc_v1`)
- Solana token rows open Send on tap

### v6.7.1-fix10 — Solana Send
- Native SOL transfer + SPL (when library loads)
- Send screen uses Solana address validation on `sol` network

### v6.7.1-fix9 — Unified PIN
- One setup/verify path (PinCrypto v2); legacy hashes read-only then upgraded
- `PinAuth.setup / verify / hasPin`

### v6.7.1-fix8 — Auto-migrate secrets
- On PIN setup/unlock: encrypt leftover seed/PK, strip plaintext from localStorage
- Restore wallet into session from encrypted blob / SecureStore
- Multi-wallet shells stay public-only

### v6.7.1-fix7 — Quiet console
- `BR_DEBUG` flag (default `false`)
- Styled boot banners and diagnostic logs gated
- Plaintext security warning no longer floods the console

### v6.7.1-fix6 — Token list always visible
- `#tokenList` recreated if missing from DOM (`ensureTokenListEl`)
- Boot paint uses the same path as network switch (`applyNetworkUi` → `paintTokenRows`)
- Fixes empty home after first open / tab resume (esp. Acode localhost)

### v6.7.1-fix5 — Boot paint path
- `ensureHomeTokenList` + `goDefaultHomePage` call `applyNetworkUi`
- Force-paint rows when list is empty

### v6.7.1-fix3 / fix4 — Network tokens on boot
- `loadWallet` no longer overwrites network tokens with Base `DEFAULT_TOKENS`
- Shell-only wallet restore (address without plaintext key)
- Solana resume debounce (stops rapid refresh loops)

### v6.7.1-fix1 / fix2 — PIN + empty tip
- Unified PIN verify (change PIN works)
- Single “Saldo masih kosong” tip; Solana-specific tip rewrite scoped
- Duplicate function cleanup (safe overrides kept)

### v6.7.1
- Security consolidation, i18n, SecureLocal, Preferences, Discover polish

---

## Known Limitations

- `core.js` is large and layered (many historical patches). Prefer targeted fixes over broad rewrites.
- Solana is **UI + balance oriented**; full signing / swap execution is experimental.
- Ledger / Trezor / WalletConnect paths may be incomplete — treat as experimental.
- For production, migrate all secrets behind PIN encryption and avoid plaintext keys in `localStorage`.

---

## Recommended Next Steps

**High priority**
1. Split `core.js` into modules (wallet, transfer, swap, history, security, market)
2. Real swap aggregator (Odos / 1inch / Aerodrome) with Uniswap fallback
3. Auto-migrate plaintext secrets when PIN is already set

**Medium priority**
4. On-ramp integration (MoonPay / TransFi)
5. Custom network (RPC + chainId)
6. Multi-chain portfolio overview

**Nice to have**
7. Full Solana / Tron / Sui support
8. Stronger Content Security Policy
9. Encrypted export / import between devices

---

## License

Application code: project-specific.  
Third-party SDKs (ethers, qrcode, qr-code-styling): MIT.

---

**BaseRocky Wallet** — Built for the Base ecosystem.


## Solana

- Network id: `sol` (experimental but send SOL supported)
- In-app Solana keypair is stored only as PIN-encrypted `br_sec_sol_secret_v1`; `exportSolanaSecret()` is an explicit manual backup action
- **Send native SOL:** works via `@solana/web3.js` + Buffer polyfill
- **SPL tokens:** best-effort if `@solana/spl-token` CDN loads
- Address format: base58 (32–44 chars), **not** `0x…`
- Receive: switch network to Solana → Receive → copy address → fund from exchange
- Test send:
  ```js
  sendSolanaNative('DEST_BASE58', '0.001').then(console.log).catch(console.error)
  ```
- Custom RPC (optional):
  ```js
  localStorage.setItem('br_sol_rpc_v1', 'https://solana-rpc.publicnode.com')
  ```

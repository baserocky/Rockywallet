# BaseRocky Wallet v6.7.1 — Fix summary

## fix24 — Vault decrypt sessionKey mismatch
- Root: securePersist encrypted with PinCrypto._sessionKey but decrypt used PBKDF2(pin, meta.salt)
- Now: PinCrypto.verify(pin) → decrypt with _sessionKey, then PBKDF2 fallback
- New persist prefers encryptWalletPayload(payload, pin)

## fix23 — Vault key mismatch (br_e2e_vault)
- E2EVault only read `br_vault_e2e_v1`; device had data in `br_e2e_vault`
- Multi-key decrypt + phrase-only payloads
- viewSeedPhrase uses brLoadSecretsWithPin / restoreWalletAfterPin
- Debug: `brVaultDebug()`

## fix22 — Seed empty after PIN unlock
- Cause: shell-only storage when PIN on; session SeedManager key dies on reload
- On PIN verify/unlock: E2EVault.secureLoad + SecureStore + SeedManager.setPhrase
- viewSeedPhrase loads secrets with `state._lastPin` before resolve
- Clearer toast if hasMnemonic flag vs PK-only wallet

## fix21 — Tron/Sui · LOGO · hydrate · PIN buffer · z-index
- Tron/Sui: badge Segera hadir + block selectNetwork
- LOGO in config.js → icon-192.png (~60KB saved)
- brHydrateSecretsAfterPin after unlock/verify (seed + PK)
- pinBuffer/_pinBuf kept in sync on pinKeyPress + handlePinComplete
- CSS z-index scale: nav < sheet < modal < createFlow < PIN < toast

## fix20 — showPrivateKey (priority 2)
- PIN gate via requirePin
- Resolve PK: wallet → state → SecureStore → legacy LS → derive from mnemonic
- UI minimal: peringatan + key + Salin + Tutup (no nested account sheet)
- Safe copy (no PK in onclick attribute)

## fix19 — removePin complete + modal confirm
- Bug: toast PIN dihapus but `br_pin_sha256` / `br_pin_enabled` left → still PIN aktif
- Wipe all PIN storage keys (sha256, verifier, enabled, legacy, salts, kdf)
- Replace `window.confirm` with in-app modal (Batal / Hapus)
- Refresh Security center after delete

## fix18 — PIN P1+P4 (hasPin + requirePin uniform)
- `brHasPin()`: one key list including `br_pin_sha256`, verifier v2, legacy hashes, PIN_KEY
- `requirePin(cb)`: uses `brHasPin` — no longer skips when only final-controller PIN exists
- Clears both `pinBuffer` and `_pinBuf`; sets both pinMode fields
- `PinAuth.hasPin` → `brHasPin`

## fix17 — View seed phrase full-screen (settings)
- Tidak pakai modal di atas sheet (sumber lag/bug Acode)
- PIN → tutup overlay →  dengan grid kata
- Tombol hanya: Salin + Kembali (ke home / security center)
- Resolve phrase multi-sumber tetap

## fix16 — View seed phrase minimal
- UI only: grid kata + Salin + Tutup
- Hapus: tandai backup, kembali ke account manage, tombol ekstra
- Tetap: PIN gate + resolve phrase multi-sumber

## fix15 — View seed phrase reliable + less lag
- Resolve phrase: SeedManager → state → wallet.mnemonic → SecureStore → legacy keys
- Copy button no longer embeds phrase in HTML onclick (safer + no broken quotes)
- PIN then async reveal; yield to UI so Acode feels less laggy
- Clear message if seed only existed as private-key import

## fix14 — Unify Create Wallet flow
- Single `window.createWallet`: Bitget animation if available, else classic
- After success, **Continue → seed backup screen** (not home / skip)
- PIN step skip also goes to seed — backup wajib sebelum home
- Re-bind onboard buttons late (survives other patches)
- `openCreateWalletSheet` falls back to create if sheet DOM missing

## fix13 — Canonical refreshBalances
- Register best EVM implementation as `window.__brRefreshEvmBalances` (cache + dedupe + parallel ERC20)
- Final dispatcher at end of core.js: single entry, global inflight dedupe
- Route: `network === sol` → `refreshSolanaBalances`; else → `__brRefreshEvmBalances`
- Alias `window.refresh = refreshBalances`
- Does not remove historical patches (safe); last-wins path is now explicit and stable

## fix12 — Replace inline base64 logos with icon-192.png
- Removed 4× ~47KB data-URI PNG embeds from index.html
- All point to `icon-192.png` (avatar, brand, beranda logo, help icon)
- index.html ~290KB → ~98KB (saves ~190KB); faster load on Acode/mobile

## fix11 — DOM: seed confirm screen + empty tip host
- Add `#screen-confirm-seed` with `confirmWordNum`, `confirmSteps`, `confirmOptions`, `confirmNextBtn`
- Fixes broken flow after `startSeedConfirm()` → `showScreen('confirm-seed')` (screen was missing)
- Add static `#brEmptyTip` under `#homeScroll` so tip rewrite / stripDupTips has a stable host
- CSS: `.confirm-steps`, `.br-empty-tip`

## fix1 — PIN + tip
- Unified PIN verify (input sometimes wrong)
- Change PIN works
- Empty balance tip dedupe (initial)

## fix2 — Solana tip double text
- Scoped tip rewrite to #brEmptyTip
- Stronger stripDupTips

## fix3 — Boot tokens + Solana refresh spam
- loadWallet uses loadNetworkTokens (not Base DEFAULT_TOKENS only)
- goDefaultHomePage paints tokens
- refreshBalances paints on RPC error
- Solana onResume debounced

## fix4 — Token list empty on first open
- Shell-only wallet restore
- renderHome loads tokens before empty-state
- ensureHomeTokenList boot helper
- Cache bust

## fix5 — Paint path = network switch path
- ensureHomeTokenList → applyNetworkUi → paintTokenRows
- Force-paint DOM if still empty

## fix6 — #tokenList missing from DOM
- ensureTokenListEl() recreates #tokenList under #homeScroll
- renderHome / paintTokenRows use it
- modalBox null-safe

## fix7 — Quiet console
- window.BR_DEBUG = false by default
- Boot banners / diagnostic logs gated
- Plaintext security warn silent unless BR_DEBUG

Enable debug: `BR_DEBUG = true` then refresh.

## fix8 — Auto-migrate plaintext secrets
- Expanded SENSITIVE_KEYS + scan multi-wallet / br_wallet_v3
- migrateToEncrypted merges existing blob + strips all plaintext
- brAutoMigrateSecrets on PIN setup + unlock
- brRestoreWalletFromSecure so session keeps working after wipe
- Toast: "Rahasia wallet dienkripsi" when migration runs

## fix9 — Unified PIN system
- Single write path: PinCrypto v2 (PBKDF2 + AES-GCM verifier only)
- savePinUnified / handlePinComplete no longer write weak multi-hashes
- Legacy hashes: read-only fallback; successful login upgrades to v2 and removes weak keys
- window.PinAuth = { setup, verify, hasPin, lock }
- Boot hasPin checks verifier + legacy keys

## fix9b — PIN salah setelah reload
Root cause: CryptoTune mengubah jumlah iterasi PBKDF2 setelah PIN dibuat,
sehingga decrypt verifier gagal.

Fix:
- Simpan br_pin_kdf_iters saat setup (freeze)
- Verify mencoba beberapa iterasi umum + recovery hash
- Recovery hash br_pin_recovery sebagai fallback

## fix10 — Solana Send (SOL + SPL)
- sendSolanaNative: SystemProgram.transfer via @solana/web3.js
- sendSolanaSpl: SPL transfer (+ create ATA) via @solana/spl-token if CDN loads
- window.sendTx routes to Solana path when network=sol
- requirePin before send; Solscan explorer link in toast
- Send form placeholder switches to Solana address

## fix10c — Buffer polyfill for Solana send
- Error: `Buffer is not defined` when calling sendSolanaNative in Acode/browser
- Load buffer@6 CDN before solana web3; minimal fallback Buffer

## fix12 — Solana secret at-rest hardening
- Removed plaintext/Base64 persistence of `br_sol_secret_v1` for new saves.
- Solana secret is now encrypted with the existing `PinCrypto` AES-GCM session key and stored as `br_sec_sol_secret_v1`.
- Solana wallet creation/import now requires an active, unlocked PIN vault so the secret can be persisted securely.
- Existing `br_sol_secret_v1` is migrated only after successful PIN unlock/setup, then deleted after encrypted persistence succeeds.
- Solana key loading/signing reads only from the encrypted vault; no plaintext localStorage fallback remains.
- Public Solana address remains in `br_sol_pubkey` (public data only).


## R3 — canonical network switch + refresh de-dup
- Replaced the stacked network-switch chain with one final controlled dispatcher.
- Solana never changes `state.network` before PIN verification.
- Entering Solana from another network always opens `Unlock PIN`.
- A successful PIN resumes the pending Solana switch exactly once.
- Each network switch performs one balance refresh instead of multiple wrapper refreshes.
- Added a short in-flight/completion de-dup guard for accidental back-to-back `refreshBalances()` calls.
- Legacy Solana RPC-selection and switch-burst wrappers are bypassed by the canonical dispatcher.


## R4 — single network switch + balance refresh dispatcher
- Solana enters through the existing Unlock PIN gate before `state.network` changes.
- EVM/Solana network changes perform one balance refresh.
- `refreshBalances()` now dispatches to the correct EVM/Solana implementation.
- Duplicate concurrent refresh calls share one promise and are suppressed for 1.2s after completion.
- Removed the two periodic balance-refresh loops (45s and 60s); price/history/security timers remain unchanged.
- RPC auto-selection no longer triggers an extra Solana balance refresh.


## R5 — Solana switch responsiveness
- Close network picker immediately after PIN approval.
- Do not await RPC health/auto-selection before painting Solana.
- Defer RPC selection, wallet ensure, and the single balance refresh to the next task.
- Prevents the network picker from appearing frozen/laggy during Solana selection.

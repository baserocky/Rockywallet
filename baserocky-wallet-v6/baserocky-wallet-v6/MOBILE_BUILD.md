# BaseRocky Wallet — Build Aplikasi Native (Capacitor)

Panduan mengubah PWA menjadi **APK Android** (dan iOS).

> **Penting:** Build native **tidak bisa** hanya dari Acode di HP.  
> Perlu **PC** (Windows / macOS / Linux) atau layanan cloud (GitHub Actions, etc.).

---

## Prasyarat (PC)

### Android
1. [Node.js 18+](https://nodejs.org/) (LTS)
2. [Android Studio](https://developer.android.com/studio) (dengan SDK + emulator atau HP USB debugging)
3. JDK 17 (biasanya ikut Android Studio)

### iOS (hanya macOS)
1. Xcode + CocoaPods
2. Apple Developer account (untuk device/App Store)

---

## Langkah cepat Android

### 1. Siapkan project
```bash
cd baserocky-wallet-v6
npm install
```

### 2. Copy web → www + sync Capacitor
```bash
npm run build:web
npx cap add android
npx cap sync
```

> Jika folder `android/` sudah ada, cukup:
> ```bash
> npm run cap:sync
> ```

### 3. Buka di Android Studio
```bash
npx cap open android
```

### 4. Jalankan
- Pilih device/emulator di Android Studio → **Run**
- Atau:
```bash
npx cap run android
```

### 5. Build APK / AAB (release)
Di Android Studio:
**Build → Generate Signed Bundle / APK**

Atau CLI (setelah setup keystore):
```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/
```

---

## Plugin yang sudah disiapkan di package.json

| Plugin | Fungsi |
|--------|--------|
| `@capacitor/app` | State app (background → auto-lock via `native-bridge.js`) |
| `@capacitor/browser` | Buka Uniswap / explorer / MoonPay |
| `@capacitor/clipboard` | Salin alamat |
| `@capacitor/splash-screen` | Splash native biru Base |
| `@capacitor/status-bar` | Status bar |
| `@capacitor/preferences` | Storage non-sensitif (opsional) |

Kode `js/native-bridge.js` + `brOpen()` sudah siap mendeteksi Capacitor.

---

## Splash native vs HTML

- **Splash sistem Capacitor** dikontrol lewat `capacitor.config.json` (`backgroundColor: #0052FF`).
- Setelah WebView load, splash HTML BaseRocky (`#brSplash`) tetap bisa tampil sebentar.
- Untuk **hanya** splash native (seperti Bitget): set `launchShowDuration` lebih lama dan sembunyikan `#brSplash` saat `BRNative.isNative === true` (opsional, bisa ditambah kemudian).

---

## Icon & splash resource Android

Setelah `npx cap add android`, ganti icon di:

```
android/app/src/main/res/mipmap-*/ic_launcher.png
```

Dan splash drawable sesuai dokumentasi Capacitor Splash Screen.

Bisa pakai asset:
- `icon-192.png` / `icon-512.png`
- `splash-logo.png`

Tool bantu: [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) atau Android Studio Image Asset.

---

## Keamanan (wajib sebelum rilis)

1. Jangan simpan seed/private key hanya di `localStorage` di production native.
2. Integrasikan **Secure Storage** / Keystore (langkah berikutnya).
3. Aktifkan **ProGuard/R8** untuk release.
4. Uji di device fisik (bukan hanya emulator).

---

## iOS (ringkas)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

Buka Xcode → pilih team signing → Run.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Halaman putih | Cek `webDir: "www"` dan `npm run build:web` |
| `brOpen` tidak native | Pastikan `@capacitor/browser` ter-install + `npx cap sync` |
| Splash hitam | Set `backgroundColor` di `capacitor.config.json` + `styles.xml` |
| Mixed content | Jangan load `http://` dari WebView HTTPS |

---

## Urutan yang disarankan

1. `npm install` + `cap add android` + sync  
2. Run di emulator/HP  
3. Sesuaikan icon & splash native  
4. Secure storage  
5. Signed release → Play Store internal testing  

---

*BaseRocky Wallet v6.7.1 — Capacitor ready*

## QRIS Server R5

The R5 manual QRIS flow now includes a Node.js server and admin panel.

Run in Acode Terminal from the project directory:

```sh
export BR_ADMIN_PASSWORD='GANTI_PASSWORD_ADMIN_YANG_KUAT'
npm start
```

Open `http://127.0.0.1:8160/admin` for the admin panel. The wallet uses `/api/qris/config` so all users connected to the same server receive the same QRIS configuration.

For a remote/public deployment, set `BR_QRIS_API_BASE` in `js/config.js` to the HTTPS backend URL and protect the admin password/secret as environment variables.

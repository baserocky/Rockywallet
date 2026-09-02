# Presale Sync Fix — R5

Perbaikan ini dibuat langsung dari `baserocky-wallet-v6-R5-presale-contract-auto-reader-fixed.zip`.

## Perbaikan
- Wallet tidak lagi menganggap kartu presale `OFFLINE` saat request API gagal.
- Cache browser untuk endpoint presale dibypass dengan query timestamp.
- Respons HTML dari server lama dikenali sebagai `SERVER LAMA`, bukan dianggap presale tidak aktif.
- Endpoint `/api/presale/health` ditambahkan.
- Endpoint `/api/presale/campaigns` diberi versi `r5-multi-campaign-v3`.
- Wallet menampilkan campaign LIVE dari server ketika API berhasil.
- Fallback `/api/presale/config` tetap tersedia.
- Source `js/core.js` dan `www/js/core.js` disinkronkan.
- `index.html` dan `www/index.html` memakai cache-buster baru.

## Penting setelah mengganti ZIP
Hentikan proses Node lama terlebih dahulu, kemudian jalankan:
`npm start`

Jangan menjalankan dua server pada port 8160 secara bersamaan. Setelah server baru berjalan, refresh browser/clear cache sekali.

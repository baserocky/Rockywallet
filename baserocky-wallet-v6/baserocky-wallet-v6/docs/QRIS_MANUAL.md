# Manual QRIS Deposit — R5

Manual QRIS now separates **operator configuration** from **user deposit**.

## Developer/Admin

Developer/Admin can open **Deposit → QRIS → Konfigurasi QRIS** and set:
- Merchant name
- Static QRIS payload, or QRIS image data URL
- Minimum IDR deposit
- Payment instructions

Developer/Admin can also view/export the local manual-deposit list.

## User

Normal users can choose **Deposit → QRIS**, enter the IDR amount, scan/pay the displayed QRIS, then press **Saya sudah bayar**. The request becomes `awaiting_verification`; it is not credited automatically.

## Important deployment note

`localStorage` is device-local. Therefore, an Admin entering QRIS on one device does **not** automatically publish it to other users' devices. For a real multi-user wallet, the QRIS merchant configuration and deposit records must be stored behind an authenticated backend/API. The backend should expose a read-only public QRIS configuration to users and an authenticated admin endpoint for updates.

Never treat a client-side role or localStorage value as sufficient authorization for financial operations.

## R5 Server + Admin Panel

The project includes `server.js` and `admin.html`. QRIS configuration is centralized on the server, so all wallet clients using the same backend receive the same merchant QRIS configuration.

- Public: `GET /api/qris/config`
- Admin login: `POST /api/admin/login`
- Save QRIS: `POST /api/admin/qris/config`
- Create deposit: `POST /api/deposits`
- Upload proof: `POST /api/deposits/:id/proof`
- Mark paid: `POST /api/deposits/:id/paid`
- User history: `GET /api/deposits/my?walletAddress=...`
- Admin list: `GET /api/admin/deposits`
- Admin approval: `POST /api/admin/deposits/:id/approve`
- Admin rejection: `POST /api/admin/deposits/:id/reject`

Run `BR_ADMIN_PASSWORD='PASSWORD_KUAT' npm start`, then open `/admin`. Approval records a manual credit decision; it does not fabricate an on-chain transaction or change blockchain balances automatically.

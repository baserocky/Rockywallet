# QRIS Deposit Integration

R5 now has a real QRIS invoice flow, but the browser wallet must call a merchant backend. Never put a TransFi/QRIS merchant secret in the wallet bundle.

Configure `window.BR_QRIS_CONFIG` before `core.js`:

```js
window.BR_QRIS_CONFIG = {
  enabled: true,
  createUrl: "https://YOUR-BACKEND.example.com/qris/invoices",
  statusUrl: "https://YOUR-BACKEND.example.com/qris/invoices/{id}",
  apiKey: "PUBLIC_CLIENT_TOKEN_ONLY"
};
```

Create endpoint receives JSON:

- `amountIdr`
- `fiat`
- `crypto`
- `network`
- `networkName`
- `walletAddress`
- `method: QRIS`

It must return JSON containing at least one QR payload field: `qrPayload`, `qrString`, `paymentQr`, or `qr_code`, plus an invoice id. Optional fields: `statusUrl`, `checkoutUrl`, `amountIdr`, `crypto`, `network`.

The backend is responsible for merchant authentication, QRIS creation, payment verification, webhook handling, and converting/settling the purchased asset to the wallet address. The wallet never marks a deposit paid based only on a client callback.

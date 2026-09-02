/**
 * BaseRocky Wallet entry
 * Logic has been split into:
 *   js/config.js  — constants, tokens, networks, state
 *   js/core.js    — all application logic
 *
 * Scripts are loaded from index.html in this order:
 *   1. ethers / qrcode / qr-code-styling (CDN)
 *   2. js/config.js
 *   3. js/core.js
 *
 * Do not put new code here — use the modules under js/.
 */
console.log('%cBaseRocky Wallet modules loaded via index.html', 'color:#0052FF');

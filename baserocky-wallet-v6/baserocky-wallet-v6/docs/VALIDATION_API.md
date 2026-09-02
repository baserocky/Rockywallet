# Recipient Address Validation API

BaseRocky Wallet exposes a small, pure helper for validating transfer recipients.

## `validateRecipientAddress(input)`

```js
const result = validateRecipientAddress(rawString);
```

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `string` | User-entered address or ENS-like name |

### Return value

```ts
{
  ok: boolean;           // true if usable as recipient
  address: string|null;  // normalized address or ENS string
  checksum: string|null; // EIP-55 checksum (EVM only)
  type: 'evm'|'ens'|null;
  message: string;       // human-readable status
  self?: boolean;        // true if matches active wallet
}
```

### Rules

1. **Empty** → `{ ok: false, message: 'Enter an address' }`
2. **ENS-like** (`.eth`, `.base`, `.crypto`) → `{ ok: true, type: 'ens' }`  
   Resolution is deferred to confirm step.
3. **EVM address**
   - Must pass `ethers.isAddress`
   - Rejects zero address `0x000…0`
   - Normalized with `ethers.getAddress` (checksum)
4. **Self-transfer** → still `ok: true` but `self: true` and warning message

### Examples

```js
validateRecipientAddress('');
// { ok: false, message: 'Enter an address' }

validateRecipientAddress('0xfbFbE857073Def06b74323d4732F597533bFb13B');
// { ok: true, type: 'evm', checksum: '0xFbfB…', message: 'Valid address' }

validateRecipientAddress('vitalik.eth');
// { ok: true, type: 'ens', message: 'ENS — resolve on confirm' }

validateRecipientAddress('0x0000000000000000000000000000000000000000');
// { ok: false, message: 'Zero address not allowed' }
```

### UI integration

**Bitget transfer flow** (`#bgTfToInput`):

- On `input`: live hint + border (`valid` / `invalid`)
- On `blur`: rewrite field to checksum when valid EVM
- On **Next** (`bgTfGoConfirm`): blocks if `!ok`; confirms if `self`

**Legacy send** (`#sendTo`):

- Hint in `#sendEnsHint` with classes `addr-valid-ok` / `addr-valid-bad`

### CSS hooks

| Class | Meaning |
|-------|---------|
| `.addr-valid-ok` | Green hint text |
| `.addr-valid-bad` | Red hint text |
| `.bg-tf-addr-box.valid` | Green border on input box |
| `.bg-tf-addr-box.invalid` | Red border on input box |

### Related helpers

| API | Role |
|-----|------|
| `validateRecipientAddress(str)` | Core validator |
| `bgTfGoConfirm()` | Gated by validation |
| `ethers.isAddress` / `ethers.getAddress` | Underlying checks |

---

## History performance helpers

| API | Description |
|-----|-------------|
| `loadHistoryEnhanced(force?)` | SWR cache + inflight dedupe + explorer fetch |
| `renderHistoryEnhanced(rows)` | rAF-batched DOM render (max 40 rows) |
| `setHistoryFilter('all'\|'in'\|'out')` | Client-side filter |

Cache key: `localStorage.br_tx_cache_v1`  
TTL: 45s stale-while-revalidate

## Realtime notifications

| API | Description |
|-----|-------------|
| `startRealtimeTxWatch(intervalMs?)` | Poll history (default 20s), pause when tab hidden |
| `stopRealtimeTxWatch()` | Stop polling |
| `pushRealtimeNotif({ title, body, tag, data })` | In-app banner + `Notification` API |

New **incoming** txs trigger toast + optional browser notification (permission required).

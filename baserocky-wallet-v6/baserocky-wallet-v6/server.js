#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'server-data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PORT = Number(process.env.PORT || 8160);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_PASSWORD = process.env.BR_ADMIN_PASSWORD || randomSecret(18);
const TOKEN_SECRET = process.env.BR_ADMIN_SECRET || randomSecret(32);
const AUTH_FILE = 'admin-auth.json';

function hashPassword(password, salt = randomSecret(16)) {
  return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString('hex') };
}
function passwordMatches(password, record) {
  try {
    if (!record || !record.salt || !record.hash) return false;
    const actual = crypto.scryptSync(String(password), record.salt, 64);
    const expected = Buffer.from(record.hash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (_) { return false; }
}
function authConfig() {
  const existing = fileJson(AUTH_FILE, null);
  if (existing && existing.admin && existing.developer) return existing;
  const seed = hashPassword(ADMIN_PASSWORD);
  const fresh = {
    admin: seed,
    developer: { ...hashPassword(ADMIN_PASSWORD) },
    createdAt: new Date().toISOString(),
    note: 'Passwords are stored as scrypt hashes; change them from Admin Panel.'
  };
  writeJson(AUTH_FILE, fresh);
  return fresh;
}
function verifyLoginPassword(role, password) {
  const cfg = authConfig();
  return passwordMatches(password, cfg[role]);
}
function changePassword(role, currentPassword, newPassword) {
  const cfg = authConfig();
  if (!passwordMatches(currentPassword, cfg[role])) return false;
  cfg[role] = hashPassword(newPassword);
  cfg.updatedAt = new Date().toISOString();
  writeJson(AUTH_FILE, cfg);
  return true;
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DEFAULT_QRIS = {
  enabled: true,
  merchantName: 'QRIS Merchant',
  payload: '',
  imageDataUrl: '',
  minIdr: 1000,
  instructions: 'Bayar sesuai nominal yang tertera menggunakan aplikasi bank/e-wallet yang mendukung QRIS.',
  updatedAt: null,
  updatedBy: null
};

function randomSecret(bytes) { return crypto.randomBytes(bytes).toString('hex'); }
function fileJson(name, fallback) {
  const p = path.join(DATA_DIR, name);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { writeJson(name, fallback); return fallback; }
}
function writeJson(name, value) {
  const p = path.join(DATA_DIR, name);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}
function qrisConfig() { return fileJson('qris-config.json', DEFAULT_QRIS); }
function deposits() { return fileJson('deposits.json', []); }
function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': process.env.BR_CORS_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', ...headers });
  res.end(body);
}
function json(res, status, data) { send(res, status, data); }
function readBody(req, limit = 7 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(Object.assign(new Error('Payload terlalu besar'), { status: 413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (_) { reject(Object.assign(new Error('JSON tidak valid'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function safePath(p) {
  const resolved = path.resolve(ROOT, p);
  return resolved.startsWith(path.resolve(ROOT) + path.sep) || resolved === path.resolve(ROOT);
}
function sign(payload) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('base64url');
  return raw + '.' + sig;
}
function verifyToken(token) {
  try {
    const [raw, sig] = String(token || '').split('.');
    if (!raw || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const p = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!p.exp || Date.now() > p.exp) return null;
    return p;
  } catch (_) { return null; }
}
function auth(req) {
  const h = String(req.headers.authorization || '');
  return verifyToken(h.startsWith('Bearer ') ? h.slice(7) : '');
}
function requireAdmin(req, res) {
  const a = auth(req);
  if (!a || (a.role !== 'admin' && a.role !== 'developer')) {
    json(res, 401, { ok: false, error: 'Unauthorized' });
    return null;
  }
  return a;
}
function cleanQris(c) {
  return {
    enabled: c.enabled !== false,
    merchantName: String(c.merchantName || 'QRIS Merchant'),
    payload: String(c.payload || ''),
    imageDataUrl: String(c.imageDataUrl || ''),
    minIdr: Math.max(1, Number(c.minIdr) || 1000),
    instructions: String(c.instructions || ''),
    updatedAt: c.updatedAt || null
  };
}
function saveUpload(dataUrl, prefix) {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  const m = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) throw Object.assign(new Error('Format gambar tidak didukung'), { status: 400 });
  const ext = m[1].includes('png') ? 'png' : m[1].includes('webp') ? 'webp' : 'jpg';
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const out = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(out, Buffer.from(m[2], 'base64'));
  return '/api/uploads/' + name;
}
function sanitizeDeposit(d) {
  return {
    id: d.id, walletAddress: d.walletAddress, amountIdr: d.amountIdr,
    network: d.network, networkName: d.networkName, asset: d.asset,
    status: d.status, createdAt: d.createdAt, userMarkedPaidAt: d.userMarkedPaidAt || null,
    proofUrl: d.proofUrl || '', adminNote: d.adminNote || '', reviewedAt: d.reviewedAt || null,
    reviewedBy: d.reviewedBy || null, creditedAmountIdr: d.creditedAmountIdr || 0
  };
}
function makeDepositId() { return 'QR-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }

const DEFAULT_PRESALE = {
  id: 'PS-DEFAULT', enabled: false, name: 'BaseRocky Presale', symbol: 'BROCK', price: 0,
  paymentAsset: 'USDT', paymentNetwork: 'Base', paymentAddress: '', allocation: 0, sold: 0,
  bonusPercent: 0, minPurchase: 0, maxPurchase: 0, startAt: '', endAt: '', tokenContract: '',
  description: 'Presale manual. Pembayaran diverifikasi Admin sebelum alokasi token.',
  tokenName: '', tokenDecimals: null, tokenTotalSupply: null, contractVerified: false, contractReadAt: null, contractNetwork: '',
  updatedAt: null, updatedBy: null, createdAt: null
};
function presaleCampaigns() {
  const p = path.join(DATA_DIR, 'presale-campaigns.json');
  try {
    const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(rows) && rows.length) return rows;
  } catch (_) {}
  const legacy = fileJson('presale-config.json', DEFAULT_PRESALE);
  const migrated = [{...DEFAULT_PRESALE, ...legacy, id: legacy.id || 'PS-DEFAULT', createdAt: legacy.createdAt || new Date().toISOString()}];
  writeJson('presale-campaigns.json', migrated);
  return migrated;
}
function writePresaleCampaigns(rows) { writeJson('presale-campaigns.json', rows); }
function presaleConfig() { return presaleCampaigns()[0] || DEFAULT_PRESALE; }
function presaleOrders() { return fileJson('presale-orders.json', []); }
function presaleSold(campaignId) {
  return presaleOrders().filter(o=>o.status==='approved' && (!campaignId || o.campaignId===campaignId)).reduce((s,o)=>s+Number(o.totalTokenAmount||0),0);
}
function campaignStatus(c) {
  const now=Date.now(), start=c.startAt?new Date(c.startAt).getTime():0, end=c.endAt?new Date(c.endAt).getTime():0;
  if(!c.enabled) return 'offline'; if(start && now<start) return 'scheduled'; if(end && now>end) return 'ended'; return 'live';
}
function cleanPresale(c) {
  return {
    id: String(c.id || makePresaleId()), enabled: c.enabled === true, projectName: String(c.projectName || c.name || 'BaseRocky').slice(0,120), projectLogo: String(c.projectLogo || '').slice(0,300), name: String(c.name || 'Presale').slice(0,120),
    symbol: String(c.symbol || 'BROCK').slice(0,32), price: Math.max(0, Number(c.price) || 0),
    paymentAsset: String(c.paymentAsset || 'USDT').slice(0,24), paymentNetwork: String(c.paymentNetwork || 'Base').slice(0,48),
    paymentAddress: String(c.paymentAddress || '').trim().slice(0,120), allocation: Math.max(0, Number(c.allocation) || 0),
    sold: Math.max(0, Number(c.sold) || 0), bonusPercent: Math.max(0, Math.min(100, Number(c.bonusPercent) || 0)),
    minPurchase: Math.max(0, Number(c.minPurchase) || 0), maxPurchase: Math.max(0, Number(c.maxPurchase) || 0),
    startAt: c.startAt || '', endAt: c.endAt || '', tokenContract: String(c.tokenContract || '').trim().slice(0,120),
    description: String(c.description || '').slice(0,2000),
    tokenName: String(c.tokenName || '').slice(0,120), tokenDecimals: c.tokenDecimals===null || c.tokenDecimals===undefined || c.tokenDecimals==='' ? null : Math.max(0, Math.min(255, Number(c.tokenDecimals)||0)), tokenTotalSupply: c.tokenTotalSupply===null || c.tokenTotalSupply===undefined ? null : String(c.tokenTotalSupply).slice(0,80), contractVerified: c.contractVerified === true, contractReadAt: c.contractReadAt || null, contractNetwork: String(c.contractNetwork || '').slice(0,48),
    updatedAt: c.updatedAt || null, updatedBy: c.updatedBy || null,
    createdAt: c.createdAt || null
  };
}
function publicCampaign(c) { const x=cleanPresale(c); return {...x, sold:presaleSold(x.id), status:campaignStatus(x)}; }
function applyPresaleMedia(body, base) { const c={...base,...body}; if(body && body.logoDataUrl){ c.projectLogo=saveUpload(String(body.logoDataUrl),'presale-logo'); } delete c.logoDataUrl; return c; }

// ===== Presale contract reader (EVM + Solana) =====
// The selected presale network determines the RPC used to inspect the token contract.
const PRESALE_NETWORKS = {
  base: { key:'base', name:'Base', chainId:8453, kind:'evm', rpcs:['https://mainnet.base.org','https://base.llamarpc.com','https://1rpc.io/base'] },
  ethereum: { key:'ethereum', name:'Ethereum', chainId:1, kind:'evm', rpcs:['https://eth.llamarpc.com','https://ethereum.publicnode.com','https://1rpc.io/eth'] },
  eth: { key:'ethereum', name:'Ethereum', chainId:1, kind:'evm', rpcs:['https://eth.llamarpc.com','https://ethereum.publicnode.com','https://1rpc.io/eth'] },
  bnb: { key:'bnb', name:'BNB Chain', chainId:56, kind:'evm', rpcs:['https://bsc-dataseed.binance.org','https://bsc.publicnode.com','https://1rpc.io/bnb'] },
  'bnb chain': { key:'bnb', name:'BNB Chain', chainId:56, kind:'evm', rpcs:['https://bsc-dataseed.binance.org','https://bsc.publicnode.com','https://1rpc.io/bnb'] },
  polygon: { key:'polygon', name:'Polygon', chainId:137, kind:'evm', rpcs:['https://polygon-rpc.com','https://polygon.llamarpc.com','https://1rpc.io/polygon'] },
  pol: { key:'polygon', name:'Polygon', chainId:137, kind:'evm', rpcs:['https://polygon-rpc.com','https://polygon.llamarpc.com','https://1rpc.io/polygon'] },
  arbitrum: { key:'arbitrum', name:'Arbitrum', chainId:42161, kind:'evm', rpcs:['https://arb1.arbitrum.io/rpc','https://arbitrum.llamarpc.com','https://1rpc.io/arb'] },
  arb: { key:'arbitrum', name:'Arbitrum', chainId:42161, kind:'evm', rpcs:['https://arb1.arbitrum.io/rpc','https://arbitrum.llamarpc.com','https://1rpc.io/arb'] },
  optimism: { key:'optimism', name:'Optimism', chainId:10, kind:'evm', rpcs:['https://mainnet.optimism.io','https://optimism.llamarpc.com','https://1rpc.io/op'] },
  op: { key:'optimism', name:'Optimism', chainId:10, kind:'evm', rpcs:['https://mainnet.optimism.io','https://optimism.llamarpc.com','https://1rpc.io/op'] },
  solana: { key:'solana', name:'Solana', chainId:null, kind:'solana', rpcs:['https://api.mainnet-beta.solana.com','https://solana-rpc.publicnode.com','https://1rpc.io/sol'] },
  sol: { key:'solana', name:'Solana', chainId:null, kind:'solana', rpcs:['https://api.mainnet-beta.solana.com','https://solana-rpc.publicnode.com','https://1rpc.io/sol'] }
};

function normalizePresaleNetwork(value) {
  const raw = String(value || 'base').trim().toLowerCase();
  return PRESALE_NETWORKS[raw] || Object.values(PRESALE_NETWORKS).find(x => x.name.toLowerCase() === raw) || null;
}
function isHexAddress(value) { return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim()); }
function isBase58(value) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || '').trim()); }
function hexWord(hex) { return String(hex || '').replace(/^0x/,'').padStart(64,'0').slice(0,64); }
function hexToBigInt(hex) { try { return BigInt('0x' + String(hex || '').replace(/^0x/,'')); } catch (_) { return 0n; } }
function decodeAbiString(hex) {
  const h=String(hex||'').replace(/^0x/,'');
  if(!h) return '';
  try {
    // ABI dynamic string: offset -> length -> bytes. Some older tokens return bytes32 instead.
    const offset=Number(hexToBigInt(h.slice(0,64))); const len=Number(hexToBigInt(h.slice(offset*2,offset*2+64)));
    if(Number.isFinite(offset) && len>=0 && h.length >= offset*2+64+len*2){ return Buffer.from(h.slice(offset*2+64,offset*2+64+len*2),'hex').toString('utf8').replace(/\0+$/,''); }
  } catch (_) {}
  try { return Buffer.from(h.slice(0,64),'hex').toString('utf8').replace(/\0+$/,''); } catch (_) { return ''; }
}
function encodeAddressCall(selector,address){ return selector + String(address).slice(2).padStart(64,'0'); }
async function rpcJson(url, method, params, timeoutMs=7000) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeoutMs);
  try {
    const r = await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:controller.signal});
    const t=await r.text();
    if(!r.ok) throw new Error('RPC HTTP '+r.status);
    const d=JSON.parse(t); if(d.error) throw new Error(d.error.message||'RPC error'); return d.result;
  } finally { clearTimeout(timer); }
}
async function firstRpc(cfg, method, params) {
  let last=null;
  for(const url of cfg.rpcs){ try { return {result:await rpcJson(url,method,params),rpc:url}; } catch(e){ last=e; } }
  throw last || new Error('RPC tidak tersedia');
}
async function readEvmContract(cfg,address){
  if(!isHexAddress(address)) throw new Error('Alamat contract EVM tidak valid. Gunakan alamat 0x...');
  const codeResp=await firstRpc(cfg,'eth_getCode',[address,'latest']);
  if(!codeResp.result || codeResp.result==='0x') throw new Error('Alamat ini tidak memiliki contract pada '+cfg.name+'. Periksa network dan alamat contract.');
  const calls=[
    ['name','0x06fdde03'],['symbol','0x95d89b41'],['decimals','0x313ce567'],['totalSupply','0x18160ddd']
  ];
  const out={name:'',symbol:'',decimals:null,totalSupplyRaw:null,totalSupply:null,contractAddress:address,network:cfg.name,chainId:cfg.chainId,kind:'evm',verified:true,rpc:codeResp.rpc};
  for(const [field,selector] of calls){
    try{
      const r=await firstRpc(cfg,'eth_call',[{to:address,data:selector},'latest']); const x=r.result;
      if(field==='name'||field==='symbol') out[field]=decodeAbiString(x);
      else if(field==='decimals') out.decimals=Number(hexToBigInt(x));
      else { out.totalSupplyRaw=hexToBigInt(x).toString(); }
    }catch(_){ /* optional metadata methods are not mandatory */ }
  }
  if(out.totalSupplyRaw!==null && out.decimals!==null){
    try { const raw=BigInt(out.totalSupplyRaw), d=out.decimals; out.totalSupply=(Number(raw)/Math.pow(10,d)).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:Math.min(12,d)}); } catch(_){}
  }
  return out;
}
async function readSolanaMint(cfg,address){
  if(!isBase58(address)) throw new Error('Alamat mint Solana tidak valid.');
  const r=await firstRpc(cfg,'getAccountInfo',[address,{encoding:'jsonParsed'}]);
  const value=r.result && r.result.value;
  if(!value) throw new Error('Mint/contract tidak ditemukan pada Solana.');
  const parsed=value.data && value.data.parsed;
  const info=parsed && parsed.info;
  if(!info || info.decimals===undefined || info.decimals===null || info.supply===undefined || info.supply===null) throw new Error('Alamat ditemukan, tetapi bukan SPL Token Mint yang dapat dibaca otomatis.');
  const decimals=Number(info.decimals), supplyRaw=String(info.supply);
  let supply=null; try{supply=(Number(BigInt(supplyRaw))/Math.pow(10,decimals)).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:Math.min(12,decimals)});}catch(_){ }
  return {name:'',symbol:'',decimals,totalSupplyRaw:supplyRaw,totalSupply:supply,contractAddress:address,network:cfg.name,chainId:null,kind:'solana',verified:true,rpc:r.rpc,mintAuthority:info.mintAuthority||null,freezeAuthority:info.freezeAuthority||null};
}
async function readPresaleContract(network,address){
  const cfg=normalizePresaleNetwork(network); if(!cfg) throw new Error('Network presale tidak didukung untuk pembacaan contract otomatis.');
  return cfg.kind==='solana' ? readSolanaMint(cfg,address) : readEvmContract(cfg,address);
}
function makePresaleId() { return 'PS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }
function sanitizePresaleOrder(o) {
  return { id:o.id, campaignId:o.campaignId||'PS-DEFAULT', walletAddress:o.walletAddress, paymentAmount:o.paymentAmount,
    paymentAsset:o.paymentAsset, paymentNetwork:o.paymentNetwork, tokenAmount:o.tokenAmount, bonusAmount:o.bonusAmount,
    totalTokenAmount:o.totalTokenAmount, status:o.status, proofUrl:o.proofUrl||'', createdAt:o.createdAt,
    userMarkedPaidAt:o.userMarkedPaidAt||null, reviewedAt:o.reviewedAt||null, reviewedBy:o.reviewedBy||null, adminNote:o.adminNote||'' };
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, '', { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' });

  if (req.method === 'GET' && p === '/api/health') return json(res, 200, { ok: true, service: 'BaseRocky Wallet API', version: 'R5-presale-sync-2', presaleApi: 'r5-multi-campaign-v3' });

  if (req.method === 'POST' && p === '/api/admin/login') {
    try {
      const b = await readBody(req, 100 * 1024);
      const role = b.role === 'developer' ? 'developer' : 'admin';
      if (!verifyLoginPassword(role, String(b.password || ''))) return json(res, 401, { ok: false, error: 'Password admin/developer salah' });
      const token = sign({ role, iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 });
      return json(res, 200, { ok: true, token, role });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  if (req.method === 'GET' && p === '/api/qris/config') {
    return json(res, 200, { ok: true, config: cleanQris(qrisConfig()) });
  }

  if (req.method === 'POST' && p === '/api/admin/qris/config') {
    const a = requireAdmin(req, res); if (!a) return;
    try {
      const b = await readBody(req);
      const c = {
        enabled: b.enabled !== false,
        merchantName: String(b.merchantName || 'QRIS Merchant').trim().slice(0, 120),
        payload: String(b.payload || '').trim().slice(0, 10000),
        imageDataUrl: String(b.imageDataUrl || '').slice(0, 4_500_000),
        minIdr: Math.max(1, Math.round(Number(b.minIdr) || 1000)),
        instructions: String(b.instructions || '').trim().slice(0, 1000),
        updatedAt: new Date().toISOString(),
        updatedBy: a.role
      };
      if (!c.payload && !c.imageDataUrl) return json(res, 400, { ok: false, error: 'Masukkan payload QRIS atau gambar QRIS.' });
      writeJson('qris-config.json', c);
      return json(res, 200, { ok: true, config: cleanQris(c) });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  if (req.method === 'POST' && p === '/api/deposits') {
    try {
      const b = await readBody(req);
      const amount = Math.round(Number(b.amountIdr) || 0);
      const cfg = qrisConfig();
      if (!cfg.enabled) return json(res, 400, { ok: false, error: 'QRIS sedang dinonaktifkan.' });
      if (amount < Number(cfg.minIdr || 1000)) return json(res, 400, { ok: false, error: `Minimum deposit Rp ${Number(cfg.minIdr || 1000).toLocaleString('id-ID')}` });
      const walletAddress = String(b.walletAddress || '').trim();
      if (!walletAddress) return json(res, 400, { ok: false, error: 'Alamat wallet diperlukan.' });
      let proofUrl = '';
      if (b.proofImageDataUrl) proofUrl = saveUpload(String(b.proofImageDataUrl), 'proof');
      const d = {
        id: makeDepositId(), walletAddress, amountIdr: amount,
        network: String(b.network || 'base'), networkName: String(b.networkName || 'Base'),
        asset: String(b.asset || 'USDT'), status: 'pending', proofUrl,
        createdAt: new Date().toISOString(), userMarkedPaidAt: null,
        adminNote: '', reviewedAt: null, reviewedBy: null, creditedAmountIdr: 0
      };
      const list = deposits(); list.unshift(d); writeJson('deposits.json', list.slice(0, 500));
      return json(res, 201, { ok: true, deposit: sanitizeDeposit(d) });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  if (req.method === 'POST' && /^\/api\/deposits\/[^/]+\/proof$/.test(p)) {
    try {
      const id = decodeURIComponent(p.split('/')[3]);
      const b = await readBody(req, 5 * 1024 * 1024);
      const list = deposits(); const d = list.find(x => x.id === id);
      if (!d) return json(res, 404, { ok: false, error: 'Deposit tidak ditemukan' });
      if (d.status === 'approved' || d.status === 'rejected') return json(res, 409, { ok: false, error: 'Deposit sudah diproses' });
      d.proofUrl = saveUpload(String(b.proofImageDataUrl || ''), 'proof');
      writeJson('deposits.json', list);
      return json(res, 200, { ok: true, deposit: sanitizeDeposit(d) });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  if (req.method === 'POST' && /^\/api\/deposits\/[^/]+\/paid$/.test(p)) {
    try {
      const id = decodeURIComponent(p.split('/')[3]);
      const list = deposits(); const d = list.find(x => x.id === id);
      if (!d) return json(res, 404, { ok: false, error: 'Deposit tidak ditemukan' });
      if (d.status === 'pending') d.status = 'awaiting_verification';
      d.userMarkedPaidAt = new Date().toISOString();
      writeJson('deposits.json', list);
      return json(res, 200, { ok: true, deposit: sanitizeDeposit(d) });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  if (req.method === 'GET' && p === '/api/deposits/my') {
    const wallet = String(url.searchParams.get('walletAddress') || '').trim();
    if (!wallet) return json(res, 400, { ok: false, error: 'walletAddress diperlukan' });
    const list = deposits().filter(d => d.walletAddress.toLowerCase() === wallet.toLowerCase()).map(sanitizeDeposit);
    return json(res, 200, { ok: true, deposits: list });
  }

  if (req.method === 'GET' && p === '/api/admin/deposits') {
    const a = requireAdmin(req, res); if (!a) return;
    return json(res, 200, { ok: true, deposits: deposits().map(sanitizeDeposit) });
  }

  if (req.method === 'POST' && p === '/api/admin/password') {
    const a = requireAdmin(req, res); if (!a) return;
    try {
      const b = await readBody(req, 100 * 1024);
      const currentPassword = String(b.currentPassword || '');
      const newPassword = String(b.newPassword || '');
      const confirmPassword = String(b.confirmPassword || '');
      if (newPassword.length < 8) return json(res, 400, { ok: false, error: 'Password baru minimal 8 karakter.' });
      if (newPassword !== confirmPassword) return json(res, 400, { ok: false, error: 'Konfirmasi password baru tidak sama.' });
      if (newPassword === currentPassword) return json(res, 400, { ok: false, error: 'Password baru harus berbeda dari password lama.' });
      if (!changePassword(a.role, currentPassword, newPassword)) return json(res, 401, { ok: false, error: 'Password lama salah.' });
      return json(res, 200, { ok: true, role: a.role, message: `Password ${a.role} berhasil diubah.` });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }

  const actionMatch = p.match(/^\/api\/admin\/deposits\/([^/]+)\/(approve|reject)$/);
  if (req.method === 'POST' && actionMatch) {
    const a = requireAdmin(req, res); if (!a) return;
    try {
      const id = decodeURIComponent(actionMatch[1]); const action = actionMatch[2];
      const b = await readBody(req, 200 * 1024);
      const list = deposits(); const d = list.find(x => x.id === id);
      if (!d) return json(res, 404, { ok: false, error: 'Deposit tidak ditemukan' });
      if (d.status === 'approved' || d.status === 'rejected') return json(res, 409, { ok: false, error: 'Deposit sudah diproses' });
      d.status = action === 'approve' ? 'approved' : 'rejected';
      d.adminNote = String(b.note || '').slice(0, 500);
      d.reviewedAt = new Date().toISOString(); d.reviewedBy = a.role;
      d.creditedAmountIdr = action === 'approve' ? d.amountIdr : 0;
      writeJson('deposits.json', list);
      return json(res, 200, { ok: true, deposit: sanitizeDeposit(d), note: action === 'approve' ? 'Deposit disetujui. Ini mencatat kredit manual; tidak membuat transaksi blockchain otomatis.' : 'Deposit ditolak.' });
    } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  }


  if (req.method === 'GET' && p === '/api/presale/health') {
    res.setHeader('X-BaseRocky-Presale-API','r5-multi-campaign-v3');
    return json(res,200,{ok:true,service:'presale',version:'r5-multi-campaign-v3',serverVersion:'R5-presale-sync-2'});
  }

  if (req.method === 'GET' && p === '/api/presale/config') {
    const campaigns=presaleCampaigns().map(publicCampaign);
    const live=campaigns.find(c=>c.status==='live') || campaigns[0] || publicCampaign(DEFAULT_PRESALE);
    return json(res,200,{ok:true,config:live,campaigns});
  }
  if (req.method === 'GET' && p === '/api/presale/campaigns') {
    res.setHeader('X-BaseRocky-Presale-API','r5-multi-campaign-v3');
    res.setHeader('X-BaseRocky-Server','R5-presale-sync-2');
    return json(res,200,{ok:true,version:'r5-multi-campaign-v3',serverVersion:'R5-presale-sync-2',campaigns:presaleCampaigns().map(publicCampaign)});
  }
  if (req.method === 'GET' && p === '/api/admin/presale/campaigns') {
    const a=requireAdmin(req,res);if(!a)return;
    return json(res,200,{ok:true,campaigns:presaleCampaigns().map(publicCampaign)});
  }
  const psCampaignId=p.match(/^\/api\/admin\/presale\/campaigns\/([^/]+)$/);
  if(req.method==='POST' && p==='/api/admin/presale/read-contract'){
    const a=requireAdmin(req,res); if(!a)return;
    try{
      const b=await readBody(req,100*1024), info=await readPresaleContract(b.network,b.address);
      return json(res,200,{ok:true,contract:info});
    }catch(e){ return json(res,e.status||400,{ok:false,error:e.message||'Gagal membaca contract'}); }
  }
  if(req.method==='POST' && p==='/api/admin/presale/campaigns'){
    const a=requireAdmin(req,res);if(!a)return;
    try{
      const b=await readBody(req); const c=cleanPresale(applyPresaleMedia(b,{id:makePresaleId(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:a.role}));
      if(c.enabled && (!c.price||!c.allocation||!c.paymentAddress)) return json(res,400,{ok:false,error:'Campaign aktif memerlukan harga, alokasi, dan alamat pembayaran.'});
      if(c.maxPurchase&&c.maxPurchase<c.minPurchase)return json(res,400,{ok:false,error:'Maksimum pembelian tidak boleh lebih kecil dari minimum.'});
      if(c.endAt&&c.startAt&&new Date(c.endAt)<=new Date(c.startAt))return json(res,400,{ok:false,error:'Waktu selesai harus setelah waktu mulai.'});
      const rows=presaleCampaigns(); rows.unshift(c); writePresaleCampaigns(rows.slice(0,50));
      return json(res,201,{ok:true,campaign:publicCampaign(c)});
    }catch(e){return json(res,e.status||400,{ok:false,error:e.message});}
  }
  if(req.method==='PUT' && psCampaignId){
    const a=requireAdmin(req,res);if(!a)return;
    try{
      const id=decodeURIComponent(psCampaignId[1]), b=await readBody(req), rows=presaleCampaigns(), i=rows.findIndex(x=>x.id===id);
      if(i<0)return json(res,404,{ok:false,error:'Campaign presale tidak ditemukan'});
      const c=cleanPresale(applyPresaleMedia(b,{...rows[i],id,createdAt:rows[i].createdAt,updatedAt:new Date().toISOString(),updatedBy:a.role}));
      if(c.enabled && (!c.price||!c.allocation||!c.paymentAddress))return json(res,400,{ok:false,error:'Campaign aktif memerlukan harga, alokasi, dan alamat pembayaran.'});
      if(c.maxPurchase&&c.maxPurchase<c.minPurchase)return json(res,400,{ok:false,error:'Maksimum pembelian tidak boleh lebih kecil dari minimum.'});
      if(c.endAt&&c.startAt&&new Date(c.endAt)<=new Date(c.startAt))return json(res,400,{ok:false,error:'Waktu selesai harus setelah waktu mulai.'});
      rows[i]=c;writePresaleCampaigns(rows);return json(res,200,{ok:true,campaign:publicCampaign(c)});
    }catch(e){return json(res,e.status||400,{ok:false,error:e.message});}
  }
  if(req.method==='DELETE' && psCampaignId){
    const a=requireAdmin(req,res);if(!a)return;
    const id=decodeURIComponent(psCampaignId[1]), rows=presaleCampaigns();
    if(rows.length<=1)return json(res,400,{ok:false,error:'Minimal satu campaign harus tersedia.'});
    const next=rows.filter(x=>x.id!==id); if(next.length===rows.length)return json(res,404,{ok:false,error:'Campaign presale tidak ditemukan'});
    writePresaleCampaigns(next); return json(res,200,{ok:true});
  }
  if (req.method === 'POST' && p === '/api/admin/presale/config') {
    const a=requireAdmin(req,res); if (!a) return;
    try { const b=await readBody(req), rows=presaleCampaigns(), id=String(b.id||rows[0]?.id||'PS-DEFAULT'), i=rows.findIndex(x=>x.id===id);
      if(i<0)return json(res,404,{ok:false,error:'Campaign presale tidak ditemukan'});
      const c=cleanPresale(applyPresaleMedia(b,{...rows[i],id,updatedAt:new Date().toISOString(),updatedBy:a.role}));
      rows[i]=c;writePresaleCampaigns(rows);writeJson('presale-config.json',c);return json(res,200,{ok:true,config:publicCampaign(c)});
    }catch(e){return json(res,e.status||400,{ok:false,error:e.message});}
  }
  if (req.method === 'GET' && p === '/api/presale/orders/my') {
    const addr=String(new URL(req.url,`http://${req.headers.host||'localhost'}`).searchParams.get('walletAddress')||'').trim().toLowerCase();
    if(!addr)return json(res,400,{ok:false,error:'Alamat wallet diperlukan.'});
    return json(res,200,{ok:true,orders:presaleOrders().filter(o=>String(o.walletAddress||'').toLowerCase()===addr).map(sanitizePresaleOrder)});
  }
  if (req.method === 'POST' && p === '/api/presale/orders') {
    try{
      const b=await readBody(req), rows=presaleCampaigns(), id=String(b.campaignId||''), raw=id?rows.find(x=>x.id===id):rows.find(x=>campaignStatus(x)==='live')||rows[0];
      if(!raw)return json(res,404,{ok:false,error:'Campaign presale tidak ditemukan'}); const c=publicCampaign(raw);
      if(c.status!=='live')return json(res,400,{ok:false,error:c.status==='scheduled'?'Presale belum dimulai':c.status==='ended'?'Presale sudah berakhir':'Presale sedang tidak aktif'});
      const walletAddress=String(b.walletAddress||'').trim(), paymentAmount=Number(b.paymentAmount)||0;
      if(!walletAddress)return json(res,400,{ok:false,error:'Alamat wallet diperlukan.'}); if(paymentAmount<=0)return json(res,400,{ok:false,error:'Jumlah pembelian tidak valid.'});
      if(c.minPurchase&&paymentAmount<c.minPurchase)return json(res,400,{ok:false,error:`Minimum pembelian ${c.minPurchase}`}); if(c.maxPurchase&&paymentAmount>c.maxPurchase)return json(res,400,{ok:false,error:`Maksimum pembelian ${c.maxPurchase}`});
      const tokenAmount=paymentAmount/c.price,bonusAmount=tokenAmount*(c.bonusPercent/100),totalTokenAmount=tokenAmount+bonusAmount,sold=presaleSold(c.id);
      if(c.allocation&&sold+totalTokenAmount>c.allocation)return json(res,400,{ok:false,error:'Alokasi presale tidak mencukupi.'});
      const o={id:makePresaleId(),campaignId:c.id,walletAddress,paymentAmount,paymentAsset:c.paymentAsset,paymentNetwork:c.paymentNetwork,tokenAmount,bonusAmount,totalTokenAmount,status:'pending',proofUrl:'',createdAt:new Date().toISOString(),userMarkedPaidAt:null,reviewedAt:null,reviewedBy:null,adminNote:''};
      const list=presaleOrders();list.unshift(o);writeJson('presale-orders.json',list.slice(0,2000));return json(res,201,{ok:true,order:sanitizePresaleOrder(o),paymentAddress:c.paymentAddress,config:c});
    }catch(e){return json(res,e.status||400,{ok:false,error:e.message});}
  }
  if (req.method === 'POST' && /^\/api\/presale\/orders\/[^/]+\/proof$/.test(p)) { try{const id=decodeURIComponent(p.split('/')[4]),b=await readBody(req,5*1024*1024),list=presaleOrders(),o=list.find(x=>x.id===id);if(!o)return json(res,404,{ok:false,error:'Order presale tidak ditemukan'});if(o.status==='approved'||o.status==='rejected')return json(res,409,{ok:false,error:'Order sudah diproses'});o.proofUrl=saveUpload(String(b.proofImageDataUrl||''),'presale-proof');writeJson('presale-orders.json',list);return json(res,200,{ok:true,order:sanitizePresaleOrder(o)});}catch(e){return json(res,e.status||400,{ok:false,error:e.message});}}
  if (req.method === 'POST' && /^\/api\/presale\/orders\/[^/]+\/paid$/.test(p)) { try{const id=decodeURIComponent(p.split('/')[4]),list=presaleOrders(),o=list.find(x=>x.id===id);if(!o)return json(res,404,{ok:false,error:'Order presale tidak ditemukan'});if(o.status!=='pending')return json(res,409,{ok:false,error:'Order tidak dapat ditandai paid'});o.status='awaiting_verification';o.userMarkedPaidAt=new Date().toISOString();writeJson('presale-orders.json',list);return json(res,200,{ok:true,order:sanitizePresaleOrder(o)});}catch(e){return json(res,e.status||400,{ok:false,error:e.message});}}
  if (req.method === 'GET' && p === '/api/admin/presale/orders') { const a=requireAdmin(req,res);if(!a)return; const q=new URL(req.url,`http://${req.headers.host||'localhost'}`).searchParams.get('campaignId'); return json(res,200,{ok:true,orders:presaleOrders().filter(o=>!q||o.campaignId===q).map(sanitizePresaleOrder)}); }
  const psAction=p.match(/^\/api\/admin\/presale\/orders\/([^/]+)\/(approve|reject)$/);
  if(req.method==='POST'&&psAction){const a=requireAdmin(req,res);if(!a)return;try{const id=decodeURIComponent(psAction[1]),action=psAction[2],b=await readBody(req,200*1024),list=presaleOrders(),o=list.find(x=>x.id===id);if(!o)return json(res,404,{ok:false,error:'Order presale tidak ditemukan'});if(o.status==='approved'||o.status==='rejected')return json(res,409,{ok:false,error:'Order sudah diproses'});if(action==='approve'){const c=presaleCampaigns().find(x=>x.id===o.campaignId);if(!c)return json(res,404,{ok:false,error:'Campaign order tidak ditemukan'});const sold=presaleSold(c.id);if(c.allocation&&sold+Number(o.totalTokenAmount||0)>c.allocation)return json(res,409,{ok:false,error:'Alokasi campaign sudah tidak mencukupi.'});o.status='approved';}else o.status='rejected';o.adminNote=String(b.note||'').slice(0,500);o.reviewedAt=new Date().toISOString();o.reviewedBy=a.role;writeJson('presale-orders.json',list);return json(res,200,{ok:true,order:sanitizePresaleOrder(o)});}catch(e){return json(res,e.status||400,{ok:false,error:e.message});}}

  if (req.method === 'GET' && p.startsWith('/api/uploads/')) {
    const name = path.basename(p.slice('/api/uploads/'.length));
    const fp = path.join(UPLOAD_DIR, name);
    if (!safePath(fp) || !fs.existsSync(fp)) return json(res, 404, { ok:false, error:'Not found' });
    const ext = path.extname(fp).toLowerCase();
    const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' });
    return fs.createReadStream(fp).pipe(res);
  }

  return serveStatic(p, res);
}

function serveStatic(p, res) {
  let rel = decodeURIComponent(p);
  if (rel === '/' || rel === '') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const fp = path.join(ROOT, rel.replace(/^\/+/, ''));
  if (!safePath(fp) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return p.startsWith('/api/') ? json(res, 404, { ok:false, error:'API endpoint not found' }) : send(res, 404, 'File not found!');
  const ext = path.extname(fp).toLowerCase();
  const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
}

const server = http.createServer((req, res) => {
  try { route(req, res).catch(e => json(res, 500, { ok:false, error:e.message || 'Server error' })); }
  catch (e) { json(res, 500, { ok:false, error:e.message || 'Server error' }); }
});
server.listen(PORT, HOST, () => {
  console.log(`BaseRocky Wallet R5 server running on http://${HOST}:${PORT}`);
  const existingAuth = (() => { try { return fs.existsSync(path.join(DATA_DIR, AUTH_FILE)); } catch (_) { return false; } })();
  if (!existingAuth && !process.env.BR_ADMIN_PASSWORD) console.log(`ADMIN PASSWORD (temporary, use once then change in panel): ${ADMIN_PASSWORD}`);
  else if (!existingAuth && process.env.BR_ADMIN_PASSWORD) console.log('ADMIN PASSWORD: using BR_ADMIN_PASSWORD for initial login; change it from the Admin Panel.');
  console.log(`Admin panel: http://127.0.0.1:${PORT}/admin`);
  console.log(`QRIS config: ${path.join(DATA_DIR, 'qris-config.json')}`);
});

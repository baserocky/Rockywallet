/**
 * BaseRocky Wallet — Config & Constants
 * LOGO, keys, DEFAULT_TOKENS, NETWORKS, NET_TOKENS, state
 * Loaded first. Do not put logic that depends on DOM here.
 */

const LOGO = "icon-192.png";

const BROCK = '0xc72Ff2428533D20225AaBa77bEB368844dfd7898';
var RPCS = ["https://mainnet.base.org","https://base.llamarpc.com","https://base-mainnet.public.blastapi.io"];
const STORAGE_KEY = 'br_wallet_v3';
const TOKENS_KEY = 'br_custom_tokens_v3';
const PIN_KEY = 'br_pin_hash_v3';
var CHAIN_ID = 8453;
const DEFAULT_TOKENS = [
  { id:'ETH', symbol:'ETH', name:'Ethereum', decimals:18, address:null, icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png', cg:'ethereum', coingecko:'ethereum' },
  { id:'BROCK', symbol:'BROCK', name:'BaseRocky', decimals:18, address:BROCK, icon:LOGO, cg:null, coingecko:null },
  { id:'USDC', symbol:'USDC', name:'USD Coin', decimals:6, address:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png', cg:'usd-coin', coingecko:'usd-coin' },
  { id:'USDT', symbol:'USDT', name:'Tether', decimals:6, address:'0xfde4C06d34bAC2a549479927132842aA44909D88', icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png', cg:'tether', coingecko:'tether' },
  { id:'WETH', symbol:'WETH', name:'Wrapped Ether', decimals:18, address:'0x4200000000000000000000000000000000000006', icon:'https://assets.coingecko.com/coins/images/2518/small/weth.png', cg:'weth', coingecko:'weth' },
  { id:'AERO', symbol:'AERO', name:'Aerodrome', decimals:18, address:'0x940181a94A35A4569E4529A3CDfB74e38FD98631', icon:'https://assets.coingecko.com/coins/images/31745/small/token.png', cg:'aerodrome-finance', coingecko:'aerodrome-finance' },
  { id:'BRETT', symbol:'BRETT', name:'Brett', decimals:18, address:'0x532f27101965dd251E37aC48e79A7e0a4e5a6A7b', icon:'https://assets.coingecko.com/coins/images/35529/small/brett.jpeg', cg:'based-brett', coingecko:'based-brett' },
  { id:'DEGEN', symbol:'DEGEN', name:'Degen', decimals:18, address:'0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', icon:'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png', cg:'degen-base', coingecko:'degen-base' },
  { id:'TOSHI', symbol:'TOSHI', name:'Toshi', decimals:18, address:'0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', icon:'https://assets.coingecko.com/coins/images/31126/small/Toshi_Logo_-_Circular.png', cg:'toshi', coingecko:'toshi' },
  { id:'VIRTUAL', symbol:'VIRTUAL', name:'Virtuals', decimals:18, address:'0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', icon:'https://assets.coingecko.com/coins/images/34057/small/LOGOMAIN.jpg', cg:'virtual-protocol', coingecko:'virtual-protocol' },
  { id:'DAI', symbol:'DAI', name:'Dai', decimals:18, address:'0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', icon:'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png', cg:'dai', coingecko:'dai' },
  { id:'cbETH', symbol:'cbETH', name:'Coinbase Wrapped Staked ETH', decimals:18, address:'0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', icon:'https://assets.coingecko.com/coins/images/27008/small/cbeth.png', cg:'coinbase-wrapped-staked-eth', coingecko:'coinbase-wrapped-staked-eth' }
];

let dappCat = 'all';


/* ===== Manual QRIS configuration =====
   Put the merchant's static QRIS payload in payload, or a QR image data URL in imageDataUrl.
   Manual deposits never auto-credit wallet balances; they remain pending/awaiting_verification.
*/
/* QRIS Manual operator access. Runtime role must be supplied by the authenticated app/backend. */
var BR_QRIS_ALLOWED_ROLES = ['developer','admin'];
var BR_QRIS_MANUAL_CONFIG = window.BR_QRIS_MANUAL_CONFIG || {
  enabled: true,
  merchantName: 'QRIS Merchant',
  payload: '',
  imageDataUrl: '',
  minIdr: 1000,
  instructions: 'Bayar sesuai nominal yang tertera menggunakan aplikasi bank/e-wallet yang mendukung QRIS.'
};

let state = {
  wallet:null, address:null, phrase:null,
  balances:{}, prices:{ETH:3200,BROCK:0.0001,USDC:1,AERO:0.45,WETH:3200},
  tokens: DEFAULT_TOKENS.map(t=>({...t})),
  hiddenTokens:[], history:[], pinMode:null, pinBuffer:'', pinTemp:'',
  confirmWords:[], confirmStep:0, confirmAnswers:[],
  network:'base', swapFrom:'ETH', swapTo:'USDC', tokenPickerSide:null
};

/* ===== Multi-network (EVM) ===== */

var NETWORKS = [
  {id:'all', name:'Semua jaringan', ico:'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png', color:'#848E9C', chainId:null, rpc:[], explorer:'', native:'', kind:'all'},
  {id:'sol', name:'Solana', ico:'https://assets.coingecko.com/coins/images/4128/small/solana.png', color:'#14F195', chainId:null, rpc:['https://api.mainnet-beta.solana.com','https://solana-rpc.publicnode.com'], explorer:'https://solscan.io', native:'SOL', kind:'sol'},
  {id:'bnb', name:'BNB Chain', ico:'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', color:'#F0B90B', chainId:56, rpc:['https://bsc-dataseed.binance.org','https://rpc.ankr.com/bsc'], explorer:'https://bscscan.com', native:'BNB', kind:'evm'},
  {id:'trx', name:'Tron', ico:'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', color:'#FF0013', chainId:null, rpc:[], explorer:'https://tronscan.org', native:'TRX', kind:'tron'},
  {id:'pol', name:'Polygon', ico:'https://assets.coingecko.com/coins/images/4713/small/polygon.png', color:'#8247E5', chainId:137, rpc:['https://polygon-rpc.com','https://rpc.ankr.com/polygon'], explorer:'https://polygonscan.com', native:'MATIC', kind:'evm'},
  {id:'eth', name:'Ethereum', ico:'https://assets.coingecko.com/coins/images/279/small/ethereum.png', color:'#627EEA', chainId:1, rpc:['https://eth.llamarpc.com','https://rpc.ankr.com/eth'], explorer:'https://etherscan.io', native:'ETH', kind:'evm'},
  {id:'sui', name:'Sui', ico:'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', color:'#6FBCF0', chainId:null, rpc:[], explorer:'https://suiscan.xyz', native:'SUI', kind:'sui'},
  {id:'base', name:'Base', ico:'https://assets.coingecko.com/asset_platforms/images/131/small/base.png', color:'#0052FF', chainId:8453, rpc:['https://mainnet.base.org','https://base.llamarpc.com','https://base-mainnet.public.blastapi.io'], explorer:'https://basescan.org', native:'ETH', kind:'evm'},
  {id:'arb', name:'Arbitrum', ico:'https://assets.coingecko.com/coins/images/16547/small/arb.jpg', color:'#28A0F0', chainId:42161, rpc:['https://arb1.arbitrum.io/rpc'], explorer:'https://arbiscan.io', native:'ETH', kind:'evm'},
  {id:'op', name:'Optimism', ico:'https://assets.coingecko.com/coins/images/25244/small/Optimism.png', color:'#FF0420', chainId:10, rpc:['https://mainnet.optimism.io'], explorer:'https://optimistic.etherscan.io', native:'ETH', kind:'evm'}
];


/* Per-network token presets (EVM) */
var NET_TOKENS = {
  sol: [
    {id:'SOL',symbol:'SOL',name:'Solana',decimals:9,address:null,mint:'So11111111111111111111111111111111111111112',icon:'https://assets.coingecko.com/coins/images/4128/small/solana.png',cg:'solana'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',mint:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',mint:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'BONK',symbol:'BONK',name:'Bonk',decimals:5,address:'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',mint:'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',icon:'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',cg:'bonk'},
    {id:'JUP',symbol:'JUP',name:'Jupiter',decimals:6,address:'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',mint:'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',icon:'https://assets.coingecko.com/coins/images/34188/small/jup.png',cg:'jupiter-exchange-solana'},
    {id:'WIF',symbol:'WIF',name:'dogwifhat',decimals:6,address:'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',mint:'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',icon:'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg',cg:'dogwifcoin'}
  ],
  base: [
    {id:'ETH',symbol:'ETH',name:'Ethereum',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png',cg:'ethereum'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'0xfde4C06d34bAC2a549479927132842aA44909D88',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'WETH',symbol:'WETH',name:'Wrapped Ether',decimals:18,address:'0x4200000000000000000000000000000000000006',icon:'https://assets.coingecko.com/coins/images/2518/small/weth.png',cg:'weth'},
    {id:'AERO',symbol:'AERO',name:'Aerodrome',decimals:18,address:'0x940181a94A35A4569E4529A3CDfB74e38FD98631',icon:'https://assets.coingecko.com/coins/images/31745/small/token.png',cg:'aerodrome-finance'},
    {id:'BRETT',symbol:'BRETT',name:'Brett',decimals:18,address:'0x532f27101965dd251E37aC48e79A7e0a4e5a6A7b',icon:'https://assets.coingecko.com/coins/images/35529/small/brett.jpeg',cg:'based-brett'},
    {id:'DEGEN',symbol:'DEGEN',name:'Degen',decimals:18,address:'0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',icon:'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png',cg:'degen-base'},
    {id:'BROCK',symbol:'BROCK',name:'BaseRocky',decimals:18,address:typeof BROCK!=='undefined'?BROCK:null,icon:typeof LOGO!=='undefined'?LOGO:'',cg:null}
  ],
  eth: [
    {id:'ETH',symbol:'ETH',name:'Ethereum',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png',cg:'ethereum'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'0xdAC17F958D2ee523a2206206994597C13D831ec7',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'WETH',symbol:'WETH',name:'Wrapped Ether',decimals:18,address:'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',icon:'https://assets.coingecko.com/coins/images/2518/small/weth.png',cg:'weth'},
    {id:'DAI',symbol:'DAI',name:'Dai',decimals:18,address:'0x6B175474E89094C44Da98b954EedeAC495271d0F',icon:'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',cg:'dai'}
  ],
  bnb: [
    {id:'BNB',symbol:'BNB',name:'BNB',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',cg:'binancecoin'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:18,address:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:18,address:'0x55d398326f99059fF775485246999027B3197955',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'ETH',symbol:'ETH',name:'Ethereum',decimals:18,address:'0x2170Ed0880ac9A755fd29B2688956BD959F933F8',icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png',cg:'ethereum'},
    {id:'BUSD',symbol:'BUSD',name:'Binance USD',decimals:18,address:'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',icon:'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',cg:'binance-usd'}
  ],
  pol: [
    {id:'MATIC',symbol:'POL',name:'Polygon',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/4713/small/polygon.png',cg:'matic-network'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'0x3c499c542cEF5E3811e1192cebdfC99413fAB3bB',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'0xc2132D05D31c914a87C6611C10748AEb04B58e8F',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'WETH',symbol:'WETH',name:'Wrapped Ether',decimals:18,address:'0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',icon:'https://assets.coingecko.com/coins/images/2518/small/weth.png',cg:'weth'}
  ],
  arb: [
    {id:'ETH',symbol:'ETH',name:'Ethereum',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png',cg:'ethereum'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'ARB',symbol:'ARB',name:'Arbitrum',decimals:18,address:'0x912CE59144191C1204E64559FE8253a0e49E6548',icon:'https://assets.coingecko.com/coins/images/16547/small/arb.jpg',cg:'arbitrum'}
  ],
  op: [
    {id:'ETH',symbol:'ETH',name:'Ethereum',decimals:18,address:null,icon:'https://assets.coingecko.com/coins/images/279/small/ethereum.png',cg:'ethereum'},
    {id:'USDC',symbol:'USDC',name:'USD Coin',decimals:6,address:'0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',icon:'https://assets.coingecko.com/coins/images/6319/small/usdc.png',cg:'usd-coin'},
    {id:'USDT',symbol:'USDT',name:'Tether',decimals:6,address:'0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',icon:'https://assets.coingecko.com/coins/images/325/small/Tether.png',cg:'tether'},
    {id:'OP',symbol:'OP',name:'Optimism',decimals:18,address:'0x4200000000000000000000000000000000000042',icon:'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',cg:'optimism'}
  ]
};


/* ===== QRIS Server API =====
   Empty = same-origin (/api/...). For Android/Capacitor, set this to the
   deployed backend URL, e.g. https://qris.example.com, before core.js loads.
*/
var BR_QRIS_API_BASE = window.BR_QRIS_API_BASE || '';

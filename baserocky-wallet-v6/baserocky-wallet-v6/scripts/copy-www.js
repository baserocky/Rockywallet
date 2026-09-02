/**
 * Copy web assets → www/ for Capacitor
 * Run: node scripts/copy-www.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'splash-logo.png'
];

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(www)) fs.mkdirSync(www, { recursive: true });
else {
  // clean but keep folder
  for (const name of fs.readdirSync(www)) {
    const p = path.join(www, name);
    if (fs.statSync(p).isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
}

for (const f of files) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(www, f));
    console.log('copy', f);
  } else {
    console.warn('skip missing', f);
  }
}

const jsSrc = path.join(root, 'js');
if (fs.existsSync(jsSrc)) {
  copyDir(jsSrc, path.join(www, 'js'));
  console.log('copy js/');
}

console.log('www/ ready for Capacitor');

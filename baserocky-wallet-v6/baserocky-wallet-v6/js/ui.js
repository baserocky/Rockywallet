/**
 * BaseRocky Wallet — UI helpers
 * showScreen, toast, modal, loading, nav
 * Depends on: config.js (state)
 */

function showToast(msg){try{const t=document.getElementById('toast');if(!t)return;t.textContent=msg||'';t.classList.add('show');setTimeout(function(){try{t.classList.remove('show')}catch(e){}},3000)}catch(e){}}
function setLoading(on){try{var el=document.getElementById('loading');if(el)el.classList.toggle('show',!!on)}catch(e){}}
function showScreen(name){
  try{
    if(!name || typeof name !== 'string') name = (state && state.address) ? 'home' : 'onboard';
    var screens = document.querySelectorAll('.screen');
    for(var i=0;i<screens.length;i++){
      screens[i].classList.remove('active');
      try{
        screens[i].style.removeProperty('display');
        screens[i].style.removeProperty('opacity');
        screens[i].style.removeProperty('visibility');
      }catch(e){}
    }
    var el = document.getElementById('screen-'+name);
    if(!el){
      name = (state && state.address) ? 'home' : 'onboard';
      el = document.getElementById('screen-'+name);
    }
    if(el){
      el.classList.add('active');
    if(name==='history'){
      try{
        var ht=document.querySelector('#screen-history [data-i18n="history"]');
        if(ht&&typeof I18N!=='undefined'&&I18N.t) ht.textContent=I18N.t('history');
        if(typeof loadHistory==='function') loadHistory(false);
        else if(typeof renderHistory==='function') renderHistory();
      }catch(e){}
    }
    try{ if(typeof I18N!=='undefined'&&I18N.apply) setTimeout(function(){I18N.apply(el);},30); }catch(e){} /* i18n auto */
      try{
        el.style.display = 'flex';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      }catch(e){}
    }
    var nav = document.getElementById('bottomNav');
    var unlocked = !!(state && state.address);
    var hideNav = !unlocked || ['onboard','seed','import','confirm-seed','pin','preferences'].indexOf(name) >= 0;
    if(nav) nav.style.display = hideNav ? 'none' : 'flex';
    try{
      var isTf = (name === 'transfer' || name === 'addrpick' || name === 'tf-confirm');
      document.body.classList.toggle('tf-open', !!isTf);
    }catch(e){}

    if(name==='home'){
      try{ if(typeof renderHome==='function') renderHome(); }catch(e){ console.warn('renderHome',e); }
      try{
        var hn=document.getElementById('homeWalletName');
        if(hn) hn.textContent = (state && state.walletName) || 'Wallet';
        var hs=document.getElementById('homeWalletShort');
        if(hs && state && state.address) hs.textContent = '('+state.address.slice(-4)+')';
      }catch(e){}
    }
    if(name==='receive'){ try{ setTimeout(function(){ if(typeof renderReceive==='function') renderReceive(); }, 80); }catch(e){} }
    if(name==='send'){ try{ if(typeof populateSendTokens==='function') populateSendTokens(); if(typeof updateSendAvail==='function') updateSendAvail(); }catch(e){} }
    if(name==='swap'){ try{ if(typeof renderSwapUI==='function') renderSwapUI(); }catch(e){} }
    if(name==='settings'){
      try{ if(typeof I18N!=='undefined'&&I18N.apply) I18N.apply(); }catch(e){}
      try{ if(typeof renderSettingsHeader==='function') renderSettingsHeader(); }catch(e){}
      try{ var sn=document.getElementById('setWalletName'); if(sn) sn.textContent=(state&&state.walletName)||'Wallet'; }catch(e){}
    }
    if(name==='discover'){ try{ if(typeof renderDiscover==='function') renderDiscover(); }catch(e){} }
    if(name==='preferences'||name==='crypto101'||name==='help'){ try{ if(typeof I18N!=='undefined'&&I18N.apply) I18N.apply(); if(typeof refreshPrefLabels==='function') refreshPrefLabels(); }catch(e){} }
    if(name==='dapps'){
      try{ if(typeof I18N!=='undefined'&&I18N.apply) I18N.apply(); }catch(e){}
      try{ if(typeof renderDapps==='function') renderDapps(); }catch(e){}
      try{
        var bb=document.getElementById('berandaBal');
        if(bb && state && state.tokens){
          var t=0;
          state.tokens.forEach(function(tk){ t+=(state.balances[tk.id]||0)*(state.prices[tk.id]||0); });
          if(typeof fmtUsd==='function') bb.textContent=fmtUsd(t);
        }
      }catch(e){}
    }
    try{ window.__brLastScreen = name; }catch(e){}
  }catch(err){
    console.error('showScreen fatal', err);
    try{
      var home = document.getElementById('screen-home') || document.getElementById('screen-onboard');
      if(home){
        document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
        home.classList.add('active');
        home.style.display = 'flex';
      }
    }catch(e2){}
  }
}
function navTo(name,btn){
  try{
    document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    showScreen(name);
  }catch(e){
    console.error('navTo', e);
    try{ showScreen(name || 'home'); }catch(e2){}
  }
}
function openModal(html){try{var mc=document.getElementById('modalContent');var mb=document.getElementById('modalBackdrop');if(!mc||!mb)return;mc.innerHTML='<div class="modal-handle"></div>'+(html||'');mb.classList.add('show')}catch(e){console.warn('openModal',e)}}
function closeModal(){try{var mb=document.getElementById('modalBackdrop');if(mb)mb.classList.remove('show')}catch(e){}}

function showLoading(msg){
  var el = document.getElementById('loading');
  if(!el) return;
  var m = document.getElementById('loadingMsg');
  if(m) m.textContent = msg || 'Memuat…';
  el.classList.add('show');
}
function hideLoading(){
  var el = document.getElementById('loading');
  if(el) el.classList.remove('show');
}
function withLoading(promise, msg){
  showLoading(msg);
  return Promise.resolve(promise).then(function(v){ hideLoading(); return v; }, function(e){ hideLoading(); throw e; });
}
function setBtnLoading(btn, on){
  if(!btn) return;
  if(on){ btn.classList.add('loading'); btn.disabled = true; }
  else { btn.classList.remove('loading'); btn.disabled = false; }
}



/* BOOT_I18N_SYNC */
(function(){
  function sync(){
    try {
      var L = localStorage.getItem('br_lang') || 'id';
      if (typeof I18N !== 'undefined' && I18N.setLang) I18N.setLang(L);
      else if (typeof I18N !== 'undefined' && I18N.apply) I18N.apply();
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(sync, 300); });
  else setTimeout(sync, 300);
  setTimeout(sync, 1200);
})();

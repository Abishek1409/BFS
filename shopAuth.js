// Firebase sign-in for the billing page (shop account) and the QR page (anonymous).
// Browser only: window.ShopAuth
//   ShopAuth.whenShop(cb)   -> runs cb once the shop account is signed in (billing page)
//   ShopAuth.signInAnon()   -> Promise<uid> for customers (QR page)
(function () {
  'use strict';

  var waiting = [];
  var shopReady = false;

  function auth() {
    if (!window.firebase || !firebase.apps || !firebase.apps.length || !firebase.auth) return null;
    return firebase.auth();
  }

  function flush(user) {
    shopReady = true;
    var list = waiting.splice(0);
    list.forEach(function (cb) {
      try { cb(user); } catch (e) { console.error('ShopAuth callback failed:', e); }
    });
  }

  function whenShop(cb) {
    var a = auth();
    if (!a) { console.warn('ShopAuth: Firebase Auth not loaded'); return; }
    if (shopReady && a.currentUser && !a.currentUser.isAnonymous) { cb(a.currentUser); return; }
    waiting.push(cb);
  }

  function signInAnon() {
    var a = auth();
    if (!a) return Promise.reject(new Error('Firebase Auth not loaded'));
    if (a.currentUser) return Promise.resolve(a.currentUser.uid);
    return a.signInAnonymously().then(function (cred) { return cred.user.uid; });
  }

  // --- Shop sign-in box (billing page only) ---

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  function showLogin(a) {
    if (document.getElementById('shopLoginOverlay')) return;
    var overlay = el('div', { id: 'shopLoginOverlay', class: 'overlay show', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'shopLoginTitle' });
    var box = el('form', { class: 'modal', autocomplete: 'on' });
    var title = el('h3', { id: 'shopLoginTitle' }, 'Shop sign-in');
    var hint = el('p', { style: 'margin:6px 0 12px;font-size:.85rem;opacity:.8' },
      'Sign in once on this computer to receive QR orders. You will stay signed in.');
    var emailLbl = el('label', { for: 'shopEmail' }, 'Email');
    var email = el('input', { id: 'shopEmail', type: 'email', autocomplete: 'username', required: 'required', style: 'width:100%;margin:4px 0 10px' });
    var passLbl = el('label', { for: 'shopPass' }, 'Password');
    var pass = el('input', { id: 'shopPass', type: 'password', autocomplete: 'current-password', required: 'required', style: 'width:100%;margin:4px 0 10px' });
    var err = el('div', { role: 'alert', style: 'color:#ff6b6b;min-height:1.2em;font-size:.85rem' });
    var btn = el('button', { type: 'submit', class: 'btn-primary', style: 'width:100%;margin-top:6px' }, 'Sign in');
    var later = el('button', { type: 'button', style: 'width:100%;margin-top:8px;background:none;border:0;color:inherit;opacity:.7;cursor:pointer' }, 'Not now (billing only, no QR orders)');

    box.append(title, hint, emailLbl, email, passLbl, pass, err, btn, later);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    email.focus();

    later.addEventListener('click', function () { overlay.remove(); });
    box.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      a.signInWithEmailAndPassword(email.value.trim(), pass.value)
        .then(function () { overlay.remove(); })
        .catch(function (ex) {
          var code = ex && ex.code || '';
          err.textContent = /network/.test(code) ? 'Cannot reach Firebase. Check the internet connection.'
            : /too-many-requests/.test(code) ? 'Too many attempts. Try again in a few minutes.'
            : 'Incorrect email or password.';
          btn.disabled = false;
          btn.textContent = 'Sign in';
          pass.value = '';
          pass.focus();
        });
    });
  }

  function initShop() {
    var a = auth();
    if (!a) return;
    a.onAuthStateChanged(function (user) {
      if (user && !user.isAnonymous) { flush(user); return; }
      if (user && user.isAnonymous) { a.signOut(); return; } // billing page must use the shop account
      shopReady = false;
      var start = function () { showLogin(a); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    });
  }

  function signOutShop() {
    var a = auth();
    if (a) return a.signOut().then(function () { location.reload(); });
  }

  window.ShopAuth = { whenShop: whenShop, signInAnon: signInAnon, initShop: initShop, signOut: signOutShop, showLogin: function () { var a = auth(); if (a) showLogin(a); } };
})();

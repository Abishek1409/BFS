// Admin Auth — client side of the JWT admin login
// Exposes API via window.AdminAuth

(function () {
  'use strict';

  var TOKEN_KEY = 'bfs_admin_token';
  var FAIL_KEY = 'bfs_admin_fail';
  var LOGIN_URL = '/api/admin/login';
  var VERIFY_URL = '/api/admin/verify';
  var MAX_FAILS = 5;
  var WINDOW_MS = 15 * 60 * 1000; // 15 minutes (Req 2.5)
  var LOCK_MS = 15 * 60 * 1000;
  var MAX_TIMER_MS = 2147483647; // setTimeout upper bound

  var listeners = [];
  var expiryTimer = null;
  var loginPrompt = null; // set by UI to open the login modal

  // --- Storage helpers (tolerate blocked localStorage) ---

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { console.warn('AdminAuth: storage unavailable'); }
  }
  function remove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  // --- Token helpers ---

  /** Decodes the JWT payload without verifying it (server does verification). */
  function decodePayload(token) {
    try {
      var part = token.split('.')[1];
      var b64 = part.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(window.atob(b64));
    } catch (e) {
      return null;
    }
  }

  function getToken() { return read(TOKEN_KEY); }

  function getExp() {
    var token = getToken();
    var payload = token && decodePayload(token);
    return payload && typeof payload.exp === 'number' ? payload.exp : null;
  }

  function emit() {
    var active = isActive();
    listeners.slice().forEach(function (fn) {
      try { fn(active); } catch (e) { console.error('AdminAuth listener error:', e); }
    });
  }

  function scheduleExpiry() {
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;
    var exp = getExp();
    if (!exp) return;
    var ms = exp * 1000 - Date.now();
    if (ms <= 0) { clearSession(); return; }
    expiryTimer = setTimeout(function () {
      // Re-check in case ms exceeded the timer limit
      if (getExp() && getExp() * 1000 <= Date.now()) clearSession();
      else scheduleExpiry();
    }, Math.min(ms, MAX_TIMER_MS));
  }

  /** Deletes the token and notifies the UI (Req 3.3, 3.4). */
  function clearSession() {
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;
    var had = getToken() !== null;
    remove(TOKEN_KEY);
    if (had) emit();
  }

  // --- Lockout tracking (Req 2.5) ---

  function readFails() {
    try {
      var f = JSON.parse(read(FAIL_KEY));
      if (f && typeof f.count === 'number') return f;
    } catch (e) { /* ignore */ }
    return { count: 0, firstAt: 0, lockedUntil: 0 };
  }

  function lockedForMs() {
    var left = readFails().lockedUntil - Date.now();
    return left > 0 ? left : 0;
  }

  function recordFailure() {
    var now = Date.now();
    var f = readFails();
    if (!f.firstAt || now - f.firstAt > WINDOW_MS) f = { count: 0, firstAt: now, lockedUntil: 0 };
    f.count += 1;
    if (f.count >= MAX_FAILS) {
      f.lockedUntil = now + LOCK_MS;
      f.count = 0;
      f.firstAt = 0;
    }
    write(FAIL_KEY, JSON.stringify(f));
    return lockedForMs();
  }

  // --- Public API ---

  /**
   * Sends the password to the login function and stores the JWT on success.
   * @returns {Promise<{ok:boolean, error?:string, lockedForMs?:number}>}
   */
  function login(password) {
    var wait = lockedForMs();
    if (wait > 0) {
      return Promise.resolve({ ok: false, error: 'Too many attempts', lockedForMs: wait });
    }

    return fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: String(password || '') })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok && data && typeof data.token === 'string') {
          write(TOKEN_KEY, data.token); // Req 2.3
          remove(FAIL_KEY);
          scheduleExpiry();
          emit();
          return { ok: true };
        }
        if (res.status === 401) {
          var lock = recordFailure();
          var out = { ok: false, error: 'Incorrect password' }; // Req 2.4
          if (lock > 0) out.lockedForMs = lock;
          return out;
        }
        return { ok: false, error: (data && data.error) || 'Login failed' };
      });
    }, function () {
      return { ok: false, error: 'Cannot reach login server' };
    });
  }

  function logout() {
    clearSession();
  }

  /** Local check only: token present and not expired. */
  function isActive() {
    var exp = getExp();
    return exp !== null && exp * 1000 > Date.now();
  }

  /**
   * Asks the server to verify the stored token (Req 3.1, 3.2).
   * Clears the token when rejected (Req 3.3). If the server is unreachable,
   * falls back to the local expiry check so offline sessions last until exp.
   * @returns {Promise<boolean>}
   */
  function validate() {
    var token = getToken();
    if (!token) return Promise.resolve(false);
    if (!isActive()) { clearSession(); return Promise.resolve(false); }

    return fetch(VERIFY_URL, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
      cache: 'no-store'
    }).then(function (res) {
      if (res.ok) { scheduleExpiry(); return true; }
      clearSession();
      return false;
    }, function () {
      return isActive();
    });
  }

  /**
   * Runs onGranted when the session is valid, otherwise opens the login prompt.
   * @param {Function} onGranted
   */
  function requireAdmin(onGranted) {
    return validate().then(function (ok) {
      if (ok) {
        if (typeof onGranted === 'function') onGranted();
      } else if (typeof loginPrompt === 'function') {
        loginPrompt(onGranted);
      }
    });
  }

  /** Registers a listener called with `isActive` whenever the session changes. */
  function onChange(listener) {
    if (typeof listener === 'function') listeners.push(listener);
  }

  /** UI hook: function(onGranted) that opens the login modal. */
  function setLoginPrompt(fn) {
    loginPrompt = typeof fn === 'function' ? fn : null;
  }

  // Keep tabs in sync when the token changes elsewhere
  window.addEventListener('storage', function (e) {
    if (e.key === TOKEN_KEY) { scheduleExpiry(); emit(); }
  });

  scheduleExpiry();

  window.AdminAuth = {
    login: login,
    logout: logout,
    isActive: isActive,
    validate: validate,
    requireAdmin: requireAdmin,
    onChange: onChange,
    setLoginPrompt: setLoginPrompt,
    lockedForMs: lockedForMs
  };
})();

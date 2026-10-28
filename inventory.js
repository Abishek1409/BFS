// Inventory — menu items, prices, availability, and stock (localStorage)
// Browser: window.Inventory  |  Node: module.exports = { create, validateInventoryFile, ... }

(function (root) {
  'use strict';

  // v2: new BFS menu. Old v1 data is left in storage untouched.
  var STORAGE_KEY = 'bfs_inventory_v2';
  var MIN_PRICE = 1;
  var MAX_PRICE = 100000;
  var PRICE_ERROR = 'Price must be between 1 and 100000';
  var IMPORT_ERROR = 'Invalid inventory file';

  // --- Pure helpers ---

  function validPrice(p) {
    return typeof p === 'number' && isFinite(p) && p >= MIN_PRICE && p <= MAX_PRICE;
  }

  function toPrice(value) {
    if (typeof value === 'string' && value.trim() === '') return NaN;
    return Number(value);
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normName(name) { return String(name || '').trim().toLowerCase(); }

  /** Converts a seed/imported entry into a full Item. */
  function normalizeItem(src) {
    // Old saves used stock.{tracked,qty}; treat tracked + qty 0 as out of stock.
    var old = src.stock || {};
    var inStock = typeof src.inStock === 'boolean' ? src.inStock : !(old.tracked === true && old.qty === 0);
    return {
      id: src.id,
      name: String(src.name).trim(),
      emoji: typeof src.emoji === 'string' ? src.emoji : '',
      img: typeof src.img === 'string' ? src.img : '',
      price: src.price,
      cat: String(src.cat || ''),
      specs: Array.isArray(src.specs) ? src.specs.map(String) : [],
      available: src.available !== false,
      inStock: inStock
    };
  }

  /** Returns true when `data` is a structurally valid InventoryFile (Req 8.5). */
  function validateInventoryFile(data) {
    if (!data || typeof data !== 'object' || data.version !== 1) return false;
    if (!Array.isArray(data.items) || !Number.isInteger(data.nextId)) return false;
    var ids = {};
    var names = {};
    for (var i = 0; i < data.items.length; i++) {
      var it = data.items[i];
      if (!it || typeof it !== 'object') return false;
      if (!Number.isInteger(it.id) || it.id < 1 || ids[it.id]) return false;
      if (typeof it.name !== 'string' || !it.name.trim()) return false;
      var key = normName(it.name);
      if (names[key]) return false;
      if (!validPrice(it.price)) return false;
      if (typeof it.cat !== 'string') return false;
      if (it.img !== undefined && typeof it.img !== 'string') return false;
      if (it.specs !== undefined && !Array.isArray(it.specs)) return false;
      if (it.inStock !== undefined && typeof it.inStock !== 'boolean') return false;
      ids[it.id] = true;
      names[key] = true;
    }
    return true;
  }

  function maxId(items) {
    return items.reduce(function (m, it) { return it.id > m ? it.id : m; }, 0);
  }

  // --- Default storage (tolerates blocked localStorage) ---

  function defaultStorage() {
    try {
      if (root && root.localStorage) {
        var ls = root.localStorage;
        return {
          getItem: function (k) { try { return ls.getItem(k); } catch (e) { return null; } },
          setItem: function (k, v) {
            try { ls.setItem(k, v); } catch (e) { console.warn('Inventory: storage unavailable, changes kept in memory'); }
          }
        };
      }
    } catch (e) { /* access to localStorage can throw */ }
    var mem = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); }
    };
  }

  // --- Inventory instance ---

  /**
   * Creates an Inventory bound to a storage object with getItem/setItem.
   * @param {{getItem:Function,setItem:Function}} [storage]
   */
  function create(storage) {
    var store = storage || defaultStorage();
    var state = { version: 1, nextId: 1, items: [] };
    var listeners = [];
    var commitListeners = [];
    var pending = {};   // normalized names added on this device and not yet uploaded
    var synced = false; // true once this device has merged the shared menu at least once

    function persist() {
      var out = { version: state.version, nextId: state.nextId, items: state.items, pending: pending, synced: synced };
      store.setItem(STORAGE_KEY, JSON.stringify(out)); // Req 8.3
    }

    function emit() {
      var snapshot = getAll();
      listeners.slice().forEach(function (fn) {
        try { fn(snapshot); } catch (e) { console.error('Inventory listener error:', e); }
      });
    }

    function commit() {
      persist();
      emit();
      commitListeners.slice().forEach(function (fn) {
        try { fn(); } catch (e) { console.error('Inventory commit listener error:', e); }
      });
    }

    function find(id) {
      var n = Number(id);
      for (var i = 0; i < state.items.length; i++) if (state.items[i].id === n) return state.items[i];
      return null;
    }

    function ok(item) { return { ok: true, item: clone(item) }; }
    function fail(error) { return { ok: false, error: error }; }

    function nameTaken(name, exceptId) {
      var key = normName(name);
      return state.items.some(function (it) { return it.id !== exceptId && normName(it.name) === key; });
    }

    /**
     * Loads the Inventory from storage, seeding from `seedMenu` when empty (Req 8.1, 8.2).
     * @param {Array} [seedMenu]
     * @returns {Array} items
     */
    function load(seedMenu) {
      var parsed = null;
      try { parsed = JSON.parse(store.getItem(STORAGE_KEY)); } catch (e) { parsed = null; }

      if (validateInventoryFile(parsed) && parsed.items.length) {
        var items = parsed.items.map(normalizeItem);
        pending = parsed.pending && typeof parsed.pending === 'object' ? parsed.pending : {};
        synced = parsed.synced === true;
        // Keep artwork paths current with the built-in menu; prices and stock stay as saved.
        var seedImg = {};
        (Array.isArray(seedMenu) ? seedMenu : []).forEach(function (s) {
          if (s && typeof s.img === 'string') seedImg[s.id] = s.img;
        });
        var imgChanged = false;
        items.forEach(function (it) {
          if (Object.prototype.hasOwnProperty.call(seedImg, it.id) && it.img !== seedImg[it.id]) {
            it.img = seedImg[it.id]; imgChanged = true;
          }
        });
        state = { version: 1, nextId: Math.max(parsed.nextId, maxId(items) + 1), items: items };
        if (imgChanged) persist();
      } else {
        var seed = Array.isArray(seedMenu) ? seedMenu : [];
        var seeded = seed.map(normalizeItem);
        state = { version: 1, nextId: maxId(seeded) + 1, items: seeded };
        if (seeded.length) persist();
      }
      emit();
      return getAll();
    }

    function getAll() { return clone(state.items); }

    function get(id) { var it = find(id); return it ? clone(it) : null; }

    /** Items shown on the menu grid (Req 6.5). */
    function getAvailable() {
      return clone(state.items.filter(function (it) { return it.available; }));
    }

    /** Req 5.2, 5.3, 5.4 */
    function updatePrice(id, price) {
      var item = find(id);
      if (!item) return fail('Item not found');
      var p = toPrice(price);
      if (!validPrice(p)) return fail(PRICE_ERROR);
      item.price = p;
      commit();
      return ok(item);
    }

    /** Req 6.2, 6.3 */
    function addItem(fields) {
      var f = fields || {};
      var name = String(f.name == null ? '' : f.name).trim();
      if (!name) return fail('Name is required');
      if (nameTaken(name, null)) return fail('An item named "' + name + '" already exists');
      var p = toPrice(f.price);
      if (!validPrice(p)) return fail(PRICE_ERROR);
      var cat = String(f.cat == null ? '' : f.cat).trim();
      if (!cat) return fail('Category is required');

      var item = normalizeItem({
        id: state.nextId,
        name: name,
        emoji: f.emoji ? String(f.emoji) : '',
        img: typeof f.img === 'string' ? f.img : '',
        price: p,
        cat: cat,
        specs: Array.isArray(f.specs) ? f.specs : [],
        available: true
      });
      state.nextId += 1;
      state.items.push(item);
      pending[normName(name)] = true; // not on the shared menu yet
      commit();
      return ok(item);
    }

    /** Req 6.4 */
    function setAvailable(id, available) {
      var item = find(id);
      if (!item) return fail('Item not found');
      item.available = !!available;
      commit();
      return ok(item);
    }

    /** Marks an item In stock (true) or Out of stock (false). */
    function setInStock(id, inStock) {
      var item = find(id);
      if (!item) return fail('Item not found');
      item.inStock = !!inStock;
      commit();
      return ok(item);
    }

    function isOutOfStock(item) {
      return !!(item && item.inStock === false);
    }

    /**
     * Replaces the menu with the shared copy from Firebase (other laptops' changes).
     * Local items whose name is not in the shared copy are kept (re-numbered if their id is taken)
     * so nothing added offline is lost. Does not fire onCommit, so it never echoes back.
     * @param {Array} remoteItems
     * @returns {{ok:boolean, kept:number}} kept = local-only items that still need uploading
     */
    function applyRemote(remoteItems) {
      var list = (Array.isArray(remoteItems) ? remoteItems : []).filter(function (it) {
        return it && Number.isInteger(it.id) && it.id >= 1 && typeof it.name === 'string' && it.name.trim() && validPrice(it.price);
      }).map(normalizeItem);
      if (!list.length) return { ok: false, kept: 0 };
      var names = {}, ids = {};
      list.forEach(function (it) { names[normName(it.name)] = true; ids[it.id] = true; });
      var next = maxId(list) + 1;
      var kept = 0;
      // First sync on this device keeps every local-only item (added before sync existed).
      // After that, only items added here and not yet uploaded are kept, so removals elsewhere stick.
      var firstSync = !synced;
      Object.keys(pending).forEach(function (k) { if (names[k]) delete pending[k]; });
      state.items.forEach(function (local) {
        var key = normName(local.name);
        if (names[key]) return;
        if (!firstSync && !pending[key]) return;
        pending[key] = true;
        var copy = clone(local);
        if (ids[copy.id]) copy.id = next;
        next = Math.max(next, copy.id + 1);
        ids[copy.id] = true;
        names[normName(copy.name)] = true;
        list.push(copy);
        kept++;
      });
      list.sort(function (a, b) { return a.id - b.id; });
      state = { version: 1, nextId: Math.max(next, maxId(list) + 1), items: list };
      synced = true;
      persist();
      emit();
      return { ok: true, kept: kept };
    }

    /** Call after the shared copy saved successfully; local additions are now on the server. */
    function markUploaded() {
      pending = {};
      synced = true;
      persist();
    }

    /** Permanently removes an item from the menu and inventory. Past bills are not changed. */
    function removeItem(id) {
      var item = find(id);
      if (!item) return fail('Item not found');
      state.items = state.items.filter(function (it) { return it !== item; });
      delete pending[normName(item.name)];
      commit();
      return ok(item);
    }

    /** Listener for changes made on this device (not ones received via applyRemote). */
    function onCommit(listener) {
      if (typeof listener === 'function') commitListeners.push(listener);
    }

    /** Req 8.4 */
    function exportJson() { return JSON.stringify(state, null, 2); }

    /** Replaces the Inventory only when the file is valid (Req 8.4, 8.5). */
    function importJson(text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { return fail(IMPORT_ERROR); }
      if (!validateInventoryFile(data) || !data.items.length) return fail(IMPORT_ERROR);
      var items = data.items.map(normalizeItem);
      state = { version: 1, nextId: Math.max(data.nextId, maxId(items) + 1), items: items };
      commit();
      return { ok: true, count: items.length };
    }

    function onChange(listener) {
      if (typeof listener === 'function') listeners.push(listener);
    }

    return {
      load: load,
      getAll: getAll,
      get: get,
      getAvailable: getAvailable,
      updatePrice: updatePrice,
      addItem: addItem,
      setAvailable: setAvailable,
      setInStock: setInStock,
      isOutOfStock: isOutOfStock,
      applyRemote: applyRemote,
      markUploaded: markUploaded,
      removeItem: removeItem,
      onCommit: onCommit,
      exportJson: exportJson,
      importJson: importJson,
      onChange: onChange
    };
  }

  var api = {
    create: create,
    validateInventoryFile: validateInventoryFile,
    STORAGE_KEY: STORAGE_KEY,
    PRICE_ERROR: PRICE_ERROR,
    IMPORT_ERROR: IMPORT_ERROR
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    var instance = create();
    instance.create = create;
    window.Inventory = instance;
  }
})(typeof window !== 'undefined' ? window : null);

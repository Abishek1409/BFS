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

  function isWholeNonNeg(n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0; }

  function validPrice(p) {
    return typeof p === 'number' && isFinite(p) && p >= MIN_PRICE && p <= MAX_PRICE;
  }

  function toPrice(value) {
    if (typeof value === 'string' && value.trim() === '') return NaN;
    return Number(value);
  }

  function toWhole(value) {
    var n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normName(name) { return String(name || '').trim().toLowerCase(); }

  /** Converts a seed/imported entry into a full Item. */
  function normalizeItem(src) {
    var stock = src.stock || {};
    return {
      id: src.id,
      name: String(src.name).trim(),
      emoji: typeof src.emoji === 'string' ? src.emoji : '',
      img: typeof src.img === 'string' ? src.img : '',
      price: src.price,
      cat: String(src.cat || ''),
      specs: Array.isArray(src.specs) ? src.specs.map(String) : [],
      available: src.available !== false,
      stock: {
        tracked: stock.tracked === true,
        qty: isWholeNonNeg(stock.qty) ? stock.qty : 0,
        lowAt: isWholeNonNeg(stock.lowAt) ? stock.lowAt : 0
      }
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
      if (it.stock !== undefined) {
        var s = it.stock;
        if (!s || typeof s !== 'object') return false;
        if (s.qty !== undefined && !isWholeNonNeg(s.qty)) return false;
        if (s.lowAt !== undefined && !isWholeNonNeg(s.lowAt)) return false;
      }
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

    function persist() {
      store.setItem(STORAGE_KEY, JSON.stringify(state)); // Req 8.3
    }

    function emit() {
      var snapshot = getAll();
      listeners.slice().forEach(function (fn) {
        try { fn(snapshot); } catch (e) { console.error('Inventory listener error:', e); }
      });
    }

    function commit() { persist(); emit(); }

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
        state = { version: 1, nextId: Math.max(parsed.nextId, maxId(items) + 1), items: items };
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
        price: p,
        cat: cat,
        specs: Array.isArray(f.specs) ? f.specs : [],
        available: true
      });
      state.nextId += 1;
      state.items.push(item);
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

    /** Enables/disables stock tracking and optionally sets qty and threshold (Req 7.1). */
    function setTracking(id, enabled, qty, lowAt) {
      var item = find(id);
      if (!item) return fail('Item not found');
      var q = qty === undefined ? item.stock.qty : toWhole(qty);
      var l = lowAt === undefined ? item.stock.lowAt : toWhole(lowAt);
      if (q === null) return fail('Stock quantity must be a whole number of 0 or more');
      if (l === null) return fail('Low-stock threshold must be a whole number of 0 or more');
      item.stock = { tracked: !!enabled, qty: q, lowAt: l };
      commit();
      return ok(item);
    }

    /** Req 7.2 */
    function restock(id, amount) {
      var item = find(id);
      if (!item) return fail('Item not found');
      if (!item.stock.tracked) return fail('Stock tracking is off for this item');
      var a = toWhole(amount);
      if (a === null || a < 1) return fail('Restock amount must be a whole number of 1 or more');
      item.stock.qty += a;
      commit();
      return ok(item);
    }

    /** Matches a bill line to an item by id, then baseName, then name. */
    function findForLine(line) {
      if (line.id != null) { var byId = find(line.id); if (byId) return byId; }
      var keys = [line.baseName, line.name].filter(Boolean).map(normName);
      for (var i = 0; i < keys.length; i++) {
        for (var j = 0; j < state.items.length; j++) {
          if (normName(state.items[j].name) === keys[i]) return state.items[j];
        }
      }
      return null;
    }

    /** Subtracts billed quantities from tracked items, floored at 0 (Req 7.3). */
    function deductForBill(billItems) {
      if (!Array.isArray(billItems)) return;
      var changed = false;
      billItems.forEach(function (line) {
        if (!line) return;
        var item = findForLine(line);
        if (!item || !item.stock.tracked) return;
        var q = Math.max(0, Math.floor(Number(line.qty) || 0));
        if (!q) return;
        item.stock.qty = Math.max(0, item.stock.qty - q);
        changed = true;
      });
      if (changed) commit();
    }

    function isLowStock(item) {
      return !!(item && item.stock.tracked && item.stock.qty <= item.stock.lowAt);
    }

    function isOutOfStock(item) {
      return !!(item && item.stock.tracked && item.stock.qty === 0);
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
      setTracking: setTracking,
      restock: restock,
      deductForBill: deductForBill,
      isLowStock: isLowStock,
      isOutOfStock: isOutOfStock,
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

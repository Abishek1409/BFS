// Bill History Storage — BFSBillHistory IndexedDB module
// Exposes API via window.BillHistory

(function () {
  'use strict';

  // --- Internal DB connection cache ---
  let _dbPromise = null;

  /**
   * Opens (or creates) the BFSBillHistory IndexedDB database.
   * Caches and reuses the connection across all calls.
   * @returns {Promise<IDBDatabase>}
   */
  function _getDB() {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this browser.'));
      }

      var request = window.indexedDB.open('BFSBillHistory', 1);

      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains('bills')) {
          db.createObjectStore('bills', { keyPath: 'billNo' });
        }
      };

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        _dbPromise = null; // allow retry on next call
        reject(new Error('Failed to open BFSBillHistory: ' + event.target.error));
      };
    });

    return _dbPromise;
  }

  // --- Date/time helpers ---

  /** Returns "DD-MM-YYYY" from a Date object. */
  function _formatDate(d) {
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '-' + mm + '-' + d.getFullYear();
  }

  /** Returns "HH:MM" (24-hour) from a Date object. */
  function _formatTime(d) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /**
   * Parses a "DD-MM-YYYY" string to a Date at midnight local time.
   * @param {string} str
   * @returns {Date}
   */
  function _parseDate(str) {
    var parts = str.split('-').map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  /**
   * Converts "DD-MM-YYYY" to an integer YYYYMMDD for fast comparison/sorting.
   * @param {string} dateStr
   * @returns {number}
   */
  function _dateKey(dateStr) {
    var parts = dateStr.split('-');
    return parseInt(parts[2] + parts[1] + parts[0], 10);
  }

  // --- Public functions ---

  /**
   * Saves (or overwrites) a bill record in IndexedDB.
   * Date and time are auto-generated from the device clock at call time.
   * @param {string} billNo  - Non-empty bill/invoice number (primary key).
   * @param {number} amount  - Finite numeric total in INR.
   * @returns {Promise<void>}
   */
  function saveBillRecord(billNo, amount) {
    if (typeof billNo !== 'string' || billNo.trim() === '') {
      return Promise.reject(new Error('billNo must be a non-empty string'));
    }
    if (typeof amount !== 'number' || !isFinite(amount)) {
      return Promise.reject(new Error('amount must be a finite number'));
    }

    var now = new Date();
    var record = {
      billNo: billNo,
      amount: amount,
      date: _formatDate(now),
      time: _formatTime(now)
    };

    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('bills', 'readwrite');
        var store = tx.objectStore('bills');
        var req = store.put(record);

        req.onsuccess = function () { resolve(); };
        req.onerror = function (event) {
          reject(new Error('Failed to save bill record: ' + event.target.error));
        };
      });
    });
  }

  /**
   * Returns all bill records sorted newest-first (by date then time, descending).
   * @returns {Promise<BillRecord[]>}
   */
  function getAllBillRecords() {
    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('bills', 'readonly');
        var store = tx.objectStore('bills');
        var req = store.getAll();

        req.onsuccess = function (event) {
          var records = event.target.result;
          records.sort(function (a, b) {
            var keyA = _dateKey(a.date) * 10000 + parseInt(a.time.replace(':', ''), 10);
            var keyB = _dateKey(b.date) * 10000 + parseInt(b.time.replace(':', ''), 10);
            return keyB - keyA; // descending
          });
          resolve(records);
        };

        req.onerror = function (event) {
          reject(new Error('Failed to retrieve bill records: ' + event.target.error));
        };
      });
    });
  }

  /**
   * Validates a "DD-MM-YYYY" date string.
   * @param {string} str
   * @returns {boolean}
   */
  function _isValidDateStr(str) {
    if (typeof str !== 'string') return false;
    var match = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return false;
    var d = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    var y = parseInt(match[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    return true;
  }

  /**
   * Returns bill records whose date falls within [startDate, endDate] (inclusive).
   * Both dates must be in "DD-MM-YYYY" format.
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<BillRecord[]>}
   */
  function getBillRecordsByDateRange(startDate, endDate) {
    if (!_isValidDateStr(startDate) || !_isValidDateStr(endDate)) {
      return Promise.reject(new Error('Invalid date format, expected DD-MM-YYYY'));
    }

    var startKey = _dateKey(startDate);
    var endKey = _dateKey(endDate);

    return getAllBillRecords().then(function (records) {
      return records.filter(function (r) {
        var key = _dateKey(r.date);
        return key >= startKey && key <= endKey;
      });
    });
  }

  /**
   * Downloads bill records for a given day or month as a JSON file.
   * @param {"day"|"month"} mode   - "day" expects period in "DD-MM-YYYY"; "month" expects "MM-YYYY".
   * @param {string}        period - Date string matching the chosen mode.
   * @returns {Promise<void>}
   */
  function downloadBillHistory(mode, period) {
    var recordsPromise;
    var filename;

    if (mode === 'day') {
      if (!_isValidDateStr(period)) {
        return Promise.reject(new Error('Invalid date format, expected DD-MM-YYYY'));
      }
      recordsPromise = getBillRecordsByDateRange(period, period);
      filename = 'bills-' + period + '.json';

    } else if (mode === 'month') {
      var monthMatch = typeof period === 'string' && period.match(/^(\d{2})-(\d{4})$/);
      if (!monthMatch) {
        return Promise.reject(new Error('Invalid month format, expected MM-YYYY'));
      }
      var mm = parseInt(monthMatch[1], 10);
      var yyyy = parseInt(monthMatch[2], 10);
      if (mm < 1 || mm > 12) {
        return Promise.reject(new Error('Invalid month value in MM-YYYY'));
      }
      // First and last day of the month
      var firstDay = String(1).padStart(2, '0') + '-' + monthMatch[1] + '-' + monthMatch[2];
      var lastDayDate = new Date(yyyy, mm, 0); // day 0 of next month = last day of this month
      var lastDay = _formatDate(lastDayDate);
      recordsPromise = getBillRecordsByDateRange(firstDay, lastDay);
      filename = 'bills-' + period + '.json';

    } else {
      return Promise.reject(new Error('mode must be "day" or "month"'));
    }

    return recordsPromise.then(function (records) {
      var json = JSON.stringify(records, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    });
  }

  // --- Public API ---
  window.BillHistory = {
    saveBillRecord: saveBillRecord,
    getAllBillRecords: getAllBillRecords,
    getBillRecordsByDateRange: getBillRecordsByDateRange,
    downloadBillHistory: downloadBillHistory,
    // Internal helpers exposed for testability
    _getDB: _getDB,
    _formatDate: _formatDate,
    _formatTime: _formatTime,
    _parseDate: _parseDate,
    _dateKey: _dateKey
  };
})();

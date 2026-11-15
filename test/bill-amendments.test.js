'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createBillHistory(records) {
  const db = {
    transaction() {
      const tx = {
        aborted: false,
        completeScheduled: false,
        objectStore() {
          return {
            get(key) {
              const request = {};
              setImmediate(() => {
                request.result = records.get(key);
                if (request.onsuccess) request.onsuccess({ target: request });
                if (!tx.aborted && !tx.completeScheduled) {
                  tx.completeScheduled = true;
                  setImmediate(() => tx.oncomplete && tx.oncomplete({ target: { error: null } }));
                }
              });
              return request;
            },
            put(record) {
              records.set(record.recordId, record);
            }
          };
        },
        abort() {
          tx.aborted = true;
          setImmediate(() => tx.onabort && tx.onabort({ target: { error: new Error('aborted') } }));
        }
      };
      return tx;
    }
  };
  const window = {
    indexedDB: {
      open() {
        const request = {};
        setImmediate(() => request.onsuccess && request.onsuccess({ target: { result: db } }));
        return request;
      }
    }
  };
  const context = { window, Promise, Number, Array, Error, Date, Intl };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'billHistory.js'), 'utf8'),
    context
  );
  return { history: window.BillHistory, records };
}

test('bill amendments append once and recalculate the same bill total', async () => {
  const recordId = '15-11-2026_104';
  const records = new Map([[recordId, {
    recordId,
    billNo: '104',
    amount: 50,
    items: [{ name: 'Tea', total: 50 }]
  }]]);
  const { history } = createBillHistory(records);
  const additions = [{ name: 'Onion Rings', total: 50 }];

  const updated = await history.appendBillItems(recordId, 'amendment-1', additions);
  assert.equal(updated.billNo, '104');
  assert.equal(updated.amount, 100);
  assert.equal(updated.items.length, 2);

  const retried = await history.appendBillItems(recordId, 'amendment-1', additions);
  assert.equal(retried.amount, 100);
  assert.equal(retried.items.length, 2);
});

test('bill amendments fail when the original bill is not on this billing device', async () => {
  const { history } = createBillHistory(new Map());
  await assert.rejects(
    history.appendBillItems('15-11-2026_104', 'amendment-1', [{ total: 50 }]),
    /Bill record not found/
  );
});

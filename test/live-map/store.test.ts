import assert from 'node:assert/strict';
import test from 'node:test';
import { isPermissionDenied } from '../../map3d/lib/store.ts';

test('detects RTDB permission errors', () => {
  assert.equal(isPermissionDenied({ code: 'PERMISSION_DENIED', message: 'x' }), true);
  assert.equal(isPermissionDenied(new Error('permission_denied at /liveMap/tables/3')), true);
  assert.equal(isPermissionDenied(new Error('network error')), false);
  assert.equal(isPermissionDenied(null), false);
});

/**
 * Unit Tests for Table Status Mapping and Color Transitions
 * Task 9: Testing table status mapping functions and color transition logic
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock React for testing
global.React = {
  useRef: () => ({ current: null }),
  useEffect: () => {},
  useState: (initial) => [initial, () => {}],
  useCallback: (fn) => fn,
};

describe('Table Status Mapping and Color Transitions - Task 9', () => {
  
  it('should correctly map Firebase statuses to table visual statuses', () => {
    const { mapFirebaseStatus } = require('../map3d/lib/utils.js');
    const { TableStatus } = require('../map3d/lib/config.js');
    
    // Test standard status mappings
    assert.strictEqual(mapFirebaseStatus('pending'), TableStatus.ORDER_PLACED, 'Pending should map to ORDER_PLACED');
    assert.strictEqual(mapFirebaseStatus('preparing'), TableStatus.PREPARING, 'Preparing should map to PREPARING');
    assert.strictEqual(mapFirebaseStatus('ready'), TableStatus.READY_TO_SERVE, 'Ready should map to READY_TO_SERVE');
    assert.strictEqual(mapFirebaseStatus('served'), TableStatus.NEEDS_BILL, 'Served should map to NEEDS_BILL');
    assert.strictEqual(mapFirebaseStatus('paid'), TableStatus.FREE, 'Paid should map to FREE');
    
    // Test case insensitive mappings
    assert.strictEqual(mapFirebaseStatus('PENDING'), TableStatus.ORDER_PLACED, 'Uppercase PENDING should map correctly');
    assert.strictEqual(mapFirebaseStatus('Ready'), TableStatus.READY_TO_SERVE, 'Mixed case Ready should map correctly');
    
    // Test fallback status mappings
    assert.strictEqual(mapFirebaseStatus('new'), TableStatus.ORDER_PLACED, 'New should map to ORDER_PLACED');
    assert.strictEqual(mapFirebaseStatus('completed'), TableStatus.FREE, 'Completed should map to FREE');
    assert.strictEqual(mapFirebaseStatus('cancelled'), TableStatus.FREE, 'Cancelled should map to FREE');
    
    // Test unknown status fallback
    assert.strictEqual(mapFirebaseStatus('unknown_status'), TableStatus.FREE, 'Unknown status should default to FREE');
    assert.strictEqual(mapFirebaseStatus(null), TableStatus.FREE, 'Null status should default to FREE');
    assert.strictEqual(mapFirebaseStatus(undefined), TableStatus.FREE, 'Undefined status should default to FREE');
  });
  
  it('should handle table occupancy logic correctly', () => {
    const { mapFirebaseStatus } = require('../map3d/lib/utils.js');
    const { TableStatus } = require('../map3d/lib/config.js');
    
    // Test table with customers but no order
    assert.strictEqual(
      mapFirebaseStatus('paid', true), 
      TableStatus.OCCUPIED, 
      'Table with customers should show OCCUPIED even if status is paid'
    );
    
    assert.strictEqual(
      mapFirebaseStatus('completed', true), 
      TableStatus.OCCUPIED, 
      'Table with customers should show OCCUPIED even if status is completed'
    );
    
    // Test table with order - should use order status regardless of customers
    assert.strictEqual(
      mapFirebaseStatus('preparing', true), 
      TableStatus.PREPARING, 
      'Table with order should show order status even with customers'
    );
    
    // Test empty table
    assert.strictEqual(
      mapFirebaseStatus('paid', false), 
      TableStatus.FREE, 
      'Empty table with paid status should show FREE'
    );
  });
  
  it('should validate status color mappings are correct', () => {
    const { STATUS_COLORS, TableStatus } = require('../map3d/lib/config.js');
    
    // Check all status types have valid hex colors
    Object.values(TableStatus).forEach(status => {
      const color = STATUS_COLORS[status];
      assert.ok(color, `Status ${status} should have a color defined`);
      assert.ok(color.startsWith('#'), `Color ${color} should be in hex format`);
      assert.ok(/^#[0-9A-Fa-f]{6}$/.test(color), `Color ${color} should be valid 6-digit hex`);
    });
    
    // Verify specific theme colors
    assert.strictEqual(STATUS_COLORS[TableStatus.NEEDS_BILL], '#d9a83e', 'NEEDS_BILL should use gold theme color');
    assert.strictEqual(STATUS_COLORS[TableStatus.ORDER_PLACED], '#d69e2e', 'ORDER_PLACED should use amber theme color');
    
    // Verify color distinctiveness (no duplicate colors)
    const colorValues = Object.values(STATUS_COLORS);
    const uniqueColors = [...new Set(colorValues)];
    assert.strictEqual(colorValues.length, uniqueColors.length, 'All status colors should be unique');
  });
  
  it('should test color transition interpolation functions', () => {
    const { colorUtils } = require('../map3d/lib/utils.js');
    
    // Test hex to RGB conversion
    const red = colorUtils.hexToRgb('#ff0000');
    assert.deepStrictEqual(red, { r: 255, g: 0, b: 0 }, 'Should convert red hex to RGB correctly');
    
    const blue = colorUtils.hexToRgb('#0000ff');
    assert.deepStrictEqual(blue, { r: 0, g: 0, b: 255 }, 'Should convert blue hex to RGB correctly');
    
    // Test RGB to hex conversion
    assert.strictEqual(colorUtils.rgbToHex(255, 0, 0), '#ff0000', 'Should convert RGB to hex correctly');
    assert.strictEqual(colorUtils.rgbToHex(0, 255, 0), '#00ff00', 'Should convert green RGB to hex correctly');
    
    // Test color interpolation
    const midColor = colorUtils.interpolateColor('#ff0000', '#0000ff', 0.5);
    const midRgb = colorUtils.hexToRgb(midColor);
    
    // Should be roughly in the middle between red and blue
    assert.ok(midRgb.r > 100 && midRgb.r < 200, 'Interpolated red component should be in middle range');
    assert.ok(midRgb.b > 100 && midRgb.b < 200, 'Interpolated blue component should be in middle range');
    
    // Test edge cases
    const startColor = colorUtils.interpolateColor('#ff0000', '#0000ff', 0);
    const endColor = colorUtils.interpolateColor('#ff0000', '#0000ff', 1);
    
    assert.strictEqual(startColor.toLowerCase(), '#ff0000', 'Factor 0 should return first color');
    assert.strictEqual(endColor.toLowerCase(), '#0000ff', 'Factor 1 should return second color');
  });
  
  it('should test smooth color transition animation logic', () => {
    const { ANIMATION_CONFIG } = require('../map3d/lib/config.js');
    const { easing } = require('../map3d/lib/utils.js');
    
    // Test animation configuration exists
    assert.ok(ANIMATION_CONFIG.statusTransition, 'Should have status transition configuration');
    assert.ok(typeof ANIMATION_CONFIG.statusTransition.duration === 'number', 'Duration should be numeric');
    assert.ok(ANIMATION_CONFIG.statusTransition.duration > 0, 'Duration should be positive');
    
    // Test easing functions
    assert.ok(typeof easing.easeInOutQuad === 'function', 'Should have easeInOutQuad function');
    assert.ok(typeof easing.easeInOutCubic === 'function', 'Should have easeInOutCubic function');
    
    // Test easing function behavior
    const quadEasing = easing.easeInOutQuad;
    
    assert.strictEqual(quadEasing(0), 0, 'Easing at start should be 0');
    assert.strictEqual(quadEasing(1), 1, 'Easing at end should be 1');
    assert.ok(quadEasing(0.5) > 0.4 && quadEasing(0.5) < 0.6, 'Easing at middle should be around 0.5');
    
    // Test smooth transition (no abrupt changes)
    const steps = [0, 0.25, 0.5, 0.75, 1];
    const easingValues = steps.map(quadEasing);
    
    for (let i = 1; i < easingValues.length; i++) {
      const change = Math.abs(easingValues[i] - easingValues[i-1]);
      assert.ok(change < 0.5, 'Easing changes should be gradual, not abrupt');
    }
  });
  
  it('should test elapsed time formatting functions', () => {
    const { getElapsedTime } = require('../map3d/lib/utils.js');
    
    const now = Date.now();
    
    // Test seconds formatting
    assert.strictEqual(getElapsedTime(now - 30000), '30s', 'Should format seconds correctly');
    
    // Test minutes formatting
    assert.strictEqual(getElapsedTime(now - 120000), '2m', 'Should format minutes correctly');
    assert.strictEqual(getElapsedTime(now - 90000), '1m', 'Should format minute and half correctly');
    
    // Test hours formatting
    assert.strictEqual(getElapsedTime(now - 3600000), '1h 0m', 'Should format hours correctly');
    assert.strictEqual(getElapsedTime(now - 3900000), '1h 5m', 'Should format hours and minutes correctly');
    
    // Test edge cases
    assert.strictEqual(getElapsedTime(null), null, 'Should handle null timestamp');
    assert.strictEqual(getElapsedTime(undefined), null, 'Should handle undefined timestamp');
    assert.strictEqual(getElapsedTime(0), null, 'Should handle zero timestamp');
  });
  
  it('should test order number formatting functions', () => {
    const { formatOrderNumber } = require('../map3d/lib/utils.js');
    
    // Test basic formatting
    assert.strictEqual(formatOrderNumber('1'), '#001', 'Should pad single digit with zeros');
    assert.strictEqual(formatOrderNumber('42'), '#042', 'Should pad double digit with one zero');
    assert.strictEqual(formatOrderNumber('123'), '#123', 'Should not pad three digits');
    assert.strictEqual(formatOrderNumber('1234'), '#1234', 'Should handle four digits');
    
    // Test numeric input
    assert.strictEqual(formatOrderNumber(5), '#005', 'Should handle numeric input');
    assert.strictEqual(formatOrderNumber(99), '#099', 'Should handle two-digit numeric input');
    
    // Test edge cases
    assert.strictEqual(formatOrderNumber(null), null, 'Should handle null input');
    assert.strictEqual(formatOrderNumber(undefined), null, 'Should handle undefined input');
    assert.strictEqual(formatOrderNumber(''), null, 'Should handle empty string');
  });
  
  it('should validate status transition timing is reasonable for UX', () => {
    const { ANIMATION_CONFIG } = require('../map3d/lib/config.js');
    
    const duration = ANIMATION_CONFIG.statusTransition.duration;
    
    // Ensure transition duration is appropriate for UX
    assert.ok(duration >= 0.1, 'Transition should not be too fast (jarring)');
    assert.ok(duration <= 1.0, 'Transition should not be too slow (sluggish)');
    assert.ok(duration >= 0.2 && duration <= 0.5, 'Transition should be in optimal UX range (0.2-0.5s)');
    
    // Test easing is smooth (not linear)
    const easingType = ANIMATION_CONFIG.statusTransition.easing;
    assert.ok(typeof easingType === 'string', 'Easing should be specified as string');
    assert.ok(easingType !== 'linear', 'Should not use linear easing (not smooth)');
  });
  
  it('should test table position and layout validation', () => {
    const { CAFE_LAYOUT } = require('../map3d/lib/config.js');
    
    // Test all tables have valid positions
    CAFE_LAYOUT.tables.forEach(table => {
      assert.ok(Array.isArray(table.position), `Table ${table.id} should have position array`);
      assert.strictEqual(table.position.length, 3, `Table ${table.id} position should be [x, y, z]`);
      
      const [x, y, z] = table.position;
      assert.ok(typeof x === 'number', `Table ${table.id} x position should be numeric`);
      assert.ok(typeof y === 'number', `Table ${table.id} y position should be numeric`);
      assert.ok(typeof z === 'number', `Table ${table.id} z position should be numeric`);
      
      // Ensure tables are positioned reasonably in café space
      assert.ok(x >= -5 && x <= 5, `Table ${table.id} x position should be within café bounds`);
      assert.ok(y >= -1 && y <= 1, `Table ${table.id} y position should be at floor level`);
      assert.ok(z >= -5 && z <= 5, `Table ${table.id} z position should be within café bounds`);
    });
    
    // Test no tables overlap (minimum distance between tables)
    for (let i = 0; i < CAFE_LAYOUT.tables.length; i++) {
      for (let j = i + 1; j < CAFE_LAYOUT.tables.length; j++) {
        const table1 = CAFE_LAYOUT.tables[i];
        const table2 = CAFE_LAYOUT.tables[j];
        
        const dx = table1.position[0] - table2.position[0];
        const dz = table1.position[2] - table2.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        assert.ok(distance >= 1.5, `Tables ${table1.id} and ${table2.id} should have minimum distance`);
      }
    }
  });

});
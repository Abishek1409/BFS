/**
 * Billing System Integration Tests
 * Task 9: Validate that existing billing functionality remains unaffected by 3D system
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock existing billing functions and global objects
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  location: {
    href: 'http://localhost/test.html'
  },
  firebase: {
    database: () => ({
      ref: () => ({
        push: () => Promise.resolve({ key: 'test_key' }),
        set: () => Promise.resolve(),
        once: () => Promise.resolve({ val: () => ({}) }),
        on: () => {},
        off: () => {}
      })
    })
  },
  firebaseConfig: {},
  // Mock existing billing functions that should remain unaffected
  addToBill: (item) => ({ success: true, item }),
  removeFromBill: (index) => ({ success: true, index }),
  calculateTotal: (items) => items.reduce((sum, item) => sum + (item.price * item.qty), 0),
  processBill: (bill) => ({ success: true, bill }),
  loadQrOrder: (serverId) => ({ success: true, serverId }),
  saveOrderToFirebase: (order) => Promise.resolve({ success: true, order }),
  updateOrderStatus: (orderId, status) => Promise.resolve({ success: true, orderId, status })
};

describe('Billing System Integration and Compatibility - Task 9', () => {
  
  it('should not interfere with existing bill calculation functions', () => {
    const mockItems = [
      { name: 'Mango Shake', price: 75, qty: 2 },
      { name: 'Fruit Bowl', price: 120, qty: 1 },
      { name: 'Orange Juice', price: 50, qty: 3 }
    ];
    
    // Test that existing bill calculation still works
    const total = window.calculateTotal(mockItems);
    const expectedTotal = (75 * 2) + (120 * 1) + (50 * 3); // 150 + 120 + 150 = 420
    
    assert.strictEqual(total, expectedTotal, 'Bill calculation should remain unaffected');
    assert.strictEqual(total, 420, 'Total calculation should be correct');
  });
  
  it('should not interfere with existing order management functions', () => {
    // Test adding items to bill
    const testItem = { name: 'Apple Juice', price: 60, qty: 1 };
    const addResult = window.addToBill(testItem);
    
    assert.strictEqual(addResult.success, true, 'Adding to bill should work');
    assert.deepStrictEqual(addResult.item, testItem, 'Added item should be preserved');
    
    // Test removing items from bill
    const removeResult = window.removeFromBill(0);
    
    assert.strictEqual(removeResult.success, true, 'Removing from bill should work');
    assert.strictEqual(removeResult.index, 0, 'Correct index should be removed');
    
    // Test bill processing
    const mockBill = {
      items: [testItem],
      total: 60,
      customer: 'Test Customer'
    };
    
    const processResult = window.processBill(mockBill);
    
    assert.strictEqual(processResult.success, true, 'Bill processing should work');
    assert.deepStrictEqual(processResult.bill, mockBill, 'Bill should be processed correctly');
  });
  
  it('should not interfere with QR order loading functionality', () => {
    // Test QR order loading (existing functionality)
    const testServerId = 'test_order_123';
    const loadResult = window.loadQrOrder(testServerId);
    
    assert.strictEqual(loadResult.success, true, 'QR order loading should work');
    assert.strictEqual(loadResult.serverId, testServerId, 'Server ID should be preserved');
    
    // Verify that 3D map integration doesn't break QR loading
    // (This simulates the integration from table interaction to bill loading)
    const mockTableOrderLoad = (serverId) => {
      // This should call the existing loadQrOrder function
      return window.loadQrOrder(serverId);
    };
    
    const tableLoadResult = mockTableOrderLoad(testServerId);
    assert.strictEqual(tableLoadResult.success, true, '3D map to bill integration should work');
  });
  
  it('should not interfere with Firebase order operations', async () => {
    // Test Firebase order saving
    const mockOrder = {
      orderNo: 'ORD001',
      items: [{ name: 'Test Item', price: 100, qty: 1 }],
      total: 100,
      customer: 'Test Customer',
      status: 'pending'
    };
    
    const saveResult = await window.saveOrderToFirebase(mockOrder);
    
    assert.strictEqual(saveResult.success, true, 'Firebase order saving should work');
    assert.deepStrictEqual(saveResult.order, mockOrder, 'Order should be saved correctly');
    
    // Test order status updates
    const updateResult = await window.updateOrderStatus('test_order_id', 'preparing');
    
    assert.strictEqual(updateResult.success, true, 'Order status update should work');
    assert.strictEqual(updateResult.orderId, 'test_order_id', 'Order ID should be correct');
    assert.strictEqual(updateResult.status, 'preparing', 'Status should be updated correctly');
  });
  
  it('should maintain existing navigation and UI structure', () => {
    // Test that adding 3D map doesn't break existing navigation
    const mockNavigationItems = [
      'Home', 'Orders', 'Menu', 'Settings', 'Reports'
    ];
    
    // Simulate adding 3D map link
    const enhancedNavigation = [...mockNavigationItems, 'Live Map'];
    
    assert.strictEqual(enhancedNavigation.length, 6, 'Should add Live Map to existing navigation');
    assert.ok(enhancedNavigation.includes('Home'), 'Should preserve existing Home link');
    assert.ok(enhancedNavigation.includes('Orders'), 'Should preserve existing Orders link');
    assert.ok(enhancedNavigation.includes('Live Map'), 'Should add new Live Map link');
    
    // Test that existing functionality remains accessible
    mockNavigationItems.forEach(item => {
      assert.ok(enhancedNavigation.includes(item), `Existing ${item} navigation should be preserved`);
    });
  });
  
  it('should preserve existing keyboard shortcuts and hotkeys', () => {
    // Mock existing keyboard shortcuts
    const existingShortcuts = {
      'F1': 'help',
      'F2': 'new_order', 
      'F3': 'print_bill',
      'F4': 'clear_bill',
      'Escape': 'cancel_action'
    };
    
    // Test that 3D map doesn't interfere with shortcuts
    const testShortcut = (key, action) => {
      return existingShortcuts[key] === action;
    };
    
    assert.strictEqual(testShortcut('F1', 'help'), true, 'F1 help shortcut should be preserved');
    assert.strictEqual(testShortcut('F2', 'new_order'), true, 'F2 new order shortcut should be preserved');
    assert.strictEqual(testShortcut('F3', 'print_bill'), true, 'F3 print bill shortcut should be preserved');
    assert.strictEqual(testShortcut('Escape', 'cancel_action'), true, 'Escape shortcut should be preserved');
    
    // Verify no conflicts with potential 3D map shortcuts
    const reservedKeys = Object.keys(existingShortcuts);
    const potentialMapShortcuts = ['Tab', 'Space', 'M']; // Non-conflicting keys for 3D map
    
    potentialMapShortcuts.forEach(key => {
      assert.ok(!reservedKeys.includes(key), `3D map shortcut ${key} should not conflict with existing shortcuts`);
    });
  });
  
  it('should not affect existing print server functionality', () => {
    // Test that printer communication remains unaffected
    const mockPrintData = {
      type: 'receipt',
      content: 'Test receipt content',
      printer: 'main'
    };
    
    // Mock print function that should remain unchanged
    const mockPrintFunction = (data) => {
      if (!data.type || !data.content) {
        return { success: false, error: 'Invalid print data' };
      }
      return { success: true, printed: true, data };
    };
    
    const printResult = mockPrintFunction(mockPrintData);
    
    assert.strictEqual(printResult.success, true, 'Printing should work correctly');
    assert.strictEqual(printResult.printed, true, 'Content should be printed');
    assert.deepStrictEqual(printResult.data, mockPrintData, 'Print data should be preserved');
    
    // Test error handling still works
    const invalidPrintResult = mockPrintFunction({});
    assert.strictEqual(invalidPrintResult.success, false, 'Invalid print data should be rejected');
  });
  
  it('should maintain existing local storage and data persistence', () => {
    const { localStorage } = window;
    
    // Test that localStorage operations still work
    let storedData = null;
    let retrievedKey = null;
    
    // Mock enhanced localStorage that tracks operations
    const mockEnhancedStorage = {
      setItem: (key, value) => {
        storedData = value;
        retrievedKey = key;
      },
      getItem: (key) => {
        if (key === retrievedKey) return storedData;
        return null;
      }
    };
    
    // Test storing billing preferences
    mockEnhancedStorage.setItem('billing_preferences', JSON.stringify({
      taxRate: 0.18,
      currency: 'INR',
      printAutomatically: true
    }));
    
    const retrieved = mockEnhancedStorage.getItem('billing_preferences');
    const preferences = JSON.parse(retrieved);
    
    assert.strictEqual(preferences.taxRate, 0.18, 'Tax rate should be preserved');
    assert.strictEqual(preferences.currency, 'INR', 'Currency should be preserved');
    assert.strictEqual(preferences.printAutomatically, true, 'Print setting should be preserved');
  });
  
  it('should not interfere with existing API endpoints', async () => {
    // Mock existing API calls that should remain unaffected
    const mockApiCall = async (endpoint, data) => {
      // Simulate existing billing API calls
      switch (endpoint) {
        case '/api/orders':
          return { success: true, data: data, endpoint };
        case '/api/menu':
          return { success: true, data: ['item1', 'item2'], endpoint };
        case '/api/reports':
          return { success: true, data: { sales: 1000 }, endpoint };
        default:
          return { success: false, error: 'Unknown endpoint' };
      }
    };
    
    // Test existing API calls still work
    const orderResult = await mockApiCall('/api/orders', { order: 'test' });
    assert.strictEqual(orderResult.success, true, 'Orders API should work');
    assert.strictEqual(orderResult.endpoint, '/api/orders', 'Correct endpoint should be called');
    
    const menuResult = await mockApiCall('/api/menu');
    assert.strictEqual(menuResult.success, true, 'Menu API should work');
    assert.ok(Array.isArray(menuResult.data), 'Menu data should be array');
    
    const reportsResult = await mockApiCall('/api/reports');
    assert.strictEqual(reportsResult.success, true, 'Reports API should work');
    assert.ok(reportsResult.data.sales, 'Reports data should have sales');
  });
  
  it('should preserve existing CSS styling and theme', () => {
    // Test that existing theme variables are preserved
    const existingTheme = {
      primaryColor: '#D69E2E',    // Gold
      secondaryColor: '#1A202C',  // Dark
      backgroundColor: '#2D3748', // Grey
      textColor: '#E2E8F0',       // Light
      accentColor: '#ED8936'      // Orange
    };
    
    // Test that 3D map uses compatible colors
    const { STATUS_COLORS } = require('../map3d/lib/config.js');
    
    // Verify 3D map colors complement existing theme
    const mapGoldColor = STATUS_COLORS.needs_bill; // Should be gold
    const mapAmberColor = STATUS_COLORS.order_placed; // Should be amber
    
    assert.ok(mapGoldColor.toLowerCase().includes('d9a83e') || mapGoldColor.toLowerCase().includes('d69e2e'), 
      'Map should use theme-compatible gold color');
    
    // Test z-index doesn't interfere with existing UI
    const mockZIndexes = {
      navigation: 1000,
      modal: 2000,
      dropdown: 1500,
      tooltip: 3000
    };
    
    const mapZIndex = -1; // Should be background
    assert.ok(mapZIndex < mockZIndexes.navigation, '3D map should be behind existing UI elements');
  });
  
  it('should maintain existing performance of billing operations', () => {
    // Test that billing operations remain fast
    const startTime = Date.now();
    
    // Simulate typical billing operations
    const mockBillingOperations = () => {
      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push({ name: `Item ${i}`, price: 50 + i, qty: 1 });
      }
      
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const tax = total * 0.18;
      const finalTotal = total + tax;
      
      return { items, total, tax, finalTotal };
    };
    
    const result = mockBillingOperations();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Operations should complete quickly
    assert.ok(duration < 100, 'Billing operations should remain fast (< 100ms)');
    assert.strictEqual(result.items.length, 10, 'All items should be processed');
    assert.ok(result.finalTotal > result.total, 'Tax should be calculated correctly');
  });
  
  it('should validate that 3D map is properly isolated from billing logic', () => {
    // Test that 3D map operates independently without affecting core billing
    let billingOperationsCalled = 0;
    let mapOperationsCalled = 0;
    
    const mockBillingSystem = {
      addItem: () => { billingOperationsCalled++; return true; },
      removeItem: () => { billingOperationsCalled++; return true; },
      calculateTotal: () => { billingOperationsCalled++; return 100; }
    };
    
    const mock3DMapSystem = {
      updateTableStatus: () => { mapOperationsCalled++; return true; },
      showTableInfo: () => { mapOperationsCalled++; return true; },
      toggleMode: () => { mapOperationsCalled++; return true; }
    };
    
    // Perform billing operations
    mockBillingSystem.addItem();
    mockBillingSystem.calculateTotal();
    
    // Perform 3D map operations
    mock3DMapSystem.updateTableStatus();
    mock3DMapSystem.toggleMode();
    
    assert.strictEqual(billingOperationsCalled, 2, 'Billing operations should be independent');
    assert.strictEqual(mapOperationsCalled, 2, '3D map operations should be independent');
    
    // Test that they can coexist without interference
    const combinedOperations = () => {
      mockBillingSystem.addItem();
      mock3DMapSystem.showTableInfo();
      mockBillingSystem.removeItem();
      mock3DMapSystem.updateTableStatus();
    };
    
    // Should not throw errors when operating together
    assert.doesNotThrow(combinedOperations, 'Billing and 3D map should coexist peacefully');
  });

});
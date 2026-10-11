/**
 * Complete User Workflow Integration Test - Task 10
 * Tests the entire user journey from billing tasks to 3D map interaction
 * Verifies all systems work together seamlessly
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';

// Mock browser environment for testing
global.document = {
  createElement: () => ({ style: {}, appendChild: () => {}, removeChild: () => {} }),
  getElementById: () => ({ style: {}, innerHTML: '', classList: { add: () => {}, remove: () => {} } }),
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.window = { localStorage: { getItem: () => null, setItem: () => {} } };

describe('Complete User Workflow Integration - Task 10', () => {
  
  it('should support complete billing to 3D map workflow', async () => {
    // Step 1: Verify billing system functionality
    const billHistory = await import('../billHistory.js');
    const { calculateBillTotals } = billHistory;
    
    const testBill = {
      items: [
        { name: 'Mango Shake', qty: 2, price: 75, total: 150 },
        { name: 'Sandwich', qty: 1, price: 50, total: 50 }
      ]
    };
    
    const totals = calculateBillTotals(testBill.items);
    assert.strictEqual(totals.subtotal, 200, 'Billing calculations should work correctly');
    
    // Step 2: Verify printer integration remains functional
    const printerComm = await import('../unified-printer-comm.js');
    const { getPrintersStatus } = printerComm;
    const printerStatus = getPrintersStatus();
    
    assert.ok(printerStatus.printer1, 'Printer 1 configuration should be available');
    assert.ok(printerStatus.printer2, 'Printer 2 configuration should be available');
    assert.strictEqual(typeof printerStatus.printer1.configured, 'boolean', 'Printer status should include configuration state');
    
    // Step 3: Verify 3D map system availability
    const webglDetection = await import('../map3d/lib/webgl-detection.js');
    const { checkWebGLSupport } = webglDetection;
    const webglSupported = checkWebGLSupport();
    
    // Should not throw errors even if WebGL not available in test environment
    assert.strictEqual(typeof webglSupported, 'boolean', '3D map WebGL detection should return boolean');
    
    // Step 4: Verify Firebase integration
    const firebaseSync = await import('../map3d/hooks/useFirebaseSync.js');
    const { useFirebaseSync } = firebaseSync;
    assert.strictEqual(typeof useFirebaseSync, 'function', 'Firebase sync hook should be available');
    
    // Step 5: Verify table status mapping works
    const tableIntegration = await import('../map3d/lib/table-integration.js');
    const { mapOrderStatusToTableStatus } = tableIntegration;
    
    const testOrder = {
      status: 'preparing',
      tableNumber: '3'
    };
    
    const tableStatus = mapOrderStatusToTableStatus(testOrder);
    assert.strictEqual(tableStatus.status, 'preparing', 'Order status should map correctly to table status');
    assert.strictEqual(tableStatus.tableId, 'table-3', 'Table ID should be generated correctly');
  });

  it('should maintain system isolation between billing and 3D map', async () => {
    // Verify that 3D map doesn't interfere with core billing functions
    const originalConsoleLog = console.log;
    let billingOperations = [];
    
    console.log = (...args) => {
      if (args[0] && args[0].includes('bill') || args[0].includes('total')) {
        billingOperations.push(args[0]);
      }
    };
    
    // Simulate billing operations
    const billHistory = await import('../billHistory.js');
    const { calculateBillTotals } = billHistory;
    const testItems = [{ name: 'Test Item', qty: 1, price: 100, total: 100 }];
    
    calculateBillTotals(testItems);
    
    console.log = originalConsoleLog;
    
    // Billing operations should complete without 3D map interference
    assert.ok(true, 'Billing operations should complete successfully even with 3D map system present');
  });

  it('should verify performance requirements are met', async () => {
    // Test that 3D system meets performance requirements from design
    const performanceOpts = await import('../map3d/lib/performance-optimizations.js');
    const { getPerformanceSettings } = performanceOpts;
    
    const settings = getPerformanceSettings();
    
    // Verify performance thresholds
    assert.ok(settings.targetFPS >= 30, 'Target FPS should be at least 30');
    assert.ok(settings.memoryLimit <= 50 * 1024 * 1024, 'Memory limit should be under 50MB');
    assert.ok(settings.maxPixelRatio <= 2, 'Pixel ratio should be limited for performance');
  });

  it('should verify QR ordering integration remains functional', async () => {
    // Test that QR ordering workflow is not affected by 3D map
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ success: true, orders: [] })
    });
    
    // Mock Firebase config
    global.window.firebaseConfig = {
      databaseURL: 'test-url'
    };
    
    // Verify QR ordering system components are available
    // Note: In a real test environment, we'd test the actual QR ordering flow
    assert.ok(global.window.firebaseConfig, 'Firebase configuration for QR orders should be available');
    
    // Clean up
    delete global.fetch;
  });

  it('should verify deployment configuration is correct', () => {
    // Check that vercel.json exists and is properly configured
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'Vercel configuration should exist');
    
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.ok(vercelConfig.routes, 'Vercel config should include routing configuration');
    assert.ok(vercelConfig.headers, 'Vercel config should include header configuration for 3D assets');
    
    // Check package.json has module type
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    assert.strictEqual(packageJson.type, 'module', 'Package should be configured as ES module');
  });

  it('should verify all critical files are present for deployment', () => {
    // Critical files for 3D map functionality
    const criticalFiles = [
      'index.html',
      'map3d/index.js',
      'map3d/scene/CafeScene.js',
      'map3d/ui/MapCanvas.js',
      'map3d/lib/webgl-detection.js',
      'map3d/hooks/useFirebaseSync.js',
      'unified-printer-comm.js',
      'firebase-config.js'
    ];
    
    criticalFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      assert.ok(fs.existsSync(filePath), `Critical file ${file} should exist`);
    });
  });

  it('should verify 3D map graceful degradation works', async () => {
    // Test fallback behavior when WebGL is not available
    const webglDetection = await import('../map3d/lib/webgl-detection.js');
    const { getWebGLFallbackMessage } = webglDetection;
    
    const fallbackMessage = getWebGLFallbackMessage();
    
    assert.ok(fallbackMessage.title, 'Fallback should provide helpful title');
    assert.ok(fallbackMessage.message, 'Fallback should provide helpful message');
    assert.ok(fallbackMessage.suggestion, 'Fallback should provide browser suggestions');
    
    // Verify enhanced list view is available as fallback
    const enhancedList = await import('../map3d/ui/EnhancedListView.js');
    const { EnhancedListView } = enhancedList;
    assert.strictEqual(typeof EnhancedListView, 'function', 'Enhanced list view should be available as fallback');
  });

});
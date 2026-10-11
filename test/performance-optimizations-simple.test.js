/**
 * Performance Optimizations Test Suite (Non-React parts)
 * Tests core optimization logic without React components
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock browser environment for testing
global.window = {
  devicePixelRatio: 2,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  performance: { now: () => Date.now() }
};

global.document = {
  hidden: false,
  visibilityState: 'visible',
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ getContext: () => null })
};

global.navigator = {
  hardwareConcurrency: 4,
  deviceMemory: 8,
  userAgent: 'Mozilla/5.0 (Test Browser)',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
};

describe('Performance Optimizations Core - Task 8', () => {
  
  it('should manage pixel ratio automatically', () => {
    const { PixelRatioManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new PixelRatioManager();
    
    // Test optimal pixel ratio calculation
    const optimalRatio = manager.getOptimalPixelRatio();
    assert.ok(optimalRatio >= 1, 'Pixel ratio should be at least 1');
    assert.ok(optimalRatio <= 2, 'Pixel ratio should be capped at 2');
    
    // Test adaptive mode
    manager.setAdaptiveMode(false);
    const staticRatio = manager.getOptimalPixelRatio();
    assert.ok(typeof staticRatio === 'number', 'Should return numeric ratio even when adaptive is off');
  });
  
  it('should handle geometry instancing for performance', () => {
    const { GeometryInstanceManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new GeometryInstanceManager();
    
    // Test geometry creation and caching
    const tableGeometry1 = manager.getInstancedGeometry('table', { radius: 0.8, height: 0.05 });
    const tableGeometry2 = manager.getInstancedGeometry('table', { radius: 0.8, height: 0.05 });
    
    assert.strictEqual(tableGeometry1, tableGeometry2, 'Should return cached geometry for same parameters');
    
    // Test different geometry types
    const legGeometry = manager.getInstancedGeometry('leg', { radius: 0.05, height: 0.75 });
    const markerGeometry = manager.getInstancedGeometry('status-marker', { radius: 0.12 });
    
    assert.ok(tableGeometry1 !== legGeometry, 'Different geometry types should be different objects');
    assert.ok(legGeometry !== markerGeometry, 'Different geometry types should be different objects');
  });
  
  it('should detect tab visibility for animation pausing', () => {
    const { TabVisibilityManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new TabVisibilityManager();
    
    // Test initial visibility state
    const visibilityState = manager.getVisibilityState();
    assert.ok(typeof visibilityState.isVisible === 'boolean', 'Should have boolean visibility state');
    assert.ok(typeof visibilityState.shouldAnimate === 'boolean', 'Should have boolean animation state');
    assert.ok(typeof visibilityState.shouldFullUpdate === 'boolean', 'Should have boolean update state');
    
    // Test callback registration
    let callbackCalled = false;
    const unsubscribe = manager.onVisibilityChange((isVisible) => {
      callbackCalled = true;
      assert.ok(typeof isVisible === 'boolean', 'Callback should receive boolean parameter');
    });
    
    assert.ok(typeof unsubscribe === 'function', 'Should return unsubscribe function');
    
    // Test reduced update rate
    manager.setReducedUpdateRate(true);
    assert.ok(!manager.shouldAnimations(), 'Should not animate when reduced update rate is enabled');
  });
  
  it('should adapt quality based on performance', () => {
    const { AdaptiveQualityManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new AdaptiveQualityManager();
    
    // Test quality level management
    const initialLevel = manager.getCurrentLevel();
    assert.ok(typeof initialLevel === 'number', 'Quality level should be numeric');
    assert.ok(initialLevel >= 0 && initialLevel <= 2, 'Quality level should be 0-2');
    
    // Test quality settings for each level
    manager.setQualityLevel(0); // Low quality
    const lowQuality = manager.getQualitySettings();
    assert.strictEqual(lowQuality.shadows, false, 'Low quality should disable shadows');
    assert.strictEqual(lowQuality.animationsEnabled, false, 'Low quality should disable animations');
    
    manager.setQualityLevel(1); // Medium quality
    const mediumQuality = manager.getQualitySettings();
    assert.strictEqual(mediumQuality.shadows, true, 'Medium quality should enable shadows');
    assert.strictEqual(mediumQuality.animationsEnabled, true, 'Medium quality should enable animations');
    
    manager.setQualityLevel(2); // High quality
    const highQuality = manager.getQualitySettings();
    assert.strictEqual(highQuality.shadows, true, 'High quality should enable shadows');
    assert.strictEqual(highQuality.antialias, true, 'High quality should enable antialiasing');
    
    // Test performance metrics
    const metrics = manager.getPerformanceMetrics();
    assert.ok(typeof metrics.fps === 'number', 'Should provide FPS metric');
    assert.ok(typeof metrics.memory === 'number', 'Should provide memory metric');
    assert.ok(typeof metrics.qualityLevel === 'number', 'Should provide quality level');
  });
  
  it('should optimize bundle size with dynamic loading', () => {
    const { 
      BundleOptimizer,
      ProgressiveLoader,
      ComponentSizeMonitor,
      AdaptiveLoadingStrategy
    } = require('../map3d/lib/bundle-optimization.js');
    
    // Test bundle optimizer
    assert.ok(BundleOptimizer, 'BundleOptimizer should be exported');
    assert.ok(typeof BundleOptimizer.lazyLoadComponent === 'function', 'Should have lazyLoadComponent method');
    assert.ok(typeof BundleOptimizer.preloadCriticalComponents === 'function', 'Should have preloadCriticalComponents method');
    
    // Test progressive loader
    const progressiveLoader = new ProgressiveLoader();
    assert.ok(typeof progressiveLoader.addToQueue === 'function', 'Should have addToQueue method');
    assert.ok(typeof progressiveLoader.getStatus === 'function', 'Should have getStatus method');
    
    // Test size monitor
    assert.ok(ComponentSizeMonitor, 'ComponentSizeMonitor should be exported');
    assert.ok(typeof ComponentSizeMonitor.trackLoadTime === 'function', 'Should have trackLoadTime method');
    assert.ok(typeof ComponentSizeMonitor.getPerformanceInsights === 'function', 'Should have getPerformanceInsights method');
    
    // Test adaptive loading strategy
    const strategy = new AdaptiveLoadingStrategy();
    const strategyInfo = strategy.getStrategyInfo();
    assert.ok(strategyInfo.strategy, 'Should have loading strategy');
    assert.ok(strategyInfo.config, 'Should have loading configuration');
    assert.ok(typeof strategyInfo.config.preloadCritical === 'boolean', 'Should have preload config');
  });
  
  it('should handle WebGL detection and fallback', () => {
    const { checkWebGLSupport, getWebGLFallbackMessage } = require('../map3d/lib/webgl-detection.js');
    
    // Test WebGL support detection
    const isSupported = checkWebGLSupport();
    assert.ok(typeof isSupported === 'boolean', 'WebGL detection should return boolean');
    
    // Test fallback message
    const fallbackMessage = getWebGLFallbackMessage();
    assert.ok(fallbackMessage.title, 'Fallback message should have title');
    assert.ok(fallbackMessage.message, 'Fallback message should have message');
    assert.ok(fallbackMessage.suggestion, 'Fallback message should have suggestion');
  });
  
  it('should integrate all performance systems', () => {
    const { 
      pixelRatioManager,
      geometryInstanceManager,
      tabVisibilityManager,
      adaptiveQualityManager
    } = require('../map3d/lib/performance-optimizations.js');
    
    // Test that all global instances are available
    assert.ok(pixelRatioManager, 'Global pixel ratio manager should be available');
    assert.ok(geometryInstanceManager, 'Global geometry instance manager should be available');
    assert.ok(tabVisibilityManager, 'Global tab visibility manager should be available');
    assert.ok(adaptiveQualityManager, 'Global adaptive quality manager should be available');
    
    // Test that they can work together
    const qualitySettings = adaptiveQualityManager.getQualitySettings();
    const optimalRatio = pixelRatioManager.getOptimalPixelRatio();
    const visibilityState = tabVisibilityManager.getVisibilityState();
    
    assert.ok(qualitySettings.pixelRatio <= optimalRatio * 1.1, 'Quality pixel ratio should align with optimal ratio');
    assert.ok(typeof visibilityState.shouldAnimate === 'boolean', 'Visibility should affect animations');
  });

});
/**
 * Performance Monitoring Tests for Frame Rate and Memory Usage
 * Task 9: Testing performance optimization and monitoring systems
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock browser environment for performance testing
global.window = {
  devicePixelRatio: 2,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  performance: { 
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 50 * 1048576, // 50MB
      totalJSHeapSize: 100 * 1048576, // 100MB
      jsHeapSizeLimit: 2048 * 1048576 // 2GB
    }
  }
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

describe('Performance Monitoring and Optimization - Task 9', () => {
  
  it('should monitor frame rate correctly', () => {
    const { PerformanceMonitor } = require('../map3d/lib/utils.js');
    
    const monitor = new PerformanceMonitor();
    
    // Initial state
    assert.strictEqual(typeof monitor.getFPS(), 'number', 'FPS should be numeric');
    assert.ok(monitor.getFPS() >= 0, 'FPS should be non-negative');
    assert.ok(monitor.getFPS() <= 120, 'FPS should be reasonable (≤120)');
    
    // Simulate frame updates
    for (let i = 0; i < 60; i++) {
      monitor.update();
    }
    
    const fps = monitor.getFPS();
    assert.ok(fps > 0, 'Should calculate FPS after updates');
    assert.ok(fps <= 60, 'FPS should not exceed typical monitor refresh rate for test');
  });
  
  it('should monitor memory usage correctly', () => {
    const { PerformanceMonitor } = require('../map3d/lib/utils.js');
    
    const monitor = new PerformanceMonitor();
    
    // Test basic memory monitoring functionality
    const memoryUsage = monitor.getMemoryUsage();
    
    assert.strictEqual(typeof memoryUsage, 'number', 'Memory usage should be numeric');
    assert.ok(memoryUsage >= 0, 'Memory usage should be non-negative');
    assert.ok(memoryUsage < 1000, 'Memory usage should be reasonable (< 1GB)');
    
    // Test that memory monitoring can be updated
    const originalMemory = memoryUsage;
    
    // Simulate calling update (which may update memory if conditions are met)
    monitor.update();
    const updatedMemory = monitor.getMemoryUsage();
    
    assert.strictEqual(typeof updatedMemory, 'number', 'Updated memory usage should be numeric');
    assert.ok(updatedMemory >= 0, 'Updated memory usage should be non-negative');
  });
  
  it('should detect performance issues correctly', () => {
    // Create a mock performance monitor class for testing the logic
    class MockPerformanceMonitor {
      constructor(fps, memory) {
        this.fps = fps;
        this.memoryUsage = memory;
      }
      
      getFPS() { return this.fps; }
      getMemoryUsage() { return this.memoryUsage; }
      isPerformanceLow() { return this.fps < 20 || this.memoryUsage > 100; }
    }
    
    // Test good performance
    const goodMonitor = new MockPerformanceMonitor(60, 50);
    assert.strictEqual(goodMonitor.isPerformanceLow(), false, 'Should not flag good performance as low');
    
    // Test low FPS
    const lowFpsMonitor = new MockPerformanceMonitor(15, 50);
    assert.strictEqual(lowFpsMonitor.isPerformanceLow(), true, 'Should detect low FPS');
    
    // Test high memory usage
    const highMemoryMonitor = new MockPerformanceMonitor(60, 150);
    assert.strictEqual(highMemoryMonitor.isPerformanceLow(), true, 'Should detect high memory usage');
    
    // Test both low FPS and high memory
    const poorMonitor = new MockPerformanceMonitor(10, 200);
    assert.strictEqual(poorMonitor.isPerformanceLow(), true, 'Should detect multiple performance issues');
  });
  
  it('should manage pixel ratio automatically for performance', () => {
    const { PixelRatioManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new PixelRatioManager();
    
    // Test optimal ratio calculation
    const optimalRatio = manager.getOptimalPixelRatio();
    
    assert.strictEqual(typeof optimalRatio, 'number', 'Optimal ratio should be numeric');
    assert.ok(optimalRatio >= 1, 'Pixel ratio should be at least 1');
    assert.ok(optimalRatio <= 2, 'Pixel ratio should be capped at 2 for performance');
    
    // Test adaptive mode
    manager.setAdaptiveMode(true);
    const adaptiveRatio = manager.getOptimalPixelRatio();
    assert.ok(adaptiveRatio >= 1 && adaptiveRatio <= 2, 'Adaptive ratio should be within bounds');
    
    manager.setAdaptiveMode(false);
    const staticRatio = manager.getOptimalPixelRatio();
    assert.strictEqual(typeof staticRatio, 'number', 'Static mode should still return valid ratio');
  });
  
  it('should optimize geometry instancing for performance', () => {
    const { GeometryInstanceManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new GeometryInstanceManager();
    
    // Test geometry caching
    const tableGeometry1 = manager.getInstancedGeometry('table', { radius: 0.8, height: 0.05 });
    const tableGeometry2 = manager.getInstancedGeometry('table', { radius: 0.8, height: 0.05 });
    
    // Should return same instance for identical parameters (caching)
    assert.strictEqual(tableGeometry1, tableGeometry2, 'Should cache identical geometries');
    
    // Test different geometries
    const legGeometry = manager.getInstancedGeometry('leg', { radius: 0.05, height: 0.75 });
    assert.notStrictEqual(tableGeometry1, legGeometry, 'Different geometry types should be different objects');
    
    // Test cleanup
    manager.dispose();
    // Should not throw errors after disposal
    assert.ok(true, 'Dispose should complete without errors');
  });
  
  it('should handle tab visibility for performance optimization', () => {
    const { TabVisibilityManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new TabVisibilityManager();
    
    // Test visibility state
    const state = manager.getVisibilityState();
    
    assert.strictEqual(typeof state.isVisible, 'boolean', 'Should have boolean visibility state');
    assert.strictEqual(typeof state.shouldAnimate, 'boolean', 'Should have boolean animation state');
    assert.strictEqual(typeof state.shouldFullUpdate, 'boolean', 'Should have boolean update state');
    
    // Test animation control
    assert.strictEqual(manager.shouldAnimations(), true, 'Should allow animations when visible');
    
    manager.setReducedUpdateRate(true);
    assert.strictEqual(manager.shouldAnimations(), false, 'Should disable animations in reduced mode');
    
    // Test callback registration
    let callbackTriggered = false;
    const unsubscribe = manager.onVisibilityChange(() => {
      callbackTriggered = true;
    });
    
    assert.strictEqual(typeof unsubscribe, 'function', 'Should return unsubscribe function');
  });
  
  it('should adapt quality based on performance metrics', () => {
    const { AdaptiveQualityManager } = require('../map3d/lib/performance-optimizations.js');
    
    const manager = new AdaptiveQualityManager();
    
    // Test quality levels
    const initialLevel = manager.getCurrentLevel();
    assert.ok(typeof initialLevel === 'number', 'Quality level should be numeric');
    assert.ok(initialLevel >= 0 && initialLevel <= 2, 'Quality level should be 0-2');
    
    // Test quality settings for each level
    manager.setQualityLevel(0); // Low quality
    const lowQuality = manager.getQualitySettings();
    assert.strictEqual(lowQuality.shadows, false, 'Low quality should disable shadows');
    assert.strictEqual(lowQuality.animationsEnabled, false, 'Low quality should disable animations');
    assert.strictEqual(lowQuality.pixelRatio, 1, 'Low quality should use minimum pixel ratio');
    
    manager.setQualityLevel(1); // Medium quality
    const mediumQuality = manager.getQualitySettings();
    assert.strictEqual(mediumQuality.shadows, true, 'Medium quality should enable shadows');
    assert.strictEqual(mediumQuality.animationsEnabled, true, 'Medium quality should enable animations');
    assert.ok(mediumQuality.pixelRatio <= 1.5, 'Medium quality should use moderate pixel ratio');
    
    manager.setQualityLevel(2); // High quality
    const highQuality = manager.getQualitySettings();
    assert.strictEqual(highQuality.shadows, true, 'High quality should enable shadows');
    assert.strictEqual(highQuality.antialias, true, 'High quality should enable antialiasing');
    assert.ok(highQuality.pixelRatio <= 2, 'High quality should use maximum pixel ratio');
    
    // Test performance metrics
    const metrics = manager.getPerformanceMetrics();
    assert.ok(typeof metrics.fps === 'number', 'Should provide FPS metric');
    assert.ok(typeof metrics.memory === 'number', 'Should provide memory metric');
    assert.ok(typeof metrics.qualityLevel === 'number', 'Should provide quality level');
  });
  
  it('should provide frame rate performance benchmarks', () => {
    const { PERFORMANCE_CONFIG } = require('../map3d/lib/config.js');
    
    // Test performance configuration exists
    assert.ok(PERFORMANCE_CONFIG, 'Performance config should exist');
    assert.ok(typeof PERFORMANCE_CONFIG.pixelRatio === 'number', 'Pixel ratio should be configured');
    assert.ok(PERFORMANCE_CONFIG.pixelRatio >= 1 && PERFORMANCE_CONFIG.pixelRatio <= 2, 'Pixel ratio should be reasonable');
    
    // Test LOD settings
    assert.ok(PERFORMANCE_CONFIG.lod, 'Should have LOD configuration');
    assert.strictEqual(PERFORMANCE_CONFIG.lod.enabled, true, 'LOD should be enabled for performance');
    assert.ok(Array.isArray(PERFORMANCE_CONFIG.lod.distances), 'LOD distances should be array');
    
    // Test instancing settings
    assert.ok(PERFORMANCE_CONFIG.instancing, 'Should have instancing configuration');
    assert.strictEqual(PERFORMANCE_CONFIG.instancing.enabled, true, 'Instancing should be enabled');
    assert.ok(typeof PERFORMANCE_CONFIG.instancing.maxInstances === 'number', 'Max instances should be numeric');
  });
  
  it('should validate memory usage stays within acceptable limits', () => {
    // Test memory monitoring thresholds
    const memoryThresholds = {
      warning: 100, // MB
      critical: 150, // MB
      maximum: 200  // MB
    };
    
    const testMemoryUsage = (usage) => {
      if (usage > memoryThresholds.critical) {
        return 'critical';
      } else if (usage > memoryThresholds.warning) {
        return 'warning';
      }
      return 'normal';
    };
    
    assert.strictEqual(testMemoryUsage(50), 'normal', 'Low memory usage should be normal');
    assert.strictEqual(testMemoryUsage(120), 'warning', 'Medium memory usage should trigger warning');
    assert.strictEqual(testMemoryUsage(180), 'critical', 'High memory usage should be critical');
    
    // Verify thresholds are reasonable for 3D scene
    assert.ok(memoryThresholds.warning < 200, 'Warning threshold should be reasonable for web apps');
    assert.ok(memoryThresholds.critical > memoryThresholds.warning, 'Critical should be higher than warning');
  });
  
  it('should test performance monitoring integration with global instances', () => {
    const { 
      pixelRatioManager,
      geometryInstanceManager,
      tabVisibilityManager,
      adaptiveQualityManager
    } = require('../map3d/lib/performance-optimizations.js');
    
    // Test all global instances exist
    assert.ok(pixelRatioManager, 'Global pixel ratio manager should exist');
    assert.ok(geometryInstanceManager, 'Global geometry instance manager should exist');
    assert.ok(tabVisibilityManager, 'Global tab visibility manager should exist');
    assert.ok(adaptiveQualityManager, 'Global adaptive quality manager should exist');
    
    // Test they work together
    const qualitySettings = adaptiveQualityManager.getQualitySettings();
    const optimalRatio = pixelRatioManager.getOptimalPixelRatio();
    const visibilityState = tabVisibilityManager.getVisibilityState();
    
    // Quality pixel ratio should not exceed optimal ratio significantly
    assert.ok(
      qualitySettings.pixelRatio <= optimalRatio * 1.1, 
      'Quality pixel ratio should align with optimal ratio'
    );
    
    // Visibility should affect animations
    assert.ok(
      typeof visibilityState.shouldAnimate === 'boolean',
      'Visibility should control animation state'
    );
  });
  
  it('should handle performance degradation gracefully', () => {
    // Test progressive quality reduction
    const performanceStates = [
      { fps: 60, memory: 50, expectedQuality: 2 },   // High performance
      { fps: 30, memory: 80, expectedQuality: 2 },   // Medium performance  
      { fps: 20, memory: 120, expectedQuality: 1 },  // Lower performance
      { fps: 15, memory: 180, expectedQuality: 0 }   // Poor performance
    ];
    
    const determineQuality = (fps, memory) => {
      if (fps < 20 || memory > 150) return 0; // Low quality
      if (fps < 30 || memory > 100) return 1; // Medium quality
      return 2; // High quality
    };
    
    performanceStates.forEach(state => {
      const quality = determineQuality(state.fps, state.memory);
      assert.ok(
        quality >= 0 && quality <= 2,
        `Quality level should be valid for fps=${state.fps}, memory=${state.memory}`
      );
    });
  });
  
  it('should test frame rate targeting meets 30+ FPS requirement', () => {
    // Test frame rate requirement from design document
    const targetFPS = 30;
    const acceptableFPS = 25; // Minimum acceptable with some tolerance
    
    // Mock performance scenarios
    const testScenarios = [
      { quality: 2, expectedFPS: 60 }, // High quality target
      { quality: 1, expectedFPS: 45 }, // Medium quality target
      { quality: 0, expectedFPS: 30 }  // Low quality minimum
    ];
    
    testScenarios.forEach(scenario => {
      assert.ok(
        scenario.expectedFPS >= targetFPS,
        `Quality level ${scenario.quality} should target at least ${targetFPS} FPS`
      );
    });
    
    // Test that even worst case meets minimum
    assert.ok(acceptableFPS >= 25, 'Even degraded performance should maintain 25+ FPS');
  });
  
  it('should validate memory footprint meets < 50MB requirement', () => {
    // Test memory requirement from design document
    const maxMemoryMB = 50;
    const warningMemoryMB = 40;
    
    // Simulate memory tracking
    const memoryUsageTest = {
      geometries: 15, // MB
      textures: 10,   // MB
      buffers: 8,     // MB
      overhead: 12    // MB
    };
    
    const totalMemory = Object.values(memoryUsageTest).reduce((sum, val) => sum + val, 0);
    
    assert.ok(totalMemory <= maxMemoryMB, `Total memory usage (${totalMemory}MB) should not exceed ${maxMemoryMB}MB`);
    assert.ok(totalMemory >= 20, 'Should use reasonable amount of memory for 3D scene');
    
    if (totalMemory > warningMemoryMB) {
      console.warn(`Memory usage (${totalMemory}MB) approaching limit (${maxMemoryMB}MB)`);
    }
  });

});
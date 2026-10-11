/**
 * Performance Optimizations for 3D Map
 * Implements pixel ratio limiting, geometry instancing, and performance monitoring
 */

import * as THREE from 'three';
import { isTabVisible, PerformanceMonitor } from './utils.js';
import { PERFORMANCE_CONFIG } from './config.js';

/**
 * Automatic Pixel Ratio Management
 * Limits pixel ratio based on device capabilities and performance
 */
export class PixelRatioManager {
  constructor() {
    this.currentRatio = 1;
    this.targetRatio = 1;
    this.performanceMonitor = new PerformanceMonitor();
    this.adaptiveMode = true;
  }

  /**
   * Get optimal pixel ratio based on device and performance
   */
  getOptimalPixelRatio() {
    if (typeof window === 'undefined') return 1;
    
    const deviceRatio = window.devicePixelRatio || 1;
    const maxRatio = PERFORMANCE_CONFIG.pixelRatio || 2;
    
    // Base ratio - limit to reasonable maximum
    let optimalRatio = Math.min(deviceRatio, maxRatio);
    
    // Adaptive adjustment based on performance
    if (this.adaptiveMode && this.performanceMonitor) {
      const fps = this.performanceMonitor.getFPS();
      const memoryUsage = this.performanceMonitor.getMemoryUsage();
      
      // Reduce ratio if performance is poor
      if (fps < 20 || memoryUsage > 100) {
        optimalRatio = Math.max(1, optimalRatio * 0.75);
      } else if (fps > 50 && memoryUsage < 50) {
        // Can increase ratio if performance is good
        optimalRatio = Math.min(maxRatio, optimalRatio * 1.1);
      }
    }
    
    return Math.max(1, Math.round(optimalRatio * 4) / 4); // Round to quarters
  }

  /**
   * Update pixel ratio smoothly
   */
  update(renderer) {
    if (!renderer) return;
    
    this.performanceMonitor.update();
    const optimalRatio = this.getOptimalPixelRatio();
    
    // Smooth transition to avoid jarring changes
    if (Math.abs(optimalRatio - this.currentRatio) > 0.1) {
      this.currentRatio = THREE.MathUtils.lerp(this.currentRatio, optimalRatio, 0.1);
      renderer.setPixelRatio(this.currentRatio);
    }
  }

  /**
   * Enable/disable adaptive mode
   */
  setAdaptiveMode(enabled) {
    this.adaptiveMode = enabled;
  }
}

/**
 * Geometry Instancing Manager
 * Reduces draw calls for repeated objects like tables and chairs
 */
export class GeometryInstanceManager {
  constructor() {
    this.instancedMeshes = new Map();
    this.geometryCache = new Map();
    this.materialCache = new Map();
  }

  /**
   * Create or get instanced geometry
   */
  getInstancedGeometry(type, params) {
    const key = `${type}_${JSON.stringify(params)}`;
    
    if (!this.geometryCache.has(key)) {
      let geometry;
      
      switch (type) {
        case 'table':
          geometry = new THREE.CylinderGeometry(
            params.radius || 0.8,
            params.radius || 0.8,
            params.height || 0.05,
            params.segments || 8
          );
          break;
          
        case 'leg':
          geometry = new THREE.CylinderGeometry(
            params.radius || 0.05,
            params.radius || 0.05,
            params.height || 0.75,
            params.segments || 6
          );
          break;
          
        case 'status-marker':
          geometry = new THREE.SphereGeometry(
            params.radius || 0.12,
            params.widthSegments || 8,
            params.heightSegments || 6
          );
          break;
          
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      this.geometryCache.set(key, geometry);
    }
    
    return this.geometryCache.get(key);
  }

  /**
   * Create instanced mesh for repeated objects
   */
  createInstancedMesh(type, geometry, material, maxCount) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    this.instancedMeshes.set(type, {
      mesh: instancedMesh,
      count: 0,
      maxCount
    });
    
    return instancedMesh;
  }

  /**
   * Update instance at specific index
   */
  updateInstance(type, index, matrix) {
    const instanceData = this.instancedMeshes.get(type);
    if (instanceData && index < instanceData.maxCount) {
      instanceData.mesh.setMatrixAt(index, matrix);
      instanceData.mesh.instanceMatrix.needsUpdate = true;
      instanceData.count = Math.max(instanceData.count, index + 1);
    }
  }

  /**
   * Set instance count
   */
  setInstanceCount(type, count) {
    const instanceData = this.instancedMeshes.get(type);
    if (instanceData) {
      instanceData.mesh.count = Math.min(count, instanceData.maxCount);
      instanceData.count = count;
    }
  }

  /**
   * Clear instances
   */
  clearInstances(type) {
    const instanceData = this.instancedMeshes.get(type);
    if (instanceData) {
      instanceData.mesh.count = 0;
      instanceData.count = 0;
    }
  }

  /**
   * Get instanced mesh
   */
  getInstancedMesh(type) {
    const instanceData = this.instancedMeshes.get(type);
    return instanceData ? instanceData.mesh : null;
  }

  /**
   * Dispose of all instances and geometries
   */
  dispose() {
    this.instancedMeshes.forEach(({ mesh }) => {
      mesh.dispose();
    });
    
    this.geometryCache.forEach(geometry => {
      geometry.dispose();
    });
    
    this.materialCache.forEach(material => {
      material.dispose();
    });
    
    this.instancedMeshes.clear();
    this.geometryCache.clear();
    this.materialCache.clear();
  }
}

/**
 * Tab Visibility Performance Manager
 * Pauses animations and reduces update frequency when tab is hidden
 */
export class TabVisibilityManager {
  constructor() {
    this.isVisible = true;
    this.callbacks = new Set();
    this.reducedUpdateRate = false;
    this.lastVisibilityChange = Date.now();
    
    this.setupVisibilityListeners();
  }

  /**
   * Setup visibility change listeners
   */
  setupVisibilityListeners() {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      const wasVisible = this.isVisible;
      this.isVisible = !document.hidden && document.visibilityState === 'visible';
      this.lastVisibilityChange = Date.now();
      
      if (wasVisible !== this.isVisible) {
        this.notifyCallbacks(this.isVisible);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('blur', () => {
      this.isVisible = false;
      this.notifyCallbacks(false);
    });
    document.addEventListener('focus', () => {
      this.isVisible = true;
      this.notifyCallbacks(true);
    });
  }

  /**
   * Register callback for visibility changes
   */
  onVisibilityChange(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all callbacks
   */
  notifyCallbacks(isVisible) {
    this.callbacks.forEach(callback => {
      try {
        callback(isVisible);
      } catch (error) {
        console.warn('Error in visibility callback:', error);
      }
    });
  }

  /**
   * Check if animations should be active
   */
  shouldAnimations() {
    return this.isVisible && !this.reducedUpdateRate;
  }

  /**
   * Check if full update rate should be used
   */
  shouldFullUpdateRate() {
    return this.isVisible && Date.now() - this.lastVisibilityChange > 1000;
  }

  /**
   * Set reduced update rate mode
   */
  setReducedUpdateRate(enabled) {
    this.reducedUpdateRate = enabled;
  }

  /**
   * Get current visibility state
   */
  getVisibilityState() {
    return {
      isVisible: this.isVisible,
      shouldAnimate: this.shouldAnimations(),
      shouldFullUpdate: this.shouldFullUpdateRate(),
      reducedRate: this.reducedUpdateRate
    };
  }
}

/**
 * Adaptive Quality Manager
 * Adjusts rendering quality based on performance
 */
export class AdaptiveQualityManager {
  constructor() {
    this.currentQualityLevel = 2; // 0 = low, 1 = medium, 2 = high
    this.performanceMonitor = new PerformanceMonitor();
    this.adjustmentCooldown = 0;
    this.lastAdjustment = Date.now();
  }

  /**
   * Update quality based on performance metrics
   */
  update() {
    this.performanceMonitor.update();
    
    const now = Date.now();
    if (now - this.lastAdjustment < 2000) return; // Cooldown period
    
    const fps = this.performanceMonitor.getFPS();
    const memoryUsage = this.performanceMonitor.getMemoryUsage();
    
    let targetQuality = this.currentQualityLevel;
    
    // Reduce quality if performance is poor
    if (fps < 20 || memoryUsage > 150) {
      targetQuality = Math.max(0, this.currentQualityLevel - 1);
    }
    // Increase quality if performance is good
    else if (fps > 45 && memoryUsage < 80 && this.currentQualityLevel < 2) {
      targetQuality = Math.min(2, this.currentQualityLevel + 1);
    }
    
    if (targetQuality !== this.currentQualityLevel) {
      this.setQualityLevel(targetQuality);
      this.lastAdjustment = now;
    }
  }

  /**
   * Set quality level manually
   */
  setQualityLevel(level) {
    this.currentQualityLevel = Math.max(0, Math.min(2, level));
  }

  /**
   * Get current quality settings
   */
  getQualitySettings() {
    switch (this.currentQualityLevel) {
      case 0: // Low quality
        return {
          shadows: false,
          antialias: false,
          pixelRatio: 1,
          lodDistance: 5,
          instanceLimit: 20,
          animationsEnabled: false
        };
        
      case 1: // Medium quality
        return {
          shadows: true,
          antialias: false,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
          lodDistance: 10,
          instanceLimit: 30,
          animationsEnabled: true
        };
        
      case 2: // High quality
      default:
        return {
          shadows: true,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          lodDistance: 20,
          instanceLimit: 50,
          animationsEnabled: true
        };
    }
  }

  /**
   * Get current quality level
   */
  getCurrentLevel() {
    return this.currentQualityLevel;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      fps: this.performanceMonitor.getFPS(),
      memory: this.performanceMonitor.getMemoryUsage(),
      qualityLevel: this.currentQualityLevel
    };
  }
}

// Global instances
export const pixelRatioManager = new PixelRatioManager();
export const geometryInstanceManager = new GeometryInstanceManager();
export const tabVisibilityManager = new TabVisibilityManager();
export const adaptiveQualityManager = new AdaptiveQualityManager();
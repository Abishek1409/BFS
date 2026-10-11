/**
 * Utility Functions for 3D Map
 */

import { STATUS_MAPPING, TableStatus } from './config.js';

/**
 * Convert Firebase order status to table visual status
 */
export const mapFirebaseStatus = (firebaseStatus, hasCustomers = false) => {
  const mappedStatus = STATUS_MAPPING[firebaseStatus?.toLowerCase()] || TableStatus.FREE;
  
  // If table has customers but no order, show occupied
  if (hasCustomers && mappedStatus === TableStatus.FREE) {
    return TableStatus.OCCUPIED;
  }
  
  return mappedStatus;
};

/**
 * Calculate elapsed time from timestamp
 */
export const getElapsedTime = (timestamp) => {
  if (!timestamp) return null;
  
  const now = Date.now();
  const elapsed = Math.floor((now - timestamp) / 1000); // seconds
  
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
};

/**
 * Format order number for display
 */
export const formatOrderNumber = (orderNo) => {
  if (!orderNo) return null;
  return `#${orderNo.toString().padStart(3, '0')}`;
};

/**
 * Throttle function for performance
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce function for performance
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

/**
 * Easing functions for animations
 */
export const easing = {
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * Check if browser tab is visible (for performance optimization)
 */
export const isTabVisible = () => {
  return !document.hidden && document.visibilityState === 'visible';
};

/**
 * Performance monitor utility
 */
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.memoryUsage = 0;
  }
  
  update() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Memory usage (if available)
      if (performance.memory) {
        this.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
      }
    }
  }
  
  getFPS() {
    return this.fps;
  }
  
  getMemoryUsage() {
    return this.memoryUsage;
  }
  
  isPerformanceLow() {
    return this.fps < 20 || this.memoryUsage > 100;
  }
}

/**
 * Color utilities
 */
export const colorUtils = {
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  
  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  
  interpolateColor: (color1, color2, factor) => {
    const c1 = colorUtils.hexToRgb(color1);
    const c2 = colorUtils.hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(lerp(c1.r, c2.r, factor));
    const g = Math.round(lerp(c1.g, c2.g, factor));
    const b = Math.round(lerp(c1.b, c2.b, factor));
    
    return colorUtils.rgbToHex(r, g, b);
  }
};

/**
 * Vector3 utility functions
 */
export const vector3Utils = {
  distance: (v1, v2) => {
    const dx = v1[0] - v2[0];
    const dy = v1[1] - v2[1];
    const dz = v1[2] - v2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  
  normalize: (v) => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 0, 0];
  },
  
  add: (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]],
  
  multiply: (v, scalar) => [v[0] * scalar, v[1] * scalar, v[2] * scalar]
};
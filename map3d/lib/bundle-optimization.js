/**
 * Bundle Size Optimization and Code Splitting for 3D Map
 * Implements dynamic imports and lazy loading for performance
 */

import { DynamicLoader } from './dynamic-import.js';

/**
 * Bundle Analyzer and Optimizer
 */
export class BundleOptimizer {
  static loadedComponents = new Set();
  static preloadPromises = new Map();
  static criticalComponents = [
    'CafeScene',
    'MapCanvas',
    'TableEntity'
  ];

  /**
   * Lazy load component with optional preloading
   */
  static async lazyLoadComponent(componentPath, componentName = 'default', preload = false) {
    const key = `${componentPath}#${componentName}`;
    
    if (preload && !this.preloadPromises.has(key)) {
      // Start preloading but don't await
      const preloadPromise = DynamicLoader.loadComponent(componentPath, componentName);
      this.preloadPromises.set(key, preloadPromise);
      
      // Don't block on preload
      preloadPromise.catch(() => {
        this.preloadPromises.delete(key);
      });
    }
    
    // If we have a preload promise, use it
    if (this.preloadPromises.has(key)) {
      try {
        const component = await this.preloadPromises.get(key);
        this.loadedComponents.add(key);
        return component;
      } catch (error) {
        this.preloadPromises.delete(key);
        throw error;
      }
    }
    
    // Otherwise load normally
    const component = await DynamicLoader.loadComponent(componentPath, componentName);
    this.loadedComponents.add(key);
    return component;
  }

  /**
   * Preload critical components based on user interaction
   */
  static preloadCriticalComponents() {
    const components = [
      { path: './scene/CafeScene.js', name: 'CafeScene' },
      { path: './scene/TableEntity.js', name: 'TableEntity' },
      { path: './scene/StatusMarker.js', name: 'StatusMarker' },
      { path: './ui/MapControls.js', name: 'MapControls' }
    ];
    
    return Promise.allSettled(
      components.map(({ path, name }) => 
        this.lazyLoadComponent(path, name, true)
      )
    );
  }

  /**
   * Preload components on user intent (hover, etc.)
   */
  static preloadOnIntent(triggerElement) {
    if (!triggerElement) return;
    
    let preloadStarted = false;
    
    const startPreload = () => {
      if (!preloadStarted) {
        preloadStarted = true;
        this.preloadCriticalComponents()
          .then(() => console.log('3D components preloaded'))
          .catch(err => console.warn('Preload failed:', err));
      }
    };
    
    // Preload on hover (desktop)
    triggerElement.addEventListener('mouseenter', startPreload);
    
    // Preload on touch start (mobile)
    triggerElement.addEventListener('touchstart', startPreload, { passive: true });
    
    // Preload on focus
    triggerElement.addEventListener('focus', startPreload);
    
    return () => {
      triggerElement.removeEventListener('mouseenter', startPreload);
      triggerElement.removeEventListener('touchstart', startPreload);
      triggerElement.removeEventListener('focus', startPreload);
    };
  }

  /**
   * Get bundle loading statistics
   */
  static getLoadingStats() {
    return {
      loadedComponents: Array.from(this.loadedComponents),
      preloadingComponents: Array.from(this.preloadPromises.keys()),
      cacheSize: DynamicLoader.componentCache.size,
      loadingCount: DynamicLoader.loadingPromises.size
    };
  }

  /**
   * Clear unused components from memory
   */
  static clearUnusedComponents(keepCritical = true) {
    if (!keepCritical) {
      DynamicLoader.clearCache();
      this.loadedComponents.clear();
      this.preloadPromises.clear();
      return;
    }
    
    // Keep critical components, clear others
    const toRemove = Array.from(this.loadedComponents).filter(key => {
      return !this.criticalComponents.some(critical => key.includes(critical));
    });
    
    toRemove.forEach(key => {
      this.loadedComponents.delete(key);
      DynamicLoader.componentCache.delete(key);
    });
  }
}

/**
 * Progressive Loading Manager
 * Loads components in priority order based on importance
 */
export class ProgressiveLoader {
  constructor() {
    this.loadingQueue = [];
    this.isLoading = false;
    this.loadingCallbacks = new Set();
  }

  /**
   * Add component to loading queue with priority
   */
  addToQueue(componentPath, componentName, priority = 1, callback) {
    this.loadingQueue.push({
      path: componentPath,
      name: componentName,
      priority,
      callback,
      timestamp: Date.now()
    });
    
    // Sort by priority (higher first)
    this.loadingQueue.sort((a, b) => b.priority - a.priority);
    
    this.processQueue();
  }

  /**
   * Process loading queue
   */
  async processQueue() {
    if (this.isLoading || this.loadingQueue.length === 0) return;
    
    this.isLoading = true;
    this.notifyCallbacks({ type: 'start', queueLength: this.loadingQueue.length });
    
    while (this.loadingQueue.length > 0) {
      const item = this.loadingQueue.shift();
      
      try {
        this.notifyCallbacks({ type: 'progress', item, remaining: this.loadingQueue.length });
        
        const component = await BundleOptimizer.lazyLoadComponent(item.path, item.name);
        
        if (item.callback) {
          item.callback(null, component);
        }
        
        this.notifyCallbacks({ type: 'loaded', item, component });
        
      } catch (error) {
        console.error('Failed to load component:', item, error);
        
        if (item.callback) {
          item.callback(error, null);
        }
        
        this.notifyCallbacks({ type: 'error', item, error });
      }
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.isLoading = false;
    this.notifyCallbacks({ type: 'complete' });
  }

  /**
   * Register callback for loading events
   */
  onLoading(callback) {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  /**
   * Notify callbacks
   */
  notifyCallbacks(event) {
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.warn('Error in loading callback:', error);
      }
    });
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.loadingQueue = [];
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      queueLength: this.loadingQueue.length,
      currentPriorities: this.loadingQueue.map(item => ({
        path: item.path,
        priority: item.priority
      }))
    };
  }
}

/**
 * Component Size Monitor
 * Tracks component sizes and helps optimize bundle splitting
 */
export class ComponentSizeMonitor {
  static componentSizes = new Map();
  static loadTimes = new Map();

  /**
   * Track component loading performance
   */
  static trackLoadTime(componentKey, startTime, endTime, size) {
    const loadTime = endTime - startTime;
    
    this.loadTimes.set(componentKey, {
      loadTime,
      size,
      timestamp: Date.now()
    });
    
    if (size) {
      this.componentSizes.set(componentKey, size);
    }
  }

  /**
   * Get performance insights
   */
  static getPerformanceInsights() {
    const insights = {
      totalComponents: this.loadTimes.size,
      averageLoadTime: 0,
      slowestComponents: [],
      largestComponents: [],
      recommendations: []
    };
    
    if (this.loadTimes.size === 0) return insights;
    
    const loadTimeArray = Array.from(this.loadTimes.values());
    const totalLoadTime = loadTimeArray.reduce((sum, item) => sum + item.loadTime, 0);
    insights.averageLoadTime = totalLoadTime / loadTimeArray.length;
    
    // Find slowest components
    const sortedByTime = Array.from(this.loadTimes.entries())
      .sort((a, b) => b[1].loadTime - a[1].loadTime)
      .slice(0, 3);
    
    insights.slowestComponents = sortedByTime.map(([key, data]) => ({
      component: key,
      loadTime: data.loadTime,
      size: data.size
    }));
    
    // Find largest components
    const sortedBySize = Array.from(this.componentSizes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    insights.largestComponents = sortedBySize.map(([key, size]) => ({
      component: key,
      size
    }));
    
    // Generate recommendations
    if (insights.averageLoadTime > 100) {
      insights.recommendations.push('Consider further code splitting for faster loading');
    }
    
    if (insights.slowestComponents.some(comp => comp.loadTime > 500)) {
      insights.recommendations.push('Some components are loading slowly - check network or size');
    }
    
    return insights;
  }

  /**
   * Clear monitoring data
   */
  static clearData() {
    this.componentSizes.clear();
    this.loadTimes.clear();
  }
}

/**
 * Adaptive Loading Strategy
 * Adjusts loading strategy based on connection and device performance
 */
export class AdaptiveLoadingStrategy {
  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.deviceInfo = this.getDeviceInfo();
    this.strategy = this.determineStrategy();
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if (!navigator.connection) {
      return { effectiveType: '4g', downlink: 10, rtt: 50 };
    }
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  /**
   * Get device performance information
   */
  getDeviceInfo() {
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: navigator.deviceMemory || 4,
      isMobile: /Mobi|Android/i.test(navigator.userAgent)
    };
  }

  /**
   * Determine loading strategy based on device and connection
   */
  determineStrategy() {
    const { effectiveType, downlink, saveData } = this.connectionInfo;
    const { deviceMemory, isMobile } = this.deviceInfo;
    
    // Conservative strategy for limited devices
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'minimal';
    }
    
    // Limited strategy for slower connections or low-end devices
    if (effectiveType === '3g' || deviceMemory < 2 || (isMobile && deviceMemory < 4)) {
      return 'progressive';
    }
    
    // Aggressive strategy for good connections and devices
    if (effectiveType === '4g' && downlink > 5 && deviceMemory >= 4) {
      return 'preload';
    }
    
    return 'standard';
  }

  /**
   * Get loading configuration for current strategy
   */
  getLoadingConfig() {
    switch (this.strategy) {
      case 'minimal':
        return {
          preloadCritical: false,
          batchSize: 1,
          loadDelay: 200,
          enableCaching: true,
          maxConcurrent: 1
        };
        
      case 'progressive':
        return {
          preloadCritical: true,
          batchSize: 2,
          loadDelay: 100,
          enableCaching: true,
          maxConcurrent: 2
        };
        
      case 'preload':
        return {
          preloadCritical: true,
          batchSize: 5,
          loadDelay: 0,
          enableCaching: true,
          maxConcurrent: 4
        };
        
      case 'standard':
      default:
        return {
          preloadCritical: true,
          batchSize: 3,
          loadDelay: 50,
          enableCaching: true,
          maxConcurrent: 3
        };
    }
  }

  /**
   * Update strategy based on current conditions
   */
  updateStrategy() {
    this.connectionInfo = this.getConnectionInfo();
    this.deviceInfo = this.getDeviceInfo();
    const newStrategy = this.determineStrategy();
    
    if (newStrategy !== this.strategy) {
      console.log(`Loading strategy changed: ${this.strategy} -> ${newStrategy}`);
      this.strategy = newStrategy;
    }
  }

  /**
   * Get current strategy info
   */
  getStrategyInfo() {
    return {
      strategy: this.strategy,
      connection: this.connectionInfo,
      device: this.deviceInfo,
      config: this.getLoadingConfig()
    };
  }
}

// Global instances
export const bundleOptimizer = new BundleOptimizer();
export const progressiveLoader = new ProgressiveLoader();
export const componentSizeMonitor = new ComponentSizeMonitor();
export const adaptiveLoadingStrategy = new AdaptiveLoadingStrategy();

// Utility function to setup progressive loading
export function setupProgressiveLoading(triggerElements = []) {
  const config = adaptiveLoadingStrategy.getLoadingConfig();
  
  if (config.preloadCritical) {
    BundleOptimizer.preloadCriticalComponents();
  }
  
  // Setup intent-based preloading
  triggerElements.forEach(element => {
    if (element) {
      BundleOptimizer.preloadOnIntent(element);
    }
  });
  
  return {
    strategy: adaptiveLoadingStrategy.getStrategyInfo(),
    stats: BundleOptimizer.getLoadingStats()
  };
}
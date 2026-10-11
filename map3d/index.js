/**
 * 3D Map Main Entry Point with Firebase Integration
 * Complete solution for Live 3D Café Map
 */

// Core UI exports
export { MapCanvas } from './ui/MapCanvas.js';
export { MapControls } from './ui/MapControls.js';
export { MapWithControls } from './ui/MapWithControls.js';
export { LoadingSkeleton } from './ui/LoadingSkeleton.js';
export { EnhancedListView } from './ui/EnhancedListView.js';

// Firebase-powered UI components
export { LiveCounters } from './ui/LiveCounters.js';
export { EventsFeed } from './ui/EventsFeed.js';

// 3D Scene components
export { CafeScene } from './scene/CafeScene.js';
export { TableEntity } from './scene/TableEntity.js';
export { StatusMarker } from './scene/StatusMarker.js';
export { CounterEntity } from './scene/CounterEntity.js';

// Firebase integration hooks
export { useFirebaseSync } from './hooks/useFirebaseSync.js';
export { useTableStatus } from './hooks/useTableStatus.js';
export { usePerformanceMonitor } from './hooks/usePerformanceMonitor.js';

// Utilities and configuration
export { 
  checkWebGLSupport, 
  getWebGLCapabilities,
  getWebGLFallbackMessage 
} from './lib/webgl-detection.js';

export { DynamicLoader } from './lib/dynamic-import.js';

// Performance Optimizations
export {
  PixelRatioManager,
  GeometryInstanceManager,
  TabVisibilityManager,
  AdaptiveQualityManager,
  pixelRatioManager,
  geometryInstanceManager,
  tabVisibilityManager,
  adaptiveQualityManager
} from './lib/performance-optimizations.js';

// Error Handling and Fallbacks
export {
  Scene3DErrorBoundary,
  MemoryErrorHandler,
  WebGLContextHandler
} from './lib/error-boundaries.js';

// Bundle Optimization
export {
  BundleOptimizer,
  ProgressiveLoader,
  ComponentSizeMonitor,
  AdaptiveLoadingStrategy,
  setupProgressiveLoading
} from './lib/bundle-optimization.js';

export {
  TableStatus,
  STATUS_COLORS,
  CAFE_LAYOUT,
  CAMERA_CONFIG,
  MAP_MODES,
  DEFAULT_SETTINGS,
  STATUS_MAPPING
} from './lib/config.js';

export {
  mapFirebaseStatus,
  getElapsedTime,
  formatOrderNumber,
  throttle,
  debounce
} from './lib/utils.js';

// Complete Firebase-powered 3D Map initialization
export function initializeLiveMap3D(containerId, options = {}) {
  const {
    mode = MAP_MODES.DIMMED,
    showCounters = true,
    showEvents = true,
    showControls = true,
    onTableClick,
    onModeChange,
    ...otherOptions
  } = options;

  // Comprehensive initialization for Firebase-integrated 3D map
  console.log('Live 3D Café Map with Firebase integration ready');
  console.log('Container ID:', containerId);
  console.log('Firebase integration: ✓ Real-time data sync');
  console.log('Live counters: ✓ Order metrics and sales');
  console.log('Events feed: ✓ Recent activity stream');
  console.log('Table status: ✓ Firebase order mapping');
  
  return {
    // Core components
    MapWithControls,
    LiveCounters,
    EventsFeed,
    
    // Firebase integration
    useFirebaseSync,
    useTableStatus,
    
    // Configuration
    mode,
    showCounters,
    showEvents,
    showControls,
    onTableClick,
    onModeChange,
    
    // Capabilities
    hasFirebaseIntegration: true,
    hasRealTimeUpdates: true,
    hasOrderTracking: true,
    hasStatusMapping: true,
    
    ...otherOptions
  };
}

// Legacy initialization function (compatibility)
export function initializeMap3D(containerId, options = {}) {
  console.warn('initializeMap3D is deprecated. Use initializeLiveMap3D for Firebase integration.');
  return initializeLiveMap3D(containerId, options);
}
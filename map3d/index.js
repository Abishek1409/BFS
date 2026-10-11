/**
 * 3D Map Main Entry Point with Firebase Integration
 * Complete solution for Live 3D Café Map
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { MapWithControls as LiveMap } from './ui/MapWithControls.js';
import { MAP_MODES as MAP_MODE_VALUES } from './lib/config.js';

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
    mode = MAP_MODE_VALUES.DIMMED,
    showCounters = true,
    showEvents = true,
    showControls = true,
    onTableClick,
    onModeChange,
    ...otherOptions
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`3D map container '${containerId}' was not found`);
  }

  const root = createRoot(container);
  root.render(
    <LiveMap
      initialMode={mode}
      showCounters={showCounters}
      showEvents={showEvents}
      showControls={showControls}
      onTableClick={onTableClick}
      onModeChange={onModeChange}
      style={{ width: '100%', height: '100%' }}
      {...otherOptions}
    />
  );

  return {
    cleanup: () => root.unmount(),
    hasFirebaseIntegration: true,
    hasRealTimeUpdates: true,
    hasOrderTracking: true,
    hasStatusMapping: true
  };
}

// Legacy initialization function (compatibility)
export function initializeMap3D(containerId, options = {}) {
  console.warn('initializeMap3D is deprecated. Use initializeLiveMap3D for Firebase integration.');
  return initializeLiveMap3D(containerId, options);
}
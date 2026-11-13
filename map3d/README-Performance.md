# Performance Optimizations Guide

This guide covers the comprehensive performance optimizations implemented in the 3D Café Map system.

## Overview

The 3D map includes several performance optimization systems:

1. **Automatic Pixel Ratio Management** - Adapts display quality based on device capabilities
2. **Geometry Instancing** - Reduces draw calls for repeated objects
3. **Tab Visibility Detection** - Pauses animations when tab is hidden
4. **Adaptive Quality Management** - Adjusts rendering quality based on performance
5. **Bundle Size Optimization** - Dynamic loading and code splitting
6. **Error Boundaries** - Graceful degradation and fallback systems

## Features

### 1. Pixel Ratio Management

Automatically manages pixel ratio for optimal performance vs. quality balance:

```javascript
import { pixelRatioManager } from './lib/performance-optimizations.js';

// Get optimal pixel ratio for current device
const ratio = pixelRatioManager.getOptimalPixelRatio();

// Enable/disable adaptive mode
pixelRatioManager.setAdaptiveMode(true);

// Update pixel ratio (call in render loop)
pixelRatioManager.update(renderer);
```

### 2. Geometry Instancing

Reduces draw calls by sharing geometry between similar objects:

```javascript
import { geometryInstanceManager } from './lib/performance-optimizations.js';

// Create instanced geometry
const tableGeometry = geometryInstanceManager.getInstancedGeometry('table', {
  radius: 0.8,
  height: 0.05,
  segments: 8
});

// Create instanced mesh
const instancedMesh = geometryInstanceManager.createInstancedMesh(
  'tables', 
  tableGeometry, 
  material, 
  8 // max instances
);
```

### 3. Tab Visibility Detection

Automatically pauses animations when browser tab is hidden:

```javascript
import { tabVisibilityManager } from './lib/performance-optimizations.js';

// Register callback for visibility changes
const unsubscribe = tabVisibilityManager.onVisibilityChange((isVisible) => {
  console.log('Tab visibility:', isVisible);
});

// Check if animations should be active
if (tabVisibilityManager.shouldAnimations()) {
  // Run animations
}

// Cleanup
unsubscribe();
```

### 4. Adaptive Quality Management

Automatically adjusts rendering quality based on performance metrics:

```javascript
import { adaptiveQualityManager } from './lib/performance-optimizations.js';

// Get current quality settings
const settings = adaptiveQualityManager.getQualitySettings();
console.log('Shadows enabled:', settings.shadows);
console.log('Animations enabled:', settings.animationsEnabled);

// Get performance metrics
const metrics = adaptiveQualityManager.getPerformanceMetrics();
console.log('FPS:', metrics.fps);
console.log('Memory usage:', metrics.memory + 'MB');

// Manually set quality level (0=low, 1=medium, 2=high)
adaptiveQualityManager.setQualityLevel(1);
```

### 5. Bundle Optimization

Dynamic loading and progressive enhancement:

```javascript
import { BundleOptimizer, setupProgressiveLoading } from './lib/bundle-optimization.js';

// Setup progressive loading with intent-based preloading
const mapToggleButton = document.getElementById('map-toggle');
setupProgressiveLoading([mapToggleButton]);

// Lazy load specific components
const CafeScene = await BundleOptimizer.lazyLoadComponent(
  './scene/CafeScene.js', 
  'CafeScene'
);

// Preload critical components
await BundleOptimizer.preloadCriticalComponents();
```

### 6. Error Boundaries and Fallbacks

Graceful degradation when WebGL fails:

```jsx
import { Scene3DErrorBoundary, EnhancedListView } from './index.js';

function App() {
  return (
    <Scene3DErrorBoundary
      tableData={tableData}
      onTableClick={handleTableClick}
    >
      <CafeScene 
        mode="interactive"
        tableData={tableData}
        onTableClick={handleTableClick}
      />
    </Scene3DErrorBoundary>
  );
}
```

## Quality Levels

The system supports three quality levels:

### High Quality (Level 2)
- Shadows enabled
- Antialiasing enabled
- Full pixel ratio (up to 2x)
- All animations enabled
- Maximum geometry detail

### Medium Quality (Level 1)
- Shadows enabled
- Antialiasing disabled
- Limited pixel ratio (up to 1.5x)
- Animations enabled
- Reduced geometry instances

### Low Quality (Level 0)
- Shadows disabled
- Antialiasing disabled
- Base pixel ratio (1x)
- Animations disabled
- Minimal geometry instances

## Fallback Systems

### WebGL Unavailable
When WebGL is not supported, the system automatically falls back to an enhanced list view:
- Color-coded table status
- Interactive table selection
- Status legend
- Café overview statistics

### Performance Issues
When performance degrades:
- Quality level automatically reduces
- Pixel ratio decreases
- Non-essential animations disable
- Geometry complexity reduces

### Memory Constraints
When memory usage is high:
- Geometry cache clears
- Texture resolution reduces
- Instance limits decrease
- Garbage collection triggers

## Usage Examples

### Basic Setup
```javascript
import { MapCanvas } from './map3d/index.js';

// The MapCanvas automatically includes all performance optimizations
<MapCanvas
  mode="interactive"
  tableData={tableData}
  onTableClick={handleTableClick}
/>
```

### Advanced Configuration
```javascript
import { setupCompletePerformanceOptimizations } from './map3d/examples/performance-demo.js';

// Apply all performance optimizations
const cleanup = setupCompletePerformanceOptimizations();

// Cleanup when component unmounts
return cleanup;
```

### Manual Control
```javascript
import { 
  adaptiveQualityManager, 
  pixelRatioManager,
  tabVisibilityManager 
} from './map3d/index.js';

// Force high quality on powerful devices
if (navigator.hardwareConcurrency >= 8) {
  adaptiveQualityManager.setQualityLevel(2);
}

// Monitor performance
setInterval(() => {
  const metrics = adaptiveQualityManager.getPerformanceMetrics();
  if (metrics.fps < 30) {
    console.warn('Performance issue detected');
  }
}, 1000);
```

## Performance Monitoring

The system provides comprehensive performance monitoring:

```javascript
// Get current performance metrics
const metrics = adaptiveQualityManager.getPerformanceMetrics();
console.log({
  fps: metrics.fps,
  memory: metrics.memory + 'MB',
  qualityLevel: metrics.qualityLevel
});

// Get loading statistics
const loadingStats = BundleOptimizer.getLoadingStats();
console.log({
  loadedComponents: loadingStats.loadedComponents.length,
  cacheSize: loadingStats.cacheSize
});

// Get bundle insights
const insights = ComponentSizeMonitor.getPerformanceInsights();
console.log({
  averageLoadTime: insights.averageLoadTime + 'ms',
  slowestComponents: insights.slowestComponents
});
```

## Best Practices

### 1. Let the System Adapt
The adaptive quality manager automatically optimizes performance. Avoid manually setting quality levels unless necessary.

### 2. Use Progressive Loading
Setup intent-based preloading for better user experience:
```javascript
const triggerElements = document.querySelectorAll('[data-3d-trigger]');
setupProgressiveLoading(Array.from(triggerElements));
```

### 3. Monitor Performance
Regularly check performance metrics and adjust if needed:
```javascript
setInterval(() => {
  const metrics = adaptiveQualityManager.getPerformanceMetrics();
  if (metrics.fps < 20) {
    // Consider additional optimizations
  }
}, 5000);
```

### 4. Handle Errors Gracefully
Always wrap 3D components in error boundaries:
```jsx
<Scene3DErrorBoundary fallbackComponent={FallbackView}>
  <CafeScene />
</Scene3DErrorBoundary>
```

### 5. Clean Up Resources
Properly dispose of resources when components unmount:
```javascript
useEffect(() => {
  return () => {
    geometryInstanceManager.dispose();
  };
}, []);
```

## Browser Support

### Full Support (WebGL + All Optimizations)
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Fallback Support (Enhanced List View)
- All modern browsers
- Internet Explorer 11+ (with polyfills)
- Mobile browsers

## Performance Targets

- **Initial Load**: < 2 seconds for 3D scene initialization
- **Frame Rate**: 30+ FPS on mid-range devices
- **Memory Usage**: < 50MB for 3D scene
- **Bundle Size**: Core 3D components < 200KB gzipped
- **Fallback Load**: < 500ms for enhanced list view

## Troubleshooting

### Low Frame Rate
1. Check if adaptive quality is enabled
2. Verify WebGL support and capabilities
3. Monitor memory usage for leaks
4. Reduce number of animated objects

### High Memory Usage
1. Enable geometry instancing
2. Clear unused component cache
3. Reduce texture resolution
4. Limit concurrent animations

### Slow Loading
1. Enable progressive loading
2. Preload critical components
3. Check network connection
4. Optimize bundle splitting

### WebGL Errors
1. Check browser WebGL support
2. Verify graphics drivers
3. Enable hardware acceleration
4. Use fallback list view

## API Reference

See the complete API documentation in the individual component files:
- `lib/performance-optimizations.js` - Core optimization classes
- `lib/error-boundaries.js` - Error handling and fallbacks  
- `lib/bundle-optimization.js` - Code splitting and loading
- `ui/EnhancedListView.js` - Fallback UI component
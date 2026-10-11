/**
 * Performance Optimizations Demo
 * Demonstrates how to use the performance features of the 3D map
 */

import { 
  MapCanvas,
  Scene3DErrorBoundary,
  setupProgressiveLoading,
  pixelRatioManager,
  adaptiveQualityManager,
  tabVisibilityManager
} from '../index.js';

/**
 * Example: Setup 3D Map with Performance Optimizations
 */
export function setupOptimized3DMap() {
  // 1. Setup progressive loading with preloading on user intent
  const mapToggleButton = document.getElementById('map-toggle');
  if (mapToggleButton) {
    mapToggleButton.setAttribute('data-3d-trigger', 'true');
    
    const loadingStats = setupProgressiveLoading([mapToggleButton]);
    console.log('Progressive loading setup:', loadingStats);
  }

  // 2. Monitor performance and adjust quality automatically
  const performanceMonitor = setInterval(() => {
    const metrics = adaptiveQualityManager.getPerformanceMetrics();
    console.log('Performance metrics:', {
      fps: metrics.fps,
      memory: `${Math.round(metrics.memory)}MB`,
      qualityLevel: metrics.qualityLevel
    });
    
    // Log if performance is low
    if (metrics.fps < 30) {
      console.warn('Low FPS detected, quality may be automatically reduced');
    }
  }, 5000);

  // 3. Monitor tab visibility for performance
  const visibilityCleanup = tabVisibilityManager.onVisibilityChange((isVisible) => {
    console.log('Tab visibility changed:', isVisible ? 'visible' : 'hidden');
    if (!isVisible) {
      console.log('Pausing 3D animations to save resources');
    }
  });

  // 4. Setup error boundary for graceful degradation
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    // The error boundary will automatically handle WebGL failures
    // and show the enhanced fallback list view
  }

  // Cleanup function
  return () => {
    clearInterval(performanceMonitor);
    visibilityCleanup();
  };
}

/**
 * Example: Manual Performance Monitoring
 */
export function monitorPerformance() {
  const stats = {
    frameCount: 0,
    lastTime: performance.now(),
    fps: 0
  };

  function updateStats() {
    stats.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - stats.lastTime >= 1000) {
      stats.fps = stats.frameCount;
      stats.frameCount = 0;
      stats.lastTime = currentTime;
      
      // Get adaptive quality metrics
      const qualitySettings = adaptiveQualityManager.getQualitySettings();
      const pixelRatio = pixelRatioManager.getOptimalPixelRatio();
      
      console.log('Performance Stats:', {
        fps: stats.fps,
        pixelRatio: pixelRatio.toFixed(2),
        qualityLevel: adaptiveQualityManager.getCurrentLevel(),
        shadows: qualitySettings.shadows,
        animations: qualitySettings.animationsEnabled
      });
    }
    
    requestAnimationFrame(updateStats);
  }
  
  updateStats();
}

/**
 * Example: Custom Quality Settings
 */
export function setupCustomQuality() {
  // Force high quality on powerful devices
  const isHighEndDevice = navigator.hardwareConcurrency >= 8 && 
                         (navigator.deviceMemory || 4) >= 8;
  
  if (isHighEndDevice) {
    adaptiveQualityManager.setQualityLevel(2); // High quality
    console.log('High-end device detected, using maximum quality');
  } else {
    // Let adaptive quality manage automatically
    console.log('Standard device, using adaptive quality management');
  }
  
  // Monitor for quality changes
  let lastQualityLevel = adaptiveQualityManager.getCurrentLevel();
  
  setInterval(() => {
    const currentLevel = adaptiveQualityManager.getCurrentLevel();
    if (currentLevel !== lastQualityLevel) {
      console.log(`Quality level changed: ${lastQualityLevel} → ${currentLevel}`);
      lastQualityLevel = currentLevel;
      
      // Notify user if quality was reduced due to performance
      if (currentLevel < 2) {
        showPerformanceNotification('Graphics quality adjusted for better performance');
      }
    }
  }, 2000);
}

/**
 * Example: Handle WebGL Errors Gracefully
 */
export function setupErrorHandling() {
  // Setup global WebGL context loss handling
  window.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.error('WebGL context lost, attempting recovery...');
    
    showErrorNotification('3D visualization temporarily unavailable. Switching to list view.');
    
    // Force fallback mode
    const mapElements = document.querySelectorAll('.map-canvas');
    mapElements.forEach(element => {
      element.classList.add('webgl-error');
    });
  });

  window.addEventListener('webglcontextrestored', () => {
    console.log('WebGL context restored');
    showSuccessNotification('3D visualization restored!');
    
    // Remove fallback mode
    const mapElements = document.querySelectorAll('.map-canvas');
    mapElements.forEach(element => {
      element.classList.remove('webgl-error');
    });
  });
  
  // Handle memory errors
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('memory')) {
      console.error('Memory error detected:', event.error);
      
      // Force low quality mode
      adaptiveQualityManager.setQualityLevel(0);
      showErrorNotification('Memory usage optimized. Some visual effects disabled.');
    }
  });
}

/**
 * Example: Preload Components Based on User Behavior
 */
export function setupSmartPreloading() {
  // Preload when user hovers over the map toggle
  const mapToggle = document.getElementById('map-toggle');
  if (mapToggle) {
    let preloadStarted = false;
    
    const startPreload = () => {
      if (!preloadStarted) {
        preloadStarted = true;
        console.log('Starting smart preload of 3D components...');
        
        setupProgressiveLoading([mapToggle]).then(() => {
          console.log('3D components preloaded and ready');
        });
      }
    };
    
    // Preload on hover (desktop)
    mapToggle.addEventListener('mouseenter', startPreload);
    
    // Preload on focus
    mapToggle.addEventListener('focus', startPreload);
    
    // Preload on touch (mobile)
    mapToggle.addEventListener('touchstart', startPreload, { passive: true });
  }
  
  // Preload during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      console.log('Browser idle detected, preloading 3D components...');
      setupProgressiveLoading([]);
    });
  }
}

/**
 * Utility function to show notifications
 */
function showPerformanceNotification(message) {
  console.log('Performance notification:', message);
  // You could implement actual UI notifications here
}

function showErrorNotification(message) {
  console.error('Error notification:', message);
  // You could implement actual error notifications here
}

function showSuccessNotification(message) {
  console.log('Success notification:', message);
  // You could implement actual success notifications here
}

/**
 * Complete setup function that applies all optimizations
 */
export function setupCompletePerformanceOptimizations() {
  console.log('🚀 Setting up complete 3D map performance optimizations...');
  
  const cleanup1 = setupOptimized3DMap();
  setupCustomQuality();
  setupErrorHandling();
  setupSmartPreloading();
  monitorPerformance();
  
  console.log('✅ All performance optimizations active');
  
  return () => {
    cleanup1();
    console.log('🧹 Performance optimizations cleaned up');
  };
}

export default {
  setupOptimized3DMap,
  monitorPerformance,
  setupCustomQuality,
  setupErrorHandling,
  setupSmartPreloading,
  setupCompletePerformanceOptimizations
};
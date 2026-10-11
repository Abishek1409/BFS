/**
 * Performance Monitoring Hook
 * Tracks performance metrics (placeholder for task 8)
 */

import React, { useState, useEffect, useRef } from 'react';
import { PerformanceMonitor } from '../lib/utils.js';

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    isLowPerformance: false
  });
  
  const monitorRef = useRef(new PerformanceMonitor());

  useEffect(() => {
    const monitor = monitorRef.current;
    
    const updateMetrics = () => {
      setMetrics({
        fps: monitor.getFPS(),
        memoryUsage: monitor.getMemoryUsage(),
        isLowPerformance: monitor.isPerformanceLow()
      });
    };

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    monitor: monitorRef.current
  };
}

export default usePerformanceMonitor;
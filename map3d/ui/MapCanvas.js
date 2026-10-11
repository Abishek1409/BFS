/**
 * MapCanvas Component
 * Main entry point for the 3D map with dynamic loading and fallback
 */

import React, { useState, useEffect, useMemo } from 'react';
import { checkWebGLSupport } from '../lib/webgl-detection.js';
import { Scene3DErrorBoundary } from '../lib/error-boundaries.js';
import { EnhancedListView } from './EnhancedListView.js';
import { CafeScene as CafeSceneComponent } from '../scene/CafeScene.js';
import { MAP_MODES } from '../lib/config.js';

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
      color: '#E2E8F0',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #4A5568',
          borderTop: '3px solid #D69E2E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px auto'
        }}></div>
        <div>Loading 3D Café Map...</div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

// Main MapCanvas Component with Enhanced Error Handling and Optimizations
export function MapCanvas({
  mode = MAP_MODES.DIMMED,
  tableData = [],
  selectedTables = new Set(),
  onTableClick,
  onModeChange,
  className = '',
  style = {}
}) {
  const [webglSupported] = useState(() => checkWebGLSupport());
  const [CafeScene, setCafeScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMode, setCurrentMode] = useState(mode);
  
  // Load the 3D scene from the compiled bundle.
  useEffect(() => {
    if (webglSupported) {
      setCafeScene(() => CafeSceneComponent);
      setLoading(false);
    } else if (webglSupported === false) {
      setLoading(false);
    }
  }, [webglSupported]);

  // Handle mode changes
  const handleModeChange = (newMode) => {
    setCurrentMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Sync external mode changes
  useEffect(() => {
    if (mode !== currentMode) {
      setCurrentMode(mode);
    }
  }, [mode]);
  
  // Memoize table data for performance
  const processedTableData = useMemo(() => {
    return tableData.map(table => ({
      ...table,
      statusColor: table.statusColor || '#4A5568'
    }));
  }, [tableData]);
  
  // Handle loading state
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  // Handle WebGL not supported
  if (!webglSupported) {
    return (
      <EnhancedListView
        tableData={processedTableData}
        onTableClick={onTableClick}
        className={className}
        style={style}
      />
    );
  }
  
  // Handle 3D scene loading error
  if (error || !CafeScene) {
    return (
      <EnhancedListView
        tableData={processedTableData}
        onTableClick={onTableClick}
        className={className}
        style={style}
      />
    );
  }
  
  // Render 3D scene with error boundaries
  return (
    <div className={`map-canvas ${className}`} style={style}>
      <Scene3DErrorBoundary
        tableData={processedTableData}
        onTableClick={onTableClick}
        className={className}
        style={style}
      >
        <CafeScene
          mode={currentMode}
          tableData={processedTableData}
          selectedTables={selectedTables}
          onTableClick={onTableClick}
        />
      </Scene3DErrorBoundary>
    </div>
  );
}

export default MapCanvas;
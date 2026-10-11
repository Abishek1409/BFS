/**
 * Main 3D Café Scene Component
 * Uses React Three Fiber to render the café environment
 */

import React, { useRef, useEffect, useState, Fragment, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { 
  CAMERA_CONFIG, 
  LIGHTING_CONFIG, 
  ANIMATION_CONFIG,
  PERFORMANCE_CONFIG,
  CAFE_LAYOUT,
  MAP_MODES,
  TableStatus 
} from '../lib/config.js';
import { isTabVisible, PerformanceMonitor } from '../lib/utils.js';
import { 
  pixelRatioManager,
  geometryInstanceManager,
  tabVisibilityManager,
  adaptiveQualityManager
} from '../lib/performance-optimizations.js';
import { TableEntity } from './TableEntity.js';
import { CounterEntity } from './CounterEntity.js';
import { StatusMarker } from './StatusMarker.js';

// Lighting Setup Component with Performance Optimization
function SceneLighting({ enabled = true }) {
  const qualitySettings = adaptiveQualityManager.getQualitySettings();
  
  return (
    <>
      {/* Ambient Light */}
      <ambientLight 
        intensity={LIGHTING_CONFIG.ambient.intensity}
        color={LIGHTING_CONFIG.ambient.color}
      />
      
      {/* Main Directional Light with conditional shadows */}
      <directionalLight
        intensity={LIGHTING_CONFIG.directional.intensity}
        color={LIGHTING_CONFIG.directional.color}
        position={LIGHTING_CONFIG.directional.position}
        castShadow={enabled && qualitySettings.shadows}
        shadow-mapSize-width={qualitySettings.shadows ? 2048 : 512}
        shadow-mapSize-height={qualitySettings.shadows ? 2048 : 512}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Accent Point Light (golden theme) */}
      <pointLight
        intensity={LIGHTING_CONFIG.point.intensity}
        color={LIGHTING_CONFIG.point.color}
        position={LIGHTING_CONFIG.point.position}
      />
      
      {/* Additional fill lights for better visibility - only in high quality */}
      {qualitySettings.shadows && (
        <>
          <pointLight
            intensity={0.2}
            color="#ffffff"
            position={[-5, 3, 5]}
          />
          <pointLight
            intensity={0.2}
            color="#ffffff"
            position={[5, 3, -5]}
          />
        </>
      )}
    </>
  );
}

// Idle Animation Component for Camera with Tab Visibility
function IdleCameraAnimation({ cameraRef, active }) {
  const [isTabActive, setIsTabActive] = useState(true);
  
  useEffect(() => {
    return tabVisibilityManager.onVisibilityChange((visible) => {
      setIsTabActive(visible);
    });
  }, []);
  
  useFrame((state) => {
    // Only animate when tab is visible and animation is active
    if (!active || !cameraRef.current || !isTabActive) return;
    
    const time = state.clock.getElapsedTime();
    const { rotationSpeed, amplitude } = ANIMATION_CONFIG.cameraIdle;
    
    // Smooth idle drift animation
    const basePosition = CAMERA_CONFIG.position;
    cameraRef.current.position.x = basePosition[0] + Math.sin(time * rotationSpeed) * amplitude;
    cameraRef.current.position.z = basePosition[2] + Math.cos(time * rotationSpeed * 0.7) * amplitude;
    
    // Look at center with slight drift
    cameraRef.current.lookAt(
      Math.sin(time * rotationSpeed * 0.3) * amplitude * 0.5,
      0,
      Math.cos(time * rotationSpeed * 0.3) * amplitude * 0.5
    );
  });
  
  return null;
}

// Environment Components
function CafeFloor() {
  return (
    <>
      {/* Main Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[14, 0.1, 12]} />
        <meshStandardMaterial 
          color="#2D3748"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Floor border/trim */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[14.2, 0.04, 12.2]} />
        <meshStandardMaterial 
          color="#1A202C"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Decorative floor patterns */}
      <mesh position={[0, -0.04, 0]} receiveShadow rotation={[0, Math.PI/4, 0]}>
        <ringGeometry args={[3, 3.1, 8]} />
        <meshStandardMaterial 
          color="#D9A83E"
          transparent
          opacity={0.3}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </>
  );
}

// Main Scene Content Component with Performance Optimizations
function SceneContent({ 
  interactive, 
  onTableClick, 
  performanceMonitor,
  tableStatuses = new Map(),
  selectedTables = new Set(),
  showStatusMarkers = true
}) {
  const groupRef = useRef();
  const cameraRef = useRef();
  const [qualitySettings, setQualitySettings] = useState(adaptiveQualityManager.getQualitySettings());
  
  // Update quality settings based on performance
  useEffect(() => {
    const updateQuality = () => {
      adaptiveQualityManager.update();
      const newSettings = adaptiveQualityManager.getQualitySettings();
      setQualitySettings(newSettings);
    };
    
    const interval = setInterval(updateQuality, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);
  
  return (
    <group ref={groupRef}>
      <SceneLighting enabled={qualitySettings.shadows} />
      <CafeFloor />
      
      {/* Idle camera animation for dimmed mode */}
      <IdleCameraAnimation 
        cameraRef={cameraRef} 
        active={!interactive && ANIMATION_CONFIG.cameraIdle.enabled && qualitySettings.animationsEnabled} 
      />
      
      {/* Tables with enhanced geometry and status */}
      {CAFE_LAYOUT.tables.map((table, index) => {
        // Skip rendering distant tables in low quality mode
        if (!qualitySettings.animationsEnabled && index > qualitySettings.instanceLimit) {
          return null;
        }
        
        const tableStatusData = tableStatuses.get(table.id);
        const status = tableStatusData?.status || TableStatus.FREE;
        const orderInfo = tableStatusData?.orderInfo || null;
        const isSelected = selectedTables.has(table.id);
        
        return (
          <Fragment key={table.id}>
            <TableEntity
              id={table.id}
              position={table.position}
              tableNumber={table.number}
              capacity={table.capacity}
              status={status}
              orderInfo={orderInfo}
              isSelected={isSelected}
              onClick={onTableClick}
              qualitySettings={qualitySettings}
            />
            
            {/* Status Marker floating above table */}
            {showStatusMarkers && orderInfo && qualitySettings.animationsEnabled && (
              <StatusMarker
                orderNumber={orderInfo.orderNo}
                elapsedTime={orderInfo.createdAt}
                position={[table.position[0], table.position[1] + 2, table.position[2]]}
                status={status}
                orderInfo={orderInfo}
              />
            )}
          </Fragment>
        );
      })}
      
      {/* Counters with enhanced geometry */}
      {CAFE_LAYOUT.counters.map(counter => (
        <CounterEntity
          key={counter.id}
          id={counter.id}
          position={counter.position}
          type={counter.type}
          onClick={onTableClick}
          qualitySettings={qualitySettings}
        />
      ))}
      
      {/* Performance monitoring reference */}
      <primitive 
        object={{ 
          update: () => performanceMonitor?.update() 
        }} 
        visible={false} 
      />
    </group>
  );
}

// Main Café Scene Component with Performance Optimizations
export function CafeScene({ 
  mode = MAP_MODES.DIMMED, 
  onTableClick,
  tableStatuses,
  selectedTables,
  showStatusMarkers = true,
  className = '',
  style = {} 
}) {
  const [performanceMonitor] = useState(() => new PerformanceMonitor());
  const rendererRef = useRef();
  const cameraRef = useRef();
  const interactive = mode === MAP_MODES.INTERACTIVE;
  
  // Enhanced table click handler that passes complete table data
  const handleTableClick = useCallback((tableId, tableData) => {
    if (onTableClick) {
      onTableClick(tableId, tableData);
    }
  }, [onTableClick]);
  
  // Performance optimization is handled by the Canvas DPR setting and
  // adaptive quality updates inside SceneContent, where the R3F context exists.
  
  const canvasStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    pointerEvents: interactive ? 'auto' : 'none',
    background: 'radial-gradient(ellipse at center, #1A202C 0%, #000000 100%)',
    ...style
  };
  
  // Get current quality settings
  const qualitySettings = adaptiveQualityManager.getQualitySettings();
  
  return (
    <div className={`cafe-scene ${className}`} style={{ position: 'relative' }}>
      <Canvas
        style={canvasStyle}
        shadows={qualitySettings.shadows}
        dpr={qualitySettings.pixelRatio}
        gl={{ 
          antialias: qualitySettings.antialias,
          alpha: PERFORMANCE_CONFIG.alpha,
          powerPreference: PERFORMANCE_CONFIG.powerPreference,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: PERFORMANCE_CONFIG.failIfMajorPerformanceCaveat
        }}
        onCreated={(state) => {
          rendererRef.current = state.gl;
          // Setup WebGL context loss handling
          if (state.gl.canvas) {
            state.gl.canvas.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              console.warn('WebGL context lost - attempting recovery');
            });
          }
        }}
      >
        {/* Isometric Camera Setup */}
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={CAMERA_CONFIG.position}
          fov={CAMERA_CONFIG.fov}
          near={CAMERA_CONFIG.near}
          far={CAMERA_CONFIG.far}
        />
        
        {/* Controls (only active in interactive mode) */}
        {interactive && (
          <OrbitControls
            ref={cameraRef}
            target={[0, 0, 0]}
            enablePan={CAMERA_CONFIG.enablePan}
            enableZoom={true}
            enableRotate={true}
            minDistance={CAMERA_CONFIG.minDistance}
            maxDistance={CAMERA_CONFIG.maxDistance}
            minPolarAngle={CAMERA_CONFIG.minPolarAngle}
            maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
            panSpeed={CAMERA_CONFIG.panSpeed}
            rotateSpeed={CAMERA_CONFIG.rotateSpeed}
            zoomSpeed={CAMERA_CONFIG.zoomSpeed}
            enableDamping={true}
            dampingFactor={0.05}
            // Camera movement limits to keep view within café bounds
            maxTargetRadius={8} // Limit panning to within café area
            minTargetRadius={0}
            // Limit horizontal panning while using configured vertical bounds
            minAzimuthAngle={-Math.PI} // Full horizontal rotation
            maxAzimuthAngle={Math.PI}
          />
        )}
        
        {/* Scene Content */}
        <SceneContent
          interactive={interactive}
          onTableClick={handleTableClick}
          performanceMonitor={performanceMonitor}
          tableStatuses={tableStatuses}
          selectedTables={selectedTables}
          showStatusMarkers={showStatusMarkers}
        />
      </Canvas>
    </div>
  );
}

export default CafeScene;
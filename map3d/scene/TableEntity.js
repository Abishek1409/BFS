/**
 * Table Entity Component
 * Individual 3D table representation with status-based coloring
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TableStatus, STATUS_COLORS, ANIMATION_CONFIG } from '../lib/config.js';
import { colorUtils, easing } from '../lib/utils.js';

export function TableEntity({ 
  id, 
  position, 
  status = TableStatus.FREE, 
  orderInfo, 
  onClick,
  tableNumber,
  capacity = 4,
  isSelected = false,
  qualitySettings = { shadows: true, animationsEnabled: true }
}) {
  const tableRef = useRef();
  const selectionRingRef = useRef();
  const statusGlowRef = useRef();
  
  // Color transition state
  const [colorTransition, setColorTransition] = useState({
    from: STATUS_COLORS[status],
    to: STATUS_COLORS[status],
    progress: 1,
    startTime: 0
  });
  
  // Selection animation state
  const [selectionAnimation, setSelectionAnimation] = useState({
    scale: 1,
    opacity: 0,
    startTime: 0
  });
  
  // Status glow animation
  const [glowAnimation, setGlowAnimation] = useState({
    intensity: 0,
    scale: 1
  });

  // Calculate current color based on transition
  const currentColor = useMemo(() => {
    if (colorTransition.progress >= 1) {
      return colorTransition.to;
    }
    
    const easedProgress = easing.easeInOutQuad(colorTransition.progress);
    return colorUtils.interpolateColor(
      colorTransition.from, 
      colorTransition.to, 
      easedProgress
    );
  }, [colorTransition]);
  
  // Start color transition when status changes
  useEffect(() => {
    const targetColor = STATUS_COLORS[status] || STATUS_COLORS[TableStatus.FREE];
    
    if (currentColor !== targetColor) {
      setColorTransition(prev => ({
        from: prev.to,
        to: targetColor,
        progress: 0,
        startTime: performance.now()
      }));
    }
  }, [status]);
  
  // Start selection animation when selection changes  
  useEffect(() => {
    setSelectionAnimation({
      scale: isSelected ? 1 : 0.8,
      opacity: isSelected ? 0.6 : 0,
      startTime: performance.now()
    });
  }, [isSelected]);
  
  // Animation frame updates (only if animations enabled)
  useFrame((state, delta) => {
    if (!qualitySettings.animationsEnabled) return;
    
    const now = performance.now();
    
    // Update color transition
    if (colorTransition.progress < 1) {
      const elapsed = now - colorTransition.startTime;
      const duration = ANIMATION_CONFIG.statusTransition.duration * 1000;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setColorTransition(prev => ({
        ...prev,
        progress: newProgress
      }));
    }
    
    // Update selection ring animation
    if (selectionRingRef.current) {
      const targetScale = isSelected ? 1.1 : 1;
      const targetOpacity = isSelected ? 0.8 : 0;
      
      selectionRingRef.current.scale.lerp({ x: targetScale, y: 1, z: targetScale }, delta * 5);
      selectionRingRef.current.material.opacity = THREE.MathUtils.lerp(
        selectionRingRef.current.material.opacity,
        targetOpacity,
        delta * 8
      );
    }
    
    // Update status glow animation
    if (statusGlowRef.current && status !== TableStatus.FREE) {
      const pulseSpeed = 2;
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.5 + 0.5;
      
      statusGlowRef.current.material.opacity = 0.3 + pulse * 0.2;
      statusGlowRef.current.scale.setScalar(1 + pulse * 0.1);
    }
  });
  
  const handleClick = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(id, {
        tableNumber: tableNumber,
        position: position,
        status: status,
        orderInfo: orderInfo,
        capacity: capacity
      });
    }
  };
  
  // Table size based on capacity
  const tableRadius = capacity <= 2 ? 0.6 : capacity <= 4 ? 0.8 : 1.0;
  const tableHeight = 0.05;
  const legHeight = 0.75;
  
  return (
    <group position={position} onClick={handleClick} ref={tableRef}>
      {/* Table Surface - Low-poly octagon */}
      <mesh 
        position={[0, legHeight + tableHeight/2, 0]} 
        castShadow={qualitySettings.shadows} 
        receiveShadow={qualitySettings.shadows}
      >
        <cylinderGeometry args={[tableRadius, tableRadius, tableHeight, 8]} />
        <meshStandardMaterial 
          color={currentColor}
          roughness={0.7}
          metalness={0.1}
          emissive={isSelected ? '#333300' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>
      
      {/* Table Legs - 4 legs for visual stability */}
      {[
        [-tableRadius * 0.6, 0, -tableRadius * 0.6],
        [tableRadius * 0.6, 0, -tableRadius * 0.6],
        [-tableRadius * 0.6, 0, tableRadius * 0.6],
        [tableRadius * 0.6, 0, tableRadius * 0.6]
      ].map((legPos, index) => (
        <mesh 
          key={`leg-${index}`}
          position={[legPos[0], legHeight/2, legPos[2]]} 
          castShadow={qualitySettings.shadows}
        >
          <cylinderGeometry args={[0.05, 0.05, legHeight, 6]} />
          <meshStandardMaterial 
            color="#654321" 
            roughness={0.8}
            metalness={0.0}
          />
        </mesh>
      ))}
      
      {/* Table Number Label */}
      <mesh position={[0, legHeight + tableHeight + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.15, 0.25, 8]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>
      
      {/* Enhanced selection indicator ring with animation */}
      <mesh 
        ref={selectionRingRef}
        position={[0, 0.02, 0]} 
        rotation={[-Math.PI/2, 0, 0]}
        visible={isSelected}
      >
        <ringGeometry args={[tableRadius + 0.1, tableRadius + 0.2, 32]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.6}
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Animated selection pulse ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[tableRadius + 0.2, tableRadius + 0.25, 32]} />
          <meshBasicMaterial 
            color="#FFD700" 
            transparent 
            opacity={0.3}
            side={2}
          />
        </mesh>
      )}
      
      {/* Enhanced status indicator glow effect */}
      {status !== TableStatus.FREE && (
        <mesh 
          ref={statusGlowRef}
          position={[0, legHeight + tableHeight + 0.15, 0]}
        >
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial 
            color={currentColor} 
            transparent 
            opacity={0.4}
          />
        </mesh>
      )}
      
      {/* Status priority indicator */}
      {(status === TableStatus.READY_TO_SERVE || status === TableStatus.NEEDS_BILL) && (
        <mesh position={[0, legHeight + tableHeight + 0.3, 0]}>
          <coneGeometry args={[0.08, 0.15, 6]} />
          <meshBasicMaterial 
            color={status === TableStatus.NEEDS_BILL ? '#FFD700' : '#48bb78'}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

export default TableEntity;
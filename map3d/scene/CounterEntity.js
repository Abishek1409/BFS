/**
 * Counter Entity Component
 * Represents billing counter, juice station, and snack counter
 */

import React, { useRef } from 'react';
import * as THREE from 'three';

export function CounterEntity({ 
  id, 
  position, 
  type, 
  onClick,
  qualitySettings = { shadows: true, animationsEnabled: true }
}) {
  const counterRef = useRef();
  
  const handleClick = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(id, {
        id,
        type,
        position
      });
    }
  };
  
  // Counter dimensions based on type
  const getCounterDimensions = () => {
    switch (type) {
      case 'billing':
        return { width: 3, height: 1, depth: 1.5 };
      case 'juice':
        return { width: 1.5, height: 1, depth: 1 };
      case 'snack':
        return { width: 1.5, height: 1, depth: 1 };
      default:
        return { width: 2, height: 1, depth: 1 };
    }
  };
  
  // Counter color based on type
  const getCounterColor = () => {
    switch (type) {
      case 'billing':
        return '#D69E2E'; // Gold theme color
      case 'juice':
        return '#48bb78'; // Green
      case 'snack':
        return '#ed8936'; // Orange
      default:
        return '#4a5568'; // Neutral grey
    }
  };
  
  const dimensions = getCounterDimensions();
  const color = getCounterColor();
  
  return (
    <group position={position} onClick={handleClick} ref={counterRef}>
      {/* Counter Base */}
      <mesh 
        position={[0, dimensions.height/2, 0]} 
        castShadow={qualitySettings.shadows} 
        receiveShadow={qualitySettings.shadows}
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      
      {/* Counter Top */}
      <mesh 
        position={[0, dimensions.height + 0.05, 0]} 
        castShadow={qualitySettings.shadows} 
        receiveShadow={qualitySettings.shadows}
      >
        <boxGeometry args={[dimensions.width + 0.1, 0.1, dimensions.depth + 0.1]} />
        <meshStandardMaterial 
          color="#2D3748"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      
      {/* Counter Label/Sign */}
      <mesh position={[0, dimensions.height + 0.3, dimensions.depth/2 + 0.1]}>
        <planeGeometry args={[dimensions.width * 0.6, 0.3]} />
        <meshBasicMaterial color="#1A202C" transparent opacity={0.8} />
      </mesh>
      
      {/* Type-specific decorations */}
      {type === 'billing' && (
        <mesh position={[0, dimensions.height + 0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 8]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      )}
      
      {type === 'juice' && (
        <>
          <mesh position={[-0.3, dimensions.height + 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 6]} />
            <meshBasicMaterial color="#FF6B35" />
          </mesh>
          <mesh position={[0.3, dimensions.height + 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 6]} />
            <meshBasicMaterial color="#4ECDC4" />
          </mesh>
        </>
      )}
      
      {type === 'snack' && (
        <>
          <mesh position={[-0.2, dimensions.height + 0.15, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.15]} />
            <meshBasicMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0.2, dimensions.height + 0.15, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.15]} />
            <meshBasicMaterial color="#F4A261" />
          </mesh>
        </>
      )}
    </group>
  );
}

export default CounterEntity;
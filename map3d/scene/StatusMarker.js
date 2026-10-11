/**
 * Status Marker Component
 * Floating information display above tables showing order numbers and elapsed time
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { formatOrderNumber, getElapsedTime } from '../lib/utils.js';
import { STATUS_COLORS, TableStatus } from '../lib/config.js';

export function StatusMarker({ 
  orderNumber, 
  elapsedTime, 
  position,
  status = TableStatus.FREE,
  orderInfo = null
}) {
  const markerRef = useRef();
  const backgroundRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  
  // Show marker only if there's relevant information
  const shouldShow = orderNumber || elapsedTime || (orderInfo && orderInfo.orderNo);
  
  // Format display text
  const displayOrderNumber = orderNumber || formatOrderNumber(orderInfo?.orderNo);
  const displayElapsedTime = elapsedTime || (orderInfo?.createdAt ? getElapsedTime(orderInfo.createdAt) : null);
  
  useEffect(() => {
    setIsVisible(shouldShow);
  }, [shouldShow]);
  
  // Floating animation
  useFrame((state) => {
    if (markerRef.current && isVisible) {
      // Gentle floating motion
      const floatOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      markerRef.current.position.y = position[1] + 1.2 + floatOffset;
      
      // Gentle rotation to always face camera
      markerRef.current.lookAt(state.camera.position);
    }
  });
  
  if (!isVisible) {
    return null;
  }
  
  // Determine marker color based on status
  const markerColor = STATUS_COLORS[status] || STATUS_COLORS[TableStatus.FREE];
  const textColor = '#FFFFFF';
  const backgroundColor = markerColor;
  
  return (
    <group ref={markerRef} position={position}>
      {/* Background panel */}
      <mesh ref={backgroundRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshBasicMaterial 
          color={backgroundColor}
          transparent
          opacity={0.8}
          side={2}
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.005]}>
        <ringGeometry args={[0.58, 0.62, 16]} />
        <meshBasicMaterial 
          color="#FFD700"
          transparent
          opacity={0.9}
          side={2}
        />
      </mesh>
      
      {/* Order Number Text */}
      {displayOrderNumber && (
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.15}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          lineHeight={1}
        >
          {displayOrderNumber}
        </Text>
      )}
      
      {/* Elapsed Time Text */}
      {displayElapsedTime && (
        <Text
          position={[0, -0.1, 0]}
          fontSize={0.12}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          lineHeight={1}
        >
          {displayElapsedTime}
        </Text>
      )}
      
      {/* Priority indicator for urgent statuses */}
      {(status === TableStatus.READY_TO_SERVE || status === TableStatus.NEEDS_BILL) && (
        <>
          {/* Pulsing priority ring */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[0.65, 0.7, 16]} />
            <meshBasicMaterial 
              color="#FF6B6B"
              transparent
              opacity={0.6}
              side={2}
            />
          </mesh>
          
          {/* Priority indicator dot */}
          <mesh position={[0.45, 0.25, 0.02]}>
            <circleGeometry args={[0.06, 8]} />
            <meshBasicMaterial 
              color="#FF6B6B"
              transparent
              opacity={0.9}
            />
          </mesh>
        </>
      )}
      
      {/* Connection line to table */}
      <mesh position={[0, -0.6, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
        <meshBasicMaterial 
          color={backgroundColor}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

export default StatusMarker;
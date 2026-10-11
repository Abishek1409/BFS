/**
 * Map Controls Component
 * Toggle between Dimmed and Interactive modes with UI opacity control
 */

import React, { useState, useEffect } from 'react';
import { MAP_MODES, ANIMATION_CONFIG } from '../lib/config.js';

// Mode Toggle Button Component  
function ModeToggleButton({ currentMode, onModeChange, className = '' }) {
  const isInteractive = currentMode === MAP_MODES.INTERACTIVE;
  
  const buttonStyle = {
    position: 'fixed',
    top: '90px',
    right: '20px',
    zIndex: 1000,
    background: isInteractive 
      ? 'rgba(217, 168, 62, 0.9)' 
      : 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `2px solid ${isInteractive ? '#d9a83e' : 'rgba(255, 255, 255, 0.2)'}`,
    borderRadius: '12px',
    padding: '10px 16px',
    color: isInteractive ? '#ffffff' : '#fff8e8',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isInteractive 
      ? '0 8px 24px rgba(217, 168, 62, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '140px',
    justifyContent: 'center'
  };

  const handleClick = () => {
    const newMode = isInteractive ? MAP_MODES.DIMMED : MAP_MODES.INTERACTIVE;
    onModeChange(newMode);
  };

  const handleMouseEnter = (e) => {
    if (!isInteractive) {
      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
      e.target.style.borderColor = 'rgba(217, 168, 62, 0.4)';
      e.target.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!isInteractive) {
      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      e.target.style.transform = 'translateY(0)';
    }
  };

  return (
    <button
      className={`map-mode-toggle ${className}`}
      style={buttonStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={isInteractive ? 'Exit Interactive Mode' : 'Enter Interactive Mode'}
    >
      <span style={{ fontSize: '16px' }}>
        {isInteractive ? '🎮' : '👆'}
      </span>
      <span>
        {isInteractive ? 'Exit Interactive' : 'Interactive Mode'}
      </span>
    </button>
  );
}

// Camera Controls Help Component
function CameraControlsHelp({ visible, onClose }) {
  if (!visible) return null;

  const helpStyle = {
    position: 'fixed',
    top: '150px',
    right: '20px',
    zIndex: 1001,
    background: 'rgba(12, 10, 7, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(217, 168, 62, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    color: '#fff8e8',
    fontSize: '12px',
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    maxWidth: '200px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.3s ease'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '4px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#fff8e8',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '2px',
    lineHeight: '1'
  };

  return (
    <div style={helpStyle}>
      <button style={closeButtonStyle} onClick={onClose}>×</button>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#d9a83e' }}>
        Camera Controls
      </div>
      <div style={{ lineHeight: '1.4' }}>
        <div><strong>Orbit:</strong> Left drag</div>
        <div><strong>Pan:</strong> Right drag</div>
        <div><strong>Zoom:</strong> Mouse wheel</div>
        <div style={{ marginTop: '8px', fontSize: '11px', opacity: '0.8' }}>
          Click tables to view order details
        </div>
      </div>
    </div>
  );
}

// UI Opacity Controller Component
function UIOpacityController({ mode, children }) {
  const isInteractive = mode === MAP_MODES.INTERACTIVE;
  
  const [opacity, setOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    
    // Smooth transition to new opacity
    const timer = setTimeout(() => {
      setOpacity(isInteractive ? 0.3 : 1);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, ANIMATION_CONFIG.modeTransition.duration * 1000);
    }, 50);

    return () => clearTimeout(timer);
  }, [mode, isInteractive]);

  const containerStyle = {
    opacity: opacity,
    transition: `opacity ${ANIMATION_CONFIG.modeTransition.duration}s ${ANIMATION_CONFIG.modeTransition.easing}`,
    pointerEvents: isInteractive ? 'none' : 'auto'
  };

  return (
    <div 
      className={`ui-opacity-controller ${isTransitioning ? 'transitioning' : ''}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
}

// Main Map Controls Component
export function MapControls({ 
  mode = MAP_MODES.DIMMED, 
  onModeChange,
  showHelp = true,
  className = '',
  children 
}) {
  const [showCameraHelp, setShowCameraHelp] = useState(false);
  
  useEffect(() => {
    // Show camera help when entering interactive mode
    if (mode === MAP_MODES.INTERACTIVE && showHelp) {
      setShowCameraHelp(true);
      
      // Auto-hide help after 5 seconds
      const timer = setTimeout(() => {
        setShowCameraHelp(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowCameraHelp(false);
    }
  }, [mode, showHelp]);

  const handleModeChange = (newMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <div className={`map-controls ${className}`}>
      {/* Mode Toggle Button */}
      <ModeToggleButton 
        currentMode={mode}
        onModeChange={handleModeChange}
      />
      
      {/* Camera Controls Help */}
      <CameraControlsHelp 
        visible={showCameraHelp}
        onClose={() => setShowCameraHelp(false)}
      />
      
      {/* UI Opacity Controller for children */}
      <UIOpacityController mode={mode}>
        {children}
      </UIOpacityController>
    </div>
  );
}

export default MapControls;
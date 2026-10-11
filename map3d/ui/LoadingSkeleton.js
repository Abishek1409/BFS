/**
 * Loading Skeleton Component
 * Displays while 3D scene initializes
 */

import React from 'react';

export function LoadingSkeleton({ message = 'Loading 3D components...' }) {
  const containerStyle = {
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
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '3px solid #4A5568',
    borderTop: '3px solid #D69E2E',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px auto'
  };

  const keyframesStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={containerStyle}>
      <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
      <div style={{ textAlign: 'center' }}>
        <div style={spinnerStyle}></div>
        <div>{message}</div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
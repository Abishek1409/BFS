/**
 * Error Boundaries and Graceful Degradation for 3D Map
 * Handles WebGL failures, memory issues, and provides fallback systems
 */

import React from 'react';
import { checkWebGLSupport, getWebGLFallbackMessage } from './webgl-detection.js';
import { CAFE_LAYOUT, TableStatus, STATUS_COLORS } from './config.js';

/**
 * Error Boundary for 3D Components
 */
export class Scene3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      fallbackMode: 'enhanced-list'
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Scene Error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      fallbackMode: this.determineFallbackMode(error)
    });

    // Report error to monitoring service if available
    if (window.errorReporter) {
      window.errorReporter.report('3D_SCENE_ERROR', {
        error: error.message,
        stack: error.stack,
        info: errorInfo.componentStack
      });
    }
  }

  /**
   * Determine appropriate fallback mode based on error type
   */
  determineFallbackMode(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('webgl') || errorMessage.includes('context')) {
      return 'enhanced-list';
    }
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      return 'simple-list';
    }
    if (errorMessage.includes('shader') || errorMessage.includes('program')) {
      return 'enhanced-list';
    }
    
    return 'enhanced-list';
  }

  /**
   * Attempt to recover from error
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      const { fallbackMode } = this.state;
      const { tableData, onTableClick, className, style } = this.props;

      return (
        <ErrorFallbackComponent
          fallbackMode={fallbackMode}
          error={this.state.error}
          tableData={tableData}
          onTableClick={onTableClick}
          onRetry={this.handleRetry}
          className={className}
          style={style}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component with Multiple Modes
 */
function ErrorFallbackComponent({
  fallbackMode,
  error,
  tableData = [],
  onTableClick,
  onRetry,
  className = '',
  style = {}
}) {
  const fallbackStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
    padding: '20px',
    overflow: 'auto',
    color: '#E2E8F0',
    fontFamily: 'Arial, sans-serif',
    ...style
  };

  switch (fallbackMode) {
    case 'enhanced-list':
      return (
        <div className={`error-fallback enhanced-list ${className}`} style={fallbackStyle}>
          <EnhancedListFallback
            error={error}
            tableData={tableData}
            onTableClick={onTableClick}
            onRetry={onRetry}
          />
        </div>
      );
      
    case 'simple-list':
      return (
        <div className={`error-fallback simple-list ${className}`} style={fallbackStyle}>
          <SimpleListFallback
            error={error}
            tableData={tableData}
            onTableClick={onTableClick}
            onRetry={onRetry}
          />
        </div>
      );
      
    default:
      return (
        <div className={`error-fallback minimal ${className}`} style={fallbackStyle}>
          <MinimalFallback
            error={error}
            onRetry={onRetry}
          />
        </div>
      );
  }
}

/**
 * Enhanced List Fallback with Status Colors and Interactive Elements
 */
function EnhancedListFallback({ error, tableData, onTableClick, onRetry }) {
  const processedTableData = tableData.length > 0 ? tableData : generateDefaultTableData();

  return (
    <>
      {/* Error Notice */}
      <div style={{
        background: 'rgba(237, 137, 54, 0.1)',
        border: '1px solid #ED8936',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#ED8936' }}>
            3D Map Temporarily Unavailable
          </h3>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
            {error?.message || 'An error occurred while loading the 3D visualization.'}
          </p>
          <small style={{ opacity: 0.8 }}>
            Showing enhanced table view instead.
          </small>
        </div>
        <button
          onClick={onRetry}
          style={{
            background: '#ED8936',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => e.target.style.background = '#DD7324'}
          onMouseLeave={(e) => e.target.style.background = '#ED8936'}
        >
          Retry 3D
        </button>
      </div>

      {/* Enhanced Table Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {processedTableData.map(table => (
          <TableCard
            key={table.id}
            table={table}
            onTableClick={onTableClick}
            enhanced={true}
          />
        ))}
      </div>

      {/* Status Legend */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '30px auto 0'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#D69E2E' }}>Table Status Legend</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px'
        }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: color
              }} />
              <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Simple List Fallback for Low Memory Situations
 */
function SimpleListFallback({ error, tableData, onTableClick, onRetry }) {
  const processedTableData = tableData.length > 0 ? tableData : generateDefaultTableData();

  return (
    <>
      {/* Simple Error Notice */}
      <div style={{
        background: 'rgba(237, 137, 54, 0.1)',
        border: '1px solid #ED8936',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        <strong>3D Map Error:</strong> {error?.message || 'Performance issue detected.'}
        <button
          onClick={onRetry}
          style={{
            marginLeft: '12px',
            background: 'none',
            border: '1px solid #ED8936',
            color: '#ED8936',
            padding: '4px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry
        </button>
      </div>

      {/* Simple Table List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {processedTableData.map(table => (
          <TableCard
            key={table.id}
            table={table}
            onTableClick={onTableClick}
            enhanced={false}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Minimal Fallback for Severe Errors
 */
function MinimalFallback({ error, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        opacity: 0.5
      }}>
        ⚠️
      </div>
      <h2 style={{ color: '#ED8936', marginBottom: '10px' }}>
        3D Map Unavailable
      </h2>
      <p style={{ marginBottom: '20px', opacity: 0.8 }}>
        {error?.message || 'A critical error occurred with the 3D visualization.'}
      </p>
      <button
        onClick={onRetry}
        style={{
          background: '#ED8936',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Try Again
      </button>
      <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.6 }}>
        Please refresh the page or try using a different browser.
      </p>
    </div>
  );
}

/**
 * Reusable Table Card Component
 */
function TableCard({ table, onTableClick, enhanced }) {
  const cardStyle = {
    background: enhanced ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: enhanced ? '8px' : '4px',
    padding: enhanced ? '16px' : '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#E2E8F0'
  };

  const handleClick = () => {
    if (onTableClick) {
      onTableClick(table.id, table);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.target.style.background = enhanced ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)';
        e.target.style.transform = enhanced ? 'translateY(-2px)' : 'none';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = enhanced ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: enhanced ? '12px' : '6px'
      }}>
        <h4 style={{ margin: 0, color: '#D69E2E', fontSize: enhanced ? '16px' : '14px' }}>
          Table {table.number}
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {enhanced && table.capacity && (
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
              {table.capacity} seats
            </span>
          )}
          <div style={{
            width: enhanced ? '14px' : '12px',
            height: enhanced ? '14px' : '12px',
            borderRadius: '50%',
            backgroundColor: table.statusColor || STATUS_COLORS[table.status] || STATUS_COLORS[TableStatus.FREE]
          }} />
        </div>
      </div>
      
      <div style={{ fontSize: enhanced ? '14px' : '13px', opacity: 0.8 }}>
        <div>Status: {formatStatusText(table.status)}</div>
        {table.orderInfo && (
          <div style={{ marginTop: '4px' }}>
            Order: #{table.orderInfo.orderNo}
            {enhanced && table.orderInfo.elapsedTime && (
              <span style={{ marginLeft: '8px', opacity: 0.6 }}>
                ({getElapsedTimeText(table.orderInfo.elapsedTime)})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate default table data when none provided
 */
function generateDefaultTableData() {
  return CAFE_LAYOUT.tables.map(table => ({
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    status: TableStatus.FREE,
    statusColor: STATUS_COLORS[TableStatus.FREE],
    position: table.position
  }));
}

/**
 * Format status text for display
 */
function formatStatusText(status) {
  if (!status) return 'Free';
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Get elapsed time text
 */
function getElapsedTimeText(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const elapsed = Math.floor((now - timestamp) / 1000);
  
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
}

/**
 * Memory Error Handler
 */
export class MemoryErrorHandler {
  static handleOutOfMemory(error, fallbackCallback) {
    console.error('Memory error detected:', error);
    
    // Clear any cached geometries and textures
    if (window.THREE) {
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }
    
    // Switch to memory-efficient mode
    if (fallbackCallback) {
      fallbackCallback('simple-list');
    }
    
    // Report memory usage
    if (performance.memory) {
      console.warn('Memory usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
      });
    }
  }
}

/**
 * WebGL Context Lost Handler
 */
export class WebGLContextHandler {
  static setupContextLossHandling(canvas, renderer, onContextLost) {
    if (!canvas || !renderer) return;
    
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost');
      
      if (onContextLost) {
        onContextLost();
      }
    };
    
    const handleContextRestored = () => {
      console.log('WebGL context restored');
      // Renderer will need to be recreated
    };
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }
}

export default Scene3DErrorBoundary;
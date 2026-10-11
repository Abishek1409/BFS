/**
 * MapWithControls Component
 * Complete 3D map with interactive controls, live counters, events feed, and order panel
 */

import React, { useState, useCallback } from 'react';
import { MapCanvas } from './MapCanvas.js';
import { MapControls } from './MapControls.js';
import { LiveCounters } from './LiveCounters.js';
import { EventsFeed } from './EventsFeed.js';
import { OrderPanel } from './OrderPanel.js';
import { MAP_MODES } from '../lib/config.js';
import { useTableStatus } from '../hooks/useTableStatus.js';
import { useTableInteraction } from '../hooks/useTableInteraction.js';

// Complete Map Component with Controls and Firebase Integration
export function MapWithControls({
  initialMode = MAP_MODES.DIMMED,
  onTableClick,
  onModeChange,
  showControls = true,
  showCounters = true,
  showEvents = true,
  showHelp = true,
  showOrderPanel = true,
  className = '',
  style = {},
  children
}) {
  const [currentMode, setCurrentMode] = useState(initialMode);
  
  // Get table data from Firebase integration
  const {
    tableStatuses,
    firebaseConnected
  } = useTableStatus();

  // Get table interaction functionality
  const {
    selectedTable,
    selectedTables,
    selectedTableData,
    selectedOrderInfo,
    orderPanelVisible,
    handleTableClick: interactionHandleTableClick,
    handleOrderStatusChange,
    handleLoadToBill,
    closeOrderPanel
  } = useTableInteraction();

  // Convert table statuses to format expected by MapCanvas
  const tableData = Array.from(tableStatuses.entries()).map(([tableId, statusData]) => ({
    id: tableId,
    status: statusData.status,
    orderInfo: statusData.orderInfo,
    tableNumber: statusData.tableNumber
  }));

  const handleModeChange = useCallback((newMode) => {
    setCurrentMode(newMode);
    
    // Close order panel when switching to dimmed mode for better UX
    if (newMode === MAP_MODES.DIMMED && orderPanelVisible) {
      closeOrderPanel();
    }
    
    // Notify parent component of mode change
    if (onModeChange) {
      onModeChange(newMode);
    }
    
    // Add some visual feedback for mode transitions
    if (typeof window !== 'undefined') {
      // Brief visual indication of mode change
      const body = document.body;
      body.style.transition = 'filter 0.2s ease';
      body.style.filter = 'brightness(1.1)';
      
      setTimeout(() => {
        body.style.filter = 'brightness(1)';
        setTimeout(() => {
          body.style.transition = '';
        }, 200);
      }, 100);
    }
  }, [onModeChange, orderPanelVisible, closeOrderPanel]);

  const handleTableClickIntegrated = useCallback((tableId, tableData) => {
    // Use the interaction handler for panel management
    interactionHandleTableClick(tableId, tableData);
    
    // Also call parent handler if provided
    if (onTableClick) {
      onTableClick(tableId, tableData);
    }
  }, [onTableClick, interactionHandleTableClick]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...style
  };

  return (
    <div className={`map-with-controls ${className}`} style={containerStyle}>
      {/* 3D Map Canvas with Firebase data and table selection */}
      <MapCanvas
        mode={currentMode}
        tableData={tableData}
        selectedTables={selectedTables}
        onTableClick={handleTableClickIntegrated}
        onModeChange={handleModeChange}
      />
      
      {/* Interactive Controls */}
      {showControls && (
        <MapControls
          mode={currentMode}
          onModeChange={handleModeChange}
          showHelp={showHelp}
        >
          {children}
        </MapControls>
      )}
      
      {/* Order Management Panel */}
      {showOrderPanel && (
        <OrderPanel
          selectedTable={selectedTable}
          tableData={selectedTableData}
          orderInfo={selectedOrderInfo}
          visible={orderPanelVisible}
          onClose={closeOrderPanel}
          onOrderStatusChange={handleOrderStatusChange}
          onLoadToBill={handleLoadToBill}
          position="right"
        />
      )}
      
      {/* Live Counters */}
      {showCounters && (
        <LiveCounters 
          className="map-live-counters"
          style={{
            opacity: currentMode === MAP_MODES.INTERACTIVE ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      
      {/* Events Feed */}
      {showEvents && (
        <EventsFeed
          className="map-events-feed"
          style={{
            opacity: currentMode === MAP_MODES.INTERACTIVE ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
          }}
          maxEvents={5}
        />
      )}
      
      {/* Firebase Connection Status Indicator */}
      {!firebaseConnected && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(237, 137, 54, 0.9)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 101,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: '"Trebuchet MS", Arial, sans-serif'
          }}
        >
          🟡 Firebase Offline
        </div>
      )}
      
      {/* Children not wrapped by opacity controller */}
      {!showControls && children}
    </div>
  );
}

export default MapWithControls;
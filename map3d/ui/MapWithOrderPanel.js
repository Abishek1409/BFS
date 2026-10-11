/**
 * MapWithOrderPanel Component
 * Integrates the 3D café scene with table interaction and order management
 */

import React, { useState, useEffect } from 'react';
import { MapControls } from './MapControls.js';
import { CafeScene } from '../scene/CafeScene.js';
import { OrderPanel } from './OrderPanel.js';
import { useTableInteraction } from '../hooks/useTableInteraction.js';
import { MAP_MODES } from '../lib/config.js';

export function MapWithOrderPanel({ 
  initialMode = MAP_MODES.DIMMED,
  showControls = true,
  className = '',
  style = {} 
}) {
  const [mode, setMode] = useState(initialMode);
  
  // Use the table interaction hook for state management
  const {
    selectedTable,
    selectedTables,
    selectedTableData,
    selectedOrderInfo,
    orderPanelVisible,
    handleTableClick,
    handleOrderStatusChange,
    handleLoadToBill,
    closeOrderPanel,
    tableStatuses,
    getAllTableData
  } = useTableInteraction();

  // Sync mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    
    // Close order panel when switching to dimmed mode for better UX
    if (newMode === MAP_MODES.DIMMED && orderPanelVisible) {
      closeOrderPanel();
    }
  };

  // Keep table selection state persistent across mode changes
  // Selection should persist when switching between modes
  const persistentSelectedTables = selectedTables;

  return (
    <div className={`map-with-order-panel ${className}`} style={style}>
      {/* Map Controls */}
      {showControls && (
        <MapControls
          mode={mode}
          onModeChange={handleModeChange}
        />
      )}
      
      {/* 3D Café Scene */}
      <CafeScene
        mode={mode}
        onTableClick={handleTableClick}
        tableStatuses={tableStatuses}
        selectedTables={persistentSelectedTables}
        showStatusMarkers={true}
      />
      
      {/* Order Management Panel */}
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
    </div>
  );
}

export default MapWithOrderPanel;
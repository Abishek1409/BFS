/**
 * Table Interaction Hook
 * Manages table selection, click events, and order panel integration
 */

import { useState, useCallback, useEffect } from 'react';
import { useTableStatus } from './useTableStatus.js';
import { useFirebaseSync } from './useFirebaseSync.js';

export function useTableInteraction() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderPanelVisible, setOrderPanelVisible] = useState(false);
  const [selectedTableData, setSelectedTableData] = useState(null);
  
  // Get table status and Firebase data
  const {
    tableStatuses,
    selectedTables,
    selectTable,
    deselectTable,
    toggleTableSelection,
    clearSelection,
    getTableOrderInfo
  } = useTableStatus();
  
  const { updateOrderStatus } = useFirebaseSync();

  // Handle table click events from 3D scene
  const handleTableClick = useCallback((tableId, tableData) => {
    // Toggle selection in the 3D scene
    toggleTableSelection(tableId);
    
    // Set as primary selected table for order panel
    if (selectedTable === tableId) {
      // Clicking the same table closes the panel
      setSelectedTable(null);
      setOrderPanelVisible(false);
      setSelectedTableData(null);
    } else {
      // Select new table and show panel
      setSelectedTable(tableId);
      setSelectedTableData(tableData);
      setOrderPanelVisible(true);
    }
  }, [selectedTable, toggleTableSelection]);

  // Handle order status updates from panel
  const handleOrderStatusChange = useCallback(async (orderId, newStatus) => {
    if (!updateOrderStatus) {
      throw new Error('Firebase not available');
    }
    
    try {
      await updateOrderStatus(orderId, newStatus);
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, [updateOrderStatus]);

  // Handle load to bill functionality - integrate with existing system
  const handleLoadToBill = useCallback((serverId) => {
    // Check if the loadQrOrder function exists in the global scope
    if (typeof window !== 'undefined' && window.loadQrOrder && typeof window.loadQrOrder === 'function') {
      try {
        window.loadQrOrder(serverId);
        return true;
      } catch (error) {
        console.error('Failed to load order to bill:', error);
        throw error;
      }
    } else {
      console.warn('loadQrOrder function not available');
      throw new Error('Bill loading not available');
    }
  }, []);

  // Close order panel
  const closeOrderPanel = useCallback(() => {
    setOrderPanelVisible(false);
    setSelectedTable(null);
    setSelectedTableData(null);
  }, []);

  // Get order info for selected table
  const selectedOrderInfo = selectedTable ? getTableOrderInfo(selectedTable) : null;

  // Clear selection when table status changes (order completed, etc.)
  useEffect(() => {
    if (selectedTable && selectedOrderInfo === null) {
      // Order was completed or removed, close panel
      const timer = setTimeout(() => {
        closeOrderPanel();
      }, 2000); // Give 2 seconds to see the status change
      
      return () => clearTimeout(timer);
    }
  }, [selectedTable, selectedOrderInfo, closeOrderPanel]);

  // Keyboard shortcuts for panel control
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC key to close panel
      if (event.key === 'Escape' && orderPanelVisible) {
        closeOrderPanel();
      }
      
      // Number keys to quickly select tables (1-8)
      const numberKey = parseInt(event.key);
      if (numberKey >= 1 && numberKey <= 8 && !event.ctrlKey && !event.altKey) {
        const tableId = `table-${numberKey}`;
        const tableExists = tableStatuses.has(tableId);
        
        if (tableExists) {
          // Get table data from status
          const statusData = tableStatuses.get(tableId);
          const tableData = {
            tableNumber: numberKey.toString(),
            status: statusData?.status,
            orderInfo: statusData?.orderInfo,
            position: [0, 0, 0], // Will be updated by 3D scene
            capacity: 4 // Default capacity
          };
          
          handleTableClick(tableId, tableData);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [orderPanelVisible, tableStatuses, handleTableClick, closeOrderPanel]);

  // Synchronize with existing order queue selection
  // This allows the 3D map to respond to clicks in the traditional order list
  useEffect(() => {
    // Listen for external table selection events if they exist
    const handleExternalTableSelect = (event) => {
      const { tableId, tableData } = event.detail || {};
      if (tableId) {
        handleTableClick(tableId, tableData);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('selectTable3D', handleExternalTableSelect);
      return () => window.removeEventListener('selectTable3D', handleExternalTableSelect);
    }
  }, [handleTableClick]);

  // Helper function to get table data for display
  const getTableDisplayData = useCallback((tableId) => {
    const statusData = tableStatuses.get(tableId);
    const isSelected = selectedTables.has(tableId);
    
    return {
      id: tableId,
      status: statusData?.status || 'free',
      orderInfo: statusData?.orderInfo || null,
      isSelected: isSelected,
      tableNumber: statusData?.tableNumber || tableId.replace('table-', '')
    };
  }, [tableStatuses, selectedTables]);

  // Get all table data for the 3D scene
  const getAllTableData = useCallback(() => {
    const tableData = [];
    
    // Get data for all tables from CAFE_LAYOUT
    for (let i = 1; i <= 8; i++) {
      const tableId = `table-${i}`;
      tableData.push(getTableDisplayData(tableId));
    }
    
    return tableData;
  }, [getTableDisplayData]);

  return {
    // Selection state
    selectedTable,
    selectedTables,
    selectedTableData,
    selectedOrderInfo,
    
    // Panel state
    orderPanelVisible,
    
    // Event handlers
    handleTableClick,
    handleOrderStatusChange,
    handleLoadToBill,
    closeOrderPanel,
    
    // Table data
    tableStatuses,
    getAllTableData,
    getTableDisplayData,
    
    // Selection methods
    selectTable,
    deselectTable,
    clearSelection
  };
}

export default useTableInteraction;
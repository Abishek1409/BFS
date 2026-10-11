/**
 * Table Status Management Hook
 * Manages table status state, transitions, and selection with Firebase integration
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TableStatus, ANIMATION_CONFIG, CAFE_LAYOUT } from '../lib/config.js';
import { mapFirebaseStatus, throttle } from '../lib/utils.js';
import { useFirebaseSync } from './useFirebaseSync.js';

export function useTableStatus(initialStatuses = new Map()) {
  const [tableStatuses, setTableStatuses] = useState(initialStatuses);
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [statusTransitions, setStatusTransitions] = useState(new Map());
  const previousStatusesRef = useRef(new Map());
  
  // Get Firebase data
  const { data: firebaseData, connected, getOrdersByTable } = useFirebaseSync();
  
  // Update table statuses from Firebase orders with real-time sync
  useEffect(() => {
    if (!firebaseData?.orders || !connected) return;
    
    const newStatuses = new Map();
    
    // Initialize all tables as free
    CAFE_LAYOUT.tables.forEach(table => {
      newStatuses.set(table.id, {
        status: TableStatus.FREE,
        orderInfo: null,
        tableNumber: table.number
      });
    });
    
    // Process Firebase orders and update table statuses
    firebaseData.orders.forEach(order => {
      const tableNumber = order.tableNumber;
      if (!tableNumber) return;
      
      const tableId = `table-${tableNumber}`;
      
      // Only process if this table exists in our layout
      const tableExists = CAFE_LAYOUT.tables.some(t => t.id === tableId);
      if (!tableExists) return;
      
      const mappedStatus = mapFirebaseStatus(order.status);
      
      // Skip served/paid orders unless they're recent (within 5 minutes)
      if ((order.status === 'served' || order.status === 'paid')) {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (!order.createdAt || order.createdAt < fiveMinutesAgo) {
          return; // Keep table as FREE
        }
      }
      
      newStatuses.set(tableId, {
        status: mappedStatus,
        orderInfo: {
          orderNo: order.orderNo || order.id?.slice(-4),
          tableNumber: tableNumber,
          items: order.displayItems || order.items || [],
          total: order.total || order.amount || 0,
          status: order.status,
          createdAt: order.createdAt || Date.now(),
          elapsedTime: order.elapsedTime || 0,
          serverId: order.serverId || order.id
        },
        tableNumber: tableNumber
      });
    });
    
    // Update statuses and track transitions
    setTableStatuses(prevStatuses => {
      const updatedStatuses = new Map();
      
      newStatuses.forEach((statusData, tableId) => {
        const currentStatus = prevStatuses.get(tableId)?.status;
        const newStatus = statusData.status;
        
        // Track status changes for animations
        if (currentStatus && currentStatus !== newStatus) {
          setStatusTransitions(prev => new Map(prev.set(tableId, {
            from: currentStatus,
            to: newStatus,
            startTime: performance.now(),
            duration: ANIMATION_CONFIG.statusTransition.duration * 1000
          })));
        }
        
        updatedStatuses.set(tableId, statusData);
      });
      
      // Clean up old transitions (after animation completes)
      setStatusTransitions(prevTransitions => {
        const now = performance.now();
        const cleanedTransitions = new Map();
        
        prevTransitions.forEach((transition, tableId) => {
          const elapsed = now - transition.startTime;
          if (elapsed < transition.duration) {
            cleanedTransitions.set(tableId, transition);
          }
        });
        
        return cleanedTransitions;
      });
      
      return updatedStatuses;
    });
    
    previousStatusesRef.current = new Map(newStatuses);
  }, [firebaseData, connected]);
  
  // Throttled status update function for performance
  const updateTableStatus = useCallback(
    throttle((tableId, newStatus, orderInfo = null) => {
      setTableStatuses(prev => {
        const current = prev.get(tableId);
        const updatedStatus = {
          status: newStatus,
          orderInfo: orderInfo || current?.orderInfo || null,
          tableNumber: current?.tableNumber || tableId.split('-')[1]
        };
        
        // Track transition if status changed
        if (current?.status !== newStatus) {
          setStatusTransitions(transitions => new Map(transitions.set(tableId, {
            from: current?.status || TableStatus.FREE,
            to: newStatus,
            startTime: performance.now(),
            duration: ANIMATION_CONFIG.statusTransition.duration * 1000
          })));
        }
        
        return new Map(prev).set(tableId, updatedStatus);
      });
    }, 16), // 60fps throttle
    []
  );

  const getTableStatus = useCallback((tableId) => {
    const tableData = tableStatuses.get(tableId);
    return tableData?.status || TableStatus.FREE;
  }, [tableStatuses]);
  
  const getTableOrderInfo = useCallback((tableId) => {
    const tableData = tableStatuses.get(tableId);
    return tableData?.orderInfo || null;
  }, [tableStatuses]);
  
  const getStatusTransition = useCallback((tableId) => {
    return statusTransitions.get(tableId) || null;
  }, [statusTransitions]);
  
  // Table selection management
  const selectTable = useCallback((tableId) => {
    setSelectedTables(prev => new Set(prev).add(tableId));
  }, []);
  
  const deselectTable = useCallback((tableId) => {
    setSelectedTables(prev => {
      const updated = new Set(prev);
      updated.delete(tableId);
      return updated;
    });
  }, []);
  
  const toggleTableSelection = useCallback((tableId) => {
    setSelectedTables(prev => {
      const updated = new Set(prev);
      if (updated.has(tableId)) {
        updated.delete(tableId);
      } else {
        updated.add(tableId);
      }
      return updated;
    });
  }, []);
  
  const isTableSelected = useCallback((tableId) => {
    return selectedTables.has(tableId);
  }, [selectedTables]);
  
  const clearSelection = useCallback(() => {
    setSelectedTables(new Set());
  }, []);
  
  const resetAllTables = useCallback(() => {
    setTableStatuses(new Map());
    setSelectedTables(new Set());
    setStatusTransitions(new Map());
  }, []);
  
  // Get tables by status for filtering/monitoring
  const getTablesByStatus = useCallback((status) => {
    const result = [];
    tableStatuses.forEach((tableData, tableId) => {
      if (tableData.status === status) {
        result.push({
          id: tableId,
          ...tableData
        });
      }
    });
    return result;
  }, [tableStatuses]);
  
  // Get status summary for counters/analytics
  const getStatusSummary = useCallback(() => {
    const summary = {
      [TableStatus.FREE]: 0,
      [TableStatus.OCCUPIED]: 0,
      [TableStatus.ORDER_PLACED]: 0,
      [TableStatus.PREPARING]: 0,
      [TableStatus.READY_TO_SERVE]: 0,
      [TableStatus.NEEDS_BILL]: 0
    };
    
    tableStatuses.forEach((tableData) => {
      summary[tableData.status] = (summary[tableData.status] || 0) + 1;
    });
    
    return summary;
  }, [tableStatuses]);

  // Get orders for specific table using Firebase data
  const getTableOrders = useCallback((tableNumber) => {
    if (!getOrdersByTable) return [];
    return getOrdersByTable(tableNumber);
  }, [getOrdersByTable]);

  // Calculate table efficiency metrics
  const getTableMetrics = useCallback(() => {
    const metrics = {
      utilization: 0,
      averageOrderTime: 0,
      totalTables: CAFE_LAYOUT.tables.length,
      occupiedTables: 0,
      pendingOrders: 0
    };

    let totalOrderTime = 0;
    let ordersWithTime = 0;

    tableStatuses.forEach((tableData) => {
      if (tableData.status !== TableStatus.FREE) {
        metrics.occupiedTables++;
      }
      
      if (tableData.status === TableStatus.ORDER_PLACED || 
          tableData.status === TableStatus.PREPARING) {
        metrics.pendingOrders++;
      }

      if (tableData.orderInfo?.elapsedTime) {
        totalOrderTime += tableData.orderInfo.elapsedTime;
        ordersWithTime++;
      }
    });

    metrics.utilization = Math.round((metrics.occupiedTables / metrics.totalTables) * 100);
    metrics.averageOrderTime = ordersWithTime > 0 ? 
      Math.round(totalOrderTime / ordersWithTime / 60000) : 0; // Convert to minutes

    return metrics;
  }, [tableStatuses]);

  return {
    // Status management
    tableStatuses,
    updateTableStatus,
    getTableStatus,
    getTableOrderInfo,
    getStatusTransition,
    resetAllTables,
    
    // Selection management
    selectedTables,
    selectTable,
    deselectTable,
    toggleTableSelection,
    isTableSelected,
    clearSelection,
    
    // Analytics/filtering
    getTablesByStatus,
    getStatusSummary,
    getTableOrders,
    getTableMetrics,
    
    // Transition data for animations
    statusTransitions,
    
    // Firebase connection status
    firebaseConnected: connected,
    
    // Data freshness
    hasFirebaseData: !!firebaseData?.orders?.length
  };
}

export default useTableStatus;
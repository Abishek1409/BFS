/**
 * Firebase Synchronization Hook
 * Handles real-time data updates for the 3D café map
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { throttle, debounce } from '../lib/utils.js';

export function useFirebaseSync() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Cache references to avoid memory leaks
  const ordersRef = useRef(null);
  const connectionRef = useRef(null);
  const cleanupFunctions = useRef([]);
  const lastUpdateTime = useRef(Date.now());

  // Initialize Firebase connection
  useEffect(() => {
    // Check if Firebase is available (initialized in index.html)
    if (typeof window === 'undefined' || !window.firebaseConfig || !window.firebase) {
      setError(new Error('Firebase not available'));
      setLoading(false);
      return;
    }

    try {
      // Use existing Firebase app instance from index.html
      const database = window.firebase.database();
      ordersRef.current = database.ref('orders');
      connectionRef.current = database.ref('.info/connected');
      
      setupFirebaseListeners();
      
    } catch (err) {
      console.error('Firebase initialization error:', err);
      setError(err);
      setLoading(false);
    }

    return () => {
      cleanupListeners();
    };
  }, []);

  const setupFirebaseListeners = useCallback(() => {
    if (!ordersRef.current || !connectionRef.current) return;

    // Connection status listener
    const onConnectionChange = (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);
      
      if (!isConnected) {
        setError(new Error('Firebase connection lost'));
      } else {
        setError(null);
      }
    };

    // Throttled data update to prevent excessive re-renders
    const throttledUpdate = throttle((orders) => {
      const now = Date.now();
      
      // Add computed fields for 3D map display
      const processedOrders = orders.map(order => ({
        ...order,
        elapsedTime: order.createdAt ? now - order.createdAt : 0,
        tableNumber: extractTableNumber(order),
        displayItems: formatItemsForDisplay(order.items || [])
      }));

      setData({
        orders: processedOrders,
        lastUpdate: now,
        totalOrders: processedOrders.length,
        activeOrders: processedOrders.filter(o => o.status !== 'served' && o.status !== 'paid').length
      });
      
      lastUpdateTime.current = now;
      setLoading(false);
    }, 1000); // Update at most once per second

    // Orders collection listener
    const onOrdersChange = (snapshot) => {
      try {
        const ordersData = snapshot.val() || {};
        const orders = Object.keys(ordersData).map(key => ({
          id: key,
          serverId: key,
          ...ordersData[key]
        }));
        
        throttledUpdate(orders);
      } catch (err) {
        console.error('Error processing orders data:', err);
        setError(err);
      }
    };

    // Error handler
    const onError = (error) => {
      console.error('Firebase listener error:', error);
      setError(error);
    };

    // Set up listeners
    connectionRef.current.on('value', onConnectionChange, onError);
    ordersRef.current.on('value', onOrdersChange, onError);

    // Store cleanup functions
    cleanupFunctions.current = [
      () => connectionRef.current?.off('value', onConnectionChange),
      () => ordersRef.current?.off('value', onOrdersChange)
    ];
  }, []);

  const cleanupListeners = useCallback(() => {
    cleanupFunctions.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    });
    cleanupFunctions.current = [];
  }, []);

  // Helper function to extract table number from order
  const extractTableNumber = (order) => {
    if (order.table) return order.table;
    if (order.tableNumber) return order.tableNumber;
    
    // Try to extract from customer name (e.g., "Table 5")
    const customerName = order.customer || order.customerName || '';
    const tableMatch = customerName.match(/table\s*(\d+)/i);
    if (tableMatch) return tableMatch[1];
    
    return null;
  };

  // Helper function to format items for display
  const formatItemsForDisplay = (items) => {
    return items.map(item => ({
      name: item.name || item.baseName || 'Unknown Item',
      quantity: item.qty || item.quantity || 1,
      price: item.price || 0,
      total: item.total || (item.price * (item.qty || 1)),
      specifications: formatItemSpecs(item)
    }));
  };

  // Helper function to format item specifications
  const formatItemSpecs = (item) => {
    const specs = [];
    
    if (item.size && item.size !== 'Regular') specs.push(item.size);
    if (item.ice) specs.push(item.ice);
    if (item.sugar && item.sugar !== 'Normal Sugar') specs.push(item.sugar);
    if (item.note) specs.push(item.note);
    
    return specs.join(', ') || 'Standard';
  };

  // Method to update order status (for integration with existing UI)
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!ordersRef.current) {
      throw new Error('Firebase not connected');
    }

    try {
      await ordersRef.current.child(orderId).child('status').set(newStatus);
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, []);

  // Method to get orders by table
  const getOrdersByTable = useCallback((tableNumber) => {
    if (!data?.orders) return [];
    
    return data.orders.filter(order => 
      order.tableNumber === tableNumber || order.tableNumber === String(tableNumber)
    );
  }, [data]);

  // Method to get order statistics
  const getOrderStats = useCallback(() => {
    if (!data?.orders) {
      return {
        total: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        served: 0,
        avgPrepTime: 0,
        totalSales: 0
      };
    }

    const orders = data.orders;
    const now = Date.now();
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      served: orders.filter(o => o.status === 'served' || o.status === 'paid').length,
      totalSales: orders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0)
    };

    // Calculate average preparation time for completed orders
    const completedOrders = orders.filter(o => 
      (o.status === 'served' || o.status === 'ready') && o.createdAt
    );
    
    if (completedOrders.length > 0) {
      const totalPrepTime = completedOrders.reduce((sum, order) => {
        const prepTime = order.elapsedTime || (now - order.createdAt);
        return sum + Math.min(prepTime, 3600000); // Cap at 1 hour
      }, 0);
      
      stats.avgPrepTime = Math.round(totalPrepTime / completedOrders.length / 60000); // Convert to minutes
    } else {
      stats.avgPrepTime = 0;
    }

    return stats;
  }, [data]);

  // Method to get recent activity events
  const getRecentEvents = useCallback((limit = 5) => {
    if (!data?.orders) return [];
    
    return data.orders
      .filter(order => order.createdAt || order.updatedAt)
      .sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .map(order => ({
        id: order.id,
        type: getEventType(order.status),
        message: formatEventMessage(order),
        timestamp: order.updatedAt || order.createdAt,
        tableNumber: order.tableNumber
      }));
  }, [data]);

  const getEventType = (status) => {
    switch (status) {
      case 'pending': return 'order_placed';
      case 'preparing': return 'preparation_started';
      case 'ready': return 'ready_to_serve';
      case 'served': return 'order_served';
      case 'paid': return 'payment_completed';
      default: return 'status_updated';
    }
  };

  const formatEventMessage = (order) => {
    const table = order.tableNumber ? ` (Table ${order.tableNumber})` : '';
    const orderNo = order.orderNo || `#${order.id?.slice(-4)}`;
    
    switch (order.status) {
      case 'pending': return `New order ${orderNo}${table}`;
      case 'preparing': return `Preparing ${orderNo}${table}`;
      case 'ready': return `${orderNo} ready to serve${table}`;
      case 'served': return `${orderNo} served${table}`;
      case 'paid': return `${orderNo} completed${table}`;
      default: return `${orderNo} updated${table}`;
    }
  };

  return {
    data,
    loading,
    error,
    connected,
    lastUpdate: lastUpdateTime.current,
    // Methods for integration
    updateOrderStatus,
    getOrdersByTable,
    getOrderStats,
    getRecentEvents,
    // Manual refresh method
    refresh: () => {
      if (ordersRef.current) {
        ordersRef.current.once('value').then(() => {
          console.log('Manual refresh completed');
        }).catch(setError);
      }
    }
  };
}

export default useFirebaseSync;
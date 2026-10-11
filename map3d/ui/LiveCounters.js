/**
 * Live Counters Component
 * Displays real-time metrics from Firebase data
 */

import React, { useState, useEffect } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync.js';

export function LiveCounters({ 
  className = '',
  style = {},
  showEvents = true
}) {
  const { data, loading, error, connected, getOrderStats, getRecentEvents } = useFirebaseSync();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    avgPrepTime: 0,
    totalSales: 0
  });
  const [events, setEvents] = useState([]);

  // Update stats when data changes
  useEffect(() => {
    if (data && getOrderStats) {
      const newStats = getOrderStats();
      setStats(newStats);
    }
  }, [data, getOrderStats]);

  // Update events when data changes
  useEffect(() => {
    if (data && getRecentEvents && showEvents) {
      const newEvents = getRecentEvents(3); // Show last 3 events
      setEvents(newEvents);
    }
  }, [data, getRecentEvents, showEvents]);

  // Get today's sales (filter by current date)
  const getTodaysSales = () => {
    if (!data?.orders) return 0;
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    return data.orders
      .filter(order => {
        const orderDate = order.createdAt || 0;
        return orderDate >= todayStart && (order.status === 'served' || order.status === 'paid');
      })
      .reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
  };

  const defaultStyle = {
    position: 'fixed',
    top: '100px',
    right: '20px',
    background: 'rgba(7, 7, 6, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#fff8e8',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 215, 122, 0.3)',
    minWidth: '220px',
    maxWidth: '300px',
    zIndex: 100,
    fontSize: '14px',
    fontFamily: '"Trebuchet MS", Arial, sans-serif',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    ...style
  };

  const headerStyle = {
    margin: '0 0 12px 0', 
    color: '#d9a83e',
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const connectionStyle = {
    fontSize: '11px',
    color: connected ? '#48bb78' : '#ed8936',
    marginBottom: '12px',
    fontWeight: '600'
  };

  const statRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    lineHeight: '1.4'
  };

  const labelStyle = {
    color: '#c8b98f',
    fontSize: '13px'
  };

  const valueStyle = {
    color: '#fff8e8',
    fontWeight: '700',
    fontSize: '14px'
  };

  const separatorStyle = {
    height: '1px',
    background: 'rgba(255, 215, 122, 0.2)',
    margin: '10px 0',
    border: 'none'
  };

  const eventsStyle = {
    marginTop: '12px'
  };

  const eventStyle = {
    fontSize: '11px',
    color: '#c8b98f',
    marginBottom: '4px',
    lineHeight: '1.3'
  };

  const loadingStyle = {
    ...defaultStyle,
    textAlign: 'center',
    color: '#c8b98f'
  };

  const errorStyle = {
    ...defaultStyle,
    borderColor: '#ed8936',
    color: '#fed7d7'
  };

  if (loading) {
    return (
      <div style={loadingStyle} className={className}>
        <div>Loading live data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle} className={className}>
        <div style={headerStyle}>⚠️ Connection Error</div>
        <div style={{ fontSize: '12px' }}>
          {error.message || 'Unable to connect to Firebase'}
        </div>
      </div>
    );
  }

  const todaysSales = getTodaysSales();
  const openOrders = (stats.pending || 0) + (stats.preparing || 0) + (stats.ready || 0);

  return (
    <div style={defaultStyle} className={className}>
      <div style={headerStyle}>
        📊 Live Stats
      </div>
      
      <div style={connectionStyle}>
        {connected ? '🟢 Live Data' : '🟡 Offline Mode'}
      </div>

      <div style={statRowStyle}>
        <span style={labelStyle}>Open Orders:</span>
        <span style={{ ...valueStyle, color: openOrders > 0 ? '#ed8936' : '#48bb78' }}>
          {openOrders}
        </span>
      </div>

      <div style={statRowStyle}>
        <span style={labelStyle}>Avg Prep Time:</span>
        <span style={valueStyle}>{stats.avgPrepTime}min</span>
      </div>

      <div style={statRowStyle}>
        <span style={labelStyle}>Today's Sales:</span>
        <span style={{ ...valueStyle, color: '#d9a83e' }}>₹{todaysSales}</span>
      </div>

      <hr style={separatorStyle} />

      <div style={statRowStyle}>
        <span style={labelStyle}>Pending:</span>
        <span style={{ ...valueStyle, color: '#d69e2e' }}>{stats.pending || 0}</span>
      </div>

      <div style={statRowStyle}>
        <span style={labelStyle}>Preparing:</span>
        <span style={{ ...valueStyle, color: '#ed8936' }}>{stats.preparing || 0}</span>
      </div>

      <div style={statRowStyle}>
        <span style={labelStyle}>Ready:</span>
        <span style={{ ...valueStyle, color: '#48bb78' }}>{stats.ready || 0}</span>
      </div>

      {showEvents && events.length > 0 && (
        <>
          <hr style={separatorStyle} />
          <div style={eventsStyle}>
            <div style={{ ...labelStyle, marginBottom: '6px', fontWeight: '600' }}>
              Recent Activity:
            </div>
            {events.map((event, index) => (
              <div key={event.id || index} style={eventStyle}>
                {event.message}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LiveCounters;
/**
 * Events Feed Component
 * Displays latest order activity in real-time
 */

import React, { useState, useEffect } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync.js';

export function EventsFeed({ 
  className = '',
  style = {},
  maxEvents = 5,
  showTimestamp = true
}) {
  const { data, loading, error, connected, getRecentEvents } = useFirebaseSync();
  const [events, setEvents] = useState([]);

  // Update events when data changes
  useEffect(() => {
    if (data && getRecentEvents) {
      const newEvents = getRecentEvents(maxEvents);
      setEvents(newEvents);
    }
  }, [data, getRecentEvents, maxEvents]);

  const defaultStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: 'rgba(7, 7, 6, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#fff8e8',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 215, 122, 0.3)',
    minWidth: '280px',
    maxWidth: '350px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 99,
    fontSize: '13px',
    fontFamily: '"Trebuchet MS", Arial, sans-serif',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    ...style
  };

  const headerStyle = {
    margin: '0 0 12px 0',
    color: '#d9a83e',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid rgba(255, 215, 122, 0.2)',
    paddingBottom: '8px'
  };

  const connectionStyle = {
    fontSize: '11px',
    color: connected ? '#48bb78' : '#ed8936',
    marginBottom: '10px',
    fontWeight: '600'
  };

  const eventItemStyle = {
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 215, 122, 0.1)',
    animation: 'fadeIn 0.3s ease-in'
  };

  const eventMessageStyle = {
    color: '#fff8e8',
    lineHeight: '1.4',
    marginBottom: '2px'
  };

  const timestampStyle = {
    fontSize: '11px',
    color: '#c8b98f',
    fontStyle: 'italic'
  };

  const emptyStyle = {
    textAlign: 'center',
    color: '#c8b98f',
    padding: '20px 0',
    fontStyle: 'italic'
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'order_placed': return '📋';
      case 'preparation_started': return '👨‍🍳';
      case 'ready_to_serve': return '✅';
      case 'order_served': return '🍽️';
      case 'payment_completed': return '💰';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle} className={className}>
        <div>Loading activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle} className={className}>
        <div style={headerStyle}>⚠️ Activity Feed Error</div>
        <div style={{ fontSize: '12px' }}>
          Unable to load recent activity
        </div>
      </div>
    );
  }

  return (
    <div style={defaultStyle} className={className}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      <div style={headerStyle}>
        🔔 Live Activity
      </div>
      
      <div style={connectionStyle}>
        {connected ? '🟢 Real-time updates' : '🟡 Cached data'}
      </div>

      {events.length === 0 ? (
        <div style={emptyStyle}>
          No recent activity
        </div>
      ) : (
        events.map((event, index) => (
          <div 
            key={event.id || `${event.timestamp}-${index}`} 
            style={{
              ...eventItemStyle,
              borderBottom: index === events.length - 1 ? 'none' : eventItemStyle.borderBottom
            }}
          >
            <div style={eventMessageStyle}>
              {getEventIcon(event.type)} {event.message}
            </div>
            {showTimestamp && (
              <div style={timestampStyle}>
                {formatTimestamp(event.timestamp)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default EventsFeed;
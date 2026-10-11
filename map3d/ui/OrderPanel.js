/**
 * OrderPanel Component
 * Side panel for displaying order details when tables are clicked
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TableStatus } from '../lib/config.js';

// Helper function to format item specifications
function formatItemSpecs(item) {
  const specs = [];
  if (item.size && item.size !== 'Regular') specs.push(item.size);
  if (item.ice) specs.push(item.ice);
  if (item.sugar && item.sugar !== 'Normal Sugar') specs.push(item.sugar);
  if (item.note) specs.push(item.note);
  return specs.join(', ') || 'Standard';
}

// Helper function to format elapsed time
function formatElapsedTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const elapsed = now - timestamp;
  const minutes = Math.floor(elapsed / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ago`;
}

// Individual order item component
function OrderItem({ item, showControls = false, onQuantityChange }) {
  return (
    <div className="order-item">
      <div className="order-item-info">
        <div className="order-item-main">
          <span className="order-item-emoji">{item.emoji || '🍹'}</span>
          <div className="order-item-details">
            <div className="order-item-name">{item.name || item.baseName}</div>
            <div className="order-item-specs">{formatItemSpecs(item)}</div>
          </div>
        </div>
        <div className="order-item-pricing">
          <div className="order-item-quantity">
            {showControls ? (
              <div className="quantity-controls">
                <button 
                  onClick={() => onQuantityChange(item.uid, -1)}
                  disabled={item.qty <= 1}
                >-</button>
                <span>{item.qty}</span>
                <button onClick={() => onQuantityChange(item.uid, 1)}>+</button>
              </div>
            ) : (
              `x${item.qty}`
            )}
          </div>
          <div className="order-item-price">₹{(item.total || item.price * item.qty).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// Order status control buttons
function OrderStatusControls({ orderInfo, onStatusChange, loading = false }) {
  if (!orderInfo || !orderInfo.serverId) return null;
  
  const currentStatus = orderInfo.status || 'pending';
  
  const statusActions = [
    { 
      status: 'preparing', 
      label: 'Start Preparing', 
      color: '#ed8936',
      icon: '👨‍🍳',
      show: currentStatus === 'pending' || currentStatus === 'order_placed'
    },
    { 
      status: 'ready', 
      label: 'Ready to Serve', 
      color: '#48bb78',
      icon: '✅',
      show: currentStatus === 'preparing'
    },
    { 
      status: 'served', 
      label: 'Mark as Served', 
      color: '#4299e1',
      icon: '🍽️',
      show: currentStatus === 'ready'
    }
  ];
  
  return (
    <div className="order-status-controls">
      <h4>Order Status</h4>
      <div className="current-status">
        <span className="status-indicator" data-status={currentStatus}>
          {currentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="status-actions">
        {statusActions.filter(action => action.show).map(action => (
          <button
            key={action.status}
            className="status-action-btn"
            onClick={() => onStatusChange(orderInfo.serverId, action.status)}
            disabled={loading}
            style={{ backgroundColor: action.color }}
          >
            <span className="action-icon">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Main OrderPanel component
export function OrderPanel({ 
  selectedTable, 
  tableData, 
  orderInfo, 
  visible = false, 
  onClose,
  onOrderStatusChange,
  onLoadToBill,
  position = 'right',
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle order status updates
  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      await onOrderStatusChange(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  }, [onOrderStatusChange]);

  // Handle load to bill functionality
  const handleLoadToBill = useCallback(() => {
    if (orderInfo && onLoadToBill) {
      onLoadToBill(orderInfo.serverId);
      // Close panel after loading
      if (onClose) onClose();
    }
  }, [orderInfo, onLoadToBill, onClose]);

  if (!visible || !selectedTable) return null;

  const panelStyle = {
    position: 'fixed',
    top: 0,
    [position]: visible ? 0 : '-420px',
    width: '400px',
    maxWidth: '90vw',
    height: '100vh',
    background: 'rgba(12, 10, 7, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid rgba(217, 168, 62, 0.3)`,
    boxShadow: position === 'right' ? '-8px 0 32px rgba(0,0,0,0.5)' : '8px 0 32px rgba(0,0,0,0.5)',
    transition: `${position} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
    color: '#fff8e8',
    fontFamily: 'Trebuchet MS, Arial, sans-serif'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="order-panel-backdrop"
        style={{
          display: visible ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1199
        }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`order-panel ${className}`} style={panelStyle}>
        {/* Header */}
        <div className="panel-header" style={{
          background: 'linear-gradient(135deg, rgba(177, 124, 35, 0.92) 0%, rgba(91, 61, 18, 0.78) 100%)',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
            Table {selectedTable.replace('table-', '')}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0 4px',
              borderRadius: '4px',
              lineHeight: 1
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="panel-content" style={{
          flex: 1,
          padding: '20px',
          overflow: 'auto'
        }}>
          {error && (
            <div style={{
              background: 'rgba(220, 38, 127, 0.1)',
              border: '1px solid #dc2677',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#fecaca'
            }}>
              {error}
            </div>
          )}

          {orderInfo ? (
            <>
              {/* Order Overview */}
              <div className="order-overview" style={{ marginBottom: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: 0, color: '#d9a83e' }}>
                    Order #{orderInfo.orderNo}
                  </h4>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#c8b98f',
                    opacity: 0.8
                  }}>
                    {formatElapsedTime(orderInfo.createdAt)}
                  </span>
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '800', 
                    color: '#d9a83e',
                    marginBottom: '4px'
                  }}>
                    Total: ₹{orderInfo.total.toFixed(2)}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#c8b98f' 
                  }}>
                    {orderInfo.items?.length || 0} items
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items" style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', color: '#fff8e8' }}>Order Items</h4>
                <div className="items-list" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {orderInfo.items?.map((item, index) => (
                    <div key={index} style={{
                      padding: '12px 16px',
                      borderBottom: index < orderInfo.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{item.emoji || '🍹'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                          {item.name || item.baseName}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#c8b98f', 
                          opacity: 0.8 
                        }}>
                          {formatItemSpecs(item)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>x{item.qty}</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#d9a83e' 
                        }}>
                          ₹{(item.total || item.price * item.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Controls */}
              <OrderStatusControls
                orderInfo={orderInfo}
                onStatusChange={handleStatusChange}
                loading={loading}
              />

              {/* Action Buttons */}
              <div className="action-buttons" style={{
                marginTop: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {orderInfo.serverId && (
                  <button
                    onClick={handleLoadToBill}
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #d9a83e 0%, #e8bd58 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 18px rgba(217, 168, 62, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <span>🖨️</span>
                    <span>Load & Print Bill</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Empty Table State */
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#c8b98f'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🪑</div>
              <h4 style={{ margin: '0 0 8px 0', color: '#fff8e8' }}>Table Available</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                This table is currently free and ready for customers.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OrderPanel;
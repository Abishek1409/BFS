/**
 * Enhanced List View Fallback for WebGL Unavailable
 * Provides rich table status visualization without 3D
 */

import React from 'react';
import { CAFE_LAYOUT, TableStatus, STATUS_COLORS } from '../lib/config.js';
import { getWebGLFallbackMessage } from '../lib/webgl-detection.js';

/**
 * Enhanced List View Component
 */
export function EnhancedListView({ tableData = [], onTableClick, className = '', style = {} }) {
  const fallbackMessage = getWebGLFallbackMessage();
  const processedTableData = tableData.length > 0 ? tableData : generateDefaultTableData();

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

  return (
    <div className={`enhanced-list-view ${className}`} style={fallbackStyle}>
      {/* Fallback Message */}
      <div style={{
        background: 'rgba(237, 137, 54, 0.1)',
        border: '1px solid #ED8936',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        color: '#E2E8F0'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ED8936' }}>
          {fallbackMessage.title}
        </h3>
        <p style={{ margin: '0 0 10px 0' }}>{fallbackMessage.message}</p>
        <small style={{ opacity: 0.8 }}>{fallbackMessage.suggestion}</small>
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
      <StatusLegend />
      
      {/* Café Layout Overview */}
      <LayoutOverview tableData={processedTableData} />
    </div>
  );
}

/**
 * Table Card Component
 */
function TableCard({ table, onTableClick, enhanced }) {
  const cardStyle = {
    background: enhanced ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: enhanced ? '8px' : '4px',
    padding: enhanced ? '16px' : '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#E2E8F0',
    position: 'relative'
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
        e.target.style.boxShadow = enhanced ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = enhanced ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {/* Priority indicator */}
      {(table.status === TableStatus.READY_TO_SERVE || table.status === TableStatus.NEEDS_BILL) && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: table.status === TableStatus.NEEDS_BILL ? '#FFD700' : '#48bb78',
          animation: 'pulse 2s infinite'
        }} />
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: enhanced ? '12px' : '6px'
      }}>
        <h4 style={{ margin: 0, color: '#D69E2E', fontSize: enhanced ? '18px' : '16px' }}>
          Table {table.number}
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {enhanced && table.capacity && (
            <span style={{ 
              fontSize: '12px', 
              opacity: 0.7,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {table.capacity} seats
            </span>
          )}
          <div style={{
            width: enhanced ? '16px' : '14px',
            height: enhanced ? '16px' : '14px',
            borderRadius: '50%',
            backgroundColor: table.statusColor || STATUS_COLORS[table.status] || STATUS_COLORS[TableStatus.FREE],
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }} />
        </div>
      </div>
      
      <div style={{ fontSize: enhanced ? '14px' : '13px', opacity: 0.9 }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Status:</strong> {formatStatusText(table.status)}
        </div>
        {table.orderInfo && (
          <>
            <div style={{ marginBottom: '4px' }}>
              <strong>Order:</strong> #{table.orderInfo.orderNo}
            </div>
            {enhanced && table.orderInfo.elapsedTime && (
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Time: {getElapsedTimeText(table.orderInfo.elapsedTime)}
              </div>
            )}
            {enhanced && table.orderInfo.items && (
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                Items: {table.orderInfo.items.length}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Status Legend Component
 */
function StatusLegend() {
  return (
    <div style={{
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      maxWidth: '800px',
      margin: '30px auto 0'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#D69E2E', textAlign: 'center' }}>
        Table Status Legend
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px'
      }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: color,
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }} />
            <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
              {formatStatusText(status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Layout Overview Component
 */
function LayoutOverview({ tableData }) {
  const stats = calculateStats(tableData);
  
  return (
    <div style={{
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '30px auto 0'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#D69E2E', textAlign: 'center' }}>
        Café Overview
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '15px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '24px', color: '#D69E2E', fontWeight: 'bold' }}>
            {stats.totalTables}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Total Tables</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', color: '#48bb78', fontWeight: 'bold' }}>
            {stats.freeTables}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Available</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', color: '#ed8936', fontWeight: 'bold' }}>
            {stats.activeTables}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Active Orders</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', color: '#d69e2e', fontWeight: 'bold' }}>
            {stats.totalSeats}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Total Seats</div>
        </div>
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
 * Calculate statistics for overview
 */
function calculateStats(tableData) {
  const stats = {
    totalTables: tableData.length,
    freeTables: 0,
    activeTables: 0,
    totalSeats: 0
  };
  
  tableData.forEach(table => {
    stats.totalSeats += table.capacity || 4;
    
    if (table.status === TableStatus.FREE) {
      stats.freeTables++;
    } else if (table.orderInfo) {
      stats.activeTables++;
    }
  });
  
  return stats;
}

export default EnhancedListView;
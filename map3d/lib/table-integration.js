/**
 * Table Integration Utilities
 * Provides functions to integrate 3D map with existing order management system
 */

// Function to extract table number from various order formats
export function extractTableNumber(order) {
  if (order.table) return order.table;
  if (order.tableNumber) return order.tableNumber;
  
  // Try to extract from customer name (e.g., "Table 5")
  const customerName = order.customer || order.customerName || '';
  const tableMatch = customerName.match(/table\s*(\d+)/i);
  if (tableMatch) return tableMatch[1];
  
  return null;
}

// Function to select a table in the 3D map from external code
export function selectTableInMap(tableNumber, orderData = null) {
  if (typeof window === 'undefined') return;
  
  const tableId = `table-${tableNumber}`;
  const tableData = {
    tableNumber: tableNumber.toString(),
    status: orderData?.status || 'occupied',
    orderInfo: orderData || null,
    position: [0, 0, 0], // Will be updated by 3D scene
    capacity: 4 // Default capacity
  };
  
  // Dispatch custom event that the 3D map can listen to
  const event = new CustomEvent('selectTable3D', {
    detail: { tableId, tableData }
  });
  
  window.dispatchEvent(event);
}

// Function to integrate with existing order queue clicks
export function enhanceOrderQueueWithMapIntegration() {
  if (typeof window === 'undefined') return;
  
  // Add click handlers to existing order queue items
  const addTableClickHandlers = () => {
    // Find order queue rows that contain table information
    const orderRows = document.querySelectorAll('.oq-row');
    
    orderRows.forEach(row => {
      // Look for table information in the row
      const tableBillSpan = row.querySelector('.oq-row-bill');
      if (!tableBillSpan) return;
      
      const billText = tableBillSpan.textContent || '';
      const tableMatch = billText.match(/Table\s*(\d+)/i);
      
      if (tableMatch) {
        const tableNumber = tableMatch[1];
        
        // Add click handler if not already present
        if (!row.hasAttribute('data-3d-enhanced')) {
          row.setAttribute('data-3d-enhanced', 'true');
          
          // Add visual indicator for 3D map integration
          const indicator = document.createElement('div');
          indicator.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 8px;
            height: 8px;
            background: #d9a83e;
            border-radius: 50%;
            opacity: 0.7;
            box-shadow: 0 0 4px rgba(217, 168, 62, 0.5);
          `;
          indicator.title = 'Click to view in 3D map';
          
          row.style.position = 'relative';
          row.appendChild(indicator);
          
          // Add click handler to show in 3D map
          const handleRowClick = (event) => {
            // Only trigger if not clicking on action buttons
            if (event.target.closest('.oq-row-pay, .oq-row-done')) return;
            
            // Extract order data from the row
            const orderData = extractOrderDataFromRow(row);
            selectTableInMap(tableNumber, orderData);
          };
          
          row.addEventListener('click', handleRowClick);
          
          // Store cleanup function
          row._3dCleanup = () => {
            row.removeEventListener('click', handleRowClick);
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
            row.removeAttribute('data-3d-enhanced');
            delete row._3dCleanup;
          };
        }
      }
    });
  };

  // Extract order data from a queue row element
  const extractOrderDataFromRow = (row) => {
    try {
      const billSpan = row.querySelector('.oq-row-bill');
      const itemsSpan = row.querySelector('.oq-row-items');
      const amountSpan = row.querySelector('.oq-row-amount');
      const timeSpan = row.querySelector('.oq-row-time');
      
      return {
        orderNo: billSpan?.textContent?.replace('Table ', '') || 'Unknown',
        items: parseItemsFromText(itemsSpan?.textContent || ''),
        total: parseFloat(amountSpan?.textContent?.replace(/[^\d.]/g, '') || '0'),
        status: 'pending', // Default status
        createdAt: Date.now() - (Math.random() * 3600000), // Rough estimate
        elapsedTime: Math.random() * 1800000 // Rough estimate
      };
    } catch (error) {
      console.warn('Failed to extract order data from row:', error);
      return null;
    }
  };

  // Parse items from text like "🥭 Mango Juice x2, 🍉 Watermelon Juice x1"
  const parseItemsFromText = (itemsText) => {
    try {
      const itemParts = itemsText.split(',').map(part => part.trim());
      return itemParts.map((part, index) => {
        const match = part.match(/(.+?)\s+x(\d+)/);
        if (match) {
          const [, nameWithEmoji, qty] = match;
          const emoji = nameWithEmoji.charAt(0);
          const name = nameWithEmoji.slice(1).trim();
          
          return {
            name: name,
            emoji: emoji,
            qty: parseInt(qty),
            price: 50, // Default price
            total: 50 * parseInt(qty)
          };
        }
        
        return {
          name: part,
          emoji: '🍹',
          qty: 1,
          price: 50,
          total: 50
        };
      });
    } catch (error) {
      return [];
    }
  };

  // Initial setup
  addTableClickHandlers();
  
  // Set up mutation observer to handle dynamically added order rows
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If the added node contains order rows, enhance them
            if (node.classList?.contains('oq-row') || node.querySelector?.('.oq-row')) {
              setTimeout(addTableClickHandlers, 100); // Small delay to ensure DOM is ready
            }
          }
        });
      }
    });
  });
  
  // Observe the order queue list
  const orderList = document.getElementById('oqList');
  if (orderList) {
    observer.observe(orderList, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    
    // Clean up existing enhanced rows
    document.querySelectorAll('.oq-row[data-3d-enhanced]').forEach(row => {
      if (row._3dCleanup) {
        row._3dCleanup();
      }
    });
  };
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  enhanceOrderQueueWithMapIntegration();
} else if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', enhanceOrderQueueWithMapIntegration);
}
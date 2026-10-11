# Design Document

## Overview

The Live 3D Café Map feature integrates a WebGL-based 3D visualization into the existing BFS billing system. The design leverages React Three Fiber for 3D rendering while maintaining the current vanilla JavaScript architecture through dynamic imports and modular integration. The system provides real-time visual feedback of café operations through a low-poly strategy game aesthetic that complements the existing black and gold theme.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│              Existing BFS UI                │
│   (HTML/CSS/JS + Firebase Integration)      │
├─────────────────────────────────────────────┤
│               3D Map Layer                  │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Map Toggle  │  │   Live Counters     │   │
│  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────────────────────────────────┐ │
│  │         React Three Fiber Scene         │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │ │
│  │  │Table│ │Table│ │Juice│ │Bills│      │ │
│  │  │  1  │ │  2  │ │Stand│ │Cntr │      │ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘      │ │
│  └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│           Firebase Realtime DB              │
│      (Existing orders & status data)        │
└─────────────────────────────────────────────┘
```

### Component Architecture

The 3D map system consists of four main modules:

1. **Scene Module** (`/map3d/scene/`): Contains all 3D rendering components
2. **UI Module** (`/map3d/ui/`): Map controls and overlays
3. **Hooks Module** (`/map3d/hooks/`): Data management and state synchronization
4. **Lib Module** (`/map3d/lib/`): Utilities and configuration

### Data Flow

```
Firebase Realtime DB → Existing Order Queue → 3D Scene State → Visual Updates
                                         ↘
                    Side Panel ← Table Click Events ← 3D Scene Interaction
```

## Components and Interfaces

### Core Components

#### 1. MapCanvas Component
```javascript
// Dynamic import wrapper for the 3D scene
interface MapCanvasProps {
  mode: 'dimmed' | 'interactive';
  onTableClick: (tableId: string) => void;
  tableStatuses: Map<string, TableStatus>;
}
```

#### 2. CafeScene Component  
```javascript
// Main 3D scene using React Three Fiber
interface CafeSceneProps {
  interactive: boolean;
  tableData: TableData[];
  onTableSelect: (tableId: string) => void;
}
```

#### 3. TableEntity Component
```javascript
// Individual 3D table representation
interface TableEntityProps {
  id: string;
  position: [number, number, number];
  status: TableStatus;
  orderInfo?: OrderInfo;
  onClick: (id: string) => void;
}
```

#### 4. StatusMarker Component
```javascript
// Floating information display above tables
interface StatusMarkerProps {
  orderNumber?: string;
  elapsedTime?: number;
  position: [number, number, number];
}
```

### Interface Definitions

#### TableStatus Enum
```javascript
enum TableStatus {
  FREE = 'free',           // Available table - neutral grey
  OCCUPIED = 'occupied',   // Customers seated - soft blue
  ORDER_PLACED = 'order_placed',    // Order received - amber
  PREPARING = 'preparing',           // Kitchen working - orange
  READY_TO_SERVE = 'ready_to_serve', // Ready for delivery - green
  NEEDS_BILL = 'needs_bill'          // Ready for payment - gold
}
```

#### OrderInfo Interface
```javascript
interface OrderInfo {
  orderNo: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: number;
  elapsedTime?: number;
}
```

#### TableData Interface
```javascript
interface TableData {
  id: string;
  tableNumber: string;
  position: [number, number, number];
  capacity: number;
  currentOrder?: OrderInfo;
  status: TableStatus;
}
```

## Data Models

### Table Configuration
```javascript
const CAFE_LAYOUT = {
  tables: [
    { id: 'table-1', number: '1', position: [-2, 0, -1], capacity: 4 },
    { id: 'table-2', number: '2', position: [2, 0, -1], capacity: 4 },
    { id: 'table-3', number: '3', position: [-2, 0, 1], capacity: 2 },
    { id: 'table-4', number: '4', position: [2, 0, 1], capacity: 2 },
    { id: 'table-5', number: '5', position: [0, 0, -2.5], capacity: 6 },
    { id: 'table-6', number: '6', position: [0, 0, 2.5], capacity: 6 },
    { id: 'table-7', number: '7', position: [-4, 0, 0], capacity: 2 },
    { id: 'table-8', number: '8', position: [4, 0, 0], capacity: 2 }
  ],
  counters: [
    { id: 'billing-counter', position: [0, 0, -4], type: 'billing' },
    { id: 'juice-station', position: [-3, 0, -3], type: 'juice' },
    { id: 'snack-counter', position: [3, 0, -3], type: 'snack' }
  ]
};
```

### Status Color Mapping
```javascript
const STATUS_COLORS = {
  [TableStatus.FREE]: '#4a5568',           // Neutral grey
  [TableStatus.OCCUPIED]: '#4299e1',       // Soft blue
  [TableStatus.ORDER_PLACED]: '#d69e2e',   // Amber (matches theme)
  [TableStatus.PREPARING]: '#ed8936',      // Orange
  [TableStatus.READY_TO_SERVE]: '#48bb78', // Green
  [TableStatus.NEEDS_BILL]: '#d9a83e'      // Gold (theme accent)
};
```

### Firebase Integration
The system maps existing Firebase order statuses to the new table status system:

```javascript
const STATUS_MAPPING = {
  'pending': TableStatus.ORDER_PLACED,
  'preparing': TableStatus.PREPARING, 
  'ready': TableStatus.READY_TO_SERVE,
  'served': TableStatus.NEEDS_BILL,
  'paid': TableStatus.FREE
};
```

## Error Handling

### WebGL Fallback System
```javascript
const WebGLSupport = {
  check: () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl.getExtension);
  },
  
  fallback: () => {
    // Show enhanced list view with table status colors
    renderListView(tableData);
  }
};
```

### Error Boundaries
- **Scene Rendering Errors**: Fallback to 2D table grid with status colors
- **Firebase Connection Loss**: Show cached data with offline indicator  
- **Performance Issues**: Automatically reduce quality settings and disable animations
- **Memory Constraints**: Implement object pooling for 3D entities

### Graceful Degradation
1. **No WebGL**: Enhanced list view with color-coded table status
2. **Low Performance**: Reduced geometry complexity and disabled shadows
3. **Mobile Devices**: Touch-optimized controls and simplified geometry
4. **Old Browsers**: Pure CSS table grid with status indicators

## Testing Strategy

### Unit Testing
- **3D Component Rendering**: Test table entity creation and status updates
- **Status Mapping**: Verify Firebase status to visual status conversion
- **User Interactions**: Test table click events and mode switching
- **Data Synchronization**: Mock Firebase updates and verify UI changes

### Integration Testing  
- **Firebase Integration**: Test real-time data flow from database to 3D scene
- **Existing UI Compatibility**: Ensure billing functions remain unaffected
- **Performance Testing**: Monitor frame rate and memory usage under load
- **Cross-browser Testing**: Verify WebGL support across target browsers

### Performance Benchmarks
- **Initial Load Time**: Target < 2 seconds for 3D scene initialization
- **Frame Rate**: Maintain 30+ FPS on mid-range devices
- **Memory Usage**: Keep 3D scene under 50MB memory footprint
- **Update Latency**: Status changes should reflect within 1 second

### User Acceptance Testing
- **Owner Workflow**: Test typical billing tasks with 3D map active
- **Table Management**: Verify intuitive table selection and order viewing
- **Multi-device Usage**: Test on typical café hardware (tablets, laptops)
- **Stress Testing**: Simulate peak hours with multiple simultaneous orders
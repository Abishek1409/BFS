/**
 * 3D Map Configuration
 * Central configuration for the Live 3D Café Map
 */

// Table Status Enumeration
export const TableStatus = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  ORDER_PLACED: 'order_placed',
  PREPARING: 'preparing',
  READY_TO_SERVE: 'ready_to_serve',
  NEEDS_BILL: 'needs_bill'
};

// Status Color Mapping (complementing black and gold theme)
export const STATUS_COLORS = {
  [TableStatus.FREE]: '#4a5568',           // Neutral grey
  [TableStatus.OCCUPIED]: '#4299e1',       // Soft blue
  [TableStatus.ORDER_PLACED]: '#d69e2e',   // Amber (matches theme)
  [TableStatus.PREPARING]: '#ed8936',      // Orange
  [TableStatus.READY_TO_SERVE]: '#48bb78', // Green
  [TableStatus.NEEDS_BILL]: '#d9a83e'      // Gold (theme accent)
};

// Café Layout Configuration (8-table layout)
export const CAFE_LAYOUT = {
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

// Camera Configuration
export const CAMERA_CONFIG = {
  position: [0, 8, 6],         // Isometric-style position
  fov: 50,                     // Field of view
  near: 0.1,                   // Near clipping plane
  far: 1000,                   // Far clipping plane
  // Orbit controls limits
  minDistance: 3,              // Minimum zoom distance - closer for table details
  maxDistance: 25,             // Maximum zoom distance - further for full café view
  minPolarAngle: Math.PI / 6,  // Minimum vertical angle (30°)
  maxPolarAngle: Math.PI / 2.2, // Maximum vertical angle (82°) - slightly more constrained
  enablePan: true,             // Enable panning
  panSpeed: 0.6,               // Reduced pan sensitivity for smoother control
  rotateSpeed: 0.4,            // Reduced rotation sensitivity
  zoomSpeed: 0.8,              // Slightly faster zoom for responsiveness
  enableDamping: true,         // Enable smooth damping
  dampingFactor: 0.05,         // Damping strength for smooth deceleration
  screenSpacePanning: false,   // Pan in world space for better UX
  // Smooth transition settings
  transitionDuration: 1.0,     // Duration for programmatic camera moves
  autoRotateSpeed: 0.5         // Speed when auto-rotate is enabled
};

// Lighting Configuration
export const LIGHTING_CONFIG = {
  ambient: {
    intensity: 0.4,
    color: '#ffffff'
  },
  directional: {
    intensity: 0.8,
    color: '#ffffff',
    position: [10, 10, 5],
    castShadow: true
  },
  point: {
    intensity: 0.3,
    color: '#ffd700',        // Golden accent light
    position: [0, 4, 0]
  }
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  statusTransition: {
    duration: 0.6,             // Smoother color transition duration (seconds)
    easing: 'easeInOutCubic',  // More natural easing
    stagger: 0.1               // Slight delay between multiple table updates
  },
  cameraIdle: {
    enabled: true,
    rotationSpeed: 0.05,       // Slower, more subtle idle rotation
    amplitude: 0.015,          // Smaller drift for less distraction
    verticalBob: 0.1,          // Gentle vertical movement
    period: 8.0                // Slower period for more relaxed feel
  },
  modeTransition: {
    duration: 0.8,             // Longer duration for smoother mode switch
    easing: 'easeInOutQuart',  // More pronounced easing
    uiOpacity: {
      fadeOut: 0.3,            // Time to fade out UI
      fadeIn: 0.4              // Time to fade in UI
    }
  },
  tableHover: {
    duration: 0.2,             // Quick hover response
    easing: 'easeOutQuad',
    scaleMultiplier: 1.05      // Subtle scale increase on hover
  },
  statusMarkers: {
    float: {
      amplitude: 0.1,          // Gentle floating motion
      speed: 1.5               // Floating speed
    },
    fadeIn: {
      duration: 0.4,
      easing: 'easeOutQuart'
    }
  },
  loadingSequence: {
    duration: 1.2,             // Loading animation duration
    stagger: 0.15,             // Stagger table appearances
    easing: 'easeOutBack'      // Bouncy appearance effect
  }
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1, // Limit pixel ratio
  antialias: true,
  alpha: true,                 // Transparent background
  powerPreference: 'default',  // GPU preference
  failIfMajorPerformanceCaveat: false,
  // LOD (Level of Detail) settings
  lod: {
    enabled: true,
    distances: [5, 15, 30]    // Distance thresholds for detail levels
  },
  // Instancing for repeated objects
  instancing: {
    enabled: true,
    maxInstances: 50
  }
};

// Firebase Status Mapping
export const STATUS_MAPPING = {
  'pending': TableStatus.ORDER_PLACED,
  'preparing': TableStatus.PREPARING, 
  'ready': TableStatus.READY_TO_SERVE,
  'served': TableStatus.NEEDS_BILL,
  'paid': TableStatus.FREE,
  // Fallback mappings
  'new': TableStatus.ORDER_PLACED,
  'completed': TableStatus.FREE,
  'cancelled': TableStatus.FREE
};

// Map Modes
export const MAP_MODES = {
  DIMMED: 'dimmed',
  INTERACTIVE: 'interactive'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  mode: MAP_MODES.DIMMED,
  showStatusMarkers: true,
  showCounters: true,
  animationsEnabled: true,
  autoRotate: false
};
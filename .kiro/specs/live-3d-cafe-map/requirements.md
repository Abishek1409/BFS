# Requirements Document

## Introduction

This document specifies the requirements for adding a Live 3D Café Map feature to the existing BFS (Best Fruits Stall) billing website. The feature will provide an immersive 3D visualization of the café space that displays real-time table status, order information, and live activity updates, while maintaining all existing billing functionality.

## Glossary

- **BFS_System**: The existing Best Fruits Stall billing website deployed on Vercel
- **Live_Map**: The new 3D café visualization component showing tables, counters, and order status
- **Firebase_Database**: The existing Firebase Realtime Database storing order data
- **Table_Entity**: A 3D representation of a physical table in the café with status indicators
- **Order_Queue**: The existing order management system displaying pending orders
- **Interactive_Mode**: A map mode allowing camera control and table interaction
- **Dimmed_Mode**: A background map mode with limited animation for readability
- **Status_Marker**: A floating indicator above tables showing order number and timing
- **Scene_Canvas**: The WebGL rendering surface for the 3D map
- **Navigation_System**: The existing menu navigation structure

## Requirements

### Requirement 1

**User Story:** As a café owner, I want to see a live 3D map of my café space integrated into the billing interface, so that I can visually monitor table status and order flow while maintaining access to all billing functions.

#### Acceptance Criteria

1. THE BFS_System SHALL render the Live_Map as a fixed background layer behind all existing UI elements
2. THE BFS_System SHALL preserve all existing billing screens, order lists, counters and buttons without functional changes
3. THE BFS_System SHALL display the Scene_Canvas only after successful WebGL capability detection
4. THE BFS_System SHALL provide a plain list fallback view when WebGL is unavailable
5. THE BFS_System SHALL add a navigation link to access the Live_Map view in the existing Navigation_System

### Requirement 2

**User Story:** As a café owner, I want to toggle between background and interactive map modes, so that I can focus on billing tasks or explore the 3D visualization as needed.

#### Acceptance Criteria

1. THE Live_Map SHALL provide a Dimmed_Mode with idle animation and front UI at full opacity
2. THE Live_Map SHALL provide an Interactive_Mode where front panels fade for camera control
3. WHEN the user activates Interactive_Mode, THE Scene_Canvas SHALL enable orbit, pan, and zoom controls
4. THE Live_Map SHALL maintain smooth camera movement with defined orbit, pan and zoom limits
5. THE Live_Map SHALL display a toggle control to switch between Dimmed_Mode and Interactive_Mode

### Requirement 3

**User Story:** As a café owner, I want to see real-time table status visualization, so that I can quickly identify which tables need attention and track order progress.

#### Acceptance Criteria

1. THE Table_Entity SHALL change color based on status: free, occupied, order placed, preparing, ready to serve, and needs bill
2. THE Table_Entity SHALL use colors that complement the existing black and gold theme
3. THE Status_Marker SHALL float above each Table_Entity showing order number and elapsed time
4. WHEN a table status changes, THE Table_Entity SHALL animate the color transition smoothly
5. THE Live_Map SHALL update table status within one second of Firebase_Database changes

### Requirement 4

**User Story:** As a café owner, I want to click on tables in the 3D map to view order details, so that I can quickly access specific order information without searching through lists.

#### Acceptance Criteria

1. WHEN a Table_Entity is clicked, THE BFS_System SHALL open a side panel with order items and status controls
2. THE BFS_System SHALL highlight the selected Table_Entity with visual feedback
3. THE side panel SHALL display the same order management functions as existing order lists
4. THE BFS_System SHALL allow clicking tables both in the 3D map and existing front order lists
5. THE BFS_System SHALL maintain table selection state when switching between Dimmed_Mode and Interactive_Mode

### Requirement 5

**User Story:** As a café owner, I want to see live counters and activity feeds on the map interface, so that I can monitor business metrics and recent events at a glance.

#### Acceptance Criteria

1. THE Live_Map SHALL display live counters for open orders, average preparation time and today's sales
2. THE Live_Map SHALL show a simple events feed with the latest order activity
3. THE counters SHALL update in real-time using the existing Firebase_Database data layer
4. THE Live_Map SHALL map existing order flow statuses to the new table status system
5. THE BFS_System SHALL maintain existing printer setup and QR ordering website connections without modification

### Requirement 6

**User Story:** As a café owner, I want the 3D map to load efficiently and perform well, so that it doesn't impact the billing system's responsiveness.

#### Acceptance Criteria

1. THE Scene_Canvas SHALL load dynamically in browser using dynamic import with server rendering disabled
2. THE BFS_System SHALL display a loading skeleton while the 3D components initialize  
3. THE Live_Map SHALL limit pixel ratio and use instancing for repeated 3D objects
4. THE Live_Map SHALL pause background animation when the browser tab is hidden
5. THE BFS_System SHALL keep the bundle size impact minimal through code splitting
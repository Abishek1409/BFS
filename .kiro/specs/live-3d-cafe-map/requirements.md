# Requirements Document

## Introduction

This spec replaces the earlier Live 3D Café Map spec. It adds a game-style Live Map to the existing BFS (Best Fruits Stall) billing website. The Live Map is a full-screen, cozy low-poly 3D map of the shop, viewed from an isometric camera and surrounded by a black-and-gold heads-up display (HUD). The owner uses it at the billing counter to watch and manage tables and orders in real time, so running the shop feels like playing a strategy game.

Findings from the existing codebase that shape these requirements:

- The billing website is a static site (`index.html`) written in vanilla JavaScript with inline CSS variables (`--bg #010101`, `--accent #d9a83e`, `--gold`, `--text`, `--border`). It is deployed on Vercel with `framework: null`, and the build step is a single esbuild command that bundles `map3d/index.js` into `dist/map3d.js`.
- React 19, React Three Fiber 9, drei 10 and three 0.186 are already installed. A first version of the 3D map already exists in `map3d/` (scene, ui, hooks, lib) as plain JSX in `.js` files. That version includes simulated data (for example random timestamps in `table-integration.js`) and logic that `index.html` also duplicates.
- Live data comes from Firebase Realtime Database through the compat SDK v10, which `index.html` initialises. The QR ordering site (`order.html`) writes records to `orders/{id}` with the fields `orderNo`, `table`, `total`, `createdAt`, `status: 'pending'` and `items[]`.
- The billing page already writes `orders/{id}/status = 'served'` from the Done button. When a QR bill is printed, it writes `orderStatus/{id} = { billNo, status: 'billed' }` and then removes `orders/{id}`.
- Bill records, which are the source of today's sales, live in IndexedDB through `billHistory.js`.
- The project has no Next.js, App Router or TypeScript setup.

Framework assumption, to be confirmed at review: the project is not a Next.js app. Migrating it would change how Vercel serves both the billing page and the QR ordering site. These requirements therefore assume the Live Map is built with React, TypeScript, React Three Fiber and drei inside the existing project. It is bundled by the existing esbuild step and loaded only in the browser through a dynamic import, while the existing pages stay as they are. If the owner prefers to adopt Next.js App Router, Requirements 1 and 2 will be revised.

Two behaviours of the existing billing code constrain the design:

- `renderQueue()` treats `orders/{id}/status === 'preparing'` as "already printed" and hides the Load & Print button. Writing `preparing` or `ready` into Order_Records would therefore change billing behaviour.
- Billing usually prints, and so bills, at order time. Printing writes `orderStatus/{id}` and removes `orders/{id}`, so the order data disappears before the order is served.

Order flow mapping onto the existing statuses:

| Flow step | Source | Exists today? |
|---|---|---|
| Placed | `orders/{id}/status = 'pending'` | Yes (QR site) |
| Preparing | `liveMap/progress/{id}/stage = 'preparing'` | New stage, in a new node |
| Ready | `liveMap/progress/{id}/stage = 'ready'` | New stage, in a new node |
| Served | `orders/{id}/status = 'served'` (billing Done button) or `liveMap/progress/{id}/stage = 'served'` | Existing value plus new stage |
| Paid | `orderStatus/{id}/status = 'billed'` (billing print) | Yes |

No new values are added to `orders/{id}/status`. The new stages `preparing`, `ready` and `served` live in a new `liveMap/progress` node, which also keeps a snapshot of each order so the order survives the removal that happens at print time. The table status "occupied" needs a new `liveMap/tables` node, seeded with 8 tables.

## Glossary

- **BFS_System**: The existing BFS billing website deployed on Vercel, including `index.html`, its scripts and its build configuration.
- **Billing_Page**: The existing billing screen in `index.html`, including bill entry, order queue, printing, reports and bill history.
- **QR_Site**: The separate customer QR ordering page `order.html` and its behaviour.
- **Printer_Setup**: The existing printer communication scripts and print server files.
- **Live_Map**: The new feature as a whole: Map_Scene, HUD, List_View and their data hooks.
- **Map_Scene**: The React Three Fiber 3D scene of the shop.
- **HUD**: The translucent black-and-gold interface layer around the Map_Scene, made up of Top_Bar, Side_Panel and Bottom_Bar.
- **Top_Bar**: The HUD strip that shows Live_Counters.
- **Side_Panel**: The HUD panel that shows the order list, or the Order_Panel for a selected table.
- **Bottom_Bar**: The HUD strip that shows quick actions and the Events_Feed.
- **Live_Counters**: The counts of open orders, the average preparation time and today's sales.
- **Events_Feed**: The list of recent order events, newest first.
- **Order_Panel**: The Side_Panel view that shows the items, total and status buttons of the order at the selected table.
- **Order_Record**: An entry under `orders/{id}` in Firebase_Database.
- **Paid_Record**: An entry under `orderStatus/{id}` with status `billed`.
- **Table_Record**: A new entry under `liveMap/tables/{number}` holding a table's number, label, seat count and `occupied` flag.
- **Progress_Record**: A new entry under `liveMap/progress/{orderId}` holding the order snapshot (table, order number, items, total, `createdAt`), the current flow stage and the stage timestamps.
- **Active_Order**: An order that has a valid table number and `createdAt` value, with a flow stage other than closed.
- **Firebase_Database**: The Firebase Realtime Database that the Billing_Page already uses.
- **Bill_History_Store**: The existing IndexedDB bill store exposed by `billHistory.js`.
- **Table_Entity**: The 3D representation of one of the 8 tables, together with its chairs.
- **Table_Status**: One of six values: Free, Occupied, Order_Placed, Preparing, Ready_To_Serve or Needs_Bill.
- **Status_Marker**: The floating label above a Table_Entity that shows the order number and the time since the order was placed.
- **Selection_Ring**: The glowing ring drawn around the selected Table_Entity.
- **Minimap**: The small top-down 2D overview of the shop layout and the table statuses.
- **Staff_Figure**: The animated low-poly figure that walks between the counters and the tables.
- **View_Mode**: One of three display balances: Balanced (the HUD and the map both at full emphasis), Map_Focus (the HUD faded) or Billing_Focus (the map dimmed behind the Billing_Page).
- **List_View**: The 2D fallback that shows tables and orders in HUD styling, with no Map_Scene.
- **Map_Bundle**: The JavaScript output of the Live_Map produced by the build step.

## Requirements

### Requirement 1: Integration with the existing project

**User Story:** As the shop owner, I want the Live Map added to my current billing website, so that I keep all existing features and data without a second app.

#### Acceptance Criteria

1. THE Live_Map SHALL read orders from the existing Order_Record and Paid_Record paths in Firebase_Database through the Firebase app instance that the Billing_Page initialises.
2. THE BFS_System SHALL preserve the current behaviour of the Billing_Page, the QR_Site and the Printer_Setup after the Live_Map is added.
3. THE Live_Map SHALL use the existing `--bg`, `--accent`, `--gold`, `--text` and `--border` theme variables of the Billing_Page for every HUD colour.
4. THE BFS_System SHALL provide one shared module for order mapping, status mapping and table layout that both the Live_Map and the existing `map3d` integration code import.
5. THE BFS_System SHALL place the Live_Map source in `scene`, `ui`, `hooks` and `lib` folders within the existing `map3d` directory.
6. IF an Order_Record lacks a table number or a `createdAt` value, THEN THE Live_Map SHALL exclude that Order_Record from the map, the counters and the order list.

### Requirement 2: Client-only loading

**User Story:** As the shop owner, I want the billing page to open as fast as it does today, so that the 3D map never slows down billing.

#### Acceptance Criteria

1. WHEN the owner opens the Live_Map, THE Billing_Page SHALL load the Map_Bundle through a dynamic import in the browser.
2. WHILE the Map_Bundle is loading, THE Live_Map SHALL display a loading skeleton in HUD styling.
3. THE BFS_System SHALL keep the initial download of the Billing_Page within 5 KB of its size before this feature.
4. IF the Map_Bundle fails to load, THEN THE Live_Map SHALL display the List_View with a retry button.

### Requirement 3: Procedural shop scene

**User Story:** As the shop owner, I want a cozy low-poly map of my own shop, so that I recognise the layout at a glance.

#### Acceptance Criteria

1. THE Map_Scene SHALL render the floor, the walls, 8 Table_Entities with chairs, the billing counter, the juice station with a juicer and fruit crates, and the snack counter.
2. THE Map_Scene SHALL generate all geometry and materials in code, with zero external 3D model or texture files.
3. THE Map_Scene SHALL fill the full browser viewport behind the HUD.
4. THE Map_Scene SHALL use a low-poly visual style with flat-shaded materials in a palette derived from the black-and-gold theme.

### Requirement 4: Ambient animation

**User Story:** As the shop owner, I want small living details in the map, so that the shop feels active like a game world.

#### Acceptance Criteria

1. THE Map_Scene SHALL animate rising steam above the snack counter.
2. WHILE at least one order has Table_Status Preparing, THE Map_Scene SHALL animate juice pouring at the juice station.
3. THE Map_Scene SHALL animate the Staff_Figure walking along a loop path between the counters and the tables.
4. WHILE the owner has made no camera input for 10 seconds, THE Map_Scene SHALL apply an idle camera drift of at most 0.5 world units from the resting position.

### Requirement 5: Table status visuals

**User Story:** As the shop owner, I want each table coloured by its status, so that I can see which tables need attention.

#### Acceptance Criteria

1. THE Live_Map SHALL derive the Table_Status of each table from that table's active Order_Record and Table_Record, following the order flow mapping table in the Introduction.
2. THE Table_Entity SHALL display a distinct colour for each of the six Table_Status values, with each colour harmonised with the black-and-gold theme.
3. WHEN the Table_Status of a table changes, THE Table_Entity SHALL blend from the previous colour to the new colour over 400 to 800 milliseconds.
4. THE Live_Map SHALL display a colour legend for the six Table_Status values in the HUD.

### Requirement 6: Status markers

**User Story:** As the shop owner, I want a label above each busy table, so that I see the order number and waiting time without clicking.

#### Acceptance Criteria

1. WHILE a table has an active Order_Record, THE Status_Marker SHALL display the order number and the elapsed time since the Order_Record `createdAt` value.
2. THE Status_Marker SHALL refresh the displayed elapsed time once per second.
3. WHILE a table has Table_Status Free, THE Status_Marker SHALL display only the table number.
4. THE Status_Marker SHALL use a translucent black panel with gold text, readable at the default camera distance.

### Requirement 7: Table selection and order panel

**User Story:** As the shop owner, I want to click a table and manage its order, so that I can move the order forward from the map.

#### Acceptance Criteria

1. WHEN the owner clicks a Table_Entity, THE Live_Map SHALL open the Order_Panel for that table.
2. WHEN the owner selects a table, THE Map_Scene SHALL display the Selection_Ring around that Table_Entity.
3. THE Order_Panel SHALL display the order number, the item names, quantities, preferences, item totals, the order total and the elapsed time.
4. WHEN the owner clicks an order in the Side_Panel order list, THE Live_Map SHALL select the matching table.
5. WHEN the owner presses Escape or clicks the Order_Panel close button, THE Live_Map SHALL clear the selection.

### Requirement 8: Status changes and order flow

**User Story:** As the shop owner, I want to step an order through placed, preparing, ready, served and paid, so that the map mirrors the real work.

#### Acceptance Criteria

1. WHEN the owner presses a stage button in the Order_Panel, THE Live_Map SHALL write the selected stage and its timestamp to the Progress_Record of the order.
2. WHEN the owner presses the Bill button for an unbilled order, THE Live_Map SHALL hand the order to the existing load-and-print flow of the Billing_Page.
3. WHEN the owner presses the Occupied toggle for a table without an Active_Order, THE Live_Map SHALL write the `occupied` flag of the matching Table_Record.
4. IF a write to Firebase_Database fails, THEN THE Live_Map SHALL restore the previous Table_Status and display an error message in the Events_Feed.
5. WHILE an Active_Order is served and has no Paid_Record, THE Live_Map SHALL show the table as Needs_Bill.
6. WHILE an Active_Order has a Paid_Record and is not yet served, THE Live_Map SHALL show the table in the colour of the order's current stage with a Paid badge.
7. WHEN an Active_Order is both served and paid, THE Live_Map SHALL close the Progress_Record, set the table to Free and clear the table's `occupied` flag.

### Requirement 9: Top bar counters

**User Story:** As the shop owner, I want live counters at the top, so that I know how the day is going.

#### Acceptance Criteria

1. THE Top_Bar SHALL display the count of Active_Orders.
2. THE Top_Bar SHALL display the average preparation time of orders that reached the ready stage today, measured from `createdAt` to the ready timestamp in the Progress_Record.
3. THE Top_Bar SHALL display today's sales as the sum of today's bill amounts from the Bill_History_Store.
4. WHEN a new bill is saved to the Bill_History_Store, THE Top_Bar SHALL update the today's sales value within 1 second.

### Requirement 10: Side panel order list

**User Story:** As the shop owner, I want an order list beside the map, so that I see every open order in one place.

#### Acceptance Criteria

1. THE Side_Panel SHALL list every active Order_Record with its table number, order number, Table_Status colour, item count, total and elapsed time.
2. THE Side_Panel SHALL sort the order list by `createdAt`, oldest first.
3. WHILE the order list is empty, THE Side_Panel SHALL display an empty-state message.

### Requirement 11: Bottom bar actions and events feed

**User Story:** As the shop owner, I want quick actions and recent events at the bottom, so that I can reach billing tools and follow activity.

#### Acceptance Criteria

1. THE Bottom_Bar SHALL provide quick actions that open the existing Billing_Page sections for new bill, order queue, reports and bill history.
2. THE Bottom_Bar SHALL provide a reset view button, a View_Mode toggle and a List_View toggle.
3. THE Events_Feed SHALL display the 8 most recent order events, each with a time, a table number and an event description.
4. WHEN an Order_Record is added, changes status or receives a Paid_Record, THE Events_Feed SHALL add an event within 1 second.

### Requirement 12: View modes

**User Story:** As the shop owner, I want to switch between map focus and billing focus, so that I can either enjoy the map or concentrate on billing.

#### Acceptance Criteria

1. WHEN the owner selects Map_Focus, THE HUD SHALL fade to 20 percent opacity over 300 milliseconds and stay interactive on hover.
2. WHEN the owner selects Billing_Focus, THE Map_Scene SHALL dim to 25 percent brightness behind the Billing_Page and pause camera interaction.
3. WHEN the owner selects Balanced, THE Live_Map SHALL restore the HUD and the Map_Scene to full emphasis.
4. WHEN the owner changes View_Mode, THE Live_Map SHALL keep the current table selection.
5. WHEN the owner reloads the Billing_Page, THE Live_Map SHALL restore the last selected View_Mode.

### Requirement 13: Camera controls

**User Story:** As the shop owner, I want smooth orbit, pan and zoom, so that I can look around the shop comfortably.

#### Acceptance Criteria

1. THE Map_Scene SHALL start with a top-down isometric camera framing all 8 tables and the 3 counters.
2. THE Map_Scene SHALL provide damped orbit, pan and zoom controls.
3. THE Map_Scene SHALL limit the camera distance to between 6 and 22 world units, the polar angle to between 20 and 65 degrees, and the pan target to within the shop floor bounds.
4. WHEN the owner presses the reset view button, THE Map_Scene SHALL move the camera back to the starting view over 600 to 1000 milliseconds.

### Requirement 14: Game feedback

**User Story:** As the shop owner, I want game-style feedback, so that I notice changes without sound.

#### Acceptance Criteria

1. THE HUD SHALL display a Minimap showing the shop outline, the counters and each table coloured by Table_Status.
2. WHEN the owner clicks a table on the Minimap, THE Live_Map SHALL select that table.
3. WHEN the pointer hovers over a Table_Entity, THE Map_Scene SHALL display a tooltip with the table number, the Table_Status and the order total.
4. WHEN a new Order_Record arrives, THE Map_Scene SHALL play an expanding gold pulse at the matching Table_Entity for 1.5 seconds, with zero audio output.
5. WHEN a new Order_Record arrives, THE Top_Bar SHALL briefly highlight the open orders counter for 1.5 seconds.

### Requirement 15: Live updates

**User Story:** As the shop owner, I want the map to stay current without refreshing, so that it always matches the shop.

#### Acceptance Criteria

1. WHEN an Order_Record, Paid_Record, Progress_Record or Table_Record changes in Firebase_Database, THE Live_Map SHALL reflect the change in the Map_Scene, the HUD and the List_View within 1 second.
2. WHILE Firebase_Database reports a disconnected state, THE Top_Bar SHALL display an offline indicator and keep the last known data visible.
3. WHEN Firebase_Database reconnects, THE Live_Map SHALL remove the offline indicator and resume live updates.

### Requirement 16: List view fallback

**User Story:** As the shop owner, I want a plain list view on slow devices, so that I can still manage tables without 3D.

#### Acceptance Criteria

1. IF WebGL is unavailable in the browser, THEN THE Live_Map SHALL display the List_View in place of the Map_Scene.
2. WHEN the owner presses the List_View toggle, THE Live_Map SHALL switch between the Map_Scene and the List_View.
3. THE List_View SHALL display all 8 tables with Table_Status colour, order number, elapsed time and the same Order_Panel actions as the Map_Scene.
4. THE List_View SHALL use the same Top_Bar, Side_Panel and Bottom_Bar as the Map_Scene view.
5. IF the Map_Scene throws a rendering error, THEN THE Live_Map SHALL display the List_View.

### Requirement 17: Performance

**User Story:** As the shop owner, I want the map to run smoothly on my counter device, so that billing stays responsive.

#### Acceptance Criteria

1. THE Map_Scene SHALL cap the device pixel ratio at 1.5.
2. THE Map_Scene SHALL render chairs, fruit crates and floor tiles with instanced meshes.
3. WHILE the browser tab is hidden, THE Map_Scene SHALL stop rendering frames.
4. WHILE View_Mode is Billing_Focus, THE Map_Scene SHALL render at a rate of 10 frames per second or fewer.
5. THE Map_Bundle SHALL stay at or below 400 KB gzip and include only the three, React Three Fiber and drei modules that the Live_Map imports.

### Requirement 18: Table data migration

**User Story:** As the shop owner, I want my 8 tables defined in the database, so that the map and the occupied flags stay consistent.

#### Acceptance Criteria

1. THE BFS_System SHALL provide a migration file that adds a `liveMap/tables` node to Firebase_Database with seed data for 8 tables, numbered 1 to 8.
2. THE migration SHALL leave the existing `orders` and `orderStatus` nodes unchanged.
3. IF the `liveMap/tables` node is missing or empty, THEN THE Live_Map SHALL use the built-in 8-table layout with every table set to unoccupied.

### Requirement 19: Access and scope boundaries

**User Story:** As the shop owner, I want the Live Map to stay a private counter tool, so that nothing changes for customers.

#### Acceptance Criteria

1. THE BFS_System SHALL make the Live_Map reachable only from the Billing_Page navigation.
2. THE BFS_System SHALL keep the existing open access model of the Billing_Page, with the Live_Map added under the same access model.
3. THE Live_Map SHALL limit its Firebase_Database writes to the `liveMap` node.
4. THE BFS_System SHALL provide setup and Vercel deployment steps for the Live_Map.

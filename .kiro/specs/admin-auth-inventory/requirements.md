# Requirements Document

## Introduction

The billing website (index.html) currently lets anyone open the menu, create bills, and also open Bill History and Sales Reports. Menu items and prices are hard-coded in the page, and there is no inventory.

This feature adds an Admin Login protected by JSON Web Tokens (JWT). Staff continue to access the website and create bills without logging in. Viewing history and reports, editing item prices, adding new items, and managing inventory stock become admin-only. The solution must run on the existing free hosting (Vercel Hobby tier / Firebase Spark tier) with no paid cloud or backend service.

## Glossary

- **Billing_App**: The existing browser-based billing website served from index.html.
- **Admin_Auth_Service**: The component that verifies admin credentials, issues JWTs, and validates JWTs.
- **Admin_Panel**: The admin-only user interface for managing items, inventory, reports, and history.
- **Admin**: A person who knows the configured admin password.
- **Staff_User**: Any person using the Billing_App without logging in.
- **JWT**: JSON Web Token, a signed token proving a successful admin login, containing an expiry time.
- **Admin_Session**: The period during which the Billing_App holds a JWT that the Admin_Auth_Service accepts as valid and unexpired.
- **Protected_Feature**: Any of: Bill History view, Sales Reports view, item price editing, item creation, and inventory management.
- **Menu_Item**: A sellable product with a name, emoji, price, category, and preference options (for example ice, sugar).
- **Inventory**: The stored collection of Menu_Items together with an optional stock quantity per Menu_Item.
- **Stock_Quantity**: A non-negative whole number of units available for a Menu_Item that has stock tracking enabled.
- **Low_Stock_Threshold**: A per-item whole number at or below which a Menu_Item is flagged as low stock.

## Requirements

### Requirement 1: Billing without login

**User Story:** As a Staff_User, I want to open the website and bill items without logging in, so that daily billing is not slowed down.

#### Acceptance Criteria

1. WHEN a Staff_User opens the Billing_App, THE Billing_App SHALL display the menu and bill panel without requesting credentials.
2. WHILE no Admin_Session is active, THE Billing_App SHALL allow the Staff_User to add Menu_Items to a bill, print the bill, and save the bill record.
3. WHILE no Admin_Session is active, THE Billing_App SHALL hide the controls for every Protected_Feature from the header and menu area.
4. WHILE no Admin_Session is active, THE Billing_App SHALL display an "Admin" button in the header.

### Requirement 2: Admin login

**User Story:** As an Admin, I want to log in with a password, so that only I can change prices, manage inventory, and view reports and history.

#### Acceptance Criteria

1. WHEN the Staff_User selects the "Admin" button, THE Billing_App SHALL display a login form with a password field.
2. WHEN the Admin submits a password that matches the configured admin password, THE Admin_Auth_Service SHALL issue a signed JWT with an expiry of 8 hours from issue time.
3. WHEN the Billing_App receives a JWT from the Admin_Auth_Service, THE Billing_App SHALL store the JWT in browser storage and open the Admin_Panel.
4. IF the submitted password does not match the configured admin password, THEN THE Billing_App SHALL display the message "Incorrect password" and keep the Admin_Panel closed.
5. IF 5 consecutive failed login attempts occur from the same browser within 15 minutes, THEN THE Billing_App SHALL disable the login form for 15 minutes and display the remaining wait time.

### Requirement 3: Session validation and logout

**User Story:** As an Admin, I want my login to expire and to be able to log out, so that staff cannot use admin features after I leave the counter.

#### Acceptance Criteria

1. WHEN the Billing_App loads with a stored JWT, THE Billing_App SHALL request validation of the JWT from the Admin_Auth_Service before showing any Protected_Feature control.
2. WHEN a Protected_Feature is opened, THE Billing_App SHALL confirm that the stored JWT is valid and unexpired.
3. IF the stored JWT is expired, malformed, or has an invalid signature, THEN THE Billing_App SHALL delete the stored JWT, close the Admin_Panel, and display the "Admin" button.
4. WHEN the Admin selects "Logout", THE Billing_App SHALL delete the stored JWT, close the Admin_Panel, and hide the controls for every Protected_Feature.
5. THE Admin_Auth_Service SHALL keep the JWT signing secret and the admin password outside the source files delivered to the browser.

### Requirement 4: Protected history and reports

**User Story:** As an Admin, I want Bill History and Sales Reports to require login, so that sales data is visible only to me.

#### Acceptance Criteria

1. WHILE an Admin_Session is active, THE Admin_Panel SHALL provide access to the existing Bill History view with the existing day, month, and download functions.
2. WHILE an Admin_Session is active, THE Admin_Panel SHALL provide access to the existing Sales Reports view with the existing day and month modes.
3. IF a Bill History or Sales Reports open action is triggered while no Admin_Session is active, THEN THE Billing_App SHALL display the admin login form instead of the requested view.

### Requirement 5: Edit item prices

**User Story:** As an Admin, I want to edit the price of existing items, so that the menu reflects current prices.

#### Acceptance Criteria

1. WHILE an Admin_Session is active, THE Admin_Panel SHALL list every Menu_Item with the name, category, and current price.
2. WHEN the Admin saves a new price for a Menu_Item, THE Billing_App SHALL store the new price in the Inventory and display the new price on the menu card within 1 second.
3. IF the Admin enters a price that is not a number between 1 and 100000 inclusive, THEN THE Admin_Panel SHALL reject the change and display the message "Price must be between 1 and 100000".
4. WHEN a bill is created after a price change, THE Billing_App SHALL use the updated price for that Menu_Item.
5. WHEN a price change is saved, THE Billing_App SHALL retain the prices recorded in previously saved bill records.

### Requirement 6: Add new items

**User Story:** As an Admin, I want to add new items to the menu, so that I can sell new products without editing code.

#### Acceptance Criteria

1. WHILE an Admin_Session is active, THE Admin_Panel SHALL provide a form to add a Menu_Item with name, emoji, price, category, and preference options.
2. WHEN the Admin submits a valid new Menu_Item, THE Billing_App SHALL assign a unique item identifier, store the Menu_Item in the Inventory, and display the Menu_Item in the menu grid under the selected category.
3. IF the submitted name is empty or matches an existing Menu_Item name (case-insensitive), THEN THE Admin_Panel SHALL reject the submission and display the reason.
4. WHILE an Admin_Session is active, THE Admin_Panel SHALL allow the Admin to mark a Menu_Item as unavailable.
5. WHILE a Menu_Item is marked unavailable, THE Billing_App SHALL hide the Menu_Item from the menu grid.

### Requirement 7: Inventory stock tracking

**User Story:** As an Admin, I want to track stock quantities for items, so that I know what is running low.

#### Acceptance Criteria

1. WHERE stock tracking is enabled for a Menu_Item, THE Admin_Panel SHALL display the Stock_Quantity and Low_Stock_Threshold of the Menu_Item.
2. WHERE stock tracking is enabled for a Menu_Item, WHEN the Admin enters a restock amount, THE Billing_App SHALL add the restock amount to the Stock_Quantity.
3. WHERE stock tracking is enabled for a Menu_Item, WHEN a bill containing the Menu_Item is saved, THE Billing_App SHALL subtract the billed quantity from the Stock_Quantity with a minimum result of 0.
4. WHERE stock tracking is enabled for a Menu_Item, WHILE the Stock_Quantity is at or below the Low_Stock_Threshold, THE Admin_Panel SHALL display a low-stock indicator next to the Menu_Item.
5. WHERE stock tracking is enabled for a Menu_Item, WHILE the Stock_Quantity is 0, THE Billing_App SHALL display an "Out of stock" label on the menu card.

### Requirement 8: Inventory persistence and first-run setup

**User Story:** As an Admin, I want my item and price changes to persist, so that I do not lose them after closing the browser.

#### Acceptance Criteria

1. WHEN the Billing_App loads and the Inventory is empty, THE Billing_App SHALL populate the Inventory from the current built-in menu list.
2. WHEN the Billing_App loads and the Inventory contains Menu_Items, THE Billing_App SHALL build the menu grid from the Inventory.
3. WHEN the Admin changes a Menu_Item, THE Billing_App SHALL save the change so that the change remains after a browser restart.
4. WHILE an Admin_Session is active, THE Admin_Panel SHALL provide export of the Inventory to a JSON file and import of the Inventory from a JSON file.
5. IF an imported file is not valid Inventory JSON, THEN THE Admin_Panel SHALL reject the import, keep the current Inventory, and display the message "Invalid inventory file".

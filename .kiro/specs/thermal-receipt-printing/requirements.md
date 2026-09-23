# Requirements Document

## Introduction

This feature adds thermal printer support to the Best Fruits Stall billing system using ESC/POS commands. The system currently displays bills in the browser with preference symbols (shaded squares for ice/sugar preferences). The thermal printing feature must preserve these exact visual symbols in the printed output so thermal receipts match the browser display.

## Glossary

- **Billing System**: The Best Fruits Stall web-based point-of-sale application that manages orders and generates bills
- **ESC/POS**: Epson Standard Code for Point of Sale - a printer command protocol for thermal receipt printers
- **Thermal Printer**: A receipt printer that uses heat to print on thermal paper
- **Preference Symbol**: Visual indicators showing juice customization options (ice and sugar level)
- **Shaded Block**: A fully filled square character (■) representing one preference state
- **Outline Block**: A hollow or half-shaded square character (□ or ▪) representing an alternate preference state
- **Bill Item**: A line item on a receipt showing item name, quantity, price, and preferences

## Requirements

### Requirement 1

**User Story:** As a stall operator, I want to print receipts on a thermal printer so that I can provide customers with physical proof of purchase

#### Acceptance Criteria

1. WHEN THE Billing System receives a print command, THE Billing System SHALL generate an ESC/POS formatted receipt
2. THE Billing System SHALL send the ESC/POS data to the connected thermal printer
3. WHEN printing completes successfully, THE Billing System SHALL display a success confirmation to the operator
4. IF the thermal printer is unavailable, THEN THE Billing System SHALL display an error message to the operator

### Requirement 2

**User Story:** As a stall operator, I want preference symbols to appear identically on both screen and printed receipts so that staff can quickly identify order customizations

#### Acceptance Criteria

1. THE Billing System SHALL display preference symbols next to each bill item on screen
2. THE Billing System SHALL include the same preference symbols in the thermal printed output
3. WHEN the item has "With Ice" preference, THE Billing System SHALL print a fully shaded block character (■)
4. WHEN the item has "Without Ice" preference, THE Billing System SHALL print an outline or half-shaded block character (□ or ▪)
5. WHEN the item has "Normal Sugar" preference, THE Billing System SHALL print a fully shaded block character (■)
6. WHEN the item has "Less Sugar" or "No Sugar" preference, THE Billing System SHALL print an outline or half-shaded block character (□ or ▪)

### Requirement 3

**User Story:** As a customer, I want to see my order details clearly on the printed receipt so that I can verify my purchase

#### Acceptance Criteria

1. THE Billing System SHALL print the bill number at the top of the receipt
2. THE Billing System SHALL print customer name if provided
3. THE Billing System SHALL print date and time on the receipt
4. THE Billing System SHALL print each item with name, quantity, unit price, and total price
5. THE Billing System SHALL print subtotal, any applicable taxes or discounts, and grand total
6. THE Billing System SHALL use a readable font size suitable for thermal receipts

### Requirement 4

**User Story:** As a stall operator, I want the thermal receipt format to match the browser layout so that there is visual consistency

#### Acceptance Criteria

1. THE Billing System SHALL format printed items in the same sequence as displayed on screen
2. THE Billing System SHALL position preference symbols immediately adjacent to the item name on printed receipts
3. THE Billing System SHALL maintain the visual distinction between shaded and outline symbols in print output
4. THE Billing System SHALL preserve all item specifications including size variations on printed receipts

# Requirements Document

## Introduction

This feature introduces a dual-printer bill system and file organization improvements for the Best Fruits Stall ordering system. The system will support two distinct bill formats: a detailed customer receipt (Printer 1) with itemized line items including quantity and price, and a simplified kitchen order ticket (Printer 2) that retains the current format.

## Glossary

- **System**: The Best Fruits Stall order management and printing system
- **Printer 1**: The customer-facing thermal printer that prints itemized receipts
- **Printer 2**: The kitchen-facing thermal printer that prints simplified order tickets
- **Customer Receipt**: Detailed bill showing item names, quantities, prices, and total amount
- **Kitchen Ticket**: Simplified order showing item names with preference symbols for preparation
- **Bill Data**: The order information containing items, quantities, prices, and customer details
- **Documents Folder**: A centralized directory containing all documentation and test files

## Requirements

### Requirement 1

**User Story:** As a business owner, I want all documentation and test files organized in a dedicated folder, so that the project structure is clean and maintainable

#### Acceptance Criteria

1. WHEN the System reorganizes files, THE System SHALL move all markdown documentation files to the documents folder
2. WHEN the System reorganizes files, THE System SHALL move all HTML test files to the documents folder
3. WHEN the System reorganizes files, THE System SHALL move all JavaScript test files to the documents folder
4. WHEN the System reorganizes files, THE System SHALL preserve the original file names and contents during the move
5. THE System SHALL create a documents folder in the project root if it does not exist

### Requirement 2

**User Story:** As a cashier, I want to print detailed customer receipts on Printer 1, so that customers receive itemized bills with quantities and prices

#### Acceptance Criteria

1. WHEN Printer 1 prints a receipt, THE System SHALL include each item name on the receipt
2. WHEN Printer 1 prints a receipt, THE System SHALL include the quantity for each item on the receipt
3. WHEN Printer 1 prints a receipt, THE System SHALL include the unit price for each item on the receipt
4. WHEN Printer 1 prints a receipt, THE System SHALL calculate and display the line total for each item
5. WHEN Printer 1 prints a receipt, THE System SHALL calculate and display the grand total at the bottom of the receipt

### Requirement 3

**User Story:** As a kitchen staff member, I want Printer 2 to continue using the current simplified format, so that I can focus on item preparation without price distractions

#### Acceptance Criteria

1. WHEN Printer 2 prints a ticket, THE System SHALL use the existing receipt format
2. WHEN Printer 2 prints a ticket, THE System SHALL display preference symbols for ice and sugar preferences
3. WHEN Printer 2 prints a ticket, THE System SHALL exclude price information from the ticket
4. WHEN Printer 2 prints a ticket, THE System SHALL exclude quantity information from the ticket
5. THE System SHALL maintain backward compatibility with the existing kitchen printing workflow

### Requirement 4

**User Story:** As a system administrator, I want to configure which printer prints which format, so that I can assign appropriate printers to customer and kitchen roles

#### Acceptance Criteria

1. THE System SHALL provide a mechanism to designate Printer 1 as the customer receipt printer
2. THE System SHALL provide a mechanism to designate Printer 2 as the kitchen ticket printer
3. WHEN printing an order, THE System SHALL route customer receipts to Printer 1
4. WHEN printing an order, THE System SHALL route kitchen tickets to Printer 2
5. THE System SHALL allow independent printer connections for Printer 1 and Printer 2

# Requirements Document

## Introduction

The Billing_App prints a Customer_Receipt on Printer 1 and a Kitchen_Ticket on Printer 2. Three problems exist today: the Customer_Receipt shows connection details (hosting account and IP address) above the Shop_Title, the Customer_Receipt columns are misaligned, and the Shop_Title and Bill_Number do not stand out. This feature removes the connection details, aligns the Customer_Receipt, and emphasises the Shop_Title initials and the Bill_Number on both printed documents.

## Glossary

- **Billing_App**: The browser-based point-of-sale application served by index.html.
- **Customer_Receipt**: The priced, itemised ESC/POS document printed on Printer 1.
- **Kitchen_Ticket**: The unpriced ESC/POS document printed on Printer 2.
- **Shop_Title**: The shop name "Best Fruits Stall" printed at the top of each document.
- **Title_Initial**: The first letter of each word in the Shop_Title (B, F and S).
- **Bill_Number**: The bill identifier printed after "Bill: #".
- **Print_Job**: The byte sequence the Billing_App sends to a Printer.
- **Print_Server**: The local Node.js server (print-server.js) that forwards a Print_Job to a Printer over a raw TCP connection.
- **Connection_Details**: Text produced by a network request, such as HTTP request headers containing a hosting account name or an IP address.
- **Line_Width**: The 48 characters available on one line of 80 mm paper.
- **Emphasis_Level**: The combination of bold, double-strike and enlarged character size applied to printed text.

## Requirements

### Requirement 1

**User Story:** As a shop owner, I want the Customer_Receipt to contain only bill content, so that customers do not see my hosting account or network addresses.

#### Acceptance Criteria

1. WHEN the Billing_App prints a Customer_Receipt through the Print_Server, THE Customer_Receipt SHALL start with the Shop_Title.
2. WHEN the Billing_App sends a Print_Job, THE Billing_App SHALL deliver the Print_Job to the Printer as ESC/POS bytes only.
3. IF a Printer address is configured as a direct printer address instead of the Print_Server, THEN THE Billing_App SHALL display a warning that the Printer may print Connection_Details.
4. THE Billing_App SHALL write no hosting account name or IP address into the bytes of any Print_Job.

### Requirement 2

**User Story:** As a shop owner, I want the Customer_Receipt columns to line up, so that customers can read item names, quantities and prices easily.

#### Acceptance Criteria

1. THE Customer_Receipt SHALL print every line within the Line_Width of 48 characters.
2. THE Customer_Receipt SHALL measure each currency value by its printed length, including the "Rs." prefix, when padding columns.
3. THE Customer_Receipt SHALL right-align the QTY, PRICE and TOTAL columns to the same character positions on the header line and on every item line.
4. THE Customer_Receipt SHALL right-align the SUBTOTAL label and value to the right edge of the Line_Width.
5. WHEN an item name is longer than the ITEM column, THE Customer_Receipt SHALL truncate the item name to the ITEM column width.

### Requirement 3

**User Story:** As a shop owner, I want the first letter of each shop-name word to stand out, so that the brand initials B, F and S are noticeable on both documents.

#### Acceptance Criteria

1. THE Customer_Receipt SHALL print each Title_Initial at a larger character size than the remaining letters of the Shop_Title.
2. THE Kitchen_Ticket SHALL print each Title_Initial at a larger character size than the remaining letters of the Shop_Title.
3. THE Customer_Receipt SHALL print each Title_Initial with bold and double-strike enabled.
4. THE Kitchen_Ticket SHALL print each Title_Initial with bold and double-strike enabled.
5. THE Customer_Receipt and THE Kitchen_Ticket SHALL print the Shop_Title with the words "Best", "Fruits" and "Stall" separated by single spaces and centred on the line.

### Requirement 4

**User Story:** As a shop owner, I want the Bill_Number to be as dark as the shop name, so that staff can find the bill quickly.

#### Acceptance Criteria

1. THE Customer_Receipt SHALL print the Bill_Number at the same Emphasis_Level as the Shop_Title letters that are not Title_Initials.
2. THE Kitchen_Ticket SHALL print the Bill_Number at the same Emphasis_Level as the Shop_Title letters that are not Title_Initials.
3. THE Customer_Receipt SHALL print the Bill_Number and the date within the Line_Width.
4. THE Kitchen_Ticket SHALL print the Bill_Number and the date within the Line_Width.

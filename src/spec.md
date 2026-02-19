# Specification

## Summary
**Goal:** Split multi-invoice payments into separate rows in the Excel export so each invoice appears on its own line.

**Planned changes:**
- Modify the Excel/CSV export logic to detect when a payment covers multiple invoices (comma-separated invoice numbers)
- Split such payments into multiple rows, one per invoice, duplicating all payment details across each row
- Ensure each row shows only a single invoice number instead of comma-separated values

**User-visible outcome:** When exporting the payment report to Excel, payments that cover multiple invoices (like the highlighted ABMNG_D0553 row with invoices ABMNG-25-I102812, ABMNG-25-I104507) will appear as separate rows with identical payment details but individual invoice numbers.

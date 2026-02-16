# Specification

## Summary
**Goal:** Show the correct mode-specific payment date (RTGS/NEFT/UPI vs Cheque) in on-screen Reports and exported reports, while persisting these dates per payment entry.

**Planned changes:**
- Extend the backend `PaymentEntry` model to store optional `chequeDate` and `bankTransferDate`, and wire them through `addPayment` and `editPayment`.
- Update payment entry and edit-payment UI to send and allow updating the relevant mode-specific date field based on the selected payment mode.
- Update the Reports ledger table to display a single “Payment Date” column derived by mode: `bankTransferDate` for NEFT/RTGS/UPI, `chequeDate` for Cheque, otherwise fall back to `createdTimestamp`.
- Update the exported CSV report to include/update a “Payment Date” column with the same mode-based semantics as the on-screen report.
- Add an upgrade migration so existing stored payments remain intact and the new date fields default to `null`.

**User-visible outcome:** In Reports (and in the exported CSV), users see “Payment Date” as the RTGS/transfer date for NEFT/RTGS/UPI payments and the cheque date for cheque payments; older entries still display a sensible fallback date without errors.

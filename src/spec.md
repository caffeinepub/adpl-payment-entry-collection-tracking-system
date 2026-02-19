# Specification

## Summary
**Goal:** Fix batch payment functionality to allow selecting multiple invoices for a single RTGS or cheque payment.

**Planned changes:**
- Fix invoice selector in BatchPaymentEntryPage to enable multi-select for unpaid/partially paid invoices
- Update BatchPaymentForm to accept multiple invoices with single RTGS payment (transaction ID and date)
- Update BatchPaymentForm to accept multiple invoices with single cheque payment (bank name, cheque number, date)
- Display total amount across all selected invoices in the payment form
- Ensure backend properly processes batch payments, updating all invoice statuses and balances

**User-visible outcome:** Users can select multiple invoices from one or more retailers and process them as a single batch payment using either RTGS/online transfer or cheque payment mode, with all invoices sharing the same payment reference details.

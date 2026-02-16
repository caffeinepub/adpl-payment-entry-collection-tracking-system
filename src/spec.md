# Specification

## Summary
**Goal:** Make invoice clean-up safer and easier by clarifying the destructive reset action and adding an “Ageing Days” indicator with sorting in the invoices list.

**Planned changes:**
- Update the Admin Invoice Management page to show the existing destructive reset action as a clearly labeled **“Clear Old Data”** button (admin-only), while keeping the existing confirmation dialog and existing mutation/toast behavior.
- Add an **“Ageing Days”** column to the invoices table, computed client-side as the integer number of days from each invoice’s **Invoice Date** to today.
- Add a UI sort control for **Ageing Days** that toggles between **oldest-first** and **newest-first**, with the current sort direction visible, and ensure it works alongside existing search/filter behavior.
- Handle unparseable invoice dates safely by displaying a fallback (e.g., “—”) and sorting those rows consistently (e.g., at the bottom) without runtime errors.

**User-visible outcome:** Admins see a clearly named “Clear Old Data” button with confirmation before wiping data, and all users can view invoice ageing in days and sort invoices to prioritize the oldest (or newest) invoices.

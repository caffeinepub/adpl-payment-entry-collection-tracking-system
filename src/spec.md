# Specification

## Summary
**Goal:** Add an invoice upload template download on the Admin “Invoice Management” (Raw Data Upload) page that includes an optional “Ageing Days” column, without impacting upload compatibility.

**Planned changes:**
- Add a visible button/link on the Admin Invoice Management (Raw Data Upload) page to download an invoice upload template (CSV or tab-separated).
- Update the template header to include all existing required columns plus an additional column named exactly “Ageing Days”.
- Keep the upload/import behavior compatible: accept files with or without the “Ageing Days” column and ignore any provided “Ageing Days” values during import.
- Update the “Required columns” help text to state that “Ageing Days” is optional and will be auto-calculated in the app.

**User-visible outcome:** Admin users can download a template that includes an “Ageing Days” column for their working sheet, and uploads will still succeed whether or not that column is included.

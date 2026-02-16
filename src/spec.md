# Specification

## Summary
**Goal:** Make the post-login onboarding and role/profile bootstrap non-blocking so first-time authenticated users can access the app without getting stuck.

**Planned changes:**
- Update the post-login onboarding flow so missing user profile does not block access (no forced always-open modal); allow continuing to the app with an optional profile setup path.
- Relax backend authorization for first-time authenticated users so they can read/create their own profile and fetch an effective default role (reject anonymous only).
- Adjust authenticated routing/layout to handle missing/unknown role gracefully by defaulting to a non-admin experience while data is absent/loading, and only show admin navigation when role is explicitly "admin".

**User-visible outcome:** After logging in with Internet Identity, users can reach and use the Invoices page even if they have no profile yet, can skip/defer profile setup, and the app remains usable with non-admin navigation unless they are explicitly an admin.

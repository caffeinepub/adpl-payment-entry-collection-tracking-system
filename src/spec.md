# Specification

## Summary
**Goal:** Allow admins to promote/demote user accounts between User and Admin roles, with clear UI/UX messaging and persistent authorization that immediately enables admin-only actions.

**Planned changes:**
- Add an admin-only backend method to set a target user’s effective role (User/Admin), persisting the change and returning clear errors for unauthorized callers or unknown users.
- Add an admin-only “User Management” UI section that lists users and their current effective roles, and allows promote/demote with confirmation and post-update UI refresh (cache invalidation).
- Remove/disable any self-service role selection in profile setup for non-admin users and ensure role labels/navigation gating reflect the effective authorization role (not a user-editable field).
- Add English guidance and access-denied messaging across relevant screens and endpoints explaining that only admins can grant admin access.

**User-visible outcome:** Admins can manage which users are Admins from within the app, promoted users gain access to admin-only features after refresh/navigation, and non-admins see clear English messaging that they need admin permission (with no misleading self-promotion UI).

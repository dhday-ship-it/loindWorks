# Implementation Plan: Code Quality Refactor

## Overview

Incremental refactoring of the LOIND-WORKSPACE application targeting metadata/branding, type consolidation, constants consolidation, font loading, component decomposition, polling optimization, optimistic update error handling, admin lazy loading, auth guard cleanup, and unused file removal. Each task group is independently verifiable via `next build`. No new third-party dependencies are introduced.

## Tasks

- [x] 1. Metadata, branding, and favicon
  - [x] 1.1 Update root layout metadata and lang attribute
    - In `src/app/layout.tsx`, set `metadata.title` to "LOIND WORKS", add `metadata.description` for internal workspace, add `metadata.icons` pointing to `/favicon.svg`
    - Set `lang="ko"` on the `<html>` element
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Create SVG favicon
    - Create `public/favicon.svg` with a 32×32 viewbox, dark background (`#0e1116`), rounded rect, and letter "L" in brand color (`#8fa8c4`)
    - _Requirements: 1.4_

- [x] 2. Type consolidation
  - [x] 2.1 Create `src/types/shared.ts` with canonical type definitions
    - Define `Person`, `CalendarEventItem`, and `ProjectSummary` interfaces
    - `ProjectSummary` unifies both staff-home (required: `id`, `name`, `status`) and staff-projects (optional: `summary`, `statusNote`) shapes
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Migrate imports across all consuming modules
    - Update `src/components/staff-home/types.ts` to import from `src/types/shared.ts` instead of defining or re-exporting `Person` and `CalendarEventItem`
    - Update `src/components/staff-projects/types.ts` to import from `src/types/shared.ts`
    - Update any other files importing from `src/components/calendar/types.ts`
    - _Requirements: 2.4, 2.5_

  - [x] 2.3 Remove duplicate type source files
    - Delete `src/components/calendar/types.ts` (or remove the duplicate `Person`/`CalendarEventItem` exports if the file contains other types)
    - Remove re-export statements from staff-home and staff-projects type files
    - Verify `tsc --noEmit` passes with zero errors
    - _Requirements: 2.5, 2.6, 11.1_

- [x] 3. Constants consolidation
  - [x] 3.1 Create `src/lib/constants.ts`
    - Define `STATUS_LABEL`, `STATUS_STYLE`, `PRIORITY_DOT`, and `STATUS_ORDER` as specified in the design
    - _Requirements: 3.1_

  - [x] 3.2 Replace inline constants in consuming components
    - Update `src/components/staff-home/WorkStationPanel.tsx` to import from `src/lib/constants.ts` and remove inline definitions
    - Update `src/components/staff-projects/KanbanBoard.tsx` to import from `src/lib/constants.ts` and remove inline definitions
    - Verify build passes
    - _Requirements: 3.2, 3.3, 3.4, 11.2_

- [x] 4. Font loading optimization
  - [x] 4.1 Centralize font instantiation in root layout
    - Add `Bebas_Neue` and `DM_Sans` instantiations in `src/app/layout.tsx` alongside existing Geist fonts
    - Expose as CSS custom properties via class variables on `<html>`
    - _Requirements: 4.1_

  - [x] 4.2 Add CSS variable theme entries in `globals.css`
    - Add `--font-bebas` and `--font-dm` to the `@theme inline` block
    - _Requirements: 4.1_

  - [x] 4.3 Replace local font instantiations in components
    - Remove `Bebas_Neue` and `DM_Sans` imports/instantiations from `StaffHome.tsx`
    - Remove same from `SuperAdminDashboard.tsx`
    - Replace `className={bebasNeue.className}` usages with CSS variable references (`font-[family-name:var(--font-bebas)]` or Tailwind utility)
    - Verify build passes
    - _Requirements: 4.2, 4.3, 4.4, 11.2_

- [x] 5. Checkpoint – Foundations verified
  - Ensure `next build` passes. All foundational changes (metadata, types, constants, fonts) are complete. Ask the user if questions arise.

- [x] 6. Component decomposition of StaffHome
  - [x] 6.1 Create `DashboardLayout` component
    - Create `src/components/layout/DashboardLayout.tsx` with props: `nav`, `sidebar`, `main`, `rightPanel`
    - Provide the overall grid shell structure extracted from StaffHome
    - _Requirements: 5.1, 5.5_

  - [x] 6.2 Create `DashboardNav` component
    - Create `src/components/layout/DashboardNav.tsx` with props for current user, unread count, and notification handler
    - Extract top navigation bar rendering from StaffHome
    - _Requirements: 5.5_

  - [x] 6.3 Create `ProjectSidebar` component
    - Create `src/components/layout/ProjectSidebar.tsx` with props for projects list, active view, and selection handler
    - Extract sidebar rendering from StaffHome
    - _Requirements: 5.2, 5.5_

  - [x] 6.4 Create `ProfileCard` component
    - Create `src/components/staff-home/ProfileCard.tsx` with props for user info and statistics
    - Extract profile section rendering from StaffHome
    - _Requirements: 5.3, 5.5_

  - [x] 6.5 Create `TaggedItemsList` component
    - Create `src/components/staff-home/TaggedItemsList.tsx` with props for tagged items array
    - Extract tagged items rendering from StaffHome
    - _Requirements: 5.4, 5.5_

  - [x] 6.6 Refactor `StaffHome.tsx` to compose extracted components
    - Replace inline rendering with composed `DashboardLayout`, `DashboardNav`, `ProjectSidebar`, `ProfileCard`, `TaggedItemsList`
    - Ensure StaffHome.tsx body is under 100 lines (excluding imports)
    - Verify build passes
    - _Requirements: 5.6, 5.7, 11.2_

- [x] 7. Polling optimization
  - [x] 7.1 Create `usePolling` hook
    - Create `src/lib/hooks/usePolling.ts` implementing the interface from design (url, interval, enabled, onData)
    - Include visibility-based pause, cleanup on unmount, and refresh callback
    - _Requirements: 6.4_

  - [ ]* 7.2 Write unit tests for `usePolling`
    - Test polling starts when enabled=true, stops when enabled=false
    - Test interval clears on unmount
    - Test visibility change pauses/resumes polling
    - _Requirements: 6.4_

  - [x] 7.3 Integrate `usePolling` into StaffHome and ProjectContent
    - Replace existing `setInterval`/fetch logic in StaffHome with `usePolling`
    - Set `enabled` to false when project detail view is active
    - Ensure only the active view's polling executes
    - Verify build passes
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 11.2_

- [x] 8. Optimistic update error handling
  - [x] 8.1 Create shared Toast component and hook
    - Create `src/components/ui/Toast.tsx` with `ToastContainer` and `useToast` hook
    - Support success, error, info types with brand colors
    - Auto-dismiss after 3 seconds, slide-up/fade-out animations
    - _Requirements: 7.4_

  - [x] 8.2 Implement optimistic rollback in ProjectContent
    - Add rollback logic to `onStatusChange`: capture previous state, revert on API failure, show error toast
    - Add rollback logic to `onReorder`: same pattern
    - Add rollback logic to `onEdit`: same pattern
    - Add `inFlight` ref to prevent duplicate submissions
    - Wire `useToast` into ProjectContent
    - Verify build passes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.2_

  - [ ]* 8.3 Write unit tests for optimistic update helpers
    - Test rollback restores previous state on simulated failure
    - Test in-flight guard prevents duplicate calls
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 9. Checkpoint – Core features verified
  - Ensure `next build` passes. Component decomposition, polling, and optimistic updates are complete. Ask the user if questions arise.

- [x] 10. Admin page lazy loading
  - [x] 10.1 Create admin API routes
    - Create `src/app/api/admin/accounts/route.ts` returning user list with `requireSuperAdmin()` auth
    - Create `src/app/api/admin/companies/route.ts` returning companies list
    - Create `src/app/api/admin/projects/route.ts` returning projects + staff options
    - Create `src/app/api/admin/records/route.ts` returning project records
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Modify `admin/page.tsx` to fetch stats only
    - Remove full data fetching from the server component
    - Fetch only overview statistics and pass to SuperAdminDashboard
    - _Requirements: 8.1_

  - [x] 10.3 Refactor SuperAdminDashboard for lazy tab loading
    - On tab switch, fetch from corresponding `/api/admin/*` route
    - Cache fetched data in component state
    - Show loading skeleton while data is loading
    - Show error state with retry button on fetch failure
    - Remove the duplicate `Toast.tsx` from super-admin (use shared `ui/Toast.tsx`)
    - Verify build passes
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 11.2_

- [x] 11. Auth guard cleanup
  - [x] 11.1 Annotate and document auth guards
    - Add JSDoc comments to `requireUser()`, `requireStaff()`, `requirePM()`, `requireSuperAdmin()` in `src/lib/auth-guards.ts`
    - Clearly explain that `requireStaff()` permits all authenticated roles and exists as a semantic boundary
    - If `requireStaff()` is determined to be identical to `requireUser()`, add a comment noting the equivalence and suggesting consolidation
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 12. Cleanup unused files
  - [x] 12.1 Remove legacy and relocate reference files
    - Delete `legacy/LOGIN.html`
    - Move `loind-color-system.html` from project root to `docs/design/loind-color-system.html`
    - _Requirements: 10.1, 10.2_

  - [x] 12.2 Update `.gitignore`
    - Add `.env*` pattern to `.gitignore` if not already present
    - _Requirements: 10.3, 10.4_

- [x] 13. Final checkpoint – Full build verification
  - Run `next build` and verify zero errors
  - Verify no unused imports remain (ESLint)
  - Confirm no circular dependencies introduced
  - Ask the user if questions arise
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster delivery
- Each checkpoint verifies the build passes before proceeding to dependent tasks
- Type consolidation (task 2) MUST complete before component decomposition (task 6) since extracted components depend on shared types
- Constants consolidation (task 3) MUST complete before component decomposition (task 6) since WorkStationPanel uses shared constants
- Font optimization (task 4) MUST complete before component decomposition (task 6) since StaffHome currently instantiates fonts locally
- The shared Toast component (task 8.1) MUST exist before admin lazy loading (task 10.3) which removes the duplicate Toast from super-admin
- No property-based tests are included because this refactoring involves UI composition, structural file moves, and configuration — none of which produce pure functions with meaningful input variation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 2, "tasks": ["2.3", "4.2"] },
    { "id": 3, "tasks": ["4.3", "6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["6.4", "6.5", "7.1"] },
    { "id": 5, "tasks": ["6.6", "7.2", "8.1"] },
    { "id": 6, "tasks": ["7.3", "8.2", "11.1"] },
    { "id": 7, "tasks": ["8.3", "10.1"] },
    { "id": 8, "tasks": ["10.2", "12.1", "12.2"] },
    { "id": 9, "tasks": ["10.3"] }
  ]
}
```

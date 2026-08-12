# Requirements Document

## Introduction

Comprehensive code quality refactoring and maintenance improvement for the LOIND-WORKSPACE internal project management application. The application is built with Next.js 16.3 App Router, TypeScript, Tailwind CSS 4, Prisma 7.9, and NextAuth v5. This refactoring addresses component decomposition, performance optimization, type consolidation, branding corrections, and codebase hygiene without altering existing user-facing behavior.

## Glossary

- **StaffHome**: The main dashboard component (`src/components/staff-home/StaffHome.tsx`) displaying project sidebar, profile, calendar, and tagged items for staff users
- **ProjectContent**: The project detail view component (`src/components/staff-projects/ProjectContent.tsx`) that displays tasks, logs, and requests within a selected project
- **Polling_Interval**: A recurring `setInterval` or SWR/React Query `refetchInterval` that periodically fetches fresh data from the server
- **Optimistic_Update**: A UI pattern where the interface reflects a change immediately before the server confirms success
- **Admin_Dashboard**: The super admin page (`src/app/admin/page.tsx`) that loads accounts, companies, projects, and records data
- **Auth_Guard**: Server-side functions (`src/lib/auth-guards.ts`) that check session and role before rendering a page
- **Shared_Types**: TypeScript type definitions used across multiple feature modules, currently defined in `src/components/calendar/types.ts` and re-exported in feature-specific type files
- **Layout_Root**: The root layout component (`src/app/layout.tsx`) responsible for HTML metadata, font loading, and global providers
- **KanbanBoard**: The kanban board component (`src/components/staff-projects/KanbanBoard.tsx`) for task management
- **WorkStationPanel**: The work station panel component (`src/components/staff-home/WorkStationPanel.tsx`) displaying task status in the home dashboard

## Requirements

### Requirement 1: Metadata and Branding Correction

**User Story:** As a staff member, I want the application to display correct branding and locale information, so that the workspace feels polished and professional.

#### Acceptance Criteria

1. THE Layout_Root SHALL set the HTML document title to "LOIND WORKS"
2. THE Layout_Root SHALL set the `lang` attribute of the `<html>` element to "ko"
3. THE Layout_Root SHALL include a meta description appropriate for an internal workspace application
4. THE Application SHALL serve an SVG favicon displaying the letter "L" as a text-based icon
5. WHEN a user opens any page, THE Browser_Tab SHALL display "LOIND WORKS" as the page title

### Requirement 2: Type Consolidation

**User Story:** As a developer, I want shared types defined in a single canonical location, so that type changes propagate consistently and duplicate definitions do not diverge.

#### Acceptance Criteria

1. THE Codebase SHALL define the `Person` type exclusively in `src/types/shared.ts`
2. THE Codebase SHALL define the `CalendarEventItem` type exclusively in `src/types/shared.ts`
3. THE Codebase SHALL define a unified `ProjectSummary` type in `src/types/shared.ts` that satisfies both the staff-home fields (`id`, `name`, `status`) and the staff-projects fields (`id`, `name`, `status`, `summary`, `statusNote`)
4. WHEN a module requires `Person`, `CalendarEventItem`, or `ProjectSummary`, THE Module SHALL import from `src/types/shared.ts`
5. THE Codebase SHALL remove all duplicate type definitions and re-exports of `Person` and `CalendarEventItem` from `src/components/calendar/types.ts`, `src/components/staff-home/types.ts`, and `src/components/staff-projects/types.ts`
6. WHEN a type in `src/types/shared.ts` is modified, THE TypeScript_Compiler SHALL report errors in all consuming modules that depend on the changed shape

### Requirement 3: Constants Consolidation

**User Story:** As a developer, I want shared UI constants defined in a single location, so that styling and labeling remain consistent across components and changes need only be made once.

#### Acceptance Criteria

1. THE Codebase SHALL define `PRIORITY_DOT`, `STATUS_LABEL`, and `STATUS_STYLE` constants in `src/lib/constants.ts`
2. WHEN WorkStationPanel requires priority or status display constants, THE WorkStationPanel SHALL import them from `src/lib/constants.ts`
3. WHEN KanbanBoard requires priority or status display constants, THE KanbanBoard SHALL import them from `src/lib/constants.ts`
4. THE Codebase SHALL remove all inline definitions of `PRIORITY_DOT`, `STATUS_LABEL`, and `STATUS_STYLE` from WorkStationPanel.tsx and KanbanBoard.tsx

### Requirement 4: Font Loading Optimization

**User Story:** As a developer, I want font definitions centralized in the root layout, so that fonts are loaded once and shared via CSS variables rather than being instantiated multiple times.

#### Acceptance Criteria

1. THE Layout_Root SHALL instantiate `Bebas_Neue` and `DM_Sans` fonts and expose them as CSS custom properties
2. WHEN StaffHome renders, THE StaffHome SHALL reference `Bebas_Neue` and `DM_Sans` via CSS variables instead of instantiating font objects locally
3. WHEN SuperAdminDashboard renders, THE SuperAdminDashboard SHALL reference `Bebas_Neue` and `DM_Sans` via CSS variables instead of instantiating font objects locally
4. THE Codebase SHALL remove all local `Bebas_Neue` and `DM_Sans` instantiations from StaffHome.tsx and SuperAdminDashboard.tsx

### Requirement 5: Component Decomposition of StaffHome

**User Story:** As a developer, I want StaffHome.tsx decomposed into focused, single-responsibility components, so that each piece is easier to understand, test, and maintain independently.

#### Acceptance Criteria

1. THE Codebase SHALL extract a `DashboardLayout` component responsible for the overall grid/shell structure of the staff home view
2. THE Codebase SHALL extract a `ProjectSidebar` component responsible for rendering the list of projects with navigation
3. THE Codebase SHALL extract a `ProfileCard` component responsible for displaying the current user's profile information
4. THE Codebase SHALL extract a `TaggedItemsList` component responsible for rendering tagged requests and logs
5. WHEN any extracted component is rendered, THE Component SHALL accept a clearly-defined props interface
6. WHEN StaffHome renders, THE StaffHome SHALL compose `DashboardLayout`, `ProjectSidebar`, `ProfileCard`, and `TaggedItemsList` without duplicating their internal logic
7. THE StaffHome.tsx file SHALL contain fewer than 100 lines after decomposition (excluding imports)

### Requirement 6: Polling Optimization

**User Story:** As a user, I want the application to avoid redundant background polling, so that network requests are minimized and the browser performs efficiently.

#### Acceptance Criteria

1. WHILE a user is viewing the project detail view (ProjectContent), THE StaffHome polling interval SHALL pause
2. WHILE a user is viewing the staff home dashboard, THE StaffHome polling interval SHALL be active with an 8-second refresh cycle
3. WHEN a user navigates from project view back to home view, THE StaffHome polling interval SHALL resume immediately
4. THE Application SHALL provide a shared polling mechanism (hook or context) that allows multiple components to coordinate their polling state
5. IF both StaffHome and ProjectContent attempt to poll simultaneously, THEN THE Shared_Polling_Mechanism SHALL ensure only the active view's polling executes

### Requirement 7: Optimistic Update Error Handling

**User Story:** As a user, I want failed actions to be rolled back visually with an error notification, so that I am never left with a stale or incorrect UI state.

#### Acceptance Criteria

1. IF an API call for `onStatusChange` fails after an optimistic update in ProjectContent, THEN THE ProjectContent SHALL revert the task status to its previous value
2. IF an API call for `onReorder` fails after an optimistic update in ProjectContent, THEN THE ProjectContent SHALL revert the task order to its previous arrangement
3. IF an API call for `onEdit` fails after an optimistic update in ProjectContent, THEN THE ProjectContent SHALL revert the edited field to its previous value
4. WHEN an optimistic update rollback occurs, THE Application SHALL display an error feedback message to the user
5. WHILE an API call is in flight after an optimistic update, THE Application SHALL prevent duplicate submissions of the same action

### Requirement 8: Admin Page Lazy Loading

**User Story:** As a super admin, I want the admin dashboard to load quickly with only essential data upfront, so that I do not wait for all tab data before interacting with the page.

#### Acceptance Criteria

1. WHEN the admin page initially loads, THE Admin_Dashboard SHALL fetch only overview statistics data
2. WHEN a user switches to the "accounts" tab, THE Admin_Dashboard SHALL fetch accounts data on demand
3. WHEN a user switches to the "companies" tab, THE Admin_Dashboard SHALL fetch companies data on demand
4. WHEN a user switches to the "projects" tab, THE Admin_Dashboard SHALL fetch projects data on demand
5. WHEN a user switches to the "records" tab, THE Admin_Dashboard SHALL fetch records data on demand
6. WHILE tab data is loading, THE Admin_Dashboard SHALL display a loading indicator within the tab panel
7. WHEN tab data has been previously loaded in the same session, THE Admin_Dashboard SHALL use cached data instead of re-fetching

### Requirement 9: Auth Guard Cleanup

**User Story:** As a developer, I want auth guard functions to have clear and distinct purposes, so that the role-based access control intent is immediately understandable.

#### Acceptance Criteria

1. THE Codebase SHALL annotate `requireStaff()` with a comment explaining that it permits all authenticated roles (STAFF, PM, SUPER_ADMIN) and exists as a semantic boundary for future role-specific restrictions
2. IF `requireStaff()` is functionally equivalent to `requireUser()` and the team decides to remove it, THEN THE Codebase SHALL replace all call sites of `requireStaff()` with `requireUser()`
3. WHEN a developer reads `src/lib/auth-guards.ts`, THE File SHALL clearly communicate the intended difference between `requireUser()`, `requireStaff()`, `requirePM()`, and `requireSuperAdmin()`

### Requirement 10: Cleanup Unused Files

**User Story:** As a developer, I want unused legacy files removed from the repository, so that the codebase remains clean and new team members are not confused by dead code.

#### Acceptance Criteria

1. THE Codebase SHALL remove `legacy/LOGIN.html` from the repository
2. THE Codebase SHALL move `loind-color-system.html` from the project root to a `docs/` directory, or remove it if it is no longer referenced
3. THE `.gitignore` file SHALL include `.env*` patterns to prevent environment files from being committed
4. WHEN a developer clones the repository, THE Working_Directory SHALL not contain files unrelated to the active application

### Requirement 11: Non-Functional Constraints

**User Story:** As a developer, I want all refactoring changes to maintain existing behavior, so that users experience no regressions.

#### Acceptance Criteria

1. WHEN any refactoring task is completed, THE TypeScript_Compiler SHALL produce zero type errors on the full project
2. WHEN any refactoring task is completed, THE Next.js build (`next build`) SHALL succeed without errors
3. THE Refactoring SHALL not add new third-party dependencies unless no standard library or existing dependency provides the needed functionality
4. WHEN a logical group of changes is committed, THE Build SHALL pass as verified by `next build`
5. THE Refactoring SHALL preserve all existing user-facing behavior and visual appearance

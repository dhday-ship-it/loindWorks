# Implementation Plan: UI/UX Design Polish

## Overview

Incremental implementation of the LOIND-WORKSPACE visual polish. Each task modifies specific files and builds on the previous step. The language is TypeScript/TSX with Tailwind CSS. All changes are purely presentational — no business logic or API changes.

## Tasks

- [x] 1. Font system setup
  - [x] 1.1 Register Quicksand Bold in layout.tsx
    - Add `Quicksand` import from `next/font/google` with weight `"700"` and variable `--font-quicksand`
    - Add `${quicksand.variable}` to the `<html>` className string
    - Keep all existing fonts (Geist, Geist_Mono, Bebas_Neue, DM_Sans) unchanged
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 2. Logo font replacement across components
  - [x] 2.1 Update DashboardNav logo text
    - Change `font-[family-name:var(--font-bebas)]` to `font-[family-name:var(--font-quicksand)]`
    - Change `tracking-widest` to `tracking-tight`
    - Add `font-bold`
    - _Requirements: 1.3_

  - [x] 2.2 Update DashboardLayout logo text
    - Change `font-[family-name:var(--font-bebas)]` to `font-[family-name:var(--font-quicksand)]`
    - Change `tracking-widest` to `tracking-tight`
    - Add `font-bold`, remove `font-light`
    - _Requirements: 1.4_

  - [x] 2.3 Update SuperAdminDashboard logo text
    - Change `font-[family-name:var(--font-bebas)]` to `font-[family-name:var(--font-quicksand)]`
    - Change `tracking-widest` to `tracking-tight`
    - Add `font-bold`
    - _Requirements: 1.5_

  - [x] 2.4 Fix login page font (remove local DM_Sans)
    - Remove `import { DM_Sans } from "next/font/google"` and local `dmSans` const
    - Replace `${dmSans.className}` with `font-[family-name:var(--font-dm-sans)]` in the `<main>` className
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Button variants and globals.css updates
  - [x] 3.1 Add unified button classes to globals.css
    - Add `.btn-primary` class (brand gradient, 600 weight, 8px radius, 8px 12px padding)
    - Add `.btn-secondary` class (ghost style, white/4 bg, border, 8px radius)
    - Add `.btn-danger` class (red ghost, 8px radius)
    - All three must include `cursor: pointer`, `transition: all 0.18s ease`, `font-weight: 600`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Checkpoint - Verify font and button changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Typography and contrast fixes
  - [x] 5.1 Fix minimum font sizes in globals.css
    - Update `.admin-tbl th` from `font-size: 9px` to `font-size: 10px`
    - _Requirements: 2.3_

  - [x] 5.2 Fix typography in ProjectSidebar
    - Change section header `text-[9px]` to `text-[10px]`
    - _Requirements: 2.3, 7.2_

  - [x] 5.3 Fix typography in WorkStationPanel
    - Change "MY TASKS" label from `text-[10px] text-white/30` to `text-[10px] text-white/40`
    - Change filter pill font from `text-[10px]` (already 10px — OK)
    - Change task title from `text-xs` to `text-[13px]`
    - Change task metadata `text-[9px]` to `text-[10px]`
    - Change low-opacity text `text-white/30` to `text-white/40` minimum
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 7.2, 7.3_

  - [x] 5.4 Fix typography in KanbanBoard
    - Change kanban column header label `text-[10px]` (already OK)
    - Change kanban card due date badge `text-[9px]` to `text-[10px]`
    - Change kanban card assignee name `text-[10px]` (already OK)
    - Change empty column text `text-[10px]` (already OK)
    - Increase low-opacity text from `text-white/15` to `text-white/40`
    - _Requirements: 2.1, 2.4, 7.3_

- [x] 6. Touch targets and click areas
  - [x] 6.1 Fix touch targets in ProjectSidebar
    - Widen sidebar from `w-48` to `w-52`
    - Increase project buttons vertical padding from `py-2` to `py-2.5`
    - _Requirements: 3.3, 5.4_

  - [x] 6.2 Fix touch targets in WorkStationPanel
    - Increase add button from `h-7 w-7` to `h-8 w-8`
    - Increase filter pill padding from `py-0.5` to `py-1`
    - Increase status dropdown items from `px-3 py-1` to `py-2 px-4`
    - _Requirements: 3.2, 3.4, 3.5_

- [x] 7. Visual feedback and active states
  - [x] 7.1 Add active border to ProjectSidebar
    - Add `border-l-[3px] border-brand-light` to active project item
    - _Requirements: 4.1_

  - [x] 7.2 Add hover scale to kanban cards
    - Update `.kanban-card:hover` in globals.css to include `transform: scale(1.01)`
    - _Requirements: 4.2_

  - [x] 7.3 Add focus ring utility to globals.css
    - Add a global focus-visible rule for interactive elements: `box-shadow: 0 0 0 2px rgba(143, 168, 196, 0.4)`
    - Apply to buttons, links, and inputs via `.focus-ring` utility class or global selector
    - _Requirements: 4.4_

  - [x] 7.4 Add hover opacity boost to interactive text
    - Ensure interactive text elements increase opacity by at least 20% on hover (already partially done via `hover:text-white` patterns — verify consistency)
    - _Requirements: 4.3, 7.4_

- [x] 8. Spacing and layout consistency
  - [x] 8.1 Verify gap-6 standard in DashboardLayout
    - Confirm `gap-6` is used between major content sections (already set in flex container)
    - _Requirements: 5.1_

  - [x] 8.2 Verify p-4 minimum padding on card containers
    - Check `.glass-card`, `.glass-panel`, `.kanban-card` have at least p-4 or equivalent
    - Increase kanban card padding from `p-3` to `p-4`
    - _Requirements: 5.2_

  - [x] 8.3 Verify border-radius consistency
    - Panels: rounded-2xl (16px) ✓
    - Cards: rounded-xl (12px) ✓
    - Buttons/inputs: ensure rounded-lg (8px) — update any remaining `rounded-sm`, `rounded-md`, `rounded` on buttons
    - _Requirements: 5.3_

- [x] 9. Final verification
  - [x] 9.1 Run `next build` and ensure no errors
    - Verify build completes successfully with zero TypeScript or module errors
    - _Requirements: 9.2, 9.3_

  - [x] 9.2 Final checkpoint - Confirm all changes preserve dark theme and functionality
    - Ensure all tests pass, ask the user if questions arise.
    - _Requirements: 9.1, 9.4, 9.5_

## Notes

- No property-based testing is needed — this feature is purely presentational (CSS, font, spacing).
- Testing is limited to build verification (`next build`) and visual inspection.
- All changes are backwards-compatible; existing Bebas Neue variable is kept in layout.tsx.
- The `--font-quicksand` CSS variable is the single source of truth for logo font.
- Tasks reference specific acceptance criteria (e.g., _1.3_ = Requirement 1, Criteria 3).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1", "5.1"] },
    { "id": 2, "tasks": ["5.2", "5.3", "5.4", "6.1", "6.2", "7.1", "7.2", "7.3", "7.4", "8.1", "8.2", "8.3"] },
    { "id": 3, "tasks": ["9.1"] },
    { "id": 4, "tasks": ["9.2"] }
  ]
}
```

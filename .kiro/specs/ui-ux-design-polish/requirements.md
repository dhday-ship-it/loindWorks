# Requirements Document

## Introduction

UI/UX design polish for the LOIND-WORKSPACE internal application. This feature improves typography readability, touch targets, visual feedback, spacing consistency, color contrast, and button style unification across the dark-themed glassmorphism interface. The primary visual change is replacing the Bebas Neue logo font with Quicksand Bold for a friendlier brand presence.

## Glossary

- **App**: The LOIND-WORKSPACE Next.js application
- **Logo_Text**: The "LOIND" or "LOIND CORPORATION" brand text rendered in the navigation bar, dashboard layout title, and admin dashboard
- **Sidebar**: The ProjectSidebar component showing navigation links and project list
- **WorkStation**: The WorkStationPanel component displaying task list and task creation form
- **Kanban_Card**: A draggable task card within the kanban board view
- **Filter_Pill**: A small rounded button used for filtering tasks by project
- **Status_Badge**: A small pill-shaped label indicating task status (대기, 진행중, 리뷰, 피드백, 완료)
- **Touch_Target**: The interactive clickable/tappable area of a UI element
- **Focus_Ring**: A visible outline that appears around focused interactive elements for keyboard accessibility
- **Glass_Panel**: A container styled with glassmorphism (backdrop-blur, semi-transparent background, subtle border)

## Requirements

### Requirement 1: Logo Font Replacement

**User Story:** As a team member, I want the LOIND logo text to use a geometric rounded font (Quicksand Bold), so that the brand feels thick, friendly, and approachable.

#### Acceptance Criteria

1. WHEN the App loads, THE Logo_Text SHALL render using the Quicksand Bold (700 weight) font from Google Fonts
2. WHEN Quicksand is applied, THE App SHALL load the font via the central layout.tsx file using a CSS variable (--font-quicksand)
3. THE Logo_Text in DashboardNav SHALL display "LOIND" using Quicksand Bold with the existing tracking and size styles
4. THE Logo_Text in DashboardLayout SHALL display "LOIND CORPORATION" using Quicksand Bold
5. THE Logo_Text in SuperAdminDashboard SHALL display "LOIND" using Quicksand Bold
6. THE App SHALL retain DM_Sans as the body font, Geist as the system font, and Geist_Mono as the monospace font

### Requirement 2: Typography Readability

**User Story:** As a user reading the interface daily, I want all text to meet minimum size and contrast thresholds, so that I can read content without eye strain.

#### Acceptance Criteria

1. THE App SHALL enforce a minimum rendered font size of 11px for all visible text elements
2. WHEN body text is displayed, THE App SHALL render text opacity at 40% minimum (white/40) instead of values below 30%
3. THE App SHALL render monospace labels (section headers, metadata indicators) at a minimum of 10px font size
4. THE App SHALL render Status_Badge text and Filter_Pill text at a minimum of 10px font size
5. THE App SHALL render task title text at a minimum of 13px font size

### Requirement 3: Touch Targets and Click Areas

**User Story:** As a mobile user, I want interactive elements to have adequate tap areas, so that I can reliably interact with buttons and links on touch devices.

#### Acceptance Criteria

1. THE App SHALL ensure all interactive elements (buttons, links, dropdown triggers) have a minimum height of 32px
2. WHEN a status dropdown is open, THE App SHALL render dropdown items with padding of py-2 px-4
3. THE Sidebar project buttons SHALL render with vertical padding of py-2.5
4. THE WorkStation task add button SHALL render at h-8 w-8 dimensions
5. THE Filter_Pill buttons SHALL render with vertical padding of py-1

### Requirement 4: Active State and Visual Feedback

**User Story:** As a user navigating the interface, I want clear visual indicators for active and hovered elements, so that I always know where I am and what I can interact with.

#### Acceptance Criteria

1. WHEN a project is active in the Sidebar, THE Sidebar SHALL display a 3px left border in brand-light color on the active item
2. WHEN a user hovers over a Kanban_Card, THE Kanban_Card SHALL apply a scale transform of 1.01
3. WHEN a navigation item is active, THE App SHALL display a bottom border indicator on that item
4. WHEN any interactive element receives keyboard focus, THE App SHALL display a visible focus ring (ring-2 with brand-light/40 color)

### Requirement 5: Spacing and Layout Consistency

**User Story:** As a user viewing the workspace, I want consistent spacing and proportions across all panels, so that the interface feels polished and well-organized.

#### Acceptance Criteria

1. THE App SHALL use gap-6 (24px) as the standard gap between major content sections
2. THE App SHALL enforce minimum internal padding of p-4 (16px) on all card-level containers
3. THE App SHALL use consistent border-radius values: 16px for Glass_Panel elements, 12px for cards, and 8px for buttons and inputs
4. THE Sidebar SHALL render at w-52 (208px) width to accommodate longer project names

### Requirement 6: Login Page Font Consistency

**User Story:** As a developer maintaining the codebase, I want the login page to use the centralized font system, so that font loading is consistent and not duplicated.

#### Acceptance Criteria

1. THE login page SHALL NOT instantiate a local DM_Sans font object
2. THE login page SHALL apply the DM_Sans font via the CSS variable (font-[family-name:var(--font-dm-sans)]) defined in layout.tsx
3. WHEN the login page renders, THE App SHALL display all login page text in DM_Sans loaded from the central layout

### Requirement 7: Color Contrast and Text Hierarchy

**User Story:** As a user, I want clear visual hierarchy through text opacity levels, so that I can distinguish between primary content, metadata, and hints at a glance.

#### Acceptance Criteria

1. THE App SHALL render primary text (titles, task names) at white/95 opacity minimum
2. THE App SHALL render secondary text (metadata, dates, project names) at white/50 opacity minimum
3. THE App SHALL render tertiary text (labels, hints, placeholders) at white/40 opacity minimum
4. WHEN a user hovers over an interactive text element, THE App SHALL increase opacity by at least 20 percentage points from its resting state

### Requirement 8: Button Style Unification

**User Story:** As a user, I want all buttons to look and behave consistently, so that the interface feels cohesive and I can easily identify interactive elements.

#### Acceptance Criteria

1. THE App SHALL define three button style variants: primary (filled with brand color), secondary (ghost with border), and danger (red ghost)
2. THE App SHALL apply consistent border-radius of 8px to all button elements
3. THE App SHALL apply consistent padding of px-3 py-2 to all standard-size buttons
4. THE App SHALL apply font-weight 600 to all button text
5. THE App SHALL apply cursor-pointer and transition-all to all button elements

### Requirement 9: Non-Functional Constraints

**User Story:** As a developer, I want all visual changes to maintain existing functionality and codebase integrity, so that the polish effort introduces no regressions.

#### Acceptance Criteria

1. WHEN any UI change is applied, THE App SHALL maintain all existing interactive functionality without regression
2. THE App SHALL pass the build process (next build) after each change is applied
3. THE App SHALL NOT introduce new npm dependencies beyond adding the Quicksand font to the existing Next.js font configuration in layout.tsx
4. WHEN all changes are applied, THE App SHALL preserve the dark theme and glassmorphism design aesthetic
5. THE App SHALL maintain backwards compatibility with all existing pages (login, dashboard, admin)

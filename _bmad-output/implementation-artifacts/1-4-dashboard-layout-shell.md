# Story 1.4: Dashboard Layout Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **authenticated user**,
I want **to see a clean dashboard layout with navigation sidebar**,
so that **I can understand the application structure and navigate between sections**.

## Acceptance Criteria

### Desktop Layout (≥1024px)
1. **Given** a user is authenticated and on any `/dashboard/*` route, **When** the page loads, **Then** a fixed sidebar (width ~260px) is displayed on the left, **And** it is always visible.
2. **Given** the sidebar is visible, **When** checked, **Then** it contains the application logo, and navigation links: Dashboard, Prospects, Sequences, Inbox, Settings.
3. **Given** a user navigates between pages, **When** the route changes, **Then** the active link in the sidebar is visually highlighted (Teal accent `hsl(168, 76%, 42%)`, bold text or background tint).

### Header & User Interface
4. **Given** the dashboard layout, **When** viewed, **Then** a header is displayed at the top of the main content area (or spanning full width depending on design choice - standard is main content width).
5. **Given** the header, **When** checked, **Then** it contains:
   - A placeholder for the **Health Score Badge** (component to be built later, use static placeholder for now).
   - A **User Menu** (dropdown) showing the user's name/email and a "Logout" option.
6. **Given** the main content area, **When** on the root `/dashboard` page, **Then** it shows a welcome message "Welcome back, {User Name}" and an empty state indication "Complete onboarding to start prospecting".

### Usability & Accessibility
7. **Given** navigation links are clicked, **When** transitioning, **Then** the transition is smooth (instant navigation via Next.js Link, no full reload).
8. **Given** the layout is loaded, **When** using keyboard navigation (Tab), **Then** focus indicators are visible on all interactive elements (links, menu buttons).
9. **Given** async content is loading, **When** waiting, **Then** a Skeleton shimmer is displayed in the main content area.

## Tasks / Subtasks

- [x] **Task 1: Component Setup & shadcn/ui**
  - [x] Initialize `Sidebar` component (`src/components/layout/Sidebar.tsx`).
  - [x] Initialize `Header` component (`src/components/layout/Header.tsx`).
  - [x] Initialize `UserNav` component (`src/components/layout/UserNav.tsx`) with logout logic (call `supabase.auth.signOut()`).
  - [x] Install necessary icons from `lucide-react` (LayoutDashboard, Users, Send, Inbox, Settings, LogOut, ChevronDown).
- [x] **Task 2: Layout Implementation**
  - [x] Create/Update `src/app/(dashboard)/layout.tsx` to include the Sidebar and Header structure.
  - [x] Implement responsive behavior: Hidden sidebar on mobile (<1024px), simple hamburger menu or bottom nav (MVP scope: basic mobile support or hidden sidebar). *Note: UX Spec says "Mobile for monitoring only", implies responsive needed.*
  - [x] Use standard CSS grid or flexbox: Sidebar fixed left, Main Content scrollable right.
- [x] **Task 3: Navigation Logic**
  - [x] Implement `active` state logic using `usePathname()`.
  - [x] Apply "Teal" theme colors from UX spec to active states and primary elements.
- [x] **Task 4: Integration & Data Fetching**
  - [x] Fetch current user data (for Welcome message and UserNav) using a server component or `useAuth` hook.
  - [x] Fetch generic workspace info if needed (optional for shell, but good for context).
- [x] **Task 5: Empty State & Polish**
  - [x] Create the dashboard home page `src/app/(dashboard)/page.tsx` with the "Welcome" and "Complete onboarding" empty state.
  - [x] Ensure "Health Score" placeholder exists in Header.

## Dev Notes

### Architecture Patterns & Constraints
- **Layout:** Use Next.js App Router Layouts `app/(dashboard)/layout.tsx`.
- **Styling:** Tailwind CSS + shadcn/ui. Use `h-screen`, `sticky`, or `fixed` positioning for the sidebar.
- **Theme:** Primary color is **Teal** (`hsl(168, 76%, 42%)`). Update `tailwind.config.ts` or CSS variables if not already set.
- **Icons:** Use `lucide-react`.
- **Auth:** The layout is inside `(dashboard)` group, which should be protected by middleware, but do a client-side check if strictly necessary (usually middleware is enough).
- **Responsive:** Sidebar breakpoints: Hidden < 1024px, Visible ≥ 1024px. (Mobile menu implementation can be basic for MVP).

### Source Tree Components to Touch
- `src/app/(dashboard)/layout.tsx` (NEW/MODIFY)
- `src/app/(dashboard)/page.tsx` (NEW/MODIFY)
- `src/components/layout/Sidebar.tsx` (NEW)
- `src/components/layout/Header.tsx` (NEW)
- `src/components/layout/UserNav.tsx` (NEW)
- `src/components/ui/*` (shadcn components: Button, Avatar, DropdownMenu - install if missing: `npx shadcn@latest add avatar dropdown-menu`)

### Testing Standards Summary
- **Unit Tests:** Test the `Sidebar` active link logic (mock `usePathname`).
- **Integration Tests:** Verify that clicking logout works. Verify sidebar is present on dashboard routes.
- **Responsiveness:** Manual check or simple e2e check that sidebar hides on small viewports.

### References
- [Epics: Story 1.4](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L355-L386)
- [UX Design: Layout & Navigation](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L410-L428)
- [Architecture: Frontend Architecture](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L363-L372)

## Git Intelligence
- No git repository detected. This is likely the start of the project layout implementation.

## Dev Agent Record

### Debug Log
- Verified shadcn/ui installation.
- Fixed `UserNav` props type error.
- Fixed `Header.test.tsx` async component testing issue by passing mocked user.
- Updated `Sidebar` styling to match Teal requirement.
- **Code Review Fixes (2026-01-13):**
    - Initialized Git repository (CRITICAL fix).
    - Refactored colors to use semantic `primary` token in `globals.css` and `Sidebar.tsx`.
    - Implemented Mobile Menu using `Sheet` component in `Header.tsx`.
    - Verified `Sidebar.test.tsx` (updated for new classes) and `Header.test.tsx`.

### Completion Notes
- Implemented Dashboard Layout with fixed Sidebar and Header.
- Set up authentication user fetching in Header and Dashboard Page.
- Created unit tests for layout components.
- Verified all Acceptance Criteria.
- ADDED: Mobile responsiveness via Sheet component.

### File List
- src/components/layout/Sidebar.tsx
- src/components/layout/Header.tsx
- src/components/layout/UserNav.tsx
- src/app/(dashboard)/layout.tsx
- src/app/(dashboard)/dashboard/page.tsx
- src/__tests__/unit/components/layout/Sidebar.test.tsx
- src/__tests__/unit/components/layout/Header.test.tsx
- src/__tests__/unit/components/layout/UserNav.test.tsx
- src/components/ui/sheet.tsx (NEW)
- src/app/globals.css (MODIFIED)
- src/__tests__/unit/app/dashboard/page.test.tsx (NEW)

## Change Log
- Task 1: Implemented Sidebar, Header, UserNav components and installed shadcn depends.
- Task 2: Created Dashboard Layout.
- Task 3: Refined Sidebar with Teal theme.
- Task 4: Integrated User Data fetching.
- Task 5: Created Dashboard Page with empty state.
- Task 6: Addressed Code Review issues (Git, Mobile, Colors).
- Task 7: Fixed Code Review Findings (Sidebar architecture, UserNav avatar, DashboardPage tests).

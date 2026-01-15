# Story 1.5: Logout & Session Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **authenticated user**,
I want **to logout securely from the application**,
so that **my session is terminated and my account is protected from unauthorized access**.

## Acceptance Criteria

### Logout Flow
1. **Given** a user is authenticated, **When** they click the "Logout" button in the user menu (built in Story 1.4), **Then** their Supabase session is terminated, **And** the session cookie is cleared, **And** they are redirected to the `/login` page.

2. **Given** a user has logged out, **When** they attempt to navigate to any protected route (e.g., `/dashboard`), **Then** they are redirected to `/login`.

### Session Expiry
3. **Given** a user's session has been inactive for 24 hours (NFR10), **When** they attempt to access the application, **Then** they are automatically logged out, **And** redirected to `/login` with an informational message "Session expired, please log in again."

### OAuth Revocation (Settings > Security)
4. **Given** a user navigates to `Settings > Security`, **When** they click "Revoke Google Access", **Then** the Google OAuth connection is revoked (Supabase API call), **And** the user is logged out, **And** all local state is cleared.

5. **Given** a user is on the Settings page, **When** the Security section loads, **Then** it displays the currently connected Google account email, **And** the "Revoke Google Access" button is visible.

### State Cleanup
6. **Given** any user logout occurs (manual or session expiry), **When** the logout process completes, **Then** all client-side TanStack Query cache is cleared, **And** Supabase local session storage is removed.

## Tasks / Subtasks

- [x] **Task 1: Implement Logout Action (AC: 1, 6)**
  - [x] Create `src/lib/auth/actions.ts` with `signOut()` function wrapping `supabase.auth.signOut()`.
  - [x] Implement TanStack Query cache reset on logout (`queryClient.clear()`).
  - [x] Verify redirect to `/login` after logout.
  - [x] Write unit test for `signOut()` action (7 tests).

- [x] **Task 2: Session Timeout Handling (AC: 3, 6)**
  - [x] Configure Supabase session JWT expiry to 24 hours in Supabase Dashboard (or verify default).
  - [x] Create client-side hook `useSessionExpiry` to detect expired sessions (e.g., `onAuthStateChange` with `SIGNED_OUT` event).
  - [x] Display toast "Session expired, please log in again" when session expires.
  - [x] Redirect to `/login` automatically on session expiry.
  - [x] Write integration test simulating session expiry (4 tests).

- [x] **Task 3: Create Settings > Security Page (AC: 4, 5)**
  - [x] Create `src/app/(dashboard)/settings/page.tsx` with tabs: General, Security.
  - [x] Create `src/components/features/settings/SettingsTabs.tsx` with Security content.
  - [x] Display connected Google account email (from `user.email`).
  - [x] Implement "Revoke Google Access" button with confirmation dialog.
  - [x] Call `supabase.auth.signOut({ scope: 'global' })` for revocation (revokes all sessions).
  - [x] Handle error cases: API failure, network issues.
  - [x] shadcn/ui components added: Badge, Tabs, AlertDialog.

- [x] **Task 4: Update UserNav with Logout (AC: 1)**
  - [x] Verify existing `UserNav.tsx` (from Story 1.4) has working logout button.
  - [x] Connect logout button to the new `signOut()` action from `lib/auth/actions.ts`.
  - [x] Add loading spinner during logout process.

- [x] **Task 5: Verify Protected Route Redirect (AC: 2)**
  - [x] Verify middleware.ts correctly redirects unauthenticated users to `/login`.
  - [x] Added `/settings` to protected routes in middleware.
  - [x] Write integration test: access `/dashboard` without session → redirect to `/login`.

## Dev Notes

### Architecture Patterns & Constraints

- **Auth Pattern:** Supabase Auth with `@supabase/ssr` for cookie-based sessions.
- **Session Timeout:** 24 hours (NFR10) — configure in Supabase Dashboard → Authentication → Settings → JWT expiry.
- **State Management:** Use TanStack Query; clear cache on logout with `queryClient.clear()`.
- **Error Handling:** Use `ApiResponse<T>` pattern from `lib/utils/api-response.ts`. Toast notifications for user-facing errors.
- **Security:** Never expose session details in client logs. Use `signOut({ scope: 'global' })` for OAuth revocation.
- **workspaceId:** Not applicable for this story (logout clears all state).

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `src/lib/auth/actions.ts` | NEW | Centralized auth actions (signOut) |
| `src/hooks/use-session-expiry.ts` | NEW | Hook for session expiry detection |
| `src/app/(dashboard)/settings/page.tsx` | NEW/MODIFY | Settings page with tabs |
| `src/app/(dashboard)/settings/security/page.tsx` | NEW | Security tab content |
| `src/components/layout/UserNav.tsx` | MODIFY | Connect to signOut action |
| `src/components/layout/Sidebar.tsx` | MODIFY | Add "Settings" navigation link |
| `src/__tests__/unit/auth/actions.test.ts` | NEW | Unit tests for signOut |
| `src/__tests__/integration/session.test.ts` | NEW | Integration tests for session |

### Testing Standards Summary

- **Unit Tests:**
  - `signOut()` action calls Supabase and clears cache.
  - Security page renders correctly with user email.
  - Revoke button triggers confirmation dialog.
  
- **Integration Tests:**
  - Logout flow: click logout → session cleared → redirect to `/login`.
  - Protected route access: no session → redirect to `/login`.
  - Session expiry: expired JWT → toast message → redirect.

### Previous Story Intelligence (1.4)

- **Patterns Established:**
  - `UserNav.tsx` component exists with logout button (basic implementation).
  - Dashboard layout with `Sidebar`, `Header` already in place.
  - Teal primary color (`hsl(168, 76%, 42%)`) used for active states.
  - shadcn/ui components: `Sheet`, `Button`, `DropdownMenu`.
  
- **Files to Reuse:**
  - `src/components/layout/UserNav.tsx` — Extend with proper signOut action.
  - `src/components/layout/Sidebar.tsx` — Add Settings link if missing.

### UX Requirements

- **Toast:** "Logged out successfully" (success) or "Session expired, please log in again" (info).
- **Loading State:** Spinner on logout button during signOut process.
- **Confirmation Dialog:** For "Revoke Google Access" — destructive action warning.
- **Empty State:** Settings > Security should show connected account clearly.

### Project Context Compliance

> 🚨 Refer to `project-context.md` for mandatory rules.

- **API Response:** All API calls return `ApiResponse<T>` format.
- **Naming:** Files in `kebab-case.ts`, hooks in `use-{name}.ts`.
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`.

### References

- [Epics: Story 1.5](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L388-L416)
- [Architecture: Auth & Security](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L275-L283)
- [UX: Feedback Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L553-L562)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [NFR10: Session Timeout 24h](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L126)

## Git Intelligence

- No Git history available (branch `master` has no commits yet).
- First commits expected from Story 1.4 implementation.

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

None

### Completion Notes List

- Implemented centralized `signOut()` action with TanStack Query cache clearing
- Created `useSessionExpiry` hook integrated via `SessionManager` component in dashboard layout
- Built Settings page with General/Security tabs using shadcn/ui Tabs component
- Security tab displays connected Google account and "Revoke Access" button with AlertDialog confirmation
- Updated UserNav with loading spinner during logout
- Added `/settings` to protected routes in middleware
- All 35 tests pass (12 test files)

### Code Review (2026-01-14)
- **Reviewer:** Amelia (Dev Agent)
- **Outcome:** Passed with fixes
- **Fixes Applied:**
  - Resolved UX conflict in `useSessionExpiry.ts` (double toast on manual logout)
  - Refactored `SettingsTabs.tsx` to extract inline SVGs
  - Improved `src/__tests__/integration/session.test.ts` to test middleware redirects properly

### File List

**NEW:**
- `src/lib/auth/actions.ts` - Centralized signOut action
- `src/hooks/use-session-expiry.ts` - Session expiry detection hook
- `src/components/shared/SessionManager.tsx` - Client wrapper for session hooks
- `src/app/(dashboard)/settings/page.tsx` - Settings page
- `src/components/features/settings/SettingsTabs.tsx` - Settings tabs component
- `src/__tests__/unit/auth/actions.test.ts` - Unit tests (7 tests)
- `src/__tests__/integration/session.test.ts` - Integration tests (4 tests)
- `src/components/ui/badge.tsx` - shadcn Badge component
- `src/components/ui/tabs.tsx` - shadcn Tabs component
- `src/components/ui/alert-dialog.tsx` - shadcn AlertDialog component

**MODIFIED:**
- `src/components/layout/UserNav.tsx` - Added signOut action, loading spinner, useQueryClient
- `src/components/layout/Sidebar.tsx` - Updated Settings link to `/settings`
- `src/app/(dashboard)/layout.tsx` - Added SessionManager wrapper
- `src/middleware.ts` - Added `/settings` to protected routes
- `src/__tests__/unit/components/layout/UserNav.test.tsx` - Added QueryClientProvider wrapper

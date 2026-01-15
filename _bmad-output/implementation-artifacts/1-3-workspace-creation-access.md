                                                    # Story 1.3: Workspace Creation & Access

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **authenticated user**,
I want **a personal workspace to be automatically created on first login**,
so that **I have an isolated space to manage my prospecting activities**.

## Acceptance Criteria

1. **Given** a new user successfully authenticates for the first time, **When** the auth callback completes, **Then** a new Workspace is created with the user as ID owner, **And** the workspace name defaults to "My Workspace", **And** the user is redirected to `/dashboard`.
2. **Given** a user who already has a workspace authenticates again, **When** the auth callback processes, **Then** no duplicate workspace is created (idempotent operation), **And** the existing workspace is preserved.
3. **Given** a user is authenticated, **When** they access any API endpoint, **Then** the `workspaceId` is resolved from their session/database (never purely from query params), **And** ownership is verified via `assertWorkspaceAccess` helper.
4. **Given** a user is creating a workspace, **When** the creation fails (e.g., DB error), **Then** the error is logged, **And** the user sees a friendly error on the dashboard saying "Workspace setup failed, please contact support".

## Tasks / Subtasks

- [x] **Task 1: Workspace Service Implementation**
  - [x] Create `src/lib/services/workspace-service.ts` with `ensureWorkspaceForUser(userId: string, email: string)`.
  - [x] Implement idempotent logic: `upsert` or `findFirst` check before create.
  - [x] Unit test `ensureWorkspaceForUser` (mocking Prisma).
- [x] **Task 2: Auth Callback Integration**
  - [x] Modify `src/app/auth/callback/route.ts` to call `ensureWorkspaceForUser` after user sync.
  - [x] Ensure transaction or sequence: User Sync -> Workspace Sync -> Redirect.
  - [x] Update integration test `auth-callback.test.ts` to verify workspace creation.
- [x] **Task 3: Security Guardrails**
  - [x] Create `src/lib/guardrails/workspace-check.ts`.
  - [x] Implement `assertWorkspaceAccess(userId: string, workspaceId: string)` helper.
  - [x] Implement `getWorkspaceId(userId: string)` helper (fetches primary workspace).
  - [x] Unit test guardrails.
- [x] **Task 4: API & Middleware Helpers**
  - [x] Update `src/lib/utils/api-response.ts` if needed (already exists).
  - [x] Create simple API route `/api/user/workspace` (GET) to return current workspace info (for frontend context).

## Dev Notes

### Architecture Patterns & Constraints
- **Multi-tenancy:** MVP uses `workspaceId` column + Foreign Key. No RLS yet.
- **Isolation:** ALL data access MUST be scoped by `workspaceId`.
- **Naming:** DB table `workspaces`, Prisma model `Workspace`.
- **Security:** `workspaceId` MUST NOT be trusted from client query params alone. Always validate against session `userId`.

### Source Tree Components to Touch
- `src/app/auth/callback/route.ts` (MODIFIED) - Add workspace creation call.
- `src/lib/services/workspace-service.ts` (NEW) - Core logic.
- `src/lib/guardrails/workspace-check.ts` (NEW) - Security helper.
- `src/app/api/user/workspace/route.ts` (NEW) - Context endpoint.

### Testing Standards Summary
- **Unit Tests:** Test `ensureWorkspaceForUser` for idempotency and creation logic. Test `assertWorkspaceAccess` for permission denial.
- **Integration Tests:** Extend `auth-callback.test.ts` to check `prisma.workspace.findFirst` returns a workspace after auth.

### Project Structure Notes
- Services go in `src/lib/services/`.
- Guardrails go in `src/lib/guardrails/`.
- API routes in `src/app/api/`.

### References
- [Epics: Story 1.3](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L324-L352)
- [Architecture: Multi-tenant Pattern](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L254-L272)
- [Existing User Sync](file:///c:/Users/Alexis/Documents/LeadGen/src/lib/services/user-sync.ts)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Antigravity) - Amelia (Dev Agent)

### Debug Log References
- Fixed issue where `Workspace` model used `userId` instead of `ownerId`.
- Resolved OOM errors in vitest by increasing memory limit.

### Completion Notes List
- Implemented `ensureWorkspaceForUser` service with idempotency checks.
- Integrated workspace creation into the Auth Callback flow.
- Implemented `assertWorkspaceAccess` and `getWorkspaceId` guardrails.
- Created `/api/user/workspace` endpoint for frontend context.
- Verified all components with unit and integration tests.
- [AI Review] Fixed missing error handling for workspace creation failures (AC 4).
- [AI Review] Removed unused parameters and improved test coverage.


### File List
src/lib/services/workspace-service.ts
src/__tests__/unit/workspace-service.test.ts
src/lib/guardrails/workspace-check.ts
src/__tests__/unit/workspace-check.test.ts
src/app/api/user/workspace/route.ts
src/__tests__/unit/api-user-workspace.test.ts
src/app/auth/callback/route.ts
src/__tests__/integration/auth-callback.test.ts

# Story 1.1: Project Initialization & Dev Environment

Status: done

## Story

As a **developer**,
I want **to initialize the project, configure the tech stack, and set up the development environment**,
so that **I can start implementing features on a solid, compliant, and standard foundation.**

## Acceptance Criteria

1. **Framework & Package Management:** Next.js 15+ (App Router) initialized with TypeScript, Tailwind CSS, ESLint, and Turbopack using `pnpm`.
2. **UI Architecture:** shadcn/ui initialized with CSS variables and core components (button, card, input, dialog, toast) added.
3. **Data Layer:** Prisma ORM initialized and configured for PostgreSQL with a multi-tenant schema pattern (`workspaceId` + foreign keys).
4. **Auth Layer:** Supabase Auth (SSR) configured with both browser and server-side clients in `src/lib/supabase/`.
5. **State Management:** TanStack Query 5 (React Query) setup with a global provider and hydration support.
6. **Project Structure:** Unified directory structure (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/__tests__/`) implemented as per architecture spec.
7. **Standards & Utilities:** API response utility implemented in `src/lib/utils/api-response.ts` using the `ApiResponse<T>` pattern.
8. **DevOps & Testing:** Vitest configured for unit/integration testing with a "health-check" test verifying the environment.
9. **Build Pipeline:** `package.json` contains verified scripts for `dev`, `build`, `lint`, and `test`.

## Tasks / Subtasks

- [x] **Task 1: Project Initialization (AC: 1, 2)**
  - [x] Execute `npx create-next-app@latest` with the architecture-mandated flags.
  - [x] Initialize shadcn/ui and add base components.
  - [x] Configure `tailwind.config.ts` with the project design tokens.
- [x] **Task 2: Structural Scaffolding (AC: 6)**
  - [x] Create the full directory structure in `src/`.
  - [x] Setup import aliases `@/*`.
- [x] **Task 3: Data & Auth Foundation (AC: 3, 4)**
  - [x] Initialize Prisma and create initial `schema.prisma` with `Workspace` model (snake_case/PascalCase mapping).
  - [x] Setup Supabase SSR clients in `src/lib/supabase/`.
- [x] **Task 4: Logic & Utility Layer (AC: 5, 7)**
  - [x] Implement the `ApiResponse` type and `success`/`error` helpers.
  - [x] Setup TanStack Query provider and hooks.
  - [x] Implement Zod base schemas for validation.
- [x] **Task 5: Verification & DX (AC: 8, 9)**
  - [x] Configure Vitest and `jsdom` environment.
  - [x] Add `__tests__/unit/health.test.ts` verifying the test runner works.
  - [x] Finalize `package.json` scripts.

## Dev Notes

### Architecture Patterns & Constraints
- **Must Follow:** Always use `snake_case` for database columns and `camelCase` for Prisma fields with `@map`.
- **Multi-Tenant:** Every table must have a `workspace_id` column (indexed).
- **API Standard:** All API routes must return the structured `ApiResponse` format.
- **Server vs Client:** Prefer Server Components by default; keep `'use client'` to the leaves or specific interactive components.

### Source Tree Components to Touch
- `src/app/` (Next.js App Router)
- `src/lib/` (Infrastructure & Utilities)
- `src/components/ui/` (shadcn/)
- `prisma/` (Schema & Client)

### Testing Standards Summary
- Unit tests in `src/__tests__/unit/` for logic.
- Integration tests in `src/__tests__/integration/` for routes.
- Format: Vitest + Zod for runtime validation tests.

### References
- [Architecture: starter-template-evaluation](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L113-L219)
- [Architecture: data-architecture](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L244-L274)
- [Project Context: critical-implementation-rules](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md#L29-L139)
- [EPICS: Story 1.1 Foundation](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L45-L78)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash (Antigravity SM)

### Debug Log References
- SM Story Creation Step ID: 75

### Completion Notes List
- Project initialized with Next.js 16, TypeScript, and Tailwind v4.
- shadcn/ui configured and base components added (button, card, form, input, dialog, sonner).
- Prisma initialized with Workspace and Prospect models following snake_case convention.
- Supabase SSR clients and middleware implemented for authentication.
- TanStack Query provider and ApiResponse utility established.
- Zod schemas for initial models created.
- Vitest environment configured with JSDOM and health check test passed.

### File List
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `components.json`
- `vitest.config.ts`
- `prisma/schema.prisma`
- `src/middleware.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/utils/api-response.ts`
- `src/lib/utils/validation.ts`
- `src/components/shared/QueryProvider.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/sonner.tsx`
- `src/__tests__/setup.ts`
- `src/__tests__/unit/health.test.ts`
- _bmad-output/implementation-artifacts/1-1-project-initialization-dev-environment.md

### Code Review (Amelia)
- Status updated to `done` after review.
- No blocking issues found for this story specifically, but part of the batch review.

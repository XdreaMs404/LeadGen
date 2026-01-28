# Story 2.4: Onboarding Progress & Status Tracking

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see my onboarding progress and current verification status**,
so that **I know what's left to do before I can start sending emails**.

## Acceptance Criteria

### Global Onboarding Banner (AC1)
1. **Given** a user is on any page of the application, **When** onboarding is incomplete, **Then** a banner or indicator shows "Complétez la configuration pour commencer à envoyer", **And** clicking it navigates to the onboarding wizard.

### Dashboard Onboarding Card (AC2)
2. **Given** a user is on the dashboard, **When** onboarding is incomplete, **Then** the dashboard shows an onboarding progress card, **And** the card displays: Gmail connection status, SPF status, DKIM status, DMARC status, **And** each item shows PASS ✅ / FAIL ❌ / UNKNOWN ⚠️ / NOT_STARTED ⚪.

### Onboarding Complete State (AC3)
3. **Given** all onboarding steps are complete (Gmail connected + SPF PASS + DKIM PASS + DMARC PASS), **When** the user views the dashboard, **Then** the onboarding card is replaced by a success state, **And** the user's `onboardingComplete` flag is set to true in database, **And** the global banner is hidden.

### Manual Override Display (AC4)
4. **Given** a user has manually overridden a DNS check (status = MANUAL_OVERRIDE), **When** they view their status on dashboard or wizard, **Then** the status shows "Vérifié (manuel)" with an info tooltip, **And** a warning icon indicates this was not auto-verified.

### Progress Calculation (AC5)
5. **Given** a user views the onboarding card, **When** the progress is calculated, **Then** progress shows X/4 steps completed (Gmail + SPF + DKIM + DMARC), **And** a progress bar or percentage is displayed.

### Real-time Status Updates (AC6)
6. **Given** a user completes an onboarding step (e.g., DNS validation), **When** they navigate to dashboard, **Then** the onboarding card reflects the updated status immediately (no page refresh needed).

## Tasks / Subtasks

- [x] **Task 1: Prisma Schema Update (AC: 3)**
  - [x] Add `onboardingComplete` Boolean field to Workspace model (default: false)
  - [x] Run `pnpm prisma migrate dev --name add_onboarding_complete`
  - [x] Verify migration applies cleanly

- [x] **Task 2: Onboarding Status API Enhancement (AC: 2, 5)**
  - [x] Modify `src/app/api/workspace/dns-status/route.ts` or create new endpoint
  - [x] Return comprehensive status: `{ gmailConnected, spfStatus, dkimStatus, dmarcStatus, onboardingComplete, progressPercent }`
  - [x] Calculate `progressPercent`: (completed steps / 4) * 100
  - [x] Determine `onboardingComplete`: Gmail ✓ AND (SPF PASS or MANUAL_OVERRIDE) AND (DKIM PASS or MANUAL_OVERRIDE) AND (DMARC PASS or MANUAL_OVERRIDE)

- [x] **Task 3: Update Onboarding Complete Flag (AC: 3)**
  - [x] Create service `src/lib/onboarding/onboarding-service.ts`
  - [x] Implement `checkAndUpdateOnboardingComplete(workspaceId)` function
  - [x] Call this service after DNS validation success (Story 2.3)
  - [x] Call this service after Gmail token save (Story 2.1)
  - [x] Update `onboardingComplete` field in Workspace

- [x] **Task 4: useOnboardingStatus Hook (AC: 2, 5, 6)**
  - [x] Create `src/hooks/use-onboarding-status.ts` with TanStack Query
  - [x] Query key: `['onboarding-status', workspaceId]`
  - [x] Return `{ gmailConnected, spfStatus, dkimStatus, dmarcStatus, onboardingComplete, progressPercent, isLoading }`
  - [x] Auto-refetch on window focus
  - [x] Invalidate on DNS validation or Gmail connection changes

- [x] **Task 5: OnboardingProgressCard Component (AC: 2, 4, 5)**
  - [x] Create `src/components/features/dashboard/OnboardingProgressCard.tsx`
  - [x] Display checklist: Gmail ✓, SPF status, DKIM status, DMARC status
  - [x] Use `DnsStatusBadge` component from Story 2.2
  - [x] Show progress bar with percentage
  - [x] Add "Continuer la configuration" button linking to onboarding wizard
  - [x] Show "Vérifié (manuel)" badge for MANUAL_OVERRIDE status with tooltip

- [x] **Task 6: OnboardingSuccessCard Component (AC: 3)**
  - [x] Create `src/components/features/dashboard/OnboardingSuccessCard.tsx`
  - [x] Display "🎉 Configuration terminée !" message
  - [x] Show all 4 items with green checkmarks
  - [x] Add "Commencer à prospecter" CTA button
  - [x] Use Framer Motion for subtle celebration animation

- [x] **Task 7: Dashboard Page Integration (AC: 2, 3)**
  - [x] Modify `src/app/(dashboard)/page.tsx`
  - [x] Conditionally render `OnboardingProgressCard` or `OnboardingSuccessCard`
  - [x] If `onboardingComplete === false`: show progress card
  - [x] If `onboardingComplete === true`: show success card (or hide entirely after first view)
  - [x] Position card prominently at top of dashboard

- [x] **Task 8: OnboardingBanner Component (AC: 1)**
  - [x] Create `src/components/shared/OnboardingBanner.tsx`
  - [x] Fixed banner at top of page (below header)
  - [x] Message: "Complétez la configuration pour commencer à envoyer"
  - [x] Link: navigates to `/settings/onboarding` or opens wizard
  - [x] "X" button to dismiss temporarily (session-based, not persistent)
  - [x] Teal background with white text

- [x] **Task 9: Layout Integration for Banner (AC: 1)**
  - [x] Modify `src/app/(dashboard)/layout.tsx`
  - [x] Include `OnboardingBanner` component
  - [x] Conditionally render only if `onboardingComplete === false`
  - [x] Use `useOnboardingStatus` hook

- [x] **Task 10: Unit & Integration Tests**
  - [x] Test `checkAndUpdateOnboardingComplete` logic
  - [x] Test progress calculation (0/4, 1/4, 2/4, 3/4, 4/4)
  - [x] Test OnboardingProgressCard renders correct badges
  - [x] Test OnboardingSuccessCard shows celebration
  - [x] Test banner visibility based on onboarding status
  - [x] Test API returns correct onboarding status

## Dev Notes

### Architecture Patterns & Constraints

- **State Management:** Use TanStack Query for onboarding status (server state)
- **Multi-Tenant:** workspaceId resolved from session, never from query params
- **API Response:** Use `ApiResponse<T>` pattern from `lib/utils/api-response.ts`
- **Component Pattern:** Dashboard components in `components/features/dashboard/`, shared in `components/shared/`
- **French Language:** All user-facing content in French per `config.yaml`
- **Real-time Updates:** TanStack Query invalidation on onboarding changes

### Onboarding Complete Logic

```typescript
// src/lib/onboarding/onboarding-service.ts
export function isOnboardingComplete(workspace: Workspace): boolean {
  const gmailOk = workspace.gmailConnected === true;
  const spfOk = workspace.spfStatus === 'PASS' || workspace.spfStatus === 'MANUAL_OVERRIDE';
  const dkimOk = workspace.dkimStatus === 'PASS' || workspace.dkimStatus === 'MANUAL_OVERRIDE';
  const dmarcOk = workspace.dmarcStatus === 'PASS' || workspace.dmarcStatus === 'MANUAL_OVERRIDE';
  
  return gmailOk && spfOk && dkimOk && dmarcOk;
}

export function calculateProgress(workspace: Workspace): number {
  let completed = 0;
  if (workspace.gmailConnected) completed++;
  if (['PASS', 'MANUAL_OVERRIDE'].includes(workspace.spfStatus)) completed++;
  if (['PASS', 'MANUAL_OVERRIDE'].includes(workspace.dkimStatus)) completed++;
  if (['PASS', 'MANUAL_OVERRIDE'].includes(workspace.dmarcStatus)) completed++;
  return (completed / 4) * 100;
}
```

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add onboardingComplete field |
| `src/lib/onboarding/onboarding-service.ts` | NEW | Onboarding logic service |
| `src/app/api/workspace/onboarding-status/route.ts` | NEW | Onboarding status endpoint |
| `src/hooks/use-onboarding-status.ts` | NEW | TanStack Query hook |
| `src/components/features/dashboard/OnboardingProgressCard.tsx` | NEW | Progress card |
| `src/components/features/dashboard/OnboardingSuccessCard.tsx` | NEW | Success card |
| `src/components/shared/OnboardingBanner.tsx` | NEW | Global banner |
| `src/app/(dashboard)/page.tsx` | MODIFY | Add onboarding cards |
| `src/app/(dashboard)/layout.tsx` | MODIFY | Add banner integration |
| `src/__tests__/unit/onboarding/` | NEW | Unit tests |
| `src/__tests__/integration/onboarding-status.test.ts` | NEW | API tests |

### Testing Standards Summary

- **Unit Tests:**
  - `isOnboardingComplete` returns correct boolean for all status combinations
  - `calculateProgress` returns 0, 25, 50, 75, 100 correctly
  - Components render correct UI based on status

- **Integration Tests:**
  - API returns correct onboarding status
  - Status updates persist to database
  - Banner visibility based on onboarding state

### Previous Story Intelligence (2.2, 2.3)

**Patterns Established:**
- `DnsStatus` enum: `NOT_STARTED | PASS | FAIL | UNKNOWN | MANUAL_OVERRIDE`
- `useDnsStatus` hook for fetching DNS status
- `DnsStatusBadge` component for rendering status badges
- Workspace model already has: `gmailConnected`, `spfStatus`, `dkimStatus`, `dmarcStatus`
- Story 2.3 will call `checkAndUpdateOnboardingComplete` after DNS validation

**Files to Reuse:**
- `src/components/shared/DnsStatusBadge.tsx` — Reuse for status display
- `src/hooks/use-dns-status.ts` — Pattern reference
- `src/types/dns.ts` — DnsStatus type

### UX Requirements (from UX Spec)

- **Progress Visible:** Onboarding progress should be immediately visible on dashboard
- **Protection Message:** Banner explains "Complete setup to start sending" (not restrictive)
- **Teal Primary Color:** Banner uses teal background
- **Success State:** Celebration animation when complete
- **Tooltip for Override:** Explain what "Vérifié (manuel)" means

### Component Structure Example

```typescript
// src/components/features/dashboard/OnboardingProgressCard.tsx
interface OnboardingProgressCardProps {
  gmailConnected: boolean;
  spfStatus: DnsStatus;
  dkimStatus: DnsStatus;
  dmarcStatus: DnsStatus;
  progressPercent: number;
}

export function OnboardingProgressCard({
  gmailConnected,
  spfStatus,
  dkimStatus,
  dmarcStatus,
  progressPercent
}: OnboardingProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la délivrabilité</CardTitle>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex items-center justify-between">
            <span>Connexion Gmail</span>
            {gmailConnected ? <CheckCircle className="text-green-500" /> : <Circle className="text-gray-300" />}
          </li>
          <li className="flex items-center justify-between">
            <span>SPF</span>
            <DnsStatusBadge status={spfStatus} />
          </li>
          <li className="flex items-center justify-between">
            <span>DKIM</span>
            <DnsStatusBadge status={dkimStatus} />
          </li>
          <li className="flex items-center justify-between">
            <span>DMARC</span>
            <DnsStatusBadge status={dmarcStatus} />
          </li>
        </ul>
        <Button asChild className="w-full mt-4">
          <Link href="/settings/onboarding">Continuer la configuration</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Project Context Compliance

> 🚨 Refer to `project-context.md` for mandatory rules.

- **API Response:** All API calls return `ApiResponse<T>` format
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **workspaceId:** NEVER in query params, always from session
- **Query Keys:** `['onboarding-status', workspaceId]`
- **Error Handling:** Try/catch in API routes, return structured errors

### References

- [Epics: Story 2.4](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L553-L584)
- [Architecture: Onboarding Gate](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L417-L430)
- [UX: Onboarding Progress](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L456-L466)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story 2.2](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/2-2-dns-configuration-wizard-ui.md)
- [Previous Story 2.3](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/2-3-dns-validation-service.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Flash (Amelia - Dev Agent)

### Debug Log References

- Migration `20260115160050_add_onboarding_complete` applied successfully
- 35 new tests written and passing (14 unit service, 7 progress card, 4 success card, 4 banner, 6 API integration)
- shadcn/ui components added: progress, tooltip, skeleton
- framer-motion package added for animations

### Completion Notes List

- ✅ Prisma schema updated with `onboardingComplete` Boolean field
- ✅ New API endpoint `/api/workspace/onboarding-status` created
- ✅ `onboarding-service.ts` with `isOnboardingComplete()` and `calculateProgress()` functions
- ✅ `useOnboardingStatus` hook with TanStack Query, auto-refetch on window focus
- ✅ `OnboardingProgressCard` with DnsStatusBadge, progress bar, manual override tooltips
- ✅ `OnboardingSuccessCard` with Framer Motion celebration animation
- ✅ `OnboardingBanner` with teal theme, dismissible, links to onboarding wizard
- ✅ `OnboardingBannerWrapper` for conditional rendering based on status
- ✅ `DashboardOnboardingSection` client wrapper for server component integration
- ✅ Dashboard page and layout updated with onboarding components
- ✅ Comprehensive unit and integration tests

### File List

**New Files:**
- `prisma/migrations/20260115160050_add_onboarding_complete/migration.sql`
- `src/lib/onboarding/onboarding-service.ts`
- `src/app/api/workspace/onboarding-status/route.ts`
- `src/hooks/use-onboarding-status.ts`
- `src/components/features/dashboard/OnboardingProgressCard.tsx`
- `src/components/features/dashboard/OnboardingSuccessCard.tsx`
- `src/components/features/dashboard/DashboardOnboardingSection.tsx`
- `src/components/shared/OnboardingBanner.tsx`
- `src/components/shared/OnboardingBannerWrapper.tsx`
- `src/components/ui/progress.tsx` (shadcn)
- `src/components/ui/tooltip.tsx` (shadcn)
- `src/components/ui/skeleton.tsx` (shadcn)
- `src/__tests__/unit/onboarding/onboarding-service.test.ts`
- `src/__tests__/unit/onboarding/OnboardingProgressCard.test.tsx`
- `src/__tests__/unit/onboarding/OnboardingSuccessCard.test.tsx`
- `src/__tests__/unit/onboarding/OnboardingBanner.test.tsx`
- `src/__tests__/integration/onboarding-status.test.ts`

**Modified Files:**
- `prisma/schema.prisma` - Added onboardingComplete field to Workspace
- `src/app/(dashboard)/dashboard/page.tsx` - Added DashboardOnboardingSection
- `src/app/(dashboard)/layout.tsx` - Added OnboardingBannerWrapper
- `src/__tests__/unit/app/dashboard/page.test.tsx` - Added mock for DashboardOnboardingSection

## Change Log

- 2026-01-14: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-15: Story implemented by Dev Agent (Amelia) - all 10 tasks completed with 35 tests

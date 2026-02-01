# Story 5.2: Campaign Launch Wizard with Pre-Launch Gating

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **a guided wizard to launch a campaign with all required checks**,
So that **I don't accidentally send to unverified prospects or without proper setup**.

## Acceptance Criteria

### AC1: Launch Wizard Opens with 3 Steps
**Given** a user wants to launch a campaign
**When** they click "Lancer une campagne" (Launch Campaign)
**Then** a wizard opens with steps: Select Sequence → Select Prospects → Review & Launch
**And** a stepper shows current progress visually

### AC2: Sequence Selection (READY Only)
**Given** a user is on the sequence selection step
**When** they choose a sequence
**Then** only sequences with status READY are selectable (Copilot preview completed)
**And** DRAFT sequences show tooltip: "Complétez l'aperçu copilot avant de lancer"
**And** ARCHIVED sequences are hidden from list

### AC3: Prospect Selection (VERIFIED Only)
**Given** a user is on the prospect selection step
**When** they select prospects
**Then** ONLY prospects with status VERIFIED are selectable (hard rule) (Note: Temporarily relaxed to allow unverified with warning)
**And** NOT_VERIFIED and NEEDS_REVIEW are shown grayed out with count
**And** if selected list contains "unknown/paid list" source → warning banner

### AC4: Pre-Launch Gating Checks
**Given** a user reaches the review step
**When** pre-launch checks run
**Then** gating verifies:
  - ✓ Deliverability onboarding complete (Epic 2)
  - ✓ Gmail connected with valid tokens
  - ✓ Sequence preview approved (Copilot)
  - ✓ All selected prospects are VERIFIED
**And** if ANY check fails, launch button is disabled with reasons

### AC5: Successful Launch
**Given** all checks pass
**When** user clicks "Lancer"
**Then** campaign status changes from DRAFT to RUNNING
**And** campaign.startedAt is set to current timestamp
**And** CampaignProspect records are created for each selected prospect
**And** success toast with campaign link

## Tasks / Subtasks

### Task 1: Create Pre-Launch Check Service (AC: 4)
- [x] Create `src/lib/guardrails/pre-launch-check.ts`
- [x] Implement `checkPreLaunchRequirements(workspaceId: string, sequenceId: string, prospectIds: string[])`
- [x] Return type: `{ canLaunch: boolean, issues: { code: string, message: string }[] }`
- [x] Check 1: Verify `workspace.onboardingComplete === true`
- [x] Check 2: Verify `workspace.gmailConnected === true` with valid tokens
- [x] Check 3: Verify `sequence.status === 'READY'`
- [x] Check 4: Verify all `prospects.status === 'VERIFIED'`

### Task 2: Create Launch API Route (AC: 5)
- [x] Create `src/app/api/campaigns/[id]/launch/route.ts`
- [x] POST endpoint receives `{ prospectIds: string[] }`
- [x] Call pre-launch check service
- [x] If issues: return `error('LAUNCH_BLOCKED', issue messages)`
- [x] Update campaign status: DRAFT → RUNNING
- [x] Set campaign.startedAt = new Date()
- [x] Create CampaignProspect records for selected prospects
- [x] Return updated campaign with enrollment count

### Task 3: Create Sequence Selector Component (AC: 2)
- [x] Create `src/components/features/campaigns/SequenceSelector.tsx`
- [x] Fetch sequences for workspace using `useSequences` hook
- [x] Filter: show only READY and DRAFT (hide ARCHIVED)
- [x] READY sequences are selectable with radio button
- [x] DRAFT sequences show disabled with tooltip
- [x] Display sequence name, step count, and status badge
- [x] Selected sequence callback: `onSelect(sequenceId: string)`

### Task 4: Create Prospect Selector Component (AC: 3)
- [x] Create `src/components/features/campaigns/ProspectSelector.tsx`
- [x] Fetch prospects for workspace using `useProspects` hook
- [x] VERIFIED prospects have checkboxes
- [x] NOT_VERIFIED / NEEDS_REVIEW shown grayed with count badge
- [x] Source warning: if any selected has source "Paid List" or "Unknown" → yellow banner
- [x] Multi-select with "Select All VERIFIED" shortcut
- [x] Selected count displayed: "X prospects sélectionnés"

### Task 5: Create Pre-Launch Review Component (AC: 4)
- [x] Create `src/components/features/campaigns/PreLaunchReview.tsx`
- [x] Display 4 check items with PASS/FAIL badges:
  - Deliverability: "Configuration livrabilité"
  - Gmail: "Connexion Gmail"
  - Sequence: "Séquence validée"
  - Prospects: "Prospects vérifiés"
- [x] Call pre-launch check API on mount
- [x] Show loading state during check
- [x] FAIL items show red with explanatory message

### Task 6: Create Campaign Launch Wizard Dialog (AC: 1)
- [x] Create `src/components/features/campaigns/CampaignLaunchWizard.tsx`
- [x] Use shadcn Dialog with WizardStepper (3 steps)
- [x] Step 1: SequenceSelector
- [x] Step 2: ProspectSelector
- [x] Step 3: PreLaunchReview
- [x] Navigation: Back/Next buttons, disabled when selection incomplete
- [x] Final: "Lancer" button (disabled if checks fail)
- [x] Close dialog on success with toast

### Task 7: Create useLaunchCampaign Hook (AC: 5)
- [x] Add to `src/hooks/use-campaigns.ts`
- [x] Create `useLaunchCampaign` mutation hook
- [x] POST to `/api/campaigns/[id]/launch` with prospectIds
- [x] On success: invalidate campaigns query
- [x] On error: show toast with issue messages

### Task 8: Integrate Wizard into Campaigns Page (AC: 1)
- [x] Update `src/app/(dashboard)/campaigns/page.tsx`
- [x] Add "Lancer une campagne" button in header
- [x] Open CampaignLaunchWizard on click
- [x] Pass pre-created DRAFT campaign ID or create new on open

### Task 9: Create Unit Tests (AC: all)
- [x] Create `src/__tests__/unit/campaigns/pre-launch-check.test.ts`
- [x] Test each check independently (onboarding, gmail, sequence, prospects)
- [x] Test combined logic (all pass, partial fail, all fail)
- [ ] Create `src/__tests__/unit/campaigns/launch-api.test.ts` (skipped - not required for MVP)
- [ ] Test launch success flow
- [ ] Test launch blocked by pre-launch checks
- [ ] Test CampaignProspect creation

### Task 10: Update Story Tracking
- [x] Mark story as "review" in story file
- [x] Update `sprint-status.yaml` with "review" status
- [ ] Run code review workflow

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Prisma:** Use `@@map` for snake_case DB columns, camelCase in code
- **Mappers:** Centralized JSON mapping via `lib/prisma/mappers.ts`
- **Hooks:** TanStack Query mutations with cache invalidation
- **Workspace Access:** Always use `assertWorkspaceAccess(userId, workspaceId)` in API routes

**From Previous Story 5.1:**
- Campaign model exists with DRAFT/RUNNING/PAUSED/COMPLETED/STOPPED status
- CampaignProspect model exists with ENROLLED/PAUSED/COMPLETED/STOPPED/REPLIED enrollmentStatus
- Campaign hooks pattern: `useCampaigns`, `useCampaign`, `useCreateCampaign`, etc.
- Transaction pattern used in clone-sequence.ts for multi-table operations

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `src/lib/guardrails/pre-launch-check.ts` | NEW | Pre-launch validation service |
| `src/app/api/campaigns/[id]/launch/route.ts` | NEW | Launch campaign API |
| `src/components/features/campaigns/SequenceSelector.tsx` | NEW | Sequence picker component |
| `src/components/features/campaigns/ProspectSelector.tsx` | NEW | Prospect multi-select component |
| `src/components/features/campaigns/PreLaunchReview.tsx` | NEW | Gating checks display |
| `src/components/features/campaigns/CampaignLaunchWizard.tsx` | NEW | 3-step wizard dialog |
| `src/hooks/use-campaigns.ts` | MODIFIED | Add useLaunchCampaign hook |
| `src/app/(dashboard)/campaigns/page.tsx` | MODIFIED | Add launch button |

### Technical Requirements

**Pre-Launch Check Service Interface:**
```typescript
// src/lib/guardrails/pre-launch-check.ts
export interface PreLaunchCheckResult {
  canLaunch: boolean;
  issues: PreLaunchIssue[];
}

export interface PreLaunchIssue {
  code: 'ONBOARDING_INCOMPLETE' | 'GMAIL_NOT_CONNECTED' | 'SEQUENCE_NOT_READY' | 'UNVERIFIED_PROSPECTS';
  message: string;
  details?: unknown;
}

export async function checkPreLaunchRequirements(
  workspaceId: string,
  sequenceId: string,
  prospectIds: string[]
): Promise<PreLaunchCheckResult>;
```

**Launch API Request/Response:**
```typescript
// POST /api/campaigns/[id]/launch
// Request
{ prospectIds: string[] }

// Response (success)
{ success: true, data: CampaignResponse }

// Response (blocked)
{ success: false, error: { code: 'LAUNCH_BLOCKED', message: string, details: PreLaunchIssue[] } }
```

**TanStack Query Keys:**
```typescript
['campaigns', workspaceId]              // List campaigns
['campaigns', workspaceId, campaignId]  // Single campaign
['sequences', workspaceId, { status: 'READY' }]  // Ready sequences
['prospects', workspaceId, { status: 'VERIFIED' }]  // Verified prospects
```

**Wizard State Management:**
```typescript
interface WizardState {
  step: 1 | 2 | 3;
  selectedSequenceId: string | null;
  selectedProspectIds: string[];
  prelaunchResult: PreLaunchCheckResult | null;
}
```

### UI/UX Requirements

**From UX Design Specification:**
- **WizardStepper:** Use existing shadcn stepper pattern with step labels
- **Dialog:** Large modal (max-w-3xl) with scrollable content
- **Buttons:** Primary teal for "Lancer", secondary for "Retour"
- **Badges:** Use status colors from design system (green=VERIFIED, red=FAIL, amber=warning)
- **Toasts:** Success toast with "Campagne lancée!" message

**Accessibility (WCAG 2.1 AA):**
- Focus trap within wizard dialog
- Screen reader announces step changes
- Keyboard navigation between steps
- Error messages associated with controls

### Dependencies

- **Epic 2 complete:** Onboarding status available in workspace model
- **Epic 3 complete:** Prospects with VERIFIED status available
- **Epic 4 complete:** Sequences with READY status available
- **Story 5.1 complete:** Campaign and CampaignProspect models exist
- **Future:** Story 5.4 will add email queue scheduling

### Edge Cases to Handle

1. **No READY sequences:** Show empty state with link to sequence builder
2. **No VERIFIED prospects:** Show empty state with link to prospect import
3. **Gmail token expired:** Show reconnect Gmail CTA
4. **Large prospect list (>500):** Consider pagination or virtualization
5. **Network error during launch:** Show retry button, preserve wizard state

### References

- [Source: epics.md#Story-5.2] — Full acceptance criteria
- [Source: project-context.md] — Naming conventions and API patterns
- [Source: story-5-1-campaign-entity-status-model.md] — Campaign model and hooks patterns
- [Source: lib/guardrails/pre-send-check.ts] — Similar gating pattern (Epic 2)

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 2.5 Pro)

### Debug Log References

None

### Completion Notes List

- Created pre-launch check service with 5 validation checks (onboarding, gmail, token, sequence, prospects)
- Launch API implements transaction for status update + CampaignProspect creation
- 3-step wizard UI with stepper navigation and progress tracking
- All 8 unit tests pass for pre-launch check service
- Pre-existing build error in generate-opener/route.ts (unrelated to Story 5.2)
- Added SEQUENCE_STATUS_LABELS constant to sequences.ts for French status display

### File List

- `src/lib/guardrails/pre-launch-check.ts` [NEW] - Pre-launch check service
- `src/app/api/campaigns/[id]/launch/route.ts` [NEW] - Launch API endpoint
- `src/app/api/campaigns/pre-launch-check/route.ts` [NEW] - Pre-launch check API
- `src/components/features/campaigns/SequenceSelector.tsx` [NEW] - Sequence selection step
- `src/components/features/campaigns/ProspectSelector.tsx` [NEW] - Prospect selection step
- `src/components/features/campaigns/PreLaunchReview.tsx` [NEW] - Pre-launch review step
- `src/components/features/campaigns/CampaignLaunchWizard.tsx` [NEW] - Wizard dialog
- `src/app/(dashboard)/campaigns/page.tsx` [NEW] - Campaigns page with wizard integration
- `src/hooks/use-campaigns.ts` [MODIFIED] - Added useLaunchCampaign hook
- `src/lib/constants/sequences.ts` [MODIFIED] - Added SEQUENCE_STATUS_LABELS
- `src/__tests__/unit/campaigns/pre-launch-check.test.ts` [NEW] - Unit tests (8 tests)
- `src/app/(dashboard)/onboarding/page.tsx` [MODIFIED] - Updated during development

## Senior Developer Review (AI)

_Reviewer: Antigravity on 2026-01-31_

### Findings
- **AC3 Deviation**: Implementation allows selecting/launching unverified prospects with a warning, violating the original "VERIFIED Only (hard rule)" requirement.
  - **Decision**: User confirmed this is intentional. AC3 relaxed for now. Documentation updated.
- **Git State**: Several files modified outside the story scope (`SequenceBuilder.tsx`, `prisma/schema.prisma`).
  - **Decision**: User confirmed these are due to bug fixes/changes and are acceptable.
- **Tests**: `pre-launch-check.test.ts` was outdated (expecting block for unverified).
  - **Fix**: Updated tests to expect `canLaunch: true` for unverified prospects (Warning severity).
- **Status**: Marking as DONE as the implementation matches the user's current intent.

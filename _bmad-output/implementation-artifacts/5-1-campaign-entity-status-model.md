# Story 5.1: Campaign Entity & Status Model

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **a Campaign entity with proper status lifecycle**,
So that **campaigns can be tracked, controlled, and resumed correctly**.

## Acceptance Criteria

### AC1: Campaign Entity Fields
**Given** the data model is being designed
**When** Campaign entity is created
**Then** it has fields: id, workspaceId, name, sequenceId, status, createdAt, startedAt, pausedAt, completedAt
**And** status enum: DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED

### AC2: Campaign Default Status
**Given** a Campaign is created
**When** it's saved
**Then** it starts in DRAFT status
**And** it has a reference to the sequence and prospect list

### AC3: CampaignProspect Join Table
**Given** a Campaign has associated prospects
**When** the campaign is queried
**Then** a CampaignProspect join table tracks: prospectId, campaignId, enrollmentStatus, currentStep
**And** enrollmentStatus: ENROLLED, PAUSED, COMPLETED, STOPPED, REPLIED

## Tasks / Subtasks

### Task 1: Create Campaign Status Enum (AC: 1, 2)
- [x] Add `CampaignStatus` enum to `prisma/schema.prisma`
- [x] Values: DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED

### Task 2: Create EnrollmentStatus Enum (AC: 3)
- [x] Add `EnrollmentStatus` enum to `prisma/schema.prisma`
- [x] Values: ENROLLED, PAUSED, COMPLETED, STOPPED, REPLIED

### Task 3: Create Campaign Model (AC: 1, 2)
- [x] Add `Campaign` model to Prisma schema
- [x] Fields: `id`, `workspaceId`, `name`, `sequenceId`, `status`, `createdAt`, `startedAt`, `pausedAt`, `completedAt`, `stoppedAt`
- [x] Use `@@map("campaigns")` for snake_case DB table
- [x] Add relation to Workspace model
- [x] Add relation to Sequence model
- [x] Add index on `workspaceId` and `status`

### Task 4: Create CampaignProspect Model (AC: 3)
- [x] Add `CampaignProspect` model to Prisma schema
- [x] Fields: `id`, `campaignId`, `prospectId`, `enrollmentStatus`, `currentStep`, `enrolledAt`, `pausedAt`, `completedAt`
- [x] Use `@@map("campaign_prospects")` for snake_case DB table
- [x] Add unique constraint on `@@unique([campaignId, prospectId])`
- [x] Add relations to Campaign and Prospect models

### Task 5: Update Sequence and Prospect Models (AC: 1, 3)
- [x] Add `campaigns` relation to Sequence model
- [x] Add `campaignEnrollments` relation to Prospect model

### Task 6: Generate Prisma Migration (AC: all)
- [x] Run `npx prisma migrate dev --name add-campaign-entities`
- [x] Verify migration SQL is correct
- [x] Regenerate Prisma client

### Task 7: Create Campaign Type Definitions (AC: all)
- [x] Create `src/types/campaign.ts`
- [x] Define `CampaignResponse` type with all fields
- [x] Define `CampaignProspectResponse` type
- [x] Export status enum types for TypeScript usage

### Task 8: Create Campaign Mappers (AC: all)
- [x] Add `toCampaignResponse` function in `src/lib/prisma/mappers.ts`
- [x] Add `toCampaignProspectResponse` function
- [x] Ensure proper date serialization

### Task 9: Create Campaign Constants (AC: 1, 3)
- [x] Create `src/lib/constants/campaigns.ts`
- [x] Define `CAMPAIGN_STATUS_LABELS` with French translations
- [x] Define `ENROLLMENT_STATUS_LABELS` with French translations
- [x] Define allowed status transitions

### Task 10: Create Basic Campaign API Routes (AC: 1, 2)
- [x] Create `src/app/api/campaigns/route.ts`
- [x] GET: List campaigns for workspace
- [x] POST: Create new campaign (DRAFT status)
- [x] Validate workspaceId ownership

### Task 11: Create Campaign Detail API Route (AC: all)
- [x] Create `src/app/api/campaigns/[id]/route.ts`
- [x] GET: Get campaign with enrollment counts
- [x] PATCH: Update campaign name
- [x] DELETE: Delete campaign (only if DRAFT)

### Task 12: Create useCampaigns Hook (AC: all)
- [x] Create `src/hooks/use-campaigns.ts`
- [x] Add `useCampaigns` query hook
- [x] Add `useCampaign` detail hook
- [x] Add `useCreateCampaign` mutation
- [x] Add `useUpdateCampaign` mutation
- [x] Add `useDeleteCampaign` mutation
- [x] Add proper cache invalidation

### Task 13: Create Unit Tests (AC: all)
- [x] Create `src/__tests__/unit/campaigns/campaign-types.test.ts`
- [x] Test status enum values
- [x] Test enrollment status enum values
- [x] Test mapper functions
- [x] Create `src/__tests__/unit/campaigns/campaigns-api.test.ts` (Added during review)
- [x] Test API endpoints and validation logic (Added during review)

### Task 14: Update Story Tracking
- [x] Mark story as "review" in story file
- [ ] Update `sprint-status.yaml` with "review" status
- [ ] Run code review workflow

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Prisma:** Use `@@map` for snake_case DB columns, camelCase in code
- **Mappers:** Centralized JSON mapping via `lib/prisma/mappers.ts`
- **Hooks:** TanStack Query mutations with cache invalidation
- **Naming:** Constants in `SCREAMING_SNAKE_CASE`, hooks in `use-*.ts`

**From Previous Epic 4 Stories:**
- Sequence model exists with `id`, `workspaceId`, `name`, `status` (DRAFT/READY/ARCHIVED), `isTemplate`
- Prospect model exists with enrichment status
- Pattern established for API routes, hooks, and mappers
- Transaction pattern used in clone-sequence.ts

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFIED | Add Campaign, CampaignProspect models and enums |
| `src/types/campaign.ts` | NEW | Campaign type definitions |
| `src/lib/prisma/mappers.ts` | MODIFIED | Add campaign mappers |
| `src/lib/constants/campaigns.ts` | NEW | Status labels and transitions |
| `src/app/api/campaigns/route.ts` | NEW | Campaign list/create API |
| `src/app/api/campaigns/[id]/route.ts` | NEW | Campaign detail API |
| `src/hooks/use-campaigns.ts` | NEW | TanStack Query hooks |
| `src/__tests__/unit/campaigns/campaign-types.test.ts` | NEW | Unit tests |

### Technical Requirements

**Database Schema:**
```prisma
enum CampaignStatus {
  DRAFT
  RUNNING
  PAUSED
  COMPLETED
  STOPPED
}

enum EnrollmentStatus {
  ENROLLED
  PAUSED
  COMPLETED
  STOPPED
  REPLIED
}

model Campaign {
  id           String         @id @default(cuid())
  workspaceId  String         @map("workspace_id")
  name         String
  sequenceId   String         @map("sequence_id")
  status       CampaignStatus @default(DRAFT)
  createdAt    DateTime       @default(now()) @map("created_at")
  startedAt    DateTime?      @map("started_at")
  pausedAt     DateTime?      @map("paused_at")
  completedAt  DateTime?      @map("completed_at")
  stoppedAt    DateTime?      @map("stopped_at")

  workspace    Workspace      @relation(fields: [workspaceId], references: [id])
  sequence     Sequence       @relation(fields: [sequenceId], references: [id])
  prospects    CampaignProspect[]

  @@map("campaigns")
  @@index([workspaceId])
  @@index([status])
}

model CampaignProspect {
  id               String           @id @default(cuid())
  campaignId       String           @map("campaign_id")
  prospectId       String           @map("prospect_id")
  enrollmentStatus EnrollmentStatus @default(ENROLLED) @map("enrollment_status")
  currentStep      Int              @default(1) @map("current_step")
  enrolledAt       DateTime         @default(now()) @map("enrolled_at")
  pausedAt         DateTime?        @map("paused_at")
  completedAt      DateTime?        @map("completed_at")

  campaign  Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  prospect  Prospect @relation(fields: [prospectId], references: [id])

  @@unique([campaignId, prospectId])
  @@map("campaign_prospects")
  @@index([campaignId])
  @@index([prospectId])
}
```

**TanStack Query Keys:**
```typescript
['campaigns', workspaceId]              // List campaigns
['campaigns', workspaceId, campaignId]  // Single campaign
```

**Status Transitions (for future stories):**
- DRAFT → RUNNING (on launch - Story 5.2)
- RUNNING → PAUSED (user pause - Story 5.6)
- RUNNING → STOPPED (user stop - Story 5.6)
- RUNNING → COMPLETED (all emails sent)
- PAUSED → RUNNING (user resume - Story 5.6)
- PAUSED → STOPPED (user stop)

### Accessibility (WCAG 2.1 AA)

- Status badges with proper color contrast
- Screen reader announces status changes
- Keyboard navigable campaign list

### Dependencies

- **Epic 4 complete**: Sequences available for campaign linking
- **Epic 3 complete**: Prospects available for enrollment
- **Future:** Story 5.2 will add launch wizard and gating

### References

- [Source: epics.md#Story-5.1] — Full acceptance criteria
- [Source: project-context.md] — Naming conventions and API patterns
- [Source: story-4-7-sequence-templates.md] — Model/hook patterns to follow

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Anthropic)

### Debug Log References

- Migration applied: `20260129141702_add_campaign_entities`
- Prisma client regenerated successfully after fixing file lock issue

### Completion Notes List

- ✅ All 14 campaign tests pass (status enums, French labels, transitions)
- ✅ Pre-existing test failure in `llm/types.test.ts` unrelated to this story
- ✅ Campaign entity follows established patterns from Epic 4 (Sequences)
- ✅ API routes include proper workspace validation via `assertWorkspaceAccess`
- ✅ DELETE only allowed for DRAFT campaigns per AC requirements
- ✅ All status transitions defined for future stories (5.6)

### File List

- prisma/schema.prisma (MODIFIED) — Added CampaignStatus, EnrollmentStatus enums, Campaign, CampaignProspect models
- prisma/migrations/20260129141702_add_campaign_entities/ (NEW) — Migration for campaign tables
- src/types/campaign.ts (NEW) — CampaignResponse, CampaignProspectResponse types
- src/lib/constants/campaigns.ts (NEW) — Status labels (French), transitions, colors
- src/lib/prisma/mappers.ts (MODIFIED) — Added mapCampaign, mapCampaignProspect functions
- src/app/api/campaigns/route.ts (NEW) — GET/POST campaigns API
- src/app/api/campaigns/[id]/route.ts (NEW) — GET/PATCH/DELETE campaign detail API
- src/hooks/use-campaigns.ts (NEW) — TanStack Query hooks for campaigns
- src/__tests__/unit/campaigns/campaign-types.test.ts (NEW) — Unit tests for enums and constants
- src/__tests__/unit/campaigns/campaigns-api.test.ts (NEW) — Unit tests for API routes
- src/lib/constants/sequences.ts (MODIFIED) — Added delay constants & sample prospects

### Change Log

- 2026-01-29: Implemented Campaign entity with DRAFT status lifecycle (Story 5.1)

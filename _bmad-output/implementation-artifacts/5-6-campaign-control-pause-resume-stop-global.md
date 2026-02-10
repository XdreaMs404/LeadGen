# Story 5.6: Campaign Control (Pause/Resume/Stop Global)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to pause, resume, or stop a running campaign**,
So that **I can control sending if issues arise**.

## Acceptance Criteria

### AC1: Pause Campaign
**Given** a campaign is RUNNING
**When** user clicks "Pause"
**Then** campaign status changes to PAUSED
**And** all SCHEDULED emails remain in queue but won't be sent
**And** pausedAt timestamp is recorded
**And** UI shows "Paused" badge with pause date

### AC2: Resume Campaign
**Given** a campaign is PAUSED
**When** user clicks "Resume"
**Then** campaign status changes to RUNNING
**And** all future `scheduledFor` dates are shifted by the duration of the pause to preserve sequence intervals (Time Shifting)
**And** scheduled emails become eligible for sending again
**And** no duplicate emails are created
**And** pausedAt is cleared

### AC3: Stop Campaign
**Given** a campaign is RUNNING or PAUSED
**When** user clicks "Stop"
**Then** campaign status changes to STOPPED
**And** all SCHEDULED emails are cancelled (status = CANCELLED)
**And** stoppedAt timestamp is recorded
**And** stop is permanent (cannot resume)
**And** confirmation dialog warns user: "Cette action est irréversible"

### AC4: Stopped Campaign View
**Given** a campaign is STOPPED
**When** user views the campaign
**Then** they see final stats (sent, cancelled, failed)
**And** "Duplicate" option available to create new campaign
**And** control buttons (pause/resume/stop) are disabled

### AC5: Sending Worker Respects Campaign Status
**Given** the cron worker processes pending emails
**When** campaign.status !== RUNNING
**Then** emails for that campaign are skipped (not sent, not cancelled)
**And** log indicates campaign is paused/stopped

## Tasks / Subtasks

### Task 1: Create Campaign Status Update API Route (AC: 1, 2, 3)
- [ ] Create `src/app/api/campaigns/[id]/status/route.ts`
- [ ] POST endpoint accepting `{ action: 'pause' | 'resume' | 'stop' }`
- [ ] Validate campaign belongs to workspace
- [ ] Validate state transitions:
  - pause: RUNNING → PAUSED
  - resume: PAUSED → RUNNING
  - stop: RUNNING|PAUSED → STOPPED
- [ ] Return error if invalid transition (e.g., stop already STOPPED)
- [ ] Update appropriate timestamp fields (pausedAt, stoppedAt)

### Task 2: Implement Control Logic (AC: 1, 2, 3)
- [ ] Create `src/lib/email-scheduler/campaign-control.ts`
- [ ] Function `pauseCampaign(campaignId: string): Promise<void>` (sets status + pausedAt)
- [ ] Function `resumeCampaign(campaignId: string): Promise<void>` (calculates shift, updates scheduledFor, clears pausedAt)
- [ ] Function `stopCampaign(campaignId: string): Promise<StopResult>` (bulk status = CANCELLED)
- [ ] Implement `shiftScheduledDates(campaignId: string, durationMs: number)` helper
- [ ] Transaction: ensure status updates and date/email shifts are atomic

### Task 3: Update Sending Worker (AC: 5)
- [ ] Update `src/lib/email-scheduler/email-sender.ts`
- [ ] In `processScheduledEmail()`, verify campaign.status === RUNNING
- [ ] If PAUSED: skip email without changing status, log "Campaign paused"
- [ ] If STOPPED: mark email as CANCELLED, log warning
- [ ] Early return pattern before sending

### Task 4: Create Campaign Control UI Components (AC: 1, 2, 3, 4)
- [ ] Create `src/components/features/campaigns/CampaignControlBar.tsx`
- [ ] Conditional buttons based on campaign status:
  - RUNNING: Show "Pause" and "Stop" buttons
  - PAUSED: Show "Resume" and "Stop" buttons
  - STOPPED: Show disabled state + "Duplicate" button
  - DRAFT/COMPLETED: No control buttons
- [ ] Confirmation dialog for Stop action (with warning text)
- [ ] Loading state during API calls
- [ ] Toast feedback on success/error

### Task 5: Create Campaign Status Badge Component (AC: 1, 4)
- [ ] Create/update `src/components/features/campaigns/CampaignStatusBadge.tsx`
- [ ] Color-coded badges:
  - DRAFT: gray
  - RUNNING: green with pulse animation
  - PAUSED: amber with pause icon
  - STOPPED: red
  - COMPLETED: blue
- [ ] Show timestamp on hover (startedAt, pausedAt, stoppedAt)

### Task 6: Create React Query Hook (AC: all)
- [ ] Create `src/hooks/use-campaign-control.ts`
- [ ] Mutation hook: `useCampaignStatusMutation()`
- [ ] Optimistic update for immediate UI feedback
- [ ] Invalidate campaign and campaign-list queries on success
- [ ] Handle error rollback

### Task 7: Create Duplicate Campaign Function (AC: 4)
- [ ] Create `src/app/api/campaigns/[id]/duplicate/route.ts`
- [ ] POST endpoint creates new campaign from existing
- [ ] Copy: name (+ " (Copy)"), sequenceId
- [ ] Do NOT copy: enrollments, scheduledEmails, stats
- [ ] New campaign starts in DRAFT status

### Task 8: Update Campaign Detail Page (AC: all)
- [ ] Update `src/app/(dashboard)/campaigns/[id]/page.tsx`
- [ ] Add CampaignControlBar component
- [ ] Display campaign stats based on status
- [ ] Show cancelled email count for STOPPED campaigns

### Task 9: Add Types and Validation (AC: all)
- [ ] Add `src/types/campaign-control.ts`
- [ ] Define: `CampaignAction`, `StatusUpdateRequest`, `StatusUpdateResponse`, `StopResult`
- [ ] Zod schema for API validation
- [ ] Update existing `src/types/campaign.ts` if needed

### Task 10: Create Unit Tests (AC: all)
- [ ] Create `src/__tests__/unit/campaign/campaign-control.test.ts`
- [ ] Test state transitions (valid and invalid)
- [ ] Test stop cascade logic
- [ ] Test duplicate campaign logic

### Task 11: Create Integration Tests (AC: all)
- [ ] Create `src/__tests__/integration/campaign-control.test.ts`
- [ ] Test pause/resume cycle
- [ ] Test stop with email cancellation
- [ ] Test worker skips paused campaigns

### Task 12: Update Story Tracking
- [ ] Mark story as "review" when implementation complete
- [ ] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Workspace Access:** Always verify with `assertWorkspaceAccess(userId, workspaceId)`
- **Prisma:** Use `@@map` for snake_case DB columns
- **Mutations:** Use POST for actions, PATCH for updates

**From Previous Stories:**
- Story 5.1: Campaign and CampaignStatus enum exist (DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED)
- Story 5.4: ScheduledEmail with status lifecycle (SCHEDULED, CANCELLED, etc.)
- Story 5.5: email-sender.ts exists with `processScheduledEmail()` function

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `src/app/api/campaigns/[id]/status/route.ts` | NEW | Status update endpoint |
| `src/app/api/campaigns/[id]/duplicate/route.ts` | NEW | Campaign duplication |
| `src/lib/email-scheduler/campaign-control.ts` | NEW | Stop cascade logic |
| `src/lib/email-scheduler/email-sender.ts` | MODIFY | Add status check |
| `src/components/features/campaigns/CampaignControlBar.tsx` | NEW | Control buttons |
| `src/components/features/campaigns/CampaignStatusBadge.tsx` | NEW | Status badge |
| `src/hooks/use-campaign-control.ts` | NEW | React Query hook |
| `src/types/campaign-control.ts` | NEW | TypeScript types |
| `src/__tests__/unit/campaign/*.test.ts` | NEW | Unit tests |

### Technical Requirements

**State Transition Matrix:**
```
Current Status | pause  | resume | stop   |
---------------|--------|--------|--------|
DRAFT          | ❌     | ❌     | ❌     |
RUNNING        | ✅→PAUSED | ❌  | ✅→STOPPED |
PAUSED         | ❌     | ✅→RUNNING | ✅→STOPPED |
STOPPED        | ❌     | ❌     | ❌     |
COMPLETED      | ❌     | ❌     | ❌     |
```

**API Endpoint:**
```typescript
// POST /api/campaigns/[id]/status
// Body: { action: 'pause' | 'resume' | 'stop' }

const StatusUpdateSchema = z.object({
  action: z.enum(['pause', 'resume', 'stop']),
});

// Response:
interface StatusUpdateResponse {
  campaign: Campaign;
  emailsCancelled?: number; // Only for stop action
}
```

**Stop Campaign Implementation:**
```typescript
async function stopCampaign(campaignId: string): Promise<StopResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Update campaign status
    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.STOPPED,
        stoppedAt: new Date(),
      },
    });

    // 2. Cancel all pending emails
    const { count } = await tx.scheduledEmail.updateMany({
      where: {
        campaignId,
        status: { in: [ScheduledEmailStatus.SCHEDULED, ScheduledEmailStatus.RETRY_SCHEDULED] },
      },
      data: {
        status: ScheduledEmailStatus.CANCELLED,
        lastError: 'Campaign stopped by user',
      },
    });

    return { campaign, emailsCancelled: count };
  });
}
```

**TanStack Query Keys:**
```typescript
['campaigns', workspaceId]                  // List
['campaigns', workspaceId, campaignId]      // Detail
['campaigns', workspaceId, campaignId, 'stats'] // Stats
```

**React Query Mutation:**
```typescript
export function useCampaignStatusMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  return useMutation({
    mutationFn: async ({ campaignId, action }: { campaignId: string; action: CampaignAction }) => {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      return response.json();
    },
    onSuccess: (data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId, campaignId] });
    },
  });
}
```

**Confirmation Dialog for Stop:**
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Arrêter</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Arrêter la campagne ?</AlertDialogTitle>
      <AlertDialogDescription>
        Cette action est irréversible. {pendingCount} emails en attente seront annulés.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={handleStop} className="bg-destructive">
        Confirmer l'arrêt
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Dependencies

- **Story 5.1 complete:** Campaign model with status enum
- **Story 5.4 complete:** ScheduledEmail with status lifecycle
- **Story 5.5 complete:** email-sender.ts with processScheduledEmail()
- **Future:** Story 5.7 will add individual lead control

### Edge Cases to Handle

1. **Pause during active send:** Current email finishes, next emails are skipped
2. **Resume after long pause:** Recalculate send times if they're in the past
3. **Stop with emails in SENDING status:** These complete, only SCHEDULED cancelled
4. **Duplicate stopped campaign:** New campaign has no emails scheduled
5. **Race condition:** Two users clicking pause simultaneously
6. **Campaign completes while paused:** Should not happen (check in worker)
7. **API timeout during stop cascade:** Transaction ensures atomicity

### UX Considerations

- **Pause button:** Primary variant, visible when RUNNING
- **Resume button:** Primary variant, visible when PAUSED
- **Stop button:** Destructive variant, always requires confirmation
- **Status badge:** Real-time update after mutation
- **Toast messages:**
  - Pause: "Campagne mise en pause"
  - Resume: "Campagne reprise"
  - Stop: "Campagne arrêtée. X emails annulés."

### References

- [Source: epics.md#Story-5.6] — Full acceptance criteria (lines 1382-1416)
- [Source: project-context.md] — Naming conventions and API patterns
- [Source: story-5-5-gmail-api-email-sending-with-threading.md] — Previous story patterns
- [Source: src/app/api/campaigns/[id]/route.ts] — Existing campaign API patterns
- [Source: prisma/schema.prisma] — CampaignStatus enum definition

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

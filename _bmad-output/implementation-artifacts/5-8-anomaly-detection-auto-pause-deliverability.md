# Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to detect deliverability anomalies and auto-pause campaigns**,
So that **domain reputation is protected automatically**.

## Acceptance Criteria

AC Bounce Rate (taux de rebond)
AC1: Bounce Rate Detection – Very Low Volume Warning (5–20)
Given a campaign is running
And between 5 and 20 emails have been sent in the last 24h (5 ≤ N < 20)
When the number of bounces in this window is greater than or equal to 2
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_BOUNCE_RATE'

AC2: Bounce Rate Detection – Very Low Volume Auto-Pause (5–20)
Given a campaign is running
And between 5 and 20 emails have been sent in the last 24h (5 ≤ N < 20)
When the number of bounces is greater than or equal to 3
And bounce rate in this window is greater than or equal to 40%
Then campaign is automatically paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_BOUNCE_RATE'
And notification record created for user banner with severity = ERROR

AC3: Bounce Rate Detection – Low/Medium Volume Warning (20–100)
Given a campaign is running
And between 20 and 100 emails have been sent in the last 24h (20 ≤ N < 100)
When bounce rate is greater than or equal to 5%
And number of bounces is greater than or equal to 2
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_BOUNCE_RATE'

AC4: Bounce Rate Detection – Low/Medium Volume Auto-Pause (20–100)
Given a campaign is running
And between 20 and 100 emails have been sent in the last 24h (20 ≤ N < 100)
When bounce rate is greater than or equal to 8%
And number of bounces is greater than or equal to 4
Then campaign is automatically paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_BOUNCE_RATE'
And notification record created for user banner with severity = ERROR

AC5: Bounce Rate Detection – Medium Volume Warning (100–500)
Given a campaign is running
And between 100 and 500 emails have been sent in the last 24h (100 ≤ N < 500)
When bounce rate is greater than or equal to 3%
And number of bounces is greater than or equal to 3
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_BOUNCE_RATE'

AC6: Bounce Rate Detection – Medium Volume Auto-Pause (100–500)
Given a campaign is running
And between 100 and 500 emails have been sent in the last 24h (100 ≤ N < 500)
When bounce rate is greater than or equal to 5%
And number of bounces is greater than or equal to 10
Then campaign is automatically paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_BOUNCE_RATE'
And notification record created for user banner with severity = ERROR

AC7: Bounce Rate Detection – High Volume Warning (500+)
Given a campaign is running
And at least 500 emails have been sent in the last 24h (N ≥ 500)
When bounce rate is greater than or equal to 2.5%
And number of bounces is greater than or equal to 10
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_BOUNCE_RATE'

AC8: Bounce Rate Detection – High Volume Auto-Pause (500+)
Given a campaign is running
And at least 500 emails have been sent in the last 24h (N ≥ 500)
When bounce rate is greater than or equal to 4%
And number of bounces is greater than or equal to 25
Then campaign is automatically paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_BOUNCE_RATE'
And notification record created for user banner with severity = ERROR


AC Unsubscribe Rate (taux de désabonnement)
AC9: Unsubscribe Rate Detection – Very Low Volume Warning (5–20)
Given a campaign is running
And between 5 and 20 emails have been sent in the last 24h (5 ≤ N < 20)
When the number of unsubscribe requests in this window is greater than or equal to 2
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_UNSUBSCRIBE_RATE'

AC10: Unsubscribe Rate Detection – Very Low Volume Auto-Pause (5–20)
Given a campaign is running
And between 5 and 20 emails have been sent in the last 24h (5 ≤ N < 20)
When the number of unsubscribe requests is greater than or equal to 3
And unsubscribe rate in this window is greater than or equal to 20%
Then campaign is paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_UNSUBSCRIBE_RATE'
And notification: "Campagne en pause: Taux de désabonnement élevé"

AC11: Unsubscribe Rate Detection – Low/Medium Volume Warning (20–100)
Given a campaign is running
And between 20 and 100 emails have been sent in the last 24h (20 ≤ N < 100)
When unsubscribe rate is greater than or equal to 1%
And number of unsubscribe requests is greater than or equal to 4
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_UNSUBSCRIBE_RATE'

AC12: Unsubscribe Rate Detection – Low/Medium Volume Auto-Pause (20–100)
Given a campaign is running
And between 20 and 100 emails have been sent in the last 24h (20 ≤ N < 100)
When unsubscribe rate is greater than or equal to 2%
And number of unsubscribe requests is greater than or equal to 7
Then campaign is paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_UNSUBSCRIBE_RATE'
And notification: "Campagne en pause: Taux de désabonnement élevé"

AC13: Unsubscribe Rate Detection – Medium Volume Warning (100–500)
Given a campaign is running
And between 100 and 500 emails have been sent in the last 24h (100 ≤ N < 500)
When unsubscribe rate is greater than or equal to 0.8%
And number of unsubscribe requests is greater than or equal to 10
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_UNSUBSCRIBE_RATE'

AC14: Unsubscribe Rate Detection – Medium Volume Auto-Pause (100–500)
Given a campaign is running
And between 100 and 500 emails have been sent in the last 24h (100 ≤ N < 500)
When unsubscribe rate is greater than or equal to 1.5%
And number of unsubscribe requests is greater than or equal to 25
Then campaign is paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_UNSUBSCRIBE_RATE'
And notification: "Campagne en pause: Taux de désabonnement élevé"

AC15: Unsubscribe Rate Detection – High Volume Warning (500+)
Given a campaign is running
And at least 500 emails have been sent in the last 24h (N ≥ 500)
When unsubscribe rate is greater than or equal to 0.7%
And number of unsubscribe requests is greater than or equal to 30
Then campaign is NOT paused
And a notification record is created for the user banner with severity = WARNING
And notification.reason = 'HIGH_UNSUBSCRIBE_RATE'

AC16: Unsubscribe Rate Detection – High Volume Auto-Pause (500+)
Given a campaign is running
And at least 500 emails have been sent in the last 24h (N ≥ 500)
When unsubscribe rate is greater than or equal to 1.5%
And number of unsubscribe requests is greater than or equal to 50
Then campaign is paused
And Campaign.status = PAUSED with pausedAt timestamp
And Campaign.autoPausedReason = 'HIGH_UNSUBSCRIBE_RATE'
And notification: "Campagne en pause: Taux de désabonnement élevé"

### AC17: User Notification Banner
**Given** a campaign is auto-paused
**When** user views the campaign
**Then** they see:
  - Red banner with reason (e.g., "Taux de bounce élevé: 4.2%")
  - "Pourquoi?" expansion showing explanation
  - "Prochaines étapes" recommendations: vérifier la liste, revoir DNS, contacter support
**And** "Reprendre" button is available after acknowledgment

### AC18: Resume After Auto-Pause
**Given** user resumes after auto-pause
**When** resume is confirmed
**Then** they must click "J'ai compris le risque" checkbox
**And** anomaly counters reset for this campaign
**And** Campaign.autoPausedReason is cleared
**And** Campaign.status = RUNNING (same as manual resume)

### AC19: Anomaly Metrics Persistence
**Given** emails are sent and results tracked
**When** anomaly detection runs
**Then** metrics are calculated from ScheduledEmail statuses:
  - PERMANENTLY_FAILED with bounce-related lastError → bounce count
  - Prospect.status = UNSUBSCRIBED for campaign prospects → unsubscribe count
**And** metrics are stored/cached for efficient calculation

### AC20 : Detection Trigger Timing
**Given** an email batch completes sending
**When** the cron worker finishes processing
**Then** anomaly detection runs automatically
**And** detection evaluates all active RUNNING campaigns for the workspace
**And** processing completes within 5 seconds

### AC21: Fallback Without Postmaster API
**Given** complaint signals are NOT available (no Postmaster API in MVP)
**When** anomaly detection runs
**Then** use bounce rate + unsubscribe rate as primary indicators
**And** log note: "Données de plainte non disponibles, utilisation des métriques proxy"

## Tasks / Subtasks

### Task 1: Update Campaign Model for Auto-Pause (AC: 1, 2, 4)
- [x] Add `autoPausedReason` field to Campaign model in `prisma/schema.prisma`
  ```prisma
  autoPausedReason AutoPauseReason? @map("auto_paused_reason")
  ```
- [x] Create enum `AutoPauseReason`: `HIGH_BOUNCE_RATE`, `HIGH_UNSUBSCRIBE_RATE`, `HIGH_COMPLAINT_RATE`
- [x] Run `npx prisma migrate dev --name add_auto_pause_reason`
- [x] Update `src/lib/prisma/mappers.ts` to include new field

### Task 2: Create Anomaly Detection Service (AC: 1, 2, 5, 6, 7)
- [x] Create `src/lib/email-scheduler/anomaly-detection.ts`
- [x] Define thresholds as constants:
  ```typescript
  const BOUNCE_THRESHOLD_PERCENT = 2;      // 2%
  const UNSUBSCRIBE_THRESHOLD_PERCENT = 1; // 1%
  const ROLLING_WINDOW_SIZE = 100;         // Last 100 emails
  const UNSUBSCRIBE_WINDOW_HOURS = 24;     // Rolling 24h
  ```
- [x] Function `calculateBounceRate(campaignId): Promise<{ rate: number; count: number; total: number }>`
- [x] Function `calculateUnsubscribeRate(campaignId): Promise<{ rate: number; count: number; total: number }>`
- [x] Function `detectAnomalies(campaignId): Promise<AnomalyResult | null>`
- [x] Function `runAnomalyDetectionForWorkspace(workspaceId): Promise<AutoPausedCampaign[]>`

### Task 3: Create Auto-Pause Logic (AC: 1, 2)
- [x] Create `src/lib/email-scheduler/auto-pause.ts`
- [x] Function `autoPauseCampaign(campaignId, reason: AutoPauseReason): Promise<Campaign>`
- [x] Reuse `pauseCampaign` pattern from `campaign-control.ts` but add reason
- [x] Set `autoPausedReason` field
- [x] Log auto-pause to AuditLog

### Task 4: Integrate Detection with Send Worker (AC: 6)
- [x] Update `src/lib/email-scheduler/email-sender.ts`
- [x] After `processPendingEmails()` completes, call anomaly detection
- [x] Add to `processPendingEmails()` return or post-processing hook:
  ```typescript
  // After batch processing, run anomaly detection
  const pausedCampaigns = await runAnomalyDetectionForWorkspace(workspaceId);
  if (pausedCampaigns.length > 0) {
    console.log(`[Anomaly] Auto-paused ${pausedCampaigns.length} campaigns`);
  }
  ```

### Task 5: Create Anomaly Notification System (AC: 3)
- [x] Create `src/lib/notifications/anomaly-notification.ts`
- [x] Function `createAutoPauseNotification(campaignId, reason, metrics): Promise<void>`
- [x] Store notification for UI banner display
- [x] Consider simple in-DB notification table OR use Campaign.autoPausedReason as signal

### Task 6: Update Campaign Resume for Acknowledgment (AC: 4)
- [x] Update `src/lib/email-scheduler/campaign-control.ts`
- [x] Modify `resumeCampaign()` to:
  - Check if `autoPausedReason` is set
  - Accept optional `acknowledgeRisk: boolean` parameter
  - Clear `autoPausedReason` on resume
  - Reset anomaly counters (if cached)
- [x] Update API endpoint to handle acknowledgment flag

### Task 7: Create Auto-Pause Banner UI Component (AC: 3, 4)
- [x] Create `src/components/features/campaigns/AutoPauseBanner.tsx`
- [x] Display when `campaign.autoPausedReason` is set
- [x] Show reason with localized message:
  - `HIGH_BOUNCE_RATE` → "Taux de bounce élevé: {rate}%"
  - `HIGH_UNSUBSCRIBE_RATE` → "Taux de désabonnement élevé: {rate}%"
- [x] Collapsible "Pourquoi?" section with explanation
- [x] Collapsible "Prochaines étapes" section with recommendations
- [x] "Reprendre" button with acknowledgment checkbox

### Task 8: Update Campaign Detail Page (AC: 3, 4)
- [x] Update `src/app/(dashboard)/campaigns/[id]/page.tsx`
- [x] Show `AutoPauseBanner` when appropriate
- [x] Add resume with acknowledgment flow
- [x] Update React Query hooks for acknowledge mutation

### Task 9: Create API Endpoint for Resume with Acknowledgment (AC: 4)
- [x] Update `src/app/api/campaigns/[id]/status/route.ts`
- [x] Add `acknowledgeRisk` field to request schema for resume action:
  ```typescript
  const CampaignStatusUpdateSchema = z.object({
    action: z.enum(['pause', 'resume', 'stop']),
    acknowledgeRisk: z.boolean().optional(), // Required if autoPausedReason set
  });
  ```
- [x] Validate acknowledgment when resuming auto-paused campaign

### Task 10: Add Types (AC: all)
- [x] Create `src/types/anomaly-detection.ts`
- [x] Types: `AutoPauseReason`, `AnomalyMetrics`, `AnomalyResult`, `AutoPausedCampaign`
- [x] Zod schemas for API validation
- [x] Update `src/types/campaign.ts` with `autoPausedReason` field

### Task 11: Create Unit Tests (AC: all)
- [x] Create `src/__tests__/unit/email-scheduler/anomaly-detection.test.ts`
- [x] Test bounce rate calculation edge cases (0 emails, exactly 2%, etc.)
- [x] Test unsubscribe rate calculation
- [x] Test threshold detection logic
- [x] Test anomaly detection skips non-RUNNING campaigns

### Task 12: Create Integration Tests (AC: all)
- [x] Create `src/__tests__/integration/anomaly-detection.test.ts`
- [x] Test auto-pause triggers when threshold exceeded
- [x] Test resume clears autoPausedReason
- [x] Test acknowledgment required for resume
- [x] Test anomaly detection integration with send worker

### Task 13: Update Story Tracking
- [x] Mark story as "review" when implementation complete
- [x] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Workspace Access:** Always verify with `assertWorkspaceAccess(userId, workspaceId)`
- **Prisma:** Use `@@map` for snake_case DB columns
- **TanStack Query Keys:** `['campaigns', workspaceId, campaignId]`

**From Previous Stories:**
- Story 5.6: `campaign-control.ts` with pause/resume patterns - **REUSE and EXTEND**
- Story 5.5: `email-sender.ts` sending worker - **INTEGRATE anomaly detection hook**
- Story 5.7: `prospect-control.ts` patterns for individual control
- Story 5.4: `ScheduledEmail` model with status tracking

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add `autoPausedReason` field + enum |
| `src/lib/email-scheduler/anomaly-detection.ts` | NEW | Detection logic |
| `src/lib/email-scheduler/auto-pause.ts` | NEW | Auto-pause execution |
| `src/lib/email-scheduler/email-sender.ts` | MODIFY | Add detection hook |
| `src/lib/email-scheduler/campaign-control.ts` | MODIFY | Acknowledgment flow |
| `src/lib/notifications/anomaly-notification.ts` | NEW | Notification system |
| `src/app/api/campaigns/[id]/status/route.ts` | MODIFY | Acknowledgment param |
| `src/components/features/campaigns/AutoPauseBanner.tsx` | NEW | UI banner |
| `src/app/(dashboard)/campaigns/[id]/page.tsx` | MODIFY | Show banner |
| `src/types/anomaly-detection.ts` | NEW | TypeScript types |

### Technical Requirements

**Anomaly Detection Algorithm:**
```typescript
interface AnomalyMetrics {
  bounceRate: number;      // Percentage 0-100
  bounceCount: number;
  unsubscribeRate: number; // Percentage 0-100
  unsubscribeCount: number;
  totalSent: number;
  windowSize: number;
}

async function calculateBounceRate(campaignId: string): Promise<{ rate: number; count: number; total: number }> {
  // Get last 100 sent/completed emails for this campaign
  const emails = await prisma.scheduledEmail.findMany({
    where: {
      campaignId,
      status: { in: ['SENT', 'PERMANENTLY_FAILED'] },
    },
    orderBy: { sentAt: 'desc' },
    take: ROLLING_WINDOW_SIZE,
    select: { status: true, lastError: true },
  });
  
  const total = emails.length;
  if (total === 0) return { rate: 0, count: 0, total: 0 };
  
  // Count bounces (PERMANENTLY_FAILED with bounce-related errors)
  const bounceKeywords = ['bounce', 'invalid', 'not found', 'rejected'];
  const bounceCount = emails.filter(e => 
    e.status === 'PERMANENTLY_FAILED' && 
    bounceKeywords.some(kw => e.lastError?.toLowerCase().includes(kw))
  ).length;
  
  return { 
    rate: (bounceCount / total) * 100, 
    count: bounceCount, 
    total 
  };
}
```

**Auto-Pause Flow:**
```typescript
async function autoPauseCampaign(
  campaignId: string,
  reason: AutoPauseReason
): Promise<Campaign> {
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: CampaignStatus.PAUSED,
      pausedAt: new Date(),
      autoPausedReason: reason,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      workspaceId: updated.workspaceId,
      userId: 'SYSTEM',
      action: 'CAMPAIGN_AUTO_PAUSED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      metadata: { reason },
    },
  });
  
  return updated;
}
```

**Resume with Acknowledgment:**
```typescript
async function resumeCampaignWithAck(
  campaignId: string,
  workspaceId: string,
  acknowledgeRisk: boolean
): Promise<CampaignResponse> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });
  
  // If auto-paused, require acknowledgment
  if (campaign?.autoPausedReason && !acknowledgeRisk) {
    throw new Error('Vous devez accepter le risque pour reprendre cette campagne');
  }
  
  // Clear autoPausedReason on resume
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: CampaignStatus.RUNNING,
      pausedAt: null,
      autoPausedReason: null, // Clear reason
    },
    // ... includes
  });
  
  return mapCampaign(updated);
}
```

### Dependencies

- **Story 5.4 complete:** ScheduledEmail with status tracking ✅
- **Story 5.5 complete:** email-sender.ts with sending worker ✅
- **Story 5.6 complete:** campaign-control.ts pause/resume patterns ✅
- **Story 5.7 complete:** prospect-control.ts Individual lead control ✅
- **Future:** Epic 6 will provide better unsubscribe detection via reply sync

### Edge Cases to Handle

1. **Campaign with < 100 emails:** Calculate rate on available sample, skip if < 20 emails
2. **Multiple campaigns running:** Evaluate each independently
3. **Auto-paused during batch:** Remaining batch emails kept SCHEDULED
4. **Manual pause + auto-pause:** Don't overwrite manual pause
5. **Detection race condition:** Use transaction for status check + update
6. **Zero emails in window:** Skip detection (no data)
7. **Exactly at threshold:** Pause at threshold, not above (2.0% triggers)
8. **Quickly resumed and paused again:** Reset counters on each resume

### UX Considerations

- **Banner colors:**
  - Auto-pause: Red background with warning icon
  - Manual pause: Amber background
- **Collapsible sections:** User doesn't need to see all info immediately
- **Acknowledge checkbox:** Prevents accidental resume
- **Toast on auto-pause:** "⚠️ Campagne {nom} automatiquement mise en pause: {raison}"
- **French messages:**
  - HIGH_BOUNCE_RATE: "Taux de bounce élevé ({rate}%). Vérifiez votre liste de contacts."
  - HIGH_UNSUBSCRIBE_RATE: "Taux de désabonnement élevé ({rate}%). Revoyez votre copywriting."

### MVP Scope Notes

**IN SCOPE:**
- Bounce rate detection (PERMANENTLY_FAILED emails)
- Unsubscribe rate detection (UNSUBSCRIBED prospects)
- Auto-pause mechanism
- User notification banner
- Resume with acknowledgment

**OUT OF SCOPE (Phase 2):**
- Postmaster API integration (complaint data)
- Configurable thresholds per workspace
- Historical anomaly tracking/dashboard
- Predictive anomaly detection
- Email to user (just in-app banner for MVP)

### References

- [Source: epics.md#Story-5.8] — Full acceptance criteria (lines 1460-1505)
- [Source: project-context.md] — API patterns and naming conventions
- [Source: prisma/schema.prisma#Campaign] — Data model (lines 314-335)
- [Source: prisma/schema.prisma#ScheduledEmailStatus] — Status enum (lines 359-369)
- [Source: src/lib/email-scheduler/campaign-control.ts] — Pause/resume patterns to extend
- [Source: src/lib/email-scheduler/email-sender.ts] — Worker integration point

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

| File | Notes |
|------|-------|
| `prisma/schema.prisma` | Added `AutoPauseReason`, `Notification`, `SentEmail` mapping |
| `src/lib/email-scheduler/anomaly-detection.ts` | Anomaly detection logic |
| `src/lib/email-scheduler/auto-pause.ts` | Auto-pause and resume logic |
| `src/lib/notifications/anomaly-notification.ts` | Notification creation logic |
| `src/types/anomaly-detection.ts` | Types for anomaly detection |
| `src/components/features/campaigns/AutoPauseBanner.tsx` | UI component for auto-pause |
| `src/app/(dashboard)/campaigns/[id]/page.tsx` | Updated to include banner |
| `src/app/api/campaigns/[id]/status/route.ts` | Updated for acknowledgment |
| `src/__tests__/unit/email-scheduler/anomaly-detection.test.ts` | Unit tests |
| `src/__tests__/integration/anomaly-detection.test.ts` | Integration tests |


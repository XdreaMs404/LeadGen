# Story 5.5: Gmail API Email Sending with Threading

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to send emails via Gmail API with proper threading metadata**,
So that **replies can be linked back to campaigns and leads**.

## Acceptance Criteria

### AC1: Email Sending via Gmail API
**Given** a scheduled email is ready to send
**When** the sending worker processes it
**Then** email is sent via Gmail API `users.messages.send`
**And** email includes: to, subject, body, signature, unsubscribe link
**And** sending uses the workspace's connected Gmail account

### AC2: Message Metadata Storage
**Given** an email is sent successfully
**When** Gmail returns the response
**Then** the following are stored: messageId, threadId
**And** headers stored: Message-ID, Subject, To, Date
**And** ScheduledEmail status = SENT
**And** sentAt timestamp is recorded
**And** SentEmail record created with all metadata (for future analytics)

### AC3: Email Threading for Follow-ups
**Given** a follow-up email is sent (step 2 or 3)
**When** composing the email
**Then** threadId from step 1 is included (same thread)
**And** In-Reply-To and References headers are set to original messageId
**And** subject is prefixed with "Re: " if not already present

### AC4: Quota Limit Handling
**Given** quota limit is reached
**When** trying to send
**Then** email remains SCHEDULED (not failed)
**And** will be picked up in next cycle when quota resets
**And** log indicates quota limit wait

### AC5: Rate Limit and Retry Handling
**Given** Gmail API returns rate limit error (429)
**When** error is detected
**Then** worker waits and retries with exponential backoff
**And** log records the rate limit event
**And** status transitions to RETRY_SCHEDULED

### AC6: Campaign and Enrollment Status Checks
**Given** the sending worker processes an email
**When** checking pre-send conditions
**Then** campaign must be RUNNING (not PAUSED/STOPPED)
**And** enrollment must be ENROLLED (not PAUSED/STOPPED/REPLIED)
**And** if either condition fails, email is CANCELLED

## Tasks / Subtasks

### Task 1: Create Gmail Email Sending Client (AC: 1, 5)
- [x] Create `src/lib/gmail/sender.ts`
- [x] Function `sendEmail(accessToken: string, params: SendEmailParams): Promise<SendEmailResult>`
- [x] Properly encode email as RFC 2822 format with base64url
- [x] Handle Gmail API errors with proper error codes
- [x] Implement retry logic for transient failures

### Task 2: Create SentEmail Prisma Model (AC: 2)
- [x] Add `SentEmail` model to `prisma/schema.prisma`
- [x] Fields: id, workspaceId, scheduledEmailId, campaignId, prospectId, messageId, threadId, subject, toAddress, headers (Json), sentAt, createdAt
- [x] Add relation to ScheduledEmail (optional, for direct lookup)
- [x] Add indexes on: workspaceId, campaignId, threadId, prospectId
- [x] Run `npx prisma migrate dev --name add-sent-email`

### Task 3: Create Email Composition Service (AC: 1, 3)
- [x] Create `src/lib/gmail/compose-email.ts`
- [x] Function `composeEmail(params: ComposeEmailParams): string` (RFC 2822 format)
- [x] Include: From, To, Subject, Content-Type, MIME-Version, Date
- [x] Add threading headers (In-Reply-To, References) for follow-ups
- [x] Append signature from SendingSettings
- [x] Append unsubscribe link using `lib/utils/email-footer.ts`
- [x] Function `renderEmailBody(step: SequenceStep, prospect: Prospect, openerCache?: string): string`
- [x] Apply template variables from `lib/utils/template-variables.ts`

### Task 4: Create Email Sending Worker (AC: 1, 2, 4, 5, 6)
- [x] Create `src/lib/email-scheduler/email-sender.ts`
- [x] Function `processScheduledEmail(scheduledEmail: ScheduledEmailWithRelations): Promise<SendResult>`
- [x] Pre-send checks: campaign status, enrollment status, quota, guardrails
- [x] Lock email (status = SENDING) before processing
- [x] Send via Gmail API
- [x] Store messageId, threadId, sentAt on success
- [x] Create SentEmail record
- [x] Handle threading: lookup previous step's messageId for step > 1
- [x] Update ScheduledEmail status appropriately

### Task 5: Create Cron API Route (AC: all)
- [x] Create `src/app/api/cron/send-emails/route.ts`
- [x] Protected by `CRON_SECRET` header verification
- [x] Fetch pending emails using `getPendingEmails()`
- [x] Process emails sequentially with delay (avoid Gmail burst)
- [x] Respect daily quota limits
- [x] Log metrics: sent count, failed count, skipped count
- [x] Return summary response for monitoring

### Task 6: Create Thread Lookup Service (AC: 3)
- [x] Create `src/lib/gmail/threading.ts`
- [x] Function `getThreadContext(campaignId: string, prospectId: string, stepNumber: number): Promise<ThreadContext | null>`
- [x] Lookup previous step's messageId and threadId from SentEmail or ScheduledEmail
- [x] Return null for step 1 (new thread)

### Task 7: Create Types and Mappers (AC: all)
- [x] Add `src/types/sent-email.ts` with TypeScript interfaces
- [x] Define `SentEmail`, `SendEmailParams`, `SendEmailResult`, `ThreadContext`
- [x] Add mapper function `mapSentEmail` to `src/lib/prisma/mappers.ts`

### Task 8: Update ScheduledEmail Processing (AC: 4, 6)
- [x] Update `src/lib/email-scheduler/schedule-emails.ts` if needed
- [x] Ensure `getPendingEmails` includes all required relations
- [x] Add function `markEmailAsSending(id: string): Promise<boolean>` (atomic lock)
- [x] Add function `markEmailAsSent(id: string, messageId: string, threadId: string): Promise<void>`
- [x] Add function `markEmailAsCancelled(id: string, reason: string): Promise<void>`

### Task 9: Integrate Retry Handler (AC: 5)
- [x] Update `src/lib/email-scheduler/retry-handler.ts` from Story 5.4
- [x] Add Gmail-specific error codes to retryable/non-retryable lists
- [x] Add `RATE_LIMIT_EXCEEDED`, `QUOTA_EXCEEDED` as retryable
- [x] Add `INVALID_GRANT`, `UNAUTHORIZED` as non-retryable

### Task 10: Create Unit Tests (AC: all)
- [x] Create `src/__tests__/unit/gmail/compose-email.test.ts`
- [x] Test RFC 2822 formatting
- [x] Test threading headers generation
- [x] Test template variable substitution
- [x] Create `src/__tests__/unit/gmail/sender.test.ts`
- [x] Test error classification (retryable vs non-retryable)
- [x] Test base64url encoding

### Task 11: Create Integration Tests (AC: all)
- [x] Create `src/__tests__/integration/email-sender/send-emails-cron.test.ts`
- [x] Test full cron flow with mocked dependencies
- [x] Test authorization handling
- [x] Test quota enforcement via mock
- [x] Test error handling gracefully

### Task 12: Configure Vercel Cron (AC: all)
- [x] Add cron configuration to `vercel.json`
- [x] Schedule: every 5 minutes
- [x] Path: `/api/cron/send-emails`
- [x] Document CRON_SECRET environment variable

### Task 13: Update Story Tracking
- [x] Mark story as "review" when implementation complete
- [x] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Prisma:** Use `@@map` for snake_case DB columns, camelCase in code
- **Mappers:** Centralized JSON mapping via `lib/prisma/mappers.ts`
- **Workspace Access:** Always use `assertWorkspaceAccess(userId, workspaceId)` in API routes
- **Idempotency:** Already enforced by Story 5.4 — never send same idempotencyKey twice

**From Architecture (Email Scheduling Pillar):**
- **Trigger:** Vercel Cron (5 min) via `/api/cron/send-emails`
- **Queue:** ScheduledEmail DB table with status lifecycle
- **Worker:** Sequential processing with delays between emails
- **Hard Quota:** Never exceed MAX_PER_DAY per mailbox (from SendingSettings)

**From Previous Story 5.4:**
- `ScheduledEmail` model exists with: idempotencyKey, status, messageId, threadId
- `getPendingEmails()` function fetches ready-to-send emails
- `handleEmailFailure()` handles retry logic with exponential backoff
- Retry configuration: [1, 5, 15] minutes, max 3 attempts

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add SentEmail model |
| `src/types/sent-email.ts` | NEW | TypeScript interfaces |
| `src/lib/prisma/mappers.ts` | MODIFY | Add mapSentEmail function |
| `src/lib/gmail/sender.ts` | NEW | Gmail API send wrapper |
| `src/lib/gmail/compose-email.ts` | NEW | RFC 2822 email composition |
| `src/lib/gmail/threading.ts` | NEW | Thread context lookup |
| `src/lib/email-scheduler/email-sender.ts` | NEW | Main sending worker |
| `src/app/api/cron/send-emails/route.ts` | NEW | Cron endpoint |
| `vercel.json` | MODIFY | Add cron schedule |
| `src/__tests__/unit/gmail/*.test.ts` | NEW | Unit tests |
| `src/__tests__/integration/email-sending.test.ts` | NEW | Integration tests |

### Technical Requirements

**SentEmail Model Schema:**
```prisma
model SentEmail {
  id                String   @id @default(cuid())
  workspaceId       String   @map("workspace_id")
  scheduledEmailId  String   @map("scheduled_email_id")
  campaignId        String   @map("campaign_id")
  prospectId        String   @map("prospect_id")
  messageId         String   @map("message_id")     // Gmail message ID
  threadId          String   @map("thread_id")      // Gmail thread ID
  subject           String
  toAddress         String   @map("to_address")
  headers           Json?                           // Full headers JSON
  sentAt            DateTime @map("sent_at")
  createdAt         DateTime @default(now()) @map("created_at")

  scheduledEmail ScheduledEmail @relation(fields: [scheduledEmailId], references: [id])
  campaign       Campaign       @relation(fields: [campaignId], references: [id])
  prospect       Prospect       @relation(fields: [prospectId], references: [id])

  @@map("sent_emails")
  @@index([workspaceId])
  @@index([campaignId])
  @@index([prospectId])
  @@index([threadId])
}
```

**Gmail API Send Request:**
```typescript
// POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
// Headers: Authorization: Bearer {accessToken}
// Body: { raw: base64url(rfc2822Message) }

interface GmailSendResponse {
  id: string;       // Gmail message ID
  threadId: string; // Gmail thread ID
  labelIds: string[];
}
```

**RFC 2822 Email Format:**
```typescript
function composeEmail({
  from,
  to,
  subject,
  body,
  inReplyTo,    // For threading (step 2+)
  references,   // For threading (step 2+)
  threadId,     // Gmail specific
}: ComposeEmailParams): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`] : []),
    ...(references ? [`References: ${references}`] : []),
    '',
    body,
  ];
  return lines.join('\r\n');
}

// Base64url encoding for Gmail API
function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

**Threading Logic:**
```typescript
async function getThreadContext(
  campaignId: string,
  prospectId: string,
  stepNumber: number
): Promise<ThreadContext | null> {
  if (stepNumber === 1) return null; // New thread

  // Lookup previous step's sent email
  const previousSent = await prisma.sentEmail.findFirst({
    where: {
      campaignId,
      prospectId,
      // Find the sent email for step 1 (original thread starter)
    },
    orderBy: { sentAt: 'asc' },
  });

  if (!previousSent) return null;

  return {
    threadId: previousSent.threadId,
    inReplyTo: `<${previousSent.messageId}@mail.gmail.com>`,
    references: `<${previousSent.messageId}@mail.gmail.com>`,
    originalSubject: previousSent.subject,
  };
}
```

**Cron Route Protection:**
```typescript
// src/app/api/cron/send-emails/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process emails...
}
```

**TanStack Query Keys:**
```typescript
['sent-emails', workspaceId]                    // List
['sent-emails', workspaceId, campaignId]        // By campaign
['sent-emails', workspaceId, prospectId]        // By prospect
['email-stats', workspaceId, campaignId]        // Campaign stats
```

**Error Codes to Handle:**
```typescript
// Retryable (temporary failures)
const RETRYABLE_ERRORS = [
  'rateLimitExceeded',   // Gmail 429
  'userRateLimitExceeded',
  'quotaExceeded',       // Daily limit (wait until reset)
  'backendError',        // Gmail 500
  'internalError',
  'ECONNRESET',
  'ETIMEDOUT',
];

// Non-retryable (permanent failures)  
const NON_RETRYABLE_ERRORS = [
  'invalidGrant',        // Token revoked
  'authError',
  'invalid',             // Invalid recipient
  'notFound',            // Email address doesn't exist
  'failedPrecondition',  // Account suspended
];
```

**Sending Worker Flow:**
```typescript
async function processScheduledEmail(email: ScheduledEmailWithRelations) {
  // 1. Pre-send checks
  if (email.campaign.status !== 'RUNNING') {
    return markEmailAsCancelled(email.id, 'Campaign not running');
  }
  if (email.campaignProspect.enrollmentStatus !== 'ENROLLED') {
    return markEmailAsCancelled(email.id, 'Prospect not enrolled');
  }

  // 2. Check quota
  const quota = await getRemainingQuota(email.workspaceId, new Date());
  if (quota <= 0) {
    return { status: 'QUOTA_EXCEEDED', retry: true };
  }

  // 3. Lock email
  const locked = await markEmailAsSending(email.id);
  if (!locked) return { status: 'ALREADY_PROCESSING' };

  // 4. Get Gmail token
  const { accessToken, email: fromEmail } = await getValidToken(email.workspaceId);

  // 5. Compose email
  const step = email.sequence.steps.find(s => s.order === email.stepNumber);
  const threadContext = await getThreadContext(email.campaignId, email.prospectId, email.stepNumber);
  const emailContent = await composeEmail({
    from: fromEmail,
    to: email.prospect.email,
    subject: threadContext ? `Re: ${threadContext.originalSubject}` : step.subject,
    body: renderEmailBody(step, email.prospect),
    ...threadContext,
  });

  // 6. Send via Gmail API
  const result = await sendEmail(accessToken, { raw: emailContent, threadId: threadContext?.threadId });

  // 7. Record success
  await markEmailAsSent(email.id, result.messageId, result.threadId);
  await createSentEmail({
    workspaceId: email.workspaceId,
    scheduledEmailId: email.id,
    campaignId: email.campaignId,
    prospectId: email.prospectId,
    messageId: result.messageId,
    threadId: result.threadId,
    subject: step.subject,
    toAddress: email.prospect.email,
    sentAt: new Date(),
  });

  return { status: 'SENT', messageId: result.messageId };
}
```

### Dependencies

- **Story 5.1 complete:** Campaign and CampaignProspect models exist
- **Story 5.2 complete:** Campaign launch flow established, pre-launch checks exist
- **Story 5.3 complete:** SendingSettings with signature, fromName, sendingDays
- **Story 5.4 complete:** ScheduledEmail model, scheduling service, retry handler, quota service
- **Story 2.1 complete:** Gmail OAuth tokens stored in GmailToken model, token-service.ts exists
- **Future:** Story 6.x will use threadId/messageId for reply matching

### Edge Cases to Handle

1. **Token expired during send:** Use `getValidToken()` which auto-refreshes with backoff
2. **Token revoked:** Mark email as PERMANENTLY_FAILED, don't retry
3. **Recipient invalid:** Mark as PERMANENTLY_FAILED (non-retryable)
4. **Rate limit (429):** Mark as RETRY_SCHEDULED, retry with backoff
5. **Daily quota exceeded:** Leave as SCHEDULED, will retry next cycle
6. **Campaign paused during processing:** Cancel remaining emails for that campaign
7. **Prospect replied during sequence:** Auto-cancel remaining steps (via enrollmentStatus)
8. **Step 2/3 without step 1 sent:** Start new thread if previous messageId not found
9. **Gmail API timeout:** Retry with backoff
10. **Duplicate send attempt:** Idempotency key prevents from Story 5.4

### Security Considerations

- **Token handling:** Access token decrypted only in memory, never logged
- **Cron protection:** Verify CRON_SECRET header from Vercel
- **Workspace isolation:** All queries include workspaceId filter
- **Unsubscribe link:** Mandatory in all outgoing emails (compliance)
- **Rate limiting:** Built-in through quota system and sequential processing

### Performance Considerations

- **Sequential processing:** Send emails one by one with delays (avoid Gmail burst detection)
- **Delay between emails:** 30-90 seconds random delay already applied during scheduling
- **Batch fetch limit:** Process max 10-20 emails per cron run
- **Cron interval:** 5 minutes provides good throughput without overwhelming
- **Index on status/scheduledFor:** Critical for efficient pending email queries

### Gmail API Limits

- **Per-user sending limit:** 500 recipients/day for regular accounts, 2000 for Workspace
- **API rate limit:** 250 quota units per user per second
- **Message send:** 100 quota units
- **Our safe limit:** 50 emails/day (configurable in SendingSettings)

### References

- [Source: epics.md#Story-5.5] — Full acceptance criteria
- [Source: architecture.md#Email-Scheduling-Architecture] — Pillar architecture design
- [Source: architecture.md#Gmail-API] — Gmail integration patterns
- [Source: project-context.md] — Naming conventions and API patterns
- [Source: story-5-4-email-scheduling-queue-db-pillar-with-idempotency.md] — Previous story learnings
- [Source: lib/gmail/token-service.ts] — Token management patterns
- [Source: lib/email-scheduler/schedule-emails.ts] — Scheduling service patterns
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send)

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

N/A - Implementation completed successfully

### Completion Notes List

- All 13 tasks implemented successfully
- Unit tests: 24 tests passing (compose-email, sender, threading)
- Integration tests: 5 tests passing (cron route)
- Pre-existing TypeScript errors in integration tests unrelated to this story
- Created missing `src/types/opener.ts` to fix pre-existing type error

### File List

**New Files:**
- `src/lib/gmail/sender.ts` - Gmail email sending client
- `src/lib/gmail/compose-email.ts` - RFC 2822 email composition
- `src/lib/gmail/threading.ts` - Thread context lookup
- `src/lib/email-scheduler/email-sender.ts` - Email sending worker
- `src/app/api/cron/send-emails/route.ts` - Cron API route
- `src/types/sent-email.ts` - TypeScript interfaces
- `src/types/opener.ts` - Missing type file (pre-existing issue fixed)
- `src/__tests__/unit/gmail/compose-email.test.ts` - Unit tests
- `src/__tests__/unit/gmail/sender.test.ts` - Unit tests
- `src/__tests__/unit/gmail/threading.test.ts` - Unit tests
- `src/__tests__/integration/email-sender/send-emails-cron.test.ts` - Integration tests
- `prisma/migrations/XXXXX_add_sent_email/migration.sql` - Database migration

**Modified Files:**
- `prisma/schema.prisma` - Added SentEmail model, relations
- `src/lib/prisma/mappers.ts` - Added mapSentEmail function
- `src/lib/email-scheduler/retry-handler.ts` - Extended with Gmail error codes
- `vercel.json` - Added cron schedule for send-emails

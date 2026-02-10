# Story 6.1: Gmail Reply Sync (Cron Polling MVP)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to poll Gmail for new replies to outbound emails**,
So that **incoming responses are captured and available in the inbox**.

## Acceptance Criteria

### AC1: Cron Job Execution
**Given** a cron job runs every 5 minutes
**When** the polling worker executes
**Then** it queries Gmail API for new messages since last sync
**And** filters to relevant threads (matching SentEmail threadIds)

### AC2: Reply Detection & Matching
**Given** a new reply is detected
**When** the message is processed
**Then** it's matched to a SentEmail via threadId
**And** the Conversation and InboxMessage records are created/updated
**And** last sync timestamp is updated

### AC3: Unlinked Emails Handling
**Given** an email cannot be matched to a campaign
**When** processing completes
**Then** it's stored as "unlinked" for manual review
**And** no auto-classification is attempted

### AC4: Rate Limit Handling
**Given** rate limits are hit
**When** Google API returns 429
**Then** backoff is applied
**And** retry in next cron cycle

### AC5: OAuth Token Invalidation
**Given** OAuth tokens are invalid
**When** API returns 401
**Then** user is flagged for re-authentication
**And** banner shows in dashboard: "Reconnect Gmail"
**And** workspace `gmailConnected` is set to false

### AC6: Reply Status Update (Integration with Epic 5)
**Given** a reply is detected for a prospect in an active campaign
**When** the InboxMessage is created
**Then** CampaignProspect.enrollmentStatus is updated to REPLIED (from Story 5.7)
**And** remaining scheduled emails for this prospect are cancelled

### AC7: Message Body Extraction
**Given** a reply email is fetched from Gmail
**When** parsing the message
**Then** extract plain text body (prefer text/plain over text/html)
**And** strip quoted content (previous replies) for clean extraction
**And** store both raw and cleaned body for display

### AC8: Workspace Isolation
**Given** multiple workspaces have connected Gmail accounts
**When** sync runs
**Then** each workspace is processed independently
**And** results are stored with correct workspaceId
**And** cross-workspace data access is prevented

## Tasks / Subtasks

### Task 1: Create Prisma Models (AC: 2, 3, 6, 7)
- [ ] Add `Conversation` model to `prisma/schema.prisma`:
  ```prisma
  model Conversation {
    id            String    @id @default(cuid())
    threadId      String    @map("thread_id")
    workspaceId   String    @map("workspace_id")
    prospectId    String?   @map("prospect_id")
    campaignId    String?   @map("campaign_id")
    sequenceId    String?   @map("sequence_id")
    status        ConversationStatus @default(OPEN)
    lastMessageAt DateTime  @map("last_message_at")
    createdAt     DateTime  @default(now()) @map("created_at")
    updatedAt     DateTime  @updatedAt @map("updated_at")
    
    workspace     Workspace @relation(fields: [workspaceId], references: [id])
    prospect      Prospect? @relation(fields: [prospectId], references: [id])
    campaign      Campaign? @relation(fields: [campaignId], references: [id])
    messages      InboxMessage[]
    
    @@unique([workspaceId, threadId])
    @@index([workspaceId])
    @@index([prospectId])
    @@map("conversations")
  }
  ```
- [ ] Add `InboxMessage` model:
  ```prisma
  model InboxMessage {
    id              String    @id @default(cuid())
    conversationId  String    @map("conversation_id")
    gmailMessageId  String    @map("gmail_message_id")
    direction       MessageDirection
    subject         String?
    bodyRaw         String    @map("body_raw")
    bodyCleaned     String?   @map("body_cleaned")
    fromEmail       String    @map("from_email")
    toEmail         String    @map("to_email")
    receivedAt      DateTime  @map("received_at")
    classification  ReplyClassification?
    isRead          Boolean   @default(false) @map("is_read")
    createdAt       DateTime  @default(now()) @map("created_at")
    
    conversation    Conversation @relation(fields: [conversationId], references: [id])
    
    @@unique([conversationId, gmailMessageId])
    @@index([conversationId])
    @@map("inbox_messages")
  }
  ```
- [ ] Add enums: `ConversationStatus`, `MessageDirection`, `ReplyClassification`
- [ ] Add `lastSyncedAt` to Workspace model (if not exists)
- [ ] Run `npx prisma migrate dev --name add_inbox_models`
- [ ] Update `src/lib/prisma/mappers.ts` with `mapConversation`, `mapInboxMessage`

### Task 2: Create Gmail Message Fetcher Service (AC: 1, 4, 5, 7)
- [ ] Create `src/lib/gmail/inbox-sync.ts`
- [ ] Function `fetchNewMessages(accessToken, afterTimestamp): Promise<GmailMessage[]>`
  - Use `users.messages.list` with query: `after:{epochSeconds} in:inbox`
  - Handle pagination with `nextPageToken`
  - Respect rate limits with exponential backoff
- [ ] Function `fetchMessageDetails(accessToken, messageId): Promise<GmailMessageDetails>`
  - Use `users.messages.get` with format: `full`
  - Extract headers: From, To, Subject, Date, Message-ID, In-Reply-To, References
- [ ] Function `extractMessageBody(payload): { raw: string; cleaned: string }`
  - Prefer `text/plain` MIME part
  - Fallback to `text/html` with HTML stripping
  - Strip quoted content (lines starting with `>` or `On ... wrote:`)
- [ ] Handle 401 OAuth errors: mark workspace as needing re-auth

### Task 3: Create Thread Matching Service (AC: 2, 3, 6)
- [ ] Create `src/lib/inbox/thread-matcher.ts`
- [ ] Function `matchThreadToSentEmail(threadId, workspaceId): Promise<SentEmail | null>`
  - Query SentEmail by threadId and workspaceId
  - Return null if no match (unlinked email)
- [ ] Function `createOrUpdateConversation(data): Promise<Conversation>`
  - Upsert on (workspaceId, threadId)
  - Link to prospect and campaign if matched
- [ ] Function `markProspectAsReplied(campaignProspectId): Promise<void>`
  - Update CampaignProspect.enrollmentStatus to REPLIED
  - Cancel remaining ScheduledEmails for this prospect (reuse pattern from Story 5.7)

### Task 4: Create Inbox Sync Worker (AC: 1, 2, 3, 8)
- [ ] Create `src/lib/inbox/sync-worker.ts`
- [ ] Function `syncWorkspaceInbox(workspaceId): Promise<SyncResult>`
  - Get workspace with Gmail credentials
  - Decrypt access token
  - Fetch new messages since lastSyncedAt
  - For each message:
    - Match to existing thread or create new
    - Create InboxMessage record
    - Update CampaignProspect status if applicable
  - Update workspace.lastSyncedAt
  - Return counts: processed, matched, unlinked, errors
- [ ] Function `processAllWorkspaces(): Promise<WorkspaceSyncResult[]>`
  - Get all workspaces with gmailConnected = true
  - Process each independently
  - Handle errors per-workspace (don't stop on one failure)

### Task 5: Create Cron API Route (AC: 1)
- [ ] Create `src/app/api/cron/sync-inbox/route.ts`
- [ ] Define Vercel cron in `vercel.json`:
  ```json
  {
    "crons": [
      { "path": "/api/cron/sync-inbox", "schedule": "*/5 * * * *" }
    ]
  }
  ```
- [ ] Implement route handler:
  - Verify cron secret (CRON_SECRET env var)
  - Call `processAllWorkspaces()`
  - Log summary results
  - Return success/error response

### Task 6: Create Gmail Re-authentication Banner (AC: 5)
- [ ] Create `src/components/features/inbox/GmailReconnectBanner.tsx`
- [ ] Display when `workspace.gmailConnected = false` after it was previously true
- [ ] Button: "Reconnecter Gmail" → redirect to OAuth flow
- [ ] Dismissable with localStorage (but reappears next session)

### Task 7: Add Types (AC: all)
- [ ] Create `src/types/inbox.ts`
- [ ] Types: `Conversation`, `InboxMessage`, `SyncResult`, `GmailMessage`, `GmailMessageDetails`
- [ ] Enums: `ConversationStatus`, `MessageDirection`, `ReplyClassification`
- [ ] Zod schemas for API validation

### Task 8: Add Utility Functions (AC: 7)
- [ ] Create `src/lib/utils/email-body-parser.ts`
- [ ] Function `stripQuotedContent(body: string): string`
  - Remove lines starting with `>`
  - Remove "On {date} {email} wrote:" patterns
  - Handle French variants: "Le {date}, {email} a écrit :"
- [ ] Function `stripHtmlTags(html: string): string`
  - Simple HTML to plain text conversion
  - Remove scripts, styles
- [ ] Function `extractEmailAddress(fromHeader: string): string`
  - Parse "Name <email@domain.com>" format
  - Return just email address

### Task 9: Create Unit Tests (AC: all)
- [ ] Create `src/__tests__/unit/inbox/thread-matcher.test.ts`
- [ ] Create `src/__tests__/unit/inbox/email-body-parser.test.ts`
- [ ] Test thread matching logic with various scenarios
- [ ] Test body extraction and cleaning
- [ ] Test quoted content stripping (English and French variants)

### Task 10: Create Integration Tests (AC: 1, 2, 5)
- [ ] Create `src/__tests__/integration/inbox-sync.test.ts`
- [ ] Test full sync flow with mocked Gmail API
- [ ] Test rate limit handling
- [ ] Test OAuth expiration handling
- [ ] Test workspace isolation

### Task 11: Update Story Tracking
- [ ] Mark story as "review" when implementation complete
- [ ] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Workspace Access:** Always verify with `assertWorkspaceAccess(userId, workspaceId)`
- **Prisma:** Use `@@map` for snake_case DB columns
- **TanStack Query Keys:** `['inbox', workspaceId]`, `['inbox', workspaceId, 'unread']`
- **Gmail tokens:** AES-256 encrypted, never log

**From Previous Stories:**
- Story 5.5: `gmail/sender.ts` - Gmail API patterns, token handling, error retry
- Story 5.7: `prospect-control.ts` - REPLIED status handling, cancel scheduled emails
- Story 5.8: `anomaly-detection.ts` - Post-send worker hooks pattern
- Story 2.1: Gmail OAuth flow, token storage

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add Conversation, InboxMessage models |
| `src/lib/gmail/inbox-sync.ts` | NEW | Gmail message fetching |
| `src/lib/inbox/thread-matcher.ts` | NEW | Thread matching logic |
| `src/lib/inbox/sync-worker.ts` | NEW | Main sync orchestration |
| `src/lib/utils/email-body-parser.ts` | NEW | Body extraction utilities |
| `src/app/api/cron/sync-inbox/route.ts` | NEW | Cron endpoint |
| `src/components/features/inbox/GmailReconnectBanner.tsx` | NEW | Re-auth UI |
| `src/types/inbox.ts` | NEW | TypeScript types |
| `vercel.json` | MODIFY | Add cron job |

### Technical Implementation Details

**Gmail API Query Pattern:**
```typescript
// Query for new messages since last sync
const query = `in:inbox after:${Math.floor(lastSyncedAt.getTime() / 1000)}`;
const response = await gmail.users.messages.list({
  userId: 'me',
  q: query,
  maxResults: 100, // Process in batches
});
```

**Thread Matching Flow:**
```typescript
async function processIncomingMessage(message: GmailMessage, workspaceId: string) {
  // 1. Check if thread matches a sent email
  const sentEmail = await matchThreadToSentEmail(message.threadId, workspaceId);
  
  if (sentEmail) {
    // 2. Create/update conversation linked to campaign
    const conversation = await createOrUpdateConversation({
      threadId: message.threadId,
      workspaceId,
      prospectId: sentEmail.prospectId,
      campaignId: sentEmail.campaignId,
      sequenceId: sentEmail.sequenceId,
    });
    
    // 3. Create inbox message
    await createInboxMessage({
      conversationId: conversation.id,
      gmailMessageId: message.id,
      direction: 'INBOUND',
      ...extractMessageContent(message),
    });
    
    // 4. Mark prospect as replied (triggers Story 5.7 logic)
    await markProspectAsReplied(sentEmail.campaignProspectId);
  } else {
    // 5. Unlinked email - store without campaign link
    const conversation = await createOrUpdateConversation({
      threadId: message.threadId,
      workspaceId,
      prospectId: null,
      campaignId: null,
    });
    // ... create InboxMessage without classification
  }
}
```

**Quoted Content Stripping Patterns:**
```typescript
const QUOTED_PATTERNS = [
  /^>.*$/gm,                                    // Lines starting with >
  /On .* wrote:$/gm,                            // English quote header
  /Le .*, .* a écrit :$/gm,                     // French quote header
  /-----Original Message-----[\s\S]*$/gm,       // Outlook separator
  /_{10,}[\s\S]*$/gm,                           // Underscore separator
];
```

### Dependencies

- **Story 2.1 complete:** Gmail OAuth with tokens ✅
- **Story 5.5 complete:** SentEmail model with threadId ✅
- **Story 5.7 complete:** CampaignProspect REPLIED status + cancel logic ✅
- **Story 5.8 complete:** Post-send worker hook patterns ✅
- **Future:** Story 6.4 will add AI classification to InboxMessage

### Edge Cases to Handle

1. **No new messages:** lastSyncedAt unchanged, empty result
2. **Thread with multiple replies:** Create InboxMessage for each, same Conversation
3. **Reply to reply:** Match via references header chain
4. **Own outbound in thread:** Direction = OUTBOUND, don't mark as reply
5. **Token refresh needed:** Handle 401 with refresh token before marking disconnect
6. **Concurrent sync runs:** Use lastSyncedAt as lock-free coordination
7. **Large inbox backlog:** Limit to 100 messages per run, continue next cycle
8. **Deleted Gmail message:** Skip gracefully, log warning
9. **No prospect match by email:** Try to infer from email address

### Gmail API Specifics

- **Rate limits:** 250 quota units/second, 1 billion/day
- `messages.list`: 5 units per call
- `messages.get`: 5 units per call
- **Best practice:** Batch requests when possible

### MVP Scope Notes

**IN SCOPE:**
- Cron polling every 5 minutes
- Thread matching via threadId
- InboxMessage creation with body extraction
- Auto-REPLIED status for matched prospects
- Gmail reconnection banner

**OUT OF SCOPE (Phase 2):**
- Pub/Sub push notifications (more real-time)
- AI classification of replies (Story 6.4)
- Reply suggestions (Story 6.6)
- Send reply from inbox (Story 6.7)

### References

- [Source: epics.md#Story-6.1] — Full acceptance criteria (lines 1523-1561)
- [Source: project-context.md] — API patterns and naming conventions
- [Source: architecture.md#Gmail-Push] — Gmail Pub/Sub architecture (Phase 2)
- [Source: src/lib/gmail/sender.ts] — Existing Gmail API patterns
- [Source: src/lib/email-scheduler/campaign-control.ts] — REPLIED handling patterns

### Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- Fixed AC5: Added `isValid` to GmailToken and updated sync-worker to handle 401 errors.
- Fixed UI: Added `GmailReconnectBannerWrapper` to dashboard layout.
- Added Integration Test: `src/__tests__/integration/inbox-sync.test.ts`

### Completion Notes List

- All ACs implemented.
- Integration tests added.
- UI validation added.

### File List

#### [MODIFY] [schema.prisma](file:///c:/Users/Alexis/Documents/LeadGen/prisma/schema.prisma)
#### [MODIFY] [layout.tsx](file:///c:/Users/Alexis/Documents/LeadGen/src/app/(dashboard)/layout.tsx)
#### [MODIFY] [route.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/app/api/workspace/me/route.ts)
#### [NEW] [inbox-sync.test.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/__tests__/integration/inbox-sync.test.ts)
#### [NEW] [GmailReconnectBannerWrapper.tsx](file:///c:/Users/Alexis/Documents/LeadGen/src/components/features/inbox/GmailReconnectBannerWrapper.tsx)
#### [NEW] [sync-worker.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/lib/inbox/sync-worker.ts)
#### [NEW] [inbox-sync.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/lib/gmail/inbox-sync.ts)
#### [NEW] [thread-matcher.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/lib/inbox/thread-matcher.ts)
#### [NEW] [email-body-parser.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/lib/utils/email-body-parser.ts)
#### [NEW] [route.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/app/api/cron/sync-inbox/route.ts)
#### [NEW] [GmailReconnectBanner.tsx](file:///c:/Users/Alexis/Documents/LeadGen/src/components/features/inbox/GmailReconnectBanner.tsx)
#### [NEW] [inbox.ts](file:///c:/Users/Alexis/Documents/LeadGen/src/types/inbox.ts)

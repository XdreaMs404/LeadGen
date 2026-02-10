# Story 6.4: AI Reply Classification with Confidence

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to automatically classify incoming replies using AI with confidence scoring**,
So that **users can prioritize responses efficiently**.

## Acceptance Criteria

### AC1: Fallback Rules — Pattern Matching First
**Given** a new reply is received
**When** classification runs
**Then** FIRST apply fallback rules for known patterns:
  - OOO keywords ("out of office", "vacation", "away", "absent", "congé") → OUT_OF_OFFICE
  - Unsubscribe keywords ("unsubscribe", "remove me", "stop", "désabonner", "désinscription") → UNSUBSCRIBE
  - Bounce patterns (delivery failure, permanent error, mailer-daemon) → BOUNCE
**And** confidence is set to 100 for rule-based matches
**And** `classificationMethod` is set to `RULE`

### AC2: LLM Classification — Fallback Not Matched
**Given** fallback rules don't match
**When** LLM classification runs
**Then** the reply is classified as: INTERESTED, NOT_NOW, NEGATIVE, or OTHER
**And** a confidence score (0-100) is returned
**And** `classificationMethod` is set to `LLM`
**And** classification completes in <5s (NFR3)

### AC3: Low Confidence → NEEDS_REVIEW Flag
**Given** LLM confidence is below 70%
**When** classification completes
**Then** the message `needsReview` flag is set to `true`
**And** no auto-actions are triggered
**And** user sees amber badge in inbox (already handled by ClassificationBadge from Story 6.3)

### AC4: UNSUBSCRIBE Auto-Actions
**Given** classification is UNSUBSCRIBE (via rule or LLM)
**When** detected
**Then** prospect status is updated to UNSUBSCRIBED
**And** sequence is stopped for this prospect (CampaignProspect enrollmentStatus → STOPPED)
**And** these actions are logged in audit trail

### AC5: INTERESTED Priority
**Given** classification is INTERESTED
**When** the inbox is viewed
**Then** this conversation is prioritized (top of list)
**And** green "INTERESTED" badge is shown (already handled by ClassificationBadge from Story 6.3)

### AC6: LLM Failure Fallback
**Given** the LLM call fails or times out (>5s)
**When** classification is attempted
**Then** the message is stored with `classification = null`
**And** `needsReview = true`
**And** retry is scheduled for next sync cycle
**And** error is logged but sync continues for other messages

### AC7: Classification on Sync
**Given** inbox sync runs (cron every 2 minutes)
**When** new INBOUND messages are fetched
**Then** each message is classified inline during sync processing
**And** classification happens AFTER message is persisted (never blocks save)

## Tasks / Subtasks

### Task 1: Update Prisma Schema (AC: 1, 2, 3)
- [ ] Add new values to `ReplyClassification` enum:
  - Add `NOT_NOW` (épique dit NOT_NOW, schéma a NOT_INTERESTED — garder les deux pour rétrocompat)
  - Add `NEGATIVE`
  - Add `NEEDS_REVIEW`
- [ ] Add fields to `InboxMessage` model:
  - `confidenceScore Int? @map("confidence_score")` — 0-100
  - `classificationMethod ClassificationMethod? @map("classification_method")` — RULE or LLM
  - `needsReview Boolean @default(false) @map("needs_review")`
- [ ] Create new enum `ClassificationMethod`:
  - `RULE`
  - `LLM`
  - `MANUAL` (pour Story 6.5)
- [ ] Run `npx prisma migrate dev --name add-classification-fields`
- [ ] Regenerate Prisma client
- [ ] Update mappers in `src/lib/prisma/mappers.ts`

### Task 2: Create Fallback Rules Classifier (AC: 1)
- [ ] Create `src/lib/inbox/classification/fallback-rules.ts`
  - Export `classifyByRules(body: string, subject: string): ClassificationRuleResult | null`
  - OOO patterns: regex for "out of office", "vacation", "away", "absent", "congé", "retour le", "de retour"
  - Unsubscribe patterns: "unsubscribe", "remove me", "stop contacting", "désabonner", "désinscription", "ne plus recevoir"
  - Bounce patterns: "delivery failed", "permanent error", "mailer-daemon", "undeliverable", "message not delivered"
  - Return `{ classification, confidence: 100, method: 'RULE' }` or `null`
  - Patterns are case-insensitive
  - Check both subject and body
  - Include French AND English keywords (bilingual user base)

### Task 3: Add `classifyReply` to LLM Provider (AC: 2)
- [ ] Update `src/lib/llm/types.ts`:
  - Add `ClassificationResult` interface: `{ classification: string; confidence: number; reasoning: string }`
  - Add `classifyReply(body: string, context?: ClassificationContext): Promise<ClassificationResult>` to `LLMProvider` interface
  - Add `ClassificationContext` interface: `{ prospectName?: string; campaignName?: string; sequenceName?: string }`
- [ ] Implement `classifyReply` in `src/lib/llm/gemini.ts`:
  - System prompt: classify cold email reply into INTERESTED / NOT_NOW / NEGATIVE / OTHER
  - Include confidence score 0-100 and brief reasoning
  - Response format: JSON `{ classification, confidence, reasoning }`
  - Timeout: 5s (GENERATION_TIMEOUT_MS or dedicate CLASSIFICATION_TIMEOUT_MS = 5000)
  - Handle Gemini API error → return null (let caller handle)

### Task 4: Create Classification Service (AC: 1, 2, 3, 6, 7)
- [ ] Create `src/lib/inbox/classification/classification-service.ts`
  - Export `classifyMessage(message: InboxMessage, context?: ClassificationContext): Promise<ClassificationResult>`
  - Flow:
    1. Run fallback rules first (cheap, fast, reliable)
    2. If rules match → return immediately with confidence=100, method=RULE
    3. If no rule match → call LLM classifyReply
    4. If LLM returns confidence < 70 → set needsReview=true
    5. If LLM fails/timeout → return null, set needsReview=true
  - Export `applyClassification(messageId: string, result: ClassificationResult): Promise<void>`
    - Update InboxMessage with classification, confidenceScore, classificationMethod, needsReview
    - Update Conversation lastClassification if needed

### Task 5: Implement UNSUBSCRIBE Auto-Actions (AC: 4)
- [ ] Create `src/lib/inbox/classification/auto-actions.ts`
  - Export `handleClassificationActions(message: InboxMessage, classification: ReplyClassification, conversationId: string): Promise<void>`
  - If UNSUBSCRIBE:
    - Find prospect via conversation → prospectId
    - Update prospect status to UNSUBSCRIBED
    - Find active CampaignProspect enrollments → set STOPPED
    - Cancel any SCHEDULED emails for this prospect
    - Log audit: `action: 'PROSPECT_UNSUBSCRIBED'`, `entityType: 'PROSPECT'`
  - If BOUNCE:
    - Update prospect status to BOUNCED
    - Stop enrollment same as UNSUBSCRIBE
    - Log audit: `action: 'PROSPECT_BOUNCED'`
  - If INTERESTED:
    - Update CampaignProspect enrollmentStatus to REPLIED (if not already)

### Task 6: Integrate Classification into Sync Worker (AC: 7)
- [ ] Modify `src/lib/inbox/sync-worker.ts` → `processIncomingMessage`:
  - After persisting InboxMessage, call `classifyMessage()`
  - Apply classification result via `applyClassification()`
  - Execute auto-actions via `handleClassificationActions()`
  - Wrap classification in try/catch — never block message save
  - Log classification results for monitoring
- [ ] Ensure OUTBOUND messages are NOT classified (only INBOUND)

### Task 7: Update Conversation List API for INTERESTED Priority (AC: 5)
- [ ] Modify `src/lib/inbox/conversation-service.ts` → `getConversationsForWorkspace`:
  - Add optional sort by classification priority (INTERESTED first)
  - Add `needsReview` filter support
- [ ] Modify `src/app/api/inbox/conversations/route.ts`:
  - Add `needsReview` query param
  - Add `sortByPriority` query param (INTERESTED conversations first)

### Task 8: Update Types and Hooks (AC: all)
- [ ] Update `src/types/inbox.ts`:
  - Add `confidenceScore`, `classificationMethod`, `needsReview` to message types
  - Add `ClassificationResult`, `ClassificationContext` types
- [ ] Update `src/hooks/use-conversations.ts`:
  - Support `needsReview` filter
  - Support priority sort param
- [ ] Update `src/lib/prisma/mappers.ts`:
  - Map new InboxMessage fields

### Task 9: Create Unit Tests (AC: 1, 2, 3, 6)
- [ ] Create `src/__tests__/unit/inbox/fallback-rules.test.ts`
  - Test OOO keyword detection (EN + FR)
  - Test UNSUBSCRIBE keyword detection (EN + FR)
  - Test BOUNCE pattern detection
  - Test no-match returns null
  - Test case-insensitivity
  - Test subject-only matches
- [ ] Create `src/__tests__/unit/inbox/classification-service.test.ts`
  - Test rule-first, LLM-second flow
  - Test low confidence → needsReview=true
  - Test LLM failure → graceful fallback
  - Test timeout handling
- [ ] Create `src/__tests__/unit/inbox/auto-actions.test.ts`
  - Test UNSUBSCRIBE → prospect UNSUBSCRIBED + enrollment STOPPED + emails cancelled
  - Test BOUNCE → prospect BOUNCED + enrollment STOPPED
  - Test INTERESTED → enrollment REPLIED

### Task 10: Create Integration Tests (AC: 4, 7)
- [ ] Create `src/__tests__/integration/inbox-classification.test.ts`
  - Test full sync → classify flow with mocked LLM
  - Test UNSUBSCRIBE cascade actions
  - Test API filter by needsReview
  - Test priority sort (INTERESTED first)

### Task 11: Update Story Tracking
- [ ] Mark story as "review" when implementation complete
- [ ] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Workspace Access:** Always verify with `assertWorkspaceAccess(userId, workspaceId)`
- **Prisma:** Use `@@map` for snake_case DB columns, `@map` for fields
- **LLM:** Use abstraction layer in `lib/llm/` with `LLMProvider` interface
- **LLM Provider MVP:** Gemini 2.0 Flash via Vertex AI (`@google-cloud/vertexai`)
- **LLM Timeout:** 30s general, but **5s for classification** (NFR3)
- **Tests:** Tests in `src/__tests__/unit/` and `src/__tests__/integration/`
- **Error Handling:** `try/catch` + `console.error` + `return error()` in API routes

**Existing LLM Infrastructure:**
- `src/lib/llm/types.ts` — `LLMProvider` interface (needs `classifyReply` method added)
- `src/lib/llm/gemini.ts` — `GeminiProvider` class using Vertex AI, singleton `geminiProvider`
- `src/lib/llm/index.ts` — Re-exports provider
- Model: `gemini-2.0-flash-001`
- Error types: `LLMError`, `LLMErrorCode`

**Existing Inbox Infrastructure (Stories 6.1-6.3):**
- `src/lib/inbox/sync-worker.ts` — `processIncomingMessage()` — integration point pour la classification
- `src/lib/inbox/conversation-service.ts` — `getConversationsForWorkspace()` — needs priority sort
- `src/lib/inbox/thread-matcher.ts` — Thread matching logic
- `src/hooks/use-conversations.ts` — TanStack Query hooks
- `src/types/inbox.ts` — Type definitions
- `src/components/features/inbox/ClassificationBadge.tsx` — Already handles badge display (from Story 6.3)

**Current Prisma Schema (relevant):**
```
enum ReplyClassification {
  INTERESTED
  NOT_INTERESTED
  OUT_OF_OFFICE
  UNSUBSCRIBE
  BOUNCE
  OTHER
}

model InboxMessage {
  classification  ReplyClassification?
  // NO confidence or method fields yet — must add
}
```

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add NEGATIVE, NOT_NOW, NEEDS_REVIEW to enum; add ClassificationMethod enum; add fields to InboxMessage |
| `src/lib/llm/types.ts` | MODIFY | Add ClassificationResult, ClassificationContext, classifyReply to LLMProvider |
| `src/lib/llm/gemini.ts` | MODIFY | Implement classifyReply method |
| `src/lib/inbox/classification/fallback-rules.ts` | NEW | Rule-based classifier (OOO, UNSUBSCRIBE, BOUNCE) |
| `src/lib/inbox/classification/classification-service.ts` | NEW | Orchestrator: rules → LLM → apply |
| `src/lib/inbox/classification/auto-actions.ts` | NEW | Side effects: UNSUBSCRIBE, BOUNCE, INTERESTED |
| `src/lib/inbox/sync-worker.ts` | MODIFY | Call classification after message save |
| `src/lib/inbox/conversation-service.ts` | MODIFY | Add priority sort and needsReview filter |
| `src/app/api/inbox/conversations/route.ts` | MODIFY | Add needsReview and sortByPriority params |
| `src/types/inbox.ts` | MODIFY | Add classification types |
| `src/hooks/use-conversations.ts` | MODIFY | Support new filter/sort params |
| `src/lib/prisma/mappers.ts` | MODIFY | Map new InboxMessage fields |
| `src/__tests__/unit/inbox/fallback-rules.test.ts` | NEW | Unit tests for rule classifier |
| `src/__tests__/unit/inbox/classification-service.test.ts` | NEW | Unit tests for service |
| `src/__tests__/unit/inbox/auto-actions.test.ts` | NEW | Unit tests for auto-actions |
| `src/__tests__/integration/inbox-classification.test.ts` | NEW | Integration tests |

### Previous Story Intelligence (6.3: Unified Inbox UI)

**Learnings:**
- `ClassificationBadge.tsx` already handles color-coded badges for all classifications including NEEDS_REVIEW
- Inbox filters support `classification` and `unread` — need to add `needsReview`
- `ConversationListItem` interface already has `classification` field on `lastMessage`
- Mark-as-read flow is in place via `useMarkAsRead` hook
- Story 6.3 is still `in-progress` — classification display already coded, just needs data

**Files created in 6.3 that interact with this story:**
- `src/components/features/inbox/ClassificationBadge.tsx` — Will display our classifications
- `src/components/features/inbox/InboxFilters.tsx` — Will need needsReview filter
- `src/app/api/inbox/conversations/route.ts` — Will need new query params

### LLM Classification Prompt Strategy

**System Prompt (French context — user base is French):**
```
Tu es un assistant spécialisé dans la classification des réponses aux emails de prospection commerciale (cold outreach).

Classifie la réponse suivante dans UNE de ces catégories :
- INTERESTED : Le prospect montre de l'intérêt (veut en savoir plus, propose un RDV, pose des questions)
- NOT_NOW : Le prospect n'est pas intéressé maintenant mais pas fermé (timing, budget, reviendra plus tard)
- NEGATIVE : Le prospect refuse clairement (pas intéressé, ne pas contacter, ton négatif)
- OTHER : Réponse qui ne rentre dans aucune catégorie (question sans rapport, transfert, etc.)

Réponds UNIQUEMENT en JSON :
{ "classification": "INTERESTED|NOT_NOW|NEGATIVE|OTHER", "confidence": 0-100, "reasoning": "brief explanation" }
```

**Important:** OOO, UNSUBSCRIBE, and BOUNCE are handled by fallback rules BEFORE LLM is called. The LLM only sees messages that passed the rules filter.

### Edge Cases to Handle

1. **Empty body:** Classify as OTHER with low confidence
2. **Very long email:** Truncate to first 2000 chars for LLM
3. **Non-French/English replies:** LLM should still classify (Gemini handles multilingual)
4. **Multiple signals in one email:** Trust LLM judgment, confidence reflects ambiguity
5. **Auto-reply that's not OOO:** e.g., "I received your email" — should be OTHER
6. **Forwarded emails:** May contain original + forward context — classify the reply portion
7. **Thread with multiple replies:** Classify each INBOUND message independently
8. **Prospect already UNSUBSCRIBED:** Skip UNSUBSCRIBE auto-actions if already suppressed
9. **LLM rate limiting:** Handle 429 gracefully, retry on next sync cycle

### Dependencies

- **Story 6.1 complete:** Gmail sync creates InboxMessage records ✅
- **Story 6.2 complete:** Conversation service and hooks ✅
- **Story 6.3 in-progress:** Inbox UI displays classifications ✅ (ClassificationBadge ready)
- **Future:** Story 6.5 Manual Reclassification (will use ClassificationMethod.MANUAL)
- **Future:** Story 8.5 Unsubscribe Detection & Suppression List (UNSUBSCRIBE auto-action is MVP here)

### MVP Scope Notes

**IN SCOPE:**
- Fallback rule-based classification (OOO, UNSUBSCRIBE, BOUNCE)
- LLM classification via Gemini (INTERESTED, NOT_NOW, NEGATIVE, OTHER)
- Confidence scoring (0-100)
- NEEDS_REVIEW flag when confidence < 70%
- UNSUBSCRIBE auto-actions (update prospect + stop enrollment + cancel emails)
- BOUNCE auto-actions (update prospect + stop enrollment)
- INTERESTED → mark enrollment REPLIED
- Priority sort for INTERESTED conversations
- Classification during sync (inline, non-blocking)

**OUT OF SCOPE (Future Stories):**
- Manual reclassification UI (Story 6.5)
- Classification history tracking (Story 6.5)
- Reply suggestions based on classification (Story 6.6)
- Suppression list management UI (Story 8.5)
- Classification analytics/metrics (Story 9.3)
- Real-time classification (websocket push)
- Training/fine-tuning on user feedback

### References

- [Source: epics.md#Story-6.4] — Full acceptance criteria (lines 1634-1675)
- [Source: project-context.md#LLM-Integration-Rules] — LLM abstraction layer
- [Source: project-context.md#Testing-Requirements] — Inbox classification is critical integration test
- [Source: src/lib/llm/types.ts] — LLMProvider interface
- [Source: src/lib/llm/gemini.ts] — GeminiProvider implementation
- [Source: src/lib/inbox/sync-worker.ts] — Sync worker integration point
- [Source: src/lib/inbox/conversation-service.ts] — Query service
- [Source: prisma/schema.prisma] — ReplyClassification enum, InboxMessage model

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

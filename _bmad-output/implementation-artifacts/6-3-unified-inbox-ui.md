# Story 6.3: Unified Inbox UI

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to view all incoming replies in a centralized inbox**,
So that **I can efficiently review and respond to prospects**.

## Acceptance Criteria

### AC1: Inbox Page Loading
**Given** a user navigates to the Inbox page
**When** the page loads
**Then** they see a list of conversations with unread count
**And** most recent first (sortable)
**And** skeleton loading during fetch

### AC2: Conversation List Display
**Given** a conversation is displayed in the list
**When** viewed
**Then** it shows: prospect name/email, subject, preview, timestamp, classification badge
**And** unread conversations are visually highlighted

### AC3: Conversation Detail View
**Given** a user clicks on a conversation
**When** the detail panel opens
**Then** they see the full thread: all sent and received messages
**And** messages are displayed in chronological order
**And** prospect info sidebar shows campaign context

### AC4: Filtering & Search
**Given** a user has many conversations
**When** they want to filter
**Then** they can filter by: Classification (Interested, Not Now, etc.), Unread, Needs Review, Date range
**And** search by prospect name/email is available

### AC5: Mark as Read
**Given** a user opens a conversation
**When** the detail panel opens
**Then** the conversation is automatically marked as read
**And** the unread count badge updates

### AC6: Keyboard Navigation
**Given** a user is on the inbox list
**When** they use arrow keys (up/down)
**Then** they can browse conversations
**And** Enter key opens the selected conversation
**And** Escape closes the detail panel

### AC7: Empty State
**Given** a user has no conversations
**When** the inbox page loads
**Then** they see an empty state illustration
**And** a message: "No replies yet — keep prospecting!"

### AC8: Pagination
**Given** a user has many conversations (> 25)
**When** viewing the list
**Then** pagination controls are available
**And** page size options: 25, 50, 100

## Tasks / Subtasks

### Task 1: Create Inbox Page Route (AC: 1, 7)
- [ ] Create `src/app/(dashboard)/inbox/page.tsx`
  - Server component shell with Suspense boundary
  - Use `InboxPageClient` for client-side state
- [ ] Add inbox link to sidebar navigation in `src/components/layout/Sidebar.tsx`
- [ ] Create `src/app/(dashboard)/inbox/loading.tsx` with skeleton

### Task 2: Create Conversation List Component (AC: 1, 2, 8)
- [ ] Create `src/components/features/inbox/ConversationList.tsx`
  - Display conversations using TanStack Table or custom list
  - Each row: prospect avatar, name, email, subject, preview (50 chars), timestamp, classification badge
  - Unread indicator (bold text, dot indicator)
  - Pagination controls at bottom
- [ ] Create `src/components/features/inbox/ConversationListItem.tsx`
  - Individual conversation row component
  - Hover and selected states
  - Classification badge (color-coded: Interested=green, Not Interested=amber, Not Now=amber, Negative=red, Out of Office=gray, Needs Review=amber outline)

### Task 3: Create Classification Badge Component (AC: 2)
- [ ] Create `src/components/features/inbox/ClassificationBadge.tsx`
  - Props: `classification: ReplyClassification | null`
  - Color scheme:
    - INTERESTED: green
    - NOT_INTERESTED: amber
    - NOT_NOW: amber
    - NEGATIVE: red
    - OUT_OF_OFFICE: gray
    - BOUNCE: red outline
    - UNSUBSCRIBE: red
    - NEEDS_REVIEW: amber outline
    - OTHER: gray outline
    - null: gray "Unclassified"
  - Show confidence indicator if < 70%

### Task 4: Create Filter Panel Component (AC: 4)
- [ ] Create `src/components/features/inbox/InboxFilters.tsx`
  - Filter by classification (multi-select dropdown)
  - Filter by unread (checkbox)
  - Filter by needs review (checkbox)
  - Date range picker (last 7 days, 30 days, custom)
  - Search input with debounce (300ms)
- [ ] Wire filters to URL query params for shareable state
- [ ] Quick filters: "Unread", "Needs Action", "Interested"

### Task 5: Create Conversation Detail Panel (AC: 3, 5)
- [ ] Create `src/components/features/inbox/ConversationDetail.tsx`
  - Slide-in panel on conversation click (or right-side split view)
  - Header: prospect name, email, company
  - Thread view: chronological messages
  - Sidebar: campaign name, sequence name, enrollment status
- [ ] Create `src/components/features/inbox/MessageThread.tsx`
  - Display all InboxMessages in order by receivedAt
  - Differentiate INBOUND (left-aligned, gray bg) vs OUTBOUND (right-aligned, teal bg)
  - Show subject, body (cleaned for inbound), timestamp
  - Expandable quoted content if needed
- [ ] Auto-mark as read when opened (call `useMarkAsRead` hook from Story 6.2)

### Task 6: Create Prospect Info Sidebar (AC: 3)
- [ ] Create `src/components/features/inbox/ProspectInfoSidebar.tsx`
  - Display: name, email, company, title
  - Display: campaign name, sequence name, enrollment status
  - Link to: prospect detail page, campaign detail page
  - Quick actions placeholder (reply button for Story 6.7)

### Task 7: Implement Keyboard Navigation (AC: 6)
- [ ] Add `useInboxKeyboardNav` hook in `src/hooks/use-inbox-keyboard-nav.ts`
  - Arrow up/down: navigate list
  - Enter: open conversation
  - Escape: close detail panel
  - K: mark as read
- [ ] Wire hook to InboxPageClient

### Task 8: Create Empty State (AC: 7)
- [ ] Create `src/components/features/inbox/InboxEmptyState.tsx`
  - Illustration (use Lucide icon or simple SVG)
  - Message: "No replies yet — keep prospecting!"
  - Optional CTA: "Check your campaigns"

### Task 9: Create API Route for Conversations (AC: 1, 4, 8)
- [ ] Create `src/app/api/inbox/conversations/route.ts`
  - GET: Return paginated conversations for workspace
  - Query params: `page`, `limit`, `classification`, `unread`, `needsReview`, `search`, `dateFrom`, `dateTo`
  - Use `getConversationsForWorkspace` from conversation-service **after extending filters to support `classification`, `needsReview`, and `search`**
  - Return: `{ success: true, data: { conversations, total, page, limit, unreadTotal } }`

### Task 10: Create API Routes for Conversation Detail & Read Status (AC: 3, 5)
- [ ] Create `src/app/api/inbox/conversations/[id]/route.ts`
  - GET: Return single conversation with all messages
  - Use `getConversationWithMessages` from conversation-service
  - Workspace ownership check
- [ ] Create `src/app/api/inbox/conversations/[id]/read/route.ts`
  - POST: Mark as read (canonical endpoint for compatibility with `useMarkAsRead` from Story 6.2)
  - Optional: keep `PATCH /api/inbox/conversations/[id]` only as backward-compatible alias

### Task 11: Update TanStack Query Hooks (AC: all)
- [ ] Update `src/lib/inbox/conversation-service.ts`
  - Extend `ConversationFilters` to support `classification`, `needsReview`, and `search`
  - Implement Prisma filtering logic for AC4 combinations
- [ ] Update `src/hooks/use-conversations.ts`
  - Ensure hooks accept full inbox filter parameters
  - Add `useInboxConversations` with pagination support
- [ ] Update `src/types/inbox.ts`
  - Align `ConversationListResponse` with `{ conversations, total, page, limit, unreadTotal }`
- [ ] Ensure `useUnreadCount` is used for badge in sidebar

### Task 12: Create Unit Tests (AC: all)
- [ ] Create `src/__tests__/unit/inbox/ConversationList.test.tsx`
- [ ] Create `src/__tests__/unit/inbox/ClassificationBadge.test.tsx`
- [ ] Create `src/__tests__/unit/inbox/InboxFilters.test.tsx`
- [ ] Test keyboard navigation hook

### Task 13: Create Integration Tests (AC: 1, 4)
- [ ] Create `src/__tests__/integration/inbox-page.test.ts`
- [ ] Test API route with filters
- [ ] Test pagination
- [ ] Test mark as read flow

### Task 14: Update Sidebar Unread Badge (AC: 1)
- [ ] Modify `src/components/layout/Sidebar.tsx`
  - Add unread count badge next to "Inbox" nav item
  - Use `useUnreadCount` hook from Story 6.2

### Task 15: Update Story Tracking
- [ ] Mark story as "review" when implementation complete
- [ ] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Workspace Access:** Always verify with `assertWorkspaceAccess(userId, workspaceId)`
- **Prisma:** Use `@@map` for snake_case DB columns
- **TanStack Query Keys:** `['conversations', workspaceId]`, `['inbox', workspaceId, 'unread']`
- **File Organization:** Components in `src/components/features/inbox/`
- **Tests:** Tests in `src/__tests__/unit/` and `src/__tests__/integration/`

**From Story 6.1 (Gmail Sync):**
- `Conversation` and `InboxMessage` Prisma models already exist
- Gmail sync creates InboxMessage records for inbound replies
- `ReplyClassification` enum values: INTERESTED, NOT_INTERESTED, NOT_NOW, NEGATIVE, OUT_OF_OFFICE, UNSUBSCRIBE, BOUNCE, NEEDS_REVIEW, OTHER

**From Story 6.2 (Data Model):**
- `getConversationWithMessages(conversationId)` - returns conversation with all messages
- `getConversationsForWorkspace(workspaceId, filters)` - paginated list with filters
- `useConversations(workspaceId, filters)` - TanStack hook for list
- `useConversation(conversationId)` - TanStack hook for detail
- `useUnreadCount(workspaceId)` - TanStack hook for badge
- `useMarkAsRead(conversationId)` - mutation hook

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `src/app/(dashboard)/inbox/page.tsx` | NEW | Main inbox page |
| `src/app/(dashboard)/inbox/loading.tsx` | NEW | Skeleton loading |
| `src/app/api/inbox/conversations/route.ts` | NEW | List API |
| `src/app/api/inbox/conversations/[id]/route.ts` | NEW | Detail API (GET, optional PATCH alias) |
| `src/app/api/inbox/conversations/[id]/read/route.ts` | NEW | Mark-as-read API (POST canonical) |
| `src/components/features/inbox/ConversationList.tsx` | NEW | List component |
| `src/components/features/inbox/ConversationListItem.tsx` | NEW | List item |
| `src/components/features/inbox/ConversationDetail.tsx` | NEW | Detail panel |
| `src/components/features/inbox/MessageThread.tsx` | NEW | Thread view |
| `src/components/features/inbox/ClassificationBadge.tsx` | NEW | Badge component |
| `src/components/features/inbox/InboxFilters.tsx` | NEW | Filter panel |
| `src/components/features/inbox/ProspectInfoSidebar.tsx` | NEW | Context sidebar |
| `src/components/features/inbox/InboxEmptyState.tsx` | NEW | Empty state |
| `src/hooks/use-inbox-keyboard-nav.ts` | NEW | Keyboard nav hook |
| `src/components/layout/Sidebar.tsx` | MODIFY | Add unread badge |
| `src/hooks/use-conversations.ts` | MODIFY | Add filter params |

### UX Requirements (from UX Specification)

**From ux-design-specification.md:**
- **InboxReplyCard:** Custom component from UX spec (Priority P2)
- **Keyboard navigation:** Up/down to browse, Enter to open, Escape to close
- **Mark as read on view**
- **Categories:** Primary buckets max 4 (Interested, Not Interested, Not Now, Negative) + system classes (Out of Office, Bounce, Unsubscribe, Needs Review, Other)
- **1-click actions:** Quick responses for common patterns
- **Skeleton loading:** Shimmer pattern during fetch
- **Color palette:**
  - Primary: Teal `hsl(168, 76%, 42%)`
  - Success: Green `hsl(142, 71%, 45%)`
  - Warning: Amber `hsl(38, 92%, 50%)`
  - Destructive: Red `hsl(0, 84%, 60%)`

**Emotional Design:**
- "Inbox = Assistant" — AI trie et suggère avant que l'utilisateur n'agisse
- Inbox Zero = visible win state
- Daily processing target: < 15 min

### Technical Implementation Details

**Conversation List Item Structure:**
```typescript
interface ConversationListItem {
  id: string;
  threadId: string;
  prospect: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    company: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  lastMessage: {
    subject: string | null;
    preview: string; // First 50 chars of bodyCleaned
    direction: MessageDirection;
    receivedAt: Date;
    classification: ReplyClassification | null;
  };
  unreadCount: number;
  status: ConversationStatus;
  lastMessageAt: Date;
}
```

**Filter Query Parameters:**
```typescript
interface InboxFilters {
  page?: number;
  limit?: number;
  classification?: ReplyClassification[];
  unread?: boolean;
  needsReview?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

**API Response Format:**
```typescript
interface InboxListResponse {
  success: true;
  data: {
    conversations: ConversationListItem[];
    total: number;
    page: number;
    limit: number;
    unreadTotal: number;
  };
}
```

**Required Service Filter Contract for AC4:**
```typescript
interface ConversationFilters {
  status?: ConversationStatus;
  hasUnread?: boolean;
  classification?: ReplyClassification[];
  needsReview?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

### Dependencies

- **Story 6.1 complete:** Gmail sync creates InboxMessage records ✅
- **Story 6.2 complete:** Conversation service and hooks ✅
- **Future:** Story 6.4 AI Classification (will add classification badges)
- **Future:** Story 6.5 Manual Reclassification (will add dropdown in detail)
- **Future:** Story 6.6 Reply Suggestions (will add suggestion panel)
- **Future:** Story 6.7 Send Reply (will add reply composer)

### Edge Cases to Handle

1. **No conversations:** Show empty state with encouragement
2. **Conversation without prospect:** Display email only (unlinked conversation)
3. **Conversation without campaign:** Show as "Unlinked" conversation
4. **Very long message preview:** Truncate to 50 chars with ellipsis
5. **Multiple unread messages:** Show badge count, not just "unread"
6. **Deleted prospect:** Still show conversation with historical data
7. **Concurrent read:** Multiple tabs mark same as read
8. **Filter combination:** Handle all combinations gracefully
9. **Search no results:** Show "No conversations match your search"

### MVP Scope Notes

**IN SCOPE:**
- Conversation list with pagination
- Conversation detail with thread view
- Classification badges (display only)
- Filters and search
- Mark as read
- Keyboard navigation
- Empty state
- Unread badge in sidebar

**OUT OF SCOPE (Future Stories):**
- AI classification (Story 6.4)
- Manual reclassification (Story 6.5)
- Reply suggestions (Story 6.6)
- Send reply from inbox (Story 6.7)
- Bulk actions (archive, delete)
- Real-time updates (websockets)

### References

- [Source: epics.md#Story-6.3] — Full acceptance criteria (lines 1598-1631)
- [Source: ux-design-specification.md] — InboxReplyCard, keyboard nav, emotional design
- [Source: project-context.md] — API patterns and naming conventions
- [Source: src/lib/inbox/conversation-service.ts] — Query service
- [Source: src/hooks/use-conversations.ts] — TanStack Query hooks
- [Source: src/types/inbox.ts] — Type definitions

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

# Story 5.3: Sending Settings Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to configure sending parameters for my campaigns**,
So that **emails are sent at optimal times with proper personalization**.

## Acceptance Criteria

### AC1: Access Sending Settings
**Given** a user goes to Settings > Sending
**When** they access the configuration
**Then** they can configure:
  - Sending window: days (Mon-Sun checkboxes) and hours (9am-6pm slider)
  - Timezone: dropdown with auto-detect default
  - Daily quota: 20-50 slider with ramp-up option
  - From name: text field (default: user's name)
  - Signature: rich text editor

### AC2: Sending Window Configuration
**Given** a user configures sending window
**When** they set Mon-Fri, 9am-6pm
**Then** emails are ONLY scheduled within this window
**And** sending window is applied BEFORE queue scheduling (Story 5.4)
**And** days outside the window are skipped (not delayed to next valid day)

### AC3: Ramp-Up Mode Configuration
**Given** a user enables ramp-up
**When** the campaign starts
**Then** day 1: 20 emails, day 2: 30, day 3: 40, then cap at configured quota
**And** ramp-up only progresses if health score is OK
**And** ramp-up resets if campaign is paused and resumed

### AC4: Settings Persistence
**Given** a user saves settings
**When** settings are applied
**Then** future scheduled emails respect new settings
**And** already-sent emails are not affected
**And** settings are stored per-workspace in database

### AC5: Signature Appended to Emails
**Given** a user has configured a signature
**When** an email is sent via the email sending service (Story 5.5)
**Then** the signature is automatically appended to ALL outgoing emails
**And** signature appears after email body and before unsubscribe link

## Tasks / Subtasks

### Task 1: Create SendingSettings Prisma Model (AC: 4)
- [x] Add `SendingSettings` model to `prisma/schema.prisma`
- [x] Fields: id, workspaceId, sendingDays (JSON array of 0-6), startHour (int 0-23), endHour (int 0-23), timezone (string IANA), dailyQuota (int 20-50), rampUpEnabled (boolean), fromName (string), signature (text), createdAt, updatedAt
- [x] Add relation to Workspace model (one-to-one)
- [x] Run `npx prisma migrate dev --name add-sending-settings`

### Task 2: Create Settings API Routes (AC: 1, 4)
- [x] Create `src/app/api/settings/sending/route.ts`
- [x] GET: Fetch current SendingSettings for workspace (create default if not exists)
- [x] PUT: Update SendingSettings with validation
- [x] Use Zod schema for validation: `sendingSettingsSchema`
- [x] Return `ApiResponse<SendingSettingsResponse>`

### Task 3: Create SendingSettings Types and Mappers (AC: all)
- [x] Add `src/types/sending-settings.ts` with TypeScript interfaces
- [x] Add mapper function to `src/lib/prisma/mappers.ts`
- [x] Add Zod validation schema to `src/lib/utils/validation.ts`

### Task 4: Create useSendingSettings Hook (AC: 1, 4)
- [x] Add to `src/hooks/use-settings.ts` (new file)
- [x] Create `useSendingSettings` query hook (GET)
- [x] Create `useUpdateSendingSettings` mutation hook (PUT)
- [x] Query key pattern: `['settings', 'sending', workspaceId]`
- [x] On success: toast "Paramètres d'envoi enregistrés"

### Task 5: Create SendingSettingsForm Component (AC: 1, 2, 3)
- [x] Create `src/components/features/settings/SendingSettingsForm.tsx`
- [x] Day selector: 7 checkboxes for Mon-Sun (use localized day names in French)
- [x] Hour range: dual slider for start/end hour (0-23) with visual representation
- [x] Timezone: dropdown with common timezones, auto-detect default from browser
- [x] Daily quota: slider 20-50 with value display
- [x] Ramp-up toggle: switch with explanation tooltip
- [x] From name: text input (placeholder: user's display name)
- [x] Signature: textarea or simple rich text (TipTap if available, else textarea)
- [x] Save button with loading state

### Task 6: Create Sending Settings Page (AC: 1)
- [x] Integrated into existing SettingsTabs component as "Envoi" tab
- [x] Page title and loading skeleton handled by SendingSettingsForm component
- Skipped: Separate page route not needed (integrated into tab navigation)

### Task 7: Update Settings Navigation (AC: 1)
- [x] Update `src/components/features/settings/SettingsTabs.tsx` to include "Envoi" tab
- Skipped: Sidebar sub-link not needed (tab navigation sufficient)

### Task 8: Create Helper Functions for Sending Window (AC: 2, 3)
- [x] Create `src/lib/utils/sending-window.ts`
- [x] Function `isWithinSendingWindow(settings: SendingSettings, date: Date): boolean`
- [x] Function `getNextSendingSlot(settings: SendingSettings, fromDate: Date): Date`
- [x] Function `calculateRampUpQuota(settings: SendingSettings, campaignDay: number): number`
- [x] Handle timezone conversion using native Intl API

### Task 9: Create Unit Tests (AC: all)
- [x] Create `src/__tests__/unit/settings/sending-settings.test.ts`
- [x] Test `isWithinSendingWindow` with various scenarios (6 tests)
- [x] Test `getNextSendingSlot` edge cases (3 tests)
- [x] Test `calculateRampUpQuota` for day 1, 2, 3, and capped days (6 tests)
- [x] Test formatHourRange and getBrowserTimezone (3 tests)
- All 18 unit tests pass

### Task 10: Update Story Tracking
- [x] Mark story as "review" when implementation complete
- [x] Update `sprint-status.yaml` with status change

## Dev Notes

### Architecture Patterns

**From project-context.md:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Prisma:** Use `@@map` for snake_case DB columns, camelCase in code
- **Mappers:** Centralized JSON mapping via `lib/prisma/mappers.ts`
- **Hooks:** TanStack Query mutations with cache invalidation
- **Workspace Access:** Always use `assertWorkspaceAccess(userId, workspaceId)` in API routes

**From Previous Story 5.2:**
- Settings page at `app/(dashboard)/settings/` follows tab pattern
- Existing `SettingsTabs.tsx` component for navigation
- `IcpSettings.tsx` as reference for form structure
- Successfully used form validation with Zod

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add SendingSettings model |
| `src/app/api/settings/sending/route.ts` | NEW | GET/PUT API for settings |
| `src/types/sending-settings.ts` | NEW | TypeScript interfaces |
| `src/lib/prisma/mappers.ts` | MODIFY | Add mapSendingSettings |
| `src/lib/utils/validation.ts` | MODIFY | Add sendingSettingsSchema |
| `src/lib/utils/sending-window.ts` | NEW | Window calculation utilities |
| `src/hooks/use-settings.ts` | NEW | React Query hooks |
| `src/components/features/settings/SendingSettingsForm.tsx` | NEW | Settings form UI |
| `src/components/features/settings/SettingsTabs.tsx` | MODIFY | Add "Envoi" tab |
| `src/__tests__/unit/settings/sending-settings.test.ts` | NEW | Unit tests |

### Technical Requirements

**SendingSettings Model Schema:**
```prisma
model SendingSettings {
  id           String   @id @default(cuid())
  workspaceId  String   @unique @map("workspace_id")
  sendingDays  Json     @default("[1,2,3,4,5]") @map("sending_days") // Array of 0-6 (Sun-Sat)
  startHour    Int      @default(9) @map("start_hour")  // 0-23
  endHour      Int      @default(18) @map("end_hour")   // 0-23
  timezone     String   @default("Europe/Paris")
  dailyQuota   Int      @default(30) @map("daily_quota") // 20-50
  rampUpEnabled Boolean @default(true) @map("ramp_up_enabled")
  fromName     String?  @map("from_name")
  signature    String?  @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  @@map("sending_settings")
}
```

**Zod Validation Schema:**
```typescript
export const sendingSettingsSchema = z.object({
  sendingDays: z.array(z.number().min(0).max(6)).min(1, "Sélectionnez au moins un jour"),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
  timezone: z.string().min(1, "Timezone requis"),
  dailyQuota: z.number().min(20).max(50),
  rampUpEnabled: z.boolean(),
  fromName: z.string().optional(),
  signature: z.string().optional(),
}).refine(
  (data) => data.startHour < data.endHour,
  { message: "L'heure de début doit être avant l'heure de fin", path: ["startHour"] }
);
```

**TanStack Query Keys:**
```typescript
['settings', 'sending', workspaceId]  // GET sending settings
```

**API Endpoints:**
```typescript
// GET /api/settings/sending
// Returns SendingSettings (creates default if not exists)

// PUT /api/settings/sending
// Body: SendingSettingsInput
// Returns updated SendingSettings
```

**Ramp-Up Quota Calculation:**
```typescript
function calculateRampUpQuota(settings: SendingSettings, dayNumber: number): number {
  if (!settings.rampUpEnabled) return settings.dailyQuota;
  
  const rampUpSchedule = [20, 30, 40]; // day 1, 2, 3
  if (dayNumber <= 3) {
    return Math.min(rampUpSchedule[dayNumber - 1], settings.dailyQuota);
  }
  return settings.dailyQuota;
}
```

### UI/UX Requirements

**From UX Design Specification:**
- **Form layout:** Vertical stack with clear section headers
- **Day selector:** Horizontal row of day badges/checkboxes (Lun, Mar, Mer, Jeu, Ven, Sam, Dim)
- **Hour slider:** Range slider with labels showing hours (ex: "9h - 18h")
- **Quota slider:** Single value slider with visual indicator
- **Save button:** Primary teal, positioned at bottom of form
- **Toast:** "Paramètres d'envoi enregistrés" on success

**Accessibility (WCAG 2.1 AA):**
- Form controls have visible labels
- Color contrast meets AA requirements
- Keyboard navigation for all controls
- Screen reader announces form validation errors

### Dependencies

- **Story 5.1 complete:** Campaign model foundation exists
- **Story 5.2 complete:** Pre-launch gating patterns established
- **Future:** Story 5.4 will USE these settings for email scheduling
- **Future:** Story 5.5 will USE signature for email sending

### Edge Cases to Handle

1. **First access:** Create default SendingSettings on first GET
2. **Invalid timezone:** Validate against list of IANA timezones
3. **endHour <= startHour:** Block with validation error
4. **No days selected:** Require at least one day
5. **Quota change during active campaign:** Only affects future scheduled emails

### References

- [Source: epics.md#Story-5.3] — Full acceptance criteria
- [Source: architecture.md#Email-Scheduling-Architecture] — Queue integration context
- [Source: project-context.md] — Naming conventions and API patterns
- [Source: story-5-2-campaign-launch-wizard.md] — Pre-launch gating pattern
- [Source: lib/utils/date-utils.ts] — Date utility patterns

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Migration `add-sending-settings` applied successfully
- Prisma client regeneration requires dev server restart (file lock issue)

### Completion Notes List

1. Created `SendingSettings` Prisma model with all required fields and workspace relation
2. Implemented GET/PUT API routes with auto-creation of defaults and Zod validation
3. Created TypeScript types, mapper function, and validation schema
4. Built React Query hooks with cache invalidation and toast notifications
5. Created comprehensive `SendingSettingsForm` UI component with:
   - Day selector with French day names (Lun, Mar, Mer, etc.)
   - Dual hour sliders for start/end hours
   - Timezone dropdown with auto-detect from browser
   - Daily quota slider (20-50)
   - Ramp-up toggle with tooltip explanation
   - From name input and signature textarea
   - Save button with loading state
6. Added "Envoi" tab to SettingsTabs navigation
7. Created helper functions for sending window calculations:
   - `isWithinSendingWindow` - checks if date is within configured window
   - `getNextSendingSlot` - finds next valid sending time
   - `calculateRampUpQuota` - calculates daily quota based on ramp-up schedule
8. All 18 unit tests passing

### File List

**NEW FILES:**
- `src/types/sending-settings.ts` - TypeScript interfaces and constants
- `src/app/api/settings/sending/route.ts` - API routes (GET/PUT)
- `src/hooks/use-settings.ts` - React Query hooks
- `src/lib/utils/sending-window.ts` - Sending window utilities
- `src/components/features/settings/SendingSettingsForm.tsx` - Settings form UI
- `src/components/ui/switch.tsx` - shadcn Switch component
- `src/components/ui/slider.tsx` - shadcn Slider component
- `src/__tests__/unit/settings/sending-settings.test.ts` - Unit tests
- `prisma/migrations/[timestamp]_add_sending_settings/migration.sql` - DB migration

**MODIFIED FILES:**
- `prisma/schema.prisma` - Added SendingSettings model and Workspace relation
- `src/lib/prisma/mappers.ts` - Added mapSendingSettings function
- `src/lib/utils/validation.ts` - Added sendingSettingsSchema Zod schema
- `src/components/features/settings/SettingsTabs.tsx` - Added "Envoi" tab

### Change Log

- 2026-01-31: Story 5.3 implementation complete - Sending Settings Configuration

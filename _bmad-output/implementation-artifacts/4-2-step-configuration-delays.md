# Story 4.2: Step Configuration & Delays

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to configure delays between sequence steps**,
so that **my emails are spaced appropriately for follow-up cadence**.

## Acceptance Criteria

### Delay Display (AC1)
1. **Given** a sequence has multiple steps, **When** the user views the sequence builder, **Then** each step (except the first) has a delay configuration, **And** delay is displayed as "Attendre X jours avant l'envoi".

### Delay Configuration (AC2)
2. **Given** a user configures a delay, **When** they set the delay value, **Then** they can choose from: 1, 2, 3, 5, 7, 14 days (dropdown), **And** default delay is 3 days for new steps.

### Delay Persistence with Reorder (AC3)
3. **Given** a user reorders steps via drag and drop, **When** they drag and drop, **Then** steps are reordered, **And** delays remain attached to their respective steps (not positions).

### Delay Calculation Logic (AC4)
4. **Given** step 2 has delay 3 days and step 3 has delay 5 days, **When** the sequence is launched (future epic), **Then** step 1 is sent at scheduled time, **And** step 2 is sent 3 days after step 1, **And** step 3 is sent 5 days after step 2 (8 days total from start).

### Visual Timeline (AC5)
5. **Given** a sequence has configured delays, **When** the user views the builder, **Then** a visual timeline representation shows the sequence flow with delays between steps.

### First Step No Delay (AC6)
6. **Given** a user adds the first step, **When** the step is created, **Then** no delay configuration is shown for step 1, **And** step 1's delayDays is always 0.

## Tasks / Subtasks

- [x] **Task 1: Enhance StepCard with Delay UI (AC: 1, 2, 6)**
  - [x] Add delay dropdown/select to `StepCard.tsx` component
  - [x] Show delay selector only for steps with order > 1
  - [x] Use shadcn/ui Select component for dropdown
  - [x] Options: 1, 2, 3, 5, 7, 14 jours
  - [x] French labels: "1 jour", "2 jours", "3 jours", etc.
  - [x] Display delay as badge/label: "Attendre X jours avant l'envoi"

- [x] **Task 2: Integrate Delay in Step CRUD (AC: 2)**
  - [x] Modify `useAddStep` mutation to include delayDays (default: 3 for order > 1, 0 for first step)
  - [x] Modify `useUpdateStep` mutation to accept delayDays updates
  - [x] Add `PATCH` support to `/api/sequences/[id]/steps/[stepId]` for delay-only updates
  - [x] Validate delayDays is in allowed values: [0, 1, 2, 3, 5, 7, 14]

- [x] **Task 3: Update Reorder Logic for Delay Preservation (AC: 3)**
  - [x] Review existing reorder endpoint to ensure delayDays stays with step
  - [x] When step moves to position 1, automatically set delayDays = 0
  - [x] When step moves from position 1 to later, set delayDays = 3 (default)
  - [x] Write tests for reorder with delay preservation

- [x] **Task 4: Create Visual Timeline Component (AC: 5)**
  - [x] Create `src/components/features/sequences/SequenceTimeline.tsx`
  - [x] Show horizontal timeline with step markers
  - [x] Display delays between steps as connecting lines with day counts
  - [x] Calculate and display total sequence duration
  - [x] Example: "[Step 1] —3j→ [Step 2] —5j→ [Step 3] (Total: 8 jours)"

- [x] **Task 5: Add Delay Constants (AC: 1, 2)**
  - [x] Add to `src/lib/constants/sequences.ts`:
    - `ALLOWED_DELAY_DAYS = [1, 2, 3, 5, 7, 14]`
    - `DEFAULT_DELAY_DAYS = 3`
    - `DELAY_LABELS: Record<number, string>` for French labels
  - [x] Use constants in both API validation and UI

- [x] **Task 6: Update Step Form in StepEditor (AC: 1, 2)**
  - [x] Add delay field to StepEditor dialog when editing existing step (via StepCard inline)
  - [x] Pre-populate with current delayDays value
  - [x] Allow changing delay in edit mode
  - [x] Disable delay input if step is first (order === 1)

- [x] **Task 7: Zod Validation for Delay (AC: 2)**
  - [x] Update step schemas (`CreateStepInput`, `UpdateStepInput`) in types
  - [x] Add `delayDays: z.number().refine(v => ALLOWED_DELAY_DAYS.includes(v))`
  - [x] Server-side validation in API routes

- [x] **Task 8: Unit & Integration Tests**
  - [x] Test delay dropdown renders correctly
  - [x] Test delay value updates persist
  - [x] Test reorder preserves delays
  - [x] Test first step always has delayDays = 0
  - [x] Test timeline calculation logic
  - [x] Test API validation for invalid delay values

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess` from `lib/guardrails/workspace-check.ts`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **TanStack Query Keys:** `['sequences', workspaceId, id]` for detail - invalidate on step updates
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/sequences/` and `__tests__/integration/sequences/`
- **French Language:** All user-facing content in French per `config.yaml`
- **Error Handling:** Try/catch + console.error + return error()

### Existing Schema (from Story 4.1)

```prisma
model SequenceStep {
  id         String   @id @default(cuid())
  sequenceId String   @map("sequence_id")
  order      Int      // 1, 2, 3
  subject    String
  body       String   @db.Text
  delayDays  Int      @default(0) @map("delay_days") // ← ALREADY EXISTS
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  sequence   Sequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
  
  @@map("sequence_steps")
  @@index([sequenceId])
  @@unique([sequenceId, order])
}
```

> **Note:** The `delayDays` field already exists from Story 4.1. This story adds UI and business logic for configuring it.

### Delay Constants

```typescript
// src/lib/constants/sequences.ts - ADD to existing file
export const ALLOWED_DELAY_DAYS = [1, 2, 3, 5, 7, 14] as const;
export const DEFAULT_DELAY_DAYS = 3;
export const DELAY_LABELS: Record<number, string> = {
  0: 'Immédiat',
  1: '1 jour',
  2: '2 jours',
  3: '3 jours',
  5: '5 jours',
  7: '7 jours',
  14: '14 jours',
};
```

### Delay UI Pattern

```tsx
// In StepCard.tsx - Add delay display and selector
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ALLOWED_DELAY_DAYS, DELAY_LABELS } from '@/lib/constants/sequences';

// Only show for steps with order > 1
{step.order > 1 && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Clock className="h-4 w-4" />
    <span>Attendre</span>
    <Select 
      value={String(step.delayDays)} 
      onValueChange={(val) => onDelayChange(Number(val))}
    >
      <SelectTrigger className="w-24 h-7">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALLOWED_DELAY_DAYS.map(days => (
          <SelectItem key={days} value={String(days)}>
            {DELAY_LABELS[days]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <span>avant l'envoi</span>
  </div>
)}
```

### Visual Timeline Pattern

```tsx
// src/components/features/sequences/SequenceTimeline.tsx
interface SequenceTimelineProps {
  steps: SequenceStep[];
}

export function SequenceTimeline({ steps }: SequenceTimelineProps) {
  const totalDays = steps.reduce((sum, step, i) => 
    i === 0 ? 0 : sum + step.delayDays, 0
  );
  
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {step.order}
          </div>
          {index < steps.length - 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <div className="w-12 h-0.5 bg-border" />
              <span className="font-medium">{steps[index + 1].delayDays}j</span>
              <div className="w-12 h-0.5 bg-border" />
            </div>
          )}
        </Fragment>
      ))}
      <span className="ml-4 text-sm text-muted-foreground">
        Total: {totalDays} jours
      </span>
    </div>
  );
}
```

### Reorder with Delay Logic

```typescript
// In reorder API endpoint - update logic
async function handleReorder(sequenceId: string, stepIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < stepIds.length; i++) {
      const newOrder = i + 1;
      const isFirstStep = newOrder === 1;
      
      await tx.sequenceStep.update({
        where: { id: stepIds[i] },
        data: {
          order: newOrder,
          // First step always has delay 0, others keep their delay
          // If step moves TO first position, reset delay to 0
          // If step moves FROM first position, set default delay
          delayDays: isFirstStep ? 0 : undefined // Keep existing if not first
        }
      });
    }
  });
}
```

### TypeScript Types Update

```typescript
// src/types/sequence.ts - Update existing types
export interface UpdateStepInput {
  subject?: string;
  body?: string;
  delayDays?: number; // Add this
}

// Zod schema for validation
import { z } from 'zod';
import { ALLOWED_DELAY_DAYS } from '@/lib/constants/sequences';

export const updateStepSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  delayDays: z.number().refine(
    (v) => ALLOWED_DELAY_DAYS.includes(v as typeof ALLOWED_DELAY_DAYS[number]),
    'Invalid delay value'
  ).optional(),
});
```

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `src/lib/constants/sequences.ts` | MODIFY | Add delay constants |
| `src/components/features/sequences/StepCard.tsx` | MODIFY | Add delay selector |
| `src/components/features/sequences/StepEditor.tsx` | MODIFY | Add delay field in edit mode |
| `src/components/features/sequences/SequenceBuilder.tsx` | MODIFY | Integrate timeline |
| `src/components/features/sequences/SequenceTimeline.tsx` | NEW | Visual timeline component |
| `src/hooks/use-sequences.ts` | MODIFY | Update step mutations for delayDays |
| `src/app/api/sequences/[id]/steps/[stepId]/route.ts` | MODIFY | Handle delay updates |
| `src/app/api/sequences/[id]/steps/reorder/route.ts` | MODIFY | Handle delay on reorder |
| `src/types/sequence.ts` | MODIFY | Add delayDays to schemas |
| `src/__tests__/unit/sequences/step-delays.test.ts` | NEW | Test delay logic |

### Previous Story Learnings (from 4.1)

**Patterns Established:**
- Prisma models with `delayDays` field ✅ (already created)
- @dnd-kit for drag-and-drop reordering ✅
- Tiptap for rich text editing ✅
- shadcn/ui Select component available ✅
- TanStack Query mutation + invalidation patterns ✅
- French language throughout UI ✅
- AlertDialog for confirmation dialogs ✅
- Workspace access validation ✅
- Atomic transactions for step operations ✅
- Loading state UX patterns ✅

**Applicable to This Story:**
- The `delayDays` field is ALREADY in the schema - just add UI
- Use existing Select component from shadcn/ui
- Follow same mutation patterns for delay updates
- Leverage existing @dnd-kit setup for reorder logic updates
- Apply same French localization patterns

### Dependencies (Already Installed)

All dependencies from Story 4.1 are available:
- @dnd-kit/core, @dnd-kit/sortable for reordering
- shadcn/ui components (Select, Tooltip, etc.)
- Existing sequence hooks and API endpoints

### NFR Compliance

- **NFR1:** Actions utilisateur < 500ms → Inline delay update with optimistic UI
- **NFR5:** Dashboard load < 2s → Delay data loaded with step data (no extra queries)
- **NFR17:** Keyboard navigation → Select component is keyboard accessible

### UX Design References

From UX Design Specification:
- Inline edit patterns for quick modifications
- Skeleton loading shimmer for async content
- Toast notifications: bottom-right, non-blocking
- Teal primary color palette
- Timeline visualization for sequence flows

### References

- [Epics: Story 4.2](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L929-L961)
- [Architecture: API Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L285-L300)
- [Architecture: Error Handling](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L687-L712)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 4.1 Sequence Creation](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/4-1-sequence-creation-max-3-steps.md)
- [FR14: Configure delays between steps](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L40)

## Dev Agent Record

### Agent Model Used

Claude (Antigravity)

### Debug Log References

N/A

### Completion Notes List

- ✅ Added delay constants (ALLOWED_DELAY_DAYS, DEFAULT_DELAY_DAYS, DELAY_LABELS) to sequences.ts
- ✅ Enhanced StepCard with inline delay selector using shadcn/ui Select component
- ✅ Created SequenceTimeline component with visual representation of delays
- ✅ Updated step creation API to default delayDays to 3 for steps after first
- ✅ Updated step update API with Zod validation for allowed delay values
- ✅ Enhanced reorder API to handle delay preservation (first step always 0, defaults when moving from first)
- ✅ Integrated timeline into SequenceBuilder with delay change handler
- ✅ Added 24 unit tests covering delay constants, validation, timeline calculation, and reorder logic
- ✅ All sequence tests pass

### File List

**Modified:**
- src/lib/constants/sequences.ts - Added ALLOWED_DELAY_DAYS, DEFAULT_DELAY_DAYS, DELAY_LABELS
- src/components/features/sequences/StepCard.tsx - Added delay selector with onDelayChange callback
- src/components/features/sequences/SequenceBuilder.tsx - Integrated timeline and delay change handler
- src/app/api/sequences/[id]/steps/route.ts - Default delay logic for step creation
- src/app/api/sequences/[id]/steps/[stepId]/route.ts - Zod validation for delay values
- src/app/api/sequences/[id]/steps/reorder/route.ts - Delay preservation during reorder

**New:**
- src/components/features/sequences/SequenceTimeline.tsx - Visual timeline component
- src/__tests__/unit/sequences/step-delays.test.ts - Unit tests for delay functionality
- src/__tests__/unit/sequences/step-api-integrity.test.ts - New security/integrity tests

### Senior Developer Review (AI)

_Reviewer: Antigravity on 2026-01-28_

**Findings & Fixes:**
1.  **Security/Integrity (AC6):** Enforced `delayDays=0` constraint for the first step on the backend API (`PUT`). Malicious payloads can no longer set a delay on step 1.
    *   *Fix:* Added validation logic to `src/app/api/sequences/[id]/steps/[stepId]/route.ts`.
    *   *Verification:* Added `src/__tests__/unit/sequences/step-api-integrity.test.ts`.
2.  **UX/Optimistic UI:** Fixed visual timeline glitch where delay wouldn't update immediately upon dragging.
    *   *Fix:* Updated `handleDragEnd` in `SequenceBuilder.tsx` to recalculate delays optimistically.
3.  **Test Quality:** Addressed "Fake Tests" finding by adding behavior-verifying tests for API constraints.



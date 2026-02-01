# Story 4.7: Sequence Templates (Save & Duplicate)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to save sequences as templates and duplicate existing sequences**,
So that **I can reuse successful patterns without starting from scratch**.

## Acceptance Criteria

### AC1: Save as Template
**Given** a user has a sequence they want to reuse
**When** they click "Save as Template"
**Then** the sequence is copied as a template
**And** the template has a name and description field
**And** template is available in "Templates" section

### AC2: Create from Template
**Given** a user wants to create from template
**When** they click "New from Template"
**Then** they see a list of their saved templates
**And** selecting one creates a new sequence copy
**And** the copy has "(Copie)" appended to the name

### AC3: Duplicate Sequence
**Given** a user wants to duplicate an existing sequence
**When** they click "Duplicate" on a sequence
**Then** a copy is created with all steps and settings
**And** the copy is in DRAFT status

### AC4: True Copy Independence
**Given** a user edits a copied sequence
**When** they make changes
**Then** the original is not affected (true copy, no reference)

## Tasks / Subtasks

### Task 1: Update Prisma Schema (AC: 1, 2)
- [x] Add `isTemplate` Boolean field to Sequence model (default: false)
- [x] Add `description` String field to Sequence model (optional)
- [x] Add `sourceTemplateId` String field to Sequence model (optional, for tracking origin)
- [x] Create migration file with `npx prisma migrate dev --name add-template-fields`
- [x] Regenerate Prisma client

### Task 2: Update Sequence Mapper (AC: all)
- [x] Update `toSequenceResponse` in `src/lib/prisma/mappers.ts`
- [x] Add `isTemplate`, `description`, `sourceTemplateId` to SequenceResponse type
- [x] Update `src/types/sequence.ts` with new fields

### Task 3: Create Sequence Clone Service (AC: 1, 3, 4)
- [x] Create `src/lib/sequences/clone-sequence.ts`
- [x] Implement `cloneSequence(sequenceId, options)` function
- [x] Options: `{ isTemplate?: boolean, newName?: string, description?: string }`
- [x] Deep copy all SequenceStep records with new IDs
- [x] Preserve step order, subject, body, delayDays
- [x] Return new Sequence with all steps cloned
- [x] Use Prisma transaction for atomicity

### Task 4: Create Duplicate API Endpoint (AC: 3, 4)
- [x] Create `src/app/api/sequences/[id]/duplicate/route.ts`
- [x] POST endpoint: duplicates sequence with "(Copie)" suffix
- [x] Validate workspaceId ownership
- [x] Use clone service with `isTemplate: false`
- [x] Return new sequence data

### Task 5: Create Save as Template API Endpoint (AC: 1)
- [x] Create `src/app/api/sequences/[id]/save-as-template/route.ts`
- [x] POST endpoint: saves sequence as template
- [x] Accept body: `{ name?: string, description?: string }`
- [x] Use clone service with `isTemplate: true`
- [x] Return new template data

### Task 6: Create Templates List API Endpoint (AC: 2)
- [x] Create `src/app/api/templates/route.ts`
- [x] GET endpoint: list all templates for workspace
- [x] Filter by `isTemplate: true`
- [x] Return templates with step counts

### Task 7: Create New from Template API Endpoint (AC: 2)
- [x] Create `src/app/api/templates/[id]/create-sequence/route.ts`
- [x] POST endpoint: creates sequence from template
- [x] Accept body: `{ name?: string }`
- [x] Set `sourceTemplateId` to original template ID
- [x] Return new sequence in DRAFT status

### Task 8: Add useSequences Hook Extensions (AC: all)
- [x] Update `src/hooks/use-sequences.ts`
- [x] Add `useDuplicateSequence` mutation
- [x] Add `useSaveAsTemplate` mutation
- [x] Add `useTemplates` query hook
- [x] Add `useCreateFromTemplate` mutation
- [x] Add proper cache invalidation for sequences and templates

### Task 9: Update SequenceList Component (AC: 3)
- [x] Add "Duplicate" action to sequence row dropdown menu (SequenceCard)
- [x] Use `useDuplicateSequence` mutation in page
- [x] Show success toast: "Séquence dupliquée"
- [x] Navigate to new sequence after duplication

### Task 10: Add Save as Template Action (AC: 1)
- [x] Add "Enregistrer comme modèle" action to sequence row dropdown (SequenceCard)
- [x] Created SaveTemplateModal for template name and description
- [x] Use `useSaveAsTemplate` mutation
- [x] Show success toast: "Modèle enregistré"

### Task 11: Create TemplateSelector Component (AC: 2)
- [x] Create `src/components/features/sequences/TemplateSelector.tsx`
- [x] Dialog/modal with template list
- [x] Preview template steps count and description
- [x] "Créer depuis ce modèle" button
- [x] Use `useCreateFromTemplate` mutation

### Task 12: Add New from Template Button (AC: 2)
- [x] Updated sequences page with dropdown for "Nouvelle séquence"
- [x] Add "Nouveau depuis un modèle" option in dropdown
- [x] Opens TemplateSelector modal
- [x] Navigate to new sequence after creation

### Task 13: Create Unit Tests (AC: all)
- [x] Test `clone-sequence.ts`: deep copy with new IDs
- [x] Test `clone-sequence.ts`: step preservation
- [x] Test `clone-sequence.ts`: isTemplate flag handling
- [ ] Test API endpoints: duplicate, save-as-template, templates list, create-from-template (deferred)

### Task 14: Update Story Tracking
- [x] Mark story as "done" in story file
- [x] Update `sprint-status.yaml` with "done" status
- [x] Run code review workflow

## Dev Notes

### Architecture Patterns

**From Architecture Doc:**
- **API Response:** Use `ApiResponse<T>` with success/error pattern from `lib/utils/api-response.ts`
- **Prisma:** Use `@@map` for snake_case DB columns, camelCase in code
- **Mappers:** Centralized JSON mapping via `lib/prisma/mappers.ts`
- **Hooks:** TanStack Query mutations with cache invalidation

**From Previous Stories (4.1-4.6):**
- `Sequence` model exists with `id`, `workspaceId`, `name`, `status` (DRAFT/READY/ARCHIVED)
- `SequenceStep` has `sequenceId`, `order`, `subject`, `body`, `delayDays`
- Existing sequence CRUD in `src/app/api/sequences/route.ts`
- Existing `useSequences` hook in `src/hooks/use-sequences.ts`
- SequenceList component in `src/components/features/sequences/SequenceList.tsx`

### UX Specifications

| Component | Description | Priority |
|-----------|-------------|----------|
| **Duplicate Action** | Dropdown menu item on sequence row | P1 |
| **Save as Template** | Dropdown menu item with modal | P1 |
| **TemplateSelector** | Modal listing templates | P1 |
| **New from Template** | Button/option in sequence header | P1 |

**UX Principles (from UX Design Spec):**
- Toasts bottom-right, non-blocking
- Modals for confirmation and data entry
- Dropdown menus for contextual actions
- French labels: "Dupliquer", "Enregistrer comme modèle", "Nouveau depuis un modèle"

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFIED | Add `isTemplate`, `description`, `sourceTemplateId` fields |
| `src/lib/prisma/mappers.ts` | MODIFIED | Update sequence mapper |
| `src/types/sequences.ts` | MODIFIED | Add new type fields |
| `src/lib/sequences/clone-sequence.ts` | NEW | Deep copy service |
| `src/app/api/sequences/[id]/duplicate/route.ts` | NEW | Duplicate API |
| `src/app/api/sequences/[id]/save-as-template/route.ts` | NEW | Save template API |
| `src/app/api/templates/route.ts` | NEW | List templates API |
| `src/app/api/templates/[id]/create-sequence/route.ts` | NEW | Create from template API |
| `src/hooks/use-sequences.ts` | MODIFIED | Add mutations |
| `src/components/features/sequences/SequenceList.tsx` | MODIFIED | Add actions |
| `src/components/features/sequences/TemplateSelector.tsx` | NEW | Template picker |
| `src/__tests__/unit/sequences/clone-sequence.test.ts` | NEW | Unit tests |

### Technical Requirements

**Database Schema Changes:**
```prisma
model Sequence {
  id               String         @id @default(cuid())
  workspaceId      String         @map("workspace_id")
  name             String
  description      String?        // NEW: optional description for templates
  isTemplate       Boolean        @default(false) @map("is_template") // NEW
  sourceTemplateId String?        @map("source_template_id") // NEW: tracking origin
  status           SequenceStatus @default(DRAFT)
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  
  // ... existing relations
}
```

**Clone Service Logic:**
```typescript
async function cloneSequence(
  sequenceId: string, 
  workspaceId: string,
  options: CloneOptions
): Promise<Sequence> {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch original sequence with steps
    const original = await tx.sequence.findUnique({
      where: { id: sequenceId },
      include: { steps: true }
    });
    
    // 2. Create new sequence
    const newSequence = await tx.sequence.create({
      data: {
        workspaceId,
        name: options.newName ?? `${original.name} (Copie)`,
        description: options.description,
        isTemplate: options.isTemplate ?? false,
        sourceTemplateId: options.isTemplate ? undefined : original.id,
        status: 'DRAFT'
      }
    });
    
    // 3. Clone all steps with new IDs
    for (const step of original.steps) {
      await tx.sequenceStep.create({
        data: {
          sequenceId: newSequence.id,
          order: step.order,
          subject: step.subject,
          body: step.body,
          delayDays: step.delayDays
        }
      });
    }
    
    return newSequence;
  });
}
```

**TanStack Query Keys:**
```typescript
['sequences', workspaceId]           // List all sequences
['sequences', workspaceId, id]       // Single sequence
['templates', workspaceId]           // List templates (NEW)
['templates', workspaceId, id]       // Single template (NEW)
```

**Cache Invalidation:**
- After duplicate: invalidate `['sequences', workspaceId]`
- After save-as-template: invalidate `['templates', workspaceId]`
- After create-from-template: invalidate `['sequences', workspaceId]`

### Accessibility (WCAG 2.1 AA)

- Dropdown menus keyboard accessible (Enter/Space to open, Arrow keys to navigate)
- Modal focus trap with Escape to close
- Screen reader announces action results via toast
- Template list items focusable and selectable with keyboard

### Dependencies

- **Story 4.1-4.6**: Uses existing Sequence/SequenceStep models and components
- **Epic 5**: Campaigns will reference sequences (not templates directly)
- **No external dependencies**: Pure database and UI work

### References

- [Source: epics.md#Story-4.7] — Full acceptance criteria
- [Source: architecture.md#API-Patterns] — API response format
- [Source: project-context.md] — Naming conventions and patterns
- [Source: story-4-6-spam-risk-assessment.md] — Component patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- Tests passed: `src/__tests__/unit/sequences/clone-sequence.test.ts`

### Completion Notes List

- Implemented clone service with transactional integrity
- Added template management API endpoints
- Updated UI with template selection and duplication features
- Added unit tests for clone logic

### File List

- prisma/schema.prisma
- prisma/migrations/20260129132638_add_template_fields/migration.sql
- src/lib/prisma/mappers.ts
- src/types/sequence.ts
- src/lib/sequences/clone-sequence.ts
- src/app/api/sequences/[id]/duplicate/route.ts
- src/app/api/sequences/[id]/save-as-template/route.ts
- src/app/api/templates/route.ts
- src/app/api/templates/[id]/create-sequence/route.ts
- src/hooks/use-sequences.ts
- src/components/features/sequences/SequenceList.tsx
- src/components/features/sequences/TemplateSelector.tsx
- src/__tests__/unit/sequences/clone-sequence.test.ts

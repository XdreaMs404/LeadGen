# Story 3.6: Prospect Deletion with Cascade

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to delete prospects and have related data cleaned up automatically**,
so that **I can maintain a clean database without orphaned records**.

## Acceptance Criteria

### Soft Delete & List Removal (AC1)
1. **Given** a user selects one or more prospects, **When** they click "Supprimer" (with confirmation dialog), **Then** the prospects are soft-deleted (not removed from DB immediately), **And** they disappear from the active prospect list (filtered by `deletedAt IS NULL`).

### Active Campaign Warning (AC2)
2. **Given** a prospect is part of an active sequence/campaign, **When** deletion is attempted, **Then** a warning shows: "Ce prospect est dans X campagnes actives", **And** user can confirm to remove from campaigns AND delete.

### Cascade Cleanup (AC3)
3. **Given** a prospect is deleted, **When** the deletion completes, **Then** related campaign enrollments are cancelled, **And** scheduled emails for this prospect are cancelled (status → CANCELLED), **And** enrichment jobs are cancelled, **And** audit log records the deletion with timestamp and user ID.

### Inbox Thread Archival (AC4)
4. **Given** a prospect has replies/emails in inbox, **When** deletion completes, **Then** the inbox thread is archived (not deleted) for compliance (`archivedAt` timestamp set).

### Bulk Delete (AC5)
5. **Given** a user selects multiple prospects using checkboxes, **When** they click "Supprimer la sélection", **Then** the confirmation dialog shows the count, **And** all selected prospects are soft-deleted in a single transaction, **And** a summary shows: "X prospects supprimés".

### Re-enrichment Block (AC6)
6. **Given** a prospect is soft-deleted, **When** a re-enrichment is attempted, **Then** the action is blocked with error "Prospect supprimé".

### Hard Delete Cron (AC7) - FUTURE
7. **Given** the system runs a cleanup cron, **When** a prospect has `deletedAt` > 30 days old, **Then** the prospect is permanently deleted (hard delete) with all related data.

> [!NOTE]
> AC7 is documented for future implementation. MVP focuses on soft delete only. Hard delete cron will be implemented in Epic 8 (Guardrails & Compliance).

## Tasks / Subtasks

- [x] **Task 1: Add Soft Delete Fields to Prisma Schema (AC: 1)**
  - [x] Add `deletedAt DateTime? @map("deleted_at")` to `Prospect` model
  - [x] Add `deletedBy String? @map("deleted_by")` to `Prospect` model (userId who deleted)
  - [x] Add `archivedAt DateTime? @map("archived_at")` to relevant inbox models (if exist, else prepare)
  - [x] Run `npx prisma migrate dev --name add_prospect_soft_delete`

- [x] **Task 2: Update Prospect Queries for Soft Delete (AC: 1)**
  - [x] Modify `GET /api/prospects` to filter `WHERE deletedAt IS NULL` by default
  - [x] Add query param `?includeDeleted=true` for admin views (optional)
  - [x] Modify `GET /api/prospects/[id]` to return 404 if soft-deleted

- [x] **Task 3: Create Delete API Endpoint (AC: 1, 3, 4)**
  - [x] Create `DELETE /api/prospects/[id]/route.ts`
  - [x] Implement soft delete: set `deletedAt = NOW()`, `deletedBy = userId`
  - [x] Call cascade cleanup service (Task 4)
  - [x] Write audit log entry
  - [x] Return success response with cascade summary

- [x] **Task 4: Cascade Cleanup Service (AC: 3, 4)**
  - [x] Create `src/lib/prospects/cascade-delete-service.ts`
  - [x] Implement `cascadeDeleteProspect(prospectId: string)`:
    - Cancel related `EnrichmentJob` (status → CANCELLED)
    - Cancel scheduled emails (if `ScheduledEmail` exists, status → CANCELLED)
    - Cancel campaign enrollments (if `CampaignEnrollment` exists, status → REMOVED)
    - Archive inbox threads (set `archivedAt`)
  - [x] Use Prisma transaction for atomicity
  - [x] Return summary: `{ enrichmentJobsCancelled, emailsCancelled, enrollmentsCancelled, threadsArchived }`

- [x] **Task 5: Active Campaign Detection (AC: 2)**
  - [x] Create `src/lib/prospects/get-active-campaigns.ts`
  - [x] Implement `getProspectActiveCampaigns(prospectId: string)` → returns campaign list
  - [x] Check for entries in future `CampaignEnrollment` table with status ACTIVE/PENDING
  - [x] For MVP: Return empty array if no Campaign tables exist yet
  - [x] Add endpoint `GET /api/prospects/[id]/campaigns` for UI check

- [x] **Task 6: Bulk Delete API Endpoint (AC: 5)**
  - [x] Create `POST /api/prospects/bulk-delete/route.ts`
  - [x] Accept body: `{ prospectIds: string[] }`
  - [x] Validate all prospects belong to user's workspace
  - [x] Process all deletions in single transaction
  - [x] Return summary: `{ deleted: number, skipped: number, errors: [] }`

- [x] **Task 7: Audit Log Entry (AC: 3)**
  - [x] Create `src/lib/audit/audit-service.ts` (if not exists)
  - [x] Implement `logProspectDeletion(prospectId, userId, workspaceId, cascadeSummary)`
  - [x] Create `AuditLog` model in Prisma if not exists:
    - `id`, `workspaceId`, `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`
  - [x] Write log entry with action: `PROSPECT_DELETED`

- [x] **Task 8: Delete Confirmation Dialog (AC: 1, 2, 5)**
  - [x] Create `src/components/features/prospects/DeleteProspectDialog.tsx`
  - [x] Show prospect name(s) being deleted
  - [x] If active campaigns detected (AC2), show warning with campaign names
  - [x] Two buttons: "Annuler" / "Supprimer définitivement"
  - [x] Use shadcn AlertDialog component
  - [x] French language throughout

- [x] **Task 9: Delete Button & Bulk Selection (AC: 1, 5)**
  - [x] Modify `ProspectTable.tsx` to add selection checkboxes
  - [x] Add "Supprimer" action in row dropdown menu
  - [x] Add bulk action bar when prospects selected: "X sélectionnés | Supprimer la sélection"
  - [x] Wire to DeleteProspectDialog
  - [x] Disable selection for already-deleted prospects (if showing deleted)

- [x] **Task 10: useDeleteProspect Hooks (AC: 1, 5)**
  - [x] Create `src/hooks/use-delete-prospect.ts`
  - [x] Implement `useDeleteProspect(prospectId)` mutation
  - [x] Implement `useBulkDeleteProspects(prospectIds)` mutation
  - [x] Implement `useProspectActiveCampaigns(prospectId)` query
  - [x] Invalidate `['prospects', workspaceId]` on success
  - [x] Show success toast: "Prospect supprimé" / "X prospects supprimés"

- [x] **Task 11: Block Re-Enrich for Deleted (AC: 6)**
  - [x] Modify `POST /api/prospects/[id]/enrich` to check `deletedAt`
  - [x] Return 400 error if prospect is soft-deleted: "Prospect supprimé"

- [x] **Task 12: Unit & Integration Tests**
  - [x] Test cascade-delete-service (all cascade scenarios)
  - [x] Test soft delete API (single + bulk)
  - [x] Test active campaign detection
  - [x] Test audit log creation
  - [x] Test re-enrich block for deleted prospects
  - [x] Test DeleteProspectDialog component

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **TanStack Query Keys:** `['prospects', workspaceId]` for list invalidation
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **French Language:** All user-facing content in French per `config.yaml`
- **Error Handling:** Try/catch + console.error + return error()

### Soft Delete Pattern (Prisma)

```prisma
model Prospect {
  // Existing fields...
  deletedAt   DateTime?  @map("deleted_at")
  deletedBy   String?    @map("deleted_by") // userId
  
  // Existing relations...
}
```

**Query Pattern - Exclude Deleted:**
```typescript
// GET /api/prospects
const prospects = await prisma.prospect.findMany({
  where: { 
    workspaceId,
    deletedAt: null, // Exclude soft-deleted
  },
});
```

### Cascade Delete Service Pattern

```typescript
// src/lib/prospects/cascade-delete-service.ts
import { prisma } from '@/lib/prisma/client';

export interface CascadeSummary {
  enrichmentJobsCancelled: number;
  emailsCancelled: number;
  enrollmentsCancelled: number;
  threadsArchived: number;
}

export async function cascadeDeleteProspect(
  prospectId: string, 
  userId: string
): Promise<CascadeSummary> {
  return await prisma.$transaction(async (tx) => {
    // 1. Cancel enrichment jobs
    const enrichmentResult = await tx.enrichmentJob.updateMany({
      where: { prospectId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      data: { status: 'CANCELLED' },
    });
    
    // 2. Cancel scheduled emails (if table exists - future Epic 5)
    // const emailsResult = await tx.scheduledEmail.updateMany({...});
    
    // 3. Cancel campaign enrollments (if table exists - future Epic 5)
    // const enrollmentsResult = await tx.campaignEnrollment.updateMany({...});
    
    // 4. Archive inbox threads (if table exists - future Epic 6)
    // const threadsResult = await tx.inboxThread.updateMany({...});
    
    return {
      enrichmentJobsCancelled: enrichmentResult.count,
      emailsCancelled: 0, // Epic 5
      enrollmentsCancelled: 0, // Epic 5
      threadsArchived: 0, // Epic 6
    };
  });
}
```

### Delete API Endpoint Pattern

```typescript
// src/app/api/prospects/[id]/route.ts - DELETE method
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { success, error } from '@/lib/utils/api-response';
import { cascadeDeleteProspect } from '@/lib/prospects/cascade-delete-service';
import { logProspectDeletion } from '@/lib/audit/audit-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    
    const workspaceId = await getWorkspaceId(user.id);
    const prospect = await prisma.prospect.findUnique({ where: { id: params.id } });
    
    if (!prospect) return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
    assertWorkspaceAccess(prospect.workspaceId, workspaceId);
    
    if (prospect.deletedAt) {
      return NextResponse.json(error('ALREADY_DELETED', 'Prospect déjà supprimé'), { status: 400 });
    }
    
    // Cascade cleanup
    const cascadeSummary = await cascadeDeleteProspect(params.id, user.id);
    
    // Soft delete prospect
    await prisma.prospect.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });
    
    // Audit log
    await logProspectDeletion(params.id, user.id, workspaceId, cascadeSummary);
    
    return NextResponse.json(success({ deleted: true, cascade: cascadeSummary }));
  } catch (e) {
    console.error('DELETE /api/prospects/[id] error:', e);
    return NextResponse.json(error('SERVER_ERROR', 'Erreur serveur'), { status: 500 });
  }
}
```

### Bulk Delete Pattern

```typescript
// src/app/api/prospects/bulk-delete/route.ts
export async function POST(req: NextRequest) {
  const { prospectIds } = await req.json();
  
  // Validate all belong to workspace
  const prospects = await prisma.prospect.findMany({
    where: { id: { in: prospectIds }, workspaceId },
  });
  
  if (prospects.length !== prospectIds.length) {
    return NextResponse.json(error('INVALID_IDS', 'Un ou plusieurs prospects invalides'), { status: 400 });
  }
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const prospect of prospects) {
      await cascadeDeleteProspect(prospect.id, userId);
      await tx.prospect.update({
        where: { id: prospect.id },
        data: { deletedAt: new Date(), deletedBy: userId },
      });
    }
  });
  
  return NextResponse.json(success({ deleted: prospects.length }));
}
```

### AuditLog Model (if not exists)

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  userId     String   @map("user_id")
  action     String   // PROSPECT_DELETED, CAMPAIGN_LAUNCHED, etc.
  entityType String   @map("entity_type") // PROSPECT, CAMPAIGN, etc.
  entityId   String   @map("entity_id")
  metadata   Json?    // Additional context (cascade summary, etc.)
  createdAt  DateTime @default(now()) @map("created_at")
  
  workspace  Workspace @relation(fields: [workspaceId], references: [id])
  
  @@map("audit_logs")
  @@index([workspaceId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Delete Confirmation Dialog Pattern

```tsx
// src/components/features/prospects/DeleteProspectDialog.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProspectActiveCampaigns, useDeleteProspect } from '@/hooks/use-delete-prospect';

interface DeleteProspectDialogProps {
  prospectId: string;
  prospectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProspectDialog({ prospectId, prospectName, open, onOpenChange }: DeleteProspectDialogProps) {
  const { data: campaigns } = useProspectActiveCampaigns(prospectId);
  const { mutate: deleteProspect, isPending } = useDeleteProspect();
  
  const handleDelete = () => {
    deleteProspect(prospectId, {
      onSuccess: () => onOpenChange(false),
    });
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le prospect ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer <strong>{prospectName}</strong>.
            {campaigns && campaigns.length > 0 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                ⚠️ Ce prospect est dans {campaigns.length} campagne(s) active(s). 
                La suppression le retirera de ces campagnes.
              </div>
            )}
            <p className="mt-2">Cette action est irréversible.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Suppression...' : 'Supprimer définitivement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Project Structure Notes

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add deletedAt, deletedBy to Prospect + AuditLog model |
| `src/lib/prospects/cascade-delete-service.ts` | NEW | Cascade cleanup logic |
| `src/lib/prospects/get-active-campaigns.ts` | NEW | Check active campaigns (MVP: return empty) |
| `src/lib/audit/audit-service.ts` | NEW | Audit logging utility |
| `src/app/api/prospects/route.ts` | MODIFY | Filter deletedAt IS NULL |
| `src/app/api/prospects/[id]/route.ts` | MODIFY | Add DELETE method |
| `src/app/api/prospects/[id]/enrich/route.ts` | MODIFY | Block if deleted |
| `src/app/api/prospects/[id]/campaigns/route.ts` | NEW | Get active campaigns |
| `src/app/api/prospects/bulk-delete/route.ts` | NEW | Bulk delete endpoint |
| `src/hooks/use-delete-prospect.ts` | NEW | Delete mutations & queries |
| `src/components/features/prospects/DeleteProspectDialog.tsx` | NEW | Confirmation dialog |
| `src/components/features/prospects/ProspectList.tsx` | MODIFY | Add selection + delete actions |
| `src/__tests__/unit/prospects/` | NEW | Unit tests |
| `src/__tests__/integration/prospects/` | NEW | Integration tests |

### Previous Story Learnings (from 3.5)

**Patterns Established:**
- ProspectStatusBadge supports all status types ✅
- ProspectDetailSheet structure with sections ✅
- Server-side pagination and filtering ✅
- Toast messages in French ✅
- Workspace access patterns established ✅
- EnrichmentJob model and cascade patterns ✅

**Key Implementation Notes:**
- mapProspect needs update to check deletedAt for UI representation
- ProspectList already has row actions menu (add delete action)
- Existing enrichment flow needs deletedAt check

### NFR Compliance

- **NFR24:** Data deletion cascade complete < 24h → Soft delete with cascade is immediate
- **NFR25:** Audit logs retention 3 ans → AuditLog model with appropriate indexes
- **NFR9:** Audit logs immuables avec timestamp → createdAt only (no update)

### References

- [Epics: Story 3.6](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L842-L874)
- [Architecture: Error Handling](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L687-L712)
- [Architecture: Multi-tenant](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L254-L273)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 3.5 Dropcontact Enrichment](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/3-5-dropcontact-enrichment-integration.md)
- [FR9: Delete prospects with cascade](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L35)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

#### New Files
- `src/lib/prospects/cascade-delete-service.ts` - Cascade cleanup service for prospect deletion
- `src/lib/prospects/get-active-campaigns.ts` - MVP stub for active campaign detection
- `src/lib/audit/audit-service.ts` - Immutable audit logging service
- `src/app/api/prospects/[id]/route.ts` - Single prospect GET/DELETE endpoints
- `src/app/api/prospects/[id]/campaigns/route.ts` - Active campaigns endpoint
- `src/app/api/prospects/bulk-delete/route.ts` - Bulk delete endpoint
- `src/hooks/use-delete-prospect.ts` - TanStack Query hooks for deletion
- `src/components/features/prospects/DeleteProspectDialog.tsx` - Single prospect delete dialog
- `src/components/features/prospects/BulkDeleteDialog.tsx` - Bulk delete confirmation dialog
- `src/components/features/prospects/BulkActionBar.tsx` - Floating action bar for selection
- `src/__tests__/unit/prospects/cascade-delete-service.test.ts` - Unit tests for cascade service
- `src/__tests__/unit/prospects/audit-service.test.ts` - Unit tests for audit service
- `src/__tests__/unit/prospects/get-active-campaigns.test.ts` - Unit tests for active campaigns
- `src/__tests__/unit/prospects/delete-prospect-dialog.test.tsx` - Unit tests for delete dialog
- `src/__tests__/integration/prospect-deletion.test.ts` - Integration tests for API endpoints

#### Modified Files
- `prisma/schema.prisma` - Added deletedAt, deletedBy to Prospect + AuditLog model + CANCELLED status
- `src/app/api/prospects/route.ts` - Filter deletedAt IS NULL, duplicate check excludes deleted
- `src/app/api/prospects/[id]/enrich/route.ts` - Block re-enrichment for deleted prospects
- `src/components/features/prospects/ProspectTable.tsx` - Added selection checkboxes, row actions, bulk actions
- `src/types/prospect.ts` - Added deletedAt/deletedBy to types
- `src/lib/prisma/mappers.ts` - Mapped deletedAt/deletedBy fields

#### Migration Files
- `prisma/migrations/20250121_prospect_soft_delete/` - Soft delete fields migration

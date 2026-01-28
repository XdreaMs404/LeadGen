# Story 3.1: ICP Definition & Storage

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to define my Ideal Customer Profile with simple criteria**,
so that **I can target the right prospects for my outreach campaigns**.

## Acceptance Criteria

### Access ICP Configuration (AC1)
1. **Given** a user is authenticated, **When** they navigate to Settings > ICP page, **Then** they can access the ICP configuration form.

### Define ICP Criteria (AC2)
2. **Given** a user is on the ICP configuration page, **When** they view the form, **Then** they can define criteria for: Industry (text), Company Size (dropdown: 1-10, 11-50, 51-200, 201-500, 500+), Role/Title (text), Location (text), **And** each criterion has a text field or multi-select dropdown as appropriate.

### Persist ICP Configuration (AC3)
3. **Given** a user defines ICP criteria, **When** they save the configuration, **Then** the ICP is stored in the database linked to their workspace, **And** a success toast confirms "ICP sauvegardé".

### Reload Existing ICP (AC4)
4. **Given** a user has previously defined ICP, **When** they return to the ICP page, **Then** their existing criteria are pre-filled.

### Optional ICP Filter for Import (AC5)
5. **Given** a user imports prospects (Epic 3.2), **When** prospects match the ICP criteria, **Then** they can optionally filter the import to show only matching prospects.

## Tasks / Subtasks

- [x] **Task 1: ICP Prisma Model (AC: 2, 3)**
  - [x] Add `IcpConfig` model to `prisma/schema.prisma`
  - [x] Fields: `id`, `workspaceId`, `industries` (String[]), `companySizes` (String[]), `roles` (String[]), `locations` (String[]), `createdAt`, `updatedAt`
  - [x] One-to-one relation with Workspace (1 ICP per workspace MVP)
  - [x] Run `npx prisma migrate dev --name add-icp-config`

- [x] **Task 2: ICP Zod Schema & Types (AC: 2, 3)**
  - [x] Create `src/types/icp.ts`
  - [x] Define `IcpConfigInput` Zod schema for validation
  - [x] Define `IcpConfig` TypeScript type
  - [x] Define `COMPANY_SIZE_OPTIONS` constant: `['1-10', '11-50', '51-200', '201-500', '500+']`

- [x] **Task 3: ICP API Routes (AC: 1, 3, 4)**
  - [x] Create `src/app/api/workspace/icp/route.ts`
  - [x] GET: Return current ICP config (or null if not set)
  - [x] PUT: Upsert ICP config (create or update)
  - [x] Use `assertWorkspaceAccess` for multi-tenant security
  - [x] Return `ApiResponse<IcpConfig>` format

- [x] **Task 4: ICP Prisma Mapper (AC: 4)**
  - [x] Add `mapIcpConfig` to `src/lib/prisma/mappers.ts`
  - [x] Transform Prisma model to frontend-friendly JSON
  - [x] Dates to ISO strings

- [x] **Task 5: useIcp Hook (AC: 1, 4)**
  - [x] Create `src/hooks/use-icp.ts`
  - [x] Query key: `['icp', workspaceId]`
  - [x] `useIcp()`: GET hook for reading ICP
  - [x] `useUpdateIcp()`: Mutation hook for PUT
  - [x] Invalidate query on successful mutation
  - [x] Toast success/error messages in French

- [x] **Task 6: ICP Settings Page (AC: 1, 2)**
  - [x] Create `src/components/features/settings/IcpSettings.tsx` (integrated via SettingsTabs)
  - [x] Client component with React Hook Form
  - [x] Form fields: Industries (textarea, comma-separated), Company Sizes (multi-select), Roles (textarea), Locations (textarea)
  - [x] Use shadcn Form, Input, Button, Select components
  - [x] Skeleton loading state

- [x] **Task 7: Multi-Select Component (AC: 2)**
  - [x] Create `src/components/ui/multi-select.tsx`
  - [x] Based on shadcn Command/Popover with badges
  - [x] Used for Company Size selector

- [x] **Task 8: Add ICP Link to Settings Nav (AC: 1)**
  - [x] Modified `SettingsTabs.tsx` to include "Profil Client" tab
  - [x] Route: Integrated as tab in `/settings`

- [x] **Task 9: ICP Matching Utility (AC: 5)**
  - [x] Create `src/lib/utils/icp-matcher.ts`
  - [x] Implement `matchesIcp(prospect, icpConfig): boolean`
  - [x] Simple text matching for MVP (case-insensitive, partial match)
  - [x] Returns true if ANY criterion matches (OR logic)
  - [x] Documented for Epic 3.2 integration

- [x] **Task 10: Unit & Integration Tests**
  - [x] Test ICP API route authentication
  - [x] Test ICP upsert (create new, update existing)
  - [x] Test GET returns null for new workspace
  - [x] Test ICP matcher logic (16 tests)
  - [x] Test Zod schema validation (9 tests)
  - [x] Integration tests for API (8 tests)

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **French Language:** All user-facing content in French per `config.yaml`

### Prisma Model Definition

```prisma
// prisma/schema.prisma
model IcpConfig {
  id          String   @id @default(cuid())
  workspaceId String   @unique @map("workspace_id")
  industries  String[] @default([])
  companySizes String[] @map("company_sizes") @default([])
  roles       String[] @default([])
  locations   String[] @default([])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("icp_configs")
}
```

**Important:** Add relation to Workspace model:
```prisma
model Workspace {
  // ... existing fields
  icpConfig   IcpConfig?
}
```

### Source Tree Components

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add IcpConfig model |
| `src/types/icp.ts` | NEW | Types and Zod schemas |
| `src/app/api/workspace/icp/route.ts` | NEW | GET/PUT endpoints |
| `src/lib/prisma/mappers.ts` | MODIFY | Add mapIcpConfig |
| `src/hooks/use-icp.ts` | NEW | TanStack Query hooks |
| `src/app/(dashboard)/settings/icp/page.tsx` | NEW | Settings page |
| `src/components/ui/multi-select.tsx` | NEW | Multi-select component |
| `src/lib/utils/icp-matcher.ts` | NEW | Matching utility |
| `src/__tests__/unit/icp/` | NEW | Unit tests |
| `src/__tests__/integration/icp.test.ts` | NEW | API tests |

### API Route Implementation

```typescript
// src/app/api/workspace/icp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { IcpConfigInputSchema } from '@/types/icp';
import { mapIcpConfig } from '@/lib/prisma/mappers';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    }
    
    const workspaceId = await getWorkspaceId(user.id);
    await assertWorkspaceAccess(user.id, workspaceId);
    
    const icpConfig = await prisma.icpConfig.findUnique({
      where: { workspaceId }
    });
    
    return NextResponse.json(success(icpConfig ? mapIcpConfig(icpConfig) : null));
  } catch (e) {
    console.error('GET /api/workspace/icp error:', e);
    return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    }
    
    const workspaceId = await getWorkspaceId(user.id);
    await assertWorkspaceAccess(user.id, workspaceId);
    
    const body = await req.json();
    const parsed = IcpConfigInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()), { status: 400 });
    }
    
    const icpConfig = await prisma.icpConfig.upsert({
      where: { workspaceId },
      update: parsed.data,
      create: { workspaceId, ...parsed.data }
    });
    
    return NextResponse.json(success(mapIcpConfig(icpConfig)));
  } catch (e) {
    console.error('PUT /api/workspace/icp error:', e);
    return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
  }
}
```

### Types Definition

```typescript
// src/types/icp.ts
import { z } from 'zod';

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
export type CompanySize = typeof COMPANY_SIZE_OPTIONS[number];

export const IcpConfigInputSchema = z.object({
  industries: z.array(z.string()).default([]),
  companySizes: z.array(z.enum(COMPANY_SIZE_OPTIONS)).default([]),
  roles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
});

export type IcpConfigInput = z.infer<typeof IcpConfigInputSchema>;

export interface IcpConfig {
  id: string;
  workspaceId: string;
  industries: string[];
  companySizes: CompanySize[];
  roles: string[];
  locations: string[];
  createdAt: string;
  updatedAt: string;
}
```

### UI Implementation Notes

- Form uses React Hook Form + Zod resolver
- Industries/Roles/Locations: Textarea with comma-separated values
- Company Sizes: Multi-select with predefined options
- All fields optional (user can define partial ICP)
- Save button: "Sauvegarder" with loading state
- Toast on save: "ICP sauvegardé" (success) or "Erreur" (failure)

### Previous Story Patterns (from 2.1-2.5)

**Patterns Established:**
- Settings page structure in `src/app/(dashboard)/settings/`
- Hook patterns with TanStack Query
- API response format with `success()` / `error()` helpers
- Workspace access via `getWorkspaceId` + `assertWorkspaceAccess`
- French toast messages
- Skeleton loading for async content

### Test Requirements

**Unit Tests:**
- IcpConfigInputSchema validates correctly
- ICP matcher returns true/false appropriately
- Edge cases: empty ICP, partial matches

**Integration Tests:**
- GET returns null for new workspace
- PUT creates new ICP config
- PUT updates existing ICP config
- Authentication required (401 without user)
- Workspace isolation (cannot access other workspace's ICP)

### UX Requirements (from UX Spec)

- **Settings Page:** Standard settings layout with sidebar
- **Form Pattern:** Validation inline on blur
- **Success Feedback:** Toast bottom-right, 3s auto-dismiss
- **Loading States:** Skeleton shimmer for form
- **French Language:** All labels and messages in French

### Integration Points for Epic 3.2

```typescript
// In CSV import (Epic 3.2)
import { matchesIcp } from '@/lib/utils/icp-matcher';

// Filter prospects matching ICP
const matchingProspects = prospects.filter(p => matchesIcp(p, icpConfig));
```

### References

- [Epics: Story 3.1](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L645-L674)
- [Architecture: Data Model](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L424-L474)
- [Architecture: API Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L451-L461)
- [UX: Settings Page](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L400-L436)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

- Prisma migration `20260115172357_add_icp_config` appliquée avec succès
- Build Next.js réussi avec route `/api/workspace/icp` visible

### Completion Notes List

- ✅ Modèle IcpConfig créé avec relation one-to-one vers Workspace
- ✅ API GET/PUT sécurisée avec `assertWorkspaceAccess`
- ✅ Hook `useIcp` avec TanStack Query et toasts en français
- ✅ Multi-select component avec badges amovibles
- ✅ ICP matcher avec logique OR et matching partiel
- ✅ 33 tests passent (16 matcher, 9 schema, 8 API)
- ✅ Build TypeScript sans erreurs

### File List

- prisma/schema.prisma (MODIFIED)
- prisma/migrations/20260115172357_add_icp_config/ (NEW)
- src/types/icp.ts (NEW)
- src/lib/prisma/mappers.ts (NEW)
- src/lib/utils/icp-matcher.ts (NEW)
- src/app/api/workspace/icp/route.ts (NEW)
- src/hooks/use-icp.ts (NEW)
- src/components/ui/multi-select.tsx (NEW)
- src/components/ui/textarea.tsx (NEW)
- src/components/ui/command.tsx (NEW)
- src/components/ui/popover.tsx (NEW)
- src/components/features/settings/IcpSettings.tsx (NEW)
- src/components/features/settings/SettingsTabs.tsx (MODIFIED)
- src/__tests__/unit/icp/icp-matcher.test.ts (NEW)
- src/__tests__/unit/icp/icp-schema.test.ts (NEW)
- src/__tests__/integration/icp.test.ts (NEW)

## Change Log

- 2026-01-15: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-15: Implémentation complète par Dev Agent (Amelia) - tous les critères d'acceptation satisfaits
- 2026-01-15: Code Review par Agent - Fixes appliqués :
  - Accessibilité améliorée sur `MultiSelect.tsx` (bouton suppression)
  - Logique de matching affinée dans `icp-matcher.ts` (regex word boundary)
  - Status passé à done


# Story 3.3: Manual Prospect Creation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to add individual prospects manually**,
so that **I can include contacts I've met or identified outside of bulk imports**.

## Acceptance Criteria

### Access Add Prospect Form (AC1)
1. **Given** a user is on the Prospects page, **When** they click "Ajouter un prospect", **Then** a form (dialog or inline) appears with all required and optional fields.

### Form Fields (AC2)
2. **Given** a user views the "Add Prospect" form, **When** the form loads, **Then** they see the following fields:
   - Email (required)
   - Prénom (first_name)
   - Nom (last_name)
   - Entreprise (company)
   - Poste (title)
   - Téléphone (phone)
   - LinkedIn URL (linkedin_url)
   - Source (required dropdown, same options as CSV import)
   - Détail source (conditional text field when "Autre" is selected)

### Email Validation (AC3)
3. **Given** a user fills the form, **When** they enter an email, **Then** the email format is validated in real-time (RFC 5322 pattern), **And** a clear error message appears for invalid formats: "Format email invalide".

### Duplicate Detection (AC4)
4. **Given** a user submits the form, **When** the email already exists in the workspace, **Then** an error message is displayed: "Ce prospect existe déjà", **And** the message includes a link to the existing prospect.

### Successful Creation (AC5)
5. **Given** a valid new prospect, **When** submission completes, **Then** the prospect is created with status "NEW", **And** the source and sourceDetail are recorded, **And** a success toast confirms "Prospect ajouté", **And** the prospect list is refreshed to show the new prospect.

### Quick Action (AC6)
6. **Given** a user is anywhere in the application, **When** they use the keyboard shortcut (**Alt+N**), **Then** the "Ajouter un prospect" form opens directly.

## Tasks / Subtasks

- [x] **Task 1: Prospect Create API Route (AC: 4, 5)**
  - [x] Create `src/app/api/prospects/route.ts` (if not exists)
  - [x] POST: Create new prospect with validation
  - [x] Check for duplicate email within workspace (`prisma.prospect.findFirst`)
  - [x] Return `ApiResponse<Prospect>` with created prospect or error
  - [x] Use `assertWorkspaceAccess` for multi-tenant security
  - [x] If duplicate, return error with existing prospect ID for linking

- [x] **Task 2: useCreateProspect Hook (AC: 5)**
  - [x] Create `src/hooks/use-prospects.ts` (if not exists, or extend)
  - [x] Implement `useCreateProspect()` mutation hook
  - [x] POST to `/api/prospects`
  - [x] Invalidate `['prospects', workspaceId]` on success
  - [x] Toast messages in French: "Prospect ajouté" / "Erreur lors de la création"

- [x] **Task 3: ProspectForm Component (AC: 1, 2, 3)**
  - [x] Create `src/components/features/prospects/ProspectForm.tsx`
  - [x] Use React Hook Form + Zod resolver
  - [x] Fields: email, firstName, lastName, company, title, phone, linkedinUrl, source, sourceDetail
  - [x] Email validation with real-time feedback (onBlur)
  - [x] Source dropdown using `SOURCE_OPTIONS` from `src/types/prospect.ts`
  - [x] Conditional sourceDetail field when source === 'OTHER'
  - [x] Submit button "Ajouter" with loading state

- [x] **Task 4: AddProspectDialog Component (AC: 1)**
  - [x] Create `src/components/features/prospects/AddProspectDialog.tsx`
  - [x] shadcn Dialog wrapping ProspectForm
  - [x] Trigger button: "Ajouter un prospect" with Plus icon
  - [x] Close dialog on successful submission
  - [x] Handle duplicate error with link to existing prospect

- [x] **Task 5: Integrate into Prospects Page (AC: 1)**
  - [x] Create or modify `src/app/(dashboard)/prospects/page.tsx`
  - [x] Add "Ajouter un prospect" button in page header
  - [x] Import and use AddProspectDialog
  - [x] Placeholder prospect list (full list is Story 3.4)

- [x] **Task 6: Command Palette & Global Shortcut (AC: 6)**
  - [x] Extend command palette (if exists) or create `src/components/shared/CommandPalette.tsx`
  - [x] Update/Verify global shortcut: **Alt+N** opens Add Prospect Dialog directly
  - [x] Keyboard shortcut handling (Alt+N)

- [x] **Task 7: Unit & Integration Tests**
  - [x] Test POST /api/prospects creates prospect successfully
  - [x] Test POST /api/prospects returns 400 for invalid email
  - [x] Test POST /api/prospects returns error for duplicate email with prospect ID
  - [x] Test ProspectForm validation (email format, required fields)
  - [x] Test source dropdown and conditional sourceDetail
  - [x] Test authentication required (401 without user)
  - [x] Test workspace isolation (via mocked assertWorkspaceAccess)

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **French Language:** All user-facing content in French per `config.yaml`

### Existing Infrastructure from Story 3.2

The following patterns and components are already available from Story 3.2:

```typescript
// Types already defined in src/types/prospect.ts
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const SOURCE_OPTIONS = [
  { value: 'CRM_EXPORT', label: 'Export CRM' },
  { value: 'EVENT_CONFERENCE', label: 'Événement / Conférence' },
  { value: 'NETWORK_REFERRAL', label: 'Réseau / Recommandation' },
  { value: 'CONTENT_DOWNLOAD', label: 'Téléchargement de contenu' },
  { value: 'OUTBOUND_RESEARCH', label: 'Recherche outbound' },
  { value: 'OTHER', label: 'Autre' },
] as const;

// Prisma model Prospect already exists with all required fields
// mapProspect already exists in src/lib/prisma/mappers.ts
```

### API Route Implementation

```typescript
// src/app/api/prospects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { ProspectCreateSchema } from '@/types/prospect';
import { mapProspect } from '@/lib/prisma/mappers';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    }

    const workspaceId = await getWorkspaceId(user.id);
    await assertWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const parsed = ProspectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { email, firstName, lastName, company, title, phone, linkedinUrl, source, sourceDetail } = parsed.data;

    // Check for duplicate
    const existing = await prisma.prospect.findFirst({
      where: { workspaceId, email: email.toLowerCase().trim() }
    });

    if (existing) {
      return NextResponse.json(
        error('DUPLICATE_PROSPECT', 'Ce prospect existe déjà', { prospectId: existing.id }),
        { status: 409 }
      );
    }

    const prospect = await prisma.prospect.create({
      data: {
        workspaceId,
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        company: company?.trim() || null,
        title: title?.trim() || null,
        phone: phone?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        source,
        sourceDetail: sourceDetail?.trim() || null,
        status: 'NEW',
      }
    });

    return NextResponse.json(success(mapProspect(prospect)), { status: 201 });
  } catch (e) {
    console.error('POST /api/prospects error:', e);
    return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
  }
}
```

### Zod Schema Addition

```typescript
// Add to src/types/prospect.ts
export const ProspectCreateSchema = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Format email invalide'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  source: z.enum(['CRM_EXPORT', 'EVENT_CONFERENCE', 'NETWORK_REFERRAL', 'CONTENT_DOWNLOAD', 'OUTBOUND_RESEARCH', 'OTHER']),
  sourceDetail: z.string().optional(),
});

export type ProspectCreateInput = z.infer<typeof ProspectCreateSchema>;
```

### ProspectForm Component Pattern

```typescript
// src/components/features/prospects/ProspectForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProspectCreateSchema, ProspectCreateInput, SOURCE_OPTIONS } from '@/types/prospect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProspectFormProps {
  onSubmit: (data: ProspectCreateInput) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export function ProspectForm({ onSubmit, isLoading, onCancel }: ProspectFormProps) {
  const form = useForm<ProspectCreateInput>({
    resolver: zodResolver(ProspectCreateSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      company: '',
      title: '',
      phone: '',
      linkedinUrl: '',
      source: 'OUTBOUND_RESEARCH',
      sourceDetail: '',
    },
  });

  const watchSource = form.watch('source');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email - required */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input placeholder="email@exemple.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First Name + Last Name row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={...} />
          <FormField control={form.control} name="lastName" render={...} />
        </div>

        {/* Company + Title row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="company" render={...} />
          <FormField control={form.control} name="title" render={...} />
        </div>

        {/* Phone + LinkedIn row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={...} />
          <FormField control={form.control} name="linkedinUrl" render={...} />
        </div>

        {/* Source dropdown */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional sourceDetail */}
        {watchSource === 'OTHER' && (
          <FormField control={form.control} name="sourceDetail" render={...} />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### Previous Story Patterns (from 3.1 and 3.2)

**Patterns Established:**
- Prospect Prisma model with all required fields ✅
- `mapProspect` mapper in `src/lib/prisma/mappers.ts` ✅
- `SOURCE_OPTIONS` and `EMAIL_REGEX` in `src/types/prospect.ts` ✅
- Workspace access via `getWorkspaceId` + `assertWorkspaceAccess` ✅
- French toast messages ✅
- Form validation with React Hook Form + Zod ✅
- Dialog pattern from shadcn ✅

### Test Requirements

**Unit Tests:**
- ProspectCreateSchema validates email format
- ProspectCreateSchema requires email and source
- ProspectForm renders all fields correctly
- Form shows error for invalid email
- Conditional sourceDetail field appears for source === 'OTHER'

**Integration Tests:**
- POST /api/prospects creates prospect with status NEW
- POST /api/prospects returns 400 for invalid email
- POST /api/prospects returns 409 for duplicate with prospectId
- Authentication required (401 without user)
- Workspace isolation (cannot create in other workspace)

### UX Requirements (from UX Spec)

- **Form Pattern:** Validation inline on blur
- **Dialog:** Modal with clear header "Ajouter un prospect"
- **Success Feedback:** Toast bottom-right, 3s auto-dismiss
- **Error Feedback:** Inline form errors + toast for API errors
- **Loading States:** Button disabled with spinner during submission
- **French Language:** All labels and messages in French
- **Keyboard:** ⌘K command palette for quick access

### Source Tree Components

| File | Action | Notes |
|------|--------|-------|
| `src/app/api/prospects/route.ts` | NEW/MODIFY | POST endpoint for creating prospect |
| `src/types/prospect.ts` | MODIFY | Add ProspectCreateSchema |
| `src/hooks/use-prospects.ts` | NEW | useCreateProspect mutation hook |
| `src/components/features/prospects/ProspectForm.tsx` | NEW | Form component |
| `src/components/features/prospects/AddProspectDialog.tsx` | NEW | Dialog wrapper |
| `src/app/(dashboard)/prospects/page.tsx` | NEW/MODIFY | Page with Add button |
| `src/components/shared/CommandPalette.tsx` | NEW/MODIFY | Quick action |
| `src/__tests__/unit/prospects/prospect-form.test.tsx` | NEW | Form tests |
| `src/__tests__/integration/prospects.test.ts` | NEW | API tests |

### References

- [Epics: Story 3.3](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L719-L747)
- [Architecture: API Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L451-L461)
- [Architecture: Form Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L564-L569)
- [UX: Keyboard Shortcuts](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L204-L207)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 3.2 CSV Import](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/3-2-csv-import-with-source-tracking-validation.md)
- [Previous Story: 3.1 ICP Definition](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/3-1-icp-definition-storage.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

### Completion Notes List

- Implémenté POST /api/prospects avec validation Zod, détection duplicata (409), sécurité multi-tenant
- Créé hook `useCreateProspect` avec cache invalidation et gestion erreurs duplicata
- Créé `ProspectForm` avec React Hook Form + Zod, tous les champs, sourceDetail conditionnel
- Créé `AddProspectDialog` avec gestion erreur duplicata + lien vers prospect existant
- Créé page `/prospects` avec bouton Ajouter et placeholder liste
- Créé `CommandPalette` avec raccourci ⌘K et action Ajouter prospect
- Ajouté `ProspectCreateInputSchema` séparé pour formulaire (sans transforms)
- Tests: 6 tests API + 9 tests unitaires ProspectForm = 15/15 passent
- Build: réussi

### File List

- src/app/api/prospects/route.ts (NEW)
- src/hooks/use-prospects.ts (NEW)
- src/types/prospect.ts (MODIFIED - added ProspectCreateInputSchema, ProspectCreateSchema)
- src/components/features/prospects/ProspectForm.tsx (NEW)
- src/components/features/prospects/AddProspectDialog.tsx (NEW)
- src/app/(dashboard)/prospects/page.tsx (NEW)
- src/components/shared/CommandPalette.tsx (NEW)
- src/__tests__/integration/prospects.test.ts (NEW)
- src/__tests__/unit/prospects/prospect-form.test.tsx (NEW)

## Change Log

- 2026-01-15: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-16: Story implemented by Dev Agent - all tasks completed, 15/15 tests passing, build successful

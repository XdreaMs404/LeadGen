# Story 3.2: CSV Import with Source Tracking & Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to import prospects from a CSV file with strict validation and source attribution**,
so that **I have a clean contact list with traceable provenance for compliance**.

## Acceptance Criteria

### CSV Upload & Column Mapping (AC1)
1. **Given** a user is on the Prospects > Import page, **When** they upload a CSV file, **Then** the system parses and displays a column mapping interface, **And** required columns are: email (mandatory), first_name, last_name, company, **And** optional columns are: title, phone, linkedin_url, custom fields.

### Data Validation (AC2)
2. **Given** a CSV contains invalid data, **When** validation runs, **Then** email format is validated (RFC 5322 pattern), **And** duplicates within the file are flagged, **And** duplicates against existing prospects are flagged, **And** rows with errors are counted and highlighted, **And** a downloadable error report (CSV) is available with row numbers and error descriptions.

### Source Attribution (AC3)
3. **Given** a user imports prospects, **When** they reach the source attribution step, **Then** they MUST select a source: CRM Export, Event/Conference, Network/Referral, Content Download, Outbound Research, Other, **And** if "Other" is selected, a text field appears for custom source, **And** if source appears to be "Paid List" or "Unknown", a warning is displayed: "⚠️ Les listes achetées peuvent avoir des problèmes de délivrabilité".

### Import Execution (AC4)
4. **Given** a valid CSV with source selected, **When** the user confirms import, **Then** prospects are created with status "NEW", **And** each prospect has `source` and `sourceDetail` fields populated, **And** a summary shows: X importés, Y ignorés (doublons), Z erreurs, **And** import is logged in audit trail.

### Performance (AC5)
5. **Given** a CSV with 500 rows, **When** import executes, **Then** the operation completes in less than 10 seconds (NFR4).

### ICP Filtering (AC6)
6. **Given** a user has defined an ICP (Story 3.1), **When** they import prospects, **Then** they can optionally filter the preview to show only prospects matching the ICP criteria.

## Tasks / Subtasks

- [x] **Task 1: Prospect Prisma Model (AC: 1, 4)**
  - [x] Add `Prospect` model to `prisma/schema.prisma`
  - [x] Fields: `id`, `workspaceId`, `email`, `firstName`, `lastName`, `company`, `title`, `phone`, `linkedinUrl`, `source`, `sourceDetail`, `status`, `createdAt`, `updatedAt`
  - [x] Enum `ProspectStatus`: `NEW`, `ENRICHING`, `VERIFIED`, `NOT_VERIFIED`, `NEEDS_REVIEW`, `SUPPRESSED`
  - [x] Enum `ProspectSource`: `CRM_EXPORT`, `EVENT_CONFERENCE`, `NETWORK_REFERRAL`, `CONTENT_DOWNLOAD`, `OUTBOUND_RESEARCH`, `OTHER`
  - [x] Unique constraint on `(workspaceId, email)` for dedup
  - [x] Index on `workspaceId` for multi-tenant queries
  - [x] Run `npx prisma migrate dev --name add-prospect-source-fields`

- [x] **Task 2: Prospect Zod Schemas & Types (AC: 1, 2)**
  - [x] Create `src/types/prospect.ts`
  - [x] Define `ProspectSchema` with email regex validation (RFC 5322)
  - [x] Define `CsvRowSchema` for import validation
  - [x] Define `ProspectSource` and `ProspectStatus` enums
  - [x] Export TypeScript types

- [x] **Task 3: CSV Parsing Service (AC: 1, 2, 5)**
  - [x] Create `src/lib/import/csv-parser.ts`
  - [x] Install Papa Parse: `pnpm add papaparse` + `pnpm add -D @types/papaparse`
  - [x] Implement `parseCsvFile(file: File)` → parsed rows
  - [x] Auto-detect column headers
  - [x] Return `{ headers: string[], rows: Record<string, string>[] }`
  - [x] Handle encoding issues (UTF-8 BOM)
  - [x] Max file size check: 5MB

- [x] **Task 4: CSV Validation Service (AC: 2)**
  - [x] Create `src/lib/import/csv-validator.ts`
  - [x] Implement `validateCsvRows(rows, workspaceId)`
  - [x] Email format validation using Zod regex
  - [x] Intra-file duplicate detection (same email multiple times)
  - [x] Inter-database duplicate detection via Prisma query
  - [x] Return `{ validRows: Row[], errors: ValidationError[] }`
  - [x] ValidationError: `{ rowNumber: number, column: string, error: string }`

- [x] **Task 5: Error Report Generator (AC: 2)**
  - [x] Create `src/lib/import/error-report.ts`
  - [x] Implement `generateErrorCsv(errors: ValidationError[])`
  - [x] Output CSV with columns: Row, Column, Error
  - [x] Return downloadable Blob

- [x] **Task 6: Import API Route (AC: 4, 5)**
  - [x] Create `src/app/api/prospects/import/route.ts`
  - [x] POST: Accept FormData with csv file + source + sourceDetail
  - [x] Parse, validate, and batch insert valid prospects
  - [x] Use `prisma.prospect.createMany({ skipDuplicates: true })`
  - [x] Return `ApiResponse<ImportResult>` with counts
  - [x] Chunk large imports for memory efficiency (100 rows/batch)
  - [x] Log to audit trail (TODO for Story 8.6)

- [x] **Task 7: Prospect Prisma Mapper (AC: 4)**
  - [x] Add `mapProspect` to `src/lib/prisma/mappers.ts`
  - [x] Transform Prisma model to frontend JSON
  - [x] Dates to ISO strings

- [x] **Task 8: useImportProspects Hook (AC: 1, 4)**
  - [x] Create `src/hooks/use-import-prospects.ts`
  - [x] Mutation hook for POST /api/prospects/import
  - [x] Handle FormData upload with progress
  - [x] Invalidate `['prospects', workspaceId]` on success
  - [x] Toast messages in French

- [x] **Task 9: Import Page UI (AC: 1, 3)**
  - [x] Create `src/app/(dashboard)/prospects/import/page.tsx`
  - [x] Step 1: File upload dropzone (drag & drop + click)
  - [x] Step 2: Column mapping interface with preview table (first 5 rows)
  - [x] Step 3: Source selection (required dropdown + conditional text)
  - [x] Step 4: Validation results with error count + download button
  - [x] Step 5: Confirmation & import execution with progress
  - [x] Use WizardStepper component pattern

- [x] **Task 10: Column Mapper Component (AC: 1)**
  - [x] Create `src/components/features/prospects/ColumnMapper.tsx`
  - [x] Dropdown for each detected CSV column → Prospect field
  - [x] Required fields marked with asterisk
  - [x] Auto-map common column names (email, prenom, nom, etc.)
  - [x] Preview of mapped data

- [x] **Task 11: Source Selector Component (AC: 3)**
  - [x] Create `src/components/features/prospects/SourceSelector.tsx`
  - [x] Dropdown with ProspectSource options (French labels)
  - [x] Conditional text field for "Other"
  - [x] Warning alert for risky sources

- [x] **Task 12: Validation Results Component (AC: 2)**
  - [x] Create `src/components/features/prospects/ValidationResults.tsx`
  - [x] Summary stats: valid count, error count, duplicate count
  - [x] Error list with row numbers (first 10, expandable)
  - [x] Download error report button

- [x] **Task 13: ICP Filter Toggle (AC: 6)**
  - [x] Add toggle to import preview: "Afficher uniquement les prospects ICP"
  - [x] Use `matchesIcp` from `src/lib/utils/icp-matcher.ts` (Story 3.1)
  - [x] Filter preview rows client-side
  - [x] Show match count: "X/Y correspondent à votre ICP"

- [x] **Task 14: Prospects Link in Sidebar (AC: 1)**
  - [x] Already existed in sidebar
  - [x] Route: `/prospects`
  - [x] Icon: Users from Lucide

- [x] **Task 15: Unit & Integration Tests**
  - [x] Test CSV parsing with various formats
  - [x] Test email validation (valid/invalid patterns)
  - [x] Test intra-file dedup detection
  - [x] Test error report generation
  - [x] Test column name auto-mapping
  - [x] Test risky source detection

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **French Language:** All user-facing content in French per `config.yaml`
- **Performance:** NFR4 requires import of 500 rows in < 10 seconds

### Prisma Model Definition

```prisma
// prisma/schema.prisma

enum ProspectStatus {
  NEW
  ENRICHING
  VERIFIED
  NOT_VERIFIED
  NEEDS_REVIEW
  SUPPRESSED
}

enum ProspectSource {
  CRM_EXPORT
  EVENT_CONFERENCE
  NETWORK_REFERRAL
  CONTENT_DOWNLOAD
  OUTBOUND_RESEARCH
  OTHER
}

model Prospect {
  id           String          @id @default(cuid())
  workspaceId  String          @map("workspace_id")
  email        String
  firstName    String?         @map("first_name")
  lastName     String?         @map("last_name")
  company      String?
  title        String?
  phone        String?
  linkedinUrl  String?         @map("linkedin_url")
  source       ProspectSource  @default(OTHER)
  sourceDetail String?         @map("source_detail")
  status       ProspectStatus  @default(NEW)
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  workspace    Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, email])
  @@index([workspaceId])
  @@map("prospects")
}
```

**Important:** Add relation to Workspace model:
```prisma
model Workspace {
  // ... existing fields
  prospects   Prospect[]
}
```

### Source Tree Components

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add Prospect model + enums |
| `src/types/prospect.ts` | NEW | Types and Zod schemas |
| `src/lib/import/csv-parser.ts` | NEW | Papa Parse wrapper |
| `src/lib/import/csv-validator.ts` | NEW | Validation logic |
| `src/lib/import/error-report.ts` | NEW | Error CSV generator |
| `src/app/api/prospects/import/route.ts` | NEW | Import endpoint |
| `src/lib/prisma/mappers.ts` | MODIFY | Add mapProspect |
| `src/hooks/use-import-prospects.ts` | NEW | TanStack mutation |
| `src/app/(dashboard)/prospects/import/page.tsx` | NEW | Import wizard page |
| `src/components/features/prospects/ColumnMapper.tsx` | NEW | Column mapping UI |
| `src/components/features/prospects/SourceSelector.tsx` | NEW | Source dropdown |
| `src/components/features/prospects/ValidationResults.tsx` | NEW | Error display |
| `src/__tests__/unit/import/` | NEW | Unit tests |
| `src/__tests__/integration/import-csv.test.ts` | NEW | API tests |

### Email Validation Pattern (RFC 5322)

```typescript
// src/types/prospect.ts
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const ProspectEmailSchema = z.string().regex(EMAIL_REGEX, 'Format email invalide');
```

### CSV Parsing Implementation

```typescript
// src/lib/import/csv-parser.ts
import Papa from 'papaparse';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function parseCsvFile(file: File): Promise<CsvParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier dépasse la taille maximale de 5MB');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, string>[],
          errors: results.errors,
        });
      },
      error: (error) => reject(error),
    });
  });
}
```

### Source Options (French Labels)

```typescript
export const SOURCE_OPTIONS = [
  { value: 'CRM_EXPORT', label: 'Export CRM' },
  { value: 'EVENT_CONFERENCE', label: 'Événement / Conférence' },
  { value: 'NETWORK_REFERRAL', label: 'Réseau / Recommandation' },
  { value: 'CONTENT_DOWNLOAD', label: 'Téléchargement de contenu' },
  { value: 'OUTBOUND_RESEARCH', label: 'Recherche outbound' },
  { value: 'OTHER', label: 'Autre' },
] as const;

// Warning trigger keywords (case-insensitive)
const RISKY_SOURCES = ['paid', 'achat', 'bought', 'purchased', 'unknown', 'inconnu'];
```

### API Route Implementation

```typescript
// src/app/api/prospects/import/route.ts
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    }

    const workspaceId = await getWorkspaceId(user.id);
    await assertWorkspaceAccess(user.id, workspaceId);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string;
    const sourceDetail = formData.get('sourceDetail') as string | null;
    const columnMapping = JSON.parse(formData.get('columnMapping') as string);

    // Parse and validate CSV
    const parsed = await parseCsvFile(file);
    const validation = await validateCsvRows(parsed.rows, workspaceId, columnMapping);

    // Batch insert valid rows
    const BATCH_SIZE = 100;
    let imported = 0;
    
    for (let i = 0; i < validation.validRows.length; i += BATCH_SIZE) {
      const batch = validation.validRows.slice(i, i + BATCH_SIZE);
      const result = await prisma.prospect.createMany({
        data: batch.map(row => ({
          workspaceId,
          email: row.email.toLowerCase().trim(),
          firstName: row.firstName?.trim() || null,
          lastName: row.lastName?.trim() || null,
          company: row.company?.trim() || null,
          title: row.title?.trim() || null,
          phone: row.phone?.trim() || null,
          linkedinUrl: row.linkedinUrl?.trim() || null,
          source: source as ProspectSource,
          sourceDetail: sourceDetail?.trim() || null,
          status: 'NEW',
        })),
        skipDuplicates: true,
      });
      imported += result.count;
    }

    // TODO: Log to audit trail

    return NextResponse.json(success({
      imported,
      duplicates: validation.duplicateCount,
      errors: validation.errors.length,
    }));
  } catch (e) {
    console.error('POST /api/prospects/import error:', e);
    return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
  }
}
```

### Previous Story Patterns (from 3.1)

**Patterns Established:**
- Settings page structure in `src/app/(dashboard)/settings/`
- Hook patterns with TanStack Query
- API response format with `success()` / `error()` helpers
- Workspace access via `getWorkspaceId` + `assertWorkspaceAccess`
- French toast messages
- Skeleton loading for async content
- Multi-select component available

### Test Requirements

**Unit Tests:**
- CSV parsing with various formats (headers, encoding, empty rows)
- Email validation regex patterns
- Intra-file duplicate detection
- Source validation and warning logic

**Integration Tests:**
- POST /api/prospects/import with valid CSV
- Duplicate detection (skip existing emails)
- Performance: 500 rows < 10 seconds
- Authentication required (401 without user)
- Workspace isolation

### UX Requirements (from UX Spec)

- **Wizard Pattern:** Multi-step import with clear progress
- **Drag & Drop:** File upload zone with visual feedback
- **Preview Table:** Show first 5 rows with column mapping
- **Validation Feedback:** Inline error highlighting
- **Progress Indicator:** Show batch progress for large imports
- **French Language:** All labels and messages in French

### Integration Points

**From Story 3.1:**
```typescript
// Use ICP matcher for optional filtering
import { matchesIcp } from '@/lib/utils/icp-matcher';

// In preview step
const filteredRows = showIcpOnly 
  ? rows.filter(row => matchesIcp(row, icpConfig))
  : rows;
```

**For Story 3.4:**
- Prospects created here will be displayed in the prospect list
- Status badges will use the `ProspectStatus` enum defined here

### References

- [Epics: Story 3.2](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L677-L716)
- [Architecture: Data Model](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L424-L474)
- [Architecture: API Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L451-L461)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 3.1 ICP Definition](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/3-1-icp-definition-storage.md)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-01-15: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared

- src/app/api/prospects/import/route.ts
- src/app/(dashboard)/prospects/import/page.tsx
- src/components/features/prospects/ColumnMapper.tsx
- src/components/features/prospects/SourceSelector.tsx
- src/components/features/prospects/ValidationResults.tsx
- src/hooks/use-import-prospects.ts
- src/lib/import/csv-parser.ts
- src/lib/import/csv-validator.ts
- src/lib/import/error-report.ts
- src/types/prospect.ts
- src/__tests__/unit/import/csv-parser.test.ts
- src/__tests__/unit/import/email-validation.test.ts
- src/__tests__/unit/import/error-report.test.ts
- src/__tests__/integration/import-csv.test.ts

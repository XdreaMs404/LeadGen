# Story 3.4: Prospect List & Status Display with Filters

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to view my prospects with their enrichment status and filter by criteria**,
so that **I can manage my contact list efficiently and identify who is ready to contact**.

## Acceptance Criteria

### Data Table Display (AC1)
1. **Given** a user is on the Prospects page, **When** the page loads, **Then** a data table displays all prospects with columns: Nom (Name), Email, Entreprise (Company), Statut, Source, Créé le (Created), **And** pagination is available (25/50/100 per page), **And** skeleton loading is shown during fetch.

### Status Badge Display (AC2)
2. **Given** a user views the prospect list, **When** they look at the Status column, **Then** status badges are color-coded:
   - NEW (gray)
   - ENRICHING (blue, with spinner animation)
   - VERIFIED (green ✓)
   - NOT_VERIFIED (red ✗)
   - NEEDS_REVIEW (amber ⚠️)
   - SUPPRESSED (strikethrough style)

### Filter Panel (AC3)
3. **Given** a user wants to filter prospects, **When** they access the filter panel, **Then** they can filter by: Status (multi-select), Source (multi-select), Date range (from/to), **And** quick filters are available: "Vérifiés uniquement", "Besoin de révision", "Non enrichis".

### Search Functionality (AC4)
4. **Given** a user wants to search, **When** they type in the search bar, **Then** results filter by name, email, or company (case-insensitive partial match), **And** search is debounced (300ms).

### Prospect Detail View (AC5)
5. **Given** a user clicks on a prospect row, **When** the detail panel opens, **Then** they see all prospect data including provenance (source, import date), **And** enrichment history if applicable.

### Server-Side Pagination & Filtering (AC6)
6. **Given** a user interacts with pagination or filters, **When** they change page, page size, or apply filters, **Then** a new API request is made with the updated parameters, **And** the URL query params are updated for shareable/bookmarkable state.

### Empty State (AC7)
7. **Given** a user has no prospects, **When** they view the Prospects page, **Then** an empty state is displayed with an illustration and CTA "Ajouter un prospect" or "Importer un CSV".

## Tasks / Subtasks

- [x] **Task 1: Prospect List API Route (AC: 1, 3, 4, 6)**
  - [x] Modify `src/app/api/prospects/route.ts` GET endpoint
  - [x] Accept query params: `page`, `pageSize`, `search`, `status[]`, `source[]`, `fromDate`, `toDate`
  - [x] Implement server-side pagination with Prisma `skip` and `take`
  - [x] Implement server-side filtering with Prisma `where` conditions
  - [x] Implement search across `firstName`, `lastName`, `email`, `company` (case-insensitive)
  - [x] Return `ApiResponse<{ prospects: Prospect[]; total: number; page: number; pageSize: number }>`
  - [x] Use `assertWorkspaceAccess` for multi-tenant security

- [x] **Task 2: useProspects Query Hook (AC: 1, 6)**
  - [x] Extend `src/hooks/use-prospects.ts` with `useProspects(params)` query hook
  - [x] Use TanStack Query with key `['prospects', workspaceId, ...params]`
  - [x] Include `keepPreviousData: true` for smooth pagination transitions
  - [x] Handle loading, error, and success states

- [x] **Task 3: ProspectStatusBadge Component (AC: 2)**
  - [x] Create `src/components/features/prospects/ProspectStatusBadge.tsx`
  - [x] Implement color-coded badges for each status (NEW, ENRICHING, VERIFIED, etc.)
  - [x] Use shadcn Badge component with custom variants
  - [x] Add spinner for ENRICHING status
  - [x] Add icons (checkmark, X, warning) for appropriate statuses
  - [x] Add strikethrough style for SUPPRESSED

- [x] **Task 4: ProspectTable Component (AC: 1, 2, 5)**
  - [x] Create `src/components/features/prospects/ProspectTable.tsx`
  - [x] Use TanStack Table with `manualPagination: true` and `manualFiltering: true`
  - [x] Define columns: Name (combined first/last), Email, Company, Status (badge), Source, Created
  - [x] Implement row click handler to open detail sheet/drawer
  - [x] Add skeleton loading rows during fetch

- [x] **Task 5: ProspectFilters Component (AC: 3, 4)**
  - [x] Create `src/components/features/prospects/ProspectFilters.tsx`
  - [x] Search input with debounce (300ms) using custom useEffect hook
  - [x] Status multi-select dropdown (using Checkbox + Popover)
  - [x] Source multi-select dropdown
  - [x] Date range picker (from/to) with shadcn Calendar
  - [x] Quick filter buttons: "Vérifiés uniquement", "Besoin de révision", "Non enrichis"
  - [x] Reset filters button

- [x] **Task 6: ProspectDetailSheet Component (AC: 5)**
  - [x] Create `src/components/features/prospects/ProspectDetailSheet.tsx`
  - [x] Use shadcn Sheet (slide-in drawer)
  - [x] Display all prospect fields
  - [x] Show provenance info: source, sourceDetail, createdAt, source icon
  - [x] Show enrichment history section (placeholder for future enrichment data)
  - [x] Add action buttons: Edit (future), Delete (future), Trigger Enrichment (future)

- [x] **Task 7: Pagination Component (AC: 1, 6)**
  - [x] Create `src/components/features/prospects/ProspectPagination.tsx`
  - [x] Previous/Next buttons with disabled states
  - [x] Page size selector (25/50/100)
  - [x] Display "Affichage X-Y sur Z prospects"
  - [x] Wire to TanStack Table pagination state

- [x] **Task 8: Update Prospects Page (AC: 1, 3, 4, 6, 7)**
  - [x] Modify `src/app/(dashboard)/prospects/page.tsx`
  - [x] Integrate ProspectTable, ProspectFilters, ProspectPagination
  - [x] Manage filter/pagination state in URL query params (using `useSearchParams`)
  - [x] Implement empty state with illustration and CTAs
  - [x] Keep existing "Ajouter un prospect" button from Story 3.3

- [x] **Task 9: URL Query Sync Hook (AC: 6)**
  - [x] Create `src/hooks/use-prospect-filters.ts`
  - [x] Sync filter state with URL query params
  - [x] Parse params on load, update params on change
  - [x] Provide typed interface for filter values

- [x] **Task 10: Unit & Integration Tests**
  - [x] Test GET /api/prospects returns paginated results
  - [x] Test GET /api/prospects with search filters correctly
  - [x] Test GET /api/prospects with status/source filters
  - [x] Test pagination (page, pageSize params)
  - [x] Test ProspectStatusBadge renders correct colors/icons
  - [x] Test ProspectFilters debounce behavior
  - [x] Test empty state renders when no prospects
  - [x] Test authentication required (401 without user)
  - [x] Test workspace isolation

## Dev Notes

### Architecture Patterns & Constraints

- **Multi-Tenant Security:** workspaceId from session, use `assertWorkspaceAccess`
- **API Response Format:** `ApiResponse<T>` from `lib/utils/api-response.ts`
- **TanStack Query Keys:** `['prospects', workspaceId, { page, pageSize, search, filters }]`
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Database:** Prisma with snake_case DB + camelCase TypeScript + `@map`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **French Language:** All user-facing content in French per `config.yaml`

### Existing Infrastructure from Previous Stories

```typescript
// Types already defined in src/types/prospect.ts
export type ProspectStatus = 'NEW' | 'ENRICHING' | 'VERIFIED' | 'NOT_VERIFIED' | 'NEEDS_REVIEW' | 'SUPPRESSED';

export const SOURCE_OPTIONS = [
  { value: 'CRM_EXPORT', label: 'Export CRM' },
  { value: 'EVENT_CONFERENCE', label: 'Événement / Conférence' },
  { value: 'NETWORK_REFERRAL', label: 'Réseau / Recommandation' },
  { value: 'CONTENT_DOWNLOAD', label: 'Téléchargement de contenu' },
  { value: 'OUTBOUND_RESEARCH', label: 'Recherche outbound' },
  { value: 'OTHER', label: 'Autre' },
] as const;

// mapProspect already exists in src/lib/prisma/mappers.ts
// POST /api/prospects already created in Story 3.3
// useCreateProspect hook already exists
// AddProspectDialog already exists
```

### Server-Side Pagination Pattern (TanStack Table)

```typescript
// src/app/api/prospects/route.ts - GET handler
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  await assertWorkspaceAccess(user.id, workspaceId);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.getAll('status');
  const sourceFilter = searchParams.getAll('source');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  // Build where clause
  const where: Prisma.ProspectWhereInput = {
    workspaceId,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(statusFilter.length && { status: { in: statusFilter as ProspectStatus[] } }),
    ...(sourceFilter.length && { source: { in: sourceFilter } }),
    ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
    ...(toDate && { createdAt: { lte: new Date(toDate) } }),
  };

  const [prospects, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.prospect.count({ where }),
  ]);

  return NextResponse.json(success({
    prospects: prospects.map(mapProspect),
    total,
    page,
    pageSize,
  }));
}
```

### TanStack Table Configuration

```typescript
// src/components/features/prospects/ProspectTable.tsx
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data: prospects,
  columns,
  pageCount: Math.ceil(total / pageSize),
  state: {
    pagination: { pageIndex: page - 1, pageSize },
    columnFilters: [],
  },
  onPaginationChange: (updater) => {
    // Update URL params
    const newState = typeof updater === 'function' 
      ? updater({ pageIndex: page - 1, pageSize }) 
      : updater;
    setSearchParams({ page: String(newState.pageIndex + 1), pageSize: String(newState.pageSize) });
  },
  manualPagination: true,
  manualFiltering: true,
  getCoreRowModel: getCoreRowModel(),
});
```

### useProspects Hook Pattern

```typescript
// src/hooks/use-prospects.ts
interface ProspectsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string[];
  source?: string[];
  fromDate?: string;
  toDate?: string;
}

export function useProspects(params: ProspectsParams) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ['prospects', workspaceId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page));
      searchParams.set('pageSize', String(params.pageSize));
      if (params.search) searchParams.set('search', params.search);
      params.status?.forEach(s => searchParams.append('status', s));
      params.source?.forEach(s => searchParams.append('source', s));
      if (params.fromDate) searchParams.set('fromDate', params.fromDate);
      if (params.toDate) searchParams.set('toDate', params.toDate);
      
      const res = await fetch(`/api/prospects?${searchParams}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
}
```

### ProspectStatusBadge Variants

```typescript
// src/components/features/prospects/ProspectStatusBadge.tsx
const STATUS_CONFIG = {
  NEW: { label: 'Nouveau', variant: 'secondary', icon: null },
  ENRICHING: { label: 'Enrichissement...', variant: 'outline', icon: <Loader2 className="animate-spin" /> },
  VERIFIED: { label: 'Vérifié', variant: 'success', icon: <Check /> },
  NOT_VERIFIED: { label: 'Non vérifié', variant: 'destructive', icon: <X /> },
  NEEDS_REVIEW: { label: 'À vérifier', variant: 'warning', icon: <AlertTriangle /> },
  SUPPRESSED: { label: 'Supprimé', variant: 'secondary', className: 'line-through opacity-50' },
} as const;
```

### URL Query Params Sync

```typescript
// src/hooks/use-prospect-filters.ts
export function useProspectFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '25'),
    search: searchParams.get('search') || '',
    status: searchParams.getAll('status'),
    source: searchParams.getAll('source'),
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
  }), [searchParams]);

  const setFilters = useCallback((updates: Partial<typeof filters>) => {
    const newParams = new URLSearchParams(searchParams);
    // Update params...
    router.push(`${pathname}?${newParams.toString()}`);
  }, [searchParams, router, pathname]);

  return { filters, setFilters };
}
```

### UX Requirements (from UX Spec)

- **Data Table:** Skeleton shimmer loading pattern
- **Badges:** Color-coded with icons (Success: green, Warning: amber, Error: red)
- **Pagination:** Page size options 25/50/100
- **Search:** Debounced 300ms, case-insensitive
- **Filters:** Multi-select dropdowns, quick filters
- **Empty State:** Illustration + CTAs (Ajouter prospect, Importer CSV)
- **Detail View:** Sheet/Drawer slide-in panel
- **French Language:** All labels and messages in French

### Source Tree Components

| File | Action | Notes |
|------|--------|-------|
| `src/app/api/prospects/route.ts` | MODIFY | Add GET endpoint with pagination/filtering |
| `src/hooks/use-prospects.ts` | MODIFY | Add useProspects query hook |
| `src/hooks/use-prospect-filters.ts` | NEW | URL query params sync hook |
| `src/components/features/prospects/ProspectStatusBadge.tsx` | NEW | Status badge component |
| `src/components/features/prospects/ProspectTable.tsx` | NEW | TanStack Table component |
| `src/components/features/prospects/ProspectFilters.tsx` | NEW | Filter panel component |
| `src/components/features/prospects/ProspectDetailSheet.tsx` | NEW | Detail sheet component |
| `src/components/features/prospects/ProspectPagination.tsx` | NEW | Pagination component |
| `src/app/(dashboard)/prospects/page.tsx` | MODIFY | Integrate all components |
| `src/__tests__/unit/prospects/prospect-status-badge.test.tsx` | NEW | Badge tests |
| `src/__tests__/unit/prospects/prospect-filters.test.tsx` | NEW | Filter tests |
| `src/__tests__/integration/prospects-list.test.ts` | NEW | API tests |

### Previous Story Learnings (from 3.3)

**Patterns Established:**
- Prospect Prisma model with all required fields ✅
- `mapProspect` mapper in `src/lib/prisma/mappers.ts` ✅
- `SOURCE_OPTIONS` in `src/types/prospect.ts` ✅
- Workspace access via `getWorkspaceId` + `assertWorkspaceAccess` ✅
- POST /api/prospects route exists ✅
- French toast messages ✅
- CommandPalette with shortcuts ✅

**Key Implementation Notes:**
- The Prospects page already has a header with "Ajouter un prospect" button
- AddProspectDialog already integrated
- useCreateProspect hook invalidates `['prospects', workspaceId]` on success

### Technical Research Notes

**TanStack Table Server-Side Patterns (2025):**
- Use `manualPagination: true` and `manualFiltering: true` for server-side control
- Provide `pageCount` from API response for accurate pagination controls
- Use `placeholderData: keepPreviousData` (formerly `keepPreviousData`) for smooth transitions
- Sync state with URL search params for shareable/bookmarkable state

### References

- [Epics: Story 3.4](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L750-L793)
- [Architecture: TanStack Query Keys](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L640-L658)
- [Architecture: API Response Pattern](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L569-L595)
- [UX: States Patterns](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L578-L590)
- [UX: Data Table Pattern](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L506-L510)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story: 3.3 Manual Prospect Creation](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/3-3-manual-prospect-creation.md)

## Dev Agent Record

### Agent Model Used

Anthropic Claude 3.5 Sonnet (2025)

### Debug Log References

### Completion Notes List

- Implemented GET /api/prospects with server-side pagination, search, and multi-filter support
- Created useProspects query hook with TanStack Query and keepPreviousData
- Created ProspectStatusBadge with color-coded badges and icons for all 11 statuses
- Created ProspectTable with TanStack Table, skeleton loading, and row click
- Created ProspectFilters with debounced search, multi-select status/source, date range, and quick filters
- Created ProspectDetailSheet with provenance info and enrichment history placeholder
- Created ProspectPagination with French labels and page size selector
- Rewrote Prospects page to integrate all components with URL query sync
- Created use-prospect-filters hook for URL query param synchronization
- Added comprehensive unit and integration tests (all 295 tests pass)
- Installed shadcn calendar component for date range picker

### File List

- src/app/api/prospects/route.ts (MODIFIED)
- src/hooks/use-prospects.ts (MODIFIED)
- src/hooks/use-prospect-filters.ts (NEW)
- src/components/features/prospects/ProspectStatusBadge.tsx (NEW)
- src/components/features/prospects/ProspectTable.tsx (NEW)
- src/components/features/prospects/ProspectFilters.tsx (NEW)
- src/components/features/prospects/ProspectDetailSheet.tsx (NEW)
- src/components/features/prospects/ProspectPagination.tsx (NEW)
- src/app/(dashboard)/prospects/page.tsx (MODIFIED)
- src/components/ui/calendar.tsx (NEW - shadcn)
- src/__tests__/unit/prospects/prospect-status-badge.test.tsx (NEW)
- src/__tests__/unit/prospects/prospect-filters.test.tsx (NEW)
- src/__tests__/integration/prospects-list.test.ts (NEW)
- src/components/features/prospects/AddProspectDialog.tsx (NEW)
- src/components/features/prospects/ProspectForm.tsx (NEW)
- src/components/shared/CommandPalette.tsx (NEW)
- src/types/prospect.ts (MODIFIED)
- package.json (MODIFIED)
- pnpm-lock.yaml (MODIFIED)

## Change Log

- 2026-01-16: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-16: Story implemented by Dev Agent - all tasks complete, 295 tests pass
- 2026-01-16: Code Review by Dev Agent - Fixed test failure, added untracked files, status updated to done

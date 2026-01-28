1# Story 2.2: DNS Configuration Wizard UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user on the onboarding wizard**,
I want **step-by-step instructions to configure my domain's DNS records**,
so that **I can ensure my emails are authenticated and delivered correctly**.

## Acceptance Criteria

### DNS Wizard Structure (AC1)
1. **Given** a user is on the DNS configuration step of onboarding, **When** the wizard loads, **Then** they see a clear 3-step process: SPF → DKIM → DMARC, **And** each step shows the current status (PASS / FAIL / UNKNOWN / NOT_CHECKED), **And** the active step is highlighted.

### SPF Configuration Step (AC2)
2. **Given** a user is on the SPF configuration step, **When** they view the instructions, **Then** they see their domain name pre-filled (extracted from their email), **And** they see the exact TXT record value to add (`v=spf1 include:_spf.google.com ~all`), **And** they see a "Copy to clipboard" button for the record, **And** they see links to common domain provider DNS documentation (GoDaddy, Cloudflare, OVH, Namecheap).

### DKIM Configuration Step (AC3)
3. **Given** a user is on the DKIM configuration step, **When** they view the instructions, **Then** they see instructions specific to Google Workspace DKIM setup, **And** they see the selector field (default: `google`) with explanation, **And** they see step-by-step Admin Console instructions with external links.

### DMARC Configuration Step (AC4)
4. **Given** a user is on the DMARC configuration step, **When** they view the instructions, **Then** they see a recommended DMARC policy for cold outreach (`v=DMARC1; p=none; rua=mailto:dmarc@{domain}`), **And** they see explanation of what DMARC does and why it matters for deliverability.

### Navigation & Progress (AC5)
5. **Given** a user is on any DNS configuration step, **When** they complete a step, **Then** they can navigate to the next step, **And** the progress indicator updates to show completion, **And** they can navigate back to previous steps if needed.

### Step Status Display (AC6)
6. **Given** a user views DNS configuration steps, **When** viewing the step status, **Then** each step displays a clear badge: "Not Checked" (gris), "Pass" (vert ✓), "Fail" (rouge ✗), "Unknown" (ambre ⚠️), **And** the step badges update after validation runs.

## Tasks / Subtasks

- [x] **Task 1: Prisma Schema Update for DNS Status (AC: 1, 6)**
  - [x] Add `spfStatus` enum field to Workspace model (NOT_STARTED, PASS, FAIL, UNKNOWN, MANUAL_OVERRIDE)
  - [x] Add `dkimStatus` enum field to Workspace model
  - [x] Add `dmarcStatus` enum field to Workspace model
  - [x] Add `dkimSelector` optional field (default: "google")
  - [x] Add `domain` computed field (extracted from user email or GmailToken email)
  - [x] Run `pnpm prisma migrate dev --name add_dns_status_fields`
  - [x] Verify migration applies cleanly

- [x] **Task 2: DNS Status API Route (AC: 6)**
  - [x] Create `src/app/api/workspace/dns-status/route.ts` - GET endpoint
  - [x] Return current DNS status for authenticated workspace: `{ spfStatus, dkimStatus, dmarcStatus, domain }`
  - [x] Use `ApiResponse<DnsStatus>` format from `lib/utils/api-response.ts`
  - [x] Add Zod schema for response validation

- [x] **Task 3: DNS Configuration Steps Components (AC: 2, 3, 4)**
  - [x] Create `src/components/features/onboarding/DnsConfigStep.tsx` - Container for DNS wizard
  - [x] Create `src/components/features/onboarding/SpfStep.tsx` - SPF instructions with copy button
  - [x] Create `src/components/features/onboarding/DkimStep.tsx` - DKIM instructions with selector input
  - [x] Create `src/components/features/onboarding/DmarcStep.tsx` - DMARC instructions
  - [x] Implement copy-to-clipboard functionality using `navigator.clipboard.writeText()`
  - [x] Use toast for "Copied!" confirmation
  - [x] Extract domain from GmailToken email or user email

- [x] **Task 4: DNS Provider Documentation Links (AC: 2)**
  - [x] Create `src/lib/constants/dns-providers.ts` with provider data
  - [x] Include: GoDaddy, Cloudflare, OVH, Namecheap, AWS Route53, Google Domains
  - [x] Each provider has: name, logo (optional), docsUrl (TXT record help page)
  - [x] Display as clickable cards/links in SPF step

- [x] **Task 5: WizardStepper Component (AC: 1, 5, 6)**
  - [x] Refactor `OnboardingWizard.tsx` to support DNS step properly
  - [x] Create `src/components/shared/WizardStepper.tsx` - reusable stepper with badges
  - [x] Props: `steps: { id, label, status: 'not-checked' | 'pass' | 'fail' | 'unknown' | 'active' }[]`
  - [x] Implement step navigation (next/previous) with state management
  - [x] Use teal color for active step, green checkmark for pass, red X for fail, amber warning for unknown

- [x] **Task 6: Update OnboardingWizard Integration (AC: 1, 5)**
  - [x] Modify `OnboardingWizard.tsx` to render `DnsConfigStep` when currentStep === 'dns'
  - [x] After Gmail connected, automatically navigate to 'dns' step
  - [x] Pass DNS status from API to DnsConfigStep component
  - [x] Use TanStack Query hook for fetching DNS status

- [x] **Task 7: DNS Status Hook (AC: 6)**
  - [x] Create `src/hooks/use-dns-status.ts` with TanStack Query
  - [x] Query key: `['dns-status', workspaceId]`
  - [x] Auto-refetch on window focus
  - [x] Return `{ spfStatus, dkimStatus, dmarcStatus, domain, isLoading, refetch }`

- [x] **Task 8: French Content & Localization (AC: 2, 3, 4)**
  - [x] All instructions in French (project communication_language)
  - [x] Create constants for all DNS instruction text
  - [x] Use clear, non-technical language for Sophie persona (UX spec)
  - [x] Include educational tooltips explaining "Pourquoi c'est important ?"

- [x] **Task 9: Unit & Integration Tests**
  - [x] Test DNS status API route - returns correct format
  - [x] Test copy-to-clipboard functionality (mock navigator.clipboard)
  - [x] Test WizardStepper renders correct badges based on status
  - [x] Test step navigation logic


## Dev Notes

### Architecture Patterns & Constraints

- **Separation of Concerns:** This story is UI-ONLY. DNS validation (actual DNS lookups) is Story 2.3. This story creates the wizard interface with static instructions.
- **Multi-Tenant:** workspaceId resolved from session, never from query params.
- **API Response:** Use `ApiResponse<T>` pattern from `lib/utils/api-response.ts`.
- **State Management:** Use TanStack Query for server state (DNS status).
- **Component Pattern:** Feature components in `components/features/onboarding/`, shared components in `components/shared/`.
- **French Language:** All user-facing content in French per `config.yaml`.
- **No Blocking Gate Yet:** This story creates the UI. Story 2.5 implements the actual blocking.

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | MODIFY | Add DnsStatus enum + Workspace fields |
| `src/app/api/workspace/dns-status/route.ts` | NEW | GET endpoint for DNS status |
| `src/components/features/onboarding/DnsConfigStep.tsx` | NEW | DNS wizard container |
| `src/components/features/onboarding/SpfStep.tsx` | NEW | SPF instructions |
| `src/components/features/onboarding/DkimStep.tsx` | NEW | DKIM instructions |
| `src/components/features/onboarding/DmarcStep.tsx` | NEW | DMARC instructions |
| `src/components/features/onboarding/OnboardingWizard.tsx` | MODIFY | Add DNS step rendering |
| `src/components/shared/WizardStepper.tsx` | NEW | Reusable stepper component |
| `src/hooks/use-dns-status.ts` | NEW | TanStack Query hook |
| `src/lib/constants/dns-providers.ts` | NEW | Provider links data |
| `src/types/dns.ts` | NEW | DNS status types |
| `src/__tests__/unit/dns/` | NEW | Unit tests |
| `src/__tests__/integration/dns-status.test.ts` | NEW | API integration test |

### Testing Standards Summary

- **Unit Tests:**
  - WizardStepper renders correct badges for each status
  - Copy-to-clipboard calls navigator.clipboard.writeText
  - Domain extraction from email (test@example.com → example.com)

- **Integration Tests:**
  - DNS status API returns correct format
  - API requires authentication
  - API returns workspace-scoped data only

### Previous Story Intelligence (2.1)

**Patterns Established:**
- `OnboardingWizard.tsx` already has step structure: `gmail | dns | complete`
- `GmailConnectStep.tsx` pattern: props `{ isConnected, onNext, connectedEmail }`
- Gmail email stored in `GmailToken.email` - use this for domain extraction
- Toast patterns via sonner for success/error feedback
- Use `Card` component for step containers

**Files to Reuse:**
- `src/components/features/onboarding/OnboardingWizard.tsx` — Add DNS step
- `src/components/features/onboarding/GmailConnectStep.tsx` — Pattern reference
- `src/lib/utils/api-response.ts` — Response helpers

### UX Requirements (from UX Spec)

- **WizardStepper Component:** Step-by-step with progress indicator (UX Spec L519)
- **Teal Primary Color:** `hsl(168, 76%, 42%)` for active states
- **Success State:** Green checkmark for completed/pass
- **Error State:** Red X for fail (pas trop alarmant, c'est réparable)
- **Unknown State:** Amber warning for DNS propagation issues
- **Copy Button:** Feedback via toast "Copié !" (3s auto-dismiss)
- **Instructions:** Clear, non-technical, step-by-step
- **Protection Visible:** Explain WHY each record matters (guardrails as protection, not restriction)

### DNS Record Reference Values

```typescript
// SPF Record for Google Workspace
const SPF_RECORD = 'v=spf1 include:_spf.google.com ~all';

// DKIM - Selector varies, default for Google
const DKIM_SELECTOR_DEFAULT = 'google';
// User adds DKIM via Google Admin Console, not direct TXT

// DMARC minimum recommendation
const getDmarcRecord = (domain: string) => 
  `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`;
```

### Prisma Schema Addition

```prisma
enum DnsStatus {
  NOT_STARTED
  PASS
  FAIL
  UNKNOWN
  MANUAL_OVERRIDE

  @@map("dns_status")
}

model Workspace {
  // ... existing fields ...
  
  // DNS Status fields (Story 2.2)
  spfStatus    DnsStatus @default(NOT_STARTED) @map("spf_status")
  dkimStatus   DnsStatus @default(NOT_STARTED) @map("dkim_status")
  dmarcStatus  DnsStatus @default(NOT_STARTED) @map("dmarc_status")
  dkimSelector String?   @map("dkim_selector") // default: "google"
  
  // ... rest of model ...
}
```

### Project Context Compliance

> 🚨 Refer to `project-context.md` for mandatory rules.

- **API Response:** All API calls return `ApiResponse<T>` format
- **Naming:** Files in `kebab-case.ts`, components in `PascalCase.tsx`
- **Tests:** Place in `__tests__/unit/` and `__tests__/integration/`
- **workspaceId:** NEVER in query params, always from session
- **DB Naming:** `snake_case` in DB, `camelCase` in Prisma with `@map()`
- **Query Keys:** `['dns-status', workspaceId]`

### Component Structure Example

```typescript
// src/components/features/onboarding/SpfStep.tsx
interface SpfStepProps {
  domain: string;
  status: DnsStatus;
  onVerify: () => void; // Calls parent to trigger verification (Story 2.3)
}

export function SpfStep({ domain, status, onVerify }: SpfStepProps) {
  const spfRecord = 'v=spf1 include:_spf.google.com ~all';
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(spfRecord);
    toast.success('Copié !');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 1: Configurer SPF</CardTitle>
        <DnsStatusBadge status={status} />
      </CardHeader>
      <CardContent>
        <p>Ajoutez cet enregistrement TXT à votre domaine <strong>{domain}</strong> :</p>
        <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-md font-mono text-sm">
          <code>{spfRecord}</code>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mt-4">
          💡 Pourquoi ? SPF permet aux serveurs de vérifier que vos emails viennent bien de Google.
        </p>
      </CardContent>
    </Card>
  );
}
```

### References

- [Epics: Story 2.2](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/epics.md#L471-L507)
- [Architecture: Onboarding Gate](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/architecture.md#L417-L430)
- [UX: Onboarding DNS Gate](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L456-L466)
- [UX: WizardStepper Component](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/ux-design-specification.md#L519)
- [Project Context](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/planning-artifacts/project-context.md)
- [Previous Story 2.1](file:///c:/Users/Alexis/Documents/LeadGen/_bmad-output/implementation-artifacts/2-1-gmail-oauth-connection-with-send-read-scopes.md)

## Git Intelligence

- No commits yet in repository (clean project)
- Epic 2 started with Story 2.1 (Gmail OAuth) - completed
- `OnboardingWizard.tsx` already exists with step structure

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

- Migration `add_dns_status_fields` applied cleanly to Supabase PostgreSQL

### Completion Notes List

- ✅ Prisma schema updated with `DnsStatus` enum and Workspace fields (spfStatus, dkimStatus, dmarcStatus, dkimSelector)
- ✅ API route `/api/workspace/dns-status` created with proper authentication and ApiResponse format
- ✅ TanStack Query hook `use-dns-status.ts` created with auto-refetch on window focus
- ✅ Reusable `WizardStepper` component created with status badges (pass/fail/unknown/active)
- ✅ DNS step components created: `SpfStep`, `DkimStep`, `DmarcStep` with French instructions
- ✅ `DnsConfigStep` container manages navigation between SPF → DKIM → DMARC
- ✅ `OnboardingWizard` updated to navigate to DNS step after Gmail connection
- ✅ Copy-to-clipboard functionality with toast confirmation "Copié !"
- ✅ Educational tooltips explaining "Pourquoi c'est important ?" for each DNS record
- ✅ Provider documentation links: Cloudflare, GoDaddy, OVH, Namecheap, Route53, Google Domains
- ✅ All 95 tests passing (unit + integration)

### File List

**NEW:**
- `prisma/migrations/20260114165000_add_dns_status_fields/migration.sql`
- `src/types/dns.ts`
- `src/lib/constants/dns-providers.ts`
- `src/app/api/workspace/dns-status/route.ts`
- `src/hooks/use-dns-status.ts`
- `src/__tests__/unit/dns/dns-providers.test.ts`
- `src/__tests__/unit/dns/wizard-stepper.test.tsx`
- `src/__tests__/unit/dns/dns-steps.test.tsx`
- `src/__tests__/integration/dns-status.test.ts`
- `src/hooks/use-workspace.ts`
- `src/app/api/workspace/me/route.ts`

**MODIFIED:**
- `prisma/schema.prisma` - Added DnsStatus enum + Workspace DNS fields
- `src/components/features/onboarding/OnboardingWizard.tsx` - Added DNS step integration

## Change Log

- 2026-01-14: Story created by SM Agent (YOLO mode) - comprehensive developer guide prepared
- 2026-01-14: Story implemented by Dev Agent - all 9 tasks completed, 95 tests passing
- 2026-01-14: UX HOTFIX - Added auto-detection for personal Gmail addresses (@gmail.com) to skip manual DNS configuration
- 2026-01-14: UX IMPROVEMENT - Added clear explanations about Gmail Personal vs Workspace quotas (~50 vs 150+ emails/day) directly in UI

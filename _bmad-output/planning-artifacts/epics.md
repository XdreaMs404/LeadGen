---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'epics'
project_name: 'LeadGen'
date: 2026-01-13
---

# LeadGen - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for LeadGen, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

**Total Epics: 9** | **Total FRs: 66** | **Total NFRs: 26**

## Requirements Inventory

### Functional Requirements

**1. Auth & Workspace (FR1-4)**
- FR1: User can authenticate via Google OAuth
- FR2: User can create and access their personal workspace
- FR3: User can view their workspace dashboard with key metrics
- FR4: User can logout and revoke OAuth access

**2. ICP & Prospects Management (FR5-12)**
- FR5: User can define ICP criteria (industry, size, role, location)
- FR6: User can import prospects via CSV upload with source tracking
- FR7: User can add individual prospects manually
- FR8: User can view prospect list with enrichment status
- FR9: User can delete prospects (with cascade to sequences)
- FR10: User can see provenance data (source) for each prospect
- FR11: System can automatically enrich prospects via Dropcontact API
- FR12: System can mark prospects as "verified email" or "not verified"

**3. Sequence Builder & Templates (FR13-20)**
- FR13: User can create email sequences (max 3 steps)
- FR14: User can configure delay between sequence steps
- FR15: User can use template variables (first_name, company, etc.)
- FR16: User can request LLM-generated opener personalization
- FR17: User can preview each email before scheduling (Copilot mode)
- FR18: User can save sequences as reusable templates
- FR19: User can duplicate and edit existing sequences
- FR20: System can compute spam risk / compliance warnings at preview and block/require edits if high risk

**4. Campaign Control (FR21-25)**
- FR21: User can launch a campaign from a sequence + a prospect list
- FR22: User can pause a running campaign (global)
- FR23: User can resume a paused campaign
- FR24: User can stop a campaign permanently
- FR25: User can pause/resume/stop sending for individual leads within a campaign

**5. Email Sending & Scheduling (FR26-32)**
- FR26: User can connect their Gmail inbox via OAuth
- FR27: System can validate user's DNS config (SPF/DKIM/DMARC)
- FR28: System can block sending until deliverability onboarding is complete
- FR29: User can schedule sequence emails for sending
- FR30: System can send emails via Gmail API within quota limits
- FR31: System can respect daily sending quotas (20-50/day configurable)
- FR32: System can auto-pause sequences on deliverability anomaly triggers (bounce spike >2%, unsubscribe spike, Postmaster health degradation, complaints if available)

**6. Settings & Configuration (FR33-37)**
- FR33: User can configure sending window (days and hours)
- FR34: User can configure timezone for sending
- FR35: User can configure email signature
- FR36: User can configure from-name for outgoing emails
- FR37: User can configure safe defaults (quota, ramp-up profile)

**7. Inbox & Response Management (FR38-44)**
- FR38: User can view incoming replies in unified inbox
- FR39: System can classify replies (Interested / Not Now / Negative / OOO / Bounce)
- FR40: User can manually reclassify replies
- FR41: User can see suggested reply text with booking link
- FR42: User can send reply directly from inbox
- FR43: System can detect and process unsubscribe requests
- FR44: System can add unsubscribed contacts to global suppression list

**8. Booking & RDV Tracking (FR45-49)**
- FR45: User can configure booking integration (Calendly/Cal.com)
- FR46: User can include booking link in sequences and replies
- FR47: System can receive booking webhook and update lead status
- FR48: User can manually mark a lead as BOOKED (fallback if webhook unavailable)
- FR49: User can view RDV bookés count on dashboard

**9. Dashboard & Analytics (FR50-54)**
- FR50: User can view email sending metrics (sent, delivered/failed, bounced)
- FR51: User can view reply metrics (total, by classification)
- FR52: User can view RDV metrics (booked, rate)
- FR53: User can view health score (deliverability indicator)
- FR54: User can see "First RDV" celebration notification

**10. Guardrails & Compliance (FR55-62)**
- FR55: System can prevent sending to unverified emails
- FR56: System can deduplicate prospects (no duplicate sends)
- FR57: System can enforce sending quota limits
- FR58: System can add mandatory unsubscribe link to all emails
- FR59: User can access audit logs for all sending actions
- FR60: User can export their data (for DSAR)
- FR61: User can request data deletion (cascade delete)
- FR62: System can enforce 3-year data retention limit

**11. Onboarding & Setup (FR63-66)**
- FR63: User can complete deliverability onboarding checklist
- FR64: User can see DNS configuration tutorial
- FR65: System can verify SPF/DKIM/DMARC configuration
- FR66: User can see onboarding progress indicator

### NonFunctional Requirements

**Performance (NFR1-5)**
- NFR1: Actions utilisateur (click, navigation) < 500ms
- NFR2: Preview email génération < 3s (LLM personalization)
- NFR3: Classification reply < 5s (LLM triage inbox)
- NFR4: Import CSV 500 lignes < 10s
- NFR5: Dashboard load < 2s

**Security (NFR6-11)**
- NFR6: OAuth tokens stockés chiffrés (AES-256)
- NFR7: Pas de credentials stockés côté client
- NFR8: HTTPS obligatoire (TLS 1.3)
- NFR9: Audit logs immuables avec timestamp
- NFR10: Session timeout après 24h d'inactivité
- NFR11: Rate limiting API (100 req/min/user)

**Scalability (NFR12-15)**
- NFR12: Support 50 users concurrents MVP
- NFR13: Support 10K emails/jour total (platform)
- NFR14: DB schema prêt pour multi-tenant (workspaceId)
- NFR15: Queue job processing < 5min delay

**Accessibility (NFR16-18)**
- NFR16: WCAG 2.1 AA compliance (core flows)
- NFR17: Keyboard navigation complete
- NFR18: Screen reader compatible (labels ARIA)

**Integration (NFR19-22)**
- NFR19: Gmail API retry avec exponential backoff
- NFR20: Dropcontact API fallback graceful (queue + retry)
- NFR21: Webhook booking timeout 10s with retry
- NFR22: LLM API timeout 30s avec fallback message

**Compliance (NFR23-26)**
- NFR23: DSAR requests processing < 30 jours
- NFR24: Data deletion cascade complete < 24h
- NFR25: Audit logs retention 3 ans
- NFR26: Opt-out processing immediate (< 1s)

### Additional Requirements

**From Architecture:**
- Starter Template: `create-next-app` + manuel deps (shadcn, Supabase, Prisma, TanStack Query)
- middleware.ts = Auth gating ONLY (workspaceId checks in API/services via workspace-check.ts)
- Dashboard MVP: No open/click tracking (sent/delivered/bounced/replies/booked/healthScore)
- Email Scheduling Pillar: DB-based queue, idempotency key format `{prospectId}:{sequenceId}:{step}`, random delay 30-90s
- LLM Abstraction: `LLMProvider` interface for easy provider switch
- API Response Standard: `ApiResponse<T>` with success/error pattern
- Centralized JSON mapping via `lib/prisma/mappers.ts`

**From UX Design:**
- Design System: shadcn/ui + Tailwind CSS, Teal primary palette
- Responsive: Desktop-first, mobile for monitoring only
- Keyboard Navigation: ⌘K command palette, Tab nav
- Celebrations: First RDV modal with Framer Motion
- Health Score Badge: Visible in header permanently
- Custom Components: HealthScoreBadge, LeadStatusBadge, WizardStepper, EmailPreview, InboxReplyCard, CelebrationModal
- Loading States: Skeleton shimmer pattern
- Toasts: Bottom-right, non-blocking

---

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Google OAuth authentication |
| FR2 | Epic 1 | Create/access personal workspace |
| FR3 | Epic 1 | View workspace dashboard structure |
| FR4 | Epic 1 | Logout and revoke OAuth |
| FR5 | Epic 3 | Define ICP criteria |
| FR6 | Epic 3 | Import prospects via CSV |
| FR7 | Epic 3 | Add prospects manually |
| FR8 | Epic 3 | View prospect list with status |
| FR9 | Epic 3 | Delete prospects (cascade) |
| FR10 | Epic 3 | See provenance data |
| FR11 | Epic 3 | Enrich via Dropcontact |
| FR12 | Epic 3 | Mark verified/not verified |
| FR13 | Epic 4 | Create sequences (max 3 steps) |
| FR14 | Epic 4 | Configure delays |
| FR15 | Epic 4 | Use template variables |
| FR16 | Epic 4 | LLM opener personalization |
| FR17 | Epic 4 | Copilot preview before send |
| FR18 | Epic 4 | Save as templates |
| FR19 | Epic 4 | Duplicate/edit sequences |
| FR20 | Epic 4 | Spam risk warnings |
| FR21 | Epic 5 | Launch campaign |
| FR22 | Epic 5 | Pause campaign (global) |
| FR23 | Epic 5 | Resume campaign |
| FR24 | Epic 5 | Stop campaign permanently |
| FR25 | Epic 5 | Pause/resume/stop individual leads |
| FR26 | Epic 2 | Connect Gmail via OAuth |
| FR27 | Epic 2 | Validate DNS config |
| FR28 | Epic 2 | Block sending until onboarding complete |
| FR29 | Epic 5 | Schedule sequence emails |
| FR30 | Epic 5 | Send via Gmail API |
| FR31 | Epic 5 | Respect daily quotas |
| FR32 | Epic 5 | Auto-pause on anomalies |
| FR33 | Epic 5 | Configure sending window |
| FR34 | Epic 5 | Configure timezone |
| FR35 | Epic 5 | Configure signature |
| FR36 | Epic 5 | Configure from-name |
| FR37 | Epic 5 | Configure safe defaults |
| FR38 | Epic 6 | View unified inbox |
| FR39 | Epic 6 | Classify replies (AI) |
| FR40 | Epic 6 | Manually reclassify |
| FR41 | Epic 6 | See suggested replies |
| FR42 | Epic 6 | Send reply from inbox |
| FR43 | Epic 8 | Detect unsubscribe requests |
| FR44 | Epic 8 | Add to suppression list |
| FR45 | Epic 7 | Configure booking integration |
| FR46 | Epic 7 | Include booking link |
| FR47 | Epic 7 | Receive booking webhook |
| FR48 | Epic 7 | Manually mark BOOKED |
| FR49 | Epic 9 | View RDV count on dashboard |
| FR50 | Epic 9 | View sending metrics |
| FR51 | Epic 9 | View reply metrics |
| FR52 | Epic 9 | View RDV metrics |
| FR53 | Epic 9 | View health score |
| FR54 | Epic 7 | First RDV celebration |
| FR55 | Epic 8 | Prevent unverified sends |
| FR56 | Epic 8 | Deduplicate prospects |
| FR57 | Epic 8 | Enforce quota limits |
| FR58 | Epic 8 | Mandatory unsubscribe link |
| FR59 | Epic 8 | Access audit logs |
| FR60 | Epic 8 | Export data (DSAR) |
| FR61 | Epic 8 | Request data deletion |
| FR62 | Epic 8 | Enforce 3-year retention |
| FR63 | Epic 2 | Complete onboarding checklist |
| FR64 | Epic 2 | See DNS tutorial |
| FR65 | Epic 2 | Verify SPF/DKIM/DMARC |
| FR66 | Epic 2 | See onboarding progress |

**Coverage: 66/66 FRs mapped ✅**

---

## Epic List

### Epic 1: Foundation & Authentication
L'utilisateur peut s'authentifier via Google OAuth et accéder à son espace de travail personnel avec un dashboard structure de base.

**Valeur utilisateur:** Accès sécurisé à l'application et workspace personnel.

**FRs couverts:** FR1, FR2, FR3, FR4

**Notes techniques:**
- Initialisation projet avec `create-next-app` + deps (Supabase, Prisma, shadcn/ui, TanStack Query)
- Setup Supabase Auth avec Google OAuth
- Schema Prisma de base (User, Workspace)
- Layout dashboard avec sidebar + header vide

---

#### Story 1.1: Project Initialization & Dev Environment

As a **developer**,
I want **a fully configured Next.js project with all dependencies, Prisma ORM, Supabase connection, and CI pipeline**,
So that **the codebase is ready for feature development with proper tooling**.

**Acceptance Criteria:**

**Given** a new empty project directory
**When** the initialization script is run
**Then** a Next.js 16+ project is created with TypeScript, Tailwind CSS, and App Router
**And** the following dependencies are installed: `@supabase/supabase-js`, `@supabase/ssr`, `prisma`, `@prisma/client`, `@tanstack/react-query`, `framer-motion`, `zod`, `date-fns`
**And** shadcn/ui is initialized with base components (Button, Card, Form, Input, Dialog, Toast)
**And** Prisma is configured with Supabase PostgreSQL connection string
**And** `.env.example` contains all required environment variables
**And** ESLint, Prettier, and TypeScript strict mode are configured
**And** a basic `prisma/schema.prisma` exists with `User` and `Workspace` models
**And** `pnpm lint`, `pnpm type-check`, and `pnpm test` commands work (CI-ready)
**And** a minimal seed script exists for dev data

**Technical Notes:**
- Use `create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm`
- Configure Vitest for testing
- Project structure follows Architecture document patterns

---

#### Story 1.2: Supabase Auth with Google OAuth

As a **user**,
I want **to sign in using my Google account**,
So that **I can access the application securely without creating a new password**.

**Acceptance Criteria:**

**Given** a user is on the login page
**When** they click the "Sign in with Google" button
**Then** they are redirected to Google OAuth consent screen
**And** after successful authentication, they are redirected back to the application
**And** a session cookie is created (httpOnly, secure, SameSite)
**And** the user's email and name from Google are stored in the database

**Given** a user with an existing account signs in again
**When** they authenticate via Google OAuth
**Then** they are logged into their existing account (no duplicate user created)

**Given** a user is not authenticated
**When** they try to access `/dashboard` or any protected route
**Then** they are redirected to `/login`

**Technical Notes:**
- Use Supabase Auth with Google provider
- Configure OAuth callback at `/auth/callback`
- Middleware handles route protection (auth gating only)

---

#### Story 1.3: Workspace Creation & Access

As a **authenticated user**,
I want **a personal workspace to be automatically created on first login**,
So that **I have an isolated space to manage my prospecting activities**.

**Acceptance Criteria:**

**Given** a user successfully authenticates for the first time
**When** the auth callback completes
**Then** a new Workspace is created with the user as owner
**And** the workspaceId is associated with the user record
**And** the user is redirected to `/dashboard`

**Given** a user who already has a workspace authenticates again
**When** the auth callback processes
**Then** no duplicate workspace is created (idempotent operation)
**And** the existing workspace is accessed

**Given** a user is authenticated
**When** they access any API endpoint
**Then** the workspaceId is resolved from their session (never from query params)
**And** ownership is verified via `workspace-check.ts` helper

**Technical Notes:**
- Workspace creation is idempotent (check exists before create)
- workspaceId isolation pattern: all data tables will have workspaceId FK
- Ownership check helper in `lib/guardrails/workspace-check.ts`

---

#### Story 1.4: Dashboard Layout Shell

As a **user**,
I want **to see a clean dashboard layout with navigation sidebar**,
So that **I can understand the application structure and navigate between sections**.

**Acceptance Criteria:**

**Given** a user is authenticated and on the dashboard
**When** the page loads
**Then** a sidebar is displayed on the left (260px fixed width)
**And** the sidebar contains navigation links: Dashboard, Prospects, Sequences, Inbox, Settings
**And** there is a header with the LeadGen logo and user menu
**And** the main content area shows a welcome message with the user's name
**And** an empty state indicates "Complete onboarding to start prospecting"

**Given** a user is on desktop (≥1024px)
**When** they view the dashboard
**Then** the sidebar is always visible

**Given** a user clicks on a navigation link
**When** the page transitions
**Then** the active link is visually highlighted (teal accent)
**And** the page transition is smooth (<500ms)

**Technical Notes:**
- Use shadcn/ui components for layout
- Teal color palette from UX spec
- Skeleton loading states for async content
- Layout component at `app/(dashboard)/layout.tsx`

---

#### Story 1.5: Logout & Session Management

As a **user**,
I want **to logout from the application securely**,
So that **my session is terminated and my account is protected**.

**Acceptance Criteria:**

**Given** a user is authenticated
**When** they click the "Logout" button in the user menu
**Then** their session is terminated
**And** the session cookie is cleared
**And** they are redirected to the login page
**And** attempting to access protected routes fails

**Given** a user's session has been inactive for 24 hours
**When** they try to access the application
**Then** they are automatically logged out
**And** redirected to login with a message "Session expired"

**Given** a user wants to revoke OAuth access
**When** they go to Settings > Security
**Then** they can see a "Revoke Google Access" option (logs out and clears tokens)

**Technical Notes:**
- Use Supabase `signOut()` method
- Session timeout configured to 24h (NFR10)
- Clear all local state on logout

### Epic 2: Deliverability Onboarding Gate
L'utilisateur configure sa deliverability (DNS, Gmail OAuth) et débloque l'envoi d'emails. C'est le "blocking gate" MVP — aucun email ne peut être envoyé sans compléter cet Epic.

**Valeur utilisateur:** Protection du domaine dès le premier jour. L'utilisateur comprend que l'outil le protège.

**FRs couverts:** FR26, FR27, FR28, FR63, FR64, FR65, FR66

**Notes techniques (MVP Scope):**
- Wizard step-by-step avec instructions claires
- Check basic DNS records (SPF, DKIM, DMARC)
- État "Verified / Not Verified" avec possibilité de confirmation manuelle si vérification auto incertaine
- Gmail OAuth pour obtenir les tokens send/read
- Blocking gate: hard block sur launch/send, soft access pour explorer (ICP, import, sequences preview)

---

#### Story 2.1: Gmail OAuth Connection with Send/Read Scopes

As a **user**,
I want **to connect my Gmail inbox with the necessary permissions for sending and reading emails**,
So that **LeadGen can send prospecting emails on my behalf and receive replies**.

**Acceptance Criteria:**

**Given** a user is on the onboarding wizard
**When** they click "Connect Gmail"
**Then** they are redirected to Google OAuth consent screen with additional Gmail scopes
**And** the scopes requested include: `gmail.send`, `gmail.readonly`, `gmail.modify`
**And** after consent, the Gmail OAuth tokens are stored securely (AES-256 encrypted)

**Given** a user has already authenticated via Google for login
**When** they connect Gmail for sending
**Then** the system requests only the additional Gmail scopes (incremental consent)
**And** the login session remains active

**Given** a user refuses the Gmail scopes during OAuth
**When** the consent screen returns
**Then** the system displays a clear error: "Gmail access is required to send emails"
**And** the user can retry the connection
**And** the user can still explore the app (ICP, import, sequences) without Gmail connected

**Given** a user wants to disconnect Gmail
**When** they go to Settings > Integrations
**Then** they can see a "Disconnect Gmail" button
**And** clicking it revokes the Gmail tokens
**And** the onboarding status is reset to "not connected"

**Technical Notes:**
- Use Google OAuth incremental scopes pattern
- Store Gmail tokens separately from auth tokens
- Handle token refresh with exponential backoff (NFR19)

---

#### Story 2.2: DNS Configuration Wizard UI

As a **user**,
I want **step-by-step instructions to configure my domain's DNS records**,
So that **I can ensure my emails are authenticated and delivered correctly**.

**Acceptance Criteria:**

**Given** a user is on the DNS configuration step of onboarding
**When** the wizard loads
**Then** they see a clear 3-step process: SPF → DKIM → DMARC
**And** each step shows the current status (PASS / FAIL / UNKNOWN / NOT CHECKED)
**And** the active step is highlighted

**Given** a user is on the SPF configuration step
**When** they view the instructions
**Then** they see their domain name pre-filled
**And** they see the exact TXT record value to add
**And** they see a "Copy to clipboard" button for the record
**And** they see a link to their domain provider's DNS documentation (generic + common providers: GoDaddy, Cloudflare, OVH, etc.)

**Given** a user is on the DKIM configuration step
**When** they view the instructions
**Then** they see instructions specific to Google Workspace DKIM setup
**And** they see the selector field (default: `google`) with explanation
**And** they see step-by-step Admin Console instructions with screenshots/links

**Given** a user is on the DMARC configuration step
**When** they view the instructions
**Then** they see a recommended DMARC policy for cold outreach (`v=DMARC1; p=none; rua=mailto:...`)
**And** they see explanation of what DMARC does and why it matters

**Technical Notes:**
- WizardStepper component from UX spec
- Domain extracted from user's email address
- Instructions available in French (communication_language)

---

#### Story 2.3: DNS Validation Service

As a **user**,
I want **the system to automatically check my DNS configuration**,
So that **I know if my setup is correct before sending any emails**.

**Acceptance Criteria:**

**Given** a user clicks "Verify DNS" on any DNS step
**When** the validation runs
**Then** the result shows one of: PASS ✅ / FAIL ❌ / UNKNOWN ⚠️ for each record (SPF, DKIM, DMARC)
**And** the check completes within 10 seconds

**Given** a DNS check returns FAIL
**When** the result is displayed
**Then** the user sees a clear "Why" message (e.g., "SPF record not found", "DKIM selector 'google' not found")
**And** the user sees a "How to fix" message with specific action (e.g., "Add this TXT record to your DNS")
**And** a retry button is available

**Given** a DNS check returns UNKNOWN
**When** the result is displayed
**Then** the user sees "Could not verify" message with explanation (DNS propagation, selector issue)
**And** the user sees an option "I've configured it, mark as verified" (manual override)
**And** a warning explains risks of manual override

**Given** the DKIM check needs a selector
**When** validation runs
**Then** the system checks the default selector (`google` for Google Workspace)
**And** if not found, prompts user to enter their custom selector
**And** retries with the custom selector

**Given** all three checks return PASS
**When** the results are displayed
**Then** the onboarding step is marked as complete
**And** a success message "Your domain is ready!" is shown with celebration animation

**Technical Notes:**
- Use external DNS lookup service or library (e.g., `dns` module, MxToolbox API)
- Handle common errors: NXDOMAIN, timeout, SERVFAIL
- Log all validation attempts for debugging

---

#### Story 2.4: Onboarding Progress & Status Tracking

As a **user**,
I want **to see my onboarding progress and current verification status**,
So that **I know what's left to do before I can start sending emails**.

**Acceptance Criteria:**

**Given** a user is on any page of the application
**When** onboarding is incomplete
**Then** a banner or indicator shows "Complete setup to start sending"
**And** clicking it navigates to the onboarding wizard

**Given** a user is on the dashboard
**When** onboarding is incomplete
**Then** the dashboard shows an onboarding progress card
**And** the card displays: Gmail connection status, SPF status, DKIM status, DMARC status
**And** each item shows PASS/FAIL/UNKNOWN/NOT STARTED

**Given** all onboarding steps are complete (Gmail + DNS all PASS)
**When** the user views the dashboard
**Then** the onboarding card is replaced by a success state
**And** the user's `onboardingComplete` flag is set to true in database

**Given** a user has manually overridden a DNS check
**When** they view their status
**Then** the status shows "Verified (manual)" with an info tooltip

**Technical Notes:**
- Workspace model has fields: `gmailConnected`, `spfStatus`, `dkimStatus`, `dmarcStatus`, `onboardingComplete`
- Status enum: `NOT_STARTED`, `PASS`, `FAIL`, `UNKNOWN`, `MANUAL_OVERRIDE`

---

#### Story 2.5: Sending Blocking Gate

As a **system**,
I want **to prevent email sending until deliverability onboarding is complete**,
So that **users cannot damage their domain reputation before proper setup**.

**Acceptance Criteria:**

**Given** a user has NOT completed onboarding
**When** they try to launch a campaign
**Then** the launch button is disabled
**And** a tooltip explains: "Complete deliverability setup first"
**And** a link navigates to the onboarding wizard

**Given** a user has NOT completed onboarding
**When** they try to schedule emails for sending
**Then** the schedule action is blocked
**And** an error message explains the requirement

**Given** a user has NOT completed onboarding
**When** they try to access Prospects, Sequences, or ICP settings
**Then** access is ALLOWED (soft gate)
**And** they can import prospects, create sequences, preview emails
**And** only the "send" and "launch" actions are blocked

**Given** a user completes onboarding
**When** they return to the campaign launch screen
**Then** the launch button is enabled
**And** they can proceed with sending

**Given** a user's Gmail tokens expire or are revoked
**When** they try to send emails
**Then** sending is blocked
**And** they are prompted to reconnect Gmail

**Technical Notes:**
- Gate implemented at API level (`lib/guardrails/pre-send-check.ts`)
- Check `workspace.onboardingComplete` AND `workspace.gmailConnected`
- UI disables buttons with clear messaging

---

### Epic 3: Prospect Management & Enrichment
L'utilisateur peut constituer et enrichir sa base de prospects via import CSV ou ajout manuel, avec enrichissement automatique Dropcontact.

**Valeur utilisateur:** Base de prospects qualifiée avec emails vérifiés et provenance tracée.

**FRs couverts:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12

**Notes techniques:**
- Définition ICP (critères simples stockés)
- Import CSV avec validation stricte + source obligatoire + error report
- Enrichissement async via Dropcontact API avec retry backoff
- Statuts prospect: NEW, ENRICHING, VERIFIED, NOT_VERIFIED, NEEDS_REVIEW, SUPPRESSED
- Hard rule: no send without verified email

---

#### Story 3.1: ICP Definition & Storage

As a **user**,
I want **to define my Ideal Customer Profile with simple criteria**,
So that **I can target the right prospects for my outreach campaigns**.

**Acceptance Criteria:**

**Given** a user is on the Settings > ICP page
**When** they access the ICP configuration
**Then** they can define criteria for: Industry, Company Size, Role/Title, Location
**And** each criterion has a text field or multi-select dropdown

**Given** a user defines ICP criteria
**When** they save the configuration
**Then** the ICP is stored in the database linked to their workspace
**And** a success toast confirms "ICP saved"

**Given** a user has previously defined ICP
**When** they return to the ICP page
**Then** their existing criteria are pre-filled

**Given** a user imports prospects
**When** prospects match the ICP criteria
**Then** they can optionally filter the import to show only matching prospects

**Technical Notes:**
- ICP stored as JSON in Workspace model or separate IcpConfig table
- Simple text matching for MVP (no ML scoring)

---

#### Story 3.2: CSV Import with Source Tracking & Validation

As a **user**,
I want **to import prospects from a CSV file with strict validation and source attribution**,
So that **I have a clean contact list with traceable provenance for compliance**.

**Acceptance Criteria:**

**Given** a user is on the Prospects > Import page
**When** they upload a CSV file
**Then** the system parses and displays a column mapping interface
**And** required columns are: email (mandatory), first_name, last_name, company
**And** optional columns are: title, phone, linkedin_url, custom fields

**Given** a CSV contains invalid data
**When** validation runs
**Then** email format is validated (RFC 5322 pattern)
**And** duplicates within the file are flagged
**And** duplicates against existing prospects are flagged
**And** rows with errors are counted and highlighted
**And** a downloadable error report (CSV) is available with row numbers and error descriptions

**Given** a user imports prospects
**When** they reach the source attribution step
**Then** they MUST select a source: CRM Export, Event/Conference, Network/Referral, Content Download, Outbound Research, Other
**And** if "Other" is selected, a text field appears for custom source
**And** if source appears to be "Paid List" or "Unknown", a warning is displayed: "⚠️ Paid lists may have deliverability issues"

**Given** a valid CSV with source selected
**When** the user confirms import
**Then** prospects are created with status "NEW"
**And** each prospect has `source` and `sourceDetail` fields populated
**And** a summary shows: X imported, Y skipped (duplicates), Z errors
**And** import is logged in audit trail

**Technical Notes:**
- Use Papa Parse or similar for CSV parsing
- Chunk large imports (>500 rows) with progress indicator
- Max file size: 5MB

---

#### Story 3.3: Manual Prospect Creation

As a **user**,
I want **to add individual prospects manually**,
So that **I can include contacts I've met or identified outside of bulk imports**.

**Acceptance Criteria:**

**Given** a user is on the Prospects page
**When** they click "Add Prospect"
**Then** a form appears with fields: email (required), first_name, last_name, company, title, phone, linkedin_url
**And** source dropdown with same options as CSV import

**Given** a user fills the form
**When** they submit
**Then** email format is validated
**And** duplicate check runs against existing prospects
**And** if duplicate, error message shows existing prospect link

**Given** a valid new prospect
**When** submission completes
**Then** prospect is created with status "NEW"
**And** source is recorded
**And** prospect appears in the list

**Technical Notes:**
- Use React Hook Form + Zod validation
- Quick action available from header (⌘K > "Add prospect")

---

#### Story 3.4: Prospect List & Status Display with Filters

As a **user**,
I want **to view my prospects with their enrichment status and filter by criteria**,
So that **I can manage my contact list efficiently and identify who is ready to contact**.

**Acceptance Criteria:**

**Given** a user is on the Prospects page
**When** the page loads
**Then** a data table displays all prospects with columns: Name, Email, Company, Status, Source, Created
**And** pagination is available (25/50/100 per page)
**And** skeleton loading is shown during fetch

**Given** a user views the prospect list
**When** they look at the Status column
**Then** status badges are color-coded: 
  - NEW (gray)
  - ENRICHING (blue, spinner)
  - VERIFIED (green ✓)
  - NOT_VERIFIED (red ✗)
  - NEEDS_REVIEW (amber ⚠️)
  - SUPPRESSED (strikethrough)

**Given** a user wants to filter prospects
**When** they access the filter panel
**Then** they can filter by: Status (multi-select), Source, Date range
**And** P0 quick filters are available: "Verified only", "Needs review", "Not enriched"

**Given** a user wants to search
**When** they type in the search bar
**Then** results filter by name, email, or company (case-insensitive partial match)
**And** search is debounced (300ms)

**Given** a user clicks on a prospect row
**When** the detail panel opens
**Then** they see all prospect data including provenance (source, import date)
**And** enrichment history if applicable

**Technical Notes:**
- Use TanStack Table for data grid
- Server-side pagination and filtering for large lists
- URL query params for shareable filter state

---

#### Story 3.5: Dropcontact Enrichment Integration

As a **user**,
I want **prospects to be automatically enriched via Dropcontact**,
So that **I have verified email addresses and complete company data for my outreach**.

**Acceptance Criteria:**

**Given** a new prospect is created (via import or manual)
**When** the prospect has status "NEW"
**Then** an enrichment job is queued for Dropcontact API

**Given** an enrichment job runs
**When** Dropcontact returns a valid result
**Then** prospect is updated with enriched data: verified email, company info, title, linkedin
**And** status changes to "VERIFIED" if email is valid
**And** status changes to "NOT_VERIFIED" if email cannot be verified
**And** `enrichmentSource: "dropcontact"` and timestamp are recorded

**Given** an enrichment job fails (API error, timeout)
**When** the error is detected
**Then** the job is retried with exponential backoff (1min, 5min, 15min)
**And** after 3 retries, status changes to "NEEDS_REVIEW"
**And** error reason is logged for debugging

**Given** a prospect has status "VERIFIED"
**When** the user views the prospect
**Then** a "✓ Verified by Dropcontact" badge is visible
**And** the verification date is shown

**Given** a prospect has status "NOT_VERIFIED" or "NEEDS_REVIEW"
**When** the user tries to include them in a campaign
**Then** they are excluded from the send list (hard rule: no send without verified)
**And** a warning explains why

**Given** a user wants to see data provenance
**When** they view prospect details
**Then** they see: original source, enrichment source, verification date, last updated

**Technical Notes:**
- Use Dropcontact async API with job polling
- Queue enrichment jobs in DB (not blocking UI)
- Rate limit Dropcontact calls per workspace (avoid API abuse)

---

#### Story 3.6: Prospect Deletion with Cascade

As a **user**,
I want **to delete prospects and have related data cleaned up automatically**,
So that **I can maintain a clean database without orphaned records**.

**Acceptance Criteria:**

**Given** a user selects one or more prospects
**When** they click "Delete" (with confirmation dialog)
**Then** the prospects are soft-deleted (not removed from DB immediately)
**And** they disappear from the active prospect list

**Given** a prospect is part of an active sequence/campaign
**When** deletion is attempted
**Then** a warning shows: "This prospect is in X active campaigns"
**And** user can confirm to remove from campaigns AND delete

**Given** a prospect is deleted
**When** the deletion completes
**Then** related campaign enrollments are cancelled
**And** scheduled emails for this prospect are cancelled
**And** audit log records the deletion with timestamp and user

**Given** a prospect has replies/emails in inbox
**When** deletion completes
**Then** the inbox thread is archived (not deleted) for compliance

**Technical Notes:**
- Soft delete with `deletedAt` timestamp
- Hard delete after 30 days (data retention)
- Cascade via Prisma relations or manual cleanup

---

### Epic 4: Sequence Builder & Copilot Preview
L'utilisateur peut créer des séquences email (max 3 steps) et prévisualiser chaque email en mode Copilot avec génération LLM et warnings spam.

**Valeur utilisateur:** Création de séquences personnalisées avec validation humaine obligatoire avant envoi.

**FRs couverts:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20

**Notes techniques:**
- LLM integration (Gemini Flash) avec anti-hallucination rules + cache
- Template rendering avec variables picker + validation
- Preview Copilot obligatoire avant scheduling
- Spam risk heuristics avec block/confirmation (pas auto-rewrite MVP)

---

#### Story 4.1: Sequence Creation (Max 3 Steps)

As a **user**,
I want **to create an email sequence with up to 3 steps**,
So that **I can set up a multi-touch outreach campaign**.

**Acceptance Criteria:**

**Given** a user is on the Sequences page
**When** they click "New Sequence"
**Then** a sequence builder interface opens
**And** they can name the sequence
**And** they see an empty step list with "Add Step" button

**Given** a user is building a sequence
**When** they add steps
**Then** they can add up to 3 steps maximum
**And** the "Add Step" button is disabled after 3 steps
**And** a tooltip explains "Maximum 3 steps per sequence"

**Given** a user adds a step
**When** the step editor opens
**Then** they can write subject line and email body
**And** rich text editor with basic formatting (bold, italic, links)
**And** placeholder for variables insertion

**Given** a sequence has at least 1 step
**When** the user saves
**Then** the sequence is saved with status "DRAFT"
**And** success toast confirms save

**Technical Notes:**
- Sequence model: name, status (DRAFT, READY, ARCHIVED), workspaceId
- Step model: sequenceId, order, subject, body, delayDays

---

#### Story 4.2: Step Configuration & Delays

As a **user**,
I want **to configure delays between sequence steps**,
So that **my emails are spaced appropriately for follow-up cadence**.

**Acceptance Criteria:**

**Given** a sequence has multiple steps
**When** the user views the sequence builder
**Then** each step (except the first) has a delay configuration
**And** delay is displayed as "Wait X days before sending"

**Given** a user configures a delay
**When** they set the delay value
**Then** they can choose from: 1, 2, 3, 5, 7, 14 days (dropdown or input)
**And** default delay is 3 days

**Given** a user reorders steps
**When** they drag and drop
**Then** steps are reordered
**And** delays remain attached to their respective steps

**Given** step 2 has delay 3 days and step 3 has delay 5 days
**When** the sequence is launched
**Then** step 1 is sent immediately (or at scheduled time)
**And** step 2 is sent 3 days after step 1
**And** step 3 is sent 5 days after step 2 (8 days total)

**Technical Notes:**
- Store delayDays per step
- Display visual timeline of sequence

---

#### Story 4.3: Template Variables System with Picker

As a **user**,
I want **to use personalization variables in my emails**,
So that **each recipient gets a customized message**.

**Acceptance Criteria:**

**Given** a user is editing an email step
**When** they want to insert a variable
**Then** they can click a "Variables" button to open a picker
**And** the picker shows available variables: {{first_name}}, {{last_name}}, {{company}}, {{title}}, {{email}}
**And** clicking a variable inserts it at cursor position

**Given** a user types a variable manually
**When** they type {{custom_field}}
**Then** the system validates if the variable is known
**And** unknown variables are highlighted with a warning: "⚠️ Unknown variable: custom_field"

**Given** a variable has no value for a prospect (e.g., {{company}} is empty)
**When** the email is previewed
**Then** the variable renders as empty string (no placeholder shown)
**And** a warning shows: "⚠️ 3 prospects have missing 'company' field"

**Given** a user previews an email with variables
**When** they see the preview
**Then** variables are replaced with actual prospect data (or sample data)
**And** missing variables are shown as [empty] with highlight

**Technical Notes:**
- Variable picker component with insert-at-cursor
- Regex validation for {{variable}} pattern
- Preview with sample or real prospect data

---

#### Story 4.4: AI Email Assistant (Generate & Improve)

As a **user**,
I want **AI-powered email generation and improvement**,
So that **I can quickly create professional prospecting emails or enhance my existing content**.

**Acceptance Criteria:**

**Given** a user is editing an email step (create OR edit mode)
**When** they expand the "AI Assistant" panel below the editor
**Then** they see two modes: "Rédiger un email" and "Améliorer ce texte"

**Given** a user selects "Rédiger un email"
**When** they enter a prompt describing the email they want
**Then** the AI generates a complete email (subject + body)
**And** the user sees a preview before applying
**And** the AI uses correct variable format: {{first_name}}, {{company}}, etc.

**Given** a user selects "Améliorer ce texte"
**When** they click "Améliorer"
**Then** the AI reformulates their existing email to be more impactful
**And** the user sees a preview before applying
**And** existing variables are preserved

**Given** the AI generates content
**When** results are displayed
**Then** a preview shows the generated subject + body
**And** the user can "Appliquer" to replace current content
**And** the user can "Annuler" to discard

**Given** the LLM API times out (30s)
**When** generation fails
**Then** an error message shows with retry option
**And** the user can proceed manually

**Technical Notes:**
- AI panel below editor (not in toolbar) to avoid overflow
- Expert B2B copywriting prompt with anti-hallucination rules
- Variables in snake_case format: {{first_name}}, {{last_name}}, {{company}}, {{title}}, {{email}}

---

#### Story 4.5: Copilot Email Preview (Mandatory)

As a **user**,
I want **to preview each email before it's scheduled for sending**,
So that **I approve the final version and catch any issues (Copilot mode)**.

**Acceptance Criteria:**

**Given** a user wants to schedule a sequence
**When** they click "Preview & Schedule"
**Then** a preview modal opens showing all emails for sample prospects
**And** variables are rendered with actual prospect data

**Given** a user is in preview mode
**When** they view an email
**Then** they see: subject line, rendered body, recipient info
**And** any warnings (spam, missing variables) are highlighted
**And** they can approve or edit each email

**Given** a user finds an issue in preview
**When** they click "Edit"
**Then** they are taken back to the step editor
**And** changes are saved and preview updates

**Given** all emails pass preview
**When** the user clicks "Approve & Schedule"
**Then** the sequence status changes to "READY"
**And** emails are queued for sending based on schedule

**Given** some emails have warnings
**When** the user tries to approve
**Then** a confirmation dialog shows: "X emails have warnings. Continue anyway?"
**And** user must explicitly acknowledge

**Technical Notes:**
- Preview renders first 5 prospects as samples
- Full batch preview available for larger lists
- No bypass: preview is mandatory before scheduling

---

#### Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)

As a **user**,
I want **the system to warn me about potential spam triggers**,
So that **my emails have the best chance of reaching the inbox**.

**Acceptance Criteria:**

**Given** a user is previewing an email
**When** spam analysis runs
**Then** the system checks for heuristics:
  - Email length (warn if <50 or >500 words)
  - Link count (warn if >3 links)
  - Risky words ("free", "guarantee", "urgent", "act now", etc.)
  - Excessive punctuation (!!!, ???, ALL CAPS)
  - Missing unsubscribe footer (should be auto-added)
  - Multiple images or attachments

**Given** an email has low spam risk
**When** analysis completes
**Then** a green badge shows "✓ Low spam risk"

**Given** an email has medium spam risk
**When** analysis completes
**Then** an amber badge shows "⚠️ Medium risk: [reason]"
**And** warnings are listed with explanations
**And** user can proceed after acknowledgment

**Given** an email has high spam risk
**When** analysis completes
**Then** a red badge shows "⛔ High risk: [reason]"
**And** the "Approve" button requires confirmation: "This email may be flagged as spam. Are you sure?"
**And** user MUST acknowledge to proceed (hard gate in Copilot)

**Given** an email is missing unsubscribe link
**When** analysis runs
**Then** the system flags but notes: "Unsubscribe link will be added automatically"

**Technical Notes:**
- Heuristic scoring (not ML for MVP)
- No auto-rewrite: user must fix manually
- Risk levels: LOW (<30), MEDIUM (30-60), HIGH (>60)

---

#### Story 4.7: Sequence Templates (Save & Duplicate)

As a **user**,
I want **to save sequences as templates and duplicate existing sequences**,
So that **I can reuse successful patterns without starting from scratch**.

**Acceptance Criteria:**

**Given** a user has a sequence they want to reuse
**When** they click "Save as Template"
**Then** the sequence is copied as a template
**And** the template has a name and description field
**And** template is available in "Templates" section

**Given** a user wants to create from template
**When** they click "New from Template"
**Then** they see a list of their saved templates
**And** selecting one creates a new sequence copy
**And** the copy has "(Copy)" appended to the name

**Given** a user wants to duplicate an existing sequence
**When** they click "Duplicate" on a sequence
**Then** a copy is created with all steps and settings
**And** the copy is in DRAFT status

**Given** a user edits a copied sequence
**When** they make changes
**Then** the original is not affected (true copy, no reference)

**Technical Notes:**
- Template model: sequence fields + isTemplate flag
- Deep copy for steps and settings

---

### Epic 5: Campaign Launch & Sending Engine
L'utilisateur peut lancer une campagne (séquence + liste + schedule), contrôler son exécution, et configurer les paramètres d'envoi. Le système envoie les emails automatiquement selon les quotas et guardrails.

**Valeur utilisateur:** Campagnes qui s'exécutent en pilotage automatique avec protection intégrée.

**FRs couverts:** FR21, FR22, FR23, FR24, FR25, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

**Notes techniques:**
- **Campaign entity:** sequence + list + schedule + status (DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED)
- Email Scheduling Pillar: DB queue with idempotency key (unique constraint), job states
- Quotas: hard (MAX_PER_DAY never exceeded) + soft (ramp-up)
- Gmail API: store messageId, threadId, headers for inbox threading
- Pre-launch gating: deliverability, verified-only, copilot preview
- Auto-pause on deliverability anomalies with banner

---

#### Story 5.1: Campaign Entity & Status Model

As a **developer**,
I want **a Campaign entity with proper status lifecycle**,
So that **campaigns can be tracked, controlled, and resumed correctly**.

**Acceptance Criteria:**

**Given** the data model is being designed
**When** Campaign entity is created
**Then** it has fields: id, workspaceId, name, sequenceId, status, createdAt, startedAt, pausedAt, completedAt
**And** status enum: DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED

**Given** a Campaign is created
**When** it's saved
**Then** it starts in DRAFT status
**And** it has a reference to the sequence and prospect list

**Given** a Campaign has associated prospects
**When** the campaign is queried
**Then** a CampaignProspect join table tracks: prospectId, campaignId, enrollmentStatus, currentStep
**And** enrollmentStatus: ENROLLED, PAUSED, COMPLETED, STOPPED, REPLIED

**Technical Notes:**
- Campaign model with Prisma relations
- CampaignProspect for many-to-many with enrollment state
- Indexes on status, workspaceId for efficient queries

---

#### Story 5.2: Campaign Launch Wizard with Pre-Launch Gating

As a **user**,
I want **a guided wizard to launch a campaign with all required checks**,
So that **I don't accidentally send to unverified prospects or without proper setup**.

**Acceptance Criteria:**

**Given** a user wants to launch a campaign
**When** they click "Launch Campaign"
**Then** a wizard opens with steps: Select Sequence → Select Prospects → Review & Launch

**Given** a user is on the sequence selection step
**When** they choose a sequence
**Then** only sequences with status READY are shown (Copilot preview completed)
**And** DRAFT sequences show tooltip: "Complete preview first"

**Given** a user is on the prospect selection step
**When** they select prospects
**Then** ONLY prospects with status VERIFIED are selectable (hard rule)
**And** NOT_VERIFIED and NEEDS_REVIEW are shown grayed with count
**And** if selected list contains "unknown/paid list" source → warning banner

**Given** a user reaches the review step
**When** pre-launch checks run
**Then** gating verifies:
  - ✓ Deliverability onboarding complete (Epic 2)
  - ✓ Gmail connected with valid tokens
  - ✓ Sequence preview approved (Copilot)
  - ✓ All selected prospects are VERIFIED
**And** if ANY check fails, launch button is disabled with reasons

**Given** all checks pass
**When** user clicks "Launch"
**Then** campaign status changes to RUNNING
**And** emails are queued according to schedule
**And** success toast with campaign link

**Technical Notes:**
- Guard function: `lib/guardrails/pre-launch-check.ts`
- Returns { canLaunch: boolean, issues: string[] }

---

#### Story 5.3: Sending Settings Configuration

As a **user**,
I want **to configure sending parameters for my campaigns**,
So that **emails are sent at optimal times with proper personalization**.

**Acceptance Criteria:**

**Given** a user goes to Settings > Sending
**When** they access the configuration
**Then** they can set:
  - Sending window: days (Mon-Sun checkboxes) and hours (9am-6pm slider)
  - Timezone: dropdown with auto-detect default
  - Daily quota: 20-50 slider with ramp-up option
  - From name: text field (default: user's name)
  - Signature: rich text editor

**Given** a user configures sending window
**When** they set Mon-Fri, 9am-6pm
**Then** emails are ONLY scheduled within this window
**And** sending window is applied BEFORE queue scheduling

**Given** a user enables ramp-up
**When** the campaign starts
**Then** day 1: 20 emails, day 2: 30, day 3: 40, then cap at configured quota
**And** ramp-up only progresses if health score is OK

**Given** a user saves settings
**When** settings are applied
**Then** future scheduled emails respect new settings
**And** already-sent emails are not affected

**Technical Notes:**
- SendingSettings model per workspace
- Timezone stored as IANA string (America/New_York, etc.)
- Signature appended to all outgoing emails

---

#### Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)

As a **system**,
I want **a reliable email queue with idempotency guarantees**,
So that **emails are never sent twice and can be retried safely**.

**Acceptance Criteria:**

**Given** a campaign is launched
**When** emails are scheduled
**Then** each email creates a ScheduledEmail record with idempotency key
**And** idempotency key format: `{prospectId}:{sequenceId}:{stepNumber}`
**And** idempotency key has UNIQUE database constraint

**Given** a duplicate scheduling attempt occurs
**When** the same idempotency key already exists
**Then** the insert is rejected (no duplicate)
**And** error is logged for debugging

**Given** a ScheduledEmail is created
**When** it's in the queue
**Then** it has status: SCHEDULED
**And** job state lifecycle: SCHEDULED → SENDING → SENT | FAILED
**And** if FAILED with retryable error: → RETRY_SCHEDULED

**Given** an email fails to send
**When** error is retryable (network, rate limit)
**Then** retry with exponential backoff: 1min, 5min, 15min
**And** max 3 retries before status = PERMANENTLY_FAILED

**Given** non-retryable error (invalid recipient, auth revoked)
**When** failure is detected
**Then** status = PERMANENTLY_FAILED immediately
**And** no retry scheduled

**Given** emails are scheduled
**When** scheduledFor time is calculated
**Then** sending window is applied
**And** random delay 30-90s is added between emails
**And** daily quota is respected

**Technical Notes:**
- ScheduledEmail model with: idempotencyKey (unique), status, scheduledFor, attempts, lastError
- Vercel Cron job every 5 minutes polls SCHEDULED emails

---

#### Story 5.5: Gmail API Email Sending with Threading

As a **system**,
I want **to send emails via Gmail API with proper threading metadata**,
So that **replies can be linked back to campaigns and leads**.

**Acceptance Criteria:**

**Given** a scheduled email is ready to send
**When** the sending worker processes it
**Then** email is sent via Gmail API `users.messages.send`
**And** email includes: to, subject, body, signature, unsubscribe link

**Given** an email is sent successfully
**When** Gmail returns the response
**Then** the following are stored: messageId, threadId
**And** headers stored: Message-ID, Subject, To, Date
**And** ScheduledEmail status = SENT
**And** SentEmail record created with all metadata

**Given** a follow-up email is sent (step 2 or 3)
**When** composing the email
**Then** threadId from step 1 is included (same thread)
**And** In-Reply-To and References headers are set to original messageId

**Given** quota limit is reached
**When** trying to send
**Then** email remains SCHEDULED (not failed)
**And** will be picked up in next cycle when quota resets

**Given** Gmail API returns rate limit error
**When** error is detected
**Then** worker waits and retries with backoff
**And** log records the rate limit event

**Technical Notes:**
- SentEmail model: messageId, threadId, headers JSON, campaignId, prospectId
- Threading enables reply matching in Epic 6
- Hard quota: never exceed MAX_PER_DAY per mailbox

---

#### Story 5.6: Campaign Control (Pause/Resume/Stop Global)

As a **user**,
I want **to pause, resume, or stop a running campaign**,
So that **I can control sending if issues arise**.

**Acceptance Criteria:**

**Given** a campaign is RUNNING
**When** user clicks "Pause"
**Then** campaign status changes to PAUSED
**And** all SCHEDULED emails remain in queue but won't be sent
**And** pause timestamp is recorded

**Given** a campaign is PAUSED
**When** user clicks "Resume"
**Then** campaign status changes to RUNNING
**And** scheduled emails become eligible for sending again
**And** no duplicate emails are created

**Given** a campaign is RUNNING or PAUSED
**When** user clicks "Stop"
**Then** campaign status changes to STOPPED
**And** all SCHEDULED emails are cancelled (status = CANCELLED)
**And** stop is permanent (cannot resume)

**Given** a campaign is STOPPED
**When** user views the campaign
**Then** they see final stats
**And** "Duplicate" option available to create new campaign

**Technical Notes:**
- Pause/resume toggles campaign status
- Stop cascades to cancel all pending ScheduledEmails

---

#### Story 5.7: Individual Lead Control within Campaign

As a **user**,
I want **to pause or stop sending for individual leads within a campaign**,
So that **I can handle specific situations without affecting the entire campaign**.

**Acceptance Criteria:**

**Given** a campaign is running
**When** user views campaign detail page
**Then** they see a list of enrolled prospects with their status
**And** each prospect has actions: Pause, Resume, Stop

**Given** user pauses a specific prospect
**When** pause is confirmed
**Then** CampaignProspect.enrollmentStatus = PAUSED
**And** scheduled emails for this prospect are held
**And** other prospects continue normally

**Given** user resumes a paused prospect
**When** resume is confirmed
**Then** enrollmentStatus = ENROLLED
**And** pending steps continue from where paused

**Given** user stops a prospect
**When** stop is confirmed
**Then** enrollmentStatus = STOPPED
**And** all pending emails for this prospect are cancelled
**And** prospect remains in campaign for reporting

**Given** a prospect replies
**When** reply is detected
**Then** enrollmentStatus automatically = REPLIED
**And** remaining sequence steps are cancelled for this prospect

**Technical Notes:**
- enrollmentStatus: ENROLLED, PAUSED, COMPLETED, STOPPED, REPLIED
- Automatic REPLIED detection in Epic 6

---

#### Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)

As a **system**,
I want **to detect deliverability anomalies and auto-pause campaigns**,
So that **domain reputation is protected automatically**.

**Acceptance Criteria:**

**Given** a campaign is running
**When** bounce rate exceeds 2% (calculated on last 100 emails)
**Then** campaign is automatically paused
**And** user is notified via banner: "Campaign paused: High bounce rate (X%)"
**And** "Why" explanation: bounces indicate invalid emails or spam filtering

**Given** unsubscribe requests spike
**When** unsubscribe rate exceeds 1% in a day
**Then** campaign is paused
**And** banner: "Campaign paused: High unsubscribe rate"

**Given** complaint signals are available (if Postmaster API integrated)
**When** complaint rate exceeds threshold
**Then** campaign is paused with appropriate warning

**Given** complaint signals are NOT available
**When** other proxies indicate issues
**Then** use bounce rate + unsubscribe rate as primary indicators
**And** note: "Complaint data not available, using proxy metrics"

**Given** a campaign is auto-paused
**When** user views the campaign
**Then** they see:
  - Red banner with reason
  - "Why this happened" explanation
  - "Next steps" recommendation (review list, check DNS, contact support)
**And** "Resume" is available after acknowledgment

**Given** user resumes after auto-pause
**When** resume is confirmed
**Then** they must acknowledge the warning
**And** anomaly counters reset

**Technical Notes:**
- Anomaly detection runs after each batch of sends
- Thresholds configurable per workspace (future phase)
- Rolling window for rate calculation

---

### Epic 6: Inbox & Response Management
L'utilisateur peut traiter les réponses reçues dans un inbox unifié avec triage AI automatique et suggestions de réponse.

**Valeur utilisateur:** Traitement inbox efficace en <15 min/jour grâce à l'AI.

**FRs couverts:** FR38, FR39, FR40, FR41, FR42

**Notes techniques:**
- MVP: Gmail cron polling (Pub/Sub = phase 2)
- Conversation model: threadId → prospect, campaign, messages
- LLM classification avec confidence + fallback rules
- Reply threading + signature + audit log

---

#### Story 6.1: Gmail Reply Sync (Cron Polling MVP)

As a **system**,
I want **to poll Gmail for new replies to outbound emails**,
So that **incoming responses are captured and available in the inbox**.

**Acceptance Criteria:**

**Given** a cron job runs every 5 minutes
**When** the polling worker executes
**Then** it queries Gmail API for new messages since last sync
**And** filters to relevant threads (matching SentEmail threadIds)

**Given** a new reply is detected
**When** the message is processed
**Then** it's matched to a SentEmail via threadId
**And** the Conversation and InboxMessage records are created/updated
**And** last sync timestamp is updated

**Given** an email cannot be matched to a campaign
**When** processing completes
**Then** it's stored as "unlinked" for manual review
**And** no auto-classification is attempted

**Given** rate limits are hit
**When** Google API returns 429
**Then** backoff is applied
**And** retry in next cron cycle

**Given** OAuth tokens are invalid
**When** API returns 401
**Then** user is flagged for re-authentication
**And** banner shows in dashboard: "Reconnect Gmail"

**Technical Notes:**
- Use Gmail API `users.messages.list` with `after:` query
- Store lastSyncedAt per workspace
- Phase 2: migrate to Pub/Sub push notifications

---

#### Story 6.2: Conversation Data Model

As a **developer**,
I want **a conversation model linking emails to prospects and campaigns**,
So that **inbox displays coherent thread views with full context**.

**Acceptance Criteria:**

**Given** a new outbound email is sent
**When** SentEmail is created
**Then** a Conversation record is created with: threadId, workspaceId, prospectId, campaignId, sequenceId

**Given** a reply is received
**When** it's matched via threadId
**Then** an InboxMessage record is created linked to the Conversation
**And** message direction is marked: INBOUND or OUTBOUND

**Given** a Conversation exists
**When** it's queried
**Then** all related messages (sent + received) are returned in chronological order
**And** prospect contact info is available
**And** campaign/sequence context is available

**Given** multiple campaigns contact the same prospect
**When** different threads exist
**Then** each thread is a separate Conversation
**And** they can be viewed together on prospect detail page

**Technical Notes:**
- Conversation: id, threadId, workspaceId, prospectId, campaignId, status, lastMessageAt
- InboxMessage: id, conversationId, gmailMessageId, direction, body, receivedAt, classification

---

#### Story 6.3: Unified Inbox UI

As a **user**,
I want **to view all incoming replies in a centralized inbox**,
So that **I can efficiently review and respond to prospects**.

**Acceptance Criteria:**

**Given** a user navigates to the Inbox page
**When** the page loads
**Then** they see a list of conversations with unread count
**And** most recent first (sortable)
**And** skeleton loading during fetch

**Given** a conversation is displayed in the list
**When** viewed
**Then** it shows: prospect name/email, subject, preview, timestamp, classification badge
**And** unread conversations are visually highlighted

**Given** a user clicks on a conversation
**When** the detail panel opens
**Then** they see the full thread: all sent and received messages
**And** messages are displayed in chronological order
**And** prospect info sidebar shows campaign context

**Given** a user has many conversations
**When** they want to filter
**Then** they can filter by: Classification (Interested, Not Now, etc.), Unread, Needs Review, Date range

**Technical Notes:**
- InboxReplyCard component from UX spec
- Keyboard navigation: up/down to browse, Enter to open
- Mark as read on view

---

#### Story 6.4: AI Reply Classification with Confidence

As a **system**,
I want **to automatically classify incoming replies using AI with confidence scoring**,
So that **users can prioritize responses efficiently**.

**Acceptance Criteria:**

**Given** a new reply is received
**When** classification runs
**Then** FIRST apply fallback rules for known patterns:
  - OOO keywords ("out of office", "vacation", "away") → OOO
  - Unsubscribe keywords ("unsubscribe", "remove me", "stop") → UNSUBSCRIBE
  - Bounce patterns (delivery failure, permanent error) → BOUNCE

**Given** fallback rules don't match
**When** LLM classification runs
**Then** the reply is classified as: INTERESTED, NOT_NOW, NEGATIVE, OTHER
**And** a confidence score (0-100) is returned
**And** classification completes in <5s (NFR3)

**Given** LLM confidence is below 70%
**When** classification completes
**Then** message is flagged: "NEEDS_REVIEW"
**And** no auto-actions are triggered
**And** user sees amber badge in inbox

**Given** classification is UNSUBSCRIBE
**When** detected
**Then** prospect is added to suppression list (Epic 8)
**And** sequence is stopped for this prospect

**Given** classification is INTERESTED
**When** the inbox is viewed
**Then** this conversation is prioritized (top of list)
**And** green "INTERESTED" badge is shown

**Technical Notes:**
- Fallback rules run first (cheap, reliable)
- LLM prompt: classify with confidence explanation
- Store classification, confidence, method (RULE|LLM)

---

#### Story 6.5: Manual Reply Reclassification

As a **user**,
I want **to manually correct the AI classification when it's wrong**,
So that **my inbox reflects accurate categorization**.

**Acceptance Criteria:**

**Given** a user views a classified conversation
**When** they disagree with the classification
**Then** they can click "Reclassify" dropdown
**And** select from: INTERESTED, NOT_NOW, NEGATIVE, OOO, UNSUBSCRIBE, BOUNCE, OTHER

**Given** a user changes the classification
**When** they confirm
**Then** the new classification is saved
**And** classification source = MANUAL
**And** original AI classification is preserved in history

**Given** a conversation was NEEDS_REVIEW
**When** user classifies it
**Then** the NEEDS_REVIEW flag is removed
**And** appropriate actions trigger (e.g., UNSUBSCRIBE → suppression list)

**Technical Notes:**
- Store classificationHistory as JSON array
- Reclassification triggers downstream actions if applicable

---

#### Story 6.6: Reply Suggestions with Booking Link

As a **user**,
I want **AI-generated reply suggestions with my booking link included**,
So that **I can respond quickly to interested prospects**.

**Acceptance Criteria:**

**Given** a conversation is classified as INTERESTED
**When** the user views the reply panel
**Then** a suggested reply is displayed
**And** the reply includes the user's configured booking link (from Epic 7)
**And** the suggestion uses context from the conversation

**Given** a conversation is classified as NOT_NOW
**When** the user views the reply panel
**Then** a nurture-style suggestion is shown
**And** booking link is optional

**Given** no booking link is configured
**When** suggestion is generated
**Then** a placeholder shows: "[Add booking link in Settings]"
**And** link to Settings > Integrations

**Given** the user wants a different suggestion
**When** they click "Regenerate"
**Then** a new suggestion is generated (quota: 3 per conversation)
**And** counter shows remaining regenerations

**Technical Notes:**
- Use conversation context in prompt
- Cache suggestions per conversation
- Suggestion is editable before sending

---

#### Story 6.7: Send Reply from Inbox with Threading

As a **user**,
I want **to send replies directly from the inbox**,
So that **I can respond without switching to Gmail**.

**Acceptance Criteria:**

**Given** a user is viewing a conversation
**When** they compose a reply
**Then** they can type in a reply editor below the thread
**And** the suggested reply (if any) is pre-filled but editable
**And** user's signature is appended

**Given** a user sends a reply
**When** the message is dispatched
**Then** it's sent via Gmail API in the same thread (threadId)
**And** proper headers set: In-Reply-To, References
**And** from name uses configured "from-name"
**And** reply is logged in audit trail

**Given** a reply is sent successfully
**When** the operation completes
**Then** the message appears in the conversation thread
**And** InboxMessage is created with direction = OUTBOUND
**And** success toast confirms delivery

**Given** send fails
**When** error occurs
**Then** error message is displayed
**And** user can retry
**And** draft is preserved

**Given** user reviews audit logs
**When** viewing sent replies
**Then** they see: timestamp, to, subject, body preview, campaign context

**Technical Notes:**
- Use Gmail API `users.messages.send` with threadId
- Set Reply-To header if different from From
- Audit log: action = REPLY_SENT, details JSON

---

### Epic 7: Booking Integration & RDV Tracking
L'utilisateur peut intégrer Cal.com/Calendly, tracker les RDV bookés, et célébrer sa première victoire.

**Valeur utilisateur:** 🎉 Premier RDV booké = moment "Aha!" avec célébration visuelle.

**FRs couverts:** FR45, FR46, FR47, FR48, FR54

**Notes techniques:**
- Configuration booking URL (Cal.com ou Calendly)
- Webhook endpoint pour recevoir les confirmations
- Statut lead BOOKED
- CelebrationModal avec Framer Motion pour First RDV

---

#### Story 7.1: Booking Integration Setup (Cal.com/Calendly)

As a **user**,
I want **to configure my booking tool integration**,
So that **prospects can schedule meetings directly from my emails**.

**Acceptance Criteria:**

**Given** a user goes to Settings > Integrations
**When** they access the Booking section
**Then** they see options for: Cal.com, Calendly, Custom URL

**Given** a user selects Cal.com or Calendly
**When** they configure the integration
**Then** they enter their booking link URL
**And** the system validates the URL format
**And** a test link opens in new tab to verify

**Given** a user selects Custom URL
**When** they enter a URL
**Then** any valid URL is accepted
**And** no validation against specific providers

**Given** a booking URL is configured
**When** the user saves
**Then** the URL is stored in workspace settings
**And** success toast confirms: "Booking link saved"
**And** URL is available for insertion in sequences/replies

**Technical Notes:**
- Store bookingUrl, bookingProvider in WorkspaceSettings
- Provider enum: CALENDLY, CAL_COM, CUSTOM

---

#### Story 7.2: Booking Link Insertion in Emails

As a **user**,
I want **to include my booking link in sequence emails and replies**,
So that **interested prospects can easily schedule a meeting**.

**Acceptance Criteria:**

**Given** a user is editing a sequence email
**When** they use the Variables picker
**Then** {{booking_link}} is available as a variable
**And** tooltip shows current configured URL

**Given** {{booking_link}} is used but not configured
**When** the email is previewed
**Then** a warning shows: "⚠️ Booking link not configured"
**And** link to Settings > Integrations

**Given** a booking link is configured
**When** {{booking_link}} is rendered
**Then** the full URL is inserted
**And** the link is clickable in preview

**Given** reply suggestions include booking link
**When** suggestion is generated
**Then** the booking link is automatically included for INTERESTED replies
**And** formatted with a friendly CTA: "Schedule a time: [link]"

**Technical Notes:**
- Add {{booking_link}} to template variables system
- Fallback to empty string with warning if not configured

---

#### Story 7.3: Webhook Endpoint for Booking Confirmation

As a **system**,
I want **to receive booking confirmations via webhook**,
So that **lead status is automatically updated when meetings are scheduled**.

**Acceptance Criteria:**

**Given** the webhook endpoint exists
**When** accessed at `/api/webhooks/booking`
**Then** it accepts POST requests from Cal.com and Calendly

**Given** a valid booking webhook is received
**When** the payload is processed
**Then** the attendee email is extracted
**And** matched to a Prospect in the workspace
**And** CampaignProspect.enrollmentStatus = BOOKED if matched

**Given** the webhook includes meeting details
**When** processing completes
**Then** meeting datetime is stored
**And** conversationId is linked if available
**And** booking is logged in audit trail

**Given** attendee email doesn't match any prospect
**When** processing completes
**Then** booking is stored as "unlinked"
**And** available for manual review

**Given** webhook fails to process
**When** error occurs
**Then** retry is attempted (max 3)
**And** error is logged
**And** webhook returns 500 for provider retry

**Technical Notes:**
- Webhook timeout: 10s (NFR21)
- Verify webhook signature if supported by provider
- Booking model: id, prospectId, email, datetime, provider, raw payload

---

#### Story 7.4: Manual BOOKED Status (Fallback)

As a **user**,
I want **to manually mark a lead as BOOKED when webhook doesn't fire**,
So that **I can track meetings scheduled outside the system**.

**Acceptance Criteria:**

**Given** a user views a prospect detail page
**When** they want to mark a booking
**Then** they see a "Mark as Booked" button

**Given** a user clicks "Mark as Booked"
**When** the modal opens
**Then** they can optionally enter meeting datetime
**And** they can add notes

**Given** a user confirms the booking
**When** saved
**Then** prospect status = BOOKED
**And** any active campaign enrollment is updated
**And** remaining sequence steps are cancelled
**And** audit log records the manual booking

**Given** a prospect is already BOOKED
**When** viewing the detail page
**Then** booking information is displayed
**And** "Edit Booking" option available

**Technical Notes:**
- Manual booking has source = MANUAL vs WEBHOOK
- Both trigger same downstream effects

---

#### Story 7.5: First RDV Celebration 🎉

As a **user**,
I want **to see a celebration when I book my first meeting**,
So that **I feel rewarded for reaching this milestone**.

**Acceptance Criteria:**

**Given** a user has never had a booking before
**When** their first booking is created (webhook or manual)
**Then** a CelebrationModal appears with confetti animation
**And** message: "🎉 Congratulations! You booked your first meeting!"
**And** the modal can be dismissed

**Given** the celebration modal appears
**When** user dismisses it
**Then** `firstBookingCelebrated` flag is set to true
**And** modal will not show again

**Given** a user has already celebrated their first booking
**When** subsequent bookings occur
**Then** no celebration modal appears
**And** standard success toast is shown instead

**Given** the user is on the dashboard
**When** they have their first booking
**Then** a persistent "First RDV 🎉" badge appears
**And** booking count is displayed

**Technical Notes:**
- CelebrationModal component with Framer Motion (UX spec)
- Confetti animation using canvas or CSS
- firstBookingCelebrated stored in workspace

---

### Epic 8: Guardrails & Compliance Core
Le système applique les guardrails non-bypassables et l'utilisateur peut gérer les données pour la conformité RGPD (audit, export, suppression).

**Valeur utilisateur:** Prospection "safe by design" — l'outil refuse de laisser spammer.

**FRs couverts:** FR43, FR44, FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62

**Notes techniques:**
- GuardrailsService centralisé (single source of truth)
- Suppression list globale (unsubscribes)
- Unsubscribe link mandatory dans tous les emails
- Pre-send checks: verified only, dedup, quota
- Audit logs immuables
- DSAR: export data, cascade delete

---

#### Story 8.1: Centralized Guardrails Service (No Send Without Verified)

As a **system**,
I want **a centralized GuardrailsService that enforces all send rules**,
So that **no email is ever sent to an unverified address regardless of the calling code path**.

**Acceptance Criteria:**

**Given** the GuardrailsService is implemented
**When** any code wants to send an email
**Then** it MUST call `GuardrailsService.preSendCheck(prospect, campaign)`
**And** this is the ONLY place where send eligibility is determined

**Given** a prospect has status other than VERIFIED
**When** preSendCheck is called
**Then** the check returns `{ canSend: false, reason: 'NOT_VERIFIED' }`
**And** the email is not sent

**Given** preSendCheck is called
**When** validation runs
**Then** it checks in order:
  1. Prospect status = VERIFIED (hard rule)
  2. Prospect not in suppression list
  3. Prospect not already contacted in this sequence step (dedup)
  4. Daily quota not exceeded
  5. Prospect not BOOKED/REPLIED

**Given** the service is called from different code paths
**When** checks are performed
**Then** the same service is invoked from:
  - Campaign launch wizard (Epic 5.2)
  - Scheduler worker before send (Epic 5.5)
  - Send reply if replying to unverified (Epic 6.7)

**Given** a check fails
**When** the result is returned
**Then** `{ canSend: false, reason: string, details?: object }` is provided
**And** the caller handles appropriately (skip/error/log)

**Technical Notes:**
- `lib/guardrails/pre-send-check.ts` = GuardrailsService
- Export function `preSendCheck(prospect, campaign): PreSendResult`
- All check logic lives here, no duplication

---

#### Story 8.2: Prospect Deduplication (No Duplicate Sends)

As a **system**,
I want **to prevent sending duplicate emails to the same prospect**,
So that **recipients don't receive the same message twice**.

**Acceptance Criteria:**

**Given** an email is about to be scheduled
**When** the idempotency key is generated
**Then** format is `{prospectId}:{sequenceId}:{stepNumber}`
**And** the database has a UNIQUE constraint on this key

**Given** a duplicate scheduling is attempted
**When** the constraint rejects the insert
**Then** the duplicate is silently skipped
**And** no error is thrown to the user
**And** debug log records the duplicate attempt

**Given** a prospect is already in a running campaign for the same sequence
**When** they're added to a new campaign with the same sequence
**Then** a warning shows: "X prospects already in active campaign"
**And** user can choose to skip or include (will be deduped automatically)

**Technical Notes:**
- ScheduledEmail.idempotencyKey with unique index
- Dedup at schedule time, not send time

---

#### Story 8.3: Sending Quota Enforcement

As a **system**,
I want **to enforce daily sending quotas per workspace**,
So that **domain reputation is protected from over-sending**.

**Acceptance Criteria:**

**Given** a workspace has a daily quota configured
**When** emails are scheduled for a day
**Then** no more than MAX_EMAILS_PER_DAY are scheduled
**And** excess emails are scheduled for the next available day

**Given** the scheduler worker runs
**When** it picks emails to send
**Then** it checks `sentTodayCount` vs `dailyQuota`
**And** if quota reached, remaining emails wait for next day

**Given** ramp-up is enabled
**When** a new campaign starts
**Then** day 1 limit = 20, day 2 = 30, day 3 = 40, then normal quota
**And** ramp-up only applied if health score > 80

**Given** quota is exceeded for the day
**When** user tries to send more
**Then** UI shows: "Daily limit reached (X/Y). Remaining emails scheduled for tomorrow."

**Technical Notes:**
- Track sentTodayCount per workspace per day
- Soft quota (schedule for later) vs hard quota (never exceed)

---

#### Story 8.4: Mandatory Unsubscribe Link

As a **system**,
I want **to automatically add an unsubscribe link to every outgoing email**,
So that **recipients can opt-out easily and we remain compliant**.

**Acceptance Criteria:**

**Given** an email is about to be sent
**When** the email body is finalized
**Then** an unsubscribe link is appended at the bottom
**And** format: "Ne plus recevoir ces emails | Unsubscribe"
**And** link points to `/unsubscribe?token={encrypted_token}`

**Given** the user's email already contains an unsubscribe link
**When** the check runs
**Then** the system still adds the standard footer (belt + suspenders)
**And** no duplicate warning for user

**Given** a user previews an email
**When** viewing the preview
**Then** they see the unsubscribe link as it will appear
**And** cannot remove it

**Given** the unsubscribe token
**When** decoded
**Then** it contains: prospectId, workspaceId, campaignId
**And** token expires after 90 days

**Technical Notes:**
- Token = encrypted JSON with AES
- Unsubscribe link added at send time, not in template

---

#### Story 8.5: Unsubscribe Detection & Suppression List

As a **system**,
I want **to detect unsubscribe requests and add contacts to a global suppression list**,
So that **opted-out recipients never receive emails again**.

**Acceptance Criteria:**

**Given** a prospect clicks the unsubscribe link
**When** they land on the unsubscribe page
**Then** they see a confirmation message
**And** they click "Confirm unsubscribe"
**And** processing completes in <1s (NFR26)

**Given** an unsubscribe is confirmed
**When** processing runs
**Then** the prospect's email is added to the workspace suppression list
**And** prospect status = SUPPRESSED
**And** any active campaign enrollment is stopped
**And** all scheduled emails are cancelled
**And** audit log records the unsubscribe

**Given** an email reply contains unsubscribe keywords
**When** classification detects UNSUBSCRIBE (Epic 6.4)
**Then** the same suppression process is triggered
**And** no manual action required

**Given** a suppressed email is attempted in a new campaign
**When** the prospect is selected
**Then** they are automatically excluded
**And** warning shows: "X prospects suppressed (not included)"

**Given** a user views the suppression list
**When** accessing Settings > Suppression List
**Then** they see all suppressed emails with date
**And** they can export the list

**Technical Notes:**
- SuppressionList model: email (global across campaigns), reason, date
- Check suppression list in GuardrailsService.preSendCheck

---

#### Story 8.6: Audit Logs

As a **user**,
I want **to access audit logs for all sending and data actions**,
So that **I have a complete record for compliance and debugging**.

**Acceptance Criteria:**

**Given** any significant action occurs
**When** it's logged
**Then** an AuditLog record is created with: timestamp, action, userId, workspaceId, details JSON
**And** logs are immutable (no updates or deletes)

**Given** actions to log include
**When** checking logged events
**Then** the following are recorded:
  - EMAIL_SENT (to, subject, campaignId)
  - EMAIL_FAILED (reason)
  - PROSPECT_CREATED / DELETED
  - CAMPAIGN_STARTED / PAUSED / STOPPED
  - UNSUBSCRIBE_PROCESSED
  - BOOKING_RECEIVED
  - REPLY_SENT
  - DATA_EXPORTED (DSAR)
  - DATA_DELETED (DSAR)

**Given** a user goes to Settings > Audit Logs
**When** viewing the logs
**Then** they see a filterable, paginated list
**And** can filter by action type, date range
**And** can export as CSV

**Given** audit logs retention
**When** logs age
**Then** logs are retained for 3 years (NFR25)
**And** after 3 years, logs are archived or deleted

**Technical Notes:**
- AuditLog model with timestamp index
- Never delete, only append
- Timestamp stored with timezone

---

#### Story 8.7: DSAR Export & Data Deletion

As a **user**,
I want **to export all my data and request deletion**,
So that **I can comply with GDPR/RGPD requirements for my business**.

**Acceptance Criteria:**

**Given** a user goes to Settings > Privacy & Data
**When** they click "Export My Data"
**Then** a data export job is queued
**And** they receive an email with download link when ready
**And** processing completes within 30 days (NFR23)

**Given** a data export is generated
**When** the export completes
**Then** it includes: all prospects, campaigns, sequences, sent emails, audit logs
**And** format is JSON or CSV (user choice)
**And** download link expires after 7 days

**Given** a user requests data deletion
**When** they click "Delete All My Data"
**Then** a confirmation modal appears with strong warning
**And** user must type "DELETE" to confirm

**Given** deletion is confirmed
**When** the process runs
**Then** cascade delete removes: workspace, all prospects, campaigns, emails, logs
**And** audit log captures "DATA_DELETED" before deletion
**And** completing within 24 hours (NFR24)

**Given** partial deletion is requested (single prospect)
**When** user deletes a prospect
**Then** all related data is cascade deleted
**And** including sent emails, campaign enrollments, conversations

**Technical Notes:**
- Data retention limit: 3 years (NFR25, FR62)
- Soft delete first, hard delete after confirmation period
- Delete job runs async to avoid timeout

---

### Epic 9: Dashboard & Analytics
L'utilisateur peut visualiser ses métriques de performance et la santé de son domaine sur un dashboard clair.

**Valeur utilisateur:** Vue d'ensemble de la performance avec Health Score visible en permanence.

**FRs couverts:** FR49, FR50, FR51, FR52, FR53

**Notes techniques:**
- Metrics MVP: sent, delivered, bounced, replies (by category), booked, healthScore
- Pas d'open/click tracking MVP
- Health Score calculé à partir de signaux concrets + tooltip explicative
- HealthScoreBadge en header permanent
- StatsCards avec skeleton loading

---

#### Story 9.1: Dashboard Stats Cards

As a **user**,
I want **to see key email sending metrics on my dashboard**,
So that **I can understand my campaign performance at a glance**.

**Acceptance Criteria:**

**Given** a user is on the dashboard
**When** the page loads
**Then** they see stats cards for: Emails Sent, Delivered, Bounced, Replied, Booked
**And** each card shows the count and percentage/rate
**And** skeleton loading is shown during fetch

**Given** stats are displayed
**When** viewing the cards
**Then** Sent shows total emails sent
**And** Delivered shows count (no open tracking MVP)
**And** Bounced shows count and % rate
**And** Replied shows total replies
**And** Booked shows total bookings

**Given** a user hovers on a stat card
**When** tooltip appears
**Then** it shows more detail (e.g., "12 bounces out of 200 sent = 6%")

**Given** a user wants to see trends
**When** viewing stats
**Then** simple comparison to last 7 days is shown (↑ or ↓)

**Technical Notes:**
- StatsCards components from UX spec
- Data from aggregated counts in DB
- Dashboard loads in <2s (NFR5)

---

#### Story 9.2: Health Score Calculation & Display

As a **user**,
I want **to see a Health Score that reflects my domain's deliverability status**,
So that **I know if my setup is healthy and what to fix if not**.

**Acceptance Criteria:**

**Given** a user is on the dashboard
**When** the health score section loads
**Then** a HealthScoreBadge displays the current score (0-100)
**And** color-coded: Green (80-100), Amber (50-79), Red (0-49)

**Given** the health score is calculated
**When** the calculation runs
**Then** it uses these concrete inputs:
  - DNS Gate Status: SPF PASS (+20), DKIM PASS (+20), DMARC PASS (+20)
  - Bounce Rate: <2% (+20), 2-5% (+10), >5% (-20)
  - Unsubscribe Rate: <0.5% (+10), 0.5-1% (+5), >1% (-10)
  - Recent Anomaly Auto-Pause: None (+10), Triggered (-20)

**Given** a user hovers on the health score
**When** tooltip appears
**Then** they see "Why this score?" explanation
**And** breakdown of each input with its contribution
**And** e.g., "SPF: ✓ (+20), DKIM: ✓ (+20), Bounce: 1.5% (+20), ..."

**Given** the health score is low
**When** user views details
**Then** they see "Next Steps" recommendations
**And** e.g., "High bounce rate: Review your prospect list quality"
**And** links to relevant settings or help docs

**Given** the health score changes significantly
**When** recalculated
**Then** the change is noted in dashboard
**And** e.g., "Health score dropped 15 points since yesterday"

**Technical Notes:**
- HealthScore calculation in `lib/analytics/health-score.ts`
- Recalculate on demand or every hour
- Store historical scores for trend display

---

#### Story 9.3: Reply Metrics by Classification

As a **user**,
I want **to see reply counts broken down by AI classification**,
So that **I can understand the quality of my responses**.

**Acceptance Criteria:**

**Given** a user views the replies section on dashboard
**When** the data loads
**Then** they see total replies count
**And** breakdown by classification: Interested, Not Now, Negative, OOO, Other

**Given** the breakdown is displayed
**When** viewing the chart/cards
**Then** each category shows count and % of total
**And** Interested is highlighted (most valuable)

**Given** a user clicks on a classification category
**When** the action completes
**Then** they navigate to Inbox filtered by that classification

**Technical Notes:**
- Simple bar chart or stacked cards
- Data aggregated from InboxMessage.classification

---

#### Story 9.4: RDV Metrics Display

As a **user**,
I want **to see my booking metrics prominently displayed**,
So that **I can track my success in converting prospects to meetings**.

**Acceptance Criteria:**

**Given** a user is on the dashboard
**When** viewing booking stats
**Then** they see: Total RDV Booked, Booking Rate (booked / replied)
**And** "First RDV" achievement badge if applicable

**Given** bookings exist
**When** the stats are displayed
**Then** booking rate is calculated as (booked / interested replies) %
**And** shown with trend indicator

**Given** a user has their first booking
**When** viewing dashboard
**Then** a permanent "First RDV 🎉" badge is shown
**And** clicking shows booking details

**Technical Notes:**
- Booking count from Booking model
- Rate calculation uses Interested classification as denominator

---

#### Story 9.5: Header Health Score Badge (Persistent)

As a **user**,
I want **to see my Health Score in the header on every page**,
So that **I'm always aware of my deliverability status**.

**Acceptance Criteria:**

**Given** a user is on any page of the application
**When** the header renders
**Then** a small HealthScoreBadge is visible in the header
**And** shows numeric score with color indicator

**Given** the health score is critical (<50)
**When** viewing the header
**Then** the badge pulses or has attention indicator
**And** tooltip shows "Action needed"

**Given** a user clicks the header health score
**When** the action completes
**Then** they navigate to dashboard health section
**And** full details are visible

**Given** a user's health score changes
**When** the badge updates
**Then** brief animation indicates the change
**And** new score is displayed

**Technical Notes:**
- HealthScoreBadge component from UX spec
- Fetched on app load, cached, updated periodically
- Badge in header layout component

---

## Epic Dependencies

```
Epic 1 (Auth) ──────────────────────────────────► Tous les autres Epics
         │
         ▼
Epic 2 (DNS Gate) ──────────────────────────────► Epic 5 REQUIRES Epic 2 complete
         │
         ▼
Epic 3 (Prospects) ─────────────────────────────► Epic 4, 5 need prospects data
         │
         ▼
Epic 4 (Sequences) ─────────────────────────────► Epic 5 needs sequences to launch
         │
         ▼
Epic 5 (Campaigns) ─────────────────────────────► Epic 6, 7, 8 need sent emails
         │
         ├──────────► Epic 6 (Inbox) ─────────► needs sent emails for replies
         │
         ├──────────► Epic 7 (Booking) ────────► needs replies for booking
         │
         └──────────► Epic 8 (Guardrails) ────► runs alongside sending
         
Epic 9 (Dashboard) ─────────────────────────────► aggregates all data, can be built incrementally
```

**Chaque Epic est autonome:** une fois terminé, il fonctionne seul. Les Epics suivants l'enrichissent mais ne sont pas requis pour le fonctionnement de l'Epic précédent.

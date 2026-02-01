# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeadGen is an email outreach platform built with Next.js 16, featuring prospect management, AI-powered email sequences, campaign orchestration, and Gmail integration. The application uses Supabase for authentication, Prisma with PostgreSQL for data persistence, and Google Gemini AI for email generation.

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server on localhost:3000
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Testing
pnpm test                   # Run all tests with Vitest
pnpm test -- <file-path>    # Run specific test file

# Database
pnpm prisma generate        # Generate Prisma client (runs on postinstall)
pnpm prisma migrate dev     # Create and apply migrations
pnpm prisma studio          # Open Prisma Studio GUI
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Supabase Auth with SSR
- **Styling**: Tailwind CSS v4 + Radix UI components
- **State Management**: TanStack Query (React Query)
- **AI Provider**: Google Gemini 2.0 Flash (via Vertex AI)
- **Testing**: Vitest + Testing Library
- **Email**: Gmail API with OAuth2

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Unauthenticated routes (login)
│   ├── (dashboard)/       # Protected routes (dashboard, prospects, sequences, campaigns, settings)
│   └── api/               # API routes (37 endpoints)
├── components/
│   ├── features/          # Feature-specific components (campaigns, prospects, sequences, etc.)
│   ├── layout/            # Layout components (header, sidebar, nav)
│   ├── shared/            # Shared components across features
│   └── ui/                # Base UI components (shadcn/ui)
├── lib/                   # Business logic and services
│   ├── audit/             # Audit logging service
│   ├── auth/              # Auth actions
│   ├── crypto/            # AES-256-GCM encryption for tokens
│   ├── dns/               # DNS validation (SPF, DKIM, DMARC)
│   ├── dropcontact/       # Enrichment API client
│   ├── email-scheduler/   # Email scheduling and retry logic
│   ├── enrichment/        # Prospect enrichment service
│   ├── gmail/             # Gmail API integration and token management
│   ├── guardrails/        # Campaign validation and safety checks
│   ├── import/            # CSV import and validation
│   ├── llm/               # LLM provider abstraction (Gemini)
│   ├── onboarding/        # Onboarding flow logic
│   ├── prisma/            # Prisma client and mappers
│   ├── prospects/         # Prospect management
│   ├── sequences/         # Sequence logic
│   └── supabase/          # Supabase client utilities
├── hooks/                 # React hooks
├── types/                 # TypeScript type definitions
└── middleware.ts          # Route protection and auth middleware
```

### Key Architectural Patterns

#### Authentication Flow
- Supabase Auth handles user authentication
- `src/middleware.ts` protects routes and redirects based on auth state
- `src/lib/supabase/server.ts` provides server-side Supabase client
- Protected routes: `/dashboard`, `/settings`, etc.
- Auth routes: `/login` (redirects to dashboard if authenticated)

#### Database Access
- Prisma client singleton in `src/lib/prisma/client.ts`
- All database operations go through Prisma
- Soft deletes on prospects (deletedAt field)
- User IDs come from Supabase Auth, synced to Prisma User model

#### Service Layer Organization
Services in `src/lib/` are organized by domain:
- Each service exports functions for specific business logic
- Services use Prisma for data access
- Services are imported by API routes and Server Components

#### Guardrails System
The guardrails system (`src/lib/guardrails/`) prevents invalid campaign launches:
- **Pre-launch checks** (`pre-launch-check.ts`): Validates onboarding, Gmail connection, sequence status, prospect selection
- **Pre-send checks** (`pre-send-check.ts`): Validates before each email send
- **Quota management** (`quota.ts`): Enforces daily sending limits with ramp-up
- **Workspace checks** (`workspace-check.ts`): Validates workspace state
- **Prospect filtering** (`campaign-prospect-filter.ts`): Filters eligible prospects

All guardrails are NON-BYPASSABLE - they must pass before actions proceed.

#### Email Scheduling Architecture
Email scheduling (`src/lib/email-scheduler/`) uses a queue-based system:
- **Idempotency keys**: Prevent duplicate emails (format: `{campaignId}:{prospectId}:{stepNumber}`)
- **Status tracking**: SCHEDULED → SENDING → SENT (or FAILED → RETRY_SCHEDULED)
- **Retry logic** (`retry-handler.ts`): Exponential backoff with max 3 attempts
- **Scheduling** (`schedule-emails.ts`): Respects sending windows, daily quotas, and ramp-up rules

#### LLM Integration
- Provider abstraction in `src/lib/llm/`
- Currently uses Gemini 2.0 Flash via Vertex AI
- Easy to swap providers by changing export in `src/lib/llm/index.ts`
- Used for email generation and opener caching

#### Template Variables System
Template variables (`src/lib/constants/template-variables.ts`) allow dynamic email content:
- Variables like `{{firstName}}`, `{{company}}`, `{{customOpener}}`
- Replaced at send time with prospect data
- Custom openers are AI-generated and cached per prospect/sequence/step

### Domain Model

#### Core Entities
- **User**: Supabase Auth user (ID synced from Supabase)
- **Workspace**: User's workspace containing all data
- **Prospect**: Lead/contact with enrichment data
- **Sequence**: Email sequence with multiple steps
- **SequenceStep**: Individual email in a sequence (subject, body, delay)
- **Campaign**: Instance of a sequence running for selected prospects
- **CampaignProspect**: Enrollment of a prospect in a campaign
- **ScheduledEmail**: Queued email with retry logic
- **OpenerCache**: AI-generated email openers cached per prospect/sequence/step

#### Key Relationships
- Workspace → Prospects, Sequences, Campaigns (one-to-many)
- Sequence → SequenceSteps (one-to-many, max 3 steps)
- Campaign → CampaignProspects → ScheduledEmails (one-to-many)
- Prospect → OpenerCache (one-to-many, cached per sequence/step)

#### Status Enums
- **ProspectStatus**: NEW, ENRICHING, VERIFIED, NOT_VERIFIED, NEEDS_REVIEW, SUPPRESSED, CONTACTED, REPLIED, BOUNCED, UNSUBSCRIBED, BOOKED
- **SequenceStatus**: DRAFT, READY, ARCHIVED
- **CampaignStatus**: DRAFT, RUNNING, PAUSED, COMPLETED, STOPPED
- **EnrollmentStatus**: ENROLLED, PAUSED, COMPLETED, STOPPED, REPLIED
- **ScheduledEmailStatus**: SCHEDULED, SENDING, SENT, FAILED, RETRY_SCHEDULED, PERMANENTLY_FAILED, CANCELLED
- **DnsStatus**: NOT_STARTED, PASS, FAIL, UNKNOWN, MANUAL_OVERRIDE

### Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `NEXT_PUBLIC_APP_URL`: Application URL for OAuth redirects
- `GMAIL_CLIENT_ID`: Google OAuth client ID
- `GMAIL_CLIENT_SECRET`: Google OAuth client secret
- `ENCRYPTION_KEY`: 32-byte hex key for AES-256-GCM encryption

### Important Constraints

#### Sequence Constraints
- Maximum 3 steps per sequence (enforced in UI and validation)
- Steps must have unique order numbers (1, 2, 3)
- Sequences must be in READY status before campaign launch

#### Campaign Constraints
- Cannot launch without completing onboarding (DNS validation)
- Cannot launch without valid Gmail connection
- Cannot launch with unverified sequence
- Daily sending quota: 20-50 emails (configurable per workspace)
- Ramp-up mode gradually increases daily quota

#### Email Sending Constraints
- Respects sending windows (default: 9am-6pm, Mon-Fri)
- Enforces daily quotas with ramp-up
- Uses idempotency keys to prevent duplicates
- Retries failed sends up to 3 times with exponential backoff

### Testing

- Tests use Vitest with jsdom environment
- Setup file: `src/__tests__/setup.ts`
- Test files colocated with source in `src/__tests__/`
- Additional tests in `tests/` directory
- Path alias `@/` resolves to `src/`

### API Routes

37 API routes in `src/app/api/`:
- Authentication: Gmail OAuth flow
- Campaigns: CRUD, launch, schedule, pre-launch checks
- Prospects: CRUD, import, enrichment
- Sequences: CRUD, validation
- Settings: Workspace settings, sending settings
- AI Assistant: Email generation and improvement

### Component Organization

Components follow feature-based organization:
- **features/**: Domain-specific components (campaigns, prospects, sequences, settings)
- **layout/**: App shell components (header, sidebar, navigation)
- **shared/**: Reusable components across features
- **ui/**: Base UI primitives (shadcn/ui components)

### Security Considerations

- Gmail tokens encrypted with AES-256-GCM before storage
- Encryption key must be 32-byte hex string
- Service role key used for server-side Supabase operations
- Middleware protects all dashboard routes
- Audit logging tracks sensitive actions (prospect deletion, campaign launch)

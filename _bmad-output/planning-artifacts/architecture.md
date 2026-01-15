---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/product-brief-LeadGen-2026-01-12.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/research/technical-mvp-architecture-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/market-b2b-prospecting-tools-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/domain-clean-prospecting-compliance-2026-01-12.md"
  - "_bmad-output/analysis/brainstorming-session-2026-01-12.md"
workflowType: 'architecture'
project_name: 'LeadGen'
user_name: 'Alex'
date: '2026-01-13'
status: 'complete'
completedAt: '2026-01-13T10:44:00+01:00'
---

# Architecture Decision Document — LeadGen

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (66 FRs — 11 domaines) :**

| # | Domaine | FRs | Périmètre |
|---|---------|-----|-----------|
| 1 | Auth & Workspace | FR1-4 | Google OAuth, workspace personnel, dashboard, logout |
| 2 | ICP & Prospects | FR5-12 | Définition ICP, import CSV, ajout manuel, enrichissement Dropcontact |
| 3 | Sequence Builder | FR13-20 | Création séquences (3 steps max), templates, variables, LLM opener |
| 4 | Campaign Control | FR21-25 | Launch, pause, resume, stop (global + individuel) |
| 5 | Email Sending | FR26-32 | Gmail OAuth, validation DNS, blocking gate, quotas, auto-pause |
| 6 | Settings | FR33-37 | Sending window, timezone, signature, from-name, safe defaults |
| 7 | Inbox & Responses | FR38-44 | Unified inbox, LLM classification, suggestions, unsubscribe |
| 8 | Booking & RDV | FR45-49 | Integration Cal.com/Calendly, webhook, statut BOOKED |
| 9 | Dashboard | FR50-54 | Metrics (sent, replies, RDV), health score, célébration 1er RDV |
| 10 | Guardrails | FR55-62 | No unverified, dedup, quotas, unsubscribe link, audit, DSAR, retention |
| 11 | Onboarding | FR63-66 | Checklist deliverability, tutorial DNS, validation SPF/DKIM/DMARC |

**Non-Functional Requirements (26 NFRs — 6 catégories) :**

| Catégorie | NFRs Clés |
|-----------|-----------|
| **Performance** | Actions <500ms, preview LLM <3s, classification <5s, dashboard <2s |
| **Security** | OAuth tokens AES-256, HTTPS TLS 1.3, session timeout 24h, rate limit 100 req/min |
| **Scalability** | 50 users concurrents MVP, 10K emails/jour plateforme, schema multi-tenant ready |
| **Accessibility** | WCAG 2.1 AA, keyboard nav, screen reader (ARIA) |
| **Integration** | Gmail retry exponential backoff, Dropcontact fallback, webhook timeout 10s, LLM timeout 30s |
| **Compliance** | DSAR <30j, deletion <24h, audit logs 3 ans, opt-out immédiat |

### Scale & Complexity Assessment

| Indicateur | Évaluation |
|------------|------------|
| **Domaine technique** | Full-Stack SaaS B2B |
| **Niveau de complexité** | **Moyenne-Haute** |
| **Multi-tenancy** | Préparé MVP (workspaceId), RLS Phase 2 |
| **Real-time features** | Gmail watch + Pub/Sub, inbox updates |
| **Regulatory compliance** | RGPD critique (Dropcontact audité CNIL, DSAR, audit) |
| **Integration complexity** | 5 APIs externes (Gmail, Dropcontact, Gemini, Cal.com, Postmaster) |
| **User interaction** | Medium-High (Copilot preview, inbox triage, wizard DNS) |
| **Data complexity** | Moderate (prospects, sequences, emails, audit logs) |

**Composants architecturaux estimés :** ~15-20 modules/services

### Technical Constraints & Dependencies

| Contrainte | Source | Impact Architectural |
|------------|--------|---------------------|
| **Gmail API OAuth** | FR26-32 | Gestion tokens refresh, scopes `gmail.send`, `gmail.readonly`, `gmail.modify` |
| **Gmail API Limits** | Technical Research | 2,000 emails/jour hard, 50/jour heuristique cold, quotas DB-based |
| **Gmail Push via Pub/Sub** | Technical Research | Setup GCP Pub/Sub, history.list polling, watch renewal 7j |
| **No spam complaints webhook** | Technical Research | Postmaster Tools monitoring, multi-signal approach |
| **DNS Validation** | FR27-28, FR63-65 | Validation externe SPF/DKIM/DMARC, polling status, blocking gate |
| **Dropcontact Async** | FR11-12 | Job queue enrichissement, retry logic, source tracking |
| **LLM Latency** | NFR2-3 | Preview <3s, classification <5s, timeout 30s avec fallback |
| **Vercel Cron Granularity** | Technical Research | 5 min minimum, DB-based job queue pour finer control |
| **No BullMQ Pro MVP** | Technical Research | Group rate limiting via DB, pas Redis obligatoire |

### Cross-Cutting Concerns

| Concern | Modules Impactés | Pattern Recommandé |
|---------|-----------------|-------------------|
| **Guardrails Non-Bypassables** | Tous modules sending | Middleware validation, pre-send checks |
| **Audit Logging** | Envoi, opt-out, DSAR, suppression | AuditLog table, événements immutables |
| **Source Attribution** | Import, enrichissement, sending | `source` field obligatoire, provenance tracée |
| **Health Score** | Dashboard, sending, alertes | Calcul temps-réel depuis bounces/complaints |
| **Copilot Mode** | Sequences, sending | Validation humaine obligatoire, preview UX |
| **workspaceId Isolation** | Tous modules data | Foreign key, index, RLS préparé |
| **Idempotency** | Email sending | Unique key `prospect:sequence:step`, anti-double-send |
| **Rate Limiting** | API, sending | DB-based quotas, delay random entre emails |

### UX → Architecture Implications

| Pattern UX (UX Spec) | Besoin Technique |
|---------------------|-----------------|
| **Email Preview Copilot** | Template rendering + LLM generation <3s |
| **Inbox Triage AI** | LLM classification async, 4 catégories (Interested/Not Now/Negative/OOO) |
| **DNS Wizard Onboarding** | External DNS validation, polling, step-by-step UI |
| **Health Score Badge** | Real-time calcul, couleurs (vert/amber/rouge), header permanent |
| **Celebration Modal** | State tracking "firstRDVBooked", Framer Motion animations |
| **Keyboard Shortcuts (⌘K)** | Command palette, client-side routing |
| **Skeleton Loading** | Shimmer states pour async operations |
| **Toast Notifications** | Bottom-right, non-blocking, success/error/warning |

---

## Starter Template Evaluation

### Primary Technology Domain

**Full-Stack SaaS B2B** basé sur l'analyse des exigences :
- Frontend web responsive (Next.js App Router)
- Backend API serverless (Next.js API Routes)
- Database PostgreSQL managée (Supabase)
- Intégrations externes multiples (Gmail, Dropcontact, Gemini, Cal.com)

### Starter Options Considered

| Starter | Version | Inclut | Manque | Évaluation |
|---------|---------|--------|--------|------------|
| **create-next-app** | 16.1.1 | Next.js, TypeScript, Tailwind, ESLint, Turbopack | Prisma, Auth, shadcn/ui | ✅ Flexible, léger |
| **create-t3-app** | 7.40.0 | Next.js, TypeScript, Tailwind, Prisma, tRPC | shadcn/ui, Supabase Auth | ⚠️ tRPC non nécessaire |

### Selected Starter: `create-next-app` + Configuration Manuelle

**Rationale for Selection:**

1. **Simplicité** — Moins de dépendances = moins de maintenance, onboarding dev plus rapide
2. **Compatibilité Supabase** — T3 utilise NextAuth par défaut, nous utilisons Supabase Auth
3. **Pas de tRPC** — Les API Routes simples + React Query suffisent pour notre scope
4. **shadcn/ui** — Configuration plus propre depuis un projet vanilla
5. **Control** — Choix explicites plutôt que defaults opinionated

**Initialization Command:**

```bash
npx create-next-app@latest leadgen \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --use-pnpm
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.x avec strict mode
- Node.js runtime (Vercel serverless)
- ES Modules

**Styling Solution:**
- Tailwind CSS 3.x avec PostCSS
- CSS variables pour theming
- shadcn/ui (à ajouter manuellement)

**Build Tooling:**
- Turbopack (dev) / Webpack (prod)
- Next.js App Router avec Server Components
- Optimisation automatique images/fonts

**Code Organization:**
```
src/
├── app/              # App Router pages + layouts
│   ├── (auth)/       # Auth group routes
│   ├── (dashboard)/  # Protected routes
│   └── api/          # API Routes
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   └── features/     # Feature components
├── lib/              # Utilities, clients
├── hooks/            # Custom hooks
├── types/            # TypeScript types
└── styles/           # Global styles
```

**Development Experience:**
- Hot Module Replacement (Turbopack)
- TypeScript type checking
- ESLint avec Next.js ruleset
- Import alias `@/*`

### Post-Initialization Setup Required

```bash
# 1. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card form input dialog toast # etc.

# 2. Supabase
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr

# 3. Prisma ORM
pnpm add prisma @prisma/client
npx prisma init

# 4. State Management
pnpm add @tanstack/react-query

# 5. Animations
pnpm add framer-motion

# 6. Utilities
pnpm add zod date-fns
```

> **Note:** Project initialization using this command should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ✅ Database & ORM: Supabase PostgreSQL + Prisma
- ✅ Authentication: Supabase Auth (Google OAuth)
- ✅ Email Sending: Gmail API OAuth
- ✅ Email Scheduling: DB queue + worker loop + idempotency (pillar)
- ✅ LLM Provider: Gemini 2.0 Flash with abstraction layer

**Important Decisions (Shape Architecture):**
- ✅ Multi-tenant Schema: workspaceId + FK (MVP) → RLS (Phase 2)
- ✅ Validation: Zod runtime validation
- ✅ Error Handling: HTTP status + structured JSON + Error Boundaries
- ✅ Monitoring: Sentry + Vercel logs

**Deferred Decisions (Post-MVP):**
- Redis / BullMQ (trigger: >1000 emails/day)
- Multi-inbox support (trigger: user demand)
- Advanced analytics dashboards
- LinkedIn Chrome extension

### Data Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Database** | Supabase PostgreSQL | 15.x | Managed, auth intégré, RLS préparé |
| **ORM** | Prisma | 5.x | Type-safe, migrations, introspection |
| **Data Validation** | Zod | 3.x | Runtime + TS inference, React Hook Form compatible |
| **Caching** | None MVP | — | Supabase connection pooling suffisant |
| **Multi-tenant** | workspaceId + FK | — | Simple MVP, index optimisé, RLS Phase 2 |

**Schema Multi-Tenant Pattern:**
```
┌─────────────────────────────────────────────────┐
│  MVP: workspaceId Column + Foreign Key          │
├─────────────────────────────────────────────────┤
│  - Chaque table contient `workspaceId`          │
│  - Index sur workspaceId pour perf              │
│  - WHERE clause systématique                    │
│  - Pas de RLS = debug plus simple               │
└────────────────────────┬────────────────────────┘
                         │ Phase 2
                         ▼
┌─────────────────────────────────────────────────┐
│  Phase 2: Supabase Row-Level Security           │
├─────────────────────────────────────────────────┤
│  - Policies RLS par workspace                   │
│  - Multi-user workspace support                 │
│  - Isolation forte des données                  │
└─────────────────────────────────────────────────┘
```

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth Provider** | Supabase Auth | Intégré, Google OAuth natif, session management |
| **OAuth Provider** | Google | Users ont Gmail pour envoyer, SSO logique |
| **Token Storage** | Supabase secure + AES-256 | Gmail tokens chiffrés at-rest |
| **Session** | Cookie-based (Supabase SSR) | Secure, httpOnly, SameSite |
| **Authorization** | Middleware + workspaceId check | Chaque route vérifie appartenance |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Style** | REST via Next.js API Routes | Simple, bien supporté, pas besoin de GraphQL |
| **Error Response** | Structured JSON | `{ success, data?, error?: { code, message, details } }` |
| **HTTP Codes** | Standard REST | 200, 201, 400, 401, 403, 404, 429, 500 |
| **Error UI** | Error Boundaries | Composants React pour errors non-recoverable |
| **Rate Limiting** | 100 req/min per user | Middleware, DB-based counter |

**Standard Error Response:**
```typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };
```

### Email Scheduling Architecture (Pillar)

> ⚠️ **Pilier produit** — Cette architecture est centrale à la fiabilité du système.

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Trigger** | Vercel Cron (5 min) | Simple, gratuit, suffisant MVP |
| **Queue** | DB-based (Prisma) | Pas de Redis obligatoire |
| **Worker** | API Route `/api/cron/send-emails` | Pooled execution |
| **Idempotency** | Unique key `prospect:sequence:step` | Anti-double-send |
| **Scheduling** | `scheduledAt` datetime column | Précision minute |

**Email Sending Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL SCHEDULING PILLAR                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Vercel Cron (every 5 min)                                 │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Worker Loop                                          │   │
│   │ 1. SELECT emails WHERE scheduledAt <= NOW()          │   │
│   │    AND status = 'PENDING'                            │   │
│   │    AND idempotencyKey NOT IN sent_log                │   │
│   │ 2. For each (with delay random 30-90s):              │   │
│   │    a. Check guardrails (quota, domain, etc.)         │   │
│   │    b. Generate idempotency key                       │   │
│   │    c. INSERT sent_log (key, timestamp)               │   │
│   │    d. Send via Gmail API                             │   │
│   │    e. UPDATE status = 'SENT'                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   Idempotency Key Format: {prospectId}:{sequenceId}:{step}  │
│   Garantie: même email jamais envoyé 2 fois                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### LLM Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Provider MVP** | Gemini 2.0 Flash | Coût optimal (~$0.10/1K), qualité FR OK |
| **Abstraction** | LLM Adapter interface | Switch facile vers GPT/Claude/Mistral |
| **Timeout** | 30s avec fallback | Éviter blocage UI |
| **Caching** | Prompt template caching | Réduire coûts répétitifs |

**LLM Adapter Pattern:**
```typescript
interface LLMProvider {
  generateEmail(context: EmailContext): Promise<string>;
  classifyReply(email: string): Promise<ReplyCategory>;
  suggestResponse(thread: EmailThread): Promise<string>;
}

// MVP: GeminiProvider implements LLMProvider
// Phase 2: OpenAIProvider, MistralProvider, RoutingProvider
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | TanStack Query | Cache, mutations, invalidation |
| **Forms** | React Hook Form + Zod | Validation intégrée, perf |
| **Components** | shadcn/ui | Copié, customisable, accessible |
| **Animations** | Framer Motion | Celebrations, transitions |
| **Icons** | Lucide React | Consistent, tree-shakable |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hosting** | Vercel | DX, preview deployments, edge |
| **Database** | Supabase (managed) | Intégré, backups auto |
| **Error Tracking** | Sentry (free tier) | Source maps, alerting |
| **Logging** | Vercel logs + structured JSON | Simple, searchable |
| **CI/CD** | Vercel Git integration | Auto-deploy on push |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project init (create-next-app + deps)
2. Database schema (Prisma + Supabase)
3. Auth (Supabase Auth + protected routes)
4. Core CRUD (prospects, sequences)
5. Email scheduling (pillar)
6. LLM integration (adapter pattern)
7. Guardrails middleware
8. Dashboard + inbox

**Cross-Component Dependencies:**
```
Auth ──────────► All protected routes
                      │
workspaceId ◄─────────┤
                      │
Guardrails ◄──────────┤
     │                │
     ▼                ▼
Email Scheduler    LLM Adapter
     │                │
     └────────┬───────┘
              ▼
         Audit Logging
```

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Objectif :** Garantir que tous les agents IA (et développeurs) produisent du code compatible et cohérent.

**Points de conflit potentiels identifiés :** 15+ zones où des choix différents pourraient créer des incompatibilités.

### Naming Patterns

#### Database Naming (Prisma/PostgreSQL)

| Élément | Convention DB | Convention Prisma | Exemple |
|---------|---------------|-------------------|---------|
| Tables | `snake_case` pluriel | `PascalCase` + `@@map` | `Prospect` → `@@map("prospects")` |
| Colonnes | `snake_case` | `camelCase` + `@map` | `workspaceId` → `@map("workspace_id")` |
| Foreign Keys | `{table_singular}_id` | `{model}Id` + `@map` | `prospectId` → `@map("prospect_id")` |
| Index | `idx_{table}_{columns}` | Prisma auto | `idx_prospects_workspace_id` |
| Enums | `snake_case` en DB | `PascalCase` en TS | `ProspectStatus` → `prospect_status` |

**Prisma Model Pattern :**
```prisma
model Prospect {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  email       String
  status      ProspectStatus @default(NEW)
  createdAt   DateTime @default(now()) @map("created_at")
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@map("prospects")
  @@index([workspaceId])
}
```

#### API Naming (Next.js Routes)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Routes | `/api/{resource}` pluriel | `/api/prospects`, `/api/sequences` |
| Actions | Verbe si action spécifique | `/api/prospects/[id]/enrich` |
| Nested | Resource parent/child | `/api/sequences/[id]/steps` |
| Cron | `/api/cron/{job-name}` | `/api/cron/send-emails` |
| Webhooks | `/api/webhooks/{provider}` | `/api/webhooks/booking` |

> ⚠️ **workspaceId : JAMAIS en query param côté client.** Déduit depuis la session Supabase côté API. Sécurité multi-tenant.

#### Code Naming (TypeScript)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | `PascalCase.tsx` | `ProspectCard.tsx`, `EmailPreview.tsx` |
| Fichiers utils | `kebab-case.ts` | `email-helpers.ts`, `date-utils.ts` |
| Fichiers hooks | `use-{name}.ts` | `use-prospects.ts`, `use-auth.ts` |
| Fonctions | `camelCase` | `getProspects()`, `validateEmail()` |
| Types/Interfaces | `PascalCase` | `Prospect`, `EmailSequence`, `ApiResponse<T>` |
| Variables | `camelCase` | `prospectList`, `isLoading` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_EMAILS_PER_DAY`, `API_TIMEOUT_MS` |
| Route handlers | `route.ts` | `app/api/prospects/route.ts` |

### Structure Patterns

#### Project Organization

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Routes publiques (login, signup)
│   │   └── login/page.tsx
│   ├── (dashboard)/             # Routes protégées (layout avec sidebar)
│   │   ├── layout.tsx           # Dashboard layout + auth check
│   │   ├── page.tsx             # Dashboard home
│   │   ├── prospects/
│   │   ├── sequences/
│   │   ├── inbox/
│   │   └── settings/
│   └── api/                     # API Routes
│       ├── prospects/
│       │   ├── route.ts         # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts     # GET one, PUT update, DELETE
│       │       └── enrich/route.ts
│       ├── sequences/
│       ├── cron/                # Cron jobs (Vercel)
│       │   ├── send-emails/route.ts
│       │   └── sync-inbox/route.ts
│       └── webhooks/            # Webhooks externes
│           └── booking/route.ts
├── components/
│   ├── ui/                      # shadcn/ui (généré, ne pas modifier)
│   ├── features/                # Composants métier par feature
│   │   ├── prospects/
│   │   │   ├── ProspectCard.tsx
│   │   │   ├── ProspectList.tsx
│   │   │   └── ProspectForm.tsx
│   │   ├── sequences/
│   │   └── inbox/
│   └── shared/                  # Composants réutilisables cross-feature
│       ├── HealthScoreBadge.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── prisma/
│   │   ├── client.ts            # Prisma instance
│   │   └── mappers.ts           # ⚠️ Centralized JSON mapping
│   ├── llm/
│   │   ├── types.ts             # LLMProvider interface
│   │   ├── gemini.ts            # Gemini implementation
│   │   └── index.ts             # Export active provider
│   ├── gmail/
│   │   ├── client.ts            # Gmail API wrapper
│   │   └── types.ts
│   └── utils/
│       ├── api-response.ts      # ApiResponse<T> helpers
│       ├── date-utils.ts
│       └── validation.ts
├── hooks/
│   ├── use-prospects.ts
│   ├── use-sequences.ts
│   ├── use-auth.ts
│   └── use-toast.ts             # shadcn toast wrapper
├── types/
│   ├── api.ts                   # ApiResponse, ApiError
│   ├── prospect.ts
│   ├── sequence.ts
│   └── index.ts                 # Re-exports
└── __tests__/
    ├── unit/
    │   ├── validation.test.ts
    │   ├── quota-check.test.ts
    │   └── dedup-logic.test.ts
    └── integration/
        ├── import-csv.test.ts
        ├── schedule-send.test.ts
        └── inbox-classify.test.ts
```

#### File Structure Rules

| Règle | Convention |
|-------|------------|
| **Tests** | `__tests__/` à la racine, organisés par type (unit/integration) |
| **Config** | Racine projet (`next.config.js`, `tailwind.config.ts`) |
| **Env** | `.env.local` (dev), `.env.production` (prod, non commité) |
| **Prisma** | `prisma/schema.prisma` à la racine |
| **Types générés** | `node_modules/.prisma/client` (auto) |

### Format Patterns

#### API Response Structure

**Standard Response Type :**
```typescript
// lib/types/api.ts
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

interface ApiError {
  code: string;           // "PROSPECT_NOT_FOUND"
  message: string;        // User-friendly message
  details?: unknown;      // Debug info (dev only)
}
```

**Response Helper :**
```typescript
// lib/utils/api-response.ts
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function error(code: string, message: string, details?: unknown): ApiResponse<never> {
  return { success: false, error: { code, message, details } };
}
```

**HTTP Status Codes :**

| Code | Usage | Exemple |
|------|-------|---------|
| 200 | GET success, PUT/PATCH success | Prospect récupéré |
| 201 | POST creation | Prospect créé |
| 400 | Validation error | Email invalide |
| 401 | Non authentifié | Session expirée |
| 403 | Non autorisé (workspace) | Accès autre workspace |
| 404 | Ressource not found | Prospect inexistant |
| 429 | Rate limit exceeded | 100 req/min dépassé |
| 500 | Server error | Exception non gérée |

#### JSON Field Transformation

> ⚠️ **Transformation centralisée obligatoire** — Ne pas mapper manuellement dans chaque route.

```typescript
// lib/prisma/mappers.ts
import { Prospect as PrismaProspect } from '@prisma/client';
import { Prospect } from '@/types/prospect';

export function mapProspect(prisma: PrismaProspect): Prospect {
  return {
    id: prisma.id,
    workspaceId: prisma.workspaceId,
    firstName: prisma.firstName,
    lastName: prisma.lastName,
    email: prisma.email,
    status: prisma.status,
    createdAt: prisma.createdAt.toISOString(),
  };
}

// Usage dans route.ts
const prospects = await prisma.prospect.findMany({ where: { workspaceId } });
return success(prospects.map(mapProspect));
```

**Dates :** Toujours ISO 8601 strings en JSON (`"2026-01-13T10:34:04Z"`).

### Communication Patterns

#### TanStack Query Keys

```typescript
// Conventions de query keys
['prospects', workspaceId]                      // Liste tous
['prospects', workspaceId, prospectId]          // Détail un
['prospects', workspaceId, 'count']             // Agrégation

['sequences', workspaceId]                      
['sequences', workspaceId, sequenceId]          
['sequences', workspaceId, sequenceId, 'steps'] 

['inbox', workspaceId]                          
['inbox', workspaceId, 'unread']                // Filtre
['inbox', workspaceId, emailId]                 

['dashboard', workspaceId, 'stats']             // Métriques
['health-score', workspaceId]                   // Health score
```

#### Mutation Pattern

```typescript
// hooks/use-prospects.ts
export function useCreateProspect() {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();
  
  return useMutation({
    mutationFn: (data: CreateProspectInput) => 
      fetch('/api/prospects', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects', workspaceId]);
      toast.success('Prospect ajouté');
    },
    onError: (error: ApiError) => {
      toast.error('Erreur', { description: error.message });
    }
  });
}
```

### Process Patterns

#### Error Handling Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: API Route                                          │
│ - Try/catch autour de la logique                            │
│ - Log avec console.error + contexte                         │
│ - Return ApiResponse<never> avec code approprié             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: React Hook (useMutation/useQuery)                  │
│ - onError callback                                          │
│ - Toast notification pour erreurs user-facing               │
│ - Pas de throw (géré par TanStack)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Error Boundary (UI)                                │
│ - Capture erreurs React non catchées                        │
│ - Affiche UI fallback friendly                              │
│ - Report à Sentry                                           │
└─────────────────────────────────────────────────────────────┘
```

#### Toast Patterns

```typescript
// Success
toast.success("Prospect ajouté");
toast.success("Email programmé", { description: "Envoi prévu à 9h00" });

// Error
toast.error("Erreur d'enrichissement", { description: error.message });

// Warning (action needed)
toast.warning("Quota proche", { description: "8/10 emails envoyés aujourd'hui" });

// Info
toast.info("Enrichissement en cours...");
```

### Testing Patterns (MVP Baseline)

#### Unit Tests (Vitest)

**Cibles prioritaires :**
- Validation logic (Zod schemas)
- Quota calculation
- Dedup logic (email, domain)
- Idempotency key generation
- Date/timezone utilities

```typescript
// __tests__/unit/quota-check.test.ts
import { checkDailyQuota, canSendEmail } from '@/lib/utils/quota';

describe('Quota Check', () => {
  it('should allow send when under daily limit', () => {
    expect(canSendEmail({ sent: 40, limit: 50 })).toBe(true);
  });
  
  it('should block send when at daily limit', () => {
    expect(canSendEmail({ sent: 50, limit: 50 })).toBe(false);
  });
});
```

#### Integration Tests (Vitest + MSW)

**Routes critiques MVP :**
- Import CSV prospects
- Schedule send (idempotency)
- Inbox classification LLM
- Guardrails pre-send check

```typescript
// __tests__/integration/schedule-send.test.ts
import { POST } from '@/app/api/cron/send-emails/route';

describe('Email Scheduler', () => {
  it('should not send duplicate emails (idempotency)', async () => {
    // First call: should send
    const res1 = await POST(mockRequest);
    expect(res1.json().data.sent).toBe(1);
    
    // Second call: should skip (already sent)
    const res2 = await POST(mockRequest);
    expect(res2.json().data.skipped).toBe(1);
  });
});
```

### Enforcement Guidelines

#### Tous les agents IA DOIVENT :

1. ✅ Utiliser les conventions de nommage **exactes** documentées ci-dessus
2. ✅ Placer les fichiers dans les dossiers **appropriés** selon la structure
3. ✅ Retourner `ApiResponse<T>` pour **toutes** les routes API
4. ✅ Utiliser les **query keys standardisés** TanStack
5. ✅ **Ne jamais passer workspaceId** en query param côté client
6. ✅ Utiliser les **mappers centralisés** pour transformation JSON
7. ✅ Logger les erreurs avec `console.error` + contexte

#### Anti-Patterns à Éviter

| ❌ Anti-Pattern | ✅ Pattern Correct |
|----------------|-------------------|
| `api.get('/users?workspaceId=123')` | workspaceId depuis session |
| Mapping JSON dans chaque route | `mappers.ts` centralisé |
| Tables en camelCase DB | snake_case DB + @@map Prisma |
| Fichiers `.test.ts` co-localisés | `__tests__/` à la racine |
| Query keys ad-hoc | Keys standardisés documentés |
| `throw new Error()` dans routes | `return error(code, message)` |

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
leadgen/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── vitest.config.ts
├── components.json              # shadcn/ui config
├── .env.local                   # Dev secrets (non commité)
├── .env.example                 # Template variables
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── sentry.client.config.ts      # Sentry browser
├── sentry.server.config.ts      # Sentry server
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint + type-check + test
│       └── deploy-preview.yml   # Vercel preview
├── prisma/
│   ├── schema.prisma            # Complete schema
│   ├── seed.ts                  # Test data seeding
│   └── migrations/              # DB migrations
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       └── images/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing/redirect
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx  # OAuth callback
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Sidebar + auth check
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── prospects/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── import/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sequences/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── inbox/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── icp/page.tsx
│   │   │   │   ├── sending/page.tsx
│   │   │   │   └── integrations/page.tsx
│   │   │   └── onboarding/
│   │   │       └── dns/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── gmail/route.ts
│   │       ├── prospects/
│   │       │   ├── route.ts
│   │       │   ├── import/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── enrich/route.ts
│   │       ├── sequences/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── steps/route.ts
│   │       │       └── generate/route.ts
│   │       ├── inbox/
│   │       │   ├── route.ts
│   │       │   ├── sync/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── classify/route.ts
│   │       │       └── suggest/route.ts
│   │       ├── dashboard/
│   │       │   ├── stats/route.ts
│   │       │   └── health-score/route.ts
│   │       ├── settings/
│   │       │   └── route.ts
│   │       ├── cron/
│   │       │   ├── send-emails/route.ts
│   │       │   ├── sync-inbox/route.ts
│   │       │   └── cleanup/route.ts
│   │       └── webhooks/
│   │           └── booking/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui (généré)
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── LoginButton.tsx
│   │   │   ├── prospects/
│   │   │   │   ├── ProspectCard.tsx
│   │   │   │   ├── ProspectList.tsx
│   │   │   │   ├── ProspectForm.tsx
│   │   │   │   └── ImportWizard.tsx
│   │   │   ├── sequences/
│   │   │   │   ├── SequenceBuilder.tsx
│   │   │   │   ├── StepEditor.tsx
│   │   │   │   ├── TemplateEditor.tsx
│   │   │   │   └── EmailPreview.tsx
│   │   │   ├── inbox/
│   │   │   │   ├── InboxList.tsx
│   │   │   │   ├── EmailThread.tsx
│   │   │   │   ├── ReplyCard.tsx
│   │   │   │   └── ClassificationBadge.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── HealthScoreBadge.tsx
│   │   │   │   └── CelebrationModal.tsx
│   │   │   └── onboarding/
│   │   │       └── DNSWizard.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client (cookies)
│   │   │   └── middleware.ts    # ⚠️ Auth gating ONLY
│   │   ├── prisma/
│   │   │   ├── client.ts        # Singleton instance
│   │   │   └── mappers.ts       # Centralized JSON mapping
│   │   ├── llm/
│   │   │   ├── types.ts         # LLMProvider interface
│   │   │   ├── gemini.ts        # Gemini implementation
│   │   │   └── index.ts         # Export active provider
│   │   ├── gmail/
│   │   │   ├── client.ts        # Gmail API wrapper
│   │   │   ├── types.ts
│   │   │   └── pubsub.ts        # Watch/Pub/Sub handling
│   │   ├── enrichment/
│   │   │   ├── dropcontact.ts   # Dropcontact API
│   │   │   └── types.ts
│   │   ├── booking/
│   │   │   ├── calcom.ts        # Cal.com integration
│   │   │   └── types.ts
│   │   ├── guardrails/
│   │   │   ├── quota.ts         # Daily quota check
│   │   │   ├── domain-cap.ts    # Domain rate limiting
│   │   │   ├── dedup.ts         # Email deduplication
│   │   │   ├── pre-send-check.ts # All pre-send validations
│   │   │   └── workspace-check.ts # ⚠️ Workspace ownership
│   │   ├── audit/
│   │   │   └── logger.ts        # Audit log events
│   │   └── utils/
│   │       ├── api-response.ts  # success(), error() helpers
│   │       ├── date-utils.ts
│   │       ├── dns-check.ts     # SPF/DKIM/DMARC validation
│   │       ├── email-footer.ts  # Unsubscribe link
│   │       ├── template-variables.ts
│   │       └── validation.ts    # Zod schemas
│   ├── hooks/
│   │   ├── use-prospects.ts
│   │   ├── use-sequences.ts
│   │   ├── use-inbox.ts
│   │   ├── use-dashboard.ts
│   │   ├── use-auth.ts
│   │   ├── use-workspace.ts     # Get workspaceId from session
│   │   └── use-toast.ts
│   ├── types/
│   │   ├── api.ts               # ApiResponse, ApiError
│   │   ├── prospect.ts
│   │   ├── sequence.ts
│   │   ├── email.ts
│   │   ├── inbox.ts
│   │   └── index.ts             # Re-exports
│   ├── middleware.ts            # ⚠️ Auth gating + redirect ONLY
│   └── styles/
│       └── globals.css
└── __tests__/
    ├── unit/
    │   ├── validation.test.ts
    │   ├── quota-check.test.ts
    │   ├── dedup-logic.test.ts
    │   ├── idempotency-key.test.ts
    │   └── date-utils.test.ts
    ├── integration/
    │   ├── import-csv.test.ts
    │   ├── schedule-send.test.ts
    │   ├── inbox-classify.test.ts
    │   └── guardrails.test.ts
    └── __mocks__/
        ├── prisma.ts
        └── supabase.ts
```

### Architectural Boundaries

#### API Boundaries

| Boundary | Responsabilité | Endpoints |
|----------|---------------|-----------|
| **Auth API** | Login/logout, OAuth callbacks | `/api/auth/*` (Supabase managed) |
| **Prospects API** | CRUD, import CSV, enrichment | `/api/prospects/*` |
| **Sequences API** | CRUD séquences, steps, LLM generate | `/api/sequences/*` |
| **Inbox API** | Messages, classification, suggestions | `/api/inbox/*` |
| **Dashboard API** | Stats, health score | `/api/dashboard/*` |
| **Settings API** | User config, sending window | `/api/settings/*` |
| **Cron API** | Email scheduler, inbox sync | `/api/cron/*` (Vercel protected) |
| **Webhooks API** | Booking confirmations | `/api/webhooks/*` |

#### Service Layer Boundaries

| Service | Responsabilité | Location |
|---------|---------------|----------|
| **SupabaseClient** | Auth, session, tokens | `lib/supabase/` |
| **PrismaClient** | Database access, queries | `lib/prisma/` |
| **GmailService** | Send, fetch, watch | `lib/gmail/` |
| **LLMProvider** | Email generation, classification | `lib/llm/` |
| **EnrichmentService** | Dropcontact API | `lib/enrichment/` |
| **GuardrailsService** | Quota, dedup, pre-send checks | `lib/guardrails/` |
| **BookingService** | Cal.com integration | `lib/booking/` |
| **AuditLogger** | Event logging | `lib/audit/` |

#### Auth & Workspace Boundaries

> ⚠️ **Clarification importante (MVP):**

| Layer | Responsabilité |
|-------|---------------|
| **middleware.ts** | Auth gating UNIQUEMENT — redirect vers login si non authentifié |
| **API Routes** | Workspace ownership check via `lib/guardrails/workspace-check.ts` |
| **Services** | Source of truth pour workspaceId (depuis session, pas params) |

```typescript
// lib/guardrails/workspace-check.ts
export async function assertWorkspaceAccess(
  userId: string, 
  workspaceId: string
): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: userId }
  });
  if (!workspace) {
    throw new ApiError(403, 'WORKSPACE_ACCESS_DENIED', 'Accès non autorisé');
  }
}
```

#### Data Layer Boundaries

| Couche | Pattern | Accès |
|--------|---------|-------|
| **API Routes** | Controller | Validation Zod, auth check, response formatting |
| **Services** | Business Logic | Orchestration, règles métier, guardrails |
| **Repositories** | Data Access | Prisma queries, mappers JSON |
| **Database** | Storage | Supabase PostgreSQL |

### Requirements to Structure Mapping

#### Auth & Workspace (FR1-4)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR1 Google OAuth | `lib/supabase/client.ts`, `app/(auth)/login/` |
| FR2 Workspace perso | `prisma/schema.prisma` → `Workspace` model |
| FR3 Dashboard après login | `app/(dashboard)/page.tsx` |
| FR4 Logout | `lib/supabase/middleware.ts`, header logout button |

#### ICP & Prospects (FR5-12)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR5-7 ICP Definition | `app/(dashboard)/settings/icp/page.tsx` |
| FR8-9 Import CSV | `app/api/prospects/import/route.ts`, `ImportWizard.tsx` |
| FR10 Manual add | `components/features/prospects/ProspectForm.tsx` |
| FR11-12 Enrichment | `lib/enrichment/dropcontact.ts`, `/api/prospects/[id]/enrich/` |

#### Sequences (FR13-20)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR13-15 Sequence Builder | `SequenceBuilder.tsx`, `StepEditor.tsx` |
| FR16-17 Templates | `TemplateEditor.tsx`, `template-variables.ts` |
| FR18-19 Variables | `lib/utils/template-variables.ts` |
| FR20 LLM Opener | `lib/llm/gemini.ts`, `/api/sequences/[id]/generate/` |

#### Campaign Control (FR21-25)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR21-25 Launch/Pause/Stop | `app/(dashboard)/sequences/[id]/page.tsx` (controls) |

#### Email Sending (FR26-32)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR26 Gmail OAuth | `lib/gmail/client.ts`, `/api/auth/gmail/` |
| FR27-28 DNS Validation | `lib/utils/dns-check.ts`, `DNSWizard.tsx` |
| FR29-31 Quotas | `lib/guardrails/quota.ts`, `domain-cap.ts` |
| FR32 Delay random | `app/api/cron/send-emails/route.ts` |

#### Inbox & Responses (FR38-44)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR38-40 Unified Inbox | `app/(dashboard)/inbox/`, `InboxList.tsx` |
| FR41-42 LLM Classification | `lib/llm/gemini.ts`, `/api/inbox/[id]/classify/` |
| FR43 Suggestions | `/api/inbox/[id]/suggest/route.ts` |
| FR44 Unsubscribe | `lib/guardrails/`, audit log |

#### Dashboard & Analytics (FR50-54)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR50-53 Metrics | `/api/dashboard/stats/route.ts`, `StatsCards.tsx` |
| FR54 Celebration | `CelebrationModal.tsx`, state tracking |

> ⚠️ **Métriques MVP (pas d'open/click tracking):**
> - `sent` / `delivered` / `failed` / `bounced`
> - `replies` (total + by category)
> - `booked` (RDV confirmés)
> - `healthScore` (calculé depuis bounces/complaints)

#### Guardrails (FR55-62)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR55 No unverified | `lib/guardrails/pre-send-check.ts` |
| FR56 Dedup | `lib/guardrails/dedup.ts` |
| FR57-58 Quotas | `lib/guardrails/quota.ts` |
| FR59 Unsubscribe link | `lib/utils/email-footer.ts` |
| FR60-62 Audit/DSAR | `lib/audit/logger.ts` |

#### Onboarding (FR63-66)

| FR | Fichier(s) Principal |
|----|---------------------|
| FR63-65 DNS Wizard | `DNSWizard.tsx`, `dns-check.ts` |
| FR66 Blocking gate | `(dashboard)/layout.tsx` redirect if !dnsVerified |

### Integration Points

#### External Service Integrations

| Service | Module | Data Flow |
|---------|--------|-----------|
| **Supabase Auth** | `lib/supabase/` | OAuth → Session → Cookie |
| **Supabase DB** | `lib/prisma/` | Prisma → PostgreSQL |
| **Gmail API** | `lib/gmail/` | OAuth → Send → Pub/Sub Watch |
| **Dropcontact** | `lib/enrichment/` | Request → Async Poll → Update |
| **Gemini LLM** | `lib/llm/` | Prompt → Generate → Response |
| **Cal.com** | `lib/booking/` | Link → Webhook → Update status |
| **Sentry** | `sentry.*.config.ts` | Error auto-capture |
| **Vercel** | `vercel.json` | Cron + Deploy + Analytics |

#### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     LEADGEN DATA FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │ Import  │───▶│  Enrichment │───▶│  Prospects  │         │
│   │  CSV    │    │ (Dropcontact)│   │   Table     │         │
│   └─────────┘    └─────────────┘    └──────┬──────┘         │
│                                             │                │
│                                             ▼                │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │  Sequences  │───▶│   Assign    │───▶│  Scheduled  │     │
│   │   Builder   │    │  Prospects  │    │   Emails    │     │
│   └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                                 │            │
│                                                 ▼            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 CRON WORKER (5 min)                  │   │
│   │  1. Check guardrails (quota, dedup, DNS)            │   │
│   │  2. Generate idempotency key                        │   │
│   │  3. Send via Gmail API                              │   │
│   │  4. Log to audit                                    │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                               │                              │
│                               ▼                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │  Gmail API  │───▶│  Pub/Sub    │───▶│   Inbox     │     │
│   │   (Send)    │    │  (Watch)    │    │  (Replies)  │     │
│   └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                                 │            │
│                                                 ▼            │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │ LLM Classify│───▶│  Suggest    │───▶│   Booking   │     │
│   │  (Gemini)   │    │   Reply     │    │  (Cal.com)  │     │
│   └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                                 │            │
│                                                 ▼            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                     DASHBOARD                        │   │
│   │  Metrics: sent | delivered | bounced | replies       │   │
│   │           booked | healthScore                       │   │
│   │  (NO open/click tracking MVP)                        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Development Workflow Integration

#### Development Server

```bash
pnpm dev              # Next.js dev server (Turbopack)
pnpm db:studio        # Prisma Studio (DB viewer)
pnpm db:push          # Push schema changes (dev)
pnpm db:migrate       # Run migrations (prod)
```

#### Build & Deploy

```bash
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm type-check       # TypeScript check
pnpm test             # Vitest (unit + integration)
```

#### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
- Lint (ESLint)
- Type-check (tsc)
- Unit tests (Vitest)
- Integration tests (Vitest + MSW)
- Build (next build)
- Deploy preview (Vercel)
```

---

## Architecture Validation Results

### Coherence Validation ✅

#### Decision Compatibility

| Stack Component | Versions | Compatibility |
|-----------------|----------|---------------|
| Next.js 16 + TypeScript 5.x | ✅ | Native support |
| Prisma 5.x + Supabase PostgreSQL 15.x | ✅ | Official connector |
| Supabase Auth + Next.js SSR | ✅ | @supabase/ssr package |
| TanStack Query + React 18+ | ✅ | Native compatibility |
| shadcn/ui + Tailwind CSS 3.x | ✅ | Complete design system |
| Gemini API + LLM abstraction | ✅ | Decoupled interface |
| Vitest + MSW | ✅ | API mocking compatible |

**Verdict :** Aucun conflit détecté entre les choix technologiques.

#### Pattern Consistency

| Pattern Category | Stack Alignment |
|-----------------|-----------------|
| Naming conventions | ✅ Aligned with Prisma/Next.js standards |
| API Response format | ✅ Coherent with TanStack Query expectations |
| Error handling layers | ✅ Compatible with React Error Boundaries |
| Query keys | ✅ Official TanStack pattern |
| Tests organization | ✅ Standard Vitest configuration |

#### Structure Alignment

- ✅ `src/` structure compatible with Next.js 16 App Router
- ✅ API/Services/Repositories boundaries well-defined
- ✅ Integration points mapped to specific modules
- ✅ Component boundaries respect feature organization

### Requirements Coverage Validation ✅

#### Functional Requirements (66 FRs)

| Domain | FRs | Coverage | Architectural Support |
|--------|-----|----------|----------------------|
| Auth & Workspace | FR1-4 | ✅ 4/4 | Supabase Auth + Workspace model |
| ICP & Prospects | FR5-12 | ✅ 8/8 | Import, enrichment, management modules |
| Sequences | FR13-20 | ✅ 8/8 | Builder, templates, LLM integration |
| Campaign Control | FR21-25 | ✅ 5/5 | Launch/pause/stop controls |
| Email Sending | FR26-32 | ✅ 7/7 | Gmail API, quotas, scheduling pillar |
| Settings | FR33-37 | ✅ 5/5 | Config sending window module |
| Inbox & Responses | FR38-44 | ✅ 7/7 | LLM classification, suggestions |
| Booking | FR45-49 | ✅ 5/5 | Cal.com integration |
| Dashboard | FR50-54 | ✅ 5/5 | Metrics (no open/click tracking MVP) |
| Guardrails | FR55-62 | ✅ 8/8 | Audit, DSAR, quotas modules |
| Onboarding | FR63-66 | ✅ 4/4 | DNS wizard, blocking gate |

**Total : 66/66 FRs architecturally covered**

#### Non-Functional Requirements (26 NFRs)

| Category | Coverage | Architectural Decision |
|----------|----------|----------------------|
| **Performance** | ✅ | TanStack Query cache, LLM timeout 30s, API <500ms |
| **Security** | ✅ | AES-256 tokens, workspace check, HTTPS TLS 1.3 |
| **Scalability** | ✅ | workspaceId + index, DB-based queue, Vercel auto-scale |
| **Accessibility** | ✅ | shadcn/ui WCAG 2.1 AA, keyboard navigation |
| **Integration** | ✅ | Retry exponential backoff, timeout, fallback |
| **Compliance** | ✅ | Audit logs 3y, DSAR <30j, deletion <24h, opt-out immediate |

### Implementation Readiness Validation ✅

#### Decision Completeness

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Critical decisions with versions | ✅ | All major deps versioned |
| Implementation patterns | ✅ | Complete with code examples |
| Consistency rules | ✅ | Anti-patterns list provided |
| Code examples | ✅ | TypeScript snippets for all patterns |

#### Structure Completeness

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Complete directory tree | ✅ | 100+ files defined |
| All directories | ✅ | app/, components/, lib/, hooks/, types/ |
| Integration points | ✅ | Gmail, Dropcontact, Gemini, Cal.com mapped |
| Component boundaries | ✅ | API/Services/Data layers defined |

#### Pattern Completeness

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Conflict points addressed | ✅ | 15+ potential conflicts identified |
| Naming conventions | ✅ | DB, API, Code conventions documented |
| Communication patterns | ✅ | Query keys, mutations standardized |
| Process patterns | ✅ | Error handling, toast, loading states |

### Gap Analysis Results

#### Critical Gaps ✅

**None detected.** All critical architectural decisions are documented with sufficient detail for AI agent implementation.

#### Important Gaps ⚠️

| Gap | Status | Mitigation |
|-----|--------|------------|
| Detailed Prisma schema | Deferred | Created during Epic 1 implementation |
| Environment variables list | Template | .env.example will be documented |
| Email warm-up strategy | Documented | Covered in Technical Research document |

#### Nice-to-Have Gaps

| Gap | Priority | Target Phase |
|-----|----------|--------------|
| Storybook for components | Low | Phase 2 |
| E2E tests with Playwright | Medium | Phase 2 |
| Advanced analytics dashboards | Low | Phase 2 |
| LinkedIn Chrome extension | Low | Phase 2+ |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (66 FRs, 26 NFRs)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (Gmail API, quotas, DNS)
- [x] Cross-cutting concerns mapped (guardrails, audit, workspaceId)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (12+ components)
- [x] Integration patterns defined (5 external APIs)
- [x] Performance considerations addressed (LLM timeout, caching)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, Code)
- [x] Structure patterns defined (Project organization)
- [x] Communication patterns specified (Query keys, mutations)
- [x] Process patterns documented (Error handling, loading states)

**✅ Project Structure**
- [x] Complete directory structure defined (100+ files)
- [x] Component boundaries established (API/Services/Data)
- [x] Integration points mapped (External services)
- [x] Requirements to structure mapping complete (66 FRs → files)

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH**

Based on:
- Complete technology stack coherence
- 100% requirements coverage
- Comprehensive implementation patterns
- Well-defined project structure

### Key Strengths

1. **Cohérent Stack Technologique** — Next.js + Supabase + Prisma = stack éprouvé
2. **Guardrails Non-Bypassables** — Sécurité et compliance architecturalement garanties
3. **Email Scheduling Pillar** — Architecture centrale avec idempotency
4. **LLM Abstraction** — Flexibilité pour switch provider
5. **Patterns Exhaustifs** — Évite les conflits entre agents IA

### Areas for Future Enhancement

1. **RLS Supabase** — Migration en Phase 2 (multi-user workspace)
2. **Redis/BullMQ** — Si volume >1000 emails/jour
3. **Multi-inbox** — Support multiple Gmail accounts
4. **Advanced Analytics** — Dashboards personnalisés

### Implementation Handoff

**AI Agent Guidelines:**

1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries as defined
4. Refer to this document for all architectural questions
5. Never bypass guardrails or security patterns

**First Implementation Priority:**

```bash
# Step 1: Initialize project
npx create-next-app@latest leadgen \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --turbopack --use-pnpm

# Step 2: Add dependencies
cd leadgen
npx shadcn@latest init
pnpm add @supabase/supabase-js @supabase/ssr prisma @prisma/client
pnpm add @tanstack/react-query framer-motion zod date-fns
pnpm add -D vitest @testing-library/react msw
```

**Architecture Document Status:** ✅ **COMPLETE**

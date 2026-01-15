---
project_name: 'LeadGen'
user_name: 'Alex'
date: '2026-01-13'
source_document: 'architecture.md'
---

# Project Context for AI Agents — LeadGen

_Critical rules and patterns that AI agents must follow when implementing code. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Component | Version | Notes |
|-----------|---------|-------|
| **Next.js** | 16.x | App Router, Server Components |
| **TypeScript** | 5.x | Strict mode enabled |
| **React** | 18.x | Server Components default |
| **Prisma** | 5.x | ORM with PostgreSQL |
| **Supabase** | Latest | PostgreSQL 15.x + Auth |
| **TanStack Query** | 5.x | State management |
| **Tailwind CSS** | 3.x | + shadcn/ui |
| **Zod** | 3.x | Runtime validation |
| **Vitest** | Latest | Testing framework |

---

## Critical Implementation Rules

### 🚨 MUST FOLLOW — Security & Multi-Tenant

1. **workspaceId NEVER in query params** — Extract from session via `lib/guardrails/workspace-check.ts`
2. **middleware.ts = auth gating ONLY** — No workspace checks in middleware
3. **Workspace ownership check in API routes** — Use `assertWorkspaceAccess(userId, workspaceId)`
4. **Gmail tokens stored AES-256 encrypted** — Never log or expose tokens

### 🚨 MUST FOLLOW — Email Scheduling (Pillar)

1. **Idempotency key required** — Format: `{prospectId}:{sequenceId}:{step}`
2. **Check sent_log BEFORE sending** — Prevent duplicate sends
3. **Random delay 30-90s between emails** — Human-like sending pattern
4. **Pre-send guardrails non-bypassable** — quota, dedup, DNS verification

### 📛 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **DB Tables** | `snake_case` plural | `prospects`, `email_sequences` |
| **Prisma Models** | `PascalCase` + `@@map` | `Prospect` → `@@map("prospects")` |
| **DB Columns** | `snake_case` | `workspace_id`, `created_at` |
| **Prisma Fields** | `camelCase` + `@map` | `workspaceId` → `@map("workspace_id")` |
| **API Routes** | `/api/{resource}` plural | `/api/prospects`, `/api/sequences` |
| **Components** | `PascalCase.tsx` | `ProspectCard.tsx` |
| **Utils/Hooks** | `kebab-case.ts` | `use-prospects.ts`, `email-helpers.ts` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `MAX_EMAILS_PER_DAY` |

### 📋 API Response Format

```typescript
// ALWAYS use this format
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// Use helpers from lib/utils/api-response.ts
return success(data);      // Success
return error(code, msg);   // Error
```

**HTTP Codes:** `200` GET/PUT, `201` POST, `400` validation, `401` unauth, `403` forbidden, `404` not found, `429` rate limit, `500` server error.

### 🔄 TanStack Query Keys

```typescript
// Standard patterns - DO NOT deviate
['prospects', workspaceId]                    // List
['prospects', workspaceId, prospectId]        // Detail
['sequences', workspaceId]                    
['inbox', workspaceId, 'unread']              // Filter
['dashboard', workspaceId, 'stats']           // Aggregation
```

### ⚠️ Error Handling Layers

1. **API Routes** → `try/catch` + `console.error` + `return error()`
2. **React Hooks** → `onError` callback + toast notification
3. **UI** → Error Boundary for crashes → Sentry report

### 📁 File Organization

```
src/
├── app/(dashboard)/       # Protected routes
├── app/api/               # API routes
├── components/ui/         # shadcn (DO NOT MODIFY)
├── components/features/   # Business components by feature
├── lib/                   # Services, clients, utils
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── __tests__/            # Tests (unit/ + integration/)
```

---

## Anti-Patterns to Avoid

| ❌ DON'T | ✅ DO |
|---------|------|
| `api.get('/users?workspaceId=123')` | Get workspaceId from session |
| Inline JSON mapping in routes | Use `lib/prisma/mappers.ts` |
| Tables in camelCase DB | `snake_case` DB + `@@map` Prisma |
| Co-located `.test.ts` files | Tests in `__tests__/` folder |
| Ad-hoc query keys | Standardized keys from docs |
| `throw new Error()` in routes | `return error(code, message)` |
| Open/click tracking MVP | Only: sent/delivered/bounced/replies/booked |

---

## Testing Requirements (MVP Baseline)

### Unit Tests (Vitest)

**Priority targets:**
- Validation logic (Zod schemas)
- Quota calculation
- Dedup logic
- Idempotency key generation

### Integration Tests

**Critical routes:**
- Import CSV prospects
- Email scheduler (idempotency)
- Inbox classification
- Guardrails pre-send check

---

## LLM Integration Rules

1. **Use abstraction layer** — `lib/llm/` with `LLMProvider` interface
2. **Timeout 30s with fallback** — Don't block UI
3. **Provider MVP: Gemini 2.0 Flash** — Can switch later via adapter

---

## MVP Scope Reminders

**IN SCOPE:**
- Single Gmail account per user
- 50 emails/day quota
- Sent/delivered/bounced/replies/booked metrics
- workspaceId + FK isolation

**OUT OF SCOPE (Phase 2):**
- Open/click tracking
- Multi-inbox support
- RLS (Row-Level Security)
- Redis/BullMQ
- LinkedIn extension

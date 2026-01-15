# Test Design Système — LeadGen

**Date :** 2026-01-13  
**Auteur :** Alex  
**Statut :** Draft  
**Mode :** System-Level Testability Review (Phase 3)

---

## Résumé Exécutif

Cette revue évalue la **testabilité** de l'architecture LeadGen avant le gate de solutioning. L'objectif est d'identifier les risques architecturaux, définir la stratégie de tests par niveau, et préparer le terrain pour le Sprint 0.

**Évaluation globale :** ✅ **PASS avec recommandations**

| Critère | Statut | Notes |
|---------|--------|-------|
| **Contrôlabilité** | ✅ PASS | API seeding, factories possibles, Prisma testable |
| **Observabilité** | ✅ PASS | Structured logging prévu, audit logs, health score |
| **Fiabilité** | ⚠️ CONCERNS | Dépendances externes (Gmail, Dropcontact, LLM) nécessitent mocks robustes |

---

## Évaluation de Testabilité

### Contrôlabilité

**Statut : ✅ PASS**

L'architecture permet de contrôler l'état système pour les tests :

| Aspect | Évaluation | Détail |
|--------|------------|--------|
| **State seeding** | ✅ | Prisma ORM permet `prisma.prospect.create()`, factories possibles |
| **Dependency injection** | ✅ | `LLMProvider` interface permet mock/stub du LLM |
| **External API mocking** | ✅ | Gmail API, Dropcontact peuvent être mockés via MSW ou Nock |
| **Error injection** | ✅ | API routes avec try/catch structuré permettent simulation d'erreurs |
| **Configuration isolation** | ✅ | `.env.test` pour environnement de test dédié |

**Points forts :**
- Pattern `LLMProvider` interface → facilement mockable pour tests
- Architecture API REST classique → MSW (Mock Service Worker) compatible
- Prisma → excellent pour seed/cleanup de données

### Observabilité

**Statut : ✅ PASS**

L'architecture permet d'inspecter les résultats et états :

| Aspect | Évaluation | Détail |
|--------|------------|--------|
| **Structured logging** | ✅ | `console.error` + contexte prévu dans les routes |
| **Audit trail** | ✅ | Table `AuditLog` pour toutes actions sensibles (NFR9) |
| **Metrics** | ✅ | Health score calculable, dashboard metrics définies |
| **API responses** | ✅ | Format `ApiResponse<T>` standardisé (success/error) |
| **Email status** | ✅ | Statuts clairs: PENDING, SENT, BOUNCED, etc. |

**Points forts :**
- Responses API normalisées → assertions simples dans les tests
- Audit logs immuables → traçabilité complète pour assertions

### Fiabilité

**Statut : ⚠️ CONCERNS**

Des précautions sont nécessaires pour garantir la stabilité des tests :

| Aspect | Évaluation | Détail |
|--------|------------|--------|
| **Test isolation** | ⚠️ | Workspace isolation OK, mais cleanup DB nécessaire entre tests |
| **Parallel safety** | ⚠️ | Idempotency key unique → attention aux conflits en parallèle |
| **External dependencies** | ⚠️ | 5 APIs externes = risque de flakiness si non mockées |
| **Deterministic waits** | ✅ | Pas de polling UI complexe prévu MVP |
| **Rate limiting** | ⚠️ | 100 req/min/user → tests doivent respecter ou mocker |

**Préoccupations principales :**

1. **Gmail API** — Nécessite mock complet (MSW) pour tests sans appels réels
2. **Dropcontact async** — Enrichissement async = gestion d'état transitoire `ENRICHING`
3. **LLM timeouts** — 30s timeout = tests lents si non mockés
4. **Vercel Cron** — Difficile à tester en E2E, worker testable unitairement

---

## Exigences Architecturales Significatives (ASRs)

Les NFRs et décisions d'architecture qui impactent la testabilité :

| ASR | Source | Risque | Score | Test Approach |
|-----|--------|--------|-------|---------------|
| **NFR6: OAuth tokens AES-256** | Security | Token leak en test | P=1 × I=3 = **3** | Mock token storage, no real tokens in tests |
| **NFR11: Rate limit 100 req/min** | Security | Test failures si dépassé | P=2 × I=2 = **4** | Mock rate limiter ou reset entre suites |
| **NFR15: Queue processing <5min** | Scalability | Slow tests si réel | P=2 × I=2 = **4** | Unit test worker, mock scheduler |
| **NFR19: Gmail retry backoff** | Integration | Flaky si réseau instable | P=2 × I=3 = **6** | MSW mock mandatoire |
| **NFR22: LLM timeout 30s** | Integration | Tests extrêmement lents | P=3 × I=2 = **6** | Mock LLMProvider systématique |
| **Idempotency key** | Pillar | Double-send si bug | P=2 × I=3 = **6** | Tests integration dédiés |
| **Onboarding gate** | Pillar | Bypass exploitable | P=2 × I=3 = **6** | Tests E2E sur blocking behavior |

**Risques ≥6 (action immédiate requise) :** 4 ASRs nécessitent tests dédiés P0.

---

## Stratégie de Tests par Niveau

### Recommandation Split MVP

Basé sur l'architecture (Next.js SaaS, API-heavy, LLM-integrated) :

| Niveau | % Effort | Rationale |
|--------|----------|-----------|
| **Unit** | 50% | Business logic, validation Zod, quota calc, idempotency, mappers |
| **Integration (API)** | 35% | Routes API, guardrails, DB operations, external API mocks |
| **E2E** | 15% | Happy paths critiques uniquement (Sophie Journey 1 & 2) |

### Unit Tests (Vitest) — 50%

**Cibles prioritaires :**

| Module | Tests | Rationale |
|--------|-------|-----------|
| `lib/utils/validation.ts` | Zod schemas prospect, sequence, email | Input validation coverage |
| `lib/guardrails/quota-check.ts` | Daily quota logic | Business critical |
| `lib/guardrails/dedup-logic.ts` | Email/prospect dedup | Anti-spam guard |
| `lib/utils/idempotency.ts` | Key generation `{prospectId}:{sequenceId}:{step}` | Pillar anti-double-send |
| `lib/prisma/mappers.ts` | JSON transformation | Data integrity |
| `lib/llm/gemini.ts` | Prompt building (not API call) | LLM abstraction |
| `lib/gmail/token-refresh.ts` | Exponential backoff logic | Integration reliability |

**Estimation :** ~30-40 test files, 100-150 individual tests

### Integration Tests (Vitest + Prisma) — 35%

**Routes critiques :**

| Route | Tests | Priority |
|-------|-------|----------|
| `POST /api/prospects` (CSV import) | Validation, dedup, source tracking | P0 |
| `POST /api/cron/send-emails` | Idempotency, guardrails pre-check | P0 |
| `POST /api/inbox/classify` | LLM mock, classification output | P1 |
| `GET /api/dashboard/stats` | Metrics calculation sans open/click | P1 |
| `POST /api/sequences/preview` | Template render, LLM opener mock | P1 |
| `POST /api/auth/callback` | Workspace creation idempotent | P1 |

**Mocks requis :**

| Service | Mock Strategy | Tool |
|---------|---------------|------|
| Gmail API | MSW handlers | `msw` |
| Dropcontact | MSW handlers | `msw` |
| Gemini LLM | `vi.mock` LLMProvider | Vitest |
| Supabase Auth | Session fixture | Custom |

**Estimation :** ~15-20 test files, 50-80 individual tests

### E2E Tests (Playwright) — 15%

**Limiter aux flows critiques :**

| Journey | Tests | Priority |
|---------|-------|----------|
| **Sophie Happy Path** | Login → Import → Sequence → Preview → (mock) Send confirmation | P0 |
| **Onboarding Gate** | Block send avant DNS verified | P0 |
| **Inbox Triage** | Reply classification display | P1 |
| **First RDV Celebration** | Modal trigger on webhook | P2 |

**Configuration Playwright :**

```typescript
// playwright.config.ts recommendations
{
  timeout: 30000,
  retries: 2,
  workers: 1, // MVP: sequential to avoid DB conflicts
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }
}
```

**Estimation :** 5-8 spec files, 15-25 individual tests

---

## Approche NFR Testing

### Security (NFR6-11)

| Requirement | Test Type | Approach |
|-------------|-----------|----------|
| OAuth tokens chiffrés (NFR6) | Integration | Assert encrypted storage, no plaintext in logs |
| No client-side credentials (NFR7) | E2E | Browser devtools audit, no tokens in localStorage |
| HTTPS enforcement (NFR8) | Manual + CD | Vercel config, staging check |
| Audit logs immutables (NFR9) | Integration | Assert log entries created on actions |
| Session timeout 24h (NFR10) | Integration | Mock time, verify session invalidity |
| Rate limiting (NFR11) | Integration | Verify 429 on excess requests |

### Performance (NFR1-5)

| Requirement | Test Type | Approach |
|-------------|-----------|----------|
| Actions <500ms (NFR1) | E2E timing | Playwright `expect.toBeVisible()` timing assertions |
| LLM preview <3s (NFR2) | Integration | Mock LLM, verify UI doesn't block |
| Classification <5s (NFR3) | Integration | Same approach |
| CSV 500 rows <10s (NFR4) | Integration | Benchmark test with 500-row fixture |
| Dashboard <2s (NFR5) | E2E | Performance timing |

**Note MVP :** Pas de tests de charge formels. Monitoring Vercel suffit.

### Reliability (NFR19-22)

| Requirement | Test Type | Approach |
|-------------|-----------|----------|
| Gmail retry backoff (NFR19) | Unit | Mock failures, verify retry intervals |
| Dropcontact graceful fallback (NFR20) | Integration | Mock timeouts, verify queue retry |
| Webhook timeout 10s (NFR21) | Integration | Mock slow webhook, verify timeout handling |
| LLM timeout 30s + fallback (NFR22) | Integration | Mock timeout, verify fallback message |

### Compliance (NFR23-26)

| Requirement | Test Type | Approach |
|-------------|-----------|----------|
| DSAR <30 days (NFR23) | Manual | Process doc + admin endpoint test |
| Cascade delete <24h (NFR24) | Integration | Assert all related records deleted |
| Audit logs 3 years (NFR25) | Manual | Retention policy doc |
| Opt-out immediate (NFR26) | Integration | Assert suppression list update <1s |

---

## Besoins Environnement de Test

### Infrastructure

| Environment | Purpose | Config |
|-------------|---------|--------|
| **Local (Dev)** | Unit + Integration | SQLite in-memory ou Supabase local |
| **CI (GitHub Actions)** | Automated tests | Prisma + PostgreSQL container |
| **Staging** | E2E + manual | Vercel Preview + Supabase test project |
| **Production** | Smoke only | Health check endpoints |

### Test Data Strategy

| Pattern | Tool | Usage |
|---------|------|-------|
| **Factories** | Custom + Faker.js | Prospect, Sequence, Email generation |
| **Fixtures** | JSON files | Known-good CSV imports, templates |
| **Cleanup** | `beforeEach` / `afterEach` | Prisma `deleteMany` par workspaceId |
| **Isolation** | workspaceId unique par test | Évite conflits parallèles |

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.x",
    "@playwright/test": "^1.x",
    "msw": "^2.x",
    "@faker-js/faker": "^8.x",
    "@vitest/coverage-v8": "^1.x"
  }
}
```

---

## Préoccupations de Testabilité

### ⚠️ Risques Identifiés

| Concern | Impact | Mitigation |
|---------|--------|------------|
| **5 APIs externes** | Flakiness si appels réels | MSW mandatory pour tous tests |
| **Vercel Cron non testable E2E** | Worker logic non couvert | Unit test le worker, manual verify cron |
| **LLM non-déterministe** | Assertions fragiles | Mock avec réponses fixtures |
| **Gmail OAuth flow** | Difficile à tester sans credentials réels | Test manual, mock token pour integration |
| **DB-based queue polling** | Race conditions possibles | Sequential tests, explicit waits |

### ❌ Bloqueurs Potentiels

Aucun bloqueur identifié. L'architecture est **testable** avec les mitigations proposées.

---

## Recommandations Sprint 0

Actions à effectuer avant le début du développement feature :

### 1. Setup Test Framework (Story dédié Epic 1)

```bash
# Vitest + Playwright installation
pnpm add -D vitest @vitest/coverage-v8 @playwright/test msw @faker-js/faker
npx playwright install
```

**Fichiers à créer :**
- `vitest.config.ts` — configuration unit/integration
- `playwright.config.ts` — configuration E2E
- `__tests__/setup.ts` — global setup (Prisma, mocks)
- `__tests__/factories/` — prospect, sequence, email factories
- `__tests__/mocks/handlers.ts` — MSW handlers (Gmail, Dropcontact, LLM)

### 2. CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:unit
      
  integration:
    runs-on: ubuntu-latest
    services:
      postgres: # Supabase-like
    steps:
      - run: pnpm test:integration
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:e2e
```

### 3. Smoke Tests First

Créer ces tests **avant** toute feature :

| Test | Purpose |
|------|---------|
| `health.test.ts` | API `/api/health` respond 200 |
| `auth.test.ts` | Login redirect works |
| `db.test.ts` | Prisma connection OK |

---

## Prochaines Étapes

1. ✅ **Revue testabilité système** — Ce document (terminé)
2. ⏳ **Epic 1 : Story test setup** — Ajouter story dédiée au framework de test
3. ⏳ **Gate check implementation-readiness** — Valider avec PM/Tech Lead
4. ⏳ **Sprint 0** — Exécuter `*framework` workflow pour scaffold tests
5. ⏳ **Epic-level test-design** — Run `*test-design` en mode Epic après sprint-planning

---

## Approbation

**Test Design Approuvé Par :**

- [ ] Product Owner : __________ Date : __________
- [ ] Tech Lead : __________ Date : __________
- [ ] QA Lead (TEA) : Murat Date : 2026-01-13

**Commentaires :**

---

---

**Généré par :** BMad TEA Agent — Master Test Architect  
**Workflow :** `_bmad/bmm/testarch/test-design` (System-Level Mode)  
**Version :** 4.0 (BMad v6)

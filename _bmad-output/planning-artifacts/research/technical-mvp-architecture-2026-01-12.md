---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
version: 2.0
quality: 'gold-standard'
inputDocuments: ["_bmad-output/analysis/brainstorming-session-2026-01-12.md", "_bmad-output/planning-artifacts/research/domain-clean-prospecting-compliance-2026-01-12.md", "_bmad-output/planning-artifacts/research/market-b2b-prospecting-tools-2026-01-12.md"]
workflowType: 'technical-research'
research_type: 'technical'
research_topic: 'Architecture MVP Clean Prospecting - Email + Enrichment + LLM + Booking'
research_goals: 'Sécuriser stack technique, comparer options, définir guardrails, estimer coûts'
user_name: 'Alex'
date: '2026-01-12'
web_research_enabled: true
source_verification: true
confidence_levels: ['Haute', 'Moyenne', 'Basse']
user_skill_level: 'beginner'
---

# 🔧 Rapport de Recherche Technique V2 : Architecture MVP Clean Prospecting

**Date :** 2026-01-12  
**Version :** 2.0 — Gold Standard  
**Auteur :** Alex (avec Mary, Business Analyst)  
**Type :** Technical Research  
**Niveau Cible :** Débutant (solutions simples, moins de moving parts)

> ⚠️ **Disclaimer :** Ce document est basé sur documentation officielle et sources vérifiées. Les pricing LLM sont datés de janvier 2025 — vérifier avant décision finale.

---

## Table des Matières

1. [Stack MVP Simplifiée](#1-stack-mvp-simplifiée)
2. [Email Sending via Gmail API](#2-email-sending-via-gmail-api)
3. [Deliverability & Authentication](#3-deliverability--authentication)
4. [Prospecting & Enrichment](#4-prospecting--enrichment)
5. [Orchestration & Quotas (MVP Simple)](#5-orchestration--quotas-mvp-simple)
6. [LLM Strategy & Model Routing](#6-llm-strategy--model-routing)
7. [Booking Integration](#7-booking-integration)
8. [State Machines & Pipeline Design](#8-state-machines--pipeline-design)
9. [Guardrails Techniques](#9-guardrails-techniques)
10. [Estimation des Coûts (Token Budget)](#10-estimation-des-coûts-token-budget)
11. [KPIs & Validations Réalistes](#11-kpis--validations-réalistes)
12. [LinkedIn — Safe by Design](#12-linkedin--safe-by-design)
13. [Risques & Mitigations](#13-risques--mitigations)
14. [MVP Now vs Phase 2](#14-mvp-now-vs-phase-2)
15. [Assumptions & Open Questions](#15-assumptions--open-questions)
16. [Sources Officielles](#16-sources-officielles)

---

## 1. Stack MVP Simplifiée

### 1.1 Architecture Simplifiée (Beginner-Friendly)

**Objectif :** Réduire les moving parts tout en gardant robustesse et évolutivité.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLEAN PROSPECTING MVP — SIMPLIFIED                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VERCEL (Single Provider)                     │   │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐  │   │
│  │  │   Next.js 14+   │     │   API Routes    │     │  Cron Jobs    │  │   │
│  │  │   App Router    │────▶│   (Server)      │────▶│  (Vercel)     │  │   │
│  │  │   React/TS      │     │                 │     │  Scheduled    │  │   │
│  │  └─────────────────┘     └────────┬────────┘     └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                          ┌───────────┴───────────┐                         │
│                          │                       │                         │
│                  ┌───────▼────────┐      ┌──────▼──────┐                  │
│                  │   Supabase     │      │  Upstash    │                  │
│                  │   PostgreSQL   │      │   Redis     │                  │
│                  │   + Auth       │      │  (optional) │                  │
│                  └────────────────┘      └─────────────┘                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         EXTERNAL SERVICES                            │   │
│  ├───────────────┬───────────────┬────────────────┬───────────────────┤   │
│  │ Email         │ Enrichment    │ LLM            │ Booking           │   │
│  │ Gmail API     │ Dropcontact   │ Gemini Flash   │ Cal.com (OSS)     │   │
│  │ (OAuth)       │ (primary)     │ or GPT-4o-mini │ or Calendly       │   │
│  └───────────────┴───────────────┴────────────────┴───────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Options Hosting Comparées

| Option | Composants | Complexité | Coût Estimé | Recommandation |
|--------|-----------|------------|-------------|----------------|
| **Option A: Vercel + Supabase** | Vercel (app+cron), Supabase (DB+auth) | ⭐ Simple | ~$20-50/mo | ✅ **MVP Now** |
| **Option B: Railway All-in-One** | Railway (app+DB+Redis+workers) | ⭐⭐ Medium | ~$40-80/mo | ✅ Alternative |
| **Option C: Vercel + Railway** | Vercel (app), Railway (workers+Redis) | ⭐⭐⭐ | ~$50-100/mo | Phase 2 |

### 1.3 Stack Détaillée MVP

| Composant | Choix MVP | Choix Phase 2 | Justification |
|-----------|-----------|---------------|---------------|
| **Frontend** | Next.js 14+ (App Router) | - | SSR, API routes intégrées |
| **Auth** | Supabase Auth ou Clerk | - | Simple, OAuth Google inclus |
| **ORM** | Prisma | - | Type-safe, migrations versionnées |
| **Database** | Supabase PostgreSQL | - | Managed, RLS, free tier généreux |
| **Queue** | Vercel Cron + DB-based queue | BullMQ + Upstash Redis | Simple pour MVP |
| **Email** | Gmail API (OAuth) | - | Authentique, meilleure délivrabilité |
| **Enrichment** | Dropcontact (primary) | + Hunter fallback | RGPD-native, EU data |
| **LLM** | Gemini 2.0 Flash | GPT-4.1-mini si qualité insuffisante | Coût optimal |
| **Booking** | Cal.com (OSS) ou Calendly | - | Webhooks, simple |

> **Source :** [developers.google.com/gmail/api](https://developers.google.com/gmail/api), [supabase.com/docs](https://supabase.com/docs), [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)

---

## 2. Email Sending via Gmail API

### 2.1 Limites Officielles Google Workspace

**Source Officielle :** [Google Workspace Admin Help — Email sending limits](https://support.google.com/a/answer/166852)

| Limite | Valeur Officielle | Notes |
|--------|------------------|-------|
| **Emails par jour** | 2,000 | Rolling 24h, pas reset minuit |
| **Destinataires totaux/jour** | 10,000 | To + Cc + Bcc cumulés |
| **Destinataires uniques/jour** | 3,000 | Dont max 2,000 externes |
| **Destinataires par email (SMTP)** | 100 | Via SMTP relay |
| **Destinataires par email (API)** | 500 | Via Gmail API |
| **Trial accounts** | 500/jour | Augmente après ~$100 de paiement cumulé |

> ⚠️ **Heuristique (configurable) :** Pour cold email, les praticiens recommandent **25-50 emails/inbox/jour** pour éviter les signaux négatifs. Ce n'est PAS une limite officielle mais une best practice basée sur l'observation des filtres anti-spam.

### 2.2 Réception des Événements (Replies, Bounces, OOO)

**Méthode Recommandée : Gmail API `watch` + Google Cloud Pub/Sub**

**Source Officielle :** [developers.google.com/gmail/api/guides/push](https://developers.google.com/gmail/api/guides/push)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    GMAIL EVENTS FLOW (OFFICIAL)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Setup Pub/Sub Topic                                                  │
│     └── Grant gmail-api-push@system.gserviceaccount.com "Publisher"      │
│                                                                          │
│  2. Call users.watch() with topicName                                    │
│     └── Returns initial historyId                                        │
│     └── Watch expires after 7 days → must renew                          │
│                                                                          │
│  3. On inbox change → Pub/Sub notification                               │
│     └── Payload contains NEW historyId (not email content!)              │
│                                                                          │
│  4. Call users.history.list(startHistoryId=previous)                     │
│     └── Returns list of changes: messagesAdded, labelsAdded, etc.        │
│                                                                          │
│  5. For each new message → users.messages.get()                          │
│     └── Extract reply content, detect OOO, parse DSN                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Détection des Types de Réponses

| Type | Méthode de Détection | Implémentation |
|------|---------------------|----------------|
| **Reply (normale)** | `In-Reply-To` header match | Regex sur Message-ID envoyé |
| **OOO (Out of Office)** | Header `X-Auto-Reply-Mode` ou subject patterns | Regex: "Out of office", "Absent", "Vacation" |
| **Bounce (hard)** | DSN email format, From: `mailer-daemon@*` | Parser MIME RFC 3464 |
| **Bounce (soft)** | DSN avec code `4xx` | Parser MIME, retry logic |
| **Complaint** | ❌ **Non accessible via Gmail API** | Voir alternative ci-dessous |

#### Limitation Critique : Spam Complaints

> ⚠️ **Gmail API ne fournit PAS de webhook pour les spam complaints** marqués par les destinataires. 

**Alternatives :**
1. **Google Postmaster Tools** — Dashboard pour monitorer spam rate (≥100 emails/jour requis)
2. **Feedback Loop indirect** — Monitorer le taux de réponse et engagement
3. **If using SMTP provider later** — SendGrid/Mailgun ont des webhooks complaints

### 2.3 Tracking (Opens/Clicks) — Recommandation

| Feature | Recommandation MVP | Raison |
|---------|-------------------|--------|
| **Open tracking** | ❌ **Désactivé par défaut** | Pixel invisible = spam trigger + privacy concern EU |
| **Click tracking** | ⚠️ **Opt-in uniquement** | Link rewriting détectable, impact délivrabilité |
| **Read receipts** | ❌ Non utilisé | Rarement supporté/activé |

> **Privacy EU :** Les pixels de tracking peuvent être considérés comme traitement de données personnelles (IP, timing) nécessitant consentement sous RGPD. Pour "Clean Prospecting", désactiver par défaut est cohérent avec le positionnement.

---

## 3. Deliverability & Authentication

### 3.1 SPF/DKIM/DMARC — Ce qui est RÉELLEMENT Auto-Configuré

**❌ CORRECTION de la V1 :** Google Workspace NE configure PAS automatiquement SPF/DKIM/DMARC pour vous. Voici ce qui est réellement nécessaire :

| Protocol | Auto-configuré ? | Action Admin Requise |
|----------|-----------------|---------------------|
| **SPF** | ❌ Non | Ajouter TXT record dans DNS |
| **DKIM** | ⚠️ Partiel | Activer dans Admin Console + ajouter DNS record |
| **DMARC** | ❌ Non | Ajouter TXT record dans DNS |

### 3.2 Checklist DNS Onboarding (OBLIGATOIRE)

**Source Officielle :** [support.google.com/a/answer/10583557](https://support.google.com/a/answer/10583557)

```markdown
## Checklist Configuration Email — Nouveau Domaine

### 1. SPF Record
- [ ] Ajouter TXT record: `v=spf1 include:_spf.google.com ~all`
- [ ] Vérifier avec: `dig TXT yourdomain.com`

### 2. DKIM (Google Admin Console)
- [ ] Admin Console → Apps → Google Workspace → Gmail → Authenticate email
- [ ] Générer nouvelle clé DKIM (2048-bit recommandé)
- [ ] Copier le TXT record et ajouter au DNS
- [ ] Attendre propagation (jusqu'à 48h)
- [ ] Cliquer "Start authentication" dans Admin Console

### 3. DMARC Record
- [ ] Ajouter TXT record pour `_dmarc.yourdomain.com`:
      `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
- [ ] Commencer avec `p=none` (monitoring), puis migrer vers `p=quarantine`

### 4. Vérification
- [ ] Envoyer email test à https://mail-tester.com
- [ ] Score cible: 9+/10
- [ ] Vérifier Google Postmaster Tools après 100+ emails
```

### 3.3 Exigences Bulk Sender (Feb 2024)

**Source Officielle :** [support.google.com/mail/answer/81126](https://support.google.com/mail/answer/81126)

| Exigence | Seuil | S'applique MVP ? |
|----------|-------|------------------|
| **SPF + DKIM auth** | Tous bulk senders | ✅ Oui |
| **DMARC avec p=none minimum** | 5,000+ emails/jour vers Gmail | ⚠️ Probablement non au début |
| **One-click unsubscribe header** | 5,000+ emails/jour | ⚠️ Probablement non au début |
| **Spam rate < 0.3%** | Tous | ✅ Oui (viser <0.1%) |
| **Valid PTR record** | Recommended | ✅ Auto si Gmail |

> **Clarification :** Ces exigences strictes (DMARC alignment, one-click unsub) sont pour les **bulk senders** (5,000+/jour). Pour MVP cold email (<500/jour), les exigences de base (SPF+DKIM) suffisent mais implementer toutes les mesures dès le début protège la réputation.

---

## 4. Prospecting & Enrichment

### 4.1 Analyse RGPD des Providers

**⚠️ CRITIQUE : Kaspr a été sanctionné €240,000 par la CNIL en décembre 2024**

**Source Officielle :** [cnil.fr — Sanction KASPR SAS](https://www.cnil.fr/fr/prospection-commerciale-la-cnil-sanctionne-la-societe-kaspr)

| Provider | RGPD Compliance | Data Residency | Database Model | Risque | Recommandation |
|----------|----------------|----------------|----------------|--------|----------------|
| **Dropcontact** | ✅✅ Audité CNIL 2019 | 🇪🇺 EU-only | ❌ Pas de DB, temps réel | Très faible | ✅ **Primary MVP** |
| **Hunter** | ✅ Conforme | 🇪🇺 Belgium (GCP) | ✅ Public sources | Faible | ✅ Fallback |
| **Apollo** | ✅ Conforme | 🇺🇸 US | ✅ Large DB | Moyen | ⚠️ Phase 2 |
| **Kaspr** | ❌ Sanctionné CNIL | 🇫🇷 France | ✅ LinkedIn scraping | **Élevé** | ❌ **À éviter** |

**Source :** [dropcontact.com/gdpr](https://www.dropcontact.com/gdpr), [hunter.io/gdpr](https://hunter.io/gdpr)

### 4.2 Waterfall Enrichment Recommandé

```
┌────────────────────────────────────────────────────────────────┐
│                    WATERFALL ENRICHMENT V2                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Input: {first_name, last_name, company, domain}               │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ STEP 1: Dropcontact (RGPD-Native, EU Data)              │  │
│  │ API: POST /enrich with {firstname, lastname, company}   │  │
│  │ Result: email + email_verification_status               │  │
│  │ ├── Found + Verified → RETURN                           │  │
│  │ └── Not Found → Continue                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ STEP 2: Hunter.io (EU Servers, Public Sources)          │  │
│  │ API: GET /email-finder?domain=&first_name=&last_name=   │  │
│  │ ├── Found + Verified → RETURN                           │  │
│  │ └── Not Found → Mark "enrichment_failed"                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  Output: {email, verified, source, confidence, provider}       │
│  └── source_attribution: required for Clean Prospecting        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Coûts & Taux de Succès

| Provider | Pricing | Coût/email trouvé | Taux Succès Estimé | EU Data |
|----------|---------|-------------------|-------------------|---------|
| **Dropcontact** | €29/mo (1000 crédits) | ~€0.03 | ~65-75% | ✅ |
| **Hunter** | $34/mo (500 searches) | ~$0.07 | ~60-70% | ✅ |
| **Waterfall (2 sources)** | - | ~€0.08-0.12 | ~85-90% | ✅ |

> **Source Attribution (Clean Prospecting) :** Stocker `enrichment_source` et `enrichment_date` pour chaque prospect. Permet DSAR compliance et transparence.

---

## 5. Orchestration & Quotas (MVP Simple)

### 5.1 BullMQ — Core vs Pro Features

**⚠️ CORRECTION de la V1 :** Le group rate limiting est une feature **BullMQ Pro** (payante), pas core.

**Source Officielle :** [docs.bullmq.io/guide/rate-limiting](https://docs.bullmq.io/guide/rate-limiting)

| Feature | BullMQ Core (Free) | BullMQ Pro ($) |
|---------|-------------------|----------------|
| **Global rate limiting** | ✅ | ✅ |
| **Group rate limiting** | ❌ | ✅ |
| **Job prioritization** | ✅ | ✅ |
| **Delayed jobs** | ✅ | ✅ |
| **Retry with backoff** | ✅ | ✅ |
| **Flow (parent-child jobs)** | ❌ | ✅ |

### 5.2 Stratégie MVP : DB-Based Quotas (Sans BullMQ Pro)

**Pour un MVP beginner-friendly, éviter la dépendance à BullMQ Pro en implémentant les quotas dans la DB.**

```typescript
// Schema Prisma pour quotas DB-based
model EmailQuota {
  id          String   @id @default(cuid())
  inboxId     String
  date        DateTime @db.Date
  sentCount   Int      @default(0)
  
  @@unique([inboxId, date])
  @@index([inboxId, date])
}

model EmailJob {
  id            String    @id @default(cuid())
  prospectId    String
  inboxId       String
  scheduledAt   DateTime
  status        JobStatus @default(PENDING)
  attempts      Int       @default(0)
  lastError     String?
  processedAt   DateTime?
  idempotencyKey String   @unique // Anti-double-send
  
  @@index([status, scheduledAt])
  @@index([inboxId, scheduledAt])
}

enum JobStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  SKIPPED
}
```

### 5.3 Pattern Anti-Double-Send (Idempotency)

```typescript
// Idempotency key = unique per prospect+sequence+step
function generateIdempotencyKey(
  prospectId: string, 
  sequenceId: string, 
  stepNumber: number
): string {
  return `${prospectId}:${sequenceId}:${stepNumber}`;
}

async function processEmailJob(job: EmailJob) {
  // 1. Check idempotency - si déjà traité, skip
  const existing = await prisma.emailSent.findUnique({
    where: { idempotencyKey: job.idempotencyKey }
  });
  if (existing) {
    console.log(`Job ${job.id} already processed, skipping`);
    return { status: 'SKIPPED', reason: 'duplicate' };
  }

  // 2. Check daily quota
  const today = new Date().toISOString().split('T')[0];
  const quota = await prisma.emailQuota.findUnique({
    where: { inboxId_date: { inboxId: job.inboxId, date: today } }
  });
  
  if (quota && quota.sentCount >= MAX_EMAILS_PER_DAY) {
    // Reschedule to tomorrow
    await prisma.emailJob.update({
      where: { id: job.id },
      data: { scheduledAt: addDays(job.scheduledAt, 1) }
    });
    return { status: 'RESCHEDULED', reason: 'quota_exceeded' };
  }

  // 3. Acquire lock and send (transaction)
  return await prisma.$transaction(async (tx) => {
    // Increment quota atomically
    await tx.emailQuota.upsert({
      where: { inboxId_date: { inboxId: job.inboxId, date: today } },
      create: { inboxId: job.inboxId, date: today, sentCount: 1 },
      update: { sentCount: { increment: 1 } }
    });
    
    // Send email...
    const result = await sendEmailViaGmailAPI(...);
    
    // Record sent email with idempotency key
    await tx.emailSent.create({
      data: { idempotencyKey: job.idempotencyKey, ... }
    });
    
    return result;
  });
}
```

### 5.4 Scheduling Options MVP

| Option | Complexité | Fiabilité | Coût | Recommandation |
|--------|-----------|-----------|------|----------------|
| **Vercel Cron Jobs** | ⭐ Simple | ⭐⭐⭐ | Inclus | ✅ **MVP Now** |
| **Inngest** | ⭐⭐ Medium | ⭐⭐⭐⭐ | Free tier | ✅ Alternative |
| **BullMQ + Upstash** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ~$10/mo | Phase 2 |
| **BullMQ Pro** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $95/mo | Phase 3 |

**Vercel Cron MVP Pattern :**
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-emails",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}

// /api/cron/process-emails.ts
export async function GET(request: Request) {
  const pendingJobs = await prisma.emailJob.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() }
    },
    take: 10,  // Process 10 at a time
    orderBy: { scheduledAt: 'asc' }
  });

  for (const job of pendingJobs) {
    await processEmailJob(job);
    // Add delay between emails
    await sleep(randomBetween(60000, 120000));
  }
  
  return Response.json({ processed: pendingJobs.length });
}
```

---

## 6. LLM Strategy & Model Routing

### 6.1 Comparatif LLM Janvier 2025

**Sources Officielles :** [openai.com/api/pricing](https://openai.com/api/pricing), [anthropic.com/pricing](https://www.anthropic.com/pricing), [ai.google.dev/pricing](https://ai.google.dev/pricing), [mistral.ai/technology](https://mistral.ai/technology/)

| Model | Input $/1M | Output $/1M | Qualité Rédaction | Latence | Context | Recommandation |
|-------|-----------|-------------|-------------------|---------|---------|----------------|
| **Gemini 2.0 Flash** | $0.10 | $0.40 | ⭐⭐⭐⭐ | Fast | 1M | ✅ **Choix 1 — Best Value** |
| **GPT-4o-mini** | $0.15 | $0.60 | ⭐⭐⭐⭐ | Fast | 128K | ✅ Alternative OpenAI |
| **Mistral Small 3** | $0.03 | $0.11 | ⭐⭐⭐ | Fast | 32K | ✅ **Choix 2 — EU Sovereignty** |
| **GPT-4.1-mini** | $0.40 | $1.60 | ⭐⭐⭐⭐⭐ | Medium | 128K | Escalation |
| **Claude 3.5 Haiku** | $0.80 | $4.00 | ⭐⭐⭐⭐ | Medium | 200K | Qualité+ |
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | ⭐⭐⭐⭐⭐ | Slow | 200K | Phase 2 complex |

### 6.2 Stratégie Model Routing

```
┌────────────────────────────────────────────────────────────────┐
│                    MODEL ROUTING STRATEGY                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LAYER 0: Regex/Rules (Cost: $0)                          │ │
│  │ ├── OOO Detection: /out of office|absent|vacation/i     │ │
│  │ ├── Unsubscribe: /unsubscribe|stop|remove/i             │ │
│  │ └── Positive signals: /interested|let's talk|schedule/i │ │
│  │ Result: If match → SKIP LLM, use rule-based action       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │ No match                            │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: Cheap Model (Gemini Flash / Mistral Small)      │ │
│  │ Tasks: Classification, simple personalization            │ │
│  │ Cost: ~$0.0001-0.0005 per call                           │ │
│  │ ├── Confidence > 0.8 → Use result                        │ │
│  │ └── Confidence < 0.8 → Escalate                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │ Low confidence                      │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: Quality Model (GPT-4.1-mini / Claude Haiku)     │ │
│  │ Tasks: Complex personalization, nuanced replies          │ │
│  │ Cost: ~$0.001-0.003 per call                             │ │
│  │ Used for: Low-confidence cases, high-value prospects     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.3 Token Budget par Action (Précis)

| Action | Input Tokens | Output Tokens | Gemini Flash | GPT-4o-mini | Mistral Small 3 |
|--------|-------------|---------------|--------------|-------------|-----------------|
| **Opener generation** | ~150 | ~30 | $0.000027 | $0.000041 | $0.000008 |
| **Full email personalization** | ~400 | ~150 | $0.000100 | $0.000150 | $0.000029 |
| **Reply classification** | ~200 | ~5 | $0.000022 | $0.000033 | $0.000007 |
| **Reply suggestion** | ~300 | ~100 | $0.000070 | $0.000105 | $0.000020 |

### 6.4 Coût Réel par 1,000 Prospects

| Scénario | Actions | Gemini Flash | GPT-4o-mini | Mistral Small |
|----------|---------|--------------|-------------|---------------|
| **Email generation** | 1000x email | $0.10 | $0.15 | $0.03 |
| **Reply classification** | 200x (20% reply) | $0.004 | $0.007 | $0.001 |
| **Reply suggestions** | 40x (20% of replies) | $0.003 | $0.004 | $0.001 |
| **Escalations (10%)** | 100x to GPT-4.1 | $0.16 | - | - |
| **Total /1000 prospects** | - | **~$0.27** | **~$0.16** | **~$0.03** |

> **Leviers d'optimisation :**
> - **Caching :** Openers similaires (même industry/role) → cache 7 jours
> - **Batching :** Classifier 10 replies en une requête
> - **Templates :** 80% des emails peuvent utiliser templates pré-générés avec variables

### 6.5 Recommandation Finale LLM

| Critère | Choix 1 | Choix 2 |
|---------|---------|---------|
| **Best Value (Cost)** | ✅ Gemini 2.0 Flash | Mistral Small 3 |
| **Best Quality** | GPT-4.1-mini | Claude 3.5 Haiku |
| **EU Sovereignty** | ✅ Mistral Small 3 | Gemini (EU data residency option) |
| **Recommandation MVP** | **Gemini Flash default** | **Mistral Small** si EU-critical |

---

## 7. Booking Integration

### 7.1 Options Comparées

| Option | Coût | Webhooks | Self-hosted | Complexité | Recommandation |
|--------|------|----------|-------------|------------|----------------|
| **Cal.com** | Free (OSS) | ✅ Avec data | ✅ Possible | ⭐⭐ Medium | ✅ **MVP if self-host OK** |
| **Calendly** | $10-16/user/mo | ✅ Avec data | ❌ | ⭐ Simple | ✅ **MVP if budget OK** |
| **Google Calendar API** | Free | ⚠️ Notif only | N/A | ⭐⭐⭐ Complex | Phase 2 |

### 7.2 Intégration Pattern

```typescript
// Cal.com webhook handler
// POST /api/webhooks/cal-booking

export async function POST(request: Request) {
  const payload = await request.json();
  
  if (payload.triggerEvent === 'BOOKING_CREATED') {
    const { attendees, startTime, metadata } = payload.payload;
    const prospectEmail = attendees[0]?.email;
    
    // Find prospect and update status
    await prisma.prospect.update({
      where: { email: prospectEmail },
      data: { 
        status: 'BOOKED',
        meetingScheduledAt: new Date(startTime)
      }
    });
    
    // Mark sequence as completed
    await prisma.sequenceEnrollment.updateMany({
      where: { prospect: { email: prospectEmail } },
      data: { status: 'COMPLETED' }
    });
  }
  
  return Response.json({ received: true });
}
```

---

## 8. State Machines & Pipeline Design

### 8.1 Prospect Status State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROSPECT STATUS STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────┐     import        ┌────────────┐    enrich      ┌───────┐ │
│   │  RAW      │─────────────────▶│  IMPORTED  │──────────────▶│ENRICHED│ │
│   └───────────┘                   └────────────┘  (async job)   └───┬───┘ │
│                                                                     │      │
│                          ┌──────────────────────────────────────────┘      │
│                          │ enroll_in_sequence                              │
│                          ▼                                                 │
│   ┌───────────┐    bounce/complaint  ┌────────────┐   send_email  ┌──────┐│
│   │SUPPRESSED │◀─────────────────────│   ACTIVE   │◀──────────────│QUEUED││
│   └───────────┘                      └──────┬─────┘               └──────┘│
│        ▲                                    │                              │
│        │ opt_out                            │ receive_reply                │
│        │                                    ▼                              │
│   ┌────┴─────┐     negative         ┌────────────┐    positive   ┌──────┐ │
│   │UNSUBSCRIB│◀─────────────────────│  REPLIED   │─────────────▶│ WARM  │ │
│   │    ED    │                      └────────────┘              └───┬───┘ │
│   └──────────┘                                                      │      │
│                                                                     │ book │
│                                                                     ▼      │
│                                                              ┌───────────┐ │
│                                                              │  BOOKED   │ │
│                                                              └───────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

TRANSITIONS VALIDES:
- RAW → IMPORTED (import)
- IMPORTED → ENRICHED (enrich success)
- IMPORTED → SUPPRESSED (enrichment failed)
- ENRICHED → QUEUED (add to sequence)
- QUEUED → ACTIVE (first email sent)
- ACTIVE → REPLIED (any reply received)
- ACTIVE → SUPPRESSED (bounce/complaint)
- ACTIVE → UNSUBSCRIBED (opt-out)
- REPLIED → WARM (positive classification)
- REPLIED → UNSUBSCRIBED (negative/opt-out)
- WARM → BOOKED (meeting scheduled)
```

### 8.2 Sequence Step State Machine

```
PENDING ──schedule──▶ SCHEDULED ──process──▶ SENDING
                                               │
          ┌────────────────────────────────────┼────────────┐
          ▼                                    ▼            ▼
       SKIPPED                               SENT        FAILED
   (quota/suppressed)                          │           │
                                              │           └─retry─▶ PENDING
                              ┌───────────────┴──────────────┐
                              ▼               ▼              ▼
                           OPENED          CLICKED        REPLIED
```

---

## 9. Guardrails Techniques

### 9.1 Checklist MVP (Priorité P0)

| Catégorie | Guardrail | Implementation | Priorité |
|-----------|-----------|----------------|----------|
| **Quota** | Max 50 emails/inbox/jour | DB EmailQuota table | P0 |
| **Quota** | Delay 60-120s entre emails | `sleep(randomBetween(60000, 120000))` | P0 |
| **Suppression** | Auto-suppress hard bounce | DSN parsing → SuppressionList | P0 |
| **Suppression** | Global opt-out list | SuppressionList avec reason | P0 |
| **Idempotency** | No duplicate email ever | Unique idempotencyKey | P0 |
| **Verification** | No send without verified email | Pre-send check | P0 |
| **Audit** | Log every email sent | AuditLog table | P0 |
| **DSAR** | Delete user data endpoint | Cascade delete + audit | P1 |
| **Monitoring** | Alert if bounce > 2% | Background check daily | P1 |

### 9.2 Schema Guardrails

```prisma
model SuppressionList {
  id          String   @id @default(cuid())
  workspaceId String
  email       String
  reason      SuppressionReason
  source      String   // "bounce", "complaint", "manual", "dsar"
  metadata    Json?    // {bounceType, originalError}
  createdAt   DateTime @default(now())
  
  @@unique([workspaceId, email])
  @@index([email])
}

enum SuppressionReason {
  HARD_BOUNCE
  SOFT_BOUNCE_REPEATED  // After 3 soft bounces
  SPAM_COMPLAINT
  UNSUBSCRIBE
  DSAR_DELETE
  MANUAL
}
```

---

## 10. Estimation des Coûts (Token Budget)

### 10.1 Coût par 1,000 Prospects (Détaillé)

| Composant | Calcul | Coût |
|-----------|--------|------|
| **Enrichment (Dropcontact)** | 1000 × €0.03 | €30 |
| **Email verification (retry)** | 200 × €0.01 | €2 |
| **LLM Generation (Gemini Flash)** | 1000 × $0.0001 | $0.10 |
| **LLM Classification (20% replies)** | 200 × $0.00002 | $0.004 |
| **LLM Escalation (10% complex)** | 100 × $0.0016 | $0.16 |
| **Total Variable** | - | **~€32 / $35** |

### 10.2 Coûts Infrastructure Mensuels (Simplifié)

| Service | Plan | Coût/mo |
|---------|------|---------|
| **Vercel** | Pro | $20 |
| **Supabase** | Free tier (puis Pro $25) | $0-25 |
| **Upstash Redis** | Optional | $0-10 |
| **Total MVP** | - | **$20-55/mo** |

### 10.3 Coûts par User (Tiers)

| Service | Coût/user/mo | Obligatoire ? |
|---------|--------------|---------------|
| **Google Workspace** | €6 | ✅ |
| **Cal.com** | €0 (OSS) ou Calendly €10 | Calendly optional |
| **Total par user** | **€6-16** | - |

---

## 11. KPIs & Validations Réalistes

### 11.1 Métriques Cold Email Réalistes

**❌ CORRECTION de la V1 :** ">95% inbox placement" est irréaliste pour cold email.

**Sources :** [instantly.ai/blog/cold-email-metrics](https://instantly.ai/blog/cold-email-metrics), [Google Sender Guidelines](https://support.google.com/mail/answer/81126)

| Métrique | Benchmark Acceptable | Alerte Rouge | Source |
|----------|---------------------|--------------|--------|
| **Bounce rate** | < 2% | > 5% | instantly.ai, activecampaign |
| **Spam complaint rate** | < 0.1% | > 0.3% | Google requires <0.3% |
| **Reply rate (cold)** | 2-8% | < 1% | Industry average |
| **Positive reply rate** | 0.5-3% | < 0.3% | - |
| **Meeting book rate** | 0.2-1% | < 0.1% | - |

### 11.2 KPIs Actionnables MVP

```typescript
// Daily health check
interface DailyMetrics {
  emailsSent: number;
  bounces: number;
  bounceRate: number;        // Alert if > 2%
  uniqueRecipients: number;
  replies: number;
  replyRate: number;
  positiveReplies: number;
  meetingsBooked: number;
  
  // Domain health (requires Postmaster Tools)
  domainReputation?: 'HIGH' | 'MEDIUM' | 'LOW' | 'BAD';
  spamRate?: number;         // Alert if > 0.1%
}

function checkHealthAlerts(metrics: DailyMetrics): string[] {
  const alerts: string[] = [];
  
  if (metrics.bounceRate > 0.02) {
    alerts.push(`⚠️ Bounce rate ${(metrics.bounceRate * 100).toFixed(1)}% > 2%`);
  }
  if (metrics.spamRate && metrics.spamRate > 0.001) {
    alerts.push(`🚨 Spam rate ${(metrics.spamRate * 100).toFixed(2)}% > 0.1%`);
  }
  if (metrics.domainReputation === 'BAD') {
    alerts.push(`🚨 Domain reputation is BAD - pause campaigns`);
  }
  
  return alerts;
}
```

---

## 12. LinkedIn — Safe by Design

### 12.1 Matrice Risque LinkedIn

| Action | Risque ToS | Safe ? | Recommandation MVP |
|--------|-----------|--------|-------------------|
| **Import manuel contacts** | Aucun | ✅ | Formulaire CSV |
| **Visualisation profil (humain)** | Aucun | ✅ | - |
| **Rédaction assistée IA (hors LI)** | Aucun | ✅ | GPT pour messages |
| **Reminder tâches (CRM)** | Aucun | ✅ | Rappels manuels |
| **Auto-connect requests** | ⚠️ Élevé | ❌ | Pas MVP |
| **Scraping profils** | 🚨 Très élevé | ❌ | Pas MVP |
| **Auto-messaging** | 🚨 Très élevé | ❌ | Pas MVP |

### 12.2 Fonctionnalités "LinkedIn-Aware" Safe

```
MVP Safe Features:
├── Import CSV de prospects LinkedIn (manuel par user)
├── Enrichissement email via Dropcontact (nom + company)
├── Suggestion de message LinkedIn (copié manuellement)
├── Rappel "Envoyer message LinkedIn" comme tâche
└── Tracking manuel "Message LI envoyé" (checkbox)

Phase 2+ (avec précautions):
├── Extension Chrome : lecture-seule profil visités
└── Intégration LinkedIn Sales Navigator API (si disponible)
```

---

## 13. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Délivrabilité dégradée** | Moyenne | Critique | Warm-up obligatoire, quotas stricts, monitoring Postmaster |
| **Gmail API suspension** | Basse | Critique | Respecter limites officielles, OAuth propre |
| **Enrichment provider down** | Basse | Moyen | Waterfall 2 providers, retry avec backoff |
| **LLM hallucinations** | Moyenne | Moyen | RAG, température basse, validation humaine |
| **CNIL/RGPD plainte** | Basse | Critique | Dropcontact (audité CNIL), audit logs, DSAR workflow |
| **Coûts LLM explosent** | Basse | Moyen | Model routing, caching, budgets caps |
| **Kaspr-like sanction** | N/A (on évite) | N/A | Pas de scraping LinkedIn, sources légitimes only |

---

## 14. MVP Now vs Phase 2

### 14.1 Scope MVP (4-6 semaines)

| Composant | MVP | Détail |
|-----------|-----|--------|
| **Hosting** | Vercel + Supabase | Single provider simplicity |
| **Email** | Gmail API OAuth | 1 inbox per user |
| **Queue** | Vercel Cron + DB | Simple, no Redis |
| **Enrichment** | Dropcontact only | RGPD-safe, API simple |
| **LLM** | Gemini Flash only | No routing complexity |
| **Booking** | Cal.com OSS | Free |
| **Quotas** | DB-based | idempotency + daily count |
| **Auth** | Supabase Auth | Built-in |

### 14.2 Scope Phase 2 (Post-MVP)

| Composant | Phase 2 | Trigger |
|-----------|---------|---------|
| **Queue** | BullMQ + Upstash Redis | >1000 emails/day |
| **Enrichment** | + Hunter fallback | <80% enrichment rate |
| **LLM** | Model routing (cheap → quality) | Cost optimization needed |
| **Multi-inbox** | Multiple Gmail accounts | User demand |
| **LinkedIn** | Chrome extension read-only | User demand |
| **Analytics** | Advanced dashboards | Post-launch |

---

## 15. Assumptions & Open Questions

### 15.1 Assumptions

| Assumption | Impact si Faux | Comment Vérifier |
|------------|---------------|------------------|
| Gmail API toléré pour cold email B2B | Pivot vers SMTP provider | Test progressif, monitor suspension |
| Dropcontact API rate suffisant | Fallback Hunter | Tester volume réel |
| Gemini Flash qualité OK pour emails FR | Switch GPT-4o-mini | A/B test sur 100 emails |
| Users acceptent Gmail OAuth scope | UX friction | Early user testing |
| Vercel Cron fiable pour scheduling | Move to proper queue | Monitor missed crons |

### 15.2 Open Questions

1. **Multi-tenant data isolation** — Row-Level Security Supabase suffisante ou schema séparé ?
2. **Compliance labels** — Faut-il un "Unsubscribe" footer obligatoire dès MVP ou seulement si >5000/jour ?
3. **Warm-up intégré ou externe ?** — Utiliser service tiers (Lemwarm, Warmbox) ou construire in-house ?
4. **Reply-to routing** — Réponses dans inbox Gmail ou récupérées dans app ?
5. **Onboarding DNS** — Wizard in-app pour SPF/DKIM/DMARC ou documentation externe ?

---

## 16. Sources Officielles

### Email & Gmail API

| Source | URL | Type |
|--------|-----|------|
| Gmail API Quota | [developers.google.com/gmail/api/reference/quota](https://developers.google.com/gmail/api/reference/quota) | Official |
| Gmail Push Notifications | [developers.google.com/gmail/api/guides/push](https://developers.google.com/gmail/api/guides/push) | Official |
| Google Workspace Limits | [support.google.com/a/answer/166852](https://support.google.com/a/answer/166852) | Official |
| Bulk Sender Guidelines | [support.google.com/mail/answer/81126](https://support.google.com/mail/answer/81126) | Official |
| DKIM Setup | [support.google.com/a/answer/174124](https://support.google.com/a/answer/174124) | Official |

### LLM Pricing

| Source | URL | Type |
|--------|-----|------|
| OpenAI Pricing | [openai.com/api/pricing](https://openai.com/api/pricing) | Official |
| Anthropic Pricing | [anthropic.com/pricing](https://www.anthropic.com/pricing) | Official |
| Google AI Pricing | [ai.google.dev/pricing](https://ai.google.dev/pricing) | Official |
| Mistral Pricing | [mistral.ai/technology](https://mistral.ai/technology/#pricing) | Official |

### Enrichment & RGPD

| Source | URL | Type |
|--------|-----|------|
| CNIL Kaspr Sanction | [cnil.fr — Sanction KASPR](https://www.cnil.fr/fr/prospection-commerciale-la-cnil-sanctionne-la-societe-kaspr) | Official |
| Dropcontact GDPR | [dropcontact.com/gdpr](https://www.dropcontact.com/gdpr) | Official |
| Hunter GDPR | [hunter.io/gdpr](https://hunter.io/gdpr) | Official |

### Infrastructure

| Source | URL | Type |
|--------|-----|------|
| BullMQ Rate Limiting | [docs.bullmq.io/guide/rate-limiting](https://docs.bullmq.io/guide/rate-limiting) | Official |
| BullMQ Groups (Pro) | [docs.bullmq.io/bullmq-pro/groups](https://docs.bullmq.io/bullmq-pro/groups) | Official |
| Vercel Cron Jobs | [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs) | Official |
| Prisma Best Practices | [prisma.io/docs/guides](https://www.prisma.io/docs/guides) | Official |

### KPIs Cold Email

| Source | URL | Type |
|--------|-----|------|
| Cold Email Benchmarks | [instantly.ai/blog](https://instantly.ai/blog) | Industry |
| Bounce Rate Standards | [activecampaign.com](https://www.activecampaign.com/blog/email-bounce-rate) | Industry |

---

## Résumé Exécutif V2

### Changements Clés vs V1

| Point | V1 (Incorrect) | V2 (Corrigé) |
|-------|---------------|--------------|
| **SPF/DKIM/DMARC** | "Auto-configuré par Workspace" | ❌ Configuration manuelle DNS requise |
| **BullMQ Group Limiting** | "Disponible en core" | ❌ Feature Pro payante |
| **Gmail complaints** | "Webhook disponible" | ❌ Non accessible, utiliser Postmaster Tools |
| **Inbox placement** | ">95%" | Irréaliste cold email, focus bounce <2% |
| **LLM model** | "GPT-4o-mini default" | Gemini Flash moins cher, mieux pour MVP |
| **Kaspr** | "Alternative" | ❌ Sanctionné €240K CNIL, à éviter |
| **Skill level** | "Intermediate" | Corrigé à "Beginner" |
| **Hosting** | "Vercel + Railway + Redis" | Simplifié: Vercel + Supabase |

### Recommandations Finales

| Domaine | Choix MVP Now | Choix Phase 2 |
|---------|---------------|---------------|
| **Stack** | Vercel + Supabase (simple) | + Redis/BullMQ si volume |
| **Email** | Gmail API OAuth | Multi-inbox |
| **Enrichment** | Dropcontact (CNIL-safe) | + Hunter fallback |
| **LLM** | Gemini 2.0 Flash ($$$) | Model routing |
| **Queue** | Vercel Cron + DB | BullMQ |
| **Quotas** | DB-based simple | Group rate limiting |

### Prochaine Étape

➡️ **Créer le Product Brief** avec ces specs techniques validées → PRD → Architecture Doc → Epics & Stories

---

*Document V2 Gold Standard généré le 2026-01-12. Sources officielles vérifiées. Niveau: Beginner-friendly.*

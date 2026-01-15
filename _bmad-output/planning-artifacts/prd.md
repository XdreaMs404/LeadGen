---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
classification:
  projectType: saas_b2b
  domain: sales-tech
  complexity: medium-high
  projectContext: greenfield
  keyConcerns:
    - RGPD/ePrivacy compliance
    - Email deliverability (SPF/DKIM/DMARC)
    - Third-party API integrations
    - UX guardrails (Copilot mode)
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-LeadGen-2026-01-12.md"
  - "_bmad-output/analysis/brainstorming-session-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/domain-clean-prospecting-compliance-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/market-b2b-prospecting-tools-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/technical-mvp-architecture-2026-01-12.md"
documentCounts:
  briefs: 1
  research: 3
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
projectType: 'greenfield'
date: 2026-01-12
---

# Product Requirements Document - LeadGen

**Author:** Alex
**Date:** 2026-01-12

---

## Executive Summary

**LeadGen** est une plateforme SaaS B2B de prospection email intelligente, positionnée sur le **"Clean Prospecting"** — compliance et délivrabilité comme proposition de valeur #1.

| Aspect | Détail |
|--------|--------|
| **Proposition de valeur** | Automatiser la prospection cold email B2B tout en protégeant le domaine et la réputation de l'utilisateur |
| **Différenciateur** | Mode Copilot human-in-the-loop + guardrails non bypassables |
| **MVP Focus** | Email only, Copilot mode, 1 inbox, guardrails on by default |
| **North Star** | RDV bookés — pas volume d'emails |
| **Cible** | Solopreneurs B2B (Sophie) + Sales PME (Marc) |
| **Timeline** | 4-6 semaines MVP |

**Stack technique :** Next.js + Supabase + Gmail API + Gemini Flash + Dropcontact

---

## Success Criteria

### User Success

| Métrique | Objectif | Acceptable | Notes |
|----------|----------|------------|-------|
| **Reply rate** | 3% | 2–5% | Très dépendant du segment cible |
| **Positive reply rate** | ≥1% | À calibrer | Leads qualifiés uniquement |
| **RDV bookés / 100 prospects** | ≥2 | ≥1 | North Star proxy |
| **Temps traitement inbox/jour** | < 15 min | < 30 min | Copilot doit faciliter |
| **Délai réponse → RDV** | < 24h | < 48h | Hot leads prioritaires |

**Moments "Aha!" :**
- Premier RDV booké → célébration visuelle "🎉 Premier RDV booké !"
- Première réponse positive après campagne lancée
- Dashboard montrant un pipeline régulier sans effort quotidien excessif

### Business Success

| Horizon | Métrique | Target | Métrique secondaire |
|---------|----------|--------|---------------------|
| **3 mois** | Beta users actifs | 20 | Validation concept |
| **3 mois** | NPS | ≥ 40 | Product-Market Fit signal |
| **6 mois** | MRR | €3–5K | Traction |
| **6 mois** | Retention M3 | ≥ 50% | Users actifs après 3 mois |
| **12 mois** | MRR | €15–20K | Growth |
| **12 mois** | Agency tier users | 5+ agences | Expansion |

### Technical Success

| Métrique | Seuil Acceptable | Action Automatique |
|----------|------------------|-------------------|
| **Bounce rate** | < 2% | Pause auto si dépassé |
| **Spam complaint rate** | < 0.1% | Pause auto + alerte |
| **Unsubscribe rate** | Monitoring continu | Pause + alerte si spike |
| **Health score** | > 80/100 | Recommandations si < 60 |
| **DSAR requests** | 100% < 30 jours | Alerte si délai dépassé |
| **Audit log coverage** | 100% actions sensibles | Alerte si gap |

### Measurable Outcomes

**North Star Metric :** RDV bookés / taux de réponses qualifiées — pas volume d'emails envoyés.

**Définitions clés :**
- **Réponse qualifiée** = Interested + demandes d'info + "forward to colleague" (exclut OOO, bounce, unsubscribe, negative)
- **RDV booké** = Événement créé (Calendly/Cal.com) + statut "BOOKED" dans le système

---

## Product Scope

### MVP - Minimum Viable Product

| Module | Features MVP | Détail |
|--------|-------------|--------|
| **Auth & Workspace** | Google OAuth login | 1 user = 1 workspace |
| **ICP Builder** | Critères simples | Industrie, taille, rôle, localisation |
| **Sourcing** | Import CSV + ajout manuel | Pas de scraping — "Clean" by design |
| **Enrichissement** | Dropcontact (RGPD-native) | Email vérifié + company + role |
| **Personnalisation** | Templates + variables + LLM opener | Gemini Flash |
| **Sequences** | 3 steps max, delays configurables | Copilot preview obligatoire |
| **Sending** | Gmail API OAuth | 1 inbox, quotas safe (20-50/jour) |
| **Inbox** | Réception + triage auto | Interested / Not Now / Negative / OOO |
| **Suggestions** | Reply suggestions + lien booking | LLM classification |
| **Booking** | Lien Calendly/Cal.com + statut BOOKED | Webhook |
| **Dashboard** | KPIs simples | Sent, Replies, RDV, Health score |
| **Guardrails** | All on by default | Quotas, dedup, suppression, audit |

**Principes MVP :**
- ✅ Copilot by default — validation humaine avant tout envoi
- ✅ No send without verified email — guardrail non bypassable
- ✅ Safe defaults — quotas, ramp-up, pause auto si anomalie
- ✅ Provenance data explicite — chaque lead a une source tracée

### Growth Features (Post-MVP)

| Feature | Phase | Trigger |
|---------|-------|---------|
| Mode Autopilot | Phase 2 | Après validation Copilot |
| Multi-inbox | Phase 2 | Demande utilisateurs |
| CRM integrations | Phase 2 | HubSpot, Pipedrive |
| Sourcing automatisé | Phase 2 | Annuaires, API enrichment |
| Team features | Phase 2 | Policies, approvals, workspace partagé |
| LinkedIn assisted | Phase 3 | Reminders, copy suggestions |

### Vision (Future)

| Phase | Focus | Features |
|-------|-------|----------|
| **Phase 2** | Scale + Team | Autopilot (conditions), Multi-inbox, Team workspace, CRM sync |
| **Phase 3** | Expansion | LinkedIn assisté, Advanced analytics, Agency white-label |
| **Phase 4** | Platform | API publique, Marketplace templates, Scoring ML |

---

## User Journeys

### Journey 1: Sophie — Premier RDV Booké (Happy Path) 🎯 MVP

**Persona :** Solopreneur B2B consultant, micro-équipe, 20-30 min/jour max, expertise deliverability faible

**🎬 Opening Scene :**
Sophie ouvre LeadGen le lundi matin. Elle a une nouvelle offre à promouvoir. Jusqu'ici, elle prospectait au feeling via LinkedIn, sans système.

**📈 Rising Action :**
1. Elle définit son ICP en 5 min (consultants IT PME, région Île-de-France)
2. Elle importe 50 prospects CSV (export CRM, lead magnet, réseau pro) — **source tracée visible**
3. LeadGen enrichit les emails via Dropcontact — 45/50 vérifiés ✓
4. Elle crée une séquence 3 emails avec templates personnalisés + opener LLM
5. Elle preview chaque email en mode Copilot et valide

**🎉 Climax :**
Vendredi : notification "Réponse positive détectée!" — Sophie clique, voit la suggestion de réponse avec lien Calendly, envoie en 1 clic.

**✅ Resolution :**
Lundi suivant : RDV booké. Dashboard affiche "🎉 Premier RDV!" — Sophie comprend que le système fonctionne.

**Capabilities révélées :** ICP Builder, Import CSV avec source, Enrichment, Sequence Builder, Copilot Preview, Inbox Triage, Booking Integration, First Win Celebration

---

### Journey 2: Sophie — Safe by Design / Error Recovery 🛡️ MVP

**🎬 Opening Scene :**
Sophie veut aller vite et tente de lancer une campagne sans avoir complété l'onboarding deliverability.

**🛑 Blocking Gate (Safe by Design) :**
LeadGen **bloque le lancement** tant que l'onboarding deliverability n'est pas validé :
- Checklist DNS (SPF/DKIM/DMARC) non complète
- Mode Preview uniquement disponible tant que config non validée

**📈 Rising Action :**
1. Elle voit le dashboard "Onboarding Deliverability" avec checklist claire
2. Tutoriels intégrés + liens vers documentation DNS
3. Elle configure ses DNS, attend propagation (48h)
4. LeadGen valide automatiquement la config → unlock envoi

**📊 Monitoring continu :**
Si bounce > 2% après quelques envois → **pause automatique** + alerte + recommandations

**✅ Resolution :**
Domain reputation préservée dès le premier jour. Sophie comprend que l'outil la protège.

**Capabilities révélées :** Onboarding Deliverability Gate, DNS Checklist Wizard, Blocking before send, Health Score Dashboard, Auto-pause guardrails

---

### Journey 3: Marc — Onboarding Équipe (Admin) 👔 PHASE 2

> ⚠️ **Note :** Ce journey est prévu pour Phase 2. Le MVP est "1 user = 1 workspace".

**Persona :** Sales Lead PME, équipe 3 commerciaux, besoin gouvernance + traçabilité

**🎬 Opening Scene :**
Marc doit structurer la prospection de son équipe après un incident (commercial précédent a "grillé" le domaine).

**📈 Rising Action :**
1. Il crée un workspace équipe, invite 3 commerciaux
2. Il configure les policies : quotas stricts (30/jour/inbox), Copilot obligatoire
3. Il crée des templates partagés + séquences validées
4. Dashboard consolidé : vue metrics tous users

**🎉 Climax :**
Fin de mois : Marc voit que l'équipe a généré 8 RDV qualifiés avec 0 incident deliverability. Audit trail complet visible.

**✅ Resolution :**
Marc est serein sur la conformité RGPD, peut montrer les logs au DPO si besoin.

**Capabilities Phase 2 :** Multi-user workspace, Policies/Quotas, Template sharing, Consolidated metrics, Audit trail exports

---

### Journey 4: Support / DSAR Request 📋 MVP Minimal + PHASE 2

**MVP Minimal :**
- Export data on demand (admin action)
- Delete user data endpoint (cascade delete)
- Audit logs pour toutes actions sensibles

**Phase 2 :**
- Portail public `/privacy/request`
- Workflow DSAR automatisé avec deadline tracking
- Identity verification flow

**🎬 Flow MVP (Admin-initiated) :**
1. Prospect demande suppression par email
2. Admin identifie le prospect dans le système
3. Action "Delete all data" → cascade suppression + audit log
4. Confirmation email envoyée manuellement

**✅ Success Criteria :** 100% DSAR < 30 jours, audit log complet

---

### Journey Requirements Summary

| Journey | Phase | Capabilities Révélées |
|---------|-------|----------------------|
| **Sophie Happy Path** | MVP | ICP Builder, Import CSV avec source, Enrichment, Sequence Builder, Copilot Preview, Inbox Triage, Booking Integration, First Win Celebration |
| **Sophie Safe by Design** | MVP | Onboarding Deliverability Gate, DNS Checklist, Blocking before send, Health Score, Auto-pause guardrails |
| **Marc Admin** | Phase 2 | Multi-user workspace, Policies/Quotas, Template sharing, Consolidated metrics, Audit trail |
| **DSAR Request** | MVP minimal + Phase 2 | Data export, Cascade delete, Audit logs (MVP) / Privacy portal, DSAR workflow (Phase 2) |

---

## Domain-Specific Requirements

### Compliance & Regulatory

**RGPD / ePrivacy (EU) :**

| Exigence | MVP | Détail |
|----------|-----|--------|
| **Base légale** | Intérêt légitime (art. 6.1.f) | Offre pertinente + info préalable + opt-out |
| **Lien unsubscribe** | ✅ Obligatoire | 1-clic dans chaque email |
| **Droit d'opposition** | ✅ Immédiat | Global blacklist |
| **DSAR (accès/effacement)** | ✅ < 30 jours | Export + delete endpoint |
| **Audit logs** | ✅ Obligatoire | Tous envois + opt-outs + DSAR |
| **Privacy policy** | ✅ Obligatoire | Mentions prospection |
| **Conservation** | Max 3 ans | Prospects inactifs |

> ⚠️ **Sanctions potentielles :** Jusqu'à €20M ou 4% CA mondial

### Technical Constraints

**Deliverability (obligatoire depuis Feb 2024) :**

| Protocole | Status | Action requise |
|-----------|--------|----------------|
| **SPF** | ❌ Non auto | TXT record DNS manuel |
| **DKIM** | ⚠️ Partiel | Activer Admin Console + DNS |
| **DMARC** | ❌ Non auto | TXT record DNS manuel |

**Rate Limiting :**

| Contexte | Limite recommandée |
|----------|-------------------|
| Cold email / inbox | Max 50/jour (heuristique safe) |
| Nouveau domaine (< 3 mois) | 20-50/jour, progression lente |
| Google Workspace limit | 2,000/jour (hard limit officiel) |

**Seuils critiques :**

| Métrique | Seuil | Action |
|----------|-------|--------|
| Bounce rate | > 2% | Pause auto + clean list |
| Spam complaint | > 0.3% | Pause auto + investigation |

### Integration Requirements

| Système | Type | MVP | Notes |
|---------|------|-----|-------|
| **Gmail API** | OAuth 2.0 | ✅ | Sending + receiving + watch |
| **Dropcontact** | REST API | ✅ | Enrichment RGPD-native |
| **Gemini Flash** | LLM API | ✅ | Personalization + classification |
| **Cal.com / Calendly** | Webhook | ✅ | Booking status sync |
| **Google Postmaster Tools** | Dashboard | ✅ | Reputation monitoring |

### Risk Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Domaine grillé** | Moyenne | Critique | Warm-up + quotas stricts + onboarding gate |
| **Gmail suspension** | Basse | Critique | Respecter limites officielles, OAuth propre |
| **Sanction CNIL** | Basse | Critique | Dropcontact (audité CNIL), audit logs, DSAR |
| **LinkedIn ban** | N/A | N/A | Pas d'automation LinkedIn MVP |
| **Kaspr-style sanction** | N/A | N/A | Sources légitimes only (Dropcontact) |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

| Innovation | Description | Différenciation Marché |
|------------|-------------|------------------------|
| **"Clean Prospecting" positioning** | Compliance = proposition de valeur #1, pas checkbox optionnelle | Aucun concurrent ne positionne la compliance comme valeur centrale |
| **Copilot by default** | Human-in-the-loop obligatoire avant tout envoi | Concurrents = Full auto (risque utilisateur) |
| **Guardrails non bypassables** | L'outil refuse de laisser spammer | Concurrents = guardrails optionnels/absents |
| **Blocking gate deliverability** | Pas d'envoi sans config DNS validée | Concurrents = "send first, fix later" |
| **North Star = RDV, pas volume** | Métrique succès inversée : qualité > quantité | Concurrents = "scale to millions of emails" |

### Market Context & Competitive Landscape

**Gap identifié :** Aucun acteur ne mène avec compliance comme proposition de valeur principale.

| Concurrent | Approche | Notre Différence |
|------------|----------|------------------|
| **Cognism** | Compliance enterprise, €16K+/an | Trop cher pour PME/Solo |
| **Woodpecker** | GDPR features disponibles | Pas "Clean First" positioning |
| **Instantly, Smartlead** | "Scale unlimited" | Course au volume = risque spam |
| **Lemlist** | "Get more replies" | Pas de guardrails intégrés |

**Why Now :**
- Fatigue du spam (efficacité blasts en chute)
- Enforcement RGPD en hausse
- Exigences providers Feb 2024 (SPF/DKIM/DMARC)
- Shift quality > quantity en prospection B2B

### Validation Approach

| Aspect | Méthode | Success Metric |
|--------|---------|----------------|
| **Positioning resonates** | Landing page A/B test | CTR "Clean" 2x vs "Powerful" |
| **Guardrails acceptés** | Beta user interviews | NPS ≥ 40 |
| **Mode Copilot adopté** | Usage analytics | < 5% demandes bypass |
| **North Star pertinent** | Correlation analysis | RDV bookés corrélé satisfaction |

### Innovation Risk Mitigation

| Risque Innovation | Probabilité | Fallback |
|-------------------|-------------|----------|
| Users veulent bypass guardrails | Moyenne | Éduquer via onboarding + content |
| "Clean" perçu comme limitation | Basse | Communiquer les résultats (reply rate, reputation) |
| Mode Copilot = friction UX | Moyenne | Optimiser preview UX, réduire clics nécessaires |
| North Star "RDV" trop restrictif | Basse | Ajouter métriques secondaires (qualified replies) |

---

## SaaS B2B Specific Requirements

### Tenant Model

**MVP :** 1 user = 1 workspace (single-tenant logique)

| Aspect | MVP | Phase 2 |
|--------|-----|---------|
| **Isolation** | 1 user = 1 workspace | Multi-user par workspace |
| **Data separation** | workspaceId sur chaque table | RLS policies Supabase |
| **Shared resources** | N/A | Templates partagés |

**Phase 2 :** Multi-user workspace avec Row-Level Security (RLS) Supabase préparé dès le début dans le schema.

### RBAC Matrix

> MVP : Pas de gestion de rôles — single user only.

**Phase 2 (équipes) :**

| Rôle | Leads | Sequences | Sending | Settings | Metrics |
|------|-------|-----------|---------|----------|---------|
| **Owner** | Full CRUD | Full CRUD | Full | Full | All |
| **Member** | CRUD own | CRUD own | Via Copilot | View | Own |

### Subscription Tiers

| Plan | Prix/mo | Leads/mo | Inboxes | Campaigns | Features Clés |
|------|---------|----------|---------|-----------|---------------|
| **Solo** | €49 | 500 | 1 | 3 | Core + warm-up inclus |
| **Pro** | €99 | 2.5K | 5 | 10 | + CRM sync (Phase 2) |
| **Agency** | €249 | 10K | Unlimited | Unlimited | + White-label (Phase 2) |

**Modèle :** Account-based (pas per-user), warm-up inclus sans limite.

### Integration List

| System | Type | MVP | Phase 2 | Notes |
|--------|------|-----|---------|-------|
| **Gmail API** | OAuth 2.0 | ✅ | Multi-inbox | Sending + receiving + watch |
| **Dropcontact** | REST API | ✅ | + Hunter fallback | RGPD-native enrichment |
| **Gemini Flash** | LLM API | ✅ | Model routing | Personalization + classification |
| **Cal.com / Calendly** | Webhook | ✅ | - | Booking status sync |
| **Google Postmaster** | Dashboard | ✅ | - | Reputation monitoring |
| **HubSpot** | CRM API | ❌ | ✅ | 2-way sync |
| **Pipedrive** | CRM API | ❌ | ✅ | 2-way sync |
| **Slack** | Webhook | ❌ | ✅ | Notifications |

### Technical Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                     STACK MVP SIMPLIFIÉE                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend     : Next.js 14+ (App Router) + React/TypeScript │
│  Backend      : Next.js API Routes (serverless)             │
│  Database     : Supabase PostgreSQL + Prisma ORM            │
│  Auth         : Supabase Auth (Google OAuth)                │
│  Queue        : Vercel Cron + DB-based job queue            │
│  LLM          : Gemini 2.0 Flash                            │
│  Enrichment   : Dropcontact API                             │
│  Hosting      : Vercel + Supabase (single-cloud)            │
└─────────────────────────────────────────────────────────────┘
```

**Coûts infra estimés :** ~$20-55/mo

### Implementation Considerations

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| **Monorepo** | Oui (Turborepo) | Partage types, déploiement simplifié |
| **ORM** | Prisma | Type-safe, migrations versionnées |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Components** | shadcn/ui | Accessible, customizable |
| **State** | React Query / SWR | Server state management |
| **Testing** | Vitest + Playwright | Unit + E2E |

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche :** Problem-Solving MVP — résoudre le problème core (prospection email clean) avec le minimum de features pour valider la proposition de valeur.

**Philosophie :**
> "Ship Copilot mode first. Autopilot only after users prove they can use Copilot responsibly."

**Resource Requirements :**
- Solo dev / micro-équipe (1-2 personnes)
- Timeline : 4-6 semaines pour MVP
- Stack : Vercel + Supabase (infra simplifiée)

### MVP Feature Set (Phase 1)

**Journeys supportés :**
- ✅ Sophie Happy Path (premier RDV booké)
- ✅ Sophie Safe by Design (error recovery)
- ⏳ Marc Admin → Phase 2

**Must-Have Capabilities :**

| Module | Status | Notes |
|--------|--------|-------|
| Google OAuth login | ✅ MVP | Single user workspace |
| ICP Builder | ✅ MVP | Critères simples |
| Import CSV + manuel | ✅ MVP | Provenance tracée |
| Dropcontact enrichment | ✅ MVP | RGPD-native |
| Sequence builder (3 steps) | ✅ MVP | Copilot preview obligatoire |
| Gmail API sending | ✅ MVP | Quotas 20-50/jour |
| Inbox triage | ✅ MVP | LLM classification |
| Booking integration | ✅ MVP | Cal.com/Calendly webhook |
| Dashboard KPIs | ✅ MVP | Sent, Replies, RDV, Health |
| Guardrails (all on) | ✅ MVP | Non bypassables |
| DNS Onboarding Gate | ✅ MVP | Blocking before send |
| Audit logs | ✅ MVP | Actions sensibles |
| DSAR minimal | ✅ MVP | Export/delete endpoint |

### Post-MVP Features

**Phase 2 (Growth) — +8 semaines :**

| Feature | Trigger | Détail |
|---------|---------|--------|
| Mode Autopilot | Après validation Copilot | Conditions unlock strictes |
| Multi-inbox | Demande utilisateurs | Jusqu'à 5 inboxes |
| Team workspace | Demande PME | Multi-user + RBAC |
| CRM integrations | HubSpot, Pipedrive | 2-way sync |
| Hunter fallback | < 80% enrichment rate | Waterfall enrichment |
| Model routing | Cost optimization | Cheap → Quality LLM |

**Phase 3 (Expansion) — +12 semaines :**

| Feature | Trigger | Détail |
|---------|---------|--------|
| LinkedIn assisted | User demand | Reminders, copy suggestions |
| Agency white-label | 5+ agences actives | Custom branding |
| API publique | Platform demand | Developer ecosystem |
| Advanced analytics | Post-launch | Cohort analysis, attribution |

### Risk Mitigation Strategy

**Technical Risks :**

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Gmail API suspension | Basse | Limites officielles, OAuth propre |
| LLM hallucinations | Moyenne | Copilot = validation humaine |
| Deliverability dégradée | Moyenne | Onboarding gate, quotas, monitoring |

**Market Risks :**

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Users veulent bypass | Moyenne | Éduquer via onboarding + content |
| "Clean" = niche trop petite | Basse | Landing A/B test avant build |
| Competition scales faster | Moyenne | Différenciateur = compliance |

**Resource Risks :**

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Solo dev burnout | Moyenne | Stack simplifiée, scope strict |
| Scope creep | Élevée | MVP boundaries explicites |
| Budget LLM/enrichment | Basse | Model routing Phase 2, caps |

---

## Functional Requirements

> ⚠️ **Capability Contract :** Cette liste définit ce qui existera dans le produit. UX, Architecture, et Epics ne couvriront QUE ces capabilities.

### 1. Authentification & Workspace

- **FR1:** User can authenticate via Google OAuth
- **FR2:** User can create and access their personal workspace
- **FR3:** User can view their workspace dashboard with key metrics
- **FR4:** User can logout and revoke OAuth access

### 2. ICP & Prospects Management

- **FR5:** User can define ICP criteria (industry, size, role, location)
- **FR6:** User can import prospects via CSV upload with source tracking
- **FR7:** User can add individual prospects manually
- **FR8:** User can view prospect list with enrichment status
- **FR9:** User can delete prospects (with cascade to sequences)
- **FR10:** User can see provenance data (source) for each prospect
- **FR11:** System can automatically enrich prospects via Dropcontact API
- **FR12:** System can mark prospects as "verified email" or "not verified"

### 3. Sequence Builder & Templates

- **FR13:** User can create email sequences (max 3 steps)
- **FR14:** User can configure delay between sequence steps
- **FR15:** User can use template variables (first_name, company, etc.)
- **FR16:** User can request LLM-generated opener personalization
- **FR17:** User can preview each email before scheduling (Copilot mode)
- **FR18:** User can save sequences as reusable templates
- **FR19:** User can duplicate and edit existing sequences
- **FR20:** System can compute spam risk / compliance warnings at preview and block/require edits if high risk

### 4. Campaign Control

- **FR21:** User can launch a campaign from a sequence + a prospect list
- **FR22:** User can pause a running campaign (global)
- **FR23:** User can resume a paused campaign
- **FR24:** User can stop a campaign permanently
- **FR25:** User can pause/resume/stop sending for individual leads within a campaign

### 5. Email Sending & Scheduling

- **FR26:** User can connect their Gmail inbox via OAuth
- **FR27:** System can validate user's DNS config (SPF/DKIM/DMARC)
- **FR28:** System can block sending until deliverability onboarding is complete
- **FR29:** User can schedule sequence emails for sending
- **FR30:** System can send emails via Gmail API within quota limits
- **FR31:** System can respect daily sending quotas (20-50/day configurable)
- **FR32:** System can auto-pause sequences on deliverability anomaly triggers (bounce spike > 2%, unsubscribe spike, Postmaster health degradation, complaints if available)

### 6. Settings & Configuration

- **FR33:** User can configure sending window (days and hours)
- **FR34:** User can configure timezone for sending
- **FR35:** User can configure email signature
- **FR36:** User can configure from-name for outgoing emails
- **FR37:** User can configure safe defaults (quota, ramp-up profile)

### 7. Inbox & Response Management

- **FR38:** User can view incoming replies in unified inbox
- **FR39:** System can classify replies (Interested / Not Now / Negative / OOO / Bounce)
- **FR40:** User can manually reclassify replies
- **FR41:** User can see suggested reply text with booking link
- **FR42:** User can send reply directly from inbox
- **FR43:** System can detect and process unsubscribe requests
- **FR44:** System can add unsubscribed contacts to global suppression list

### 8. Booking & RDV Tracking

- **FR45:** User can configure booking integration (Calendly/Cal.com)
- **FR46:** User can include booking link in sequences and replies
- **FR47:** System can receive booking webhook and update lead status
- **FR48:** User can manually mark a lead as BOOKED (fallback if webhook unavailable)
- **FR49:** User can view RDV bookés count on dashboard

### 9. Dashboard & Analytics

- **FR50:** User can view email sending metrics (sent, delivered/failed, bounced)
- **FR51:** User can view reply metrics (total, by classification)
- **FR52:** User can view RDV metrics (booked, rate)
- **FR53:** User can view health score (deliverability indicator)
- **FR54:** User can see "First RDV" celebration notification

### 10. Guardrails & Compliance

- **FR55:** System can prevent sending to unverified emails
- **FR56:** System can deduplicate prospects (no duplicate sends)
- **FR57:** System can enforce sending quota limits
- **FR58:** System can add mandatory unsubscribe link to all emails
- **FR59:** User can access audit logs for all sending actions
- **FR60:** User can export their data (for DSAR)
- **FR61:** User can request data deletion (cascade delete)
- **FR62:** System can enforce 3-year data retention limit

### 11. Onboarding & Setup

- **FR63:** User can complete deliverability onboarding checklist
- **FR64:** User can see DNS configuration tutorial
- **FR65:** System can verify SPF/DKIM/DMARC configuration
- **FR66:** User can see onboarding progress indicator

---

**Total : 66 Functional Requirements** couvrant 11 capability areas.

---

## Non-Functional Requirements

### Performance

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR1** | Actions utilisateur (click, navigation) < 500ms | UX fluide |
| **NFR2** | Preview email génération < 3s | LLM personalization |
| **NFR3** | Classification reply < 5s | LLM triage inbox |
| **NFR4** | Import CSV 500 lignes < 10s | Onboarding fluide |
| **NFR5** | Dashboard load < 2s | Daily usage pattern |

### Security

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR6** | OAuth tokens stockés chiffrés (AES-256) | Gmail access |
| **NFR7** | Pas de credentials stockés côté client | OAuth flow propre |
| **NFR8** | HTTPS obligatoire (TLS 1.3) | Data in transit |
| **NFR9** | Audit logs immuables avec timestamp | Compliance RGPD |
| **NFR10** | Session timeout après 24h d'inactivité | Security hygiene |
| **NFR11** | Rate limiting API (100 req/min/user) | Abuse prevention |

### Scalability

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR12** | Support 50 users concurrents MVP | Beta scale |
| **NFR13** | Support 10K emails/jour total (platform) | Growth scenario |
| **NFR14** | DB schema prêt pour multi-tenant (workspaceId) | Phase 2 prep |
| **NFR15** | Queue job processing < 5min delay | Email scheduling |

### Accessibility

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR16** | WCAG 2.1 AA compliance (core flows) | B2B standard |
| **NFR17** | Keyboard navigation complete | Power users |
| **NFR18** | Screen reader compatible (labels ARIA) | Inclusive design |

### Integration

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR19** | Gmail API retry avec exponential backoff | Reliability |
| **NFR20** | Dropcontact API fallback graceful (queue + retry) | Enrichment reliability |
| **NFR21** | Webhook booking timeout 10s with retry | Booking sync |
| **NFR22** | LLM API timeout 30s avec fallback message | Personalization reliability |

### Compliance (RGPD/ePrivacy)

| NFR | Critère Mesurable | Contexte |
|-----|-------------------|----------|
| **NFR23** | DSAR requests processing < 30 jours | Legal requirement |
| **NFR24** | Data deletion cascade complete < 24h | Right to erasure |
| **NFR25** | Audit logs retention 3 ans | Compliance proof |
| **NFR26** | Opt-out processing immediate (< 1s) | ePrivacy |

---

**Total : 26 Non-Functional Requirements** couvrant 6 catégories.


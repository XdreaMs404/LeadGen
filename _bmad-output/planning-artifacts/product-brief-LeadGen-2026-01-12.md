---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - "_bmad-output/analysis/brainstorming-session-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/domain-clean-prospecting-compliance-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/market-b2b-prospecting-tools-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/technical-mvp-architecture-2026-01-12.md"
date: 2026-01-12
author: Alex
project_name: LeadGen
---

# Product Brief: LeadGen

## Executive Summary

**LeadGen** est une plateforme de prospection B2B conçue pour les solopreneurs et petites équipes sales (1–5 personnes) qui veulent générer des RDV qualifiés sans compromettre leur délivrabilité ni stresser sur la conformité.

**Positionnement :** "Clean Prospecting" — le premier outil qui **refuse de laisser l'utilisateur spammer**. Guardrails intégrés, mode Copilot par défaut, conformité RGPD native.

**Concept :** All-in-one cockpit orienté résultats — du ciblage au RDV booké, avec protection à chaque étape.

**Promesse :** Moins d'emails, plus de RDV qualifiés. 20–30 minutes/jour pour un pipeline régulier, sans risquer son domaine.

**North Star Metric :** RDV bookés / taux de réponses qualifiées (pas volume d'emails).

**MVP Scope :** Email uniquement + Copilot mode + guardrails on by default.

---

## Core Vision

### Problem Statement

Les outils de prospection B2B actuels sont conçus pour **maximiser le volume** plutôt que la qualité :

1. **Illusion du volume** — Ils propagent le mythe "plus j'envoie, plus j'ai de résultats", alors que cela :
   - Détruit la délivrabilité du domaine
   - Augmente les spam complaints
   - Expose à des sanctions RGPD

2. **Conformité en second plan** — La compliance est traitée comme une checkbox optionnelle, créant stress et risque pour les utilisateurs non-experts.

3. **Personnalisation "IA-générique"** — Les messages générés sont détectables, ce qui dégrade la perception et réduit les réponses qualifiées.

4. **Pas de protection utilisateur** — Aucun outil ne protège activement l'utilisateur de ses propres mauvais réflexes (envois massifs, templates spammy, absence de préparation domaine).

### Problem Impact

| Impact | Conséquence |
|--------|-------------|
| **Domaine grillé** | Emails en spam, réputation irréversiblement dégradée |
| **Temps perdu** | Heures passées à envoyer pour des résultats décevants |
| **Stress juridique** | Peur des sanctions RGPD, incertitude sur la légalité |
| **Cycle frustrant** | Plus d'envois → moins de résultats → plus d'envois → pire résultats |
| **Coût d'opportunité** | Focus sur la mécanique d'envoi au lieu de la qualité des conversations |

### Why Existing Solutions Fall Short

| Outil | Approche | Problème |
|-------|----------|----------|
| **Instantly, Smartlead** | "Scale to millions of emails" | Course au volume = spam industriel |
| **Lemlist** | "Get more replies" | Pas de guardrails, compliance basique |
| **Apollo** | "Find anyone's email" | DB massive mais accuracy variable, pas de protection |
| **Outreach, Salesloft** | Enterprise engagement | Trop complexe, trop cher pour solo/PME |
| **Waalaxy, Dripify** | LinkedIn automation | Risque ToS, bans fréquents |

**Gap critique :** Aucun outil ne place la **compliance et la deliverability** comme proposition de valeur #1 avec des guardrails réels intégrés au cœur du produit.

### Proposed Solution

**LeadGen** est un **all-in-one cockpit** de prospection B2B "Clean Prospecting" qui protège l'utilisateur de ses propres mauvais réflexes :

#### Workflow End-to-End

```
ICP Builder → Sourcing Prospects → Enrichissement → Personnalisation LLM
    ↓
Séquences Email → Inbox Unifiée → Triage + Suggestions → Booking RDV
    ↓
Analytics & Optimisation
```

#### Deux Modes Opératoires

| Mode | Description | Activation |
|------|-------------|------------|
| **🎯 Copilot** (défaut) | L'outil prépare tout, l'utilisateur valide avant envoi | Always on |
| **🤖 Autopilot** (optionnel) | Envoi automatique, verrouillé derrière conditions | Upgrade + conditions : deliverability OK + ramp-up validé + quotas stricts + conformité vérifiée |

#### Guardrails "Safe by Design"

- ✅ **Quotas intelligents** — Safe defaults configurables (ex. 20–50 emails/inbox/jour selon setup), ajustés dynamiquement via health metrics (bounces/complaints)
- ✅ **Ramp-up progressif** — Montée en volume graduelle + monitoring + deliverability checklist (warm-up recommandé, pas promesse produit MVP)
- ✅ **Déduplication** — Cross-campaign, cross-workspace
- ✅ **Suppression auto** — Hard bounces, opt-outs, complaints
- ✅ **Audit logs** — Traçabilité complète pour DSAR
- ✅ **Spam score preview** — Alerte avant envoi si risque
- ✅ **Opt-out 1-clic** — Dans chaque email, global blacklist

### Key Differentiators

| Différenciateur | LeadGen | Concurrents |
|-----------------|---------|-------------|
| **Positionnement** | Compliance = valeur #1 | Compliance = feature cachée |
| **Mode par défaut** | Copilot (validation humaine) | Full auto (risque utilisateur) |
| **Guardrails** | Intégrés, non-bypassables | Optionnels ou absents |
| **Métrique North Star** | RDV bookés / réponses qualifiées | Emails envoyés |
| **Promesse** | "Moins d'emails, plus de RDV" | "Scale unlimited" |
| **RGPD** | Native, EU data, sources vérifiées | Checkbox compliance |

#### Unfair Advantage

**L'avantage n'est pas une data secrète, mais une philosophie produit :**

1. **Compliance + Deliverability dans le cœur** — Pas en checkbox, mais en architecture système
2. **Guardrails réels** — L'utilisateur ne PEUT PAS se tirer une balle dans le pied
3. **Confiance + Résultats** — Le moat se construit sur la réputation et les métriques concrètes

#### Why Now?

| Signal | Impact |
|--------|--------|
| **Fatigue du spam** | Efficacité des blasts en chute libre, marché prêt pour une alternative |
| **Exigences providers renforcées** | SPF/DKIM/DMARC requis (surtout bulk senders depuis Feb 2024), tendance à plus d'enforcement |
| **RGPD enforcement en hausse** | Sanctions croissantes en Europe, sensibilité forte au "Clean" |
| **Shift quality > quantity** | Moment idéal pour "Compliance-Led Growth" plutôt que "growth at all costs" |

---

## Target Users

### Primary User: "Sophie" — Solopreneur B2B

**Profil**
- Solopreneur B2B : consultant, freelance growth, dev/agency solo, fondateur micro-SaaS
- Travaille seule ou en micro-équipe (1–2 personnes)
- Besoin : 1–4 nouveaux clients/mois
- Budget limité, temps contraint (20–30 min/jour max pour prospection)
- Expertise technique moyenne (sait utiliser SaaS, pas experte deliverability)

**Motivations**
- Pipeline régulier de prospects qualifiés
- Indépendance vis-à-vis du bouche-à-oreille
- Protéger sa réputation professionnelle et son domaine

**Frustrations**
- Peur de spammer et de passer pour un amateur
- Temps perdu sur des emails sans réponse
- Confusion technique (SPF, DKIM, warm-up...)
- Outils existants poussent au volume, pas à la qualité

**Victoire Parfaite**
> "Je sais exactement quoi envoyer, à qui, et pourquoi. Je n'ai plus peur de ruiner mon domaine : l'outil me met des garde-fous. Je reçois des réponses qualifiées et je peux booker des RDV sans y passer mes soirées. Je comprends ce qui marche grâce à des métriques simples."

### Secondary User: "Marc" — Sales Lead PME

**Profil**
- Responsable commercial en PME (équipe 1–5 personnes)
- Doit structurer et superviser la prospection outbound
- Variabilité d'expertise technique dans l'équipe

**Motivations**
- **Gouvernance** : policies, quotas, approvals avant envoi
- **Traçabilité** : audit logs, conformité RGPD, preuves
- **Standardisation** : templates partagés, séquences validées, règles d'équipe
- Visibilité consolidée sur les métriques

**Frustrations**
- Chaos multi-outils, pratiques hétérogènes
- Risques RGPD avec prestataires/outils précédents
- Pas de vue consolidée sur ce qui fonctionne
- Peur qu'un commercial "fasse n'importe quoi" et grille le domaine

**Victoire Parfaite**
> "Mon équipe prospecte de façon cohérente, je vois les métriques, j'ai le contrôle sur les pratiques, et je suis serein sur la conformité."

### Jobs To Be Done (JTBD)

| Job | Contexte | Critère de Succès |
|-----|----------|-------------------|
| **Identifier des prospects pertinents** | "Quand je veux trouver des clients potentiels..." | 50–200 prospects qualifiés/semaine |
| **Écrire des emails qui génèrent des réponses** | "Quand je contacte quelqu'un que je ne connais pas..." | Reply rate objectif 3% (acceptable 2–5% selon ICP) |
| **Envoyer sans ruiner mon domaine** | "Quand j'ai peur du spam..." | Bounce < 2%, spam complaints très bas + pause auto si anomalie |
| **Gérer les réponses efficacement** | "Quand je dois qualifier/trier..." | < 5 min/réponse, rien ne passe entre les mailles |
| **Booker des RDV rapidement** | "Quand quelqu'un est intéressé..." | < 24h entre réponse positive et RDV booké |
| **Suivre et optimiser ce qui marche** | "Quand je veux améliorer mes résultats..." | Savoir quelles campagnes/personas/angles génèrent des réponses qualifiées |
| **Centraliser l'historique & le suivi** | "Quand je veux tout avoir au même endroit..." | Lead status, messages, réponses, RDV — aucune conversation ne se perd |

### Use Cases End-to-End

#### UC1: Lancement de campagne (Sophie)
**Trigger:** Sophie veut promouvoir son offre
**Flow:** ICP → Sourcing 100 prospects → Enrich → Sequence 3 steps → Copilot preview → Envoi sur 2 semaines
**Succès:** Bounce < 2%, Reply ≥ 3%, Setup < 2h
**Mode:** Copilot (safe by default)

#### UC2: Traitement inbox quotidien (Sophie)
**Trigger:** Ouverture LeadGen le matin
**Flow:** Voir réponses triées (Interested / Not Now / Negative / OOO) → Suggestion réponse → Lien booking → Archive
**Succès:** < 15 min/jour, 100% hot leads traités same day

#### UC3: Protection domaine — Prérequis Autopilot
**Trigger:** Utilisateur veut activer Autopilot ou simplement envoyer
**Flow:** Checklist DNS (SPF/DKIM/DMARC) → Health score calculé → Quotas safe appliqués → Monitoring continu → Alerte + pause auto si anomalie
**Succès:** 0 email envoyé sans config validée, pause automatique si bounce > 2% ou complaint anormal
**Note:** Cette UC est le **prérequis obligatoire** pour débloquer Autopilot. Copilot = safe by default, Autopilot = unlock uniquement si health score + checklist OK.

#### UC4: Onboarding équipe (Marc)
**Trigger:** Marc veut standardiser la prospection équipe
**Flow:** Créer workspace → Invitations 3 commerciaux → Templates + séquences partagés → Copilot obligatoire pour tous → Policies (quotas, approvals)
**Succès:** 3 users actifs < 1 semaine, vue metrics consolidée, audit trail actif

#### UC5: Premier RDV booké (Sophie)
**Trigger:** Première réponse "Interested"
**Flow:** Notif hot lead → Suggestion réponse + lien booking → Validation → Prospect booke → RDV visible dans dashboard
**Succès:** < 24h entre réponse et RDV booké, célébration visuelle "Premier RDV 🎉", prospect marqué BOOKED

### Objections & Réponses

| Objection | Réponse LeadGen |
|-----------|-----------------|
| "C'est un outil de spam" | Guardrails + quotas + Copilot = impossible de spammer |
| "Apollo/Lemlist font pareil" | Eux vendent le volume, nous protégeons ta réputation |
| "Pas le temps d'apprendre" | Onboarding guidé, Copilot prépare tout, tu valides |
| "Trop technique (deliverability)" | Checklist claire + monitoring auto + health score simple |
| "Et si ça marche pas ?" | North Star = RDV bookés, pas emails envoyés. On mesure ce qui compte. |
| "J'ai déjà un CRM, ça s'intègre ?" | Export/import CSV MVP + intégrations CRM en phase 2 |
| "D'où viennent les données ? C'est légal ?" | Provenance data explicite, sources vérifiées (Dropcontact = audité CNIL), garde-fous "clean" intégrés |

---

## Success Metrics

### North Star Metric

**RDV bookés / taux de réponses qualifiées** — pas volume d'emails envoyés.

Le produit est jugé sur sa capacité à générer des conversations qualifiées menant à des rendez-vous, pas sur le nombre d'emails envoyés.

#### Définitions Clés

| Terme | Définition |
|-------|------------|
| **Réponse qualifiée** | Interested + demandes d'info + "forward to colleague" (exclut : OOO, bounce, unsubscribe, negative) |
| **RDV booké** | Événement créé (Calendly/Google Calendar) + statut "BOOKED" dans le système (pas juste "lien envoyé") |

### User Success Metrics

| Métrique | Objectif | Acceptable | Notes |
|----------|----------|------------|-------|
| **Reply rate** | 3% | 2–5% selon ICP | Très dépendant du segment cible |
| **Positive reply rate** | ≥1% | À calibrer selon offre | Leads qualifiés uniquement |
| **RDV bookés / 100 prospects** | ≥2 | ≥1 | North Star proxy |
| **Temps traitement inbox/jour** | < 15 min | < 30 min | Copilot doit faciliter |
| **Délai réponse → RDV** | < 24h | < 48h | Hot leads prioritaires |

### Deliverability & Health Metrics

| Métrique | Seuil Acceptable | Action Automatique |
|----------|------------------|-------------------|
| **Bounce rate** | < 2% | Pause auto si dépassé |
| **Spam complaint rate** | < 0.1% | Pause auto si anormal (signal partiel selon provider) |
| **Unsubscribe rate** | Monitoring continu | Pause auto + alerte si spike anormal |
| **Health score** | > 80/100 | Alerte + recommandations si < 60 |

> ⚠️ **Note :** Les spam complaints sont un signal partiel selon les providers (pas tous n'envoient de feedback loop). Le système s'appuie donc sur monitoring multi-signaux + garde-fous proactifs.

### Business Objectives

| Horizon | Objectif | Métrique | Target |
|---------|----------|----------|--------|
| **3 mois** | Validation MVP | Beta users actifs | 20 users |
| **3 mois** | Product-Market Fit signal | NPS | ≥ 40 |
| **6 mois** | Traction | MRR | €3–5K |
| **6 mois** | Retention | Users actifs M3 | ≥ 50% |
| **12 mois** | Growth | MRR | €15–20K |
| **12 mois** | Expansion | Agency tier users | 5+ agences |

### Product KPIs

| KPI | Définition | Cible | Alerte Rouge |
|-----|------------|-------|--------------|
| **Activation rate** | % users envoyant 1ère campagne < 7j | > 60% | < 30% |
| **Time-to-first-send** | Délai signup → 1er email envoyé | < 48h | > 7 jours |
| **Time-to-first-reply** | Délai signup → 1ère réponse reçue | < 14 jours | > 30 jours |
| **WAU / MAU** | Weekly Active Users / Monthly Active Users | > 70% | < 40% |
| **Campaign completion** | % campagnes terminées (tous steps envoyés) | > 80% | < 50% |
| **Inbox zero rate** | % users traitant toutes réponses/jour | > 60% | < 30% |

### Guardrails Metrics (Compliance & Safety)

| Métrique | Seuil | Action |
|----------|-------|--------|
| **Bounce rate plateforme** | < 2% global | Alerte admin si > 3% |
| **DSAR requests** | 100% traitées < 30 jours | Alerte si délai dépassé |
| **Audit log coverage** | 100% actions sensibles | Alerte si gap détecté |

---

## MVP Scope

### Core Features (MUST)

| Module | Features MVP | Détail |
|--------|-------------|--------|
| **Auth & Workspace** | Google OAuth login | 1 user = 1 workspace (multi-tenant préparé) |
| **ICP Builder** | Critères simples | Industrie, taille, rôle, localisation + estimation volume |
| **Sourcing** | Import CSV + ajout manuel | Pas de scraping — "Clean" by design, sourcing automatisé = Phase 2 |
| **Enrichissement** | Dropcontact (RGPD-native) | Email vérifié + company + role. **Guardrail : no send without verified email** — lead SUPPRESSED si non vérifié |
| **Personnalisation** | Templates + variables + LLM opener | Gemini Flash pour génération icebreaker |
| **Sequences** | 3 steps max, delays configurables | Copilot preview obligatoire avant envoi |
| **Sending** | Gmail API OAuth | 1 inbox, quotas safe (20-50/jour), ramp-up progressif |
| **Inbox** | Réception + triage auto | Interested / Not Now / Negative / OOO |
| **Suggestions** | Reply suggestions + lien booking | LLM classification |
| **Booking** | Lien Calendly/Cal.com + statut BOOKED | Webhook si simple, sinon fallback manuel |
| **Dashboard** | KPIs simples | Sent, Replies, RDV, Health score |
| **Guardrails** | All on by default | Quotas, dedup, suppression, audit, opt-out, no-send-without-verified |

### Principes Produit MVP

- **Provenance data explicite** : chaque lead a une source tracée
- **No send without verified email** : guardrail non bypassable
- **Copilot by default** : validation humaine avant tout envoi
- **Safe defaults** : quotas, ramp-up, pause auto si anomalie

### Mode par Défaut

| Mode | MVP | Notes |
|------|-----|-------|
| **🎯 Copilot** | ✅ **Défaut** | Preview + validation avant chaque envoi |
| **🤖 Autopilot** | ❌ **Pas MVP** | Phase 2 avec conditions d'unlock (UC3) |

### Screens MVP

| Screen | Contenu |
|--------|---------|
| **Dashboard** | Activité semaine, campagnes actives, inbox count, KPIs, health score |
| **ICP Builder** | Formulaire critères + preview liste + estimation volume |
| **Leads Table** | Prospects, statut, source, score, actions bulk |
| **Lead Detail** | Profil, historique messages, notes, actions (blacklist/booking) |
| **Sequence Builder** | Steps, templates, variables, spam score preview |
| **Unified Inbox** | Réponses triées, suggestions, actions rapides |
| **Settings** | Profil, inbox connectée, quotas, notifications |
| **Onboarding** | Wizard 5 étapes (connect Gmail, config ICP, import, sequence, send) |

### Out of Scope MVP

| Feature | Raison | Phase |
|---------|--------|-------|
| LinkedIn automation | Risque ToS, complexité | Phase 2 |
| Mode Autopilot | Validation Copilot d'abord | Phase 2 |
| Multi-inbox | Complexité, pas essentiel validation | Phase 2 |
| CRM integrations | Focus core first | Phase 2 |
| Sourcing automatisé | Annuaires, scraping = Phase 2 | Phase 2 |
| Advanced analytics | Post-validation | Phase 2 |
| Team features | Marc use case (policies, approvals) | Phase 2 |
| Warm-up intégré | Checklist + recommandation suffisent | Phase 2+ |
| Open/Click tracking | Risque deliverability, privacy EU | Opt-in Phase 2 |

### MVP Success Criteria (Gate to Phase 2)

| Critère | Seuil | Comment mesurer |
|---------|-------|-----------------|
| **Beta users actifs** | 20 users | Tracking usage |
| **Activation < 7j** | > 60% | Users qui envoient 1ère campagne |
| **Reply rate moyen** | > 2% | Avg across all campaigns |
| **RDV bookés** | ≥ 10 total | Webhook ou statut manuel |
| **NPS ou feedback** | ≥ 40 NPS | Survey post-usage |
| **Health plateforme** | Bounce < 2% | Monitoring continu |

### Future Vision

| Phase | Focus | Features |
|-------|-------|----------|
| **Phase 2** | Scale + Team | Autopilot (conditions), Multi-inbox, Team workspace, CRM sync, Sourcing automatisé |
| **Phase 3** | Expansion | LinkedIn assisté, Advanced analytics, Agency white-label |
| **Phase 4** | Platform | API publique, Marketplace templates, Scoring ML |

---

## Document Metadata

| Champ | Valeur |
|-------|--------|
| **Version** | 1.0 |
| **Date** | 2026-01-12 |
| **Auteur** | Alex |
| **Facilitateur** | Mary (Business Analyst) |
| **Statut** | ✅ Complet |
| **Prochaine étape recommandée** | PRD (Product Requirements Document) |

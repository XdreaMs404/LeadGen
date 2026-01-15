---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-LeadGen-2026-01-12.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/research/market-b2b-prospecting-tools-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/domain-clean-prospecting-compliance-2026-01-12.md"
  - "_bmad-output/planning-artifacts/research/technical-mvp-architecture-2026-01-12.md"
workflow: ux-design
project_name: LeadGen
author: Alex
date: 2026-01-12
---

# UX Design Specification — LeadGen

**Author:** Alex
**Date:** 2026-01-12
**Facilitator:** Sally (UX Designer)

---

## Executive Summary

### Project Vision

**LeadGen** est une plateforme de prospection B2B positionnée sur le "Clean Prospecting" — où compliance et délivrabilité sont la proposition de valeur #1, pas une contrainte subie.

L'expérience utilisateur doit incarner cette philosophie : **chaque interaction protège l'utilisateur** de ses propres mauvais réflexes, tout en rendant cette protection invisible et non-frustrante.

**North Star UX :** L'utilisateur ressent que l'outil "veille sur lui" plutôt qu'il le "restreint".

### Target Users

**Primary — Sophie (Solopreneur B2B)**
- Temps : 20-30 min/jour max
- Expertise technique : Faible à moyenne
- Motivation : Pipeline régulier sans stress
- Peur principale : Ruiner son domaine, passer pour un spammer
- **UX Goal :** "Je sais exactement quoi faire, et l'outil me protège."

**Secondary — Marc (Sales Lead PME, Phase 2)**
- Besoin : Gouvernance, traçabilité, conformité
- Motivation : Structurer l'équipe après un incident
- **UX Goal :** "Mon équipe prospecte proprement, j'ai le contrôle."

### Key Design Challenges

1. **Onboarding Deliverability Gate**
   - Transformer une tâche technique (DNS) en expérience guidée et rassurante
   - Blocking gate qui éduque plutôt que frustre

2. **Mode Copilot = Friction perçue**
   - La validation humaine doit sembler "coach" pas "frein"
   - Preview ultra-rapide, suggestions intelligentes

3. **Guardrails acceptés**
   - Quotas et pauses auto comme protection, pas restriction
   - Éducation inline + Health Score visible

4. **Inbox Zero en <15 min/jour**
   - Triage AI pré-fait, actions 1-clic
   - L'inbox est un assistant, pas une liste de tâches

5. **First Win Celebration**
   - Moment "Aha!" au premier RDV booké
   - Feedback positif visible, progression gamifiée

### Design Opportunities

1. **Clean Dashboard** — Santé en premier, volume en second
2. **Copilot as Partner** — Langage empathique, protection bienveillante
3. **Gamified Onboarding** — DNS config = quête accomplie
4. **Zero-Effort Inbox** — Assistant qui trie, suggère, et accélère
5. **Transparency = Trust** — Source visible, raison expliquée

---

## Core User Experience

### Defining Experience

**Core Loop :** Le workflow quotidien de Sophie s'articule autour de 3 moments clés :
1. **Morning Check (2 min)** — Dashboard santé + nouvelles réponses
2. **Inbox Processing (10-15 min)** — Traiter les réponses triées par l'AI
3. **Weekly Campaign Prep (30 min)** — Créer/valider nouvelle séquence

**Action Fondamentale :** "Valider et lancer une campagne en confiance" — pas "envoyer des emails". Le produit protège, l'utilisateur pilote.

### Platform Strategy

| Plateforme | Scope | Notes |
|------------|-------|-------|
| **Web App Desktop** | Full feature | Primary experience, keyboard-first |
| **Mobile Responsive** | Dashboard + Inbox | Monitoring, réponses urgentes |
| **PWA Notifications** | Phase 2 | Hot leads alerts |

**Contraintes :**
- Connexion requise (APIs externes)
- Browser moderne (Chrome, Firefox, Safari, Edge)

### Effortless Interactions

| Interaction | Objectif | Pattern UX |
|-------------|----------|------------|
| **CSV → Campaign** | < 5 min setup | Upload → Auto-enrich → Preview → Launch |
| **Inbox Triage** | < 15 min/jour | AI pre-sort, catégories visuelles, 1-clic actions |
| **Reply to Interested** | 2 clics | Suggestion + booking link → Envoyer |
| **Health Monitoring** | Passive awareness | Badge couleur permanent, alertes proactives |
| **DNS Onboarding** | Guided confidence | Wizard step-by-step, validation live, celebration |

### Critical Success Moments

| Moment | Trigger | UX Response |
|--------|---------|-------------|
| **Onboarding Complete** | DNS validated | "Tu es prête !" message + unlock envoi |
| **First Reply** | Reply detected | Notification + auto-triage visible |
| **First RDV Booké** | Booking webhook | 🎉 Célébration visuelle, milestone badge |
| **Healthy Week** | 7 jours stable | Health Score vert + encouragement |

**Failure Prevention :**
- Blocking gate avant premier envoi si DNS non validé
- Auto-pause + guidance si bounce spike
- Progressive disclosure pour éviter overwhelm

### Experience Principles

1. **Protection Visible** — Les guardrails expliquent leur raison d'être
2. **Copilot = Coach** — La validation est un partenariat, pas un frein
3. **Inbox = Assistant** — L'AI trie et suggère avant que Sophie n'agisse
4. **Celebrate Wins** — Micro-célébrations à chaque milestone
5. **Transparency = Trust** — Sources, raisons, audit toujours accessibles

---

## Desired Emotional Response

### Primary Emotional Goals

| Émotion | Définition | Déclencheurs |
|---------|-----------|--------------|
| **Protected** | Se sentir veillé·e et en sécurité | Health Score, guardrails visibles, messages rassurants |
| **Confident** | Savoir exactement quoi faire | Preview Copilot, validations, one clear CTA |
| **Accomplished** | Ressentir la victoire à chaque étape | Célébrations, checkmarks, progress tracking |

**Différenciateur émotionnel :** "Protection bienveillante" vs "Power tools" des concurrents.

### Emotional Journey Mapping

| Phase | Émotion Cible | Émotion à Éviter | Pattern |
|-------|--------------|------------------|---------|
| **Onboarding** | Guidé, Capable | Intimidé | Wizard step-by-step |
| **Première Campagne** | Confiance, Excitement | Doute | Preview + "Tu es prête" |
| **Attente** | Patience, Trust | Anxiété | Health Score visible |
| **Premier RDV** | 🎉 Euphorie | - | Célébration maximale |
| **Usage Quotidien** | Routine, Control | Ennui | Wins réguliers |

### Micro-Emotions

**À cultiver :**
- Confiance (vs Confusion) — Clear CTAs, one action per screen
- Trust (vs Scepticisme) — Transparency on data sources
- Calm (vs Anxiété) — Stable Health Score, gentle alerts

**À éviter absolument :**
- Panique ("Mes emails sont-ils en spam?!")
- Culpabilité ("Je spamme des gens")
- Overwhelm ("Trop d'options")
- Abandon ("C'est trop technique")

### Design Implications

| Émotion | Pattern UX |
|---------|-----------|
| **Protected** | Health Score badge permanent, guardrails non-intrusifs |
| **Confident** | Preview complet avant envoi, validation visuelle |
| **Accomplished** | Micro-célébrations animées, progress indicators |
| **Calm** | Whitespace, hiérarchie claire, pas de rouge "urgent" |
| **Trust** | Source attribution visible, audit accessible |

### Emotional Design Principles

1. **Protection = Confort** — Guardrails rassurent, ne restreignent pas
2. **Small Wins > Big Stress** — Célébrer chaque étape
3. **Transparency Builds Trust** — Montrer le "pourquoi"
4. **Calm UI, Clear CTA** — Un écran = une action principale
5. **Empathy in Copy** — Le produit parle comme un coach bienveillant

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

| Produit | Inspiration Clé | Application LeadGen |
|---------|-----------------|---------------------|
| **Notion** | Onboarding guidé, empty states clairs | Wizard DNS, templates séquences |
| **Linear** | Speed, polish, keyboard-first | Shortcuts, micro-animations |
| **Superhuman** | Inbox triage rapide, AI suggestions | 1-clic actions, LLM replies |
| **Stripe** | Trust, clarity, pro feel | Health Score, tooltips |

### Transferable UX Patterns

**Navigation :**
- Sidebar + main content layout
- Keyboard navigation (⌘K command palette)

**Onboarding :**
- Wizard step-by-step avec progress bar
- Célébration à chaque étape complétée

**Inbox :**
- Triage AI pré-fait (4 catégories max)
- Actions 1-clic avec shortcuts

**Feedback :**
- Micro-animations premium (Linear-style)
- Health Score couleur permanente

**Trust :**
- Tooltips explicatifs sur chaque guardrail
- Source attribution visible

### Anti-Patterns to Avoid

| Anti-Pattern | Alternative |
|--------------|-------------|
| Compteurs rouges "urgents" | Badges neutres, pas de stress artificiel |
| Métriques volume (emails sent) | Focus RDV bookés, réponses qualifiées |
| Onboarding skippable | Blocking gate DNS non-bypassable |
| Pop-ups intrusifs | Notifications subtiles in-flow |
| Guilt-trip messages | Encouragement positif uniquement |

### Design Inspiration Strategy

**Adopter :** Sidebar nav (Linear), Health badge (Stripe), Wizard onboard (Notion), Shortcuts (Superhuman)

**Adapter :** Inbox triage (simplifier), Command palette (actions LeadGen), Celebrations (significatives)

**Éviter :** Red counters, volume metrics, skippable onboarding, intrusive modals

---

## Design System Foundation

### Design System Choice

**Choix :** shadcn/ui + Tailwind CSS

**Type :** Themeable component library (copy-paste architecture)

### Rationale for Selection

| Facteur | Décision |
|---------|----------|
| **Speed** | Composants prêts à l'emploi, pas de design from scratch |
| **Customization** | CSS variables, theming complet |
| **Accessibility** | Radix primitives, WCAG 2.1 compliant |
| **Tech Fit** | Native Tailwind, Next.js compatible |
| **Aesthetic** | Premium B2B feel (Linear/Stripe vibes) |
| **Maintenance** | Code dans le repo, pas de npm updates breaking |

### Implementation Approach

**Phase 1 — Setup :**
1. `npx shadcn-ui@latest init`
2. Configure Tailwind theme tokens
3. Import base components (Button, Card, Form, Dialog, DataTable)

**Phase 2 — Custom Components :**
- HealthScore badge
- LeadStatusBadge system
- InboxCard with actions
- WizardStepper for onboarding
- EmailPreview for Copilot

### Customization Strategy

**Color Palette — "Clean Prospecting" :**
- Primary: Green-teal (Protection, santé)
- Secondary: Blue-gray (Pro, calme)
- Success: Green (Health OK)
- Warning: Amber (Alerte douce, pas panique)
- Destructive: Red (Suppressions only)

**Typography :**
- Font: Inter (modern, lisible, Google Font)
- Scale: 14px base, modular scale

**Components :**
- Border radius: 0.5rem (subtle rounding)
- Shadows: Minimal, subtle elevation
- Animations: Framer Motion for celebrations

---

## Defining User Experience

### Defining Experience Statement

> **"Preview, launch, et l'outil fait le reste — proprement."**

Le cœur de LeadGen est le **moment Copilot** : l'utilisateur preview sa campagne, valide en confiance, et sait que l'envoi sera protégé.

### User Mental Model

**Shift mental attendu :**

| De | Vers |
|----|------|
| "Cold email = spam risqué" | "Cold email = protégé + guidé" |
| "Plus j'envoie, mieux c'est" | "Moins mais mieux = plus de RDV" |
| "Je dois tout faire moi-même" | "L'outil m'accompagne" |

### Success Criteria

| Critère | Indicateur | Seuil |
|---------|-----------|-------|
| **This just works** | Time to first campaign | < 2h |
| **I feel safe** | 0 email sans DNS OK | 100% |
| **It's effortless** | Daily inbox processing | < 15 min |
| **I'm winning** | First RDV booké | < 14 jours |

### Novel UX Patterns

| Pattern | Type | Différenciateur |
|---------|------|-----------------|
| **Copilot Preview** | Novel | Preview obligatoire avant envoi |
| **Blocking Gate DNS** | Novel | Aucun envoi si config incomplète |
| **Visible Health Score** | Novel | Badge permanent, pas settings caché |
| **Inbox AI Triage** | Enhanced | 4 catégories, 1-clic actions |
| **First Win Celebration** | Enhanced | Plus visible que concurrents |

### Experience Mechanics

**Flow "Copilot Launch" :**

1. **Initiation** — Nouvelle campagne → Sélection liste + template
2. **Interaction** — Preview chaque email, LLM suggestions, Approve/Edit
3. **Feedback** — Badges validation, spam warnings, progress bar
4. **Completion** — "🚀 Campagne prête", résumé, CTA launch, celebration

---

## Visual Design Foundation

### Color System

**Theme :** "Clean Prospecting" — Pro, Calme, Protecteur

| Rôle | Couleur | HSL |
|------|---------|-----|
| **Primary** | Teal | `hsl(168, 76%, 42%)` |
| **Secondary** | Slate | `hsl(215, 20%, 65%)` |
| **Background** | Off-white | `hsl(0, 0%, 99%)` |
| **Surface** | Light Gray | `hsl(210, 20%, 98%)` |
| **Success** | Green | `hsl(142, 71%, 45%)` |
| **Warning** | Amber | `hsl(38, 92%, 50%)` |
| **Destructive** | Red | `hsl(0, 84%, 60%)` |

**Rationale :** Teal primary évoque protection/santé, différencie du bleu SaaS standard.

### Typography System

**Font Family :** Inter (Google Fonts)

| Level | Size | Weight |
|-------|------|--------|
| H1 | 32px | Bold |
| H2 | 24px | Semibold |
| H3 | 20px | Semibold |
| Body | 14px | Regular |
| Caption | 12px | Medium |

**Rationale :** Inter = moderne, lisible, utilisé par Linear/Vercel/Notion.

### Spacing & Layout Foundation

**Base Unit :** 4px

**Scale :** 4, 8, 12, 16, 24, 32, 48px

**Layout Grid :**
- 12 colonnes, 24px gutter
- Max width : 1280px
- Sidebar : 260px fixed

### Accessibility Considerations

| Requirement | Standard |
|-------------|----------|
| Contrast | WCAG 2.1 AA (4.5:1) |
| Focus states | 2px ring visible |
| Touch targets | Min 44x44px |
| Color-only | Never — always icon/text |

---

## Design Direction Decision

### Design Directions Explored

**Direction unique retenue** basée sur l'analyse complète :
- Inspirations : Linear (speed, polish), Notion (onboarding), Superhuman (inbox), Stripe (trust)
- Contraintes : 20-30 min/jour max, expertise technique faible-moyenne
- Différenciateur : Clean Prospecting = protection visible

### Chosen Direction

**"Clean Professional"** — Layout sidebar + main content

| Aspect | Choix |
|--------|-------|
| **Layout** | Sidebar fixe (260px) + Main content |
| **Header** | Minimal — Logo, Health Score, User menu |
| **Density** | Medium — Aéré mais efficace |
| **Style** | Clean, minimal, premium (Linear/Stripe) |
| **CTAs** | Un CTA teal principal par écran |

### Design Rationale

1. **Sidebar nav** — Standard B2B, keyboard-friendly, scalable
2. **Health Score en header** — Visible permanent, core value prop
3. **Medium density** — Balance efficacité/clarté pour Sophie
4. **Teal accents** — Protection, santé, différenciation
5. **Micro-animations** — Premium feel sans distraction

### Implementation Approach

| Phase | Scope | Priorité |
|-------|-------|----------|
| P0 | Dashboard, Onboarding, Prospects | Critique |
| P1 | Campaign Builder, Preview | Haute |
| P2 | Inbox, Replies | Moyenne |
| P3 | Settings, Analytics | Basse |

---

## User Journey Flows

### Journey 1: Sophie's Happy Path

**Goal :** First campaign → First booked meeting

**Key Steps :**
1. Signup → Onboarding → DNS Gate
2. Import → Enrich → Template → Copilot Preview
3. Launch → Wait → Receive Reply
4. AI Triage → Respond → Book → 🎉 First Win

**Critical Moments :**
- DNS Gate = Blocking but guided
- Copilot Preview = Protection visible
- First Win = Maximum celebration

### Journey 2: Onboarding DNS Gate

**Goal :** Configure deliverability before first send

**Flow :** SPF → DKIM → DMARC → Unlock

**UX Principles :**
- Step-by-step (not overwhelming all at once)
- Validation button (manual trigger, not auto)
- Clear instructions with copy-paste values
- Celebration at completion

### Journey 3: Daily Inbox Processing

**Goal :** Process all replies in <15 min

**Categories :** Interested, Not Now, Negative, OOO

**UX Principles :**
- AI pre-triage visible
- 1-click actions for common responses
- Suggested reply editable before send
- Inbox Zero = visible win state

### Journey 4: DSAR Flow

**Goal :** Handle data subject requests compliantly

**Types :** Access, Deletion, Objection

**UX Principles :**
- AI detection + flagging
- Guided process (not hidden in settings)
- Audit trail automatic
- Suppression list integration

### Flow Optimization Principles

1. **Minimize steps to value** — ≤5 clicks to first campaign launch
2. **Clear progress indicators** — Always show where user is
3. **Celebration at milestones** — DNS done, first reply, first RDV
4. **Error recovery** — Clear messages, retry actions, help links
5. **AI as assistant** — Pre-process but always editable

---

## Component Strategy

### Design System Components (shadcn/ui)

**Ready to use :**
Button, Card, DataTable, Dialog, Form, Input, Tabs, Badge, Progress, Alert, DropdownMenu, Toast

**Customization needed :**
- Theme tokens (Teal primary, spacing)
- DataTable variants for prospects

### Custom Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| **HealthScoreBadge** | Visible health indicator (header) | P0 |
| **LeadStatusBadge** | Prospect status display | P0 |
| **WizardStepper** | Onboarding DNS + campaign creation | P0 |
| **EmailPreview** | Copilot preview before send | P1 |
| **InboxReplyCard** | Reply display with quick actions | P2 |
| **CelebrationModal** | Milestone celebrations | P2 |

### Component Implementation Strategy

1. **Build on shadcn primitives** — Extend, don't replace
2. **Design tokens first** — Colors, spacing, radii via CSS variables
3. **Accessibility built-in** — ARIA labels, keyboard nav, focus states
4. **States documented** — All states designed before coding

### Implementation Roadmap

| Phase | Week | Components |
|-------|------|------------|
| P0 | 1 | HealthScoreBadge, LeadStatusBadge, WizardStepper |
| P1 | 2 | EmailPreview, DataTable customization |
| P2 | 3 | InboxReplyCard, CelebrationModal |
| P3 | 4 | Refinements, animations |

---

## UX Consistency Patterns

### Button Hierarchy

| Type | Usage | Style |
|------|-------|-------|
| **Primary** | Main CTA (1 per screen) | Teal filled |
| **Secondary** | Alternative actions | Teal outline |
| **Destructive** | Delete/remove | Red filled |
| **Ghost** | Tertiary actions | No background |

### Feedback Patterns

| Type | Visual | Duration |
|------|--------|----------|
| **Success** | Green toast + checkmark | 3s auto |
| **Error** | Red toast + retry | Persistent |
| **Warning** | Amber toast | 5s auto |
| **Loading** | Spinner + text | Until complete |

**Location :** Bottom-right toasts, non-blocking.

### Form Patterns

- **Validation :** Inline, on blur
- **Errors :** Below field, red + icon
- **Required :** Asterisk + label
- **Save :** Explicit buttons (no autosave MVP)

### Navigation Patterns

- **Sidebar :** Main nav, always visible
- **Breadcrumbs :** Deep pages only
- **Tabs :** In-page sections
- **Keyboard :** ⌘K palette, Tab nav, Escape close

### States Patterns

| State | Pattern |
|-------|--------|
| **Loading** | Skeleton shimmer |
| **Empty** | Illustration + CTA |
| **Error** | Message + Retry + Help |

### Error Recovery

- **Network :** Toast + Retry button
- **Validation :** Inline highlight
- **Critical :** Modal + Support link

---

## Responsive Design & Accessibility

### Responsive Strategy

| Device | Strategy | Scope |
|--------|----------|-------|
| **Desktop** | Primary experience | Full features |
| **Tablet** | Simplified layout | Touch-optimized |
| **Mobile** | Monitoring only | Dashboard + Inbox |

**Approach :** Desktop-first, mobile-responsive.

### Breakpoint Strategy

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Mobile | < 768px | Bottom nav, stacked |
| Tablet | 768-1023px | Collapsible sidebar |
| Desktop | 1024px+ | Full sidebar |

### Accessibility Strategy

**Target :** WCAG 2.1 Level AA

| Requirement | Standard |
|-------------|----------|
| Contrast | 4.5:1 text |
| Keyboard | Full navigation |
| Screen readers | ARIA + semantic HTML |
| Touch targets | Min 44x44px |
| Focus | 2px visible ring |
| Motion | Respect reduced-motion |

### Testing Strategy

| Type | Tool |
|------|------|
| Auto a11y | axe-core in CI |
| Screen reader | VoiceOver, NVDA |
| Responsive | Chrome DevTools |

### Implementation Guidelines

1. Semantic HTML first
2. ARIA when needed only
3. All images have alt text
4. Form labels linked
5. Focus order = visual order
6. Skip links present
7. Relative units (rem, %)

---

## 🎉 Workflow Complete

**Document :** UX Design Specification — LeadGen
**Author :** Alex
**Facilitator :** Sally (UX Designer)  
**Date :** 2026-01-13

### Summary

Ce document constitue la spécification UX complète pour LeadGen, couvrant :

- ✅ Vision produit et utilisateurs cibles (Sophie, Marc)
- ✅ Core Experience ("Preview, launch, protège")
- ✅ Design System (shadcn/ui + Tailwind)
- ✅ Visual Foundation (Teal, Inter, 4px base)
- ✅ User Journeys (Happy Path, DNS Gate, Inbox, DSAR)
- ✅ 6 Custom Components spécifiés
- ✅ UX Patterns (buttons, feedback, forms, navigation)
- ✅ Responsive (desktop-first) + WCAG 2.1 AA

### Prochaines Étapes Recommandées

1. **Architecture → PRD Architecture** (si pas fait)
2. **Epics & Stories** — Découper en stories implémentables
3. **Wireframes/Figma** — Maquettes haute-fidélité
4. **Sprint Planning** — Démarrer l'implémentation

---

*[UX Design Workflow Complete]*

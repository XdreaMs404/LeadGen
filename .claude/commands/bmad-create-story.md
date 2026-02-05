---
description: 'Génère/complète une story BMAD (format standard) et met à jour le backlog'
argument-hint: '[story_id]'
---

# BMAD Create Story

Tu es dans le projet **LeadGen** (SaaS d'email outreach).

## Objectif
Générer une story BMAD complète pour **$1** en suivant les standards BMAD.

## Process

### 1. Analyse du contexte
- Lis `CLAUDE.md` pour comprendre l'architecture
- Lis les epics existants dans `bmad/epics/` (si présents)
- Lis les stories déjà complétées pour comprendre le style et le niveau de détail
- Consulte `bmad/backlog.json` pour voir où se situe cette story dans le plan global

### 2. Génération de la story
Crée `bmad/stories/$1.md` avec la structure suivante:

```markdown
# Story $1: [Titre]

**Epic**: [Epic ID]
**Priority**: [High/Medium/Low]
**Status**: TODO
**Estimated Complexity**: [1-5]

## User Story
As a [persona]
I want [capability]
So that [benefit]

## Context & Background
[Pourquoi cette story? Quel problème résout-elle?]

## Acceptance Criteria
1. **AC1**: [Critère mesurable]
   - Détail technique
   - Comportement attendu

2. **AC2**: [Critère mesurable]
   - Détail technique
   - Comportement attendu

[...continue pour tous les AC]

## Technical Approach
### Architecture Changes
- [Nouveaux composants/services]
- [Modifications aux composants existants]

### Database Changes
- [Nouvelles tables/colonnes]
- [Migrations nécessaires]

### API Changes
- [Nouveaux endpoints]
- [Modifications aux endpoints existants]

## Implementation Tasks
- [ ] Task 1: [Description précise]
- [ ] Task 2: [Description précise]
- [ ] Task 3: [Description précise]
[...continue]

## Test Plan
### Unit Tests
- [ ] Test case 1
- [ ] Test case 2

### Integration Tests
- [ ] Test case 1
- [ ] Test case 2

### E2E Tests (if applicable)
- [ ] Scenario 1
- [ ] Scenario 2

## Dependencies
- **Blocks**: [Stories qui doivent être complétées avant]
- **Blocked by**: [Stories qui dépendent de celle-ci]
- **External**: [APIs, services externes, etc.]

## Risks & Mitigations
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Strategy] |

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Documentation updated (if needed)
- [ ] Deployed to staging and verified

## Verification Commands
```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

## Notes
[Toute information additionnelle]
```

### 3. Mise à jour du backlog
- Ouvre `bmad/backlog.json`
- Si la story $1 n'existe pas, ajoute-la avec status "TODO"
- Si elle existe déjà, vérifie que les métadonnées sont cohérentes

### 4. Validation
- Vérifie que tous les AC sont mesurables et testables
- Vérifie que les tâches d'implémentation couvrent tous les AC
- Vérifie que le test plan couvre tous les AC
- Vérifie que les dépendances sont correctes

## Output
À la fin, affiche:
```
✅ Story $1 created successfully

📋 Summary:
- Title: [titre]
- Epic: [epic]
- Priority: [priority]
- Acceptance Criteria: [count]
- Implementation Tasks: [count]
- Test Cases: [count]

📍 Next Steps:
1. Review the story in bmad/stories/$1.md
2. If approved, run: /bmad-dev-story $1
3. Or run full cycle: /bmad-cycle $1
```

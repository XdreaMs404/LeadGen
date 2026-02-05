---
description: 'Review qualité/sécurité + checklist DoD sur une story'
argument-hint: '[story_id]'
---

# BMAD Review Story

Effectue une review complète de la story **$1**.

## Objectif
Vérifier que la story est complète, correcte, sécurisée et prête pour merge.

## Process

### 1. Préparation
```bash
# Vérifier qu'on est sur la bonne branche
git branch --show-current

# Générer le diff complet
git diff main...HEAD > /tmp/story-$1-diff.txt
```

### 2. Review automatisée avec sous-agent
Lance le sous-agent `code-reviewer` pour une analyse approfondie:

```
Task: Review the implementation of story $1

Context:
- Story file: bmad/stories/$1.md
- Branch: autopilot/$1
- Diff: [include git diff output]

Focus areas:
1. Security vulnerabilities (SQL injection, XSS, auth bypass, etc.)
2. Logic errors and edge cases
3. Performance issues
4. Code quality and maintainability
5. Test coverage and quality
6. Adherence to project architecture (see CLAUDE.md)
```

### 3. Checklist manuelle

#### A. Acceptance Criteria
Pour chaque AC dans `bmad/stories/$1.md`:
- [ ] L'AC est complètement implémenté
- [ ] Il existe des tests qui vérifient cet AC
- [ ] Les tests passent
- [ ] Le comportement est conforme à la spécification

#### B. Sécurité
- [ ] Pas de SQL injection (Prisma utilisé correctement)
- [ ] Pas de XSS (inputs sanitizés)
- [ ] Pas de secrets/credentials en dur
- [ ] Validation des inputs utilisateur
- [ ] Gestion appropriée des erreurs (pas de leak d'info sensible)
- [ ] Authentification/autorisation correcte
- [ ] Pas de CORS trop permissif
- [ ] Tokens/sessions gérés de manière sécurisée

#### C. Qualité du code
- [ ] Code lisible et maintenable
- [ ] Noms de variables/fonctions descriptifs
- [ ] Fonctions courtes et focalisées
- [ ] Pas de duplication de code
- [ ] Commentaires uniquement où nécessaire
- [ ] Pas de code mort/commenté
- [ ] Pas de console.log/debug code oublié
- [ ] TypeScript strict (pas de `any` non justifié)

#### D. Architecture
- [ ] Respecte la structure du projet (voir CLAUDE.md)
- [ ] Utilise les patterns existants
- [ ] Pas de sur-ingénierie
- [ ] Séparation des responsabilités claire
- [ ] Services/composants réutilisables si approprié
- [ ] Pas de couplage fort inutile

#### E. Tests
- [ ] Tests unitaires pour la logique métier
- [ ] Tests d'intégration pour les API routes
- [ ] Tests E2E si applicable
- [ ] Couverture >= 80% pour le nouveau code
- [ ] Tests lisibles et maintenables
- [ ] Mocks appropriés pour services externes
- [ ] Tests des edge cases et erreurs

#### F. Performance
- [ ] Pas de N+1 queries
- [ ] Indexes DB appropriés si nouvelles queries
- [ ] Pas de boucles inefficaces
- [ ] Chargement lazy si applicable
- [ ] Pas de re-renders inutiles (React)
- [ ] Optimistic updates si applicable

#### G. Documentation
- [ ] Story mise à jour avec "Implementation Notes"
- [ ] Section "How to Test" présente et claire
- [ ] Décisions techniques documentées
- [ ] README/CLAUDE.md mis à jour si changements d'architecture

#### H. Git
- [ ] Commits atomiques et bien nommés
- [ ] Messages de commit descriptifs
- [ ] Pas de merge conflicts
- [ ] Branche à jour avec main (si nécessaire)

### 4. Tests de régression
Exécute la suite complète de tests:
```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Vérifie qu'aucun test existant n'a été cassé.

### 5. Mise à jour de la story
Ajoute une section "Review Notes" dans `bmad/stories/$1.md`:

```markdown
## Review Notes
**Reviewed by**: Claude Code
**Date**: [date]
**Status**: ✅ Approved / ⚠️ Needs Changes

### Security Review
- [Findings]

### Code Quality Review
- [Findings]

### Architecture Review
- [Findings]

### Test Coverage
- Unit tests: [count]
- Integration tests: [count]
- Coverage: [percentage]%

### Issues Found
[Si des problèmes ont été trouvés et corrigés]

### Final Checklist
- [x] All AC implemented
- [x] All tests passing
- [x] Security review passed
- [x] Code quality acceptable
- [x] Documentation complete
```

### 6. Décision finale

#### Si tout est OK:
```markdown
✅ Story $1 is ready for merge

All checks passed:
- Security: ✓
- Code Quality: ✓
- Tests: ✓
- Documentation: ✓

Next steps:
1. Mark story as DONE in bmad/backlog.json
2. Create PR (or merge if authorized)
```

#### Si des problèmes sont trouvés:
```markdown
⚠️ Story $1 needs changes

Issues found:
1. [Issue 1]
2. [Issue 2]

Recommended actions:
1. Fix issues listed above
2. Re-run tests
3. Re-run review
```

Si des problèmes sont trouvés, corrige-les immédiatement et re-lance la review.

## Output
À la fin, affiche:
```
✅ Review completed for story $1

📊 Review Summary:
- Security: [✓/⚠️/✗]
- Code Quality: [✓/⚠️/✗]
- Tests: [✓/⚠️/✗]
- Documentation: [✓/⚠️/✗]

Overall Status: [✅ Approved / ⚠️ Needs Changes]

📍 Next Steps:
[Based on review outcome]
```

## Escalation
Si tu trouves des problèmes critiques qui nécessitent une décision humaine:
1. Documente dans `.claude/HUMAN_NEEDED.md`
2. Explique le problème
3. Propose des options
4. Arrête-toi pour intervention humaine

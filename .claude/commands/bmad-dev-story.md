---
description: 'Implémente une story BMAD (code + tests + docs)'
argument-hint: '[story_id]'
---

# BMAD Dev Story

Implémente la story **$1** de bout en bout.

## Prerequisites
- La story doit exister dans `bmad/stories/$1.md`
- Tous les checks doivent passer avant de commencer
- Aucune story bloquante ne doit être en cours

## Process

### 1. Préparation
```bash
# Vérifier l'état actuel
git status
git diff

# Créer une branche pour cette story
git checkout -b autopilot/$1
```

### 2. Lecture et analyse
- Lis `bmad/stories/$1.md` en entier
- Identifie tous les Acceptance Criteria (AC)
- Identifie toutes les tâches d'implémentation
- Identifie tous les fichiers qui devront être modifiés/créés

### 3. Implémentation TDD (Test-Driven Development)

Pour chaque AC:

#### A. Écrire les tests d'abord
- Crée/modifie les tests unitaires dans `src/__tests__/`
- Crée/modifie les tests d'intégration si nécessaire
- Les tests doivent échouer initialement (Red phase)

#### B. Implémenter le code
- Implémente le code minimum pour faire passer les tests
- Respecte l'architecture existante (voir CLAUDE.md)
- Suis les patterns du codebase
- Respecte les contraintes de sécurité (pas de SQL injection, XSS, etc.)

#### C. Refactoring
- Nettoie le code si nécessaire
- Assure-toi que le code est lisible et maintenable
- Ne sur-ingénierie pas: garde les choses simples

#### D. Commit atomique
```bash
git add [fichiers modifiés]
git commit -m "feat($1): [description de ce qui a été fait]

- Détail 1
- Détail 2

Refs: Story $1, AC[numéro]"
```

### 4. Vérification continue
Après chaque commit, exécute:
```bash
pnpm lint
pnpm test
pnpm typecheck
```

Si des erreurs apparaissent:
- Corrige-les immédiatement
- Commit les corrections
- Re-vérifie

**IMPORTANT**: Ne passe JAMAIS à la tâche suivante si les checks échouent.

### 5. Documentation
- Mets à jour `bmad/stories/$1.md` avec une section "Implementation Notes"
- Documente les décisions techniques importantes
- Documente les changements d'architecture si applicable
- Ajoute une section "How to Test" avec des exemples concrets

### 6. Vérification finale
- [ ] Tous les AC sont implémentés
- [ ] Tous les tests passent
- [ ] Aucune erreur de lint
- [ ] Aucune erreur TypeScript
- [ ] Le build passe
- [ ] La documentation est à jour

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

### 7. Préparation pour review
- Génère un diff propre: `git diff main...autopilot/$1`
- Vérifie qu'il n'y a pas de code debug/console.log oublié
- Vérifie qu'il n'y a pas de secrets/credentials dans le code

## Contraintes importantes

### Sécurité
- ❌ Pas de SQL injection (utilise Prisma correctement)
- ❌ Pas de XSS (sanitize les inputs utilisateur)
- ❌ Pas de secrets en dur dans le code
- ❌ Pas de CORS trop permissif
- ✅ Valide toutes les entrées utilisateur
- ✅ Utilise les types TypeScript strictement

### Architecture
- Respecte la structure existante (voir CLAUDE.md)
- Utilise Prisma pour toutes les opérations DB
- Utilise TanStack Query pour les appels API côté client
- Utilise Server Actions ou API routes pour les mutations
- Respecte les patterns d'authentification existants

### Tests
- Minimum 80% de couverture pour le nouveau code
- Tests unitaires pour la logique métier
- Tests d'intégration pour les API routes
- Mocks appropriés pour les services externes (Gmail, LLM, etc.)

### Style de code
- Suis les conventions ESLint du projet
- Utilise TypeScript strict
- Pas de `any` sauf si absolument nécessaire (et documenté)
- Noms de variables/fonctions descriptifs
- Fonctions courtes et focalisées (< 50 lignes idéalement)

## Output
À la fin, affiche:
```
✅ Story $1 implemented successfully

📊 Stats:
- Files changed: [count]
- Tests added: [count]
- Commits: [count]

✅ All checks passing:
- Lint: ✓
- Tests: ✓
- TypeScript: ✓
- Build: ✓

📍 Next Steps:
1. Run: /bmad-review-story $1
2. Or continue with full cycle (review will run automatically)
```

## En cas d'erreur
Si tu rencontres un blocage:
1. Documente le problème dans `.claude/HUMAN_NEEDED.md`
2. Explique ce qui a été tenté
3. Explique pourquoi c'est bloqué
4. Suggère des solutions possibles
5. Arrête-toi pour intervention humaine

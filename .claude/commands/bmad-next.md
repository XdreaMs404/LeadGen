---
description: 'Sélectionne la prochaine story TODO dans bmad/backlog.json et lance /bmad-cycle'
---

# BMAD Next

Sélectionne automatiquement la prochaine story à traiter et lance le cycle complet.

## Process

### 1. Lecture du backlog
Lis `bmad/backlog.json` et trouve la première story avec:
- `status: "TODO"`
- Pas de dépendances bloquantes (stories dans `blockedBy` qui ne sont pas DONE)

### 2. Vérification des prérequis
Avant de lancer le cycle:
- Vérifie que tous les checks passent
- Vérifie qu'il n'y a pas de changements non commités
- Vérifie qu'on est sur la branche main (ou une branche propre)

```bash
git status
pnpm lint
pnpm test -- --run
pnpm typecheck
```

### 3. Sélection de la story
Critères de sélection (dans l'ordre):
1. Stories avec `priority: "high"` d'abord
2. Puis `priority: "medium"`
3. Puis `priority: "low"`
4. À priorité égale, prendre la story avec l'ID le plus bas

### 4. Lancement du cycle
Une fois la story sélectionnée:
```
Exécute: /bmad-cycle [story_id]
```

## Output
```
🔍 Scanning backlog...

📋 Backlog Status:
- TODO: [count]
- IN_PROGRESS: [count]
- DONE: [count]

🎯 Selected Story: [story_id] - [title]
- Priority: [priority]
- Epic: [epic]

🚀 Launching cycle...
```

## Si aucune story disponible
```
✅ All stories completed!

📊 Final Status:
- Total stories: [count]
- Completed: [count]

🎉 Backlog is empty. Great work!

📍 Next Steps:
- Review completed work
- Plan next sprint/epic
- Or add new stories to bmad/backlog.json
```

## Si blocage
Si une story est bloquée par des dépendances:
```
⚠️ Story [id] is blocked by:
- [blocking_story_id]: [status]

Attempting to process blocking story first...
```

Puis tente de traiter la story bloquante en premier.

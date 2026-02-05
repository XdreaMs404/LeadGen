---
description: 'Exécute Create→Dev→Review pour une story, puis passe la story à DONE'
argument-hint: '[story_id]'
---

# BMAD Cycle

Exécute le cycle complet pour la story **$1**: Create → Dev → Review → Done.

## Overview
Ce workflow automatise l'ensemble du processus de développement d'une story:
1. Création/vérification de la story
2. Implémentation complète
3. Review qualité/sécurité
4. Mise à jour du backlog

## Process

### Phase 1: Create Story
```
Exécute: /bmad-create-story $1
```

Si la story existe déjà:
- Vérifie qu'elle est complète et bien formée
- Passe à la phase suivante

Si la story n'existe pas:
- Crée la story complète
- Met à jour le backlog
- Attend validation avant de continuer

**Checkpoint**: La story doit être valide avant de continuer.

---

### Phase 2: Development
```
Exécute: /bmad-dev-story $1
```

Implémente la story de bout en bout:
- Crée la branche `autopilot/$1`
- Implémente tous les AC avec TDD
- Écrit/met à jour les tests
- Fait des commits atomiques
- Vérifie que tous les checks passent

**Checkpoint**: Tous les checks doivent passer (lint, test, typecheck, build).

Si des erreurs surviennent:
- Tente de les corriger automatiquement
- Si blocage, documente dans `.claude/HUMAN_NEEDED.md` et arrête

---

### Phase 3: Review
```
Exécute: /bmad-review-story $1
```

Review complète de l'implémentation:
- Lance le sous-agent `code-reviewer`
- Vérifie tous les AC
- Vérifie la sécurité
- Vérifie la qualité du code
- Vérifie les tests
- Met à jour la story avec les notes de review

**Checkpoint**: La review doit être approuvée.

Si des problèmes sont trouvés:
- Corrige-les
- Re-teste
- Re-review si nécessaire

---

### Phase 4: Finalization
Une fois la review approuvée:

#### A. Mise à jour du backlog
```json
// Dans bmad/backlog.json
{
  "id": "$1",
  "status": "DONE",  // ← Changé de TODO à DONE
  "completedDate": "[date]"
}
```

#### B. Préparation de la PR (optionnel)
Si autorisé dans les permissions:
```bash
git push origin autopilot/$1
gh pr create \
  --title "feat($1): [titre de la story]" \
  --body "[description basée sur la story]" \
  --base main
```

Sinon, affiche les commandes pour créer la PR manuellement.

#### C. Commit final
```bash
git add bmad/backlog.json
git commit -m "chore: mark story $1 as DONE

Story completed and reviewed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Output Final
```
✅ Story $1 completed successfully!

📊 Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: Create    ✓
Phase 2: Dev       ✓
Phase 3: Review    ✓
Phase 4: Done      ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Stats:
- Files changed: [count]
- Tests added: [count]
- Commits: [count]
- Review status: ✅ Approved

🔗 Branch: autopilot/$1

📍 Next Steps:
[Si PR créée]
- Review PR: [URL]
- Merge when CI is green

[Si PR non créée]
- Create PR manually:
  git push origin autopilot/$1
  gh pr create --title "feat($1): [titre]" --base main

[Si backlog a d'autres stories]
- Next story in backlog: [next story ID]
- Run: /bmad-cycle [next story ID]
- Or run: /bmad-next (to auto-select)
```

## Gestion des erreurs

### Erreur en Phase 1 (Create)
- Si la story ne peut pas être créée: arrête et demande intervention
- Documente dans `.claude/HUMAN_NEEDED.md`

### Erreur en Phase 2 (Dev)
- Si les tests échouent après plusieurs tentatives: arrête
- Si blocage technique: documente et arrête
- Si dépendance manquante: documente et arrête

### Erreur en Phase 3 (Review)
- Si problèmes critiques trouvés: tente de corriger
- Si correction impossible: documente et arrête
- Si décision architecturale nécessaire: documente et arrête

### Erreur en Phase 4 (Finalization)
- Si le backlog ne peut pas être mis à jour: arrête
- Si la PR ne peut pas être créée: affiche les commandes manuelles

## Sécurité
- Tous les checks de sécurité sont exécutés en Phase 3
- Aucune story ne peut être marquée DONE sans review approuvée
- Aucun secret ne doit être commité

## Performance
- Utilise des sous-agents (Task tool) pour les tâches longues
- Exécute les tests en parallèle quand possible
- Cache les résultats de lint/typecheck quand possible

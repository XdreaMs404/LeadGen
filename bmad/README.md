# BMAD Autopilot Workflow

Ce dossier contient le workflow BMAD (Build, Measure, Analyze, Deliver) pour automatiser le développement avec Claude Code.

## Structure

```
bmad/
├── backlog.json          # Liste des stories à traiter
├── stories/              # Stories détaillées (générées par /bmad-create-story)
└── README.md             # Ce fichier

.claude/
├── settings.json         # Configuration Claude Code (permissions, hooks)
├── hooks/
│   ├── bmad_stop_gate.py # Stop hook - empêche l'arrêt si backlog non vide
│   └── session_start.sh  # Affiche le statut au démarrage
├── commands/
│   ├── bmad-next.md      # Sélectionne et lance la prochaine story
│   ├── bmad-cycle.md     # Cycle complet: Create → Dev → Review → Done
│   ├── bmad-create-story.md  # Génère une story BMAD
│   ├── bmad-dev-story.md     # Implémente une story
│   └── bmad-review-story.md  # Review qualité/sécurité
└── agents/
    ├── code-reviewer.md  # Agent de review de code
    └── test-runner.md    # Agent d'exécution de tests
```

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/bmad-next` | Sélectionne la prochaine story TODO et lance le cycle complet |
| `/bmad-cycle <id>` | Exécute Create → Dev → Review → Done pour une story |
| `/bmad-create-story <id>` | Génère une story BMAD complète |
| `/bmad-dev-story <id>` | Implémente une story (code + tests) |
| `/bmad-review-story <id>` | Review qualité et sécurité |

## Utilisation

### Mode interactif
```bash
cd LeadGen
claude
# Dans Claude Code:
/bmad-next
```

### Mode headless (autopilot complet)
```bash
claude -p "/bmad-next" --permission-mode acceptEdits
```

## Backlog

Le fichier `backlog.json` contient la liste des stories à traiter:

```json
{
  "stories": [
    { "id": "5.5", "title": "...", "status": "TODO" },
    { "id": "5.6", "title": "...", "status": "TODO" }
  ]
}
```

Statuts possibles:
- `TODO` - À faire
- `IN_PROGRESS` - En cours
- `DONE` - Terminé

## Stop Hook

Le stop hook (`bmad_stop_gate.py`) empêche Claude de s'arrêter tant que:
1. Les checks (lint/test/typecheck) ne passent pas
2. Il reste des stories TODO dans le backlog

Pour forcer l'arrêt, créez `.claude/HUMAN_NEEDED.md`.

## Intervention humaine

Si Claude rencontre un blocage nécessitant une décision humaine, il créera `.claude/HUMAN_NEEDED.md` avec les détails du problème.

Après résolution, supprimez ce fichier pour reprendre l'autopilot.

## MCP (Model Context Protocol)

Le fichier `.mcp.json` configure les serveurs MCP:
- **puppeteer**: Contrôle du navigateur pour tests E2E et vérifications visuelles

## Sécurité

Les permissions dans `.claude/settings.json` définissent:
- **allow**: Actions autorisées sans confirmation
- **ask**: Actions nécessitant confirmation
- **deny**: Actions interdites (lecture de .env, secrets, etc.)

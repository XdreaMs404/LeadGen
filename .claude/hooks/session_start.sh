#!/bin/bash
# BMAD Session Start Hook
# Displays current backlog status and reminds Claude of available commands

echo "=== BMAD Autopilot Session Start ==="
echo ""

# Check if backlog exists
if [ -f "bmad/backlog.json" ]; then
    echo "📋 Backlog Status:"

    # Count stories by status (using basic grep/wc since jq might not be available)
    TODO_COUNT=$(grep -o '"status": "TODO"' bmad/backlog.json 2>/dev/null | wc -l)
    IN_PROGRESS_COUNT=$(grep -o '"status": "IN_PROGRESS"' bmad/backlog.json 2>/dev/null | wc -l)
    DONE_COUNT=$(grep -o '"status": "DONE"' bmad/backlog.json 2>/dev/null | wc -l)

    echo "  - TODO: $TODO_COUNT"
    echo "  - IN_PROGRESS: $IN_PROGRESS_COUNT"
    echo "  - DONE: $DONE_COUNT"
    echo ""
else
    echo "⚠️  No backlog found at bmad/backlog.json"
    echo "   Create one or run /bmad-create-story to start"
    echo ""
fi

# Check for human intervention flag
if [ -f ".claude/HUMAN_NEEDED.md" ]; then
    echo "🚨 HUMAN INTERVENTION REQUIRED"
    echo "   Check .claude/HUMAN_NEEDED.md for details"
    echo ""
fi

echo "🤖 Available BMAD Commands:"
echo "  /bmad-next          - Process next TODO story"
echo "  /bmad-cycle <id>    - Run full cycle for a story"
echo "  /bmad-create-story  - Create a new story"
echo "  /bmad-dev-story     - Implement a story"
echo "  /bmad-review-story  - Review a story"
echo ""
echo "==================================="

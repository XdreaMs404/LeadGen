#!/usr/bin/env python3
"""
BMAD Stop Gate Hook
Prevents Claude from stopping when there's work remaining in the backlog.
Runs checks (lint/test/typecheck) before allowing continuation.
"""
import json
import os
import sys
import subprocess
from pathlib import Path

# Paths
STATE = Path(".claude/.autopilot_state.json")
BACKLOG = Path("bmad/backlog.json")
HUMAN_FLAG = Path(".claude/HUMAN_NEEDED.md")

# Safety limits
MAX_BLOCKS_PER_SESSION = 200

def run(cmd):
    """Execute a command and capture output."""
    return subprocess.run(cmd, capture_output=True, text=True, shell=True)

def load_state(session_id):
    """Load autopilot state for current session."""
    if STATE.exists():
        try:
            s = json.loads(STATE.read_text(encoding='utf-8'))
            if s.get("session_id") == session_id:
                return s
        except Exception:
            pass
    return {"session_id": session_id, "blocks": 0}

def save_state(s):
    """Save autopilot state."""
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s, indent=2), encoding='utf-8')

def select_next_story():
    """Find the next TODO story in backlog."""
    if not BACKLOG.exists():
        return None
    try:
        data = json.loads(BACKLOG.read_text(encoding='utf-8'))
        for item in data.get("stories", []):
            if item.get("status") == "TODO":
                return item
    except Exception:
        pass
    return None

def main():
    """Main stop gate logic."""
    # Read payload from stdin
    payload = json.load(sys.stdin)
    session_id = payload.get("session_id", "unknown")
    state = load_state(session_id)

    # 0) If human intervention is needed, allow stop
    if HUMAN_FLAG.exists():
        print(json.dumps({
            "decision": "allow",
            "reason": "Human intervention required. Check HUMAN_NEEDED.md"
        }))
        sys.exit(0)

    # 1) Run project checks (lint, test, typecheck)
    checks = [
        "pnpm -s lint",
        "pnpm -s test -- --run",
        "pnpm -s typecheck"
    ]

    # Check if pnpm is available, fallback to npm
    pnpm_check = run("where pnpm")
    if pnpm_check.returncode != 0:
        checks = [
            "npm run lint",
            "npm test",
            "npm run typecheck"
        ]

    for check_cmd in checks:
        result = run(check_cmd)
        if result.returncode != 0:
            # Truncate output to avoid overwhelming Claude
            stdout = result.stdout[-6000:] if result.stdout else ""
            stderr = result.stderr[-6000:] if result.stderr else ""

            print(json.dumps({
                "decision": "block",
                "reason": f"Check failed: {check_cmd}\n\nFix the errors before continuing.\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}"
            }))
            sys.exit(0)

    # 2) Check backlog for remaining work
    next_story = select_next_story()
    if next_story:
        state["blocks"] = int(state.get("blocks", 0)) + 1
        save_state(state)

        # Safety: prevent infinite loops
        if state["blocks"] > MAX_BLOCKS_PER_SESSION:
            HUMAN_FLAG.write_text(
                "# Human Intervention Required\n\n"
                "Autopilot has reached the maximum number of blocks per session.\n"
                "This usually indicates:\n"
                "- Tests are failing repeatedly\n"
                "- Backlog items are not being marked as DONE\n"
                "- There's a configuration issue\n\n"
                "Please review the backlog, tests, and recent changes.",
                encoding='utf-8'
            )
            print(json.dumps({
                "decision": "allow",
                "reason": "Max blocks reached. Human intervention required."
            }))
            sys.exit(0)

        # Block stop and tell Claude to continue
        story_id = next_story.get('id', 'unknown')
        story_title = next_story.get('title', '')

        print(json.dumps({
            "decision": "block",
            "reason": f"Backlog not complete. Next story: {story_id} - {story_title}\n\n"
                      f"Execute: /bmad-cycle {story_id}\n\n"
                      f"After completion, mark the story as DONE in bmad/backlog.json"
        }))
        sys.exit(0)

    # 3) All checks passed, backlog empty - allow stop
    state["blocks"] = 0
    save_state(state)

    print(json.dumps({
        "decision": "allow",
        "reason": "All checks passed and backlog is complete."
    }))
    sys.exit(0)

if __name__ == "__main__":
    main()

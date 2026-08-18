# SYNC.md — Source-of-Truth Rule

The sermon-coach rubric has two surfaces:
- **SKILL.md** — chat-side skill. In this repo at
  `.claude/skills/sermon-coach/SKILL.md` so it is reviewable in the PR.
  Claude Code also loads the copy at
  `~/.claude/skills/user/sermon-coach/SKILL.md`; keep those two files
  identical. Claude.ai's `/mnt/skills/user/sermon-coach/SKILL.md` is a
  third runtime copy and must be pasted from the repo file after merge.
- **rubric.md** (this repo, at `src/lib/evaluation/rubric.md`) — derived
  artifact. Build-time copy. Read by
  prompt.ts at runtime. Never edited directly.

## Rule
rubric.md is generated from SKILL.md. To update the rubric in production:
1. Edit `.claude/skills/sermon-coach/SKILL.md` in this repo. Copy it to
   `~/.claude/skills/user/sermon-coach/SKILL.md` so Claude Code stays in
   sync.
2. Paste the new SKILL.md content into rubric.md (preserve the comment
   block at top).
3. Commit with message: `sync rubric from SKILL.md @ YYYY-MM-DD`.
4. If schema constraints change, update SCHEMA_SPEC.md and tool-schema.ts
   in the same PR.

## Why this direction
Chris designs the rubric by thinking in chat. Making chat canonical
matches the design surface to the work surface. rubric.md as a derived
artifact keeps Cursor as a build environment, not a design surface.

## What this rule prevents
- Drift between chat-side iteration and repo-side production.
- Cursor-side "quick fixes" to rubric.md that don't propagate back to
  SKILL.md.
- Forgetting which surface is authoritative when they disagree.

# SYNC.md — Source-of-Truth Rule

The sermon-coach rubric has two surfaces:
- **SKILL.md** (Claude.ai, at /mnt/skills/user/sermon-coach/SKILL.md) —
  the canonical source. Iterated in chat. Authoritative.
- **rubric.md** (this repo, at `src/lib/evaluation/rubric.md`) — derived
  artifact. Build-time copy. Read by
  prompt.ts at runtime. Never edited directly.

## Rule
rubric.md is generated from SKILL.md. To update the rubric in production:
1. Edit SKILL.md in chat.
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

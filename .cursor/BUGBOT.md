# Bugbot review context (Handsontable)

Use this policy for PR reviews in this monorepo.

## Scope

- Always include this root `.cursor/BUGBOT.md`.
- Include additional `.cursor/BUGBOT.md` files found while traversing upward from changed files.

## Repository-level checks

1. Changelog requirement:
   - If package source code changes, require a new `/.changelogs/*.json` file.
   - If the PR description contains `[skip changelog]`, skip this check.
2. Breaking-change:
   - If a PR introduces a breaking change, require the `Breaking change` label on that PR.
   - If the change is breaking, require migration guide updates in `/docs/content/guides/upgrade-and-migration/**`.
3. User-facing behavior docs requirement:
   - For user-facing behavior or UX changes, require matching docs updates in `/docs/content/**`.
4. Agent guidance maintenance:
   - If a PR introduces new coding conventions, constraints, or gotchas for future agents, require an `AGENTS.md` update.

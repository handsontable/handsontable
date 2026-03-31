# Bugbot review context (Handsontable)

All coding rules and conventions are in `/AGENTS.md`. Apply those rules to every review. This file adds **review-specific checks** only.

## Scope

- Always include this root `.cursor/BUGBOT.md`.
- Include additional `.cursor/BUGBOT.md` files found while traversing upward from changed files.

## Repository-level checks

- **Changelog**: If package source code changes, require a new `/.changelogs/*.json` file. Skip if the PR description contains `[skip changelog]`.
- **Breaking change**: If a PR introduces a breaking change, require the `Breaking change` label on that PR and migration guide updates in `/docs/content/guides/upgrade-and-migration/**`.
- **Docs**: For user-facing behavior or UX changes, require matching docs updates in `/docs/content/**`.
- **Agent guidance**: If a PR introduces new conventions, constraints, or gotchas, require an `/AGENTS.md` update.

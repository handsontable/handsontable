# Bugbot review context (Handsontable monorepo)

All coding rules and conventions are in `/AGENTS.md`. Apply those rules to every review.

## Review skills (single source of truth)

Read and apply the review checklists from these files:

- @.claude/skills/code-quality-review/SKILL.md -- ESLint rules, JSDoc, naming, cognitive complexity, bundle size
- @.claude/skills/architecture-review/SKILL.md -- SOLID, Law of Demeter, plugin decoupling, breaking changes, convention over configuration
- @.claude/skills/performance-a11y-review/SKILL.md -- large arrays, render batching, WCAG 2.1 AA, keyboard navigation

## Repository-level checks

- **Changelog**: If package source code changes, require a new `/.changelogs/*.json` file. Skip if the PR description contains `[skip changelog]`.
- **Breaking change**: If a PR introduces a breaking change, require the `Breaking change` label and migration guide updates in `/docs/content/guides/upgrade-and-migration/`.
- **Docs**: For user-facing behavior or UX changes, require matching docs updates in `/docs/content/`.
- **Agent guidance**: If a PR introduces new conventions, constraints, or gotchas, require an `/AGENTS.md` update.

# Bugbot review context (Handsontable monorepo)

All coding rules and conventions are in `/AGENTS.md`. Apply those rules to every review.

## Review skills (single source of truth)

Read and apply the review checklists from these files:

- @.claude/skills/handsontable-code-review/references/code-quality.md -- ESLint rules, JSDoc, naming, cognitive complexity, bundle size
- @.claude/skills/handsontable-code-review/references/architecture.md -- SOLID, Law of Demeter, plugin decoupling, breaking changes, convention over configuration
- @.claude/skills/handsontable-code-review/references/performance-a11y.md -- large arrays, render batching, WCAG 2.1 AA, keyboard navigation
- @.claude/skills/handsontable-code-review/references/tests.md -- a named exercising test per new interaction path, scoped mutation when unit tests changed, near-duplicate DOM helpers, timing-semantics JSDoc checked against its primitive, a ticket on every weakened assertion

## Repository-level checks

- **Changelog**: If package source code changes, require a new `/.changelogs/*.json` file. Skip if the PR description contains `[skip changelog]`. In that file, `issuesOrigin` must be `private` with `issueOrPR` equal to the PR number and the file named `<PR-number>.json` — **unless** the entry cites a real public GitHub issue, in which case `public` is correct and both `issueOrPR` and the filename use the issue number. Flag two added entries that share the same `type` and `framework` — they land as two overlapping lines in one `CHANGELOG.md` section and must be folded into one. Two entries with a different `type` or `framework` are fine. See `/.changelogs/README.md`.
- **Breaking change**: If a PR introduces a breaking change, require the `Breaking change` label and migration guide updates in `/docs/content/guides/upgrade-and-migration/`.
- **Docs**: For user-facing behavior or UX changes, require matching docs updates in `/docs/content/`.
- **Agent guidance**: If a PR introduces new conventions, constraints, or gotchas, require an `/AGENTS.md` update.

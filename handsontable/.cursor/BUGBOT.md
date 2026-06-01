# Handsontable core review notes

All coding rules and conventions are in `/AGENTS.md`. Apply those rules to every review. This file adds **review-specific context** for files under `/handsontable/**`.

## Review skills (single source of truth)

Read and apply the review checklists from these files:

- @.claude/skills/handsontable-code-review/references/code-quality.md -- ESLint rules, JSDoc, naming, cognitive complexity, bundle size
- @.claude/skills/handsontable-code-review/references/architecture.md -- SOLID, Law of Demeter, plugin decoupling, breaking changes, convention over configuration
- @.claude/skills/handsontable-code-review/references/performance-a11y.md -- large arrays, render batching, WCAG 2.1 AA, keyboard navigation

## Core-specific context

For core development rules, read:

- @handsontable/CLAUDE.md -- core package cheat sheet (coordinate systems, plugin lifecycle, testing patterns)
- @.claude/skills/handsontable-plugin-dev/SKILL.md -- plugin architecture patterns (when reviewing plugin code)
- @.claude/skills/coordinate-systems/SKILL.md -- coordinate system correctness (when reviewing index usage)

## Additional core-specific rules

- **Core language boundary**: Core source is JavaScript. Do not add TypeScript files under `/handsontable/src/`.
- **Optional chaining (`?.`)**: Use only when a value is genuinely optional by design. If guaranteed by data contract (e.g., `getCellMeta()` always returns an object), access directly without `?.`.
- **Conflict ownership**: Other plugins must NOT contain awareness checks like `if (dataProviderEnabled) return;` -- that logic belongs in the conflicting plugin. Compatibility tests belong with the owning plugin.
- **Public API naming**: Names carry long-term weight (maintained indefinitely). Check for collisions with existing API names before approving.
- **Cascading config**: New options should support `cell` -> `column` -> `global` when applicable. Table-level-only options (e.g., `data`, `colHeaders`) must document this in JSDoc.

## Testing

- Behavior changes should include both `.unit.js` and/or `.spec.js` tests.
- Favor E2E tests over unit tests. If a unit test would require mocking, write an E2E test instead.

---
name: handsontable-code-review
description: Use when reviewing changed or staged code, a branch, or a PR in the Handsontable monorepo across architecture, code quality, performance, accessibility, and tests. Covers SOLID / Law of Demeter / plugin decoupling / breaking-changes policy, custom ESLint rules / JSDoc / naming / cognitive complexity, large-array and render-batching performance, WCAG 2.1 AA + keyboard navigation, and the tests a change ships (a named exercising test per new path, scoped mutation, a ticket on every weakened assertion). Trigger when asked to review changes, check a diff against Handsontable conventions, assess architectural correctness, spot performance regressions, verify accessibility, or judge whether a change's tests prove it, and as the design lens before or while implementing any core change.
---

# Handsontable code review

Apply all four dimensions for a full review. For a scoped request ("just check a11y"), read only the relevant dimension.

## Workflow

1. Collect the changes: `git diff` (or `git diff --staged`).
2. Apply each dimension's checklist from its reference file:
   - **Architecture** (`references/architecture.md`): SOLID, Law of Demeter, plugin decoupling, conflict ownership, coordinate-system correctness, breaking-changes policy, convention over configuration. Also the design lens while implementing any core change.
   - **Code quality** (`references/code-quality.md`): custom ESLint rules, JSDoc, naming, cognitive complexity, DRY, the TypeScript boundary.
   - **Performance & accessibility** (`references/performance-a11y.md`): large-array safety, render batching, memory cleanup, WCAG 2.1 AA, keyboard navigation, ARIA semantics.
   - **Tests** (`references/tests.md`): a named exercising test for every new interaction path and option form, scoped mutation when unit tests changed, near-duplicate DOM helpers, timing-semantics JSDoc checked against its primitive, a ticket on every weakened or deleted assertion, a DOM/API assertion beside every visual capture.
3. Report using the output format below, applying the general review practices.

## General review practices

Adapted from the built-in `/code-review` command, minus its PR-commenting orchestration.

- Review the diff through several lenses: AGENTS.md / CLAUDE.md adherence at the correct scope, obvious bugs, git blame and history of the modified lines, comments on prior PRs that touched these files, and guidance in nearby code comments.
- Flag only the changed lines.
- Report every issue that could cause incorrect behavior, a test failure, a broken build, or a misleading result, and anything an AGENTS.md at the relevant scope calls out. Give each finding a confidence (high / medium / low) and keep the low-confidence ones: the reader filters by confidence.
- Leave to CI anything a linter, type-checker, or compiler surfaces (imports, type errors, formatting, pedantic style); review from source and run no build, type-check, or tests. The one run a review makes is the scoped mutation run in `references/tests.md`, when the diff changes unit tests.
- Raise only what a senior engineer would: pedantic style absent from an AGENTS.md, intentional functional changes that belong to the broader work, and issues already silenced with a documented lint-ignore are not findings.
- Cite every finding with `file:line` (link the file and line range when commenting on a PR).

## Output format

List findings by severity:

- **Critical**: breaks builds, tests, or runtime behavior.
- **High**: violates an enforced ESLint rule or a mandatory convention.
- **Medium**: style or maintainability concern.
- **Low**: suggestion for improvement.

Each finding includes a `file:line` reference, a confidence (high / medium / low), and a short explanation. When reporting more than one dimension, group findings under Architecture / Code quality / Performance / Accessibility / Tests headings.

If no issues are found, output exactly: `No blocking issues found.`

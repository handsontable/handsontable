---
name: handsontable-code-review
description: Use when reviewing changed or staged code, a branch, or a PR in the Handsontable monorepo across architecture, code quality, performance, accessibility, and tests. Covers SOLID / Law of Demeter / plugin decoupling / breaking-changes policy, custom ESLint rules / JSDoc / naming / cognitive complexity, large-array and render-batching performance, WCAG 2.1 AA + keyboard navigation, and the tests a change ships (a named exercising test per new path, scoped mutation, a ticket on every weakened assertion). Trigger when asked to review changes, check a diff against Handsontable conventions, assess architectural correctness, spot performance regressions, verify accessibility, or judge whether a change's tests prove it — and as the design lens before or while implementing any core change.
---

# Handsontable code review

Review staged or changed code across four dimensions: architecture, code quality, performance + accessibility, and tests. Apply all four for a full review. For a scoped request ("just check a11y", "is this architecturally sound?"), read only the relevant dimension.

## Workflow

1. Collect the changes: `git diff` (or `git diff --staged`).
2. Apply each dimension's checklist — read the reference file for the dimension you need:
   - **Architecture** — `references/architecture.md`: SOLID, Law of Demeter, plugin decoupling, conflict ownership, coordinate-system correctness, breaking-changes policy, convention over configuration. Also the design lens while implementing any core change, not only at review time.
   - **Code quality** — `references/code-quality.md`: custom ESLint rules, JSDoc, naming, cognitive complexity, DRY, the TypeScript boundary.
   - **Performance & accessibility** — `references/performance-a11y.md`: large-array safety, render batching, memory cleanup, WCAG 2.1 AA, keyboard navigation, ARIA semantics.
   - **Tests** — `references/tests.md`: a named exercising test for every new interaction path and option form, scoped mutation when unit tests changed, near-duplicate DOM helpers, timing-semantics JSDoc checked against its primitive, a ticket on every weakened or deleted assertion.
3. Report using the output format below, applying the general review practices.

## General review practices

Apply these alongside the dimension checklists. They are the durable practices from the built-in `/code-review` command, adapted for an in-repo review (skip its PR-commenting orchestration — the value is the review discipline).

- **Review several lenses on the diff, not just the code in isolation:** AGENTS.md / CLAUDE.md adherence at the correct scope, obvious bugs, the git blame and history of the modified lines, comments on prior PRs that touched these files, and guidance in nearby code comments.
- **Focus on the changed lines.** Do not flag pre-existing issues, or problems on lines the change did not touch.
- **Report every real problem, and say how sure you are.** Report any issue that could cause incorrect behavior, a test failure, a broken build, or a misleading result, and anything an AGENTS.md at the relevant scope calls out. Give each finding a confidence (high / medium / low) and keep the low-confidence ones in the list: the reader filters by confidence, so a finding you drop is a bug nobody sees. What stays out is decided by the next two rules (other tooling, nitpicks), not by your confidence.
- **Do not flag what other tooling catches.** Skip anything a linter, type-checker, or compiler would surface (missing or wrong imports, type errors, formatting, pedantic style). CI runs those separately; do not build, type-check, or run tests yourself for the review. The one exception is the scoped mutation run in `references/tests.md`, when the diff changes unit tests — no other tool measures what a new test would catch.
- **Skip nitpicks a senior engineer would not raise.** Pedantic style not called out in an AGENTS.md, intentional functional changes that belong to the broader work, and issues already silenced with a documented lint-ignore are not findings.
- **Cite every finding** with a `file:line` reference (link the file and line range when commenting on a PR).

## Output format

List findings by severity:

- **Critical** — breaks builds, tests, or runtime behavior.
- **High** — violates an enforced ESLint rule or a mandatory convention.
- **Medium** — style or maintainability concern.
- **Low** — suggestion for improvement.

Each finding includes a `file:line` reference, a confidence (high / medium / low), and a short explanation. When reporting more than one dimension, group findings under Architecture / Code quality / Performance / Accessibility / Tests headings.

If no issues are found, output exactly: `No blocking issues found.`

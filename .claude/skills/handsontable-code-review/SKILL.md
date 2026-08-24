---
name: handsontable-code-review
description: Use when reviewing changed or staged code, a branch, or a PR in the Handsontable monorepo across architecture, code quality, performance, and accessibility. Covers SOLID / Law of Demeter / plugin decoupling / breaking-changes policy, custom ESLint rules / JSDoc / naming / cognitive complexity, large-array and render-batching performance, and WCAG 2.1 AA + keyboard navigation. Trigger when asked to review changes, check a diff against Handsontable conventions, assess architectural correctness, spot performance regressions, or verify accessibility — and as the design lens before or while implementing any core change.
---

# Handsontable code review

Review staged or changed code across three dimensions: architecture, code quality, and performance + accessibility. Apply all three for a full review. For a scoped request ("just check a11y", "is this architecturally sound?"), read only the relevant dimension.

## Workflow

1. Collect the changes: `git diff` (or `git diff --staged`).
2. Apply each dimension's checklist — read the reference file for the dimension you need:
   - **Architecture** — `references/architecture.md`: SOLID, Law of Demeter, plugin decoupling, conflict ownership, coordinate-system correctness, breaking-changes policy, convention over configuration. Also the design lens while implementing any core change, not only at review time.
   - **Code quality** — `references/code-quality.md`: custom ESLint rules, JSDoc, naming, cognitive complexity, DRY, the TypeScript boundary.
   - **Performance & accessibility** — `references/performance-a11y.md`: large-array safety, render batching, memory cleanup, WCAG 2.1 AA, keyboard navigation, ARIA semantics.
3. Report using the output format below, applying the general review practices.

## General review practices

Apply these alongside the dimension checklists. They are the durable practices from the built-in `/code-review` command, adapted for an in-repo review (skip its PR-commenting orchestration — the value is the review discipline).

- **Review several lenses on the diff, not just the code in isolation:** AGENTS.md / CLAUDE.md adherence at the correct scope, obvious bugs, the git blame and history of the modified lines, comments on prior PRs that touched these files, and guidance in nearby code comments.
- **Focus on the changed lines.** Do not flag pre-existing issues, or problems on lines the change did not touch.
- **Confidence filtering — surface only what you are confident is real.** For each candidate issue, judge how likely it is a genuine problem that will be hit in practice. The bar is roughly "highly confident": you verified it is real and it materially affects functionality, or it is explicitly called out in an AGENTS.md at the relevant scope. Drop low-confidence findings and likely false positives rather than padding the report — a short list of real issues beats a long list of maybes.
- **Do not flag what other tooling catches.** Skip anything a linter, type-checker, or compiler would surface (missing or wrong imports, type errors, formatting, pedantic style). CI runs those separately; do not build, type-check, or run tests yourself for the review.
- **Skip nitpicks a senior engineer would not raise.** Pedantic style not called out in an AGENTS.md, intentional functional changes that belong to the broader work, and issues already silenced with a documented lint-ignore are not findings.
- **Cite every finding** with a `file:line` reference (link the file and line range when commenting on a PR).

## Output format

List findings by severity:

- **Critical** — breaks builds, tests, or runtime behavior.
- **High** — violates an enforced ESLint rule or a mandatory convention.
- **Medium** — style or maintainability concern.
- **Low** — suggestion for improvement.

Each finding includes a `file:line` reference and a short explanation. When reporting more than one dimension, group findings under Architecture / Code quality / Performance / Accessibility headings.

If no issues are found, output exactly: `No blocking issues found.`

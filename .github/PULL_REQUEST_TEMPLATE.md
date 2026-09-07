### Context
<!--- Why is this change required? What problem does it solve? -->

### Test evidence (required for source changes)
<!---
A PR is verified by things a machine can re-run or a reviewer can diff — a
committed test, a coverage number, a visual diff. "Tested manually with Claude"
is not evidence. New E2E is Playwright (tests/e2e/); the Jasmine suite is frozen.
Fill in the paths below, or apply a `Refactor-only: <reason>` commit trailer.
-->
- Unit tests added/modified (`*.unit.js`): <!-- paths, or "none — covered by <path>" -->
- E2E tests added/modified (Playwright `tests/e2e/*.spec.ts`): <!-- paths -->
- Type tests (`*.types.ts`) updated if public API changed: <!-- paths -->
- For a bug fix — the spec that fails without this fix: <!-- name -->
- Demo page / recorded trace (for UI changes): <!-- link -->

<!--
Changelog: a change under handsontable/src/** or wrappers/** (tests and .md
excluded) requires a new .changelogs/*.json entry — run `npm run changelog
entry` AFTER opening the PR (the file is named after the PR number). Docs-,
test-, and CI/tooling-only PRs pass the check automatically. To deliberately
skip it on a source change, write [skip changelog] in this description OUTSIDE
any HTML comment — here, inside a comment, it is inert.
-->

### Commands run
<!--- Paste the test commands and their final output lines. -->

### Types of changes
<!--- What types of changes does your code introduce? Put an `x` in all the boxes that apply: -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature or improvement (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Additional language file or change to the existing one (translations)

### Related issue(s):
1.
2.
3.

### Affected project(s):
- [ ] `handsontable`
- [ ] `@handsontable/angular-wrapper`
- [ ] `@handsontable/react-wrapper`
- [ ] `@handsontable/vue3`

### Checklist:
<!--- Go over all the following points, and put an `x` in all the boxes that apply. -->
<!--- If you're unsure about any of these, don't hesitate to ask. We're here to help! -->
- [ ] I have reviewed the guidelines about [Contributing to Handsontable](https://github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md) and I confirm that my code follows the code style of this project.
- [ ] I have signed the [Contributor License Agreement](https://cla.handsontable.com/sign) — one signature covers both Handsontable and HyperFormula; the `cla/signed` check on this PR confirms it.
- [ ] My change requires a change to the documentation.
- [ ] MANUAL QA NEEDED — <!-- one line: WHAT to check and why automation can't judge it. Also add the red `Manual QA required` label. Ticking holds the Tests run for a manual-qa environment approval by a designated reviewer (never whoever triggered the run). The box is read once per run, so if you change it after the pipeline ran, press "Re-run all jobs". This line is machine-read — keep its wording. -->

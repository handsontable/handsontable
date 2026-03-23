Review the staged changes in this Handsontable monorepo.

Check for:
- Public API changes without a legacy/deprecation path.
- New plugin behavior that is not gated by a configuration option with safe default (`false` for experimental features).
- Missing JSDoc on new public methods or options (include `@experimental` when applicable).
- Framework wrapper files in `/wrappers/**` containing business logic that should live in `/handsontable/src/**`.
- New npm dependencies in `package.json` / `pnpm-lock.yaml`.
- Missing changelog entry in `/.changelogs/*.json` for source-code changes.
- Missing tests: behavior changes should include both `.unit.js` and `.spec.js` coverage.

Report issues as a numbered list with `file:line` references.
If nothing is blocking, output: `No blocking issues found.`

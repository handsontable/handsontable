Review the current staged changes as a Handsontable maintainer.

Focus on:
- Breaking API behavior without a legacy/deprecation path.
- Missing changelog entry in `/.changelogs/*.json` when source code changed.
- Missing tests for behavior changes (`*.unit.js` and `*.spec.js`).
- Missing JSDoc for new public methods/options (`@experimental` for experimental APIs).
- Wrapper architecture violations (`/wrappers/**` containing business logic that belongs in `/handsontable/src/**`).
- Accessibility regressions (keyboard navigation, header focus flow, ARIA/screen reader semantics).
- Risky performance changes (large data handling, virtualization, unnecessary renders).

Output format:
1. Numbered findings by severity (Critical, High, Medium, Low).
2. Include `file:line` for each finding.
3. Include a short "Open questions" section if assumptions are needed.
4. If no blocking issues are found, output exactly: `No blocking issues found.`

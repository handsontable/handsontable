Review the current staged changes as a Handsontable maintainer.

Focus on:
 - When changes touch Handsontable core (`/handsontable/**`), follow the review rules defined in [handsontable/.cursor/BUGBOT.md](handsontable/.cursor/BUGBOT.md).
 - Missing changelog entry in `/.changelogs/*.json` when package source code changed (test-only or docs-only changes do not require a changelog entry).
 - Missing test coverage — every source code change must include unit tests (`*.unit.js`) and/or E2E tests (`*.spec.js`).
 - Wrapper architecture violations — `/wrappers/**` must not contain business logic (e.g., data transformation, validation, or direct cell manipulation) that belongs in `/handsontable/src/**`.
 - Risky performance changes (large data handling, virtualization, unnecessary renders).

Output format:
 - Numbered findings by severity (Critical, High, Medium, Low).
 - Include `file:line` for each finding.
 - Include an "Open questions" section only if assumptions were needed.
 - If no blocking issues are found, output exactly: `No blocking issues found.`

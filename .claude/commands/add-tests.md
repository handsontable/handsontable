Find all public methods in `$ARGUMENTS` that have no corresponding unit test in this repository.

Handsontable test layout:
- Unit tests: `/handsontable/src/**/__tests__/*.unit.js`
- E2E tests: `/handsontable/src/**/__tests__/*.spec.js` and `/handsontable/test/e2e/**`
- Test helpers: `/handsontable/test/helpers/index.js`

Tasks:
1. Identify public methods (exported functions, class public methods).
2. Check which methods already have `.unit.js` coverage.
3. Add missing unit tests in the nearest `__tests__` directory, using Jest.
4. Reuse helpers from `/handsontable/test/helpers/index.js` if DOM/grid helpers are needed.
5. Do not change source files.

Output:
- list of newly covered methods
- test file paths added or updated.

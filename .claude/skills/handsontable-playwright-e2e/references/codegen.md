# Recording with the Playwright CLI (reference)

1. Serve the fixture: `cd tests && node support/static-server.mjs`.
2. Record: `npx playwright codegen http://localhost:8123/tests/fixtures/demo/grid.html`.
3. Develop/watch: `npx playwright test --ui`.
4. Debug a failure: `npx playwright show-trace` on the trace from a retried run.

Before committing, refactor the recording:

- Replace generated CSS selectors with `data-testid` (add ids to the fixture or component).
- Lift the interactions into a page object under `fixtures/pages/`.
- Replace any generated `waitForTimeout` with web-first assertions.
- Delete steps codegen recorded incidentally.

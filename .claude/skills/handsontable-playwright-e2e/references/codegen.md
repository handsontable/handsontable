# Recording through the UI with the Playwright CLI (reference)

When an interaction is easier to capture by clicking than to write by hand, record it with the **Playwright CLI** — the version-pinned tool already installed here (parity with CI). Do not use a Playwright MCP for this; it is a second, unpinned automation surface with no version guarantee.

1. Serve the fixture: `cd tests && node support/static-server.mjs` (or run any served demo).
2. Record: `npx playwright codegen http://localhost:8123/tests/fixtures/demo/grid.html`. Click through the grid; codegen writes selectors and actions live.
3. Develop/watch interactively: `npx playwright test --ui`.
4. Debug a failure: `npx playwright show-trace` on the trace from a retried run.

**The recording is a starting point, not the deliverable.** Before committing, refactor the generated code:

- Replace generated CSS selectors with `data-testid` — add ids to the fixture (or component) where missing, rather than keeping a brittle selector.
- Lift the interactions into a page object under `fixtures/pages/`.
- Remove any generated `waitForTimeout`; use web-first assertions instead.
- Delete dead steps codegen recorded incidentally.

# Determinism checklist (reference)

A flake-free Playwright spec:

- No `sleep` / `waitForTimeout` / `networkidle` / custom readiness globals — wait on a condition (`await expect(locator).toBeVisible()`, `waitForResponse`).
- Every `expect` and every action is awaited (a missing await is the sneakiest flake).
- Freeze time with `page.clock` where behavior depends on it; mock network with `page.route`.
- Keep fixtures small — a big dataset slows every test and makes flakes likelier.
- `failOnFlakyTests` is on in CI: a test that only passes on retry is a hard failure. Fix the root cause, don't add retries.

## Waits inside a page object

Lint (`tests/.eslintrc.cjs`) bans the fixed waits it can name, in specs and page objects alike: `sleep`, `waitForTimeout`, the global `setTimeout` — also inside a `page.evaluate()` callback (#13349) — and a `waitForFunction()` without `{ polling }` (#13364). It reads source text, so two things stay out of its reach: a timer inside a fixture HTML page or a string-form `evaluate`, and the state a wait ends on. These six rules cover that ground. Each one was measured on a real migration.

1. **A `setTimeout` that runs in the browser is a fixed wait, wherever it sits.** It is `sleep()` moved into the page, and the ban's reason moves with it. Lint catches the callback form in a spec or page object (#13349); it cannot catch a timer in a fixture's inline script or in a string passed to `evaluate`. Expose the state as a data probe method and `expect.poll` it from the spec.
2. **`page.waitForFunction()` passes an explicit `{ polling: <ms> }`.** The default polls on `requestAnimationFrame`, and parallel-worker load can starve rAF callbacks past the timeout while the page is healthy — 3 mute timeouts in ~700 runs of `hidden-init-rerender.spec.ts`, 0 after switching to timer polling. Reference: `HiddenInitRerenderPage.goto()`. Every page object passes it since the sweep in #13364, and `tests/.eslintrc.cjs` errors on a `waitForFunction()` without it — an options literal is judged, also when wrapped in a type assertion; a plain options variable is not.
3. **A method that scrolls or mutates the grid ends on a render-state probe** — the first rendered row, a draw counter — never on `scrollTop`/`scrollLeft`. The scroll position settles before the rAF-batched redraw, so a caller that reads the DOM right after a scroll-position wait sees the previous frame. Reference: `OverlaysPage.scrollToEnd()`, which ends on the last cell being rendered. The counter-example is the `frozen-column-row-heights` gap: `FrozenTallCellPage.scrollVerticallyTo()` ends on `scrollTop`, so the spec had to add its own `masterFirstRenderedRow()` poll after every scroll.
4. **A trigger that can deliver more than once is asserted by polling the LATEST entry of a kind.** Filter the log for the hook, take `.at(-1)`, inside one `expect.poll` (`RefreshDimensionsPage.lastEntry()`). Never `.at(-1)` on a whole log read in a separate round trip — a further before/after pair can land between the poll and the read, and the read then describes a different delivery.
5. **A fixture build fails loud.** The fixture wraps the constructor and writes a throw into a window field (`htBuildError`); `goto()` accepts that field as a terminal state and rethrows it, and on timeout rethrows with a page snapshot (`readyState`, `typeof Handsontable`, stylesheet count). Otherwise a broken fixture reports "never became ready" with nothing that names the cause.
6. **A negative assertion ("nothing fired") uses a bounded settle ONLY next to a positive control in the same test.** First a poll that proves the machinery delivered (the once-ness case in `hidden-init-rerender.spec.ts` polls `calls[0] >= 1`), then the bounded settle (`afterAnimationFrames(n)`, frames counted inside the page), then the "still exactly once" read. A settle with no control passes on a dead mechanism.

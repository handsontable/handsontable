# Determinism checklist (reference)

A flake-free Playwright spec:

- No `sleep` / `waitForTimeout` / `networkidle` / custom readiness globals — wait on a condition (`await expect(locator).toBeVisible()`, `waitForResponse`).
- Every `expect` and every action is awaited (a missing await is the sneakiest flake).
- Freeze time with `page.clock` where behavior depends on it; mock network with `page.route`.
- Keep fixtures small — a big dataset slows every test and makes flakes likelier.
- `failOnFlakyTests` is on in CI: a test that only passes on retry is a hard failure. Fix the root cause, don't add retries.

## Waits inside a page object

Lint bans the fixed waits it can see in a spec. These six live one level down — inside `page.evaluate()`, a `waitForFunction`, or a probe method — where lint cannot follow, so the page object has to get them right. Each one was measured on a real migration.

1. **`setTimeout` inside `page.evaluate()` is a fixed wait.** It is `sleep()` moved into the browser, and the ban's reason moves with it. Expose the state as a data probe method and `expect.poll` it from the spec.
2. **`page.waitForFunction()` passes an explicit `{ polling: <ms> }`.** The default polls on `requestAnimationFrame`, and parallel-worker load can starve rAF callbacks past the timeout while the page is healthy — 3 mute timeouts in ~700 runs of `hidden-init-rerender.spec.ts`, 0 after switching to timer polling. Reference: `HiddenInitRerenderPage.goto()`. The page objects written before this rule still open with `waitForFunction(() => 'Handsontable' in window)` on the default — known debt, not a second pattern to copy; a sweep that moves them to timer polling is ticketed. A new page object follows the reference, whatever its neighbors do.
3. **A method that scrolls or mutates the grid ends on a render-state probe** — the first rendered row, a draw counter — never on `scrollTop`/`scrollLeft`. The scroll position settles before the rAF-batched redraw, so a caller that reads the DOM right after a scroll-position wait sees the previous frame. That is the `frozen-column-row-heights` gap: `scrollVerticallyTo()` ends on `scrollTop`, so the spec had to add its own `masterFirstRenderedRow()` poll after every scroll.
4. **A trigger that can deliver more than once is asserted by polling the LATEST entry of a kind.** Filter the log for the hook, take `.at(-1)`, inside one `expect.poll` (`RefreshDimensionsPage.lastEntry()`). Never `.at(-1)` on a whole log read in a separate round trip — a further before/after pair can land between the poll and the read, and the read then describes a different delivery.
5. **A fixture build fails loud.** The fixture wraps the constructor and writes a throw into a window field (`htBuildError`); `goto()` accepts that field as a terminal state and rethrows it, and on timeout rethrows with a page snapshot (`readyState`, `typeof Handsontable`, stylesheet count). Otherwise a broken fixture reports "never became ready" with nothing that names the cause.
6. **A negative assertion ("nothing fired") uses a bounded settle ONLY next to a positive control in the same test.** First a poll that proves the machinery delivered (the once-ness case in `hidden-init-rerender.spec.ts` polls `calls[0] >= 1`), then the bounded settle (`afterAnimationFrames(n)`, frames counted inside the page), then the "still exactly once" read. A settle with no control passes on a dead mechanism.

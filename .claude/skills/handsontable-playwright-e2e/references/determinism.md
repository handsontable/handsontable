# Determinism checklist (reference)

A flake-free Playwright spec:

- No `sleep` / `waitForTimeout` / `setTimeout` (also inside `page.evaluate`; the lint matches the global timer only, bare, `window.` or `globalThis.`, so `test.setTimeout(ms)` stays legal) / `networkidle` / custom readiness globals. Wait on a condition (`await expect(locator).toBeVisible()`, `expect.poll` on a data probe, `waitForResponse`). These are lint errors in `tests/.eslintrc.cjs`, in page objects (`tests/fixtures/`) as well as specs; a scheduling barrier that is not a duration wait carries the same eslint-disable line as `test.fixme`, naming the owning task.
- Await every `expect` and every action.
- Compare grid rows or cells inside one `evaluate` on a stable ancestor and `expect.poll` a pinned expected value; two `boundingBox()` (or `locator.evaluate()`) reads can straddle a re-render, because Walkontable recycles `<tr>`/`<td>` nodes (`tests/AGENTS.md`, Determinism).
- Freeze time with `page.clock`; mock network with `page.route`.
- Keep fixtures small.
- `failOnFlakyTests` is on in CI: fix the root cause of a pass-on-retry.
- A known flake that keeps reddening unrelated pull requests may be quarantined with `test('…', quarantined('DEV-1234', 'YYYY-MM-DD', why), …)` from `fixtures/quarantine.ts`: at most 30 days, at most six tests at once, this tier only. It still runs and reports; only its flaky verdict stops failing the leg. Rules: `tests/AGENTS.md` (Quarantine). A bare `@quarantine` tag is a lint error, as is `.skip`.

## Waits inside a page object

Lint bans the fixed waits it can name (`sleep`, `waitForTimeout`, the global `setTimeout` including inside a `page.evaluate()` callback (#13349), and `waitForFunction()` without `{ polling }` (#13364)). It reads source text, so a timer inside a fixture HTML page or a string-form `evaluate`, and the state a wait ends on, stay out of its reach. These six rules cover that ground.

1. **A `setTimeout` that runs in the browser is a fixed wait, wherever it sits.** Lint cannot see a timer in a fixture's inline script or in a string passed to `evaluate`. Expose the state as a data probe method and `expect.poll` it from the spec.
2. **`page.waitForFunction()` passes an explicit `{ polling: <ms> }`.** The default polls on `requestAnimationFrame`, which parallel-worker load can starve past the timeout on a healthy page (3 mute timeouts in ~700 runs of `hidden-init-rerender.spec.ts`, 0 after timer polling). Reference: `HiddenInitRerenderPage.goto()`. The bundle wait every `goto()` opens with comes from `awaitBundle()` (`tests/fixtures/bundle.ts`), which holds the interval in `BUNDLE_POLLING_MS`. `tests/.eslintrc.cjs` errors on a `waitForFunction()` without it; an options literal is judged, also when wrapped in a type assertion; a plain options variable is not.
3. **A method that scrolls or mutates the grid ends on a render-state probe** (the first rendered row, a draw counter), not on `scrollTop`/`scrollLeft`: the scroll position settles before the rAF-batched redraw. Reference: `OverlaysPage.scrollToEnd()`, which ends on the last cell being rendered. Counter-example: `FrozenTallCellPage.scrollVerticallyTo()` ends on `scrollTop`, so the `frozen-column-row-heights` spec had to add its own `masterFirstRenderedRow()` poll after every scroll.
4. **A trigger that can deliver more than once is asserted by polling the LATEST entry of a kind.** Filter the log for the hook, take `.at(-1)`, inside one `expect.poll` (`RefreshDimensionsPage.lastEntry()`). A `.at(-1)` on a whole log read in a separate round trip can describe a different delivery.
5. **A fixture build fails loud.** The fixture wraps the constructor and writes a throw into a window field (`htBuildError`); `goto()` accepts that field as a terminal state and rethrows it, and on timeout rethrows with a page snapshot (`readyState`, `typeof Handsontable`, stylesheet count); otherwise a broken fixture reports "never became ready" with nothing that names the cause.
6. **A negative assertion ("nothing fired") uses a bounded settle only next to a positive control in the same test.** First a poll that proves the machinery delivered (the once-ness case in `hidden-init-rerender.spec.ts` polls `calls[0] >= 1`), then the bounded settle (`afterAnimationFrames(n)`, frames counted inside the page), then the "still exactly once" read.

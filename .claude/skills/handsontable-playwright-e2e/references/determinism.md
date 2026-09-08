# Determinism checklist (reference)

A flake-free Playwright spec:

- No `sleep` / `waitForTimeout` / `setTimeout` (also inside `page.evaluate` — that is the usual disguise; the lint matches the global timer only — bare, `window.`, `globalThis.` — so `test.setTimeout(ms)`, a budget rather than a wait, stays legal) / `networkidle` / custom readiness globals — wait on a condition (`await expect(locator).toBeVisible()`, `expect.poll` on a data probe, `waitForResponse`). All of these are lint errors in `tests/.eslintrc.cjs`, in page objects (`tests/fixtures/`) as well as specs; a scheduling barrier that genuinely is not a duration wait carries the same eslint-disable line as `test.fixme`, naming the owning task.
- Every `expect` and every action is awaited (a missing await is the sneakiest flake).
- Freeze time with `page.clock` where behavior depends on it; mock network with `page.route`.
- Keep fixtures small — a big dataset slows every test and makes flakes likelier.
- `failOnFlakyTests` is on in CI: a test that only passes on retry is a hard failure. Fix the root cause, don't add retries.
- A *known* flake that keeps reddening unrelated pull requests may be quarantined — `test('…', quarantined('DEV-1234', 'YYYY-MM-DD', why), …)` from `fixtures/quarantine.ts` — for at most 30 days, at most six tests at once, in this tier only. It still runs and reports; only its flaky verdict stops failing the leg. Never a bare `@quarantine` tag (lint error), never `.skip`. Rules: `tests/AGENTS.md` (Quarantine).

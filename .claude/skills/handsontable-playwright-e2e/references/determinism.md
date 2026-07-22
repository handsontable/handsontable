# Determinism checklist (reference)

A flake-free Playwright spec:

- No `sleep` / `waitForTimeout` / `networkidle` / custom readiness globals — wait on a condition (`await expect(locator).toBeVisible()`, `waitForResponse`).
- Every `expect` and every action is awaited (a missing await is the sneakiest flake).
- Freeze time with `page.clock` where behavior depends on it; mock network with `page.route`.
- Keep fixtures small — a big dataset slows every test and makes flakes likelier.
- `failOnFlakyTests` is on in CI: a test that only passes on retry is a hard failure. Fix the root cause, don't add retries.

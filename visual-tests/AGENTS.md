# Visual Regression Tests

Playwright-based visual regression testing. Screenshots are compared by
[reg-suit](https://github.com/reg-viz/reg-suit); golden records and the HTML diff reports live in
Cloudflare R2.

## Framework

- Playwright with TypeScript
- Custom `tablePage` fixture from `src/test-runner.ts` (auto-navigates to demo, disables animations, waits for table)
- Config: `playwright.config.ts`, `playwright-cross-browser.config.ts`

## Test Pattern

```typescript
import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test(__filename, async({ tablePage }) => {
  // Setup
  const cell = await tablePage.locator('.ht_master td').first();
  await cell.click();

  // Capture state
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Action + another screenshot
  await tablePage.keyboard.press('Escape');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

## Key Rules

- Test naming: `__filename` auto-generates title from file path
- Screenshots: Always use `helpers.screenshotPath()` for consistent naming
- Organization: `tests/js-only/`, `tests/multi-frameworks/`, `tests/cross-browser/`
- Examples for testing live in `examples/next/docs/`

## Golden snapshots: js-copied baselines (critical gotcha)

The reference (golden) baseline and PR builds are generated **differently**, and this asymmetry is a recurring source of false-positive diffs.

- **Reference branch (`develop`)** — `scripts/run-tests.mjs` renders **only the `js` framework** (`getFrameworkList()` returns `[REFERENCE_FRAMEWORK]` when `isReferenceBranch()`), then **copies** the js `multi-frameworks` screenshots into the `react-wrapper` / `vue3` / `angular-wrapper` baselines. The wrapper screenshots in the golden set are therefore **identical to the js render** — the wrappers are never actually rendered on `develop`.
- **Pull requests (non-reference branches)** — every framework (`js` + all wrappers) is rendered for real from its own visual-test example, and each is compared against the copied js baseline.

**Implication:** the harness assumes every framework renders each multi-framework demo **pixel-identically to js**. When that assumption breaks, the affected wrapper snapshots diverge from the copied js baseline on **every** PR — a constant, content-independent diff — while `develop` builds can never detect it (they only ever re-copy js).

**Rule:** any change to a `js` visual-test demo that affects rendering (cell-type config, `dateFormat`, `locale`, formatting, data) **must be mirrored in all three wrapper demos**, or every future PR inherits a phantom diff. The wrapper demos must produce the same DOM/output as js.

- Visual-test examples live under **`examples/next/visual-tests/<framework>/demo/`** (js, react-wrapper, vue3, angular-wrapper) — distinct from the docs examples in `examples/next/docs/`.
- Example regression (DEV-1860): PRO-986 migrated the **js** date column to `dateFormat: { dateStyle: 'short' }` + `locale: 'en-US'` (native `Intl`) but left the wrapper demos with bare `type: 'date'`, so the wrappers rendered the default `Intl` format (`10/11/2020`) instead of the baseline's `10/11/20` → a constant 255-snapshot diff on every PR until the wrapper demos were synced. Pinning the browser `locale` in `playwright.config.ts` does **not** fix this class of bug — the gap is the demo config, not the runtime locale.

## Helpers

- `src/helpers.ts`: screenshotPath, DOM selectors, platform detection
- `src/page-helpers.ts`: selectCell, menu navigation, high-level interactions

## Comparison and approval (reg-suit)

`npm run in visual-tests compare` runs `scripts/compare.mjs`, which wraps `reg-suit run`. The wrapper
refuses to run when `REG_ACTUAL_KEY` starts with `base/` outside CI, so a local debugging session holding R2
credentials cannot overwrite the golden records every pull request is compared against — use a `local/...`
key instead. `reg-suit` itself fetches the golden records, diffs them against `screenshots/`, and publishes
the images plus a self-contained `index.html` to R2. reg-suit posts nothing
itself — no notifier plugin is configured. The pull request comment is written by `visual-gate.mjs` to
`.reg/comment.md` and posted by the `marocchino/sticky-pull-request-comment` step in `visual.yml`, which is
why it carries the approval instructions as well as the counts.

Five things about this pipeline are worth knowing before changing it.

- **`reg-suit run` exits 0 no matter what it finds.** A comparison result never fails it; fetch, publish
  and comparison-runtime errors do. Notifier errors are the one class it deliberately swallows
  (`processor.js`: "Don't re-throw notifiers error because it's not fatal"), which is why a broken notifier
  is invisible. `scripts/visual-gate.mjs` reads `.reg/out.json` and is the only thing that turns the check
  red. Never assume a green `compare` step means no differences.
- **Approval is all-or-nothing and is a GitHub label.** The `visual-approved` label on a pull request skips
  the gate for the whole build; there is no per-screenshot review. The gate reads the label **live**, but
  only a *new attempt* runs the gate at all — so the label alone changes nothing until something re-runs
  the job. `.github/workflows/visual-approval-rerun.yml` is what starts that attempt. Two things shape it.
  First, it **waits**: the comment that prompts the approval is posted by `Compare`, which is not the last
  job in the pipeline, so at label time the run is usually still `in_progress` and `rerun-failed-jobs`
  rejects it. Second, it re-reads the label, the head commit, the run and the job on **every** poll, so a
  push during the wait cancels the re-run instead of approving a build nobody looked at. It targets the job
  by its *rendered* name — `Visual / Compare`, the caller's job name plus the called workflow's job name —
  so renaming either `test.yml`'s `visual` job or `visual.yml`'s `compare` job silently stops every
  approval; `.github/scripts/__tests__/visual-approval-rerun.test.mjs` composes that constant back out of
  both workflow files to catch it. It re-runs *all* failed jobs, not just the gate, because `CI Gate` lives
  in the calling workflow and has to be re-run with it. The label is removed automatically on every push
  (`.github/workflows/visual-cleanup.yml`), so approval never carries over to unreviewed screenshots.
- **The comparison tolerates antialiasing, deliberately.** `regconfig.json` sets `enableAntialias` and
  `thresholdPixel: 150`. Chromium's text antialiasing is not bit-stable between runs: a measured example
  differed by 78 pixels out of 921,600 with no visible change, and at zero tolerance that failed 104 of
  1,646 screenshots — all of them focus- or menu-state captures. Do not lower these back to zero without
  re-measuring; a real regression is orders of magnitude larger.
- **A missing baseline never blocks.** `Check for golden records` probes
  `https://<domain>/base/<branch>/out.json` over plain HTTPS. When that 404s the run sets
  `VISUAL_BOOTSTRAP=true`: `visual-gate.mjs` passes without reading a report, and a same-repo build promotes
  its own screenshots to that branch's golden records. A fork cannot seed (no credentials), so it skips the
  comparison instead. An unreviewed baseline survives at most one merge on `develop`, `master` and
  `release/*`, because that branch's next build overwrites it. **Not on `lts/*`:** nothing triggers this
  workflow on an LTS push, so an LTS baseline is whatever the first pull request rendered, indefinitely.
- **A golden record is just a previous build's `actual/` directory.** reg-suit fetches
  `<expectedKey>/actual/**` into the local `expected/` dir, so the goldens and a normal build share one
  format. There is no separate baseline artifact to maintain.

Snapshot keys, set in `.github/workflows/visual.yml`:

```
base/<branch>/     golden records, rewritten by every build of that branch
pr-<number>/<sha>/ report and images for one pull request build, deleted when the PR closes
```

`EXPECTED_KEY` derives from `github.base_ref`, so a pull request is always compared against the branch it
targets. The `js`-to-wrapper baseline copy in `run-tests.mjs` (see the golden snapshots gotcha above) still
applies — reg-suit matches screenshots by their path.

## Run

See `package.json` scripts for build, test, and comparison commands.

For detailed guidance: use skills `visual-testing`, `creating-visual-test-examples`

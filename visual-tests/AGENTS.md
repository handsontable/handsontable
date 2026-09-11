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

Eight things about this pipeline are worth knowing before changing it.

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
  rejects it. Second, it re-reads the label, the head commit, the pull request state, the run and the job
  on **every** poll, so a push during the wait cancels the re-run instead of approving a build nobody
  looked at. That comparison is against `LABELED_HEAD_SHA` — the head commit as the `labeled` event saw it
  — and **must** be: the script looks the run up *by* the live head, so `run.head_sha` can never disagree
  with it and a check against the run's own SHA is dead code that silently follows the new commit. It
  targets the job by its *rendered* name — `Visual / Compare`, the caller's job name plus the called
  workflow's job name — so renaming either `test.yml`'s `visual` job or `visual.yml`'s `compare` job
  silently stops every approval; `.github/scripts/__tests__/visual-approval-rerun.test.mjs` composes that
  constant back out of both workflow files to catch it. It re-runs *all* failed jobs, not just the gate,
  because `CI Gate` lives in the calling workflow and has to be re-run with it — so a red job that has
  nothing to do with screenshots keeps `CI Gate` red after the re-run. The label is removed automatically
  on every push (`.github/workflows/visual-cleanup.yml`), so approval never carries over to unreviewed
  screenshots.
- **On a `labeled` event, `github.actor` is the labeller — not the pull request author.** The canonical
  fork guard's `github.actor != 'dependabot[bot]'` half therefore does **not** exclude a Dependabot pull
  request here: a maintainer applies the label, the guard passes, and the token is not downgraded. The
  re-run is then spent for nothing, because a re-run keeps the run's *original* actor, so `visual.yml`'s
  `IS_UNTRUSTED` is still true and the gate still hard-codes `approved=false`. `visual-approval-rerun.yml`
  carries `github.event.pull_request.user.login != 'dependabot[bot]'` as well, and keeps the canonical
  clause because `fork-guards.test.mjs` asserts that shape. Any future `labeled`-triggered workflow needs
  the same pair.
- **The comparison has three tolerance knobs, and all three are set on purpose.** `regconfig.json`
  drives pixelmatch through reg-cli: `matchingThreshold` (0.1) is the per-pixel color distance below
  which a pixel is not counted at all; `enableAntialias` drops the pixels pixelmatch's heuristic
  classifies as antialiasing; `thresholdPixel` (150) is the per-image count of remaining pixels an
  item may differ by and still pass. reg-suit defaults `matchingThreshold` to **0** when the key is
  absent, so until DEV-2797 every 1-unit color difference the heuristic did not exclude was counted.
  That is how a checkbox-glyph flicker of 152 counted pixels failed a 150-pixel gate on PR #13311
  (113 of them a two-pixel sliver of the "In stock" column), and why dark-theme edge speckle, which
  the heuristic misses, tripped the gate while light-theme speckle did not. Measured before choosing
  0.1: it turns that event into 0 counted pixels and leaves both genuine state differences in the
  local corpus failing (a 16px scrollbar band, a focus ring on another element); 0.2 hid the focus
  ring, so it is the ceiling. The knob has a false-negative budget, and it is not small: pixelmatch
  discards any pixel whose YIQ delta is under `35215 × 0.1² ≈ 352`, which is a uniform (grey) RGB shift
  of up to 26/255, a red-only shift of up to 46, or a blue-only shift of up to 78. A color-only token
  change inside that band passes every golden untouched, so a design-system PR that moves a token must
  state the before and after values and be reviewed by eye — the gate will not see it. Do not lower
  `thresholdPixel` back to zero without re-measuring; a real regression is orders of magnitude larger. `compare-fork.mjs` and the stability
  matrix read the same file through `lib/tolerance-flags.mjs`, so one edit covers every comparison path.
- **A capture waits two animation frames, then for the scrollbar clearance to settle — and a stuck
  band fails the capture.** The scrollbar-clearance band (#10370) is created inside the holder's
  `scroll` handler, which the browser dispatches on the frame *after* the action that scrolled resolves.
  A settle poll that runs the moment `click()` returns sees no band, passes, and the capture lands with
  the band up: measured 16 of 20 times on `selection-arabic-rtl-demo-2`, 0 of 20 once two frames had
  elapsed. The band then closes 1000 ms later (`OVERLAY_SCROLLBAR_FADE_DELAY`). `test-runner.ts` waits
  those two frames before the first poll, and when a band is still open after 5 s it decides instead of
  giving up silently: a pointer resting within 26 px of that scrollbar's edge (`OVERLAY_SCROLLBAR_PROXIMITY`,
  mirrored in the fixture) pins the band open by design, so the capture proceeds with a `scrollbar-band`
  annotation on the test; anything else throws, Playwright re-renders the spec, and a persistent stuck
  band reds the render job with a message naming the cause. `locator.screenshot()` bypasses the wrapper —
  capture through `tablePage.screenshot()`.
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
- **A single flaky capture on `develop` reds every open pull request, and it does not look like a flake.**
  The `Reconcile the golden records` step runs on every non-pull-request event and `aws s3 sync --delete`s
  that build's own render over `base/<branch>/actual`, unreviewed — so a green `develop` build that
  happened to photograph a transient state makes that state the reference. The build reports no failure
  and no retry; it simply captured something else. It then persists, because most `develop` runs are
  cancelled by the next push (2 of 10 finished on the day this was found), so the next reseed can be hours
  away. **The diagnostic is byte equality across pull requests:** if two unrelated pull requests fail on
  the same item, `shasum -a 256` their `actual/<item>` from the two reports. Identical bytes mean the
  render is deterministic and the golden record is the odd one out — neither pull request is at fault, and
  `visual-approved` on one of them fixes nothing for the others. Confirmed on `columns-filter-2` under
  WebKit, where the poisoned record carried a stray browser text-selection highlight on a column header;
  `test-runner.ts` now clears that selection before every capture. **`visual.handsontable.com` is behind a
  CDN, so reading a golden record back can hand you a stale copy** — during that investigation it served
  the superseded image for nearly an hour after `develop` had reseeded, which reads exactly like a
  baseline nobody has fixed yet. Always bust the cache before concluding anything from a golden record:
  `curl -H 'Cache-Control: no-cache' '<url>?cb=$RANDOM'`. The reg-suit reports are per-commit paths and
  never restated, so only the `base/<branch>/` prefix has this problem.

## Determinism

A visual spec has no assertion of its own — the screenshot is the assertion — so whatever state the
page is in when `screenshot()` runs is what the golden records. The rules that keep that state the
same on every render, enforced at `error` by `visual-tests/.eslintrc.js` (the functional tier's bans
from `tests/.eslintrc.cjs`, with one deliberate difference — the conditional `test.skip(condition, why)`
stays legal here because it is how js-only and chromium-only specs declare their variant — plus a ban on
element screenshots and the settle the fixture does for you):

- **Assert the state the capture is meant to show before capturing.** After any action that changes
  focus, opens or closes an element, or scrolls, wait for that state with a web-first assertion —
  `await expect(locator).toBeFocused()` / `.toBeVisible()` / `.toBeHidden()` / `.toHaveClass()` — or a
  page helper that does. A capture on the line after a `click()` / `press()` / `type()` with nothing
  asserted in between photographs whichever half of the transition the runner reached.
- **The filters menu moves focus on a timer.** Choosing a condition focuses that condition's first
  input 10 ms later (`handsontable/src/plugins/filters/component/condition.ts`), so a capture or a key
  press straight after the choice lands on either side of the hand-off; `filterByCondition()` and the
  filters specs assert `toBeFocused()` on the input first. The same shape applies to any component that
  defers focus.
- **Hover the element, not a coordinate.** `locator.hover()` names the target and runs the actionability
  checks (visible, stable, receives events at the point) before moving; a raw `mouse.move()` to a
  bounding-box coordinate does neither, so what it hovers depends on what happened to be there.
- **No fixed delays.** `waitForTimeout()`, `sleep()`, the global `setTimeout()` (inside `page.evaluate`
  too) and `'networkidle'` are lint errors in `src/` and `tests/`. The 2024 import carries about forty
  such sleeps; each wears `// eslint-disable-next-line no-restricted-syntax -- DEV-2797: <why>` so the
  debt is counted and greppable while the consolidation replaces them with asserted states. A new sleep
  needs the same line naming its own task, or it does not land.
- **`.only`, a bare or titled `.skip`, `test.fixme`, and `locator.screenshot()` are errors** too; the
  conditional `test.skip(condition, why)` that scopes a spec to a framework or a browser is the one legal
  skip, and an element capture is a clipped `tablePage.screenshot()` so the settle still runs.
- **Prove a determinism change with the stability matrix**, not a local loop: `Visual stability`
  (`.github/workflows/visual-stability.yml`, `workflow_dispatch`) renders the filters family (classic plus
  one chosen theme) and the whole cross-browser `selection.spec.ts` on chromium and firefox, on up to ten
  separate runners from one commit, and reports byte-unstable captures and the pairs the gate would have
  called changed. A single machine cannot see the cross-runner half of the
  noise — locally, 39 of 92 captures were byte-unstable across ten renders and the gate tolerated all of
  it, while CI flipped items a local loop never did. The ticket's acceptance criterion (ten renders, no
  changed filters item) is one dispatch of that workflow.
- **Two specs are known to photograph the wrong state**: `tab-navigation-from-submenu` and
  `shift-tab-navigation-from-submenu` never open the Alignment submenu they describe (ArrowDown ×3 from
  the first enabled item stops short of it), so their frames repeat the plain-menu frames other specs own.
  Repair the keystrokes or convert the coverage in the consolidation phase; do not delete them silently.

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

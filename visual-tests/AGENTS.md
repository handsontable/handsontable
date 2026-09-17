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

The reference (golden) baseline and the builds compared against it are generated **differently**, and this asymmetry is a recurring source of false-positive diffs. Which build renders what is the tier table in `src/config.mjs` (`VISUAL_TIERS`, see [Tiers](#tiers) below); the asymmetry itself is this:

- **`seed` tier (a push to a base branch — `develop` through `visual-seed.yml`, `master` and `release/*` through `test.yml`)** — `scripts/run-tests.mjs` renders **only the `js` framework** (bare plus the four themes), then **copies** the js `multi-frameworks` screenshots into the `react-wrapper` / `vue3` / `angular-wrapper` baselines (`copyWrappers: true`). The wrapper screenshots in the golden set are therefore **identical to the js render** — the wrappers are never actually rendered on a base branch.
- **`pr` tier (every pull request)** — renders `js × {main, main-dark}` on chromium: no bare render, no cross-browser leg, and a wrapper **only when `VISUAL_WRAPPERS` names it**. `test.yml` passes the scope router's `visual-wrappers` output (`checks.yml`): the wrappers whose own `wrappers/<pkg>/**` tree changed, and nothing else — deliberately not the Integration matrix, which lights all three on any core change because each wrapper's test scope includes the core's. A core-only pull request renders no wrapper at all; each wrapper that does render is compared against the copied js baseline.
- **`full` tier (the weekday nightly, `visual-nightly.yml`, and any pull request the scope router flags `visual-full` — `visual-tests/**` or `examples/next/visual-tests/**`; deliberately not the lockfiles that `test-visual` also carries, so a dependency bump renders the `pr` tier and a browser bump is proven by the next seed and nightly)** — everything, with **every wrapper rendered for real** from its own visual-test example and compared against the copied js baseline.

**Implication:** the harness assumes every framework renders each multi-framework demo **pixel-identically to js**. When that assumption breaks, the affected wrapper snapshots diverge from the copied js baseline on **every build that renders that wrapper** — the nightly, every visual-tier pull request, and every pull request that changes that wrapper's own tree — as a constant, content-independent diff, while the seed can never detect it (it only ever re-copies js). A pull request that renders js alone never sees it either, so a parity break introduced by such a pull request first shows up as a red nightly the following morning, not on the pull request that merged it.

**Rule:** any change to a `js` visual-test demo that affects rendering (cell-type config, `dateFormat`, `locale`, formatting, data) **must be mirrored in all three wrapper demos**, or every future build that renders the wrappers — the nightly first, then every visual-tier pull request — inherits a phantom diff. The wrapper demos must produce the same DOM/output as js.

- Visual-test examples live under **`examples/next/visual-tests/<framework>/demo/`** (js, react-wrapper, vue3, angular-wrapper) — distinct from the docs examples in `examples/next/docs/`.
- Example regression (DEV-1860): PRO-986 migrated the **js** date column to `dateFormat: { dateStyle: 'short' }` + `locale: 'en-US'` (native `Intl`) but left the wrapper demos with bare `type: 'date'`, so the wrappers rendered the default `Intl` format (`10/11/2020`) instead of the baseline's `10/11/20` → a constant 255-snapshot diff on every PR (every pull request rendered the wrappers then; today it would be a red nightly and red visual-tier pull requests) until the wrapper demos were synced. Pinning the browser `locale` in `playwright.config.ts` does **not** fix this class of bug — the gap is the demo config, not the runtime locale.

## Helpers

- `src/helpers.ts`: screenshotPath, DOM selectors, platform detection
- `src/page-helpers.ts`: selectCell, menu navigation, high-level interactions

## Tiers

Not every build renders every variant; the tier decides which. Measured on 2026-09-09 over 82 pull
requests: a build rendered 1646 golden records and the visual stage added a mean 15.1 minutes to a pull
request run. Every js-only spec renders five times (the bare chromium run — the "classic" delivery path,
where the core inlines the main theme stylesheet — plus the four themes), every multi-framework spec eight
times (js × 5 plus the three wrappers), and the cross-browser leg renders its specs on three browsers. The
bare run is byte-identical to `main` on 199 of its 234 records — it is a delivery-path parity check, not a
fifth theme — and no real regression in that window was confined to one theme, one browser or one wrapper;
every real change hit all themes or all browsers. So a pull request renders the two default themes on js;
the seed renders the other js variants and the cross-browser leg minutes after the merge and comments what
changed on the merged pull request; and the nightly renders what the seed only copies — the wrappers.

| Tier | When | Renders | Golden records compared | Writes `base/`? |
|---|---|---|---|---|
| `pr` | every pull request (`test.yml`) | js on chromium, `main` + `main-dark`; a wrapper only when `VISUAL_WRAPPERS` names it (the scope router's `visual-wrappers`: the wrappers whose own tree changed); no bare run, no cross-browser leg | the matching subset of `base/<target>` | no — `pr-<number>/<sha>/` |
| `seed` | a push to a base branch: `develop` through `visual-seed.yml`, `master` and `release/*` through `test.yml` (the RC path included) | js bare + 4 themes, the cross-browser leg, the wrappers **copied** from the js bare render | all of `base/<branch>` (the previous seed) | yes — `base/<branch>` is expected and actual |
| `full` | the weekday nightly on develop (`visual-nightly.yml`); a pull request the scope router flags `visual-full` | everything: js bare + 4 themes, the three wrappers **rendered for real**, the cross-browser leg | all of `base/develop` (nightly) or `base/<target>` (pull request) | never reconciled — the nightly publishes to `nightly/<branch>/`, a pull request to `pr-<number>/<sha>/` (the bootstrap of a branch with no goldens is the one write, see below) |

The table is `VISUAL_TIERS` in `src/config.mjs` — one object per tier (`frameworks`, `classic`, `themes`,
`browsers`, `copyWrappers`) — and everything else derives from it:

- **`VISUAL_TIER` selects the tier; `VISUAL_WRAPPERS` adds wrappers to `pr`.** `lib/visual-tiers.mjs`
  `resolveTier()` reads both. An unknown `VISUAL_TIER` throws (it never renders nothing); unset, it resolves
  to `seed` when the current branch (`GITHUB_REF_NAME`, else `git rev-parse`) is `develop` and to `full`
  otherwise — the same branch rule the pre-tier `getFrameworkList()` applied (now deleted, so there is one
  answer to "what does this branch render" rather than two), so a bare `npm run test` on a feature branch
  still renders everything and on `develop` still renders js and copies. `VISUAL_WRAPPERS`
  is read in the `pr` tier only (`seed` copies, `full` renders all three regardless) and accepts a JSON
  array of names (the router's `visual-wrappers` output), the Integration matrix shape
  (`[{"pkg":"react-wrapper",…}]`), or a comma- or space-separated list; an entry that is not in `WRAPPERS` throws, because a typo that silently rendered
  no wrapper would look exactly like a clean build. `scripts/utils/utils.mjs` `getTier()` is the one call
  `build.mjs` and `run-tests.mjs` make; `build.mjs` installs and builds only the tier's frameworks, which
  is where the `pr` tier saves the Angular install (about 2 minutes on its own).
- **Who passes which tier.** `visual.yml` takes `tier` (required) and `wrappers` as `workflow_call`
  inputs and exports them as `VISUAL_TIER` / `VISUAL_WRAPPERS`. `test.yml` passes `pr` on a pull request,
  `full` when the scope router's `visual-full` is true (`visual-tests/**`, `examples/next/visual-tests/**` —
  a change to a spec or a demo is proven on every variant; `test-visual` also carries the lockfiles, and a
  path filter cannot tell a Playwright bump from any other dependency bump, so a lockfile-only pull
  request renders the `pr` tier and the next seed and nightly prove a browser bump), and `seed` on the
  master push and the RC path; `visual-seed.yml` passes `seed`;
  `visual-nightly.yml` passes `full`. The `pr` tier also drops the cross-browser render job from the
  matrix: firefox and webkit differences are nothing a pull request author can reproduce locally, and the
  leg is 7 minutes and one job under the org's 60-job cap. `strategy` cannot read `env`, so the two matrix
  shapes are spelled out in `visual.yml`, and `.github/scripts/__tests__/visual-tiers.test.mjs` pins that
  the `pr` shape agrees with `VISUAL_TIERS.pr.browsers` being empty.
- **A subset render is compared as a subset, or it reports ~1178 phantom deletions.** reg-suit lists every
  expected file that has no actual counterpart as a DELETED item, so a `pr` render (468 records) against
  the full baseline (1646) would report every horizon, wrapper, bare, and cross-browser golden as deleted on
  every pull request. `compare.mjs` therefore runs `reg-suit sync-expected`, prunes `.reg/expected` to the
  tier's prefixes (`tierPrefixes()` → `pruneExpected()`), then `reg-suit compare` and `reg-suit publish`;
  `compare-fork.mjs` filters the baseline manifest with `isInTier()` the same way. The prune always
  runs — in the `seed` and `full` tiers the prefixes cover every known variant, so it removes nothing
  unless a stale variant lingers in R2, and then it logs what it removed. This is also why the golden
  set keeps the seed's full shape by design: every tier compares against an exact subset of one
  baseline, and `visual-gate.mjs` needs no idea that tiers exist.
- **`nightly/<branch>/` is a report, never a baseline.** The nightly resolves
  `REG_EXPECTED_KEY=base/develop` and `REG_ACTUAL_KEY=nightly/develop`, a fixed key rewritten each night
  (only the latest nightly report is kept, so nothing needs purging), and `VISUAL_WRITES_BASE=false` keeps
  it out of the Reconcile step. It renders the wrappers for real, so its shape is not the baseline's;
  letting it seed would replace the copied wrapper goldens with real renders and every later seed would
  flip them back. `scripts/seed-report.mjs` writes each non-pull-request build's own differences to the
  job summary — the seed's are what the merged commit changed and never block; the nightly's red the run,
  because on develop a difference the seed does not already carry is a flake, a wrapper that no longer
  renders like js, or a poisoned golden. **A theme- or browser-only regression therefore never reds the
  nightly**: the seed of the merging commit rendered it and reconciled it into `base/develop` hours
  earlier, and the nightly matches it byte for byte. That is why the seed comments its out-of-tier
  differences (everything outside `js/chromium-theme-main*/`, split by `tierPrefixes(VISUAL_TIERS.pr)`)
  on the merged pull request, found through the squash commit's `(#N)` suffix — the pull request's own
  check rendered `main` and `main-dark` only, so this comment is the first time its author sees the
  horizon, classic, Firefox or WebKit render of their change. The step is sticky (`visual-seed` header,
  `number` input) and `continue-on-error`, because a failed comment must never keep the seed from landing.
- **Local use.** `VISUAL_TIER=pr npm run build && VISUAL_TIER=pr npm run test` is the fast loop — js on
  chromium with two themes, no wrapper installs. Set the same `VISUAL_TIER=pr` on `npm run compare` so the
  prune matches what was rendered; a feature branch otherwise resolves to `full`, and a `pr`-tier render
  compared as `full` reports the other 1178 records as deleted. A bare `npm run test` on a feature branch
  renders everything, as before.
- **Bootstrap seeds the tier's subset, not the branch's full set.** A `pr`-tier pull request that seeds a
  new base branch (`VISUAL_BOOTSTRAP=true`) promotes its 468 records and nothing else; the branch's own
  `seed`-tier build replaces that with the full set on the next push. `lts/*` never gets one — nothing runs
  the visual tests on an LTS push — so a later `full`-tier pull request into an LTS branch reports every
  variant outside the `pr` subset as new. A `full`-tier pull request bootstraps the same way, real wrapper renders included; the branch's next
  seed flips those 276 records back to js copies (and lists them as changed in its summary), and on `lts/*`
  they stay. The reverse shape is an error, not a bootstrap: a pull request into a branch whose baseline
  holds none of its tier's prefixes (an older golden layout, or a baseline left half-written by a killed
  seed — every tier renders `main` and `main-dark`, so no tier can seed one) fails on both comparison
  paths with a message saying so — `compare.mjs` refuses when the prune keeps nothing
  while removing something, `compare-fork.mjs` when the manifest holds none of the tier's prefixes.
  Comparing anyway would report every rendered record as new, a `changed` verdict that reads like a real
  change.

## Comparison and approval (reg-suit)

`npm run in visual-tests compare` runs `scripts/compare.mjs`, which wraps `reg-suit sync-expected` → prune →
`reg-suit compare` → `reg-suit publish` (the prune trims the fetched goldens to the tier's prefixes — see
[Tiers](#tiers) — so a subset render is compared as a subset). The wrapper
refuses to run when `REG_ACTUAL_KEY` starts with `base/` outside CI, so a local debugging session holding R2
credentials cannot overwrite the golden records every pull request is compared against — use a `local/...`
key instead. `reg-suit` itself fetches the golden records, diffs them against `screenshots/`, and publishes
the images plus a self-contained `index.html` to R2. reg-suit posts nothing
itself — no notifier plugin is configured. The pull request comment is written by `visual-gate.mjs` to
`.reg/comment.md` and posted by the `marocchino/sticky-pull-request-comment` step in `visual.yml`, which is
why it carries the approval instructions as well as the counts.

Seven things about this pipeline are worth knowing before changing it.

- **`reg-suit` exits 0 no matter what it finds — `run` and the `compare` / `publish` subcommands
  `compare.mjs` calls alike.** A comparison result never fails it; fetch, publish
  and comparison-runtime errors do. Notifier errors are the one class it deliberately swallows
  (`processor.js`: "Don't re-throw notifiers error because it's not fatal"), which is why a broken notifier
  is invisible. `scripts/visual-gate.mjs` reads `.reg/out.json` and is the only thing that turns a pull
  request's check red (`scripts/seed-report.mjs` plays that part for the nightly). Never assume a green
  `compare` step means no differences.
- **Approval is an environment, per run, one click.** When `Compare` finds differences, its `Visual
  verdict` step reports `changed` (green step, `verdict` output) and `visual.yml`'s `approve` job pauses on
  the `visual-approval` **environment** until someone on its reviewer list approves the pending deployment
  on the run page — the same mechanism as `manual-qa.yml`. `CI Gate` needs the Visual module, so it cannot
  report until then; **Reject** fails the job and reds the gate. Approval is per run, so a push re-asks;
  nothing is re-committed and nothing is re-run. It is all-or-nothing for the build — there is no
  per-screenshot review — so read the report before approving. The deployment's URL is the diff report
  (`report-url` output), so "View deployment" opens it. The job asserts an approval is recorded through the
  approvals API and fails closed: a missing or unprotected environment turns the job red rather than waving
  the differences through, so the environment must exist with required reviewers — **and with "Prevent
  self-review" ticked** — before the first pull request with differences runs. The tick carries weight the
  assertion cannot: a self-approval is a recorded approval like any other, so without it the author signs
  off their own differences, which is the rubber-stamping this replaces rather than a fix for it.
  Approving also rewrites the sticky comment that asked (`Record the approval on the pull request`, same
  header), because there is no re-run here to refresh it and the request would otherwise read as pending
  through merge. Fork and Dependabot runs are approved the same way — the reviewer's click
  never goes through the run's downgraded token — which the old `visual-approved` label could not offer;
  that label, `visual-cleanup.yml` and `visual-approval-rerun.yml` are gone, and so is the `labeled`-event
  actor trap they carried. **Delete the label from the repository's label list at cutover**: nothing reads
  it any more, so one left in the picker is a button that silently does nothing.
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
  band reds the render job with a message naming the cause — and the fixture buys that message its time
  with `testInfo.setTimeout()` when it enters the slow path, because a flat per-test budget is spent by
  whichever capture comes first. `locator.screenshot()` bypasses the wrapper — capture through
  `tablePage.screenshot()`.
  **A pinned band is fine for a capture and not for a click**, so the two policies are separate
  functions over one state machine (`awaitScrollbarClearance` → `closed | pinned | stuck`).
  `settleScrollbarClearanceForCapture` is the wrapper's, and accepts a pinned band. A spec that is about
  to click where the band is imports `waitForScrollbarClearanceToClose`, which throws on a pinned one:
  while the band is up that strip belongs to the scrollbar, so the click is swallowed and the spec
  carries on with a selection it never made. `copy-paste.spec.ts` is the spec that shape bit — one cell
  copied instead of the range, its assertions still passing, visible only as a changed screenshot.
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
  The `Reconcile the golden records` step runs on every seed-tier build (`VISUAL_WRITES_BASE=true`, set only
  for a push to a base branch rendering `tier: seed` — never for the nightly) and `aws s3 sync --delete`s
  that build's own render over `base/<branch>/actual`, unreviewed — so a green `develop` build that
  happened to photograph a transient state makes that state the reference. The build reports no failure
  and no retry; it simply captured something else. It persisted for hours while the seed lived in
  `develop.yml`, whose `cancel-in-progress` cancelled most runs before they reached it (23 of 30 on 2026-09-08). The seed now runs in
  `.github/workflows/visual-seed.yml` under a group that never cancels, so the last push of any burst is
  seeded within about 15 minutes, and a poisoned record is overwritten by the next develop push rather than
  the next run that survives. A poisoned record can also be replaced by hand: dispatch `Visual seed` on
  develop, with develop selected as the branch (a dispatch from any other ref is refused by that
  workflow's `guard` job: `visual.yml` would otherwise reconcile that ref's own `base/` prefix, and an
  `lts/*` baseline is one nothing else would put back) — and **check that the dispatch actually ran**. It shares its concurrency group with the pushes
  (one writer for `base/develop`, by design), so a merge landing while it is pending drops the pending
  dispatch with no reason given. Usually that is the right outcome, because the push seeds a newer commit
  over the same prefix and fixes the poisoned record anyway; if pushes have stopped, re-issue the dispatch.
  **When a baseline looks stale rather than poisoned, start at that workflow's last successful run**:
  `Visual seed` is not a required check, it is not in `test-health.yml`'s list, and since DEV-2797 it no
  longer reds the `Develop` run, so a broken seed is quiet in the pipeline itself. Three things announce
  it: that workflow's `notify` job posts a failed seed to Slack when `SLACK_VISUAL_WEBHOOK_URL` is set
  (absent, the step skips itself and nothing changes); GitHub notifies whoever pushed; and the nightly
  (`visual-nightly.yml`) renders develop again each weekday night against that seed and reds on any
  difference, so a poisoned or flaky golden shows up as a red nightly naming the item path, not only as
  red pull requests. Only a *failed* seed pings — a seed that succeeds with differences is the normal
  case, and `seed-report.mjs` already reports those.
  **The diagnostic is byte equality across pull requests:** if two unrelated pull requests fail on
  the same item, `shasum -a 256` their `actual/<item>` from the two reports. Identical bytes mean the
  render is deterministic and the golden record is the odd one out — neither pull request is at fault, and
  approving one of them fixes nothing for the others. Confirmed on `columns-filter-2` under
  WebKit, where the poisoned record carried a stray browser text-selection highlight on a column header;
  `test-runner.ts` now resets that selection before every capture (engine-gated — see Determinism below).
  **`visual.handsontable.com` is behind a
  CDN, so reading a golden record back can hand you a stale copy** — during that investigation it served
  the superseded image for nearly an hour after `develop` had reseeded, which reads exactly like a
  baseline nobody has fixed yet. Always bust the cache before concluding anything from a golden record:
  `curl -H 'Cache-Control: no-cache' '<url>?cb=$RANDOM'`. The pull request reports are per-commit paths and
  never restated, so only the two rewritten prefixes have this problem: `base/<branch>/` and
  `nightly/<branch>/`, whose `index.html` inlines this run's counts while every image pane can still be
  last night's for up to four hours.
- **`visual-gate.mjs` and `seed-report.mjs` also serve the docs site's visual suite (DEV-2860).**
  `.github/actions/docs-visual-run/action.yml` points `scripts/visual-gate.mjs` at
  `docs/tests/test-artifacts` through `VISUAL_GATE_DIR` and relabels its output through
  `VISUAL_GATE_TITLE`, `VISUAL_GATE_ENVIRONMENT` (`docs-visual-approval`), `VISUAL_GATE_ARTIFACT`
  (`docs-visual-report`) and `VISUAL_GATE_REPORT_PATH` (`results/index.html`); `scripts/seed-report.mjs`
  honors the same `VISUAL_GATE_DIR`, though the docs seed does not call it yet. The docs suite has no
  reg-suit: `docs/tests/lib/visual-manifest.mjs` writes a reg-suit-shaped `out.json` from Playwright's JSON
  report for the gate to read. So the `out.json` keys `lib/visual-gate.mjs` consumes (`failedItems`,
  `newItems`, `deletedItems`, `passedItems`) and what the script emits (`comment.md`, the `verdict=` and
  `report-url=` outputs) are a contract with the docs gate as well — changing either changes the docs gate
  too. `docs/AGENTS.md` section 2.18 describes that side; `.github/scripts/__tests__/docs-visual-baseline.test.mjs`
  pins the variables.

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
- **The fixture drops a stray native selection before every capture, and under a focused text control
  the reset is engine-gated.** `clearNativeTextSelection()` in `test-runner.ts` removes the browser's own
  text-selection highlight (a header label a click sequence left selected). With an input or textarea
  focused the engines split, measured on #13468: WebKit keeps painting a selection made before the
  control took focus and the Selection API cannot see it (one collapsed range at the control's parent,
  stray or not), so there the ranges are removed and the control's own selection is put back with
  `setSelectionRange()`. Chromium re-rasterizes the whole grid's text when the ranges under a focused
  control are removed — 13 Tab-navigation captures moved by 3k–45k pixels across every theme when the
  clear ran unconditionally — so on Chromium and Firefox a focused text control is left alone. Do not
  fold the two branches into one; either half regresses the other engine.
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
base/<branch>/     golden records, rewritten by every seed-tier build of that branch
pr-<number>/<sha>/ report and images for one pull request build, deleted when the PR closes
nightly/<branch>/  the nightly full render's report, rewritten each night, never a baseline
```

`EXPECTED_KEY` derives from `github.base_ref`, so a pull request is always compared against the branch it
targets. The `js`-to-wrapper baseline copy in `run-tests.mjs` (the `seed` tier — see the golden snapshots
gotcha above) still applies — reg-suit matches screenshots by their path, and every other tier is
compared against an exact subset of that seed.

## Run

See `package.json` scripts for build, test, and comparison commands.

For detailed guidance: use skills `visual-testing`, `creating-visual-test-examples`

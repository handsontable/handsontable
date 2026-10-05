# AGENTS.md — Playwright functional E2E tier (`tests/`)

Functional, real-browser E2E for the whole monorepo lives here (`e2e/*.spec.ts`).
Visual regression is a separate package (`visual-tests/`). Task workflow: the
`handsontable-playwright-e2e` skill. Setup and commands: [`README.md`](./README.md).

## The matrix — six projects, two axes

- `theme` (main / horizon / classic) × `bundle` (`umd` = `dist/handsontable.js`,
  `full-min` = `dist/handsontable.full.min.js`) → projects `e2e-<theme>` and
  `e2e-<theme>-min`, 1:1 with the Puppeteer legs (`test:e2e` / `test:production`).
- Every spec runs on all six legs automatically. Author against
  `fixtures/test.ts` (`import { test, expect } from '../fixtures/test'`),
  destructure `{ page, theme, bundle }`, and pass both to the page object.
- **Local gates run `e2e-main` (plain UMD) only** — pre-push, the Claude Stop
  hook, and `npm run test:e2e` are pinned there; the `-min` legs are CI-only.
  (`e2e-main` used to load `full.min` — never assume the hooks cover min.)
- `handsontable.full.js` and `handsontable.min.js` are deliberately untested
  here — they belong to the nightly on develop (DEV-2058).
- **A PARTIAL build leaves the `-min` legs on the PREVIOUS bundle, and they
  fail without saying so.** `npm run build:umd` writes `dist/handsontable.js`
  only; `dist/handsontable.full.min.js` comes from the separate
  `build:umd.min`. So after `build:umd` the three `umd` legs carry the change
  and the three `-min` legs still run the code from before it — same spec, same
  machine, opposite verdicts. **Read the failures PER LEG before calling
  anything a race:** `45 failed / 90` on `--repeat-each=15` is not "50% flaky",
  it is 3 legs × 15 failing every time. A failure count that is a multiple of
  the repeat count is worth checking per leg for exactly that shape — it is a
  prompt to look, not a verdict, since a genuine one-in-three race across 90
  runs lands on 30 often enough. Always `npm --prefix handsontable run build`
  (the full task, which also runs the strict `postbuild`) before a cross-leg
  run, and confirm both files moved with
  `ls -l handsontable/dist/handsontable.js handsontable/dist/handsontable.full.min.js`.
  Then **re-run before concluding "the code was fine"**: a clean 3-red/3-green
  split by bundle is equally consistent with a real difference in bundle
  CONTENT, because the `-min` legs load `handsontable.full.min.js` with
  HyperFormula and Formulas registered. Only the same legs going green on a
  verified full build separates staleness from a genuine full-bundle
  difference. Both shapes were seen on one ticket. The staleness one cost
  DEV-2756 a ticket — a deterministic `-min` failure filed as load-dependent
  nondeterminism, where a full build then passed 90/90 on all six legs. The
  content one showed up on the same branch minutes later, on a verified full
  build: after `updateData()` discards a stranded editor, `getActiveEditor()`
  is `null` on `umd` and a fresh editor at row 0 on `full-min`, so an assertion
  on the editor reference split exactly along the bundle axis with nothing
  stale involved. **Assert the observable outcome** — committed changes, source
  data — rather than which internal objects survived, and where a difference is
  real, say so in the test instead of pinning one bundle's answer. A real one is
  still a defect: that editor split is tracked as DEV-2862, since the fixture
  enables no Formulas and only the bundle differs.
- **A stylesheet edit needs BOTH bundles rebuilt, not only the stylesheet.** The
  bundles inline the base stylesheet (`src/styles/handsontableStyles.js`, which
  `build:styles` rewrites) and inject it as a `<style>` after the fixture's
  `<link>`s, so for a declaration both copies carry, the bundle's copy wins the
  cascade. After `build:styles.min` alone, `handsontable.min.css` on disk shows
  the new value while every leg still renders the old one — measured on the row
  resize guide's `margin-top`: 4px in the stylesheet, 5px computed, and the spec
  that guards it stayed green on the planted bug. `build:umd` refreshes the three
  `umd` legs only; the three `-min` legs load `handsontable.full.min.js`, which
  only `build:umd.min` rewrites, so a planted CSS bug rebuilt with `build:umd`
  alone goes red on `umd` and stays green on `-min` — the same misread, split by
  bundle. Rebuild `build:umd` and `build:umd.min`, or run the full `build`
  (`handsontable/AGENTS.md`, Build). An additive rule takes effect from the
  stylesheet alone, which is what makes the trap look intermittent.
- **Never hardcode a row or column index that sits near the edge of the
  rendered band.** Each theme's padding feeds `autoColumnSize`, so the same
  content measures differently: in `width-window-scroll.html` (500px wide, 30
  columns) a data column is 63px on `classic`, 70px on `main`, and 78px on
  `horizon`, so after the same 400px holder scroll the master renders columns
  7–14, 6–12, and 6–11. Column 12 is the LAST one `main` renders there and does
  not exist on `horizon` — and the local gates only run `e2e-main`, so the spec
  went green locally and failed in CI with `element(s) not found`, which says
  nothing about the behavior under test (DEV-2789). Read the rendered range out
  of the DOM and pick from it (`WidthWindowScrollPage.renderedColumns()`), or
  scroll to an edge so the target is the first or last index by construction
  (`scrollHolderToEnd()`). Row heights are the same trap on the other axis,
  with more room to spare: a window scroll far larger than the viewport leaves
  the target row well inside the band on every theme, which is why `cell(40, 3)`
  after an 800px window scroll in the same spec is safe. Distance from the
  band's edge is what decides, not whether the index is written down.
- **The same trap applies to any assertion about WHICH SIDE a popup opens on.**
  A dropdown editor's list is as tall as its rows, so the theme decides whether
  it fits below the cell or has to flip above it: the same grid flips on
  `horizon` and does not on `main`. Because every local gate is pinned to
  `e2e-main` (and the legacy Jasmine runner defaults to `main`), a spec that
  pins the side goes green locally and reds exactly one CI leg, with a message
  full of coordinates that says nothing about the cause — that is how
  `E2E / UMD (theme: horizon)` went red on #13417 while the other two themes
  passed. Assert **adjacency** instead: the popup touches the cell on one side
  or the other. Leave "which side, and does it leave the grid" to a spec whose
  grid is deliberately shaped to force that outcome on all three themes, and
  run it on all three (`--theme=horizon`, `--project=e2e-horizon`).
  `e2e/submenu-position.spec.ts` is that shape for menus: its fixture's menus
  are three and two items long, so every point it opens a menu at clears or
  misses the room the menu and its submenu need by 56 px or more on every
  theme, more than a row. With the full default item list that margin
  collapses: from the top-left corner the Alignment submenu has 142 px to
  spare below on `main` and 5 px on `horizon`, one row-height change from
  flipping.
- **An RTL fixture the WINDOW scrolls needs an RTL document, not only an RTL
  grid.** A `layoutDirection: 'rtl'` grid inside an LTR page is laid out with
  its inline start at the far end of the page, so the page opens on the grid's
  LAST columns and cell (0, 0) is never rendered: `goto()` dies on a missing
  cell. Set `<html dir="rtl">` too, as a real RTL page does; the window then
  scrolls toward the inline end with a NEGATIVE `scrollX`, which is the
  arithmetic a window-scroll branch has to get right
  (`e2e/handsontable-editor-list-position.spec.ts`, whose RTL window case
  caught exactly such a bug: the list's flip added the viewport position of the
  grid's LEFT edge to a distance measured from its right edge, so every list
  flipped once the page was scrolled toward its inline end). Such a case must
  SCROLL the window, not only render the RTL page: at `scrollX` 0 that bug made
  no difference. And give it a layout where the grid root is not exactly as
  wide as the viewport (that spec's `?inset=start`), or `scrollX` and the
  root's width can stand in for the right terms and pass.
- **A SHORT fixed-height fixture has no room to spare on the row axis, and
  `hover()` turns that into a delayed failure somewhere else.** Playwright
  scrolls a target into view before pressing it, so a `cell(row, col)` locator
  is not only a position — it is a potential scroll. In a 260px grid,
  `cell(5, 3)` is inside the band on `main` and `horizon` and below the fold on
  `classic`; hovering it there scrolled the holder far enough to unrender row 1,
  and the step that failed was a LATER hover over row 1, which timed out after
  20s with `waiting for getByTestId('cell-1-1')` — a missing element, pointing
  at neither the scroll nor the theme (DEV-2871). Two rules follow. Pick a cell
  that cannot move: one a row or two below the header, in a column the fixture's
  own floating UI does not cover. And remember the sibling failure with the same
  symptom — a cell a portal element (a comment editor, a menu) is painted over
  cannot receive the pointer either, so `hover()` waits out the whole timeout on
  an element that is present and visible. Centralize the choice in one page-object
  method so the reasoning is stated once
  (`CommentsEditorResizePage.hoverCellWithoutComment()`).
- **A last dropdown option's unclipped centre is not a theme-stable hit-test.**
  Horizon's menu-item padding is 8px (main is 4px), so the same four-row
  multiselect list that fits on `main` is height-constrained by
  `updateDimensions` and the last `<li>` sits below the dropdown's
  `overflow: auto` fold. `getBoundingClientRect()` still reports that row;
  `elementFromPoint` at its centre hits the page (`HTML`) while the list is
  correctly placed and scrollable (DEV-1198). Hit-test a painted control
  (`MultiselectOpenLeftPage.firstOption()` / the search field), not the
  last row. The last-column open-left contract still fails without the
  product flip: the first option is ~350px wide, so its centre sits past
  the grid's `overflow: clip` when the list stays left-aligned with the
  last cell.

## The engine legs (Firefox, WebKit)

- The six projects above are Chromium. Tests tagged `@cross-browser` run on Firefox and WebKit as
  well: `{ tag: CROSS_BROWSER_TAG }` on the `test.describe` (`fixtures/test.ts`), picked up by the two
  projects of `playwright-engines.config.ts`, `e2e-firefox` and `e2e-webkit`, on the main theme and
  the plain UMD bundle. CI runs that config in one job, `E2E / Playwright engines (Firefox, WebKit)`.
  The visual suite's cross-browser leg photographs on the develop seed, master and release candidate
  pushes, the nightly, and pull requests that change the visual tier, so on any other pull request
  the job is the only Firefox and WebKit run of the grid. `e2e.yml` is shared, so the job also runs
  on every develop push and in the release candidate test runs: a red engine leg holds back that
  develop push's experimental publish, and blocks a release candidate.
- Tag a test whose behavior an engine could get wrong on its own: real key presses (the Tab order,
  undo and redo shortcuts), pointer gestures (header clicks, drags, the fill handle's double click),
  focus, and layout read back from the DOM. The specs that replaced the cross-browser visual
  captures' photographed states (DEV-3257) are tagged, and
  `.github/scripts/__tests__/playwright-engines.test.mjs` keeps them tagged and keeps the config
  filtering by the tag and inheriting the base config's CI flake settings and reporters.
- A separate config, so that `npx playwright test` without `--project` (all six legs) never needs the
  engines installed. To run a tagged spec on them locally, install them once for this package's
  Playwright and name the config:

  ```bash
  cd tests
  npx playwright install firefox webkit
  HOT_TEST_PORT=8131 npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts
  ```

  The local gates (pre-push, the Stop hook) run `e2e-main` only, so an engine failure first shows in
  CI unless you run it. Before calling a tagged test deterministic, repeat it on the engines as well
  as on the six legs (`--config playwright-engines.config.ts --repeat-each 20`). A pass on macOS
  does not prove a keyboard shortcut on the Linux runner: `ControlOrMeta` is Meta on macOS and
  Control in CI, and WebKit handles the two differently (the clipboard bullet below).
- **Firefox cannot start in the job's container without `HOME=/root`.** The container runs as root,
  and GitHub points `HOME` at `/github/home`, which belongs to the image's `pwuser`; Firefox refuses
  to run as root under a home it does not own, so every Firefox test fails at launch (36 of 36 on the
  job's first run). The run step sets `HOME: /root`, and the engines test pins it.
- **Linux WebKit copies, cuts and pastes nothing on a real shortcut.** Playwright's WebKit takes a
  shortcut's editing command from the macOS key map alone, so on the Linux runner a real Ctrl+C, X or
  V reaches the page as a key press and nothing more (all three clipboard tests failed there, on both
  attempts, while they pass on macOS WebKit). A test that uses one carries `CLIPBOARD_SHORTCUT_TAG`
  beside `CROSS_BROWSER_TAG`, and `e2e-webkit` leaves it out on every platform, so a local run and CI
  run the same tests. Reading the clipboard back needs `clipboard-read`: Playwright grants it on
  Chromium and WebKit and rejects it on Firefox (`Unknown permission`), and it rejects
  `clipboard-write` on Firefox and WebKit. So `clipboard-between-grids.spec.ts` asks for
  `clipboard-read` on Chromium alone (`test.use({ permissions: async({ browserName }, use) => … })`)
  and reads the clipboard back there; elsewhere the paste landing the copied value shows the copy.

## Fixture contract (never get these wrong)

- Fixtures are standalone HTML under `fixtures/demo/`, served statically. Every
  fixture MUST copy the fail-loud param block from `demo/grid.html`:
  `?theme=`/`?bundle=` map through fixed allowlists to LITERALS (no XSS); an
  absent param keeps the default (main / plain UMD), an unknown value THROWS —
  a config typo must be one red leg, never a silently mislabeled green one.
  Never hardcode a bundle `<script src=…>`.
- Thread `bundle` end-to-end: fixture allowlist → page-object constructor
  (`(page, theme = 'main', bundle = 'umd')`) → `goto()` query params → spec
  destructure. Miss one link and a leg silently tests the wrong build. The
  constructor default is what hides it: omit `bundle` in the spec's
  `test.beforeEach` and every leg loads plain UMD, so the `-min` legs go green
  without ever touching the minified bundle.
- **A fixture's own `ready` flag does not prove the bundle loaded.** The
  `document.write`-injected bundle script and the block that installs the
  fixture helper are separate, so a page can report `ready` while
  `Handsontable` is still undefined. The spec then fails inside its first
  `page.evaluate()` with a bare `Handsontable is not defined` — far from the
  cause, and only under load. Wait for the bundle itself in `goto()`, with
  `await awaitBundle(this.page)` from `fixtures/bundle.ts`, before asserting
  on any fixture status. The helper is the one place the wait is spelled out:
  `waitForFunction` rather than `expect` (`dist/handsontable.js` is ~6 MB
  uncompressed and every worker pulls its own copy, so a cold or busy server
  outlasts the 10s `expect` timeout, while `waitForFunction` polls against the
  test budget), with the interval in `BUNDLE_POLLING_MS` — see Determinism
  below for why the rAF default times out on a healthy page. Do not inline a
  copy: the lint catches a missing `{ polling }`, but only the helper keeps
  the value from drifting between page objects.
- The `umd` legs run the BASE bundle: **no HyperFormula** (a formulas fixture
  loads HF as an external script beside the bundle, or the plugin logs a
  warning and silently stays off) and **no languages pack** (an i18n fixture
  loads `dist/languages/all.js` explicitly — the Puppeteer harness does that
  for you, this tier does not).
- **On a cell with a dropdown arrow, a centred `cell.click()` can land on the
  arrow and open the editor by itself.** `autocompleteRenderer` registers a
  `mousedown` listener that opens the list whenever the press lands on
  `.htAutocompleteArrow`, so the editor is already open before your
  `keyboard.press('Enter')` — and that Enter then correctly commits and closes
  it. The spec fails at "the editor never opened" with nothing in the log to
  point at the cause. It is not only `autocomplete` and `dropdown`:
  `handsontableRenderer` and `dropdownRenderer` both delegate to
  `autocompleteRenderer`, so `type: 'handsontable'` carries the same arrow.
  `multiselect` carries one too, but a **different** element and listener —
  `.ht-multi-select-arrow`, built by `multiSelectRenderer` (#13316) — so a
  locator written against `.htAutocompleteArrow` finds nothing there, and vice
  versa. All four render their indicator on an empty cell, at the same icon size
  and margins, so none of them is the safe one to click centred.
  `multiselect` adds a SECOND hazard the other three do not have: its chip's `×`
  button suppresses selection through `beforeOnCellMouseDown`, so a centred press
  that lands on a chip's `×` selects **nothing** and any wait on
  `hot.getSelected()` times out with no editor and no selection to explain it.
  The indicator is also measured by `autoColumnSize`, so adding one moved an
  auto-sized column's midpoint by ~25px and slid it onto a chip's `×` — that is
  how `editor-hidden-cell.spec.ts` broke, having passed by 4px before (#13316).
  Whether the click lands on it is pure geometry, and **the outcome is
  theme-dependent** — the arrow is right-floated at `var(--ht-icon-size)`, which
  is 16 px on `main` and `horizon` but 12 px on `classic`, and the deciding term
  is the theme's cell padding, which leaves the arrow's left edge within about a
  pixel of the centre. Measured on `main`: at the 50 px default column width the
  arrow spans x=24–40 while the centre is x=25. So the same centred click can hit
  on one leg of the theme × bundle matrix and miss on another. An EMPTY cell is
  the common way to end up at that default width, which is why empty fixtures
  trip it and seeded ones usually do not — but a long header or narrow content
  puts the arrow back under the centre, so cell content is not a guarantee
  either. Click off-centre, or select with `hot.selectCell()`, when the spec
  means to open the editor with Enter. Root-caused in DEV-2677; the indicator's
  own coverage is `e2e/cell-dropdown-arrow-button.spec.ts`, over all four cell
  types.
- **Seed an `autocomplete` / `dropdown` fixture with a prefix the whole column's
  choice set shares** (`'Al'` for `Alpha/Alfa/Alto`), so `autocomplete`, which
  filters by the typed value, renders the same list as `dropdown`, which forces
  `filter: false`, and one assertion covers both. Reference:
  `fixtures/demo/autocomplete-async-source.html`.
- A fixture-served library MUST be a dependency of THIS package, loaded from
  `/tests/node_modules/…` — CI installs only the filtered `handsontable-tests`
  workspace, so a path into any other package's `node_modules` does not exist
  there (and the static server refuses it locally too, for CI parity). **Pin
  the exact version the owning package's lockfile carries** — an identical
  RANGE is not enough (both packages declared `^3.0.0` and still locked 3.3.0
  vs 3.4.0, because pnpm resolves each importer at its own time). One
  `hyperformula` entry in `pnpm-lock.yaml` is the invariant; two entries mean
  the `umd` legs test a different engine than the one baked into `full.min`.
  Moving the version into the pnpm catalog is the durable upgrade when the
  core package can take that change.
- The green-run cache (`scripts/e2e-run-cache.mjs`) hashes BOTH bundles, the
  fixture-served HyperFormula artifact + `tests/package.json`, and every file
  under `fixtures/`; rebuilding a bundle or reinstalling the engine re-runs
  affected specs. Do not narrow that hash.
- **A cross-realm fixture builds the grid INSIDE an iframe from the PARENT's
  `Handsontable`** (`demo/iframe-width-window-scroll.html`). It is the only
  fixture that crosses a realm, and it exists because nothing else does: every
  other fixture passes a node built by the same constructor the engine was
  compiled against, so a realm-bound `instanceof` in the engine stays green on
  all of them. Three things follow. The bundle still loads in the PARENT — the
  fixture is testing that the parent's constructor drives another document's
  nodes, so loading it inside the iframe would test nothing. The stylesheets go
  into the IFRAME, after `doc.open()`/`doc.close()` (which replaces the
  document), and the grid waits for their `load` events — a link that has not
  applied yet sizes every row and column from an unthemed table. And the page
  object reads state through the parent (`window.frameDoc`, `window.hot`),
  not through a Playwright `frameLocator`, because the state under test is the
  engine's — which element it thinks owns an axis — not the rendered
  document's. One more: **assert which ROWS render, not only which columns.**
  The fixture's master rendered rows 186–199 at page top for two rounds of
  review, because every assertion read columns and the top clone's rows, and
  nothing asked the master where its band was. Reference:
  `e2e/iframe-cross-realm-scroll.spec.ts` (`masterRowBand()`).

## Two clicks on the same cell are a double click

`locator.click()` twice at the same point, with only `page.evaluate` calls in between, lands inside the
browser's double-click interval and the grid opens the editor. The failure surfaces far away: the shortcut
manager is on the `editor` context, so the `Ctrl`+`A` that follows selects nothing, and the test dies
several steps later on a context-menu item that is missing because the selection is wrong. Nothing in the
message mentions an editor.

A page-object helper that starts with a click therefore takes the cell as a parameter
(`EmptyDataStateShortcutsPage.selectAllWithKeyboard(row, col)`), so a test that calls it twice aims at a
different cell the second time. Selecting through `hot.selectCell()` avoids it entirely where the spec does
not need a real press.

## Touch and mobile specs

- Page objects for mobile specs live in `fixtures/pages/mobile/` (as walkontable's do in
  `fixtures/pages/walkontable/`). A mobile spec must declare
  `test.use({ ...devices['iPhone 13'], browserName: 'chromium' })`: Handsontable decides
  whether to create the mobile selection handles from `isMobileOrIpadOS()` at grid
  construction time, so without the emulation the handles never exist and the spec fails for
  the wrong reason. Assert the handle is visible before touching it.
- iPhone emulation does **not** catch iPadOS 13+ (desktop Macintosh UA + `MacIntel` +
  `maxTouchPoints > 2`). For that path, use Desktop Chrome, `hasTouch: true`, a Macintosh
  Safari `userAgent`, and `addInitScript` that sets `navigator.platform = 'MacIntel'` and
  `navigator.maxTouchPoints = 5` **before** the grid script loads (`setPlatformMeta` /
  `setBrowserMeta` run at module load). Playwright Chromium on Linux reports `Linux x86_64`,
  so a UA override alone is not enough. Reference: `e2e/ipad-selection-handles.spec.ts`.
- `page.touchscreen` only **taps** — it has no drag. A touch drag needs CDP
  (`page.context().newCDPSession(page)` → `Input.dispatchTouchEvent`), which is also why those
  specs pin `browserName: 'chromium'`. Nothing else here emits trusted `touchmove`.
- Auto-scroll assertions must check **progress while the pointer rests**, never that one offset
  is non-zero: extending a selection onto a partially visible row or column scrolls it into view
  on its own, so `scrollTop > 0` passes with the auto-scroller dead. The scroll timer
  reschedules itself, so one `touchmove` past the edge starts it — poll for a further increase
  instead of holding for a fixed time (`waitForTimeout` is banned, see below).
- Dual-listener devices (iPad with a desktop UA, Windows touchscreens) are emulated with
  `test.use({ ...devices['Desktop Chrome'], hasTouch: true, browserName: 'chromium' })` — desktop
  UA keeps `isMobileBrowser()` false while `hasTouch` makes Walkontable register touch AND mouse
  listeners, and Chromium synthesizes the same mousedown/mouseup/click after `locator.tap()` that
  iPad Safari does. Drive the pairing timers with `page.clock`. Reference:
  `e2e/touch-tap-to-edit.spec.ts` (page object in `fixtures/pages/`, not `fixtures/pages/mobile/`,
  because the fixture is not a mobile-UA grid).

## Real-mouse gestures

- `boundingBox()` ignores overflow clipping, and `toBeVisible()` passes for a fully clipped
  element. Never aim a real-mouse press or drag at box-derived coordinates without first
  wheel-scrolling the target into the holder's PRESSABLE area (the holder minus the sticky
  header clones painted over its top/start strips), the way a user reaches off-screen content.
  A point past the fold silently presses the page body or a header clone, and mid-drag it means
  "extend the selection past the edge" — drag-to-scroll fires and the selection overshoots the
  intended range. This class of spec ships green by luck and breaks on a 1px browser row-metric
  shift (the Playwright 1.62 bump broke exactly one theme this way). Pattern: `FormulasGridPage`.
- After a drag-select, assert the achieved range (`getSelectedRangeLast()` via `page.evaluate`).
  Wheel by the EXACT remaining distance — a fixed step turns the poll budget into a hidden reach
  cap, and a fixed minimum over-corrects few-px overflows and ping-pongs when nearby targets need
  opposite nudges. Bound waits on the timer-driven auto-scroll by TIME (`expect.poll`), never by
  a fixed number of pumped mousemoves — an iteration count is a hidden wall-clock budget that
  shrinks with every Playwright/CDP speedup. Size the poll budgets so goto + gestures + every
  poll fit the 20s test timeout, or an exhausted wait surfaces as a locationless "Test timeout"
  instead of its message.
- A click on the grid's far corner pins the scrollbar clearance band (#10370) open. The pointer then
  rests within 26 px of both scrollbars, which keeps their bands up by design
  (`OVERLAY_SCROLLBAR_PROXIMITY`), so the next scroll's wait for the band to close times out. Park the
  pointer off the grid before scrolling (`GridLayoutsPage.scrollViewportTo()`), and wait for the band to
  close before a click near an edge, or the scrollbar takes the click.
- A press on a sortable column header's label (`.colHeader`), or on its sort indicator, sorts as well
  as selects; a press elsewhere on the header only selects. A click on the middle of a header usually
  lands on the label, which is how a test that meant only to select a column also sorts it – aim at the
  label, or away from it, on purpose. On a paginated grid the column a header click selects is the
  current page's rows only (Pagination clamps the range in `beforeSelectColumns` and
  `beforeSetRangeEnd`), so a Delete after it empties that page and no other.
  `pagination-filter-sort.spec.ts` asserts both.

## Reading grid UI state

- A closed editor stays in the DOM (`ht_editor_hidden`), and Playwright reports its textarea as
  visible, so `toBeHidden()` after an Enter that committed the edit fails. Read the editor's own state,
  `getActiveEditor().isOpened()` (`GridLayoutsPage.editorOpened()`).
- Each grid on a page keeps its own context menu container, so a locator for "the" menu matches one per
  grid; and a toggle entry such as "Read only" has the role `menuitemcheckbox`, not `menuitem`
  (`TwoGridsPage.makeColumnReadOnly()`).

## Rendering away from 100% (zoom / display scaling)

Reach for **CSS `zoom` on the root element**, applied by the fixture before the grid is
constructed (`fixtures/demo/row-height-device-scale.html`). Chrome routes it through the same
effective-zoom machinery as browser page zoom, so a cell's 1px border is inflated exactly as it
is under Ctrl+minus or Windows display scaling — `getComputedStyle` reads `1.111px` at 0.9
either way. Assert that inflation as the test's own precondition; without it every geometry
assertion passes on unfixed code. Above 100% the snapping goes the other way: at 1.25 the same
1px border is computed as 0.8px (1.25 device pixels snapped down to one, measured on every
theme in `overlay-alignment-css-zoom.spec.ts`), so the precondition there is a value away from
1, not above it. `getBoundingClientRect()` is scaled by CSS zoom and `offsetWidth` is not, so
their ratio is the zoom the grid really got — a stronger precondition than reading the style
attribute back. A grid does not redraw when the page zoom changes after construction
(`afterViewRender` count unchanged), so a zoom applied late is the browser re-laying out the
sizes the grid wrote at 100%, and a fixture that wants the grid to MEASURE zoomed cells applies
the zoom before constructing it.

The two things that do **not** work: Playwright's context-level `deviceScaleFactor` reports the
ratio faithfully but never inflates the border, so a test built on it is vacuous; and
`--force-device-scale-factor` needs `viewport: null`, which every project's
`devices['Desktop Chrome']` forbids by pinning `deviceScaleFactor` (`deviceScaleFactor:
undefined` in `test.use` does not clear it, and `launchOptions` is rejected inside a
`describe` — it forces its own worker).

## Observing `unlisten()`

`hot.isListening()` read at the END of a gesture cannot see an `unlisten()` that
happened inside it. The focus scope manager re-listens on the `click` that follows
the `mouseup` whenever the press landed inside the grid or its portal, so the state
heals before the assertion runs, and a spec built on it goes green against a real
defect (that is one of the two reasons DEV-2787 escaped this tier; the other is
that no case asserted the listening state at all). Count `afterUnlisten` calls
over the named gesture instead — `EditorPreventCloseElementPage.startUnlistenCounter()` is
the pattern. Two gestures do NOT heal and are the ones to reach for when the spec
needs a user-visible symptom rather than a counter: a RIGHT click (it ends in
`contextmenu`, no `click`), and a press whose focus target sits outside the grid's
portal (nothing re-listens, and there the scope manager unlistens by design — so a
counter cannot tell the two mechanisms apart, and an `isListening()` assertion
there pins the scope manager, not the mouseup verdict).

## The server port

The webServer binds `8123` and has `reuseExistingServer` on outside CI, so a second
checkout — a worktree beside the main clone — silently attaches to the **first
one's server and build** and reports results describing the wrong code. Set
`HOT_TEST_PORT` to a free port to run two at once; the config passes it to
`support/static-server.mjs`, so the two never disagree. Before believing a strange
result, check who owns the port with `lsof -i :8123`. Background in
`.ai/WORKTREES.md`.

## Determinism

Ships at `error` in `.eslintrc.cjs`: no `waitForTimeout`, `sleep`,
`setTimeout` (the global timer only — bare, `window.setTimeout`, or
`globalThis.setTimeout` — and inside `page.evaluate` too, which is where a
banned `waitForTimeout` usually reappears; `test.setTimeout(ms)` and
`testInfo.setTimeout(ms)` set a budget, not a wait, and stay legal),
`networkidle`, `.only`, `.skip`, or bare `test.fixme` in specs **and page
objects** — the lint script covers `e2e` and `fixtures`, so a timer moved into
the page object a spec drives is the same fixed wait and is caught there — and
no `waitForFunction()` without an explicit `{ polling }`: the rAF default is
starved under parallel-worker load and times out on a healthy page, so the
call site states the interval (an options literal, also when wrapped in a
type assertion, is judged; a plain options variable is not). Wait on web-first assertions;
`expect.poll` for data probes. `test.fixme` is the tracked exception for a real
product bug: it requires an eslint-disable line naming the task
(`// eslint-disable-next-line no-restricted-syntax -- DEV-1234: <why>`), which
keeps every parked test counted and attributable. A `setTimeout` that is a
**scheduling barrier** rather than a duration (a chain of 0ms macrotasks that
lets a negative assertion prove "nothing else fired" — `expect.poll` cannot
prove a negative) takes the same disable line, naming the owning work and
carrying a TODO for the probe that will replace it; `e2e/customBorders.spec.ts`
`macrotaskBarrier()` is the one such site. Full rules: the
`handsontable-playwright-e2e` skill and its `references/determinism.md`.

The waits lint cannot see live beyond the spec's own text — a timer in a
fixture's inline script, a string-form `evaluate`, and the state a page-object
wait ends on. Six rules, one line each; the measured incident behind each one
is in
`references/determinism.md`:

- A `setTimeout` in the browser is `sleep()` moved into the page: probe the
  state and `expect.poll` it from the spec.
- `page.waitForFunction()` passes `{ polling: <ms> }`; a page object takes it
  from `awaitBundle()` (`fixtures/bundle.ts`), the one place the interval lives.
- A method that scrolls or mutates the grid ends on a render-state probe (first
  rendered row, draw counter), never on `scrollTop`/`scrollLeft`.
- A trigger that can deliver more than once is asserted on the LATEST entry of
  its kind, inside one `expect.poll`.
- A fixture build fails loud: the fixture captures the constructor throw, and
  `goto()` rethrows it.
- A negative assertion ("nothing fired") uses a bounded settle ONLY beside a
  positive control in the same test.

**A geometry read is two round trips, and the grid recycles its rows.**
`locator.boundingBox()` and `locator.evaluate()` resolve the node in one round
trip and act on it in another (`innerText()` and `getAttribute()` do both in one
injected call and are safe), and Walkontable reuses the same `<tr>`/`<td>` nodes
across a re-render. A node resolved as row 4 before a
scroll-driven draw is row 0 after it, so the read reports a normal row's height
for the tall one — `frozen-column-row-heights.spec.ts` failed 3 of 150 runs
under load with `Expected: 69, Received: 30` while the DOM was consistent at
every task boundary (traced in DEV-2827, after the flake had first been blamed
on the engine). Query and measure inside ONE `evaluate` on a node that is never
recycled (the table's root, the grid), read every value a comparison needs in
that same evaluation (`FrozenTallCellPage.rowHeights()`), and poll a pinned
expected value rather than comparing two reads with each other — two reads
that both landed before the draw agree with each other and prove nothing.

**Where a flake goes.** In CI the config adds a `json` reporter
(`test-results/report.json`, shipped inside the `playwright-report-*` failure
artifact), and `.github/workflows/test-health.yml` collects every `flaky` or
`unexpected` test of a red run into the cross-run ledger at
<https://handsontable.github.io/handsontable/test-health/>: per test, 7- and
30-day counts, distinct runs, legs, and a "needs ticket" flag at 2+ distinct
runs in 30 days — the playbook's line for a fix or migration ticket. A `flaky`
outcome (failed, then passed on retry) reaches the ledger only because
`failOnFlakyTests` fails the leg; keep `retries` at 1 in CI for that to hold.
`.github/scripts/__tests__/playwright-flake-settings.test.mjs` pins all three
settings (`failOnFlakyTests`, `retries`, and `forbidOnly`) as text in the root
`test:tooling` gate, and fails with this reason if one moves. The report path
is pinned by `.github/scripts/lib/test-health.mjs` and asserted in
`.github/scripts/__tests__/test-health.test.mjs`, so moving it means changing
all three places.

## Quarantine

`failOnFlakyTests` stays on: a test that passes only on retry fails the leg, and
fixing the flake is the answer. Quarantine is the narrow, expiring, capped
exception for a *known* flake that would otherwise redden every unrelated pull
request until the fix lands. The mechanism below is this tier's only. The visual
suite parks a flaky capture with the same limits (owner, 30-day expiry, cap of
six) through `visual-tests/visual-quarantine.json`, whose checks import
`lib/quarantine-policy.mjs`; its rules are `visual-tests/AGENTS.md`, Guardrails
(G5). The frozen Jasmine suite has no quarantine: a flaky legacy spec migrates
here instead.

- **Tag through the helper, never by hand.**
  `test('title', quarantined('DEV-1234', '2026-10-08', 'why'), async() => …)`
  (`fixtures/quarantine.ts`). The helper writes the `@quarantine` tag and a
  `quarantine` annotation carrying the owning task id, the expiry and the
  reason. A bare `'@quarantine'` literal is a lint error, and an annotation the
  reporter cannot read fails the run: no task id, no quarantine.
- **Locally too, not just "the leg".** The reporter runs in every configuration, and its
  downgrade only fires when a live quarantine covers the flake. So `npx playwright test` locally
  (where `failOnFlakyTests` is off) now exits 1 on an *un*quarantined flaky test that Playwright
  itself would have passed — the same verdict CI reaches. Quarantine or fix the flake; do not
  reach for `.skip`. The expiry horizon is re-checked at run time as well as at load, so a
  hand-written annotation with a far-future date does not buy an unbounded downgrade.
- **A quarantined test still runs and still reports.** Only its *flaky* verdict
  is downgraded from "fail the leg" to "report": the reporter
  (`reporters/quarantine.ts`, last in the reporter list) prints it, writes a
  `::warning` on the checks tab, and sets the step output `quarantined-flaky`
  so `e2e.yml` still uploads the report and the ledger records the test. A test
  that fails outright is not covered — quarantine is for flakes, not for
  failures. Never `.skip` a flake.
- **Expiry: at most 30 days out**, checked when the spec loads. Past the date
  the flaky verdict fails the leg again, and the tag on a passing test raises a
  warning asking to be removed.
- **Cap: 6 quarantined tests at once**, counted as distinct tests (one test
  across six projects is one). The entry after the cap fails the run even when
  every test passes; fix one before parking another.
- **Visible.** The ledger at <https://handsontable.github.io/handsontable/test-health/>
  shows quarantined tests with their entry, so nothing is parked silently.

The decision logic is pure (`lib/quarantine-policy.mjs`, tested in
`lib/__tests__/` through the root `test:tooling`); `e2e/quarantine-policy.spec.ts`
proves the exit codes end to end by running synthetic projects in a child
process (no browser). `QUARANTINE_CAP` and `QUARANTINE_MAX_DAYS` live in the
policy module; change them there, in this section, in the G5 bullet of
`visual-tests/AGENTS.md`, and in `visual-tests/visual-quarantine.json`'s
`$comment` together. The visual quarantine imports them, and
`visual-tests/lib/__tests__/visual-quarantine.test.mjs` pins 6 and 30, so it
fails until you do.

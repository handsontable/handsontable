# AGENTS.md — Playwright functional E2E tier (`tests/`)

Functional, real-browser E2E for the whole monorepo lives here (`e2e/*.spec.ts`).
Visual regression is a separate package (`visual-tests/`). Task workflow: the
`handsontable-playwright-e2e` skill. Setup and commands: [`README.md`](./README.md).

## The matrix — six projects, two axes

- `theme` (main / horizon / classic) × `bundle` (`umd` = `dist/handsontable.js`,
  `full-min` = `dist/handsontable.full.min.js`) → projects `e2e-<theme>` and
  `e2e-<theme>-min` — the shape the Puppeteer legs have on the full-matrix runs
  (`test:e2e` / `test:production`; a pull request runs that suite on UMD × main alone).
- A spec runs on `e2e-main` only unless its top-level blocks declare the
  axes it is sensitive to (`THEMES_TAG`, `BUNDLES_TAG`; "Declaring the legs"
  below). Author against `fixtures/test.ts` (`import { test, expect } from
  '../fixtures/test'`), destructure `{ page, theme, bundle }`, and pass both
  to the page object: a spec is parametrized by the project that runs it,
  and the tags say which projects do.
- **A test of a motion the classic theme never runs carries `MOTION_TAG`**
  (`fixtures/test.ts`) beside `THEMES_TAG`, and the `e2e-classic` projects leave
  it out, on the full matrix too (`legGrep()` in `lib/leg-declarations.mjs`). `.skip` is banned, and
  remapping the classic legs to another theme only repeats that theme's runs.
  Prove the classic theme's instant behavior in a `THEMES_TAG` test without
  `MOTION_TAG`.
- **`page.clock` does not drive CSS transitions or animations: they run on real
  time.** A transition read a few round trips after it started can be over on a
  slow run, and a finished transition is gone from `getAnimations()`. Pause it
  the moment it starts (a `MutationObserver` whose callback calls
  `getAnimations()` and pauses, as `SheetsBarPage.holdTransitions()` does), then
  seek it. A CSS animation with `fill-mode: both` stays listed after it ends.
- **Local gates run `e2e-main` (plain UMD) only** — pre-push, the Claude Stop
  hook, and `npm run test:e2e` are pinned there; the `-min` legs are CI-only.
  (`e2e-main` used to load `full.min` — never assume the hooks cover min.)
- **In CI a long leg runs in shards, and a shard is a job, not a leg.** `e2e.yml`
  lists every leg and shard as one explicit matrix row (`main` in 3, `horizon`
  and `classic` in 2, the `-min` legs and the engines job whole), each shard
  running the same project with `--shard=<i>/<n>`; `fullyParallel` is on, so
  Playwright deals the tests out one by one, and a serial `describe` stays
  together. The config pins the CI worker count (`workers`, 4 on the 4-vCPU
  runner), which is what the shard counts were derived at; a local run keeps
  Playwright's default, and the engines config pins its own 2 (the measurement
  was Chromium's). Four things follow. A shard's artifacts carry `-s<i>`
  (`playwright-report-main-s2`, `playwright-durations-main-s2`), and the
  test-health collector folds a leg's durations parts back into one leg record
  (wall-clock = the longest shard; a push with a part missing is left out of the
  budget), while the flake ledger's `leg` stays the project the test ran on. The
  quarantine reporter decides each shard's exit status on the tests it saw: the
  cap of six is counted per shard, so `lib/__tests__/quarantine-policy.test.mjs`
  counts the tree's quarantined tests against the cap too (one test at a time,
  never a describe), and the `quarantined-flaky` output is the shard's. "Re-run
  failed jobs" re-runs the red shard alone; the collector records the leg at the
  latest attempt from that shard's new part and the others' first-attempt parts.
  And a shard that lands on no test is NOT Playwright's own red: it skips "No
  tests found" whenever `--shard` is set, so the quarantine reporter fails a run
  that saw no test; the flag that would turn an empty leg green stays banned.
  Changing a shard count or the worker count is a measured change:
  `.github/scripts/__tests__/e2e-legs.test.mjs` pins both, `DURATIONS_LEGS` in
  `.github/scripts/lib/playwright-durations.mjs` must follow the matrix (its
  test derives the table from the rows), and the budget on the durations page
  starts over, since it counts only the records of a leg's latest shape.
- `handsontable.full.js` and `handsontable.min.js` are deliberately untested
  here, and on the E2E nightly.
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
  pins the side goes green locally and reds one CI leg, with a message full of
  coordinates that says nothing about the cause — a Playwright spec on the leg
  its `THEMES_TAG` declares, on the pull request; a legacy spec on the E2E
  nightly or the rc path, since pull requests run that suite on `main` alone.
  That is how `E2E / UMD (theme: horizon)` went red on #13417 while the other
  two themes passed, when the six legs still ran on every pull request. Assert
  **adjacency** instead: the popup touches the cell on one side
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

## Declaring the legs

A spec runs on `e2e-main` (the main theme, plain UMD) only, unless its top-level blocks say
otherwise. Most specs assert DOM or API facts that cannot differ by theme or bundle, so the six
legs used to run the same tests six times for one answer. A spec declares the axes it is
sensitive to with a tag on EVERY top-level `test.describe()` and every bare top-level `test()`:

```ts
import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';

test.describe('the editor follows its cell', { tag: THEMES_TAG }, () => { … }); // + e2e-horizon, e2e-classic
test.describe('formulas move with cells', { tag: BUNDLES_TAG }, () => { … }); // + e2e-main-min
test.describe(`drag (${direction})`, { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => { … }); // all six
test('fills its container', { tag: THEMES_TAG }, async({ page, theme, bundle }) => { … });
```

- **Every top-level block of a file carries the same leg tags.** A spec is declared as a whole:
  its page objects and fixtures are scanned as a whole, and a tag on one describe of three would
  run the other two on one leg while the file claims otherwise. A leg tag on a nested block is an
  error. A top-level `test(title, quarantined(…), body)` cannot carry a leg tag (the helper
  returns the details object), so it is the no-tag shape: fine in a file that declares nothing,
  and in a file that declares an axis it goes inside a describe that carries the file's tags.
- **Only the constants, never the strings.** `{ tag: '@themes' }` is one typo from a spec that
  silently runs on one leg: Playwright accepts any string as a tag, and `{ tag: undefined }` from
  a misspelled or missing import too. `.eslintrc.cjs` bans the bare string and its template twin,
  and the sweep below refuses an identifier it cannot resolve. `@core`, `@walkontable`,
  `CROSS_BROWSER_TAG` and `CLIPBOARD_SHORTCUT_TAG` stay free-form and sit in the same array, on
  one line (the engines pin reads that line).
- **What needs `THEMES_TAG`:** anything the theme stylesheet decides – a computed style, a design
  token (`--ht-*`), a branch on the theme (a comparison on either side, a lookup keyed by it, a
  `switch`, a membership test, a string test such as `htTheme.startsWith(…)`, on `theme` or
  `this.theme`), the theme class, a hit test (`elementFromPoint`, `elementsFromPoint` and the caret
  ones: what sits under a point depends on paddings and sizes), a pixel assertion (`boundingBox()`,
  `getBoundingClientRect()`, `offsetWidth`, `toHaveCSS()` compared to a value) wherever the read
  sits – in the spec, in a page-object helper whose result the spec compares to a literal, or in an
  `expect()` inside the page object – a pointer aimed a fixed number of pixels from a box edge
  (`box.x + box.width - 4`: whether that lands past a label is the theme's padding), and every trap
  the matrix section above describes (band edges, which side a popup opens on, a short fixed-height
  fixture). **What needs `BUNDLES_TAG`:** HyperFormula and the Formulas plugin
  (the plain UMD loads the engine as an external script, `full.min` bakes it in), a branch on the
  bundle (a fixture that picks a file by the bundle's name, `htBundle.indexOf('.min.')`, is one),
  and the load surface the minified full bundle changes (an AMD loader, Trusted Types, a
  shadow root, an iframe, DOMPurify, the license bar). Both bundles build from the same
  `src/index.ts`: `full.min` adds the HyperFormula global, minification and the vendored
  `regexp-to-ast` wrapper, and neither ships numbro, moment, pikaday or a language pack. A page
  object's argument check that compares to the bundle names (`bundle !== 'umd'`) reads as a branch
  to the sweep, which cannot tell a throw-only guard from a behavior branch: such a check lives in
  `fixtures/bundle.ts` (`assertKnownBundle()`), one of the three files the sweep does not read.
- **The sweep enforces the explicit markers.** `lib/__tests__/leg-declarations.test.mjs` (root
  `test:tooling`; pre-push runs it when a spec, a page object, a fixture or the lib changed) reads
  every spec, the page objects it imports transitively, and the fixture HTML those name, and fails
  a spec that hits a marker without the tag: `theme-compare`, `computed-style`, `css-token`,
  `theme-class` (spec and page objects only; a fixture's own param block builds the class),
  `hit-test`, `geometry` (spec text only, or one base page object's `boundingBox()` helper would
  force the axis on everything that imports it), `pointer-offset`, `geometry-helper`, `formulas`,
  `hyperformula`, `bundle-compare`. The two geometry markers that read page objects are narrow on
  purpose: a page object that measures forces nothing until a spec, or the page object itself, decides
  an outcome with what it measured. `pointer-offset` is a coordinate of a `mouse.click()`,
  `dblclick()`, `move()`, `touchscreen.tap()` or an `{ x, y }` point that adds or subtracts a whole
  number of pixels to a box edge or size, written in place or kept in a variable first. The offset has
  to sit beside the box term: a fraction of the box (`box.width / 2`) scales with the box, and
  arithmetic inside an index or a call's arguments (`cells[i + 1].x`) moves no edge. A locator
  action's `position`, `sourcePosition` or `targetPosition` is measured from the element's corner
  already, so a non-zero number there is an offset by itself (`click({ position: { x: 5, y: 5 } })`).
  `geometry-helper` is a page-object function that reads a box or a size, directly or through another
  such function, and is not declared to return only strings, locators or nothing; a getter and an
  arrow function kept in a class field count as methods. It hits where an `expect()` compares its
  result to a literal: a number, a `SCREAMING_CASE` constant, a boolean, or an array or object holding
  a number (`toMatchObject()` included). `toBeTruthy()` and `toBeFalsy()` count on a helper declared to
  return a boolean only; on a box they say no more than that the element exists. The result counts as
  a whole: every property of it, a count returned beside a size included, so a spec that compares
  only such a count says so with an ignore. A variable carries the result through arithmetic and
  `Math.*()`, never through another call's arguments. A call resolves the way the code does:
  `this.x()` in its own class or one it extends, a receiver the spec types (`new GridPage(…)`,
  `grid: GridPage`) in that class, a bare call or a namespace import to a module function. Any other
  receiver counts only when every function of that name reads geometry, so a generic name such as
  `cell()` decides nothing on a guess. A function nested inside another is part of that one's body,
  never a helper of its own. `toBeGreaterThan(0)` (the box is laid out), a subject ending in
  `.length` and a comparison between two reads are not hits. A band-edge index (the matrix trap) is
  no marker: whether row 6 is on screen depends on the fixture's height and the theme's row
  heights, which the text does not say. A spec that hits that trap joins `THEMES_CANARIES` in the
  sweep test, which keeps it declared. A
  marker that does not mean sensitivity here is opted out in the SPEC file, never in a shared page
  object: `// leg-declarations: ignore <marker-id> -- <why>`, with ten or more characters of why; a
  stale, redundant or misnamed ignore fails the sweep. `e2e/color-scheme-density.spec.ts` is the
  example: its fixture pins `ht-theme-main` on every leg and the engine builds its CSS at runtime,
  so `BUNDLES_TAG` alone and `ignore computed-style`. Declaring an axis anyway is always legal, and
  a spec the markers miss but the matrix traps describe declares it all the same.
  `e2e/leg-declarations.spec.ts` (no browser) proves on every pull request that the projects
  Playwright lists for each test are the ones its tags say, and that the tags Playwright sees are
  the ones written in the source.
- **The nightly is the safety net, and a nightly-only red means an undeclared axis.** `E2E nightly`
  (`.github/workflows/e2e-nightly.yml`, weeknights on develop; the rc/stable publish path and a
  master push do the same) runs every spec on all six legs with `HOT_E2E_FULL_MATRIX=1`. A test red
  there and green on pull requests runs on a leg its spec did not declare: declare the axis, never
  quarantine it. (The same run expands the frozen Jasmine suite to its six legs, through e2e.yml's
  `jasmine-full-matrix`; a pull request runs that suite on `UMD (theme: main)` alone, so its
  nightly-only red is a theme- or bundle-only failure, never an axis to declare: `fails alone` in
  its record is fixed or migrated before the next RC cut, `passes alone` is a migration ticket –
  handsontable/.ai/TESTING.md, "The Jasmine suite is frozen".) The flake ledger records the
  nightly's tests with `branch: develop`, and
  `node scripts/leg-replay.mjs --list test-results/list.json` (after
  `npx playwright test --list --reporter=json > test-results/list.json`) replays the ledger against
  the declared tree, names the declaration every off-main red asks for, and exits 1 on a miss.
- **Locally:** `npx playwright test` runs the declared shape;
  `HOT_E2E_FULL_MATRIX=1 npx playwright test e2e/<spec>.spec.ts` runs one spec on all six legs;
  `--project=e2e-horizon` on an undeclared spec says "No tests found", by design – there is no
  `--pass-with-no-tests` anywhere, so an empty leg is a red job, never a green one that ran
  nothing (an empty shard of a sharded leg, which Playwright would pass, is failed by the
  quarantine reporter), and the sweep keeps every declaration shape in use so no leg is ever empty. The engine
  legs ignore the declarations: every `@cross-browser` spec runs on Firefox and WebKit whatever its
  leg tags say.

## The engine legs (Firefox, WebKit)

- The six projects above are Chromium. Tests tagged `@cross-browser` run on Firefox and WebKit as
  well: `{ tag: CROSS_BROWSER_TAG }` on the `test.describe` (`fixtures/test.ts`), picked up by the two
  projects of `playwright-engines.config.ts`, `e2e-firefox` and `e2e-webkit`, on the main theme and
  the plain UMD bundle. CI runs that config in one job, `E2E / Playwright engines (Firefox, WebKit)`,
  at 2 workers (the config pins it; the Chromium legs' 4 were measured on Chromium, and a contention
  flake here would hold back Visual and the publish paths).
  The visual suite's cross-browser leg photographs on the develop seed, master and release candidate
  pushes, the nightly, and pull requests that change the visual tier, so on any other pull request
  the job is the only Firefox and WebKit run of the grid. On a pull request a red engine leg also
  holds back the whole Visual stage, which needs `e2e` and runs only when nothing failed. `e2e.yml` is
  shared, so the job also runs on every develop push and in the release candidate test runs: a red
  engine leg holds back that develop push's experimental publish, and blocks a release candidate.
- Tag a test whose behavior an engine could get wrong on its own: real key presses (the Tab order,
  undo and redo shortcuts), pointer gestures (header clicks, drags, the fill handle's double click),
  focus, and layout read back from the DOM. The specs that replaced the cross-browser visual
  captures' photographed states (DEV-3257) are tagged, and
  `.github/scripts/__tests__/playwright-engines.test.mjs` keeps them tagged and keeps the config
  filtering by the tag and inheriting the base config's CI flake settings and reporters.
- A separate config, so that `npx playwright test` without `--project` (the six legs, as declared)
  never needs the engines installed. To run a tagged spec on them locally, install them once for this package's
  Playwright and name the config:

  ```bash
  cd tests
  npx playwright install firefox webkit
  HOT_TEST_PORT=8131 npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts
  ```

  The local gates (pre-push, the Stop hook) run `e2e-main` only, so an engine failure first shows in
  CI unless you run it. Before calling a tagged test deterministic, repeat it on the engines as well
  as on the six legs (`--config playwright-engines.config.ts --repeat-each 20`, and
  `HOT_E2E_FULL_MATRIX=1` for the six, since a spec runs only the legs it declares otherwise). A pass on macOS
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
- **The clipboard outlives a test.** Each test gets a fresh context, not a fresh clipboard, so a copy
  that writes nothing still pastes whatever an earlier test, or an earlier repeat of the same test,
  left there. Copy a value no earlier run copied: both clipboard specs write a run-unique value into
  the source cells first (`randomUUID()`), which proves the copy on every engine, read-back or not.
- **A native undo or redo in a text field has the clipboard's trap, and the native date input has its
  own.** Ctrl+Z and Ctrl+Shift+Z inside the open text editor are the textarea's own undo, which Linux
  WebKit never runs on a real shortcut, so `text-editor-native-undo.spec.ts` carries
  `CLIPBOARD_SHORTCUT_TAG` beside `CROSS_BROWSER_TAG`: Firefox runs it and WebKit does not. The date
  editor's picker takes the keys while it is shown, and Escape closes the picker and leaves the editor
  open in Chromium but closes the editor in Firefox and WebKit, so `date-editor-native-input.spec.ts`
  carries no engine tag and runs on the Chromium legs its leg tags declare only.
- **Tab past a page's last focusable element leaves the document in Chromium and WebKit, and goes nowhere
  in headless Firefox.** There `document.hasFocus()` turns false; headless Firefox has no browser UI to
  move the focus to, so it stays on the cell. Assert what the grid draws after the exit (no selection, no
  highlighted cell or header), which every engine agrees on, rather than where the focus went
  (`shared-demo-keyboard-navigation.spec.ts`).

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
  without ever touching the minified bundle. The option is typed `Bundle`
  (`fixtures/bundle.ts`); where another positional argument follows `bundle`,
  type the parameter with it too, so a value in the wrong slot is a type error
  rather than a bad `?bundle=` (`NumericGridPage`).
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
  the value from drifting between page objects. The helper also rethrows the
  fixture's own `Unknown ?theme=`/`?bundle= value` error before it waits: that
  throw happens in `<head>`, before the bundle script is written, so without
  it a bad value ends as a bare 20s timeout in the wait.
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
  own coverage is `e2e/cell-dropdown-arrow-button.spec.ts`, over the two
  renderers that draw it (`autocomplete`, which `dropdown` and `handsontable`
  delegate to, and `multiselect`).
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
  vs 3.4.0, because pnpm resolves each importer at its own time). The
  invariant is that the `handsontable` and `tests` importers in
  `pnpm-lock.yaml` resolve the same `hyperformula`, and `tests/package.json`
  pins it exactly; otherwise the `umd` legs test a different engine than the
  one baked into `full.min`. Other importers do not count (`docs` resolves its
  own). `lib/__tests__/hyperformula-pin.test.mjs` asserts it in the root
  `test:tooling` gate on every pull request. Moving the version into the pnpm
  catalog is the durable upgrade when the core package can take that change.
- The green-run cache (`scripts/e2e-run-cache.mjs`) hashes BOTH bundles, the
  fixture-served HyperFormula artifact + `tests/package.json`, the
  `hyperformula-ui` module the formula-builder fixture imports
  (`tests/node_modules/hyperformula-ui/dist/index.js`), and every file under
  `fixtures/`; rebuilding a bundle or reinstalling either package re-runs
  affected specs. Do not narrow that hash. `hyperformula-ui` is pinned to one
  exact version in every workspace package that loads it, which
  `lib/__tests__/hyperformula-ui-pin.test.mjs` asserts.
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
- **The xlsx license fixture reaches into the core package's Jest helpers.**
  `fixtures/xlsxLicenseKeys.ts` imports
  `handsontable/src/utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys.js`
  (which uses `__tests__/buildTestKey.js`) and `__tests__/fixtures.js` through
  Playwright's loader, so the Jest suites and these specs build keys with one
  builder. Moving or renaming those files breaks the xlsx license specs. And
  `demo/xlsx-license.html` takes a third fail-loud allowlisted param besides
  `?theme=`/`?bundle=`: `?engine=` (`native` or `exceljs`); an unknown value
  throws, like the other two.
- **License specs name no real tier, and the plugin specs use made-up ones.** Which features
  `standard` or `professional` include can change in any release, so no spec
  writes a real tier's name or a list of what it holds. The xlsx license specs
  still run on the build's real tiers, read from the manifest, because a fixture
  cannot add a made-up tier to the bundle's XLSX tier table: each picks its tier by
  the feature it needs off or on, and fails with the reason when a tier edit leaves
  no tier that fits. That is a prompt to move the case to the unit suite. `fixtures/licenseTiers.ts` holds
  the presets (`LICENSE_PRESETS`: a made-up tier, the feature ids it includes,
  and the key flags), builds a preset's key (`presetKey()`, through
  `keyWithTier()`) and its query (`presetLicenseQuery()`, `presetQuery()`), and
  reads the build's real tiers from `handsontable/dist/manifest.json` only to
  pick one with or without a feature (`requiredTierWithout()`,
  `requiredTierWithEvery()`, `tiersLeavingOut()`), so rebuild the core before
  you trust a run. `demo/license-capabilities.html` applies the made-up tiers of
  `?presets=` before the grid is built, by redefining each sold plugin's static
  `LICENSE` getter so its `tiers` also list the presets that include it. A case
  no tier can express (a plugin without what it requires, which the generator
  refuses) belongs in a unit test, not here; no license spec is skipped.

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

## A header's accessible name can change under a role locator

`getByRole('columnheader', { name: 'Interest', exact: true })` finds the header until a second column is
sorted, then finds nothing: MultiColumnSorting draws each sorted header's order number as `::after`
content, CSS-generated content is part of the accessible name, so the name stops being the label alone.
The same holds for any badge a theme or plugin draws with `content`. Locate a header by its label's own
text instead, `span.colHeader` matched with `getByText(label, { exact: true })`, the way
`ComplexDemoStatesPage.columnHeader()` does.

## Touch and mobile specs

- Page objects for mobile specs live in `fixtures/pages/mobile/` (as walkontable's do in
  `fixtures/pages/walkontable/`). A mobile spec must declare
  `test.use({ ...devices['iPhone 13'], browserName: 'chromium' })`: Handsontable decides
  whether to create the mobile selection handles from `isMobileOrIpadOS()` at grid
  construction time, so without the emulation the handles never exist and the spec fails for
  the wrong reason. Assert the handle is visible before touching it.
- **`elementFromPoint` does not predict where a trusted tap lands.** Chromium's touch adjustment
  moves a tap toward a nearby control (a link, a button, an input, a label) within an area sized in
  screen pixels, and does so at a zero touch radius too. A phone fixture without
  `<meta name="viewport" content="width=device-width, initial-scale=1">` lays out 980px wide at
  0.42 scale, so that area reaches 2.4 times as far in CSS px and covers most of a cell: a tap on a
  label's text landed on the file input below it, and on `horizon` on the cell padding, while
  `elementFromPoint` at the same point returned the text. Give a phone fixture that tag, assert the
  trusted event's target before what the tap did (`TouchInteractiveCellPage.tapPointOn()`), and
  declare `THEMES_TAG` on a spec that aims a tap at a point: the theme's padding decides what is
  near it. The sweep does not catch every such tap. It flags `elementFromPoint`, a box read in the
  spec, and a fixed offset from a box edge, but not `locator.tap()` or a centered point a page
  object computes, so declare the axis yourself there.
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
- The fill handle of a cell on the grid's last row or column is not always on the cell's corner. When
  that track ends at the holder's edge, the handle is lifted inside the cell and moved out of the
  overlay scrollbar's strip (`Border#getCornerScrollbarShift`). The test browsers report a scrollbar
  width of 0, so the strip applies on every leg, and the theme's track size decides whether the track
  reaches the edge: in the 130px `formulas-object-columns.html` the handle of row 1 sits 1px from the
  corner on `main` and `classic` and 20px inside the cell on `horizon`. A wait for the handle before a
  drag accepts it anywhere along the lifted axis: on the last row, any point on the cell's inline-end
  edge from its top to just past its bottom (`FormulasObjectColumnsPage.selectCell()`). The spec
  declares `THEMES_TAG`.

- The row resize handle is attached once and moved from header to header, so
  "the handle is visible" proves nothing about which header it is on:
  `ManualResizePage.hoverRowHeader()` resolves at once for a handle still left
  on the previous header (an `opacity: 0` handle counts as visible too). A test
  that presses or double-clicks the handle after moving to another header waits
  on its POSITION, read in one `evaluate` with the header: its centre sits one
  pixel above the header's bottom boundary
  (`ManualRowResizeAutofitPage.expectRowHandleOn()`). Two more rules for the
  double-click autofit (`e2e/manual-row-resize-autofit.spec.ts`): the fit does
  not run on the double-click but from a 500ms timer the first press arms, so
  poll the rendered heights and never count frames (the legacy twin counted 38
  and failed with `Expected 100 to be around 26` under load); and a header the
  pointer must reach right after the double-click has its box read BEFORE it,
  because the fit shifts every row below the fitted one.

## Reading grid UI state

- A closed editor stays in the DOM (`ht_editor_hidden`), and Playwright reports its textarea as
  visible, so `toBeHidden()` after an Enter that committed the edit fails. Read the editor's own state,
  `getActiveEditor().isOpened()` (`GridLayoutsPage.editorOpened()`).
- Each grid on a page keeps its own context menu container, so a locator for "the" menu matches one per
  grid; and a toggle entry such as "Read only" has the role `menuitemcheckbox`, not `menuitem`
  (`TwoGridsPage.makeColumnReadOnly()`).

- `hot.scrollViewportTo({ col })` scrolls nothing when the column is already
  fully inside the viewport (it returns `false`), so a test that calls it to
  move the viewport asserts the same state twice: in a 300px grid of 40px
  columns, `scrollViewportTo({ col: 3 })` leaves `scrollLeft` at 0, which is how
  the legacy textEditor viewport case re-measured its first state. Pass
  `horizontalSnap: 'start'` to make the move real (`'end'` moves it only
  when the column ends past the viewport's width), pin the
  precondition that proves it moved (the cell's offset from the holder's client
  edge), and end the helper on a render-state probe (the column inside the
  rendered band, plus `getFirstFullyVisibleColumn()` for a start snap), never on
  `scrollLeft` (`TextEditorViewportSizePage.scrollColumnToViewportStart()`). The open
  text editor of a cell that draws no inline-start border of its own (a
  borderless first column keeps the gridline inside its box, and
  `BaseEditor#getEditedCellRect` cancels the shift there), holding text wider
  than the room left in the viewport, starts 1px before its cell and ends
  exactly at the holder's client right edge: assert that start and the
  containment with `<=` in one coordinate system, never a strict `<`, from
  editor, cell and holder read in one evaluation.

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

**A scroll write is answered one frame later, and a read in between sees the
grid half-moved.** A programmatic scroll – a `scrollLeft` write, or a key press
the grid answers by scrolling – moves the master holder at once. The browser
dispatches the holder's `scroll` event at the start of the next frame, and the
engine syncs the frozen clones from that event, before the frame paints. A read
that lands in between sees the master a whole column ahead of a clone that is
about to follow it. Whether it does depends on where the read falls against the
frame boundary, not on the grid: `iframe-cross-realm-scroll.spec.ts` failed 6 of
150 runs that way, 25 on each of the six legs (`Expected: <= 2, Received: 64` on
`classic`, DEV-3115). Wait for the frame before the read.
`IframeWidthWindowScrollPage.waitForFrames()` awaits two animation frames of the
iframe, and the first callback runs after that frame's `scroll` event has been
handled. A wait on `scrollLeft` cannot do it, because the press has written it
already. When the test is about what the engine does while a key is **held**,
wait before `keyboard.up()`: released earlier, the event reaches an engine whose
key is already up, and the guard under test never runs. With that guard broken,
the old read failed 116 of 120 runs and the held-key wait failed 120 of 120.

**`imeFastEdit` moves the browser focus after the selection, not with it.** The
grid focuses the selected cell in `afterRender`, and
`FocusGridManager#refocusToEditorTextarea()` (`focusManager/grid.ts`) then runs
a debounced `select()` on the active editor's input 1ms later, so the focus
arrives on a later task than `hot.selectCell()` returns. The legacy
`intlDateEditor` case read `document.activeElement` two frames later and failed
4 times in 30 days with `Expected <td class="current"> to be <input
type="date">`. Wait with a web-first `toBeFocused()` on the editor's input,
never with a frame count, and prove the focus STAYED with a bounded settle (two
animation frames and the `activeElement` read inside ONE `evaluate`) only beside
that `toBeFocused()`, which is its positive control
(`e2e/intl-date-editor-ime-fast-edit.spec.ts`). Firefox does not treat `select()`
on a date input as a focus move, so the refocus calls `focus()` first, and the
spec carries `CROSS_BROWSER_TAG`: the Firefox leg is the one that pins it.

**A selection can scroll the grid even when its cell is on screen.**
When the viewport has nothing to scroll, `selectCell()` and `selectCells()` still
run `scrollWindowToCell()`, in a microtask, so it has run by the time the
`evaluate` returns. It calls `scrollIntoView({ block: 'nearest' })` on the cell,
and a cell taller than the part of the holder that shows it (a merged block a
frozen pane covers) scrolls the master holder by a few pixels. The clones follow
one frame later, as above, so a read in between measures the master against
stale row headers, although the test wrote no scroll. The row heights decide
whether the holder has room to move, so it can happen on one theme only. After a
selection, poll the whole geometry read in one `expect.poll` (`toEqual` on the
full object). Never poll one field and then read the rest once: the field you
polled can come from a clone that is already drawn
(`merge-cells-frozen-bottom.spec.ts`, the outline test).

**A selection's window scroll lands a frame later when the selection scrolled
the viewport, and in a microtask when it did not.** `selectCells()` on a cell
outside the viewport scrolls the holder and queues `scrollWindowToCell()` for the
next `afterScroll`, which the holder's `scroll` event fires a frame later; on a
cell inside it the same call runs in a microtask, before the `evaluate` returns.
The row height decides which: in a 400px grid row 10 is inside the viewport on
`main` and `classic` and outside it on `horizon`, so a test that selected the
cell and then scrolled the window back to the top saw the window pulled down
again on `horizon` only, a frame after its `scrollY === 0` poll had passed
(`selection-viewport-scroll.spec.ts`, the Shift+PageDown test, DEV-3443). Before
undoing a selection's window scroll, wait for it to have landed (`expect.poll`
on `isCellInWindow()`), on every theme.

**An open editor follows the master, and its cell follows a clone.** Enter
scrolls a cell that a frozen pane mostly covers into view, as a selection can.
The editor is placed from the master's new offset at once, and the clone that
draws the cell catches up a frame later, so the two boxes disagree by the
whole scroll in between (DEV-3399). Read the editor and the cell in one
evaluation together with whether that clone has caught up, and retry the whole
comparison until it has (`FixedColumnsEndPage.editorAndCellBoxes()`).
Requiring the catch-up, not only a match, keeps an editor misplaced by exactly
the scroll from passing on the stale frame.

**A grid built without a layout settles in two draws, and the provisional flag
clears after the first.** When the container joins the layout, the first draw
renders the band and, at its end, settles the scrolling element (so
`readProvisionalLayout()` is already `false`), but the row heights measured
without a layout are dropped only on the way into the NEXT draw, which takes them
again. Between the two the band already fills the container while the holder's
scroll range still counts the stale heights: 6050px against 5830px of rows,
20-40ms apart (`unlaid-out-init-scroll-sync.spec.ts`, DEV-3114, the suite's most
frequent flake). Neither the fill nor the flag can stand in for the settle: poll
the scroll range against the rows (`UnlaidOutInitPage.expectScrollRangeOfRows()`),
with the lower bound in the polled value.

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

**An autocomplete list is drawn by a query the editor defers, and its last rows
sit on the edge of the drawn band.** `open()` queues the first query on a 0ms
timer and every key press queues another 10ms behind it
(`AutocompleteEditor#deferQuery`), so a read a fixed number of frames after the
key can see the list before the query ran: the legacy `sortByRelevance` cases
read an empty row text that way on the `-min` legs (`Expected '' to equal
'cyan'`). `editor.query` holds the text the list was last queried with, so read
it in the SAME evaluation as the rows and poll until it equals what was typed
(`AutocompleteChoicesListPage.listState()`); that read is also the positive
control for a negative assertion such as "the phrase is not highlighted". The
inner grid draws `visibleRows` rows, a sliver of the next one and one buffer
row, so a 12-entry list draws all 12 only through that sliver: compare the
drawn rows the user sees and read the whole list from `htEditor.getData()`
instead of pinning the last drawn row (`e2e/autocomplete-choices-list.spec.ts`).

**`keyboard.press()` cannot make several presses share one animation frame
reliably.** Each press is its own round trip, so presses land a few milliseconds
apart. How many of them fall between two frames depends on the machine, the
bundle and the load. A race that needs several presses in one frame therefore
fails now and then, and never on demand. The arrow-key test in
`fixed-columns-end.spec.ts` failed that way on three pull requests in two days
with `Expected: <= 2, Received: 4` (DEV-3345). A window scroll queued by each
press ran after the grid had scrolled on, and pulled it back. Send the presses
from one `page.evaluate` task instead, as synthetic `KeyboardEvent`s that carry
their `keyCode`, and end on an `afterScroll` hook added after them, so it runs
after whatever they queued (`FixedColumnsEndPage.pressInOneTask()`). Assert that
the grid scrolled far enough for a queued scroll to have something to move, or
the test passes on the bug when the fixture changes. Real presses still get the
grid to its starting state.

**A draw count after asynchronous content depends on how many frames the
content arrived in.** The grid redraws at most once per animation frame for all
the image `load` and `error` events in it, and only for a row whose height
changed. A fixed ceiling on the draws therefore assumes how many frames the
responses spread over. In `async-image-frozen-columns.spec.ts`, six routes
released together can spread over one more frame under load. On a 4-worker leg
the test failed with `Expected: <= 3, Received: 4` while every row was aligned
(DEV-3457). Count batches in the fixture instead. A batch is an animation frame
in which at least one image source arrived for the first time: the fixture runs
a `requestAnimationFrame` counter and tags each first arrival with it. Bound the
draws made after the first arrival by the batches
(`AsyncImageFrozenColumnsPage.drawStats()`). Count frames, not intervals between
draws: a draw closes an interval, so a grid that drew once per arrival would
open a new interval with each one and pass. A redraw loop that the budget ends
still fails the bound, because its redraws bring no new image. The bound is
loose by design (at most one batch per source), so keep a test that lets held
responses through in separate frames and asserts more draws than the old
ceiling, and a test where one response settles every row (both in that spec). It also assumes nothing but arriving content makes the grid draw: a
fixture with a stretched or percentage-sized grid needs its draws to settle
before the release. And a loop that the budget ends runs as long as its
responses take, so wait until the draw count holds still
(`drawsHoldStill()`) rather than for a fixed number of frames.

**A Playwright route glob matches the whole URL, query string included.**
`**/fixture-image/*.svg` never matched `0.svg?small=1`, so those requests fell
through to the static server and 404ed, and the tests meant for 4px images ran on
broken ones. End the glob with `*` when the page adds a query
(`**/fixture-image/*.svg*`), and check that the content arrived
(`naturalHeight`, the response status), not only that the test passed.

**A hidden focused element blurs at the next rendering update, not when it is
hidden.** Chromium keeps a focused element that just went `display: none` as the
active element until the next rendering update runs the focus fixup, and only
then dispatches its `blur`. Anything a `blur` handler does (the comments plugin
saves the editor's text from it) therefore lands a frame after the hide, while
`toBeHidden()` on the element resolves at once. A read of the saved comment
right after the press that hid the editor saw it empty on the `-min` legs
(`collapsible-indicator-dropdown-menu.spec.ts`, DEV-3444); in one task with the
press it is empty every time. Poll the state the blur writes, never read it once
after the hide.

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
all three places. The frozen Jasmine suite's reds reach the same ledger from the
`puppeteer-failed-specs-*` records: one leg on a pull request, six on the nightly.

**Where the time goes.** Every leg, red or green, also uploads
`playwright-durations-<leg>`: one JSON file that
`.github/scripts/playwright-durations.mjs` writes from the same
`test-results/report.json` after the run step (the leg's wall-clock, workers,
counts, and the milliseconds of every spec file and test, retries included). A
sharded leg uploads one such part per shard (`-s<i>`, the summarizer told its
`--shard`), and the collector folds them back into the leg: its wall-clock is
the longest shard (what the leg costs when its shards start together; the span
from the first start to the last end is kept beside it for the queueing), the
counts and rows add up, and the page lists the parts under each run.
`test-health.yml` records the develop pushes' files in
`test-health/durations.json` (a pull request's stay in its own run for 3 days),
and the "Where the time goes" section of the same page shows each leg's
wall-clock and test count over 30 days, the 30 heaviest spec files, and every
test over 3 s. Read it before a change to workers, shards or the leg matrix, and
measure the change against its per-leg P50 and P90, the input a later e2e budget
is derived from (no gate reads it yet). The legs no longer run the same tests
("Declaring the legs" above), so each leg's count and wall-clock compare with
that leg's own history only, never with another leg's, and not across the merge
that introduced the declarations. The nightly's full-matrix files upload like
every leg's and are never recorded: a schedule is not a develop push. The JSON reporter feeds both sections,
so it stays in the CI reporter list with its output path; the durations file
path and artifact name are pinned in
`.github/scripts/__tests__/test-health.test.mjs`. A change to the leg matrix or
to a leg's shard count also changes `DURATIONS_LEGS` in
`.github/scripts/lib/playwright-durations.mjs`: the collector records only the
legs on that table, folds each leg's parts against the count there, and
`.github/scripts/__tests__/playwright-durations.test.mjs` fails until it matches
`e2e.yml`.

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
  across every project it runs on is one) by the run that sees them. A leg that
  runs in shards is several runs, each counting its own shard, so
  `lib/__tests__/quarantine-policy.test.mjs` counts the whole tree's quarantined
  tests against the same cap, lists the specs that carry one, and refuses a
  describe-level `quarantined()` (it would park every test inside while a count
  sees one): quarantine one test at a time. The entry after the cap fails the
  run even when every test passes; fix one before parking another.
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

## A11y: the axe scan and its baseline

`a11y/axe.spec.ts` runs axe-core (`@axe-core/playwright`) over the pages of `a11y/pages.mjs`, each
on the three themes, and `reporters/a11y.ts` compares every finding with the committed baseline,
`a11y/axe-baseline.json`, through the pure comparator in `lib/a11y-baseline.mjs`. CI runs it as
one job, `A11y / axe` (`.github/workflows/a11y.yml`, gated like the Playwright legs on the UMD
build), in **warn mode**: a finding that needs action is reported everywhere and the job stays
green. The only reds are tooling failures: a fixture that does not load, a constructor throw, a
menu or an editor the keyboard did not open, an invalid baseline, a run that completed no scan.
The baseline is a ratchet that only moves with the code: the pull request that fixes a finding
deletes its entry. Locally: `npm --prefix tests run test:a11y`, after `build:umd`,
`build:styles.min` and `build:themes-css.min` (an unstyled grid gives wrong contrast results;
`README.md`).

- **The scan includes the grid's root container, that grid's own portal, and a popup portal its state
  marks, nothing else.** `.include(root)` plus the instance's `rootPortalElement`, the `body`-level
  element the core appends for menus and the comment editor. The spec marks that element with a data
  attribute before the scan (`markPortal()` in `a11y/harness.ts`) and includes the attribute, never the
  `.ht-portal` class: every instance appends a portal, so on a page with several grids the class would
  scan the other grids' menus too and key their findings to this page. A state whose popups mount in a
  portal of their own marks it with the same attribute: the formula states mark hyperformula-ui's
  `.hfe-popup-portal` (`markFormulaPopups()` in the harness). The fixture page's own buttons, inputs
  and headings are not the product, and a finding on them would be baselined forever. A page
  whose fixture holds several grids names its `root` (`nested-headers`, `read-only`); the default
  is `[data-testid="grid"]`.
- **A page that is not fully built is a red test, never a scan.** Three checks run before the
  state is reached and the scan starts: an uncaught page error (`pageerror`, collected from before
  `goto()` until the state is reached), because about half the fixtures report no constructor
  error of their own and a plugin that throws after the root wrapper exists leaves a page that
  looks ready; the fixture's own constructor error (`htBuildError`, `data-init-error`); and the
  theme stylesheet, read as the `--ht-line-height` token on the root wrapper, because a missing
  theme `.min.css` gives an unstyled grid whose contrast and target-size results are wrong
  without anything failing.
- **WCAG 2.2 A and AA, violations only.** The rule set is the tags `wcag2a`, `wcag2aa`, `wcag21a`,
  `wcag21aa` and `wcag22aa`, the target level; the published conformance report
  (`docs/content/guides/accessibility/accessibility-conformance-report/`) states conformance per
  criterion. Best-practice rules are
  not in it, on purpose; the nightly axe discovery run (below, "A11y: the checks beyond axe") runs them
  for triage. An `incomplete` result (axe could not decide, most often a contrast it
  could not compute) is counted in the raw scan JSON and the report, and is never a finding.
- **One bundle, three themes, and the variants on pages of their own.** The scan runs on the plain
  UMD bundle: the minified full bundle renders the same DOM. It runs on `main`, `horizon` and
  `classic`, because the contrast and the target-size results depend on the theme, and a baseline
  entry names its theme. The dark color scheme and right-to-left layout are pages, not another
  axis: the `dark-*` pages load their fixture with `?scheme=dark`, which `grid.html`,
  `filters-value-list.html` and `dialog-states.html` map through the same fail-loud allowlist as
  `?theme=` to the theme's dark class (`ht-theme-<theme>-dark`), and the `rtl-*` pages use fixtures
  that build a right-to-left grid. The `colorScheme` option cannot stand in for the class: it needs
  the theme engine and does nothing on a grid themed by a CSS class, which is how every fixture
  loads its theme.
- **A separate config, one project.** `playwright.a11y.config.ts` spreads `playwright.config.ts`
  (server, port, base URL, traces) and replaces the projects, the way the engines config does.
  The e2e config's project list is pinned by `e2e/leg-declarations.spec.ts` and
  `.github/scripts/__tests__/e2e-legs.test.mjs`, and the leg-declaration sweep reads every spec
  under `e2e/`, so a scan that is not a functional test stays out of both: no leg tags, no shards.
  The quarantine reporter is not in its list either (nothing is quarantined in a scan). The a11y
  reporter resolves the baseline from its own location, not from `config.rootDir`, which is the
  config's `testDir` (`a11y/`), one level below the package. It reads screenshots from the spec's
  `scans/` folder, never from beside an attachment: Playwright copies an attached file into its
  own attachments folder.
- **Every opener drives the keyboard.** Shift+F10 for the context menu, Shift+Alt+ArrowDown for
  the dropdown menu, Enter for an editor, Ctrl+Alt+M for the comment editor (which also focuses
  it; `showAtCell()` would only show it), ArrowDown and ArrowRight to reach a submenu, after
  `selectCell()` through the API so the keys reach the grid. Four states have no surface for a key
  to open, and reach theirs through the API or the pointer: the data-provider page releases its
  parked fetch, `selection` lays a selection (the phone's selection handles), `selection-hover`
  selects a range and hovers it (the desktop selection handles draw only under the pointer), and
  `async-pending` starts a value that never settles. A page with `device` (the phone handles) runs
  in a describe block that emulates the device from the first load, because the core decides at
  construction whether it runs on a phone. The scanned DOM is the one a keyboard user reaches,
  which is what the menu findings are about. The instance is read inside the page through the
  `__hotInstance` the core stamps on `.ht-root-wrapper`, so no page says which global holds its
  grid, and the lookup is spelled out inside each `evaluate` (Playwright serializes the callback's
  source; a helper defined in the spec is not visible in the page).
- **Every value a report writes is escaped for where it lands.** The job summary and the check
  run are markdown GitHub renders, and their values come from axe and the fixture DOM: every one
  goes through `escapeMarkdownText()`, which backslash-escapes the backslash together with every
  other character markdown or HTML reads, in one pass. Escaping the pipe alone kept the cells
  apart but let a backslash in the value pair with the added one and let `<`, backticks and
  emphasis through as markup (CodeQL's `js/incomplete-sanitization`). A target sits in a `<code>`
  element, not a backtick span, because a code span cannot escape a backslash, and a URL is linked
  only when it is plain https (`isSafeLink()`). The HTML report escapes every value through
  `escapeHtml()` and embeds only `data:image/jpeg|png` screenshots. The pull request comment also
  breaks anything shaped like a task id (`neutralizeTaskIds()`), and `validateBaseline()` refuses
  an issue title that names one: the ClickUp integration attaches every task id it finds in a pull
  request comment, permanently.

### The baseline: known issues and their findings

The baseline has two lists, and the split is the point. **`issues`** is the catalog of known
accessibility problems: a stable id local to this repository (`menu-roles`), a title that says
what the problem is, and optionally the `tracker` task that owns the fix. **`entries`** is where
each issue shows: one entry per page, theme, rule and target, with the number of nodes that carry
it. An entry names its issue, never a tracker task, so the gate does not follow a task's
lifecycle. A task closed for any reason leaves no entry pointing at it; a new finding can be
baselined under an issue before anyone files a task (the tracker is optional); and the reports
group by what a problem is, not by who owns it. A tracker id appears only on the issue, which is
also what keeps the reports' prose free of task ids: the one-id rule (root `AGENTS.md`) is about
pull request text, and a report linked from one should not need a second id policy.

```json
{
  "axeCoreVersion": "4.14.0",
  "issues": [
    {"id": "menu-separators", "title": "Menu separators are exposed as menu items", "tracker": "DEV-2944"}
  ],
  "entries": [
    {"page": "context-menu", "theme": "main", "rule": "aria-required-parent", "target": "td.htSeparator[role=\"menuitem\"]", "impact": "critical", "nodes": 9, "issue": "menu-separators"}
  ]
}
```

This is the schema the conformance-report generator reads. `page` is an `id` of `a11y/pages.mjs`;
`theme` is `main`, `horizon` or `classic`; `rule` is the axe rule id; `target` is the fingerprint
below; `impact` is axe's (`minor`, `moderate`, `serious`, `critical`, or `null`); `nodes` is a
positive integer; `issue` names an issue `id`. An issue has `id` (kebab-case), `title` and an
optional `tracker` (`DEV-1234`). Nothing else is allowed, and
`lib/__tests__/a11y-baseline.test.mjs` (root `test:tooling`) refuses an unknown field, an entry
whose issue does not exist, and an issue with no entry left: an issue leaves the catalog with its
last finding, and its tracker can close then. One entry or issue per line, entries sorted by page,
theme, rule and target, so a diff reads as a list. `axeCoreVersion` is the exact engine the
baseline was taken with: both axe packages are pinned exact in `package.json`, a bump re-runs the
scan and refreshes the baseline in the same pull request, and the reporter warns when the engine
the scans **ran** (`results.testEngine.version`) differs from it. It compares the engine, not the
`axe-core` package the tests depend on, because `@axe-core/playwright` resolves its own copy.

**The target is what the node is, read from its own start tag** (`targetFingerprint()`): the tag,
the first class that describes the node with that class's BEM modifiers, and the `role` and
`type` attributes (`td.htSeparator[role="menuitem"]`, `button.ht-button.ht-button--primary`,
`textarea.handsontableInput`). It is not the selector axe picked to reach the node, because axe
picks the shortest unique selector on the page: the same editor textarea was `.handsontableInput`
on one page and `textarea` on another, and axe anchors on Handsontable's random root id
(`#ht_2748fc73094c28f8`) and on each menu item's `aria-label`. Classes for state, layout or
instance are skipped (`VOLATILE_CLASSES`: `current`, `htDisabled`, `afterHiddenRow`,
`htCustomMenuRenderer`, `ht_<random>`), because a key built on one changes with the selection: a
menu item is `htDisabled` or not depending on what is selected when the menu opens. Add a class
there when a key turns out to follow a state. When axe gives no start tag, the fallback is the
selector's last compound with positional indexes collapsed and attribute values other than `role`
and `type` dropped.

**The node count is part of the ratchet.** The key names a kind of element, so a regression that
spreads a known finding to more elements keeps its key; only the count shows it. The comparator
sorts a run into six sets, each with a one-line remedy:

| Set | Means | Remedy | Block mode |
|---|---|---|---|
| new | the key is not in the baseline | fix it, or add an entry under an issue (the report names the issue when the same rule and target are known elsewhere) | fails |
| grown | more nodes than recorded | fix the new ones, or raise `nodes` | fails |
| matched | exactly the recorded count | nothing | passes |
| improved | fewer nodes than recorded | lower `nodes` | fails |
| stale | the page and theme were scanned and the key did not reproduce | delete the entry, and its issue with its last one | fails |
| unverified | the page or theme was not scanned this run | nothing until it runs | passes |

### Adding a page

Add an entry to `a11y/pages.mjs`: `id` (a kebab-case slug that names the surface, not the
fixture; one fixture can be scanned in several states), `fixture` (under `fixtures/demo/`),
`query` (appended after the theme), `root` (when the fixture has several grids), `cell` (where a
menu or an editor opens; `[1, 1]` when absent), `state` (one of `STATES` in `a11y/harness.ts`: add a new
opener there for a new kind of surface, keyboard first), `device` (a Playwright device to emulate,
for a surface that exists on a phone only), `surface` (what it covers), and `licensePreset` (a
key of `LICENSE_PRESETS` in `fixtures/licenseTiers.ts`, for a page that shows what a license
key leaves out). `pages.mjs` is plain JavaScript and cannot build a key, so every spec opens a
catalog page through the TypeScript `fixtureUrl()` in `a11y/harness.ts`, which appends the
preset's made-up tiers and key and throws on an unknown preset; the `fixtureUrl()` of
`pages.mjs` leaves them out, so the HTML report and `a11y-findings.json` link such a page to the
URL its scan recorded (`withScannedUrls()` in `lib/a11y-suites.mjs`). Keep
`{ id: '…'` at the start of the entry's first line: the check run annotates a new finding on that
line, and `lib/__tests__/a11y-check-run.test.mjs` finds every page there. The fixture keeps the
fixture contract above: the `?theme=`/`?bundle=` block, `window.htBuildError` or
`data-init-error` on a constructor throw, which the spec turns into a red test. Run the scan;
every finding the new page reproduces is new, and the report says which known issue each one
belongs to. The tooling test refuses an entry whose page is not in the list, so removing a page
means deleting its entries (and an issue left without any) in the same change. List the new page
under the plugin or editor it scans in `a11y/coverage.mjs`.

### Coverage: every plugin and editor is accounted for

`a11y/coverage.mjs` has one entry per folder under `handsontable/src/plugins/` and
`handsontable/src/editors/`, and `lib/__tests__/a11y-coverage.test.mjs` (root `test:tooling`) reads
the folders from disk and fails on one without an entry, on an entry without a folder, and on a page
id that `pages.mjs` does not have. An entry is `pages` (the pages that scan it), `none` (it draws
nothing a scan of a resting page could check, and why: sizing, data, events, a guide drawn only
during a drag) or `gap` (it draws UI no page scans yet, and what is missing). The point is the
decision, not the list: a new plugin or editor cannot land without someone saying how its UI is
scanned. A gap is debt, so `A11Y_GAP_LIMIT` is exactly the number of gaps: a new one fails the test,
and the change that closes one (adds its page, baselines what the page finds that already existed
under an issue) lowers the limit. `none` is for code that really draws nothing at rest; a control
that waits for a fixture to turn it on is a gap.

### Baselining a finding, and fixing one

A finding the pull request caused is fixed in that pull request. A finding that is real but
belongs to work not done yet gets an entry: copy the snippet from the remedy (it carries the node
count and, when the rule and target are known elsewhere, the issue) into `entries`, at its sorted
place. A problem the catalog does not have yet gets an issue too, with a title that says what is
wrong; its `tracker` waits until someone files the task. The pull request that fixes an issue
deletes its entries and the issue; one that fixes some of an issue's nodes lowers `nodes`.

### The reports, and the visible gate

The reporter writes four outputs into `test-results/a11y/`, and CI publishes each:

- **The job summary** (`summary.md`): the headline, a table per set that needs action with its
  remedies, and the known issues with their counts.
- **The HTML report** (`a11y-report.html`, `lib/a11y-report.mjs`), built to **locate every
  element**. A card per new or grown finding gives the fixture to open (a link to the local
  fixture server, `http://localhost:8123` by default) and the steps to the scanned state
  (`stateSteps()` in `pages.mjs`), then every element with its selector (copyable), its full DOM
  path (axe's `ancestry`, which the spec asks for), its box on the page, its markup and axe's
  reason, and a screenshot with the elements outlined and numbered. Then the findings by rule, a
  page × theme heatmap linking each cell to its fixture, every known issue pictured on one scan
  with every location, and every scan. A scan is photographed only when it holds a finding that
  needs action or is the page an issue is pictured on (`marksForScan()`, `representativeScans()`),
  so a clean run carries about six screenshots. One self-contained file (inline styles,
  screenshots as data URIs, no request to anything), dark by default with a light toggle, readable
  without JavaScript (the script adds the toggle, copy buttons and a filter). It is an
  accessibility report, so it is accessible itself: headings in order, header cells, a status is
  always an icon and a word as well as a color, white numbers and outlines on colors that clear
  4.5:1. CI uploads it unzipped (`archive: false`), so it opens in the browser from the run page.
  It is ours rather than a stock axe report: the stock one had no release since 2024, loaded
  jQuery and Bootstrap from public CDNs, could not show screenshots, and listed known and new
  findings alike.
- **The sticky pull request comment** (`lib/a11y-pr-comment.mjs`, posted by
  `scripts/a11y-pr-comment.mjs`): posted on every pull request the scan ran on, clean or not, and
  edited in place on every later run (`upsertComment()` finds the old one by `COMMENT_MARKER` and
  the Actions bot as the author), so a reviewer always sees the scan. A clean body is short: the
  headline, the scan (scans, pages × themes, axe-core), the links to the report, the run and the
  check run, and the findings by rule as a chart. A body that needs action adds what needs action
  (up to fifteen rows) before the chart. Never a screenshot (an
  artifact needs a login, and GitHub fetches comment images without one). The chart is a table
  of text bars (`textBar()`, block characters to an eighth), counted by `findingsByRule()` like
  the HTML report's overview: a comment holds no script and no image it can fetch, a Mermaid
  chart renders in a frame a screen reader cannot read, and GitHub strips `aria-hidden`, so the
  bars sit in their own `Chart` column beside the numbers.
- **Baseline growth is in the comment, not the check run.** The comparator judges the scan
  against the pull request's own baseline, so a pull request that adds entries to it reads as
  clean. The comment step reads the baseline at the base commit through the REST API
  (`baseCommit()`, `readBaseBaseline()`) and `baselineGrowth()` lists every entry the pull request
  adds and every count it raises: the headline turns ⚠️ and says how many, and a section groups
  them by issue and spells out the first ten. The base commit is the first parent of the
  checked-out merge commit (`A11Y_CHECKOUT_SHA`), never the payload's `base.sha` when there is a
  merge commit: a re-run, or a branch that merged the base in, leaves `base.sha` behind the tip the
  merge ref was built on, and every base change in between would read as growth (`.ai/CI.md`, the
  diff-scoped gate trap). An entry is keyed as the comparator keys it (page, theme, rule, target),
  so one the base has under another issue is moved, not added: renaming or splitting an issue
  moves all its entries, adds no debt, and gets one line saying where they went. A base file that
  is missing or not JSON is one line saying the growth is unknown, never a failed step. The check
  run stays as it is: it judges the scan, it never reads the base, and a warning on every pull
  request that baselines a finding the documented way would stop meaning "the scan found
  something". Approving the pull request accepts the listed debt. Locally, read the base at the
  merge base, not at `origin/develop`, or everything `develop` changed since the branch forked
  reads as this branch's: `git show "$(git merge-base origin/develop HEAD)":tests/a11y/axe-baseline.json > base.json`,
  then `node scripts/a11y-pr-comment.mjs --dry-run --base base.json`.
- **The agent findings** (`a11y-findings.json`, `lib/a11y-findings.mjs`): the same run, concise and
  machine-readable, for an implementer agent. `needsAction` lists each finding that needs action
  with its page, theme, fixture URL, steps, rule, WCAG criteria, element, counts, remedy and up to
  ten elements (selector, DOM path, box, markup, reason); `issues` lists every known issue with
  every location, one locator each and the impact the scan gave it (the one the check run counts,
  which the findings ledger reads); `pages` says once how to reach each page's state;
  `reproduce` has the commands. `schema` (`FINDINGS_SCHEMA`) changes when a field is removed or
  renamed. `comparison.json` beside it holds everything and is several times larger.
- **The check run** `A11y / axe report` (`lib/a11y-check-run.mjs`, posted by
  `scripts/a11y-check-run.mjs` on the pull request's head commit, never the merge commit). It is
  the visible verdict while the job stays green, by the severity rule ("A11y: the verdict of a
  check run"): on a pull request or a push a new or grown finding counts at its impact (a tracked
  one as a warning at most), on the nightly every open finding counts; `failure` on a critical or
  serious one or a tooling failure, `neutral` on a moderate or minor one, `success` otherwise, and
  `failure` on any finding that needs action in block mode. The counts are in its title, the
  summary and the report link on its page, and an annotation per finding on the line to change
  (`pages.mjs` for new and grown, the baseline for known, improved and fixed). Only `CI Gate` is
  required, so it never blocks a merge by itself.

A fork's or Dependabot's token can write neither checks nor comments, so both steps carry the
canonical fork guard and `continue-on-error`; the summary, the report and the agent findings
still carry everything there. Locally, `node scripts/a11y-check-run.mjs --dry-run` and
`node scripts/a11y-pr-comment.mjs --dry-run --base <file>` print what CI would post (without
`--base` the comment leaves the baseline growth out, which CI always reports). The raw axe result per page
and theme, with its screenshot, is in the `a11y-axe-results` artifact (`scans/<page>--<theme>.json`,
three days), beside `comparison.json`, `a11y-findings.json` and `summary.md`. GitHub shows at most
ten warning annotations per step, so a run with many findings shows the first ten there and the
check run, the comment, the summary and the report hold them all. The chain from the orchestrator
to the config is pinned by `.github/scripts/__tests__/a11y-workflow.test.mjs`.

### Warn mode, and when it flips

`A11Y_MODE` in `lib/a11y-baseline.mjs` is the whole switch, and the tooling test pins its value.
In `warn` the run's status is Playwright's own and the check run follows the severity rule
("A11y: the verdict of a check run"). In `block`
a new, grown, improved or stale finding fails the run and the check run: the ratchet then holds
both ways, since a fixed finding whose entry was not updated is a red run too. An unverified
entry never changes the status. The flip comes after a replay of the comparator over recent pull
requests shows it reports what changed and nothing else (precise before blocking); it changes the
constant, the pinned test and this section together. Both modes are covered by the tooling tests,
so the flip needs no new test.

The exit status itself is proven end to end by `e2e/a11y-reporter.spec.ts` (no browser, about
four seconds), the way `e2e/quarantine-policy.spec.ts` proves the quarantine reporter's: each case
runs a synthetic Playwright project whose tests attach hand-written scans, with the reporter's two
test-only options, `baseline` (a path) and `mode`, which `playwright.a11y.config.ts` never passes.
A new finding in warn mode exits 0; a failed test, a run with no scan and a baseline that does not
validate exit 1; block mode exits 1 on a new finding and 0 when every finding is known; and a
tooling problem prints as one escaped annotation. Every workflow command the a11y job prints goes
through `workflowCommand()` in `lib/a11y-baseline.mjs`: a problem quotes the baseline, and an
unescaped newline or `%` would cut the one line that explains a red job.

## A11y: the checks beyond axe

The axe scan reads the accessibility tree against axe's rules. It never presses a key, measures a
focus ring, zooms the page, turns on forced colors or drags anything, and the published conformance
report still marks criteria "Not Evaluated" for want of that evidence. The checks in `a11y/checks/`
measure those. Each check is one Playwright project of `playwright.a11y-checks.config.ts`, named by its
id, and each test of a check measures one target: a page of the catalog (`a11y/pages.mjs`) in a theme
and a state, or a variant the check makes of it (dark, right to left, a phone). What a check measured
lands in one evidence document per check, which the conformance report generator cites per
criterion.

- **Report-only, and the rule is one constant.** `EVIDENCE_MODE` in `lib/a11y-evidence.mjs` is
  `report`, and `lib/__tests__/a11y-evidence.test.mjs` pins it. A finding is a row in the job summary and
  an annotation, and never fails a test or the job; the `A11y / <check> report` check run follows the
  severity rule ("A11y: the verdict of a check run"), red on a critical or serious finding at the target
  level and on a check that did not measure everything. A test fails for tooling only (a fixture that
  does not load, a state the keyboard did not reach), and the document records that test as a target
  with `status: 'error'` and its error as a problem. So does a test that did not run (the run stopped
  before it, or a failure before it skipped it: a `beforeAll` hook, an earlier test of a serial group, the
  worker) and one whose part is not readable
  JSON or does not validate: only a test that asked to be skipped is left out, so `summary.byCriterion`
  never reads a partial run as a full one. A test that measured only on a retry is flagged
  (`flaky`) and listed as a problem too. Flakiness is a finding against the check, not the product: fix
  the measurement, never quarantine it. A check that starts gating changes the constant, its test and
  this section together, after its findings have proven precise.
- **One document per check, in one shape.** `test-results/a11y-checks/<check>.json` (`mergeEvidence()`):
  `check`, `title`, `mode`, `triage` (whether the check's records are for sorting rather than evidence; a
  triage document's `summary.byCriterion` is empty), `criteria` (what the check evidences, from
  `EVIDENCE_CHECKS`), `run` (the commit the run tested, the head on a pull request and never the merge
  commit, so `null` on a pull request run without `A11Y_HEAD_SHA`; the ref, the run URL, the browser
  and its version, the Handsontable version and build date),
  `targets` (every target, measured or not, with the criteria it evaluated and the path of its detail
  file), `findings`, `problems` and `summary`. A target is its page, theme and variant: a check that
  measures one page two ways (a scheme, a state, an interaction) gives each its own variant, because a
  second part for the same target is dropped as a problem (it would count the target twice and
  overwrite its detail file). A finding has a stable `id` (check, kind, the axe `rule` and the
  needs-review `cause` when it names them, page, theme, variant, and the element, the step or both, so
  two runs give the same finding the same id; never the `reason`, whose text can carry per-node values;
  two findings that share one are a problem), `kind`, `criteria`, `severity`, its target (`page`,
  `theme`, `state`, `variant`, `url`), a `selector` or a `step` or both, `measured` (flat values),
  optionally `expected`, and a one-sentence `reason`. What a target measured in full (every focus stop,
  every ratio) goes to `<check>/<page>--<theme>[--<variant>].json` beside the document, so the document
  stays small enough to read. `summary.byCriterion` counts, per criterion, the targets that evaluated it
  and the findings against it: a criterion evaluated on many targets with no finding is the evidence of
  a pass, and that count is what the generator cites. A target whose test could not take a step (the
  part's `problems`, counted as the target's `problems`) stays measured and keeps its findings, but
  evaluates no criterion: a step that did not run found nothing, which is not a pass. `schema`
  (`EVIDENCE_SCHEMA`) changes when a field is removed or renamed; `validateEvidence()` is what a reader
  can rely on, and it checks every field the summary and the check run read, so a document that
  validates never crashes the report script before it posts.
- **Criteria are WCAG 2.2 ids from one table.** `WCAG_CRITERIA` lists every 2.2 success criterion with
  its name and level, without the obsolete 4.1.1, and a finding naming any other id is refused. A
  finding may name a criterion outside its check's list when the measurement shows it (a focus stop
  with no name is a 4.1.2 fact the keyboard walker sees); it is then counted under that criterion with
  no target evaluating it, because the check does not evaluate it everywhere.
- **Severity is axe's scale plus one.** `critical`, `serious`, `moderate`, `minor`, as axe rates
  impact, so a finding reads the same in every report, and `advisory` for a difference to review that
  is not a failure on its own (a tab-order golden that moved). An advisory finding never raises the
  check run's verdict: it is a notice annotation and a row to review.
- **The same pages, states and guards as the scan.** Every check opens its targets through
  `a11y/harness.ts`: `openTarget()` loads the fixture and turns an uncaught page error, a missing theme
  stylesheet or a constructor throw into a red test, and `reachState()` reaches the catalog state with
  the keyboard (`STATES`) and marks the grid's own portal (`PORTAL`). A check therefore measures the DOM
  a keyboard user reaches, the one the axe scan reads. A state a check needs and the catalog lacks gets
  an opener in `STATES`, keyboard first. The axe discovery run's extra states are the one exception: no
  other check scans their pages, so their openers sit beside them in its spec (`DISCOVERY_STATES`), and
  one moves to `STATES` when a catalog page needs it. A state whose popups mount in a portal of their own
  marks that one too (see the scan's own rule above), and it comes after the grid's in `body`, so a check
  reads the marked portals with `querySelectorAll()`: a `querySelector()` sees the grid's portal only and
  measures the page without the popup the state opened. The `test()` calls stay in the spec, never in a
  helper: a test declared from a helper reports the helper as its location.
- **A test declares its target first and attaches its part last.** `declareTarget()` (`a11y/evidence.ts`)
  writes the target as a test annotation before anything can fail, so the reporter can name a test that
  failed before it measured; `attachEvidence()` attaches the part, with `readEnvironment()`'s browser
  and build. It takes the page errors `openTarget()` collected (`opened.pageErrors`) and fails the test
  when the page threw while it was measured, so a page that crashed halfway is a target not measured,
  never a clean one. The documented-shortcuts test is the one exception: it reloads its page between
  probes, so it records an error the page threw during a probe as a problem of that probe, and the
  target, measured with a problem, evaluates no criterion. A test that loads the page more than once
  owns that list: it passes one list to every `openTarget()` as `pageErrors` and drains it in place,
  and the page writes to it from before the navigation, so the test holds the live list even when a
  load throws. An empty `findings` list is evidence too: the target was measured and nothing was found.
- **Findings on the product are recorded, never fixed in the check's change.** A check lands with what
  it finds listed in its pull request's description, read from a nightly dispatch from its branch (a
  pull request's own pipeline runs the axe scan alone); the product tasks are filed apart, and a fix
  later clears the finding. A finding the check gets wrong is fixed in the check.
- **Every report value is escaped.** The summary and the check run render values from the fixture DOM
  (selectors, accessible names), so `renderEvidenceSummary()` escapes them with the scan's own
  `escapeMarkdownText()` and links a URL only when the scan's `isSafeLink()` passes it (both from
  `lib/a11y-baseline.mjs`: one copy to fix), and puts a selector in a `<code>` element.
- **Every check gets its check run.** A summary lists twenty tooling problems at most and is cut to the
  Checks API's limit (a longer one is refused with a 422), and the report script posts each check run
  on its own: one the API refuses does not cost the checks after it theirs; the step still ends red.

The merge, the validation, the summary and the check run are pure (`lib/a11y-evidence.mjs`, tested
in `lib/__tests__/a11y-evidence.test.mjs` through the root `test:tooling`). The reporter
(`reporters/a11y-checks.ts`) reads the last attempt of every test of each project that ran and writes
the documents, the detail files and a `summary.md`; it never changes the run's status. It validates
each part the way `mergeEvidence()` does, with the check's `triage` flag from `isTriageCheck()`, so a
part the merge would keep is never dropped before it. `e2e/a11y-checks-reporter.spec.ts` (no browser,
a few seconds) proves it on synthetic projects: the last attempt read, a failed test recorded as an
error target, a retried one flagged, a triage check's part read as triage, a detail written to its own
file. `scripts/a11y-evidence-report.mjs` reads the documents and writes the job summary,
or posts one check run per check with `--check-run` (`--dry-run` prints the payloads); a check of the
suite the job ran (`HOT_A11Y_CHECKS_SUITE`, or the comma-separated `A11Y_CHECKS` when it is set) that
left no document gets a red tooling check run instead of none.

- **Where they run: the nightly, never a pull request.** `a11y.yml` has a second job, `checks`, beside
  `axe`: the same Playwright container and UMD artifact, `continue-on-error` on the job only (a tooling
  failure turns the job red, as it does the axe job, and never the Tests pipeline), and one
  `A11y / <check> report` check run per check on the run's head commit (behind the canonical fork
  guard). The job runs only when the caller sets the `checks` input: the `A11y nightly`
  (`a11y-nightly.yml`: a dispatch on develop is the audit, a dispatch from any branch is a proof run,
  and there is no schedule; "A11y: the audit and the proof runs" below) does, and the pull-request
  Tests pipeline (`test.yml`) does not, so a pull request runs the axe scan, its baseline ratchet and
  the sticky comment alone. The reason is what a pull request gets out of them: the checks are
  report-only and the accessibility program is still building its picture, so a pull request learned
  nothing from them it could act on, and paid a job for it. A skipped job runs no step, so it posts no
  check run, stale or otherwise. `HOT_A11Y_CHECKS_SUITE` picks the checks, from the `nightly` input:
  `nightly` runs every one, and the short suite, `pull-request`, keeps the ones with
  `pullRequest: true` in `EVIDENCE_CHECKS` (a check earns it by finishing in under two minutes), for a
  developer to run locally or through a dispatch of the nightly that asks for it
  (`gh workflow run a11y-nightly.yml --ref <branch> -f suite=pull-request`; a plain dispatch runs every
  check). The `checks` input runs the named checks instead of the suite
  (`-f checks=<id>[,<id>]`, comma-separated, no spaces, the proof run of a change to one check): it
  reaches the job as `A11Y_CHECKS`, the config builds the named projects only (`checksForRun()`, which
  refuses an entry that is no check id before a test runs, as the nightly's `check-inputs` job did
  before the build), the report script expects a document of each and names the subset in the job
  summary, the check runs keep their names, and the run's `verdict` job expects the named checks only.
  The evidence goes up as `a11y-checks-evidence`, outside the `playwright-report-*` glob the flake
  ledger reads, for 30 days from a run of every check (what the report cites) and 7 from the short
  suite or a subset. `EVIDENCE_CHECKS` is the one list: the config builds its projects from it (`checksForRun()`),
  and the report script posts a red tooling check run for a check of the suite that left no document.
  Locally, after `build:umd`, `build:styles.min` and
  `build:themes-css.min`: `npm --prefix tests run test:a11y-checks` runs every check,
  `HOT_A11Y_CHECKS_SUITE=pull-request npm --prefix tests run test:a11y-checks` the short suite, and
  `-- --project=<check>` or `A11Y_CHECKS=<check>` one check; the reporter writes the documents only when
  the config's reporters run, so do not pass `--reporter` on the command line.

### The keyboard walker

`a11y/checks/keyboard-walker.spec.ts`, the `keyboard-walker` check: 2.1.1, 2.1.2, 2.1.4, 2.4.3, 3.2.1
and 3.2.2, measured with real keys. The browser half records (`a11y/checks/walker.ts`), the pure half
judges (`lib/keyboard-walker.mjs`, tested in `lib/__tests__/keyboard-walker.test.mjs`).

- **Every catalog page, on the main theme.** A theme is CSS: it moves no tab stop and changes no key,
  so the walker runs each page of `a11y/pages.mjs` once, in its state, on `main`. The dark and
  right-to-left pages are in the catalog already.
- **A walk covers the grid and nothing else.** A focusable sentinel goes right before and right after the
  grid's root container, and a walk presses Tab from the first until the focus reaches the second
  (Shift+Tab back). The fixture page's own buttons are not the product and are never walked. Each stop
  records its region (`grid`, `portal` for any element the harness marked as a portal, the grid's own or
  a popup library's, a sentinel, `outside`, or `body` when no element has the focus), the role and name Chromium's accessibility tree gives the focused element (read over CDP
  with `Accessibility.getPartialAXTree`, because the DOM cannot say what a screen reader gets), and its
  cell. **A stop is keyed by its cell, never by its element**: Walkontable reuses a `<td>` for another
  cell after a scroll, so keying by element would read a scroll as a cycle.
- **A trap is a walk that never gets out, and a long walk is not a trap.** With `tabNavigation` (the
  default) every cell is a tab stop and Tab leaves the grid from a row's last cell; with `autoWrapRow`
  Tab wraps rows and leaves from the last cell of the grid, so a walk can run out of presses (the
  column count plus 40) with nothing wrong. The walker then tries the way out the shortcut guide
  documents, Ctrl+End then Tab (Ctrl+Home then Shift+Tab back): a walk that gets out that way is an
  advisory `tab-walk-needs-shortcut`, one that does not is a `keyboard-trap`. A way out whose press from
  inside the grid's container leaves no element focused is also `focus-lost`, as in a walk: the focus left
  the grid, so it is no trap, but a screen reader has nothing focused. A walk that comes back to a
  stop outside the product (the sentinel it started on) without reaching the other one is neither an exit
  nor a trap held in the grid, and is an advisory `tab-walk-incomplete`. A modal dialog holds the
  focus by design: a cycle inside one is a trap only when neither Escape nor a button in it lets the
  keyboard out, and a Tab that walks out of an open modal to the content behind it is a
  `focus-leaves-modal` finding.
- **A popup is judged by Escape.** On a menu, an editor, the comment editor or the formula editor's popups
  (`POPUP_STATES`), Escape (pressed up to three times: a submenu takes two, and so does a formula popup,
  which closes before the edit does) must close it and give the focus back to the cell it opened on: to
  that cell's own element, or, on a grid in mixed focus mode (`imeFastEdit`), to the editor input that
  mode keeps the focus on by design. Another element of the grid (a header, a button, the hidden editor
  input of a grid in cell focus mode) is not back, though the cell stays highlighted. A
  popup state walked like a grid at rest reads a Tab the editor keeps (the formula editor accepts a
  suggestion with it) as a trap, so a state that opens a popup belongs on that list. Then the
  popup opens again and Tab walks inside it, judged per stop, and its stops are keyed by cell like a Tab
  walk's: on an editor Tab commits and moves from cell to cell. A Tab that leaves the focus on the element
  it was on (the one the popup put it on, for the first) is an advisory `tab-keeps-focus`, with whether
  the editor stayed open: the walk cannot tell a date input moving between its fields, a suggestion
  accepted and a Tab that did nothing apart, and the guide says Tab completes the entry and moves on. A
  focus that lands on `body` after the
  popup closed is `focus-not-returned`: the grid often still listens, so the next arrow key brings the
  focus back, but a screen reader has nothing focused until then.
- **Per stop:** a product stop the accessibility tree gives no role is `focus-stop-without-role`, one whose
  role needs a name (a button, a menu item, a text field, a native date or time input, a header) and has none is
  `focus-stop-unnamed` (both 4.1.2: the walker sees them, the tree snapshots own the criterion); a grid
  cell needs no name, because an empty cell's empty name is its value. A press that also opened a menu,
  a dialog or an editor, or navigated, is `context-change-on-focus` (3.2.1). A press from a stop inside the
  grid's container that leaves no element focused is `focus-lost` (2.4.3): the sentinels bracket the
  container, so the focused element went away. A `body` stop after a portal stop is not judged, because the
  portal can be the last focusable element of the page, and Playwright emulates page focus, so
  `document.hasFocus()` cannot tell leaving the page from losing the focus. A stop both walks pass gets
  one role or name finding (the walks share one `reported` set): its role and name do not depend on the
  walk that reached it, so a second finding would count one defect twice. A focus loss, a Tab out of a
  modal and a change of context on focus depend on the key, so each walk keeps its own: Tab and Shift+Tab
  losing the focus from one cell are two defects, and fixing one leaves the other. Every form control a walk
  stopped on then gets an input (Space, ArrowDown, a letter), and an input that navigates, opens a popup
  or moves the focus away is `context-change-on-input` (3.2.2).
- **The APG grid keys** (arrows, Home, End, Page Up, Page Down, Ctrl+Home, Enter, F2, Escape) are pressed
  on every grid at rest, each from the page's cell. A key that moves the focus out of the grid is a
  finding; one that does nothing is advisory, because an edge cell, a frozen band or a hidden column can
  make that right. A key the start cell is already at the edge for is skipped, and so are Enter and F2
  on a cell that is read-only, has no editor, or is a checkbox (which toggles instead), and Enter alone
  on a grid with `enterBeginsEditing: false`, which changes Enter and leaves F2 opening the editor.
- **Every documented shortcut is accounted for.** `a11y/checks/keyboard-shortcuts.mjs` has one entry per
  row of the keyboard shortcuts guide, by section, Windows keys and ordinal (what `parseShortcutTables()`
  reads from the page): a `probe` (the page, where the focus starts, the steps before, the keys, the
  effect the guide describes) or a `notProbed` reason. The tooling test fails on a documented row with no
  entry and on an entry whose row is gone, so a shortcut added to the guide is probed, or its reason
  written, in the same change. The probes run on `fixtures/demo/keyboard-shortcuts.html` (one grid with
  menus, filters, comments, merging, undo, clipboard, multi-column sorting and navigable headers) or on
  the catalog page that draws the feature. The verdict compares two snapshots of the grid
  (`effectsBetween()`): nothing changed is `shortcut-does-nothing` (2.1.1), the focus leaving the grid is
  `shortcut-moves-focus-out` (2.4.3), another effect is advisory, and so is an effect the guide rules out,
  which the probe lists in `forbid` (Escape on an editor or the comment editor must close it without
  saving what was typed): a probe passes on any one expected effect, so a key that also does the wrong
  thing passes unless the probe forbids it. **Every probe starts from the page as it
  loaded**: a probe that changed the data, the merges, the sort, the filters, the collapsed groups, the
  frozen counts or the row selection makes the walker load the page again, because a cleared cell or a
  collapsed row made the next probe report a shortcut as dead. Write a probe from a cell the key can
  move from (the start cell of an arrow is not on the edge it moves toward), and read the fixture first:
  a read-only cell, a list that keeps the focus on its input (`aria-activedescendant`, which the
  snapshot counts as a move), a freeze bar that takes one arrow axis only, an editor the grid moves
  between the cell and the formula bar (the focus key carries the part of the root wrapper, so F6 is a
  move), the text of the focused text field (`focusedText`, counted as a text change only while the focus
  stays on the same element: a key that also moves the focus reads as a focus move), and a key that only
  switches a mode (`then` presses the key that shows the mode). The column menu's Filter by value list
  is a grid of its own: the snapshot reads its highlighted item and its checked values while the menu is
  open, because its keys change only those. The editor's text, caret and list read
  `null` while it is closed, so they count as changed only while the editor stays open: a key that
  closes the editor closed it, and a probe that expects an edit reads that as another effect.
- **A probe's step is its id.** A probe finding has a step and no selector (`probeStep()`): the
  documented keys, the key with the steps of its own (`F6 after F6`), the steps after it, and where the
  focus starts. No two presses of one page share a step (a tooling test checks it), because two findings
  that share an id read as one in a diff between runs.
- **A probe that could not run is a problem, never a pass.** A probe whose setup fails, one the page threw
  on (the error explains what the probe saw), and one skipped because the test is close to its timeout
  are tooling problems of that probe, and the others keep their findings; the target then evaluates no
  criterion. The probes stop early enough for the evidence to be attached: a setup that waits its full
  timeout on every probe would otherwise run the test out of time and lose everything.
- **2.1.4 is measured, not assumed.** With the grid holding a selection and the focus on the sentinel
  outside it, printable keys must change nothing (a key that changed nothing on a grid with no selection
  would prove nothing, so a setup that fails is a problem and 2.1.4 is not credited); and a documented
  shortcut that is a single character with no modifier
  (`singleCharacterShortcuts()`; none today) is listed as advisory, because it must work only while the
  grid has the focus.
- **The tab order has goldens, advisory.** `a11y/tab-order-goldens/<page>.json` holds every walk's stops as
  a reviewer reads them (region, role, name, cell). A difference is `tab-order-changed` (advisory, 2.4.3),
  a page without one `tab-order-golden-missing`. Record them with `HOT_A11Y_UPDATE_GOLDENS=1` and read
  the diff before committing: a golden pins what the grid does, findings included.

### The accessibility-tree snapshots

`a11y/checks/tree-snapshots.spec.ts`, the `tree-snapshots` check: 1.3.1, 1.3.2 and 4.1.2, read from
Chromium's accessibility tree of the grid's root container and its portal, on every page of the catalog
in its state and on every theme. A state whose popups mount in a portal of their own marks that portal
too (hyperformula-ui's `.hfe-popup-portal`), so the check reads every marked portal, in document order,
never only the first. The browser half flattens the tree (`a11y/checks/ax-tree.ts`), the pure
half judges it (`lib/aria-tree.mjs`, tested in `lib/__tests__/aria-tree.test.mjs`).

- **The tree as a screen reader gets it, in reading order.** `Accessibility.getFullAXTree` gives the roles,
  names and order; one `DOMSnapshot.captureSnapshot` gives each node's tag and attributes
  (`aria-rowindex`, `aria-colindex`, `tabindex`, the class), joined by backend node id. An ignored node is
  dropped and its children are read in its place. The axe scan reads the same tree against axe's rules;
  this check reads its order and structure, which no axe rule does. A grid root the tree does not hold
  throws in `flattenAxTree()`: with no node read, the page would pass 1.3.1, 1.3.2 and 4.1.2 with no
  finding, so it is a tooling failure, never a clean target. A portal stays optional.
- **Structure** (`structureFindings()`): the column headers read after the data rows
  (`headers-after-data`, 1.3.2), data rows without their row header while the row headers sit in rows of
  their own (`row-headers-apart`, 1.3.1), one row index exposed by several rows (`row-exposed-twice`,
  1.3.1), cells or rows read out of their index order (1.3.2), a grid role with no row (1.3.1). Today the
  first three show on every grid with headers: the overlay clones put the header row after the master
  table and repeat each row in the row-header clone. They are one root cause, reported per page and
  theme, because the evidence is per page. Each grid is judged on its own rows (a row belongs to its
  nearest grid, treegrid or table ancestor). A list inside the page (the handsontable editor's list, the
  filters' value list) therefore neither adds rows without a header to the grid nor shares its row
  indexes. A grid after the first is named by its place among the grids with rows (`grid 2 in reading
  order`). A row whose own rowgroup is a table head (`thead`) is never a data row: the corner clone
  repeats the head row with its corner cell alone.
- **Names and roles** (`nameFindings()`): a widget role with no name (`unnamed-control`), a column or row
  header with no name (`unnamed-header`), and a tab stop (any node the tree marks focusable, an editable
  region too) the tree gives no role (`focusable-without-role`). An empty grid cell needs no name; an
  element focusable by script only (`tabindex="-1"`, every cell) is not a tab stop. One finding per kind,
  role and element, with its node count. The element is the portal mark for a node in the portal, the tag
  (`unknown` without a DOM element), the first class and the `role` attribute; a cell or a header carries
  no class there, because its classes are rendering state (the selection, the last visible header) and
  would split one finding across themes and runs. A closed cell editor stays in the DOM and in the tree,
  so its input is judged on every page.
- **Goldens, advisory, on the main theme.** `a11y/tree-goldens/<page>.yml` holds Playwright's
  `ariaSnapshot()` of the grid and the portal. The theme changes which rows are drawn, not the roles or
  names, so one theme keeps the goldens and every theme is judged. A difference is
  `tree-snapshot-changed`, with the first line that differs. What the run decides, not the page, is
  masked before the comparison (`maskSnapshot()`): the server's origin reads `<origin>`, the installed
  version `<version>`, and a live status region's message `<announcement>`, so a golden moves for a tree
  change only, on any port and after a version bump. An announcer's message is transient: when the snapshot
  is taken decides which one it reads, and what is announced is the screen reader lane's to judge.
  Record with `HOT_A11Y_UPDATE_GOLDENS=1` (the same switch as the tab-order goldens) and read the diff
  before committing.

### The axe discovery run

`a11y/checks/axe-discovery.spec.ts`, the `axe-discovery` check, nightly only: axe with the
best-practice, AAA and experimental rules beside the WCAG 2.2 A and AA ones (`DISCOVERY_TAGS` in
`lib/axe-discovery.mjs`, tested in `lib/__tests__/axe-discovery.test.mjs`).

- **Triage, never the gate.** It reads and writes nothing of `a11y/axe-baseline.json` and never posts to
  `A11y / axe report`; its verdict is `A11y / axe-discovery report`. Its registry entry is `triage: true`
  with no criteria, and its document says `triage: true` with an empty `summary.byCriterion`, because what
  it lists is for a person or the agent grader to sort, not for the conformance report to cite as it
  stands. Its records keep the criteria axe tags them with, for sorting. A rule the gating scan already
  runs shows here too (on states and variants the scan does not reach), and each record names its family
  (`wcag-a-aa`, `wcag-aaa`, `best-practice`, `experimental`).
- **Every "needs review" result is listed with axe's reason.** `incomplete` is what axe could not decide;
  the gating scan only counts it. Here each one is an advisory `axe-needs-review` record per rule,
  element shape and cause (`nodeCause()`: the axe check behind its first message, and that check's
  message key), with the node count, an example selector and the first node's message in its `reason`.
  The message is never part of the key: axe writes per-node values into some (a size in px, an
  `aria-controls` id that carries the instance's random guid), which would split one finding per node and
  change its id every run. A violation is an `axe-violation` record per rule and element shape, at axe's
  impact. The summary counts the records by rule and kind, so what axe decided stays apart from what it
  could not. A best-practice rule maps to no WCAG criterion, so its record carries an empty `criteria`
  list, which the evidence shape allows on a triage check's record only and counts as
  `summary.withoutCriterion`; on any other check such a finding is malformed.
- **More states, in a list of its own.** `a11y/checks/discovery-pages.mjs` adds what no catalog page
  holds still: a cell focused from the keyboard, a hovered header button, the column menu of a sortable
  grid, a focused option of the filter value list, two selected ranges, a submenu inside a submenu
  (`keyboard-shortcuts.html?menu=nested`), a sheet tab being renamed, a modal dialog holding the focus,
  and a column move and a column resize mid-drag, scanned with the pointer still held because their
  guides exist only then. A page added there never reaches the gating scan's baseline, and its records
  name its entry there (`file`, `line`), so the check run annotates them on it rather than on
  `a11y/pages.mjs`. The openers are `DISCOVERY_STATES` in the spec; the catalog's come from the harness.
  They press keys where a key reaches the state, and use the API or the pointer where the surface, not
  the path to it, is what the scan needs: a hover, a drag, a second range, a renamed sheet tab, a dialog
  holding the focus.
- **Every page in the dark scheme, right to left, and on a second phone.** Dark runs on every theme: a
  script installed before the fixture loads turns each `ht-theme-<name>` class the page or the grid writes
  into its dark form, so the grid and its portal are built dark (`?scheme=dark` reaches only the fixtures
  that read it). Right to left runs on the main theme: the fixture is served with `dir="rtl"` on `<html>`
  and with the query it reads (`?dir=rtl`, `?rtl=1`, `?direction=rtl`, found in its source by
  `rightToLeftQuery()`). The phone page runs on a Pixel 7 beside the iPhone 13. A variant that did not
  apply (no dark class on the grid, or a grid still left to right) fails its test before axe runs, a
  tooling error the document lists as a target not measured, so it never reads as a clean pass.

### Focus appearance and non-text contrast

`a11y/checks/focus-contrast.spec.ts`, the `focus-contrast` check: 2.4.7, 2.4.11 and 1.4.11 on every
theme, light and dark (the dark variant is the discovery run's, `a11y/checks/variants.ts`). The spec
captures pixels; the arithmetic and the verdicts are `lib/contrast.mjs` (tested in
`lib/__tests__/contrast.test.mjs`). `PLAN` in the spec says which page is measured for what.

- **Each measure starts from the catalog's state, and a record cites only what it measured.** A page
  whose state is `none` is put back as it loaded before each measure after the first (no selection, no
  focus, scrolled to the top-left: `resetState()`), because a cell left selected highlights the header the
  next measure reads, and a control left focused draws its ring over the icon measured next. A menu or
  editor page keeps its state. A measure that could not be set up (no cell to the right of the start
  cell, no part matching a selector of the plan) adds its criteria to nothing and its reason to the
  record's `problems`: a criterion counted as evaluated with nothing measured reads as a pass. A dark
  record whose `ht-theme-<name>-dark` class never reached the grid measures nothing and says so
  (`variantApplied: false`, and a problem), as in the discovery run.
- **Pixels, not computed styles.** The themes paint with translucent colors and `color-mix()`, so the
  color a user sees is the composited pixel. A capture is a `page.screenshot()` clip decoded by the page's
  own canvas; the device scale factor is 1, so a clip pixel is a CSS pixel. WCAG 2.2's relative luminance
  (the 0.04045 threshold) and a strict `< 3`: 2.996:1 fails, and a finding shows its ratio rounded down
  (`floorRatio()`, 2.99), so a failing ratio never reads as 3:1.
- **A focus indicator is what changed.** The same area is captured before the focus arrives and after it
  arrives by the keyboard (an arrow key for a cell; a key press, then the focus, for a control, which is
  what makes `:focus-visible` match), and the changed pixels are the indicator (`indicatorChange()`).
  A cell's area is captured before with nothing selected, because the starting cell's ring reaches into
  the margin and the pixels it gives back would count as a change. Nothing changed is
  `focus-not-visible` (2.4.7). A ring or an outline is judged against the colors next to it
  (`adjacentRatio`, the most common unchanged pixel of the margin around the element), because a ring
  drawn over a grid line would read 1.92:1 against the line and 3.08:1 against the cell beside it, and
  1.4.11 asks for the second; the margin, not the whole capture, because a filled button fills most of
  its capture and a ring around it would read against the fill. A highlight that repaints the element
  itself (a menu item) is judged against what it replaced. Under 3:1 is `focus-indicator-contrast`, and
  it names the two colors its ratio is between. A control is named by its tag, its class and its label,
  and a second control with the same name in one target gets an ordinal (`distinctName()`,
  `button.ht-button "Action" (2)`): a finding's id keys on its element, and two findings that share an id
  are a problem of the document.
- **Parts that identify a component or its state**: the selection outline and the grid lines are the
  strongest pixel against the area's dominant color (`strongestPixel()`). Checkboxes and icons are read
  from the pixels inside their own box (`partContrast()`), because header text beside an icon reaches
  into the margin and would pass it: an icon against what it sits on, a checkbox's edge against the cell
  around it, and a checked box's mark against its fill, the weaker of the two. A part another element
  covers at its center, a disabled control (1.4.11 exempts it) and a part the browser does not paint
  (`checkVisibility()`: `visibility: hidden`, opacity 0) are skipped; a painted part is measured however
  faint, because under 1.05:1 is the worst failure, not nothing. A grid line that draws nothing
  (`isDrawn()`, a theme that leaves it out) is skipped. A grid line is `moderate`: it identifies a cell
  only where nothing else does. Measure the element that draws the glyph: the sort arrow is
  `.ht-sort-indicator`, drawn only while its column is sorted, so the plan sorts a column first (`sort`).
- **2.4.11 walks the focus.** On the pages with frozen panes and bars, the keyboard moves the focus across
  the grid and into its far corner and back; after each key 25 points of the focused cell are sampled with
  `elementFromPoint()`. The cell sampled is the topmost copy (`getCell(row, col, true)`): a frozen row is
  drawn by an overlay clone above the master, and sampling the master's copy read every frozen cell as
  hidden. Only the points inside the window are sampled: a point outside it is covered by nothing. A cell
  covered at every sampled point is `focus-obscured`; a cell with no sampled point inside the window (off
  screen, or at most a sixth of it at the window's edge) is `focus-off-screen` (2.4.7). Two keys of the
  walk can land on one cell, so its findings are one per cell.

### Zoom, reflow, text spacing, and hover content

`a11y/checks/reflow.spec.ts`, the `reflow` check: 1.3.4, 1.4.4, 1.4.10, 1.4.12, and 1.4.13 on every
theme. The spec measures boxes; `lib/reflow.mjs` (tested in `lib/__tests__/reflow.test.mjs`) decides what
counts as lost content.

- **Three conditions, each a viewport** (`CONDITIONS`): 320 by 256 CSS px for 1.4.10 (a 1280 by 1024
  window at 400%), 640 by 512 for 1.4.4 (200%), and the WCAG text-spacing override (`TEXT_SPACING_CSS`) for
  1.4.12, injected as a stylesheet as soon as the document has a head, so the grid measures its rows with
  it the way it would under a user's stylesheet. Each runs over the plain grid and the pages with a
  surface of their own around it (`PAGES` in the spec). Left out: the pages whose surfaces lie inside the
  grid's own box (the freeze bars on the freeze lines and header corners, the selection handles, the
  links, checkboxes, and pending indicator in cells, and the grid shapes, the right-to-left grid among
  them), which move with the grid when it scrolls in two dimensions; the editors whose control is a
  native one in the cell (text, password, select, and the date and time editors); the dropdown and
  handsontable editors, which open the same one-column `.handsontableEditor` list as the autocomplete
  editor on that fixture; the dark pages, because a color scheme changes no box; and the right-to-left
  menu, whose fixture lays several wide grids on one page, so the page would scroll sideways for the
  fixture's sake.
- **A grid its fixture pins wider than the viewport is measured at the page's width.** A fixture that
  sets a pixel `width` wider than the viewport gets `width: '100%'` before the state is reached (`fitted`
  in the detail). With a pixel width the bars and the overlays follow the grid's own box, so they would
  reach past the viewport because of the test page: the page's layout, not the grid's reflow.
- **The grid body is exempt; everything around it is measured.** A data grid may scroll in two
  dimensions, so the main grid's tables are left out. The menus, the editors' lists, the comment editor,
  dialogs, notifications, the bars and the overlays are measured for text a clipping container cuts off
  (`text-clipped`; `text-truncated`, moderate, when the container ends it with an ellipsis), surfaces the
  viewport cuts off, and controls drawn over each other (`controls-overlap`, judged on the part of each
  box its clipping ancestors leave on screen, never between a control and one inside it, and only between
  two controls on the same layer: the page outside every popup is one layer and each popup element is one
  of its own, because a popup lies over what is under it by design, the page or another popup (a submenu
  over its menu), and Escape closes it). The formula builder's suggestion list and function help count as popups and its formula bar as a
  bar. A layer that covers the whole grid (the dialog's, the notification's) has the grid's box, so it is
  measured by the part a user reads: the dialog's card and each toast. A screen-reader-only box (one pixel
  square, like the announcer's live regions) is never text cut off: its text is read out, not drawn.
- **Where a surface is decides what reaching past the viewport means.** A surface positioned against the
  viewport (`position: fixed`, read from the computed style) that reaches past it cannot be scrolled to
  (`outside-viewport`). Any other surface is placed in the page's own coordinates (its box plus the scroll
  offset), and scrolling reaches from the page's origin to its scroll size and no further: a part before
  the origin (a menu flipped left of or above the page) or past the scroll size is `outside-viewport`
  too. Within reach, a surface past the right edge needs a sideways scroll (`needs-horizontal-scroll`),
  the second scroll direction 1.4.10 does not allow outside a data table. That is a finding at 320 px
  only: 1.4.4 and 1.4.12 ask for no loss of content, and a sideways scroll loses none. Past the bottom
  edge a surface is a vertical scroll away, which is allowed.
- **Every finding names its element apart from the others.** A finding's id keys on its selector, and
  two findings with one id read as one in a compare between runs. The spec names an element by its tag,
  its first class, and its label, so two items of one measurement can share a name (the context menu and
  its submenu are both `div.htMenu`): the second and later get an ordinal (`div.htMenu (2)`,
  `nameApart()`), among the surfaces, the controls, and the clipping containers alike. A
  `controls-overlap` names both controls (`a × b`), so one control over two neighbors is two findings.
- **A measurement is taken on a settled page.** The spec measures until two measurements three frames
  apart agree (`settled` in the detail). Every check calls `releaseParkedFetches()` (the harness) after
  every `reachState()`, on every page, so a data-provider page added to a check's plan later is measured
  in the same state: it releases the data-provider fixture's parked fetches until none is left, because
  the catalog's opener releases the first fetch only, and whether the next one had landed changed what
  the bars showed between runs. The gating axe scan does not call it, so the state its baseline was taken
  in is unchanged.
- **Hover content** (1.4.13) is the comment of a commented cell: it must appear on hover, stay while the
  pointer moves onto it and while it rests there, and hide on Escape with the pointer still on it. "Stays"
  is measured on a fake clock (`page.clock`, installed once the comment shows), so the comment's own hide
  timers run, and ten seconds pass without a wait. Each property is measured from the comment on screen,
  so one that fails does not decide the next: a comment an earlier step hid is shown again from its cell
  first. A property that still finds no comment is a problem of the target, never a finding, and a
  comment that never appeared is a problem that evaluates no criterion (`criteria: []`).
- **Orientation** (1.3.4): the grid's root must have an area on screen in a 390 by 844 and an 844 by 390
  viewport.

### Forced colors and reduced motion

`a11y/checks/forced-colors-motion.spec.ts`, the `forced-colors-motion` check, nightly only (every page is
watched for five seconds): 2.2.2, 2.3.3 and the forced-colors support of 1.4.1, 1.4.11 and 2.4.7, on
every theme. The spec watches and captures; the verdicts are `lib/motion.mjs` (tested in
`lib/__tests__/motion.test.mjs`).

- **Motion is read from `document.getAnimations()`, frame by frame.** One `requestAnimationFrame` loop in
  the page records every animation it sees running: CSS transitions, CSS animations and script
  animations alike, with the properties they animate, their duration, iterations and target, and when
  they were first and last seen, and when the watch's own first and last frames ran. An endless
  animation's `iterations` is recorded as the string `'Infinity'`: the record goes to the detail as JSON,
  which writes the number as `null`. `page.clock` drives none of them (the trap in "The matrix" above), so
  the watch runs on real time. Motion is a change of position, size or transform for longer than 1 ms
  (`isMotion()`); an opacity or color fade is not, and a duration a reduced-motion rule shrinks to
  (0.01 ms) moves nothing.
- **Every catalog state is watched at rest for five seconds, without the reduced-motion preference**
  (`emulateMedia({ reducedMotion: 'no-preference' })`, the variant `at-rest`). 2.2.2 asks for a way to
  pause what moves on its own, and a theme's `prefers-reduced-motion` rule is not one: a user who never
  set the preference sees the spinner it stops. An animation seen running from the watch's first frame
  to its last, longer than 1 ms, that repeats without end or lasts five seconds or more is
  `moves-over-five-seconds` (2.2.2), moving or blinking alike. The bounds are the watch's frames, never
  its nominal length, so a late first frame hides nothing. The watch at rest evaluates no 2.3.3: that
  criterion is motion an interaction starts, and the interaction runs below own it.
- **An interaction is watched with the preference and without it.** A sheet switch, a dialog shown, a
  notification shown and a context menu opened, each watched for 1.5 seconds under the variants
  `interaction-reduced-motion` and `interaction-motion-allowed` (never `at-rest`, which the watch at rest
  owns, and a target is keyed by its variant). 2.3.3 is AAA, so its findings are `moderate`. The watch
  starts once every animation the load started that ends has ended (`expect.poll` on
  `document.getAnimations()`), so a finite animation the page started on its own, such as a toast a
  fixture shows on load, is never counted as the interaction's. An animation that repeats without end
  never ends and the watch would count it, so an interaction's page must have none. Without the
  preference is the positive control: an interaction that moves there and not under the preference
  proves both that the watch sees motion and that the product honors the preference. The control
  evaluates no criterion, and a control that should move and saw none is a problem of its target
  (`controlProblems()`), never a clean result. An interaction marked `moves` (the sheet switch, the
  notification) should move on a theme whose `--ht-table-transition` is not `0s`; the dialog only fades
  and the context menu appears at once, so neither is expected to. The dialog and notification fixtures
  turn animation off so their states are reached at once, so the check turns it back on (the dialog's
  `animation` setting, the notification's `?animation=1`).
- **Forced colors is a capture, before and after.** With `forcedColors: 'active'` on the shared demo, the
  cell focus, a selected range and a menu item's highlight are captured before and after the keyboard
  reaches them, and the grid lines and the header menu icons at rest. A state that changes no pixel, or a
  part that draws nothing (`isDrawn()`, from `lib/contrast.mjs`), is a finding (`focus-`, `selection-`,
  `menu-highlight-`, `icon-` or `gridlines-lost-in-forced-colors`), and the target evaluates every
  criterion those findings name (`FORCED_COLORS_CRITERIA`: 1.4.1, 1.4.11 and 2.4.7), so a criterion never
  shows a finding with no target evaluating it. Every capture is attached as a PNG to the test, for the
  person who reads the report. Chromium's emulation applies the system colors the way Windows High
  Contrast does; the colors themselves are the emulation's, not a Windows theme's.

### Pointer and drag alternatives

`a11y/checks/pointer.spec.ts`, the `pointer` check: 2.5.1, 2.5.2 and 2.5.7, and 2.1.1 for every drag (a
key path must do all it does), on the main theme: a pointer works the same on every theme. The browser
half presses and drags (`pointer-state.ts`, `drag-runner.ts`); the verdicts are `lib/pointer.mjs` (tested in
`lib/__tests__/pointer.test.mjs`).

- **Pointer cancellation is the press compared with the click.** On every catalog page in its state,
  one control of each kind the grid and its portal draw (tag, first class and role; at most twelve) is
  clicked on a page as it loads, which is the positive control: a control whose click changes nothing
  the state reads is not measured, unless its press acts. Then, on another page as it loads, it is pressed, the pointer moves
  to a corner away from the grid and is released. What the press alone did is `activates-on-press`
  (advisory when all it did is show a popup, which Escape takes back); doing what the click does after
  the pointer left is `completes-after-pointer-left`. A selection, a focus move or a hover highlight is
  never an action: a press on a cell selects it by design. The state before the press, and before the
  click, is read once the hover has held still (`settledPointerState()`): a hovered menu item opens its
  submenu on a 300 ms timer, and a state read the moment the pointer arrives blamed the press for it
  whenever the run was slow. The controls in the grid's own cells and
  headers are judged through the data, the sort and the collapsed groups, never through their drawn
  `checked` or `aria-*` states: a press dragged off a cell scrolls the grid, and the scroll redraws
  other rows into the same nodes. A reload parks the pointer off the grid first, and a control is
  measured on a reload only when the reload marked the same control under its id: an id is a place in
  the marking order, so one control more or less hands it to another. A control is not measured either
  when the grid or its portal covers every corner of the viewport, since no release is away from it.
  Every load of a test writes to one page error list, which is checked once each click or release is done:
  the test passes it to every `openTarget()`, so an error between two loads is never lost.
- **With a menu, a dialog or an editor open, only the controls inside it are measured.** A press
  anywhere else dismisses what is open (and commits an editor) on the press, by design, and those
  controls are measured on the pages where nothing is open. A link counts its click instead of
  navigating (`installSentinels()`).
- **Every drag the product does is in `a11y/checks/drag-operations.mjs`**, with every way to do it
  without a drag that the product has today: its input (`single-pointer`, `keyboard`, or
  `pointer-modifier`, a click with a key held, which is neither), whether it covers the whole drag or a
  part, and the steps that perform it. The spec performs the drag first, and a drag that does not have
  the effect the entry names is a red test: the inventory is wrong. Each alternative then runs on a page
  as it loads and is proven when it has the same effect and, for one that covers the whole drag, leaves
  the compared field (the data, the selection, the sheet order, the open editor's text) exactly as the drag left it. 2.5.7 needs
  a proven single-pointer alternative that covers the whole drag, and 2.1.1 a proven keyboard one that
  covers it too: a key path that does part of it (cut and paste for a move that carries cell meta) is
  not all of the function. A listed alternative that did not work is `alternative-does-not-work`,
  advisory for a click with a key held, which meets neither criterion anyway. So is one whose steps
  could not run: the throw is caught, its cause goes in the detail and the problems, and the drag's own
  findings stand, so a person tells a stale inventory from a broken product. A page that threw is not
  caught: each load's errors are checked once its steps are done, and the test fails, as
  `attachEvidence()` fails a page that threw. An operation with no alternative lists none, and that
  absence is the finding. A drag target evaluates 2.1.1 and 2.5.7, a path-based or multipoint one 2.5.1
  (`operationCriteria()`), and a drag finding is annotated on its entry's line in the inventory.
- **The tooling test keeps the inventory complete.** It reads `handsontable/src/plugins/`, and a plugin
  that follows the pointer must be in the inventory or in `NOT_DRAG` with its reason: one that listens
  to `mousemove`, `pointermove` or `touchmove`, registers a cell mouse-over hook (a drag across cells or
  headers, like the nested-header column selection), or imports a module under `src/utils/` that
  listens (the resize drags live in `utils/manualResize/resizeGesture.ts`). A reason for a plugin that
  no longer follows the pointer fails as stale. `inventoryProblems()` refuses a `compare` that is not a
  field of the drag state (`DRAG_FIELDS`): a misspelled one reads `undefined` after the drag and after
  the alternative alike, and every full alternative would pass on its effect alone. A new drag
  is accounted for in the change that adds it. A path-based or multipoint gesture goes in with its
  `gesture`, and 2.5.1 judges it like 2.5.7 judges a drag; the product has none today (a long press and
  a double tap are time-based, single-point gestures). The inventory is a target of its own for 2.5.1
  (`gestureInventory()`): since the tooling test keeps it complete, its count of path-based and
  multipoint gestures is the evidence for the product as a whole.
- **A step that acts on a timer is read until it lands.** The double-click autofit runs from a 500 ms
  timer and a sheet tab settles after its transition, so the state after the last step is read until the
  effect shows, for two seconds at most; a read that throws is a tooling error with its cause, never a
  missing effect. Every step but the last sets up, and an alternative's `prepare`
  sets up what a partial alternative undoes (a wide column for the autofit, empty cells for the
  copy-down) through the API, never with a drag.

### Adding a check

Add its entry to `EVIDENCE_CHECKS` in `lib/a11y-evidence.mjs`, keyed by the check's id: its `title`,
its `spec` (the file name under `a11y/checks/`), the `criteria` it evidences, and `pullRequest` (whether
the short suite runs it, which it earns by finishing in under two minutes). The config builds one project
per entry from that list (`checksForRun()`), so never add a project by hand: it would run the check
twice. Then add its spec to `a11y/checks/`. Write the measurer or matcher as a pure function with a tooling test that is red
before the function exists. Prove the check on the product with a planted defect (a fixture hook that
removes a focus ring or a name), shown in the check run of a dispatch from its branch
(`gh workflow run a11y-nightly.yml --ref <branch> -f checks=<id>`, which runs that check alone and posts
on the branch's head commit, so the check run shows on the pull request, whose own pipeline runs the
axe scan alone), then reverted. Document
its rules here, its line in `handsontable/.ai/TESTING.md` and its job in `.ai/CI.md`.

## A11y: the docs site scan

The product scan reads fixture pages; the conformance report's documentation rows are about the docs site
readers use. `a11y/docs/docs-axe.spec.ts` runs axe-core over the pages of `a11y/docs/pages.mjs` on a
deployed docs site, in the site's light and dark color schemes, with the product scan's rule set
(`WCAG_TAGS` in `a11y/axe-scan.ts`, shared by both specs), and `reporters/a11y.ts` with `suite: 'docs'`
compares the run with `a11y/docs/docs-baseline.json`. The comparator, the fingerprint, the reports and the
findings document are the product scan's (`lib/a11y-suites.mjs` says what differs: the pages, the themes,
the files, the links), so the baseline, the remedies and the rules of "The baseline: known issues and their
findings" apply as written. Locally: `npm --prefix tests run test:a11y-docs`; CI:
`.github/workflows/docs-a11y.yml`.

- **It reads a deploy, never a build.** `DOCS_A11Y_BASE_URL` names the deploy, `/docs` included: the
  staging deploy of develop by default, a pull request's preview, or `http://localhost:4321/docs` for a
  local `npm --prefix docs run preview`. `docsBaseUrl()` refuses anything but https (or a local http
  preview), credentials, a query or a fragment, because a dispatch input lands there. The baseline is taken
  from the staging deploy, so a run against another deploy reads what that deploy changed as new or fixed.
  `a11y-findings.json` names the deploy (`baseUrl`), and the findings ledger records a scan of the staging
  deploy only: a develop dispatch against a preview would otherwise open and resolve the staging rows.
- **Every page the visual list enumerates, one framework each, and the chrome in its states.** The guide
  pages come from `docs/tests/paths.js`, the list the docs visual suite photographs, so a page added there
  is scanned with no second list. The chrome and the prose are the same in every framework, so a page is
  scanned in JavaScript where it has one; the accessibility guide and the conformance report are scanned in
  all four, because the README and the website link each. Beside them: the API reference and recipe
  templates, the not-found page (answering 404), and the header in the states a reader opens from the
  keyboard (the version and support menus, the docs assistant, the phone navigation at 390 px). The search
  dialog exists in production builds only: on any other deploy that page attaches no scan and is listed as
  not scanned, so its entries read as unverified, never as fixed.
- **The whole document, as a reader gets it.** No include: the header, the sidebar, the table of contents,
  the prose, the code blocks and every example with the grid inside it. A test waits for the examples to
  finish loading (no `.hot-example-preview--loading`), the fonts and two frames, and checks the color scheme
  took (`data-theme`). After the state, `settle()` waits for every finite animation to end (bounded, and
  an animation still running names itself in the failure), for the code blocks' script to make every
  overflowing block focusable, and for the DOM to hold still for 30 frames in a row, counted inside one
  `evaluate` (`waitForFunction()` does not await a promise its predicate returns). A state waits for the
  sign that it opened, never for an element that is there all along: the docs assistant's panel is in the
  DOM before it opens, so the state waits for the focus in its text field. Third-party widgets that draw late, from a live service, or by region are blocked
  (`BLOCKED_HOSTS`: the changelog bell, the consent banner, the GitHub stars count, the error reporter), so
  two runs of one deploy agree; the scan says nothing about them.
- **Report-only, and a red job is tooling.** A finding never fails a test. A page that answers with the
  wrong status, sits behind the deploy's password wall, never finishes loading its examples or does not
  take the color scheme fails its test; a page error is recorded with the scan and annotated, because it is
  the site's bug, not the scan's.
- **On demand.** A full run is 350 scans and takes five minutes or more, longer than a docs pull request
  should wait, so `docs-a11y.yml` runs on a dispatch (`gh workflow run docs-a11y.yml --ref develop`, or
  `-f base-url=<deploy>`), from a workflow that calls it (`workflow_call`), and on a pull request that
  changes the scan itself (its workflow, `a11y/docs/`, its config). It never runs on a schedule or on a
  change to the docs. A dispatch on develop is a night of the findings ledger's `docs` source; a dispatch
  from a branch and a pull request's run are proof runs. A page that answers with a 5xx was caught in a
  staging deploy: run again once it is done. The findings land in `docs-a11y-axe-results` (`a11y-findings.json` at its root), and the HTML
  report is `docs-a11y-report.html`, uploaded unzipped: an unzipped artifact is named after its file, and a
  run that calls both scans uploads both reports.
- **A pull request is red only for what it caused.** A pull request's run reads the staging deploy of develop, never
  the pull request's own docs, so a new or grown finding there exists on develop's docs already unless the pull
  request's scan code made it. Docs merges add such drift every day. So `A11y / docs-axe report` (posted by the scan
  job, `scripts/a11y-check-run.mjs --suite docs`) reads develop's latest docs audit from the findings ledger
  (`lib/a11y-docs-drift.mjs`: the docs rows sighted on the latest docs night that read the scan, keyed by rule,
  page, scheme and masked element; a night of the checks alone sighted none, so it is never the audit), and on a
  change run a new finding that audit saw counts as a warning at most, with the remedy in the summary: refresh the
  baseline from that audit (the summary gives the command with the audit's run id, "A refresh is one command"
  below). A grown finding keeps its severity, and the summary says why: the ledger keeps no node count of a docs
  finding, so the audit cannot tell develop's docs growing it from the change growing it. A finding the audit did
  not see keeps its severity: this change made it, or the docs gained it after the audit, and when the staging
  deploy is newer than the audit the summary says so and names the dispatch that measures it (`gh workflow run
  docs-a11y.yml --ref develop`). A ledger that cannot be read, or holds no docs night that read the scan, leaves
  every finding at its severity and says why. An audit run (a dispatch) counts every open finding, drift or not.
- **Taking or refreshing the baseline.** Run the whole scan with `DOCS_A11Y_SCREENSHOTS=0`: with an empty or
  stale baseline every finding is new, every scan would be photographed, and the HTML report runs to
  hundreds of megabytes. Group the findings into issues whose titles say what is wrong, with no task id;
  a `tracker` waits until someone files the task. Findings on the docs site are recorded here and fixed in
  `docs/`, never in the change that adds or refreshes the scan.
- **A refresh is one command, never a hand edit.** Every docs merge can add or remove findings, so the
  baseline drifts with the docs. `node tests/scripts/a11y-docs-baseline.mjs --run <run-id>` rewrites it from
  that run's `docs-a11y-axe-results` (`--scans <folder>` for a local run, `--dry-run` to read the changes
  first). It compares the run's scans with the file through the scan's own comparator, so whichever
  baseline the run compared against makes no difference. It takes every count and impact from the run,
  deletes a finding the run no longer found, adds a new one under the issue its rule and target already
  belong to, and keeps the entries of a page the run did not scan. It drops the entries of a page that left
  the page list (`docs/tests/paths.js` or `EXTRA_PAGES`), since nothing scans it again. It writes nothing
  when a scan read another deploy than staging, or when a new finding's rule and target belong to no issue
  yet: name that issue, add the listed entries under it, and run it again. The file stays in the order and
  form the script writes (`lib/__tests__/a11y-docs-baseline.test.mjs`), so a refresh diff holds the changed
  lines only. Refresh from a develop dispatch with no staging deploy in flight
  (`gh run list --workflow docs-staging.yml`): a deploy between that run and the pull request's own scan
  reads as new findings again.
- **The checks beyond axe of the docs are their own tier.** The keyboard, the structure, focus and contrast,
  reflow, forced colors and motion of the docs site are "A11y: the site checks beyond axe" below; they open a
  page the way this scan does (`a11y/docs/docs-site.ts`: the blocked hosts, the color scheme, `settle()`, the
  states), so a check and the scan read one DOM.

## A11y: the site checks beyond axe

The product checks (`a11y/checks/`) bracket a grid's root with sentinels and open fixture targets; a site has
neither. `a11y/sites/` measures a deployed site the same way, the whole document as the product, and writes the
same evidence document per check (`mergeEvidence()`, "A11y: the checks beyond axe"), so the conformance report
cites a site check as it cites a product one. One config, `playwright.a11y-sites.config.ts`, runs one site per run
(`HOT_A11Y_SITE`, `docs` when unset), one project per check of `SITE_CHECKS` (`lib/a11y-site-checks.mjs`) for that
site. A site check is named by its site and kind (`docs-keyboard`), so its check run (`A11y / docs-keyboard
report`), its ledger rows (the `docs-checks` source) and its catalog rules never meet the product's. The sites,
their sample pages, popups, help controls and link normalization are one definition each (`a11y/sites/sites.ts`);
a site added later adds its definition, its registry entries and nothing in a spec. Locally:
`npm --prefix tests run test:a11y-sites` (`-- --project=docs-keyboard` for one check, `DOCS_A11Y_BASE_URL` for
another deploy); CI: the `checks` job of `.github/workflows/docs-a11y.yml`.

- **The same pages, opened the same way, as the docs scan.** `SITE.open()` is `openDocsPage()`: the viewport, the
  blocked hosts, the color scheme before the first paint, the status, the password wall, the examples loaded and
  the scheme taken. Service workers are blocked (`serviceWorkers: 'block'`), so every request goes through the
  routing. Smooth scrolling is turned off for the checks that walk (`instantScrolling()`): the docs set
  `scroll-behavior: smooth`, and a stop read two frames after Tab read the element before it arrived on screen,
  so most stops of a long page read as off screen. It changes nothing that shows at rest.
- **Every page, or a sample.** The structure and reflow checks read every page at rest (`SITE.pages`, 171 on the
  docs). The keyboard, focus-contrast and forced-colors checks walk the sample (`SITE.sample`): one page per
  template and framework variant, each header popup in its state, and the introduction on production, the one
  build with search. The API template is walked on a plugin's page: the Core page holds thousands of stops, the
  same template many times over. A theme moves no stop and no box, so only the focus-contrast check runs both
  color schemes.
- **An embedded grid is one region.** A stop inside an example grid is `grid`: the walk does not judge it (the
  product checks own the grid), and after `GRID_STOPS` such stops in a row it takes the documented way out
  (Ctrl+End, then Tab). A grid that still holds the walk after as many again is `grid-holds-focus` (2.1.2), and
  the walk goes on from the first element past it, so the rest of the page is still measured. The budget counts
  each grid's stops twice over, so a page whose walk ran out of presses is a tooling problem, never a trap.
- **A walk short of the end measured part of the page.** A walk that ran out of presses, whose Tab loaded another
  page, or that found nothing past a grid holding it, is a tooling problem (`walkProblem()`): its target is not
  measured, so the ledger resolves no row on a stop it never reached. After a Tab that loaded another page, the
  check opens its page again before it measures anything else.
- **One finding per kind of element per page.** A stop is reported once per shape (tag, first class that is no
  build hash, role) with a count, and a reflow finding once per kind, element kind and condition: the same
  defect on a hundred sidebar links, or on a hundred checkboxes of the hooks list, is one finding. Names never
  carry an element's id or text, which would make each element its own finding.
- **`<site>-structure`** (`structure.spec.ts`, `structure-read.ts`, judged by `lib/site-structure.mjs`): the title,
  the language, the headings, the landmarks, the skip links and the links, read once per page as the
  accessibility tree exposes them (an element under `aria-hidden`, `inert` or `hidden`, or not rendered, is left
  out). 2.4.2's duplicates compare each title with every page's, read from the start of each page's HTML once
  per worker; the same address at another viewport is the same page. 2.4.5 counts the navigation that links the
  page and the site's search, read once per worker from the page that holds it; a search that could not be read
  is a problem of the reference page, and no page evaluates 2.4.5 that run. 3.2.3, 3.2.4 and 3.2.6 compare each
  page with the site's reference page at the same viewport: the shared links of each header and footer
  navigation in the same order (a link added or left out keeps the order), one name per target within one
  landmark (the framework switcher's tab and the header's section link are two controls), and the help controls
  in the same order. 2.4.4 is advisory: a link named "here" or "read more" says nothing in a screen reader's list
  of links, and a person reads the text around it.
- **`<site>-keyboard`** (`keyboard.spec.ts`, judged by `lib/site-keyboard.mjs`): Tab from a sentinel before the
  page to one after it, each stop's role and name read over CDP. The start sentinel has `tabindex="1"`, so the walk
  passes every positive tabindex first, as the browser orders them. A stop nobody can see (no size, opacity 0,
  clipped by an ancestor, outside the page, or a fixed layer moved out of the viewport, which is how a closed
  panel that slides away keeps its controls rendered) is `focus-stop-hidden` (2.4.3, 2.4.7); one under
  `aria-hidden`, one whose role needs a name and has none, and one with no role are 4.1.2. Then the skip link
  (the first stop, visible on focus, and its next Tab inside the main content), the controls a click acts on that
  no key reaches (a widget role or an `onclick` with no way to focus it, outside a composite widget whose items
  the arrow keys reach), an input on each kind of form control the walk passed, and, on the site's shortcut
  pages, every printable key with nothing focused (2.1.4), the page reloaded after a key that acted. A popup
  state opens its popup from the keyboard and is judged on whether Tab or ArrowDown reaches an item, whether a
  modal holds the focus, and whether Escape closes it (judged once the page holds still: a panel that slides
  away is on screen until its animation ends) and gives the focus back to its trigger.
- **`<site>-focus-contrast`** (`focus-contrast.spec.ts`, `focus.ts`): 2.4.11 from a Tab walk forward and one back
  with Shift+Tab (going back, the browser scrolls a stop to the top of the viewport, under a sticky header), 25
  points of each stop sampled with `elementFromPoint()`; a stop the keyboard check calls hidden is its finding,
  never sampled here. The indicator of the first stop of each shape is captured with nothing focused and again
  after a key press and the focus (what makes `:focus-visible` match), and judged by `focusFindings()` of
  `lib/contrast.mjs`; a text field's or a select's boundary and fill against the page around it
  (`boundaryFindings()`, 1.4.11). A popup state is left out: its items' indicators touch each other and the
  trigger's, so no capture before the focus is clean.
- **`<site>-reflow`** (`reflow.spec.ts`): one load per page, resized through `CONDITIONS` of `lib/reflow.mjs` and
  then given the text-spacing override, plus both orientations (1.3.4). At 320 px the page must not scroll
  sideways (`page-scrolls-sideways`, naming the widest element that pushes it): a scroll container, a data table
  and preformatted code are the two-dimensional content 1.4.10 exempts. Under every condition: text an
  `overflow: hidden` or `clip` container cuts off, read from each text node's box against its container's
  (`text-truncated` when an ellipsis ends it), controls drawn over each other on one layer (a link that wraps
  onto two lines has one box around both lines, so it is left out, and so is a control in a fixed layer outside
  the viewport), and a fixed layer whose text reaches past the viewport where scrolling cannot bring it: its
  text, not its box, since a column can be wider than what it holds, and text inside a scroll area is reachable
  while the area shows.
- **`<site>-forced-colors-motion`** (`forced-colors-motion.spec.ts`): each sample page at rest watched for five
  seconds without the reduced-motion preference (2.2.2, the product check's watch, `a11y/checks/animations.ts`),
  from two frames after load, never after `SITE.settle()`: a settle waits for finite animations to end, so it
  would wait out the ones the watch is for;
  each popup opened with the preference and without it (2.3.3; the run without it evaluates nothing); and, with
  forced colors on, the indicator of each stop shape (`focus-lost-in-forced-colors`) and each element in a state
  a style shows (`aria-current`, `aria-selected`, `aria-pressed`, `aria-checked`) against a sibling without it:
  a state whose computed style matches the sibling's in forced colors and differed without them is
  `state-lost-in-forced-colors` (1.4.1, moderate: the state still reaches a screen reader, and its place often
  says it, like a breadcrumb's last item). Styles are compared as they paint: a transparent background shows the
  background behind it (forced colors keeps an author's alpha, so a filled item and a transparent sibling are two
  strings and one look), and a border or outline color with no border or outline shows nothing.
- **Where they run: a dispatch or a call of `Docs a11y`, never a pull request.** The `checks` job runs beside the
  scan, against the same deploy (`DOCS_A11Y_BASE_URL`), and uploads `docs-a11y-checks-evidence` (30 days from a
  run of every check, 7 from a subset); `scripts/a11y-evidence-report.mjs` with `HOT_A11Y_SITE=docs` writes the
  summary and posts one `A11y / docs-<check> report` per check, and the scan posts `A11y / docs-axe report`
  (`scripts/a11y-check-run.mjs --suite docs`). The `verdict` job then follows the worst of them, as the A11y
  nightly does. The checks take about 8 minutes on four workers and the scan about 15 (develop dispatches of
  2026-11-10 to 2026-11-12); their steps time out at 30 and 20 minutes, and the jobs' own timeouts are the
  backstop. The checks' `checks` input runs a subset on a
  branch (`gh workflow run docs-a11y.yml --ref <branch> -f checks=docs-keyboard`); `check-inputs` refuses one on
  develop, where the dispatch is the audit. Every document names the deploy it read (`run.baseUrl`), and the
  findings ledger records the staging deploy's only.
- **A check lands with its findings recorded, not fixed.** As for the product checks: what a check finds on the
  docs is listed in its pull request and filed as docs tasks; a finding the check gets wrong is fixed in the
  check. Each check shows a planted defect (a test-side change to the deployed page on a temporary commit,
  reverted before the pull request is ready) in a proof run from its branch.

## A11y: the verdict of a check run

Every accessibility check run follows one rule, `lib/a11y-verdict.mjs`: the axe scan's `A11y / axe report`,
each check's `A11y / <check> report` and each lane's `Screen reader / <project> report`. The modes
(`A11Y_MODE`, `EVIDENCE_MODE`, `SCREENREADER_MODE`) still say whether a finding fails a test or a job,
and in their current values it never does: the verdict lives on the check run, and the run's own verdict
follows its worst check run.

- **Red on critical or serious, a warning on moderate or minor, green on none.** `failure` when a counted
  finding is critical or serious; `neutral`, with a warning annotation per finding, when the worst
  counted finding is moderate or minor; `success` when nothing counts. An `advisory` row (a golden that
  moved, a result axe could not decide, an improved or stale baseline entry) is a notice annotation and
  never raises the verdict. Why this split: axe's impact scale is the one every source already speaks,
  and critical and serious are the findings that keep a user from the content. A check red on every
  minor finding would be red every night and read by nobody. The title states the verdict, the counted
  findings per severity and the rule, then the check's own headline
  (`✖ Red: 2 critical, 1 serious, 0 moderate, 0 minor (critical/serious = red, moderate/minor = warning) · …`).
  The summary opens with the same verdict, what the run counted and a table per severity. A check run
  carries the hundred worst annotations (`capAnnotations()`), and the summary says how many it left out.
- **A tooling failure is red for its own reason, and titled as one.** A check that left no document, one
  that does not validate, a target not measured, a tooling problem in a document, an axe run with a
  tooling problem or no comparison, a reader that did not start, a lost step, a scenario with no
  transcript: `✖ Tooling failure: <the first problem>`, and the summary opens with
  `**Verdict: red, a tooling failure.**`, apart from any finding. A run that proved nothing is never
  green.
- **What counts follows the run** (`countingScope()`, from `GITHUB_EVENT_NAME`, which a called workflow
  reads as its caller's). An **audit** (a schedule or a dispatch: the two nightlies) counts every open
  finding, tracked or not, the axe scan's known baseline findings too, which it annotates on their
  baseline entry: an audit says the truth about the product. A **change** (a pull request, a push, a local
  run) counts what the change can act on. The axe scan counts only a finding new or grown against the
  baseline, and every check counts a finding whose cluster in `a11y/issues.json` (`clusterOf()`) has a
  tracker as a warning at most (`trackedBy()`, which reads a finding the way the ledger does, through
  `catalogFinding()`), so owned debt never turns a pull request's check red. A finding in `needs-triage`, or
  in a cluster without a tracker, counts at its severity. A catalog that does not load tracks nothing and
  says so (`lib/a11y-verdict-inputs.mjs`): it can make a check red, never green.
- **Below the target level is a warning at most.** A finding of a check beyond axe that names no WCAG 2.2
  A or AA criterion (an AAA criterion alone, a best-practice record of the discovery run) is a warning
  whatever its severity, because the target is A and AA (root `AGENTS.md`). One that also names an A or AA
  criterion counts at its severity.
- **A screen reader step is as severe as the worst token group it missed, and a group is serious unless
  its step says otherwise.** A required fact missing from an announcement is a screen reader user not
  told it. A step lowers or raises a group with `"severity": { "<first synonym of the group>": "minor" }`
  beside `expect` (`critical`, `serious`, `moderate` or `minor`, `TOKEN_SEVERITIES`), and its `note` says
  why. The schema refuses any other value, a name that is not the first synonym of exactly one group of
  the step, and an empty declaration, so a renamed group cannot leave its severity on another. The
  transcript carries each group's severity, a transcript without one reads as serious, and the ledger
  records the step at the same severity as its check run. A golden difference and a missing golden are
  advisory.
- **Block and gate fail on any finding.** `A11Y_MODE: 'block'` and `SCREENREADER_MODE: 'gate'` fail the
  check run on any finding that needs action, whatever its severity, as they fail the test.
- **A red check run stops nothing.** It is posted after its job's measurement has run to the end
  (`!cancelled()`), the jobs that measure carry `continue-on-error`, and the screen reader matrices are
  `fail-fast: false`, so every scan and lane finishes and reports before anything says red. Only
  `CI Gate` is required, so a red check run never blocks a merge by itself.
- **The run follows its worst check run.** Each nightly ends on a `verdict` job
  (`scripts/a11y-run-verdict.mjs`, `runVerdict()`). It runs after every other job (`needs`, with
  `!cancelled()`), lists the check runs of the run's commit (`listCheckRuns()`), and keeps the ones its own
  run posted: every poster stamps `GITHUB_RUN_ID` as the check run's `external_id`, and a re-run's check
  run replaces the earlier one of its name. It fails when one is red, when one the run should have posted
  is missing (the A11y nightly expects the axe report and one per check of its suite, the screen reader
  nightly one per lane, and a subset dispatch the checks or lanes it named: `checks`, `projects`, `groups`,
  read with the ref the way the `check-inputs` job read them, so what that job refused is one line here;
  "A11y: the audit and the proof runs"), when the run posted none, or when one ended a way no poster writes. So the run's
  conclusion says what its checks found, and a nightly stays red while its open critical and serious
  findings stand. Slack still hears only of a run that never reached its checks.

Locally, every poster prints its payload with `--dry-run` (set `GITHUB_EVENT_NAME=schedule` to count as an
audit), and `node scripts/a11y-run-verdict.mjs --prefix "A11y / " --dry-run <check-runs.json>` (with
`GITHUB_RUN_ID` set to the runs' `external_id`) reads a saved list of check runs. The rule, the counting
scope, the run verdict and the posters' inputs are pure or near it and tested in
`lib/__tests__/a11y-verdict.test.mjs` and `lib/__tests__/a11y-verdict-inputs.test.mjs`, each builder's
use of them in its own test, and both `verdict` jobs in the workflow tests.

## A11y: the findings ledger and the cluster catalog

A raw night leaves thousands of records (the discovery run alone about 3,900), most of them the same few
defects on many pages, and a check's artifact says nothing about the night before. The findings ledger
accumulates them: `test-health.yml` chains on `A11y nightly`, `Screen reader nightly` and `Docs a11y`, and
the collector reads every check document, the axe findings, every transcript and the docs site scan's
findings of those runs on develop, by dispatch (the audit; "A11y: the audit and the proof runs" below) or
by a schedule, which the two nightlies do not have today, into `test-health/a11y.json` on `gh-pages`, one row per finding across
nights, which the "Accessibility" section of <https://handsontable.github.io/handsontable/test-health/>
draws. The pure half is `.github/scripts/lib/a11y-ledger.mjs`; the catalog that sorts the rows is
`a11y/issues.json`, read through `lib/a11y-issues.mjs`. The CI mechanics (the trigger, the download filter,
the nightly rule, the caps) are in `.ai/CI.md`; this section is the policy.

- **Only the nightlies' evidence is a night.** A pull request's run uploads the same artifacts, made by the
  pull request's own code, and a fork's pull request from the fork's `develop` reports `develop` as its
  branch; recording it would resolve every row its code no longer shows. `isA11yRun()` takes a run of
  `A11y nightly`, `Screen reader nightly` or `Docs a11y`, on develop, started by its schedule or a dispatch,
  and nothing else. The docs night holds the docs site scan (source `docs`) and the docs site checks (source
  `docs-checks`, read from `docs-a11y-checks-evidence` like the product checks, and only when the document's
  `run.baseUrl` is the staging deploy). A run's sources are its workflow's (`SOURCES_OF_WORKFLOW`): a list, so a workflow that
  calls several of the scans names every source its run uploads, and a night of another source is refused.
  A subset dispatch (`checks`, `projects`, `groups`) never becomes a night: the nightlies' `check-inputs`
  job refuses one on develop, because the page draws the latest night of each source and a subset night
  would show what it skipped as gone. The rows themselves are scoped per check document and per project
  and scenario transcript, which the ledger test pins, so even such a night would resolve nothing outside
  what it ran.

- **A finding keeps its identity across nights, or the ledger shows nothing but churn.** A row is keyed by
  its source, check and kind, the axe rule and cause it names, its page, theme, state and variant, and the
  masked selector or step, never by the reason, the severity, the criteria or the baseline issue, which a
  check or a baseline change may reword or refile. Every finding of the gating axe scan is one kind,
  `axe-violation`, read once per location, so a location keeps its row when it grows, shrinks or is
  baselined.
  `maskSelector()` masks what the run decided: a generated instance id (`ht_<hash>`, `wt_<hash>`) becomes
  `ht_*` wherever it sits, a positional index becomes `:nth-child(n)`, and the axe baseline's
  `VOLATILE_CLASSES` (a state, a layer, a layout) are dropped, so one list decides for the baseline's
  fingerprint and the ledger's key. The formula builder is the measured case: it marks each reference's
  cells with a class that carries the instance id (`ht-formula-ref-fill-ht_<hash>-2`), so without the mask
  those findings are gone and new every night. Add a class to `VOLATILE_CLASSES` when a key turns out to
  follow a state; `lib/__tests__/a11y-issues.test.mjs` pins the mask on every class of the list.
- **A row is as severe as its check run counts it.** A check's finding and a reader step carry the
  severity their check run counts. An axe finding, of the product scan and the docs site scan alike,
  baselined or new, is its impact read through the verdict's own `severityOfImpact()` (an impact axe
  did not give is serious): the findings document gives every known location the impact the scan
  gave it. One function, so the severities per cluster and the triage order on the page agree with
  the `A11y / axe report` title of the same audit. An improved entry is the one difference, on
  purpose: the check run lists it as advisory, because its action is a baseline edit, and the ledger
  keeps its impact, because its elements still fail. A findings document written before the
  locations carried their impact leaves those rows without a severity until a night names them.
- **A row is resolved by evidence of absence, never by silence.** A row of the night's source that the
  night did not find is `resolved` only when the night measured its target: for a check, the target
  (page, theme, variant) is `measured` in the check's document with no tooling problem (`problems` > 0
  means a step did not run, and `mergeEvidence()` counts such a target as evaluating no criterion), and no
  finding on it was dropped by the collector; for the axe scan, the document has no tooling problem, no
  unverified page and no entry the collector could not read; for a reader step, the transcript of its
  scenario on its project is there, did not stop and lost no step, and for a golden difference the
  transcript's wording was compared with a golden (`match` or `differs`; `recorded` and `missing` compared
  nothing). Anything less leaves its rows as they were, so a red tooling night never reads as a night of
  fixes. A row seen for the first time is `new`, one seen again `persisting`, and one that comes back after
  being resolved `flapping` until it has been seen `A11Y_FLAP_NIGHTS` nights in a row, the night it came
  back included: a fix that did not hold, or a check that measures unevenly, shows there before it shows
  anywhere else.
- **Nights are read once per attempt, in order.** An attempt already recorded, or a run that completed
  before the latest night of its source, changes nothing: statuses are derived night by night, so a backfill
  (`workflow_dispatch` of `test-health.yml` with the nightly's run id) goes in order. A later attempt of the
  latest night of its source ("Re-run failed jobs", which keeps the run id and replaces the artifacts) fills
  in what the recorded attempt did not measure, against the coverage that night keeps in its record, and
  leaves what the recorded attempt measured as it was: undoing a recorded night would need every row's state
  from before it. The two sources keep their own latest night, because the reader nightly completes an hour
  before the A11y nightly, and a cluster's trend on the page has one series per nightly for the same reason.
- **The catalog sorts every row into one root-cause cluster, and every merge re-sorts.** `a11y/issues.json`
  extends the axe baseline's issue catalog: a cluster has a stable kebab-case `id`, a `title` that says what
  the problem is, an optional `tracker` (a task id, or a list when several tasks own parts of the fix; code,
  never printed on the page, which says only that a cluster is tracked) and `match` rules. A rule names its
  `source` (`checks`, `axe` or `reader`) and any of `checks` (check ids, or reader projects), `kinds`,
  `rules` (axe rule ids), `causes` (the discovery run's needs-review causes), `criteria`, `pages` (patterns
  anchored to the page id, or the scenario), `themes`, `where` (patterns searched in the finding's `where`)
  and `axeIssues` (the baseline issue an axe finding is filed under, or the one the scan suggests for a new
  finding of a known rule and target). Values in a field are ORed, fields in a rule ANDed, rules in a
  cluster ORed. A finding's `where` is its masked selector, its step, or both joined as
  `<masked selector> @ <step>` (a keyboard-walker stop, a probe), so `^` anchors at the selector and `$` at
  the step: write a step pattern without `^` when the finding also names an element. A field no finding of
  the rule's source carries (a reader step has no rule, cause, criterion, theme or baseline issue; a check
  has no baseline issue; the axe scan has no cause) is refused, because the rule could never match. The rows carry `cluster` and `tracker` as the catalog
  says on the night they were last merged, so renaming a cluster or moving a rule is one change to the
  file and takes effect on the next night, with no migration.

  ```json
  {
    "schema": 1,
    "triage": [
      { "shape": "reader|nvda-firefox|token-missing|||sheets-bar|shift-tab-grid", "reason": "Why it is not sorted yet." }
    ],
    "clusters": [
      {
        "id": "dialogs-leak-tab",
        "title": "Tab walks out of an open modal dialog to the content behind it",
        "match": [{ "source": "checks", "checks": ["keyboard-walker"], "kinds": ["focus-leaves-modal"] }]
      }
    ]
  }
  ```

- **One cluster per finding, and the triage count is exact.** A finding no rule matches lands in
  `needs-triage`, which the page lists by shape (check, kind, rule and where, widest first). A finding that
  two rules match is a catalog error: `lib/__tests__/a11y-issues.test.mjs` maps every row of
  `lib/__tests__/fixtures/a11y-findings-sample.json` (one row per distinct finding shape of a real night, with
  the check that had not run yet written by hand and said so) and fails on an ambiguous one, on a cluster
  or a rule that matches nothing in the sample (a cluster leaves the catalog with its last finding, like a
  baseline issue), and on a queue other than the catalog's `triage` list, exactly. Each entry names a queued
  shape as `findingShape()` writes it, with its reason (why it is neither a known cause nor the reader's own
  behavior yet), so the reason sits beside the shape and the limit is the list's length, never a second
  number: an entry leaves when its shape is sorted into a cluster, and joins only visibly, in the change that
  adds it. The validator refuses an entry with no reason, a repeated shape, and a catalog that gives both
  `triage` and the bare `triageLimit` (still read from a catalog that gives the number alone, like the ledger's
  test fixtures). The sample is frozen, so the test also
  checks every id a rule names against its live source: `criteria` against `WCAG_CRITERIA`, `themes` against
  the scan's themes, `axeIssues` against `a11y/axe-baseline.json`, a reader rule's `checks` against the
  projects of `playwright.screenreader.config.ts`, and a check rule's `kinds` against the kinds the checks'
  code can emit. Renaming one of those fails the catalog's test until the catalog follows. On a live night
  the collector raises a `::warning` on its run for a row two clusters match and for a night with more
  triage shapes than the `triage` list holds, which is the sign to refresh the sample and sort the new shapes.
  A rule that exists only for rows an intended change retires (an outdated expectation, a golden recorded
  before the change) says so in its cluster's title and leaves in the change that next refreshes the sample:
  until then it would file a real miss on those steps under the old cause. A
  cluster is a root cause, not a bucket: add one when its findings would be fixed by one change (the
  overlay clones split the tree, the focus is not returned after Escape), name it by what is wrong, and
  put a screen reader's own behavior in a cluster that says so rather than in the queue. The axe baseline's
  issues are clusters here too (`axeIssues`), so the gating scan's known findings and the discovery run's
  records of the same rule land together.
- **The sample is a real night, deduplicated.** To refresh it after a check changes what it records, run the
  collector over the night's artifacts (`gh run download <run id> -n a11y-checks-evidence -n a11y-axe-results`,
  and the `screenreader-transcripts-<project>-<group>` artifacts of a reader nightly), read them with
  `readA11yArtifacts()` and keep one row per `findingShape()` (`source|check|kind|rule|cause|page|where`),
  the fields the matcher reads plus `theme`, `criteria`, `issue` and `severity`; say in `about` which runs it
  came from.
- **Locally, the collector is the dry run.** Download a night's artifacts into one directory per artifact,
  write the run's payload with `gh api repos/handsontable/handsontable/actions/runs/<id>`, and run
  `node .github/scripts/test-health-collect.mjs --run run.json --artifacts <dir> --ledger-dir <scratch>/test-health
  --template .github/test-health/index.template.html --catalog tests/a11y/issues.json`: it writes
  `a11y.json` and the page into the scratch directory and prints the night's counts and clusters. Never
  dispatch `test-health.yml` with a run id to try a change: that publishes to the live site.

## A11y: the audit and the proof runs

The two accessibility workflows, `A11y nightly` (`.github/workflows/a11y-nightly.yml`) and
`Screen reader nightly` (`screenreader-nightly.yml`), have no schedule: they run on `workflow_dispatch`
only, from any ref, and the `pull_request` trigger that validates each file still runs a startup-only
check. The accessibility program runs one audit, fixes what it finds, and re-audits, so a cron would
spend the compute (a headed Windows and macOS runner per browser for the screen reader lanes) on
nights nobody reads. The names stay: the ledger, the Slack text and this file know the workflows as
nightlies, and the tiers come back with the schedule, not before: a pull request runs the axe scan
(today's `test.yml`), a nightly runs a semi-lite set chosen then, and a release candidate and a stable
release run the full set. The CI mechanics are in `.ai/CI.md`; this section is the procedure.

- **An audit is a dispatch on develop with no inputs, and only on develop.** Dispatch the screen reader
  workflow, then the checks (`gh workflow run screenreader-nightly.yml --ref develop`, then
  `gh workflow run a11y-nightly.yml --ref develop`), and the docs site scan when the audit covers the docs
  (`gh workflow run docs-a11y.yml --ref develop`, with no `base-url` and no `checks`, so the ledger records it
  and it runs the docs site checks beside the scan; "A11y: the docs site scan" and "A11y: the site checks beyond
  axe"), wait for all, then dispatch `test-health.yml` with
  each run id in the order the runs completed (`gh workflow run test-health.yml -f run-id=<id>`). The
  `workflow_run` chain collects a develop dispatch on its own; the dispatch is the backfill, and it is
  idempotent (a night collected twice changes nothing, "Nights are read once per attempt, in order"
  above). It publishes to the live site, which is why no run from a branch goes through it, and why a
  branch's proof run is never an audit. The audit takes no input: each nightly starts with a
  `check-inputs` job (`scripts/a11y-dispatch-inputs.mjs`) that refuses `suite=pull-request`, `checks`,
  `projects` and `groups` on develop before the build (`Docs a11y` refuses its own `checks` the same way), because the test-health page draws the latest
  night of each source and its trends from per-night counts, so a subset night would show the checks or
  lanes it skipped as gone and draw a drop to zero in every cluster. Nothing schedules the audit, so
  nothing keeps the evidence the conformance report cites inside the `a11y-checks-evidence` artifact's
  30 days: dispatch the audit before a release candidate and at least every 30 days, or the report
  cites an expired artifact. Never dispatch two screen reader runs at once, on any refs: two share the
  organization's five macOS slots and slow every VoiceOver step, and the transcripts carry the timings.
- **A proof run on a branch dispatches the subset that changed.** `gh workflow run a11y-nightly.yml
  --ref <branch> -f checks=<id>[,<id>]` runs the named checks beyond axe (the `checks` input; the job
  summary names the subset, the check runs keep their `A11y / <check> report` names, and the `verdict`
  job expects those check runs only). `gh workflow run screenreader-nightly.yml --ref <branch>
  -f projects=<project>[,<project>] -f groups=<group>[,<group>]` runs the named reader projects
  (`nvda-chromium`, `nvda-firefox`, `vo-webkit`, `vo-chromium`) and scenario groups (`keyboard`,
  `reading`, `menus`, `editors`, `selection`, `structure`, `status`): a lane job none of whose projects is named skips itself,
  its matrix drops the other browser and the groups not named, the check runs keep their
  `Screen reader / <project> <group> report` names, and the `verdict` job expects the named lanes only.
  An entry is a whole name, comma-separated, no spaces: the lane matches it as `,<name>,`, which cannot
  trim, so `check-inputs` refuses a space or a typo before the build (`namedSubset()` in
  `lib/a11y-subset.mjs`, the one reader of every subset input: the config, the report script, the guard
  and the verdict), where a lane skipped on one side and expected on the other would end red for the
  wrong reason after a macOS runner was spent. `gh workflow run docs-a11y.yml --ref <branch> -f checks=<id>[,<id>]`
  runs the named docs site checks beside the scan the same way. A subset's evidence keeps 7 days, since it cites nothing,
  and a proof run on a branch is not a night at all: `isA11yRun()` takes develop only.

## Screen readers: the NVDA and VoiceOver lanes

`screenreader/screenreader.spec.ts` drives a real screen reader through Guidepup
(`@guidepup/playwright` and `@guidepup/guidepup`, MIT, devDependencies of this package only; the
`@guidepup/setup` CLI, pinned at 0.29.3, runs through `npx -y` and is never installed, because its
optional recording helper depends on a GPL-licensed ffmpeg build, which the dependency rule keeps out
of the lockfile) over the scenarios of `screenreader/scenarios/`, one Playwright project per screen
reader and browser (`playwright.screenreader.config.ts`: `nvda-chromium`, `nvda-firefox`, `vo-webkit`,
`vo-chromium`). It writes a transcript per scenario, and `scripts/screenreader-report.mjs` turns the
transcripts into the job summary, the evidence document and the `Screen reader / <project> <group> report`
check run. CI runs it on its own workflow, the `Screen reader nightly`
(`.github/workflows/screenreader-nightly.yml` calling `screenreader.yml`: NVDA on `windows-2025` and
VoiceOver on `macos-26`, one job per screen reader, browser and scenario group; a dispatch, never a
schedule, "A11y: the audit and the proof runs" above), never in the
pull-request Tests pipeline. It is the evidence a future version of the Accessibility
Conformance Report can cite for what a cell, a header, a state and a status message announce (WCAG 1.3.1,
4.1.2, 4.1.3): the axe scan reads the accessibility tree, this lane reads what a screen reader makes of
it. No verdict of the current report comes from it, which is why the report page lists only the audited
screen readers (`docs/AGENTS.md` 2.20).

- **Report-only, and the rule is one constant.** `SCREENREADER_MODE` in `lib/screenreader-transcript.mjs`
  is `report`: a missing token group or a golden difference is a row in the summary, a line in the
  transcript and an annotation on the step's line in the scenario file, and the test passes. The check
  run follows the severity rule ("A11y: the verdict of a check run"): red on a step missing a serious or
  critical group (serious unless the step declares the group's severity), a warning on a moderate or
  minor one, and a golden difference is advisory. The job carries `continue-on-error`, so a red job never
  stops another lane; the nightly's `verdict` job then fails the run on any red check run. What
  fails a test is tooling only: a fixture that does not load, a constructor throw, a step whose `after`
  state never comes, a screen reader that does not start. The flip to `gate` (a missing token group
  fails the test; a golden difference stays advisory) changes the constant, the pinned tooling test
  and this section together, after the nightly has shown the token groups report what changed and
  nothing else.
- **A scenario is data, not code**: `screenreader/scenarios/<surface>.scenario.json`, one file per
  surface. The header: `id`, `surface`, `criteria` (the WCAG 2.2 criteria the scenario evidences, which
  the evidence records carry so the report generator can cite a step), exactly one of `page` (a page of
  `a11y/pages.mjs`, whose fixture, query and root container it opens: reuse the catalog) or `fixture` (a
  file under `fixtures/demo/`, for a grid the catalog does not hold, as `grid-core`'s, with the catalog pages
  it stands for as `catalogPages`, the pages `screenreader/coverage.mjs` lists it under), a `state` when the
  page has one in the catalog (the runner opens the page at rest and never sets up its state or its
  `device`, so a scenario on a page in the `editor` or a menu state reaches it with its own steps and names
  it, and a page with a `device` is refused), an optional `query` (appended after the page's; a `theme=` or
  `bundle=` in it takes the project's place, and any other key the page's query sets is refused, because
  a fixture reads the first value of a repeated parameter), `start` (`grid`, the default: the reader enters
  the page's first item, the grid; `page`: the reader stays at the top of the page and the steps reach the
  grid as a user arriving does), a `setup` and ordered `steps`. The setup sets the scene before the reader
  settles: `selectCell`, `press` and `type`, plus `updateSettings` (an object, to give a catalog page the
  shape a scenario needs: frozen panes, a navigation mode, `maxRows` to keep a traversal short),
  `spreadsheetData` (`[rows, columns]`, loaded through `loadData()` as `A1`-style values, for a grid
  larger than its viewport),
  `sentinels` (`true`: a button named `Before the grid` before the root container and one named `After
  the grid` after it, so a Tab out of the grid lands on the page instead of leaving the document, as the
  keyboard walker brackets a grid), `focus` (a selector) and `call` (a host event, below). A step has an
  `id`, exactly one primitive as its `action`, its `expect` token groups, an optional `severity` per group
  (keyed by the group's first synonym; a group without one is serious, "A11y: the verdict of a check
  run"), an optional `after` (`{ "visible": "<selector>" }` or
  `{ "hidden": … }`, awaited inside the capture so the state's announcement is in it, and a red test when
  it never comes), an optional `unsupported` and a `note`. A **variant** (`variantOf`) is its base's steps
  on another theme, query or setup: it sets only `id`, `surface`, `query`, `setup`, `criteria` and `group`
  (besides `schema` and `variantOf`), so the steps stay one copy (`grid-core-horizon` is `grid-core` on
  `theme=horizon`). A variant of a base that does not validate is told so. The schema is `lib/screenreader-scenario.mjs`, and
  `lib/__tests__/screenreader-scenarios.test.mjs` (root `test:tooling`) validates every committed file,
  so a mistake fails on the pull request and not inside a Windows or macOS job. That includes every
  `press` value, checked against Playwright's key names (`PRESS_PATTERN`: an optional chord of `Shift`,
  `Control`, `Alt`, `Meta` or `ControlOrMeta` joined by `+`, then a named key such as `ArrowRight`,
  `F10` or `KeyA`, or one printable character), so a misspelled `ArrowRigth` is refused there.
- **Five primitives, and what differs per lane is only how a reader drives its own.** The page drives
  `press` (a key or chord), `type` (text into the focused element, an open editor) and `selectCell`
  (`[row, col]`, the API selection a host makes) identically on every lane: `page.keyboard.press()`, so
  the screen reader sees the page react and never the keystroke. The reader drives `read` (`next`,
  `previous`, `in`, `out`: the reading mode a user moves through a page with) and `activate` (the
  reader's activate gesture), each its way, and `LANE_PRIMITIVES` says which it can: NVDA reads with its
  browse-mode Down and Up Arrow and activates with Enter in browse mode; VoiceOver reads with VO-Right and
  VO-Left, enters and leaves an item with VO-Shift-Down and VO-Shift-Up (interacting), and activates with
  VO-Space. A reader command runs through Guidepup with its own capture and its phrase is read from the
  log, never inside `screenReader.capture()`, whose action holds Guidepup's queue (a nested command waits
  for itself forever). The iOS and TalkBack readers will drive the same field (`moveForward`, next item,
  double tap) when their lanes exist; the scenarios do not change for them.
- **`call` is a host event, for a status message no key causes.** `["name", ...args]` calls a function
  the fixture puts on `window` (`["resolveRequest", 0, "New A"]`: the server answers a pending request),
  because a status message (WCAG 4.1.3) often follows something the user did not do, such as a fetch
  that lands or a value that resolves, and no key reaches it. It is a page action like `press`: every
  lane drives it, NVDA in focus mode, and the reader's phrase around it is captured. The name is an
  identifier (`CALL_NAME_PATTERN`), never a path such as `htServer.release`, so a scenario calls only what
  the fixture exposes for it (a fixture adds a top-level wrapper when the function sits on an object). The
  arguments are JSON values, and a function the page lacks fails the test instead of passing as a silent
  step. It runs in the setup (start a request before the reader settles) and in a step, whose note says
  which host event it stands for. The step's token groups are what a reader should announce for the change,
  so silence after it is a finding, not a pass by default.
- **A primitive a lane cannot drive is declared, never skipped silently.** NVDA has no interaction level:
  browse mode reads into a table without entering it, so `read in` and `read out` mean nothing to it. A
  step whose primitive a lane cannot drive carries `unsupported: { "<lane>": "<reason>" }` (`nvda`,
  `voiceover`), and the validator refuses the step without it. The runner skips the step on that lane and
  lists it in the transcript's `unsupported`, the report shows it in its scenario's table and in a "Not
  driven on this lane" table by primitive, the step's evidence record says `unsupported` with the reason,
  and that lane's golden holds the steps it ran. A lane may also declare a primitive it drives in general
  unsupported for a reason of its own (a key it takes from the page), with the reason saying so. What a
  lane does not drive is debt the matrix states: `laneUnsupported()` lists it, and the data file's matrix
  carries it (below).
- **A reading traversal is judged as a whole.** A scenario with a `traversal` (`from` and `to`, step ids,
  and `items`) asks that each item be announced exactly once across those steps, in the listed order
  (`matchTraversal()` in `lib/screenreader-transcript.mjs`, matched as a token is, a digits-only item
  never inside a position phrase). `from` and `to` are steps every lane runs: a lane skips an
  `unsupported` step, and the window would widen to the start or the end of the run. An item read twice is what the check exists for: a frozen pane's
  overlay clone read as a second copy of its cells. An item never read is content the reading mode
  skipped, one read before an item listed ahead of it is out of order. List the cell values, which are
  unique, not the headers, which a reader repeats as context on every cell. Give the read steps room to
  reach past the grid, or a copy the clones add after the master table never shows. The verdict is judged
  on a complete run only, is in the transcript and the report, and a traversal that is off is a serious
  finding (`traversal-off`, at `where` `traversal` in the findings ledger), a warning at most on a change
  run while its cluster has a tracker.
- **Every step is an evidence record.** `scripts/screenreader-report.mjs` writes
  `test-results/screenreader/evidence/screen-reader.json` (`lib/screenreader-evidence.mjs`), the
  transcripts artifact uploads it, and it is in the shared shape of the accessibility checks
  (`mergeEvidence()`, validated by `validateEvidence()` with the lane's own registry, never a check of
  `EVIDENCE_CHECKS`, which the a11y checks config turns into projects): one target per scenario (its page,
  its theme, the scenario as the variant), the criteria it evaluated, a finding per step missing a token
  group (`announcement-missing-fact`) and per traversal item read twice, never or out of order, plus the
  run's project, lane and group (`null` for a run of every scenario) and a record per step (`records`:
  scenario, step, lane, project, page, theme, criteria, action, and the verdict `pass`, `missing-fact`,
  `recorded` for a step that asserts nothing, `unsupported` or `not-run`), with each scenario's records in a
  detail file beside it. The findings are `advisory` while the lane is report-only: a missing group is the
  grid's defect or the reader's own behavior, and the step's note says which. A run that stopped is a
  problem of its target, which then evaluates no criterion; an unsupported step is neither, because the
  lane ran every step it can drive, and it stays `unsupported` in a scenario that left no transcript. A
  transcript a retry wrote (`attempt` above 0) flags its target `flaky`, as a check's test that measured
  only on a retry is.
- **Two assertion tiers.** The **required tokens** are each step's `expect`: synonym groups
  (`[["34"], ["age"], ["row 2"], ["column 3"]]`), each group satisfied by any one synonym found as a
  whole phrase in the normalized announcement, all groups required. A synonym of digits alone (`"34"`)
  is a value, never a position: it matches a standalone number that no `row `, `column `, `col `,
  `level ` or `of ` precedes and no ` of ` follows, so a group that means a position spells it out
  (`"row 1"`). A `.` or `,` between two digits stays in the number, so `34` never matches `34.5`. The
  rule has two limits: a negative number loses its sign (`-34` matches `34`), and a number right after
  `of` is read as a set position and never matches (`total of 34`). Ask for facts (the cell text, a
  position or a header, a role or a state), never for wording, so the same groups hold on every screen
  reader. **One fact per group**: the synonyms of a group are the ways to say that one fact (`"level 1"`
  or `"1 of 2"`, `"edit"` or `"multi line"`), never two facts, because a group passes on any one of
  them: `["row 1", "column 2"]` passed on a header NVDA placed in row 7. This tier is what gates later.
  A group widens only when a screen reader says the same fact in other words, and the step's note says
  so: VoiceOver calls the text editor a `text entry area`, which joined the editable-role group of
  `open-editor`. The **goldens** (`screenreader/goldens/<project>/<scenario>.json`) are the exact
  normalized announcement per step, advisory only: a wording change in NVDA, the browser or the core shows as a
  golden difference in the summary, and the fix is to re-record once the new wording is right. The
  normalizer (`normalizeAnnouncement()`) lowercases, folds Unicode, drops punctuation, collapses
  whitespace and removes the screen reader's own chatter (`CHATTER`: the mode switch, `clickable`).
- **Recording goldens is a CI job, because nobody has NVDA on a Mac or a VoiceOver set up for
  automation on their own.** Dispatch the nightly from the branch with the `update-goldens` input
  (`gh workflow run screenreader-nightly.yml --ref <branch> -f update-goldens=true`): the run records
  every project's goldens on its runner (`HOT_SR_UPDATE_GOLDENS=1`, or Playwright's
  `--update-snapshots` through `npm run test:screenreader:update-goldens`) and uploads them as
  `screenreader-goldens-<project>-<group>`, each holding only the goldens its job recorded (the spec writes a
  copy to `test-results/screenreader/goldens/`), so every artifact extracts into one tree with nothing
  overwritten; download, commit under `screenreader/goldens/<project>/`, done.
  The dispatch runs every job unless `projects` and `groups` name the ones to record
  (`-f projects=vo-webkit -f groups=menus`), so with no subset it records the NVDA goldens too: commit
  only the projects the change is about. A run with `update-goldens` compares nothing and reports `recorded`. A golden pins the wording
  as recorded, a finding included: a step NVDA stays silent on is an empty string in it, and a wrong
  row is the wrong row. The scenario's `note` says which steps record a finding (`Finding: …`), so a
  golden difference on such a step can be the fix; re-record the golden when the finding is fixed.
  `lib/__tests__/screenreader-goldens.test.mjs` (root `test:tooling`) reads every committed golden: it
  parses, has `schema` 1, names its file as its scenario and its directory as its project (a project of
  the config, never `dom-echo-chromium`; an `nvda-*` golden was recorded by NVDA, a `vo-*` golden by
  VoiceOver on macOS), lists the
  scenario's step ids in order, and holds each step as a normalized string (what the update mode
  writes; a hand-edited raw text would differ on every run). A step renamed, added, removed or moved
  therefore fails that test until the golden is re-recorded. The same test fails a screen reader project
  of the config without a golden for every scenario, so a new scenario or a new project lands with its
  goldens. A step id starts with a letter, because `JSON.parse` moves an integer-like key (`"2"`) ahead
  of the others.
- **Where the transcripts go.** `test-results/screenreader/transcripts/<project>--<scenario>.json`
  (the steps with the spoken text, the normalized text, the token verdict, the golden verdict and the
  timing, plus what the screen reader said while entering the page) and `.log` beside it, readable
  without a tool; `summary.md` next to them. A scenario that throws still leaves its transcript: the
  steps captured so far plus `incomplete` (the step it stopped at and the error; the step is `setup`
  when it stopped before the first step, in the page load, the reader's entry, the setup actions or
  the mode pin), no golden comparison (`golden.status` is `incomplete`, and the update mode records
  nothing from it), and the test stays red; the report reads it as a tooling problem ("scenario <id>
  stopped at step <step>") and still shows the captured steps. Each attempt deletes the scenario's
  transcript before it starts, so a retry never leaves the previous attempt's file behind. CI uploads
  the directory as `screenreader-transcripts-<project>-<group>` and the Playwright report as
  `screenreader-playwright-report-<project>-<group>`, both outside the `playwright-report-*` glob the
  flake ledger reads, and the config has no JSON reporter, so nothing here becomes a flake record.
- **The NVDA reader enters the page the way a user does, and its mode follows the primitive.** The NVDA
  reader calls `navigateToWebContent()` (the browser window focused, the reader at the top of the
  document, in browse mode); NVDA has no interaction level, so `start` changes nothing for it. A page
  action (`press`, `type`, `selectCell`) runs in focus mode, where a grid user works, and a reading
  command (`read`, `activate`) in browse mode. Before each primitive the reader reads the mode NVDA last
  named (a mode switch is spoken, not played, through the `virtualBuffers.passThroughAudioIndication`
  setting the start options turn off) from every phrase it heard, the last mode phrase winning, inside
  one phrase too, and toggles (NVDA+Space) once or twice until it is the mode the primitive needs: NVDA
  switches to focus mode on its own when the focus lands on a gridcell, and Guidepup logs only what a
  command captured, so the toggle round trip is what keeps every step in the right mode whatever NVDA
  did. Read the mode from the raw phrases, never the normalized ones: the normalizer strips the mode
  phrases as chatter. What a switch says is the step's `preparing`, never its announcement. A switch that
  names no mode still flipped it, so the reader counts from the last mode NVDA named
  (`ensureNvdaMode()` in `lib/screenreader-nvda.mjs`): it keeps switching for a named mode while two
  switches are left, then accepts the mode it infers and says so in `preparing`, and switches that end
  in the other mode stop the run as tooling. Assuming the mode it asked for once sent a read's Down Arrow
  to the page in focus mode, and the traversal started on a cell. Switches that name no mode while NVDA
  has named none in the run mean NVDA is outside the page's document (the browser's toolbar, or the
  Windows Start menu, its words then in `entering`), where nothing is spoken, so the reader throws and
  the retry starts over with a fresh browser and NVDA; a silent transcript is never a reading, so never
  record a golden from one. Guidepup's entry clicks the middle of `<body>` and then presses a real Tab: a
  click that selects a cell of the last column sends that Tab out of the grid and, with nothing focusable
  after it, out of the page. So the reader keeps the cells transparent to the pointer while Guidepup
  enters (`ENTRY_POINTER_GUARD`), and the click lands on the table or the grid's holder whatever the
  page's width. Never drop the guard, and keep any new NVDA entry from clicking a cell. The focus
  highlighter is off in the same settings. After the setup the log is cleared, and every page action is
  `screenReader.capture(() => …, { capture: true })`, which waits a second of silence after the last
  phrase, as a reading command's own capture does. A step whose capture is empty is listened to once more for another
  silence window, so a phrase NVDA speaks late (Shift+F10 on Firefox) usually lands on its own step.
  Guidepup discards speech that arrives while it stops the previous utterance, so the second listen
  reduces late phrases in the next step, it does not remove them. A step therefore costs a second and
  more, and a scenario is minutes: its test timeout is the config's five minutes or its budget, whichever
  is longer (below), with two retries, Guidepup's own mitigations. The run step's `timeout-minutes` is
  40, which a group's budgets plus one retry of its largest must fit (the workflow test sums them per
  group), every step that downloads (the setup CLI, the browser, the screen reader) has its own, and each
  job's timeout sits above the sum of its steps' (60 for NVDA, 70 for VoiceOver): a step timeout is a step failure, so the transcripts, the
  summary and the check run still come, where a job timeout cancels them. The workflow test pins that
  rule for both jobs.
- **The VoiceOver reader enters the grid before the focus does.** `enter()` calls Guidepup's
  `navigateToWebContent()` (the browser activated by its bundle id, "web content" picked in VoiceOver's
  item chooser and interacted with, the cursor on the page's first item) and then, for a scenario that
  starts on the grid, `interact()` (VO-Shift-Down) on that first item, the grid, the way a VoiceOver user
  enters a table. A scenario with `start: page` interacts with nothing: its first item may be the page's
  toolbar, and its steps reach the grid as the user does (`read next`, then `read in`). The setup then puts
  the focus on a cell, and VoiceOver's cursor follows the keyboard focus from there on; keys still go
  to the page through Playwright, so VoiceOver hears the page react, never the keystroke. The order is
  the rule: an `interact()` after the setup, with the focus already on a cell, took VoiceOver into the
  cell's text, and on Chromium it then announced no cell move at all (only the editor and an API
  reselection, 2 of 20 steps). A run with
  no `interact()` read the same as the run with it, step for step, on both browsers, because the
  announcements come from the focus. After the last step of a complete run, `leave()` stops interacting
  (VO-Shift-Up). The transcript is written by then, so a failure there is a `warning` annotation in the
  Playwright report and a line in the log, never a red test: a retry would rerun the scenario for minutes
  and overwrite the complete transcript. VoiceOver starts with two preferences off, merged into the bundle
  `install voiceover` installs: usage hints ("You are currently on a cell, inside of a table…" a
  second after every move, about VoiceOver and not the grid, which doubled each step's time), and the
  mouse pointer following VoiceOver's cursor. With the pointer following, an opened context menu put
  the pointer in the menu's middle, the hover selected the item under it, and every ArrowDown after
  that started from `Remove column`; a keyboard user's pointer stays put.
- **VoiceOver keeps its last phrase, so every VoiceOver step starts from a step boundary.** Guidepup's
  VoiceOver capture polls `content of last phrase` until it holds still (1.25 s), and takes a phrase
  that has not changed for about 600 ms as new: a step VoiceOver says nothing on would read as the
  previous step's phrase. Before each capture the reader has VoiceOver speak `Step boundary`
  (AppleScript `output`) and waits until it is the last phrase; `stripStepBoundary()` in
  `lib/screenreader-voiceover.mjs` removes it from what the capture read, so a silent step is an empty
  string, as on NVDA, and the boundary never reaches a transcript. A boundary that never reads back
  fails the run as tooling, because silence would then be indistinguishable from a repeat. A step that
  captured only the boundary is listened to once more, like NVDA's. A step costs about 4 s on
  VoiceOver (grid-core about 140 s on either browser, nested-rows 35 to 45 s).
- **The VoiceOver job is macOS: `macos-26`, `setup --ci --macos-record`, two jobs at most.**
  `npx -y @guidepup/setup@0.29.3 setup --ci --macos-record` writes the automation permissions into the
  TCC database, enables VoiceOver's AppleScript control and turns on Do Not Disturb, and screen-records
  itself into `tests/recordings/`, uploaded as `screenreader-recordings-vo-<browser>-<group>` red or green;
  `install voiceover` fetches Guidepup's VoiceOver preferences bundle for the runner's macOS. `vo-webkit`
  is Playwright's own WebKit build (Playwright.app) with the Desktop Safari descriptor, not Safari.app;
  `vo-chromium` is Chrome for Testing. The job carries `max-parallel: 2`, because the organization runs
  at most five macOS jobs at once, step timeouts of 12 minutes on the setup, 5 on each install and 25
  on the run, and a 55-minute job backstop above their sum. A job is about 5 to 6 minutes, 4 to 5 of them the run.
- **The VoiceOver setup recovers on the same runner.** The CLI turns on Do Not Disturb by driving the
  Control Center UI through AppleScript, and about one job in a hundred fails there ("Failed to enable
  Do not disturb mode") once the CLI's own five tries are spent, about 3.5 minutes; the first develop
  nightly lost its Chromium transcripts that way. The step therefore runs `setup --ci` once more after
  relaunching Control Center (`killall ControlCenter`; launchd restarts it), and then `setup` without
  `--ci`, which grants the same automation permissions without Do Not Disturb, so the night still
  records a transcript; a workflow warning says each fallback ran, and the last one that a notification
  could be spoken into a transcript. Every attempt is screen-recorded. No attempt is cut short: a good
  setup takes 32 to 42 s, the CLI bounds a failing one itself, and killing it mid-run could leave
  osascript and the recorder running. A setup still red after all three is the runner: re-run that job
  from its page. Slack never hears of it (the job carries `continue-on-error`); Slack hears only of a
  nightly whose build never reached the lanes. The workflow test pins the three attempts.
- **A project's scenarios split into groups that each fit the run step.** Guidepup runs one scenario
  at a time per machine, so a project's run grows with every scenario: a step costs about a second and a
  half on NVDA and four to five seconds on VoiceOver, a silent one on VoiceOver about thirteen. Each
  scenario names its `group` (`SCENARIO_GROUPS` in `lib/screenreader-scenario.mjs`: `keyboard` for what
  a keyboard user does in the grid itself, `reading` for the reading-mode traversals, `menus` for the
  menus and the filters inside them, the comment editor, the column summary row and the links autoLink
  draws, `editors` for the cell editors and the checkbox cell, `selection` for row selection and the
  check all header, `structure` for nested and collapsible headers, merged cells and the freeze bars,
  `status` for the status messages and the bars around the grid: pagination, the sheets bar, a dialog, a
  notification, the loading and empty data overlays, and a value that resolves later), each group is a
  matrix entry of both jobs in `.github/workflows/screenreader.yml` with its own job, `HOT_SR_GROUP`,
  artifacts (`screenreader-transcripts-<project>-<group>`, `screenreader-goldens-<project>-<group>`) and
  check run (`Screen reader / <project> <group> report`), and a run without `HOT_SR_GROUP` (a local one)
  runs every group. When a group's budgets plus one retry of its largest no longer fit the 40-minute run
  step (the workflow test sums them), split it: a new group joins the
  list and both `group:` matrix lines together (the workflow test reads the list), and the scenarios move
  in the same change. A scenario's budget is 60 s plus 12 s per step (`scenarioBudgetMs()` in
  `lib/screenreader-scenario.mjs`), and its test timeout the config's five minutes or that budget,
  whichever is longer (`scenarioTimeout()` in the spec): a busy macOS runner made every VoiceOver step
  1.7 to 2 times as slow, and a fixed budget then times out a long traversal that is healthy on a quiet
  one. Size a traversal's reads to what the readers need all the same, because each read past the end
  costs a step on every lane. Bound a slow step with a step timeout, never a job timeout (below).
- **A screen reader is one per machine, so the lane is serial and headed.** `withGuidepup()` pins one
  worker, no parallelism and `headless: false` on every project; the matrix gives each browser its own
  job. The spec adds no serial mode on top: it would skip every scenario after a red one and re-run the
  passed ones on a retry. Two things follow. Each Guidepup lane is its own job (`nvda`, `voiceover`),
  never a second project in the same job. And the reader is behind the spec's `Reader` interface
  (`enter`, `ready`, `capture`, and an optional `leave`), so a lane adds its reader and leaves the
  scenarios alone: the scenarios, the token groups and the report are shared, and only the goldens are
  per project.
- **`HOT_SR_LANE=dom-echo` proves the runner without a screen reader.** On any platform,
  `HOT_SR_LANE=dom-echo npm run test:screenreader` runs every scenario in headless Chromium against a
  reader that echoes the focused element's accessible name, role (in the words a screen reader speaks:
  `column header`, `menu item`, `edit`), grid position and states two frames after the action. Its
  `read` moves a virtual cursor over the page's cells, headers and controls in document order (what is
  hidden or `aria-hidden` left out), and its `activate` clicks the item under that cursor: it walks the
  DOM, never a virtual buffer, so a copy the overlay clones add shows there too, and whether a reader
  reads it is the lane's to say. The echo checks the fixture, the keys, the `after` states, the reading
  steps and the report plumbing, locally, before the Windows and macOS jobs do. Its wording rows are not evidence: it always announces the focused element, so a
  step a screen reader stays silent on (`close-editor`) announces on the echo, and a token row there
  says nothing about NVDA. Its transcripts carry `dom-echo-chromium`, it never runs in CI, and its
  goldens are never committed.
- **A missing token group is a finding or a strict token list, and the transcript says which.** Read
  the spoken text: an announcement that carries the fact in other words widens the synonyms; one that
  lacks the fact is a defect to fix in the core (the lane's purpose) and stays listed until it is, with
  a `Finding: …` sentence in the step's `note`. A group a step cannot satisfy today records the gap:
  `extend-range` in `grid-core` asks for the new end cell and its selected state, a range extension
  moves no focus, and a miss there is the finding. Never delete a group to turn a row green. **Before
  calling a miss the grid's, run the same keys over a well-formed ARIA grid**: a throwaway fixture in
  the APG data grid shape (one `role="grid"` table, the same data and `aria-*index` values, a roving
  focus, `window.hot.selectCell()` and a `window.Handsontable` marker for the runner) with a scenario of
  the same steps, dispatched from an experiment branch. A miss there too is the screen reader's own
  behavior, and the step's note says so without a `Finding (the grid's)`; a miss on the grid alone is
  the grid's. The first such control showed that VoiceOver names no header role and no row number on a
  focus move even on a correct grid, and with WebKit no column number either, while every position and
  header Chromium derives from the tree is the grid's: the overlay clones hold the header row and the
  row headers in rows of their own in Chromium's accessibility tree. Read that tree with CDP's
  `Accessibility.getFullAXTree` on the fixture, which needs no screen reader.
- **Adding a scenario**: open a page of the catalog (`page`), shaped by the setup (`updateSettings`,
  `sentinels`), and add a fixture under `fixtures/demo/` only for a grid the catalog cannot become; a
  fixture keeps the fixture contract (the `?theme=`/`?bundle=` block, `window.hot` or the core's
  `__hotInstance`, a constructor throw captured as `htBuildError`) and is small enough that every step's
  target is rendered. Write the file `screenreader/scenarios/<surface>.scenario.json` with its `criteria`,
  the setup and 5 to 15 steps, from the fixture and the catalog's opener for its state (Shift+F10,
  Shift+Alt+ArrowDown, Enter, Ctrl+Alt+M); declare `unsupported` where a lane cannot drive a primitive.
  List it under its page in `screenreader/coverage.mjs`, and lower `SR_GAP_LIMIT` for the gap it closes;
  set the `scenarios` count of both automated entries in `docs/content/data/accessibility.json` (and
  their `unsupported` when it changes), which the coverage test reads. Run
  `HOT_SR_LANE=dom-echo npm run test:screenreader` to see the shape of the steps, then record before you
  assert: a dispatch with `update-goldens` from the branch records every project (`projects` and `groups`
  keep it to the changed group on one project), and the token groups
  come from the facts that recording shows, one fact per group, never from a guess; a fact a reader
  should say and does not is a group that stays, with `Finding: …` in the note. Commit the goldens of
  the scenarios the change is about, read before they are committed. Keep every step's `"id"` on its own
  line: the check run annotates that line.
- **Coverage: every surface is accounted for.** `screenreader/coverage.mjs` has one entry per page of
  `a11y/pages.mjs` (`SR_PAGE_COVERAGE`) and per plugin and editor of `a11y/coverage.mjs`
  (`SR_FEATURE_COVERAGE`), and `lib/__tests__/screenreader-coverage.test.mjs` (root `test:tooling`) fails
  on a page, a plugin or an editor without one, on an entry with none, and on a scenario no page lists.
  An entry is `scenarios` (the scenarios that read it), `none` (it draws nothing a reader meets, and why:
  sizing, events, a pointer-only guide, a color scheme that changes no element of the tree) or `gap` (a
  reader meets it and no scenario reads it yet, and what is missing). A page lists only a scenario that
  opens that page or one on a fixture of its own: a scenario on a catalog page reads that page and no
  other. A gap is debt, so `SR_GAP_LIMIT` is exactly the number of gaps: a new page, plugin or editor
  fails the test until someone decides, and the change that closes a gap lowers the limit. The same test
  keeps the matrix honest: each automated entry of `docs/content/data/accessibility.json` carries
  `scenarios` (the number of committed scenarios, which every lane runs) and `unsupported` (the
  primitives its lane does not drive, `laneUnsupported()`), so the report states what each reader ran
  (`docs/AGENTS.md` 2.20).
- **Locally**: the UMD build with the minified stylesheets, then `npm run test:screenreader`. The lane
  follows the platform, and `HOT_SR_LANE` (`nvda`, `voiceover`, `dom-echo`) picks one explicitly. On
  Windows, `npx -y @guidepup/setup@0.29.3 install nvda` in `tests/` once (the portable NVDA build the
  installed `@guidepup/guidepup` names, with the Guidepup add-on). On a Mac the default is VoiceOver,
  which needs `npx -y @guidepup/setup@0.29.3 setup` and `install voiceover` in `tests/` once; the setup
  writes the Mac's automation permissions, so run it only on a machine you mean to automate, and expect
  VoiceOver to speak and move its cursor for the whole run. `HOT_SR_LANE=dom-echo` runs the scenarios
  without a screen reader on any machine.

The chain from the nightly to the config is pinned by `.github/scripts/__tests__/screenreader-workflow.test.mjs`;
the normalizer, the matcher, the golden diff, the report and the check-run poster by the
`screenreader-*` and `github-check-run` tests under `lib/__tests__/`.

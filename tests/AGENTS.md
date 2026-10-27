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

- **The scan includes the grid's root container and that grid's own portal, nothing else.**
  `.include(root)` plus the instance's `rootPortalElement`, the `body`-level element the core
  appends for menus and the comment editor. The spec marks that element with a data attribute
  before the scan (`markPortal()` in `a11y/harness.ts`) and includes the attribute, never the `.ht-portal` class:
  every instance appends a portal, so on a page with several grids the class would scan the other
  grids' menus too and key their findings to this page. The fixture page's own buttons, inputs
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
for a surface that exists on a phone only) and `surface` (what it covers). Keep
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
  run stays as it is: it judges the scan, it never reads the base, and a neutral icon on every pull
  request that baselines a finding the documented way would stop meaning "the scan found
  something". Approving the pull request accepts the listed debt. Locally, read the base at the
  merge base, not at `origin/develop`, or everything `develop` changed since the branch forked
  reads as this branch's: `git show "$(git merge-base origin/develop HEAD)":tests/a11y/axe-baseline.json > base.json`,
  then `node scripts/a11y-pr-comment.mjs --dry-run --base base.json`.
- **The agent findings** (`a11y-findings.json`, `lib/a11y-findings.mjs`): the same run, concise and
  machine-readable, for an implementer agent. `needsAction` lists each finding that needs action
  with its page, theme, fixture URL, steps, rule, WCAG criteria, element, counts, remedy and up to
  ten elements (selector, DOM path, box, markup, reason); `issues` lists every known issue with
  every location and one locator each; `pages` says once how to reach each page's state;
  `reproduce` has the commands. `schema` (`FINDINGS_SCHEMA`) changes when a field is removed or
  renamed. `comparison.json` beside it holds everything and is several times larger.
- **The check run** `A11y / axe report` (`lib/a11y-check-run.mjs`, posted by
  `scripts/a11y-check-run.mjs` on the pull request's head commit, never the merge commit). It is
  the visible gate while the job stays green: `neutral` when something needs action in warn
  mode, `success` when nothing does, `failure` in block mode or on a tooling failure, with the
  counts in its title, the summary and the report link on its page, and an annotation per
  finding on the line to change (`pages.mjs` for new and grown, the baseline for improved and
  fixed). Only `CI Gate` is required, so it never blocks a merge by itself.

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
In `warn` the run's status is Playwright's own and the check run is neutral at worst. In `block`
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
  `report`, and `lib/__tests__/a11y-evidence.test.mjs` pins it. A finding is a row in the job summary,
  an annotation and a `neutral` `A11y / <check> report` check run; `buildEvidenceCheckRun()` never
  returns `failure`, so no check turns a pull request red. A test fails for tooling only (a fixture that
  does not load, a state the keyboard did not reach), and the document records that test as a target
  with `status: 'error'` and its error as a problem. A test that measured only on a retry is flagged
  (`flaky`) and listed as a problem too. Flakiness is a finding against the check, not the product: fix
  the measurement, never quarantine it. A check that starts gating changes the constant, its test and
  this section together, after its findings have proven precise.
- **One document per check, in one shape.** `test-results/a11y-checks/<check>.json`
  (`mergeEvidence()`): `check`, `title`, `mode`, `criteria` (what the check evidences, from
  `EVIDENCE_CHECKS`), `run` (the commit the run tested, the head on a pull request and never the merge
  commit; the ref, the run URL, the browser and its version, the Handsontable version and build date),
  `targets` (every target, measured or not, with the criteria it evaluated and the path of its detail
  file), `findings`, `problems` and `summary`. A finding has a stable `id` (check, kind, page, theme,
  variant and element or step, so two runs give the same finding the same id), `kind`, `criteria`,
  `severity`, its target (`page`, `theme`, `state`, `variant`, `url`), a `selector` or a `step` or
  both, `measured` (flat values), optionally `expected`, and a one-sentence `reason`. What a target
  measured in full (every focus stop, every ratio) goes to `<check>/<page>--<theme>[--<variant>].json`
  beside the document, so the document stays small enough to read. `summary.byCriterion` counts, per
  criterion, the targets that evaluated it and the findings against it: a criterion evaluated on many
  targets with no finding is the evidence of a pass, and that count is what the generator cites.
  `schema` (`EVIDENCE_SCHEMA`) changes when a field is removed or renamed; `validateEvidence()` is what
  a reader can rely on.
- **Criteria are WCAG 2.2 ids from one table.** `WCAG_CRITERIA` lists every 2.2 success criterion with
  its name and level, without the obsolete 4.1.1, and a finding naming any other id is refused. A
  finding may name a criterion outside its check's list when the measurement shows it (a focus stop
  with no name is a 4.1.2 fact the keyboard walker sees); it is then counted under that criterion with
  no target evaluating it, because the check does not evaluate it everywhere.
- **Severity is axe's scale plus one.** `critical`, `serious`, `moderate`, `minor`, as axe rates
  impact, so a finding reads the same in every report, and `advisory` for a difference to review that
  is not a failure on its own (a tab-order golden that moved). An advisory finding still makes the
  check run neutral: someone has to look at it.
- **The same pages, states and guards as the scan.** Every check opens its targets through
  `a11y/harness.ts`: `openTarget()` loads the fixture and turns an uncaught page error, a missing theme
  stylesheet or a constructor throw into a red test, and `reachState()` reaches the catalog state with
  the keyboard (`STATES`) and marks the grid's own portal (`PORTAL`). A check therefore measures the DOM
  a keyboard user reaches, the one the axe scan reads. A state a check needs and the catalog lacks gets
  an opener in `STATES`, keyboard first. The `test()` calls stay in the spec, never in a helper: a test
  declared from a helper reports the helper as its location.
- **A test declares its target first and attaches its part last.** `declareTarget()` (`a11y/evidence.ts`)
  writes the target as a test annotation before anything can fail, so the reporter can name a test that
  failed before it measured; `attachEvidence()` attaches the part, with `readEnvironment()`'s browser
  and build. An empty `findings` list is evidence too: the target was measured and nothing was found.
- **Findings on the product are recorded, never fixed in the check's change.** A check lands with what
  it finds listed in its pull request; the product tasks are filed apart, and a fix later clears the
  finding. A finding the check gets wrong is fixed in the check.
- **Every report value is escaped.** The summary and the check run render values from the fixture DOM
  (selectors, accessible names), so `renderEvidenceSummary()` escapes them the way
  `escapeMarkdownText()` does for the scan, puts a selector in a `<code>` element, and links a URL only
  when it is plain https.

The merge, the validation, the summary and the check run are pure (`lib/a11y-evidence.mjs`, tested
in `lib/__tests__/a11y-evidence.test.mjs` through the root `test:tooling`). The reporter
(`reporters/a11y-checks.ts`) reads the last attempt of every test of each project that ran and writes
the documents, the detail files and a `summary.md`; it never changes the run's status.
`e2e/a11y-checks-reporter.spec.ts` (no browser, a few seconds) proves it on synthetic projects: the
last attempt read, a failed test recorded as an error target, a retried one flagged, a detail written
to its own file. `scripts/a11y-evidence-report.mjs` reads the documents and writes the job summary,
or posts one check run per check with `--check-run` (`--dry-run` prints the payloads); a check the job
ran that left no document (`A11Y_CHECKS`) gets a neutral tooling check run instead of none.

- **Where they run.** `a11y.yml` has a second job, `checks`, beside `axe`: the same Playwright
  container and UMD artifact, `continue-on-error` on the job and on its run step, and one
  `A11y / <check> report` check run per check on the pull request's head commit (behind the canonical
  fork guard). `HOT_A11Y_CHECKS_SUITE` picks the checks: a pull request runs the ones with
  `pullRequest: true` in `EVIDENCE_CHECKS` (a check earns it by finishing in under two minutes), and the
  `A11y nightly` (`a11y-nightly.yml`, weeknights on develop, and a dispatch from any branch) runs them
  all with `nightly: true`. The evidence goes up as `a11y-checks-evidence`, outside the
  `playwright-report-*` glob the flake ledger reads, for 30 days from the nightly (what the report
  cites) and 7 from a pull request. `EVIDENCE_CHECKS` is the one list: the config builds its projects
  from it (`checksForSuite()`), and the report script posts a neutral tooling check run for a check of
  the suite that left no document. Locally: `npm --prefix tests run test:a11y-checks`, every check, or
  `-- --project=<check>`; the reporter writes the documents only when the config's reporters run, so do
  not pass `--reporter` on the command line.

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
  records its region (`grid`, `portal`, a sentinel, `outside`, or `body` when the focus left the
  document), the role and name Chromium's accessibility tree gives the focused element (read over CDP
  with `Accessibility.getPartialAXTree`, because the DOM cannot say what a screen reader gets), and its
  cell. **A stop is keyed by its cell, never by its element**: Walkontable reuses a `<td>` for another
  cell after a scroll, so keying by element would read a scroll as a cycle.
- **A trap is a walk that never gets out, and a long walk is not a trap.** With `tabNavigation` (the
  default) every cell is a tab stop and Tab leaves the grid from a row's last cell; with `autoWrapRow`
  Tab wraps rows and leaves from the last cell of the grid, so a walk can run out of presses (the
  column count plus 40) with nothing wrong. The walker then tries the way out the shortcut guide
  documents, Ctrl+End then Tab (Ctrl+Home then Shift+Tab back): a walk that gets out that way is an
  advisory `tab-walk-needs-shortcut`, one that does not is a `keyboard-trap`. A modal dialog holds the
  focus by design: a cycle inside one is a trap only when neither Escape nor a button in it lets the
  keyboard out, and a Tab that walks out of an open modal to the content behind it is a
  `focus-leaves-modal` finding.
- **A popup is judged by Escape.** On a menu, an editor or the comment editor, Escape (pressed up to three
  times: a submenu takes two) must close it and give the focus back to the cell it opened on. Then the
  popup opens again and Tab walks inside it, judged per stop. A focus that lands on `body` after the
  popup closed is `focus-not-returned`: the grid often still listens, so the next arrow key brings the
  focus back, but a screen reader has nothing focused until then.
- **Per stop:** a product stop the accessibility tree gives no role is `focus-stop-without-role`, one whose
  role needs a name (a button, a menu item, a text field, a header) and has none is
  `focus-stop-unnamed` (both 4.1.2: the walker sees them, the tree snapshots own the criterion); a grid
  cell needs no name, because an empty cell's empty name is its value. A press that also opened a menu,
  a dialog or an editor, or navigated, is `context-change-on-focus` (3.2.1). Every form control a walk
  stopped on then gets an input (Space, ArrowDown, a letter), and an input that navigates, opens a popup
  or moves the focus away is `context-change-on-input` (3.2.2).
- **The APG grid keys** (arrows, Home, End, Page Up, Page Down, Ctrl+Home, Enter, F2, Escape) are pressed
  on every grid at rest, each from the page's cell. A key that moves the focus out of the grid is a
  finding; one that does nothing is advisory, because an edge cell, a frozen band or a hidden column can
  make that right. A key the start cell is already at the edge for is skipped, and so are Enter and F2
  on a cell that is read-only, has no editor, or is a checkbox (which toggles instead).
- **Every documented shortcut is accounted for.** `a11y/checks/keyboard-shortcuts.mjs` has one entry per
  row of the keyboard shortcuts guide, by section, Windows keys and ordinal (what `parseShortcutTables()`
  reads from the page): a `probe` (the page, where the focus starts, the steps before, the keys, the
  effect the guide describes) or a `notProbed` reason. The tooling test fails on a documented row with no
  entry and on an entry whose row is gone, so a shortcut added to the guide is probed, or its reason
  written, in the same change. The probes run on `fixtures/demo/keyboard-shortcuts.html` (one grid with
  menus, filters, comments, merging, undo, clipboard, multi-column sorting and navigable headers) or on
  the catalog page that draws the feature. The verdict compares two snapshots of the grid
  (`effectsBetween()`): nothing changed is `shortcut-does-nothing` (2.1.1), the focus leaving the grid is
  `shortcut-moves-focus-out` (2.4.3), another effect is advisory. **Every probe starts from the page as it
  loaded**: a probe that changed the data, the merges, the sort, the filters, the collapsed groups, the
  frozen counts or the row selection makes the walker load the page again, because a cleared cell or a
  collapsed row made the next probe report a shortcut as dead. Write a probe from a cell the key can
  move from (the start cell of an arrow is not on the edge it moves toward), and read the fixture first:
  a read-only cell, a list that keeps the focus on its input (`aria-activedescendant`, which the
  snapshot counts as a move), a freeze bar that takes one arrow axis only.
- **2.1.4 is measured, not assumed.** With the focus on the sentinel outside the grid, printable keys must
  change nothing; and a documented shortcut that is a single character with no modifier
  (`singleCharacterShortcuts()`; none today) is listed as advisory, because it must work only while the
  grid has the focus.
- **The tab order has goldens, advisory.** `a11y/tab-order-goldens/<page>.json` holds every walk's stops as
  a reviewer reads them (region, role, name, cell). A difference is `tab-order-changed` (advisory, 2.4.3),
  a page without one `tab-order-golden-missing`. Record them with `HOT_A11Y_UPDATE_GOLDENS=1` and read
  the diff before committing: a golden pins what the grid does, findings included.

### The accessibility-tree snapshots

`a11y/checks/tree-snapshots.spec.ts`, the `tree-snapshots` check: 1.3.1, 1.3.2 and 4.1.2, read from
Chromium's accessibility tree of the grid's root container and its portal, on every page of the catalog
in its state and on every theme. The browser half flattens the tree (`a11y/checks/ax-tree.ts`), the pure
half judges it (`lib/aria-tree.mjs`, tested in `lib/__tests__/aria-tree.test.mjs`).

- **The tree as a screen reader gets it, in reading order.** `Accessibility.getFullAXTree` gives the roles,
  names and order; one `DOMSnapshot.captureSnapshot` gives each node's tag and attributes
  (`aria-rowindex`, `aria-colindex`, `tabindex`, the class), joined by backend node id. An ignored node is
  dropped and its children are read in its place. The axe scan reads the same tree against axe's rules;
  this check reads its order and structure, which no axe rule does.
- **Structure** (`structureFindings()`): the column headers read after the data rows
  (`headers-after-data`, 1.3.2), data rows without their row header while the row headers sit in rows of
  their own (`row-headers-apart`, 1.3.1), one row index exposed by several rows (`row-exposed-twice`,
  1.3.1), cells or rows read out of their index order (1.3.2), a grid role with no row (1.3.1). Today the
  first three show on every grid with headers: the overlay clones put the header row after the master
  table and repeat each row in the row-header clone. They are one root cause, reported per page and
  theme, because the evidence is per page.
- **Names and roles** (`nameFindings()`): a widget role with no name (`unnamed-control`), a column or row
  header with no name (`unnamed-header`), and a tab stop (a non-negative `tabindex`, or a native control)
  the tree gives no role (`focusable-without-role`). An empty grid cell needs no name; an element
  focusable by script only (`tabindex="-1"`, every cell) is not a tab stop. One finding per kind and
  element shape, with its node count. A closed cell editor stays in the DOM and in the tree, so its input
  is judged on every page.
- **Goldens, advisory, on the main theme.** `a11y/tree-goldens/<page>.yml` holds Playwright's
  `ariaSnapshot()` of the grid and the portal. The theme changes which rows are drawn, not the roles or
  names, so one theme keeps the goldens and every theme is judged. A difference is
  `tree-snapshot-changed`, with the first line that differs. Record with `HOT_A11Y_UPDATE_GOLDENS=1`
  (the same switch as the tab-order goldens) and read the diff before committing.

### The axe discovery run

`a11y/checks/axe-discovery.spec.ts`, the `axe-discovery` check, nightly only: axe with the
best-practice, AAA and experimental rules beside the WCAG 2.2 A and AA ones (`DISCOVERY_TAGS` in
`lib/axe-discovery.mjs`, tested in `lib/__tests__/axe-discovery.test.mjs`).

- **Triage, never the gate.** It reads and writes nothing of `a11y/axe-baseline.json` and never posts to
  `A11y / axe report`; its verdict is `A11y / axe-discovery report`. Its registry entry is `triage: true`
  with no criteria, because what it lists is for a person or the agent grader to sort, not for the
  conformance report to cite as it stands. A rule the gating scan already runs shows here too (on states
  and variants the scan does not reach), and each record names its family (`wcag-a-aa`, `wcag-aaa`,
  `best-practice`, `experimental`).
- **Every "needs review" result is listed with axe's reason.** `incomplete` is what axe could not decide;
  the gating scan only counts it. Here each one is an advisory `axe-needs-review` record per rule,
  element shape and reason (`nodeReason()`: the first message of its checks), with the node count and an
  example selector. A violation is an `axe-violation` record per rule and element shape, at axe's impact.
  A best-practice rule maps to no WCAG criterion, so its record carries an empty `criteria` list, which the
  evidence shape allows for that reason and counts as `summary.withoutCriterion`.
- **More states, in a list of its own.** `a11y/checks/discovery-pages.mjs` adds what no catalog page
  holds still: a cell focused from the keyboard, a hovered header button, the column menu of a sortable
  grid, a focused option of the filter value list, two selected ranges, a submenu inside a submenu
  (`keyboard-shortcuts.html?menu=nested`), a sheet tab being renamed, a modal dialog holding the focus. A
  page added there never reaches the gating scan's baseline. The openers are `DISCOVERY_STATES` in the
  spec; the catalog's come from the harness.
- **Every page in the dark scheme, right to left, and on a second phone.** Dark runs on every theme: a
  script installed before the fixture loads turns each `ht-theme-<name>` class the page or the grid writes
  into its dark form, so the grid and its portal are built dark (`?scheme=dark` reaches three fixtures
  only). Right to left runs on the main theme: the fixture is served with `dir="rtl"` on `<html>` and with
  the query it reads (`?dir=rtl`, `?rtl=1`, `?direction=rtl`, found in its source). The phone page runs on a
  Pixel 7 beside the iPhone 13. A record of a variant that did not apply says so (`variantApplied` in its
  detail) and carries no findings.

### Focus appearance and non-text contrast

`a11y/checks/focus-contrast.spec.ts`, the `focus-contrast` check: 2.4.7, 2.4.11 and 1.4.11 on every
theme, light and dark (the dark variant is the discovery run's, `a11y/checks/variants.ts`). The spec
captures pixels; the arithmetic and the verdicts are `lib/contrast.mjs` (tested in
`lib/__tests__/contrast.test.mjs`). `PLAN` in the spec says which page is measured for what.

- **Pixels, not computed styles.** The themes paint with translucent colors and `color-mix()`, so the
  color a user sees is the composited pixel. A capture is a `page.screenshot()` clip decoded by the page's
  own canvas; the device scale factor is 1, so a clip pixel is a CSS pixel. WCAG 2.2's relative luminance
  (the 0.04045 threshold) and a strict `< 3`: 2.996:1 fails although it rounds to 3.00.
- **A focus indicator is what changed.** The same area is captured before the focus arrives and after it
  arrives by the keyboard (an arrow key for a cell; a key press, then the focus, for a control, which is
  what makes `:focus-visible` match), and the changed pixels are the indicator (`indicatorChange()`).
  Nothing changed is `focus-not-visible` (2.4.7). A ring or an outline is judged against the colors next
  to it (`adjacentRatio`, the most common unchanged pixel), because a ring drawn over a grid line would
  read 1.92:1 against the line and 3.08:1 against the cell beside it, and 1.4.11 asks for the second. A
  highlight that repaints the element itself (a menu item) is judged against what it replaced. Under 3:1
  is `focus-indicator-contrast`.
- **Parts that identify a component or its state**: checkboxes, icons, the selection outline and the grid
  lines, each the strongest pixel against the area's dominant color (`strongestPixel()`). A part another
  element covers at its center, a disabled control (1.4.11 exempts it) and a part that draws nothing
  (`isDrawn()`: an arrow under the open editor, a grid line a theme leaves out) are skipped. A grid line is
  `moderate`: it identifies a cell only where nothing else does.
- **2.4.11 walks the focus.** On the pages with frozen panes and bars, the keyboard moves the focus across
  the grid and into its far corner and back; after each key 25 points of the focused cell are sampled with
  `elementFromPoint()`. The cell sampled is the topmost copy (`getCell(row, col, true)`): a frozen row is
  drawn by an overlay clone above the master, and sampling the master's copy read every frozen cell as
  hidden. A cell covered at every point is `focus-obscured`.

### Zoom, reflow, text spacing and hover content

`a11y/checks/reflow.spec.ts`, the `reflow` check: 1.3.4, 1.4.4, 1.4.10, 1.4.12 and 1.4.13 on every
theme. The spec measures boxes; `lib/reflow.mjs` (tested in `lib/__tests__/reflow.test.mjs`) decides what
counts as lost content.

- **Three conditions, each a viewport** (`CONDITIONS`): 320 by 256 CSS px for 1.4.10 (a 1280 by 1024
  window at 400%), 640 by 512 for 1.4.4 (200%), and the WCAG text-spacing override (`TEXT_SPACING_CSS`) for
  1.4.12, injected as a stylesheet as soon as the document has a head, so the grid measures its rows with
  it the way it would under a user's stylesheet. Each runs over every popup and bar of the catalog and the
  plain grid.
- **The grid body is exempt; everything around it is measured.** A data grid may scroll in two
  dimensions, so the main grid's tables are left out. The menus, the editors' lists, the comment editor,
  dialogs, notifications, the bars and the overlays are measured for text a clipping container cuts off
  (`text-clipped`; `text-truncated`, moderate, when the container ends it with an ellipsis), surfaces the
  viewport cuts off, and controls drawn over each other (`controls-overlap`, judged on the part of each
  box its clipping ancestors leave on screen, and never between a control and one inside it).
- **Where a surface is decides what reaching past the viewport means.** A surface positioned against the
  viewport (`position: fixed`, read from the computed style) that reaches past it cannot be scrolled to
  (`outside-viewport`). Any other surface past the right edge makes the page scroll sideways
  (`needs-horizontal-scroll`, the second scroll direction 1.4.10 does not allow outside a data table);
  past the bottom edge it is a vertical scroll away, which is allowed.
- **A measurement is taken on a settled page.** The spec measures until two measurements three frames
  apart agree (`settled` in the detail), and every check releases the data-provider fixture's parked
  fetches until none is left (`releaseParkedFetches()` in the harness): the catalog's opener releases the
  first fetch only, and whether the next one had landed changed what the bars showed between runs. The
  gating axe scan does not call it, so the state its baseline was taken in is unchanged.
- **Hover content** (1.4.13) is the comment of a commented cell: it must appear on hover, stay while the
  pointer moves onto it and while it rests there, and hide on Escape with the pointer still on it. "Stays"
  is measured on a fake clock (`page.clock`, installed once the comment shows), so the comment's own hide
  timers run, and ten seconds pass without a wait.
- **Orientation** (1.3.4): the grid's root must have an area on screen in a 390 by 844 and an 844 by 390
  viewport.

### Forced colors and reduced motion

`a11y/checks/forced-colors-motion.spec.ts`, the `forced-colors-motion` check, nightly only (every page is
watched for five seconds): 2.2.2, 2.3.3 and the forced-colors support of 1.4.1, on every theme. The spec
watches and captures; the verdicts are `lib/motion.mjs` (tested in `lib/__tests__/motion.test.mjs`).

- **Motion is read from `document.getAnimations()`, frame by frame.** One `requestAnimationFrame` loop in
  the page records every animation it sees running: CSS transitions, CSS animations and script
  animations alike, with the properties they animate, their duration, iterations and target, and when
  they were first and last seen. `page.clock` drives none of them (the trap in "The matrix" above), so the
  watch runs on real time. Motion is a change of position, size or transform for longer than 1 ms
  (`isMotion()`); an opacity or color fade is not, and a duration a reduced-motion rule shrinks to
  (0.01 ms) moves nothing.
- **Every catalog state is watched at rest for five seconds** with `prefers-reduced-motion: reduce`
  (`emulateMedia()`): motion still running is `motion-despite-reduced-motion` (2.3.3), and an animation
  seen running for the whole window that repeats without end or lasts five seconds or more is
  `moves-over-five-seconds` (2.2.2), moving or blinking alike. 2.3.3 is AAA, so its findings are
  `moderate`.
- **An interaction is watched with the preference and without it.** A sheet switch, a dialog shown, a
  notification shown and a context menu opened, each watched for 1.5 seconds under the variants
  `interaction-reduced-motion` and `interaction-motion-allowed` (never `reduced-motion`, which the watch at
  rest owns, and a target is keyed by its variant). Without the preference is the positive control: an
  interaction that moves there and not under the preference proves both that the watch sees motion and
  that the product honors the preference. Read it before trusting a clean result: the dialog and
  notification fixtures turn animation off so their states are reached at once, so the check turns it
  back on (the dialog's `animation` setting, the notification's `?animation=1`), and a fixture that
  animates nothing makes the reduced-motion half pass on nothing.
- **Forced colors is a capture, before and after.** With `forcedColors: 'active'` on the shared demo, the
  cell focus, a selected range and a menu item's highlight are captured before and after the keyboard
  reaches them, and the grid lines and the header menu icons at rest. A state that changes no pixel, or a
  part that draws nothing (`isDrawn()`, from `lib/contrast.mjs`), is a finding (`focus-`, `selection-`,
  `menu-highlight-`, `icon-` or `gridlines-lost-in-forced-colors`). Every capture is attached as a PNG to
  the test, for the person who reads the report. Chromium's emulation applies the system colors the way
  Windows High Contrast does; the colors themselves are the emulation's, not a Windows theme's.

### Adding a check

Add its entry to `EVIDENCE_CHECKS` in `lib/a11y-evidence.mjs` (a title and the criteria it
evidences), a project named by the entry's key to `playwright.a11y-checks.config.ts`, and its spec to
`a11y/checks/`. Write the measurer or matcher as a pure function with a tooling test that is red
before the function exists. Prove the check on the product with a planted defect (a fixture hook that
removes a focus ring or a name), shown in the check run of its pull request, then reverted. Document
its rules here, its line in `handsontable/.ai/TESTING.md` and its job in `.ai/CI.md`.

## Screen readers: the NVDA lane

`screenreader/screenreader.spec.ts` drives a real screen reader through Guidepup
(`@guidepup/playwright` and `@guidepup/guidepup`, MIT, devDependencies of this package only; the
`@guidepup/setup` CLI, pinned at 0.29.3, runs through `npx -y` and is never installed, because its
optional recording helper depends on a GPL-licensed ffmpeg build, which the dependency rule keeps out
of the lockfile) over the scenarios of `screenreader/scenarios/`, one Playwright project per screen
reader and browser (`playwright.screenreader.config.ts`: `nvda-chromium`, `nvda-firefox`; the VoiceOver
projects `vo-webkit` and `vo-chromium` are named for the next lane). It writes a transcript per
scenario, and `scripts/screenreader-report.mjs` turns the transcripts into the job summary and the
`Screen reader / <project> report` check run. CI runs it on its own nightly
(`.github/workflows/screenreader-nightly.yml` calling `screenreader.yml`, NVDA on `windows-2025`, one
browser per job), never in the pull-request Tests pipeline. This is the evidence the Accessibility
Conformance Report cites for what a cell, a header, a state and a status message announce (WCAG 1.3.1,
4.1.2, 4.1.3): the axe scan reads the accessibility tree, this lane reads what a screen reader makes of
it.

- **Report-only, and the rule is one constant.** `SCREENREADER_MODE` in `lib/screenreader-transcript.mjs`
  is `report`: a missing token group or a golden difference is a row in the summary, a line in the
  transcript, an annotation on the step's line in the scenario file and a `neutral` check run, and the
  test passes. The job carries `continue-on-error`, so even a tooling red never fails the nightly. What
  fails a test is tooling only: a fixture that does not load, a constructor throw, a step whose `after`
  state never comes, a screen reader that does not start. The flip to `gate` (a missing token group
  fails the test; a golden difference stays advisory) changes the constant, the pinned tooling test
  and this section together, after the nightly has shown the token groups report what changed and
  nothing else.
- **A scenario is data, not code**: `screenreader/scenarios/<surface>.scenario.json`, one file per
  surface, with `fixture` (under `fixtures/demo/`), an optional `query`, a `setup` (the API selection
  that puts the focus in the grid, so the first key reaches it) and ordered `steps`. A step has an
  `id`, one `action` (`press` a Playwright key or chord, `type` text, `selectCell` `[row, col]`), its
  `expect` token groups, an optional `after` (`{ "visible": "<selector>" }` or `{ "hidden": … }`,
  awaited inside the capture so the state's announcement is in it, and a red test when it never comes)
  and a `note`. The schema is `lib/screenreader-scenario.mjs`, and
  `lib/__tests__/screenreader-scenarios.test.mjs` (root `test:tooling`) validates every committed file,
  so a mistake fails on the pull request and not inside a 30-minute Windows job. That includes every
  `press` value, checked against Playwright's key names (`PRESS_PATTERN`: an optional chord of `Shift`,
  `Control`, `Alt`, `Meta` or `ControlOrMeta` joined by `+`, then a named key such as `ArrowRight`,
  `F10` or `KeyA`, or one printable character), so a misspelled `ArrowRigth` is refused there. Keys go
  to the page with `page.keyboard.press()`, so the screen reader sees the page react and never the
  keystroke; the scenario reads the same on every lane, because what differs per screen reader is the
  wording, which the goldens hold per project.
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
  The **goldens** (`screenreader/goldens/<project>/<scenario>.json`) are the exact normalized
  announcement per step, advisory only: a wording change in NVDA, the browser or the core shows as a
  golden difference in the summary, and the fix is to re-record once the new wording is right. The
  normalizer (`normalizeAnnouncement()`) lowercases, folds Unicode, drops punctuation, collapses
  whitespace and removes the screen reader's own chatter (`CHATTER`: the mode switch, `clickable`).
- **Recording goldens is a CI job, because nobody has NVDA on a Mac.** Dispatch the nightly from the
  branch with the `update-goldens` input: the run records every project's goldens on the runner
  (`HOT_SR_UPDATE_GOLDENS=1`, or Playwright's `--update-snapshots` through
  `npm run test:screenreader:update-goldens`) and uploads them as
  `screenreader-goldens-nvda-<browser>`; download, commit under `screenreader/goldens/<project>/`,
  done. A run with `update-goldens` compares nothing and reports `recorded`. A golden pins the wording
  as recorded, a finding included: a step NVDA stays silent on is an empty string in it, and a wrong
  row is the wrong row. The scenario's `note` says which steps record a finding (`Finding: …`), so a
  golden difference on such a step can be the fix; re-record the golden when the finding is fixed.
  `lib/__tests__/screenreader-goldens.test.mjs` (root `test:tooling`) reads every committed golden: it
  parses, has `schema` 1, names its file as its scenario and its directory as its project (a project of
  the config, never `dom-echo-chromium`, and an `nvda-*` golden was recorded by NVDA), lists the
  scenario's step ids in order, and holds each step as a normalized string (what the update mode
  writes; a hand-edited raw text would differ on every run). A step renamed, added, removed or moved
  therefore fails that test until the golden is re-recorded. A step id starts with a letter, because
  `JSON.parse` moves an integer-like key (`"2"`) ahead of the others.
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
  the directory as `screenreader-transcripts-nvda-<browser>` and the Playwright report as
  `screenreader-playwright-report-nvda-<browser>`, both outside the `playwright-report-*` glob the
  flake ledger reads, and the config has no JSON reporter, so nothing here becomes a flake record.
- **The runner enters the grid the way a user does, then pins the mode.** The Guidepup reader calls
  `navigateToWebContent()` (the browser window focused, the reader at the top of the document), the
  setup selects a cell through the API, and `ready()` reads the mode NVDA last announced (a mode switch
  is spoken, not played, through the `virtualBuffers.passThroughAudioIndication` setting the start
  options turn off) and toggles once or twice until it is focus mode: NVDA switches to focus mode on
  its own when the focus lands on a gridcell, and the toggle round trip is what keeps every transcript
  in that mode whatever NVDA did. The last mode phrase wins, inside one phrase too; a toggle that names
  no mode leaves `(no mode announced after the toggle)` at the end of the transcript's `entering`, and
  the run goes on. The focus highlighter is off in the same settings. Then the log is
  cleared, and every step is `screenReader.capture(() => …, { capture: true })`, which waits a second
  of silence after the last phrase. A step whose capture is empty is listened to once more for another
  silence window, so a phrase NVDA speaks late (Shift+F10 on Firefox) usually lands on its own step.
  Guidepup discards speech that arrives while it stops the previous utterance, so the second listen
  reduces late phrases in the next step, it does not remove them. A step therefore costs a second and
  more, and a scenario is minutes: the config's test timeout is five minutes with two retries,
  Guidepup's own mitigations. The run step's `timeout-minutes` is 25 and the job's 30: a step timeout
  is a step failure, so the transcripts, the summary and the check run still come, where a job timeout
  cancels them.
- **A screen reader is one per machine, so the lane is serial and headed.** `withGuidepup()` pins one
  worker, no parallelism and `headless: false` on every project; the matrix gives each browser its own
  job. The spec adds no serial mode on top: it would skip every scenario after a red one and re-run the
  passed ones on a retry. Two things follow. A second Guidepup lane (VoiceOver) is a second job, never
  a second project in the same job. And the reader is behind the spec's `Reader` interface (`enter`,
  `ready`, `capture`), so a lane adds its reader and leaves the scenarios alone: VoiceOver needs its
  own way into the grid (`interact()`), which is the next pull request.
- **`HOT_SR_LANE=dom-echo` proves the runner without a screen reader.** On any platform,
  `HOT_SR_LANE=dom-echo npm run test:screenreader` runs every scenario in headless Chromium against a
  reader that echoes the focused element's accessible name, role (in the words a screen reader speaks:
  `column header`, `menu item`, `edit`), grid position and states two frames after the action. The
  echo checks the fixture, the keys, the `after` states and the report plumbing, locally, before the
  Windows job does. Its wording rows are not evidence: it always announces the focused element, so a
  step a screen reader stays silent on (`close-editor`) announces on the echo, and a token row there
  says nothing about NVDA. Its transcripts carry `dom-echo-chromium`, it never runs in CI, and its
  goldens are never committed.
- **A missing token group is a finding or a strict token list, and the transcript says which.** Read
  the spoken text: an announcement that carries the fact in other words widens the synonyms; one that
  lacks the fact is a defect to fix in the core (the lane's purpose) and stays listed until it is, with
  a `Finding: …` sentence in the step's `note`. A group a step cannot satisfy today records the gap:
  `extend-range` in `grid-core` asks for the new end cell and its selected state, a range extension
  moves no focus, and a miss there is the finding. Never delete a group to turn a row green.
- **Adding a scenario**: a fixture under `fixtures/demo/` that keeps the fixture contract (the
  `?theme=`/`?bundle=` block, `window.hot`, a constructor throw captured as `htBuildError`), small
  enough that every step's target is rendered; the file `screenreader/scenarios/<surface>.scenario.json`
  with the setup and the steps; `HOT_SR_LANE=dom-echo npm run test:screenreader` to see the shape of
  the announcements; a nightly dispatch from the branch for the real ones; the goldens from an
  `update-goldens` dispatch, read before they are committed. Keep every step's `"id"` on its own line:
  the check run annotates that line.
- **Locally on Windows**: `npx -y @guidepup/setup@0.29.3 install nvda` in `tests/` once (the portable
  NVDA build the installed `@guidepup/guidepup` names, with the Guidepup add-on), the UMD build with
  the minified stylesheets, then `npm run test:screenreader`. The lane follows the platform: NVDA on
  Windows, and `HOT_SR_LANE` to pick one explicitly. macOS has no default lane yet: the config throws
  unless `HOT_SR_LANE` is set, because the VoiceOver runner lands in the next pull request, and a
  default would start VoiceOver only for the spec to throw. On a Mac, `HOT_SR_LANE=dom-echo` runs the
  scenarios without a screen reader.

The chain from the nightly to the config is pinned by `.github/scripts/__tests__/screenreader-workflow.test.mjs`;
the normalizer, the matcher, the golden diff, the report and the check-run poster by the
`screenreader-*` and `github-check-run` tests under `lib/__tests__/`.

/**
 * The branch that holds the golden screenshots.
 */
export const BASE_BRANCH = 'develop';
/**
 * The list of wrappers that are to be tested.
 */
export const WRAPPERS = ['angular-wrapper', 'react-wrapper', 'vue3'];
/**
 * The framework that provides reference screenshots to compare against other frameworks.
 */
export const REFERENCE_FRAMEWORK = 'js';
/**
 * The list of themes to test.
 */
export const THEMES = ['main', 'main-dark', 'horizon', 'horizon-dark'];
/**
 * The bare js render, the one variant that has no theme name: `HOT_THEME` is unset for it, which is what
 * makes `helpers.screenshotPath()` drop the `-theme-` suffix and write to `js/chromium/`. The token names
 * that variant inside a spec's `themes` declaration (`lib/visual-declarations.mjs`) so the js axis is one
 * flat list a codemod can write and a budget can sum. It is a declaration token only — passing it through
 * `HOT_THEME` would request a theme that does not exist, because `helpers.getSearchUrlParams()` appends
 * `?theme=` whenever the variable is set and `src/test-runner.ts` reads `hotTheme.includes('dark')`.
 */
export const CLASSIC = 'classic';
/**
 * Every variant the js leg renders on chromium, in golden-layout order: the bare run plus the four themes.
 * A js-only or multi-framework spec that renders everywhere declares exactly this list.
 */
export const JS_VARIANTS = [CLASSIC, ...THEMES];
/**
 * The port for the static server that serves the examples.
 */
export const EXAMPLES_SERVER_PORT = '8082';
/**
 * The Playwright projects of `playwright-cross-browser.config.ts`, in its order.
 */
export const CROSS_BROWSERS = ['chromium', 'firefox', 'webkit'];
/**
 * What each tier renders. `VISUAL_TIER` selects one (`lib/visual-tiers.mjs` resolves it; unset, a push to
 * `BASE_BRANCH` is `seed` and any other branch is `full`, which is exactly what a local run always did).
 *
 * - `pr`: every pull request. js on chromium with the two default themes; no bare "classic" render, no
 *   cross-browser leg, and a wrapper only when `VISUAL_WRAPPERS` names it (test.yml passes the Checks scope
 *   router's `visual-wrappers` list — the wrappers whose own `wrappers/<pkg>/` tree changed — so a wrapper
 *   change renders that wrapper for real and a core change renders none). Measured on 82 pull
 *   requests (2026-09-09): the stage rendered 1646 goldens and added a mean 15.1 minutes per run, no real
 *   regression was confined to one theme, browser or wrapper, and the classic variant was byte-identical to
 *   `main` on 199 of its 234 goldens — a delivery-path parity check, not a fifth theme.
 * - `seed`: a push to a base branch (develop through visual-seed.yml, master and release/* through test.yml).
 *   Everything the golden records hold today: js bare + 4 themes, the cross-browser leg, and the three
 *   wrappers COPIED from the js bare render (the js-copied-baseline gotcha in AGENTS.md), so the golden set
 *   keeps its full shape and every tier compares against an exact subset of it.
 * - `full`: the weekday nightly (visual-nightly.yml) and any pull request that touches the visual tier itself
 *   (`visual-tests/`, `examples/next/visual-tests/` — the router's `visual-full`). Everything, with the
 *   wrappers rendered for real from their own demos. A full render is never reconciled into base/ (the
 *   nightly publishes to nightly/<branch>); the one exception is the bootstrap of a branch that has no
 *   goldens yet, which promotes whatever its first pull request rendered (AGENTS.md, Bootstrap).
 *
 * `frameworks`: what run-tests.mjs renders; `classic`: the bare chromium js run with no HOT_THEME; `themes`:
 * the HOT_THEME runs; `browsers`: the cross-browser leg's projects, empty when the leg does not run in that
 * tier; `copyWrappers`: after rendering, copy `js/chromium/multi-frameworks` into each wrapper directory.
 *
 * The tier is one half of what a build renders. The other half is each spec's own `visualTest()`
 * declaration (`lib/visual-declarations.mjs`), so the golden set is the sum of the declarations
 * intersected with the tier: a variant the tier launches but the spec does not declare skips at file
 * scope and costs nothing. Measured on 2026-09-18 (`base/develop/out.json`): 1676 records — 240 per js
 * variant × 5, 92 per wrapper × 3, and 68 / 66 / 66 on chromium / firefox / webkit; a `pr`-tier render is
 * 480 of them. `lib/__tests__/visual-declarations.test.mjs` derives those eleven counts from the
 * checked-in declarations, so a trim or a new spec moves a number a reviewer can see.
 */
export const VISUAL_TIERS = {
  pr: {
    frameworks: [REFERENCE_FRAMEWORK],
    classic: false,
    themes: ['main', 'main-dark'],
    browsers: [],
    copyWrappers: false,
  },
  seed: {
    frameworks: [REFERENCE_FRAMEWORK],
    classic: true,
    themes: THEMES,
    browsers: CROSS_BROWSERS,
    copyWrappers: true,
  },
  full: {
    frameworks: [REFERENCE_FRAMEWORK, ...WRAPPERS],
    classic: true,
    themes: THEMES,
    browsers: CROSS_BROWSERS,
    copyWrappers: false,
  },
};

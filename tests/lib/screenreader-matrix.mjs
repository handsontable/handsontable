/**
 * The axes of the screen reader lanes, `.github/workflows/screenreader.yml`: the Playwright projects of
 * `playwright.screenreader.config.ts` that run in CI (one job per screen reader, a matrix entry per
 * browser: `nvda-<browser>` on Windows, `vo-<browser>` on macOS; the `dom-echo` lane never runs there),
 * and the scenario groups a lane job runs one of (`tests/AGENTS.md`, "Screen readers: the NVDA and
 * VoiceOver lanes").
 *
 * Dependency-free on purpose: the nightlies' `check-inputs` and `verdict` jobs read these lists from a
 * sparse checkout of `tests/lib` and `tests/scripts` (`a11y-dispatch.mjs`), where
 * `screenreader-scenario.mjs`, which imports the page catalog, cannot load.
 * `.github/scripts/__tests__/screenreader-workflow.test.mjs` keeps both lists equal to the matrices, the
 * verdict's expected check runs and the config's projects.
 */

/**
 * The reader projects, the `projects` input's names: `SCREENREADER_PROJECT` of each lane job, and the
 * first word after the prefix of its `Screen reader / <project> <group> report` check run.
 */
export const SCREENREADER_PROJECTS = ['nvda-chromium', 'nvda-firefox', 'vo-webkit', 'vo-chromium'];

/**
 * The scenario groups, the `groups` input's names. Guidepup runs one scenario at a time per machine, so
 * a project's scenarios run in series, and they split into groups that each fit the 40-minute run step
 * (`scenarioBudgetMs()` of `screenreader-scenario.mjs`, summed per group by the workflow test), each a
 * matrix entry of the workflow with its own job, check run and artifacts. `keyboard`: what a keyboard
 * user does in the grid itself. `reading`: the reading-mode traversals, minutes each on VoiceOver.
 * `menus`: the menus and the filters inside them, the comment editor, the column summary row and the
 * links autoLink draws. `editors`: the cell editors and the checkbox cell. `selection`: row selection
 * and the check all header. `structure`: nested and collapsible headers, merged cells and the freeze
 * bars. `status`: the status messages and the bars around the grid (pagination, the sheets bar, a
 * dialog, a notification, the loading and empty data overlays, a value that resolves later). A new
 * group joins this list, the workflow's matrix and its `exclude` together; the workflow test keeps
 * them equal.
 */
export const SCENARIO_GROUPS = ['keyboard', 'reading', 'menus', 'editors', 'selection', 'structure', 'status'];

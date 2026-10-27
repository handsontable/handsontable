# Proving a change is accessible

Three kinds of proof, and a UI change ships the ones that apply. The axe scan finds missing
structure, names and contrast on a resting page. Only a test can show that a keyboard user reaches
the control, operates it and gets focus back, and that a screen reader hears what changed.

## 1. A keyboard-only Playwright flow (`tests/e2e/`)

New E2E is Playwright (`handsontable-playwright-e2e` skill; `tests/AGENTS.md` for the fixture
contract and the leg tags). The accessibility part of a spec:

- **Keys only, from a known start.** Put the grid in its starting state through the API
  (`hot.selectCell()` in `page.evaluate`) or by tabbing in from the page, then drive the surface
  with `page.keyboard.press()` and nothing else: open, move, operate, close.
- **Assert focus at each step**, with web-first `toBeFocused()`: inside the surface after it opens,
  on the operated control, and back on the cell or the opener after it closes.
- **Locate by role and name**, which asserts both at once:
  `page.getByRole('menuitemcheckbox', { name: 'Read only' })`. Add
  `toHaveAccessibleName()`, `toHaveAccessibleDescription()` and `toHaveAttribute('aria-expanded',
  'true')` for the states the change sets. A header whose name a sort badge changes is the
  exception (`tests/AGENTS.md`, "A header's accessible name can change under a role locator").
- **Read an announcement from its live region.** The announcer keeps two regions in the instance's
  portal, `[role="status"][aria-live="polite"]` and `[role="status"][aria-live="assertive"]`, and
  `announce()` writes to the assertive one unless the caller passes `'polite'`. Wait on the region
  the code under test uses, for example
  `page.locator('.ht-portal [role="status"][aria-live="polite"]')`, then `toHaveText(message)`.
  Assert the text the user hears, not that `announce()` was called.
- **Declare the legs.** A flow whose keys or focus an engine could get wrong carries
  `CROSS_BROWSER_TAG`; one whose result depends on the theme (a focus ring, a target size) carries
  `THEMES_TAG`.

A unit test (`*.unit.ts`) is enough for a pure helper that builds attributes or a name, but never
stands in for the flow: it cannot see focus.

## 2. The axe scan and its coverage map (`tests/a11y/`)

- **Run it** after `npm --prefix handsontable run build:umd`, `build:styles.min` and
  `build:themes-css.min`: `npm --prefix tests run test:a11y`. Scope it with
  `-g " <page-id> on <theme>$"` while iterating (anchored, or `sheets-bar` also matches
  `data-provider-sheets-bar`). It writes `tests/test-results/a11y/a11y-report.html`
  (open it to locate each element) and `a11y-findings.json` (read it as an agent).
- **The result a PR needs:** no `new` and no `grown` finding. An `improved` or `stale` finding
  means the change fixed something: lower `nodes` or delete the entry, and the issue with its
  last entry.
- **A new surface gets a page.** A new plugin or editor with UI, or a new state of an existing one
  (an open menu, an expanded row, a dialog variant), adds a page to `tests/a11y/pages.mjs` with a
  keyboard opener (`tests/AGENTS.md`, "Adding a page"). Findings on a surface the PR adds are the
  PR's to fix.
- **Every plugin and editor has a coverage entry** in `tests/a11y/coverage.mjs`: `pages` (the
  pages that scan it), `none` (it draws nothing a scan could check, and why) or `gap` (it draws UI
  no page scans yet). `tests/lib/__tests__/a11y-coverage.test.mjs` in the root `test:tooling`
  fails on a folder without an entry, and on a new gap: `A11Y_GAP_LIMIT` only goes down. Closing a
  gap means adding its page, baselining what the page finds that already existed under an issue,
  and lowering the limit.
- **In CI**, the `A11y / axe` job runs the scan on every PR that touches core or `tests/`. Read the
  `A11y / axe report` check run (`neutral` = something needs action; its annotations sit on the
  line to change) or the sticky comment, and download `a11y-findings.json` from the
  `a11y-axe-results` artifact for the detail.

## 3. What neither covers

The scan checks that a name exists, not that it means anything; it never presses a key, follows
focus, hears an announcement, drags, or zooms. The flow in section 1 covers keys, focus and
announcements. A new widget pattern, or a change to how one is announced, also gets a pass with a
real screen reader from the tested matrix in `docs/content/data/accessibility.json` (VoiceOver on macOS
or iOS, NVDA on Windows with Chrome or Firefox): say what to listen for on
the PR template's `MANUAL QA NEEDED` line.

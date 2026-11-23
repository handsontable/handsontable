# Proving a change is accessible

Three kinds of proof on the pull request, and a UI change ships the ones that apply. The axe scan
finds missing structure, names and contrast on a resting page. Only a test can show that a keyboard
user reaches the control, operates it and gets focus back, and that a screen reader hears what
changed. The checks beyond axe (section 4) measure the rest: their short suite on the pull request
too, the others in the weekly audit after the merge.

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
  `A11y / axe report` check run (red = a new or grown critical or serious finding, neutral = a
  moderate or minor one, by `tests/AGENTS.md`, "A11y: the verdict of a check run"; its annotations sit on the
  line to change) or the sticky comment, and download `a11y-findings.json` from the
  `a11y-axe-results` artifact for the detail: `gh run download <run-id> -n a11y-axe-results -D <dir>`.

## 3. What the scan and the flow do not cover

The axe scan checks that a name exists, not that it means anything, and it never presses a key,
follows focus, hears an announcement, drags, or zooms. The checks of section 4 do: the short suite
on the pull request, the others after the merge, so run the one your change needs before you push.
The flow in section 1
covers keys, focus and announcements on the pull request itself. A new widget pattern, or a change
to how one is announced, also gets a pass with a real screen reader from the tested matrix in
`docs/content/data/accessibility.json` (VoiceOver on macOS or iOS, NVDA on Windows with Chrome or
Firefox): say what to listen for on the PR template's `MANUAL QA NEEDED` line.

## 4. The checks beyond axe and where they run

Every check beyond axe (`tests/a11y/checks/`), the screen reader lanes and the docs and website
checks run in the Monday audit on develop. A pull request runs the short suite beside the axe scan,
the checks with `pullRequest: true` in `EVIDENCE_CHECKS` (`tests/lib/a11y-evidence.mjs`), report-only:
the findings ledger is its baseline, so a finding whose row is open is known and does not count, and a
regression (a resolved row) or a new finding counts by the severity rule in its
`A11y / <check> report` check run, which can turn red while the job stays green. What the audit
finds lands in the ledger (the test-health page) under its cluster, and `references/classes.md` names
the check that proves each class and where it runs. The criteria of each check are its entry in
`EVIDENCE_CHECKS`; the rules are `tests/AGENTS.md`, "A11y: the checks beyond axe".

| Check | Measures | On a pull request |
|---|---|---|
| `keyboard-walker` | Tab walks, traps and modal exits, focus after Escape, stops with no role or name, the APG grid keys, every documented shortcut | yes |
| `tree-snapshots` | the accessibility tree's order, roles and names, against a golden per page | yes |
| `focus-contrast` | focus indicators and non-text contrast, in pixels, every theme light and dark | yes |
| `reflow` | 320 CSS px, 200% zoom, text spacing, hover content | yes |
| `pointer` | an action on press, a drag with no alternative | yes |
| `forced-colors-motion` | what forced colors no longer draw, motion that runs on | weekly only |
| `axe-discovery` | axe's wider rules and its needs-review results, for triage | weekly only |

- **Run one locally**, after `build:umd`, `build:styles.min` and `build:themes-css.min`:
  `A11Y_CHECKS=<check> npm --prefix tests run test:a11y-checks` (the short suite of the fast ones:
  `HOT_A11Y_CHECKS_SUITE=pull-request`, what a pull request runs). Each writes
  `tests/test-results/a11y-checks/<check>.json`; a critical or serious finding there is what the pull
  request or the audit will report.
- **A proof run on CI** dispatches the nightly from your branch:
  `gh workflow run a11y-nightly.yml --ref <branch> -f checks=<check>`. It costs runner minutes, and
  develop refuses a subset, so run locally first.
- **Goldens move with the change.** `HOT_A11Y_UPDATE_GOLDENS=1` records the tab-order and tree
  goldens; read the diff before committing. A change to the rendered structure updates the tree
  golden in the same pull request, or the audit reports it as drift.
- **The screen reader lanes** (`tests/screenreader/`) run on macOS and Windows runners, one run at a
  time; their scenarios and goldens are in `tests/AGENTS.md`. **The docs and website checks**
  (`docs-*`, `website-*`) read a deployed site, from `docs-a11y.yml` and `website-a11y.yml`, weekly
  only: a pull request that changes a site scan's own files runs that axe scan, never the checks.

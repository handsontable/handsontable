---
name: handsontable-a11y
description: Use whenever a change touches anything a user can see or operate in Handsontable - DOM a plugin, editor, renderer, menu, dialog or bar creates; ARIA roles or attributes; keyboard shortcuts; focus; screen reader announcements; theme colors, sizes or focus rings - and when fixing a finding of the axe scan (`tests/a11y/`, `a11y-findings.json`, the `A11y / axe report` check). Covers the bar (WCAG 2.2 A and AA), the accessibility plan to write before coding, the build rules on top of core's ARIA helpers, focus scopes, shortcut contexts and announcer, how to prove it (keyboard-only Playwright flows, accessible names, the scan and its coverage map), and the loop for fixing a tracked finding.
---

# Accessibility in every development round

The bar is **WCAG 2.2 Level A and AA**, the level the published conformance report claims
(`docs/content/guides/accessibility/accessibility-conformance-report/`). The axe scan catches part
of it after the fact; this skill makes the rest part of the round. Accessibility is planned with the
change, built with core's helpers, proven in tests, and reviewed like any other dimension.

## The round

1. **Plan.** Before writing code for a UI change, write its accessibility plan into the plan or
   the PR description (template below). A surface without a plan gets its roles, names and keys
   invented while coding, which is how the menus ended up with roles their structure contradicts.
2. **Build** by the rules below. Pick the pattern from `references/patterns.md`.
3. **Prove** it with the tests in `references/proving.md`: a keyboard-only Playwright flow,
   accessible-name and state assertions, an announcement check where one fires, and the axe scan.
   A new plugin or editor adds its entry to `tests/a11y/coverage.mjs`, and the root
   `test:tooling` fails until it does.
4. **Review** with the accessibility dimension of the `handsontable-code-review` skill
   (`references/performance-a11y.md`), and read the `A11y / axe report` check on the pushed PR:
   `neutral` means a finding needs action.

### The accessibility plan

```markdown
**Accessibility plan**
- Surface: <what appears, where it mounts: grid root, portal, dialog>
- Pattern: <APG pattern, from references/patterns.md> – roles, and their required parents and children
- Names: <the accessible name of every control, and its i18n phrase>
- Keyboard: <the keys, the shortcut context they register in, how a keyboard user enters and leaves>
- Focus: <the focus scope, where focus lands on open, where it returns on close>
- Announcements: <what changes without a focus move, and the message, polite or assertive>
- Theme: <tokens for color and size it touches; contrast and target size in all three themes>
- Proof: <the E2E flow, the scan page in tests/a11y/pages.mjs, the coverage entry>
```

Write "none" for a line that does not apply, never leave it out: "Announcements: none, every change
moves focus" is a decision; a missing line is not.

## Build rules

- **Native element first.** An action is a `<button type="button">`, a field is an `<input>` or
  `<textarea>` with a name. A role goes only where no native element fits, and never a click
  handler on a bare `<div>`.
- **Roles and attributes through `src/helpers/a11y.ts`.** Write them with
  `setAttribute(element, [A11Y_MENU(), A11Y_LABEL(name)])` from `src/helpers/dom/element`. A
  missing attribute gets a helper there, not a string literal at the call site.
- **Required structure holds.** Every role has the parents and children the ARIA spec requires: a
  `menuitem` sits in a `menu`, an `option` in a `listbox`, a `row` in a `grid` or `rowgroup`. When a
  widget role is drawn with table markup (the menus and lists are Handsontable grids), the
  `table`, `tbody` and `tr` in between carry `role="presentation"`. One role per interactive
  element, and no interactive element inside another.
- **States only where the role supports them.** `aria-selected` goes on `gridcell`, `option`,
  `row` or `tab`, never on `menuitem`; a checkable item is `menuitemcheckbox` with `aria-checked`.
- **Every control has a name, and the visible text is part of it.** A name comes from visible
  text, a `<label>`, `aria-labelledby` or `aria-label`, and always from an i18n phrase
  (`src/i18n/constants.ts`, `hot.getTranslatedPhrase()`): never hard-coded English (the
  `i18n-translations` skill). Decorative icons carry `aria-hidden="true"`.
- **`ariaTags: false` changes nothing but ARIA.** Where a surface writes its ARIA only when
  `hot.getSettings().ariaTags` is on (the grid, the menus), a new attribute there follows the same
  check. No behavior may read an `aria-*` attribute or depend on one existing.
- **Every pointer action has a keyboard path** (2.1.1), and a drag has a single-pointer or keyboard
  alternative (2.5.7). Keys register in a shortcut context
  (`hot.getShortcutManager().getContext('grid')`, or the surface's own context, which its focus
  scope switches on), never as a raw `keydown` listener. A new shortcut goes into the keyboard
  shortcuts guide (`docs/content/guides/navigation/keyboard-shortcuts/`).
- **A surface that takes focus registers a focus scope**
  (`hot.getFocusScopeManager().registerScope(id, container, { shortcutsContextName, … })`, as
  `dialog` and `pagination` do), puts focus inside on open, returns it to the cell or the opener on
  close, and unregisters in `disablePlugin()` and `destroy()`.
- **A change without a focus move is announced** with `announce(message, 'polite')` from
  `src/utils/a11yAnnouncer.ts` (a row selected, rows expanded, a page changed). `assertive` is for
  errors only, and one user action makes one announcement.
- **Colors and sizes come from theme tokens** (the `handsontable-css-dev` skill), and each pair
  clears its ratio in `main`, `horizon` and `classic`, light and dark: text 4.5:1 (3:1 from 24px, or
  18.66px bold), icons, borders and focus rings 3:1 (1.4.11), pointer targets 24 by 24 CSS pixels
  (2.5.8). A focused element is never fully hidden by a sticky overlay (2.4.11). Keep the
  `forced-colors` and `prefers-reduced-motion` blocks working.

## Fixing a finding the scan reports

1. Read `a11y-findings.json` (local run: `tests/test-results/a11y/`; CI: the `a11y-axe-results`
   artifact, `gh run download <run-id> -n a11y-axe-results -D <dir>`). `needsAction` has what the
   PR changed; `issues[].locations` has every place a known issue shows, with the steps per page in
   `pages`.
2. Reproduce on the fixture (`url` plus `steps`), fix the cause in the product, and re-scan:
   `npm --prefix tests run test:a11y` after `build:umd`, `build:styles.min` and
   `build:themes-css.min`. Scope a run with `-g " <page-id> on <theme>$"` (the leading space and
   the `$` keep `sheets-bar` from also matching `data-provider-sheets-bar`).
3. Delete the entries the fix removed from `tests/a11y/axe-baseline.json`, and the issue with its
   last entry; lower `nodes` where only some elements were fixed. The scan names each as
   `improved` or `stale`.
4. A finding the PR caused is fixed in the PR, never baselined to quiet the check. Only a finding
   that already existed and a new page exposes gets an entry, under an issue (`tests/AGENTS.md`,
   "Baselining a finding, and fixing one").

## References

- `references/patterns.md`: each Handsontable surface, its ARIA pattern, the helpers and the
  traps the scan has found.
- `references/proving.md`: the Playwright assertions for keyboard, names, states, focus and
  announcements; the scan, its coverage map and what it cannot see.
- `tests/AGENTS.md`, "A11y: the axe scan and its baseline": the scan's rules, the baseline and the
  reports.

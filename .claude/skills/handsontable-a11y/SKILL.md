---
name: handsontable-a11y
description: Use whenever a change touches anything a user can see or operate in Handsontable - DOM a plugin, editor, renderer, menu, dialog or bar creates; ARIA roles or attributes; keyboard shortcuts; focus; screen reader announcements; theme colors, sizes or focus rings - and when fixing a finding of the axe scan (`tests/a11y/`, `a11y-findings.json`, the `A11y / axe report` check), of the checks beyond axe (an `A11y / <check> report`, on a pull request or the weekly audit) or of the audit's ledger (a cluster of `tests/a11y/issues.json`, the test-health page). Covers the bar (WCAG 2.2 A and AA), the accessibility plan to write before coding, the build rules by defect class on top of core's ARIA helpers, focus scopes, shortcut contexts and announcer, how to prove it (keyboard-only Playwright flows, accessible names, the scan, its coverage map, the checks beyond axe), and the loops for fixing a tracked finding.
---

# Accessibility in every development round

The bar is **WCAG 2.2 Level A and AA**; public text about it follows root `AGENTS.md` ("Accessibility").
The scans catch part of it after the fact; this skill plans, builds, proves and reviews the rest.

## The round

1. **Plan.** Before writing code for a UI change, write its accessibility plan into the plan or the PR
   description (template below): without one, roles, names and keys get invented while coding.
2. **Build** by the rules below. Pick the pattern from `references/patterns.md`.
3. **Prove** it with the proofs that apply, from `references/proving.md`: a change to something a user
   operates (keys, focus, a control, a name, an announcement) ships a keyboard-only Playwright flow with
   accessible-name and state assertions; a color or size change proves itself with the axe scan in all
   three themes; a rule whose check runs weekly only, by running that check on the branch. A new plugin
   or editor adds its entry to `tests/a11y/coverage.mjs`.
4. **Review** with the accessibility dimension of the `handsontable-code-review` skill, and read the
   `A11y / axe report` and `A11y / <check> report` check runs on the pushed PR (`tests/AGENTS.md`).

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

Each rule ends with its defect classes (`references/classes.md`: criteria, check, where it runs).

- **Native element first, and every control has a name.** An action is a `<button type="button">`, a
  field an `<input>` or `<textarea>`; a role goes only where no native element fits, never a click
  handler on a bare `<div>`. A name contains the visible text and comes from an i18n phrase (the
  `i18n-translations` skill). Anything that takes focus has a role and a name; a message that needs no
  focus is a live region, never a `tabindex` stop. Decorative icons carry `aria-hidden="true"`. [C03]
- **Roles and attributes through `src/helpers/a11y.ts`**, written with `setAttribute(element,
  [A11Y_MENU(), A11Y_LABEL(name)])`; a missing attribute gets a helper there, not a string literal.
  `ariaTags: false` turns off the ARIA and the `tabindex="-1"` written with it, so a new attribute
  follows the same check; no behavior reads an `aria-*` one. [C02]
- **Required structure holds.** A role has the parents and children the ARIA spec requires (a `menuitem`
  in a `menu`, an `option` in a `listbox`); a widget role drawn with table markup puts
  `role="presentation"` on the `table`, `tbody` and `tr` between. One role per interactive element, none
  inside another, a state only where the role supports it (`aria-selected` never on a `menuitem`; a
  checkable item is `menuitemcheckbox` with `aria-checked`). [C02]
- **The grid keeps its own ARIA through a rendering change**: `role`, `aria-rowcount`, `aria-colcount`,
  `aria-rowindex`, `aria-colindex`, `aria-selected`. A layer that repeats cells, headers or rows hides
  the copies assistive technology does not read, and a structural change updates the tree golden. [C01]
- **A state a class draws is exposed too** (invalid, read only, commented, merged, a link in a cell), as
  an ARIA attribute or hidden text, or a screen reader reads a plain cell. A slider or splitter has
  `aria-valuetext` in words, from an i18n phrase. [C13]
- **Every pointer action has a keyboard path** (2.1.1), and a drag also has a single-pointer alternative
  that needs no dragging (2.5.7); a keyboard path alone does not meet 2.5.7. Keys register in a shortcut
  context (`hot.getShortcutManager().getContext('grid')`, or the surface's own), never as a raw `keydown`
  listener; a new shortcut goes into the keyboard shortcuts guide. [C06, C09]
- **A control acts on release** (`click`, or `pointerup` on the element pressed), never on `pointerdown`
  or `mousedown` (2.5.2). A press that starts a drag or a selection is the exception. [C09]
- **Tab can leave every surface Tab can enter**; only a modal dialog holds the focus. A shortcut of one
  character with no modifier works only while its surface has the focus (2.1.4). [C06]
- **A surface that takes focus registers a focus scope** (`hot.getFocusScopeManager().registerScope()`,
  as `dialog` does), puts focus inside on open, returns it to the cell or the opener on every close
  (Escape, Enter, Tab, a shortcut), and unregisters in `disablePlugin()` and `destroy()`. Closed UI
  holds no tab stop: `hidden` or `inert`, never `aria-hidden` alone. [C04]
- **Only the user moves focus.** `updateSettings()`, `render()` and enabling or disabling a plugin call
  `focus()` only if the grid held the focus when the call began (3.2.1, 3.2.2). [C05]
- **A change without a focus move is announced** through `announce()` (`src/utils/a11yAnnouncer.ts`). It
  defaults to `'assertive'`, so a status message passes `'polite'`; `assertive` is for errors only, and
  one user action makes one announcement. The live region exists before its text changes, and hidden
  status text is its own element, apart from the value. Core announces every selection politely
  (`src/core/selectionAnnouncer/`), so a plugin never announces one again. [C12]
- **Colors and sizes come from theme tokens** (the `handsontable-css-dev` skill), and each pair clears its
  ratio in `main`, `horizon` and `classic`, light and dark: text 4.5:1 (3:1 from 24px, or 18.66px bold),
  icons, borders and focus rings 3:1 (1.4.11), pointer targets 24 by 24 CSS pixels (2.5.8). [C08]
- **A focus indicator is never taken away.** No outline goes without a 3:1 replacement, a control shown
  on hover also shows on `:focus-visible`, and no sticky overlay fully hides the focus (2.4.11). [C07]
- **Color is never the only signal.** A state a color draws also draws a border, an outline or text,
  which `forced-colors` keeps, and a link in text is underlined (1.4.1). [C11]
- **Surfaces around the grid reflow** at 320 CSS px, 200% zoom and the text-spacing overrides, with no
  sideways scroll and no clipped text; the grid body may scroll both ways. Hover and focus content can
  be dismissed and hovered (1.4.13); as a house rule, motion stops under reduced motion. [C10]

## Fixing a finding

**From the axe scan** (`a11y-findings.json`; where to find it: `references/proving.md`, section 2):
1. `needsAction` has what the PR changed, and `issues[].locations` every place a known issue shows.
   Reproduce on the fixture (`url` plus `steps`), fix the cause in the product, and re-scan.
2. Delete the entries the fix removed from `tests/a11y/axe-baseline.json`, and the issue with its last
   entry; lower `nodes` where only some elements were fixed.
3. A finding the PR caused is fixed in the PR, never baselined to quiet the check. Only a finding that
   already existed and a new page exposes gets an entry, under an issue (`tests/AGENTS.md`).

**From the checks beyond axe** (an `A11y / <check> report`, a test-health row; a PR fixes what it caused):
1. Find its cluster in `tests/a11y/issues.json`, and its `defectClass` in `references/classes.md`: the
   rule it breaks and the check that proves the fix.
2. Fix the cause, not the page: one change usually clears the cluster everywhere. Run that check locally
   (`references/proving.md`, section 4), and add a keyboard-only flow for anything a user operates.
3. The next audit resolves the rows; never edit the ledger. A finding no cluster matches gets one, with
   its `defectClass`, in the change that sorts it.

## References

- `references/patterns.md`: each surface, its ARIA pattern, the helpers and the traps the scan found.
- `references/proving.md`: asserting keys, names, states, focus and announcements; every check, and its gaps.
- `references/classes.md`: the defect classes, their rules and checks; `rules.json` is its twin for scripts.
- `tests/AGENTS.md`: "A11y: the axe scan and its baseline", "A11y: the findings ledger and the cluster catalog".

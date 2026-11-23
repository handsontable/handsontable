# Defect classes

A defect class is the mechanism that produces a kind of accessibility finding, whatever surface it
shows on: one rule prevents every finding of the class, and one check proves the rule. Every cluster
of `tests/a11y/issues.json` names its class in `defectClass`, so a finding leads here: to the rule
it breaks, and to the check that shows the fix. The skill binds its rules to classes, never to
cluster ids, because the classes are few and stable and the clusters many and renamed.

`rules.json` beside `SKILL.md` is this table for scripts, and the two are twins: the root
`test:tooling` test `scripts/__tests__/a11y-skill-rules.test.mjs` fails when a row here differs
from its class there, and prints the row it expects. Edit `rules.json` and copy the row.

## How to read a row

- **Home** is where the rule text lives. `skill`: a build rule of `SKILL.md`, which ends with the
  class id (`[C09]`). `docs`: `docs/AGENTS.md`, "Accessible pages". `website`: the website
  repository's design guide; the rule is here for the record. `record-only`: no rule, because
  nothing the code does causes the finding (a screen reader's own behavior, a tool's noise,
  documented behavior); the cluster carries `notDefect`.
- **Enforced by** names each check and where it runs. *Pull request*: it reports on the pull request
  that adds the defect: the grid's axe scan (`axe`), the short suite of the checks beyond axe, the
  Playwright functional tier. *Weekly*: the Monday audit on develop finds the defect after the
  merge; run the check yourself before that (`references/proving.md`, section 4). The docs and
  website axe scans (`docs-axe`, `website-axe`) and site checks are weekly: no content pull request
  runs them. *Nowhere yet*: no check proves the rule. A check id is a key of `EVIDENCE_CHECKS`
  (`tests/lib/a11y-evidence.mjs`) or `SITE_CHECKS` (`tests/lib/a11y-site-checks.mjs`), `axe`,
  `docs-axe`, `website-axe`, `unit`, `e2e`, or `readers` (the screen reader lanes). A class lists
  every check that finds one of its clusters; the tooling test reads the catalog for that.
- **Strikes** counts the weekly-audit findings that broke the rule after it was written, each kept in
  `rules.json` as `{ cluster, audit, pullRequest }`. A rule broken twice (by two pull requests, or
  in two audits) becomes a check, and its prose in `SKILL.md` shrinks to a pointer: prose that does
  not stop the defect is length, not prevention. A cluster no rule can prevent goes to
  `notPreventable` in `rules.json`, as `{ cluster, reason }`.

## The classes

| Class | Name | WCAG | Home | Rule | Enforced by | Strikes |
|---|---|---|---|---|---|---|
| C01 | One grid tree: overlay copies and the rendered band | 1.3.1, 1.3.2, 4.1.2 | skill | The grid keeps `role`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex` and `aria-selected` through a change to rendering, selection, headers, frozen areas or merged cells. A layer that repeats cells, headers or rows says which copy assistive technology reads and hides the others, and a change to the rendered structure updates the tree golden in the same pull request. | `tree-snapshots` (pull request), `readers` (weekly) | 0 |
| C02 | Widget role without its required structure | 1.3.1, 4.1.2 | skill | Every role has the parents and children the ARIA spec requires, with `presentation` on the table markup in between, one role per interactive element, and states only on roles that support them. `combobox` never goes on a `textarea`. | `axe` (pull request), `tree-snapshots` (pull request), `axe-discovery` (weekly; the only run of aria-allowed-role, the rule that refuses a combobox on a textarea), `docs-axe` (weekly), `website-axe` (weekly), `readers` (weekly) | 0 |
| C03 | Control or focus stop with no name or role | 1.1.1, 1.3.1, 2.5.3, 4.1.2 | skill | Every control has a name from an i18n phrase that contains its visible text, and anything that takes focus has a role and a name. A message that needs no focus is a live region, never a tab stop. | `axe` (pull request), `keyboard-walker` (pull request), `tree-snapshots` (pull request), `docs-axe` (weekly), `website-axe` (weekly), `readers` (weekly) | 0 |
| C04 | Focus not returned, or a tab stop that should not exist | 2.1.2, 2.4.3, 4.1.2 | skill | Closing a surface by Escape, Enter, Tab or a shortcut returns focus to the cell or the opener. Closed or hidden UI holds no tab stop: `hidden` or `inert`, never `aria-hidden` alone. | `axe` (pull request; aria-hidden-focus only), `keyboard-walker` (pull request), `docs-keyboard` (weekly), `docs-axe` (weekly), `readers` (weekly) | 0 |
| C05 | Focus taken or context changed without a request | 3.2.1, 3.2.2 | skill | Only the user moves focus: `updateSettings()`, `render()` and enabling or disabling a plugin call `focus()` only if the grid held the focus when the call began. Focus arriving on a control changes no context. | `docs-keyboard` (weekly; the docs examples are the only pages that change a setting while a control outside the grid holds the focus), `keyboard-walker` (pull request; a change of context on focus or on input; no catalog page updates settings) | 0 |
| C06 | Keyboard trap or keyboard-only gap | 2.1.1, 2.1.2, 2.1.4 | skill | Every pointer action has a keyboard path through a shortcut context. Tab can leave every surface Tab can enter, and only a modal dialog holds the focus. A shortcut of one character with no modifier works only while its surface has the focus. | `keyboard-walker` (pull request), `docs-keyboard` (weekly), `website-keyboard` (weekly), `docs-axe` (weekly), `readers` (weekly) | 0 |
| C07 | Focus indicator missing or hidden | 1.4.11, 2.4.7, 2.4.11 | skill | An outline is never removed without a replacement at 3:1, a control hidden until hover also shows on `:focus-visible`, and no sticky bar or overlay fully hides the focused element. | `focus-contrast` (pull request), `docs-focus-contrast` (weekly), `website-focus-contrast` (weekly), `docs-keyboard` (weekly; a control shown only on hover) | 0 |
| C08 | Theme tokens: contrast and target size | 1.4.3, 1.4.11, 2.5.8 | skill | Colors and sizes come from theme tokens, and every pair clears its ratio in `main`, `horizon` and `classic`, light and dark: text 4.5:1, icons, borders and focus rings 3:1, pointer targets 24 by 24 CSS pixels. | `axe` (pull request), `focus-contrast` (pull request), `docs-axe` (weekly), `website-axe` (weekly), `docs-focus-contrast` (weekly), `website-focus-contrast` (weekly) | 0 |
| C09 | Pointer: action on press, drag with no other way | 2.5.1, 2.5.2, 2.5.7 | skill | A control acts on release, never on press. A press that starts a drag or a selection is the exception, and every drag also has a single-pointer way that needs no dragging. | `pointer` (pull request) | 0 |
| C10 | Reflow, zoom, text spacing, hover content and motion | 1.4.4, 1.4.10, 1.4.12, 1.4.13, 2.2.2 | skill | Surfaces around the grid reflow at 320 CSS px and 200% zoom with no sideways scroll and no clipped text, and survive the text-spacing overrides. Hover and focus content can be dismissed and hovered, nothing moves on its own for more than five seconds without a way to stop it, and, as a house rule beyond the AA bar, motion stops under the reduced-motion preference. | `reflow` (pull request), `forced-colors-motion` (weekly; motion), `docs-reflow` (weekly), `website-reflow` (weekly) | 0 |
| C11 | Color alone: a state, an indicator or a link | 1.4.1, 1.4.11 | skill | A state a color draws (current, selected, highlighted, focused) also draws a border, an outline or text, so it survives `forced-colors: active`, and a link in text is underlined, never told apart by its color alone. | `forced-colors-motion` (weekly), `docs-forced-colors-motion` (weekly), `website-forced-colors-motion` (weekly), `docs-axe` (weekly; link-in-text-block) | 0 |
| C12 | Change not announced | 4.1.3 | skill | A change without a focus move is announced through `announce()`, politely unless it is an error, once per user action. A live region is in the DOM before its text changes, and hidden status text is its own element, apart from the value. | `e2e` (pull request; the flow that reads the live region, written per change), `readers` (weekly), `website-forms` (weekly) | 0 |
| C13 | State or annotation not exposed | 1.3.1, 4.1.2 | skill | A state a class draws (invalid, read only, commented, merged, a link or a formula in a cell) is also an ARIA attribute or hidden text a screen reader gets. A slider or splitter has `aria-valuetext` in words, from an i18n phrase. | `tree-snapshots` (pull request), `readers` (weekly), `axe` (pull request; an attribute value axe refuses) | 0 |
| C14 | Page structure and findability | 1.3.1, 2.4.1, 2.4.2, 2.4.4, 2.4.5, 2.4.6, 3.2.6 | docs | A docs or website page has a title unique per page and framework, headings in order, link text that names its target, and landmarks with unique names, and its help sits where it sits on every other page. | `docs-structure` (weekly; a docs content pull request is never scanned), `website-structure` (weekly) | 0 |
| C15 | Forms: redundant entry and drawn labels | 3.3.2, 3.3.7 | website | A form keeps what the visitor typed when they switch tabs or steps, and a field has a drawn label, never a placeholder alone, that stays while they type. | `website-forms` (weekly) | 0 |
| C16 | A screen reader's own behavior, not the grid's | none | record-only | none: recorded, never prevented | none | 0 |
| C17 | Tool noise, documented behavior and missing goldens | none | record-only | none: recorded, never prevented | none | 0 |

## Picking the class of a new cluster

Ask what produces the finding, not where it shows: a contrast finding on the docs site is C08 like one
on the grid. When two classes fit, take the one whose rule, kept, would have prevented it. A screen
reader's behavior on well-formed markup is C16 only once a plain element shows the same behavior
(the cluster's title says so). A finding no class fits is a new class: add it to `rules.json` and
here in the same change, with its rule and its check, or `none` until one exists.

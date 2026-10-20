# Surfaces and their ARIA patterns

Each Handsontable surface follows one pattern from the WAI-ARIA Authoring Practices Guide (APG,
<https://www.w3.org/WAI/ARIA/apg/patterns/>). Pick the pattern before writing the markup, and keep
every role's required parents and children. The "Known issue" column names the
`tests/a11y/axe-baseline.json` issue where the code does not meet the pattern yet, or the task that
tracks a gap the scan cannot see: do not copy that code as a model, and do not add to the issue's
node count. "None known" means nobody has filed one, not that the code was audited.

| Surface | Pattern | Structure and states | Known issue |
|---|---|---|---|
| The grid: cells, headers | Data grid (`treegrid` with nested rows) | `gridcell`, `rowheader`, `columnheader` in `row`s inside the grid; `aria-rowindex`/`aria-colindex` on cells, `aria-rowcount`/`aria-colcount` on the root; `aria-selected` on selected cells; `aria-sort` on a sorted header; `aria-expanded` on a collapsible header or a parent row | `grid-roles` |
| Context menu, dropdown menu, submenus, sheets bar menus | Menu | `menu` around `menuitem`, `menuitemcheckbox` (with `aria-checked`) and `separator`; a submenu item has `aria-haspopup="menu"` and `aria-expanded`; the table markup between them is `presentation`; the highlighted item is shown by focus or `aria-activedescendant`, never `aria-selected`; Escape closes and returns focus to the cell | `menu-roles`, `menu-separators` |
| Autocomplete, dropdown and multiselect lists, the Filters condition select | Combobox with a listbox popup | the input is `combobox` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the popup is a named `listbox` whose children are `option`s (a table-built list puts `presentation` on the table rows) | `filters-listbox` |
| Cell editors: text, numeric, password, date, time, select | Native field | an `<input>`, `<textarea>` or `<select>` with an accessible name that says which cell it edits (column header plus row); the hidden editor input stays in the DOM, so it needs the name while hidden too | `editor-input-names` |
| Comment editor | Native field | a named `<textarea>`; Ctrl+Alt+M opens and focuses it, Escape closes it and returns focus to the cell | `editor-input-names` |
| Filters "Filter by value" list | Group of checkboxes | a named group (`role="group"` with `aria-labelledby` on the "Filter by value" heading) of native checkboxes, each named by its value; "Select all" and "Clear" are one `<button>` each, never a button inside a button | `filter-by-value-name`, `filters-nested-buttons` |
| Checkbox cells, the header checkbox, row selection | Checkbox | a native checkbox named by its column header and row; the header checkbox shows a partial selection with the native `indeterminate` state, never `aria-checked` on an `<input>` | not in the scan, tracked by DEV-2947: the cell checkbox is named by its state ("Checked"/"Unchecked") and puts `role="checkbox"` and `aria-checked` on the native input, while the header and row-selection checkboxes put only `aria-checked` on it |
| Dialog | Dialog (modal) | `dialog`, or `alertdialog` for a confirmation, with `aria-modal="true"` and `aria-labelledby` on its title; focus moves inside on open, stays inside (a focus scope with focus catchers), and returns to where it came from on close | `classic-contrast`, `horizon-contrast` (its primary button) |
| Notification toast | Status message | `status` with `aria-live="polite"`, or `alert` with `assertive` for an error, as `notification/ui.ts` does; its actions are `<button>`s a keyboard reaches | contrast, as above |
| Pagination, sheets bar | Bars of buttons | named `<button>`s (`aria-label` from i18n for icon-only ones), `aria-disabled` on a disabled one, a page or sheet change announced politely (both announce assertively today, through `announce()`'s default); each sheet tab is a button with one Tab stop and Arrow, Home and End inside the strip, by design (`plugins/sheetsBar/AGENTS.md`), so moving it to the APG tabs pattern is a design change, not a fix | `classic-target-size` |
| Loading | Alert dialog | the loading screen is an `alertdialog` (built on the dialog plugin) that takes focus while data loads, named by its title and described by its message; a decorative spinner is `aria-hidden="true"` | not in the scan, tracked by DEV-2949 (the spinner SVG is exposed) |
| Empty data state | Busy region and status | `aria-busy="true"` on the region while a fetch is in flight; the message reaches screen readers through a live region | none known |

## Traps the scan has found

- **A Handsontable inside a widget.** Menus, the Filters lists and the editor lists are nested
  Handsontable grids, so their items sit in `table` > `tbody` > `tr` > `td`. Giving the `td` a
  widget role is not enough: every element between it and the widget root needs
  `role="presentation"`, or the role's required parent is missing (`aria-required-parent`) and
  the root holds children it does not allow (`aria-required-children`).
- **A decorative separator is not an item.** A separator row carries `role="separator"` (or is
  hidden from assistive technology), never `menuitem` with an `aria-label` of dashes.
- **A label that does not contain the visible text.** When `aria-label` differs from the text on
  screen, speech users cannot say what they see (`label-content-name-mismatch`, 2.5.3). Use the
  visible text as the name, or make it the start of the name.
- **A theme color that passes on one theme.** Contrast and target size are theme results: classic
  fails on its blues, horizon on its green accent. Check every token pair you touch in all three
  themes, and add the theme to the PR's proof.
- **Positional selectors in a name.** Never build a name from DOM position or a random id; build
  it from the column header and the row, the way the cell itself is announced.

## Core building blocks

| Need | Use | Where |
|---|---|---|
| A role or ARIA attribute | `A11Y_*` tuple helpers with `setAttribute(element, [...])` | `src/helpers/a11y.ts`, `src/helpers/dom/element.ts` |
| A translated name or message | an i18n constant and `hot.getTranslatedPhrase()` | `src/i18n/constants.ts`, the `i18n-translations` skill |
| Keys | `hot.getShortcutManager().getContext(...)` and `addShortcut` | `src/shortcuts/`, the shortcut context of the surface's focus scope |
| Focus in and out of a surface | `hot.getFocusScopeManager().registerScope(id, container, options)` | `src/focusManager/scopeManager.ts`; examples in `plugins/dialog/dialog.ts`, `plugins/pagination/pagination.ts` |
| A message without a focus move | `announce(message, politeness)` | `src/utils/a11yAnnouncer.ts`; it writes to live regions in the instance's portal |
| Turning grid ARIA off | the `ariaTags` option | `src/dataMap/metaManager/metaSchema.ts`; check it where the surface already does |

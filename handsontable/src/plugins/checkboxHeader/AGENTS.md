# CheckboxHeader plugin — "check all" in a checkbox column's header

The `checkboxHeader` plugin renders a "check all" checkbox in the header of every checkbox column
that sets the column-level `headerCheckbox` option (PRO-87), and writes the column's values when it is
pressed. Read this before touching `checkboxHeader.ts`, `../../utils/checkboxColumn.ts`, or
`../../utils/rowScope.ts`.

## What it owns, and what it does not

- It owns the header checkbox of a checkbox column and the "check all" write. The cell checkboxes
  stay the `checkbox` cell type's (`../../renderers/checkboxRenderer/`).
- It does **not** own row selection. `../rowSelection/` with `checkboxLocation: { column }` uses a
  checkbox column as its selection, and then that plugin owns the column's header: `hasHeaderCheckbox()`
  asks `rowSelection.getBoundColumn()` and steps aside, so the header never gets two checkboxes.

## The traps

- **The plugin is always on** (`isEnabled()` returns `true`, `SETTING_KEYS` is `false`): the option is
  column-level, and no grid-level key could switch a plugin on for it. Everything it does is gated on
  `hasHeaderCheckbox(column)`, so a grid without the option pays one column meta read per header draw.
- **The header and the click share one scope** (`collectRowsInScope()` in `../../utils/rowScope.ts`,
  the same rules `../rowSelection/` uses). The default scope is `'filtered'`, not `'all'` as in
  RowSelection: "check all" writes data, and silently writing to rows the user filtered out is the
  surprising choice for data. `{ scope: 'all' }` opts in.
- **Read-only and non-checkbox cells are out of the scope**, so they are neither written nor counted.
  A per-cell `type` override (the `cells` option) is honored per row; a row the filters removed has no
  visual index, so its column meta answers instead.
- **The checked test mirrors `checkboxRenderer`** (`isCheckedValue()`: identity, or a case-insensitive
  string match through `localeLowerCase`). Change one and the header would disagree with the cells.
- **One click is one undo step**: `setColumnChecked()` runs `writeCheckboxColumn()` inside
  `runOperation()`. Visible rows go through one `setDataAtCell()` call (validated, one `afterChange`);
  filtered-out rows go through one `setSourceDataAtCell()` call.
- **The press is handled on `mousedown` and the `click` is cancelled**, like RowSelection: the
  header is re-rendered on `mousedown`, and the browser's own toggle on `click` would flip it back.
  `isImmediatePropagationEnabled = false` keeps the press from selecting or sorting the column.
- **The header state is cached per visual column** and dropped on data, meta, settings, load, page,
  and index changes (both index mappers). A new path that changes checkbox values without those hooks
  would leave the header stale.

## Where to look next

- Shared rules: `../../utils/rowScope.ts` (scope, header state), `../../utils/checkboxColumn.ts`
  (checked test, writes).
- The row selection that can bind to a checkbox column: `../rowSelection/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=checkboxHeader`.
- E2E: `cd tests && npx playwright test e2e/checkbox-header.spec.ts` (rebuild the package first).

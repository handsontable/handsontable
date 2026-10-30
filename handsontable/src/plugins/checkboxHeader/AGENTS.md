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

- **The `checkbox` cell type must be registered.** `PLUGIN_DEPS` names `cell-type:checkbox` (`feature.json`,
  `enforceAtInit`), so `new Handsontable()` throws when the plugin is registered without it. The plugin finds
  its columns by `type: 'checkbox'` and has nothing to work on otherwise. Pinned by
  `__tests__/pluginDependencies.unit.ts`.
- **The plugin is always on** (`isEnabled()` returns `true`, `SETTING_KEYS` is `false`): the option is
  column-level, and no grid-level key could switch a plugin on for it. Everything it does is gated on
  `hasHeaderCheckbox(column)`, so a grid without the option pays one column meta read per header draw.
- **The header and the click share one scope** (`collectRowsInScope()` in `../../utils/rowScope.ts`,
  the same rules `../rowSelection/` uses). The default scope is `'filtered'`, not `'all'` as in
  RowSelection: "check all" writes data, and silently writing to rows the user filtered out is the
  surprising choice for data. `{ scope: 'all' }` opts in.
- **Read-only and non-checkbox cells are out of the scope**, so they are neither written nor counted.
- **Cell meta is resolved by the physical row** (`getCheckboxCellMeta()` in `../../utils/checkboxColumn.ts`),
  never by falling back to the column meta. A row the filters removed has no visual index, and
  `hot.getCellMeta()`/`getCellMetaTransient()` take visual indexes, so the helper goes to
  `hot._getMetaManager().getCellMetaTransient(physicalRow, physicalColumn, …)` for it: the `cells`
  function, `setCellMeta()` values, and the meta hooks still apply. The column-meta fallback it replaced
  counted and overwrote a read-only cell in a filtered-out row under `scope: 'all'`. For such a row the
  hooks get the physical index as `visualRow`, the way the Filters plugin stamps the cells it reads.
  RowSelection's bound column writes through the same helper (`writeCheckboxColumn()`).
- **The checked test mirrors `checkboxRenderer`** (`isCheckedValue()`: identity, or a case-insensitive
  string match through `localeLowerCase`). Change one and the header would disagree with the cells.
- **One click is one undo step**: `setColumnChecked()` runs `writeCheckboxColumn()` inside
  `runOperation()`. Visible rows go through one `setDataAtCell()` call (validated, one `afterChange`);
  filtered-out rows go through one `setSourceDataAtCell()` call.
- **The tick is an icon element, not the input's `::after`.** Since DEV-3003 a checkbox tick is an
  `<i class="ht-icon">` sibling of the input, laid over it by the checkbox renderer's
  `span.htCheckboxRendererBox` wrapper. The header checkbox lives in such a wrapper
  (`htCheckboxHeaderBox`), and `syncIcon()` swaps its icon between `checkbox` and `collapseOff` (the
  mixed state's dash). Pinned by `__tests__/checkboxHeader.unit.ts`.
- **The press is handled on `mousedown` and the `click` is cancelled**, like RowSelection: the
  header is re-rendered on `mousedown`, and the browser's own toggle on `click` would flip it back.
  `isImmediatePropagationEnabled = false` keeps the press from selecting or sorting the column.
- **A tap is a press too: gate on `isLeftClick(event) || isTouchEvent(event)`, never `event.button`.**
  On touch, Walkontable calls `beforeOnCellMouseDown` with the deferred `touchend` (see
  `../../3rdparty/walkontable/src/event.ts`), which has no `button`; the browser's synthesized
  `mousedown` never reaches the hook and `#onRootClick` cancels the click. A `button !== 0` gate made a
  tap on the header checkbox do nothing on iPad. Same gate as `../collapsibleColumns/`.
- **The `afterSetSourceDataAtCell` listener exists only while a header state is cached**
  (`#syncSourceDataListener()`). The plugin is on in every grid, and any listener on that hook makes
  `setSourceDataAtCell()` build the hook's payload; registered unconditionally, it turned every grid's
  source writes into that path (and, before core computed the stored value once, ran the
  `valueSetter` twice – `src/__tests__/core/valueSetter.spec.js`). It goes through `hot.addHook()` /
  `hot.removeHook()`, not the tracked `addHook()`, which keeps every callback it ever registered.
  `destroy()` can run it after the instance is detached (index mapper `cacheUpdated`), hence the
  `this.hot` guard.
- **A tap must not leave the input focused.** Walkontable drops the browser's own `mousedown` that
  follows a tap, so its default action would focus the input, and Walkontable's "press on the focused
  element" guard would then swallow the next tap on it. `#onRootMouseDown` cancels every `mousedown` on
  the header checkbox. Pinned by the "second tap on the header checkbox" Playwright test.
- **The header state is cached per visual column, with one state per physical row** (out of scope,
  not counted, unchecked, checked) and the two counts. A data change (`beforeChangeRender`,
  `afterChange`, `afterSetSourceDataAtCell`) or a meta change (`afterSetCellMeta`,
  `afterRemoveCellMeta`) re-reads **only the rows it names**, in every cached column, and moves the
  counts by the difference: an edit costs the changed rows times the cached columns, never a rescan of
  the column (a full rescan per edit was O(rows) per header-checkbox column in a 100k-row grid). Every
  cached column re-reads the row, not only the edited one, because a `cells` function can make a
  checkbox read-only by another column's value in the same row. A meta that depends on **other rows**
  is not followed until the next full rescan.
- **The whole cache is dropped** on a scope change: settings, data load/update, page change, both index
  mappers' `cacheUpdated` (filter, sort, trim, hide, row/column alter), a change list of `null`, and
  undo/redo (`beforeUndo`/`beforeRedo`/`afterUndo`/`afterRedo`, plus the `UndoRedo.*` change sources):
  an undo puts cell meta back through the meta manager without `afterSetCellMeta`, and renders before
  it returns. A new path that changes checkbox values or meta without any of these hooks leaves the
  header stale.
- **Meta changes made while the plugin reads meta are ignored** (`#isReadingMeta`): a
  `beforeGetCellMeta`/`afterGetCellMeta` listener that calls `setCellMeta()` would otherwise re-enter
  the read of the same row without end.

## Where to look next

- **One template matcher for every checkbox surface** (DEV-355). `matchCheckboxTemplate()` in
  `../../utils/checkboxColumn.ts` decides whether a value is the checked template, the unchecked one,
  or neither: the value itself, or the same text ignoring case (`'False'` is `false`). An exact match
  on either template is tried first, so `'Y'`/`'y'` templates keep both states. The checkbox renderer
  and its Space/Enter toggle, the checkbox cell type's `valueSetter`, the opt-in `checkbox` validator,
  the checkbox sort function, the XLSX export, and this plugin's `isCheckedValue()` all call it. The
  sort maps a case variant only onto a template the column defines, so the default-template sort keeps
  its order. Before DEV-355 the `valueSetter` compared case-sensitively against raw meta templates, so
  a pasted `'False'` rendered unchecked while the data held a truthy string, and a never-rendered cell
  (templates still `undefined` in its meta) kept `'true'` as text. Two rules ride along: the
  `valueSetter` leaves an `UndoRedo.*` write verbatim (`utils/valueAccessors.ts`), and the validator
  checks the templates before the empty rule, because a template may itself be `''`. Do not add
  another comparison; extend the matcher.
- Shared rules: `../../utils/rowScope.ts` (scope, header state), `../../utils/checkboxColumn.ts`
  (checked test, writes).
- The row selection that can bind to a checkbox column: `../rowSelection/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=checkboxHeader`. The
  "re-read only the edited rows" test counts `cells` calls with the render suspended: a render calls
  `cells` for every rendered row, which would hide whether the header rescanned.
- The tap test drives the hook with a `TouchEvent` in jsdom; a real tap needs a Playwright touch test.
- E2E: `cd tests && npx playwright test e2e/checkbox-header.spec.ts` (rebuild the package first).

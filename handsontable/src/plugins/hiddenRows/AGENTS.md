# HiddenRows plugin — hiding rows without removing them

The `hiddenRows` plugin hides rows from the DOM while keeping them in the visual index space. Read this
before touching `hiddenRows.ts` or anything in `contextMenuItem/`.

**This plugin is the mirror image of `../hiddenColumns/`, almost line for line.** Read
`../hiddenColumns/AGENTS.md` — the hiding-vs-trimming distinction, the replayed `init` local hook, the
`afterGetCellMeta` hygiene rules (`className` normalization, compare-before-assign, gating the write on
finding the marker, token matching) and the
`disablePlugin()` meta reset are all the same. **Fix a bug in one and check the other.** The Show
column adjacent-stretch trap in that file applies to `contextMenuItem/showRow.ts` as well (DEV-1040).
Both Show items call `collectAdjacentHiddenPhysicalIndexes` from `../../../utils/hiddenIndexes.ts`
— do not copy that helper into this plugin.

What follows is only what differs.

## Different names, same mechanism

| This plugin | HiddenColumns |
|---|---|
| `rowIndexMapper`, map type `'hiding'` | `columnIndexMapper`, map type `'hiding'` |
| `skipRowOnPaste` + `SKIP_ROW_ON_PASTE_BY_PLUGIN` | `skipColumnOnPaste` + `SKIP_COLUMN_ON_PASTE_BY_PLUGIN` |
| marker class `afterHiddenRow` | `afterHiddenColumn` |
| `modifyRowHeight`, `afterGetRowHeader` | `modifyColWidth`, `afterGetColHeader` |

Two real differences worth knowing:

- **`modifyRowHeight` is registered with no order index**, while HiddenColumns pins `modifyColWidth` to
  index 2. Do not "harmonize" that without checking against AutoRowSize's listener — rows can only grow
  (see `../autoRowSize/AGENTS.md`), so the interaction is not symmetric with columns.
- **The user-configuration sources for `skipRowOnPaste` are `cells` and `cell` only** — there is no
  per-row equivalent of the `columns` option. The rule is the same though: only clear the marker the
  plugin itself set, or unhiding a row erases a user-defined value.

The marker class is applied for `this.isHidden(row - 1)` — the class describes the **neighbor**
relationship, so an off-by-one there is a real bug.

## The indicator's BOX stops at the header edge; its GLYPH does not move

`../../styles/components/plugins/_hidden-rows.scss` used to lay the arrow's box out at `bottom: -2px` on
`beforeHiddenRow::after` and `top: -2px` on `afterHiddenRow::before`. Those offsets are measured from
the row header's **padding** box, and the header has a 1px border, so the `before` box reached 1px past
the table's bottom edge. The glyph never reached that pixel — only the box did.

On a `height: 'auto'` grid that 1px is enough. Such a grid must never scroll itself — it grows to its
rows and the page scrolls instead — so its box is flush with its content **by construction**, and the
overhang made `scrollHeight` one larger than `clientHeight`. Measured on `develop`: a 15px vertical
scrollbar on a grid that should have none, and a column-header clone left 15px wider than the master's
usable width, so columns and their headers disagreed about where they were.

**The painted arrow must not move** — that is a visible change on every grid with indicators. So the
`before` box moves to `bottom: -1px`, ending exactly on the header edge, and `mask-position: 0 1px`
moves the icon back down by the same pixel. `../hiddenColumns/AGENTS.md` has the full story: the
positions and clips that were tried and why each was rejected (a clip on the `th` cuts the header
highlight bar), the glyph margins that make the mask shift safe, and the pixel measurements.

Only the `bottom` offset was ever live: block-start overflow is clipped rather than scrollable, so
`top: -2px` never reached the scroll region, and it is unchanged. Fixed in #13500 alongside the column
twin, which is the same defect on the horizontal axis. Covered by
`tests/e2e/hidden-indicator-overhang.spec.ts`, whose third describe compares every marked row header
byte for byte against the 18.1.0 rules.

## Hide row suppresses itself when no row is rendered

`contextMenuItem/hideRow.ts` `hidden()` mirrors `../hiddenColumns/` `hideColumn.ts` (DEV-164): after the
selection-type gate it returns `true` when `rowIndexMapper.getRenderableIndexesLength() === 0`, so a corner
(select-all) right-click stops showing a dead "Hide rows" entry whenever no row is visible — every row
hidden (the reported case), an empty grid, or a fully-trimmed grid (a filter matching nothing). All three
are the same no-op (`hideRows([])`). Using *renderable* count rather than `getHiddenRows().length` keeps the
answer consistent whether the rows are gone by hiding or by trimming. Full rationale in
`../hiddenColumns/AGENTS.md`.

## Known concern

`../../../.ai/CONCERNS.md` used to list `contextMenuItem/showRow.ts`'s `arr.push(...largeArray)` as a
stack-overflow risk. The `hidden()` path now copies with loops (DEV-1040). Do not reintroduce
`push(...array)` here.

## Where to look next

- The column mirror, and the shared rules: `../hiddenColumns/AGENTS.md`.
- Trimming instead of hiding: `../trimRows/AGENTS.md`.
- Consumers of `skipRowOnPaste`: `../copyPaste/AGENTS.md`, `../autofill/AGENTS.md`.
- Row hiding done by other plugins: `../nestedRows/AGENTS.md`, `../pagination/AGENTS.md` (also a `'hiding'`
  map).
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='hiddenRows'`

`__tests__/` mirrors HiddenColumns' split — `altering`, `navigation`, `selection`, `editors`, `indicators`,
`maxRows`, `publicAPI`, `pluginHooks`, `configuration`, plus `contextMenu/`, `core/`, `plugins/`,
`settings/` and `rtl/`.

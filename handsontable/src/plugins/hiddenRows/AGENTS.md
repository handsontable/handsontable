# HiddenRows plugin — hiding rows without removing them

The `hiddenRows` plugin hides rows from the DOM while keeping them in the visual index space. Read this
before touching `hiddenRows.ts` or anything in `contextMenuItem/`.

**This plugin is the mirror image of `../hiddenColumns/`, almost line for line.** Read
`../hiddenColumns/AGENTS.md` — the hiding-vs-trimming distinction, the replayed `init` local hook, the
`afterGetCellMeta` hygiene rules (`className` normalization, compare-before-assign, gating the write on
finding the marker, token matching) and the
`disablePlugin()` meta reset are all the same. **Fix a bug in one and check the other.**

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

## The indicator sits FLUSH with the header edge — `-1px`, not `-2px` and not `0`

`../../styles/components/plugins/_hidden-rows.scss` used to draw the arrow at `bottom: -2px` on
`beforeHiddenRow::after` and `top: -2px` on `afterHiddenRow::before`. Those offsets are measured from
the row header's **padding** box, and the header has a 1px border, so the arrow reached 1px past the
table's bottom edge. `-1px` lands it exactly on that edge, which is the design-system position and the
value `../hiddenColumns/` uses on the horizontal axis — read its `AGENTS.md` for the measurements.
`0` would pull it 1px inside and visibly widen the gap to the divider, so do not "simplify" to that.

On a `height: 'auto'` grid that 1px is enough. Such a grid must never scroll itself — it grows to its
rows and the page scrolls instead — so its box is flush with its content **by construction**, and the
overhang made `scrollHeight` one larger than `clientHeight`. Measured on `develop`: a 15px vertical
scrollbar on a grid that should have none, and a column-header clone left 15px wider than the master's
usable width, so columns and their headers disagreed about where they were.

Only the `bottom` offset was ever live: block-start overflow is clipped rather than scrollable, so
`top: -2px` never reached the scroll region. Both were set to `0` anyway, to keep this file mirrored
with `../hiddenColumns/`. Fixed in #13500 alongside the column twin, which is the same defect on the
horizontal axis. Covered by `tests/e2e/hidden-indicator-overhang.spec.ts`.

## Known concern

`../../../.ai/CONCERNS.md` lists `contextMenuItem/showRow.ts`'s `arr.push(...largeArray)` as a
stack-overflow risk with 10k+ elements. Use a `forEach` loop.

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

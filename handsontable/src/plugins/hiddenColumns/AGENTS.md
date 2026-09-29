# HiddenColumns plugin — hiding columns without removing them

The `hiddenColumns` plugin hides columns from the DOM while keeping them in the visual index space. Read
this before touching `hiddenColumns.ts` or anything in `contextMenuItem/`.

`../hiddenRows/` is the mirror image of this plugin, almost line for line. Fix a bug in one and check the
other.

## Hiding is not trimming

The map type is **`'hiding'`**, registered on `columnIndexMapper` under the plugin name. A hidden column
**keeps its place in the visual space** and disappears only from the renderable space. A *trimmed* column
leaves the visual space altogether.

That difference is why hiding does not strand a selection the way trimming does — the full rule is in the
core-package `../../../AGENTS.md` and in `../trimRows/AGENTS.md`. Tier details:
`../../../.ai/INDEX-MAPPING.md`.

## The `init` local hook has to be replayed by hand

```js
this.#hiddenColumnsMap.addLocalHook('init', () => this.#onMapInit());

if (this.hot.columnIndexMapper.getNumberOfIndexes() > 0) {
  this.#onMapInit();
}
```

`createAndRegisterIndexMap` initializes the map **synchronously** when the dataset is already loaded — a
plugin re-enable — which is before the hook above could attach. Without the replay, a re-enabled plugin
never applies its configured hidden set. `../hiddenRows/` and `../trimRows/` carry the same replay.

## `skipColumnOnPaste`: only flip what you flipped

The plugin sets `skipColumnOnPaste` on hidden columns (when `copyPasteEnabled: false`) and marks each one it
touched with a private symbol, `SKIP_COLUMN_ON_PASTE_BY_PLUGIN`.

**Cells that already had `true` from user configuration** (`columns`, `cells`, or `cell`) **are left
untouched**, and only marked cells are cleared on unhide — otherwise unhiding a column erases a
user-defined value. The property itself is consumed by the Autofill and CopyPaste plugins.

## `afterGetCellMeta` hygiene — this is the reference implementation

Four rules, all visible in `#onAfterGetCellMeta`:

- **`className` is `string | string[]`.** Normalize with `normalizeClassNames()` (which returns a *fresh*
  array) and write back a string, matching what `numericRenderer` and the `search` plugin store. Never
  `(meta.className as string).split(' ')` — it throws on an array, inside a render hook, so the grid renders
  blank (#7427). Never `meta.className += ' marker'` — it coerces an array through `Array#toString` and
  merges `['a','b']` into one bogus `a,b` class. And never push into the value you were handed: a
  grid-level or column-level array is **one instance shared by every cell** through the meta prototype
  chain.
- **Compare before assigning.** This hook runs on **every** cell meta read, and an unconditional write
  materializes an own property that shadows the column-level and grid-level cascade.
- **Gate the join, the compare and the write on actually finding your marker.** The removal branch runs for
  every cell that has *any* `className`, which on a grid with a grid-level value is every cell in it —
  almost none of them anywhere near a hidden column. So `indexOf('afterHiddenColumn')` gates everything
  after it. The `normalizeClassNames()` call still runs first, because the token test needs the array: read
  the code, not this paragraph, for the order. A raw-string `includes()` pre-filter ahead of the normalize
  would skip that allocation too — a substring miss guarantees a token miss, so it is sound as a *negative*
  filter only — and is the next step if this path measures hot again. Measured on an isolated
  re-implementation of the two hook bodies (3M calls, node 22, **not** in-situ): ~106 ns/call before
  DEV-2604, ~79–84 ns/call after it, ~38 ns/call with the write gated.

  The correctness half matters more than the speed: rewriting a cell you have no marker on puts an own
  string `className` on it that shadows the cascade, and for a value set through `setCellMeta` (which
  records it in `_userDefinedMetaProps`) that string **permanently replaces the user's array**, because
  `getUserDefinedMetas()` re-reads `className` at `updateSettings` time. Compare-before-assign cannot catch
  either, because an array is always `!==` its joined form. This was deliberately declined on PR #13235 and
  taken in DEV-2618, once `contextMenu`'s alignment *helpers* stopped casting `className` to a string in
  #13266 — leaving arrays in cell meta is safe because nothing in `src/` string-operates the value. Two
  caveats that go with that. `predefinedItems/alignment.ts` still casts `as string` at seven call sites, so
  an array now reaches the public `beforeCellAlignment` payload on a hiding-plugin grid (it always did on a
  grid without one). And **the two unconditional writes in `numericRenderer` and `search` are still there** —
  both predate this and are tracked in DEV-2803.
- **Match a marker class by token, not substring.** `indexOf` on the joined string treats a user class named
  `afterHiddenColumnHighlight` as the marker already being present, so the real marker never gets added.

The parameter is typed `CellProperties`, never `Record<string, unknown>` — the latter erases every property
to `unknown`, which is what let the `as string` cast compile in the first place.

Note the hook reads `this.isHidden(column - 1)`: the indicator classes describe the **neighbor**
relationship, so an off-by-one here is a real bug, not a style choice.

## `modifyColWidth` is registered at order index 2

That puts it after the default listeners — including AutoColumnSize's, which is pinned to the front. A
hidden column's width must be zeroed *after* anything that computes a width, or the computed value wins.

## The indicator's BOX stops at the cell edge; its GLYPH does not move

**The painted arrow is the contract.** It paints exactly where it has since the theming system landed
(#11144), and moving it — even by 1px — is a visible change on every grid with indicators. That is a
design decision, not a bug fix. A 1px move was tried for #13500 and rejected in review as a visual
breaking change.

The offsets in `../../styles/components/plugins/_hidden-columns.scss` are measured from the header's
**padding** box, and the header carries a 1px border. Up to 18.1.0 the `before` arrow's 10px box sat at
`right: -2px`, 1px **past** the cell. The glyph never reached that pixel, but the box did, and a box
past the cell is scrollable content: on a table **flush with the scroll box** — exactly what `stretchH`
produces — the browser reports `scrollWidth = clientWidth + 1`, paints a horizontal scrollbar with
nothing to scroll, and that bar takes ~15px of height out of the master pane only. The frozen-column
clone has no such bar, so it clamps to a `scrollTop` 15px smaller, and at the bottom of the grid every
row across the frozen boundary sits a scrollbar apart. Turning `indicators` off "fixes" it, which is why
this reads as a width-calculation bug and is not one: the stretch math is exact.

The fix separates the layout box from the painted glyph. The `beforeHiddenColumn::after` box moves to
`right: -1px`, so it ends exactly on the cell edge, and `mask-position: 1px 0` moves the icon back out
by the same pixel (`mask-repeat: no-repeat` stops the shifted tile wrapping its last column into the
box's first). What was tried, so nobody walks the loop again:

| approach | painted arrow | scrollable overflow | verdict |
|---|---|---|---|
| box `-2px`, no mask shift (≤ 18.1.0) | the reference | +1px | **the bug** |
| box `-1px`, no mask shift | 1px inward | none | visible change — rejected |
| box `0` | 2px inward | none | visible change |
| `overflow: clip` on the marked `th` | unchanged until selected | none | cuts a selected header (below) |
| `overflow: clip` + `overflow-clip-margin: 1px` | unchanged | none | Safari has no `overflow-clip-margin` |
| **box `-1px` + `mask-position: 1px 0`** | **unchanged** | **none** | **shipped** |

The clip looks like the obvious fix and is the trap. The header highlight bar is a `.relative::after`
inset by `-1px` on its sides so it meets the gridlines (`../../styles/base/_base.scss`, "header highlight
line"), and a clip on the `th` cuts those ends off whenever a marked column or row is highlighted — the
base stylesheet already warns about exactly this for exact-height rows. Measured: 3–4 pixels per
selected header change, by up to 176/255, on horizon, the one theme whose bar is visible (1px; main and
classic draw it 0px tall, so there the clip changes nothing). A pixel check of an unselected grid, or of
main alone, does not see it. Nor do the other obvious tools help, measured on the same flush grid: a
`transform` that moves the box back out keeps the 1px of overflow, and so does `clip-path`.

Three things hold the shipped rules up:

- **Only the end side needed changing.** The `afterHiddenColumn::before` box still hangs 2px past the
  start of its cell, and that is fine: content before the scroll origin never scrolls. `before` is the
  end side in both directions.
- **RTL takes the LTR `mask-position` unchanged.** The mask is laid out in the box's own coordinates
  before the `rotate(180deg)`, which mirrors the 1px shift outward, to the left. A compensation written
  per direction would land 2px off.
- **Every shipped glyph stops at least 2.8px short of its box's outer side** (measured on main, horizon
  and classic), so the pixel the box now cuts off is transparent. A redesigned icon that paints into its
  last column would lose that column — it used to land outside the cell anyway. An icon supplied as a
  `background-image` or as text instead of a mask ignores `mask-position`, so it would move 1px inward.

Measured against the 18.1.0 rules forced on the same page: 191 of 192 combinations byte-identical —
main, horizon and classic; LTR and RTL; 100, 125, 150, 175, 200 and 300% zoom; plain, selected, crowded
(sorting, dropdown menu, filters, long labels), nested-and-collapsible headers, and a header that is
both `before` and `after`. The exception is 4 device pixels at 1/255 on one glyph edge at 150% zoom,
where the box moves by 1.5 screen pixels — anti-aliasing, not a move. The third describe in
`tests/e2e/hidden-indicator-overhang.spec.ts` compares every marked header and both header strips byte
for byte against those rules, in LTR and RTL; it fails on the rejected `-1px` move and on a missing
mask shift.

**The design system disagrees by 1px, deliberately.** In Handsontable Design System → `header_cell`
(120px wide), `icon_hidden_right` spans x 110–120 and `icon_hidden_left` spans −1 to 9 — each arrow's
outer edge on the cell's own edge, 1px further in than the shipped glyph. Matching it would move every
arrow for every user, so it needs a design ticket and a changelog line of its own, not a bug fix.

The arrow is **10px**, and that is from the design system too: the sticker sheet's icons are 16×16
except four at 10×10, which are exactly the four hidden indicators. The `10px !important` in the SCSS
is therefore correct, even though it hardcodes what `--ht-icon-size` would otherwise give (16px on
main/horizon, 12px on classic). Leave it alone unless design adds a `hidden-indicator-size` token —
today the design system defines only `hidden-indicator-color`.

`#onModifyColWidth` adds **15px** to a visible column next to a hidden one — but only when
`indicators` is on, the width is already a number, and `hasColHeaders()` is true. Read the code for the
guards; do not assume the 15px is always there. That reservation and the 10px arrow hold each other up:
moving the arrow to `--ht-icon-size` (16px) would not fit in 15px.

`stretchH` is only the easiest way to reach a flush table. Plain `colWidths` that happen to sum to the
viewport do it too. And the RTL block mirrors the arrow to the other edge, which in RTL is the scrollable
one — fix both blocks or RTL stays broken. Covered by
`tests/e2e/hidden-indicator-overhang.spec.ts`.

`../hiddenRows/` carried the mirrored rules — `beforeHiddenRow::after { bottom: -2px }` and
`afterHiddenRow::before { top: -2px }` — and **the same defect, confirmed, not hypothetical**. Only the
`bottom` one was ever live: block-start overflow is clipped rather than scrollable, so `top` never
reached the scroll region. There is no vertical counterpart to `stretchH`, but `height: 'auto'` makes
the box flush with its rows **by construction**, which is a stronger precondition than the column case
needs. Measured on `develop`: `scrollHeight - clientHeight` = 1, a 15px vertical scrollbar on a grid
that must never scroll itself, and a column-header clone 15px wider than the master's usable width.
Both were fixed together in #13500, the same way: the row box at `bottom: -1px`, its mask at `0 1px`.

## `disablePlugin()` resets cell meta

`resetCellsMeta()` runs after `super.disablePlugin()`, because the meta this plugin wrote (the paste marker
and the indicator classes) must not survive the plugin.

## Show column from a single adjacent header

`contextMenuItem/showColumn.ts` `hidden()` collects the contiguous hidden stretch immediately before
and/or after a selected visible header. A middle gap — column 2 hidden, header 1 or 3 selected —
must produce a Show column item. Do not restore the old first-rendered / last-rendered-only check:
that left initially hidden middle columns unrestorable until the user hid another column or
multi-selected across the gap (DEV-1040). `../hiddenRows/` `showRow.ts` mirrors this.

The walk lives in `../../../utils/hiddenIndexes.ts` (`collectAdjacentHiddenPhysicalIndexes`). Do not
copy it back into this plugin or into HiddenRows — the plugins must not import each other, and a
duplicate trips Sonar CPD on new code.

Non-adjacent hidden columns stay out of the item (hidden `[1]`, select column 3: no Show column).

## Hide column suppresses itself when no column is rendered

`contextMenuItem/hideColumn.ts` `hidden()` used to key on the selection *type* alone
(`isSelectedByColumnHeader() || isSelectedByCorner()`), so a corner (select-all) right-click kept showing
"Hide columns" even with every column already hidden — a dead entry (DEV-164). It now also returns `true`
when `columnIndexMapper.getRenderableIndexesLength() === 0`, i.e. whenever no column is rendered. That is
the all-hidden corner case the ticket reported, and also an empty or fully-collapsed grid, where the item
was equally dead: the callback would run `hideColumns([])` and hide nothing. Keying on *renderable* count
rather than `getHiddenColumns().length` is deliberate — the latter still counts a column removed by a
trimming map, so the two would disagree on a filtered grid; renderable count gives one answer for "nothing
to hide" regardless of *why* the columns are gone. `hideRow.ts` mirrors the fix.

## Known concern

`../../../.ai/CONCERNS.md` used to list `showColumn.ts`'s `arr.push(...largeArray)` as a stack-overflow
risk. The `hidden()` path now copies with loops (DEV-1040). Do not reintroduce `push(...array)` here.

This plugin used to ask the view to resize the overlays after hiding or showing a column, with a
`@TODO Should call once per render cycle` on it, as did `autoColumnSize` and `autoRowSize`. Walkontable
decides for itself now — see "The engine decides for itself when the overlays need resizing" in
`../../3rdparty/walkontable/AGENTS.md`, and do not add the call back.

## Where to look next

- The row mirror: `../hiddenRows/AGENTS.md`. Trimming instead of hiding: `../trimRows/AGENTS.md`.
- Consumers of `skipColumnOnPaste`: `../copyPaste/AGENTS.md`, `../autofill/AGENTS.md`.
- Menu entries: `contextMenuItem/`, wired via `../contextMenu/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='hiddenColumns'`

`__tests__/` is split by concern — `altering`, `navigation`, `selection`, `editors`, `indicators`,
`maxCols`, `publicAPI`, `pluginHooks`, `configuration`, plus `contextMenu/`, `plugins/`, `settings/` and
`rtl/`. A hiding change usually breaks `navigation` or `selection` first.

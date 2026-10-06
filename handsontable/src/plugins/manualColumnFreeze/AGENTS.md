# ManualColumnFreeze plugin — freeze a column from the menu

The `manualColumnFreeze` plugin lets the user pin a column to the start of the grid. Read this before
touching `manualColumnFreeze.ts` or `contextMenuItem/`.

It owns **no state of its own**. Freezing is: move the column to the freeze line with
`columnIndexMapper.moveIndexes()`, then change `fixedColumnsStart` by one. `unfreezeColumn` does the
reverse, in the reverse order. Keep it stateless: undo restores a freeze from the column order and
`fixedColumnsStart` alone, which only works because nothing else describes a freeze.

## `_fixedColumnsStart` — writing the private key on purpose

```js
(settings as { _fixedColumnsStart: number })._fixedColumnsStart += 1;
```

Since 12.0.0 `fixedColumnsLeft` is replaced by `fixedColumnsStart`, and **the old name still works**. Using
both together throws, so the plugin writes the *private* `_fixedColumnsStart` key to bypass that validation
rather than touching the public option.

Both `freezeColumn()` and `unfreezeColumn()` do this, and the comment is repeated at both sites. **Do not
"clean it up" to the public key** — that breaks every grid still configured with `fixedColumnsLeft`, which
the breaking-changes policy forbids.

## `freezeColumn()` does not re-render

That is documented on the method. A caller freezing several columns should render once at the end.

## The menu items are registered on TWO hooks

`afterContextMenuDefaultOptions` **and** `afterDropdownMenuDefaultOptions`. The dropdown menu builds its
items from a separate hook, so without the second registration the `freeze_column` / `unfreeze_column` keys
resolve to inert placeholder rows there (issue #5429).

The dropdown registration uses `AFTER_FILTERS_ORDER_INDEX`, which runs it **after** the callbacks at the
default index — keeping the entries below the Filters interface, which registers at the default index and
makes up the bulk of the column menu.

## Freezing is positional: no move vetoes

The plugin does not listen to `beforeColumnMove`. A move across or inside the frozen area behaves exactly as
with a plain `fixedColumnsStart`: the first `fixedColumnsStart` columns are frozen, whichever columns they are.
A column dropped before the freeze line becomes frozen and pushes the last frozen column out; a frozen column
dragged out lets the next column slide in. The count never changes on a move. This matches Excel and Google
Sheets.

The plugin used to veto both moves (before the freeze line, and of a frozen column), but only after its first
`freezeColumn()`/`unfreezeColumn()` call, so the same drag worked on a grid configured with `fixedColumnsStart`
and failed once a user had frozen a column from the menu. Do not bring a veto back: it would have to apply to
plain `fixedColumnsStart` too, which has always allowed these moves. The end band is a different matter, and
`ManualColumnMove` guards it itself (`#keepsEndBandIntact`).

## `restoreColumnPosition`: unfreeze back to data order, without state

`manualColumnFreeze: { restoreColumnPosition: true }` (default `false`, supplied by `DEFAULT_SETTINGS`, so a plain
`manualColumnFreeze: true` keeps the old placement) changes only where `unfreezeColumn()` moves the column.
`#getUnfrozenColumnIndex()` places it right after the last **scrollable** column whose physical index is lower than
its own, or first among the scrollable columns when there is none. Four rules:

- **Scan from the end, for the last LOWER index, not from the start for the first higher one.** Both give the same
  answer while the scrollable columns are in data order. Once they were reordered, "before the first higher" left the
  column at the front whenever a high-index column had been moved there (`FHABCDE...` unfroze to `FHABCDE...`, so
  nothing visibly moved); "after the last lower" puts `F` after `E`.
- **The scan stops at the current freeze line.** The other frozen columns sit before it until the column leaves.
  Reaching into them picked a still-frozen column as the neighbor, and the unfrozen column stayed in the frozen area
  (pinned by `__tests__/restoreColumnPosition.unit.js`, "should never pick a column that stays frozen").
- **The scan starts before the `fixedColumnsEnd` band.** A band column earlier in data order would otherwise pull the
  column into the band (pinned by the "even when the band holds columns before it" unit test).
- **It remembers nothing.** "Default position" is the data order, not the index the column had when it was frozen. A
  remembered index would need undo state (`captureState`/`restoreState`) and remapping on every insert, remove, move,
  and sort. The cost is that a column the user moved before freezing it goes back by data order.

The target is resolved BEFORE `beforeColumnUnfreeze` runs and passed to both unfreeze hooks as a third argument
(`finalIndex`). Formulas mirrors the move into the engine from that argument: it used to assume the freeze line, and
with the restore on, the engine then read and wrote the wrong columns
(`../formulas/__tests__/manualColumnFreezeRestore.unit.js`). A listener that mirrors the move must read the argument.

The default (`true` or no object) still puts the column right after the frozen columns, as the column-freezing
guide documents. Changing that default would be a breaking change.

## The menu items select the column they moved

A freeze or an unfreeze changes the column's visual index, and the selection holds visual coordinates, so it used to
stay at the old index and select whichever column landed there. With `restoreColumnPosition` the column almost
never lands at the old index, so this showed on nearly every unfreeze. The two menu callbacks run their action
through `followColumn()` (`contextMenuItem/followColumn.ts`): it remembers the column by its PHYSICAL index, and
after the action selects the column at its new visual index. A column selected through its header stays a whole
column selection, and a cell selection keeps its rows. The plugin API (`freezeColumn()`, `unfreezeColumn()`) does
not touch the selection: the caller owns it there.

## `fixedColumnsEnd`: the end band is not ours to move

Freezing moves a column with `columnIndexMapper.moveIndexes()` directly, so it never reaches the end-band guard of
`manualColumnMove` (`#keepsEndBandIntact`). The plugin therefore guards itself, through `endBand.ts` (it cannot import
`manualColumnMove`; both use `clampFixedColumnsEnd`, so the clamp is the one the overlay renders):

- `freezeColumn()` refuses a column of the end band. Freezing it would move it to the freeze line and slide the column
  before the band into the band. It takes the "not performed" path that a column which is already frozen takes: the
  `before`/`after` hooks fire with `freezePerformed === false`, nothing moves, and `fixedColumnsStart` stays.
- `unfreezeColumn()` refuses when `fixedColumnsStart + fixedColumnsEnd` exceeds the column count. The clamp is cutting
  the band down then, lowering `fixedColumnsStart` hands a column back to it, and the unfrozen column would slide in.
  Same "not performed" path.
- The two menu items hide for the same cases (`hidden()` uses the same helpers).
- Freezing a scrolling column is untouched, and the end band keeps its columns: the moved column always lands before
  the band. With `fixedColumnsEnd: 0` every guard is a no-op.
- Pinned by `__tests__/fixedColumnsEnd.unit.js` and `tests/e2e/fixed-columns-end-review-plugins.spec.ts`.

## Open issue: freezing beyond the viewport (#4259)

Freezing more columns than fit the viewport still reproduces on 18.0.0 and on `develop`: the frozen overlay
overflows and covers the master table, so the scrollbar moves but the grid does not. The cause is
Walkontable's `stickyColumnsStart` / `stickyRowsTop` clamping their rendered count against a **count**
rather than against available **width**.

There is no fix in the plugin, and a render-time clamp is a behavior change that needs sign-off. If you are
asked about it: the current recommendation is a documentation note plus a `warnOnce`, not a silent
auto-unfreeze.

## Where to look next

- The plugin that moves columns across the freeze line: `../manualColumnMove/AGENTS.md`.
- The two menus it registers into: `../contextMenu/AGENTS.md`, `../dropdownMenu/AGENTS.md`.
- The overlay that renders the frozen area: `../../3rdparty/walkontable/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualColumnFreeze'`
- `npm run test:unit --prefix handsontable -- --testPathPattern=manualColumnFreeze`
- Moves across the freeze line and `restoreColumnPosition` from the UI: `tests/e2e/manual-column-freeze-boundary.spec.ts`.

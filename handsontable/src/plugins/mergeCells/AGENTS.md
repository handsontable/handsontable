# MergeCells plugin — spanning cells across rows and columns

The `mergeCells` plugin merges a rectangular range into one visible cell. Read this before touching
`mergeCells.ts` (2.1k lines), `cellsCollection.ts`, `focusOrder.ts`, `cellCoords.ts`, `renderer.ts`,
`utils.ts` or anything in `calculations/` and `contextMenuItem/`.

## Read `colspan` / `rowspan` from cell meta, never from the DOM

```js
const { colspan, rowspan } = hot.getCellMeta(row, col);   // authoritative
```

The DOM attributes only describe cells that are currently rendered. The meta is authoritative regardless of
viewport state. This is the single most repeated rule about this plugin, and it is in the root
`../../../AGENTS.md` for that reason.

## The lookup matrix is the authority on visibility — not the merge list

`cellsCollection.ts` keeps two structures, and they can disagree on purpose:

- **`mergedCells`** — the list of declared merges. It keeps entries whose whole visible span is hidden, and
  **their visual coordinates may be stale.**
- **the lookup matrix** — purged of merges that are fully hidden. **This is what you query for visibility**
  (`getWithinRange`, and the two other sites that repeat the comment).

Reading visibility off `mergedCells` is the bug this split exists to prevent.

Two line-scan helpers encode the rest of that logic: the first merge-touched line (in scan order) whose
cells all agree on a single index at or past `visualIndex`, and the first merge-**free** line at or past it
(which always emits its own index — cells covered by no merge contribute their line's own index).

## Trimming re-anchors a merge

The plugin listens for the **row trimming map** changing — Filters, `trimRows`, a NestedRows collapse — so a
merge whose anchor row gets hidden is re-anchored onto the still-visible rows. A merge is not dropped
because its anchor disappeared.

## `disablePlugin()` clears the field, so copy first

`generateFromSettings()` needs to tell a **re-applied** area from a **newly declared** one, so the previous
areas are copied *before* `disablePlugin()` clears them.

## Focus order is a scan, not a linked list

`focusOrder.ts` replaced a linked-list implementation, and several methods keep a cast with the note *"with
no current node the method returns `undefined` at runtime and the callers rely on that behavior."* Likewise
`getNodeByLayer`-style lookups keep "without a layer index no node can match", mirroring the old comparison
against `undefined`.

**Those casts are compatibility, not sloppiness.** Removing one changes the value callers receive.

## Two rendering quirks

- **Safari needs explicit heights on the cells next to a merged cell**, or their height is not proportional
  to the merged cell's. Chrome and Firefox do this by default; the explicit write emulates it.
- **The `TR` `background` property is modified so it can be changed asynchronously later.** Only the alpha
  changes, so it is invisible — the TDs' own background covers it. Do not remove it as dead styling.

## `cellCoords.ts` handles six structural cases

Adding rows/columns, removing rows/columns, removing the whole merge, removing partially-including-the-start,
removing the middle, removing the end. Each is a separate branch with its own comment. A structural bug here
is almost always a missing branch rather than wrong arithmetic — check all six.

## Fragile area: selection + merged cells

`../../../.ai/CONCERNS.md` flags this: visual-selection coordinate adjustment and MergeCells coordinate
adjustment overlap, with TODO comments admitting uncertainty about the responsibility boundary.
`selection.clear()` has a TODO noting that `selectedByColumnHeader` / `selectedByRowHeader` should be
cleared and are not. E2E coverage is extensive; the unit-level highlight logic is under-tested.

**When changing selection logic, test all combinations of: merged cells, hidden rows/columns, frozen
rows/columns, and navigable headers.** Run both the `selectAll` and `selectCells` suites.

## Pagination cannot coexist with this plugin

`registerConflict('pagination', ['mergeCells', …])` — Pagination is the plugin that stays disabled. See
`../base/AGENTS.md`.

## Viewport getter methods

`mergeCells` changes what the viewport getters report (DEV-932). That is documented behavior, not a defect.

## Where to look next

- The rendering primitive and the overlay clones: `../../3rdparty/walkontable/AGENTS.md`.
- Autofill and selection maths for merges: `calculations/autofill.ts`, `calculations/selection.ts`.
- Plugins whose specs live in this directory because the interaction is delicate:
  `../autofill/`, `../hiddenColumns/`, `../hiddenRows/`, `../undoRedo/`.
- Cell meta storage: `../../dataMap/metaManager/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='mergeCells'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='mergeCells'`

`__tests__/` is one of the largest in the repo — dedicated specs for `hiddenColumns`, `hiddenRows`,
`autofill`, `undoRedo`, `scrolling`, `selection`, `openEditor`, `secondClickDeselects`,
`pluginCompatibility`, plus `keyboardShortcuts/`, `methods/` and `rtl/`. Unit coverage exists for
`cellCoords`, `cellsCollection`, `focusOrder`, `selection` and `autofillCalculations`; prefer adding there.

# Cell description – what a cell holds beyond its text

This is **not a plugin**. It is the one mechanism that tells assistive technology what a data cell holds beyond its
value: that it is read only, holds a link, is a merged block. The focus stays on the cell, so a screen reader reads the
cell's text and nothing the cell merely carries. Read this before you add a part, and before you reach for an `::after`,
an `aria-label` or a hidden child to describe a cell.

## A description, not a name, through `aria-describedby`

`cellPainter.paint()` (`core/incrementalRender/cellPainter.ts`) calls `beginCellDescription(TD)` before the renderers
and `#describeCell()` after the last `afterRenderer` listener. In between, a plugin or renderer adds its part with
`addCellDescriptionPart(TD, rank, text)`. `applyCellDescription(hot, TD, enabled)` then joins the parts in rank order with
`, ` and points the cell at a hidden element that holds the text, through `aria-describedby`:

- **One hidden `span` per distinct text, in `hot.rootElement`.** Ids are `ht-description-<guid>-<n>`
  (`CELL_DESCRIPTION_ID_PREFIX`), kept in a `WeakMap` keyed by the root element, with the element itself, so a paint that finds it
  still in the root searches nothing. `n` only grows: an element a host's own markup removed is made again under a new id, and
  an id is never used twice in a root. A grid has a handful of them (read only,
  link, read only with link, one per distinct merged phrase, one per distinct tree position), never one per cell. They sit in the root, not in the page's
  portal, because an id has to resolve in the tree the cell is in (a grid inside a shadow root). They are `hidden` and never
  in a cell, so `textContent`, `innerText`, the copied text, the cell's box and its accessible **name** do not change.
- **The cell's `aria-describedby` keeps the column header first.** Walkontable writes `aria-describedby = <column header id>`
  on every paint (`3rdparty/walkontable/src/render/cells.ts`, `prepareCellAriaAttributes`), and a renderer's own value
  survives `restoreCellAriaAttributes`. `applyCellDescription()` runs after that, drops any token that starts with the id
  prefix, appends the current one, and writes only when the value changes. A grid without column headers has our token
  alone. A screen reader reads the description after the name and the header, as it reads the header.

| Rank | Part | Fed by |
|---|---|---|
| `TREE_POSITION` (5) | `NestedRows:announcement.level`, `.level.expanded`, `.level.collapsed` with `[level]`/`[position]`/`[setSize]` | NestedRows' `afterRenderer`, on every data cell of a row the tree knows (`HeadersUI#getRowLevelDescription()`). First, because it describes the row, not the cell. One element per distinct level, position, set size and state: a few per parent, but a flat top level of N rows makes up to N over a scroll |
| `READ_ONLY` (10) | `CellDescription:readOnly` | the painter itself, from `cellProperties.readOnly` |
| `LINK` (20) | `CellDescription:link` | `describeLink()` (`utils/cellLinks/describeLink.ts`), called by AutoLink when `linkifyCell()` made an anchor and by the Formulas `HYPERLINK` pass right after it wraps the cell |
| `MERGED` (30) | `CellDescription:merged` with `[row]`/`[column]` | `mergeCells/renderer.ts`, for the origin of a block: the block's last cell by its `aria-rowindex` and `aria-colindex` (header rows and row header columns counted, hidden lines skipped), so the numbers agree with what the screen reader says for that cell |

Rules, each from a measured reason:

- **Why not generated content.** The first version drew the text as `td::after` content with `position: relative`. That is
  how the Formulas plugin carries a formula's text (`plugins/formulas/AGENTS.md`), and it fits there because the text is
  per cell and the feature is new. For cells that existed before it changed three things on every existing grid: customer
  CSS on `td.someClass::after` lost to the rule, an absolutely positioned child of a custom renderer got a new containing
  block, and the cell's accessible **name** gained a suffix that a name-matching test saw. `aria-describedby` changes none
  of them. Do not move a part to `::after` or `aria-label` without that argument: `aria-label` on a gridcell replaces the
  value, `title` is dropped from a cell that has `aria-describedby`, and `aria-description` loses to the
  `aria-describedby` Walkontable writes.
- **An element that is not a data cell can share a description through `getCellDescriptionElementId(hot, text)`.**
  It returns the id of the element for that text, making it the first time, from the same store the cells use, so a
  focusable row header (NestedRows with `navigableHeaders`) points at the element its row's cells point at. Never build
  a second store of hidden elements. The caller writes its own `aria-describedby`: the painter only touches data cells.
- **A part with free text per cell does not belong here.** One element per distinct text is only cheap for a short list of
  phrases. A formula's text is different for every cell, so it stays on the name channel (`::after`) in the Formulas plugin.
  A read-only formula cell therefore reads `3 Formula: =SUM(A1:B1)` and is described as `read only`.
- **Every paint rewrites the token.** Walkontable recycles cell elements and resets the header reference, so a paint with
  no part removes our token and a paint with a part adds it. The commonest cell (no part, no token) costs one `includes()`.
  The element, not the cell, holds the text, so a paint that changes nothing writes nothing.
- **A part is added in `afterRenderer`, so a plugin that adds one marks every cell changed when it is enabled or
  disabled** (`hot.markAllCellsChanged()`), or `renderMode: 'onChange'` keeps the old description on the cells it skips.
  A part whose input can change without the cell's value changing needs its own mark.
- **A rank holds one part.** A second `addCellDescriptionPart()` with the same rank replaces the first, so AutoLink and
  the Formulas `HYPERLINK` pass can both report a link in one cell. A listener that rewrites the cell after the one that
  described it takes the part back with `removeCellDescriptionPart()`: the Formulas plugin showing formulas as text does it
  for the link, because the text replaced the anchor.
- **`ariaTags: false` skips all of it**, the read-only part included, and creates no element, like every other ARIA write.
- **The parts of a cell are kept per element** (a `WeakMap`), not in one slot. A renderer that builds a grid in its cell
  paints that grid's cells inside the outer paint, and a single slot lost the outer cell's parts. `beginCellDescription()`
  resets the entry, a part for an element that was never begun (a measuring table, a ghost cell) is ignored, and a paint that
  threw leaves an entry that goes with the element.
- **Phrases are translated in every language pack** and read through `hot.getTranslatedPhrase()` on every paint, so a
  dictionary registered later takes effect on the next render. A language registered without a phrase falls back to the
  English one; only a code no dictionary holds answers `null`, which adds nothing. A new text makes a new element, and the
  elements of earlier texts stay in the root until the grid is destroyed.
- **Cost, measured** in headless Chromium: a 200 by 40 grid with every cell read only (875 cells described, `hot.render()`
  plus a forced layout, median of 41, alternating builds) took 9.0 to 9.5 ms without the description and 8.6 to 10.3 ms with
  it, so no measurable cost; with ARIA off it took 6.8 ms, which is the ARIA the grid writes anyway. The generated-content
  version of this took 11 to 12 ms and then 13 to 18 ms on the same grid.
- **Reader support, measured** by the screen reader proof run on this change (`screenreader-nightly`, run 45148360219,
  groups `structure` and `menus`, NVDA with Chromium and VoiceOver with WebKit): both speak all three parts. NVDA with Chromium
  reads the description after the value (`B 1, B read only, row 2`), VoiceOver with WebKit before it (`B read only B2`,
  `merged through row 3 column 3 1-1`). Two repeats follow from that and are accepted: VoiceOver says `link` twice for an
  auto-linked cell (once from the description, once for the anchor), and NVDA with Chromium says a merged block's span twice
  (the description and the native `rowspan`; the numbers agree). NVDA with Firefox and VoiceOver with Chromium were not run.
  Chromium's accessibility tree gives the description (`Accessibility.getPartialAXTree`, read by
  `tests/e2e/cell-description.spec.ts`). If a reader drops a part, that part moves to the name channel as a follow-up.
- **Walkontable keeps our reference on a recycled cell.** `prepareCellAriaAttributes` (`render/cells.ts`) resets a cell's
  `aria-describedby` to the column header on every paint; without an exception the painter wrote it again after the renderer,
  two writes per described cell per paint (72 on a repaint and 56 on a scroll of a 300 by 4 read-only grid, 0 and 0 now).
  `isKeptDescribedBy()` (`render/ariaAttributes.ts`) leaves the value alone when it is the cell's own header reference followed
  by references that start with `CELL_DESCRIPTION_ID_PREFIX` (kept in `helpers/a11y.ts`, which both sides import). A recycled
  cell that moved to another column is reset as before. The cost: a renderer that reads `aria-describedby` on a recycled
  described cell sees our reference after the header, which a fresh cell does not have. Pinned by
  `walkontable/test/unit/renderer/ariaAttributes.unit.ts` and the write-count case of `tests/e2e/cell-description.spec.ts`.

Pinned by `__tests__/cellDescription.unit.ts` and `tests/e2e/cell-description.spec.ts`, which asks Chromium's own
accessibility tree for the name and the description (`tests/fixtures/pages/CellDescriptionPage.ts`).

# AutoRowHeaderSize plugin — measuring row header labels

The `autoRowHeaderSize` plugin widens the row header to fit its labels, **per header level**. Read this
before touching `autoRowHeaderSize.ts`. It is the newest of the three auto-size plugins (DEV-2623, PR #13239)
and it is the only one that measures headers rather than cells.

## Row headers are at negative column indexes

Row headers live at columns `-1, -2, …`, so a negative argument to this plugin's getters is read as one of
those levels. The samples for a level are generated for column `-1` across the rows.

## Per level, bucketed by the labels that level draws

Each header level is bucketed by **the labels it draws**, never by another level's labels — sampling level 1
by level 0's text skips the row carrying level 1's longest label and leaves that level narrow.

**The grid's own renderer is recognized by reference, not by position.** A listener on
`afterGetRowHeaderRenderers` may `unshift` or replace, so "level 0 is the grid's own" is not safe to assume.
Only the grid's own renderer has text that `getRowHeader()` can be trusted for; reading a custom renderer's
level through `getRowHeader` buckets it by the wrong text entirely.

A renderer added or removed since the last sweep changes the level count, so there is no previous level to
compare against and the fresh measurement stands on its own.

## `modifyRowHeaderWidth` is pinned ahead of the default order

This handler answers with its own measurement and **drops the incoming width**, so it has to run *before*
the handlers that raise that width — NestedRows applies the room its indented tree needs. Registration is
therefore pinned with a negative order index, the way AutoColumnSize pins `modifyColWidth`.

Without the pin, the position depends on plugin init order, and re-registering on `updateSettings` moves the
handler to the tail, silently discarding the tree's minimum.

## Recursion guard

A row header renderer that draws through the grid can bring the draw back around to
`modifyRowHeaderWidth`. Answering with what is already known is what keeps that from recursing — do not
replace the early answer with a fresh measurement.

## Two re-measure triggers nothing else would notice

- **`useTheme()`.** A theme carries its own font and cell padding, so every measured width is wrong under a
  new one — and `useTheme()` does not go through `updateSettings`, so no other mechanism reacts.
- **`afterFormulasValuesUpdate`.** Recalculated formulas can feed a label with no cell write being reported,
  and the payload describes engine addresses rather than rows, so the whole thing is measured again rather
  than diffed.

## `syncLimit` is a **count**, not an index

`syncLimit: 0` really means no rows are read before the first paint. It was once treated as the index of the
last row to read, which read one row too many at every value — including one row at zero.

## The chunked sweep, and why it asks for a draw

The asynchronous half runs in idle chunks with a **time budget**, not a fixed row count: reading is cheap
enough that a fixed count leaves most of the frame unused, and on a grid with several header levels it
overruns the frame.

Two rules for those chunks:

- **Guard for a destroyed instance** — an idle task can run after `destroy()`.
- **A chunk that widened a level must request a draw.** The per-level widths are written to the `col`
  elements by `calculateWidths()` *during* a draw, so resizing the overlays alone would not move them.
  Without the draw request, the label that made the header wider stays clipped until some unrelated render
  happens along. The synchronous half is the exception: it runs *inside* a draw, so a grid smaller than the
  sync limit asks for nothing.

A chunk that turned up no label the sampler wanted to keep cannot have changed the level, so the last
measurement still stands — laying samples out is the expensive half, and this skips it.

## Hidden rows

A row with no renderable index is hidden, so no header of it is drawn and none is measured.

## Where to look next

- The sibling auto-size plugins and their shared sampling pipeline: `../autoColumnSize/AGENTS.md`,
  `../autoRowSize/AGENTS.md`.
- The plugin whose minimum this one must not discard: `../nestedRows/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoRowHeaderSize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='autoRowHeaderSize'`

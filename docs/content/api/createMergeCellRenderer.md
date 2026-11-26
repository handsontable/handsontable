---
title: CreateMergeCellRenderer
metaTitle: CreateMergeCellRenderer API reference | Handsontable DataGrid for JavaScript
permalink: /api/create-merge-cell-renderer
canonicalUrl: /api/create-merge-cell-renderer
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### layOutContentAtBlockWidth

::: ask-about-api layOutContentAtBlockWidth|createMergeCellRenderer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/renderer.ts#L126

:::

_createMergeCellRenderer~layOutContentAtBlockWidth(TD, origColumn, lastMergedColumnIndex)_

Lays the content of a merged block's cell out at the width of the whole block when the overlay being drawn
renders a frozen column band that holds only part of the block's columns. The browser cuts such a cell at
the edge of the overlay's table, so the content would be aligned and wrapped against the cut width: a
right-aligned or centered value showed in the frozen pane and again in the master, and a long value
wrapped in the narrow frozen part and made the pane's row taller than the master's. Wrapped in an element
as wide as the block (and pulled back by the width of the columns before the band, for the inline-end
band), the content lands exactly where the master draws it, and the cell clips it to the pane's part.


| Param | Type | Description |
| --- | --- | --- |
| TD | `HTMLTableCellElement` | The cell that carries the block's span in the overlay. |
| origColumn | `number` | Visual column index of the block's top-left cell. |
| lastMergedColumnIndex | `number` | Renderable index of the block's last column. |



### releaseContentWindow

::: ask-about-api releaseContentWindow|createMergeCellRenderer

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/renderer.ts#L178

:::

_createMergeCellRenderer~releaseContentWindow(TD)_

Puts back the content `layOutContentAtBlockWidth` wrapped on an earlier paint of the cell. Most renderers
replace the cell's content and drop the wrapper with it, but one that keeps its DOM (a framework
component renderer) leaves it in place, and the cell element may now hold another cell or a block that no
longer crosses the freeze line. The wrapper is found through the registry, wherever it sits: a hook that
wrapped the cell's whole content in a link after the plugin ran moved it under that link. A cell that
never had a wrapper answers from the registry alone.


| Param | Type | Description |
| --- | --- | --- |
| TD | `HTMLTableCellElement` | The cell being painted. |



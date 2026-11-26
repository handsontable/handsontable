---
title: HandsontableAdapter
metaTitle: HandsontableAdapter API reference | Handsontable DataGrid for JavaScript
permalink: /api/handsontable-adapter
canonicalUrl: /api/handsontable-adapter
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Members

### outsideClickCommitMode

::: ask-about-api outsideClickCommitMode|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L1239

:::

_handsontableAdapter.outsideClickCommitMode_

Outside-click commits are handled natively by Handsontable's editor manager.


## Methods

### beginEdit

::: ask-about-api beginEdit|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L892

:::

_handsontableAdapter.beginEdit(_address, [seed]) ⇒ boolean_

Opens the inline editor on the active cell, optionally seeding it, through Handsontable's editor
manager, the way a key or a double-click opens it: the `beforeBeginEditing` veto, the read-only,
header, and hidden-cell checks, and a fresh prepare after `loadData()`/`updateData()` all apply.
Returns whether an editor actually opened, so the formula bar never believes an edit session
started on a cell that cannot be edited.


| Param | Type | Description |
| --- | --- | --- |
| _address | `CellAddress` | Unused; Handsontable always edits the active cell. |
| [seed] | `string` | `optional` Initial editor content. |


**Returns**: `boolean` - Whether the editor opened.  

### cancel

::: ask-about-api cancel|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L989

:::

_handsontableAdapter.cancel()_

Cancels the current edit.



### clearEphemeralHighlight

::: ask-about-api clearEphemeralHighlight|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L596

:::

_handsontableAdapter.clearEphemeralHighlight()_

Clears the ephemeral (drag preview) highlight.



### clearHighlights

::: ask-about-api clearHighlights|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L606

:::

_handsontableAdapter.clearHighlights()_

Clears every highlight.



### commit

::: ask-about-api commit|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L977

:::

_handsontableAdapter.commit(value, [direction])_

Commits the current edit with the given value.


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | The value to save. |
| [direction] | `string` | `optional` Optional post-commit selection step direction. |



### commitFill

::: ask-about-api commitFill|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L984

:::

_handsontableAdapter.commitFill(value)_

Commits the current edit into every selected cell (Ctrl/Cmd+Enter).


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | The value to save. |



### destroy

::: ask-about-api destroy|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L1001

:::

_handsontableAdapter.destroy()_

Releases hooks, owned custom selections, header tints, and generated styles.



### emitCellPick

::: ask-about-api emitCellPick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L658

:::

_handsontableAdapter.emitCellPick(pick)_

Emits a single-cell pick (called by the plugin's pick controller).


| Param | Type | Description |
| --- | --- | --- |
| pick | `CellPick` | The pick payload. |



### emitHeaderPick

::: ask-about-api emitHeaderPick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L680

:::

_handsontableAdapter.emitHeaderPick(pick)_

Emits a header pick (called by the plugin's pick controller).


| Param | Type | Description |
| --- | --- | --- |
| pick | `HeaderPick` | The pick payload. |



### emitRangePick

::: ask-about-api emitRangePick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L665

:::

_handsontableAdapter.emitRangePick(pick)_

Emits a range pick (called by the plugin's pick controller).


| Param | Type | Description |
| --- | --- | --- |
| pick | `RangePick` | The pick payload. |



### enterRefSelectionMode

::: ask-about-api enterRefSelectionMode|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L692

:::

_handsontableAdapter.enterRefSelectionMode()_

No-op: reference selection needs no adapter-side arming.



### exitRefSelectionMode

::: ask-about-api exitRefSelectionMode|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L695

:::

_handsontableAdapter.exitRefSelectionMode()_

Clears the drag preview when reference selection mode ends.



### expandRangeOverMerges

::: ask-about-api expandRangeOverMerges|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L537

:::

_handsontableAdapter.expandRangeOverMerges(range) ⇒ [CellRange](@/api/cellRange.md)_

Grows a picked range to cover every merged cell it touches, the way the grid's own selection
grows over a merge (MergeCells expands it in `beforeSelectionHighlightSet`). Without it a drag
from A3 onto a merged A1:B2 inserted `A1:A3`, a range that cuts the merge. The range is read in
HyperFormula space and returned in it; a corner that has no visual index leaves it as it is.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The picked range, in HyperFormula coordinates. |


**Returns**: [`CellRange`](@/api/cellRange.md) - The range covering every merge it touches.  

### formatRef

::: ask-about-api formatRef|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L511

:::

_handsontableAdapter.formatRef(ref) ⇒ string_

Formats a cell address or range as an A1-style reference string.


| Param | Type | Description |
| --- | --- | --- |
| ref | `CellAddress` <br/> `CellRange` | The reference to format. |



### getActiveCell

::: ask-about-api getActiveCell|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L843

:::

_handsontableAdapter.getActiveCell() ⇒ CellAddress | null_

Returns the active cell address, or `null` when nothing is selected.



### getAutoScrollTarget

::: ask-about-api getAutoScrollTarget|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L427

:::

_handsontableAdapter.getAutoScrollTarget() ⇒ AutoScrollTarget | null_

Returns what the reference drag's edge auto-scroller scrolls, per axis: the element that owns the
axis, or a stand-in for the window's viewport when the window owns it. With one owner for both
axes that owner is returned; with a pixel `width` and no `height` the window scrolls the rows and
the holder the columns, so the target takes its vertical members from the viewport and its
horizontal ones from the holder. The holder alone spans every row there, so a pointer below the
window still sat inside it and the page never scrolled.



### getCellAddressAt

::: ask-about-api getCellAddressAt|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L487

:::

_handsontableAdapter.getCellAddressAt(x, y) ⇒ CellAddress | null_

Resolves the cell address at the given viewport coordinates. The reference drag calls this
while it auto-scrolls, with the pointer held past the viewport edge, so the position is
resolved with `getCellCoordsFromMousePosition()`, which clamps to the nearest rendered cell -
`elementFromPoint()` finds the scrollbar or the page out there, and the range would stop
growing at the last rendered cell.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | The horizontal viewport coordinate. |
| y | `number` | The vertical viewport coordinate. |



### getCellFormula

::: ask-about-api getCellFormula|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L879

:::

_handsontableAdapter.getCellFormula(address) ⇒ string_

Returns the raw formula text of a cell.


| Param | Type | Description |
| --- | --- | --- |
| address | `CellAddress` | The cell address in HyperFormula coordinates. |



### getDataEdge

::: ask-about-api getDataEdge|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L726

:::

_handsontableAdapter.getDataEdge(from, direction) ⇒ CellAddress_

Returns the address of the data edge from a start cell in a direction (Ctrl+Arrow semantics).


| Param | Type | Description |
| --- | --- | --- |
| from | `CellAddress` | The start address in HyperFormula coordinates. |
| direction | `string` | The step direction. |



### getGridSize

::: ask-about-api getGridSize|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L705

:::

_handsontableAdapter.getGridSize() ⇒ GridSize_

Returns the grid size in HyperFormula (sheet) space - the space of every address
the core consumes it against (`FormulaBar` navigation bounds, `expandHeaderSpan`
whole-axis refs). Falls back to the visual counts when the engine dimensions are
unavailable; with trimmed rows the two spaces differ.



### getScrollHolder

::: ask-about-api getScrollHolder|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L406

:::

_handsontableAdapter.getScrollHolder() ⇒ HTMLElement | null_

Returns the element that scrolls the grid: the master holder, or a scrolling ancestor of the
grid. The element that scrolls the rows wins; with the window scrolling the rows, the element
that scrolls the columns. Returns `null` when the window owns both axes, because a page scroll
needs no element to follow: the editor moves with the page. The reference drag scrolls the
page through `getAutoScrollTarget()`.



### highlightRange

::: ask-about-api highlightRange|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L582

:::

_handsontableAdapter.highlightRange(range, color)_

Renders the ephemeral (drag preview) highlight.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to highlight. |
| color | `string` | The highlight color. |



### onCellPick

::: ask-about-api onCellPick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L643

:::

_handsontableAdapter.onCellPick(callback) ⇒ function_

Subscribes to single-cell picks.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The pick listener. |


**Returns**: `function` - Unsubscribe function.  

### onHeaderPick

::: ask-about-api onHeaderPick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L673

:::

_handsontableAdapter.onHeaderPick(callback) ⇒ function_

Subscribes to header picks.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The pick listener. |


**Returns**: `function` - Unsubscribe function.  

### onInlineEditClose

::: ask-about-api onInlineEditClose|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L961

:::

_handsontableAdapter.onInlineEditClose(callback) ⇒ function_

Subscribes to inline editor close events.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Invoked when the inline editor closes. |


**Returns**: `function` - Unsubscribe function.  

### onInlineEditStart

::: ask-about-api onInlineEditStart|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L953

:::

_handsontableAdapter.onInlineEditStart(callback) ⇒ function_

Subscribes to inline edit session starts.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Receives the editor mount element and the typed seed. |


**Returns**: `function` - Unsubscribe function.  

### onOutsideCellClick

::: ask-about-api onOutsideCellClick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L687

:::

_handsontableAdapter.onOutsideCellClick() ⇒ function_

No-op: outside clicks commit natively (see `outsideClickCommitMode`).


**Returns**: `function` - Unsubscribe function.  

### onRangePick

::: ask-about-api onRangePick|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L651

:::

_handsontableAdapter.onRangePick(callback) ⇒ function_

Subscribes to range picks.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The pick listener. |


**Returns**: `function` - Unsubscribe function.  

### onSelectionChange

::: ask-about-api onSelectionChange|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L855

:::

_handsontableAdapter.onSelectionChange(callback) ⇒ function_

Subscribes to selection changes, reported in HyperFormula coordinates.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Receives the normalized selection or `null`. |


**Returns**: `function` - Unsubscribe function.  

### onSwitchToInline

::: ask-about-api onSwitchToInline|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L969

:::

_handsontableAdapter.onSwitchToInline(callback) ⇒ function_

Subscribes to bar-to-inline handoff requests.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Invoked when editing should switch to the inline editor. |


**Returns**: `function` - Unsubscribe function.  

### resetBorderWidth

::: ask-about-api resetBorderWidth|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L1022

:::

_handsontableAdapter.resetBorderWidth()_

Drops the cached reference-highlight border width, so the next highlight reads it from the
theme again. Called on a theme change, which keeps this adapter.



### scrollCellIntoView

::: ask-about-api scrollCellIntoView|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L793

:::

_handsontableAdapter.scrollCellIntoView(address)_

Scrolls the viewport the minimal distance needed to reveal the given cell.


| Param | Type | Description |
| --- | --- | --- |
| address | `CellAddress` | The cell address in HyperFormula coordinates. |



### selectFirstCell

::: ask-about-api selectFirstCell|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L905

:::

_handsontableAdapter.selectFirstCell()_

Selects the first formula cell of the grid (the `IGridAdapter` `selectFirstCell` contract).



### setActiveCell

::: ask-about-api setActiveCell|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L915

:::

_handsontableAdapter.setActiveCell(address) ⇒ boolean | void_

Moves the grid selection to a single cell.


| Param | Type | Description |
| --- | --- | --- |
| address | `CellAddress` | The target address in HyperFormula coordinates. |


**Returns**: `boolean` | `void` - `false` when the grid shows no row or column to move to, hides it
(HiddenRows, HiddenColumns, another Pagination page), caps it away (`maxRows`), or does not select
it, which the address box announces as unavailable.  

### setHighlights

::: ask-about-api setHighlights|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L521

:::

_handsontableAdapter.setHighlights(items)_

Replaces the persistent reference highlights, rendered as the grid's own custom
selections. This runs on every keystroke and caret move while editing, so an
unchanged highlight set is detected and skipped without touching the grid, and a
changed one triggers only a fast (reposition-only) view render.


| Param | Type | Description |
| --- | --- | --- |
| items | `Array<RangeHighlight>` | The highlights to render. |



### setInlineEditorVisible

::: ask-about-api setInlineEditorVisible|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L996

:::

_handsontableAdapter.setInlineEditorVisible(visible)_

Shows or hides the inline editor overlay.


| Param | Type | Description |
| --- | --- | --- |
| visible | `boolean` | Whether the editor should be visible. |



### setOverlayClassName

::: ask-about-api setOverlayClassName|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L623

:::

_handsontableAdapter.setOverlayClassName(className)_

Applies the consumer's theming class to the overlay host (the grid's root wrapper) so CSS
variables scoped under it (e.g. reference palette overrides) cascade to the highlighted cells
and their selection borders. A class the host already carries is left alone, and only a class
the adapter added is removed: the plugin passes the grid theme class, which core owns on the
wrapper and swaps on a theme change.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` <br/> `null` | The class name, or `null` to remove it. |



### setSelection

::: ask-about-api setSelection|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L932

:::

_handsontableAdapter.setSelection(range) ⇒ boolean | void_

Moves the grid selection to a range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The target range in HyperFormula coordinates. |


**Returns**: `boolean` | `void` - `false` when the range holds no index the grid shows, which the
address box announces as unavailable.  

### stepCell

::: ask-about-api stepCell|HandsontableAdapter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/handsontableAdapter.ts#L761

:::

_handsontableAdapter.stepCell(from, direction) ⇒ CellAddress_

Returns the address one step away from a start cell in a direction, clamped to the grid.


| Param | Type | Description |
| --- | --- | --- |
| from | `CellAddress` | The start address in HyperFormula coordinates. |
| direction | `string` | The step direction. |



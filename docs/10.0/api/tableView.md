---
title: TableView
metaTitle: TableView - API Reference - Handsontable Documentation
permalink: /10.0/api/table-view
canonicalUrl: /api/table-view
hotPlugin: false
editLink: false
---

# TableView

[[toc]]

## Members

### TBODY
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L62

:::

_tableView.TBODY : HTMLTableSectionElement_

Main <TBODY> element.



### THEAD
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L56

:::

_tableView.THEAD : HTMLTableSectionElement_

Main <THEAD> element.



### wt
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L68

:::

_tableView.wt : [Walkontable](@/api/walkontable.md)_

Main Walkontable instance.


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L150

:::

_tableView.adjustElementsSize([force])_

Adjust overlays elements size and master table size.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjust the DOM nodes sizes for all overlays. |



### countNotHiddenColumnIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L475

:::

_tableView.countNotHiddenColumnIndexes(visualIndex, incrementBy) ⇒ number_

Returns number of not hidden column indexes counting from the passed starting index.
The counting direction can be controlled by `incrementBy` argument.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | The visual index from which the counting begins. |
| incrementBy | `number` | If `-1` then counting is backwards or forward when `1`. |



### countNotHiddenIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L490

:::

_tableView.countNotHiddenIndexes(visualIndex, incrementBy, indexMapper, renderableIndexesCount) ⇒ number_

Returns number of not hidden indexes counting from the passed starting index.
The counting direction can be controlled by `incrementBy` argument.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | The visual index from which the counting begins. |
| incrementBy | `number` | If `-1` then counting is backwards or forward when `1`. |
| indexMapper | `IndexMapper` | The IndexMapper instance for specific axis. |
| renderableIndexesCount | `number` | Total count of renderable indexes for specific axis. |



### countNotHiddenRowIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L462

:::

_tableView.countNotHiddenRowIndexes(visualIndex, incrementBy) ⇒ number_

Returns number of not hidden row indexes counting from the passed starting index.
The counting direction can be controlled by `incrementBy` argument.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | The visual index from which the counting begins. |
| incrementBy | `number` | If `-1` then counting is backwards or forward when `1`. |



### countRenderableColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L441

:::

_tableView.countRenderableColumns() ⇒ number_

Returns the number of renderable columns.



### countRenderableRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L450

:::

_tableView.countRenderableRows() ⇒ number_

Returns the number of renderable rows.



### getCellAtCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L165

:::

_tableView.getCellAtCoords(coords, topmost) ⇒ HTMLTableCellElement | null_

Returns td object given coordinates.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Renderable cell coordinates. |
| topmost | `boolean` | Indicates whether the cell should be calculated from the topmost. |



### getLastSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L1197

:::

_tableView.getLastSize() ⇒ object_

Returns cached dimensions.



### render
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L128

:::

_tableView.render()_

Renders WalkontableUI.



### scrollViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L185

:::

_tableView.scrollViewport(coords, [snapToTop], [snapToRight], [snapToBottom], [snapToLeft]) ⇒ boolean_

Scroll viewport to a cell.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Renderable cell coordinates. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right side of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom side of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left side of the table. |



### scrollViewportHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L197

:::

_tableView.scrollViewportHorizontally(column, [snapToRight], [snapToLeft]) ⇒ boolean_

Scroll viewport to a column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Renderable column index. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right side of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left side of the table. |



### scrollViewportVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L209

:::

_tableView.scrollViewportVertically(row, [snapToTop], [snapToBottom]) ⇒ boolean_

Scroll viewport to a row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Renderable row index. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom side of the table. |



### setLastSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L1186

:::

_tableView.setLastSize(width, height)_

Sets new dimensions of the container.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | The table width. |
| height | `number` | The table height. |



### translateFromRenderableToVisualCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L384

:::

_tableView.translateFromRenderableToVisualCoords(coords) ⇒ [CellCoords](@/api/cellCoords.md)_

Translate renderable cell coordinates to visual coordinates.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates. |



### translateFromRenderableToVisualIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L396

:::

_tableView.translateFromRenderableToVisualIndex(renderableRow, renderableColumn) ⇒ Array&lt;number&gt;_

Translate renderable row and column indexes to visual row and column indexes.


| Param | Type | Description |
| --- | --- | --- |
| renderableRow | `number` | Renderable row index. |
| renderableColumn | `number` | Renderable columnIndex. |



### updateCellHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/tableView.js#L1126

:::

_tableView.updateCellHeader(element, index, content)_

Updates header cell content.

**Since**: 0.15.0-beta4  

| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | Element to update. |
| index | `number` | Row index or column index. |
| content | `function` | Function which should be returns content for this cell. |



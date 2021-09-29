---
title: Table
metaTitle: Table - API Reference - Handsontable Documentation
permalink: /10.0/api/table
canonicalUrl: /api/table
hotPlugin: false
editLink: false
---

# Table

[[toc]]

## Members

### hasTableHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L59

:::

_table.hasTableHeight : boolean_

Indicates if the table has height bigger than 0px.



### hasTableWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L65

:::

_table.hasTableWidth : boolean_

Indicates if the table has width bigger than 0px.



### isMaster
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L43

:::

_table.isMaster : boolean_

Indicates if this instance is of type `MasterTable` (i.e. It is NOT an overlay).



### isTableVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L72

:::

_table.isTableVisible : boolean_

Indicates if the table is visible. By visible, it means that the holder
element has CSS 'display' property different than 'none'.


## Methods

### adjustColumnHeaderHeights
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L436

:::

_table.adjustColumnHeaderHeights()_



### createHider
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L177

:::

_table.createHider(spreader) ⇒ HTMLElement_


| Param | Type | Description |
| --- | --- | --- |
| spreader | `HTMLElement` | An element to the hider element is injected. |



### createHolder
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L200

:::

_table.createHolder(hider) ⇒ HTMLElement_


| Param | Type | Description |
| --- | --- | --- |
| hider | `HTMLElement` | An element to the holder element is injected. |



### createSpreader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L154

:::

_table.createSpreader(table) ⇒ HTMLElement_


| Param | Type | Description |
| --- | --- | --- |
| table | `HTMLTableElement` | An element to process. |



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L229

:::

_table.draw([fastDraw]) ⇒ [Table](@/api/table.md)_

Redraws the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [fastDraw] | `boolean` | <code>false</code> | `optional` If TRUE, will try to avoid full redraw and only update the border positions.                                   If FALSE or UNDEFINED, will perform a full redraw. |



### fixTableDomTree
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L123

:::

_table.fixTableDomTree()_



### getCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L571

:::

_table.getCell(coords) ⇒ HTMLElement | number_

Get cell element at coords.
Negative coords.row or coords.col are used to retrieve header cells. If there are multiple header levels, the
negative value corresponds to the distance from the working area. For example, when there are 3 levels of column
headers, coords.col=-1 corresponds to the most inner header element, while coords.col=-3 corresponds to the
outmost header element.

In case an element for the coords is not rendered, the method returns an error code.
To produce the error code, the input parameters are validated in the order in which they
are given. Thus, if both the row and the column coords are out of the rendered bounds,
the method returns the error code for the row.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates. |


**Returns**: `HTMLElement` | `number` - HTMLElement on success or Number one of the exit codes on error:
 -1 row before viewport
 -2 row after viewport
 -3 column before viewport
 -4 column after viewport.  

### getColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L625

:::

_table.getColumnHeader(col, [level]) ⇒ object_

GetColumnHeader.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| col | `number` |  | Column index. |
| [level] | `number` | <code>0</code> | `optional` Header level (0 = most distant to the table). |


**Returns**: `object` - HTMLElement on success or undefined on error.  

### getColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1036

:::

_table.getColumnHeaderHeight(level) ⇒ number_


| Param | Type | Description |
| --- | --- | --- |
| level | `number` | The column level. |



### getColumnHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L637

:::

_table.getColumnHeaders(column) ⇒ Array&lt;HTMLTableCellElement&gt;_

Gets all columns headers (TH elements) from the table.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | A source column index. |



### getColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1044

:::

_table.getColumnWidth(sourceColumn) ⇒ number_


| Param | Type | Description |
| --- | --- | --- |
| sourceColumn | `number` | The physical column index. |



### getCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L707

:::

_table.getCoords(TD) ⇒ [CellCoords](@/api/cellCoords.md) | null_

Returns cell coords object for a given TD (or a child element of a TD element).


| Param | Type | Description |
| --- | --- | --- |
| TD | `HTMLTableCellElement` | A cell DOM element (or a child of one). |


**Returns**: [`CellCoords`](@/api/cellCoords.md) | `null` - The coordinates of the provided TD element (or the closest TD element) or null, if the provided element is not applicable.  

### getRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L659

:::

_table.getRowHeader(row, [level]) ⇒ HTMLElement_

GetRowHeader.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Row index. |
| [level] | `number` | <code>0</code> | `optional` Header level (0 = most distant to the table). |


**Returns**: `HTMLElement` - HTMLElement on success or Number one of the exit codes on error: `null table doesn't have row headers`.  

### getRowHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L681

:::

_table.getRowHeaders(row) ⇒ Array&lt;HTMLTableCellElement&gt;_

Gets all rows headers (TH elements) from the table.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | A source row index. |



### getRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1028

:::

_table.getRowHeight(sourceRow) ⇒ number_

Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height.


| Param | Type | Description |
| --- | --- | --- |
| sourceRow | `number` | The physical row index. |



### getStretchedColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1052

:::

_table.getStretchedColumnWidth(sourceColumn) ⇒ number_


| Param | Type | Description |
| --- | --- | --- |
| sourceColumn | `number` | The physical column index. |



### getTrForRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L800

:::

_table.getTrForRow(row) ⇒ HTMLTableElement_


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |



### hasDefinedSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1062

:::

_table.hasDefinedSize() ⇒ boolean_

Checks if the table has defined size. It returns `true` when the table has width and height
set bigger than `0px`.



### is
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L116

:::

_table.is(overlayTypeName) ⇒ boolean_

Returns a boolean that is true if this intance of Table represents a specific overlay, identified by the overlay name.
For MasterTable, it returns false.


| Param | Type | Description |
| --- | --- | --- |
| overlayTypeName | `string` | The overlay type. |



### isColumnAfterRenderedColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L959

:::

_table.isColumnAfterRenderedColumns(column) ⇒ boolean_

Check if the given column index is greater than the index of the last column that
is currently rendered and return TRUE in that case, or FALSE otherwise.

The negative column index is used to check the rows' headers. However,
keep in mind that for negative indexes, the method always returns FALSE as
it is not possible to render headers partially. The "after" index can not be
lower than -1.

                           For fixedColumnsLeft: 1 the master overlay
                           do not render this first columns.
 Headers    -3   -2   -1    |
          +----+----+----║┄ ┄ +------+------+
          │    │    │    ║    │  B1  │  C1  │
          +--------------║┄ ┄ --------------│
          │    │    │    ║    │  B2  │  C2  │
          +--------------║┄ ┄ --------------│
          │    │    │    ║    │  B3  │  C3  │
          +----+----+----║┄ ┄ +------+------+
                              ╷             ╷
     -------------------------+-------------+---------------->
         FALSE             first    FALSE   last         TRUE
                          rendered         rendered
                          column           column


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual column index. |



### isColumnBeforeRenderedColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L918

:::

_table.isColumnBeforeRenderedColumns(column) ⇒ boolean_

Check if the given column index is lower than the index of the first column that
is currently rendered and return TRUE in that case, or FALSE otherwise.

Negative column index is used to check the rows' headers.

                           For fixedColumnsLeft: 1 the master overlay
                           do not render this first columns.
 Headers    -3   -2   -1    |
          +----+----+----║┄ ┄ +------+------+
          │    │    │    ║    │  B1  │  C1  │
          +--------------║┄ ┄ --------------│
          │    │    │    ║    │  B2  │  C2  │
          +--------------║┄ ┄ --------------│
          │    │    │    ║    │  B3  │  C3  │
          +----+----+----║┄ ┄ +------+------+
                              ╷             ╷
     -------------------------+-------------+---------------->
         TRUE             first    FALSE   last         FALSE
                          rendered         rendered
                          column           column


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual column index. |



### isColumnHeaderRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L810

:::

_table.isColumnHeaderRendered(column) ⇒ boolean_

Checks if the column index (negative value from -1 to N) is rendered.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index (negative value from -1 to N). |



### isRowAfterRenderedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L881

:::

_table.isRowAfterRenderedRows(row) ⇒ boolean_

Check if the given column index is greater than the index of the last column that
is currently rendered and return TRUE in that case, or FALSE otherwise.

The negative row index is used to check the columns' headers. However,
keep in mind that for negative indexes, the method always returns FALSE as
it is not possible to render headers partially. The "after" index can not be
lower than -1.

 Headers
          +--------------+                                     │
      -3  │    │    │    │                                     │
          +--------------+                                     │
      -2  │    │    │    │                                     │ FALSE
          +--------------+                                     │
      -1  │    │    │    │                                     │
 Cells  +==================+                                   │
       0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
          +--------------+      the master overlay do       ---+ first rendered row (index 1)
       1  │ A2 │ B2 │ C2 │      not render the first rows      │
          +--------------+                                     │ FALSE
       2  │ A3 │ B3 │ C3 │                                     │
          +--------------+                                  ---+ last rendered row
                                                               │
                                                               │ TRUE


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |



### isRowBeforeRenderedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L839

:::

_table.isRowBeforeRenderedRows(row) ⇒ boolean_

Check if the given row index is lower than the index of the first row that
is currently rendered and return TRUE in that case, or FALSE otherwise.

Negative row index is used to check the columns' headers.

 Headers
          +--------------+                                     │
      -3  │    │    │    │                                     │
          +--------------+                                     │
      -2  │    │    │    │                                     │ TRUE
          +--------------+                                     │
      -1  │    │    │    │                                     │
 Cells  +==================+                                   │
       0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
          +--------------+      the master overlay do       ---+ first rendered row (index 1)
       1  │ A2 │ B2 │ C2 │      not render the first row.      │
          +--------------+                                     │ FALSE
       2  │ A3 │ B3 │ C3 │                                     │
          +--------------+                                  ---+ last rendered row
                                                               │
                                                               │ FALSE


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |



### isRowHeaderRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L827

:::

_table.isRowHeaderRendered(row) ⇒ boolean_

Checks if the row index (negative value from -1 to N) is rendered.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The row index (negative value from -1 to N). |



### isVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L1072

:::

_table.isVisible() ⇒ boolean_

Checks if the table is visible. It returns `true` when the holder element (or its parents)
has CSS 'display' property different than 'none'.



### markIfOversizedColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L391

:::

_table.markIfOversizedColumnHeader(col)_


| Param | Type | Description |
| --- | --- | --- |
| col | `number` | The visual column index. |



### markOversizedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L757

:::

_table.markOversizedRows()_

Check if any of the rendered rows is higher than expected, and if so, cache them.



### refreshSelections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L493

:::

_table.refreshSelections(fastDraw)_

Refresh the table selection by re-rendering Selection instances connected with that instance.


| Param | Type | Description |
| --- | --- | --- |
| fastDraw | `boolean` | If fast drawing is enabled than additionally className clearing is applied. |



### removeClassFromCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L480

:::

_table.removeClassFromCells(className)_


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS class name to remove from the table cells. |



### resetOversizedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table.js#L456

:::

_table.resetOversizedRows()_

Resets cache of row heights. The cache should be cached for each render cycle in a case
when new cell values have content which increases/decreases cell height.



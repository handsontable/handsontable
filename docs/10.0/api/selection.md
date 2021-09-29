---
title: Selection
metaTitle: Selection - API Reference - Handsontable Documentation
permalink: /10.0/api/selection
canonicalUrl: /api/selection
hotPlugin: false
editLink: false
---

# Selection

[[toc]]

## Members

### highlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L79

:::

_selection.highlight : [Highlight](@/api/highlight.md)_

Visualization layer.



### inProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L47

:::

_selection.inProgress : boolean_

The flag which determines if the selection is in progress.



### selectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L67

:::

_selection.selectedByColumnHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole column was selected using the column header or
the corner header.



### selectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L53

:::

_selection.selectedByCorner : boolean_

The flag indicates that selection was performed by clicking the corner overlay.



### selectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L60

:::

_selection.selectedByRowHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole row was selected using the row header or
the corner header.



### selectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L73

:::

_selection.selectedRange : [SelectionRange](@/api/selectionRange.md)_

Selection data layer (handle visual coordinates).



### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L35

:::

_selection.settings : GridSettings_

Handsontable settings instance.



### tableProps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L41

:::

_selection.tableProps : object_

An additional object with dynamically defined properties which describes table state.



### transformation
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L95

:::

_selection.transformation : [Transformation](@/api/transformation.md)_

The module for modifying coordinates.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L52

:::

_selection.add(coords) ⇒ [Selection](@/api/selection.md)_

Adds a cell coords to the selection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates to add. |



### addClassAtCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L127

:::

_selection.addClassAtCoords(wotInstance, sourceRow, sourceColumn, className, [markIntersections]) ⇒ [Selection](@/api/selection.md)_

Adds class name to cell element at given coords.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| wotInstance | `Walkontable` |  | Walkontable instance. |
| sourceRow | `number` |  | Cell row coord. |
| sourceColumn | `number` |  | Cell column coord. |
| className | `string` |  | Class name. |
| [markIntersections] | `boolean` | <code>false</code> | `optional` If `true`, linear className generator will be used to add CSS classes                                            in a continuous way. |



### begin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L133

:::

_selection.begin()_

Indicate that selection process began. It sets internaly `.inProgress` property to `true`.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L93

:::

_selection.clear() ⇒ [Selection](@/api/selection.md)_

Clears selection.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L503

:::

_selection.clear()_

Clear the selection by resetting the collected ranges and highlights.



### deselect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L512

:::

_selection.deselect()_

Deselects all selected cells.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L348

:::

_selection.destroy()_

Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L187

:::

_selection.draw(wotInstance)_


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### finish
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L140

:::

_selection.finish()_

Indicate that selection process finished. It sets internaly `.inProgress` property to `false`.



### getBorder
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L29

:::

_selection.getBorder(wotInstance) ⇒ [Border](@/api/border.md)_

Each Walkontable clone requires it's own border for every selection. This method creates and returns selection
borders per instance.


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### getCorners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L104

:::

_selection.getCorners() ⇒ Array_

Returns the top left (TL) and bottom right (BR) selection coordinates.


**Returns**: `Array` - Returns array of coordinates for example `[1, 1, 5, 5]`.  

### getLayerLevel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L386

:::

_selection.getLayerLevel() ⇒ number_

Returns currently used layer level.


**Returns**: `number` - Returns layer level starting from 0. If no selection was added to the table -1 is returned.  

### getSelectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L126

:::

_selection.getSelectedRange() ⇒ [SelectionRange](@/api/selectionRange.md)_

Get data layer for current selection.



### inInSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L472

:::

_selection.inInSelection(coords) ⇒ boolean_

Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
the coords object is within selection range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### isAreaCornerVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L492

:::

_selection.isAreaCornerVisible(layerLevel) ⇒ boolean_

Returns `true` if the area corner should be visible.


| Param | Type | Description |
| --- | --- | --- |
| layerLevel | `number` | The layer level. |


**Returns**: `boolean` - `true` if the corner element has to be visible, `false` otherwise.  

### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L42

:::

_selection.isEmpty() ⇒ boolean_

Checks if selection is empty.



### isEntireColumnSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L441

:::

_selection.isEntireColumnSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire columns (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isEntireRowSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L418

:::

_selection.isEntireRowSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire rows (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isInProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L150

:::

_selection.isInProgress() ⇒ boolean_

Check if the process of selecting the cell/cells is in progress.



### isMultiple
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L351

:::

_selection.isMultiple() ⇒ boolean_

Returns information if we have a multiselection. This method check multiselection only on the latest layer of
the selection.



### isSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L395

:::

_selection.isSelected() ⇒ boolean_

Returns `true` if currently there is a selection on the screen, `false` otherwise.



### isSelectedByAnyHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L450

:::

_selection.isSelectedByAnyHeader() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the row or column header on any layer level.



### isSelectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L430

:::

_selection.isSelectedByColumnHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the column header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any column header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isSelectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L461

:::

_selection.isSelectedByCorner() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the left-top corner overlay.



### isSelectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L407

:::

_selection.isSelectedByRowHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the row header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any row header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### linearClassNameGenerator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L157

:::

_selection.linearClassNameGenerator(baseClassName, layerLevelOwner) ⇒ function_

Generate helper for calculating classNames based on previously added base className.
The generated className is always generated as a continuation of the previous className. For example, when
the currently checked element has 'area-2' className the generated new className will be 'area-3'. When
the element doesn't have any classNames than the base className will be returned ('area');.


| Param | Type | Description |
| --- | --- | --- |
| baseClassName | `string` | Base className to be used. |
| layerLevelOwner | `number` | Layer level which the instance of the Selection belongs to. |



### refresh
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L658

:::

_selection.refresh()_

Rewrite the rendered state of the selection as visual selection may have a new representation in the DOM.



### replace
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L71

:::

_selection.replace(oldCoords, newCoords) ⇒ boolean_

If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
information about success.


| Param | Type | Description |
| --- | --- | --- |
| oldCoords | `CellCoords` | An old cell coordinates to replace. |
| newCoords | `CellCoords` | The new cell coordinates. |



### selectAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L530

:::

_selection.selectAll([includeRowHeaders], [includeColumnHeaders])_

Select all cells.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the row headers, `false` otherwise. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the column headers, `false` otherwise. |



### selectCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L558

:::

_selection.selectCells(selectionRanges) ⇒ boolean_

Make multiple, non-contiguous selection specified by `row` and `column` values or a range of cells
finishing at `endRow`, `endColumn`. The method supports two input formats, first as an array of arrays such
as `[[rowStart, columnStart, rowEnd, columnEnd]]` and second format as an array of CellRange objects.
If the passed ranges have another format the exception will be thrown.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | The coordinates which define what the cells should be selected. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L614

:::

_selection.selectColumns(startColumn, [endColumn], [headerLevel]) ⇒ boolean_

Select column specified by `startColumn` visual index or column property or a range of columns finishing at
`endColumn`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` <br/> `string` |  | Visual column index or column property from which the selection starts. |
| [endColumn] | `number` <br/> `string` |  | `optional` Visual column index or column property from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A row header index that triggers the column selection. The value can                                  take -1 to -N, where -1 means the header closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L641

:::

_selection.selectRows(startRow, [endRow], [headerLevel]) ⇒ boolean_

Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | Visual row index from which the selection starts. |
| [endRow] | `number` |  | `optional` Visual row index from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A column header index that triggers the row selection.                                  The value can take -1 to -N, where -1 means the header                                  closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### setRangeEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L214

:::

_selection.setRangeEnd(coords)_

Ends selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |



### setRangeStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L164

:::

_selection.setRangeStart(coords, [multipleSelection], [fragment])_

Starts selection range on given coordinate object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `CellCoords` |  | Visual coords. |
| [multipleSelection] | `boolean` |  | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |
| [fragment] | `boolean` | <code>false</code> | `optional` If `true`, the selection will be treated as a partial selection where the                                   `setRangeEnd` method won't be called on every `setRangeStart` call. |



### setRangeStartOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L205

:::

_selection.setRangeStartOnly(coords, [multipleSelection])_

Starts selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |
| [multipleSelection] | `boolean` | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |



### transformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L377

:::

_selection.transformEnd(rowDelta, colDelta)_

Sets selection end cell relative to the current selection end cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |



### transformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L367

:::

_selection.transformStart(rowDelta, colDelta, force)_

Selects cell relative to the current cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |
| force | `boolean` | If `true` the new rows/columns will be created if necessary. Otherwise, row/column will                        be created according to `minSpareRows/minSpareCols` settings of Handsontable. |



## Members

### highlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L79

:::

_selection.highlight : [Highlight](@/api/highlight.md)_

Visualization layer.



### inProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L47

:::

_selection.inProgress : boolean_

The flag which determines if the selection is in progress.



### selectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L67

:::

_selection.selectedByColumnHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole column was selected using the column header or
the corner header.



### selectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L53

:::

_selection.selectedByCorner : boolean_

The flag indicates that selection was performed by clicking the corner overlay.



### selectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L60

:::

_selection.selectedByRowHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole row was selected using the row header or
the corner header.



### selectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L73

:::

_selection.selectedRange : [SelectionRange](@/api/selectionRange.md)_

Selection data layer (handle visual coordinates).



### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L35

:::

_selection.settings : GridSettings_

Handsontable settings instance.



### tableProps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L41

:::

_selection.tableProps : object_

An additional object with dynamically defined properties which describes table state.



### transformation
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L95

:::

_selection.transformation : [Transformation](@/api/transformation.md)_

The module for modifying coordinates.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L52

:::

_selection.add(coords) ⇒ [Selection](@/api/selection.md)_

Adds a cell coords to the selection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates to add. |



### addClassAtCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L127

:::

_selection.addClassAtCoords(wotInstance, sourceRow, sourceColumn, className, [markIntersections]) ⇒ [Selection](@/api/selection.md)_

Adds class name to cell element at given coords.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| wotInstance | `Walkontable` |  | Walkontable instance. |
| sourceRow | `number` |  | Cell row coord. |
| sourceColumn | `number` |  | Cell column coord. |
| className | `string` |  | Class name. |
| [markIntersections] | `boolean` | <code>false</code> | `optional` If `true`, linear className generator will be used to add CSS classes                                            in a continuous way. |



### begin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L133

:::

_selection.begin()_

Indicate that selection process began. It sets internaly `.inProgress` property to `true`.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L93

:::

_selection.clear() ⇒ [Selection](@/api/selection.md)_

Clears selection.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L503

:::

_selection.clear()_

Clear the selection by resetting the collected ranges and highlights.



### deselect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L512

:::

_selection.deselect()_

Deselects all selected cells.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L348

:::

_selection.destroy()_

Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L187

:::

_selection.draw(wotInstance)_


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### finish
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L140

:::

_selection.finish()_

Indicate that selection process finished. It sets internaly `.inProgress` property to `false`.



### getBorder
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L29

:::

_selection.getBorder(wotInstance) ⇒ [Border](@/api/border.md)_

Each Walkontable clone requires it's own border for every selection. This method creates and returns selection
borders per instance.


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### getCorners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L104

:::

_selection.getCorners() ⇒ Array_

Returns the top left (TL) and bottom right (BR) selection coordinates.


**Returns**: `Array` - Returns array of coordinates for example `[1, 1, 5, 5]`.  

### getLayerLevel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L386

:::

_selection.getLayerLevel() ⇒ number_

Returns currently used layer level.


**Returns**: `number` - Returns layer level starting from 0. If no selection was added to the table -1 is returned.  

### getSelectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L126

:::

_selection.getSelectedRange() ⇒ [SelectionRange](@/api/selectionRange.md)_

Get data layer for current selection.



### inInSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L472

:::

_selection.inInSelection(coords) ⇒ boolean_

Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
the coords object is within selection range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### isAreaCornerVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L492

:::

_selection.isAreaCornerVisible(layerLevel) ⇒ boolean_

Returns `true` if the area corner should be visible.


| Param | Type | Description |
| --- | --- | --- |
| layerLevel | `number` | The layer level. |


**Returns**: `boolean` - `true` if the corner element has to be visible, `false` otherwise.  

### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L42

:::

_selection.isEmpty() ⇒ boolean_

Checks if selection is empty.



### isEntireColumnSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L441

:::

_selection.isEntireColumnSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire columns (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isEntireRowSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L418

:::

_selection.isEntireRowSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire rows (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isInProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L150

:::

_selection.isInProgress() ⇒ boolean_

Check if the process of selecting the cell/cells is in progress.



### isMultiple
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L351

:::

_selection.isMultiple() ⇒ boolean_

Returns information if we have a multiselection. This method check multiselection only on the latest layer of
the selection.



### isSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L395

:::

_selection.isSelected() ⇒ boolean_

Returns `true` if currently there is a selection on the screen, `false` otherwise.



### isSelectedByAnyHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L450

:::

_selection.isSelectedByAnyHeader() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the row or column header on any layer level.



### isSelectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L430

:::

_selection.isSelectedByColumnHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the column header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any column header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isSelectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L461

:::

_selection.isSelectedByCorner() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the left-top corner overlay.



### isSelectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L407

:::

_selection.isSelectedByRowHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the row header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any row header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### linearClassNameGenerator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L157

:::

_selection.linearClassNameGenerator(baseClassName, layerLevelOwner) ⇒ function_

Generate helper for calculating classNames based on previously added base className.
The generated className is always generated as a continuation of the previous className. For example, when
the currently checked element has 'area-2' className the generated new className will be 'area-3'. When
the element doesn't have any classNames than the base className will be returned ('area');.


| Param | Type | Description |
| --- | --- | --- |
| baseClassName | `string` | Base className to be used. |
| layerLevelOwner | `number` | Layer level which the instance of the Selection belongs to. |



### refresh
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L658

:::

_selection.refresh()_

Rewrite the rendered state of the selection as visual selection may have a new representation in the DOM.



### replace
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L71

:::

_selection.replace(oldCoords, newCoords) ⇒ boolean_

If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
information about success.


| Param | Type | Description |
| --- | --- | --- |
| oldCoords | `CellCoords` | An old cell coordinates to replace. |
| newCoords | `CellCoords` | The new cell coordinates. |



### selectAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L530

:::

_selection.selectAll([includeRowHeaders], [includeColumnHeaders])_

Select all cells.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the row headers, `false` otherwise. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the column headers, `false` otherwise. |



### selectCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L558

:::

_selection.selectCells(selectionRanges) ⇒ boolean_

Make multiple, non-contiguous selection specified by `row` and `column` values or a range of cells
finishing at `endRow`, `endColumn`. The method supports two input formats, first as an array of arrays such
as `[[rowStart, columnStart, rowEnd, columnEnd]]` and second format as an array of CellRange objects.
If the passed ranges have another format the exception will be thrown.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | The coordinates which define what the cells should be selected. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L614

:::

_selection.selectColumns(startColumn, [endColumn], [headerLevel]) ⇒ boolean_

Select column specified by `startColumn` visual index or column property or a range of columns finishing at
`endColumn`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` <br/> `string` |  | Visual column index or column property from which the selection starts. |
| [endColumn] | `number` <br/> `string` |  | `optional` Visual column index or column property from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A row header index that triggers the column selection. The value can                                  take -1 to -N, where -1 means the header closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L641

:::

_selection.selectRows(startRow, [endRow], [headerLevel]) ⇒ boolean_

Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | Visual row index from which the selection starts. |
| [endRow] | `number` |  | `optional` Visual row index from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A column header index that triggers the row selection.                                  The value can take -1 to -N, where -1 means the header                                  closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### setRangeEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L214

:::

_selection.setRangeEnd(coords)_

Ends selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |



### setRangeStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L164

:::

_selection.setRangeStart(coords, [multipleSelection], [fragment])_

Starts selection range on given coordinate object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `CellCoords` |  | Visual coords. |
| [multipleSelection] | `boolean` |  | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |
| [fragment] | `boolean` | <code>false</code> | `optional` If `true`, the selection will be treated as a partial selection where the                                   `setRangeEnd` method won't be called on every `setRangeStart` call. |



### setRangeStartOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L205

:::

_selection.setRangeStartOnly(coords, [multipleSelection])_

Starts selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |
| [multipleSelection] | `boolean` | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |



### transformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L377

:::

_selection.transformEnd(rowDelta, colDelta)_

Sets selection end cell relative to the current selection end cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |



### transformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L367

:::

_selection.transformStart(rowDelta, colDelta, force)_

Selects cell relative to the current cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |
| force | `boolean` | If `true` the new rows/columns will be created if necessary. Otherwise, row/column will                        be created according to `minSpareRows/minSpareCols` settings of Handsontable. |



## Members

### highlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L79

:::

_selection.highlight : [Highlight](@/api/highlight.md)_

Visualization layer.



### inProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L47

:::

_selection.inProgress : boolean_

The flag which determines if the selection is in progress.



### selectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L67

:::

_selection.selectedByColumnHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole column was selected using the column header or
the corner header.



### selectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L53

:::

_selection.selectedByCorner : boolean_

The flag indicates that selection was performed by clicking the corner overlay.



### selectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L60

:::

_selection.selectedByRowHeader : Set&lt;number&gt;_

The collection of the selection layer levels where the whole row was selected using the row header or
the corner header.



### selectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L73

:::

_selection.selectedRange : [SelectionRange](@/api/selectionRange.md)_

Selection data layer (handle visual coordinates).



### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L35

:::

_selection.settings : GridSettings_

Handsontable settings instance.



### tableProps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L41

:::

_selection.tableProps : object_

An additional object with dynamically defined properties which describes table state.



### transformation
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L95

:::

_selection.transformation : [Transformation](@/api/transformation.md)_

The module for modifying coordinates.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L52

:::

_selection.add(coords) ⇒ [Selection](@/api/selection.md)_

Adds a cell coords to the selection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates to add. |



### addClassAtCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L127

:::

_selection.addClassAtCoords(wotInstance, sourceRow, sourceColumn, className, [markIntersections]) ⇒ [Selection](@/api/selection.md)_

Adds class name to cell element at given coords.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| wotInstance | `Walkontable` |  | Walkontable instance. |
| sourceRow | `number` |  | Cell row coord. |
| sourceColumn | `number` |  | Cell column coord. |
| className | `string` |  | Class name. |
| [markIntersections] | `boolean` | <code>false</code> | `optional` If `true`, linear className generator will be used to add CSS classes                                            in a continuous way. |



### begin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L133

:::

_selection.begin()_

Indicate that selection process began. It sets internaly `.inProgress` property to `true`.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L93

:::

_selection.clear() ⇒ [Selection](@/api/selection.md)_

Clears selection.



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L503

:::

_selection.clear()_

Clear the selection by resetting the collected ranges and highlights.



### deselect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L512

:::

_selection.deselect()_

Deselects all selected cells.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L348

:::

_selection.destroy()_

Cleans up all the DOM state related to a Selection instance. Call this prior to deleting a Selection instance.



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L187

:::

_selection.draw(wotInstance)_


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### finish
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L140

:::

_selection.finish()_

Indicate that selection process finished. It sets internaly `.inProgress` property to `false`.



### getBorder
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L29

:::

_selection.getBorder(wotInstance) ⇒ [Border](@/api/border.md)_

Each Walkontable clone requires it's own border for every selection. This method creates and returns selection
borders per instance.


| Param | Type | Description |
| --- | --- | --- |
| wotInstance | `Walkontable` | The Walkontable instance. |



### getCorners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L104

:::

_selection.getCorners() ⇒ Array_

Returns the top left (TL) and bottom right (BR) selection coordinates.


**Returns**: `Array` - Returns array of coordinates for example `[1, 1, 5, 5]`.  

### getLayerLevel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L386

:::

_selection.getLayerLevel() ⇒ number_

Returns currently used layer level.


**Returns**: `number` - Returns layer level starting from 0. If no selection was added to the table -1 is returned.  

### getSelectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L126

:::

_selection.getSelectedRange() ⇒ [SelectionRange](@/api/selectionRange.md)_

Get data layer for current selection.



### inInSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L472

:::

_selection.inInSelection(coords) ⇒ boolean_

Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
the coords object is within selection range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### isAreaCornerVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L492

:::

_selection.isAreaCornerVisible(layerLevel) ⇒ boolean_

Returns `true` if the area corner should be visible.


| Param | Type | Description |
| --- | --- | --- |
| layerLevel | `number` | The layer level. |


**Returns**: `boolean` - `true` if the corner element has to be visible, `false` otherwise.  

### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L42

:::

_selection.isEmpty() ⇒ boolean_

Checks if selection is empty.



### isEntireColumnSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L441

:::

_selection.isEntireColumnSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire columns (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isEntireRowSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L418

:::

_selection.isEntireRowSelected([layerLevel]) ⇒ boolean_

Returns `true` if the selection consists of entire rows (including their headers). If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isInProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L150

:::

_selection.isInProgress() ⇒ boolean_

Check if the process of selecting the cell/cells is in progress.



### isMultiple
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L351

:::

_selection.isMultiple() ⇒ boolean_

Returns information if we have a multiselection. This method check multiselection only on the latest layer of
the selection.



### isSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L395

:::

_selection.isSelected() ⇒ boolean_

Returns `true` if currently there is a selection on the screen, `false` otherwise.



### isSelectedByAnyHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L450

:::

_selection.isSelectedByAnyHeader() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the row or column header on any layer level.



### isSelectedByColumnHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L430

:::

_selection.isSelectedByColumnHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the column header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any column header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### isSelectedByCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L461

:::

_selection.isSelectedByCorner() ⇒ boolean_

Returns `true` if the selection was applied by clicking on the left-top corner overlay.



### isSelectedByRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L407

:::

_selection.isSelectedByRowHeader([layerLevel]) ⇒ boolean_

Returns `true` if the selection was applied by clicking to the row header. If the `layerLevel`
argument is passed then only that layer will be checked. Otherwise, it checks if any row header
was clicked on any selection layer level.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [layerLevel] | `number` | <code>this.getLayerLevel()</code> | `optional` Selection layer level to check. |



### linearClassNameGenerator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L157

:::

_selection.linearClassNameGenerator(baseClassName, layerLevelOwner) ⇒ function_

Generate helper for calculating classNames based on previously added base className.
The generated className is always generated as a continuation of the previous className. For example, when
the currently checked element has 'area-2' className the generated new className will be 'area-3'. When
the element doesn't have any classNames than the base className will be returned ('area');.


| Param | Type | Description |
| --- | --- | --- |
| baseClassName | `string` | Base className to be used. |
| layerLevelOwner | `number` | Layer level which the instance of the Selection belongs to. |



### refresh
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L658

:::

_selection.refresh()_

Rewrite the rendered state of the selection as visual selection may have a new representation in the DOM.



### replace
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/selection.js#L71

:::

_selection.replace(oldCoords, newCoords) ⇒ boolean_

If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
information about success.


| Param | Type | Description |
| --- | --- | --- |
| oldCoords | `CellCoords` | An old cell coordinates to replace. |
| newCoords | `CellCoords` | The new cell coordinates. |



### selectAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L530

:::

_selection.selectAll([includeRowHeaders], [includeColumnHeaders])_

Select all cells.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the row headers, `false` otherwise. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the column headers, `false` otherwise. |



### selectCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L558

:::

_selection.selectCells(selectionRanges) ⇒ boolean_

Make multiple, non-contiguous selection specified by `row` and `column` values or a range of cells
finishing at `endRow`, `endColumn`. The method supports two input formats, first as an array of arrays such
as `[[rowStart, columnStart, rowEnd, columnEnd]]` and second format as an array of CellRange objects.
If the passed ranges have another format the exception will be thrown.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | The coordinates which define what the cells should be selected. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L614

:::

_selection.selectColumns(startColumn, [endColumn], [headerLevel]) ⇒ boolean_

Select column specified by `startColumn` visual index or column property or a range of columns finishing at
`endColumn`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` <br/> `string` |  | Visual column index or column property from which the selection starts. |
| [endColumn] | `number` <br/> `string` |  | `optional` Visual column index or column property from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A row header index that triggers the column selection. The value can                                  take -1 to -N, where -1 means the header closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### selectRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L641

:::

_selection.selectRows(startRow, [endRow], [headerLevel]) ⇒ boolean_

Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | Visual row index from which the selection starts. |
| [endRow] | `number` |  | `optional` Visual row index from to the selection finishes. |
| [headerLevel] | `number` | <code>-1</code> | `optional` A column header index that triggers the row selection.                                  The value can take -1 to -N, where -1 means the header                                  closest to the cells. |


**Returns**: `boolean` - Returns `true` if selection was successful, `false` otherwise.  

### setRangeEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L214

:::

_selection.setRangeEnd(coords)_

Ends selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |



### setRangeStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L164

:::

_selection.setRangeStart(coords, [multipleSelection], [fragment])_

Starts selection range on given coordinate object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `CellCoords` |  | Visual coords. |
| [multipleSelection] | `boolean` |  | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |
| [fragment] | `boolean` | <code>false</code> | `optional` If `true`, the selection will be treated as a partial selection where the                                   `setRangeEnd` method won't be called on every `setRangeStart` call. |



### setRangeStartOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L205

:::

_selection.setRangeStartOnly(coords, [multipleSelection])_

Starts selection range on given coordinate object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords. |
| [multipleSelection] | `boolean` | `optional` If `true`, selection will be worked in 'multiple' mode. This option works                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined                                      the default trigger will be used (isPressedCtrlKey() helper). |



### transformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L377

:::

_selection.transformEnd(rowDelta, colDelta)_

Sets selection end cell relative to the current selection end cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |



### transformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/selection.js#L367

:::

_selection.transformStart(rowDelta, colDelta, force)_

Selects cell relative to the current cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |
| force | `boolean` | If `true` the new rows/columns will be created if necessary. Otherwise, row/column will                        be created according to `minSpareRows/minSpareCols` settings of Handsontable. |



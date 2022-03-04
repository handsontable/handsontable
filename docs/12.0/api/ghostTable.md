---
title: GhostTable
metaTitle: GhostTable - API Reference - Handsontable Documentation
permalink: /12.0/api/ghost-table
canonicalUrl: /api/ghost-table
hotPlugin: false
editLink: false
---

# GhostTable

[[toc]]
## Members

### columns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L38

:::

_ghostTable.columns : Array_

Added columns collection.



### container
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L20

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L14

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L26

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L32

:::

_ghostTable.rows : Array_

Added rows collection.



### samples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L45

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L52

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  

## Methods

### addColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L116

:::

_ghostTable.addColumn(column, samples)_

Add column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Column index. |
| samples | `Map` | A map with sampled table values. |



### addColumnHeadersRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L88

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L63

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| samples | `Map` | Samples Map object. |



### appendColumnHeadersRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L280

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L350

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L319

:::

_ghostTable.createCol(column) ⇒ DocumentFragment_

Create table column elements.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Column index. |


**Returns**: `DocumentFragment` - Returns created column table column elements.  

### createColElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L391

:::

_ghostTable.createColElement(column) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Column index. |



### createColGroupsCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L222

:::

_ghostTable.createColGroupsCol() ⇒ DocumentFragment_

Create colgroup col elements.



### createContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L442

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L244

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L405

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L146

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L208

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L198

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L161

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L367

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L468

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L459

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L377

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L185

:::

_ghostTable.setSetting(name, value)_

Set a single setting of the Ghost Table.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Setting name. |
| value | `*` | Setting value. |



### setSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/utils/ghostTable.js#L175

:::

_ghostTable.setSettings(settings)_

Set the Ghost Table settings to the provided object.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | New Ghost Table Settings. |



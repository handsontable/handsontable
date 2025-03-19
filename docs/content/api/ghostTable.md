---
title: GhostTable
metaTitle: GhostTable - JavaScript Data Grid | Handsontable
permalink: /api/ghost-table
canonicalUrl: /api/ghost-table
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 1i74gjp4
description: Options, members, and methods of Handsontable's GhostTable API.
react:
  id: bbq83v9b
  metaTitle: GhostTable - React Data Grid | Handsontable
---

# GhostTable

[[toc]]
## Members

### columns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L37

:::

_ghostTable.columns : Array_

Added columns collection.



### container
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L19

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L13

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L25

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L31

:::

_ghostTable.rows : Array_

Added rows collection.



### samples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L44

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L51

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  

## Methods

### addColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L118

:::

_ghostTable.addColumn(column, samples)_

Add column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| samples | `Map` | A map with sampled table values. |



### addColumnHeadersRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L90

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L65

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| samples | `Map` | Samples Map object. |



### appendColumnHeadersRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L289

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L355

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L328

:::

_ghostTable.createCol(column) ⇒ DocumentFragment_

Create table column elements.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `DocumentFragment` - Returns created column table column elements.  

### createColElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L397

:::

_ghostTable.createColElement(column, row) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| row | `number` | Visual row index. |



### createColGroupsCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L235

:::

_ghostTable.createColGroupsCol(row) ⇒ DocumentFragment_

Create colgroup col elements.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### createContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L461

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L257

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L424

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L148

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L220

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L210

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L168

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L372

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L487

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L478

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L382

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L197

:::

_ghostTable.setSetting(name, value)_

Set a single setting of the Ghost Table.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Setting name. |
| value | `*` | Setting value. |



### setSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e910d1b80af460f098c184c630a1c4108d0d00b3/handsontable/src/utils/ghostTable.js#L187

:::

_ghostTable.setSettings(settings)_

Set the Ghost Table settings to the provided object.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | New Ghost Table Settings. |



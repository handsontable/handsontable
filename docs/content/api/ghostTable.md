---
title: GhostTable
metaTitle: GhostTable | Handsontable DataGrid for JavaScript
permalink: /api/ghost-table
canonicalUrl: /api/ghost-table
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 1i74gjp4
description: Options, members, and methods of Handsontable DataGrid's GhostTable API.
react:
  id: bbq83v9b
  metaTitle: GhostTable | Handsontable DataGrid for React
angular:
  id: r6k3t1ab
  metaTitle: GhostTable | Handsontable DataGrid for Angular
---

[[toc]]

## Description

Initializes the ghost table utility with a reference to the Handsontable instance used for DOM context.


## Members

### columns

::: ask-about-api columns|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L532

:::

_ghostTable.columns : Array_

Added columns collection.



### container

::: ask-about-api container|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L517

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot

::: ask-about-api hot|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L512

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected

::: ask-about-api injected|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L522

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows

::: ask-about-api rows|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L527

:::

_ghostTable.rows : Array_

Added rows collection.



### samples

::: ask-about-api samples|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L538

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings

::: ask-about-api settings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L544

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  


### table

::: ask-about-api table|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L551

:::

_ghostTable.table : unknown_

Table element.


## Methods

### addColumn

::: ask-about-api addColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L144

:::

_ghostTable.addColumn(column, samples)_

Add column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| samples | `Map` | A map with sampled table values. |



### addColumnHeadersRow

::: ask-about-api addColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L81

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow

::: ask-about-api addRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L59

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| samples | `Map` | Samples Map object. |



### addRowHeadersColumn

::: ask-about-api addRowHeadersColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L111

:::

_ghostTable.addRowHeadersColumn(samples, [headerLevel], [renderer])_

Add a column consisting of the row headers of the sampled rows.

The mirror image of [GhostTable#addColumnHeadersRow](@/api/ghostTable.md#addcolumnheadersrow): that one measures how tall the
column headers are, this one measures how wide the row headers are. The column is registered
under a negative index (`-1` for the first header level, `-2` for the second, and so on),
matching the convention that the row header sits at column `-1`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| samples | `Map` |  | A map with sampled row header labels, keyed the way                      [SamplesGenerator](@/api/samplesGenerator.md) keys them. Only the row indexes are read - the                      label itself is rendered by the grid's own row header renderers. |
| [headerLevel] | `number` | <code>0</code> | `optional` The row header level, counting from the grid's edge. |
| [renderer] | `function` |  | `optional` The renderer that fills one header cell of that level. Defaults to                              the grid's own first-level row header renderer. |



### appendColumnHeadersRow

::: ask-about-api appendColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L287

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean

::: ask-about-api clean|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L378

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol

::: ask-about-api createCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L326

:::

_ghostTable.createCol(column) ⇒ DocumentFragment_

Create table column elements.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `DocumentFragment` - Returns created column table column elements.  

### createColElement

::: ask-about-api createColElement|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L416

:::

_ghostTable.createColElement(column, row, [sampledColspan]) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| row | `number` | Visual row index. |
| [sampledColspan] | `number` | `optional` The number of columns the sampled value spans, when the cell's own meta cannot say it. A merged block drawn from a cell it covers (its first row or column is hidden) is sampled on that cell, which carries no `colspan` of its own. |



### createColGroupsCol

::: ask-about-api createColGroupsCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L241

:::

_ghostTable.createColGroupsCol(row) ⇒ DocumentFragment_

Create colgroup col elements.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### createContainer

::: ask-about-api createContainer|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L478

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow

::: ask-about-api createRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L258

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createRowHeadersCol

::: ask-about-api createRowHeadersCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L354

:::

_ghostTable.createRowHeadersCol([renderer]) ⇒ DocumentFragment_

Create the table rows holding the row headers to measure.

The row header counterpart of [GhostTable#createCol](@/api/ghostTable.md#createcol), and shaped like it: one `<tr>` per
sampled row, so the column sizes itself to the widest of them.


| Param | Type | Description |
| --- | --- | --- |
| [renderer] | `function` | `optional` The renderer that fills one header cell. Defaults to the grid's                              own first-level row header renderer. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable

::: ask-about-api createTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L438

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights

::: ask-about-api getHeights|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L170

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting

::: ask-about-api getSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L230

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings

::: ask-about-api getSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L222

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths

::: ask-about-api getWidths|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L186

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable

::: ask-about-api injectTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L392

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal

::: ask-about-api isHorizontal|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L501

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical

::: ask-about-api isVertical|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L494

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable

::: ask-about-api removeTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L400

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting

::: ask-about-api setSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L210

:::

_ghostTable.setSetting(name, value)_

Set a single setting of the Ghost Table.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Setting name. |
| value | `*` | Setting value. |



### setSettings

::: ask-about-api setSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L202

:::

_ghostTable.setSettings(settings)_

Set the Ghost Table settings to the provided object.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | New Ghost Table Settings. |



## Description

Initializes the ghost table utility with a reference to the Handsontable instance used for DOM context.


## Members

### columns

::: ask-about-api columns|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L532

:::

_ghostTable.columns : Array_

Added columns collection.



### container

::: ask-about-api container|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L517

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot

::: ask-about-api hot|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L512

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected

::: ask-about-api injected|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L522

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows

::: ask-about-api rows|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L527

:::

_ghostTable.rows : Array_

Added rows collection.



### samples

::: ask-about-api samples|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L538

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings

::: ask-about-api settings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L544

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  


### table

::: ask-about-api table|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L551

:::

_ghostTable.table : unknown_

Table element.


## Methods

### addColumn

::: ask-about-api addColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L144

:::

_ghostTable.addColumn(column, samples)_

Add column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| samples | `Map` | A map with sampled table values. |



### addColumnHeadersRow

::: ask-about-api addColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L81

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow

::: ask-about-api addRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L59

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| samples | `Map` | Samples Map object. |



### addRowHeadersColumn

::: ask-about-api addRowHeadersColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L111

:::

_ghostTable.addRowHeadersColumn(samples, [headerLevel], [renderer])_

Add a column consisting of the row headers of the sampled rows.

The mirror image of [GhostTable#addColumnHeadersRow](@/api/ghostTable.md#addcolumnheadersrow): that one measures how tall the
column headers are, this one measures how wide the row headers are. The column is registered
under a negative index (`-1` for the first header level, `-2` for the second, and so on),
matching the convention that the row header sits at column `-1`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| samples | `Map` |  | A map with sampled row header labels, keyed the way                      [SamplesGenerator](@/api/samplesGenerator.md) keys them. Only the row indexes are read - the                      label itself is rendered by the grid's own row header renderers. |
| [headerLevel] | `number` | <code>0</code> | `optional` The row header level, counting from the grid's edge. |
| [renderer] | `function` |  | `optional` The renderer that fills one header cell of that level. Defaults to                              the grid's own first-level row header renderer. |



### appendColumnHeadersRow

::: ask-about-api appendColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L287

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean

::: ask-about-api clean|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L378

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol

::: ask-about-api createCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L326

:::

_ghostTable.createCol(column) ⇒ DocumentFragment_

Create table column elements.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `DocumentFragment` - Returns created column table column elements.  

### createColElement

::: ask-about-api createColElement|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L416

:::

_ghostTable.createColElement(column, row, [sampledColspan]) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| row | `number` | Visual row index. |
| [sampledColspan] | `number` | `optional` The number of columns the sampled value spans, when the cell's own meta cannot say it. A merged block drawn from a cell it covers (its first row or column is hidden) is sampled on that cell, which carries no `colspan` of its own. |



### createColGroupsCol

::: ask-about-api createColGroupsCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L241

:::

_ghostTable.createColGroupsCol(row) ⇒ DocumentFragment_

Create colgroup col elements.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### createContainer

::: ask-about-api createContainer|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L478

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow

::: ask-about-api createRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L258

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createRowHeadersCol

::: ask-about-api createRowHeadersCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L354

:::

_ghostTable.createRowHeadersCol([renderer]) ⇒ DocumentFragment_

Create the table rows holding the row headers to measure.

The row header counterpart of [GhostTable#createCol](@/api/ghostTable.md#createcol), and shaped like it: one `<tr>` per
sampled row, so the column sizes itself to the widest of them.


| Param | Type | Description |
| --- | --- | --- |
| [renderer] | `function` | `optional` The renderer that fills one header cell. Defaults to the grid's                              own first-level row header renderer. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable

::: ask-about-api createTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L438

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights

::: ask-about-api getHeights|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L170

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting

::: ask-about-api getSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L230

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings

::: ask-about-api getSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L222

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths

::: ask-about-api getWidths|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L186

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable

::: ask-about-api injectTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L392

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal

::: ask-about-api isHorizontal|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L501

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical

::: ask-about-api isVertical|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L494

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable

::: ask-about-api removeTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L400

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting

::: ask-about-api setSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L210

:::

_ghostTable.setSetting(name, value)_

Set a single setting of the Ghost Table.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Setting name. |
| value | `*` | Setting value. |



### setSettings

::: ask-about-api setSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/ghostTable.ts#L202

:::

_ghostTable.setSettings(settings)_

Set the Ghost Table settings to the provided object.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | New Ghost Table Settings. |



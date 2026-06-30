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
angular:
  id: r6k3t1ab
  metaTitle: GhostTable - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the ghost table utility with a reference to the Handsontable instance used for DOM context.


## Members

### columns

::: ask-about-api columns|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L413

:::

_ghostTable.columns : Array_

Added columns collection.



### container

::: ask-about-api container|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L398

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot

::: ask-about-api hot|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L393

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected

::: ask-about-api injected|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L403

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows

::: ask-about-api rows|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L408

:::

_ghostTable.rows : Array_

Added rows collection.



### samples

::: ask-about-api samples|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L419

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings

::: ask-about-api settings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L425

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  


### table

::: ask-about-api table|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L432

:::

_ghostTable.table : unknown_

Table element.


## Methods

### addColumn

::: ask-about-api addColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L65

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L44

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow

::: ask-about-api addRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L22

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| samples | `Map` | Samples Map object. |



### appendColumnHeadersRow

::: ask-about-api appendColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L207

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean

::: ask-about-api clean|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L265

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol

::: ask-about-api createCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L243

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L300

:::

_ghostTable.createColElement(column, row) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| row | `number` | Visual row index. |



### createColGroupsCol

::: ask-about-api createColGroupsCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L165

:::

_ghostTable.createColGroupsCol(row) ⇒ DocumentFragment_

Create colgroup col elements.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### createContainer

::: ask-about-api createContainer|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L360

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow

::: ask-about-api createRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L182

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable

::: ask-about-api createTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L320

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights

::: ask-about-api getHeights|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L91

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting

::: ask-about-api getSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L154

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings

::: ask-about-api getSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L146

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths

::: ask-about-api getWidths|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L110

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable

::: ask-about-api injectTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L279

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal

::: ask-about-api isHorizontal|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L383

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical

::: ask-about-api isVertical|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L376

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable

::: ask-about-api removeTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L287

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting

::: ask-about-api setSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L134

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L126

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L413

:::

_ghostTable.columns : Array_

Added columns collection.



### container

::: ask-about-api container|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L398

:::

_ghostTable.container : HTMLElement | null_

Container element where every table will be injected.



### hot

::: ask-about-api hot|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L393

:::

_ghostTable.hot : [Core](@/api/core.md)_

Handsontable instance.



### injected

::: ask-about-api injected|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L403

:::

_ghostTable.injected : boolean_

Flag which determine is table was injected to DOM.



### rows

::: ask-about-api rows|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L408

:::

_ghostTable.rows : Array_

Added rows collection.



### samples

::: ask-about-api samples|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L419

:::

_ghostTable.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  


### settings

::: ask-about-api settings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L425

:::

_ghostTable.settings : object_

Ghost table settings.

**Default**: <code>{Object}</code>  


### table

::: ask-about-api table|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L432

:::

_ghostTable.table : unknown_

Table element.


## Methods

### addColumn

::: ask-about-api addColumn|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L65

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L44

:::

_ghostTable.addColumnHeadersRow(samples)_

Add a row consisting of the column headers.


| Param | Type | Description |
| --- | --- | --- |
| samples | `Map` | A map with sampled table values. |



### addRow

::: ask-about-api addRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L22

:::

_ghostTable.addRow(row, samples)_

Add row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| samples | `Map` | Samples Map object. |



### appendColumnHeadersRow

::: ask-about-api appendColumnHeadersRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L207

:::

_ghostTable.appendColumnHeadersRow()_

Creates DOM elements for headers and appends them to the THEAD element of the table.



### clean

::: ask-about-api clean|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L265

:::

_ghostTable.clean()_

Remove table from document and reset internal state.



### createCol

::: ask-about-api createCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L243

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L300

:::

_ghostTable.createColElement(column, row) ⇒ HTMLElement_

Create col element.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| row | `number` | Visual row index. |



### createColGroupsCol

::: ask-about-api createColGroupsCol|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L165

:::

_ghostTable.createColGroupsCol(row) ⇒ DocumentFragment_

Create colgroup col elements.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### createContainer

::: ask-about-api createContainer|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L360

:::

_ghostTable.createContainer(className) ⇒ object_

Create container for tables.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### createRow

::: ask-about-api createRow|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L182

:::

_ghostTable.createRow(row) ⇒ DocumentFragment_

Create table row element.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `DocumentFragment` - Returns created table row elements.  

### createTable

::: ask-about-api createTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L320

:::

_ghostTable.createTable(className) ⇒ object_

Create table element.


| Param | Type | Description |
| --- | --- | --- |
| className | `string` | The CSS classes to add. |



### getHeights

::: ask-about-api getHeights|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L91

:::

_ghostTable.getHeights(callback)_

Get calculated heights.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated row. |



### getSetting

::: ask-about-api getSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L154

:::

_ghostTable.getSetting(name) ⇒ boolean | null_

Get a single Ghost Table setting.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The setting name to get. |



### getSettings

::: ask-about-api getSettings|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L146

:::

_ghostTable.getSettings() ⇒ object | null_

Get the Ghost Table settings.



### getWidths

::: ask-about-api getWidths|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L110

:::

_ghostTable.getWidths(callback)_

Get calculated widths.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which will be fired for each calculated column. |



### injectTable

::: ask-about-api injectTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L279

:::

_ghostTable.injectTable([parent])_

Inject generated table into document.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [parent] | `HTMLElement` | <code>null</code> | `optional` The element to which the ghost table is injected. |



### isHorizontal

::: ask-about-api isHorizontal|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L383

:::

_ghostTable.isHorizontal() ⇒ boolean_

Checks if table is raised horizontally (checking columns).



### isVertical

::: ask-about-api isVertical|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L376

:::

_ghostTable.isVertical() ⇒ boolean_

Checks if table is raised vertically (checking rows).



### removeTable

::: ask-about-api removeTable|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L287

:::

_ghostTable.removeTable()_

Remove table from document.



### setSetting

::: ask-about-api setSetting|GhostTable

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L134

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/ghostTable.ts#L126

:::

_ghostTable.setSettings(settings)_

Set the Ghost Table settings to the provided object.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | New Ghost Table Settings. |



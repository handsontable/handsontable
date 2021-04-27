---
title: HiddenColumns
permalink: /next/api/hidden-columns
canonicalUrl: /api/hidden-columns
editLink: false
---

# HiddenColumns

[[toc]]

## Description

Plugin allows to hide certain columns. The hiding is achieved by not rendering the columns. The plugin not modifies
the source data and do not participate in data transformation (the shape of data returned by `getData*` methods stays intact).

Possible plugin settings:
 * `copyPasteEnabled` as `Boolean` (default `true`)
 * `columns` as `Array`
 * `indicators` as `Boolean` (default `false`).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenColumns: {
    copyPasteEnabled: true,
    indicators: true,
    columns: [1, 2, 5]
  }
});

// access to hiddenColumns plugin instance:
const hiddenColumnsPlugin = hot.getPlugin('hiddenColumns');

// show single column
hiddenColumnsPlugin.showColumn(1);

// show multiple columns
hiddenColumnsPlugin.showColumn(1, 2, 9);

// or as an array
hiddenColumnsPlugin.showColumns([1, 2, 9]);

// hide single column
hiddenColumnsPlugin.hideColumn(1);

// hide multiple columns
hiddenColumnsPlugin.hideColumn(1, 2, 9);

// or as an array
hiddenColumnsPlugin.hideColumns([1, 2, 9]);

// rerender the table to see all changes
hot.render();
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L471

:::

`hiddenColumns.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L151

:::

`hiddenColumns.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L110

:::

`hiddenColumns.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getHiddenColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L263

:::

`hiddenColumns.getHiddenColumns() ⇒ Array<number>`

Returns an array of visual indexes of hidden columns.



### hideColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L254

:::

`hiddenColumns.hideColumn(...column)`

Hides a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### hideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L221

:::

`hiddenColumns.hideColumns(columns)`

Hides the columns provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L103

:::

`hiddenColumns.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HiddenColumns+enablePlugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L275

:::

`hiddenColumns.isHidden(column) ⇒ boolean`

Checks if the provided column is hidden.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L285

:::

`hiddenColumns.isValidConfig(hiddenColumns) ⇒ boolean`

Get if trim config is valid. Check whether all of the provided column indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenColumns | `Array` | List of hidden column indexes. |



### showColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L212

:::

`hiddenColumns.showColumn(...column)`

Shows a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### showColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L164

:::

`hiddenColumns.showColumns(columns)`

Shows the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenColumns/hiddenColumns.js#L141

:::

`hiddenColumns.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



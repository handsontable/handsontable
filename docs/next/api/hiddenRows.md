---
title: HiddenRows
permalink: /next/api/hidden-rows
canonicalUrl: /api/hidden-rows
editLink: false
---

# HiddenRows

[[toc]]

## Description

Plugin allows to hide certain rows. The hiding is achieved by rendering the rows with height set as 0px.
The plugin not modifies the source data and do not participate in data transformation (the shape of data returned
by `getData*` methods stays intact).

Possible plugin settings:
 * `copyPasteEnabled` as `Boolean` (default `true`)
 * `rows` as `Array`
 * `indicators` as `Boolean` (default `false`).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenRows: {
    copyPasteEnabled: true,
    indicators: true,
    rows: [1, 2, 5]
  }
});

// access to hiddenRows plugin instance
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// show single row
hiddenRowsPlugin.showRow(1);

// show multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// hide single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// rerender the table to see all changes
hot.render();
```

## Options

### hiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L2849

:::

`hiddenRows.hiddenRows : boolean | object`

The [HiddenRows](./hidden-rows/) plugin allows hiding of certain rows. You can pass additional configuration with an
object notation. Options that are then available are:
 * `rows` - an array of rows that should be hidden on plugin initialization
 * `indicators` - enables small ui markers to indicate where are hidden columns.

**Default**: <code>undefined</code>  
**Category**: HiddenRows  
**Example**  
```js
// enable row hiding
hiddenRows: true,

// or
hiddenRows: {
  // set rows that are hidden by default
  rows: [5, 10, 15],
  // show where are hidden rows
  indicators: true
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L461

:::

`hiddenRows.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L152

:::

`hiddenRows.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L111

:::

`hiddenRows.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L260

:::

`hiddenRows.getHiddenRows() ⇒ Array<number>`

Returns an array of visual indexes of hidden rows.



### hideRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L251

:::

`hiddenRows.hideRow(...row)`

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L219

:::

`hiddenRows.hideRows(rows)`

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L104

:::

`hiddenRows.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HiddenRows+enablePlugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L272

:::

`hiddenRows.isHidden(row) ⇒ boolean`

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L282

:::

`hiddenRows.isValidConfig(hiddenRows) ⇒ boolean`

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L210

:::

`hiddenRows.showRow(...row)`

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L165

:::

`hiddenRows.showRows(rows)`

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L142

:::

`hiddenRows.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



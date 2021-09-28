---
title: HiddenRows
metaTitle: HiddenRows - Plugin - Handsontable Documentation
permalink: /9.0/api/hidden-rows
canonicalUrl: /api/hidden-rows
editLink: false
---

# HiddenRows

[[toc]]

## Description

Plugin allows to hide certain rows. Hidden rows are not rendered as DOM elements.
The plugin doesn't modify the source data and doesn't participate in data transformation (the shape of data returned
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L2819

:::

_hiddenRows.hiddenRows : boolean | object_

The [HiddenRows](@/api/hiddenRows.md) plugin allows hiding of certain rows. You can pass additional configuration with an
object notation. Options that are then available are:
 * `rows` - an array of rows that should be hidden on plugin initialization
 * `indicators` - enables small ui markers to indicate where are hidden columns.

**Default**: <code>undefined</code>  
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L462

:::

_hiddenRows.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L153

:::

_hiddenRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L112

:::

_hiddenRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L261

:::

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden rows.



### hideRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L252

:::

_hiddenRows.hideRow(...row)_

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L220

:::

_hiddenRows.hideRows(rows)_

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L105

:::

_hiddenRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [HiddenRows#enablePlugin](@/api/hiddenRows.md#enableplugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L273

:::

_hiddenRows.isHidden(row) ⇒ boolean_

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L283

:::

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L211

:::

_hiddenRows.showRow(...row)_

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L166

:::

_hiddenRows.showRows(rows)_

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/hiddenRows/hiddenRows.js#L143

:::

_hiddenRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



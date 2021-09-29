---
title: HiddenRows
metaTitle: HiddenRows - Plugin - Handsontable Documentation
permalink: /10.0/api/hidden-rows
canonicalUrl: /api/hidden-rows
hotPlugin: true
editLink: false
---

# HiddenRows

[[toc]]

## Description

The `HiddenRows` plugin lets you [hide specified rows](@/guides/rows/row-hiding.md).

"Hiding a row" means that the hidden row doesn't get rendered as a DOM element.

The `HiddenRows` plugin doesn't modify the source data,
and doesn't participate in data transformation
(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

You can set the following configuration options:

| Option | Required | Type | Default | Description |
|---|---|---|---|---|
| `rows` | No | Array | - | [Hides specified rows by default](@/guides/rows/row-hiding.md#step-1-specify-rows-hidden-by-default) |
| `indicators` | No | Boolean | `false` | [Shows UI indicators](@/guides/rows/row-hiding.md#step-2-show-ui-indicators) |
| `copyPasteEnabled` | No | Boolean | `true` | [Sets up copy/paste behavior](@/guides/rows/row-hiding.md#step-4-set-up-copy-and-paste-behavior) |

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

// access the `HiddenRows` plugin's instance
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// hide a single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// hide multiple rows as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// unhide a single row
hiddenRowsPlugin.showRow(1);

// unhide multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// unhide multiple rows as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// to see your changes, re-render your Handsontable instance
hot.render();
```

## Options

### hiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2901

:::

_hiddenRows.hiddenRows : boolean | object_

The `hiddenRows` option enables and configures the [HiddenRows](#hiddenrows) plugin.

To enable the `HiddenRows` plugin, set the `hiddenRows` option to `true`.

To enable the `HiddenRows` plugin and configure its settings, set the `hiddenRows` option to an object with the following properties:
 * `rows`: An array of indexes of rows that are hidden on plugin initialization.
 * `copyPasteEnabled`: When set to `true`, takes hidden rows into account when copying or pasting data.
 * `indicators`: When set to `true`, displays UI markers to indicate the presence of hidden rows.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `HiddenRows` plugin
hiddenRows: true,

// or enable `HiddenRows` plugin, and configure its settings
hiddenRows: {
  // set rows that are hidden by default
  rows: [5, 10, 15],
  // take hidden rows into account when copying or pasting
  copyPasteEnabled: true,
  // show where hidden rows are
  indicators: true
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L469

:::

_hiddenRows.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L160

:::

_hiddenRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L119

:::

_hiddenRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L268

:::

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden rows.



### hideRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L259

:::

_hiddenRows.hideRow(...row)_

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L227

:::

_hiddenRows.hideRows(rows)_

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L112

:::

_hiddenRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [HiddenRows#enablePlugin](@/api/hiddenRows.md#enableplugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L280

:::

_hiddenRows.isHidden(row) ⇒ boolean_

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L290

:::

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L218

:::

_hiddenRows.showRow(...row)_

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L173

:::

_hiddenRows.showRows(rows)_

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/hiddenRows/hiddenRows.js#L150

:::

_hiddenRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



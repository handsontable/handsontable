---
title: HiddenRows
metaTitle: HiddenRows - Plugin - Handsontable Documentation
permalink: /api/hidden-rows
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

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/dataMap/metaManager/metaSchema.js#L2286

:::

_hiddenRows.hiddenRows : boolean | object_

The `hiddenRows` option configures the [`HiddenRows`](@/api/hiddenRows.md) plugin.

You can set the `hiddenRows` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the [`HiddenRows`](@/api/hiddenRows.md) plugin                                 |
| `true`    | Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin with the default plugin options  |
| An object | - Enable the [`HiddenRows`](@/api/hiddenRows.md) plugin<br>- Modify the plugin options |

If you set the `hiddenRows` to an object, you can set the following [`HiddenRows`](@/api/hiddenRows.md) plugin options:

| Property           | Possible values     | Description                                                                                                                                       |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rows   `          | An array of indexes | An array of indexes of rows that are hidden at initialization                                                                                     |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden rows into account<br>`false`: when copying or pasting data, don't take hidden rows into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden rows<br>`false`: display UI markers                                                 |

Read more:
- [Plugins: `HiddenRows` &#8594;](@/api/hiddenRows.md)
- [Row hiding &#8594;](@/guides/rows/row-hiding.md)

**Default**: <code>undefined</code>
**Example**
```js
// enable the `HiddenRows` plugin
hiddenRows: true,

// enable `HiddenRows` plugin, and modify the plugin options
hiddenRows: {
  // set rows that are hidden by default
  rows: [5, 10, 15],
  // when copying or pasting data, take hidden rows into account
  copyPasteEnabled: true,
  // show where hidden rows are
  indicators: true
}
```

## Methods

### destroy

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L469

:::

_hiddenRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L160

:::

_hiddenRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L119

:::

_hiddenRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L268

:::

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden rows.



### hideRow

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L259

:::

_hiddenRows.hideRow(...row)_

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L227

:::

_hiddenRows.hideRows(rows)_

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L112

:::

_hiddenRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [HiddenRows#enablePlugin](@/api/hiddenRows.md#enableplugin) method is called.



### isHidden

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L280

:::

_hiddenRows.isHidden(row) ⇒ boolean_

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L290

:::

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L218

:::

_hiddenRows.showRow(...row)_

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L173

:::

_hiddenRows.showRows(rows)_

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/plugins/hiddenRows/hiddenRows.js#L150

:::

_hiddenRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.

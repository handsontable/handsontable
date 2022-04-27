---
title: HiddenColumns
metaTitle: HiddenColumns - Plugin - Handsontable Documentation
permalink: /12.0/api/hidden-columns
canonicalUrl: /api/hidden-columns
hotPlugin: true
editLink: false
---

# HiddenColumns

[[toc]]

## Description

The `HiddenColumns` plugin lets you [hide specified columns](@/guides/columns/column-hiding.md).

"Hiding a column" means that the hidden column doesn't get rendered as a DOM element.

The `HiddenColumns` plugin doesn't modify the source data,
and doesn't participate in data transformation
(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

You can set the following configuration options:

| Option | Required | Type | Default | Description |
|---|---|---|---|---|
| `columns` | No | Array | - | [Hides specified columns by default](@/guides/columns/column-hiding.md#step-1-specify-columns-hidden-by-default) |
| `indicators` | No | Boolean | `false` | [Shows UI indicators](@/guides/columns/column-hiding.md#step-2-show-ui-indicators) |
| `copyPasteEnabled` | No | Boolean | `true` | [Sets up copy/paste behavior](@/guides/columns/column-hiding.md#step-4-set-up-copy-and-paste-behavior) |

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

// access the `HiddenColumns` plugin's instance
const hiddenColumnsPlugin = hot.getPlugin('hiddenColumns');

// hide a single column
hiddenColumnsPlugin.hideColumn(1);

// hide multiple columns
hiddenColumnsPlugin.hideColumn(1, 2, 9);

// hide multiple columns as an array
hiddenColumnsPlugin.hideColumns([1, 2, 9]);

// unhide a single column
hiddenColumnsPlugin.showColumn(1);

// unhide multiple columns
hiddenColumnsPlugin.showColumn(1, 2, 9);

// unhide multiple columns as an array
hiddenColumnsPlugin.showColumns([1, 2, 9]);

// to see your changes, re-render your Handsontable instance
hot.render();
```

## Options

### hiddenColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/dataMap/metaManager/metaSchema.js#L2286

:::

_hiddenColumns.hiddenColumns : boolean | object_

The `hiddenColumns` option configures the [`HiddenColumns`](@/api/hiddenColumns.md) plugin.

You can set the `hiddenColumns` option to one of the following:

| Setting   | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin                                 |
| `true`    | Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin with the default plugin options  |
| An object | - Enable the [`HiddenColumns`](@/api/hiddenColumns.md) plugin<br>- Modify the plugin options |

If you set the `hiddenColumns` to an object, you can set the following [`HiddenColumns`](@/api/hiddenColumns.md) plugin options:

| Property           | Possible values     | Description                                                                                                                                             |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`          | An array of indexes | An array of indexes of columns that are hidden at initialization                                                                                        |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden columns into account<br>`false`: when copying or pasting data, don't take hidden columns into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden columns<br>`false`: display UI markers                                                    |

Read more:
- [Plugins: `HiddenColumns` &#8594;](@/api/hiddenColumns.md)
- [Column hiding &#8594;](@/guides/columns/column-hiding.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `HiddenColumns` plugin
hiddenColumns: true,

// enable `HiddenColumns` plugin, and modify the plugin options
hiddenColumns: {
  // set columns that are hidden by default
  columns: [5, 10, 15],
  // when copying or pasting data, take hidden columns into account
  copyPasteEnabled: true,
  // show where hidden columns are
  indicators: true
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L480

:::

_hiddenColumns.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L160

:::

_hiddenColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L119

:::

_hiddenColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L272

:::

_hiddenColumns.getHiddenColumns() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden columns.



### hideColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L263

:::

_hiddenColumns.hideColumn(...column)_

Hides a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### hideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L230

:::

_hiddenColumns.hideColumns(columns)_

Hides the columns provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L112

:::

_hiddenColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [HiddenColumns#enablePlugin](@/api/hiddenColumns.md#enableplugin) method is called.



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L284

:::

_hiddenColumns.isHidden(column) ⇒ boolean_

Checks if the provided column is hidden.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isValidConfig
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L294

:::

_hiddenColumns.isValidConfig(hiddenColumns) ⇒ boolean_

Get if trim config is valid. Check whether all of the provided column indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenColumns | `Array` | List of hidden column indexes. |



### showColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L221

:::

_hiddenColumns.showColumn(...column)_

Shows a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### showColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L173

:::

_hiddenColumns.showColumns(columns)_

Shows the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/plugins/hiddenColumns/hiddenColumns.js#L150

:::

_hiddenColumns.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



---
title: HiddenColumns
metaTitle: HiddenColumns - JavaScript Data Grid | Handsontable
permalink: /api/hidden-columns
canonicalUrl: /api/hidden-columns
searchCategory: API Reference
hotPlugin: false
editLink: false
id: v8xg8kot
description: Use the HiddenColumns plugin with its API options and methods to hide specified columns, without modifying your source data.
react:
  id: crwccrpj
  metaTitle: HiddenColumns - React Data Grid | Handsontable
angular:
  id: u9n0w8gh
  metaTitle: HiddenColumns - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### hiddenColumns

::: ask-about-api hiddenColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3301

:::

_hiddenColumns.hiddenColumns : boolean | object_

The `hiddenColumns` option configures the `HiddenColumns` plugin.

You can set the `hiddenColumns` option to one of the following:

| Setting   | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `false`   | Disable the `HiddenColumns` plugin                                 |
| `true`    | Enable the `HiddenColumns` plugin with the default plugin options  |
| An object | - Enable the `HiddenColumns` plugin<br>- Modify the plugin options |

If you set the `hiddenColumns` to an object, you can set the following `HiddenColumns` plugin options:

| Property           | Possible values     | Description                                                                                                                                             |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`          | An array of indexes | An array of indexes of columns that are hidden at initialization                                                                                        |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden columns into account<br>`false`: when copying or pasting data, don't take hidden columns into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden columns<br>`false`: display UI markers                                                    |

Read more:
- [Column hiding](@/guides/columns/column-hiding/column-hiding.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L139

:::

_HiddenColumns.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L129

:::

_HiddenColumns.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L134

:::

_HiddenColumns.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L308

:::

_hiddenColumns.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L186

:::

_hiddenColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L156

:::

_hiddenColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenColumns

::: ask-about-api getHiddenColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L268

:::

_hiddenColumns.getHiddenColumns() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden columns.



### hideColumn

::: ask-about-api hideColumn|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L261

:::

_hiddenColumns.hideColumn(...column)_

Hides a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### hideColumns

::: ask-about-api hideColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L237

:::

_hiddenColumns.hideColumns(columns)_

Hides the columns provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### isEnabled

::: ask-about-api isEnabled|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L151

:::

_hiddenColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [HiddenColumns#enablePlugin](@/api/hiddenColumns.md#enableplugin) method is called.



### isHidden

::: ask-about-api isHidden|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L278

:::

_hiddenColumns.isHidden(column) ⇒ boolean_

Checks if the provided column is hidden.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isValidConfig

::: ask-about-api isValidConfig|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L286

:::

_hiddenColumns.isValidConfig(hiddenColumns) ⇒ boolean_

Get if trim config is valid. Check whether all of the provided column indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenColumns | `Array` | List of hidden column indexes. |



### showColumn

::: ask-about-api showColumn|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L230

:::

_hiddenColumns.showColumn(...column)_

Shows a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### showColumns

::: ask-about-api showColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L195

:::

_hiddenColumns.showColumns(columns)_

Shows the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### updatePlugin

::: ask-about-api updatePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L179

:::

_hiddenColumns.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`hiddenColumns`](@/api/options.md#hiddencolumns)



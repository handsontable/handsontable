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
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L140

:::

_HiddenColumns.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L130

:::

_HiddenColumns.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L135

:::

_HiddenColumns.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L305

:::

_hiddenColumns.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L183

:::

_hiddenColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L157

:::

_hiddenColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenColumns

::: ask-about-api getHiddenColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L265

:::

_hiddenColumns.getHiddenColumns() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden columns.



### hideColumn

::: ask-about-api hideColumn|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L258

:::

_hiddenColumns.hideColumn(...column)_

Hides a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### hideColumns

::: ask-about-api hideColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L234

:::

_hiddenColumns.hideColumns(columns)_

Hides the columns provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### isEnabled

::: ask-about-api isEnabled|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L152

:::

_hiddenColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [HiddenColumns#enablePlugin](@/api/hiddenColumns.md#enableplugin) method is called.



### isHidden

::: ask-about-api isHidden|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L275

:::

_hiddenColumns.isHidden(column) ⇒ boolean_

Checks if the provided column is hidden.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isValidConfig

::: ask-about-api isValidConfig|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L283

:::

_hiddenColumns.isValidConfig(hiddenColumns) ⇒ boolean_

Get if trim config is valid. Check whether all of the provided column indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenColumns | `Array` | List of hidden column indexes. |



### showColumn

::: ask-about-api showColumn|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L227

:::

_hiddenColumns.showColumn(...column)_

Shows a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | `number` | Visual column index. |



### showColumns

::: ask-about-api showColumns|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L192

:::

_hiddenColumns.showColumns(columns)_

Shows the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| columns | `Array<number>` | Array of visual column indexes. |



### updatePlugin

::: ask-about-api updatePlugin|HiddenColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/hiddenColumns/hiddenColumns.ts#L176

:::

_hiddenColumns.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`hiddenColumns`](@/api/options.md#hiddencolumns)



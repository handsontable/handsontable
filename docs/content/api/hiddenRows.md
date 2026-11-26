---
title: HiddenRows
metaTitle: HiddenRows | Handsontable DataGrid for JavaScript
permalink: /api/hidden-rows
canonicalUrl: /api/hidden-rows
searchCategory: API Reference
hotPlugin: false
editLink: false
id: linbgjey
description: Use the HiddenRows plugin with its API options and methods to hide specified rows, without modifying your source data.
react:
  id: ztxn1ekz
  metaTitle: HiddenRows | Handsontable DataGrid for React
angular:
  id: t0m9v7ef
  metaTitle: HiddenRows | Handsontable DataGrid for Angular
---

[[toc]]

See the [Row hiding](@/guides/rows/row-hiding/row-hiding.md) guide for examples and configuration details.

## Options

### hiddenRows
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api hiddenRows|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4550

:::

_hiddenRows.hiddenRows : boolean | object_

The `hiddenRows` option configures the `HiddenRows` plugin.

You can set the `hiddenRows` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the `HiddenRows` plugin                                 |
| `true`    | Enable the `HiddenRows` plugin with the default plugin options  |
| An object | - Enable the `HiddenRows` plugin<br>- Modify the plugin options |

If you set the `hiddenRows` to an object, you can set the following `HiddenRows` plugin options:

| Property           | Possible values     | Description                                                                                                                                       |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rows   `          | An array of indexes | An array of indexes of rows that are hidden at initialization                                                                                     |
| `copyPasteEnabled` | `true` \| `false`   | `true`: when copying or pasting data, take hidden rows into account<br>`false`: when copying or pasting data, don't take hidden rows into account |
| `indicators`       | `true` \| `false`   | `true`: display UI markers to indicate the presence of hidden rows<br>`false`: display UI markers                                                 |

Read more:
- [Row hiding](@/guides/rows/row-hiding/row-hiding.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L170

:::

_HiddenRows.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L165

:::

_HiddenRows.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L154

:::

_HiddenRows.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L159

:::

_HiddenRows.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L324

:::

_hiddenRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L222

:::

_hiddenRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L187

:::

_hiddenRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows

::: ask-about-api getHiddenRows|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L284

:::

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

Returns an array of visual indexes of hidden rows.



### hideRow

::: ask-about-api hideRow|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L277

:::

_hiddenRows.hideRow(...row)_

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows

::: ask-about-api hideRows|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L257

:::

_hiddenRows.hideRows(rows)_

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### isEnabled

::: ask-about-api isEnabled|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L182

:::

_hiddenRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [HiddenRows#enablePlugin](@/api/hiddenRows.md#enableplugin) method is called.



### isHidden

::: ask-about-api isHidden|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L294

:::

_hiddenRows.isHidden(row) ⇒ boolean_

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig

::: ask-about-api isValidConfig|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L302

:::

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow

::: ask-about-api showRow|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L250

:::

_hiddenRows.showRow(...row)_

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows

::: ask-about-api showRows|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L243

:::

_hiddenRows.showRows(rows)_

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of visual row indexes. |



### updatePlugin

::: ask-about-api updatePlugin|HiddenRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/hiddenRows/hiddenRows.ts#L215

:::

_hiddenRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`hiddenRows`](@/api/options.md#hiddenrows)



---
title: TrimRows
metaTitle: TrimRows - JavaScript Data Grid | Handsontable
permalink: /api/trim-rows
canonicalUrl: /api/trim-rows
searchCategory: API Reference
hotPlugin: false
editLink: false
id: ks06q7cq
description: Use the TrimRows plugin with its API options and methods to remove rows from the table view and the DataMap.
react:
  id: ysqsy1ec
  metaTitle: TrimRows - React Data Grid | Handsontable
angular:
  id: h6a3j1gh
  metaTitle: TrimRows - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L73

:::

_TrimRows.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L78

:::

_TrimRows.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L83

:::

_TrimRows.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.


## Methods

### destroy

::: ask-about-api destroy|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L235

:::

_trimRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L126

:::

_trimRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L99

:::

_trimRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getTrimmedRows

::: ask-about-api getTrimmedRows|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L134

:::

_trimRows.getTrimmedRows() ⇒ Array_

Get list of trimmed rows.


**Returns**: `Array` - Physical rows.  

### isEnabled

::: ask-about-api isEnabled|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L94

:::

_trimRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [TrimRows#enablePlugin](@/api/trimRows.md#enableplugin) method is called.
When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.



### isTrimmed

::: ask-about-api isTrimmed|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L216

:::

_trimRows.isTrimmed(physicalRow) ⇒ boolean_

Checks if given row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |



### isValidConfig

::: ask-about-api isValidConfig|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L229

:::

_trimRows.isValidConfig(trimmedRows) ⇒ boolean_

Get if trim config is valid. Check whether all of the provided physical row indexes are within source data.


| Param | Type | Description |
| --- | --- | --- |
| trimmedRows | `Array` | List of physical row indexes. |



### trimRow

::: ask-about-api trimRow|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L167

:::

_trimRows.trimRow(...row)_

Trims the row provided as a physical row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Physical row index. |



### trimRows

::: ask-about-api trimRows|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L143

:::

_trimRows.trimRows(rows)_

Trims the rows provided in the array.

**Emits**: [`Hooks#event:beforeTrimRow`](@/api/hooks.md#beforetrimrow), [`Hooks#event:afterTrimRow`](@/api/hooks.md#aftertrimrow)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of physical row indexes. |



### untrimAll

::: ask-about-api untrimAll|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L221

:::

_trimRows.untrimAll()_

Untrims all trimmed rows.



### untrimRow

::: ask-about-api untrimRow|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L208

:::

_trimRows.untrimRow(...row)_

Untrims the row provided as a physical row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Physical row index. |



### untrimRows

::: ask-about-api untrimRows|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L176

:::

_trimRows.untrimRows(rows)_

Untrims the rows provided in the array.

**Emits**: [`Hooks#event:beforeUntrimRow`](@/api/hooks.md#beforeuntrimrow), [`Hooks#event:afterUntrimRow`](@/api/hooks.md#afteruntrimrow)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Array of physical row indexes. |



### updatePlugin

::: ask-about-api updatePlugin|TrimRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/trimRows/trimRows.ts#L112

:::

_trimRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`trimRows`](@/api/options.md#trimrows)



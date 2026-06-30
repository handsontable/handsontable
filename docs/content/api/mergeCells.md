---
title: MergeCells
metaTitle: MergeCells - JavaScript Data Grid | Handsontable
permalink: /api/merge-cells
canonicalUrl: /api/merge-cells
searchCategory: API Reference
hotPlugin: false
editLink: false
id: cs07c3ly
description: Use the MergeCells plugin with its API options and methods to merge adjacent cells, using the "Ctrl + M" shortcut or the context menu.
react:
  id: 62cv5ecx
  metaTitle: MergeCells - React Data Grid | Handsontable
angular:
  id: a3t6c4st
  metaTitle: MergeCells - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L317

:::

_MergeCells.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L307

:::

_MergeCells.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L312

:::

_MergeCells.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearCollections

::: ask-about-api clearCollections|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L519

:::

_mergeCells.clearCollections()_

Clears the merged cells from the merged cell container.



### disablePlugin

::: ask-about-api disablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L389

:::

_mergeCells.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L335

:::

_mergeCells.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L330

:::

_mergeCells.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MergeCells#enablePlugin](@/api/mergeCells.md#enableplugin) method is called.



### merge

::: ask-about-api merge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L682

:::

_mergeCells.merge(startRow, startColumn, endRow, endColumn)_

Merges the specified range.

**Emits**: [`Hooks#event:beforeMergeCells`](@/api/hooks.md#beforemergecells), [`Hooks#event:afterMergeCells`](@/api/hooks.md#aftermergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### mergeSelection

::: ask-about-api mergeSelection|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L536

:::

_mergeCells.mergeSelection([cellRange])_

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### unmerge

::: ask-about-api unmerge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L696

:::

_mergeCells.unmerge(startRow, startColumn, endRow, endColumn)_

Unmerges the merged cell in the provided range.

**Emits**: [`Hooks#event:beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells), [`Hooks#event:afterUnmergeCells`](@/api/hooks.md#afterunmergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### unmergeSelection

::: ask-about-api unmergeSelection|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L552

:::

_mergeCells.unmergeSelection([cellRange])_

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### updatePlugin

::: ask-about-api updatePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L402

:::

_mergeCells.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
following configuration options:
 - [`mergeCells`](@/api/options.md#mergecells)



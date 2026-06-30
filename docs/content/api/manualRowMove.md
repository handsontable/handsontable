---
title: ManualRowMove
metaTitle: ManualRowMove - JavaScript Data Grid | Handsontable
permalink: /api/manual-row-move
canonicalUrl: /api/manual-row-move
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4b7ubpab
description: Use the ManualRowMove plugin with its API options and methods (e.g., moveRow(), moveRows(), dragRow()), to change the order of rows.
react:
  id: 87xdqwwb
  metaTitle: ManualRowMove - React Data Grid | Handsontable
angular:
  id: y5r4a2op
  metaTitle: ManualRowMove - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L135

:::

_ManualRowMove.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L140

:::

_ManualRowMove.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L145

:::

_ManualRowMove.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.


## Methods

### destroy

::: ask-about-api destroy|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L478

:::

_manualRowMove.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L189

:::

_manualRowMove.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### dragRow

::: ask-about-api dragRow|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L247

:::

_manualRowMove.dragRow(row, dropIndex) ⇒ boolean_

Drag a single row to drop index position.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### dragRows

::: ask-about-api dragRows|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L261

:::

_manualRowMove.dragRows(rows, dropIndex) ⇒ boolean_

Drag multiple rows to drop index position.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### enablePlugin

::: ask-about-api enablePlugin|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L161

:::

_manualRowMove.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L156

:::

_manualRowMove.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualRowMove#enablePlugin](@/api/manualRowMove.md#enableplugin) method is called.
When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.



### isMovePossible

::: ask-about-api isMovePossible|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L273

:::

_manualRowMove.isMovePossible(movedRows, finalIndex) ⇒ boolean_

Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### moveRow

::: ask-about-api moveRow|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L207

:::

_manualRowMove.moveRow(row, finalIndex) ⇒ boolean_

Moves a single row.

To see the outcome, rerender your grid by calling [`render()`](@/api/core.md#render).

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### moveRows

::: ask-about-api moveRows|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L223

:::

_manualRowMove.moveRows(rows, finalIndex) ⇒ boolean_

Moves multiple rows.

To see the outcome, rerender your grid by calling [`render()`](@/api/core.md#render).

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### updatePlugin

::: ask-about-api updatePlugin|ManualRowMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowMove/manualRowMove.ts#L181

:::

_manualRowMove.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualRowMove`](@/api/options.md#manualrowmove)



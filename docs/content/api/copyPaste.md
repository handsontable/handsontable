---
title: CopyPaste
metaTitle: CopyPaste - JavaScript Data Grid | Handsontable
permalink: /api/copy-paste
canonicalUrl: /api/copy-paste
searchCategory: API Reference
hotPlugin: false
editLink: false
id: jtoc0ta4
description: Use the CopyPaste plugin with its API options, members, and methods to enable the copy/paste functionality, through the API, the context menu, and keyboard shortcuts.
react:
  id: g6fi2a6i
  metaTitle: CopyPaste - React Data Grid | Handsontable
angular:
  id: m3f2o0qr
  metaTitle: CopyPaste - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### columnsLimit

::: ask-about-api columnsLimit|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L670

:::

_copyPaste.columnsLimit : number_

The maximum number of columns than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L225

:::

_CopyPaste.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### pasteMode

::: ask-about-api pasteMode|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L683

:::

_copyPaste.pasteMode : string_

When pasting:
- `'overwrite'` - overwrite the currently-selected cells
- `'shift_down'` - move currently-selected cells down
- `'shift_right'` - move currently-selected cells to the right

**Default**: <code>"overwrite"</code>  


### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L207

:::

_CopyPaste.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L220

:::

_CopyPaste.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### rowsLimit

::: ask-about-api rowsLimit|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L675

:::

_copyPaste.rowsLimit : number_

The maximum number of rows than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L212

:::

_CopyPaste.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.



### uiContainer

::: ask-about-api uiContainer|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L687

:::

_copyPaste.uiContainer : HTMLElement_

The UI container for the secondary focusable element.


## Methods

### copy

::: ask-about-api copy|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L304

:::

_copyPaste.copy([copyMode])_

Copies the contents of the selected cells (and/or their related column headers) to the system clipboard.

Takes an optional parameter (`copyMode`) that defines the scope of copying:

| `copyMode` value              | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `'cells-only'` (default)      | Copy the selected cells                                         |
| `'with-column-headers'`       | - Copy the selected cells<br>- Copy the nearest column headers  |
| `'with-column-group-headers'` | - Copy the selected cells<br>- Copy all related columns headers |
| `'column-headers-only'`       | Copy the nearest column headers (without copying cells)         |


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [copyMode] | `string` | <code>"cells-only"</code> | `optional` Copy mode. |



### copyCellsOnly

::: ask-about-api copyCellsOnly|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L311

:::

_copyPaste.copyCellsOnly()_

Copies the contents of the selected cells.



### copyColumnHeadersOnly

::: ask-about-api copyColumnHeadersOnly|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L316

:::

_copyPaste.copyColumnHeadersOnly()_

Copies the contents of column headers that are nearest to the selected cells.



### copyWithAllColumnHeaders

::: ask-about-api copyWithAllColumnHeaders|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L321

:::

_copyPaste.copyWithAllColumnHeaders()_

Copies the contents of the selected cells and all their related column headers.



### copyWithColumnHeaders

::: ask-about-api copyWithColumnHeaders|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L326

:::

_copyPaste.copyWithColumnHeaders()_

Copies the contents of the selected cells and their nearest column headers.



### cut

::: ask-about-api cut|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L331

:::

_copyPaste.cut()_

Cuts the contents of the selected cells to the system clipboard.



### destroy

::: ask-about-api destroy|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L619

:::

_copyPaste.destroy()_

Destroys the `CopyPaste` plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L288

:::

_copyPaste.disablePlugin()_

Disables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L247

:::

_copyPaste.enablePlugin()_

Enables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### getRangedCopyableData

::: ask-about-api getRangedCopyableData|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L340

:::

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Converts the contents of multiple ranges (`ranges`) into a single string.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - A string that will be copied to the clipboard.  

### getRangedData

::: ask-about-api getRangedData|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L349

:::

_copyPaste.getRangedData(ranges, [useSourceData]) ⇒ Array&lt;Array&gt;_

Converts the contents of multiple ranges (`ranges`) into an array of arrays.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` |  | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |
| [useSourceData] | `boolean` | <code>false</code> | `optional` Whether to use the source data instead of the data. This will stringify objects as JSON. |


**Returns**: `Array<Array>` - An array of arrays that will be copied to the clipboard.  

### isEnabled

::: ask-about-api isEnabled|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L242

:::

_copyPaste.isEnabled() ⇒ boolean_

Checks if the [`CopyPaste`](#copypaste) plugin is enabled.

This method gets called by Handsontable's [`beforeInit`](@/api/hooks.md#beforeinit) hook.
If it returns `true`, the [`enablePlugin()`](#enableplugin) method gets called.



### paste

::: ask-about-api paste|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L378

:::

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.

For security reasons, modern browsers don't allow reading from the system clipboard.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | The value to paste, as a raw string. |
| [pastableHtml] | `string` | <code>""</code> | `optional` The value to paste, as HTML. |



### setCopyableText

::: ask-about-api setCopyableText|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L393

:::

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin

::: ask-about-api updatePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L281

:::

_copyPaste.updatePlugin()_

Updates the state of the [`CopyPaste`](#copypaste) plugin.

Gets called when [`updateSettings()`](@/api/core.md#updatesettings)
is invoked with any of the following configuration options:
 - [`copyPaste`](@/api/options.md#copypaste)
 - [`fragmentSelection`](@/api/options.md#fragmentselection)



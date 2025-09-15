---
title: CopyPaste
metaTitle: CopyPaste - JavaScript Data Grid | Handsontable
permalink: /api/copy-paste
canonicalUrl: /api/copy-paste
searchCategory: API Reference
hotPlugin: true
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

# Plugin: CopyPaste

[[toc]]

## Description

Copy, cut, and paste data by using the `CopyPaste` plugin.

Control the `CopyPaste` plugin programmatically through its [API methods](#methods).

The user can access the copy-paste features through:
- The [context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu).
- The [keyboard shortcuts](@/guides/cell-features/clipboard/clipboard.md#related-keyboard-shortcuts).
- The browser's menu bar.

Read more:
- [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)
- [Configuration options: `copyPaste`](@/api/options.md#copypaste)

**Example**  
```js
// enable the plugin with the default configuration
copyPaste: true,

// or, enable the plugin with a custom configuration
copyPaste: {
  columnsLimit: 25,
  rowsLimit: 50,
  pasteMode: 'shift_down',
  copyColumnHeaders: true,
  copyColumnGroupHeaders: true,
  copyColumnHeadersOnly: true,
  uiContainer: document.body,
},
```

## Options

### copyPaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L1305

:::

_copyPaste.copyPaste : object | boolean_

The `copyPaste` option configures the [`CopyPaste`](@/api/copyPaste.md) plugin.

You can set the `copyPaste` option to one of the following:

| Setting           | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)  | Enable the [`CopyPaste`](@/api/copyPaste.md) plugin with the default configuration                                     |
| `false`           | Disable the [`CopyPaste`](@/api/copyPaste.md) plugin                                                                   |
| An object         | - Enable the [`CopyPaste`](@/api/copyPaste.md) plugin<br>- Modify the [`CopyPaste`](@/api/copyPaste.md) plugin options |

##### copyPaste: Additional options

If you set the `copyPaste` option to an object, you can set the following `CopyPaste` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columnsLimit`           | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `rowsLimit`              | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `pasteMode`              | `'overwrite'` \| `'shift_down'` \| `'shift_right'` | When pasting:<br>`'overwrite'`: overwrite the currently-selected cells<br>`'shift_down'`: move the currently-selected cells down<br>`'shift_right'`: move the currently-selected cells to the right |
| `copyColumnHeaders`      | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with their nearest column headers                                                                                                         |
| `copyColumnGroupHeaders` | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with all their related columns headers                                                                                                    |
| `copyColumnHeadersOnly`  | Boolean (default: `false`)                         | `true`: add a context menu option for copying column headers nearest to the selected cells (without copying cells)                                                                    |
| `uiContainer`            | An HTML element                                    | The UI container for the secondary focusable element                                                                                                                                                |

Read more:
- [Plugins: `CopyPaste`](@/api/copyPaste.md)
- [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)

**Default**: <code>true</code>  
**Example**  
```js
// enable the plugin with the default configuration
copyPaste: true // set by default

// disable the plugin
copyPaste: false,

// enable the plugin with a custom configuration
copyPaste: {
  // set a maximum number of columns that can be copied
  columnsLimit: 25,

  // set a maximum number of rows that can be copied
  rowsLimit: 50,

  // set the paste behavior
  pasteMode: 'shift_down',

  // add the option to copy cells along with their nearest column headers
  copyColumnHeaders: true,

  // add the option to copy cells along with all their related columns headers
  copyColumnGroupHeaders: true,

  // add the option to copy just column headers (without copying cells)
  copyColumnHeadersOnly: true,

  // set a UI container
  uiContainer: document.body,
},
```

## Members

### columnsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L113

:::

_copyPaste.columnsLimit : number_

The maximum number of columns than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### pasteMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L130

:::

_copyPaste.pasteMode : string_

When pasting:
- `'overwrite'` - overwrite the currently-selected cells
- `'shift_down'` - move currently-selected cells down
- `'shift_right'` - move currently-selected cells to the right

**Default**: <code>"overwrite"</code>  


### rowsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L120

:::

_copyPaste.rowsLimit : number_

The maximum number of rows than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### uiContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L136

:::

_copyPaste.uiContainer : HTMLElement_

The UI container for the secondary focusable element.


## Methods

### copy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L299

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L309

:::

_copyPaste.copyCellsOnly()_

Copies the contents of the selected cells.



### copyColumnHeadersOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L315

:::

_copyPaste.copyColumnHeadersOnly()_

Copies the contents of column headers that are nearest to the selected cells.



### copyWithAllColumnHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L321

:::

_copyPaste.copyWithAllColumnHeaders()_

Copies the contents of the selected cells and all their related column headers.



### copyWithColumnHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L327

:::

_copyPaste.copyWithColumnHeaders()_

Copies the contents of the selected cells and their nearest column headers.



### cut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L334

:::

_copyPaste.cut()_

Cuts the contents of the selected cells to the system clipboard.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L933

:::

_copyPaste.destroy()_

Destroys the `CopyPaste` plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L281

:::

_copyPaste.disablePlugin()_

Disables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L225

:::

_copyPaste.enablePlugin()_

Enables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### getRangedCopyableData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L346

:::

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Converts the contents of multiple ranges (`ranges`) into a single string.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - A string that will be copied to the clipboard.  

### getRangedData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L357

:::

_copyPaste.getRangedData(ranges, [useSourceData]) ⇒ Array&lt;Array&gt;_

Converts the contents of multiple ranges (`ranges`) into an array of arrays.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` |  | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |
| [useSourceData] | `boolean` | <code>false</code> | `optional` Whether to use the source data instead of the data. This will stringify objects as JSON. |


**Returns**: `Array<Array>` - An array of arrays that will be copied to the clipboard.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L218

:::

_copyPaste.isEnabled() ⇒ boolean_

Checks if the [`CopyPaste`](#copypaste) plugin is enabled.

This method gets called by Handsontable's [`beforeInit`](@/api/hooks.md#beforeinit) hook.
If it returns `true`, the [`enablePlugin()`](#enableplugin) method gets called.



### paste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L398

:::

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.

For security reasons, modern browsers don't allow reading from the system clipboard.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | The value to paste, as a raw string. |
| [pastableHtml] | `string` | <code>""</code> | `optional` The value to paste, as HTML. |



### setCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L418

:::

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/copyPaste/copyPaste.js#L271

:::

_copyPaste.updatePlugin()_

Updates the state of the [`CopyPaste`](#copypaste) plugin.

Gets called when [`updateSettings()`](@/api/core.md#updatesettings)
is invoked with any of the following configuration options:
 - [`copyPaste`](@/api/options.md#copypaste)
 - [`fragmentSelection`](@/api/options.md#fragmentselection)



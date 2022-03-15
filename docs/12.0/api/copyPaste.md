---
title: CopyPaste
metaTitle: CopyPaste - Plugin - Handsontable Documentation
permalink: /12.0/api/copy-paste
canonicalUrl: /api/copy-paste
hotPlugin: true
editLink: false
---

# CopyPaste

[[toc]]

## Description

This plugin enables the copy/paste functionality in the Handsontable. The functionality works for API, Context Menu,
using keyboard shortcuts and menu bar from the browser.
Possible values:
* `true` (to enable default options),
* `false` (to disable completely).

or an object with values:
* `'columnsLimit'` (see [CopyPaste#columnsLimit](@/api/copyPaste.md#columnslimit))
* `'rowsLimit'` (see [CopyPaste#rowsLimit](@/api/copyPaste.md#rowslimit))
* `'pasteMode'` (see [CopyPaste#pasteMode](@/api/copyPaste.md#pastemode))
* `'uiContainer'` (see [CopyPaste#uiContainer](@/api/copyPaste.md#uicontainer)).

See [the copy/paste demo](@/guides/cell-features/clipboard.md) for examples.

**Example**  
```js
// Enables the plugin with default values
copyPaste: true,
// Enables the plugin with custom values
copyPaste: {
  columnsLimit: 25,
  rowsLimit: 50,
  pasteMode: 'shift_down',
  uiContainer: document.body,
},
```

## Options

### copyPaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/dataMap/metaManager/metaSchema.js#L1175

:::

_copyPaste.copyPaste : object | boolean_

The `copyPaste` option configures the [`CopyPaste`](@/api/copyPaste.md) plugin.

You can set the `copyPaste` option to one of the following:

| Setting           | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)  | Enable the [`CopyPaste`](@/api/copyPaste.md) plugin with the default configuration                                     |
| `false`           | Disable the [`CopyPaste`](@/api/copyPaste.md) plugin                                                                   |
| An object         | - Enable the [`CopyPaste`](@/api/copyPaste.md) plugin<br>- Modify the [`CopyPaste`](@/api/copyPaste.md) plugin options |

If you set the `copyPaste` option to an object, you can set the following `CopyPaste` plugin options:

| Option         | Possible settings                                  | Description                                                                                                                                                                             |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columnsLimit` | A number (default: `Infinity`)                       | A maximum number of columns that can be copied                                                                                                                                        |
| `rowsLimit`    | A number (default: `Infinity`)                       | A maximum number of columns that can be copied                                                                                                                                        |
| `pasteMode`    | `'overwrite'` \| `'shift_down'` \| `'shift_right'` | When pasting:<br>`'overwrite'`: overwrite currently-selected cells<br>`'shift_down'`: move currently-selected cells down<br>`'shift_right'`: move currently-selected cells to the right |
| `uiContainer`  | An HTML element                                    | A UI container for the secondary focusable element                                                                                                                                      |

Read more:
- [Plugins: `CopyPaste` &#8594;](@/api/copyPaste.md)

**Default**: <code>true</code>  
**Example**  
```js
// disable the `CopyPaste` plugin
copyPaste: false,

// enable the `CopyPaste` plugin
// and modify the `CopyPaste` plugin options
copyPaste: {
  // set the maximum number of columns that can be copied
  columnsLimit: 25,
  // set the maximum number of rows that can be copied
  rowsLimit: 50,
  // set the paste behavior
  pasteMode: 'shift_down',
  // set the UI container
  uiContainer: document.body,
},
```

## Members

### columnsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L93

:::

_copyPaste.columnsLimit : number_

Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>Infinity</code>  


### pasteMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L117

:::

_copyPaste.pasteMode : string_

Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
* Default value `"overwrite"` will paste clipboard value over current selection.
* When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
* When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.

**Default**: <code>"overwrite"</code>  


### rowsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L124

:::

_copyPaste.rowsLimit : number_

Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>Infinity</code>  


### uiContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L131

:::

_copyPaste.uiContainer : HTMLElement_

UI container for the secondary focusable element.


## Methods

### copy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L209

:::

_copyPaste.copy()_

Copies the selected cell into the clipboard.



### cut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L222

:::

_copyPaste.cut()_

Cuts the selected cell into the clipboard.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L680

:::

_copyPaste.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L198

:::

_copyPaste.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L154

:::

_copyPaste.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getRangedCopyableData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L238

:::

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - Returns string which will be copied into clipboard.  

### getRangedData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L276

:::

_copyPaste.getRangedData(ranges) ⇒ Array&lt;Array&gt;_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |


**Returns**: `Array<Array>` - Returns array of arrays which will be copied into clipboard.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L147

:::

_copyPaste.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [CopyPaste#enablePlugin](@/api/copyPaste.md#enableplugin) method is called.



### paste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L314

:::

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | Value as raw string to paste. |
| [pastableHtml] | `string` | <code>""</code> | `optional` Value as HTML to paste. |



### setCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L335

:::

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/plugins/copyPaste/copyPaste.js#L187

:::

_copyPaste.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



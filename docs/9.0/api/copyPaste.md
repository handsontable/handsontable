---
title: CopyPaste
metaTitle: CopyPaste - Plugin - Handsontable Documentation
permalink: /9.0/api/copy-paste
canonicalUrl: /api/copy-paste
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L1796

:::

_copyPaste.copyPaste : object | boolean_

Disables or enables the copy/paste functionality.

**Default**: <code>true</code>  
**Example**  
```js
// disable copy and paste
copyPaste: false,

// enable copy and paste with custom configuration
copyPaste: {
  columnsLimit: 25,
  rowsLimit: 50,
  pasteMode: 'shift_down',
  uiContainer: document.body,
},
```

## Members

### columnsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L85

:::

_copyPaste.columnsLimit : number_

Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### focusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L98

:::

_copyPaste.focusableElement : [FocusableWrapper](@/api/focusableElement.md)_

Provides focusable element to support IME and copy/paste/cut actions.



### pasteMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L108

:::

_copyPaste.pasteMode : string_

Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
* Default value `"overwrite"` will paste clipboard value over current selection.
* When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
* When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.

**Default**: <code>"overwrite"</code>  


### rowsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L115

:::

_copyPaste.rowsLimit : number_

Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### uiContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L122

:::

_copyPaste.uiContainer : HTMLElement_

UI container for the secondary focusable element.


## Methods

### copy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L200

:::

_copyPaste.copy()_

Copies the selected cell into the clipboard.



### cut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L213

:::

_copyPaste.cut()_

Cuts the selected cell into the clipboard.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L671

:::

_copyPaste.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L189

:::

_copyPaste.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L145

:::

_copyPaste.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getRangedCopyableData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L229

:::

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - Returns string which will be copied into clipboard.  

### getRangedData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L267

:::

_copyPaste.getRangedData(ranges) ⇒ Array&lt;Array&gt;_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |


**Returns**: `Array<Array>` - Returns array of arrays which will be copied into clipboard.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L138

:::

_copyPaste.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [CopyPaste#enablePlugin](@/api/copyPaste.md#enableplugin) method is called.



### paste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L305

:::

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | Value as raw string to paste. |
| [pastableHtml] | `string` | <code>""</code> | `optional` Value as HTML to paste. |



### setCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L326

:::

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/copyPaste/copyPaste.js#L178

:::

_copyPaste.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



---
title: CopyPaste
permalink: /next/api/copy-paste
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
* `'columnsLimit'` (see [columnsLimit](#CopyPaste+columnsLimit))
* `'rowsLimit'` (see [rowsLimit](#CopyPaste+rowsLimit))
* `'pasteMode'` (see [pasteMode](#CopyPaste+pasteMode))
* `'uiContainer'` (see [uiContainer](#CopyPaste+uiContainer)).

See [the copy/paste demo](https://handsontable.com/docs/demo-copy-paste.html) for examples.

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L1798

:::

`copyPaste.copyPaste : object | boolean`

Disables or enables the copy/paste functionality.

**Default**: <code>true</code>  
**Category**: CopyPaste  
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L85

:::

`copyPaste.columnsLimit : number`

Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### focusableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L98

:::

`copyPaste.focusableElement : [FocusableWrapper](./focusable-element/)`

Provides focusable element to support IME and copy/paste/cut actions.



### pasteMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L108

:::

`copyPaste.pasteMode : string`

Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
* Default value `"overwrite"` will paste clipboard value over current selection.
* When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
* When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.

**Default**: <code>&quot;&#x27;overwrite&#x27;&quot;</code>  


### rowsLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L115

:::

`copyPaste.rowsLimit : number`

Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### uiContainer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L122

:::

`copyPaste.uiContainer : HTMLElement`

UI container for the secondary focusable element.


## Methods

### copy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L200

:::

`copyPaste.copy()`

Copies the selected cell into the clipboard.



### cut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L213

:::

`copyPaste.cut()`

Cuts the selected cell into the clipboard.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L671

:::

`copyPaste.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L189

:::

`copyPaste.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L145

:::

`copyPaste.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getRangedCopyableData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L229

:::

`copyPaste.getRangedCopyableData(ranges) ⇒ string`

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - Returns string which will be copied into clipboard.  

### getRangedData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L267

:::

`copyPaste.getRangedData(ranges) ⇒ Array<Array>`

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<object>` | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |


**Returns**: `Array<Array>` - Returns array of arrays which will be copied into clipboard.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L138

:::

`copyPaste.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CopyPaste+enablePlugin) method is called.



### paste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L305

:::

`copyPaste.paste(pastableText, [pastableHtml])`

Simulates the paste action.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | Value as raw string to paste. |
| [pastableHtml] | `string` | <code>&quot;&#x27;&#x27;&quot;</code> | `optional` Value as HTML to paste. |



### setCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L326

:::

`copyPaste.setCopyableText()`

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/copyPaste/copyPaste.js#L178

:::

`copyPaste.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



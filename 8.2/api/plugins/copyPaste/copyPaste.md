---
title: CopyPaste
permalink: /8.2/api/copy-paste
---

# {{ $frontmatter.title }}

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

## Members
### columnsLimit
`copyPaste.columnsLimit : number`

Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### focusableElement
`copyPaste.focusableElement : FocusableWrapper`

Provides focusable element to support IME and copy/paste/cut actions.



### pasteMode
`copyPaste.pasteMode : string`

Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
* Default value `"overwrite"` will paste clipboard value over current selection.
* When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
* When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.

**Default**: <code>&quot;&#x27;overwrite&#x27;&quot;</code>  


### rowsLimit
`copyPaste.rowsLimit : number`

Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### uiContainer
`copyPaste.uiContainer : HTMLElement`

UI container for the secondary focusable element.



### isEnabled
`copyPaste.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CopyPaste+enablePlugin) method is called.



### enablePlugin
`copyPaste.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`copyPaste.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`copyPaste.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### copy
`copyPaste.copy()`

Copies the selected cell into the clipboard.



### cut
`copyPaste.cut()`

Cuts the selected cell into the clipboard.



### getRangedCopyableData
`copyPaste.getRangedCopyableData(ranges) ⇒ string`

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | <code>Array.&lt;object&gt;</code> | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: <code>string</code> - Returns string which will be copied into clipboard.  

### getRangedData
`copyPaste.getRangedData(ranges) ⇒ Array.<Array>`

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | <code>Array.&lt;object&gt;</code> | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |


**Returns**: <code>Array.&lt;Array&gt;</code> - Returns array of arrays which will be copied into clipboard.  

### paste
`copyPaste.paste(pastableText, [pastableHtml])`

Simulates the paste action.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | <code>string</code> |  | Value as raw string to paste. |
| [pastableHtml] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | `optional` Value as HTML to paste. |



### setCopyableText
`copyPaste.setCopyableText()`

Prepares copyable text from the cells selection in the invisible textarea.



### destroy
`copyPaste.destroy()`

Destroys the plugin instance.




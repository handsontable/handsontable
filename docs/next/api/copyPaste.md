---
title: CopyPaste
permalink: /next/api/copy-paste
canonicalUrl: /api/copy-paste
editLink: false
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

## Members:

### columnsLimit

_copyPaste.columnsLimit : number_

Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### focusableElement

_copyPaste.focusableElement : [FocusableWrapper](./focusable-element/)_

Provides focusable element to support IME and copy/paste/cut actions.



### pasteMode

_copyPaste.pasteMode : string_

Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior.
* Default value `"overwrite"` will paste clipboard value over current selection.
* When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
* When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.

**Default**: <code>&quot;&#x27;overwrite&#x27;&quot;</code>  


### rowsLimit

_copyPaste.rowsLimit : number_

Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.

**Default**: <code>1000</code>  


### uiContainer

_copyPaste.uiContainer : HTMLElement_

UI container for the secondary focusable element.


## Methods:

### copy

_copyPaste.copy()_

Copies the selected cell into the clipboard.



### cut

_copyPaste.cut()_

Cuts the selected cell into the clipboard.



### destroy

_copyPaste.destroy()_

Destroys the plugin instance.



### disablePlugin

_copyPaste.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_copyPaste.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getRangedCopyableData

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array.&lt;object&gt;` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - Returns string which will be copied into clipboard.  

### getRangedData

_copyPaste.getRangedData(ranges) ⇒ Array&lt;Array&gt;_

Creates copyable text releated to range objects.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array.&lt;object&gt;` | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |


**Returns**: `Array.&lt;Array&gt;` - Returns array of arrays which will be copied into clipboard.  

### isEnabled

_copyPaste.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CopyPaste+enablePlugin) method is called.



### paste

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | Value as raw string to paste. |
| [pastableHtml] | `string` | <code>&quot;&#x27;&#x27;&quot;</code> | `optional` Value as HTML to paste. |



### setCopyableText

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin

_copyPaste.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



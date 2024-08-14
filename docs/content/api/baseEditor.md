---
title: BaseEditor
metaTitle: BaseEditor - JavaScript Data Grid | Handsontable
permalink: /api/base-editor
canonicalUrl: /api/base-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
id: l025jsly
description: Options, members, and methods of Handsontable's BaseEditor API.
react:
  id: snc3axwd
  metaTitle: BaseEditor - React Data Grid | Handsontable
---

# BaseEditor

[[toc]]
## Members

### BaseEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L104

:::

_baseEditor.[BaseEditor](@/api/baseEditor.md)_



### _closeCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L63

:::

_baseEditor.\_closeCallback : function_

Callback to call after closing editor.



### cellProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L99

:::

_baseEditor.cellProperties : object_

Object containing the cell's properties.



### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L81

:::

_baseEditor.col : number_

Visual column index.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L35

:::

_baseEditor.hot : [Handsontable](@/api/core.md)_

A reference to the source instance of the Handsontable.



### originalValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L93

:::

_baseEditor.originalValue : \*_

Original cell's value.



### prop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L87

:::

_baseEditor.prop : number | string_

Column property name or a column index, if datasource is an array of arrays.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L75

:::

_baseEditor.row : number_

Visual row index.



### state
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L41

:::

_baseEditor.state : string_

Editor's state.



### TD
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L69

:::

_baseEditor.TD : HTMLTableCellElement_

Currently rendered cell's TD element.


## Methods

### beginEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L225

:::

_baseEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L332

:::

_baseEditor.cancelChanges()_

Finishes editing without singout saving value.



### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L151

:::

_baseEditor.close()_

Required method to close editor.



### discardEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L343

:::

_baseEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L372

:::

_baseEditor.enableFullEditMode()_

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L180

:::

_baseEditor.extend() ⇒ function_

Fallback method to provide extendable editors in ES5.



### finishEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L265

:::

_baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getEditedCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L573

:::

_baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null_

Gets HTMLTableCellElement of the edited cell if exist.



### getEditedCellRect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L418

:::

_baseEditor.getEditedCellRect() ⇒ Object | undefined_

Gets the object that provides information about the edited cell size and its position
relative to the table viewport.

The rectangle has six integer properties:
 - `top` The top position relative to the table viewport
 - `start` The left (or right in RTL) position relative to the table viewport
 - `width` The cell's current width;
 - `maxWidth` The maximum cell's width after which the editor goes out of the table viewport
 - `height` The cell's current height;
 - `maxHeight` The maximum cell's height after which the editor goes out of the table viewport



### getEditedCellsLayerClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L549

:::

_baseEditor.getEditedCellsLayerClass() ⇒ string_

Gets className of the edited cell if exist.



### getValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L130

:::

_baseEditor.getValue()_

Required method to get current value from editable element.



### init
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L125

:::

_baseEditor.init()_

Initializes an editor's intance.



### isInFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L381

:::

_baseEditor.isInFullEditMode() ⇒ boolean_

Checks if editor is in full edit mode.



### isOpened
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L390

:::

_baseEditor.isOpened() ⇒ boolean_

Returns information whether the editor is open.



### isWaiting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L399

:::

_baseEditor.isWaiting() ⇒ boolean_

Returns information whether the editor is waiting, eg.: for async validation.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L144

:::

_baseEditor.open()_

Required method to open editor.



### prepare
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L165

:::

_baseEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's meta data.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L190

:::

_baseEditor.saveValue(value, ctrlDown)_

Saves value from editor into data storage.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in the last selected range. |



### setValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/551cc43273c2b9c4590f57af650fe0f00c9666d6/handsontable\src\editors\baseEditor/baseEditor.js#L137

:::

_baseEditor.setValue()_

Required method to set new value into editable element.



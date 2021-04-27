---
title: BaseEditor
permalink: /next/api/base-editor
canonicalUrl: /api/base-editor
editLink: false
---

# BaseEditor

[[toc]]
## Members

### BaseEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L26

:::

`baseEditor.[BaseEditor](./base-editor/)`



### _closeCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L68

:::

`baseEditor.\_closeCallback : function`

Callback to call after closing editor.



### cellProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L104

:::

`baseEditor.cellProperties : object`

Object containing the cell's properties.



### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L86

:::

`baseEditor.col : number`

Visual column index.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L32

:::

`baseEditor.hot : [Handsontable](./core/)`

A reference to the source instance of the Handsontable.



### instance
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L40

:::

`baseEditor.instance : [Handsontable](./core/)`

***Deprecated***

A reference to the source instance of the Handsontable.



### originalValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L98

:::

`baseEditor.originalValue : *`

Original cell's value.



### prop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L92

:::

`baseEditor.prop : number | string`

Column property name or a column index, if datasource is an array of arrays.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L80

:::

`baseEditor.row : number`

Visual row index.



### state
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L46

:::

`baseEditor.state : string`

Editor's state.



### TD
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L74

:::

`baseEditor.TD : HTMLTableCellElement`

Currently rendered cell's TD element.


## Methods

### beginEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L225

:::

`baseEditor.beginEditing(newInitialValue, event)`

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L332

:::

`baseEditor.cancelChanges()`

Finishes editing without singout saving value.



### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L151

:::

`baseEditor.close()`

Required method to close editor.



### discardEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L343

:::

`baseEditor.discardEditor(result)`

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L368

:::

`baseEditor.enableFullEditMode()`

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L180

:::

`baseEditor.extend() ⇒ function`

Fallback method to provide extendable editors in ES5.



### finishEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L265

:::

`baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)`

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getEditedCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L434

:::

`baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null`

Gets HTMLTableCellElement of the edited cell if exist.



### getEditedCellsLayerClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L404

:::

`baseEditor.getEditedCellsLayerClass() ⇒ string`

Gets className of the edited cell if exist.



### getValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L130

:::

`baseEditor.getValue()`

Required method to get current value from editable element.



### init
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L125

:::

`baseEditor.init()`

Initializes an editor's intance.



### isInFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L377

:::

`baseEditor.isInFullEditMode() ⇒ boolean`

Checks if editor is in full edit mode.



### isOpened
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L386

:::

`baseEditor.isOpened() ⇒ boolean`

Returns information whether the editor is open.



### isWaiting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L395

:::

`baseEditor.isWaiting() ⇒ boolean`

Returns information whether the editor is waiting, eg.: for async validation.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L144

:::

`baseEditor.open()`

Required method to open editor.



### prepare
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L165

:::

`baseEditor.prepare(row, col, prop, td, value, cellProperties)`

Prepares editor's meta data.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object ({@see Core#getCellMeta}). |



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L190

:::

`baseEditor.saveValue(value, ctrlDown)`

Saves value from editor into data storage.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in the last selected range. |



### setValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L137

:::

`baseEditor.setValue()`

Required method to set new value into editable element.



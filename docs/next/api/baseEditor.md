---
title: BaseEditor
permalink: /next/api/base-editor
canonicalUrl: /api/base-editor
editLink: false
---

# BaseEditor

[[toc]]
## Members:

### BaseEditor

_baseEditor.[BaseEditor](./base-editor/)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L26)



### _closeCallback

_baseEditor.\_closeCallback : function_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L68)

Callback to call after closing editor.



### cellProperties

_baseEditor.cellProperties : object_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L104)

Object containing the cell's properties.



### col

_baseEditor.col : number_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L86)

Visual column index.



### hot

_baseEditor.hot : Handsontable_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L32)

A reference to the source instance of the Handsontable.



### instance

_baseEditor.instance : Handsontable_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L40)

***Deprecated***

A reference to the source instance of the Handsontable.



### originalValue

_baseEditor.originalValue : \*_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L98)

Original cell's value.



### prop

_baseEditor.prop : number | string_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L92)

Column property name or a column index, if datasource is an array of arrays.



### row

_baseEditor.row : number_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L80)

Visual row index.



### state

_baseEditor.state : string_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L46)

Editor's state.



### TD

_baseEditor.TD : HTMLTableCellElement_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L74)

Currently rendered cell's TD element.


## Methods:

### beginEditing

_baseEditor.beginEditing(newInitialValue, event)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L225)

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `\*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges

_baseEditor.cancelChanges()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L332)

Finishes editing without singout saving value.



### close

_baseEditor.close()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L151)

Required method to close editor.



### discardEditor

_baseEditor.discardEditor(result)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L343)

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` \| `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode

_baseEditor.enableFullEditMode()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L368)

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend

_baseEditor.extend() ⇒ function_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L180)

Fallback method to provide extendable editors in ES5.



### finishEditing

_baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L265)

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getEditedCell

_baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L434)

Gets HTMLTableCellElement of the edited cell if exist.



### getEditedCellsLayerClass

_baseEditor.getEditedCellsLayerClass() ⇒ string_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L404)

Gets className of the edited cell if exist.



### getValue

_baseEditor.getValue()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L130)

Required method to get current value from editable element.



### init

_baseEditor.init()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L125)

Initializes an editor's intance.



### isInFullEditMode

_baseEditor.isInFullEditMode() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L377)

Checks if editor is in full edit mode.



### isOpened

_baseEditor.isOpened() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L386)

Returns information whether the editor is open.



### isWaiting

_baseEditor.isWaiting() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L395)

Returns information whether the editor is waiting, eg.: for async validation.



### open

_baseEditor.open()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L144)

Required method to open editor.



### prepare

_baseEditor.prepare(row, col, prop, td, value, cellProperties)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L165)

Prepares editor's meta data.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` \| `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `\*` | The rendered value. |
| cellProperties | `object` | The cell meta object ({@see Core#getCellMeta}). |



### saveValue

_baseEditor.saveValue(value, ctrlDown)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L190)

Saves value from editor into data storage.


| Param | Type | Description |
| --- | --- | --- |
| value | `\*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in the last selected range. |



### setValue

_baseEditor.setValue()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/editors/baseEditor/baseEditor.js#L137)

Required method to set new value into editable element.



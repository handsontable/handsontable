---
title: BaseEditor
metaTitle: BaseEditor | Handsontable DataGrid for JavaScript
permalink: /api/base-editor
canonicalUrl: /api/base-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
id: l025jsly
description: BaseEditor defines the lifecycle that Handsontable DataGrid cell editors follow. Extend it to create custom editors for the editor option.
react:
  id: snc3axwd
  metaTitle: BaseEditor | Handsontable DataGrid for React
angular:
  id: j4c5l3kl
  metaTitle: BaseEditor | Handsontable DataGrid for Angular
---

[[toc]]

See the [Cell editor](@/guides/cell-functions/cell-editor/cell-editor.md) guide for examples and configuration details.


## Members

### _closeAfterDataChange

::: ask-about-api _closeAfterDataChange|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1084

:::

_baseEditor.\_closeAfterDataChange : boolean_

Flag to specify if the editor should be closed after data change.



### col

::: ask-about-api col|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1099

:::

_baseEditor.col : number_

Visual column index.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L355

:::

_BaseEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the base editor.



### originalValue

::: ask-about-api originalValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1109

:::

_baseEditor.originalValue : \*_

Original cell's value.



### prop

::: ask-about-api prop|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1104

:::

_baseEditor.prop : number | string_

Column property name or a column index, if datasource is an array of arrays.



### row

::: ask-about-api row|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1094

:::

_baseEditor.row : number_

Visual row index.



### state

::: ask-about-api state|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1058

:::

_baseEditor.state : string_

Editor's state.



### TD

::: ask-about-api TD|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L1089

:::

_baseEditor.TD : HTMLTableCellElement_

Currently rendered cell's `TD` element.


## Methods

### beginEditing

::: ask-about-api beginEditing|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L472

:::

_baseEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.

In full edit mode, a string `newInitialValue` is passed to `setValue()` unchanged. Any other
value, including `undefined`, passes the cell value after the value getter.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges

::: ask-about-api cancelChanges|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L682

:::

_baseEditor.cancelChanges()_

Finishes editing without saving value.



### close

::: ask-about-api close|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L407

:::

_baseEditor.close()_

Required method to close editor.



### discardEditor

::: ask-about-api discardEditor|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L706

:::

_baseEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's canceled changes.

A value the validator rejected under `allowInvalid: false` reopens the editor on the record the value was
typed into, at the visual row that record has when the validator answers (a sort, a move, a filter, or an
insert or removal can move it while the editor waits). A record a feature that can show it again keeps off
screen (a sort moved it to another Pagination page) is brought back first, through the reveal prepared when the
wait started (`Core#_prepareRowReveal()`), and the editor reopens there with the typed text. A page the user
moved to while the editor waited is kept, and the editor closes. When the record is gone, trimmed out of the
visual space (a filter, a collapse), or hidden for good (`hiddenRows`), the editor closes instead: no cell of
that record can be shown.
Nothing was written, so the close callbacks receive `false`.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode

::: ask-about-api enableFullEditMode|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L753

:::

_baseEditor.enableFullEditMode()_

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend

::: ask-about-api extend|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L437

:::

_baseEditor.extend() ⇒ function_

Fallback method to provide extendable editors in ES5.



### finishEditing

::: ask-about-api finishEditing|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L522

:::

_baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for the editing cell, or for every selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in every selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### focus

::: ask-about-api focus|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L412

:::

_baseEditor.focus()_

Required method to focus editor.



### getEditedCell

::: ask-about-api getEditedCell|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L945

:::

_baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null_

Gets the `HTMLTableCellElement` of the edited cell, if it exists.



### getEditedCellRect

::: ask-about-api getEditedCellRect|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L790

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

::: ask-about-api getEditedCellsLayerClass|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L918

:::

_baseEditor.getEditedCellsLayerClass() ⇒ string_

Gets the `className` of the edited cell, if it exists.



### getValue

::: ask-about-api getValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L387

:::

_baseEditor.getValue()_

Required method to get current value from editable element.



### init

::: ask-about-api init|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L384

:::

_baseEditor.init()_

Initializes an editor's intance.



### isInFullEditMode

::: ask-about-api isInFullEditMode|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L760

:::

_baseEditor.isInFullEditMode() ⇒ boolean_

Checks if editor is in full edit mode.



### isOpened

::: ask-about-api isOpened|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L767

:::

_baseEditor.isOpened() ⇒ boolean_

Returns information whether the editor is open.



### isWaiting

::: ask-about-api isWaiting|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L774

:::

_baseEditor.isWaiting() ⇒ boolean_

Returns information whether the editor is waiting, eg.: for async validation.



### open

::: ask-about-api open|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L402

:::

_baseEditor.open()_

Required method to open editor.



### prepare

::: ask-about-api prepare|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L424

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



### resetValueBeforeEdit

::: ask-about-api resetValueBeforeEdit|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L362

:::

_baseEditor.resetValueBeforeEdit()_

Re-arms the unchanged-edit guard after the editor's content has been reloaded from the data
source, so the baseline describes what the editor shows now rather than what it showed when it
opened. Does nothing while the guard is disarmed.



### saveValue

::: ask-about-api saveValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L451

:::

_baseEditor.saveValue(value, ctrlDown)_

Saves value from editor into data storage.

With `ctrlDown` the value goes into every cell of **every** selection layer, not only the layer
that holds the focus - the same reach the grid's own `Ctrl`/`Cmd`+`Enter` fill has when no
editor is open. The whole fill leaves through one `setDataAtCell()` call, so it fires one
`afterChange` and costs one undo step however many layers it spans.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in every selected range. |



### setValue

::: ask-about-api setValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/baseEditor/baseEditor.ts#L397

:::

_baseEditor.setValue(value)_

Required method to set new value into editable element.

`beginEditing()` passes the cell value after the value getter, or the string it was given.
When the editor needs a string, use `value == null ? '' : String(value)`.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |



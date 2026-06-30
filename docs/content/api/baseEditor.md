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
angular:
  id: j4c5l3kl
  metaTitle: BaseEditor - Angular Data Grid | Handsontable
---

[[toc]]

## Members

### _closeAfterDataChange

::: ask-about-api _closeAfterDataChange|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L534

:::

_baseEditor.\_closeAfterDataChange : boolean_

Flag to specify if the editor should be closed after data change.



### _closeCallback

::: ask-about-api _closeCallback|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L529

:::

_baseEditor.\_closeCallback : function_

Callback to call after closing editor.



### col

::: ask-about-api col|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L549

:::

_baseEditor.col : number_

Visual column index.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L79

:::

_BaseEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the base editor.



### originalValue

::: ask-about-api originalValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L559

:::

_baseEditor.originalValue : \*_

Original cell's value.



### prop

::: ask-about-api prop|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L554

:::

_baseEditor.prop : number | string_

Column property name or a column index, if datasource is an array of arrays.



### row

::: ask-about-api row|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L544

:::

_baseEditor.row : number_

Visual row index.



### state

::: ask-about-api state|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L510

:::

_baseEditor.state : string_

Editor's state.



### TD

::: ask-about-api TD|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L539

:::

_baseEditor.TD : HTMLTableCellElement_

Currently rendered cell's TD element.


## Methods

### beginEditing

::: ask-about-api beginEditing|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L186

:::

_baseEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges

::: ask-about-api cancelChanges|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L280

:::

_baseEditor.cancelChanges()_

Finishes editing without saving value.



### close

::: ask-about-api close|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L113

:::

_baseEditor.close()_

Required method to close editor.



### discardEditor

::: ask-about-api discardEditor|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L289

:::

_baseEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode

::: ask-about-api enableFullEditMode|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L315

:::

_baseEditor.enableFullEditMode()_

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend

::: ask-about-api extend|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L143

:::

_baseEditor.extend() ⇒ function_

Fallback method to provide extendable editors in ES5.



### finishEditing

::: ask-about-api finishEditing|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L227

:::

_baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### focus

::: ask-about-api focus|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L118

:::

_baseEditor.focus()_

Required method to focus editor.



### getEditedCell

::: ask-about-api getEditedCell|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L466

:::

_baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null_

Gets HTMLTableCellElement of the edited cell if exist.



### getEditedCellRect

::: ask-about-api getEditedCellRect|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L352

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L445

:::

_baseEditor.getEditedCellsLayerClass() ⇒ string_

Gets className of the edited cell if exist.



### getValue

::: ask-about-api getValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L98

:::

_baseEditor.getValue()_

Required method to get current value from editable element.



### init

::: ask-about-api init|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L95

:::

_baseEditor.init()_

Initializes an editor's intance.



### isInFullEditMode

::: ask-about-api isInFullEditMode|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L322

:::

_baseEditor.isInFullEditMode() ⇒ boolean_

Checks if editor is in full edit mode.



### isOpened

::: ask-about-api isOpened|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L329

:::

_baseEditor.isOpened() ⇒ boolean_

Returns information whether the editor is open.



### isWaiting

::: ask-about-api isWaiting|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L336

:::

_baseEditor.isWaiting() ⇒ boolean_

Returns information whether the editor is waiting, eg.: for async validation.



### open

::: ask-about-api open|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L108

:::

_baseEditor.open()_

Required method to open editor.



### prepare

::: ask-about-api prepare|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L130

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

::: ask-about-api saveValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L152

:::

_baseEditor.saveValue(value, ctrlDown)_

Saves value from editor into data storage.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in the last selected range. |



### setValue

::: ask-about-api setValue|BaseEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/baseEditor/baseEditor.ts#L103

:::

_baseEditor.setValue()_

Required method to set new value into editable element.



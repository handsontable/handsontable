---
title: BaseEditor
metaTitle: BaseEditor - API Reference - Handsontable Documentation
permalink: /12.1/api/base-editor
canonicalUrl: /api/base-editor
hotPlugin: false
editLink: false
---

# BaseEditor

[[toc]]
## Members

### BaseEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L36

:::

_baseEditor.[BaseEditor](@/api/baseEditor.md)_



### _closeCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L78

:::

_baseEditor.\_closeCallback : function_

Callback to call after closing editor.



### cellProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L114

:::

_baseEditor.cellProperties : object_

Object containing the cell's properties.



### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L96

:::

_baseEditor.col : number_

Visual column index.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L42

:::

_baseEditor.hot : [Handsontable](@/api/core.md)_

A reference to the source instance of the Handsontable.



### instance
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L50

:::

_baseEditor.instance : [Handsontable](@/api/core.md)_

***Deprecated***

A reference to the source instance of the Handsontable.



### originalValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L108

:::

_baseEditor.originalValue : \*_

Original cell's value.



### prop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L102

:::

_baseEditor.prop : number | string_

Column property name or a column index, if datasource is an array of arrays.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L90

:::

_baseEditor.row : number_

Visual row index.



### state
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L56

:::

_baseEditor.state : string_

Editor's state.



### TD
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L84

:::

_baseEditor.TD : HTMLTableCellElement_

Currently rendered cell's TD element.


## Methods

### beginEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L266

:::

_baseEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### cancelChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L379

:::

_baseEditor.cancelChanges()_

Finishes editing without singout saving value.



### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L161

:::

_baseEditor.close()_

Required method to close editor.



### discardEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L390

:::

_baseEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### enableFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L419

:::

_baseEditor.enableFullEditMode()_

Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.



### extend
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L190

:::

_baseEditor.extend() ⇒ function_

Fallback method to provide extendable editors in ES5.



### finishEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L306

:::

_baseEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getEditedCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L607

:::

_baseEditor.getEditedCell() ⇒ HTMLTableCellElement | null_

Gets HTMLTableCellElement of the edited cell if exist.



### getEditedCellRect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L465

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L583

:::

_baseEditor.getEditedCellsLayerClass() ⇒ string_

Gets className of the edited cell if exist.



### getValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L140

:::

_baseEditor.getValue()_

Required method to get current value from editable element.



### init
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L135

:::

_baseEditor.init()_

Initializes an editor's intance.



### isInFullEditMode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L428

:::

_baseEditor.isInFullEditMode() ⇒ boolean_

Checks if editor is in full edit mode.



### isOpened
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L437

:::

_baseEditor.isOpened() ⇒ boolean_

Returns information whether the editor is open.



### isWaiting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L446

:::

_baseEditor.isWaiting() ⇒ boolean_

Returns information whether the editor is waiting, eg.: for async validation.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L154

:::

_baseEditor.open()_

Required method to open editor.



### prepare
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L175

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
| cellProperties | `object` | The cell meta object ({@see Core#getCellMeta}). |



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L200

:::

_baseEditor.saveValue(value, ctrlDown)_

Saves value from editor into data storage.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | The editor value. |
| ctrlDown | `boolean` | If `true`, applies value to each cell in the last selected range. |



### setValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/editors/baseEditor/baseEditor.js#L147

:::

_baseEditor.setValue()_

Required method to set new value into editable element.



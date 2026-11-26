---
title: TextEditor
metaTitle: TextEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/text-editor
canonicalUrl: /api/text-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
id: c7r3j9lp
react:
  id: e5w8k2zo
angular:
  id: i1v6q4ap
---

[[toc]]

## Members

### capsLength

::: ask-about-api capsLength|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L158

:::

_textEditor.capsLength ⇒ boolean_

Tells whether the editor stops the user from typing or pasting more characters than the
[`maxLength`](@/api/options.md#maxlength) of the cell allows. An editor that extends this one
inherits the cap. The built-in editors that have their own input rules turn it off by
overriding this getter to return `false`.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L134

:::

_TextEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the text editor.


## Methods

### beginEditing

::: ask-about-api beginEditing|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L217

:::

_textEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The editor initial value. |
| event | `Event` | The keyboard event object. |



### close

::: ask-about-api close|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L176

:::

_textEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L237

:::

_textEditor.createElements(type)_

Creates an editor's elements and adds necessary CSS classnames.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | `string` | <code>&quot;textarea&quot;</code> | The type of the element to create. |



### focus

::: ask-about-api focus|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L226

:::

_textEditor.focus()_

Sets focus state on the select element.



### getValue

::: ask-about-api getValue|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L141

:::

_textEditor.getValue() ⇒ number_

Gets current value from editable element.



### open

::: ask-about-api open|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L165

:::

_textEditor.open([_event])_

Opens the editor and adjust its size.


| Param | Type | Description |
| --- | --- | --- |
| [_event] | `Event` | `optional` The event that opened the editor. Subclasses read it. |



### prepare

::: ask-about-api prepare|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L196

:::

_textEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's meta data.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



### setValue

::: ask-about-api setValue|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/textEditor/textEditor.ts#L148

:::

_textEditor.setValue(newValue)_

Sets new value into editable element.


| Param | Type | Description |
| --- | --- | --- |
| newValue | `*` | The editor value. |



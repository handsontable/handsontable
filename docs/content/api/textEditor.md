---
title: TextEditor
metaTitle: TextEditor API reference – JavaScript Data Grid | Handsontable
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

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L40

:::

_TextEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the text editor.


## Methods

### beginEditing

::: ask-about-api beginEditing|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L107

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L68

:::

_textEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L127

:::

_textEditor.createElements(type)_

Creates an editor's elements and adds necessary CSS classnames.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | `string` | <code>&quot;textarea&quot;</code> | The type of the element to create. |



### focus

::: ask-about-api focus|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L116

:::

_textEditor.focus()_

Sets focus state on the select element.



### getValue

::: ask-about-api getValue|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L47

:::

_textEditor.getValue() ⇒ number_

Gets current value from editable element.



### open

::: ask-about-api open|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L59

:::

_textEditor.open()_

Opens the editor and adjust its size.



### prepare

::: ask-about-api prepare|TextEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L86

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/textEditor/textEditor.ts#L54

:::

_textEditor.setValue(newValue)_

Sets new value into editable element.


| Param | Type | Description |
| --- | --- | --- |
| newValue | `*` | The editor value. |



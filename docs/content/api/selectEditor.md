---
title: SelectEditor
metaTitle: SelectEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/select-editor
canonicalUrl: /api/select-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L29

:::

_SelectEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the select editor.


## Methods

### close

::: ask-about-api close|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L79

:::

_selectEditor.close()_

Closes the editor.



### focus

::: ask-about-api focus|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L90

:::

_selectEditor.focus()_

Sets focus state on the select element.



### getValue

::: ask-about-api getValue|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L57

:::

_selectEditor.getValue() ⇒ \*_

Returns select's value.



### init

::: ask-about-api init|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L34

:::

_selectEditor.init()_

Initializes editor instance, DOM Element and mount hooks.



### open

::: ask-about-api open|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L69

:::

_selectEditor.open()_

Opens the editor and adjust its size.



### prepare

::: ask-about-api prepare|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L112

:::

_selectEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's meta data and a list of available options.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



### setValue

::: ask-about-api setValue|SelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/selectEditor/selectEditor.ts#L64

:::

_selectEditor.setValue(value)_

Sets value in the select element.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | A new select's value. |



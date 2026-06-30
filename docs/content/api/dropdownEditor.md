---
title: DropdownEditor
metaTitle: DropdownEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/dropdown-editor
canonicalUrl: /api/dropdown-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|DropdownEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dropdownEditor/dropdownEditor.ts#L25

:::

_DropdownEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the dropdown editor.


## Methods

### finishEditing

::: ask-about-api finishEditing|DropdownEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dropdownEditor/dropdownEditor.ts#L46

:::

_dropdownEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### prepare

::: ask-about-api prepare|DropdownEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dropdownEditor/dropdownEditor.ts#L35

:::

_dropdownEditor.prepare(row, col, prop, td, value, cellProperties)_


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



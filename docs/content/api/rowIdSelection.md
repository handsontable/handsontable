---
title: RowIdSelection
metaTitle: RowIdSelection API reference | Handsontable DataGrid for JavaScript
permalink: /api/row-id-selection
canonicalUrl: /api/row-id-selection
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### export

::: ask-about-api export|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L117

:::

_rowIdSelection.export() ⇒ ServerRowSelection_

Exports the selection. `toggledRowIds` lists the ids oldest first: a `Set` keeps the order they
were toggled in.



### forget

::: ask-about-api forget|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L83

:::

_rowIdSelection.forget(rowId)_

Forgets the row with the id, for a row that no longer exists (the server removed it). The row
neither counts as selected nor as deselected any more, under either model.


| Param | Type | Description |
| --- | --- | --- |
| rowId | `*` | The row id. |



### import

::: ask-about-api import|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L127

:::

_rowIdSelection.import(selection)_

Replaces the selection.


| Param | Type | Description |
| --- | --- | --- |
| selection | `ServerRowSelection` | The selection to apply. |



### isEmpty

::: ask-about-api isEmpty|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L98

:::

_rowIdSelection.isEmpty() ⇒ boolean_

Tells whether nothing is selected and nothing is toggled.



### isSelected

::: ask-about-api isSelected|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L63

:::

_rowIdSelection.isSelected(rowId) ⇒ boolean_

Checks whether the row with the id is selected.


| Param | Type | Description |
| --- | --- | --- |
| rowId | `*` | The row id. |



### set

::: ask-about-api set|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L71

:::

_rowIdSelection.set(rowId, selected)_

Selects or deselects the row with the id.


| Param | Type | Description |
| --- | --- | --- |
| rowId | `*` | The row id. |
| selected | `boolean` | The new state. |



### setAll

::: ask-about-api setAll|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L90

:::

_rowIdSelection.setAll(selected)_

Selects every row, or clears the selection.


| Param | Type | Description |
| --- | --- | --- |
| selected | `boolean` | `true` to select every row, `false` to clear the selection. |



### summarize

::: ask-about-api summarize|RowIdSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowIdSelection.ts#L107

:::

_rowIdSelection.summarize(totalRows) ⇒ HeaderCheckboxSummary_

Summarizes the selection against the number of rows matching the query. With `selectAll`, the
count assumes every toggled id still matches the query; the server is the only one that knows.


| Param | Type | Description |
| --- | --- | --- |
| totalRows | `number` | The number of rows matching the query. |



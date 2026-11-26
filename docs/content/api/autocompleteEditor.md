---
title: AutocompleteEditor
metaTitle: AutocompleteEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/autocomplete-editor
canonicalUrl: /api/autocomplete-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L215

:::

_AutocompleteEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the autocomplete editor.



### query

::: ask-about-api query|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L934

:::

_autocompleteEditor.query : string_

Query string to turn available values over.



### rawChoices

::: ask-about-api rawChoices|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L942

:::

_autocompleteEditor.rawChoices : Array_

Contains raw choices.



### strippedChoices

::: ask-about-api strippedChoices|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L938

:::

_autocompleteEditor.strippedChoices : Array&lt;string&gt;_

Contains stripped choices.


## Methods

### beginEditing

::: ask-about-api beginEditing|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L295

:::

_autocompleteEditor.beginEditing([newInitialValue], [event])_

Begins editing and remembers the text the editor was seeded with from the cell.


| Param | Type | Description |
| --- | --- | --- |
| [newInitialValue] | `*` | `optional` The initial editor value. A string is text the user brought (a fast   edit), anything else opens the editor on the cell's value. |
| [event] | `Event` | `optional` The event that started the edit. |



### close

::: ask-about-api close|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L506

:::

_autocompleteEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L246

:::

_autocompleteEditor.createElements()_

Creates an editor's elements and adds necessary CSS classnames.



### discardEditor

::: ask-about-api discardEditor|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L588

:::

_autocompleteEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's canceled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### getTargetEditorHeight

::: ask-about-api getTargetEditorHeight|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L804

:::

_autocompleteEditor.getTargetEditorHeight() ⇒ number_

Calculates the proposed/target editor height that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getTargetEditorWidth

::: ask-about-api getTargetEditorWidth|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L828

:::

_autocompleteEditor.getTargetEditorWidth() ⇒ number_

Calculates the proposed/target editor width that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getValue

::: ask-about-api getValue|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L222

:::

_autocompleteEditor.getValue() ⇒ string_

Gets current value from editable element.



### open

::: ask-about-api open|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L313

:::

_autocompleteEditor.open()_

Opens the editor and adjust its size and internal Handsontable's instance.



### prepare

::: ask-about-api prepare|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L276

:::

_autocompleteEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's metadata and configuration of the internal Handsontable's instance.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



### queryChoices

::: ask-about-api queryChoices|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L599

:::

_autocompleteEditor.queryChoices(query)_

Prepares choices list based on applied argument.

Does nothing when the editor is not editing, and ignores a `source` response that arrives after
the editor closed or after a newer query started.


| Param | Type | Description |
| --- | --- | --- |
| query | `string` | The query. |



### resetValueBeforeEdit

::: ask-about-api resetValueBeforeEdit|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L455

:::

_autocompleteEditor.resetValueBeforeEdit()_

Re-seeds the unchanged-edit baseline after the open editor took the cell's value again
(`TextEditor#refreshValue()`, after `setSourceDataAtCell()` on the edited cell), and the opening
text with it.



### updateChoicesList

::: ask-about-api updateChoicesList|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L653

:::

_autocompleteEditor.updateChoicesList(choicesList)_

Updates list of the possible completions to choose.


| Param | Type | Description |
| --- | --- | --- |
| choicesList | `Array` | The choices list to process. |



---
title: AutocompleteEditor
metaTitle: AutocompleteEditor API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L97

:::

_AutocompleteEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the autocomplete editor.



### query

::: ask-about-api query|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L529

:::

_autocompleteEditor.query : string_

Query string to turn available values over.



### rawChoices

::: ask-about-api rawChoices|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L537

:::

_autocompleteEditor.rawChoices : Array_

Contains raw choices.



### strippedChoices

::: ask-about-api strippedChoices|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L533

:::

_autocompleteEditor.strippedChoices : Array&lt;string&gt;_

Contains stripped choices.


## Methods

### close

::: ask-about-api close|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L254

:::

_autocompleteEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L117

:::

_autocompleteEditor.createElements()_

Creates an editor's elements and adds necessary CSS classnames.



### discardEditor

::: ask-about-api discardEditor|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L268

:::

_autocompleteEditor.discardEditor(result)_

Verifies result of validation or closes editor if user's cancelled changes.


| Param | Type | Description |
| --- | --- | --- |
| result | `boolean` <br/> `undefined` | If `false` and the cell using allowInvalid option,                                   then an editor won't be closed until validation is passed. |



### getTargetEditorHeight

::: ask-about-api getTargetEditorHeight|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L426

:::

_autocompleteEditor.getTargetEditorHeight() ⇒ number_

Calculates the proposed/target editor height that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getTargetEditorWidth

::: ask-about-api getTargetEditorWidth|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L450

:::

_autocompleteEditor.getTargetEditorWidth() ⇒ number_

Calculates the proposed/target editor width that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getValue

::: ask-about-api getValue|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L104

:::

_autocompleteEditor.getValue() ⇒ string_

Gets current value from editable element.



### open

::: ask-about-api open|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L154

:::

_autocompleteEditor.open()_

Opens the editor and adjust its size and internal Handsontable's instance.



### prepare

::: ask-about-api prepare|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L139

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L276

:::

_autocompleteEditor.queryChoices(query)_

Prepares choices list based on applied argument.


| Param | Type | Description |
| --- | --- | --- |
| query | `string` | The query. |



### updateChoicesList

::: ask-about-api updateChoicesList|AutocompleteEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/autocompleteEditor/autocompleteEditor.ts#L295

:::

_autocompleteEditor.updateChoicesList(choicesList)_

Updates list of the possible completions to choose.


| Param | Type | Description |
| --- | --- | --- |
| choicesList | `Array` | The choices list to process. |



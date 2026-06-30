---
title: HandsontableEditor
metaTitle: HandsontableEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/handsontable-editor
canonicalUrl: /api/handsontable-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L29

:::

_HandsontableEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the Handsontable editor.



### isFlippedHorizontally

::: ask-about-api isFlippedHorizontally|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L433

:::

_handsontableEditor.isFlippedHorizontally : boolean_

The flag determining if the editor is flipped horizontally (rendered on
the inline start of the edited cell) or not.



### isFlippedVertically

::: ask-about-api isFlippedVertically|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L428

:::

_handsontableEditor.isFlippedVertically : boolean_

The flag determining if the editor is flipped vertically (rendered on
the top of the edited cell) or not.


## Methods

### beginEditing

::: ask-about-api beginEditing|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L126

:::

_handsontableEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The editor initial value. |
| event | `*` | The keyboard event object. |



### close

::: ask-about-api close|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L67

:::

_handsontableEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L135

:::

_handsontableEditor.createElements()_

Creates an editor's elements and adds necessary CSS classnames.



### finishEditing

::: ask-about-api finishEditing|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L149

:::

_handsontableEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for editing cell or last selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getDropdownHeight

::: ask-about-api getDropdownHeight|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L284

:::

_handsontableEditor.getDropdownHeight() ⇒ number_

Return the DOM height of the editor's container.



### getDropdownWidth

::: ask-about-api getDropdownWidth|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L291

:::

_handsontableEditor.getDropdownWidth() ⇒ number_

Return the DOM width of the editor's container.



### getTargetDropdownHeight

::: ask-about-api getTargetDropdownHeight|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L307

:::

_handsontableEditor.getTargetDropdownHeight() ⇒ number_

Calculates the proposed/target editor height that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getTargetDropdownWidth

::: ask-about-api getTargetDropdownWidth|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L299

:::

_handsontableEditor.getTargetDropdownWidth() ⇒ number_

Calculates the proposed/target editor width that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### open

::: ask-about-api open|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L34

:::

_handsontableEditor.open()_

Opens the editor and adjust its size.



### prepare

::: ask-about-api prepare|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L83

:::

_handsontableEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's meta data and configuration of the internal Handsontable's instance.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



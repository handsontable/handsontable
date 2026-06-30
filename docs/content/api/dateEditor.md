---
title: DateEditor
metaTitle: DateEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/date-editor
canonicalUrl: /api/date-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L28

:::

_DateEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the date editor.


## Methods

### createElements

::: ask-about-api createElements|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L55

:::

_dateEditor.createElements()_

Creates the editor's textarea element as a native date input.



### focus

::: ask-about-api focus|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L75

:::

_dateEditor.focus()_

Selects all text in the date input element when the editor receives focus.



### init

::: ask-about-api init|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L33

:::

_dateEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L80

:::

_dateEditor.open()_

Opens the editor and programmatically invokes the native date picker via showPicker().



### prepare

::: ask-about-api prepare|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L43

:::

_dateEditor.prepare()_

Prepares the editor, replacing the display value with the raw ISO source data for the native date input.



### setValue

::: ask-about-api setValue|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/dateEditor/dateEditor.ts#L61

:::

_dateEditor.setValue()_

Sets the editor value, falling back to `defaultDate` when the value is empty, and warns if the value is not a valid ISO date string.



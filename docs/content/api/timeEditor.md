---
title: TimeEditor
metaTitle: TimeEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/time-editor
canonicalUrl: /api/time-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L27

:::

_TimeEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the time editor.


## Methods

### createElements

::: ask-about-api createElements|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L42

:::

_timeEditor.createElements()_

Creates the editor's textarea element as a native time input.



### focus

::: ask-about-api focus|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L60

:::

_timeEditor.focus()_

Selects all text in the time input element when the editor receives focus.



### init

::: ask-about-api init|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L32

:::

_timeEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L65

:::

_timeEditor.open()_

Opens the editor and programmatically invokes the native time picker via showPicker().



### setValue

::: ask-about-api setValue|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/timeEditor/timeEditor.ts#L49

:::

_timeEditor.setValue()_

Sets the editor value and warns if the value does not match the 24-hour time format required by the native time input.



---
title: TimeEditor
metaTitle: TimeEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/time-editor
canonicalUrl: /api/time-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### capsLength

::: ask-about-api capsLength|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L35

:::

_timeEditor.capsLength ⇒ boolean_

Turns off the `maxLength` cap of the text editor. This editor has its own input rules.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L28

:::

_TimeEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the time editor.


## Methods

### close

::: ask-about-api close|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L80

:::

_timeEditor.close()_

Closes the editor and the native picker it showed.

The blur comes after the base `close()`, which hands the keyboard back to the grid while the input
still has the focus.



### createElements

::: ask-about-api createElements|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L50

:::

_timeEditor.createElements()_

Creates the editor's textarea element as a native time input.



### focus

::: ask-about-api focus|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L69

:::

_timeEditor.focus()_

Focuses the native input and selects its text. Firefox does not move the focus on `select()`
for this input type.



### init

::: ask-about-api init|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L40

:::

_timeEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L89

:::

_timeEditor.open([event])_

Opens the editor and shows the native picker, unless a key opened the editor.
A keyboard open leaves the picker closed so Tab and Escape keep reaching the grid.


| Param | Type | Description |
| --- | --- | --- |
| [event] | `Event` | `optional` The event that opened the editor. |



### setValue

::: ask-about-api setValue|TimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/timeEditor/timeEditor.ts#L57

:::

_timeEditor.setValue()_

Sets the editor value and warns if the value does not match the 24-hour time format required by the native time input.



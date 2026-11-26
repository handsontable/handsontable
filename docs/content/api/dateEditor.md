---
title: DateEditor
metaTitle: DateEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/date-editor
canonicalUrl: /api/date-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### capsLength

::: ask-about-api capsLength|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L105

:::

_dateEditor.capsLength ⇒ boolean_

Turns off the `maxLength` cap of the text editor. This editor has its own input rules.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L98

:::

_DateEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the date editor.


## Methods

### beginEditing

::: ask-about-api beginEditing|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L147

:::

_dateEditor.beginEditing(newInitialValue, event)_

Begins editing, forgetting what the previous editing session did to the input.

The state is reset here, not in `prepare()`: Escape closes the editor without moving the selection, so
the next keystroke on the same cell opens a new session without preparing the editor again.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The initial editor value. |
| event | `Event` | The keyboard event object. |



### close

::: ask-about-api close|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L203

:::

_dateEditor.close()_

Closes the editor and the native date picker it opened.

There is no API to hide the picker, and Firefox keeps it open after the editor closes. Blurring the
input dismisses it. The blur comes after the base `close()`, which hands the keyboard back to the grid
while the input still has the focus. A blur leaves the focus on the page body, so the focus goes back
to the highlighted cell.



### createElements

::: ask-about-api createElements|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L132

:::

_dateEditor.createElements()_

Creates the editor's textarea element as a native date input.



### finishEditing

::: ask-about-api finishEditing|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L166

:::

_dateEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing, keeping the cell's date when the native input holds an incomplete date.

A native date input reports an empty value for an incomplete date, the same as for a cleared one.
Committing that empty value would erase the cell, so an incomplete entry restores the cell's date.
Every way out of the editor takes this path, so leaving it by a click, Tab, or Ctrl+Enter restores the
date too, and a Ctrl+Enter fill then writes nothing.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in every selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### focus

::: ask-about-api focus|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L190

:::

_dateEditor.focus()_

Focuses the date input element when the editor opens.

Firefox does not move the focus on `select()` for a date input, so the focus is set explicitly.
`preventScroll` keeps the page from jumping to the input.



### init

::: ask-about-api init|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L110

:::

_dateEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L212

:::

_dateEditor.open([event])_

Opens the editor and shows the native picker, unless a key opened the editor.
A keyboard open leaves the picker closed so Tab and Escape keep reaching the grid.


| Param | Type | Description |
| --- | --- | --- |
| [event] | `Event` | `optional` The event that opened the editor. |



### prepare

::: ask-about-api prepare|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L120

:::

_dateEditor.prepare()_

Prepares the editor, replacing the display value with the raw ISO source data for the native date input.



### setValue

::: ask-about-api setValue|DateEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/dateEditor/dateEditor.ts#L172

:::

_dateEditor.setValue()_

Sets the editor value, falling back to `defaultDate` when the value is empty, and warns if the value is not a valid ISO date string.



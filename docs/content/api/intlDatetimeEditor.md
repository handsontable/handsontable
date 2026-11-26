---
title: IntlDatetimeEditor
metaTitle: IntlDatetimeEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/intl-datetime-editor
canonicalUrl: /api/intl-datetime-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### capsLength

::: ask-about-api capsLength|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L38

:::

_intlDatetimeEditor.capsLength ⇒ boolean_

Turns off the `maxLength` cap of the text editor. This editor has its own input rules.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L31

:::

_IntlDatetimeEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the intl-datetime editor.


## Methods

### close

::: ask-about-api close|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L115

:::

_intlDatetimeEditor.close()_

Closes the editor and the native picker it showed.

The blur comes after the base `close()`, which hands the keyboard back to the grid while the input
still has the focus.



### createElements

::: ask-about-api createElements|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L62

:::

_intlDatetimeEditor.createElements()_

Creates the editor's element as a native datetime-local input that shows seconds.



### focus

::: ask-about-api focus|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L104

:::

_intlDatetimeEditor.focus()_

Focuses the native input and selects its text. Firefox does not move the focus on `select()`
for this input type.



### getValue

::: ask-about-api getValue|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L94

:::

_intlDatetimeEditor.getValue()_

Returns the editor value, canonicalizing to `YYYY-MM-DDTHH:mm:ss` (native input may omit seconds).



### init

::: ask-about-api init|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L43

:::

_intlDatetimeEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L124

:::

_intlDatetimeEditor.open([event])_

Opens the editor and shows the native picker, unless a key opened the editor.
A keyboard open leaves the picker closed so Tab and Escape keep reaching the grid.


| Param | Type | Description |
| --- | --- | --- |
| [event] | `Event` | `optional` The event that opened the editor. |



### prepare

::: ask-about-api prepare|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L53

:::

_intlDatetimeEditor.prepare()_

Prepares the editor, replacing the display value with the raw ISO source data for the native input.



### setValue

::: ask-about-api setValue|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L71

:::

_intlDatetimeEditor.setValue()_

Sets the editor value, normalizing to the `YYYY-MM-DDTHH:mm:ss` form the native input expects,
and warns if the value is not a valid ISO date-time string.



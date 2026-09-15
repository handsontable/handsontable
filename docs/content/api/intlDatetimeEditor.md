---
title: IntlDatetimeEditor
metaTitle: IntlDatetimeEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/intl-datetime-editor
canonicalUrl: /api/intl-datetime-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L30

:::

_IntlDatetimeEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the intl-datetime editor.


## Methods

### createElements

::: ask-about-api createElements|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L54

:::

_intlDatetimeEditor.createElements()_

Creates the editor's element as a native datetime-local input that shows seconds.



### focus

::: ask-about-api focus|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L95

:::

_intlDatetimeEditor.focus()_

Selects all text in the input element when the editor receives focus.



### getValue

::: ask-about-api getValue|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L86

:::

_intlDatetimeEditor.getValue()_

Returns the editor value, canonicalizing to `YYYY-MM-DDTHH:mm:ss` (native input may omit seconds).



### init

::: ask-about-api init|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L35

:::

_intlDatetimeEditor.init()_

Initializes the editor and registers an afterSetTheme hook to close on theme changes.



### open

::: ask-about-api open|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L100

:::

_intlDatetimeEditor.open()_

Opens the editor and programmatically invokes the native picker via showPicker().



### prepare

::: ask-about-api prepare|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L45

:::

_intlDatetimeEditor.prepare()_

Prepares the editor, replacing the display value with the raw ISO source data for the native input.



### setValue

::: ask-about-api setValue|IntlDatetimeEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/editors/intlDatetimeEditor/intlDatetimeEditor.ts#L63

:::

_intlDatetimeEditor.setValue()_

Sets the editor value, normalizing to the `YYYY-MM-DDTHH:mm:ss` form the native input expects,
and warns if the value is not a valid ISO date-time string.



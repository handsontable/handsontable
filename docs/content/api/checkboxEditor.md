---
title: CheckboxEditor
metaTitle: CheckboxEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/checkbox-editor
canonicalUrl: /api/checkbox-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L25

:::

_CheckboxEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the checkbox editor.


## Methods

### beginEditing

::: ask-about-api beginEditing|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L30

:::

_checkboxEditor.beginEditing()_

Handles the mouseup event on the cell TD element to trigger a checkbox click via a double-click interaction.



### close

::: ask-about-api close|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L53

:::

_checkboxEditor.close()_

No-op override — the checkbox editor has no visible editing element to close.



### finishEditing

::: ask-about-api finishEditing|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L44

:::

_checkboxEditor.finishEditing()_

No-op override — the checkbox editor does not perform a finish step.



### focus

::: ask-about-api focus|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L64

:::

_checkboxEditor.focus()_

No-op override — the checkbox editor delegates focus to the native checkbox element.



### getValue

::: ask-about-api getValue|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L56

:::

_checkboxEditor.getValue()_

Returns undefined because checkbox state is written directly to the cell; no separate value is held.



### init

::: ask-about-api init|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L47

:::

_checkboxEditor.init()_

No-op override — the checkbox editor requires no DOM initialization.



### open

::: ask-about-api open|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L50

:::

_checkboxEditor.open()_

No-op override — the checkbox editor has no visible editing element to open.



### setValue

::: ask-about-api setValue|CheckboxEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/checkboxEditor/checkboxEditor.ts#L61

:::

_checkboxEditor.setValue()_

No-op override — the checkbox editor writes its value directly via DOM events.



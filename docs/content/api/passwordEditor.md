---
title: PasswordEditor
metaTitle: PasswordEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/password-editor
canonicalUrl: /api/password-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L106

:::

_PasswordEditor.EDITOR\_TYPE ⇒ string_


## Methods

### close

::: ask-about-api close|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L154

:::

_passwordEditor.close()_

Closes the editor. Removes the input event listener, cancels any pending reveal timer,
resets reveal-mode state, and restores the input to `type="password"`.



### createElements

::: ask-about-api createElements|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L112

:::

_passwordEditor.createElements()_

Creates the editor's DOM elements. Replaces the `<textarea>` from `TextEditor` with an
`<input type="password">` element so that the browser masks its content natively.



### getValue

::: ask-about-api getValue|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L178

:::

_passwordEditor.getValue() ⇒ string_

Returns the current editor value. In reveal-delay mode returns the real (unmasked) value
stored in `#realValue` rather than reading the input's display value, which may contain
hash symbols.



### open

::: ask-about-api open|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L130

:::

_passwordEditor.open()_

Opens the editor. When `hashRevealDelay` is set, switches the input to `type="text"` and
installs a manual masking handler so each typed character is briefly visible before being
replaced by `hashSymbol`.



### setValue

::: ask-about-api setValue|PasswordEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/passwordEditor/passwordEditor.ts#L191

:::

_passwordEditor.setValue([value])_

Sets the editor value. In reveal-delay mode stores the plain value in `#realValue` and
updates the input display with masked characters. When called from `beginEditing()` before
`open()` has set `#inRevealMode`, pre-populates `#realValue` so `open()` can mask it
immediately on display.


| Param | Type | Description |
| --- | --- | --- |
| [value] | `string` | `optional` The value to set. |



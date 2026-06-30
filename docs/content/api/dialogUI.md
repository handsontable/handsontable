---
title: DialogUI
metaTitle: DialogUI API reference – JavaScript Data Grid | Handsontable
permalink: /api/dialog-ui
canonicalUrl: /api/dialog-ui
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the dialog UI with an overlay container, RTL layout flag, and an optional HTML sanitizer, then installs the DOM structure.


## Methods

### destroyDialog

::: ask-about-api destroyDialog|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L308

:::

_dialogUI.destroyDialog()_

Removes the dialog UI elements from the DOM and clears the refs.



### focusDialog

::: ask-about-api focusDialog|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L294

:::

_dialogUI.focusDialog()_

Focuses the dialog element.



### getContainer

::: ask-about-api getContainer|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L158

:::

_dialogUI.getContainer() ⇒ HTMLElement_

Returns the dialog element.


**Returns**: `HTMLElement` - The dialog element.  

### getFocusableElements

::: ask-about-api getFocusableElements|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L165

:::

_dialogUI.getFocusableElements() ⇒ Array&lt;HTMLElement&gt;_

Gets the focusable elements.


**Returns**: `Array<HTMLElement>` - The focusable elements.  

### hideDialog

::: ask-about-api hideDialog|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L283

:::

_dialogUI.hideDialog(animation) ⇒ [DialogUI](@/api/dialogUI.md)_

Hides the dialog with optional animation.


| Param | Type | Description |
| --- | --- | --- |
| animation | `boolean` | Whether to add the animation class to the dialog. |


**Returns**: [`DialogUI`](#dialogui) - The instance of the DialogUI.  

### install

::: ask-about-api install|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L133

:::

_dialogUI.install()_

Creates the dialog UI elements and sets up the structure.



### showDialog

::: ask-about-api showDialog|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L265

:::

_dialogUI.showDialog(animation) ⇒ [DialogUI](@/api/dialogUI.md)_

Shows the dialog with optional animation.


| Param | Type | Description |
| --- | --- | --- |
| animation | `boolean` | Whether to add the animation class to the dialog. |


**Returns**: [`DialogUI`](#dialogui) - The instance of the DialogUI.  

### updateDialog

::: ask-about-api updateDialog|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L181

:::

_dialogUI.updateDialog(options) ⇒ [DialogUI](@/api/dialogUI.md)_

Updates the dialog content and class name.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Class name update options. |
| options.isVisible | `boolean` | Whether the dialog is visible. |
| options.content | `string` <br/> `HTMLElement` | The content to render in the dialog. |
| options.customClassName | `string` | The custom class name to add to the dialog. |
| options.background | `string` | The background to add to the dialog. |
| options.contentBackground | `boolean` | Whether to show content background. |
| options.animation | `boolean` | Whether to add the animation class to the dialog. |
| options.a11y | `object` | The accessibility options for the dialog. |


**Returns**: [`DialogUI`](#dialogui) - The instance of the DialogUI.  

### updateWidth

::: ask-about-api updateWidth|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L302

:::

_dialogUI.updateWidth(width) ⇒ [DialogUI](@/api/dialogUI.md)_

Updates the width of the dialog container to the same size as the table.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | The width of the table. |


**Returns**: [`DialogUI`](#dialogui) - The instance of the DialogUI.  

### useDefaultTemplate

::: ask-about-api useDefaultTemplate|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L127

:::

_dialogUI.useDefaultTemplate()_

Uses the default template for the dialog for the `content` option.



### useTemplate

::: ask-about-api useTemplate|DialogUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/ui.ts#L116

:::

_dialogUI.useTemplate(templateName, templateVars)_

Uses the specified template for the dialog.


| Param | Type | Description |
| --- | --- | --- |
| templateName | `string` | The name of the template to use. |
| templateVars | `object` | The variables to use for the template. |



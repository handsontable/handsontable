---
title: EmptyDataStateUI
metaTitle: EmptyDataStateUI API reference – JavaScript Data Grid | Handsontable
permalink: /api/empty-data-state-ui
canonicalUrl: /api/empty-data-state-ui
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the empty data state UI with the grid container and document, then builds and inserts the DOM structure.


## Methods

### destroy

::: ask-about-api destroy|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L311

:::

_emptyDataStateUI.destroy()_

Removes the emptyDataState UI elements from the DOM and clears the refs.



### getElement

::: ask-about-api getElement|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L183

:::

_emptyDataStateUI.getElement() ⇒ HTMLElement_

Gets the emptyDataState element.


**Returns**: `HTMLElement` - The empty data state element.  

### getFocusableElements

::: ask-about-api getFocusableElements|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L190

:::

_emptyDataStateUI.getFocusableElements() ⇒ Array&lt;HTMLElement&gt;_

Gets the focusable elements of the emptyDataState element.


**Returns**: `Array<HTMLElement>` - The focusable elements.  

### hide

::: ask-about-api hide|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L211

:::

_emptyDataStateUI.hide()_

Hides the emptyDataState element.



### install

::: ask-about-api install|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L162

:::

_emptyDataStateUI.install()_

Creates the emptyDataState UI elements and sets up the structure.



### show

::: ask-about-api show|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L203

:::

_emptyDataStateUI.show()_

Shows the emptyDataState element.



### updateClassNames

::: ask-about-api updateClassNames|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L265

:::

_emptyDataStateUI.updateClassNames(view)_

Updates the class names of the emptyDataState element.


| Param | Type | Description |
| --- | --- | --- |
| view | `View` | The view instance. |



### updateContent

::: ask-about-api updateContent|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L225

:::

_emptyDataStateUI.updateContent(message, isLoading) ⇒ void_

Updates the content of the emptyDataState element.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | `string` <br/> `object` |  | The message to update. |
| isLoading | `boolean` | <code>false</code> | When `true`, shows a loading spinner. |



### updateSize

::: ask-about-api updateSize|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/emptyDataState/ui.ts#L289

:::

_emptyDataStateUI.updateSize(view, [isLoading])_

Updates the size of the emptyDataState element.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| view | `View` |  | The view instance. |
| [isLoading] | `boolean` | <code>false</code> | `optional` When `true` and the grid has renderable columns, use the same   workspace sizing as when renderable rows exist (e.g. DataProvider fetch while a page is still shown). |



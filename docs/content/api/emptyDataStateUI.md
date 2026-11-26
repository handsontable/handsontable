---
title: EmptyDataStateUI
metaTitle: EmptyDataStateUI API reference | Handsontable DataGrid for JavaScript
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L358

:::

_emptyDataStateUI.destroy()_

Removes the emptyDataState UI elements from the DOM and clears the refs.



### getElement

::: ask-about-api getElement|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L230

:::

_emptyDataStateUI.getElement() ⇒ HTMLElement_

Gets the emptyDataState element.


**Returns**: `HTMLElement` - The empty data state element.  

### getFocusableElements

::: ask-about-api getFocusableElements|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L237

:::

_emptyDataStateUI.getFocusableElements() ⇒ Array&lt;HTMLElement&gt;_

Gets the focusable elements of the emptyDataState element.


**Returns**: `Array<HTMLElement>` - The focusable elements.  

### hide

::: ask-about-api hide|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L258

:::

_emptyDataStateUI.hide()_

Hides the emptyDataState element.



### install

::: ask-about-api install|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L209

:::

_emptyDataStateUI.install()_

Creates the emptyDataState UI elements and sets up the structure.



### show

::: ask-about-api show|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L250

:::

_emptyDataStateUI.show()_

Shows the emptyDataState element.



### updateClassNames

::: ask-about-api updateClassNames|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L312

:::

_emptyDataStateUI.updateClassNames(view)_

Updates the class names of the emptyDataState element.


| Param | Type | Description |
| --- | --- | --- |
| view | `View` | The view instance. |



### updateContent

::: ask-about-api updateContent|EmptyDataStateUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L272

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/ui.ts#L336

:::

_emptyDataStateUI.updateSize(view, [isLoading])_

Updates the size of the emptyDataState element.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| view | `View` |  | The view instance. |
| [isLoading] | `boolean` | <code>false</code> | `optional` When `true` and the grid has renderable columns, use the same   workspace sizing as when renderable rows exist (e.g. DataProvider fetch while a page is still shown). |



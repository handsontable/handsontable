---
title: PaginationUI
metaTitle: PaginationUI API reference – JavaScript Data Grid | Handsontable
permalink: /api/pagination-ui
canonicalUrl: /api/pagination-ui
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the pagination UI by creating DOM elements, applying layout settings, and registering event listeners.


## Methods

### destroy

::: ask-about-api destroy|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L393

:::

_paginationUI.destroy()_

Removes the pagination UI elements from the DOM and clears the refs.



### getContainer

::: ask-about-api getContainer|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L189

:::

_paginationUI.getContainer() ⇒ HTMLElement_

Gets the pagination element.


**Returns**: `HTMLElement` - The pagination element.  

### getFocusableElements

::: ask-about-api getFocusableElements|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L196

:::

_paginationUI.getFocusableElements() ⇒ Array&lt;HTMLElement&gt;_

Gets the focusable elements.


**Returns**: `Array<HTMLElement>` - The focusable elements.  

### getHeight

::: ask-about-api getHeight|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L226

:::

_paginationUI.getHeight() ⇒ number_

Gets the height of the pagination container element.



### install

::: ask-about-api install|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L147

:::

_paginationUI.install()_

Creates the pagination UI elements and sets up event listeners.



### setCounterSectionVisibility

::: ask-about-api setCounterSectionVisibility|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L371

:::

_paginationUI.setCounterSectionVisibility(isVisible) ⇒ [PaginationUI](@/api/paginationUI.md)_

Sets the visibility of the page counter section.


| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | True to show the page size section, false to hide it. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

### setNavigationSectionVisibility

::: ask-about-api setNavigationSectionVisibility|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L381

:::

_paginationUI.setNavigationSectionVisibility(isVisible) ⇒ [PaginationUI](@/api/paginationUI.md)_

Sets the visibility of the page navigation section.


| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | True to show the page size section, false to hide it. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

### setPageSizeSectionVisibility

::: ask-about-api setPageSizeSectionVisibility|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L359

:::

_paginationUI.setPageSizeSectionVisibility(isVisible) ⇒ [PaginationUI](@/api/paginationUI.md)_

Sets the visibility of the page size section.


| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | True to show the page size section, false to hide it. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

### updateState

::: ask-about-api updateState|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L244

:::

_paginationUI.updateState(state) ⇒ [PaginationUI](@/api/paginationUI.md)_

Updates the state of the pagination UI.


| Param | Type | Description |
| --- | --- | --- |
| state | `object` | The pagination state. |
| state.currentPage | `number` | The current page number. |
| state.totalPages | `number` | The total number of pages. |
| state.firstVisibleRowIndex | `number` | The index of the first visible row on the current page. |
| state.lastVisibleRowIndex | `number` | The index of the last visible row on the current page. |
| state.totalRenderedRows | `number` | The total number of renderable rows. |
| state.pageSizeList | `Array<(number\|&#x27;auto&#x27;)>` | The list of available page sizes. |
| state.pageSize | `number` | The current page size. |
| state.autoPageSize | `boolean` | Indicates if the page size is set to 'auto'. |
| [state.counterStartRow] | `number` | `optional` Optional 1-based start row for the counter (e.g. dataProvider mode). |
| [state.counterEndRow] | `number` | `optional` Optional 1-based end row for the counter (e.g. dataProvider mode). |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

### updateTheme

::: ask-about-api updateTheme|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/ui.ts#L211

:::

_paginationUI.updateTheme(themeName) ⇒ [PaginationUI](@/api/paginationUI.md)_

Updates the theme of the pagination container.


| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `false` <br/> `undefined` | The name of the theme to use. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

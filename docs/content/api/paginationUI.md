---
title: PaginationUI
metaTitle: PaginationUI API reference | Handsontable DataGrid for JavaScript
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L494

:::

_paginationUI.destroy()_

Removes the pagination UI elements from the DOM and clears the refs. Without a custom
`uiContainer` it also takes the `htPagination` marker off the root wrapper, which
`#updateContainerVisibility()` adds while a section is visible.



### getContainer

::: ask-about-api getContainer|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L279

:::

_paginationUI.getContainer() ⇒ HTMLElement_

Gets the pagination element.


**Returns**: `HTMLElement` - The pagination element.  

### getFocusableElements

::: ask-about-api getFocusableElements|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L295

:::

_paginationUI.getFocusableElements() ⇒ Array&lt;HTMLElement&gt;_

Gets the focusable elements.


**Returns**: `Array<HTMLElement>` - The focusable elements.  

### getHeight

::: ask-about-api getHeight|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L325

:::

_paginationUI.getHeight() ⇒ number_

Gets the height of the pagination container element.



### install

::: ask-about-api install|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L238

:::

_paginationUI.install()_

Creates the pagination UI elements and sets up event listeners.



### refreshIcons

::: ask-about-api refreshIcons|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L286

:::

_paginationUI.refreshIcons()_

Brings the icons in step with the theme after a theme change. An icon whose mapping did not
move is left alone (`syncIcon()` checks the theme's icons revision), so a color-scheme or
density switch rebuilds nothing.



### setCounterSectionVisibility

::: ask-about-api setCounterSectionVisibility|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L470

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L480

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L458

:::

_paginationUI.setPageSizeSectionVisibility(isVisible) ⇒ [PaginationUI](@/api/paginationUI.md)_

Sets the visibility of the page size section.


| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | True to show the page size section, false to hide it. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

### syncEmptyBodyReserve

::: ask-about-api syncEmptyBodyReserve|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L519

:::

_paginationUI.syncEmptyBodyReserve(holder, needed)_

Keeps an empty block in the table holder while the grid has no rows to draw, so a root whose
height is free does not collapse to its column headers and leave the pager touching them.
Removes the block as soon as it is not needed, and does not add it while every section of the
pager is hidden, because then there is no pager to separate from the headers. A later change
of the pager's visibility applies the same request again.


| Param | Type | Description |
| --- | --- | --- |
| holder | `HTMLElement` | The table holder. |
| needed | `boolean` | Whether the grid should reserve the body space now. |



### updateState

::: ask-about-api updateState|PaginationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L343

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/ui.ts#L313

:::

_paginationUI.updateTheme(themeName, [scopeClassName]) ⇒ [PaginationUI](@/api/paginationUI.md)_

Updates the theme of the pagination container. In a custom `uiContainer` the container gets the theme
engine's scope class beside the theme class, so it follows the grid's `colorScheme` and `density`
(`applyUiContainerTheme()`).


| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `false` <br/> `undefined` | The name of the theme to use. |
| [scopeClassName] | `string` | `optional` The theme engine's scope class for the grid. |


**Returns**: [`PaginationUI`](#paginationui) - The instance of the PaginationUI for method chaining.  

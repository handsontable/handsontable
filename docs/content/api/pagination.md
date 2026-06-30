---
title: Pagination
metaTitle: Pagination - JavaScript Data Grid | Handsontable
permalink: /api/pagination
canonicalUrl: /api/pagination
searchCategory: API Reference
hotPlugin: false
editLink: false
id: x4x6yo42
description: Use the Pagination plugin with its API options, members and methods to splitting rows into pages and rendering navigation controls.
react:
  id: gffcvsd3
  metaTitle: Pagination - React Data Grid | Handsontable
angular:
  id: mkvijvro
  metaTitle: Pagination - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L222

:::

_Pagination.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L212

:::

_Pagination.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L217

:::

_Pagination.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L599

:::

_pagination.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L341

:::

_pagination.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L250

:::

_pagination.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### firstPage

::: ask-about-api firstPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L515

:::

_pagination.firstPage()_

Switches the page to the first one.



### getCurrentPage

::: ask-about-api getCurrentPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L434

:::

_pagination.getCurrentPage() ⇒ number_

Returns the current 1-based page index from internal pagination state.


**Returns**: `number` - Current page (at least 1).  

### getCurrentPageData

::: ask-about-api getCurrentPageData|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L542

:::

_pagination.getCurrentPageData() ⇒ Array&lt;Array&gt;_

Gets the visual data for the current page. The returned data may be longer than the defined
page size as the data may contain hidden rows (rows that are not rendered in the table).


**Returns**: `Array<Array>` - Returns the data for the current page.  

### getCurrentPageSize

::: ask-about-api getCurrentPageSize|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L441

:::

_pagination.getCurrentPageSize() ⇒ number | 'auto'_

Returns the current page size from internal pagination state. May be `'auto'`.


**Returns**: `number` | `'auto'` - Current page size or `'auto'`.  

### getPaginationData

::: ask-about-api getPaginationData|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L372

:::

_pagination.getPaginationData() ⇒ Object_

Gets the pagination current state. Returns an object with the following properties:
 - `currentPage`: The current page number.
 - `totalPages`: The total number of pages.
 - `pageSize`: The page size.
 - `pageSizeList`: The list of page sizes.
 - `autoPageSize`: Whether the page size is calculated automatically.
 - `numberOfRenderedRows`: The number of rendered rows.
 - `firstVisibleRowIndex`: The index of the first visible row.
 - `lastVisibleRowIndex`: The index of the last visible row.



### hasNextPage

::: ask-about-api hasNextPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L534

:::

_pagination.hasNextPage() ⇒ boolean_

Checks, based on the current internal state, if there is a next page.



### hasPreviousPage

::: ask-about-api hasPreviousPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L527

:::

_pagination.hasPreviousPage() ⇒ boolean_

Checks, based on the current internal state, if there is a previous page.



### hidePageCounterSection

::: ask-about-api hidePageCounterSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L577

:::

_pagination.hidePageCounterSection()_

Hides the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### hidePageNavigationSection

::: ask-about-api hidePageNavigationSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L593

:::

_pagination.hidePageNavigationSection()_

Hides the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### hidePageSizeSection

::: ask-about-api hidePageSizeSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L561

:::

_pagination.hidePageSizeSection()_

Hides the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### isEnabled

::: ask-about-api isEnabled|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L245

:::

_pagination.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Pagination#enablePlugin](@/api/pagination.md#enableplugin) method is called.



### lastPage

::: ask-about-api lastPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L520

:::

_pagination.lastPage()_

Switches the page to the last one.



### nextPage

::: ask-about-api nextPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L505

:::

_pagination.nextPage()_

Switches the page to the next one.



### prevPage

::: ask-about-api prevPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L510

:::

_pagination.prevPage()_

Switches the page to the previous one.



### resetPage

::: ask-about-api resetPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L466

:::

_pagination.resetPage()_

Resets the current page to the initial page (`initialValue`) defined in the settings.



### resetPageSize

::: ask-about-api resetPageSize|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L493

:::

_pagination.resetPageSize()_

Resets the page size to the initial value (`pageSize`) defined in the settings.



### resetPagination

::: ask-about-api resetPagination|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L498

:::

_pagination.resetPagination()_

Resets the pagination state to the initial values defined in the settings.



### revertPageSizeTo

::: ask-about-api revertPageSizeTo|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L325

:::

_pagination.revertPageSizeTo(previousPageSize)_

Restores the page size after a failed external load.

**Category**: [Pagination](@/api/pagination.md)  

| Param | Type | Description |
| --- | --- | --- |
| previousPageSize | `number` <br/> `'auto'` | Previous page size. |



### revertPageTo

::: ask-about-api revertPageTo|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L311

:::

_pagination.revertPageTo(previousPage)_

Restores the page after a failed external load.

**Category**: [Pagination](@/api/pagination.md)  

| Param | Type | Description |
| --- | --- | --- |
| previousPage | `number` | Page to restore (1-based). |



### setPage

::: ask-about-api setPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L451

:::

_pagination.setPage(pageNumber)_

Allows changing the page for specified page number.

**Emits**: [`Hooks#event:beforePageChange`](@/api/hooks.md#beforepagechange), [`Hooks#event:afterPageChange`](@/api/hooks.md#afterpagechange)  

| Param | Type | Description |
| --- | --- | --- |
| pageNumber | `number` | The page number to set (from 1 to N). If `0` is passed, it will be transformed to `1`. |



### setPageSize

::: ask-about-api setPageSize|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L478

:::

_pagination.setPageSize(pageSize)_

Changes the page size for the pagination. The method recalculates the state based
on the new page size and re-renders the table. If `'auto'` is passed, the plugin will
calculate the page size based on the viewport size and row heights to make sure
that there will be no vertical scrollbar in the table.

**Emits**: [`Hooks#event:beforePageSizeChange`](@/api/hooks.md#beforepagesizechange), [`Hooks#event:afterPageSizeChange`](@/api/hooks.md#afterpagesizechange)  

| Param | Type | Description |
| --- | --- | --- |
| pageSize | `number` <br/> `'auto'` | The page size to set. |



### showPageCounterSection

::: ask-about-api showPageCounterSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L569

:::

_pagination.showPageCounterSection()_

Shows the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### showPageNavigationSection

::: ask-about-api showPageNavigationSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L585

:::

_pagination.showPageNavigationSection()_

Shows the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### showPageSizeSection

::: ask-about-api showPageSizeSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L553

:::

_pagination.showPageSizeSection()_

Shows the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### updatePlugin

::: ask-about-api updatePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/pagination/pagination.ts#L333

:::

_pagination.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



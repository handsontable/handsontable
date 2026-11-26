---
title: Pagination
metaTitle: Pagination | Handsontable DataGrid for JavaScript
permalink: /api/pagination
canonicalUrl: /api/pagination
searchCategory: API Reference
hotPlugin: false
editLink: false
id: x4x6yo42
description: Use the Pagination plugin with its API options, members and methods to splitting rows into pages and rendering navigation controls.
react:
  id: gffcvsd3
  metaTitle: Pagination | Handsontable DataGrid for React
angular:
  id: mkvijvro
  metaTitle: Pagination | Handsontable DataGrid for Angular
---

[[toc]]

See the [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md) guide for examples and configuration details.

## Options

### pagination
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api pagination|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6289

:::

_pagination.pagination : boolean_

The `pagination` option configures the `Pagination` plugin.

You can set the `pagination` option to one of the following:

| Setting                          | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `false`                          | Disable the `Pagination` plugin                                            |
| `true`                           | Enable the `Pagination` plugin                                             |

##### pagination: Additional options

If you set the `pagination` option to an object, you can set the following `Pagination` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                      |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageSize`               | A number or `auto` (default: `10`)                 | Sets the number of rows displayed per page. If `'auto'` is set, the page size will be calculated to match all rows to the currently set table's viewport height  |
| `pageSizeList`           | An array (default: `['auto', 5, 10, 20, 50, 100]`) | Defines the selectable values for page size in the UI                                                                                                            |
| `initialPage`            | A number (default: `1`)                            | Specifies which page to display on initial load. The plugin applies the value when it first enables and when you change it. Passing the same number again does not reset the current page. |
| `showPageSize`           | Boolean (default: `true`)                          | Controls visibility of the "page size" section                                                                                                                   |
| `showCounter`            | Boolean (default: `true`)                          | Controls visibility of the "page counter" section (e.g., "1 - 10 of 50");                                                                                        |
| `showNavigation`         | Boolean (default: `true`)                          | Controls visibility of the "page navigation" section                                                                                                             |
| `uiContainer`            | An HTML element (default: `null`)                  | The container element where the pagination UI will be installed. If not provided, the pagination container will be injected below the root table element.        |

Read more:
- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Pagination is available on the main grid only. In a grid nested in a cell, that is a cell of the
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md),
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), or
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type, this
option has no effect.

**Default**: <code>undefined</code>  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Pagination` plugin
pagination: true,
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L319

:::

_Pagination.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L314

:::

_Pagination.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L303

:::

_Pagination.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L308

:::

_Pagination.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L836

:::

_pagination.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L540

:::

_pagination.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L355

:::

_pagination.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### firstPage

::: ask-about-api firstPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L752

:::

_pagination.firstPage()_

Switches the page to the first one.



### getCurrentPage

::: ask-about-api getCurrentPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L638

:::

_pagination.getCurrentPage() ⇒ number_

Returns the current 1-based page index from internal pagination state.


**Returns**: `number` - Current page (at least 1).  

### getCurrentPageData

::: ask-about-api getCurrentPageData|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L779

:::

_pagination.getCurrentPageData() ⇒ Array&lt;Array&gt;_

Gets the visual data for the current page. The returned data may be longer than the defined
page size as the data may contain hidden rows (rows that are not rendered in the table).


**Returns**: `Array<Array>` - Returns the data for the current page.  

### getCurrentPageSize

::: ask-about-api getCurrentPageSize|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L645

:::

_pagination.getCurrentPageSize() ⇒ number | 'auto'_

Returns the current page size from internal pagination state. May be `'auto'`.


**Returns**: `number` | `'auto'` - Current page size or `'auto'`.  

### getPaginationData

::: ask-about-api getPaginationData|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L576

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L771

:::

_pagination.hasNextPage() ⇒ boolean_

Checks, based on the current internal state, if there is a next page.



### hasPreviousPage

::: ask-about-api hasPreviousPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L764

:::

_pagination.hasPreviousPage() ⇒ boolean_

Checks, based on the current internal state, if there is a previous page.



### hidePageCounterSection

::: ask-about-api hidePageCounterSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L814

:::

_pagination.hidePageCounterSection()_

Hides the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### hidePageNavigationSection

::: ask-about-api hidePageNavigationSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L830

:::

_pagination.hidePageNavigationSection()_

Hides the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### hidePageSizeSection

::: ask-about-api hidePageSizeSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L798

:::

_pagination.hidePageSizeSection()_

Hides the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### isEnabled

::: ask-about-api isEnabled|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L350

:::

_pagination.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Pagination#enablePlugin](@/api/pagination.md#enableplugin) method is called.

The pagination bar renders into the bottom slot and registers a focus scope, and the
`LayoutManager`, the `FocusScopeManager` and the root grid element all belong to the main
Handsontable instance. In a nested grid (the one the `handsontable`, `autocomplete`, and
`dropdown` cell types create) none of them exists, so the plugin stays disabled there. A custom
`uiContainer` does not change that:
it replaces the bottom-slot placement only, while the focus scope and the root grid element are
still required.



### lastPage

::: ask-about-api lastPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L757

:::

_pagination.lastPage()_

Switches the page to the last one.



### nextPage

::: ask-about-api nextPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L742

:::

_pagination.nextPage()_

Switches the page to the next one.



### prevPage

::: ask-about-api prevPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L747

:::

_pagination.prevPage()_

Switches the page to the previous one.



### resetPage

::: ask-about-api resetPage|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L663

:::

_pagination.resetPage()_

Resets the current page to the initial page (`initialValue`) defined in the settings.



### resetPageSize

::: ask-about-api resetPageSize|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L683

:::

_pagination.resetPageSize()_

Resets the page size to the initial value (`pageSize`) defined in the settings.



### resetPagination

::: ask-about-api resetPagination|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L688

:::

_pagination.resetPagination()_

Resets the pagination state to the initial values defined in the settings.



### revertPageSizeTo

::: ask-about-api revertPageSizeTo|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L475

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L461

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L655

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L675

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L806

:::

_pagination.showPageCounterSection()_

Shows the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### showPageNavigationSection

::: ask-about-api showPageNavigationSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L822

:::

_pagination.showPageNavigationSection()_

Shows the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### showPageSizeSection

::: ask-about-api showPageSizeSection|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L790

:::

_pagination.showPageSizeSection()_

Shows the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### updatePlugin

::: ask-about-api updatePlugin|Pagination

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/pagination/pagination.ts#L522

:::

_pagination.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



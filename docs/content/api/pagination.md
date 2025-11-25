---
title: Pagination
metaTitle: Pagination - JavaScript Data Grid | Handsontable
permalink: /api/pagination
canonicalUrl: /api/pagination
searchCategory: API Reference
hotPlugin: true
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

# Plugin: Pagination

[[toc]]

## Description

The plugin adds full-featured pagination capabilities to a table component.
It manages splitting rows into pages, rendering navigation controls, and exposing
methods and configuration for initializing and updating pagination state.

Core responsibilities:
 - Calculate which rows should be visible based on current `page` and `pageSize`.
 - Render a toolbar area containing:
   - a page size dropdown section (if `showPageSize` = `true`)
   - a row counter section ("1 - 10 of 50", if `showCounter` = `true`)
   - page navigation section (if `showNavigation` = `true`)
 - Emit hooks when:
   - the user navigates to a different page
   - the user changes the number of rows per page
   - the user changes the visibility of any sections
 - Allow external code to programmatically:
   - jump to a specific page
   - change the page size
   - change the visibility of UI sections

**Example**  
::: only-for javascript
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  pagination: {
    pageSize: 10,
    pageSizeList: ['auto', 5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
 },
});
```
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  pagination={{
    pageSize: 10,
    pageSizeList: ['auto', 5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  pagination: {
    pageSize: 10,
    pageSizeList: ['auto', 5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
  },
};
```
:::

## Options

### pagination
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/dataMap/metaManager/metaSchema.js#L3985

:::

_pagination.pagination : boolean_

The `pagination` option configures the [`Pagination`](@/api/pagination.md) plugin.

You can set the `pagination` option to one of the following:

| Setting                          | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `false`                          | Disable the [`Pagination`](@/api/pagination.md) plugin                                            |
| `true`                           | Enable the [`Pagination`](@/api/pagination.md) plugin                                             |

##### pagination: Additional options

If you set the `pagination` option to an object, you can set the following `Pagination` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                      |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageSize`               | A number or `auto` (default: `10`)                 | Sets the number of rows displayed per page. If `'auto'` is set, the page size will be calculated to match all rows to the currently set table's viewport height  |
| `pageSizeList`           | An array (default: `['auto', 5, 10, 20, 50, 100]`) | Defines the selectable values for page size in the UI                                                                                                            |
| `initialPage`            | A number (default: `1`)                            | Specifies which page to display on initial load                                                                                                                  |
| `showPageSize`           | Boolean (default: `true`)                          | Controls visibility of the "page size" section                                                                                                                   |
| `showCounter`            | Boolean (default: `true`)                          | Controls visibility of the "page counter" section (e.g., "1 - 10 of 50");                                                                                        |
| `showNavigation`         | Boolean (default: `true`)                          | Controls visibility of the "page navigation" section                                                                                                             |
| `uiContainer`            | An HTML element (default: `null`)                  | The container element where the pagination UI will be installed. If not provided, the pagination container will be injected below the root table element.        |

Read more:
- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)
- [Plugins: `Pagination`](@/api/pagination.md)

**Default**: <code>undefined</code>  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Pagination` plugin
pagination: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L902

:::

_pagination.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L259

:::

_pagination.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L173

:::

_pagination.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### firstPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L435

:::

_pagination.firstPage()_

Switches the page to the first one.



### getCurrentPageData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L470

:::

_pagination.getCurrentPageData() ⇒ Array&lt;Array&gt;_

Gets the visual data for the current page. The returned data may be longer than the defined
page size as the data may contain hidden rows (rows that are not rendered in the table).


**Returns**: `Array<Array>` - Returns the data for the current page.  

### getPaginationData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L294

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L460

:::

_pagination.hasNextPage() ⇒ boolean_

Checks, based on the current internal state, if there is a next page.



### hasPreviousPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L451

:::

_pagination.hasPreviousPage() ⇒ boolean_

Checks, based on the current internal state, if there is a previous page.



### hidePageCounterSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L518

:::

_pagination.hidePageCounterSection()_

Hides the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### hidePageNavigationSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L538

:::

_pagination.hidePageNavigationSection()_

Hides the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### hidePageSizeSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L498

:::

_pagination.hidePageSizeSection()_

Hides the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L166

:::

_pagination.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Pagination#enablePlugin](@/api/pagination.md#enableplugin) method is called.



### lastPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L442

:::

_pagination.lastPage()_

Switches the page to the last one.



### nextPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L421

:::

_pagination.nextPage()_

Switches the page to the next one.



### prevPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L428

:::

_pagination.prevPage()_

Switches the page to the previous one.



### resetPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L366

:::

_pagination.resetPage()_

Resets the current page to the initial page (`initialValue`) defined in the settings.



### resetPageSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L405

:::

_pagination.resetPageSize()_

Resets the page size to the initial value (`pageSize`) defined in the settings.



### resetPagination
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L412

:::

_pagination.resetPagination()_

Resets the pagination state to the initial values defined in the settings.



### setPage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L345

:::

_pagination.setPage(pageNumber)_

Allows changing the page for specified page number.

**Emits**: [`Hooks#event:beforePageChange`](@/api/hooks.md#beforepagechange), [`Hooks#event:afterPageChange`](@/api/hooks.md#afterpagechange)  

| Param | Type | Description |
| --- | --- | --- |
| pageNumber | `number` | The page number to set (from 1 to N). If `0` is passed, it will be transformed to `1`. |



### setPageSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L380

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L508

:::

_pagination.showPageCounterSection()_

Shows the page counter section in the pagination UI.

**Emits**: [`Hooks#event:afterPageCounterVisibilityChange`](@/api/hooks.md#afterpagecountervisibilitychange)  


### showPageNavigationSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L528

:::

_pagination.showPageNavigationSection()_

Shows the page navigation section in the pagination UI.

**Emits**: [`Hooks#event:afterPageNavigationVisibilityChange`](@/api/hooks.md#afterpagenavigationvisibilitychange)  


### showPageSizeSection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L488

:::

_pagination.showPageSizeSection()_

Shows the page size section in the pagination UI.

**Emits**: [`Hooks#event:afterPageSizeVisibilityChange`](@/api/hooks.md#afterpagesizevisibilitychange)  


### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/pagination/pagination.js#L247

:::

_pagination.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



---
title: Search
metaTitle: Search - JavaScript Data Grid | Handsontable
permalink: /api/search
canonicalUrl: /api/search
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4r6t4j1z
description: Use the Search plugin with its API options and methods such as query(), to configure and customize Handsontable's search.
react:
  id: acamkuxd
  metaTitle: Search - React Data Grid | Handsontable
angular:
  id: f8y1h9cd
  metaTitle: Search - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### search

::: ask-about-api search|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5413

:::

_search.search : boolean | object_

The `search` option enables and configures the `Search` plugin.

| Setting           | Description                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| `false` (default) | Disable the `Search` plugin                                 |
| `true`            | Enable the `Search` plugin with the default configuration   |
| An object         | Enable the `Search` plugin and apply a custom configuration |

When set to an object, the following properties are supported:

| Property            | Type       | Default                          | Description                                                                                                                                                        |
| ------------------- | ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `searchResultClass` | `string`   | `'htSearchResult'`               | CSS class name applied to every cell where `isSearchResult === true`.                                                                                              |
| `queryMethod`       | `Function` | Case-insensitive substring match | Tests whether the query string matches a cell value. Signature: `(queryStr: string, value: string\|number\|null, cellProperties: object) => boolean`.              |
| `callback`          | `Function` | Sets `isSearchResult` on cell metadata | Called for every cell after each test. Signature: `(instance: Handsontable, row: number, col: number, data: string\|number\|null, testResult: boolean) => void`. |

Default `queryMethod` behavior: case-insensitive, locale-aware substring match using `toLocaleLowerCase()` with `cellProperties.locale`.

Default `callback` behavior: sets `instance.getCellMeta(row, col).isSearchResult = testResult` on every cell.

**Per-cell overrides:** `queryMethod` and `callback` can also be set on individual cells, columns, or rows
using the cascading configuration model. A cell-level `search.queryMethod` or `search.callback` takes
precedence over the plugin-level setting for that cell. `searchResultClass` does not support per-cell overrides.

Read more:
- [Searching values](@/guides/navigation/searching-values/searching-values.md)
- [Custom query method](@/guides/navigation/searching-values/searching-values.md#custom-query-method)
- [Custom callback](@/guides/navigation/searching-values/searching-values.md#custom-callback)
- [Per-cell overrides](@/guides/navigation/searching-values/searching-values.md#per-cell-querymethod-and-callback)

**Default**: <code>false</code>  
**Example**  
```js
// Enable with the default configuration
search: true,

// Enable with a custom configuration
search: {
  // Apply a custom CSS class to matching cells instead of 'htSearchResult'
  searchResultClass: 'customClass',
  // Replace the built-in substring match with exact matching
  queryMethod(queryStr, value, cellProperties) {
    if (!queryStr || queryStr.length === 0) return false;
    if (value === undefined || value === null) return false;

    return queryStr.toString() === value.toString();
  },
  // Count results while preserving default highlighting
  callback(instance, row, col, data, testResult) {
    // Preserve the default isSearchResult flag so highlighting still works
    instance.getCellMeta(row, col).isSearchResult = testResult;

    if (testResult) {
      // Custom logic: e.g., increment a result counter
    }
  }
},

// Override queryMethod for a specific column only (per-cell via cascading config)
columns: [
  {},
  {
    search: {
      queryMethod(queryStr, value) {
        return queryStr.toString() === value.toString(); // exact match for column 1
      }
    }
  }
],
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L122

:::

_Search.PLUGIN\_KEY_

Returns the plugin key used to identify and access this plugin within Handsontable.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L127

:::

_Search.PLUGIN\_PRIORITY_

Returns the priority value that determines the plugin's initialization order relative to other plugins.


## Methods

### destroy

::: ask-about-api destroy|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L267

:::

_search.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L151

:::

_search.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L140

:::

_search.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCallback

::: ask-about-api getCallback|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L209

:::

_search.getCallback() ⇒ function_

Gets the callback function.


**Returns**: `function` - Return the callback function.  

### getQueryMethod

::: ask-about-api getQueryMethod|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L223

:::

_search.getQueryMethod() ⇒ function_

Gets the query method function.


**Returns**: `function` - Return the query method.  

### getSearchResultClass

::: ask-about-api getSearchResultClass|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L237

:::

_search.getSearchResultClass() ⇒ string_

Gets search result cells class name.


**Returns**: `string` - Return the cell class name.  

### isEnabled

::: ask-about-api isEnabled|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L135

:::

_search.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### query

::: ask-about-api query|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L176

:::

_search.query(queryStr, [callback], [queryMethod]) ⇒ Array&lt;object&gt;_

Makes the query.


| Param | Type | Description |
| --- | --- | --- |
| queryStr | `string` | Value to be search. |
| [callback] | `function` | `optional` Callback function performed on cells with values which matches to the searched query. |
| [queryMethod] | `function` | `optional` Query function responsible for determining whether a query matches the value stored in a cell. |


**Returns**: `Array<object>` - Return an array of objects with `row`, `col`, `data` properties or empty array.  

### setCallback

::: ask-about-api setCallback|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L216

:::

_search.setCallback(newCallback)_

Sets the callback function. This function will be called during querying for each cell.


| Param | Type | Description |
| --- | --- | --- |
| newCallback | `function` | A callback function. |



### setQueryMethod

::: ask-about-api setQueryMethod|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L230

:::

_search.setQueryMethod(newQueryMethod)_

Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.


| Param | Type | Description |
| --- | --- | --- |
| newQueryMethod | `function` | A function with specific match logic. |



### setSearchResultClass

::: ask-about-api setSearchResultClass|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L244

:::

_search.setSearchResultClass(newElementClass)_

Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.


| Param | Type | Description |
| --- | --- | --- |
| newElementClass | `string` | CSS class name. |



### updatePlugin

::: ask-about-api updatePlugin|Search

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/search/search.ts#L164

:::

_search.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`search`](@/api/options.md#search)



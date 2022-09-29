---
title: Search
metaTitle: Search - JavaScript Data Grid | Handsontable
permalink: /api/search
canonicalUrl: /api/search
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the Search plugin with its API options and methods such as query(), to configure and customize Handsontable's search.
react:
  metaTitle: Search - React Data Grid | Handsontable
---

# Search

[[toc]]

## Description

The search plugin provides an easy interface to search data across Handsontable.

In order to enable search mechanism, [Options#search](@/api/options.md#search) option must be set to `true`.

**Example**  
```js
// as boolean
search: true
// as a object with one or more options
search: {
  callback: myNewCallbackFunction,
  queryMethod: myNewQueryMethod,
  searchResultClass: 'customClass'
}

// Access to search plugin instance:
const searchPlugin = hot.getPlugin('search');

// Set callback programmatically:
searchPlugin.setCallback(myNewCallbackFunction);
// Set query method programmatically:
searchPlugin.setQueryMethod(myNewQueryMethod);
// Set search result cells class programmatically:
searchPlugin.setSearchResultClass(customClass);
```

## Options

### search
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/dataMap/metaManager/metaSchema.js#L3765

:::

_search.search : boolean | object_

The `search` option configures the [`Search`](@/api/search.md) plugin.

You can set the `search` option to one of the following:

| Setting           | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| `false` (default) | Disable the [`Search`](@/api/search.md) plugin                                       |
| `true`            | Enable the [`Search`](@/api/search.md) plugin with the default configuration         |
| An object         | - Enable the [`Search`](@/api/search.md) plugin<br>- Apply your custom configuration |

If you set the `search` option to an object, you can configure the following search options:

| Option              | Possible settings | Description                                                                                          |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `searchResultClass` | A string          | Add a custom CSS class name to search results                                                        |
| `queryMethod`       | A function        | Add a [custom query method](@/guides/accessories-and-menus/searching-values.md#custom-query-method)  |
| `callback`          | A function        | Add a [custom callback function](@/guides/accessories-and-menus/searching-values.md#custom-callback) |

Read more:
- [Searching values](@/guides/accessories-and-menus/searching-values.md)
- [Searching values: Custom query method](@/guides/accessories-and-menus/searching-values.md#custom-query-method)
- [Searching values: Custom callback](@/guides/accessories-and-menus/searching-values.md#custom-callback)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `Search` plugin with the default configuration
search: true,

// enable the `Search` plugin with a custom configuration
search: {
  // add a `customClass` CSS class name to search results
  searchResultClass: 'customClass',
  // add a custom query method
  queryMethod(queryStr, value) {
    ...
  },
  // add a custom callback function
  callback(instance, row, column, value, result) {
    ...
  }
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L302

:::

_search.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L123

:::

_search.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L106

:::

_search.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L193

:::

_search.getCallback() ⇒ function_

Gets the callback function.


**Returns**: `function` - Return the callback function.  

### getQueryMethod
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L211

:::

_search.getQueryMethod() ⇒ function_

Gets the query method function.


**Returns**: `function` - Return the query method.  

### getSearchResultClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L229

:::

_search.getSearchResultClass() ⇒ string_

Gets search result cells class name.


**Returns**: `string` - Return the cell class name.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L99

:::

_search.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### query
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L155

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L202

:::

_search.setCallback(newCallback)_

Sets the callback function. This function will be called during querying for each cell.


| Param | Type | Description |
| --- | --- | --- |
| newCallback | `function` | A callback function. |



### setQueryMethod
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L220

:::

_search.setQueryMethod(newQueryMethod)_

Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.


| Param | Type | Description |
| --- | --- | --- |
| newQueryMethod | `function` | A function with specific match logic. |



### setSearchResultClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L238

:::

_search.setSearchResultClass(newElementClass)_

Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.


| Param | Type | Description |
| --- | --- | --- |
| newElementClass | `string` | CSS class name. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/search/search.js#L140

:::

_search.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`search`](@/api/options.md#search)



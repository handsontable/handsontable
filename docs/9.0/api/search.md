---
title: Search
metaTitle: Search - Plugin - Handsontable Documentation
permalink: /9.0/api/search
canonicalUrl: /api/search
editLink: false
---

# Search

[[toc]]

## Description

The search plugin provides an easy interface to search data across Handsontable.

In order to enable search mechanism, [Options#search](@/api/metaSchema.md#search) option must be set to `true`.

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L1517

:::

_search.search : boolean_

Setting to `true` enables the [Search](@/api/search.md) plugin (see [demo](@/guides/accessories-and-menus/searching-values.md)).

**Default**: <code>false</code>  
**Example**  
```js
// enable search plugin
search: true,

// or
// as an object with detailed configuration
search: {
  searchResultClass: 'customClass',
  queryMethod: function(queryStr, value) {
    ...
  },
  callback: function(instance, row, column, value, result) {
    ...
  }
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L296

:::

_search.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L120

:::

_search.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L103

:::

_search.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L187

:::

_search.getCallback() ⇒ function_

Gets the callback function.


**Returns**: `function` - Return the callback function.  

### getQueryMethod
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L205

:::

_search.getQueryMethod() ⇒ function_

Gets the query method function.


**Returns**: `function` - Return the query method.  

### getSearchResultClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L223

:::

_search.getSearchResultClass() ⇒ string_

Gets search result cells class name.


**Returns**: `string` - Return the cell class name.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L96

:::

_search.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### query
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L149

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L196

:::

_search.setCallback(newCallback)_

Sets the callback function. This function will be called during querying for each cell.


| Param | Type | Description |
| --- | --- | --- |
| newCallback | `function` | A callback function. |



### setQueryMethod
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L214

:::

_search.setQueryMethod(newQueryMethod)_

Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.


| Param | Type | Description |
| --- | --- | --- |
| newQueryMethod | `function` | A function with specific match logic. |



### setSearchResultClass
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L232

:::

_search.setSearchResultClass(newElementClass)_

Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.


| Param | Type | Description |
| --- | --- | --- |
| newElementClass | `string` | CSS class name. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/search/search.js#L134

:::

_search.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



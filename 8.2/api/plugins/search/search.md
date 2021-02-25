---
title: Search
permalink: /8.2/api/search
---

# {{ $frontmatter.title }}

[[toc]]

## Description


The search plugin provides an easy interface to search data across Handsontable.

In order to enable search mechanism, [Options#search](Options#search) option must be set to `true`.


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

## Members
### isEnabled
`search.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [AutoRowSize#enablePlugin](auto-row-size#enableplugin) method is called.



### enablePlugin
`search.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`search.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### updatePlugin
`search.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### query
`search.query(queryStr, [callback], [queryMethod]) ⇒ Array.<object>`

Makes the query.


| Param | Type | Description |
| --- | --- | --- |
| queryStr | <code>string</code> | Value to be search. |
| [callback] | <code>function</code> | `optional` Callback function performed on cells with values which matches to the searched query. |
| [queryMethod] | <code>function</code> | `optional` Query function responsible for determining whether a query matches the value stored in a cell. |


**Returns**: <code>Array.&lt;object&gt;</code> - Return an array of objects with `row`, `col`, `data` properties or empty array.  

### getCallback
`search.getCallback() ⇒ function`

Gets the callback function.


**Returns**: <code>function</code> - Return the callback function.  

### setCallback
`search.setCallback(newCallback)`

Sets the callback function. This function will be called during querying for each cell.


| Param | Type | Description |
| --- | --- | --- |
| newCallback | <code>function</code> | A callback function. |



### getQueryMethod
`search.getQueryMethod() ⇒ function`

Gets the query method function.


**Returns**: <code>function</code> - Return the query method.  

### setQueryMethod
`search.setQueryMethod(newQueryMethod)`

Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.


| Param | Type | Description |
| --- | --- | --- |
| newQueryMethod | <code>function</code> | A function with specific match logic. |



### getSearchResultClass
`search.getSearchResultClass() ⇒ string`

Gets search result cells class name.


**Returns**: <code>string</code> - Return the cell class name.  

### setSearchResultClass
`search.setSearchResultClass(newElementClass)`

Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.


| Param | Type | Description |
| --- | --- | --- |
| newElementClass | <code>string</code> | CSS class name. |



### destroy
`search.destroy()`

Destroys the plugin instance.



